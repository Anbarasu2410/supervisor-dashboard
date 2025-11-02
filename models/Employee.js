const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  userId: {
    type: Number,
    ref: 'User'
  },
  employeeCode: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  photo_url: {  // ADD THIS FIELD
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Employee', employeeSchema);