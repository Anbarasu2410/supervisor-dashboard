
import Attendance from '../models/Attendance.js';
import Project from '../models/Project.js';
import LocationLog from '../models/LocationLog.js';
import nodemailer from 'nodemailer';
import Employee from '../models/Employee.js';




function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Send email alert
 */
const sendEmailAlert = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({ from: `"ERP System" <${process.env.SMTP_USER}>`, to, subject, text: text || '', html });
  } catch (error) {
    console.error('Email send failed', error);
  }
};

/**
 * Validate if worker is inside project geofence
 */
export const validateGeofence = async (req, res) => {
  try {
    const { projectId, latitude, longitude } = req.body;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      project.latitude,
      project.longitude
    );

    const insideGeofence = distance <= project.geofenceRadius;

    return res.status(200).json({ insideGeofence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error validating geofence' });
  }
};



/**
 * Submit attendance (clock in/out)
 */
export const submitAttendance = async (req, res) => {
  try {
    const { employeeId, projectId, session, latitude, longitude } = req.body;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const employee = await Employee.findOne({ id: Number(employeeId) });


    const distance = getDistanceFromLatLonInMeters(latitude, longitude, project.latitude, project.longitude);
    const insideGeofence = distance <= project.geofenceRadius;

    if (!insideGeofence) {
      return res.status(400).json({ message: 'Cannot submit attendance outside project area' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ employeeId, projectId, date: today });

    if (session === 'checkin') {
      if (record && record.checkIn) return res.status(400).json({ message: 'Check-in already submitted' });
      if (!record) {
        record = new Attendance({ employeeId, projectId, date: today, checkIn: new Date(), checkOut: null, pendingCheckout: true, insideGeofenceAtCheckin: insideGeofence });
      } else { record.checkIn = new Date(); record.pendingCheckout = true; }
      await record.save();
      return res.status(200).json({ message: 'Check-in successful', record });
    }

    if (session === 'checkout') {
      if (!record || !record.checkIn) return res.status(400).json({ message: 'Cannot check out without checking in first' });
      if (record.checkOut) return res.status(400).json({ message: 'Check-out already submitted' });
      record.checkOut = new Date();
      record.pendingCheckout = false;
      record.insideGeofenceAtCheckout = insideGeofence;
      await record.save();
      return res.status(200).json({ message: 'Check-out successful', record });
    }

    return res.status(400).json({ message: 'Invalid session type' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting attendance' });
  }
};



/**
 * Log location and trigger geofence change alerts
 */
export const logLocation = async (req, res) => {
  try {
    const { employeeId, projectId, latitude, longitude } = req.body;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const distance = getDistanceFromLatLonInMeters(latitude, longitude, project.latitude, project.longitude);
    const insideGeofence = distance <= project.geofenceRadius;

    const newLog = new LocationLog({ employeeId, projectId, latitude, longitude, insideGeofence, timestamp: new Date() });
    await newLog.save();

    // Check if outside threshold exceeded
    const thresholdMinutes = 1;
    if (!insideGeofence) {
      const lastInside = await LocationLog.findOne({ employeeId, projectId, insideGeofence: true }).sort({ timestamp: -1 });
      let outsideDuration = lastInside ? (new Date() - lastInside.timestamp) / 1000 / 60 : thresholdMinutes + 1;

      if (outsideDuration >= thresholdMinutes) {
        const employee = await Employee.findOne({ id: Number(employeeId) });

await sendEmailAlert({
  to: ['anbuarasu2017@gmail.com'],
  subject: `🚨 Worker Outside Geofence — ${employee.fullName}`,
  html: `<p>Worker <strong>${employee.fullName}</strong> has been outside project <strong>${project.projectName}</strong> for ${Math.floor(outsideDuration)} minutes.</p>
         <ul><li>Latitude: ${latitude}</li><li>Longitude: ${longitude}</li></ul>`,
});

       

        // Optional: auto-checkout if already checked in
        const today = new Date(); today.setHours(0,0,0,0);
        const attendanceRecord = await Attendance.findOne({ employeeId, projectId, date: today });
        if (attendanceRecord && attendanceRecord.checkIn && !attendanceRecord.checkOut) {
          attendanceRecord.checkOut = new Date();
          attendanceRecord.pendingCheckout = false;
          attendanceRecord.insideGeofenceAtCheckout = false;
          await attendanceRecord.save();
        }
      }
    }

    return res.status(200).json({ message: 'Location logged', insideGeofence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging location' });
  }
};



/**
 * Get attendance history
 */
export const getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId, projectId } = req.query;
    const records = await Attendance.find({ employeeId: Number(employeeId), projectId: Number(projectId) }).sort({ date: -1 });
    res.status(200).json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching attendance history' });
  }
};
