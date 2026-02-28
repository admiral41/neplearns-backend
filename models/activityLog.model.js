const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Can be null for anonymous actions
  },
  userEmail: {
    type: String,
    required: false,
  },
  userName: {
    type: String,
    required: false,
  },
  userRole: {
    type: String,
    enum: ['STUDENT', 'LEARNER', 'LECTURER', 'ADMIN', 'SUPERADMIN', 'GUEST'],
    default: 'GUEST',
  },

  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      // Auth actions
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_REGISTER',
      'PASSWORD_RESET',
      'EMAIL_VERIFIED',

      // Course actions
      'COURSE_CREATED',
      'COURSE_UPDATED',
      'COURSE_DELETED',
      'COURSE_PUBLISHED',
      'COURSE_UNPUBLISHED',
      'COURSE_ENROLLED',
      'COURSE_UNENROLLED',

      // Lesson actions
      'LESSON_CREATED',
      'LESSON_UPDATED',
      'LESSON_DELETED',
      'LESSON_COMPLETED',

      // Week actions
      'WEEK_CREATED',
      'WEEK_UPDATED',
      'WEEK_DELETED',

      // Lecturer actions
      'LECTURER_APPLIED',
      'LECTURER_APPROVED',
      'LECTURER_REJECTED',
      'LECTURER_REAPPLIED',

      // Admin actions
      'ADMIN_CREATED_USER',
      'ADMIN_UPDATED_USER',
      'ADMIN_DELETED_USER',
      'ADMIN_UPDATED_SETTINGS',

      // Category actions
      'CATEGORY_CREATED',
      'CATEGORY_UPDATED',
      'CATEGORY_DELETED',

      // Live class actions
      'LIVE_CLASS_CREATED',
      'LIVE_CLASS_UPDATED',
      'LIVE_CLASS_DELETED',
      'LIVE_CLASS_STARTED',
      'LIVE_CLASS_ENDED',
      'LIVE_CLASS_JOINED',

      // Announcement actions
      'ANNOUNCEMENT_CREATED',
      'ANNOUNCEMENT_UPDATED',
      'ANNOUNCEMENT_DELETED',

      // Quiz actions
      'QUIZ_CREATED',
      'QUIZ_ATTEMPTED',
      'QUIZ_COMPLETED',

      // Other
      'OTHER',
    ],
  },

  // Category of the action for filtering
  category: {
    type: String,
    enum: ['AUTH', 'COURSE', 'LESSON', 'WEEK', 'LECTURER', 'ADMIN', 'CATEGORY', 'LIVE_CLASS', 'ANNOUNCEMENT', 'QUIZ', 'OTHER'],
    required: true,
  },

  // Description of what happened
  description: {
    type: String,
    required: true,
  },

  // Related entity details
  targetType: {
    type: String,
    enum: ['User', 'Course', 'Lesson', 'Week', 'Lecturer', 'Category', 'LiveClass', 'Announcement', 'Quiz', 'Settings', 'Other'],
    required: false,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  targetName: {
    type: String,
    required: false,
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Request info
  ipAddress: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },

  // Status of the action
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS',
  },

}, {
  timestamps: true,
});

// Indexes for efficient querying
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });

// Static method to log an activity
activityLogSchema.statics.log = async function({
  user,
  action,
  category,
  description,
  targetType,
  targetId,
  targetName,
  metadata,
  ipAddress,
  userAgent,
  status = 'SUCCESS',
}) {
  try {
    const logEntry = {
      action,
      category,
      description,
      targetType,
      targetId,
      targetName,
      metadata,
      ipAddress,
      userAgent,
      status,
    };

    if (user) {
      logEntry.user = user._id || user;
      logEntry.userEmail = user.email;
      logEntry.userName = user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : undefined;
      logEntry.userRole = user.roles?.[0] || 'GUEST';
    }

    return await this.create(logEntry);
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw - logging should not break the main flow
    return null;
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
