// Task Controller: Handles task management operations
import Task from '../models/task.model.js';
import Project from '../models/project.model.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import * as logger from '../utils/logger.js';

export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 10, status, priority, assignedTo, search } = req.query;

  let query = { projectId };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      tasks,
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
 * Get task by ID
 * @route GET /api/tasks/:id
 * @access Private (Members of project)
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('projectId', 'name');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
});

/**
 * Create task
 * @route POST /api/tasks
 * @access Private (Admin/Manager of project)
 */
export const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    projectId,
    assignedTo,
    status,
    priority,
    dueDate,
    estimatedHours,
    tags
  } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!title || !projectId || !assignedTo) {
    return res.status(400).json({
      success: false,
      message: 'Title, project ID, and assigned user are required'
    });
  }

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Create task
  const task = await Task.create({
    title,
    description: description || '',
    projectId,
    assignedTo,
    createdBy: userId,
    status: status || 'Pending',
    priority: priority || 'Medium',
    dueDate,
    estimatedHours,
    tags: tags || []
  });

  // Update project task count
  await Project.findByIdAndUpdate(projectId, {
    $inc: { totalTasks: 1 }
  });

  // Populate the created task
  await task.populate('assignedTo', 'name email');
  await task.populate('createdBy', 'name email');
  await task.populate('projectId', 'name');

  logger.info('Task created', {
    taskId: task._id,
    projectId,
    createdBy: userId,
    assignedTo
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: {
      task
    }
  });
});

/**
 * Update task
 * @route PUT /api/tasks/:id
 * @access Private (Admin/Manager/Assigned user for status only)
 */
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Get current task
  const currentTask = await Task.findById(id);
  if (!currentTask) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // For members, only allow status updates on their own tasks
  if (userRole === 'member') {
    if (currentTask.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Members can only update their own assigned tasks'
      });
    }

    // Only allow status updates for members
    const allowedFields = ['status'];
    const updateFields = Object.keys(updateData);
    const hasUnallowedFields = updateFields.some(field => 
      !allowedFields.includes(field)
    );

    if (hasUnallowedFields) {
      return res.status(403).json({
        success: false,
        message: 'Members can only update task status'
      });
    }
  }

  // Handle task completion
  if (updateData.status === 'Done' && currentTask.status !== 'Done') {
    updateData.completedAt = new Date();
    
    // Update project completed tasks count
    await Project.findByIdAndUpdate(currentTask.projectId, {
      $inc: { completedTasks: 1 }
    });
  } else if (updateData.status !== 'Done' && currentTask.status === 'Done') {
    updateData.completedAt = null;
    
    // Decrease project completed tasks count
    await Project.findByIdAndUpdate(currentTask.projectId, {
      $inc: { completedTasks: -1 }
    });
  }

  // Update task
  const task = await Task.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('projectId', 'name');

  logger.info('Task updated', {
    taskId: id,
    updatedBy: userId,
    updatedFields: Object.keys(updateData)
  });

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: {
      task
    }
  });
});

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 * @access Private (Admin/Manager of project)
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Update project task counts
  const updateData = { $inc: { totalTasks: -1 } };
  if (task.status === 'Done') {
    updateData.$inc.completedTasks = -1;
  }
  
  await Project.findByIdAndUpdate(task.projectId, updateData);

  // Delete the task
  await Task.findByIdAndDelete(id);

  logger.warn('Task deleted', {
    taskId: id,
    projectId: task.projectId,
    deletedBy: req.user._id
  });

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

/**
 * Get user's assigned tasks
 * @route GET /api/tasks/my-tasks
 * @access Private
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority } = req.query;
  const userId = req.user._id;

  // Build query
  const query = { assignedTo: userId };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query
  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});