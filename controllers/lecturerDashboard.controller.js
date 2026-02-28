const httpStatus = require('http-status');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Lecturer = require('../models/lecturer.model');
const Week = require('../models/weeks');
const Lesson = require('../models/lessons');
const LessonStatus = require('../models/lessonStatus');
const Enrollment = require('../models/enrollment.model');
const Assessment = require('../models/assessment.model');
const Submission = require('../models/submission.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= LECTURER COURSE STATISTICS =======================
exports.getLecturerCourseStats = async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({
      user: req.user._id,
      requestStatus: 'approved',
      isActive: true
    });

    if (!lecturer) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You are not an approved lecturer"
      });
    }

    // Get all courses where lecturer is assigned
    const courses = await Course.find({
      $or: [
        { createdBy: req.user._id },
        { lecturers: lecturer._id }
      ],
      status: { $in: ['approved', 'published'] }
    })
    .populate('category', 'categoryName')
    .select('courseTitle courseSlug totalEnrollments rating published publishedAt createdAt');

    // Calculate detailed statistics
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const courseStats = {
          courseId: course._id,
          courseTitle: course.courseTitle,
          courseSlug: course.courseSlug,
          category: course.category?.categoryName,
          totalEnrollments: course.totalEnrollments,
          rating: course.rating,
          published: course.published,
          publishedAt: course.publishedAt,
          createdAt: course.createdAt
        };

        // Get detailed enrollment data
        const enrollments = await Enrollment.find({
          course: course._id,
          status: 'active'
        })
        .populate('student', 'firstname lastname email userImage enrolledAt')
        .sort({ enrolledAt: -1 });

        // Calculate weekly/monthly enrollment trends
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyEnrollments = enrollments.filter(e => 
          e.enrolledAt >= oneWeekAgo
        ).length;

        const monthlyEnrollments = enrollments.filter(e => 
          e.enrolledAt >= oneMonthAgo
        ).length;

        courseStats.weeklyEnrollments = weeklyEnrollments;
        courseStats.monthlyEnrollments = monthlyEnrollments;
        courseStats.totalEnrollments = enrollments.length;

        return courseStats;
      })
    );

    // Overall statistics
    const totalCourses = coursesWithStats.length;
    const totalStudents = coursesWithStats.reduce((sum, course) => sum + course.totalEnrollments, 0);
    const averageRating = coursesWithStats.reduce((sum, course) => sum + (course.rating || 0), 0) / (totalCourses || 1);

    const overallStats = {
      totalCourses,
      totalStudents,
      averageRating: parseFloat(averageRating.toFixed(1)),
      publishedCourses: coursesWithStats.filter(c => c.published).length,
      totalRevenue: 0 // Add payment integration if needed
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Lecturer course statistics retrieved successfully",
      data: {
        overallStats,
        courses: coursesWithStats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get lecturer course stats error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get course statistics"
    });
  }
};

// ======================= GET COURSE STUDENTS =======================
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, search } = req.query;

    // Verify lecturer has access to this course
    const lecturer = await Lecturer.findOne({
      user: req.user._id,
      requestStatus: 'approved',
      isActive: true
    });

    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view this course's students"
      });
    }

    // Build query for students
    let studentQuery = {
      _id: { $in: course.learners }
    };

    if (search) {
      studentQuery.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get students with enrollment info
    const [students, total] = await Promise.all([
      User.find(studentQuery)
        .select('firstname lastname email userImage phone createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(studentQuery)
    ]);

    // Add enrollment date and progress for each student
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const enrollment = await Enrollment.findOne({
          student: student._id,
          course: courseId
        }).select('enrolledAt paymentAmount paymentStatus');

        // Get student progress
        const progress = await getStudentCourseProgress(student._id, courseId);

        return {
          studentId: student._id,
          name: `${student.firstname} ${student.lastname}`,
          email: student.email,
          phone: student.phone,
          avatar: student.userImage,
          enrolledAt: enrollment?.enrolledAt,
          paymentAmount: enrollment?.paymentAmount,
          paymentStatus: enrollment?.paymentStatus,
          progress: progress.progressPercentage,
          completedLessons: progress.completedLessons,
          totalLessons: progress.totalLessons,
          totalTimeSpent: progress.totalTimeSpent,
          lastActive: progress.lastAccessedAt
        };
      })
    );

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Course students retrieved successfully",
      data: studentsWithProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get course students error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get course students"
    });
  }
};

