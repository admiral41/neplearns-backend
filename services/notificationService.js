const Notification = require('../models/notification.model');
const FCM = require('../models/fcm');
const User = require('../models/user.model');
const firebase = require('../configs/firebase');
const socketManager = require('../socket/socketManager');

/**
 * Notification Service
 * Handles both real-time (Socket.IO) and push (FCM) notifications
 */

// ======================= NOTIFICATION TYPES =======================
const NOTIFICATION_TYPES = {
  NEW_LEARNER_REGISTRATION: 'new_learner_registration',
  NEW_LECTURER_APPLICATION: 'new_lecturer_application',
  LECTURER_APPROVED: 'lecturer_approved',
  LECTURER_REJECTED: 'lecturer_rejected',
  NEW_COURSE_PUBLISHED: 'new_course_published',
  COURSE_ENROLLED: 'course_enrolled',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_UNSUSPENDED: 'account_unsuspended',
  SESSION_REMINDER_24H: 'session_reminder_24h',
  SESSION_REMINDER_1H: 'session_reminder_1h',
  NEW_TUTORING_REQUEST: 'new_tutoring_request',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  ASSIGNMENT_CREATED: 'assignment_created',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ASSIGNMENT_REVIEWED: 'assignment_reviewed',
  ASSIGNMENT_REVISION_REQUESTED: 'assignment_revision_requested',
  INSTRUCTOR_ASSIGNED: 'instructor_assigned',
  NEW_STUDENT_ASSIGNED: 'new_student_assigned'
};

// ======================= CORE NOTIFICATION FUNCTIONS =======================

/**
 * Send notification to a user (both real-time and push)
 * @param {string} userId - Recipient user ID
 * @param {object} notification - Notification data
 * @param {object} options - Additional options
 */
const sendToUser = async (userId, notification, options = {}) => {
  const { saveToDB = true, sendPush = true, sendSocket = true } = options;

  try {
    let savedNotification = null;

    // Save to database
    if (saveToDB) {
      savedNotification = await Notification.create({
        recipient: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        actionUrl: notification.actionUrl,
        icon: notification.icon
      });
    }

    // Send real-time notification via Socket.IO
    if (sendSocket) {
      socketManager.emitToUser(userId, 'notification', {
        id: savedNotification?._id?.toString(),
        ...notification,
        createdAt: savedNotification?.createdAt || new Date()
      });
    }

    // Send push notification via FCM
    if (sendPush) {
      await sendPushToUser(userId, notification);
    }

    return savedNotification;
  } catch (error) {
    console.error('Failed to send notification to user:', error);
    throw error;
  }
};

/**
 * Send notification to all admins
 * @param {object} notification - Notification data
 * @param {object} options - Additional options
 */
const sendToAdmins = async (notification, options = {}) => {
  const { saveToDB = true, sendPush = true, sendSocket = true } = options;

  try {
    // Get all admin users
    const admins = await User.find({
      roles: { $in: ['ADMIN', 'SUPERADMIN'] },
      isSuspended: false
    }).select('_id');

    const adminIds = admins.map((admin) => admin._id);

    let savedNotifications = [];

    // Save to database for each admin
    if (saveToDB && adminIds.length > 0) {
      savedNotifications = await Notification.createForMultiple(adminIds, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        targetRole: 'ADMIN'
      });
    }

    // Send real-time notification via Socket.IO to each user with their notification ID
    if (sendSocket) {
      if (savedNotifications.length > 0) {
        // Emit to each user individually with their notification ID
        savedNotifications.forEach((savedNotif) => {
          socketManager.emitToUser(savedNotif.recipient.toString(), 'notification', {
            id: savedNotif._id.toString(),
            ...notification,
            createdAt: savedNotif.createdAt || new Date()
          });
        });
      } else {
        // Fallback: emit to room without ID if not saved to DB
        socketManager.emitToAdmins('notification', {
          ...notification,
          createdAt: new Date()
        });
      }
    }

    // Send push notification to all admins
    if (sendPush) {
      await sendPushToUsers(adminIds, notification);
    }

    return { sentTo: adminIds.length };
  } catch (error) {
    console.error('Failed to send notification to admins:', error);
    throw error;
  }
};

