// Task Schema
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
  },
  
  description: {
    type: String,
    default: ''
  },
  
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Ongoing', 'Done', 'Blocked'],
      message: 'Status must be one of: Pending, Ongoing, Done, Blocked'
    },
    default: 'Pending',
    required: true
  },
  
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: 'Priority must be one of: Low, Medium, High'
    },
    default: 'Medium',
    required: true
  },
  
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  
  dueDate: {
    type: Date,
    default: null
  },
  
  startDate: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    default: null
  },
  
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    default: null
  },
  
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],

  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

export default Task; 