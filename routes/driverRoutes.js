const express = require('express');
const { 
  getTodaysTasks, 
  getTripHistory,
  getTaskDetails, 
  confirmPickup,
  confirmDrop,
  getTripSummary,
  getDriverProfile,
  changeDriverPassword,
  uploadDriverPhoto,
  upload
} = require('../controllers/driverController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();


router.get("/profile", verifyToken, authorizeRoles("driver"), getDriverProfile);


router.put("/profile/password", verifyToken, authorizeRoles("driver"), changeDriverPassword);


router.post("/profile/photo", verifyToken, authorizeRoles("driver"), upload.single('photo'), uploadDriverPhoto);

// 🔹 Driver Task Routes
// GET /api/driver/tasks/today
router.get("/tasks/today", verifyToken, authorizeRoles("driver"), getTodaysTasks);

// GET /api/driver/trips/history
router.get("/trips/history", verifyToken, authorizeRoles("driver"), getTripHistory);

// GET /api/driver/tasks/:taskId
router.get("/tasks/:taskId", verifyToken, authorizeRoles("driver"), getTaskDetails);

// POST /api/driver/tasks/:taskId/pickup
router.post("/tasks/:taskId/pickup", verifyToken, authorizeRoles("driver"), confirmPickup);

// POST /api/driver/tasks/:taskId/drop
router.post("/tasks/:taskId/drop", verifyToken, authorizeRoles("driver"), confirmDrop);

// GET /api/driver/tasks/:taskId/summary
router.get("/tasks/:taskId/summary", verifyToken, authorizeRoles("driver"), getTripSummary);

module.exports = router;