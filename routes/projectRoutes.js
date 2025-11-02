const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: projects,
      total: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
});

// GET /api/projects/company/:companyId - Get projects by company ID
router.get('/company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    if (isNaN(companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const projects = await Project.find({ companyId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: projects,
      total: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects by company',
      error: error.message
    });
  }
});

// GET /api/projects/:id - Get project by numeric ID
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
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
      message: 'Error fetching project',
      error: error.message
    });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    // Generate new numeric ID
    const lastProject = await Project.findOne().sort({ id: -1 });
    const newId = lastProject ? lastProject.id + 1 : 1;

    const projectData = {
      id: newId,
      ...req.body
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle duplicate project code error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    // Prevent ID update
    const updateData = { ...req.body };
    delete updateData.id;

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
    
    // Handle duplicate project code error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
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
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
});

module.exports = router;