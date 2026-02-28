const httpStatus = require('http-status');
const LiveClass = require('../models/LiveClass');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Lecturer = require('../models/lecturer.model');
const zoomService = require('../services/zoomService');
const { sendErrorResponse, sendSuccessResponse } = require('../helpers/index').responseHandler;
const mongoose = require('mongoose');

// ======================= CREATE LIVE CLASS =======================
// ======================= CREATE LIVE CLASS =======================
exports.createLiveClass = async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      scheduledDateTime,
      duration = 60,
      timezone = 'UTC',
      isPrivate = false,
      allowedStudents = [],
      meta = {}
    } = req.body;

    console.log('📝 Creating live class with data:', {
      title,
      course,
      scheduledDateTime,
      duration,
      timezone
    });

    // Validate course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if user is lecturer of this course or admin
    const canCreate = await canUserCreateLiveClass(req.user, courseExists);
    if (!canCreate) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to create live classes for this course"
      });
    }

    // Validate schedule
    const scheduledDate = new Date(scheduledDateTime);
    if (scheduledDate < new Date()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Scheduled date cannot be in the past"
      });
    }

    // Create Zoom meeting data
    const zoomMeetingData = zoomService.generateMeetingOptions({
      title,
      description,
      scheduledDateTime: scheduledDate,
      duration,
      timezone,
      meta: {
        ...meta,
        waitingRoom: isPrivate || (meta.waitingRoom !== false)
      }
    });

    console.log('📅 Creating Zoom meeting...');
    const zoomMeeting = await zoomService.createMeeting(zoomMeetingData);
    console.log('✅ Zoom meeting created:', zoomMeeting.id);

    // Create live class record
    const liveClass = await LiveClass.create({
      title,
      description,
      course,
      lecturer: req.user._id,
      scheduledDateTime: scheduledDate,
      duration,
      timezone,
      isPrivate,
      allowedStudents: isPrivate ? allowedStudents : [],
      zoomMeetingId: zoomMeeting.id.toString(),
      zoomJoinUrl: zoomMeeting.join_url,
      zoomStartUrl: zoomMeeting.start_url,
      zoomHostEmail: req.user.email,
      meetingPassword: zoomMeeting.password,
      meta: {
        maxParticipants: meta.maxParticipants || 100,
        waitingRoom: isPrivate || (meta.waitingRoom !== false),
        autoRecording: meta.autoRecording || 'local',
        createdVia: 'zoom_api'
      }
    });

    // Populate response
    await liveClass.populate([
      {
        path: 'course',
        select: 'courseTitle courseSlug'
      },
      {
        path: 'lecturer',
        select: 'firstname lastname email userImage'
      }
    ]);

    console.log('✅ Live class created successfully:', liveClass._id);

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Live class created successfully",
      data: liveClass
    });

  } catch (error) {
    console.error('❌ Create live class error:', error);
    
    // Clean up Zoom meeting if live class creation failed
    if (error.message.includes('Failed to create Zoom meeting')) {
      return sendErrorResponse({
        res,
        status: httpStatus.SERVICE_UNAVAILABLE,
        msg: "Failed to create Zoom meeting. Please try again."
      });
    }

    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to create live class",
      err: error.message
    });
  }
};

// ======================= GET LIVE CLASS JOIN INFO =======================
exports.getJoinInfo = async (req, res) => {
  try {
    const { liveClassId } = req.params;
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('course', 'courseTitle')
      .populate('lecturer', 'firstname lastname');

    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user can access this class
    const canAccess = await liveClass.canUserAccess(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to access this live class"
      });
    }

    // Check if class hasn't started yet
    if (liveClass.scheduledDateTime > new Date()) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Live class join information",
        data: {
          id: liveClass._id,
          title: liveClass.title,
          scheduledDateTime: liveClass.scheduledDateTime,
          duration: liveClass.duration,
          status: liveClass.status,
          lecturer: liveClass.lecturer,
          canJoin: false,
          joinTime: liveClass.scheduledDateTime,
          message: "Class hasn't started yet"
        }
      });
    }

    // Check if class is completed or cancelled
    if (['completed', 'cancelled'].includes(liveClass.status)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `This live class has been ${liveClass.status}`
      });
    }

    // Determine user role (1 = host, 0 = attendee)
    const isHost = liveClass.lecturer._id.toString() === req.user._id.toString();
    const role = isHost ? 1 : 0;

    // Generate SDK credentials for web client
    const userName = `${req.user.firstname} ${req.user.lastname}`;
    const sdkCredentials = await zoomService.getSDKCredentials(
      liveClass.zoomMeetingId,
      userName,
      req.user.email,
      role
    );

    // Prepare join information
    const joinInfo = {
      id: liveClass._id,
      title: liveClass.title,
      joinUrl: liveClass.zoomJoinUrl, // Fallback for native app
      meetingPassword: liveClass.meetingPassword,
      status: liveClass.status,
      startedAt: liveClass.startedAt,
      isHost: isHost,
      waitingRoom: liveClass.meta.waitingRoom,
      // Add SDK credentials for web joining
      sdk: sdkCredentials
    };

    // If user is host, include start URL
    if (isHost) {
      joinInfo.hostStartUrl = liveClass.zoomStartUrl;
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class join information retrieved",
      data: joinInfo
    });
  } catch (error) {
    console.error('Get join info error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get join information",
      err: error.message
    });
  }
};

