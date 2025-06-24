// Project Schema
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
  },
  
  description: {
    type: String,
    required: [true, 'Project description is required'],
  },
  
  status: {
    type: String,
    enum: {
      values: ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      message: 'Status must be one of: Planned, In Progress, Completed, On Hold, Cancelled'
    },
    default: 'Planned',
    required: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project creator is required']
  },
  
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['manager', 'member'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  startDate: {
    type: Date,
    default: null
  },
  
  endDate: {
    type: Date,
    default: null
  },
  
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Priority must be one of: Low, Medium, High, Critical'
    },
    default: 'Medium'
  },
  
  totalTasks: {
    type: Number,
    default: 0
  },
  
  completedTasks: {
    type: Number,
    default: 0
  },
  
  isArchived: {
    type: Boolean,
    default: false
  },
  
  archivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project; 