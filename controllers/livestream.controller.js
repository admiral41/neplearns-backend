const httpStatus = require('http-status');
const Livestream = require('../models/liveStream.model');
const Course = require('../models/course.model');
const Week = require('../models/weeks');
const Lesson = require('../models/lessons');
const Lecturer = require('../models/lecturer.model');
const User = require('../models/user.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE LIVESTREAM =======================
exports.createLivestream = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      course, 
      week,
      lesson,
      scheduledStartTime, 
      scheduledEndTime,
      meetingType,
      meetingUrl,
      meetingId,
      meetingPassword,
      meetingInstructions,
      isPublic,
      settings 
    } = req.body;

    // Check permissions
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
    const isLecturer = req.user.roles.includes('LECTURER');

    if (!isAdmin && !isLecturer) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Only lecturers and admins can create livestreams.' 
      });
    }

    // Validate required fields
    if (!meetingType || !meetingUrl) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Meeting type and URL are required.' 
      });
    }

    // Validate meeting type
    const validMeetingTypes = ['google_meet', 'zoom', 'microsoft_teams', 'custom'];
    if (!validMeetingTypes.includes(meetingType)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Invalid meeting type.' 
      });
    }

    // Validate URL format
    try {
      new URL(meetingUrl);
    } catch (error) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Invalid meeting URL.' 
      });
    }

    // Validate course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Course not found.' 
      });
    }

    // Check authorization
    let lecturers = [];
    if (isLecturer) {
      const lecturer = await Lecturer.findOne({ 
        user: req.user._id,
        requestStatus: 'approved',
        isActive: true 
      });

      if (!lecturer) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'Your lecturer account is not approved or active.' 
        });
      }

      const isAssigned = courseDoc.lecturers.some(l => l.toString() === lecturer._id.toString());
      if (!isAssigned) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'You are not assigned to this course.' 
        });
      }

      lecturers = [lecturer._id];
    } else if (isAdmin) {
      lecturers = courseDoc.lecturers;
    }

    // Validate week if provided
    if (week) {
      const weekDoc = await Week.findOne({ _id: week, course });
      if (!weekDoc) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.NOT_FOUND, 
          msg: 'Week not found in this course.' 
        });
      }
    }

    // Validate lesson if provided
    if (lesson) {
      const lessonDoc = await Lesson.findById(lesson);
      if (!lessonDoc) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.NOT_FOUND, 
          msg: 'Lesson not found.' 
        });
      }
    }

    // Validate scheduled time
    const startTime = new Date(scheduledStartTime);
    if (startTime < new Date()) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Scheduled start time must be in the future.' 
      });
    }

    // Get allowed users
    const allowedUsers = isPublic ? [] : courseDoc.learners;

    // Create livestream
    const livestream = await Livestream.create({
      title,
      description,
      course,
      week,
      lesson,
      scheduledStartTime: startTime,
      scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : null,
      createdBy: req.user._id,
      lecturers,
      meetingType,
      meetingUrl,
      meetingId,
      meetingPassword,
      meetingInstructions,
      isPublic: isPublic || false,
      allowedUsers,
    });

    // Populate response
    await livestream.populate([
      {
        path: 'course',
        select: 'courseTitle courseSlug'
      },
      {
        path: 'week',
        select: 'title weekNumber'
      },
      {
        path: 'lesson',
        select: 'lessonTitle lessonSlug'
      },
      {
        path: 'createdBy',
        select: 'firstname lastname email userImage'
      },
      {
        path: 'lecturers',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstname lastname email userImage'
        }
      }
    ]);

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.CREATED, 
      msg: 'Livestream created successfully.',
      data: livestream 
    });
  } catch (err) {
    console.error('Create livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to create livestream.', 
      err: err.message 
    });
  }
};

