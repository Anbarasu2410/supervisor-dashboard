import mongoose from 'mongoose';

const locationLogSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
    employeeId: {
      type: Number,
    
    },
    projectId: {
      type: Number,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    insideGeofence: {
      type: Boolean,
      required: true,
    },
    // Track how long worker has been outside geofence
    outsideGeofenceStart: {
      type: Date,
      default: null,
    },
    // Optional: link with attendance record for auto-checkout or absent marking
    attendanceId: {
      type:Number,
      ref: 'Attendance',
    },
  },
  {
    collection: 'locationLogs',
    timestamps: true, // includes createdAt and updatedAt
  }
);

export default mongoose.model('LocationLog', locationLogSchema);