/**
 * Send notification to all lecturers
 * @param {object} notification - Notification data
 * @param {object} options - Additional options
 */
const sendToLecturers = async (notification, options = {}) => {
  const { saveToDB = true, sendPush = true, sendSocket = true } = options;

  try {
    const lecturers = await User.find({
      roles: { $in: ['LECTURER'] },
      isSuspended: false
    }).select('_id');

    const lecturerIds = lecturers.map((l) => l._id);

    let savedNotifications = [];

    if (saveToDB && lecturerIds.length > 0) {
      savedNotifications = await Notification.createForMultiple(lecturerIds, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        targetRole: 'LECTURER'
      });
    }

    if (sendSocket) {
      if (savedNotifications.length > 0) {
        // Emit to each user individually with their notification ID
        savedNotifications.forEach((savedNotif) => {
          socketManager.emitToUser(savedNotif.recipient.toString(), 'notification', {
            id: savedNotif._id.toString(),
            ...notification,
            createdAt: savedNotif.createdAt || new Date()
          });
        });
      } else {
        socketManager.emitToLecturers('notification', {
          ...notification,
          createdAt: new Date()
        });
      }
    }

    if (sendPush) {
      await sendPushToUsers(lecturerIds, notification);
    }

    return { sentTo: lecturerIds.length };
  } catch (error) {
    console.error('Failed to send notification to lecturers:', error);
    throw error;
  }
};

/**
 * Send notification to all learners
 * @param {object} notification - Notification data
 * @param {object} options - Additional options
 */
const sendToLearners = async (notification, options = {}) => {
  const { saveToDB = true, sendPush = true, sendSocket = true } = options;

  try {
    const learners = await User.find({
      roles: { $in: ['LEARNER'] },
      isSuspended: false
    }).select('_id');

    const learnerIds = learners.map((l) => l._id);

    let savedNotifications = [];

    if (saveToDB && learnerIds.length > 0) {
      savedNotifications = await Notification.createForMultiple(learnerIds, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        targetRole: 'LEARNER'
      });
    }

    if (sendSocket) {
      if (savedNotifications.length > 0) {
        // Emit to each user individually with their notification ID
        savedNotifications.forEach((savedNotif) => {
          socketManager.emitToUser(savedNotif.recipient.toString(), 'notification', {
            id: savedNotif._id.toString(),
            ...notification,
            createdAt: savedNotif.createdAt || new Date()
          });
        });
      } else {
        socketManager.emitToLearners('notification', {
          ...notification,
          createdAt: new Date()
        });
      }
    }

    if (sendPush) {
      await sendPushToUsers(learnerIds, notification);
    }

    return { sentTo: learnerIds.length };
  } catch (error) {
    console.error('Failed to send notification to learners:', error);
    throw error;
  }
};

/**
 * Broadcast notification to all users
 * @param {object} notification - Notification data
 * @param {object} options - Additional options
 */
const broadcast = async (notification, options = {}) => {
  const { saveToDB = true, sendPush = true, sendSocket = true } = options;

  try {
    const users = await User.find({ isSuspended: false }).select('_id');
    const userIds = users.map((u) => u._id);

    let savedNotifications = [];

    if (saveToDB && userIds.length > 0) {
      savedNotifications = await Notification.createForMultiple(userIds, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        actionUrl: notification.actionUrl,
        icon: notification.icon
      });
    }

    if (sendSocket) {
      if (savedNotifications.length > 0) {
        // Emit to each user individually with their notification ID
        savedNotifications.forEach((savedNotif) => {
          socketManager.emitToUser(savedNotif.recipient.toString(), 'notification', {
            id: savedNotif._id.toString(),
            ...notification,
            createdAt: savedNotif.createdAt || new Date()
          });
        });
      } else {
        socketManager.emitToAll('notification', {
          ...notification,
          createdAt: new Date()
        });
      }
    }

    if (sendPush) {
      // Send to FCM topic for broadcast
      await firebase.sendToTopic('all_users', {
        title: notification.title,
        body: notification.message,
        data: notification.data || {},
        clickAction: notification.actionUrl
      });
    }

    return { sentTo: userIds.length };
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
    throw error;
  }
};

// ======================= FCM PUSH HELPERS =======================

