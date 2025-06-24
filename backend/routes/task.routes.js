import express from 'express';
import {
  getProjectTasks, getTaskById, createTask, updateTask, deleteTask, getMyTasks
} from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// Get users tasks
router.get('/my-tasks', getMyTasks);

// Get tasks for a specific project
router.get('/project/:projectId', requirePermission('tasks', 'read'), getProjectTasks);

// Create task (Admin/Manager)
router.post('/', requirePermission('tasks', 'create'), createTask);

// Get specific task
router.get('/:id', requirePermission('tasks', 'read'), getTaskById);

// Update task (Admin/Manager/Assigned user with restrictions)
router.put('/:id', requirePermission('tasks', 'update'), updateTask);

// Delete task (Admin/Manager)
router.delete('/:id', requirePermission('tasks', 'delete'), deleteTask);

export default router; 