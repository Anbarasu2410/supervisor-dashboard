// ==============================
// Imports (ESM Syntax)
// ==============================
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";

import User from "../models/User.js";
import Company from "../models/Company.js";
import CompanyUser from "../models/CompanyUser.js";
import Employee from "../models/Employee.js";
import FleetTask from "../models/FleetTask.js";
import FleetVehicle from "../models/FleetVehicle.js";
import Project from "../models/Project.js";
import FleetTaskPassenger from "../models/FleetTaskPassenger.js";

// ==============================
// Multer Configuration for Driver Photo Upload
// ==============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/drivers/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const userId = req.user?.id || req.user?.userId || "unknown";
    cb(null, `driver-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ==============================
// DRIVER PROFILE APIs
// ==============================

export const getDriverProfile = async (req, res) => {
  try {
    const user = req.user;
    const driverId = Number(user.id || user.userId);
    const companyId = Number(user.companyId);

    const [company, userDetails, employee] = await Promise.all([
      Company.findOne({ id: companyId }),
      User.findOne({ id: driverId }),
      Employee.findOne({ id: driverId }),
    ]);

    if (!userDetails)
      return res.status(404).json({ success: false, message: "User not found" });
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });
    if (!company)
      return res.status(404).json({ success: false, message: "Company not found" });

    const profile = {
      id: user.id,
      name: employee.fullName || userDetails.name,
      email: userDetails.email,
      phoneNumber: employee.phone || userDetails.phone || "N/A",
      companyName: company.name,
      role: user.role,
      photo_url: employee.photo_url || null,
      createdAt: employee.createdAt || userDetails.createdAt,
      updatedAt: employee.updatedAt || employee.createdAt || userDetails.updatedAt,
    };

    res.json({ success: true, profile });
  } catch (err) {
    console.error("❌ Error fetching driver profile:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ==============================
// Change Driver Password
// ==============================
export const changeDriverPassword = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ success: false, message: "Both passwords required" });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password too short" });

    const user = await User.findOne({ id: driverId });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid)
      return res.status(400).json({ success: false, message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { id: driverId },
      { $set: { passwordHash: hashedPassword, updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ==============================
// Upload Driver Photo
// ==============================
export const uploadDriverPhoto = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    if (!req.file)
      return res.status(400).json({ success: false, message: "No photo file uploaded" });

    const photo_url = `/uploads/drivers/${req.file.filename}`;

    await Employee.updateOne(
      { id: driverId },
      { $set: { photo_url, updatedAt: new Date() } }
    );

    const [employee, company, user] = await Promise.all([
      Employee.findOne({ id: driverId }),
      Company.findOne({ id: companyId }),
      User.findOne({ id: driverId }),
    ]);

    const updatedProfile = {
      id: driverId,
      name: employee.fullName,
      email: user?.email || "N/A",
      phoneNumber: employee.phone || "N/A",
      companyName: company?.name || "N/A",
      role: "driver",
      photo_url,
    };

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      driver: updatedProfile,
      photo_url,
    });
  } catch (err) {
    console.error("❌ Error uploading photo:", err);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
};

// ==============================
// DRIVER TASK APIs
// ==============================

export const getTodaysTasks = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching today's tasks for driver: ${driverId}, company: ${companyId}`);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log(`📌 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const tasks = await FleetTask.find({
      driverId,
      companyId,
      taskDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).lean();

    console.log(`📌 Found ${tasks.length} tasks for today`);

    if (!tasks.length) {
      return res.json({
        success: true,
        message: 'No tasks found for today',
        tasks: []
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const vehicleIds = [...new Set(tasks.map(t => t.vehicleId))];
    const taskIds = tasks.map(t => t.id);

    const [projects, vehicles, passengerCounts] = await Promise.all([
      Project.find({ id: { $in: projectIds } }).lean(),
      FleetVehicle.find({ id: { $in: vehicleIds } }).lean(),
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ])
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const passengerCountMap = Object.fromEntries(passengerCounts.map(p => [p._id, p.count]));

    const formatTime = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const taskList = tasks.map(task => ({
      task_id: task.id,
      project_name: projectMap[task.projectId]?.name || 'Unknown Project',
      start_time: formatTime(task.plannedPickupTime),
      end_time: formatTime(task.plannedDropTime),
      vehicle_number: vehicleMap[task.vehicleId]?.registrationNo || 'N/A',
      passengers: passengerCountMap[task.id] || 0,
      status: task.status,
      pickup_location: task.pickupAddress || task.pickupLocation || 'Location not specified',
      drop_location: task.dropAddress || task.dropLocation || 'Location not specified'
    }));

    res.json({
      success: true,
      message: `Found ${taskList.length} tasks for today`,
      tasks: taskList
    });

  } catch (err) {
    console.error("❌ Error fetching today's tasks:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's tasks",
      error: err.message
    });
  }
};

// ==============================
// Trip History
// ==============================
export const getTripHistory = async (req, res) => {
  try {
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);
    const { startDate, endDate } = req.query;

    console.log(`📌 Fetching trip history for driver: ${driverId}, from ${startDate} to ${endDate}`);

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    console.log(`📌 Date range: ${start.toISOString()} to ${end.toISOString()}`);

    const tasks = await FleetTask.find({
      status: "COMPLETED",
      driverId,
      companyId,
      taskDate: {
        $gte: start,
        $lte: end
      }
    })
    .sort({ taskDate: -1 })
    .lean();

    console.log(`📌 Found ${tasks.length} historical tasks`);

    if (!tasks.length) {
      return res.json({
        success: true,
        message: 'No trips found for the selected period',
        trips: []
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const vehicleIds = [...new Set(tasks.map(t => t.vehicleId))];
    const taskIds = tasks.map(t => t.id);

    const [projects, vehicles, passengerCounts] = await Promise.all([
      Project.find({ id: { $in: projectIds } }).lean(),
      FleetVehicle.find({ id: { $in: vehicleIds } }).lean(),
      FleetTaskPassenger.aggregate([
        { $match: { fleetTaskId: { $in: taskIds } } },
        { $group: { _id: "$fleetTaskId", count: { $sum: 1 } } }
      ])
    ]);

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
    const passengerCountMap = Object.fromEntries(passengerCounts.map(p => [p._id, p.count]));

    const tripHistory = tasks.map(task => ({
      task_id: task.id,
      project_name: projectMap[task.projectId]?.name || 'Unknown Project',
      start_time: task.plannedPickupTime,
      end_time: task.plannedDropTime,
      actual_start_time: task.actualStartTime,
      actual_end_time: task.actualEndTime,
      vehicle_number: vehicleMap[task.vehicleId]?.registrationNo || 'N/A',
      passengers: passengerCountMap[task.id] || 0,
      status: task.status,
      pickup_location: task.pickupAddress || task.pickupLocation || 'Location not specified',
      drop_location: task.dropAddress || task.dropLocation || 'Location not specified',
      taskDate: task.taskDate
    }));

    res.json({
      success: true,
      message: `Found ${tripHistory.length} trips`,
      trips: tripHistory
    });

  } catch (err) {
    console.error("❌ Error fetching trip history:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trip history",
      error: err.message
    });
  }
};

// ==============================
// Task Details
// ==============================
export const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching task details for: ${taskId}, driver: ${driverId}, company: ${companyId}`);

    const numericTaskId = Number(taskId);

    if (!numericTaskId || isNaN(numericTaskId)) {
      console.log('❌ Invalid task ID provided');
      return res.status(400).json({ 
        success: false,
        message: "Invalid task ID" 
      });
    }

    console.log(`📌 Searching for task with numeric ID: ${numericTaskId}`);

    const task = await FleetTask.findOne({
      id: numericTaskId,
      driverId: driverId,
      companyId: companyId
    }).lean();

    console.log(`📌 Task query result:`, task ? 'Found' : 'Not found');

    if (!task) {
      console.log(`❌ Task not found for numeric ID: ${numericTaskId}`);
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    console.log(`✅ Task found: ${task._id}, Project ID: ${task.projectId}, Vehicle ID: ${task.vehicleId}`);

    const passengers = await FleetTaskPassenger.find({ 
      fleetTaskId: task.id 
    })
      .select("id name pickup_point pickupStatus dropStatus")
      .lean();

    console.log(`✅ Found ${passengers.length} passengers`);

    const project = await Project.findOne({ id: task.projectId }).lean();
    console.log(`✅ Project: ${project?.name || 'Not found'}`);
    
    const vehicle = await FleetVehicle.findOne({ id: task.vehicleId }).lean();
    console.log(`✅ Vehicle: ${vehicle?.registrationNo || 'Not found'}`);

    const response = {
      _id: task._id,
      id: task.id,
      project_name: project?.name || 'Unknown Project',
      vehicle_no: vehicle?.registrationNo || 'N/A',
      start_time: task.plannedPickupTime,
      end_time: task.plannedDropTime,
      actual_start_time: task.actualStartTime,
      actual_end_time: task.actualEndTime,
      passengers: passengers.map(p => ({
        id: p.id,
        name: p.name,
        pickup_point: p.pickup_point,
        pickup_status: p.pickupStatus || 'pending',
        drop_status: p.dropStatus || 'pending'
      })),
      status: task.status,
      pickup_location: task.pickupAddress || task.pickupLocation || 'Location not specified',
      drop_location: task.dropAddress || task.dropLocation || 'Location not specified',
      expected_passengers: task.expectedPassengers || passengers.length
    };

    console.log(`✅ Task details prepared: ${response.project_name} with ${response.passengers.length} passengers`);
    return res.json(response);

  } catch (err) {
    console.error("❌ Error fetching task details:", err);
    console.error("❌ Error stack:", err.stack);
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};

