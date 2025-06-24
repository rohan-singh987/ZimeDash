import User from '../models/user.model.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import * as logger from '../utils/logger.js';

/**
 * User Controller
 * Handles user management operations
 */

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin/Manager)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, isActive, search } = req.query;

  // Build query
  const query = {};
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private (Admin/Manager)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Admin only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive } = req.body;

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update user
  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  logger.info('User updated by admin', {
    adminId: req.user._id,
    targetUserId: id,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  logger.warn('User deleted by admin', {
    adminId: req.user._id,
    deletedUserId: id,
    deletedUserEmail: user.email
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Promote/demote user role
 * @route PUT /api/users/:id/role
 * @access Private (Admin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  if (!['admin', 'manager', 'member'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be admin, manager, or member'
    });
  }

  // Prevent admin from demoting themselves
  if (id === req.user._id.toString() && role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own admin role'
    });
  }

  // Update user role
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  logger.info('User role updated', {
    adminId: req.user._id,
    targetUserId: id,
    newRole: role,
    targetUserEmail: user.email
  });

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      user
    }
  });
});

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Private (Admin only)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = totalUsers - activeUsers;

  // Format role statistics
  const roleStats = {};
  stats.forEach(stat => {
    roleStats[stat._id] = stat.count;
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution: roleStats,
      recentRegistrations: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    }
  });
});