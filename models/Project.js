import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  // Primary ID (numeric like your companies)
  id: {
    type: Number,
    required: true,
    unique: true
  },
  // Company reference (numeric ID to match your existing structure)
  companyId: {
    type: Number,
    required: true
  },
  // Project code (unique identifier)
  projectCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  // Basic project information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Job classification
  jobNature: {
    type: String,
    trim: true
  },
  jobSubtype: {
    type: String,
    trim: true
  },
  // Project timeline
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  // Financial information
  budget: {
    type: Number,
    min: 0
  },
  // Project status
  status: {
    type: String,
    required: true,
    enum: ['Planned', 'Ongoing', 'Completed', 'Warranty', 'Cancelled'],
    default: 'Planned'
  },
  // Permit information
  permitRequired: {
    type: Boolean,
    default: false
  },
  permitStatus: {
    type: String,
    trim: true
  },
  // Geographical data
  siteGeo: {
    type: Object // For polygon geometry
  },
  sitePoint: {
    type: Object // For point geometry
  },
  // Location information
  address: {
    type: String,
    trim: true
  },
  // Contact information
  contactPerson: {
    type: Object,
    default: {}
  },
  // Metadata and additional information
  meta: {
    type: Object,
    default: {}
  },
  // Creator reference
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Indexes for better query performance
projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, startDate: -1 });
projectSchema.index({ projectCode: 1 }, { unique: true, sparse: true });
projectSchema.index({ id: 1 }, { unique: true });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
