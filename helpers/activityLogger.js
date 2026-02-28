const ActivityLog = require('../models/activityLog.model');

/**
 * Helper function to log activity
 * Use this throughout the application to log user actions
 */
const logActivity = async ({
  req,
  user,
  action,
  category,
  description,
  targetType,
  targetId,
  targetName,
  metadata = {},
  status = 'SUCCESS',
}) => {
  try {
    // Get IP and user agent from request if available
    let ipAddress, userAgent;
    if (req) {
      ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
      userAgent = req.headers['user-agent'];
    }

    // If user not provided but req has user, use that
    const logUser = user || req?.user;

    return await ActivityLog.log({
      user: logUser,
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
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    return null;
  }
};

// Convenience methods for common actions

const logAuth = {
  login: (req, user, success = true) => logActivity({
    req,
    user,
    action: 'USER_LOGIN',
    category: 'AUTH',
    description: success ? `User ${user.email} logged in` : `Failed login attempt for ${user?.email || 'unknown'}`,
    status: success ? 'SUCCESS' : 'FAILED',
  }),

  logout: (req, user) => logActivity({
    req,
    user,
    action: 'USER_LOGOUT',
    category: 'AUTH',
    description: `User ${user.email} logged out`,
  }),

  register: (req, user, role = 'STUDENT') => logActivity({
    req,
    user,
    action: 'USER_REGISTER',
    category: 'AUTH',
    description: `New ${role.toLowerCase()} registered: ${user.email}`,
    targetType: 'User',
    targetId: user._id,
    targetName: `${user.firstname} ${user.lastname}`,
  }),

  emailVerified: (req, user) => logActivity({
    req,
    user,
    action: 'EMAIL_VERIFIED',
    category: 'AUTH',
    description: `Email verified for ${user.email}`,
    targetType: 'User',
    targetId: user._id,
  }),

  passwordReset: (req, user) => logActivity({
    req,
    user,
    action: 'PASSWORD_RESET',
    category: 'AUTH',
    description: `Password reset for ${user.email}`,
    targetType: 'User',
    targetId: user._id,
  }),
};

const logCourse = {
  created: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_CREATED',
    category: 'COURSE',
    description: `Course "${course.courseTitle}" created`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),

  updated: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_UPDATED',
    category: 'COURSE',
    description: `Course "${course.courseTitle}" updated`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),

  deleted: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_DELETED',
    category: 'COURSE',
    description: `Course "${course.courseTitle}" deleted`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),

  published: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_PUBLISHED',
    category: 'COURSE',
    description: `Course "${course.courseTitle}" published`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),

  unpublished: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_UNPUBLISHED',
    category: 'COURSE',
    description: `Course "${course.courseTitle}" unpublished`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),

  enrolled: (req, user, course) => logActivity({
    req,
    user,
    action: 'COURSE_ENROLLED',
    category: 'COURSE',
    description: `User enrolled in course "${course.courseTitle}"`,
    targetType: 'Course',
    targetId: course._id,
    targetName: course.courseTitle,
  }),
};

const logLecturer = {
  applied: (req, user) => logActivity({
    req,
    user,
    action: 'LECTURER_APPLIED',
    category: 'LECTURER',
    description: `${user.email} applied to become a lecturer`,
    targetType: 'User',
    targetId: user._id,
    targetName: `${user.firstname} ${user.lastname}`,
  }),

  approved: (req, admin, lecturer) => logActivity({
    req,
    user: admin,
    action: 'LECTURER_APPROVED',
    category: 'LECTURER',
    description: `Lecturer application approved for ${lecturer.email}`,
    targetType: 'User',
    targetId: lecturer._id,
    targetName: `${lecturer.firstname} ${lecturer.lastname}`,
  }),

  rejected: (req, admin, lecturer, reason) => logActivity({
    req,
    user: admin,
    action: 'LECTURER_REJECTED',
    category: 'LECTURER',
    description: `Lecturer application rejected for ${lecturer.email}`,
    targetType: 'User',
    targetId: lecturer._id,
    targetName: `${lecturer.firstname} ${lecturer.lastname}`,
    metadata: { reason },
  }),

  reapplied: (req, user) => logActivity({
    req,
    user,
    action: 'LECTURER_REAPPLIED',
    category: 'LECTURER',
    description: `${user.email} reapplied as a lecturer`,
    targetType: 'User',
    targetId: user._id,
  }),
};

const logAdmin = {
  createdUser: (req, admin, newUser) => logActivity({
    req,
    user: admin,
    action: 'ADMIN_CREATED_USER',
    category: 'ADMIN',
    description: `Admin created user: ${newUser.email}`,
    targetType: 'User',
    targetId: newUser._id,
    targetName: `${newUser.firstname} ${newUser.lastname}`,
  }),

  updatedUser: (req, admin, targetUser) => logActivity({
    req,
    user: admin,
    action: 'ADMIN_UPDATED_USER',
    category: 'ADMIN',
    description: `Admin updated user: ${targetUser.email}`,
    targetType: 'User',
    targetId: targetUser._id,
    targetName: `${targetUser.firstname} ${targetUser.lastname}`,
  }),

  deletedUser: (req, admin, targetUser) => logActivity({
    req,
    user: admin,
    action: 'ADMIN_DELETED_USER',
    category: 'ADMIN',
    description: `Admin deleted user: ${targetUser.email}`,
    targetType: 'User',
    targetId: targetUser._id,
    targetName: `${targetUser.firstname} ${targetUser.lastname}`,
  }),

  updatedSettings: (req, admin, settingName) => logActivity({
    req,
    user: admin,
    action: 'ADMIN_UPDATED_SETTINGS',
    category: 'ADMIN',
    description: `Admin updated settings: ${settingName}`,
    targetType: 'Settings',
    targetName: settingName,
  }),
};

const logLiveClass = {
  created: (req, user, liveClass) => logActivity({
    req,
    user,
    action: 'LIVE_CLASS_CREATED',
    category: 'LIVE_CLASS',
    description: `Live class "${liveClass.title}" created`,
    targetType: 'LiveClass',
    targetId: liveClass._id,
    targetName: liveClass.title,
  }),

  started: (req, user, liveClass) => logActivity({
    req,
    user,
    action: 'LIVE_CLASS_STARTED',
    category: 'LIVE_CLASS',
    description: `Live class "${liveClass.title}" started`,
    targetType: 'LiveClass',
    targetId: liveClass._id,
    targetName: liveClass.title,
  }),

  ended: (req, user, liveClass) => logActivity({
    req,
    user,
    action: 'LIVE_CLASS_ENDED',
    category: 'LIVE_CLASS',
    description: `Live class "${liveClass.title}" ended`,
    targetType: 'LiveClass',
    targetId: liveClass._id,
    targetName: liveClass.title,
  }),

  joined: (req, user, liveClass) => logActivity({
    req,
    user,
    action: 'LIVE_CLASS_JOINED',
    category: 'LIVE_CLASS',
    description: `User joined live class "${liveClass.title}"`,
    targetType: 'LiveClass',
    targetId: liveClass._id,
    targetName: liveClass.title,
  }),
};

module.exports = {
  logActivity,
  logAuth,
  logCourse,
  logLecturer,
  logAdmin,
  logLiveClass,
};