// ==============================
// Confirm Pickup
// ==============================
export const confirmPickup = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [] } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm pickup for task: ${taskId}, driver: ${driverId}`);
    console.log(`📌 Confirmed passengers:`, confirmed);
    console.log(`📌 Missed passengers:`, missed);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    if (confirmed.length > 0) {
      await FleetTaskPassenger.updateMany(
        { 
          fleetTaskId: Number(taskId), 
          id: { $in: confirmed.map(id => Number(id)) } 
        },
        {
          $set: {
            pickupStatus: "confirmed",
            pickupConfirmedAt: new Date(),
          },
        }
      );
    }

    if (missed.length > 0) {
      await FleetTaskPassenger.updateMany(
        { 
          fleetTaskId: Number(taskId), 
          id: { $in: missed.map(id => Number(id)) } 
        },
        {
          $set: {
            pickupStatus: "missed",
            pickupConfirmedAt: new Date(),
          },
        }
      );
    }

    const currentTime = new Date();
    await FleetTask.updateOne(
      { id: Number(taskId) },
      {
        $set: {
          status: "ONGOING",
          actualStartTime: currentTime,
          updatedAt: currentTime
        }
      }
    );

    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId) }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean(),
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const response = {
      success: true,
      message: "Pickup confirmed successfully",
      status: updatedTask.status,
      task: {
        _id: updatedTask._id,
        id: updatedTask.id,
        project_name: project?.name || 'Unknown Project',
        vehicle_no: vehicle?.registrationNo || 'N/A',
        start_time: updatedTask.plannedPickupTime,
        end_time: updatedTask.plannedDropTime,
        actual_start_time: updatedTask.actualStartTime,
        status: updatedTask.status,
        pickup_location: updatedTask.pickupAddress || updatedTask.pickupLocation,
        drop_location: updatedTask.dropAddress || updatedTask.dropLocation
      },
      updated_passengers: updatedPassengers.map(p => ({
        id: p.id,
        name: p.name,
        pickup_point: p.pickup_point,
        pickup_status: p.pickupStatus || 'pending',
        drop_status: p.dropStatus || 'pending'
      }))
    };

    console.log(`✅ Pickup confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Actual start time set to: ${currentTime}`);
    
    return res.status(200).json(response);

  } catch (err) {
    console.error("❌ Pickup confirmation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during pickup confirmation.",
      error: err.message,
    });
  }
};

// ==============================
// Confirm Drop
// ==============================
export const confirmDrop = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { confirmed = [], missed = [] } = req.body;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Confirm drop for task: ${taskId}, driver: ${driverId}`);
    console.log(`📌 Confirmed passengers:`, confirmed);
    console.log(`📌 Missed passengers:`, missed);

    const task = await FleetTask.findOne({
      id: Number(taskId),
      driverId: driverId,
      companyId: companyId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    if (confirmed.length > 0) {
      await FleetTaskPassenger.updateMany(
        { 
          fleetTaskId: Number(taskId), 
          id: { $in: confirmed.map(id => Number(id)) } 
        },
        {
          $set: {
            dropStatus: "confirmed",
            dropConfirmedAt: new Date(),
          },
        }
      );
    }

    if (missed.length > 0) {
      await FleetTaskPassenger.updateMany(
        { 
          fleetTaskId: Number(taskId), 
          id: { $in: missed.map(id => Number(id)) } 
        },
        {
          $set: {
            dropStatus: "missed",
            dropConfirmedAt: new Date(),
          },
        }
      );
    }

    const currentTime = new Date();
    await FleetTask.updateOne(
      { id: Number(taskId) },
      {
        $set: {
          status: "COMPLETED",
          actualEndTime: currentTime,
          updatedAt: currentTime
        }
      }
    );

    const [updatedTask, updatedPassengers, project, vehicle] = await Promise.all([
      FleetTask.findOne({ id: Number(taskId) }).lean(),
      FleetTaskPassenger.find({ fleetTaskId: Number(taskId) }).lean(),
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const response = {
      success: true,
      message: "Drop-off confirmed successfully",
      status: updatedTask.status,
      task: {
        _id: updatedTask._id,
        id: updatedTask.id,
        project_name: project?.name || 'Unknown Project',
        vehicle_no: vehicle?.registrationNo || 'N/A',
        start_time: updatedTask.plannedPickupTime,
        end_time: updatedTask.plannedDropTime,
        actual_start_time: updatedTask.actualStartTime,
        actual_end_time: updatedTask.actualEndTime,
        status: updatedTask.status,
        pickup_location: updatedTask.pickupAddress || updatedTask.pickupLocation,
        drop_location: updatedTask.dropAddress || updatedTask.dropLocation
      },
      updated_passengers: updatedPassengers.map(p => ({
        id: p.id,
        name: p.name,
        pickup_point: p.pickup_point,
        pickup_status: p.pickupStatus || 'pending',
        drop_status: p.dropStatus || 'pending'
      }))
    };

    console.log(`✅ Drop confirmed for task ${taskId}`);
    console.log(`✅ Task status updated to: ${updatedTask.status}`);
    console.log(`✅ Actual end time set to: ${currentTime}`);
    
    return res.status(200).json(response);

  } catch (err) {
    console.error("❌ Drop confirmation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during drop confirmation.",
      error: err.message,
    });
  }
};

// ==============================
// Trip Summary
// ==============================
export const getTripSummary = async (req, res) => {
  try {
    const { taskId } = req.params;
    const driverId = Number(req.user.id || req.user.userId);
    const companyId = Number(req.user.companyId);

    console.log(`📌 Fetching trip summary for task: ${taskId}, driver: ${driverId}`);

    const numericTaskId = Number(taskId);

    const task = await FleetTask.findOne({
      id: numericTaskId,
      driverId: driverId,
      companyId: companyId
    }).lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not assigned to this driver.",
      });
    }

    console.log(`📌 Fetching driver details for ID: ${driverId}`);
    const driver = await User.findOne({ id: driverId }).lean();
    console.log(`✅ Driver: ${driver?.name || 'Not found'}`);

    const passengers = await FleetTaskPassenger.find({ 
      fleetTaskId: numericTaskId 
    }).lean();

    const totalPassengers = passengers.length;
    const pickedUp = passengers.filter(p => p.pickupStatus === 'confirmed').length;
    const dropped = passengers.filter(p => p.dropStatus === 'confirmed').length;
    const missedPickups = passengers.filter(p => p.pickupStatus === 'missed').length;
    const missedDrops = passengers.filter(p => p.dropStatus === 'missed').length;
    const totalMissed = missedPickups + missedDrops;

    let durationMinutes = 0;
    if (task.actualStartTime && task.actualEndTime) {
      const start = new Date(task.actualStartTime);
      const end = new Date(task.actualEndTime);
      const durationMs = end - start;
      durationMinutes = Math.ceil(durationMs / (1000 * 60));
    } else if (task.plannedPickupTime && task.plannedDropTime) {
      const start = new Date(task.plannedPickupTime);
      const end = new Date(task.plannedDropTime);
      const durationMs = end - start;
      durationMinutes = Math.ceil(durationMs / (1000 * 60));
    }

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    console.log(`⏱️ Duration calculation: ${durationMinutes} minutes`);

    const [project, vehicle] = await Promise.all([
      Project.findOne({ id: task.projectId }).lean(),
      FleetVehicle.findOne({ id: task.vehicleId }).lean()
    ]);

    const summary = {
      _id: task._id,
      id: task.id,
      project_name: project?.name || 'Unknown Project',
      vehicle_no: vehicle?.registrationNo || 'N/A',
      driver_name: driver?.name || 'Unknown Driver',
      driver_id: driverId,
      total_passengers: totalPassengers,
      picked_up: pickedUp,
      dropped: dropped,
      missed: totalMissed,
      duration_minutes: durationMinutes,
      start_time: task.plannedPickupTime,
      end_time: task.plannedDropTime,
      actual_start_time: task.actualStartTime,
      actual_end_time: task.actualEndTime,
      status: task.status,
      pickup_location: task.pickupAddress || task.pickupLocation || 'Location not specified',
      drop_location: task.dropAddress || task.dropLocation || 'Location not specified',
      task_date: task.taskDate,
      formatted_date: formatDate(task.taskDate),
      pickup_confirmed_at: task.actualStartTime,
      drop_confirmed_at: task.actualEndTime
    };

    console.log(`✅ Trip summary prepared for task ${taskId}`);
    console.log(`📊 Stats: ${pickedUp}/${totalPassengers} picked up, ${dropped}/${totalPassengers} dropped, ${durationMinutes} mins`);
    console.log(`👨‍✈️ Driver: ${driver?.name}`);
    console.log(`📅 Date: ${formatDate(task.taskDate)}`);
    console.log(`🕐 Planned: ${task.plannedPickupTime} to ${task.plannedDropTime}`);
    console.log(`🕐 Actual: ${task.actualStartTime} to ${task.actualEndTime}`);

    res.json(summary);

  } catch (err) {
    console.error("❌ Error fetching trip summary:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching trip summary.",
      error: err.message,
    });
  }
};
