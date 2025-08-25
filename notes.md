# THINGS I HAVE LEARNED:
- app init setup
- logger [file-wise]
- folder structure
- .env usage [production-level]
- model creation

# THINGS I HAVE IMPLEMENTED:
- server.js
- app.js
- env.js
- logger [utils] & [logs]
- models














/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


















// src/controllers/taskController.js
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { isValidObjectId, sanitizeInput, isValidURL } = require('../utils/validators');
const { getPaginationInfo, isEmpty } = require('../utils/helpers');
const { TASK_STATUS, PAGINATION, MESSAGES } = require('../config/constants');

/**
 * @desc    Get all tasks with filtering, pagination, and search
 * @route   GET /api/tasks
 * @access  Public
 */
const getTasks = async (req, res) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query object
    const query = {};

    // Status filter
    if (status && Object.values(TASK_STATUS).includes(status)) {
      query.status = status;
    }

    // Search functionality (case-insensitive)
    if (search && search.trim()) {
      query.$or = [
        { label: { $regex: search.trim(), $options: 'i' } },
        { note: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.dateAssigned = {};
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          query.dateAssigned.$gte = fromDate;
        }
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          // Set to end of day
          toDate.setHours(23, 59, 59, 999);
          query.dateAssigned.$lte = toDate;
        }
      }
    }

    // Build sort object
    const sortObj = {};
    const allowedSortFields = ['createdAt', 'updatedAt', 'dateAssigned', 'label', 'status', 'index'];
    if (allowedSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    // Execute query with aggregation for better performance
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Use lean() for better performance
      Task.countDocuments(query),
    ]);

    // Generate pagination info
    const pagination = getPaginationInfo(pageNum, limitNum, totalCount);

    logger.info('Tasks retrieved successfully', {
      query: query,
      count: tasks.length,
      totalCount,
      page: pageNum,
    });

    return ApiResponse.paginated(res, tasks, pagination, MESSAGES.SUCCESS.FETCH);
  } catch (error) {
    logger.error('Error retrieving tasks:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return ApiResponse.error(res, 'Invalid task ID format', 400);
    }

    const task = await Task.findById(id);

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    logger.info('Task retrieved by ID', { taskId: id });

    return ApiResponse.success(res, task, MESSAGES.SUCCESS.FETCH);
  } catch (error) {
    logger.error('Error retrieving task by ID:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Public
 */
const createTask = async (req, res) => {
  try {
    // Sanitize input data
    const allowedFields = ['label', 'link', 'note', 'status', 'index', 'dateAssigned'];
    const taskData = sanitizeInput(req.body, allowedFields);

    // Validation
    const validationErrors = [];

    // Required field validation
    if (!taskData.label || taskData.label.trim().length === 0) {
      validationErrors.push('Task label is required');
    }

    // Label length validation
    if (taskData.label && taskData.label.trim().length > 200) {
      validationErrors.push('Task label cannot exceed 200 characters');
    }

    // URL validation
    if (taskData.link && !isValidURL(taskData.link)) {
      validationErrors.push('Invalid URL format for link');
    }

    // Status validation
    if (taskData.status && !Object.values(TASK_STATUS).includes(taskData.status)) {
      validationErrors.push(`Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`);
    }

    // Note length validation
    if (taskData.note && taskData.note.length > 1000) {
      validationErrors.push('Note cannot exceed 1000 characters');
    }

    // Index validation
    if (taskData.index !== undefined && (isNaN(taskData.index) || taskData.index < 0)) {
      validationErrors.push('Index must be a non-negative number');
    }

    // Date validation
    if (taskData.dateAssigned) {
      const assignedDate = new Date(taskData.dateAssigned);
      if (isNaN(assignedDate.getTime())) {
        validationErrors.push('Invalid date format for dateAssigned');
      }
    }

    if (validationErrors.length > 0) {
      return ApiResponse.validationError(res, validationErrors);
    }

    // Set default values
    if (!taskData.status) {
      taskData.status = TASK_STATUS.PENDING;
    }

    if (!taskData.dateAssigned) {
      taskData.dateAssigned = new Date();
    }

    if (taskData.index === undefined) {
      // Get the highest index and increment
      const lastTask = await Task.findOne().sort({ index: -1 }).select('index');
      taskData.index = lastTask ? lastTask.index + 1 : 0;
    }

    // Create task
    const task = new Task(taskData);
    await task.save();

    logger.info('Task created successfully', {
      taskId: task._id,
      label: task.label,
    });

    return ApiResponse.success(res, task, MESSAGES.SUCCESS.CREATE, 201);
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ApiResponse.error(res, `${field} already exists`, 409);
    }

    logger.error('Error creating task:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Update task by ID
 * @route   PUT /api/tasks/:id
 * @access  Public
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return ApiResponse.error(res, 'Invalid task ID format', 400);
    }

    // Sanitize input data
    const allowedFields = ['label', 'link', 'note', 'status', 'index', 'dateAssigned'];
    const updateData = sanitizeInput(req.body, allowedFields);

    // Remove empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null) {
        delete updateData[key];
      }
    });

    if (isEmpty(updateData)) {
      return ApiResponse.error(res, 'No valid fields to update', 400);
    }

    // Validation
    const validationErrors = [];

    // Label validation
    if (updateData.label !== undefined) {
      if (!updateData.label || updateData.label.trim().length === 0) {
        validationErrors.push('Task label cannot be empty');
      } else if (updateData.label.trim().length > 200) {
        validationErrors.push('Task label cannot exceed 200 characters');
      }
    }

    // URL validation
    if (updateData.link !== undefined && updateData.link && !isValidURL(updateData.link)) {
      validationErrors.push('Invalid URL format for link');
    }

    // Status validation
    if (updateData.status && !Object.values(TASK_STATUS).includes(updateData.status)) {
      validationErrors.push(`Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`);
    }

    // Note length validation
    if (updateData.note && updateData.note.length > 1000) {
      validationErrors.push('Note cannot exceed 1000 characters');
    }

    // Index validation
    if (updateData.index !== undefined && (isNaN(updateData.index) || updateData.index < 0)) {
      validationErrors.push('Index must be a non-negative number');
    }

    // Date validation
    if (updateData.dateAssigned) {
      const assignedDate = new Date(updateData.dateAssigned);
      if (isNaN(assignedDate.getTime())) {
        validationErrors.push('Invalid date format for dateAssigned');
      }
    }

    if (validationErrors.length > 0) {
      return ApiResponse.validationError(res, validationErrors);
    }

    // Find and update task
    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true, // Run mongoose validators
      }
    );

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    logger.info('Task updated successfully', {
      taskId: id,
      updatedFields: Object.keys(updateData),
    });

    return ApiResponse.success(res, task, MESSAGES.SUCCESS.UPDATE);
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ApiResponse.error(res, `${field} already exists`, 409);
    }

    logger.error('Error updating task:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Delete task by ID
 * @route   DELETE /api/tasks/:id
 * @access  Public
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return ApiResponse.error(res, 'Invalid task ID format', 400);
    }

    const task = await Task.findById(id);

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    await Task.findByIdAndDelete(id);

    logger.info('Task deleted successfully', {
      taskId: id,
      label: task.label,
    });

    return ApiResponse.success(res, null, MESSAGES.SUCCESS.DELETE);
  } catch (error) {
    logger.error('Error deleting task:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Update task status
 * @route   PATCH /api/tasks/:id/status
 * @access  Public
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return ApiResponse.error(res, 'Invalid task ID format', 400);
    }

    // Validate status
    if (!status || !Object.values(TASK_STATUS).includes(status)) {
      return ApiResponse.error(res, `Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`, 400);
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return ApiResponse.notFound(res, 'Task');
    }

    logger.info('Task status updated', {
      taskId: id,
      newStatus: status,
    });

    return ApiResponse.success(res, task, 'Task status updated successfully');
  } catch (error) {
    logger.error('Error updating task status:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Public
 */
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: '$count' },
          statusBreakdown: {
            $push: {
              status: '$_id',
              count: '$count',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          statusBreakdown: 1,
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalTasks: 0,
      statusBreakdown: [],
    };

    // Ensure all statuses are included
    const statusCounts = {};
    Object.values(TASK_STATUS).forEach(status => {
      statusCounts[status] = 0;
    });

    result.statusBreakdown.forEach(item => {
      statusCounts[item.status] = item.count;
    });

    result.statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    logger.info('Task statistics retrieved');

    return ApiResponse.success(res, result, 'Task statistics retrieved successfully');
  } catch (error) {
    logger.error('Error getting task statistics:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Bulk update tasks
 * @route   PUT /api/tasks/bulk
 * @access  Public
 */
const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, updateData } = req.body;

    // Validation
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return ApiResponse.error(res, 'taskIds must be a non-empty array', 400);
    }

    if (!updateData || isEmpty(updateData)) {
      return ApiResponse.error(res, 'updateData is required', 400);
    }

    // Validate all task IDs
    const invalidIds = taskIds.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return ApiResponse.error(res, `Invalid task IDs: ${invalidIds.join(', ')}`, 400);
    }

    // Sanitize update data
    const allowedFields = ['status', 'index', 'note'];
    const sanitizedData = sanitizeInput(updateData, allowedFields);

    if (isEmpty(sanitizedData)) {
      return ApiResponse.error(res, 'No valid fields to update', 400);
    }

    // Validate status if provided
    if (sanitizedData.status && !Object.values(TASK_STATUS).includes(sanitizedData.status)) {
      return ApiResponse.error(res, `Invalid status: ${sanitizedData.status}`, 400);
    }

    // Perform bulk update
    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: sanitizedData }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.notFound(res, 'Tasks');
    }

    logger.info('Bulk task update completed', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      updateData: sanitizedData,
    });

    return ApiResponse.success(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    }, `${result.modifiedCount} tasks updated successfully`);
  } catch (error) {
    logger.error('Error in bulk task update:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

/**
 * @desc    Reorder tasks
 * @route   PUT /api/tasks/reorder
 * @access  Public
 */
const reorderTasks = async (req, res) => {
  try {
    const { taskOrders } = req.body;

    // Validation
    if (!Array.isArray(taskOrders) || taskOrders.length === 0) {
      return ApiResponse.error(res, 'taskOrders must be a non-empty array', 400);
    }

    // Validate structure: [{ id, index }]
    const validationErrors = [];
    taskOrders.forEach((item, i) => {
      if (!item.id || !isValidObjectId(item.id)) {
        validationErrors.push(`Invalid task ID at index ${i}`);
      }
      if (item.index === undefined || isNaN(item.index) || item.index < 0) {
        validationErrors.push(`Invalid index at position ${i}`);
      }
    });

    if (validationErrors.length > 0) {
      return ApiResponse.validationError(res, validationErrors);
    }

    // Perform bulk updates
    const updatePromises = taskOrders.map(item =>
      Task.findByIdAndUpdate(item.id, { index: item.index })
    );

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(result => result !== null).length;

    logger.info('Task reordering completed', {
      totalItems: taskOrders.length,
      successCount,
    });

    return ApiResponse.success(res, {
      totalItems: taskOrders.length,
      successCount,
    }, `${successCount} tasks reordered successfully`);
  } catch (error) {
    logger.error('Error reordering tasks:', error);
    return ApiResponse.error(res, MESSAGES.ERROR.SERVER_ERROR);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
  bulkUpdateTasks,
  reorderTasks,
};


















/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
























// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    dob: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

// Virtual to calculate age from dob
userSchema.virtual("calculatedAge").get(function () {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
  return null;
});

// Pre-save middleware to update age
userSchema.pre("save", function (next) {
  if (this.dob) {
    this.age = this.calculatedAge;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);

// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty links
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
            v
          );
        },
        message: "Please enter a valid URL",
      },
    },
    dateAssigned: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
taskSchema.index({ status: 1, dateAssigned: 1 });

module.exports = mongoose.model("Task", taskSchema);

// models/Template.js
const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
      },
    ],
    days: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
  },
  {
    timestamps: true,
  }
);

