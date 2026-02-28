const httpStatus = require('http-status');
const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const Course = require('../models/course.model');
const Week = require('../models/weeks');
const Lesson = require('../models/lessons');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE ASSIGNMENT =======================
exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      contents,
      dueDate,
      maxScore = 100,
      passingScore = 50,
      lesson,
      allowLateSubmission = false,
      lateSubmissionPenalty = 0,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!title || !contents || !dueDate || !lesson) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Title, contents, due date, and lesson are required"
      });
    }

    // Check if lesson exists
    const lessonDoc = await Lesson.findById(lesson);
    if (!lessonDoc) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Lesson not found"
      });
    }

    // Get week and course from lesson
    const week = await Week.findById(lessonDoc.week);
    if (!week) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Week not found"
      });
    }

    const course = await Course.findById(week.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if user has permission to create assignment
    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to create assignments for this course"
      });
    }

    // Validate due date
    const dueDateTime = new Date(dueDate);
    if (dueDateTime <= new Date()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Due date must be in the future"
      });
    }

    // Validate scores
    if (passingScore > maxScore) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Passing score cannot exceed maximum score"
      });
    }

    // Create assignment
    const assignment = await Assignment.create({
      title,
      description,
      contents,
      dueDate: dueDateTime,
      maxScore: parseInt(maxScore),
      passingScore: parseInt(passingScore),
      lesson,
      week: week._id,
      course: course._id,
      createdBy: req.user._id,
      allowLateSubmission,
      lateSubmissionPenalty: parseInt(lateSubmissionPenalty),
      isActive
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Assignment created successfully",
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to create assignment"
    });
  }
};

// ======================= UPDATE ASSIGNMENT =======================
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check course permissions
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to update this assignment"
      });
    }

    // Validate due date if being updated
    if (updateData.dueDate) {
      const dueDateTime = new Date(updateData.dueDate);
      if (dueDateTime <= new Date()) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: "Due date must be in the future"
        });
      }
      updateData.dueDate = dueDateTime;
    }

    // Validate scores
    if (updateData.passingScore && updateData.maxScore) {
      if (updateData.passingScore > updateData.maxScore) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: "Passing score cannot exceed maximum score"
        });
      }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true, runValidators: true }
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assignment updated successfully",
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update assignment"
    });
  }
};

// ======================= DELETE ASSIGNMENT =======================
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check permissions
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to delete this assignment"
      });
    }

    // Check if there are submissions
    const submissionCount = await Submission.countDocuments({ assignment: assignmentId });
    if (submissionCount > 0) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Cannot delete assignment with existing submissions. Archive instead."
      });
    }

    await Assignment.findByIdAndDelete(assignmentId);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assignment deleted successfully"
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to delete assignment"
    });
  }
};

// ======================= GET ASSIGNMENT BY ID =======================
exports.getAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate({
        path: 'lesson',
        select: 'lessonTitle lessonSlug'
      })
      .populate({
        path: 'week',
        select: 'title weekNumber'
      })
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug'
      })
      .populate({
        path: 'createdBy',
        select: 'firstname lastname email userImage'
      });

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check if user can view this assignment
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Admin/SuperAdmin/Lecturer can view all
    const canViewAll = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles));

    // For learners, check if they're enrolled and assignment is active
    if (!canViewAll && req.user.roles.includes('LEARNER')) {
      if (!assignment.isActive || !course.learners.some(id => id.toString() === req.user._id.toString())) {
        return sendErrorResponse({
          res,
          status: httpStatus.FORBIDDEN,
          msg: "You don't have permission to view this assignment"
        });
      }
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assignment retrieved successfully",
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get assignment"
    });
  }
};