/**
 * Send push notification to a single user
 * @param {string} userId - User ID
 * @param {object} notification - Notification data
 */
const sendPushToUser = async (userId, notification) => {
  try {
    const fcmRecord = await FCM.findOne({ user_id: userId });
    if (!fcmRecord || !fcmRecord.fcm_token || fcmRecord.fcm_token.length === 0) {
      return null;
    }

    const results = await Promise.allSettled(
      fcmRecord.fcm_token.map((token) =>
        firebase.sendToDevice(token, {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
          clickAction: notification.actionUrl
        })
      )
    );

    // Remove invalid tokens
    const invalidTokens = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        invalidTokens.push(fcmRecord.fcm_token[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await FCM.updateOne(
        { user_id: userId },
        { $pull: { fcm_token: { $in: invalidTokens } } }
      );
    }

    return results;
  } catch (error) {
    console.error('Failed to send push to user:', error);
    return null;
  }
};

/**
 * Send push notification to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {object} notification - Notification data
 */
const sendPushToUsers = async (userIds, notification) => {
  try {
    const fcmRecords = await FCM.find({ user_id: { $in: userIds } });
    const allTokens = fcmRecords.flatMap((record) => record.fcm_token);

    if (allTokens.length === 0) {
      return null;
    }

    // FCM has a limit of 500 tokens per request
    const batchSize = 500;
    const batches = [];
    for (let i = 0; i < allTokens.length; i += batchSize) {
      batches.push(allTokens.slice(i, i + batchSize));
    }

    const results = await Promise.allSettled(
      batches.map((tokens) =>
        firebase.sendToMultipleDevices(tokens, {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
          clickAction: notification.actionUrl
        })
      )
    );

    return results;
  } catch (error) {
    console.error('Failed to send push to users:', error);
    return null;
  }
};

// ======================= SPECIFIC NOTIFICATION FUNCTIONS =======================

/**
 * Notify admins about new learner registration
 */
const notifyNewLearnerRegistration = async (user) => {
  return sendToAdmins({
    type: NOTIFICATION_TYPES.NEW_LEARNER_REGISTRATION,
    title: 'New Student Registration',
    message: `${user.firstname} ${user.lastname} has registered as a student.`,
    data: {
      userId: user._id.toString(),
      userEmail: user.email
    },
    actionUrl: '/admin/users',
    icon: 'user-plus'
  });
};

/**
 * Notify admins about new lecturer application
 */
const notifyNewLecturerApplication = async (user, lecturerRequest) => {
  return sendToAdmins({
    type: NOTIFICATION_TYPES.NEW_LECTURER_APPLICATION,
    title: 'New Instructor Application',
    message: `${user.firstname} ${user.lastname} has applied to become an instructor.`,
    data: {
      userId: user._id.toString(),
      userEmail: user.email,
      applicationId: lecturerRequest._id.toString()
    },
    actionUrl: '/admin-dashboard/applications',
    icon: 'briefcase'
  });
};

/**
 * Notify lecturer about application approval
 */
const notifyLecturerApproved = async (user) => {
  return sendToUser(user._id.toString(), {
    type: NOTIFICATION_TYPES.LECTURER_APPROVED,
    title: 'Application Approved!',
    message: 'Congratulations! Your instructor application has been approved. You can now access the instructor dashboard.',
    data: {
      userId: user._id.toString()
    },
    actionUrl: '/instructor-dashboard',
    icon: 'check-circle'
  });
};

/**
 * Notify lecturer about application rejection
 */
const notifyLecturerRejected = async (user, reason = '') => {
  return sendToUser(user._id.toString(), {
    type: NOTIFICATION_TYPES.LECTURER_REJECTED,
    title: 'Application Update',
    message: reason || 'Your instructor application has been reviewed. Please check your email for details.',
    data: {
      userId: user._id.toString(),
      reason
    },
    actionUrl: '/lecturer/application-status',
    icon: 'info'
  });
};

/**
 * Notify learners about new course
 */
const notifyNewCoursePublished = async (course) => {
  return sendToLearners({
    type: NOTIFICATION_TYPES.NEW_COURSE_PUBLISHED,
    title: 'New Course Available',
    message: `A new course "${course.title}" is now available.`,
    data: {
      courseId: course._id.toString(),
      courseTitle: course.title
    },
    actionUrl: `/courses/${course.slug || course._id}`,
    icon: 'book-open'
  });
};

/**
 * Send announcement to specific role or all users
 */
const sendAnnouncement = async (announcement, targetRole = null) => {
  const notification = {
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    title: announcement.title,
    message: announcement.message,
    data: announcement.data || {},
    actionUrl: announcement.actionUrl,
    icon: 'megaphone'
  };

  switch (targetRole) {
    case 'ADMIN':
      return sendToAdmins(notification);
    case 'LECTURER':
      return sendToLecturers(notification);
    case 'LEARNER':
      return sendToLearners(notification);
    default:
      return broadcast(notification);
  }
};

/**
 * Notify user about upcoming session
 * @param {Object} session - Populated session with student, instructor, subject
 * @param {string} reminderType - '24h' or '1h'
 */
const notifySessionReminder = async (session, reminderType) => {
  const timeText = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
  const title = reminderType === '24h' ? 'Session Tomorrow' : 'Session Starting Soon';
  const notificationType = reminderType === '24h'
    ? NOTIFICATION_TYPES.SESSION_REMINDER_24H
    : NOTIFICATION_TYPES.SESSION_REMINDER_1H;

  // Notify student
  await sendToUser(session.student._id.toString(), {
    type: notificationType,
    title,
    message: `Your ${session.subject.name} session is ${timeText}`,
    data: { sessionId: session._id.toString() },
    actionUrl: '/student-dashboard/tutoring/sessions',
    icon: 'clock'
  });

  // Notify instructor
  await sendToUser(session.instructor._id.toString(), {
    type: notificationType,
    title,
    message: `Your session with ${session.student.firstname} for ${session.subject.name} is ${timeText}`,
    data: { sessionId: session._id.toString() },
    actionUrl: '/instructor-dashboard/tutoring/sessions',
    icon: 'clock'
  });
};

/**
 * Notify admins about new tutoring request
 * @param {Object} request - The tutoring request
 * @param {Object} student - The student user
 * @param {Object} subject - The tutoring subject
 */
const notifyNewTutoringRequest = async (request, student, subject) => {
  return sendToAdmins({
    type: NOTIFICATION_TYPES.NEW_TUTORING_REQUEST,
    title: 'New Tutoring Request',
    message: `${student.firstname} ${student.lastname} requested tutoring for ${subject.name}`,
    data: {
      requestId: request._id.toString(),
      studentId: student._id.toString(),
      subjectId: subject._id.toString()
    },
    actionUrl: '/admin-dashboard/tutoring-requests',
    icon: 'user-plus'
  });
};

/**
 * Notify student that their session has started
 * @param {Object} session - Populated session with student, subject
 */
const notifySessionStarted = async (session) => {
  return sendToUser(session.student._id.toString(), {
    type: NOTIFICATION_TYPES.SESSION_STARTED,
    title: 'Session Started',
    message: `Your ${session.subject.name} session has started. Join now!`,
    data: { sessionId: session._id.toString() },
    actionUrl: '/student-dashboard/tutoring/sessions',
    icon: 'play-circle'
  });
};

/**
 * Notify student that their session has ended
 * @param {Object} session - Populated session with student, subject
 */
const notifySessionEnded = async (session) => {
  return sendToUser(session.student._id.toString(), {
    type: NOTIFICATION_TYPES.SESSION_ENDED,
    title: 'Session Ended',
    message: `Your ${session.subject.name} session has ended.`,
    data: { sessionId: session._id.toString() },
    actionUrl: '/student-dashboard/tutoring/sessions',
    icon: 'check-circle'
  });
};

/**
 * Notify student about a new assignment
 * @param {Object} assignment - Populated assignment with student, instructor, subject
 */
const notifyAssignmentCreated = async (assignment) => {
  return sendToUser(assignment.student._id.toString(), {
    type: NOTIFICATION_TYPES.ASSIGNMENT_CREATED,
    title: 'New Assignment',
    message: `${assignment.instructor.firstname} assigned you: ${assignment.title}`,
    data: { assignmentId: assignment._id.toString() },
    actionUrl: '/student-dashboard/tutoring/assignments',
    icon: 'file-text'
  });
};

/**
 * Notify instructor that a student submitted an assignment
 * @param {Object} assignment - Populated assignment with student, instructor, subject
 */
const notifyAssignmentSubmitted = async (assignment) => {
  return sendToUser(assignment.instructor._id.toString(), {
    type: NOTIFICATION_TYPES.ASSIGNMENT_SUBMITTED,
    title: 'Assignment Submitted',
    message: `${assignment.student.firstname} submitted: ${assignment.title}`,
    data: { assignmentId: assignment._id.toString() },
    actionUrl: '/instructor-dashboard/tutoring/assignments',
    icon: 'upload'
  });
};

/**
 * Notify student that their assignment has been reviewed
 * @param {Object} assignment - Populated assignment with student, subject
 */
const notifyAssignmentReviewed = async (assignment) => {
  return sendToUser(assignment.student._id.toString(), {
    type: NOTIFICATION_TYPES.ASSIGNMENT_REVIEWED,
    title: 'Assignment Reviewed',
    message: `Your assignment '${assignment.title}' has been reviewed.`,
    data: { assignmentId: assignment._id.toString() },
    actionUrl: '/student-dashboard/tutoring/assignments',
    icon: 'check-square'
  });
};

/**
 * Notify student that changes were requested on their assignment
 * @param {Object} assignment - Populated assignment with student, instructor, subject
 */
const notifyRevisionRequested = async (assignment) => {
  return sendToUser(assignment.student._id.toString(), {
    type: NOTIFICATION_TYPES.ASSIGNMENT_REVISION_REQUESTED,
    title: 'Changes Requested',
    message: `${assignment.instructor.firstname} requested changes on: ${assignment.title}`,
    data: { assignmentId: assignment._id.toString() },
    actionUrl: '/student-dashboard/tutoring/assignments',
    icon: 'edit-3'
  });
};

/**
 * Notify student that an instructor has been assigned to their tutoring request
 * @param {Object} data - { student, instructor, subject, enrollmentId }
 */
const notifyInstructorAssigned = async (data) => {
  const { student, instructor, subject, enrollmentId } = data;
  return sendToUser(student._id.toString(), {
    type: NOTIFICATION_TYPES.INSTRUCTOR_ASSIGNED,
    title: 'Instructor Assigned!',
    message: `${instructor.firstname} ${instructor.lastname} has been assigned as your tutor for ${subject.name}`,
    data: {
      enrollmentId: enrollmentId.toString(),
      instructorId: instructor._id.toString(),
      subjectId: subject._id.toString()
    },
    actionUrl: '/student-dashboard/tutoring',
    icon: 'user-check'
  });
};

/**
 * Notify instructor that they have been assigned a new student
 * @param {Object} data - { student, instructor, subject, enrollmentId }
 */
const notifyNewStudentAssigned = async (data) => {
  const { student, instructor, subject, enrollmentId } = data;
  return sendToUser(instructor._id.toString(), {
    type: NOTIFICATION_TYPES.NEW_STUDENT_ASSIGNED,
    title: 'New Student Assigned',
    message: `You have been assigned to tutor ${student.firstname} ${student.lastname} for ${subject.name}`,
    data: {
      enrollmentId: enrollmentId.toString(),
      studentId: student._id.toString(),
      subjectId: subject._id.toString()
    },
    actionUrl: '/instructor-dashboard/tutoring/students',
    icon: 'user-plus'
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  sendToUser,
  sendToAdmins,
  sendToLecturers,
  sendToLearners,
  broadcast,
  sendPushToUser,
  sendPushToUsers,
  notifyNewLearnerRegistration,
  notifyNewLecturerApplication,
  notifyLecturerApproved,
  notifyLecturerRejected,
  notifyNewCoursePublished,
  sendAnnouncement,
  notifySessionReminder,
  notifyNewTutoringRequest,
  notifySessionStarted,
  notifySessionEnded,
  notifyAssignmentCreated,
  notifyAssignmentSubmitted,
  notifyAssignmentReviewed,
  notifyRevisionRequested,
  notifyInstructorAssigned,
  notifyNewStudentAssigned
};
