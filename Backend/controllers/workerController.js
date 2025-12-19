// controllers/workerController.js
import FleetTask from "../models/FleetTask.js";
import FleetTaskPassenger from "../models/FleetTaskPassenger.js";
import Project from "../models/Project.js";
import FleetVehicle from "../models/FleetVehicle.js";
import Employee from "../models/Employee.js";
import WorkerTaskAssignment from "../models/WorkerTaskAssignment.js";
import WorkerTaskProgress from "../models/WorkerTaskProgress.js";
import WorkerTaskPhoto from "../models/WorkerTaskPhoto.js";
import Task from "../models/Task.js"

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

export const getAvailableWorkers = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (YYYY-MM-DD)'
      });
    }

    // Get already assigned workers for the date
    const assignedAssignments = await WorkerTaskAssignment.find({ date });
    const assignedEmployeeIds = assignedAssignments.map(a => a.employeeId);

    // Find available active employees
    const availableWorkers = await Employee.find({
      status: 'active',
      id: { $nin: assignedEmployeeIds }
    })
    .select('id fullName trade phone status employeeCode companyId')
    .sort({ fullName: 1 });

    res.json({
      success: true,
      data: availableWorkers,
      count: availableWorkers.length,
      message: 'Available workers fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching available workers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available workers',
      error: error.message
    });
  }
};

export const getWorkerTodayTask = async (req, res) => {
  try {
    console.log("user",req.user)
    // 🔒 comes from auth middleware
    const workerId = req.user.userId;
    
    // 📅 today in YYYY-MM-DD (must match how you store date)
    const today = new Date().toISOString().split("T")[0];

    // 1️⃣ Find today's assignment for this worker
    const assignment = await WorkerTaskAssignment.findOne({
      employeeId: workerId,
     // date: today
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No task assigned for today"
      });
    }

    // 2️⃣ Fetch project (MATCHES your projects collection)
    const project = await Project.findOne({
      id: assignment.projectId
    }).select("projectName projectCode");

    // 2️⃣ Fetch project (MATCHES your projects collection)
    const task = await Task.findOne({
      id: assignment.taskId
    }).select("id taskName");

    // 3️⃣ Fetch supervisor (MATCHES your employees collection)
    const supervisor = await Employee.findOne({
      id: assignment.supervisorId
    }).select("fullName phone");

    // 4️⃣ Final response
    return res.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        projectId: assignment.projectId,
        projectName: project ? project.projectName : "N/A",
        projectCode: project ? project.projectCode : "N/A",
        taskName: task.taskName,
        supervisorName: supervisor ? supervisor.fullName : "N/A",
        supervisorPhone: supervisor ? supervisor.phone : "N/A",
        status: assignment.status == "in_progress" ? "In Progress" : assignment.status,
        progressPercent: assignment.progressPercent ?? 0
      }
    });
  } catch (err) {
    console.error("❌ getWorkerTodayTask error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* ---------------------------------------
   POST /worker/task-progress
--------------------------------------- */
export const submitWorkerTaskProgress = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { assignmentId, progressPercent, description, notes } = req.body;

    if (!assignmentId || progressPercent === undefined) {
      return res.status(400).json({
        success: false,
        message: "assignmentId and progressPercent are required"
      });
    }

    // 1️⃣ Validate assignment ownership
    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentId,
      employeeId: workerId
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2️⃣ Generate NEXT numeric ID (MANDATORY)
    const lastProgress = await WorkerTaskProgress
      .findOne()
      .sort({ id: -1 })
      .select("id");

    const nextId = lastProgress ? lastProgress.id + 1 : 1;

    // 3️⃣ Create progress entry (MATCHES SCHEMA)
    await WorkerTaskProgress.create({
      id: nextId,                               
      workerTaskAssignmentId: assignmentId,     
      employeeId: workerId,                     
      progressPercent,                          
      description: description || "",
      notes: notes || "",
      submittedAt: new Date(),
      status: "SUBMITTED"
    });

    // 4️⃣ Update assignment
    assignment.progressPercent = progressPercent;
    assignment.status =
      progressPercent >= 100 ? "COMPLETED" : "in_progress";

    await assignment.save();

    return res.json({
      success: true,
      message: "Progress submitted successfully"
    });

  } catch (err) {
    console.error("❌ Submit progress error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* ---------------------------------------
   POST /worker/task-photos
--------------------------------------- */
export const uploadWorkerTaskPhotos = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const { assignmentId } = req.body;

    if (!assignmentId || !req.files?.length) {
      return res.status(400).json({
        success: false,
        message: "assignmentId and photos are required"
      });
    }

    // 1️⃣ Validate assignment
    const assignment = await WorkerTaskAssignment.findOne({
      id: assignmentId,
      employeeId: workerId
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2️⃣ Get last photo ID
    const lastPhoto = await WorkerTaskPhoto
      .findOne()
      .sort({ id: -1 })
      .select("id");

    let nextId = lastPhoto ? lastPhoto.id + 1 : 1;

    // 3️⃣ Build photo docs WITH id
    const photos = req.files.map(file => {
      const photoDoc = {
        id: nextId++,                       // ✅ REQUIRED
        workerTaskAssignmentId: assignmentId,
        employeeId: workerId,
        photoUrl: `/uploads/${file.filename}`,
        uploadedAt: new Date()
      };
      return photoDoc;
    });

    // 4️⃣ Insert
    await WorkerTaskPhoto.insertMany(photos);

    return res.json({
      success: true,
      message: "Photos uploaded successfully",
      count: photos.length
    });

  } catch (err) {
    console.error("❌ Upload photos error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