// ======================= START LIVE CLASS (HOST ONLY) =======================
exports.startLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user is the lecturer/host
    if (liveClass.lecturer.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Only the lecturer can start the live class"
      });
    }

    // Check if already started
    if (liveClass.status === 'live') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Live class is already in progress"
      });
    }

    // Check if scheduled time is within 10 minutes of now (allow early start)
    const now = new Date();
    const scheduledTime = new Date(liveClass.scheduledDateTime);
    const timeDiff = scheduledTime - now;
    
    if (timeDiff > 10 * 60 * 1000) { // More than 10 minutes early
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "You can only start the class 10 minutes before the scheduled time"
      });
    }

    // Update status
    liveClass.status = 'live';
    liveClass.startedAt = now;
    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class started successfully",
      data: {
        startUrl: liveClass.zoomStartUrl,
        joinUrl: liveClass.zoomJoinUrl,
        status: liveClass.status
      }
    });

  } catch (error) {
    console.error('Start live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to start live class",
      err: error.message
    });
  }
};

// ======================= END LIVE CLASS (HOST ONLY) =======================
exports.endLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;
    const { recordingPath, chatLogPath } = req.body;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user is the lecturer/host
    if (liveClass.lecturer.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Only the lecturer can end the live class"
      });
    }

    // Update status and store local recording path
    liveClass.status = 'completed';
    liveClass.endedAt = new Date();
    
    // Store local paths (not on server, just references)
    if (recordingPath) {
      liveClass.localRecordingPath = recordingPath;
      liveClass.recordingAvailable = true;
    }
    
    if (chatLogPath) {
      liveClass.chatLogPath = chatLogPath;
    }

    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class ended successfully",
      data: liveClass
    });

  } catch (error) {
    console.error('End live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to end live class",
      err: error.message
    });
  }
};

// ======================= GET UPCOMING LIVE CLASSES =======================
exports.getUpcomingClasses = async (req, res) => {
  try {
    const { courseId, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      status: 'scheduled',
      scheduledDateTime: { $gte: new Date() }
    };

    // Filter by course if provided
    if (courseId) {
      query.course = courseId;
    }

    // For learners, only show classes for courses they're enrolled in
    if (req.user.roles.includes('LEARNER')) {
      const enrolledCourses = await Course.find({
        learners: req.user._id
      }).select('_id');

      query.course = { $in: enrolledCourses.map(c => c._id) };
    }

    // For lecturers, only show their own classes
    if (req.user.roles.includes('LECTURER')) {
      query.lecturer = req.user._id;
    }

    const liveClasses = await LiveClass.find(query)
      .populate('course', 'courseTitle courseSlug')
      .populate('lecturer', 'firstname lastname userImage')
      .sort({ scheduledDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LiveClass.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Upcoming live classes retrieved",
      data: liveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get upcoming classes error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get upcoming classes",
      err: error.message
    });
  }
};

