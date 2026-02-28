const httpStatus = require('http-status');
const moment = require('moment');
const TutoringRequest = require('../models/tutoringRequest.model');
const TutoringSubject = require('../models/tutoringSubject.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const User = require('../models/user.model');
const { responseHandler } = require('../helpers/index');
const mailer = require('../helpers/mailer');
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler;
const notificationService = require('../services/notificationService');

// ======================= STUDENT ENDPOINTS =======================

/**
 * Create a new tutoring request
 * POST /tutoring-requests
 * Requires: verifyUser + verifyLearner
 */
exports.createRequest = async (req, res) => {
  try {
    const { subjectId, preferredTimeSlots, message } = req.body;

    // Validate required fields
    if (!subjectId) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Subject ID is required.'
      });
    }

    // Validate subject exists and is active
    const subject = await TutoringSubject.findById(subjectId);
    if (!subject) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring subject not found.'
      });
    }

    if (!subject.isActive) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'This tutoring subject is not currently available.'
      });
    }

    // Check for existing active enrollment for same student+subject
    const existingEnrollment = await TutoringEnrollment.findOne({
      student: req.user._id,
      subject: subjectId,
    });

    if (existingEnrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'You are already enrolled in tutoring for this subject.'
      });
    }

    // Check for existing pending/assigned request for same student+subject
    const existingRequest = await TutoringRequest.findOne({
      student: req.user._id,
      subject: subjectId,
      status: { $in: ['pending', 'assigned'] }
    });

    if (existingRequest) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'You already have a pending request for this subject.'
      });
    }

    // Create request
    const request = await TutoringRequest.create({
      student: req.user._id,
      subject: subjectId,
      status: 'pending',
      preferredTimeSlots: preferredTimeSlots || [],
      message: message || ''
    });

    // Populate and return
    const populatedRequest = await TutoringRequest.findById(request._id)
      .populate('subject', 'name slug monthlyPrice')
      .populate('student', 'firstname lastname email');

    // Notify admins about new request
    try {
      await notificationService.notifyNewTutoringRequest(request, req.user, subject);
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
      // Don't fail request creation if notification fails
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Tutoring request created successfully.',
      data: populatedRequest
    });
  } catch (err) {
    console.error('Create tutoring request error:', err);

    // Handle duplicate key error from partial unique index
    if (err.code === 11000) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'You already have a pending request for this subject.'
      });
    }

    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create tutoring request.',
      err: err.message
    });
  }
};

/**
 * Get current user's tutoring requests
 * GET /tutoring-requests/my-requests
 * Requires: verifyUser + verifyLearner
 */
exports.getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;

    // Build query
    const query = { student: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await TutoringRequest.find(query)
      .populate('subject', 'name slug monthlyPrice')
      .populate('assignedInstructor', 'firstname lastname')
      .sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring requests retrieved successfully.',
      data: requests
    });
  } catch (err) {
    console.error('Get my tutoring requests error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tutoring requests.',
      err: err.message
    });
  }
};

/**
 * Get a specific tutoring request by ID
 * GET /tutoring-requests/:id
 * Requires: verifyUser (ownership check or admin)
 */
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await TutoringRequest.findById(id)
      .populate('subject', 'name slug monthlyPrice description')
      .populate('student', 'firstname lastname email')
      .populate('assignedInstructor', 'firstname lastname email')
      .populate('assignedBy', 'firstname lastname')
      .populate('rejectedBy', 'firstname lastname');

    if (!request) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring request not found.'
      });
    }

    // Check authorization: user must own the request or be admin
    const isOwner = request.student._id.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to view this request.'
      });
    }

    // If admin, include adminNotes
    const responseData = isAdmin ? {
      ...request.toObject(),
      adminNotes: request.adminNotes
    } : request;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring request retrieved successfully.',
      data: responseData
    });
  } catch (err) {
    console.error('Get tutoring request error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tutoring request.',
      err: err.message
    });
  }
};

// ======================= ADMIN ENDPOINTS =======================

/**
 * Get all tutoring requests (admin)
 * GET /tutoring-requests
 * Requires: verifyAdmin
 */
exports.getAllRequests = async (req, res) => {
  try {
    let { page, size, sortQuery, searchQuery, selectQuery, populate } = parseFilters(req);

    // Status filter from query param
    const { status } = req.query;
    if (status) {
      searchQuery = { ...searchQuery, status };
    }

    // Default sort by createdAt desc
    if (!sortQuery || Object.keys(sortQuery).length === 0 || (sortQuery._id && Object.keys(sortQuery).length === 1)) {
      sortQuery = { createdAt: -1 };
    }

    // Set up populate
    populate = [
      { path: 'student', select: 'firstname lastname email' },
      { path: 'subject', select: 'name monthlyPrice' },
      { path: 'assignedInstructor', select: 'firstname lastname email' }
    ];

    const result = await sendQueryResponse({
      model: TutoringRequest,
      page,
      size,
      sortQuery,
      searchQuery,
      selectQuery,
      populate,
    });

    // Include adminNotes for admin responses
    const dataWithNotes = result.data.map(request => ({
      ...request.toObject ? request.toObject() : request,
      adminNotes: request.adminNotes
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: dataWithNotes,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(size) || 10,
        total: result.totalData,
        totalPages: result.totalPage
      },
      msg: 'Tutoring requests retrieved successfully.'
    });
  } catch (err) {
    console.error('Get all tutoring requests error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get tutoring requests.',
      err: err.message
    });
  }
};

/**
 * Assign an instructor to a tutoring request
 * POST /tutoring-requests/:id/assign
 * Requires: verifyAdmin
 */
