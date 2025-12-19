import mongoose from 'mongoose';

const WorkerTaskAssignmentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  projectId: {
    type: Number,
    required: true
  },
  employeeId: {
    type: Number,
    required: true
  },
  supervisorId: {
    type: Number,
    required: true
  },
  vehicleId: {
    type: Number,
    default: null
  },
  taskId: {
    type: Number,
    default: null
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  status: {
    type: String,
    default: 'assigned',
    enum: ['assigned','in_progress','completed']
  },
  companyId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'workerTaskAssignment',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});
//WorkerTaskAssignmentSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);