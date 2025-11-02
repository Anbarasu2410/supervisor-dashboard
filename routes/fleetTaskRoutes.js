const express = require('express');
const router = express.Router();
const FleetTask = require('../models/FleetTask');
const Company = require('../models/Company');
const FleetVehicle=require('../models/FleetVehicle');
//const Employee = require('../models/Employee');
const Project = require('../models/Project'); 



// GET /api/fleet-tasks - Get all fleet tasks with pagination
// GET /api/fleet-tasks - Get all fleet tasks with pagination
// GET /api/fleet-tasks
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.companyId) {
      query.companyId = parseInt(req.query.companyId);
    }

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [company, driver, employee, project, vehicle] = await Promise.all([
          Company.findOne({ id: task.companyId }),
          Employee.findOne({ id: task.driverId }),    // driverId → Employee
          Employee.findOne({ id: task.employeeId }),  // optional creator employee
          Project.findOne({ id: task.projectId }),
          FleetVehicle.findOne({ id: task.vehicleId }),
        ]);

        return {
          ...task.toObject(),
          companyName: company ? company.name : 'Unknown Company',
          tenantCode: company ? company.tenantCode : 'N/A',
          driverName: driver ? driver.fullName : 'Unknown Driver',
          employeeFullName: employee ? employee.fullName : 'Unknown Employee',
          projectName: project ? project.name : 'Unknown Project',
          vehicleCode: vehicle
            ? `${vehicle.vehicleCode || vehicle.registrationNo || 'Unknown'}`
            : 'Unknown Vehicle',
        };
      })
    );

    const total = await FleetTask.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fleet tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching fleet tasks: ${error.message}`,
    });
  }
});




// GET /api/fleet-tasks/:id - Get single fleet task
router.get('/:id', async (req, res) => {
  try {
    let fleetTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      // Search by numeric id
      fleetTask = await FleetTask.findOne({ id: parseInt(req.params.id) });
    } else {
      // Search by MongoDB _id
      fleetTask = await FleetTask.findById(req.params.id);
    }

    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    // Get company name
    const company = await Company.findOne({ id: fleetTask.companyId });
    const taskWithCompany = {
      ...fleetTask.toObject(),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A'
    };

    res.json({
      success: true,
      data: taskWithCompany
    });
  } catch (error) {
    console.error('Error fetching fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching fleet task: ${error.message}`
    });
  }
});

// POST /api/fleet-tasks - Create new fleet task
router.post('/', async (req, res) => {
  try {
    const { 
      companyId,
      vehicleId,
      taskDate,
      plannedPickupTime,
      plannedDropTime,
      pickupLocation,
      pickupAddress,
      dropLocation,
      dropAddress,
      expectedPassengers,
      status,
      notes,
      driverId,
      projectId
    } = req.body;

    // Validate required fields
    if (!companyId || !vehicleId || !taskDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, Vehicle ID, and Task Date are required'
      });
    }

    // Check if company exists
    const company = await Company.findOne({ id: parseInt(companyId) });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Generate numeric ID
    const lastTask = await FleetTask.findOne().sort({ id: -1 });
    const newId = lastTask ? lastTask.id + 1 : 1;

    const fleetTask = new FleetTask({
      id: newId,
      companyId: parseInt(companyId),
      vehicleId: parseInt(vehicleId),
      driverId: driverId ? parseInt(driverId) : null,
      projectId: projectId ? parseInt(projectId) : null,
      taskDate: new Date(taskDate),
      plannedPickupTime: plannedPickupTime ? new Date(plannedPickupTime) : null,
      plannedDropTime: plannedDropTime ? new Date(plannedDropTime) : null,
      pickupLocation: pickupLocation?.trim() || '',
      pickupAddress: pickupAddress?.trim() || '',
      dropLocation: dropLocation?.trim() || '',
      dropAddress: dropAddress?.trim() || '',
      expectedPassengers: expectedPassengers || 0,
      status: status || 'PLANNED',
      notes: notes?.trim() || '',
      createdBy: req.body.createdBy || null
    });

    const savedTask = await fleetTask.save();

    // Add company name to response
    const taskWithCompany = {
      ...savedTask.toObject(),
      companyName: company.name,
      tenantCode: company.tenantCode
    };

    res.status(201).json({
      success: true,
      message: 'Fleet task created successfully',
      data: taskWithCompany
    });
  } catch (error) {
    console.error('Error creating fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error creating fleet task: ${error.message}`
    });
  }
});

// PUT /api/fleet-tasks/:id - Update fleet task
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert numeric fields
    if (updateData.companyId) updateData.companyId = parseInt(updateData.companyId);
    if (updateData.vehicleId) updateData.vehicleId = parseInt(updateData.vehicleId);
    if (updateData.driverId) updateData.driverId = parseInt(updateData.driverId);
    if (updateData.projectId) updateData.projectId = parseInt(updateData.projectId);
    
    // Convert date fields
    if (updateData.taskDate) updateData.taskDate = new Date(updateData.taskDate);
    if (updateData.plannedPickupTime) updateData.plannedPickupTime = new Date(updateData.plannedPickupTime);
    if (updateData.plannedDropTime) updateData.plannedDropTime = new Date(updateData.plannedDropTime);
    if (updateData.actualStartTime) updateData.actualStartTime = new Date(updateData.actualStartTime);
    if (updateData.actualEndTime) updateData.actualEndTime = new Date(updateData.actualEndTime);

    updateData.updatedAt = Date.now();

    let updatedTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      updatedTask = await FleetTask.findOneAndUpdate(
        { id: parseInt(req.params.id) },
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      updatedTask = await FleetTask.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    // Get company name
    const company = await Company.findOne({ id: updatedTask.companyId });
    const taskWithCompany = {
      ...updatedTask.toObject(),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A'
    };

    res.json({
      success: true,
      message: 'Fleet task updated successfully',
      data: taskWithCompany
    });
  } catch (error) {
    console.error('Error updating fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error updating fleet task: ${error.message}`
    });
  }
});

// DELETE /api/fleet-tasks/:id - Delete fleet task
router.delete('/:id', async (req, res) => {
  try {
    let deletedTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      deletedTask = await FleetTask.findOneAndDelete({ id: parseInt(req.params.id) });
    } else {
      deletedTask = await FleetTask.findByIdAndDelete(req.params.id);
    }

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    res.json({
      success: true,
      message: 'Fleet task deleted successfully',
      data: deletedTask
    });
  } catch (error) {
    console.error('Error deleting fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error deleting fleet task: ${error.message}`
    });
  }
});

module.exports = router;