exports.assignInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId, platformFeePercentage } = req.body;

    // Validate instructorId
    if (!instructorId) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Instructor ID is required.'
      });
    }

    // Find request
    const request = await TutoringRequest.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice platformFeePercentage');

    if (!request) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring request not found.'
      });
    }

    // Validate status is pending
    if (request.status !== 'pending') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot assign instructor. Request status is '${request.status}', expected 'pending'.`
      });
    }

    // Validate instructor exists and has LECTURER role
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Instructor not found.'
      });
    }

    if (!instructor.roles.includes('LECTURER')) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Selected user is not an instructor.'
      });
    }

    // Update request
    request.status = 'assigned';
    request.assignedInstructor = instructorId;
    request.assignedAt = new Date();
    request.assignedBy = req.user._id;
    await request.save();

    // Create enrollment with 2-day trial period
    const trialStartedAt = new Date();
    const trialEndsAt = moment(trialStartedAt).add(2, 'days').toDate();

    // Determine platform fee: use provided value, subject default, or fallback to 15%
    const feePercentage = platformFeePercentage !== undefined
      ? platformFeePercentage
      : (request.subject.platformFeePercentage ?? 15);

    const enrollment = await TutoringEnrollment.create({
      request: request._id,
      student: request.student._id,
      subject: request.subject._id,
      instructor: instructorId,
      trialStartedAt,
      trialEndsAt,
      monthlyPrice: request.subject.monthlyPrice,
      platformFeePercentage: feePercentage,
      statusHistory: [{
        status: 'trial',
        changedAt: trialStartedAt,
        changedBy: req.user._id,
        note: 'Enrollment created with 2-day trial'
      }]
    });

    // Link enrollment to request
    request.enrollment = enrollment._id;
    await request.save();

    // Send notifications to student (push + socket + email)
    try {
      await notificationService.notifyInstructorAssigned({
        student: request.student,
        instructor,
        subject: request.subject,
        enrollmentId: enrollment._id
      });
    } catch (notifErr) {
      console.error('Failed to send instructor assigned notification to student:', notifErr);
    }

    try {
      await mailer.sendTutoringAssignmentMail({
        email: request.student.email,
        firstname: request.student.firstname,
        lastname: request.student.lastname,
        subjectName: request.subject.name,
        instructorName: `${instructor.firstname} ${instructor.lastname}`,
        dashboardLink: `${process.env.FRONTEND_URI}/student-dashboard/tutoring`
      });
    } catch (emailErr) {
      console.error('Failed to send assignment email to student:', emailErr);
    }

    // Send notifications to instructor (push + socket + email)
    try {
      await notificationService.notifyNewStudentAssigned({
        student: request.student,
        instructor,
        subject: request.subject,
        enrollmentId: enrollment._id
      });
    } catch (notifErr) {
      console.error('Failed to send new student notification to instructor:', notifErr);
    }

    try {
      await mailer.sendNewStudentAssignedMail({
        email: instructor.email,
        firstname: instructor.firstname,
        lastname: instructor.lastname,
        studentName: `${request.student.firstname} ${request.student.lastname}`,
        subjectName: request.subject.name,
        dashboardLink: `${process.env.FRONTEND_URI}/instructor-dashboard/tutoring/students`
      });
    } catch (emailErr) {
      console.error('Failed to send assignment email to instructor:', emailErr);
    }

    // Populate and return
    const updatedRequest = await TutoringRequest.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('assignedInstructor', 'firstname lastname email')
      .populate('assignedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Instructor assigned successfully.',
      data: updatedRequest
    });
  } catch (err) {
    console.error('Assign instructor error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to assign instructor.',
      err: err.message
    });
  }
};

/**
 * Reject a tutoring request
 * POST /tutoring-requests/:id/reject
 * Requires: verifyAdmin
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate reason
    if (!reason) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Rejection reason is required.'
      });
    }

    // Find request
    const request = await TutoringRequest.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    if (!request) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring request not found.'
      });
    }

    // Validate status is pending
    if (request.status !== 'pending') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Cannot reject request. Request status is '${request.status}', expected 'pending'.`
      });
    }

    // Update request
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.rejectedAt = new Date();
    request.rejectedBy = req.user._id;
    await request.save();

    // Send email notification to student
    try {
      await mailer.sendTutoringRejectionMail({
        email: request.student.email,
        firstname: request.student.firstname,
        lastname: request.student.lastname,
        subjectName: request.subject.name,
        reason: reason,
        dashboardLink: `${process.env.FRONTEND_URI}/student-dashboard/tutoring`
      });
    } catch (emailErr) {
      console.error('Failed to send rejection email:', emailErr);
      // Don't fail the request if email fails
    }

    // Populate and return
    const updatedRequest = await TutoringRequest.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name')
      .populate('rejectedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Tutoring request rejected.',
      data: updatedRequest
    });
  } catch (err) {
    console.error('Reject request error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to reject request.',
      err: err.message
    });
  }
};

/**
 * Update admin notes on a tutoring request
 * PATCH /tutoring-requests/:id/notes
 * Requires: verifyAdmin
 */
exports.updateAdminNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const request = await TutoringRequest.findById(id);

    if (!request) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Tutoring request not found.'
      });
    }

    request.adminNotes = notes;
    await request.save();

    // Populate and return
    const updatedRequest = await TutoringRequest.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('assignedInstructor', 'firstname lastname email');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Admin notes updated successfully.',
      data: {
        ...updatedRequest.toObject(),
        adminNotes: request.adminNotes
      }
    });
  } catch (err) {
    console.error('Update admin notes error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update admin notes.',
      err: err.message
    });
  }
};
