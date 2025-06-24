import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import * as logger from './utils/logger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.logRequest(req, res.statusCode, responseTime);
  });
  
  next();
});

// Health check and API info routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Project Management API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      projects: '/api/projects',
      tasks: '/api/tasks',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);

app.use(errorHandler);

export default app; 