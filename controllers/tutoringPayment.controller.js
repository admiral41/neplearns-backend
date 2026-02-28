const TutoringPayment = require('../models/tutoringPayment.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const { responseHandler } = require('../helpers/index');
const httpStatus = require('http-status');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const mailer = require('../helpers/mailer');

const { sendSuccessResponse, sendErrorResponse } = responseHandler;

/**
 * Helper to delete uploaded file on error
 */
const deleteUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
  } catch (err) {
    console.error('Error deleting file:', err);
  }
};

/**
 * Submit payment proof (Student endpoint)
 * POST /tutoring-payments
 */
exports.submitPayment = async (req, res) => {
  // Store file path for potential cleanup
  const uploadedFilePath = req.file ? req.file.path : null;

  try {
    // Validate file exists
    if (!req.file) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Payment proof image is required',
      });
    }

    const { enrollmentId, paymentMethod, studentNotes } = req.body;

    if (!enrollmentId) {
      deleteUploadedFile(uploadedFilePath);
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Enrollment ID is required',
      });
    }

    // Find enrollment and verify ownership
    const enrollment = await TutoringEnrollment.findById(enrollmentId);

    if (!enrollment) {
      deleteUploadedFile(uploadedFilePath);
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Enrollment not found',
      });
    }

    // Verify ownership
    if (enrollment.student.toString() !== req.user._id.toString()) {
      deleteUploadedFile(uploadedFilePath);
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You can only submit payment for your own enrollments',
      });
    }

    // Check for duplicate pending payment
    if (enrollment.paymentStatus === 'pending_verification') {
      deleteUploadedFile(uploadedFilePath);
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: 'A payment is already pending verification for this enrollment. Please wait for admin review.',
      });
    }

    // Create payment record
    const payment = await TutoringPayment.create({
      enrollment: enrollmentId,
      student: req.user._id,
      amount: enrollment.monthlyPrice,
      paymentMethod: paymentMethod || 'bank_transfer',
      proofImage: `uploads/${req.file.filename}`,
      studentNotes: studentNotes || '',
    });

    // Update enrollment
    enrollment.paymentStatus = 'pending_verification';
    enrollment.latestPayment = payment._id;
    await enrollment.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Payment submitted successfully. Awaiting admin verification.',
      data: { payment },
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    deleteUploadedFile(uploadedFilePath);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to submit payment',
    });
  }
};

/**
 * Verify payment (Admin endpoint)
 * POST /tutoring-payments/:id/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNotes, rejectionReason } = req.body;

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Action must be either "approve" or "reject"',
      });
    }

    // Require rejection reason if rejecting
    if (action === 'reject' && !rejectionReason) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Rejection reason is required when rejecting a payment',
      });
    }

    // Find payment
    const payment = await TutoringPayment.findById(id);

    if (!payment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Payment not found',
      });
    }

    // Check if already processed
    if (payment.status !== 'pending') {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: `Payment has already been ${payment.status}`,
      });
    }

    // Update payment
    payment.status = action === 'approve' ? 'approved' : 'rejected';
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.adminNotes = adminNotes || '';
    if (action === 'reject') {
      payment.rejectionReason = rejectionReason;
    }
    await payment.save();

    // Find enrollment with populated student and subject
    const enrollment = await TutoringEnrollment.findById(payment.enrollment)
      .populate('student', 'email firstname lastname')
      .populate('subject', 'name');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Enrollment not found',
      });
    }

    if (action === 'approve') {
      // Activate subscription
      enrollment.paymentStatus = 'verified';
      enrollment.currentPeriodStart = new Date();
      enrollment.currentPeriodEnd = moment().add(1, 'month').toDate();
      enrollment.adminStatus = 'active';

      // Add to status history
      enrollment.statusHistory.push({
        status: 'active',
        changedBy: req.user._id,
        note: 'Payment verified - subscription activated',
      });

      await enrollment.save();

      // Send activation email (non-blocking)
      try {
        await mailer.sendSubscriptionActivatedMail({
          email: enrollment.student.email,
          firstname: enrollment.student.firstname,
          subjectName: enrollment.subject.name,
          renewalDate: moment(enrollment.currentPeriodEnd).format('MMMM D, YYYY'),
        });
      } catch (emailError) {
        console.error('Failed to send activation email:', emailError);
        // Non-blocking - continue anyway
      }
    } else {
      // Rejection
      enrollment.paymentStatus = 'failed';

      // Add to status history
      enrollment.statusHistory.push({
        status: 'pending',
        changedBy: req.user._id,
        note: `Payment rejected: ${rejectionReason}`,
      });

      await enrollment.save();

      // Send rejection email (non-blocking)
      try {
        await mailer.sendPaymentRejectedMail({
          email: enrollment.student.email,
          firstname: enrollment.student.firstname,
          subjectName: enrollment.subject.name,
          reason: rejectionReason,
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Non-blocking - continue anyway
      }
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: { payment, enrollment },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to verify payment',
    });
  }
};

/**
 * Get pending payments (Admin endpoint)
 * GET /tutoring-payments
 */
exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await TutoringPayment.find({ status: 'pending' })
      .sort({ createdAt: 1 }) // Oldest first
      .populate('student', 'firstname lastname email')
      .populate({
        path: 'enrollment',
        select: 'subject monthlyPrice trialEndsAt',
        populate: {
          path: 'subject',
          select: 'name level',
        },
      });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Pending payments retrieved',
      data: { payments, count: payments.length },
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve pending payments',
    });
  }
};

/**
 * Get payment history for an enrollment (Student/Admin endpoint)
 * GET /tutoring-payments/enrollment/:enrollmentId
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    // Find enrollment to verify ownership
    const enrollment = await TutoringEnrollment.findById(enrollmentId);

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Enrollment not found',
      });
    }

    // Check authorization: owner or admin
    const isOwner = enrollment.student.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'Access denied',
      });
    }

    const payments = await TutoringPayment.find({ enrollment: enrollmentId })
      .sort({ createdAt: -1 }) // Newest first
      .populate('verifiedBy', 'firstname lastname');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Payment history retrieved',
      data: { payments, count: payments.length },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve payment history',
    });
  }
};

/**
 * Get single payment by ID (Student/Admin endpoint)
 * GET /tutoring-payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await TutoringPayment.findById(id)
      .populate('student', 'firstname lastname email')
      .populate('verifiedBy', 'firstname lastname')
      .populate({
        path: 'enrollment',
        select: 'subject monthlyPrice status',
        populate: {
          path: 'subject',
          select: 'name level',
        },
      });

    if (!payment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Payment not found',
      });
    }

    // Check authorization: owner or admin
    const isOwner = payment.student._id.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'Access denied',
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Payment retrieved',
      data: { payment },
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to retrieve payment',
    });
  }
};