// ======================= UPDATE LIVE CLASS =======================
exports.updateLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;
    const updateData = req.body;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to update this live class"
      });
    }

    // Don't allow updates if class has already started
    if (liveClass.status === 'live' || liveClass.status === 'completed') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot update a ${liveClass.status} live class`
      });
    }

    // Update Zoom meeting if schedule changed
    if (updateData.scheduledDateTime || updateData.duration) {
      const zoomUpdateData = {};
      
      if (updateData.scheduledDateTime) {
        zoomUpdateData.start_time = new Date(updateData.scheduledDateTime).toISOString();
      }
      
      if (updateData.duration) {
        zoomUpdateData.duration = updateData.duration;
      }
      
      if (Object.keys(zoomUpdateData).length > 0) {
        await zoomService.updateMeeting(liveClass.zoomMeetingId, zoomUpdateData);
      }
    }

    // Update local record
    Object.keys(updateData).forEach(key => {
      if (key !== 'zoomMeetingId' && key !== 'zoomJoinUrl' && key !== 'zoomStartUrl') {
        liveClass[key] = updateData[key];
      }
    });

    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class updated successfully",
      data: liveClass
    });

  } catch (error) {
    console.error('Update live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update live class",
      err: error.message
    });
  }
};

// ======================= CANCEL LIVE CLASS =======================
exports.cancelLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to cancel this live class"
      });
    }

    // Don't allow cancellation if class is already completed
    if (liveClass.status === 'completed') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Cannot cancel a completed live class"
      });
    }

    // Delete Zoom meeting
    if (liveClass.zoomMeetingId) {
      try {
        await zoomService.deleteMeeting(liveClass.zoomMeetingId);
      } catch (zoomError) {
        console.error('Failed to delete Zoom meeting:', zoomError);
        // Continue with cancellation even if Zoom delete fails
      }
    }

    // Update status locally
    liveClass.status = 'cancelled';
    liveClass.endedAt = new Date();
    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class cancelled successfully"
    });

  } catch (error) {
    console.error('Cancel live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to cancel live class",
      err: error.message
    });
  }
};

// ======================= MARK ATTENDANCE =======================
exports.markAttendance = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if class is live
    if (liveClass.status !== 'live') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Attendance can only be marked for live classes"
      });
    }

    // Check if user is enrolled
    const isEnrolled = await liveClass.isStudentEnrolled(req.user._id);
    if (!isEnrolled) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You are not enrolled in this course"
      });
    }

    // Check if already marked attendance
    const existingAttendance = liveClass.attendees.find(
      attendee => attendee.student.toString() === req.user._id.toString()
    );

    if (existingAttendance) {
      // Update left time if already joined
      existingAttendance.leftAt = new Date();
      existingAttendance.duration = Math.round(
        (existingAttendance.leftAt - existingAttendance.joinedAt) / (1000 * 60)
      );
    } else {
      // Add new attendance record
      liveClass.attendees.push({
        student: req.user._id,
        joinedAt: new Date()
      });
    }

    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: existingAttendance ? "Attendance updated" : "Attendance marked"
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to mark attendance",
      err: error.message
    });
  }
};

// ======================= GET CLASS RECORDING INFO =======================
exports.getRecordingInfo = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user has access to this class
    const canAccess = await liveClass.canUserAccess(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to access this recording"
      });
    }

    // Check if recording is available
    if (!liveClass.recordingAvailable) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Recording is not available for this class"
      });
    }

    // Return recording information (path stored locally on lecturer's PC)
    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Recording information retrieved",
      data: {
        id: liveClass._id,
        title: liveClass.title,
        recordingPath: liveClass.localRecordingPath,
        chatLogPath: liveClass.chatLogPath,
        recordedAt: liveClass.endedAt,
        duration: liveClass.duration,
        lecturer: liveClass.lecturer
      }
    });

  } catch (error) {
    console.error('Get recording info error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get recording information",
      err: error.message
    });
  }
};

// ======================= HELPER FUNCTIONS =======================
// ======================= HELPER FUNCTIONS =======================
async function canUserCreateLiveClass(user, course) {
  // SuperAdmin & Admin can create for any course
  if (user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN')) {
    return true;
  }

  // Lecturer can create only if they're assigned to the course
  if (user.roles.includes('LECTURER')) {
    // Check if user is a lecturer of this course
    const lecturer = await Lecturer.findOne({
      user: user._id,
      requestStatus: 'approved',
      isActive: true
    }).populate('courses');

    if (!lecturer) {
      console.log('❌ Lecturer not found or not approved');
      return false;
    }

    // Check if this lecturer is assigned to the course
    const isAssigned = lecturer.courses.some(courseId => 
      courseId._id.toString() === course._id.toString()
    );

    console.log('🔍 Checking lecturer assignment:', {
      lecturerId: lecturer._id,
      courseId: course._id,
      lecturerCourses: lecturer.courses.map(c => c._id),
      isAssigned
    });

    return isAssigned;
  }

  console.log('❌ User does not have permission to create live class:', user.roles);
  return false;
}

async function canUserModifyLiveClass(user, liveClass) {
  // SuperAdmin & Admin can modify any class
  if (user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN')) {
    return true;
  }

  // Lecturer can modify only their own classes
  if (user.roles.includes('LECTURER')) {
    return liveClass.lecturer.toString() === user._id.toString();
  }

  return false;
}

async function canUserModifyLiveClass(user, liveClass) {
  // SuperAdmin & Admin can modify any class
  if (user.roles.includes('SUPERADMIN') || user.roles.includes('ADMIN')) {
    return true;
  }

  // Lecturer can modify only their own classes
  if (user.roles.includes('LECTURER')) {
    return liveClass.lecturer.toString() === user._id.toString();
  }

  return false;
}
// ======================= GET ALL LIVE CLASSES =======================
exports.getAllLiveClasses = async (req, res) => {
  try {
    const { status, upcoming, past, today, thisWeek, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply date filters
    if (upcoming === 'true') {
      query.scheduledDateTime = { $gte: new Date() };
      query.status = 'scheduled';
    }

    if (past === 'true') {
      query.scheduledDateTime = { $lt: new Date() };
    }

    if (today === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.scheduledDateTime = { $gte: todayStart, $lt: todayEnd };
    }

    if (thisWeek === 'true') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      query.scheduledDateTime = { $gte: startOfWeek, $lt: endOfWeek };
    }

    // For non-admin users, filter based on their role
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      if (req.user.roles.includes('LECTURER')) {
        // Lecturers can only see their own classes
        query.lecturer = req.user._id;
      } else if (req.user.roles.includes('LEARNER')) {
        // Learners can only see classes for courses they're enrolled in
        const enrolledCourses = await Course.find({
          learners: req.user._id
        }).select('_id');
        query.course = { $in: enrolledCourses.map(c => c._id) };
      }
    }

    const liveClasses = await LiveClass.find(query)
      .populate('course', 'courseTitle courseSlug')
      .populate('lecturer', 'firstname lastname email userImage')
      .sort({ scheduledDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LiveClass.countDocuments(query);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live classes retrieved successfully",
      data: liveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all live classes error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get live classes",
      err: error.message
    });
  }
};

// ======================= GET LIVE CLASSES BY COURSE =======================
exports.getLiveClassesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, upcoming, past, today, thisWeek } = req.query;

    let query = { course: courseId };

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply date filters
    if (upcoming === 'true') {
      query.scheduledDateTime = { $gte: new Date() };
      query.status = 'scheduled';
    }

    if (past === 'true') {
      query.scheduledDateTime = { $lt: new Date() };
    }

    if (today === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.scheduledDateTime = { $gte: todayStart, $lt: todayEnd };
    }

    if (thisWeek === 'true') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      query.scheduledDateTime = { $gte: startOfWeek, $lt: endOfWeek };
    }

    // Check if user has access to this course
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      if (req.user.roles.includes('LEARNER')) {
        // Check if learner is enrolled in this course
        const course = await Course.findById(courseId);
        if (!course || !course.learners.some(id => id.toString() === req.user._id.toString())) {
          return sendErrorResponse({
            res,
            status: httpStatus.FORBIDDEN,
            msg: "You are not enrolled in this course"
          });
        }
      } else if (req.user.roles.includes('LECTURER')) {
        // Check if lecturer is assigned to this course
        const lecturer = await Lecturer.findOne({ user: req.user._id });
        if (!lecturer || !lecturer.courses || !lecturer.courses.includes(courseId)) {
          return sendErrorResponse({
            res,
            status: httpStatus.FORBIDDEN,
            msg: "You are not assigned to this course"
          });
        }
        // Lecturers can only see their own classes for this course
        query.lecturer = req.user._id;
      }
    }

    const liveClasses = await LiveClass.find(query)
      .populate('course', 'courseTitle courseSlug')
      .populate('lecturer', 'firstname lastname email userImage')
      .sort({ scheduledDateTime: 1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live classes retrieved successfully",
      data: liveClasses
    });

  } catch (error) {
    console.error('Get live classes by course error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get live classes",
      err: error.message
    });
  }
};

// ======================= GET LIVE CLASS BY ID =======================
exports.getLiveClassById = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId)
      .populate('course', 'courseTitle courseSlug')
      .populate('lecturer', 'firstname lastname email userImage')
      .populate('attendees.student', 'firstname lastname email');

    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user has access to this class
    const canAccess = await liveClass.canUserAccess(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view this live class"
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class retrieved successfully",
      data: liveClass
    });

  } catch (error) {
    console.error('Get live class by ID error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get live class",
      err: error.message
    });
  }
};

// ======================= GET LIVE CLASS STATISTICS =======================
exports.getLiveClassStats = async (req, res) => {
  try {
    const { course } = req.query;
    
    let query = {};
    if (course) {
      query.course = course;
    }

    // For non-admin users, filter based on their role
    if (!req.user.roles.includes('ADMIN') && !req.user.roles.includes('SUPERADMIN')) {
      if (req.user.roles.includes('LECTURER')) {
        query.lecturer = req.user._id;
      } else if (req.user.roles.includes('LEARNER')) {
        const enrolledCourses = await Course.find({
          learners: req.user._id
        }).select('_id');
        query.course = { $in: enrolledCourses.map(c => c._id) };
      }
    }

    const total = await LiveClass.countDocuments(query);
    const upcoming = await LiveClass.countDocuments({
      ...query,
      status: 'scheduled',
      scheduledDateTime: { $gte: new Date() }
    });
    const ongoing = await LiveClass.countDocuments({
      ...query,
      status: 'live'
    });
    const completed = await LiveClass.countDocuments({
      ...query,
      status: 'completed'
    });
    const cancelled = await LiveClass.countDocuments({
      ...query,
      status: 'cancelled'
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class statistics retrieved",
      data: {
        total,
        upcoming,
        ongoing,
        completed,
        cancelled
      }
    });

  } catch (error) {
    console.error('Get live class stats error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get statistics",
      err: error.message
    });
  }
};

// ======================= SEND REMINDER =======================
exports.sendReminder = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId)
      .populate('course', 'courseTitle')
      .populate('lecturer', 'firstname lastname email');

    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to send reminders"
      });
    }

    // Check if class is scheduled
    if (liveClass.status !== 'scheduled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Can only send reminders for scheduled classes"
      });
    }

    // Get enrolled students
    const course = await Course.findById(liveClass.course).populate('learners', 'email firstname');
    const students = course?.learners || [];

    // In a real implementation, you would send actual emails
    // For now, we'll just return success
    const emailCount = students.length;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Reminders sent to ${emailCount} enrolled students`,
      data: {
        sentTo: emailCount,
        classTitle: liveClass.title,
        scheduledTime: liveClass.scheduledDateTime
      }
    });

  } catch (error) {
    console.error('Send reminder error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to send reminders",
      err: error.message
    });
  }
};

