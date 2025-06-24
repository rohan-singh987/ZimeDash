// User Schema
import mongoose from 'mongoose';
import { ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  
  role: {
    type: String,
    enum: {
      values: Object.values(ROLES),
      message: 'Role must be one of: admin, manager, member'
    },
    default: ROLES.MEMBER,
    required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  avatar: {
    type: String,
    default: null
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  resetPasswordToken: {
    type: String,
    default: null
  },
  
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

const User = mongoose.model('User', userSchema);

export default User; 