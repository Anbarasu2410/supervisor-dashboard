import express from 'express';
import { validateGeofence, logLocation, submitAttendance, getAttendanceHistory } from '../controllers/attendanceController.js';

const router = express.Router();

// Clock in / out
router.post('/validate-geofence', validateGeofence);
router.post('/log-location', logLocation);
router.post('/submit', submitAttendance);
router.get('/history', getAttendanceHistory);


export default router;
