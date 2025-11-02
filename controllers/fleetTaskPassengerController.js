// controllers/fleetTaskPassengerController.js
const FleetTaskPassenger = require('../models/FleetTaskPassenger');
const Company = require('../models/Company');
const FleetTask = require('../models/FleetTask');
//const Employee = require('../models/Employee');

// Create new fleet task passenger
const createFleetTaskPassenger = async (req, res) => {
  try {
    const { 
      id, 
      companyId, 
      fleetTaskId, 
      workerEmployeeId, 
      employeeName,
      employeeCode,
      department,
      pickupLocation,
      dropLocation,
      pickupConfirmedAt, 
      dropConfirmedAt, 
      status, 
      notes, 
      createdBy,
      createdAt 
    } = req.body;

    console.log('🟡 Creating fleet task passenger with data:', req.body);

    // Validate required fields
    if (!id || !companyId || !fleetTaskId || !workerEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'ID, companyId, fleetTaskId, and workerEmployeeId are required fields'
      });
    }

    // Validate ID is a number
    if (isNaN(id) || isNaN(companyId) || isNaN(fleetTaskId) || isNaN(workerEmployeeId)) {
      return res.status(400).json({
        success: false,
        message: 'ID, companyId, fleetTaskId, and workerEmployeeId must be numbers'
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

    // Check if fleet task exists
    const fleetTaskExists = await FleetTask.findOne({ id: fleetTaskId });
    if (!fleetTaskExists) {
      return res.status(400).json({
        success: false,
        message: `Fleet task with ID ${fleetTaskId} does not exist`
      });
    }

    // Check if passenger already exists by ID
    const existingPassengerById = await FleetTaskPassenger.findOne({ id: id });
    if (existingPassengerById) {
      return res.status(400).json({
        success: false,
        message: `Fleet task passenger with ID ${id} already exists`
      });
    }

    // Create fleet task passenger
    const fleetTaskPassenger = new FleetTaskPassenger({
      id: parseInt(id),
      companyId: parseInt(companyId),
      fleetTaskId: parseInt(fleetTaskId),
      workerEmployeeId: parseInt(workerEmployeeId),
      employeeName: employeeName || 'Unknown Employee',
      employeeCode: employeeCode || '',
      department: department || '',
      pickupLocation: pickupLocation || '',
      dropLocation: dropLocation || '',
      pickupConfirmedAt: pickupConfirmedAt ? new Date(pickupConfirmedAt) : null,
      dropConfirmedAt: dropConfirmedAt ? new Date(dropConfirmedAt) : null,
      status: status || 'PLANNED',
      notes: notes ? notes.trim() : null,
      createdBy: createdBy || 1,
      createdAt: createdAt ? new Date(createdAt) : new Date()
    });

    const savedPassenger = await fleetTaskPassenger.save();

    console.log('✅ Fleet task passenger created successfully:', savedPassenger);

    res.status(201).json({
      success: true,
      message: 'Fleet task passenger created successfully',
      data: savedPassenger
    });
  } catch (error) {
    console.error('❌ Error creating fleet task passenger:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Fleet task passenger with this ID already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get all fleet task passengers
// @route   GET /api/fleet-task-passengers
// @access  Public
const getFleetTaskPassengers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      companyId,
      fleetTaskId,
      status
    } = req.query;

    // Build filter object
    const filter = {};
    if (companyId) filter.companyId = Number(companyId);
    if (fleetTaskId) filter.fleetTaskId = Number(fleetTaskId);
    if (status) filter.status = status;

    const passengers = await FleetTaskPassenger.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await FleetTaskPassenger.countDocuments(filter);

    console.log('✅ Fetched all fleet task passengers:', passengers.length);
    
    res.json({
      success: true,
      data: passengers,
      pagination: {
        current: Number(page),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching fleet task passengers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet task passengers: ' + error.message
    });
  }
};

// @desc    Get fleet task passenger by ID
// @route   GET /api/fleet-task-passengers/:id
// @access  Public
const getFleetTaskPassengerById = async (req, res) => {
  try {
    const passengerId = parseInt(req.params.id);
    
    if (isNaN(passengerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid passenger ID. Must be a number.'
      });
    }

    const passenger = await FleetTaskPassenger.findOne({ id: passengerId });
    
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${passengerId} not found`
      });
    }

    console.log('✅ Fetched fleet task passenger by ID:', passengerId);
    
    res.json({
      success: true,
      data: passenger
    });
  } catch (error) {
    console.error('❌ Error fetching fleet task passenger:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet task passenger: ' + error.message
    });
  }
};

// @desc    Get fleet task passengers by task ID
// @route   GET /api/fleet-task-passengers/task/:taskId
// @access  Public
const getFleetTaskPassengersByTaskId = async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID. Must be a number.'
      });
    }

    // Check if fleet task exists
    const fleetTaskExists = await FleetTask.findOne({ id: taskId });
    if (!fleetTaskExists) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`
      });
    }

    const passengers = await FleetTaskPassenger.find({ fleetTaskId: taskId })
      .sort({ createdAt: -1 });
    
    console.log('✅ Fetched passengers for task ID:', taskId, 'Count:', passengers.length);
    
    res.json({
      success: true,
      count: passengers.length,
      task: {
        id: fleetTaskExists.id,
        taskDate: fleetTaskExists.taskDate,
        vehicleId: fleetTaskExists.vehicleId
      },
      data: passengers
    });
  } catch (error) {
    console.error('❌ Error fetching passengers by task ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching passengers: ' + error.message
    });
  }
};

