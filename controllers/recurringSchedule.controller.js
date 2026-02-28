const httpStatus = require('http-status');
const RecurringSchedule = require('../models/recurringSchedule.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const TutoringSession = require('../models/tutoringSession.model');
const { createWeeklyRule, generateSessionsFromSchedule, getScheduleDescription } = require('../services/recurringScheduleService');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= INSTRUCTOR ENDPOINTS =======================

/**
 * Create a recurring schedule for an enrollment
 * POST /recurring-schedules
 * Requires: verifyUser + verifyLecturer
 */
exports.create = async (req, res) => {
  try {
    const { enrollmentId, daysOfWeek, startTime, duration = 60, startDate } = req.body;

    // Validate required fields
    if (!enrollmentId || !daysOfWeek || !startTime || !startDate) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Missing required fields: enrollmentId, daysOfWeek, startTime, startDate',
      });
    }

    // Validate daysOfWeek
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'daysOfWeek must be a non-empty array of day numbers (0=Sunday through 6=Saturday)',
      });
    }

    // Validate day numbers
    const validDays = daysOfWeek.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!validDays) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Invalid day numbers. Use 0=Sunday through 6=Saturday.',
      });
    }

    // Validate startTime format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'startTime must be in HH:MM format (e.g., "16:00")',
      });
    }

    // Find the enrollment
    const enrollment = await TutoringEnrollment.findById(enrollmentId)
      .populate('student', 'firstname lastname email')
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
        msg: 'You are not authorized to create schedules for this enrollment.',
      });
    }

    // Check if schedule already exists for this enrollment
    const existingSchedule = await RecurringSchedule.findOne({ enrollment: enrollmentId });
    if (existingSchedule) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'A recurring schedule already exists for this enrollment. Update or delete it first.',
      });
    }

    // Generate rrule string
    const rruleString = createWeeklyRule(daysOfWeek, startTime, new Date(startDate));

    // Create the schedule
    const schedule = new RecurringSchedule({
      enrollment: enrollment._id,
      student: enrollment.student._id,
      instructor: req.user._id,
      subject: enrollment.subject._id,
      rruleString,
      daysOfWeek,
      startTime,
      duration,
      startDate: new Date(startDate),
      isActive: true,
      isPaused: false,
    });

    await schedule.save();

    // Immediately generate sessions for next 2 weeks
    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + 14);

    const generatedSessions = await generateSessionsFromSchedule(schedule, untilDate);

    // Populate for response
    const populatedSchedule = await RecurringSchedule.findById(schedule._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Recurring schedule created successfully.',
      data: {
        schedule: populatedSchedule,
        sessionsGenerated: generatedSessions.length,
        description: getScheduleDescription(schedule),
      },
    });
  } catch (err) {
    console.error('Create recurring schedule error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create recurring schedule.',
      err: err.message,
    });
  }
};

/**
 * Get instructor's recurring schedules
 * GET /recurring-schedules/instructor
 * Requires: verifyUser + verifyLecturer
 */
exports.getMySchedules = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const query = { instructor: req.user._id };
    if (!includeInactive) {
      query.isActive = true;
    }

    const schedules = await RecurringSchedule.find(query)
      .populate('student', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .populate('enrollment', 'status currentPeriodEnd trialEndsAt')
      .sort({ createdAt: -1 });

    // Add description to each schedule
    const schedulesWithDescription = schedules.map(s => ({
      ...s.toObject(),
      description: getScheduleDescription(s),
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Schedules retrieved successfully.',
      data: schedulesWithDescription,
    });
  } catch (err) {
    console.error('Get my schedules error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get schedules.',
      err: err.message,
    });
  }
};

/**
 * Get schedules by student
 * GET /recurring-schedules/student/:studentId
 * Requires: verifyUser + verifyLecturer
 */