// ======================= GET ALL LIVESTREAMS =======================
exports.getAllLivestreams = async (req, res) => {
  try {
    const { 
      course, 
      status, 
      page = 1, 
      limit = 10,
      startDate,
      endDate 
    } = req.query;

    let filter = {};

    if (course) {
      filter.course = course;
    }

    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = { $in: ['scheduled', 'live'] };
    }

    if (startDate || endDate) {
      filter.scheduledStartTime = {};
      if (startDate) {
        filter.scheduledStartTime.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.scheduledStartTime.$lte = new Date(endDate);
      }
    }

    // Non-admins filter
    if (req.user && !req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      const enrolledCourses = await Course.find({ learners: req.user._id }).select('_id');
      const enrolledCourseIds = enrolledCourses.map(c => c._id);

      filter.$or = [
        { isPublic: true },
        { allowedUsers: req.user._id },
        { createdBy: req.user._id },
        { lecturers: { $in: await getLecturerId(req.user._id) } },
        { course: { $in: enrolledCourseIds } }
      ];
    }

    const skip = (page - 1) * limit;

    const livestreams = await Livestream.find(filter)
      .populate([
        {
          path: 'course',
          select: 'courseTitle courseSlug image'
        },
        {
          path: 'week',
          select: 'title weekNumber'
        },
        {
          path: 'lesson',
          select: 'lessonTitle lessonSlug'
        },
        {
          path: 'createdBy',
          select: 'firstname lastname email userImage'
        },
        {
          path: 'lecturers',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstname lastname userImage'
          }
        }
      ])
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Livestream.countDocuments(filter);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: livestreams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      msg: 'Livestreams retrieved successfully.'
    });
  } catch (err) {
    console.error('Get livestreams error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get livestreams.', 
      err: err.message 
    });
  }
};

// ======================= GET LIVESTREAM DETAILS =======================
exports.getLivestreamDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug })
      .populate([
        {
          path: 'course',
          select: 'courseTitle courseSlug image learners'
        },
        {
          path: 'week',
          select: 'title weekNumber'
        },
        {
          path: 'lesson',
          select: 'lessonTitle lessonSlug'
        },
        {
          path: 'createdBy',
          select: 'firstname lastname email userImage'
        },
        {
          path: 'lecturers',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstname lastname email userImage'
          }
        }
      ]);

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check access
    if (req.user) {
      const canAccess = await livestream.canUserAccess(req.user._id, req.user.roles);
      if (!canAccess) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: 'You do not have permission to access this livestream.' 
        });
      }
    } else if (!livestream.isPublic) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.UNAUTHORIZED, 
        msg: 'Authentication required to access this livestream.' 
      });
    }

    // Increment view count
    livestream.totalViews += 1;
    await livestream.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: livestream,
      msg: 'Livestream details retrieved successfully.'
    });
  } catch (err) {
    console.error('Get livestream details error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to get livestream details.', 
      err: err.message 
    });
  }
};

// ======================= JOIN LIVESTREAM =======================
exports.joinLivestream = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug })
      .populate('course', 'learners');

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check access
    const canAccess = await livestream.canUserAccess(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'You do not have permission to join this livestream.' 
      });
    }

    // Check stream status
    if (livestream.status === 'ended' || livestream.status === 'cancelled') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: `This livestream has ${livestream.status}.` 
      });
    }

    // Record participant
    const existingParticipant = livestream.participants.find(
      p => p.user && p.user.toString() === req.user._id.toString() && !p.leftAt
    );

    if (!existingParticipant) {
      livestream.participants.push({
        user: req.user._id,
        joinedAt: new Date()
      });

      const currentViewers = livestream.participants.filter(p => !p.leftAt).length;
      if (currentViewers > livestream.peakViewers) {
        livestream.peakViewers = currentViewers;
      }

      await livestream.save();
    }

    // Prepare meeting info for user
    const meetingInfo = {
      url: livestream.meetingUrl,
      type: livestream.meetingType,
      id: livestream.meetingId,
      password: livestream.meetingPassword,
      instructions: livestream.meetingInstructions,
      platform: livestream.getMeetingInfo().platform,
      icon: livestream.getMeetingInfo().icon,
      user: {
        name: `${req.user.firstname} ${req.user.lastname}`,
        email: req.user.email
      }
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        livestream: {
          _id: livestream._id,
          title: livestream.title,
          description: livestream.description,
          status: livestream.status,
          scheduledStartTime: livestream.scheduledStartTime,
        },
        meetingInfo
      },
      msg: 'Meeting information retrieved successfully.'
    });
  } catch (err) {
    console.error('Join livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to join livestream.', 
      err: err.message 
    });
  }
};

// ======================= START LIVESTREAM =======================
exports.startLivestream = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug });

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check permissions
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
    const lecturerId = await getLecturerId(req.user._id);
    const isLecturer = livestream.lecturers.some(l => l.toString() === lecturerId);

    if (!isAdmin && !isLecturer && livestream.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Only the lecturer or admin can start this livestream.' 
      });
    }

    if (livestream.status !== 'scheduled') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: `Cannot start livestream. Current status: ${livestream.status}` 
      });
    }

    livestream.status = 'live';
    livestream.actualStartTime = new Date();
    await livestream.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: livestream,
      msg: 'Livestream started successfully.'
    });
  } catch (err) {
    console.error('Start livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to start livestream.', 
      err: err.message 
    });
  }
};

