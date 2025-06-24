import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, setupInitialAdmin } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/setup-admin', setupInitialAdmin);
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;