// ======================= GET ASSIGNMENTS BY LESSON =======================
exports.getLessonAssignments = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Lesson not found"
      });
    }

    // Get week and course for permission checking
    const week = await Week.findById(lesson.week);
    if (!week) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Week not found"
      });
    }

    const course = await Course.findById(week.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Build query based on user role
    let query = { lesson: lessonId };

    // Admin/SuperAdmin/Lecturer can see all assignments
    const canSeeAll = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles));

    // For learners, only show active assignments
    if (!canSeeAll && req.user.roles.includes('LEARNER')) {
      query.isActive = true;

      // Check if learner is enrolled
      if (!course.learners.some(id => id.toString() === req.user._id.toString())) {
        return sendErrorResponse({
          res,
          status: httpStatus.FORBIDDEN,
          msg: "You are not enrolled in this course"
        });
      }
    }

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'createdBy',
        select: 'firstname lastname'
      });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assignments retrieved successfully",
      data: assignments
    });
  } catch (error) {
    console.error('Get lesson assignments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get assignments"
    });
  }
};

// ======================= GET ASSIGNMENTS BY COURSE =======================
exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check permissions
    const canViewAll = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles));

    let query = { course: courseId };

    // For learners, only show active assignments they have access to
    if (!canViewAll) {
      if (!req.user.roles.includes('LEARNER') || !course.learners.some(id => id.toString() === req.user._id.toString())) {
        return sendErrorResponse({
          res,
          status: httpStatus.FORBIDDEN,
          msg: "You don't have permission to view assignments for this course"
        });
      }
      query.isActive = true;
    }

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.dueDate = { $gte: new Date() };
    } else if (status === 'past') {
      query.dueDate = { $lt: new Date() };
    } else if (status === 'upcoming') {
      query.dueDate = { $gt: new Date() };
    }

    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate({
          path: 'lesson',
          select: 'lessonTitle'
        })
        .populate({
          path: 'week',
          select: 'title weekNumber'
        })
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Assignment.countDocuments(query)
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Course assignments retrieved successfully",
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get course assignments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get course assignments"
    });
  }
};

// ======================= TOGGLE ASSIGNMENT STATUS =======================
exports.toggleAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { isActive } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check permissions
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to update this assignment"
      });
    }

    assignment.isActive = isActive;
    await assignment.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: `Assignment ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: assignment
    });
  } catch (error) {
    console.error('Toggle assignment status error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update assignment status"
    });
  }
};

// ======================= SUBMIT ASSIGNMENT =======================
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { contents, attachments = [] } = req.body;

    if (!contents) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Submission contents are required"
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check if assignment is active and open for submission
    if (!assignment.isActive) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "This assignment is not active"
      });
    }

    if (!assignment.isOpenForSubmission()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Submission deadline has passed"
      });
    }

    // Check if user is enrolled in the course
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    if (!course.learners.some(id => id.toString() === req.user._id.toString())) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You are not enrolled in this course"
      });
    }

    // Check if user already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      submittedBy: req.user._id
    });

    if (existingSubmission) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: "You have already submitted this assignment"
      });
    }

    // Create submission
    const submission = await Submission.create({
      assignment: assignmentId,
      submittedBy: req.user._id,
      contents,
      attachments,
      status: 'submitted'
    });

    // Update assignment stats
    await assignment.updateSubmissionsCount();

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Assignment submitted successfully",
      data: submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to submit assignment"
    });
  }
};

// ======================= GRADE SUBMISSION =======================
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    if (score === undefined || score === null) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Score is required"
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assignment',
        select: 'maxScore passingScore lateSubmissionPenalty'
      });

    if (!submission) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Submission not found"
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(submission.assignment._id)
      .populate({
        path: 'course',
        select: '_id'
      });

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check permissions
    const course = await Course.findById(assignment.course._id);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    const canGrade = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles));

    if (!canGrade) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to grade submissions"
      });
    }

    // Validate score
    const maxScore = submission.assignment.maxScore || 100;
    if (score < 0 || score > maxScore) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Score must be between 0 and ${maxScore}`
      });
    }

    // Calculate final score with penalty
    const finalScore = submission.calculateFinalScore(submission.assignment);

    // Update submission
    submission.score = parseFloat(score);
    submission.feedback = feedback || submission.feedback;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    submission.finalScore = finalScore;

    await submission.save();

    // Update assignment average score
    await assignment.updateAverageScore();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Submission graded successfully",
      data: submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to grade submission"
    });
  }
};