exports.getSchedulesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const schedules = await RecurringSchedule.find({
      student: studentId,
      instructor: req.user._id,
      isActive: true,
    })
      .populate('subject', 'name')
      .populate('enrollment', 'status currentPeriodEnd trialEndsAt')
      .sort({ createdAt: -1 });

    const schedulesWithDescription = schedules.map(s => ({
      ...s.toObject(),
      description: getScheduleDescription(s),
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Schedules retrieved successfully.',
      data: schedulesWithDescription,
    });
  } catch (err) {
    console.error('Get schedules by student error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get schedules.',
      err: err.message,
    });
  }
};

/**
 * Update a recurring schedule
 * PUT /recurring-schedules/:id
 * Requires: verifyUser + verifyLecturer
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { daysOfWeek, startTime, duration, isPaused } = req.body;

    const schedule = await RecurringSchedule.findById(id);

    if (!schedule) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Schedule not found.',
      });
    }

    // Verify instructor owns this schedule
    if (schedule.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to update this schedule.',
      });
    }

    // Check if schedule is active
    if (!schedule.isActive) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot update an inactive schedule.',
      });
    }

    let patternChanged = false;

    // Update fields
    if (daysOfWeek !== undefined) {
      // Validate daysOfWeek
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: 'daysOfWeek must be a non-empty array of day numbers.',
        });
      }
      const validDays = daysOfWeek.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!validDays) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: 'Invalid day numbers. Use 0=Sunday through 6=Saturday.',
        });
      }
      schedule.daysOfWeek = daysOfWeek;
      patternChanged = true;
    }

    if (startTime !== undefined) {
      // Validate startTime format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: 'startTime must be in HH:MM format.',
        });
      }
      schedule.startTime = startTime;
      patternChanged = true;
    }

    if (duration !== undefined) {
      schedule.duration = duration;
    }

    // Regenerate rrule if pattern changed
    if (patternChanged) {
      schedule.rruleString = createWeeklyRule(
        schedule.daysOfWeek,
        schedule.startTime,
        schedule.startDate,
        schedule.endDate
      );
    }

    // Handle pause/unpause
    const wasUnpaused = schedule.isPaused && isPaused === false;
    if (isPaused !== undefined) {
      schedule.isPaused = isPaused;
    }

    await schedule.save();

    // If unpausing, generate sessions for next 2 weeks
    let sessionsGenerated = 0;
    if (wasUnpaused) {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + 14);
      const sessions = await generateSessionsFromSchedule(schedule, untilDate);
      sessionsGenerated = sessions.length;
    }

    // Populate for response
    const populatedSchedule = await RecurringSchedule.findById(schedule._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Schedule updated successfully.',
      data: {
        schedule: populatedSchedule,
        description: getScheduleDescription(schedule),
        sessionsGenerated,
      },
    });
  } catch (err) {
    console.error('Update schedule error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update schedule.',
      err: err.message,
    });
  }
};

/**
 * Delete (soft) a recurring schedule
 * DELETE /recurring-schedules/:id
 * Requires: verifyUser + verifyLecturer
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await RecurringSchedule.findById(id);

    if (!schedule) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Schedule not found.',
      });
    }

    // Verify instructor owns this schedule
    if (schedule.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to delete this schedule.',
      });
    }

    // Soft delete - set isActive: false
    schedule.isActive = false;
    await schedule.save();

    // Note: Future sessions are NOT deleted - they can be cancelled individually if needed

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Schedule deleted successfully. Future sessions are not affected - cancel them individually if needed.',
    });
  } catch (err) {
    console.error('Delete schedule error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete schedule.',
      err: err.message,
    });
  }
};

// ======================= STUDENT ENDPOINTS =======================

/**
 * Get student's schedule (their own)
 * GET /recurring-schedules/my-schedule
 * Requires: verifyUser + verifyLearner
 */
exports.getStudentSchedule = async (req, res) => {
  try {
    const schedules = await RecurringSchedule.find({
      student: req.user._id,
      isActive: true,
    })
      .populate('instructor', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    const schedulesWithDescription = schedules.map(s => ({
      ...s.toObject(),
      description: getScheduleDescription(s),
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Schedules retrieved successfully.',
      data: schedulesWithDescription,
    });
  } catch (err) {
    console.error('Get student schedule error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get schedules.',
      err: err.message,
    });
  }
};
