// Project Controller: Handles project management operations
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { hasGlobalAccess } from '../config/roles.js';
import * as logger from '../utils/logger.js';


/**
 * Get all projects
 * @route GET /api/projects
 * @access Private (Based on role)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Build query based on user role
  let query = {};

  // If not admin, only show projects where user is member or creator
  if (!hasGlobalAccess(userRole)) {
    query = {
      $or: [
        { createdBy: userId },
        { 'members.user': userId }
      ]
    };
  }

  // Add filters
  if (status) query.status = status;
  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // Execute query
  const projects = await Project.find(query)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      projects
    }
  });
});

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Private (Members of project)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      project
    }
  });
});

/**
 * Create project
 * @route POST /api/projects
 * @access Private (Admin only)
 */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, members, startDate, endDate, priority } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!name || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name and description are required'
    });
  }

  // Transform members array to proper format
  const formattedMembers = (members || []).map(userId => ({
    user: userId,
    role: 'member',
    addedAt: new Date()
  }));

  // Create project
  const project = await Project.create({
    name,
    description,
    status: status || 'Planned',
    createdBy: userId,
    members: formattedMembers,
    startDate,
    endDate,
    priority: priority || 'Medium'
  });

  // Populate the created project
  await project.populate('createdBy', 'name email');
  await project.populate('members.user', 'name email');

  logger.info('Project created', {
    projectId: project._id,
    createdBy: userId,
    projectName: name
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: {
      project
    }
  });
});

/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private (Admin/Manager of project)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.createdBy;
  delete updateData.totalTasks;
  delete updateData.completedTasks;

  // Transform members array if provided
  if (updateData.members && Array.isArray(updateData.members)) {
    updateData.members = updateData.members.map(member => {
      // If it's already an object with user property, keep it
      if (typeof member === 'object' && member.user) {
        return member;
      }
      // If it's a string (user ID), transform it
      if (typeof member === 'string') {
        return {
          user: member,
          role: 'member',
          addedAt: new Date()
        };
      }
      // Otherwise, keep as is
      return member;
    });
  }

  const project = await Project.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  logger.info('Project updated', {
    projectId: id,
    updatedBy: req.user._id,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: {
      project
    }
  });
});

/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private (Admin only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Delete all tasks associated with the project
  await Task.deleteMany({ projectId: id });

  // Delete the project
  await Project.findByIdAndDelete(id);

  logger.warn('Project deleted', {
    projectId: id,
    deletedBy: req.user._id,
    projectName: project.name
  });

  res.status(200).json({
    success: true,
    message: 'Project and associated tasks deleted successfully'
  });
});

/**
 * Add member to project
 * @route POST /api/projects/:id/members
 * @access Private (Admin/Manager of project)
 */
export const addProjectMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, role = 'member' } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user is already a member
  const existingMember = project.members.find(
    member => member.user.toString() === userId
  );

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this project'
    });
  }

  // Add member
  project.members.push({
    user: userId,
    role,
    addedAt: new Date()
  });

  await project.save();
  await project.populate('members.user', 'name email');

  logger.info('Member added to project', {
    projectId: id,
    addedUserId: userId,
    addedBy: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Member added successfully',
    data: {
      project
    }
  });
});

/**
 * Remove member from project
 * @route DELETE /api/projects/:id/members/:userId
 * @access Private (Admin/Manager of project)
 */
export const removeProjectMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Remove member
  project.members = project.members.filter(
    member => member.user.toString() !== userId
  );

  await project.save();

  logger.info('Member removed from project', {
    projectId: id,
    removedUserId: userId,
    removedBy: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Member removed successfully'
  });
}); 