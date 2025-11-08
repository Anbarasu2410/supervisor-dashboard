// controllers/workerController.js
import FleetTask from "../models/FleetTask.js";
import FleetTaskPassenger from "../models/FleetTaskPassenger.js";
import Project from "../models/Project.js";
import FleetVehicle from "../models/FleetVehicle.js";
import Employee from "../models/Employee.js";

export const getWorkerTodayTrip = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const today = new Date();

    // Start & end of today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find all passenger records for this worker
    const passengerRecords = await FleetTaskPassenger.find({
      workerEmployeeId: workerId
    });

    if (!passengerRecords || passengerRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trips assigned for today."
      });
    }

    // Get all fleet task IDs
    const fleetTaskIds = passengerRecords.map(record => record.fleetTaskId);

    // Find all fleet tasks for today
    const tasks = await FleetTask.find({
      id: { $in: fleetTaskIds },
      taskDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trips found for today."
      });
    }

    // Fetch related data
    const enhancedTasks = await Promise.all(
      tasks.map(async (task) => {
        let projectName = "N/A";
        if (task.projectId) {
          try {
            const project = await Project.findOne({ id: task.projectId }).select("name");
            projectName = project?.name || "Project Not Found";
          } catch {
            projectName = "Error fetching project";
          }
        }

        let vehicleNo = "N/A";
        let vehicleType = "N/A";
        if (task.vehicleId) {
          try {
            const vehicle = await FleetVehicle.findOne({ id: task.vehicleId })
              .select("registrationNo vehicleType");
            vehicleNo = vehicle?.registrationNo || "N/A";
            vehicleType = vehicle?.vehicleType || "N/A";
          } catch {
            vehicleNo = "Error fetching vehicle";
          }
        }

        let driverName = "N/A";
        let driverContact = "N/A";
        let driverPhoto = null;
        if (task.driverId) {
          try {
            const driver = await Employee.findOne({ id: task.driverId })
              .select("fullName phone photoUrl");
            driverName = driver?.fullName || "N/A";
            driverContact = driver?.phone || "N/A";
            driverPhoto = driver?.photoUrl || null;
          } catch {
            driverName = "Error fetching driver";
          }
        }

        const passengerCount = await FleetTaskPassenger.countDocuments({
          fleetTaskId: task.id
        });

        return {
          taskId: task.id,
          projectName: projectName,
          vehicleNumber: vehicleNo,
          vehicleType: vehicleType,
          driverName: driverName,
          driverContact: driverContact,
          driverPhoto: driverPhoto,
          driverId: task.driverId,
          startTime: task.plannedPickupTime,
          dropTime: task.plannedDropTime,
          pickupLocation: task.pickupLocation,
          dropLocation: task.dropLocation,
          status: task.status,
          passengerCount: passengerCount,
          scheduledStart: task.scheduledStartTime,
          scheduledEnd: task.scheduledEndTime
        };
      })
    );

    res.json({
      success: true,
      data: enhancedTasks,
      message: `Found ${enhancedTasks.length} trip(s) for today`
    });
  } catch (err) {
    console.error("❌ Error fetching worker trip:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};