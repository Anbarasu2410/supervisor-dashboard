import express from 'express';
const router = express.Router();

import {
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
} from '../controllers/driverController.js';

import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

// 🔹 Driver Profile Routes
router.get("/profile", verifyToken,  getDriverProfile);
router.put("/profile/password", verifyToken,  changeDriverPassword);
router.post("/profile/photo", verifyToken,  upload.single('photo'), uploadDriverPhoto);

// 🔹 Driver Task Routes
router.get("/tasks/today", verifyToken, authorizeRoles("driver"), getTodaysTasks);
router.get("/trips/history", verifyToken, authorizeRoles("driver"), getTripHistory);
router.get("/tasks/:taskId", verifyToken, authorizeRoles("driver"), getTaskDetails);
router.post("/tasks/:taskId/pickup", verifyToken, authorizeRoles("driver"), confirmPickup);
router.post("/tasks/:taskId/drop", verifyToken, authorizeRoles("driver"), confirmDrop);
router.get("/tasks/:taskId/summary", verifyToken, authorizeRoles("driver"), getTripSummary);

export default router;
