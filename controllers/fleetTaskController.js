const FleetTask = require('../models/FleetTask');
const Company = require('../models/Company');
const FleetVehicle = require('../models/FleetVehicle');
const User = require('../models/User');

// @desc    Create a new fleet task
// @route   POST /api/fleet-tasks
// @access  Public
const createFleetTask = async (req, res) => {
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
      createdAt 
    } = req.body;

    // Validate required fields
    if (!id || !companyId || !vehicleId || !taskDate) {
      return res.status(400).json({
        success: false,
        message: 'ID, companyId, vehicleId, and taskDate are required fields'
      });
    }

    // Validate ID is a number
    if (isNaN(id) || isNaN(companyId) || isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID, companyId, and vehicleId must be numbers'
      });
    }

    // Check if company exists
    const companyExists = await Company.findOne({ id: companyId });
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: `Company with ID ${companyId} does not exist`
      });
    }

    // Check if vehicle exists
    const vehicleExists = await FleetVehicle.findOne({ id: vehicleId });
    if (!vehicleExists) {
      return res.status(400).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} does not exist`
      });
    }

    // Check if driver exists (if provided)
    if (driverId) {
      // Assuming you have a Driver model, otherwise skip this check
      // const driverExists = await Driver.findOne({ id: driverId });
      // if (!driverExists) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Driver with ID ${driverId} does not exist`
      //   });
      // }
    }

    // Check if createdBy user exists (if provided)
    if (createdBy) {
      const userExists = await User.findOne({ id: createdBy });
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${createdBy} does not exist`
        });
      }
    }

    // Check if fleet task already exists by ID
    const existingTaskById = await FleetTask.findOne({ id: id });
    if (existingTaskById) {
      return res.status(400).json({
        success: false,
        message: `Fleet task with ID ${id} already exists`
      });
    }

    // MODIFIED: Use pickupLocation and dropLocation as simple strings
    // If pickupLocation is an object with lng/lat, convert to string, otherwise use as string
    let pickupLocationString = null;
    if (pickupLocation) {
      if (typeof pickupLocation === 'object' && pickupLocation.lng && pickupLocation.lat) {
        pickupLocationString = `Location (${pickupLocation.lat}, ${pickupLocation.lng})`;
      } else {
        pickupLocationString = String(pickupLocation).trim();
      }
    }

    let dropLocationString = null;
    if (dropLocation) {
      if (typeof dropLocation === 'object' && dropLocation.lng && dropLocation.lat) {
        dropLocationString = `Location (${dropLocation.lat}, ${dropLocation.lng})`;
      } else {
        dropLocationString = String(dropLocation).trim();
      }
    }

    // Create fleet task
    const fleetTask = new FleetTask({
      id: parseInt(id),
      companyId: parseInt(companyId),
      projectId: projectId ? parseInt(projectId) : null,
      driverId: driverId ? parseInt(driverId) : null,
      vehicleId: parseInt(vehicleId),
      taskDate: new Date(taskDate),
      plannedPickupTime: plannedPickupTime ? new Date(plannedPickupTime) : null,
      plannedDropTime: plannedDropTime ? new Date(plannedDropTime) : null,
      pickupLocation: pickupLocationString, // MODIFIED: Now using as string
      pickupAddress: pickupAddress ? pickupAddress.trim() : null,
      dropLocation: dropLocationString, // MODIFIED: Now using as string
      dropAddress: dropAddress ? dropAddress.trim() : null,
      expectedPassengers: expectedPassengers ? parseInt(expectedPassengers) : 0,
      actualStartTime: actualStartTime ? new Date(actualStartTime) : null,
      actualEndTime: actualEndTime ? new Date(actualEndTime) : null,
      routeLog: routeLog || [],
      status: status || 'PLANNED',
      notes: notes ? notes.trim() : null,
      createdBy: createdBy ? parseInt(createdBy) : null,
      createdAt: createdAt ? new Date(createdAt) : new Date()
    });

    const savedTask = await fleetTask.save();

    res.status(201).json({
      success: true,
      message: 'Fleet task created successfully',
      data: savedTask
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Fleet task with this ${field} already exists`
      });
    }

    // Handle invalid date format
    if (error.name === 'TypeError' && error.message.includes('Invalid time value')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2024-01-15T10:30:00.000Z)'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get all fleet tasks
// @route   GET /api/fleet-tasks
// @access  Public
const getFleetTasks = async (req, res) => {
  try {
    const fleetTasks = await FleetTask.find()
      .populate('companyId', 'name tenantCode')
      .populate('vehicleId', 'vehicleCode registrationNo vehicleType')
      .populate('createdBy', 'name email')
      .sort({ taskDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetTasks.length,
      data: fleetTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet tasks: ' + error.message
    });
  }
};

// @desc    Get fleet task by ID
// @route   GET /api/fleet-tasks/:id
// @access  Public
const getFleetTaskById = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet task ID. Must be a number.'
      });
    }

    const fleetTask = await FleetTask.findOne({ id: taskId })
      .populate('companyId', 'name tenantCode')
      .populate('vehicleId', 'vehicleCode registrationNo vehicleType')
      .populate('createdBy', 'name email');
    
    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`
      });
    }

    res.json({
      success: true,
      data: fleetTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet task: ' + error.message
    });
  }
};

// @desc    Get fleet tasks by company
// @route   GET /api/fleet-tasks/company/:companyId
// @access  Public
const getFleetTasksByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a number.'
      });
    }

    // Check if company exists
    const companyExists = await Company.findOne({ id: companyId });
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`
      });
    }

    const fleetTasks = await FleetTask.find({ companyId: companyId })
      .populate('vehicleId', 'vehicleCode registrationNo vehicleType')
      .populate('createdBy', 'name email')
      .sort({ taskDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetTasks.length,
      company: {
        id: companyExists.id,
        name: companyExists.name,
        tenantCode: companyExists.tenantCode
      },
      data: fleetTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet tasks: ' + error.message
    });
  }
};

