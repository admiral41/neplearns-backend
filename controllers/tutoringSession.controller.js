const httpStatus = require('http-status');
const TutoringSession = require('../models/tutoringSession.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const reminderService = require('../services/reminderService');
const notificationService = require('../services/notificationService');

// ======================= INSTRUCTOR ENDPOINTS =======================

/**
 * Get instructor's assigned students grouped by subject
 * GET /tutoring-sessions/my-students
 * Requires: verifyUser + verifyInstructor
 */
exports.getMyStudents = async (req, res) => {
  try {
    // Find all enrollments where this instructor is assigned
    const enrollments = await TutoringEnrollment.find({ instructor: req.user._id })
      .populate('student', 'firstname lastname email profileImage')
      .populate('subject', 'name slug')
      .sort({ createdAt: -1 });

    // Group by subject
    const bySubject = {};
    for (const enrollment of enrollments) {
      if (!enrollment.subject) continue;

      const subjectId = enrollment.subject._id.toString();
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = {
          subject: enrollment.subject,
          students: [],
        };
      }

      bySubject[subjectId].students.push({
        enrollmentId: enrollment._id,
        student: enrollment.student,
        status: enrollment.status,
        currentPeriodEnd: enrollment.currentPeriodEnd,
        trialEndsAt: enrollment.trialEndsAt,
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Students retrieved successfully.',
      data: { bySubject },
    });
  } catch (err) {
    console.error('Get my students error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get students.',
      err: err.message,
    });
  }
};

/**
 * Create a tutoring session
 * POST /tutoring-sessions
 * Requires: verifyUser + verifyInstructor
 */
exports.createSession = async (req, res) => {
  try {
    const { enrollmentId, scheduledAt, duration = 60, meetingLink, notes } = req.body;

    // Validate required fields
    if (!enrollmentId || !scheduledAt) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Enrollment ID and scheduled time are required.',
      });
    }

    // Find the enrollment
    const enrollment = await TutoringEnrollment.findById(enrollmentId)
      .populate('subject', 'name');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Enrollment not found.',
      });
    }

    // Verify instructor owns this enrollment
    if (enrollment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to schedule sessions for this enrollment.',
      });
    }

    // Check enrollment eligibility (trial or active status)
    const status = enrollment.status;
    if (status !== 'trial' && status !== 'active') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot schedule sessions for enrollment with status: ${status}. Student must be in trial or have active subscription.`,
      });
    }

    // Check for overlapping sessions (soft check - warn but allow)
    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

    const overlapping = await TutoringSession.findOne({
      instructor: req.user._id,
      status: { $ne: 'cancelled' },
      $or: [
        {
          scheduledAt: { $gte: sessionStart, $lt: sessionEnd },
        },
        {
          $expr: {
            $and: [
              { $lt: ['$scheduledAt', sessionEnd] },
              { $gt: [{ $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] }, sessionStart] },
            ],
          },
        },
      ],
    });

    // Create the session
    const session = new TutoringSession({
      enrollment: enrollment._id,
      student: enrollment.student,
      instructor: req.user._id,
      subject: enrollment.subject._id,
      scheduledAt: sessionStart,
      duration,
      meetingLink: meetingLink || undefined,
      notes: notes || undefined,
    });

    await session.save();

    // Schedule reminders for the new session
    try {
      await reminderService.scheduleSessionReminders(session);
    } catch (reminderErr) {
      console.error('Failed to schedule reminders:', reminderErr);
      // Don't fail session creation if reminder scheduling fails
    }

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Session scheduled successfully.',
      data: populatedSession,
      warning: overlapping ? 'Warning: This session overlaps with another session.' : undefined,
    });
  } catch (err) {
    console.error('Create session error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create session.',
      err: err.message,
    });
  }
};

/**
 * Update a tutoring session
 * PATCH /tutoring-sessions/:id
 * Requires: verifyUser + verifyInstructor
 */
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt, duration, meetingLink, notes } = req.body;

    const session = await TutoringSession.findById(id);

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Verify instructor owns this session
    if (session.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to update this session.',
      });
    }

    // Cannot update cancelled or completed sessions
    if (session.status === 'cancelled' || session.status === 'completed') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot update a ${session.status} session.`,
      });
    }

    // Update allowed fields
    if (scheduledAt !== undefined) session.scheduledAt = new Date(scheduledAt);
    if (duration !== undefined) session.duration = duration;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (notes !== undefined) session.notes = notes;

    await session.save();

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Session updated successfully.',
      data: populatedSession,
    });
  } catch (err) {
    console.error('Update session error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update session.',
      err: err.message,
    });
  }
};

/**
 * Cancel a tutoring session (soft delete)
 * DELETE /tutoring-sessions/:id
 * Requires: verifyUser + verifyInstructor
 */
exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TutoringSession.findById(id);

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Verify instructor owns this session
    if (session.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to cancel this session.',
      });
    }

    // Can only cancel scheduled sessions
    if (session.status !== 'scheduled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot cancel a ${session.status} session. Only scheduled sessions can be cancelled.`,
      });
    }

    // Soft delete - update status instead of removing
    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.cancelledBy = req.user._id;

    await session.save();

    // Cancel any pending reminder jobs
    try {
      await reminderService.cancelSessionReminders(session._id);
    } catch (reminderErr) {
      console.error('Failed to cancel reminders:', reminderErr);
      // Don't fail session cancellation if reminder cancellation fails
    }

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name')
      .populate('cancelledBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Session cancelled successfully.',
      data: populatedSession,
    });
  } catch (err) {
    console.error('Cancel session error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to cancel session.',
      err: err.message,
    });
  }
};

