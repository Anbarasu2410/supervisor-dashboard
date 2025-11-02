import express from 'express';
import FleetTask from '../models/FleetTask.js';
import Company from '../models/Company.js';
import FleetVehicle from '../models/FleetVehicle.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';

const router = express.Router();

// ✅ Utility: Safely parse integer fields
const toInt = (value) => (value ? parseInt(value) : null);

// ✅ GET /api/fleet-tasks - Get all fleet tasks with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.companyId) query.companyId = toInt(req.query.companyId);

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [company, driver, employee, project, vehicle] = await Promise.all([
          Company.findOne({ id: task.companyId }),
          Employee.findOne({ id: task.driverId }),
          Employee.findOne({ id: task.createdBy }),
          Project.findOne({ id: task.projectId }),
          FleetVehicle.findOne({ id: task.vehicleId }),
        ]);

        return {
          ...task.toObject(),
          companyName: company?.name || 'Unknown Company',
          tenantCode: company?.tenantCode || 'N/A',
          driverName: driver?.fullName || 'Unknown Driver',
          employeeFullName: employee?.fullName || 'Unknown Employee',
          projectName: project?.name || 'Unknown Project',
          vehicleCode:
            vehicle?.vehicleCode || vehicle?.registrationNo || 'Unknown Vehicle',
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET /api/fleet-tasks/:id - Get single fleet task
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const fleetTask = /^\d+$/.test(id)
      ? await FleetTask.findOne({ id: parseInt(id) })
      : await FleetTask.findById(id);

    if (!fleetTask)
      return res
        .status(404)
        .json({ success: false, message: 'Fleet task not found' });

    const company = await Company.findOne({ id: fleetTask.companyId });
    res.json({
      success: true,
      data: {
        ...fleetTask.toObject(),
        companyName: company?.name || 'Unknown Company',
        tenantCode: company?.tenantCode || 'N/A',
      },
    });
  } catch (error) {
    console.error('Error fetching fleet task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ POST /api/fleet-tasks - Create new fleet task
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
      projectId,
      createdBy,
    } = req.body;

    if (!companyId || !vehicleId || !taskDate) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, Vehicle ID, and Task Date are required',
      });
    }

    const company = await Company.findOne({ id: toInt(companyId) });
    if (!company)
      return res.status(404).json({ success: false, message: 'Company not found' });

    const lastTask = await FleetTask.findOne().sort({ id: -1 });
    const newId = lastTask ? lastTask.id + 1 : 1;

    const fleetTask = new FleetTask({
      id: newId,
      companyId: toInt(companyId),
      vehicleId: toInt(vehicleId),
      driverId: toInt(driverId),
      projectId: toInt(projectId),
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
      createdBy: createdBy || null,
    });

    const savedTask = await fleetTask.save();

    res.status(201).json({
      success: true,
      message: 'Fleet task created successfully',
      data: {
        ...savedTask.toObject(),
        companyName: company.name,
        tenantCode: company.tenantCode,
      },
    });
  } catch (error) {
    console.error('Error creating fleet task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ PUT /api/fleet-tasks/:id - Update fleet task
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    ['companyId', 'vehicleId', 'driverId', 'projectId'].forEach((field) => {
      if (updateData[field]) updateData[field] = toInt(updateData[field]);
    });

    ['taskDate', 'plannedPickupTime', 'plannedDropTime', 'actualStartTime', 'actualEndTime'].forEach(
      (field) => {
        if (updateData[field]) updateData[field] = new Date(updateData[field]);
      }
    );

    updateData.updatedAt = Date.now();

    const id = req.params.id;
    const updatedTask = /^\d+$/.test(id)
      ? await FleetTask.findOneAndUpdate({ id: parseInt(id) }, updateData, {
          new: true,
          runValidators: true,
        })
      : await FleetTask.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

    if (!updatedTask)
      return res
        .status(404)
        .json({ success: false, message: 'Fleet task not found' });

    const company = await Company.findOne({ id: updatedTask.companyId });
    res.json({
      success: true,
      message: 'Fleet task updated successfully',
      data: {
        ...updatedTask.toObject(),
        companyName: company?.name || 'Unknown Company',
        tenantCode: company?.tenantCode || 'N/A',
      },
    });
  } catch (error) {
    console.error('Error updating fleet task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ DELETE /api/fleet-tasks/:id - Delete fleet task
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedTask = /^\d+$/.test(id)
      ? await FleetTask.findOneAndDelete({ id: parseInt(id) })
      : await FleetTask.findByIdAndDelete(id);

    if (!deletedTask)
      return res
        .status(404)
        .json({ success: false, message: 'Fleet task not found' });

    res.json({
      success: true,
      message: 'Fleet task deleted successfully',
      data: deletedTask,
    });
  } catch (error) {
    console.error('Error deleting fleet task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