// ======================= GET STUDENT DETAILED PROGRESS =======================
exports.getStudentProgressDetails = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify lecturer has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view this student's progress"
      });
    }

    // Check if student is enrolled
    if (!course.learners.some(id => id.toString() === studentId)) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Student is not enrolled in this course"
      });
    }

    // Get student info
    const student = await User.findById(studentId)
      .select('firstname lastname email userImage phone');

    // Get detailed progress
    const progressDetails = await getStudentCourseProgress(studentId, courseId);

    // Get week-by-week progress with lesson details
    const weeks = await Week.find({ course: courseId }).sort({ order: 1 });
    const weeksWithProgress = await Promise.all(
      weeks.map(async (week) => {
        const lessons = await Lesson.find({ week: week._id, isActive: true })
          .sort({ order: 1 })
          .select('lessonTitle lessonSlug duration order');

        const lessonsWithStatus = await Promise.all(
          lessons.map(async (lesson) => {
            const lessonStatus = await LessonStatus.findOne({
              learner: studentId,
              lesson: lesson._id
            }).select('isCompleted startDate endDate timeSpent lastAccessedAt');

            return {
              lessonId: lesson._id,
              lessonTitle: lesson.lessonTitle,
              lessonSlug: lesson.lessonSlug,
              duration: lesson.duration,
              order: lesson.order,
              isCompleted: lessonStatus?.isCompleted || false,
              startDate: lessonStatus?.startDate,
              endDate: lessonStatus?.endDate,
              timeSpent: lessonStatus?.timeSpent || 0,
              lastAccessed: lessonStatus?.lastAccessedAt,
              completionDate: lessonStatus?.isCompleted ? lessonStatus.endDate : null
            };
          })
        );

        const completedLessons = lessonsWithStatus.filter(l => l.isCompleted).length;
        const totalTimeSpent = lessonsWithStatus.reduce((sum, lesson) => sum + (lesson.timeSpent || 0), 0);

        return {
          weekId: week._id,
          weekNumber: week.weekNumber,
          weekTitle: week.title,
          totalLessons: lessons.length,
          completedLessons,
          progressPercentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0,
          totalTimeSpent,
          lessons: lessonsWithStatus
        };
      })
    );

    // Get assessment performance
    const assessments = await Assessment.find({
      course: courseId,
      isActive: true
    }).select('title dueDate maxScore passingScore lesson');

    const assessmentPerformance = await Promise.all(
      assessments.map(async (assessment) => {
        const submission = await Submission.findOne({
          assessment: assessment._id,
          submittedBy: studentId
        }).select('score finalScore status feedback gradedAt submittedAt');

        return {
          assessmentId: assessment._id,
          title: assessment.title,
          dueDate: assessment.dueDate,
          maxScore: assessment.maxScore,
          passingScore: assessment.passingScore,
          isSubmitted: !!submission,
          score: submission?.score,
          finalScore: submission?.finalScore,
          status: submission?.status,
          feedback: submission?.feedback,
          gradedAt: submission?.gradedAt,
          submittedAt: submission?.submittedAt,
          isPassed: submission?.finalScore >= assessment.passingScore
        };
      })
    );

    const completedAssessments = assessmentPerformance.filter(a => a.isSubmitted).length;
    const passedAssessments = assessmentPerformance.filter(a => a.isPassed).length;
    const averageScore = assessmentPerformance.filter(a => a.isSubmitted && a.finalScore)
      .reduce((sum, a) => sum + a.finalScore, 0) / completedAssessments || 0;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Student progress details retrieved successfully",
      data: {
        student: {
          id: student._id,
          name: `${student.firstname} ${student.lastname}`,
          email: student.email,
          phone: student.phone,
          avatar: student.userImage
        },
        overallProgress: progressDetails,
        weeklyProgress: weeksWithProgress,
        assessmentPerformance: {
          totalAssessments: assessments.length,
          completedAssessments,
          passedAssessments,
          averageScore: parseFloat(averageScore.toFixed(1)),
          details: assessmentPerformance
        },
        enrollmentInfo: await Enrollment.findOne({
          student: studentId,
          course: courseId
        }).select('enrolledAt paymentAmount paymentMethod paymentStatus'),
        activityTimeline: await getStudentActivityTimeline(studentId, courseId)
      }
    });
  } catch (error) {
    console.error('Get student progress details error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get student progress details"
    });
  }
};

