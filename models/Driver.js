const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true
  },
  employeeId: {
    type: Number,
    required: true
    // REMOVED: unique: true ← This was causing the error
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeCode: {
    type: String
  },
  jobTitle: {
    type: String
  },
  licenseNo: {
    type: String,
    required: true
  },
  licenseExpiry: {
    type: Date
  },
  vehicleId: {
    type: Number
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Driver', driverSchema);