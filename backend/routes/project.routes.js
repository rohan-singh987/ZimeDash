import express from 'express';
import {getAllProjects, getProjectById, createProject, updateProject, deleteProject, addProjectMember, removeProjectMember} from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole, requirePermission } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('projects', 'read'), getAllProjects);

// Create project (Admin only)
router.post('/', requireRole('admin'), createProject);

// Get specific project
router.get('/:id', requirePermission('projects', 'read'), getProjectById);

// Update project (Admin/Manager with access)
router.put('/:id', requirePermission('projects', 'update'), updateProject);

// Delete project (Admin only)
router.delete('/:id', requireRole('admin'), deleteProject);

// Project member management
router.post('/:id/members', requirePermission('projects', 'update'), addProjectMember);
router.delete('/:id/members/:userId', requirePermission('projects', 'update'), removeProjectMember);

export default router; 