// @desc    Get fleet task passengers by company
// @route   GET /api/fleet-task-passengers/company/:companyId
// @access  Public
const getFleetTaskPassengersByCompany = async (req, res) => {
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

    const passengers = await FleetTaskPassenger.find({ companyId: companyId })
      .sort({ createdAt: -1 });
    
    console.log('✅ Fetched passengers for company ID:', companyId, 'Count:', passengers.length);
    
    res.json({
      success: true,
      count: passengers.length,
      company: {
        id: companyExists.id,
        name: companyExists.name,
        tenantCode: companyExists.tenantCode
      },
      data: passengers
    });
  } catch (error) {
    console.error('❌ Error fetching passengers by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching passengers: ' + error.message
    });
  }
};

// @desc    Update fleet task passenger
// @route   PUT /api/fleet-task-passengers/:id
// @access  Public
const updateFleetTaskPassenger = async (req, res) => {
  try {
    const passengerId = parseInt(req.params.id);
    
    if (isNaN(passengerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid passenger ID. Must be a number.'
      });
    }

    // Check if passenger exists
    const existingPassenger = await FleetTaskPassenger.findOne({ id: passengerId });
    if (!existingPassenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${passengerId} not found`
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

    if (updateData.fleetTaskId) {
      if (isNaN(updateData.fleetTaskId)) {
        return res.status(400).json({
          success: false,
          message: 'Fleet task ID must be a number'
        });
      }
      const fleetTaskExists = await FleetTask.findOne({ id: updateData.fleetTaskId });
      if (!fleetTaskExists) {
        return res.status(400).json({
          success: false,
          message: `Fleet task with ID ${updateData.fleetTaskId} does not exist`
        });
      }
      updateData.fleetTaskId = parseInt(updateData.fleetTaskId);
    }

    if (updateData.workerEmployeeId) {
      if (isNaN(updateData.workerEmployeeId)) {
        return res.status(400).json({
          success: false,
          message: 'Worker employee ID must be a number'
        });
      }
      updateData.workerEmployeeId = parseInt(updateData.workerEmployeeId);
    }

    // Parse date fields
    if (updateData.pickupConfirmedAt) {
      updateData.pickupConfirmedAt = new Date(updateData.pickupConfirmedAt);
    }
    if (updateData.dropConfirmedAt) {
      updateData.dropConfirmedAt = new Date(updateData.dropConfirmedAt);
    }

    // Update the passenger
    const passenger = await FleetTaskPassenger.findOneAndUpdate(
      { id: passengerId },
      updateData,
      { 
        new: true, 
        runValidators: true
      }
    );

    console.log('✅ Updated fleet task passenger:', passengerId);

    res.json({
      success: true,
      message: 'Fleet task passenger updated successfully',
      data: passenger
    });
  } catch (error) {
    console.error('❌ Error updating fleet task passenger:', error);
    
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
      message: 'Error updating fleet task passenger: ' + error.message
    });
  }
};

// @desc    Delete fleet task passenger
// @route   DELETE /api/fleet-task-passengers/:id
// @access  Public
const deleteFleetTaskPassenger = async (req, res) => {
  try {
    const passengerId = parseInt(req.params.id);
    
    if (isNaN(passengerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid passenger ID. Must be a number.'
      });
    }

    const passenger = await FleetTaskPassenger.findOneAndDelete({ id: passengerId });

    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${passengerId} not found`
      });
    }

    console.log('✅ Deleted fleet task passenger:', passengerId);

    res.json({
      success: true,
      message: 'Fleet task passenger deleted successfully',
      deletedPassenger: {
        id: passenger.id,
        fleetTaskId: passenger.fleetTaskId,
        workerEmployeeId: passenger.workerEmployeeId,
        createdAt: passenger.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error deleting fleet task passenger:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting fleet task passenger: ' + error.message
    });
  }
};

module.exports = {
  createFleetTaskPassenger,
  getFleetTaskPassengers,
  getFleetTaskPassengerById,
  getFleetTaskPassengersByTaskId,
  getFleetTaskPassengersByCompany,
  updateFleetTaskPassenger,
  deleteFleetTaskPassenger
};