// routes/workerRoutes.js
import express from "express";
import { getWorkerTodayTrip, getAvailableWorkers, getWorkerTodayTask, submitWorkerTaskProgress, uploadWorkerTaskPhotos } from "../controllers/workerController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Worker Portal - Today's Trip
router.get("/today-trip",
  verifyToken,
  authorizeRoles("worker"),
  getWorkerTodayTrip
);
router.get('/available', getAvailableWorkers);

router.get(
  "/my-task/today",
  verifyToken,
  authorizeRoles("worker"),
  getWorkerTodayTask
);

router.post(
  "/task-progress",
  verifyToken,
  authorizeRoles("worker"),
  submitWorkerTaskProgress
);

router.post(
  "/task-photos",
  verifyToken,
  authorizeRoles("worker"),
  upload.array("photos", 5),
  uploadWorkerTaskPhotos
);
//router.put('/passengers/:passengerId/confirm', authMiddleware, confirmPassengerJourney);

// In your routes file


export default router;