// ======================= UPDATE SUBMISSION =======================
exports.updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { contents, attachments = [] } = req.body;

    if (!contents) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Submission contents are required"
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assignment',
        select: 'title maxScore passingScore dueDate isActive allowLateSubmission lateSubmissionPenalty'
      });

    if (!submission) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Submission not found"
      });
    }

    // Check if user owns this submission
    if (submission.submittedBy.toString() !== req.user._id.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You can only update your own submissions"
      });
    }

    // Check if assignment is active
    if (!submission.assignment.isActive) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "This assignment is not active"
      });
    }

    // Check if submission can be updated
    if (submission.score !== undefined && submission.score !== null) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Cannot update a graded submission"
      });
    }

    // Check if deadline has passed
    const now = new Date();
    const dueDate = new Date(submission.assignment.dueDate);

    if (now > dueDate && !submission.assignment.allowLateSubmission) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Submission deadline has passed and late submissions are not allowed"
      });
    }

    // Calculate if submission is late
    const isLate = now > dueDate;
    const latePenalty = isLate ? submission.assignment.lateSubmissionPenalty || 0 : 0;

    // Update submission
    submission.contents = contents;
    submission.attachments = attachments;
    submission.isLate = isLate;
    submission.latePenalty = latePenalty;
    submission.updatedAt = now;

    // If submission is late and was previously not late, we need to recalculate final score if graded
    if (isLate && submission.score !== undefined && submission.score !== null) {
      submission.finalScore = submission.calculateFinalScore(submission.assignment);
    }

    await submission.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Submission updated successfully",
      data: submission
    });
  } catch (error) {
    console.error('Update submission error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update submission"
    });
  }
};

// ======================= GET SUBMISSION =======================
exports.getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assignment',
        select: 'title maxScore passingScore dueDate'
      })
      .populate({
        path: 'submittedBy',
        select: 'firstname lastname email userImage'
      })
      .populate({
        path: 'gradedBy',
        select: 'firstname lastname email userImage'
      });

    if (!submission) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Submission not found"
      });
    }

    // Check permissions
    const assignment = await Assignment.findById(submission.assignment._id)
      .populate({
        path: 'course',
        select: '_id'
      });

    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    const course = await Course.findById(assignment.course._id);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if user can view this submission
    const canView = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles)) ||
      (req.user.roles.includes('LEARNER') && submission.submittedBy._id.toString() === req.user._id.toString());

    if (!canView) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view this submission"
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Submission retrieved successfully",
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get submission"
    });
  }
};

// ======================= GET SUBMISSIONS BY ASSIGNMENT =======================
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 20, status, graded } = req.query;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assignment not found"
      });
    }

    // Check permissions
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    const canViewSubmissions = req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN') ||
      (req.user.roles.includes('LECTURER') && await course.canUserEdit(req.user._id, req.user.roles));

    if (!canViewSubmissions) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view submissions"
      });
    }

    let query = { assignment: assignmentId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by graded status
    if (graded === 'true') {
      query.score = { $exists: true, $ne: null };
    } else if (graded === 'false') {
      query.score = { $exists: false };
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate({
          path: 'submittedBy',
          select: 'firstname lastname email userImage'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(query)
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Submissions retrieved successfully",
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get submissions"
    });
  }
};

// ======================= GET USER SUBMISSIONS =======================
exports.getUserSubmissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, courseId } = req.query;

    // Check if user can view these submissions
    const canView = req.user._id.toString() === userId ||
      req.user.roles.includes('ADMIN') ||
      req.user.roles.includes('SUPERADMIN');

    if (!canView) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view these submissions"
      });
    }

    let query = { submittedBy: userId };

    // Filter by course if provided
    if (courseId) {
      // Get assignments for this course
      const assignments = await Assignment.find({ course: courseId }).select('_id');
      const assignmentIds = assignments.map(a => a._id);
      query.assignment = { $in: assignmentIds };
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate({
          path: 'assignment',
          select: 'title maxScore dueDate course',
          populate: {
            path: 'course',
            select: 'courseTitle courseSlug'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(query)
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "User submissions retrieved successfully",
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get user submissions"
    });
  }
};