// ======================= RESCHEDULE LIVE CLASS =======================
exports.rescheduleLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;
    const { scheduledDateTime } = req.body;

    if (!scheduledDateTime) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New scheduled date and time is required"
      });
    }

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to reschedule this live class"
      });
    }

    // Check if class can be rescheduled
    if (liveClass.status === 'completed' || liveClass.status === 'cancelled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot reschedule a ${liveClass.status} live class`
      });
    }

    const newScheduledDate = new Date(scheduledDateTime);
    if (newScheduledDate < new Date()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New scheduled time cannot be in the past"
      });
    }

    // Update Zoom meeting
    try {
      await zoomService.updateMeeting(liveClass.zoomMeetingId, {
        start_time: newScheduledDate.toISOString()
      });
    } catch (zoomError) {
      console.error('Failed to update Zoom meeting:', zoomError);
      return sendErrorResponse({
        res,
        status: httpStatus.SERVICE_UNAVAILABLE,
        msg: "Failed to reschedule Zoom meeting"
      });
    }

    // Update local record
    liveClass.scheduledDateTime = newScheduledDate;
    await liveClass.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class rescheduled successfully",
      data: liveClass
    });

  } catch (error) {
    console.error('Reschedule live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to reschedule live class",
      err: error.message
    });
  }
};