// ======================= GET COURSE ASSESSMENTS WITH SUBMISSIONS =======================
exports.getCourseAssessmentsWithSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20, status, graded } = req.query;

    // Verify lecturer has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view this course's assessments"
      });
    }

    const skip = (page - 1) * limit;

    // Get all assessments for this course
    let assessmentQuery = { course: courseId };

    if (status === 'active') {
      assessmentQuery.isActive = true;
      assessmentQuery.dueDate = { $gte: new Date() };
    } else if (status === 'past') {
      assessmentQuery.dueDate = { $lt: new Date() };
    }

    const [assessments, total] = await Promise.all([
      Assessment.find(assessmentQuery)
        .populate('lesson', 'lessonTitle')
        .populate('week', 'title weekNumber')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Assessment.countDocuments(assessmentQuery)
    ]);

    // Add submission statistics for each assessment
    const assessmentsWithStats = await Promise.all(
      assessments.map(async (assessment) => {
        const submissions = await Submission.find({ 
          assessment: assessment._id 
        }).select('submittedBy score status gradedAt');

        const totalSubmissions = submissions.length;
        const gradedSubmissions = submissions.filter(s => s.score !== undefined && s.score !== null).length;
        const averageScore = submissions.filter(s => s.score !== undefined && s.score !== null)
          .reduce((sum, s) => sum + s.score, 0) / gradedSubmissions || 0;
        
        const pendingGrading = totalSubmissions - gradedSubmissions;

        return {
          assessmentId: assessment._id,
          title: assessment.title,
          description: assessment.description,
          dueDate: assessment.dueDate,
          maxScore: assessment.maxScore,
          passingScore: assessment.passingScore,
          lesson: assessment.lesson,
          week: assessment.week,
          isActive: assessment.isActive,
          totalStudents: course.totalEnrollments,
          submissions: {
            total: totalSubmissions,
            graded: gradedSubmissions,
            pending: pendingGrading,
            averageScore: parseFloat(averageScore.toFixed(1)),
            submissionRate: course.totalEnrollments > 0 
              ? Math.round((totalSubmissions / course.totalEnrollments) * 100) 
              : 0
          }
        };
      })
    );

    // Calculate overall statistics
    const overallStats = {
      totalAssessments: assessments.length,
      activeAssessments: assessments.filter(a => a.isActive).length,
      totalSubmissions: assessmentsWithStats.reduce((sum, a) => sum + a.submissions.total, 0),
      pendingGrading: assessmentsWithStats.reduce((sum, a) => sum + a.submissions.pending, 0),
      averageSubmissionRate: assessmentsWithStats.length > 0
        ? Math.round(assessmentsWithStats.reduce((sum, a) => sum + a.submissions.submissionRate, 0) / assessmentsWithStats.length)
        : 0
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Course assessments retrieved successfully",
      data: {
        overallStats,
        assessments: assessmentsWithStats
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get course assessments error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get course assessments"
    });
  }
};

