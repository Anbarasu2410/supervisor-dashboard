const mongoose = require('mongoose');

const fleetTaskSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true
  },
  projectId: {
    type: Number
  },
  driverId: {
    type: Number
  },
  vehicleId: {
    type: Number,
    required: true
  },
  taskDate: {
    type: Date,
    required: true
  },
  plannedPickupTime: {
    type: Date
  },
  plannedDropTime: {
    type: Date
  },
  // CHANGED: pickupLocation now accepts strings
  pickupLocation: {
    type: String,  // Changed from geospatial object to String
    trim: true,
    default: ''
  },
  pickupAddress: {
    type: String,
    trim: true,
    default: ''
  },
  // CHANGED: dropLocation now accepts strings
  dropLocation: {
    type: String,  // Changed from geospatial object to String
    trim: true,
    default: ''
  },
  dropAddress: {
    type: String,
    trim: true,
    default: ''
  },
  expectedPassengers: {
    type: Number,
    min: 0,
    default: 0
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  routeLog: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Number
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

// REMOVED: Geospatial indexes since we're using strings now
// fleetTaskSchema.index({ pickupLocation: '2dsphere' });
// fleetTaskSchema.index({ dropLocation: '2dsphere' });

// Update updatedAt before saving
fleetTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FleetTask', fleetTaskSchema, 'fleetTasks');