// @desc    Get fleet tasks by status
// @route   GET /api/fleet-tasks/status/:status
// @access  Public
const getFleetTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const fleetTasks = await FleetTask.find({ status: status.toUpperCase() })
      .populate('companyId', 'name tenantCode')
      .populate('vehicleId', 'vehicleCode registrationNo vehicleType')
      .populate('createdBy', 'name email')
      .sort({ taskDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetTasks.length,
      data: fleetTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet tasks: ' + error.message
    });
  }
};

// @desc    Get fleet tasks by vehicle
// @route   GET /api/fleet-tasks/vehicle/:vehicleId
// @access  Public
const getFleetTasksByVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID. Must be a number.'
      });
    }

    // Check if vehicle exists
    const vehicleExists = await FleetVehicle.findOne({ id: vehicleId });
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    const fleetTasks = await FleetTask.find({ vehicleId: vehicleId })
      .populate('companyId', 'name tenantCode')
      .populate('createdBy', 'name email')
      .sort({ taskDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetTasks.length,
      vehicle: {
        id: vehicleExists.id,
        vehicleCode: vehicleExists.vehicleCode,
        registrationNo: vehicleExists.registrationNo,
        vehicleType: vehicleExists.vehicleType
      },
      data: fleetTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet tasks: ' + error.message
    });
  }
};

// @desc    Update fleet task
// @route   PUT /api/fleet-tasks/:id
// @access  Public
const updateFleetTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet task ID. Must be a number.'
      });
    }

    // Check if fleet task exists
    const existingTask = await FleetTask.findOne({ id: taskId });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`
      });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Validate and parse IDs
    if (updateData.companyId) {
      if (isNaN(updateData.companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Company ID must be a number'
        });
      }
      const companyExists = await Company.findOne({ id: updateData.companyId });
      if (!companyExists) {
        return res.status(400).json({
          success: false,
          message: `Company with ID ${updateData.companyId} does not exist`
        });
      }
      updateData.companyId = parseInt(updateData.companyId);
    }

    if (updateData.vehicleId) {
      if (isNaN(updateData.vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle ID must be a number'
        });
      }
      const vehicleExists = await FleetVehicle.findOne({ id: updateData.vehicleId });
      if (!vehicleExists) {
        return res.status(400).json({
          success: false,
          message: `Fleet vehicle with ID ${updateData.vehicleId} does not exist`
        });
      }
      updateData.vehicleId = parseInt(updateData.vehicleId);
    }

    if (updateData.createdBy) {
      const userExists = await User.findOne({ id: updateData.createdBy });
      if (!userExists) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${updateData.createdBy} does not exist`
        });
      }
      updateData.createdBy = parseInt(updateData.createdBy);
    }

    // MODIFIED: Parse location data as strings instead of geospatial objects
    if (updateData.pickupLocation) {
      if (typeof updateData.pickupLocation === 'object' && updateData.pickupLocation.lng && updateData.pickupLocation.lat) {
        updateData.pickupLocation = `Location (${updateData.pickupLocation.lat}, ${updateData.pickupLocation.lng})`;
      } else {
        updateData.pickupLocation = String(updateData.pickupLocation).trim();
      }
    }

    if (updateData.dropLocation) {
      if (typeof updateData.dropLocation === 'object' && updateData.dropLocation.lng && updateData.dropLocation.lat) {
        updateData.dropLocation = `Location (${updateData.dropLocation.lat}, ${updateData.dropLocation.lng})`;
      } else {
        updateData.dropLocation = String(updateData.dropLocation).trim();
      }
    }

    // Parse date fields
    const dateFields = ['taskDate', 'plannedPickupTime', 'plannedDropTime', 'actualStartTime', 'actualEndTime'];
    dateFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    // Parse numeric fields
    if (updateData.expectedPassengers) {
      updateData.expectedPassengers = parseInt(updateData.expectedPassengers);
    }

    // Validate status
    if (updateData.status) {
      const validStatuses = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(updateData.status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updateData.status = updateData.status.toUpperCase();
    }

    // Update the fleet task
    const fleetTask = await FleetTask.findOneAndUpdate(
      { id: taskId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    )
    .populate('companyId', 'name tenantCode')
    .populate('vehicleId', 'vehicleCode registrationNo vehicleType')
    .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Fleet task updated successfully',
      data: fleetTask
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error updating fleet task: ' + error.message
    });
  }
};

// @desc    Delete fleet task
// @route   DELETE /api/fleet-tasks/:id
// @access  Public
const deleteFleetTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet task ID. Must be a number.'
      });
    }

    const fleetTask = await FleetTask.findOneAndDelete({ id: taskId });

    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`
      });
    }

    res.json({
      success: true,
      message: 'Fleet task deleted successfully',
      deletedTask: {
        id: fleetTask.id,
        taskDate: fleetTask.taskDate,
        vehicleId: fleetTask.vehicleId,
        status: fleetTask.status,
        createdAt: fleetTask.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting fleet task: ' + error.message
    });
  }
};

module.exports = {
  createFleetTask,
  getFleetTasks,
  getFleetTaskById,
  getFleetTasksByCompany,
  getFleetTasksByStatus,
  getFleetTasksByVehicle,
  updateFleetTask,
  deleteFleetTask
};