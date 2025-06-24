// Authentication middleware
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import User from '../models/user.model.js';
import * as logger from '../utils/logger.js';

const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User account is deactivated.'
      });
    }
    
    req.user = user;
    req.token = token;
    
    logger.debug('User authenticated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role
    });
    
    next();
    
  } catch (error) {
    logger.error('Authentication failed', error);
    
    // Handle specific token errors
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token has expired.'
      });
    }
    
    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    // Authentication error
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication failed.'
    });
  }
};

export {
  authenticate
}; 