// ======================= GET MY ASSIGNMENTS (STUDENT DASHBOARD) =======================
exports.getMyAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Get all courses the user is enrolled in
    const enrolledCourses = await Course.find({
      learners: req.user._id
    }).select('_id');

    const courseIds = enrolledCourses.map(c => c._id);

    if (courseIds.length === 0) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "No enrolled courses found",
        data: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
      });
    }

    // Build query for assignments
    let query = {
      course: { $in: courseIds },
      isActive: true
    };

    // Filter by status (upcoming, past, all)
    const now = new Date();
    if (status === 'upcoming') {
      query.dueDate = { $gte: now };
    } else if (status === 'past') {
      query.dueDate = { $lt: now };
    }

    const skip = (page - 1) * limit;

    // Get assignments with course and lesson info
    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate({
          path: 'course',
          select: 'courseTitle courseSlug'
        })
        .populate({
          path: 'lesson',
          select: 'lessonTitle'
        })
        .populate({
          path: 'week',
          select: 'title weekNumber'
        })
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Assignment.countDocuments(query)
    ]);

    // Get user's submissions for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      submittedBy: req.user._id
    }).select('assignment score status feedback gradedAt createdAt');

    // Create a map of submissions by assignment ID
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    // Combine assignments with submission status
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissionMap[assignment._id.toString()];
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        contents: assignment.contents,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        passingScore: assignment.passingScore,
        course: assignment.course,
        lesson: assignment.lesson,
        week: assignment.week,
        allowLateSubmission: assignment.allowLateSubmission,
        isSubmitted: !!submission,
        submission: submission ? {
          _id: submission._id,
          score: submission.score,
          status: submission.status,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
          submittedAt: submission.createdAt
        } : null
      };
    });

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assignments retrieved successfully",
      data: assignmentsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my assignments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get assignments"
    });
  }
};

// ======================= GET INSTRUCTOR PENDING SUBMISSIONS =======================
exports.getInstructorPendingSubmissions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN');

    let courseIds;

    if (isAdmin) {
      // Admins can see all courses that are approved/published OR have published: true
      const allCourses = await Course.find({
        $or: [
          { status: { $in: ['approved', 'published'] } },
          { published: true }
        ]
      }).select('_id');
      courseIds = allCourses.map(c => c._id);
    } else {
      // Instructors can only see their own courses
      const instructorCourses = await Course.find({
        createdBy: req.user._id
      }).select('_id courseTitle');

      if (instructorCourses.length === 0) {
        return sendSuccessResponse({
          res,
          status: httpStatus.OK,
          msg: "No courses found",
          data: [],
          totalPending: 0
        });
      }

      courseIds = instructorCourses.map(c => c._id);
    }

    if (courseIds.length === 0) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "No courses found",
        data: [],
        totalPending: 0
      });
    }

    // Get all assignments for these courses
    const assignments = await Assignment.find({
      course: { $in: courseIds }
    }).select('_id title dueDate course');

    if (assignments.length === 0) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "No assignments found",
        data: [],
        totalPending: 0
      });
    }

    const assignmentIds = assignments.map(a => a._id);

    // Get pending (ungraded) submissions
    const pendingSubmissions = await Submission.find({
      assignment: { $in: assignmentIds },
      status: 'submitted' // Not yet graded
    })
      .populate({
        path: 'assignment',
        select: 'title dueDate course maxScore',
        populate: {
          path: 'course',
          select: 'courseTitle'
        }
      })
      .populate({
        path: 'submittedBy',
        select: 'firstname lastname email userImage'
      })
      .sort({ createdAt: 1 }) // Oldest first (should be graded first)
      .limit(parseInt(limit));

    // Get total count of pending submissions
    const totalPending = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      status: 'submitted'
    });

    // Group by assignment for better display
    const groupedByAssignment = {};
    pendingSubmissions.forEach(submission => {
      const assignmentId = submission.assignment._id.toString();
      if (!groupedByAssignment[assignmentId]) {
        groupedByAssignment[assignmentId] = {
          assignmentId: submission.assignment._id,
          assignmentTitle: submission.assignment.title,
          courseName: submission.assignment.course?.courseTitle || 'Unknown Course',
          dueDate: submission.assignment.dueDate,
          maxScore: submission.assignment.maxScore,
          submissions: [],
          pendingCount: 0
        };
      }
      groupedByAssignment[assignmentId].submissions.push({
        _id: submission._id,
        submittedBy: submission.submittedBy,
        submittedAt: submission.createdAt,
        isLate: submission.isLate
      });
      groupedByAssignment[assignmentId].pendingCount++;
    });

    // Convert to array and get total submissions count per assignment
    const result = await Promise.all(
      Object.values(groupedByAssignment).map(async (item) => {
        const totalSubmissions = await Submission.countDocuments({
          assignment: item.assignmentId
        });
        return {
          ...item,
          submissionsCount: totalSubmissions,
          pendingGrading: item.pendingCount
        };
      })
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Pending submissions retrieved successfully",
      data: result,
      totalPending
    });
  } catch (error) {
    console.error('Get instructor pending submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get pending submissions"
    });
  }
};

