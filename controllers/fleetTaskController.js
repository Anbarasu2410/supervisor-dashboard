import FleetTask from "../models/FleetTask.js";
import Company from "../models/Company.js";
import FleetVehicle from "../models/FleetVehicle.js";
import User from "../models/User.js";

// -------------------------------------------------------------
// @desc    Create a new fleet task
// @route   POST /api/fleet-tasks
// @access  Public
// -------------------------------------------------------------
export const createFleetTask = async (req, res) => {
  try {
    const {
      id,
      companyId,
      projectId,
      driverId,
      vehicleId,
      taskDate,
      plannedPickupTime,
      plannedDropTime,
      pickupLocation,
      pickupAddress,
      dropLocation,
      dropAddress,
      expectedPassengers,
      actualStartTime,
      actualEndTime,
      routeLog,
      status,
      notes,
      createdBy,
      createdAt,
    } = req.body;

    if (!id || !companyId || !vehicleId || !taskDate) {
      return res.status(400).json({
        success: false,
        message: "ID, companyId, vehicleId, and taskDate are required fields",
      });
    }

    if (isNaN(id) || isNaN(companyId) || isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "ID, companyId, and vehicleId must be numbers",
      });
    }

    const companyExists = await Company.findOne({ id: companyId });
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: `Company with ID ${companyId} does not exist`,
      });
    }

    const vehicleExists = await FleetVehicle.findOne({ id: vehicleId });
    if (!vehicleExists) {
      return res.status(400).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} does not exist`,
      });
    }

    if (createdBy) {
      const userExists = await User.findOne({ id: createdBy });
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${createdBy} does not exist`,
        });
      }
    }

    const existingTaskById = await FleetTask.findOne({ id: id });
    if (existingTaskById) {
      return res.status(400).json({
        success: false,
        message: `Fleet task with ID ${id} already exists`,
      });
    }

    const pickupLocationString =
      pickupLocation && typeof pickupLocation === "object"
        ? `Location (${pickupLocation.lat}, ${pickupLocation.lng})`
        : pickupLocation
        ? String(pickupLocation).trim()
        : null;

    const dropLocationString =
      dropLocation && typeof dropLocation === "object"
        ? `Location (${dropLocation.lat}, ${dropLocation.lng})`
        : dropLocation
        ? String(dropLocation).trim()
        : null;

    const fleetTask = new FleetTask({
      id: parseInt(id),
      companyId: parseInt(companyId),
      projectId: projectId ? parseInt(projectId) : null,
      driverId: driverId ? parseInt(driverId) : null,
      vehicleId: parseInt(vehicleId),
      taskDate: new Date(taskDate),
      plannedPickupTime: plannedPickupTime ? new Date(plannedPickupTime) : null,
      plannedDropTime: plannedDropTime ? new Date(plannedDropTime) : null,
      pickupLocation: pickupLocationString,
      pickupAddress: pickupAddress ? pickupAddress.trim() : null,
      dropLocation: dropLocationString,
      dropAddress: dropAddress ? dropAddress.trim() : null,
      expectedPassengers: expectedPassengers ? parseInt(expectedPassengers) : 0,
      actualStartTime: actualStartTime ? new Date(actualStartTime) : null,
      actualEndTime: actualEndTime ? new Date(actualEndTime) : null,
      routeLog: routeLog || [],
      status: status || "PLANNED",
      notes: notes ? notes.trim() : null,
      createdBy: createdBy ? parseInt(createdBy) : null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    const savedTask = await fleetTask.save();

    res.status(201).json({
      success: true,
      message: "Fleet task created successfully",
      data: savedTask,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Fleet task with this ${field} already exists`,
      });
    }

    if (error.name === "TypeError" && error.message.includes("Invalid time value")) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use ISO format (e.g., 2024-01-15T10:30:00.000Z)",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Get all fleet tasks
// -------------------------------------------------------------
export const getFleetTasks = async (req, res) => {
  try {
    const fleetTasks = await FleetTask.find()
      .populate("companyId", "name tenantCode")
      .populate("vehicleId", "vehicleCode registrationNo vehicleType")
      .populate("createdBy", "name email")
      .sort({ taskDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: fleetTasks.length,
      data: fleetTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fleet tasks: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Get fleet task by ID
// -------------------------------------------------------------
export const getFleetTaskById = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fleet task ID. Must be a number.",
      });
    }

    const fleetTask = await FleetTask.findOne({ id: taskId })
      .populate("companyId", "name tenantCode")
      .populate("vehicleId", "vehicleCode registrationNo vehicleType")
      .populate("createdBy", "name email");

    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`,
      });
    }

    res.json({
      success: true,
      data: fleetTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fleet task: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Get fleet tasks by company
// -------------------------------------------------------------
export const getFleetTasksByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID. Must be a number.",
      });
    }

    const companyExists = await Company.findOne({ id: companyId });
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`,
      });
    }

    const fleetTasks = await FleetTask.find({ companyId })
      .populate("vehicleId", "vehicleCode registrationNo vehicleType")
      .populate("createdBy", "name email")
      .sort({ taskDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: fleetTasks.length,
      company: {
        id: companyExists.id,
        name: companyExists.name,
        tenantCode: companyExists.tenantCode,
      },
      data: fleetTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fleet tasks: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Get fleet tasks by status
// -------------------------------------------------------------
export const getFleetTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const fleetTasks = await FleetTask.find({ status: status.toUpperCase() })
      .populate("companyId", "name tenantCode")
      .populate("vehicleId", "vehicleCode registrationNo vehicleType")
      .populate("createdBy", "name email")
      .sort({ taskDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: fleetTasks.length,
      data: fleetTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fleet tasks: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Get fleet tasks by vehicle
// -------------------------------------------------------------
export const getFleetTasksByVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID. Must be a number.",
      });
    }

    const vehicleExists = await FleetVehicle.findOne({ id: vehicleId });
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`,
      });
    }

    const fleetTasks = await FleetTask.find({ vehicleId })
      .populate("companyId", "name tenantCode")
      .populate("createdBy", "name email")
      .sort({ taskDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: fleetTasks.length,
      vehicle: {
        id: vehicleExists.id,
        vehicleCode: vehicleExists.vehicleCode,
        registrationNo: vehicleExists.registrationNo,
        vehicleType: vehicleExists.vehicleType,
      },
      data: fleetTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fleet tasks: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Update fleet task
// -------------------------------------------------------------
export const updateFleetTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fleet task ID. Must be a number.",
      });
    }

    const existingTask = await FleetTask.findOne({ id: taskId });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`,
      });
    }

    const updateData = { ...req.body };

    if (updateData.pickupLocation) {
      if (typeof updateData.pickupLocation === "object" && updateData.pickupLocation.lng && updateData.pickupLocation.lat) {
        updateData.pickupLocation = `Location (${updateData.pickupLocation.lat}, ${updateData.pickupLocation.lng})`;
      } else {
        updateData.pickupLocation = String(updateData.pickupLocation).trim();
      }
    }

    if (updateData.dropLocation) {
      if (typeof updateData.dropLocation === "object" && updateData.dropLocation.lng && updateData.dropLocation.lat) {
        updateData.dropLocation = `Location (${updateData.dropLocation.lat}, ${updateData.dropLocation.lng})`;
      } else {
        updateData.dropLocation = String(updateData.dropLocation).trim();
      }
    }

    const dateFields = ["taskDate", "plannedPickupTime", "plannedDropTime", "actualStartTime", "actualEndTime"];
    dateFields.forEach((field) => {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
    });

    if (updateData.expectedPassengers) {
      updateData.expectedPassengers = parseInt(updateData.expectedPassengers);
    }

    const validStatuses = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"];
    if (updateData.status && !validStatuses.includes(updateData.status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const fleetTask = await FleetTask.findOneAndUpdate(
      { id: taskId },
      updateData,
      { new: true, runValidators: true, context: "query" }
    )
      .populate("companyId", "name tenantCode")
      .populate("vehicleId", "vehicleCode registrationNo vehicleType")
      .populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Fleet task updated successfully",
      data: fleetTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating fleet task: " + error.message,
    });
  }
};

// -------------------------------------------------------------
// @desc    Delete fleet task
// -------------------------------------------------------------
export const deleteFleetTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fleet task ID. Must be a number.",
      });
    }

    const fleetTask = await FleetTask.findOneAndDelete({ id: taskId });
    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`,
      });
    }

    res.json({
      success: true,
      message: "Fleet task deleted successfully",
      deletedTask: {
        id: fleetTask.id,
        taskDate: fleetTask.taskDate,
        vehicleId: fleetTask.vehicleId,
        status: fleetTask.status,
        createdAt: fleetTask.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting fleet task: " + error.message,
    });
  }
};