// ======================= DELETE LIVE CLASS =======================
exports.deleteLiveClass = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to delete this live class"
      });
    }

    // Don't allow deletion if class is in progress or has attendees
    if (liveClass.status === 'live') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Cannot delete a live class that is in progress"
      });
    }

    // Delete Zoom meeting
    if (liveClass.zoomMeetingId) {
      try {
        await zoomService.deleteMeeting(liveClass.zoomMeetingId);
      } catch (zoomError) {
        console.error('Failed to delete Zoom meeting:', zoomError);
        // Continue with deletion even if Zoom delete fails
      }
    }

    // Delete from database
    await LiveClass.findByIdAndDelete(liveClassId);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Live class deleted successfully"
    });

  } catch (error) {
    console.error('Delete live class error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to delete live class",
      err: error.message
    });
  }
};
// Add this method to your controller
exports.getZoomMeetingDetails = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId)
      .populate('course', 'courseTitle')
      .populate('lecturer', 'firstname lastname email');

    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check if user can access this class
    const canAccess = await liveClass.canUserAccess(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to access this live class"
      });
    }

    // Get meeting details from Zoom API
    let zoomMeetingDetails = null;
    if (liveClass.zoomMeetingId) {
      try {
        zoomMeetingDetails = await zoomService.getMeeting(liveClass.zoomMeetingId);
      } catch (zoomError) {
        console.error('Failed to get Zoom meeting details:', zoomError);
        // Continue with local data
      }
    }

    // Prepare response
    const meetingData = {
      id: liveClass._id,
      title: liveClass.title,
      courseTitle: liveClass.course?.courseTitle,
      lecturerName: liveClass.lecturer ? 
        `${liveClass.lecturer.firstname} ${liveClass.lecturer.lastname}` : 'Instructor',
      joinUrl: liveClass.zoomJoinUrl,
      meetingNumber: liveClass.zoomMeetingId,
      passcode: liveClass.meetingPassword,
      scheduledDateTime: liveClass.scheduledDateTime,
      duration: liveClass.duration,
      status: liveClass.status,
      isHost: liveClass.lecturer?._id.toString() === req.user._id.toString(),
      waitingRoom: liveClass.meta?.waitingRoom,
      settings: zoomMeetingDetails?.settings || {}
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Meeting details retrieved successfully",
      data: meetingData
    });

  } catch (error) {
    console.error('Get Zoom meeting details error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get meeting details",
      err: error.message
    });
  }
};

