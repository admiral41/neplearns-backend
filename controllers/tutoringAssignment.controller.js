const httpStatus = require('http-status');
const TutoringAssignment = require('../models/tutoringAssignment.model');
const TutoringEnrollment = require('../models/tutoringEnrollment.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const notificationService = require('../services/notificationService');
const sanitizeHtml = require('../helpers/sanitizeHtml');
const mailer = require('../helpers/mailer');

// ======================= INSTRUCTOR ENDPOINTS =======================

/**
 * Create a tutoring assignment
 * POST /tutoring-assignments
 * Requires: verifyUser + verifyLecturer
 */
exports.create = async (req, res) => {
  try {
    const { enrollmentId, title, description, dueDate } = req.body;

    if (!enrollmentId || !title) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Enrollment ID and title are required.',
      });
    }

    const enrollment = await TutoringEnrollment.findById(enrollmentId)
      .populate('subject', 'name');

    if (!enrollment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Enrollment not found.',
      });
    }

    if (enrollment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to create assignments for this enrollment.',
      });
    }

    // Build attachments from uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
        });
      }
    }

    const assignment = new TutoringAssignment({
      enrollment: enrollment._id,
      student: enrollment.student,
      instructor: req.user._id,
      subject: enrollment.subject._id,
      title,
      description: sanitizeHtml(description) || undefined,
      attachments,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await assignment.save();

    const populated = await TutoringAssignment.findById(assignment._id)
      .populate('student', 'firstname lastname email')
      .populate('instructor', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify student about new assignment (push + socket)
    try {
      await notificationService.notifyAssignmentCreated(populated);
    } catch (notifErr) {
      console.error('Failed to send assignment created notification:', notifErr);
    }

    // Send email notification to student
    try {
      await mailer.sendTutoringHomeworkMail({
        email: populated.student.email,
        firstname: populated.student.firstname,
        lastname: populated.student.lastname,
        instructorName: `${populated.instructor.firstname} ${populated.instructor.lastname}`,
        assignmentTitle: populated.title,
        subjectName: populated.subject.name,
        dueDate: populated.dueDate,
        assignmentLink: `${process.env.FRONTEND_URI}/student-dashboard/tutoring/assignments`
      });
    } catch (emailErr) {
      console.error('Failed to send assignment email:', emailErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: 'Assignment created successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to create assignment.',
      err: err.message,
    });
  }
};

/**
 * Get instructor's assignments
 * GET /tutoring-assignments/instructor
 * Requires: verifyUser + verifyLecturer
 */
exports.getInstructorAssignments = async (req, res) => {
  try {
    const { studentId, enrollmentId, status } = req.query;

    const query = { instructor: req.user._id };
    if (studentId) query.student = studentId;
    if (enrollmentId) query.enrollment = enrollmentId;
    if (status) query.status = status;

    const assignments = await TutoringAssignment.find(query)
      .populate('student', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignments retrieved successfully.',
      data: assignments,
    });
  } catch (err) {
    console.error('Get instructor assignments error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get assignments.',
      err: err.message,
    });
  }
};

/**
 * Get student's assignments
 * GET /tutoring-assignments/student
 * Requires: verifyUser + verifyLearner
 */
exports.getStudentAssignments = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { student: req.user._id };
    if (status) query.status = status;

    const assignments = await TutoringAssignment.find(query)
      .populate('instructor', 'firstname lastname email profileImage')
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignments retrieved successfully.',
      data: assignments,
    });
  } catch (err) {
    console.error('Get student assignments error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get assignments.',
      err: err.message,
    });
  }
};

/**
 * Get assignment by ID
 * GET /tutoring-assignments/:id
 * Requires: verifyUser (student or instructor)
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await TutoringAssignment.findById(id)
      .populate('student', 'firstname lastname email profileImage')
      .populate('instructor', 'firstname lastname email profileImage')
      .populate('subject', 'name');

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    const isStudent = assignment.student._id.toString() === req.user._id.toString();
    const isInstructor = assignment.instructor._id.toString() === req.user._id.toString();

    if (!isStudent && !isInstructor) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to view this assignment.',
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignment retrieved successfully.',
      data: assignment,
    });
  } catch (err) {
    console.error('Get assignment by ID error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to get assignment.',
      err: err.message,
    });
  }
};

/**
 * Update assignment (title, description, dueDate) - only if no submission yet
 * PATCH /tutoring-assignments/:id
 * Requires: verifyUser + verifyLecturer
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    const assignment = await TutoringAssignment.findById(id);

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to update this assignment.',
      });
    }

    if (assignment.status !== 'active') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot update an assignment that has been submitted or reviewed.',
      });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = sanitizeHtml(description);
    if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : null;

    await assignment.save();

    const populated = await TutoringAssignment.findById(assignment._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignment updated successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('Update assignment error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to update assignment.',
      err: err.message,
    });
  }
};

/**
 * Delete assignment - only if no submission yet
 * DELETE /tutoring-assignments/:id
 * Requires: verifyUser + verifyLecturer
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await TutoringAssignment.findById(id);

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to delete this assignment.',
      });
    }

    if (assignment.status !== 'active') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Cannot delete an assignment that has been submitted or reviewed.',
      });
    }

    await TutoringAssignment.findByIdAndDelete(id);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignment deleted successfully.',
    });
  } catch (err) {
    console.error('Delete assignment error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to delete assignment.',
      err: err.message,
    });
  }
};

// ======================= STUDENT ENDPOINTS =======================

/**
 * Submit work for an assignment
 * POST /tutoring-assignments/:id/submit
 * Requires: verifyUser + verifyLearner
 */
