const Project = require('../models/Project');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, companyId } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (companyId) filter.companyId = parseInt(companyId);

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: error.message
    });
  }
};

// Get projects by company ID
const getProjectsByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { companyId };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects by company:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company projects',
      error: error.message
    });
  }
};

// Get single project by numeric ID
const getProjectById = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const project = await Project.findOne({ id: projectId });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: error.message
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    // Generate new numeric ID
    const lastProject = await Project.findOne().sort({ id: -1 });
    const newId = lastProject ? lastProject.id + 1 : 1;

    const projectData = {
      id: newId,
      ...req.body
    };

    // Validate required fields
    if (!projectData.name || !projectData.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Project name and company ID are required'
      });
    }

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    // Don't allow updating ID field
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;

    const project = await Project.findOneAndUpdate(
      { id: projectId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating project',
      error: error.message
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const project = await Project.findOneAndDelete({ id: projectId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: { id: projectId }
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
      error: error.message
    });
  }
};

// Get project statistics
const getProjectStats = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format'
      });
    }

    const stats = await Project.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' }
        }
      }
    ]);

    const totalProjects = await Project.countDocuments({ companyId });
    const totalBudget = await Project.aggregate([
      { $match: { companyId } },
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);

    res.json({
      success: true,
      data: {
        stats,
        totalProjects,
        totalBudget: totalBudget[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectsByCompany,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};