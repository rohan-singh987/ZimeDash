// Role-based authorization middleware
import { hasPermission, hasGlobalAccess } from '../config/roles.js';
import * as logger from '../utils/logger.js';

const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(userRole)) {
        logger.warn('Role access denied', {
          userId: req.user._id,
          userRole,
          requiredRoles: roles,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions. Required role: ' + roles.join(' or ')
        });
      }
      
      next();
    } catch (error) {
      logger.error('Role check failed', error);
      return res.status(500).json({
        success: false,
        message: 'Role authorization failed'
      });
    }
  };
};

// Check if user has permission for a specific resource and action
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!hasPermission(userRole, resource, action)) {
        logger.warn('Permission denied', {
          userId: req.user._id,
          userRole,
          resource,
          action,
          endpoint: req.originalUrl
        });
        
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Cannot ${action} ${resource}`
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check failed', error);
      return res.status(500).json({
        success: false,
        message: 'Permission authorization failed'
      });
    }
  };
};

export {
  requireRole,
  requirePermission
};