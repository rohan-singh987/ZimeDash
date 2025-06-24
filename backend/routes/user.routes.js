import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, getUserStats, updateUserRole } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole, requirePermission } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// Get user statistics (Admin only)
router.get('/stats', requireRole('admin'), getUserStats);

// Get all users (Admin and Manager can view users)
router.get('/', requirePermission('users', 'read'), getAllUsers);

// Get user by ID (Admin and Manager can view users)
router.get('/:id', requirePermission('users', 'read'), getUserById);

// Update user (Admin only)
router.put('/:id', requireRole('admin'), updateUser);

// Update user role (Admin only)
router.put('/:id/role', requireRole('admin'), updateUserRole);

// Delete user (Admin only)
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;