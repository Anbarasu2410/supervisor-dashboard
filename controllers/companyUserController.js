const CompanyUser = require('../models/CompanyUser');

// Create new company user
const createCompanyUser = async (req, res) => {
  try {
    const { id, companyId, userId, role, isPrimary } = req.body;

    // Validate required fields
    if (!id || !companyId || !userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields (id, companyId, userId, role) are required'
      });
    }

    const companyUser = new CompanyUser({
      id,
      companyId,
      userId,
      role,
      isPrimary
    });

    await companyUser.save();
    res.status(201).json({
      success: true,
      data: companyUser
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.id) {
        return res.status(400).json({
          success: false,
          message: 'Company user with this ID already exists'
        });
      }
      if (error.keyPattern && error.keyPattern.companyId && error.keyPattern.userId) {
        return res.status(400).json({
          success: false,
          message: 'User already exists in this company'
        });
      }
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all company users
const getCompanyUsers = async (req, res) => {
  try {
    const { companyId, userId, role, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (companyId) filter.companyId = companyId;
    if (userId) filter.userId = userId;
    if (role) filter.role = role;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const companyUsers = await CompanyUser.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await CompanyUser.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: companyUsers.length,
      total,
      page: options.page,
      pages: Math.ceil(total / options.limit),
      data: companyUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company user by ID
const getCompanyUserById = async (req, res) => {
  try {
    const companyUser = await CompanyUser.findOne({ id: req.params.id });

    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: companyUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update company user
const updateCompanyUser = async (req, res) => {
  try {
    const { role, isPrimary } = req.body;

    // Prevent updating companyId and userId as they're part of unique constraint
    if (req.body.companyId || req.body.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update companyId or userId. Delete and create new record instead.'
      });
    }

    const companyUser = await CompanyUser.findOneAndUpdate(
      { id: req.params.id },
      { 
        role, 
        isPrimary
      },
      { new: true, runValidators: true }
    );

    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: companyUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete company user
const deleteCompanyUser = async (req, res) => {
  try {
    const companyUser = await CompanyUser.findOneAndDelete({ id: req.params.id });

    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company user not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company user deleted successfully',
      data: companyUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get users by company
const getUsersByCompany = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const companyUsers = await CompanyUser.find({ companyId: req.params.companyId })
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await CompanyUser.countDocuments({ companyId: req.params.companyId });

    res.status(200).json({
      success: true,
      count: companyUsers.length,
      total,
      page: options.page,
      pages: Math.ceil(total / options.limit),
      data: companyUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get companies by user
const getCompaniesByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const companyUsers = await CompanyUser.find({ userId: req.params.userId })
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await CompanyUser.countDocuments({ userId: req.params.userId });

    res.status(200).json({
      success: true,
      count: companyUsers.length,
      total,
      page: options.page,
      pages: Math.ceil(total / options.limit),
      data: companyUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get company user by company and user
const getCompanyUserByCompanyAndUser = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    const companyUser = await CompanyUser.findOne({
      companyId: companyId,
      userId: userId
    });

    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company user not found'
      });
    }

    res.status(200).json({
      success: true,
      data: companyUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createCompanyUser,
  getCompanyUsers,
  getCompanyUserById,
  updateCompanyUser,
  deleteCompanyUser,
  getUsersByCompany,
  getCompaniesByUser,
  getCompanyUserByCompanyAndUser
};