/**
 * Get instructor's sessions
 * GET /tutoring-sessions/instructor
 * Requires: verifyUser + verifyInstructor
 */
exports.getInstructorSessions = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build query
    const query = { instructor: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = new Date(startDate);
      if (endDate) query.scheduledAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) query.status = status;

    const sessions = await TutoringSession.find(query)
      .populate('student', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .sort({ scheduledAt: 1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Sessions retrieved successfully.',
      data: sessions,
    });
  } catch (err) {
    console.error('Get instructor sessions error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get sessions.',
      err: err.message,
    });
  }
};

/**
 * Get student's sessions
 * GET /tutoring-sessions/student
 * Requires: verifyUser + verifyLearner
 */
exports.getStudentSessions = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build query
    const query = { student: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = new Date(startDate);
      if (endDate) query.scheduledAt.$lte = new Date(endDate);
    }

    // Status filter
    if (status) query.status = status;

    const sessions = await TutoringSession.find(query)
      .populate('instructor', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .sort({ scheduledAt: 1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Sessions retrieved successfully.',
      data: sessions,
    });
  } catch (err) {
    console.error('Get student sessions error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get sessions.',
      err: err.message,
    });
  }
};

/**
 * Get session by ID
 * GET /tutoring-sessions/:id
 * Requires: verifyUser (student or instructor)
 */
exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TutoringSession.findById(id)
      .populate('student', 'firstname lastname email profileImage')
      .populate('instructor', 'firstname lastname email profileImage')
      .populate('subject', 'name slug')
      .populate('cancelledBy', 'firstname lastname');

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Authorization: must be student or instructor of this session
    const isStudent = session.student._id.toString() === req.user._id.toString();
    const isInstructor = session.instructor._id.toString() === req.user._id.toString();

    if (!isStudent && !isInstructor) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to view this session.',
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Session retrieved successfully.',
      data: session,
    });
  } catch (err) {
    console.error('Get session by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get session.',
      err: err.message,
    });
  }
};

/**
 * Start a session early (go live)
 * POST /tutoring-sessions/:id/start
 * Requires: verifyUser + verifyInstructor
 */
exports.startSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TutoringSession.findById(id);

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Verify instructor owns this session
    if (session.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to start this session.',
      });
    }

    // Can only start scheduled sessions
    if (session.status !== 'scheduled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot start a ${session.status} session. Only scheduled sessions can be started.`,
      });
    }

    // Check if instructor already has a live session
    const existingLiveSession = await TutoringSession.findOne({
      instructor: req.user._id,
      status: 'live',
      _id: { $ne: session._id },
    }).populate('student', 'firstname lastname').populate('subject', 'name');

    if (existingLiveSession) {
      const studentName = `${existingLiveSession.student?.firstname || ''} ${existingLiveSession.student?.lastname || ''}`.trim();
      const subjectName = existingLiveSession.subject?.name || 'a subject';
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: `You already have a live session with ${studentName} for ${subjectName}. Please end that session before starting a new one.`,
      });
    }

    // Update status to live
    session.status = 'live';
    session.startedAt = new Date();

    await session.save();

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify student that session has started
    try {
      await notificationService.notifySessionStarted(populatedSession);
    } catch (notifErr) {
      console.error('Failed to send session started notification:', notifErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Session started successfully. Student can now join.',
      data: populatedSession,
    });
  } catch (err) {
    console.error('Start session error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to start session.',
      err: err.message,
    });
  }
};

/**
 * End a live session
 * POST /tutoring-sessions/:id/end
 * Requires: verifyUser + verifyInstructor
 */
exports.endSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TutoringSession.findById(id);

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Verify instructor owns this session
    if (session.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to end this session.',
      });
    }

    // Can only end live sessions
    if (session.status !== 'live') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot end a ${session.status} session. Only live sessions can be ended.`,
      });
    }

    // Update status to completed
    session.status = 'completed';
    session.endedAt = new Date();

    await session.save();

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify student that session has ended
    try {
      await notificationService.notifySessionEnded(populatedSession);
    } catch (notifErr) {
      console.error('Failed to send session ended notification:', notifErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Session ended successfully.',
      data: populatedSession,
    });
  } catch (err) {
    console.error('End session error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to end session.',
      err: err.message,
    });
  }
};

/**
 * Mark session attendance
 * POST /tutoring-sessions/:id/attendance
 * Requires: verifyUser + verifyInstructor
 */
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body;

    // Validate attendance value
    if (!attendance || !['present', 'absent'].includes(attendance)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Attendance must be either "present" or "absent".',
      });
    }

    const session = await TutoringSession.findById(id);

    if (!session) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Session not found.',
      });
    }

    // Verify instructor owns this session
    if (session.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to mark attendance for this session.',
      });
    }

    // Check if attendance can be marked (using virtual)
    if (!session.canMarkAttendance) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Attendance can only be marked between session start and 24 hours after.',
      });
    }

    // Update attendance
    session.attendance = attendance;
    session.attendanceMarkedAt = new Date();

    // If session is still scheduled and marking attendance, mark as completed
    if (session.status === 'scheduled') {
      session.status = 'completed';
      session.endedAt = new Date();
    }

    await session.save();

    // Populate for response
    const populatedSession = await TutoringSession.findById(session._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Attendance marked as ${attendance}.`,
      data: populatedSession,
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to mark attendance.',
      err: err.message,
    });
  }
};
