// routes/workerRoutes.js
import express from "express";
import { getWorkerTodayTrip } from "../controllers/workerController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Worker Portal - Today's Trip
router.get("/today-trip", 
  verifyToken, 
  authorizeRoles("worker"), 
  getWorkerTodayTrip
);
//router.put('/passengers/:passengerId/confirm', authMiddleware, confirmPassengerJourney);

// In your routes file


export default router;