// ======================= END LIVESTREAM =======================
exports.endLivestream = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug });

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check permissions
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
    const lecturerId = await getLecturerId(req.user._id);
    const isLecturer = livestream.lecturers.some(l => l.toString() === lecturerId);

    if (!isAdmin && !isLecturer && livestream.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'Only the lecturer or admin can end this livestream.' 
      });
    }

    if (livestream.status !== 'live') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: `Cannot end livestream. Current status: ${livestream.status}` 
      });
    }

    livestream.status = 'ended';
    livestream.actualEndTime = new Date();

    // Update participants
    const now = new Date();
    livestream.participants.forEach(p => {
      if (!p.leftAt) {
        p.leftAt = now;
        p.duration = Math.floor((now - p.joinedAt) / 1000);
      }
    });

    await livestream.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: livestream,
      msg: 'Livestream ended successfully.'
    });
  } catch (err) {
    console.error('End livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to end livestream.', 
      err: err.message 
    });
  }
};

// ======================= UPDATE LIVESTREAM =======================
exports.updateLivestream = async (req, res) => {
  try {
    const { slug } = req.params;
    const { 
      title, 
      description, 
      scheduledStartTime, 
      scheduledEndTime,
      meetingType,
      meetingUrl,
      meetingId,
      meetingPassword,
      meetingInstructions,
      isPublic 
    } = req.body;

    const livestream = await Livestream.findOne({ streamSlug: slug });

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check permissions
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
    const lecturerId = await getLecturerId(req.user._id);
    const isLecturer = livestream.lecturers.some(l => l.toString() === lecturerId);

    if (!isAdmin && !isLecturer && livestream.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'You do not have permission to update this livestream.' 
      });
    }

    // Cannot update if already live or ended
    if (livestream.status === 'live' || livestream.status === 'ended') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Cannot update livestream that is live or has ended.' 
      });
    }

    // Update fields
    if (title) livestream.title = title;
    if (description) livestream.description = description;
    
    if (scheduledStartTime) {
      const startTime = new Date(scheduledStartTime);
      if (startTime < new Date()) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.BAD_REQUEST, 
          msg: 'Scheduled start time must be in the future.' 
        });
      }
      livestream.scheduledStartTime = startTime;
    }
    
    if (scheduledEndTime) livestream.scheduledEndTime = new Date(scheduledEndTime);
    if (meetingType) livestream.meetingType = meetingType;
    if (meetingUrl) livestream.meetingUrl = meetingUrl;
    if (meetingId) livestream.meetingId = meetingId;
    if (meetingPassword !== undefined) livestream.meetingPassword = meetingPassword;
    if (meetingInstructions) livestream.meetingInstructions = meetingInstructions;
    if (typeof isPublic !== 'undefined') livestream.isPublic = isPublic;

    await livestream.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: livestream,
      msg: 'Livestream updated successfully.'
    });
  } catch (err) {
    console.error('Update livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to update livestream.', 
      err: err.message 
    });
  }
};

// ======================= DELETE/CANCEL LIVESTREAM =======================
exports.deleteLivestream = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug });

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Check permissions
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');
    
    if (!isAdmin && livestream.createdBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: 'You do not have permission to delete this livestream.' 
      });
    }

    if (livestream.status === 'ended') {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: 'Cannot delete ended livestream. It is kept for records.' 
      });
    }

    if (livestream.status === 'live') {
      livestream.status = 'cancelled';
      livestream.actualEndTime = new Date();
      await livestream.save();
    } else {
      livestream.status = 'cancelled';
      await livestream.save();
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Livestream cancelled successfully.'
    });
  } catch (err) {
    console.error('Delete livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to delete livestream.', 
      err: err.message 
    });
  }
};

// ======================= LEAVE LIVESTREAM =======================
exports.leaveLivestream = async (req, res) => {
  try {
    const { slug } = req.params;

    const livestream = await Livestream.findOne({ streamSlug: slug });

    if (!livestream) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: 'Livestream not found.' 
      });
    }

    // Find active participant
    const participant = livestream.participants.find(
      p => p.user && p.user.toString() === req.user._id.toString() && !p.leftAt
    );

    if (participant) {
      const now = new Date();
      participant.leftAt = now;
      participant.duration = Math.floor((now - participant.joinedAt) / 1000);
      await livestream.save();
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Left livestream successfully.'
    });
  } catch (err) {
    console.error('Leave livestream error:', err);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: 'Failed to leave livestream.', 
      err: err.message 
    });
  }
};

// ======================= HELPER FUNCTIONS =======================
async function getLecturerId(userId) {
  try {
    const lecturer = await Lecturer.findOne({ user: userId });
    return lecturer ? lecturer._id : null;
  } catch (error) {
    return null;
  }
}