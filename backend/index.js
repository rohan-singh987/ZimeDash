import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDatabase from './config/database.js';
import * as logger from './utils/logger.js';

const PORT = process.env.PORT || 8000;

// Start the server
const startServer = async () => {
  try {
    await connectDatabase();
    logger.info('Database connected successfully');
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception! Shutting down...', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection! Shutting down...', error);
  process.exit(1);
});

startServer();