// Method to populate tasks
templateSchema.methods.getWithTasks = function () {
  return this.populate("tasks");
};

module.exports = mongoose.model("Template", templateSchema);

// models/Plan.js
const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTD: {
      type: Date,
      required: true,
    },
    endTD: {
      type: Date,
      required: true,
    },
    tasks: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        // Embedded task data for faster queries and historical data preservation
        label: String,
        link: String,
        dateAssigned: Date,
        note: String,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed", "cancelled"],
          default: "pending",
        },
        index: Number,
        completedAt: Date,
        // Original task reference for updates
        originalTaskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate that endTD is after startTD
planSchema.pre("save", function (next) {
  if (this.endTD <= this.startTD) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

// Index for better query performance
planSchema.index({ uid: 1, startTD: 1 });
planSchema.index({ uid: 1, "tasks.status": 1 });

// Method to get active tasks
planSchema.methods.getActiveTasks = function () {
  return this.tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled"
  );
};

// Method to get completion percentage
planSchema.methods.getCompletionPercentage = function () {
  if (this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(
    (task) => task.status === "completed"
  ).length;
  return Math.round((completedTasks / this.tasks.length) * 100);
};

module.exports = mongoose.model("Plan", planSchema);

// Database connection setup (db/connection.js)
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

// Example usage in your main app file (app.js or server.js)
/*
const express = require('express');
const connectDB = require('./db/connection');
require('dotenv').config();

// Connect to database
connectDB();

// Import models
const User = require('./models/User');
const Task = require('./models/Task');
const Template = require('./models/Template');
const Plan = require('./models/Plan');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example routes
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const template = new Template(req.body);
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/plans', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////




