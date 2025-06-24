// Authentication Controller: Handles user registration, login, and profile operations

import User from '../models/user.model.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import * as logger from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password validation failed',
      errors: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Check if this is the first user (make them admin)
  const userCount = await User.countDocuments();
  const isFirstUser = userCount === 0;
  
  // Check if email ends with @zime.ai (make them admin)
  const isZimeEmail = email.toLowerCase().endsWith('@zime.ai');

  // Create user - all new users are 'member' by default, except first user or @zime.ai emails
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: (isFirstUser || isZimeEmail) ? 'admin' : 'member' // First user or @zime.ai emails become admin, others are members
  });

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  // Log user registration
  logger.info('User registered successfully', {
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.'
    });
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });
  user.password = undefined;

  // Log user login
  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/me
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const userId = req.user._id;

  const updateData = {};
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;

  // Update user
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  logger.info('User profile updated', {
    userId: user._id,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  // Validate new password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'New password validation failed',
      errors: passwordValidation.errors
    });
  }

  // Get user with password
  const user = await User.findById(userId).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  user.password = hashedNewPassword;
  await user.save();

  logger.info('User password changed', {
    userId: user._id,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Create initial admin user (for setup only)
 * @route POST /api/auth/setup-admin
 * @access Public (only if no users exist)
 */
export const setupInitialAdmin = asyncHandler(async (req, res) => {
  // Check if any users exist
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return res.status(403).json({
      success: false,
      message: 'Admin setup is only allowed when no users exist'
    });
  }

  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password validation failed',
      errors: passwordValidation.errors
    });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create admin user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin'
  });

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  logger.info('Initial admin user created', {
    userId: user._id,
    email: user.email
  });

  res.status(201).json({
    success: true,
    message: 'Initial admin user created successfully',
    data: {
      user,
      token
    }
  });
});