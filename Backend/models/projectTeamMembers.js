// models/ProjectTeamMember.js
import mongoose from 'mongoose';

const projectTeamMemberSchema = new mongoose.Schema({
  id: {
    type: Number,
  
  },
  projectId: {
    type: String
  },
  userId: {
    type: Number
  },
  role: {
    type: String,
    enum: ['PM', 'Supervisor', 'engineers', 'Safety', 'Coordinator','manager','safety','supervisors']
   }
  }, {
  collection: 'projectTeamMembers',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('ProjectTeamMember', projectTeamMemberSchema);
//projectteammembers