// ======================= GET ASSESSMENT SUBMISSIONS DETAILED =======================
exports.getAssessmentSubmissionsDetailed = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    // Get assessment and verify lecturer has access
    const assessment = await Assessment.findById(assessmentId)
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug totalEnrollments'
      });

    if (!assessment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assessment not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await assessment.course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view these submissions"
      });
    }

    const skip = (page - 1) * limit;

    // Build query for submissions
    let submissionQuery = { assessment: assessmentId };

    if (status === 'graded') {
      submissionQuery.score = { $exists: true, $ne: null };
    } else if (status === 'ungraded') {
      submissionQuery.score = { $exists: false };
    } else if (status === 'late') {
      submissionQuery.isLate = true;
    }

    // If search provided, find students matching the search
    let studentIds = [];
    if (search) {
      const students = await User.find({
        $or: [
          { firstname: { $regex: search, $options: 'i' } },
          { lastname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ],
        _id: { $in: assessment.course.learners }
      }).select('_id');
      
      studentIds = students.map(s => s._id);
      if (studentIds.length > 0) {
        submissionQuery.submittedBy = { $in: studentIds };
      }
    }

    const [submissions, total] = await Promise.all([
      Submission.find(submissionQuery)
        .populate({
          path: 'submittedBy',
          select: 'firstname lastname email userImage'
        })
        .populate({
          path: 'gradedBy',
          select: 'firstname lastname'
        })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(submissionQuery)
    ]);

    // Calculate grading statistics
    const gradedCount = submissions.filter(s => s.score !== undefined && s.score !== null).length;
    const pendingCount = submissions.length - gradedCount;
    
    const averageScore = gradedCount > 0
      ? submissions.filter(s => s.score)
          .reduce((sum, s) => sum + s.score, 0) / gradedCount
      : 0;

    const passingCount = submissions.filter(s => 
      s.score !== undefined && s.score !== null && s.score >= assessment.passingScore
    ).length;

    const submissionDetails = submissions.map(submission => ({
      submissionId: submission._id,
      student: {
        id: submission.submittedBy._id,
        name: `${submission.submittedBy.firstname} ${submission.submittedBy.lastname}`,
        email: submission.submittedBy.email,
        avatar: submission.submittedBy.userImage
      },
      submittedAt: submission.submittedAt,
      isLate: submission.isLate,
      score: submission.score,
      finalScore: submission.finalScore,
      status: submission.status,
      feedback: submission.feedback,
      gradedBy: submission.gradedBy ? 
        `${submission.gradedBy.firstname} ${submission.gradedBy.lastname}` : null,
      gradedAt: submission.gradedAt,
      attachments: submission.attachments,
      isPassed: submission.finalScore >= assessment.passingScore
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Assessment submissions retrieved successfully",
      data: {
        assessment: {
          id: assessment._id,
          title: assessment.title,
          maxScore: assessment.maxScore,
          passingScore: assessment.passingScore,
          dueDate: assessment.dueDate,
          course: assessment.course.courseTitle,
          totalStudents: assessment.course.totalEnrollments
        },
        statistics: {
          totalSubmissions: total,
          graded: gradedCount,
          pending: pendingCount,
          averageScore: parseFloat(averageScore.toFixed(1)),
          passingRate: gradedCount > 0 ? Math.round((passingCount / gradedCount) * 100) : 0,
          submissionRate: assessment.course.totalEnrollments > 0 
            ? Math.round((total / assessment.course.totalEnrollments) * 100) 
            : 0
        },
        submissions: submissionDetails
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assessment submissions detailed error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get assessment submissions"
    });
  }
};

// ======================= GRADE SUBMISSION (LECTURER) =======================
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
        path: 'assessment',
        select: 'maxScore passingScore course'
      });

    if (!submission) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Submission not found"
      });
    }

    // Get assessment and verify lecturer has access
    const assessment = await Assessment.findById(submission.assessment._id)
      .populate('course');

    if (!assessment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assessment not found"
      });
    }

    // Check if lecturer has permission
    const canGrade = await assessment.course.canUserEdit(req.user._id, req.user.roles);
    if (!canGrade) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to grade this submission"
      });
    }

    // Validate score
    const maxScore = assessment.maxScore || 100;
    if (score < 0 || score > maxScore) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: `Score must be between 0 and ${maxScore}`
      });
    }

    // Calculate final score with penalty
    const finalScore = submission.calculateFinalScore(assessment);

    // Update submission
    submission.score = parseFloat(score);
    submission.feedback = feedback || submission.feedback;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    submission.finalScore = finalScore;

    await submission.save();

    // Update assessment statistics
    await assessment.updateAverageScore();
    await assessment.updateSubmissionsCount();

    // Get student info for response
    const student = await User.findById(submission.submittedBy)
      .select('firstname lastname email');

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Submission graded successfully",
      data: {
        submission: {
          id: submission._id,
          score: submission.score,
          finalScore: submission.finalScore,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
          isPassed: finalScore >= assessment.passingScore
        },
        student: {
          name: `${student.firstname} ${student.lastname}`,
          email: student.email
        },
        assessment: {
          title: assessment.title,
          passingScore: assessment.passingScore
        }
      }
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

