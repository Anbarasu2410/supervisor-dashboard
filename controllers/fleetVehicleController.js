const FleetVehicle = require('../models/FleetVehicle');
const Company = require('../models/Company');

// @desc    Create a new fleet vehicle
// @route   POST /api/fleet-vehicles
// @access  Public
const createFleetVehicle = async (req, res) => {
  try {
    const { 
      id, 
      companyId, 
      vehicleCode, 
      registrationNo, 
      vehicleType, 
      capacity, 
      status, 
      insuranceExpiry, 
      lastServiceDate, 
      odometer, 
      meta, 
      createdAt 
    } = req.body;

    // Validate required fields
    if (!id || !companyId || !vehicleCode) {
      return res.status(400).json({
        success: false,
        message: 'ID, companyId, and vehicleCode are required fields'
      });
    }

    // Validate ID is a number
    if (isNaN(id) || isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID and companyId must be numbers'
      });
    }

    // Validate vehicleCode is not empty
    if (vehicleCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle code cannot be empty'
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

    // Check if fleet vehicle already exists by ID
    const existingVehicleById = await FleetVehicle.findOne({ id: id });
    if (existingVehicleById) {
      return res.status(400).json({
        success: false,
        message: `Fleet vehicle with ID ${id} already exists`
      });
    }

    // Check if vehicle code is unique
    const existingVehicleByCode = await FleetVehicle.findOne({ 
      vehicleCode: vehicleCode.trim()
    });
    if (existingVehicleByCode) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with code '${vehicleCode}' already exists`
      });
    }

    // Check if registration number is unique (if provided)
    if (registrationNo) {
      const existingVehicleByReg = await FleetVehicle.findOne({ 
        registrationNo: registrationNo.trim()
      });
      if (existingVehicleByReg) {
        return res.status(400).json({
          success: false,
          message: `Vehicle with registration number '${registrationNo}' already exists`
        });
      }
    }

    // Create fleet vehicle
    const fleetVehicle = new FleetVehicle({
      id: parseInt(id),
      companyId: parseInt(companyId),
      vehicleCode: vehicleCode.trim(),
      registrationNo: registrationNo ? registrationNo.trim() : null,
      vehicleType: vehicleType ? vehicleType.trim() : null,
      capacity: capacity ? parseInt(capacity) : null,
      status: status || 'AVAILABLE',
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
      odometer: odometer ? parseFloat(odometer) : null,
      meta: meta || {},
      createdAt: createdAt ? new Date(createdAt) : new Date()
    });

    const savedVehicle = await fleetVehicle.save();

    res.status(201).json({
      success: true,
      message: 'Fleet vehicle created successfully',
      data: savedVehicle
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
        message: `Fleet vehicle with this ${field} already exists`
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

// @desc    Get all fleet vehicles
// @route   GET /api/fleet-vehicles
// @access  Public
const getFleetVehicles = async (req, res) => {
  try {
    const fleetVehicles = await FleetVehicle.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetVehicles.length,
      data: fleetVehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet vehicles: ' + error.message
    });
  }
};

// @desc    Get fleet vehicle by ID
// @route   GET /api/fleet-vehicles/:id
// @access  Public
const getFleetVehicleById = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a number.'
      });
    }

    const fleetVehicle = await FleetVehicle.findOne({ id: vehicleId });
    
    if (!fleetVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    res.json({
      success: true,
      data: fleetVehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet vehicle: ' + error.message
    });
  }
};

// @desc    Get fleet vehicles by company
// @route   GET /api/fleet-vehicles/company/:companyId
// @access  Public
const getFleetVehiclesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    console.log('🔍 getFleetVehiclesByCompany called with companyId:', companyId, 'Type:', typeof companyId);
    
    let queryCompanyId;
    
    // Check if companyId is a MongoDB _id (24 character hex string)
    if (typeof companyId === 'string' && /^[0-9a-fA-F]{24}$/.test(companyId)) {
      console.log('📝 Detected MongoDB _id, finding numeric ID from company');
      // Find the company by _id to get its numeric ID
      const company = await Company.findOne({ _id: companyId });
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Company with _id ${companyId} not found`
        });
      }
      queryCompanyId = company.id;
      console.log('✅ Found company:', company.name, 'Numeric ID:', queryCompanyId);
    } else {
      // Try to parse as numeric ID
      queryCompanyId = parseInt(companyId);
      if (isNaN(queryCompanyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID. Must be a number or valid MongoDB _id.'
        });
      }
    }

    console.log('🔍 Querying vehicles with companyId:', queryCompanyId);

    // Check if company exists (by numeric ID)
    const companyExists = await Company.findOne({ id: queryCompanyId });
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${queryCompanyId} not found`
      });
    }

    const fleetVehicles = await FleetVehicle.find({ companyId: queryCompanyId })
      .sort({ createdAt: -1 });
    
    console.log('✅ Found', fleetVehicles.length, 'vehicles for company', queryCompanyId);
    
    res.json({
      success: true,
      count: fleetVehicles.length,
      company: {
        id: companyExists.id,
        name: companyExists.name,
        tenantCode: companyExists.tenantCode
      },
      data: fleetVehicles
    });
  } catch (error) {
    console.error('❌ Error in getFleetVehiclesByCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet vehicles: ' + error.message
    });
  }
};

// @desc    Get fleet vehicles by status
// @route   GET /api/fleet-vehicles/status/:status
// @access  Public
const getFleetVehiclesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'];
    
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const fleetVehicles = await FleetVehicle.find({ status: status.toUpperCase() })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: fleetVehicles.length,
      data: fleetVehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fleet vehicles: ' + error.message
    });
  }
};

// @desc    Update fleet vehicle
// @route   PUT /api/fleet-vehicles/:id
// @access  Public
const updateFleetVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a number.'
      });
    }

    // Check if fleet vehicle exists
    const existingVehicle = await FleetVehicle.findOne({ id: vehicleId });
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // If updating companyId, check if company exists
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

    // If updating vehicleCode, check if it's unique
    if (updateData.vehicleCode) {
      const vehicleCodeExists = await FleetVehicle.findOne({
        vehicleCode: updateData.vehicleCode.trim(),
        id: { $ne: vehicleId } // Exclude current vehicle
      });
      
      if (vehicleCodeExists) {
        return res.status(400).json({
          success: false,
          message: `Vehicle code '${updateData.vehicleCode}' is already taken by another vehicle`
        });
      }
      updateData.vehicleCode = updateData.vehicleCode.trim();
    }

    // If updating registrationNo, check if it's unique
    if (updateData.registrationNo) {
      const registrationNoExists = await FleetVehicle.findOne({
        registrationNo: updateData.registrationNo.trim(),
        id: { $ne: vehicleId } // Exclude current vehicle
      });
      
      if (registrationNoExists) {
        return res.status(400).json({
          success: false,
          message: `Registration number '${updateData.registrationNo}' is already taken by another vehicle`
        });
      }
      updateData.registrationNo = updateData.registrationNo.trim();
    }

    // If updating status, validate it
    if (updateData.status) {
      const validStatuses = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'];
      if (!validStatuses.includes(updateData.status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updateData.status = updateData.status.toUpperCase();
    }

    // Parse numeric fields
    if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity);
    if (updateData.odometer) updateData.odometer = parseFloat(updateData.odometer);

    // Parse date fields
    if (updateData.insuranceExpiry) updateData.insuranceExpiry = new Date(updateData.insuranceExpiry);
    if (updateData.lastServiceDate) updateData.lastServiceDate = new Date(updateData.lastServiceDate);

    // Update the fleet vehicle
    const fleetVehicle = await FleetVehicle.findOneAndUpdate(
      { id: vehicleId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    res.json({
      success: true,
      message: 'Fleet vehicle updated successfully',
      data: fleetVehicle
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
        message: `Fleet vehicle with this ${field} already exists`
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error updating fleet vehicle: ' + error.message
    });
  }
};

// @desc    Delete fleet vehicle
// @route   DELETE /api/fleet-vehicles/:id
// @access  Public
const deleteFleetVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a number.'
      });
    }

    const fleetVehicle = await FleetVehicle.findOneAndDelete({ id: vehicleId });

    if (!fleetVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    res.json({
      success: true,
      message: 'Fleet vehicle deleted successfully',
      deletedVehicle: {
        id: fleetVehicle.id,
        vehicleCode: fleetVehicle.vehicleCode,
        registrationNo: fleetVehicle.registrationNo,
        companyId: fleetVehicle.companyId,
        status: fleetVehicle.status,
        createdAt: fleetVehicle.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting fleet vehicle: ' + error.message
    });
  }
};

module.exports = {
  createFleetVehicle,
  getFleetVehicles,
  getFleetVehicleById,
  getFleetVehiclesByCompany,
  getFleetVehiclesByStatus,
  updateFleetVehicle,
  deleteFleetVehicle
};