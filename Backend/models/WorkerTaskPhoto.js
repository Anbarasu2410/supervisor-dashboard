import mongoose from "mongoose";

const WorkerTaskPhotoSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
     // required: true,
      unique: true
    },

    workerTaskAssignmentId: {
      type: Number,
      //required: true
    },

    employeeId: {
      type: Number,
     // required: true
    },

    photoUrl: {
      type: String,
      //required: true
    },

    caption: {
      type: String,
      trim: true
    },

    uploadedAt: {
      type: Date,
      default: Date.now
   }
}, {
  collection: 'workerTaskPhoto',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model(
  "WorkerTaskPhoto",
  WorkerTaskPhotoSchema
);