// ======================= BULK GRADE SUBMISSIONS =======================
exports.bulkGradeSubmissions = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { grades } = req.body; // Array of { submissionId, score, feedback }

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Grades array is required"
      });
    }

    // Get assessment and verify lecturer has access
    const assessment = await Assessment.findById(assessmentId)
      .populate('course');

    if (!assessment) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Assessment not found"
      });
    }

    // Check if lecturer has permission
    const canGrade = await assessment.course.canUserEdit(req.user._id, req.user.roles);
    if (!canGrade) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to grade these submissions"
      });
    }

    const results = [];
    const errors = [];

    for (const grade of grades) {
      try {
        const submission = await Submission.findById(grade.submissionId);
        
        if (!submission) {
          errors.push({
            submissionId: grade.submissionId,
            error: "Submission not found"
          });
          continue;
        }

        // Validate score
        const maxScore = assessment.maxScore || 100;
        if (grade.score < 0 || grade.score > maxScore) {
          errors.push({
            submissionId: grade.submissionId,
            error: `Score must be between 0 and ${maxScore}`
          });
          continue;
        }

        // Update submission
        submission.score = parseFloat(grade.score);
        submission.feedback = grade.feedback || submission.feedback;
        submission.gradedBy = req.user._id;
        submission.gradedAt = new Date();
        submission.status = 'graded';
        submission.finalScore = submission.calculateFinalScore(assessment);

        await submission.save();
        results.push({
          submissionId: submission._id,
          score: submission.score,
          finalScore: submission.finalScore,
          isPassed: submission.finalScore >= assessment.passingScore
        });
      } catch (error) {
        errors.push({
          submissionId: grade.submissionId,
          error: error.message
        });
      }
    }

    // Update assessment statistics
    await assessment.updateAverageScore();
    await assessment.updateSubmissionsCount();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Bulk grading completed",
      data: {
        graded: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk grade submissions error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to bulk grade submissions"
    });
  }
};

// ======================= GET STUDENT ACTIVITY TIMELINE =======================
exports.getStudentActivityTimeline = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { days = 30 } = req.query;

    // Verify lecturer has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to view student activity"
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get lesson completion activities
    const lessonActivities = await LessonStatus.find({
      learner: studentId,
      lesson: {
        $in: await getCourseLessonIds(courseId)
      },
      updatedAt: { $gte: startDate, $lte: endDate }
    })
    .populate('lesson', 'lessonTitle')
    .sort({ updatedAt: -1 });

    // Get assessment submission activities
    const assessmentActivities = await Submission.find({
      submittedBy: studentId,
      assessment: {
        $in: await getCourseAssessmentIds(courseId)
      },
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('assessment', 'title')
    .sort({ createdAt: -1 });

    // Combine and format activities
    const activities = [
      ...lessonActivities.map(activity => ({
        type: 'lesson',
        action: activity.isCompleted ? 'completed' : 'started',
        title: activity.lesson.lessonTitle,
        date: activity.updatedAt,
        details: {
          timeSpent: activity.timeSpent,
          completionDate: activity.isCompleted ? activity.endDate : null
        }
      })),
      ...assessmentActivities.map(activity => ({
        type: 'assessment',
        action: 'submitted',
        title: activity.assessment.title,
        date: activity.createdAt,
        details: {
          score: activity.score,
          status: activity.status
        }
      }))
    ].sort((a, b) => b.date - a.date);

    // Calculate activity statistics
    const activityStats = {
      totalActivities: activities.length,
      lessonCompletions: lessonActivities.filter(a => a.isCompleted).length,
      assessmentSubmissions: assessmentActivities.length,
      averageDailyActivities: days > 0 ? Math.round(activities.length / days) : 0,
      lastActivityDate: activities.length > 0 ? activities[0].date : null
    };

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Student activity timeline retrieved successfully",
      data: {
        studentId,
        courseId,
        dateRange: {
          start: startDate,
          end: endDate,
          days
        },
        activityStats,
        timeline: activities.slice(0, 50) // Limit to last 50 activities
      }
    });
  } catch (error) {
    console.error('Get student activity timeline error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get student activity timeline"
    });
  }
};

