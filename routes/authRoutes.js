// backend/routes/authRoutes.js
const express = require('express');
const { 
  login, 
  getProfile, 
  verifyToken 
} = require('../controllers/authController');
const { verifyToken: authVerifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile (protected)
//router.get('/profile', authVerifyToken, getProfile);

// GET /api/auth/verify (protected)
router.get('/verify', authVerifyToken, verifyToken);

module.exports = router;