// ======================= GET INSTRUCTOR ALL SUBMISSIONS =======================
exports.getInstructorAllSubmissions = async (req, res) => {
  try {
    const { limit = 50, status, search } = req.query;
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN');

    let courseIds;

    if (isAdmin) {
      const allCourses = await Course.find({
        $or: [
          { status: { $in: ['approved', 'published'] } },
          { published: true }
        ]
      }).select('_id');
      courseIds = allCourses.map(c => c._id);
    } else {
      const instructorCourses = await Course.find({
        createdBy: req.user._id
      }).select('_id');

      if (instructorCourses.length === 0) {
        return sendSuccessResponse({
          res,
          status: httpStatus.OK,
          msg: "No courses found",
          data: [],
          total: 0
        });
      }

      courseIds = instructorCourses.map(c => c._id);
    }

    if (courseIds.length === 0) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "No courses found",
        data: [],
        total: 0
      });
    }

    // Get all assignments for these courses
    const assignments = await Assignment.find({
      course: { $in: courseIds }
    }).select('_id');

    if (assignments.length === 0) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "No assignments found",
        data: [],
        total: 0
      });
    }

    const assignmentIds = assignments.map(a => a._id);

    // Build query for submissions
    let submissionQuery = { assignment: { $in: assignmentIds } };

    // Filter by status if provided
    if (status && status !== 'all') {
      submissionQuery.status = status;
    }

    // Get all submissions
    const submissions = await Submission.find(submissionQuery)
      .populate({
        path: 'assignment',
        select: 'title dueDate course maxScore passingScore',
        populate: {
          path: 'course',
          select: 'courseTitle'
        }
      })
      .populate({
        path: 'submittedBy',
        select: 'firstname lastname email userImage'
      })
      .sort({ createdAt: -1 }) // Newest first
      .limit(parseInt(limit));

    // Get total count
    const total = await Submission.countDocuments(submissionQuery);

    // Format response
    const result = submissions.map(sub => ({
      _id: sub._id,
      assignmentId: sub.assignment?._id,
      assignmentTitle: sub.assignment?.title || 'Unknown Assignment',
      courseName: sub.assignment?.course?.courseTitle || 'Unknown Course',
      maxScore: sub.assignment?.maxScore || 100,
      passingScore: sub.assignment?.passingScore || 50,
      dueDate: sub.assignment?.dueDate,
      student: sub.submittedBy,
      submittedAt: sub.createdAt,
      status: sub.status,
      score: sub.score,
      finalScore: sub.finalScore,
      isLate: sub.isLate,
      gradedAt: sub.gradedAt
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "All submissions retrieved successfully",
      data: result,
      total
    });
  } catch (error) {
    console.error('Get instructor all submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get submissions"
    });
  }
};

// ======================= GET MY SUBMISSIONS =======================
exports.getMySubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, courseId } = req.query;

    let query = { submittedBy: req.user._id };

    // Filter by course if provided
    if (courseId) {
      const assignments = await Assignment.find({ course: courseId }).select('_id');
      const assignmentIds = assignments.map(a => a._id);
      query.assignment = { $in: assignmentIds };
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate({
          path: 'assignment',
          select: 'title maxScore dueDate course lesson',
          populate: [
            {
              path: 'course',
              select: 'courseTitle courseSlug'
            },
            {
              path: 'lesson',
              select: 'lessonTitle'
            }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(query)
    ]);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Your submissions retrieved successfully",
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get your submissions"
    });
  }
};