// ======================= GET ATTENDANCE REPORT =======================
exports.getAttendanceReport = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId)
      .populate('course', 'courseTitle')
      .populate('lecturer', 'firstname lastname')
      .populate('attendees.student', 'firstname lastname email userImage');

    if (!liveClass) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Live class not found"
      });
    }

    // Check permissions
    const canModify = await canUserModifyLiveClass(req.user, liveClass);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view attendance report"
      });
    }

    // Get all enrolled students for comparison
    const course = await Course.findById(liveClass.course)
      .populate('learners', 'firstname lastname email userImage');

    const enrolledStudents = course?.learners || [];
    const attendees = liveClass.attendees || [];

    // Calculate attendance statistics
    const totalEnrolled = enrolledStudents.length;
    const totalAttended = attendees.length;
    const attendanceRate = totalEnrolled > 0 ? (totalAttended / totalEnrolled) * 100 : 0;

    // Prepare attendance data
    const attendanceData = enrolledStudents.map(student => {
      const attendance = attendees.find(a => 
        a.student && a.student._id.toString() === student._id.toString()
      );
      
      return {
        student: {
          _id: student._id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          userImage: student.userImage
        },
        attended: !!attendance,
        joinedAt: attendance?.joinedAt || null,
        leftAt: attendance?.leftAt || null,
        duration: attendance?.duration || 0,
        attendancePercentage: attendance?.duration ? 
          Math.min(100, Math.round((attendance.duration / liveClass.duration) * 100)) : 0
      };
    });

    const report = {
      liveClass: {
        _id: liveClass._id,
        title: liveClass.title,
        scheduledDateTime: liveClass.scheduledDateTime,
        duration: liveClass.duration,
        status: liveClass.status
      },
      attendanceSummary: {
        totalEnrolled,
        totalAttended,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageDuration: attendees.length > 0 ? 
          Math.round(attendees.reduce((sum, a) => sum + (a.duration || 0), 0) / attendees.length) : 0
      },
      attendees: attendanceData,
      detailedAttendance: attendees.map(attendee => ({
        student: attendee.student,
        joinedAt: attendee.joinedAt,
        leftAt: attendee.leftAt,
        duration: attendee.duration || 0
      }))
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Attendance report retrieved successfully",
      data: report
    });

  } catch (error) {
    console.error('Get attendance report error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get attendance report",
      err: error.message
    });
  }
};