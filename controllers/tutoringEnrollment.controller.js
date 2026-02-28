const httpStatus = require('http-status');
const moment = require('moment');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const { responseHandler } = require('../helpers/index');
const mailer = require('../helpers/mailer');
const { parseFilters, sendErrorResponse, sendQueryResponse, sendSuccessResponse } = responseHandler;

/**
 * Helper function to add entry to status history
 */
function addStatusHistoryEntry(enrollment, status, userId, note = null) {
  enrollment.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: userId,
    note,
  });
}

// ======================= STUDENT ENDPOINTS =======================

/**
 * Get current student's subscriptions
 * GET /tutoring-enrollments/my-subscriptions
 * Requires: verifyUser + verifyLearner
 */
exports.getMySubscriptions = async (req, res) => {
  try {
    const { status } = req.query;

    // Build query
    const query = { student: req.user._id };

    const enrollments = await TutoringEnrollment.find(query)
      .populate('subject', 'name slug monthlyPrice')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname')
      .sort({ createdAt: -1 });

    // Filter by computed status if provided
    let filteredEnrollments = enrollments;
    if (status) {
      filteredEnrollments = enrollments.filter(e => e.status === status);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Subscriptions retrieved successfully.',
      data: filteredEnrollments
    });
  } catch (err) {
    console.error('Get my subscriptions error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get subscriptions.',
      err: err.message
    });
  }
};

/**
 * Get a specific subscription by ID
 * GET /tutoring-enrollments/:id
 * Requires: verifyUser (ownership check or admin)
 */
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await TutoringEnrollment.findById(id)
      .populate('request')
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name slug monthlyPrice description')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Subscription not found.'
      });
    }

    // Check authorization: user must own the subscription or be admin
    const isOwner = enrollment.student._id.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to view this subscription.'
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Subscription retrieved successfully.',
      data: enrollment
    });
  } catch (err) {
    console.error('Get subscription by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get subscription.',
      err: err.message
    });
  }
};

// ======================= ADMIN ENDPOINTS =======================

/**
 * Get all subscriptions (admin)
 * GET /tutoring-enrollments
 * Requires: verifyAdmin
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    const populate = [
      { path: 'student', select: 'firstname lastname email' },
      { path: 'subject', select: 'name monthlyPrice' },
      { path: 'instructor', select: 'firstname lastname email' }
    ];

    // Query without .lean() so virtuals (status, isLastTrialDay, etc.) are preserved
    const enrollments = await TutoringEnrollment.find()
      .sort({ createdAt: -1 })
      .populate(populate);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: enrollments,
      msg: 'Subscriptions retrieved successfully.'
    });
  } catch (err) {
    console.error('Get all subscriptions error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get subscriptions.',
      err: err.message
    });
  }
};

/**
 * Activate a subscription (start active period)
 * POST /tutoring-enrollments/:id/activate
 * Requires: verifyAdmin
 */
exports.activateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Subscription not found.'
      });
    }

    // Cannot activate if cancelled
    if (enrollment.adminStatus === 'cancelled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot activate a cancelled subscription.'
      });
    }

    // Calculate new period (1 month from now)
    const now = new Date();
    const periodEnd = moment(now).add(1, 'month').toDate();

    // Update enrollment
    enrollment.adminStatus = 'active';
    enrollment.currentPeriodStart = now;
    enrollment.currentPeriodEnd = periodEnd;
    enrollment.paymentStatus = 'verified';

    // Add to status history
    addStatusHistoryEntry(enrollment, 'active', req.user._id, 'Subscription activated by admin');

    await enrollment.save();

    // Send email notification (don't block on failure)
    try {
      await mailer.sendSubscriptionActivatedMail({
        email: enrollment.student.email,
        firstname: enrollment.student.firstname,
        subjectName: enrollment.subject.name,
        renewalDate: moment(periodEnd).format('MMMM D, YYYY')
      });
    } catch (emailErr) {
      console.error('Failed to send activation email:', emailErr);
    }

    // Fetch with full populate for response
    const updatedEnrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Subscription activated successfully.',
      data: updatedEnrollment
    });
  } catch (err) {
    console.error('Activate subscription error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to activate subscription.',
      err: err.message
    });
  }
};

/**
 * Pause a subscription
 * POST /tutoring-enrollments/:id/pause
 * Requires: verifyAdmin
 */
exports.pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await TutoringEnrollment.findById(id);

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Subscription not found.'
      });
    }

    // Cannot pause if already cancelled
    if (enrollment.adminStatus === 'cancelled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot pause a cancelled subscription.'
      });
    }

    // Update enrollment
    enrollment.adminStatus = 'paused';

    // Add to status history
    addStatusHistoryEntry(enrollment, 'paused', req.user._id, 'Subscription paused by admin');

    await enrollment.save();

    // Fetch with full populate for response
    const updatedEnrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Subscription paused successfully.',
      data: updatedEnrollment
    });
  } catch (err) {
    console.error('Pause subscription error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to pause subscription.',
      err: err.message
    });
  }
};

/**
 * Cancel a subscription
 * POST /tutoring-enrollments/:id/cancel
 * Requires: verifyAdmin
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Subscription not found.'
      });
    }

    // Update enrollment
    enrollment.adminStatus = 'cancelled';

    // Add to status history
    addStatusHistoryEntry(enrollment, 'cancelled', req.user._id, 'Subscription cancelled by admin');

    await enrollment.save();

    // Send cancellation email (don't block on failure)
    try {
      await mailer.sendSubscriptionCancelledMail({
        email: enrollment.student.email,
        firstname: enrollment.student.firstname,
        subjectName: enrollment.subject.name
      });
    } catch (emailErr) {
      console.error('Failed to send cancellation email:', emailErr);
    }

    // Fetch with full populate for response
    const updatedEnrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Subscription cancelled successfully.',
      data: updatedEnrollment
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to cancel subscription.',
      err: err.message
    });
  }
};

/**
 * Extend a subscription
 * POST /tutoring-enrollments/:id/extend
 * Requires: verifyAdmin
 * Body: { days: number (1-30) }
 */
exports.extendSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    // Validate days
    if (!days || typeof days !== 'number' || days < 1 || days > 30) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Days must be a number between 1 and 30.'
      });
    }

    const enrollment = await TutoringEnrollment.findById(id);

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Subscription not found.'
      });
    }

    // Cannot extend if cancelled
    if (enrollment.adminStatus === 'cancelled') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot extend a cancelled subscription.'
      });
    }

    // If no current period, start from now
    if (!enrollment.currentPeriodEnd) {
      enrollment.currentPeriodStart = new Date();
      enrollment.currentPeriodEnd = moment().add(days, 'days').toDate();
    } else {
      // Extend existing period
      enrollment.currentPeriodEnd = moment(enrollment.currentPeriodEnd).add(days, 'days').toDate();
    }

    // Add to status history
    addStatusHistoryEntry(enrollment, 'active', req.user._id, `Extended by ${days} days`);

    await enrollment.save();

    // Fetch with full populate for response
    const updatedEnrollment = await TutoringEnrollment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name monthlyPrice')
      .populate('instructor', 'firstname lastname email')
      .populate('statusHistory.changedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Subscription extended by ${days} days successfully.`,
      data: updatedEnrollment
    });
  } catch (err) {
    console.error('Extend subscription error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to extend subscription.',
      err: err.message
    });
  }
};