// ======================= EXPORT COURSE PROGRESS REPORT =======================
exports.exportCourseProgressReport = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { format = 'csv' } = req.query;

    // Verify lecturer has access to this course
    const course = await Course.findById(courseId)
      .populate('category', 'categoryName');
    
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Check if lecturer has permission
    const canAccess = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canAccess) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "You don't have permission to export this report"
      });
    }

    // Get all enrolled students
    const students = await User.find({
      _id: { $in: course.learners }
    }).select('firstname lastname email');

    // Get course structure (weeks and lessons)
    const weeks = await Week.find({ course: courseId }).sort({ order: 1 });
    const allLessons = await Lesson.find({ 
      week: { $in: weeks.map(w => w._id) },
      isActive: true 
    }).sort({ order: 1 });

    // Get all assessments
    const assessments = await Assessment.find({
      course: courseId,
      isActive: true
    }).select('title maxScore passingScore');

    // Generate report data
    const reportData = [];
    const reportDate = new Date().toISOString().split('T')[0];

    for (const student of students) {
      const studentProgress = {
        Student: `${student.firstname} ${student.lastname}`,
        Email: student.email,
        EnrollmentDate: (await Enrollment.findOne({
          student: student._id,
          course: courseId
        }))?.enrolledAt?.toISOString().split('T')[0] || '',
        'Total Lessons': allLessons.length,
        'Completed Lessons': 0,
        'Progress (%)': 0,
        'Total Time Spent (min)': 0,
        'Last Active': ''
      };

      // Add lesson completion columns
      for (const lesson of allLessons.slice(0, 10)) { // Limit to first 10 lessons for readability
        const status = await LessonStatus.findOne({
          learner: student._id,
          lesson: lesson._id
        });
        studentProgress[`Lesson: ${lesson.lessonTitle.substring(0, 30)}...`] = status?.isCompleted ? '✓' : '✗';
      }

      // Add assessment columns
      for (const assessment of assessments.slice(0, 5)) { // Limit to first 5 assessments
        const submission = await Submission.findOne({
          assessment: assessment._id,
          submittedBy: student._id
        });
        const score = submission?.score || '';
        studentProgress[`Assessment: ${assessment.title.substring(0, 30)}...`] = 
          score ? `${score}/${assessment.maxScore}` : 'Not Submitted';
      }

      // Calculate totals
      const lessonStatuses = await LessonStatus.find({
        learner: student._id,
        lesson: { $in: allLessons.map(l => l._id) }
      });

      studentProgress['Completed Lessons'] = lessonStatuses.filter(s => s.isCompleted).length;
      studentProgress['Progress (%)'] = allLessons.length > 0 
        ? Math.round((studentProgress['Completed Lessons'] / allLessons.length) * 100) 
        : 0;
      studentProgress['Total Time Spent (min)'] = lessonStatuses.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
      studentProgress['Last Active'] = lessonStatuses.length > 0 
        ? new Date(Math.max(...lessonStatuses.map(s => s.lastAccessedAt || s.updatedAt))).toISOString().split('T')[0]
        : '';

      reportData.push(studentProgress);
    }

    // Generate filename
    const filename = `course-progress-${course.courseSlug}-${reportDate}.${format}`;

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(reportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...reportData.map(row => 
          headers.map(header => 
            `"${row[header] || ''}"`
          ).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    } else {
      // Return JSON
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Progress report generated successfully",
        data: {
          course: {
            id: course._id,
            title: course.courseTitle,
            category: course.category?.categoryName,
            totalStudents: students.length
          },
          generatedAt: new Date(),
          format,
          data: reportData
        }
      });
    }
  } catch (error) {
    console.error('Export course progress report error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to generate progress report"
    });
  }
};

