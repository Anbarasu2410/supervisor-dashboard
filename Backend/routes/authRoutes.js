// backend/routes/authRoutes.js
import express from 'express';
import { login, getProfile, verifyToken } from '../controllers/authController.js';
import { verifyToken as authVerifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile (protected)
// router.get('/profile', authVerifyToken, getProfile);

// GET /api/auth/verify (protected)
router.get('/verify', authVerifyToken, verifyToken);

export default router;