exports.submit = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const assignment = await TutoringAssignment.findById(id);

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    if (assignment.student.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to submit for this assignment.',
      });
    }

    // Allow submission when active OR revision_requested
    if (assignment.status !== 'active' && assignment.status !== 'revision_requested') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'This assignment has already been submitted or reviewed.',
      });
    }

    // Build submission attachments from uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
        });
      }
    }

    if (!content && attachments.length === 0) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Please provide submission content or upload files.',
      });
    }

    // Archive previous submission to history if resubmitting
    if (assignment.status === 'revision_requested' && assignment.submission?.submittedAt) {
      assignment.revisionHistory.push({
        type: 'submission',
        content: assignment.submission.content,
        attachments: assignment.submission.attachments || [],
        createdAt: assignment.submission.submittedAt,
        by: assignment.student,
      });
    }

    assignment.submission = {
      content: sanitizeHtml(content) || undefined,
      attachments,
      submittedAt: new Date(),
    };
    assignment.status = 'submitted';

    await assignment.save();

    const populated = await TutoringAssignment.findById(assignment._id)
      .populate('student', 'firstname lastname email')
      .populate('instructor', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify instructor about submission
    try {
      await notificationService.notifyAssignmentSubmitted(populated);
    } catch (notifErr) {
      console.error('Failed to send assignment submitted notification:', notifErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Assignment submitted successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('Submit assignment error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to submit assignment.',
      err: err.message,
    });
  }
};

// ======================= FEEDBACK ENDPOINT =======================

/**
 * Give feedback on a submitted assignment
 * POST /tutoring-assignments/:id/feedback
 * Requires: verifyUser + verifyLecturer
 */
exports.giveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Feedback content is required.',
      });
    }

    const assignment = await TutoringAssignment.findById(id);

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to give feedback on this assignment.',
      });
    }

    if (assignment.status !== 'submitted') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Can only give feedback on submitted assignments.',
      });
    }

    assignment.feedback = {
      content: sanitizeHtml(content),
      givenAt: new Date(),
    };
    assignment.status = 'reviewed';

    await assignment.save();

    const populated = await TutoringAssignment.findById(assignment._id)
      .populate('student', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify student about review
    try {
      await notificationService.notifyAssignmentReviewed(populated);
    } catch (notifErr) {
      console.error('Failed to send assignment reviewed notification:', notifErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Feedback given successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('Give feedback error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to give feedback.',
      err: err.message,
    });
  }
};

/**
 * Request changes on a submitted assignment
 * POST /tutoring-assignments/:id/request-changes
 * Requires: verifyUser + verifyLecturer
 */
exports.requestChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Change request content is required.',
      });
    }

    const assignment = await TutoringAssignment.findById(id);

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: 'Assignment not found.',
      });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: 'You are not authorized to request changes on this assignment.',
      });
    }

    if (assignment.status !== 'submitted') {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: 'Can only request changes on submitted assignments.',
      });
    }

    // Archive current submission to revision history
    if (assignment.submission?.submittedAt) {
      assignment.revisionHistory.push({
        type: 'submission',
        content: assignment.submission.content,
        attachments: assignment.submission.attachments || [],
        createdAt: assignment.submission.submittedAt,
        by: assignment.student,
      });
    }

    // Add change request to revision history
    assignment.revisionHistory.push({
      type: 'revision_request',
      content: sanitizeHtml(content),
      attachments: [],
      createdAt: new Date(),
      by: req.user._id,
    });

    assignment.status = 'revision_requested';
    assignment.revisionCount = (assignment.revisionCount || 0) + 1;

    await assignment.save();

    const populated = await TutoringAssignment.findById(assignment._id)
      .populate('student', 'firstname lastname email')
      .populate('instructor', 'firstname lastname email')
      .populate('subject', 'name');

    // Notify student about revision request
    try {
      await notificationService.notifyRevisionRequested(populated);
    } catch (notifErr) {
      console.error('Failed to send revision requested notification:', notifErr);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: 'Revision requested successfully.',
      data: populated,
    });
  } catch (err) {
    console.error('Request changes error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: 'Failed to request changes.',
      err: err.message,
    });
  }
};