// ======================= HELPER FUNCTIONS =======================

/**
 * Get student course progress
 */
async function getStudentCourseProgress(studentId, courseId) {
  const weeks = await Week.find({ course: courseId });
  const weekIds = weeks.map(w => w._id);
  
  const lessons = await Lesson.find({ 
    week: { $in: weekIds },
    isActive: true 
  });
  const lessonIds = lessons.map(l => l._id);

  const lessonStatuses = await LessonStatus.find({ 
    learner: studentId, 
    lesson: { $in: lessonIds } 
  });

  const totalLessons = lessons.length;
  const completedLessons = lessonStatuses.filter(s => s.isCompleted).length;
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  const totalTimeSpent = lessonStatuses.reduce((sum, status) => {
    return sum + (status.timeSpent || 0);
  }, 0);

  const lastAccessed = lessonStatuses.length > 0
    ? new Date(Math.max(...lessonStatuses.map(s => s.lastAccessedAt || s.updatedAt)))
    : null;

  return {
    studentId,
    courseId,
    totalLessons,
    completedLessons,
    progressPercentage,
    totalTimeSpent,
    lastAccessedAt: lastAccessed
  };
}

/**
 * Get course lesson IDs
 */
async function getCourseLessonIds(courseId) {
  const weeks = await Week.find({ course: courseId });
  const weekIds = weeks.map(w => w._id);
  
  const lessons = await Lesson.find({ 
    week: { $in: weekIds }
  }).select('_id');
  
  return lessons.map(l => l._id);
}

/**
 * Get course assessment IDs
 */
async function getCourseAssessmentIds(courseId) {
  const assessments = await Assessment.find({ 
    course: courseId 
  }).select('_id');
  
  return assessments.map(a => a._id);
}

/**
 * Get student activity timeline
 */
async function getStudentActivityTimeline(studentId, courseId) {
  const lessonIds = await getCourseLessonIds(courseId);
  const assessmentIds = await getCourseAssessmentIds(courseId);

  // Get last 30 days of activity
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [lessonActivities, assessmentActivities] = await Promise.all([
    LessonStatus.find({
      learner: studentId,
      lesson: { $in: lessonIds },
      updatedAt: { $gte: thirtyDaysAgo }
    })
    .populate('lesson', 'lessonTitle')
    .sort({ updatedAt: -1 })
    .limit(50),

    Submission.find({
      submittedBy: studentId,
      assessment: { $in: assessmentIds },
      createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('assessment', 'title')
    .sort({ createdAt: -1 })
    .limit(50)
  ]);

  const activities = [
    ...lessonActivities.map(activity => ({
      type: 'lesson',
      action: activity.isCompleted ? 'completed' : 'updated',
      title: activity.lesson.lessonTitle,
      date: activity.updatedAt,
      details: {
        timeSpent: activity.timeSpent,
        completionDate: activity.isCompleted ? activity.endDate : null
      }
    })),
    ...assessmentActivities.map(activity => ({
      type: 'assessment',
      action: activity.score !== undefined ? 'graded' : 'submitted',
      title: activity.assessment.title,
      date: activity.gradedAt || activity.createdAt,
      details: {
        score: activity.score,
        status: activity.status
      }
    }))
  ].sort((a, b) => b.date - a.date);

  return activities;
}