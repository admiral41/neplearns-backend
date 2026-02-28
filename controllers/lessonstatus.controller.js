const httpStatus = require('http-status');
const LessonStatus = require('../models/lessonStatus');
const Lesson = require('../models/lessons');
const Week = require('../models/weeks');
const Course = require('../models/course.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= GET LESSON STATUS =======================
exports.getLessonStatus = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Check if user is enrolled in the course
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

    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Get or create lesson status
    let lessonStatus = await LessonStatus.findOne({ 
      learner: userId, 
      lesson: lessonId 
    }).populate('lesson', 'lessonTitle duration');

    if (!lessonStatus) {
      lessonStatus = await LessonStatus.create({
        learner: userId,
        lesson: lessonId,
        isCompleted: false
      });
      lessonStatus = await LessonStatus.findById(lessonStatus._id)
        .populate('lesson', 'lessonTitle duration');
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson status retrieved successfully", 
      data: lessonStatus 
    });
  } catch (error) {
    console.error('Get lesson status error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get lesson status" 
    });
  }
};

// ======================= MARK LESSON AS COMPLETE =======================
exports.markComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Check if user is enrolled in the course
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

    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Check if previous lesson is completed (sequential learning)
    const allWeekLessons = await Lesson.find({ week: lesson.week })
      .sort({ order: 1 });
    
    const currentIndex = allWeekLessons.findIndex(l => l._id.toString() === lessonId);
    
    if (currentIndex > 0) {
      const previousLesson = allWeekLessons[currentIndex - 1];
      const previousStatus = await LessonStatus.findOne({
        learner: userId,
        lesson: previousLesson._id
      });

      if (!previousStatus || !previousStatus.isCompleted) {
        return sendErrorResponse({ 
          res, 
          status: httpStatus.FORBIDDEN, 
          msg: "You must complete the previous lesson first" 
        });
      }
    }

    // Update or create lesson status
    let lessonStatus = await LessonStatus.findOne({ 
      learner: userId, 
      lesson: lessonId 
    });

    if (lessonStatus) {
      if (!lessonStatus.isCompleted) {
        lessonStatus.isCompleted = true;
        lessonStatus.endDate = new Date();
        if (!lessonStatus.startDate) {
          lessonStatus.startDate = new Date();
        }
        await lessonStatus.save();
      }
    } else {
      lessonStatus = await LessonStatus.create({
        learner: userId,
        lesson: lessonId,
        isCompleted: true,
        startDate: new Date(),
        endDate: new Date()
      });
    }

    // Populate lesson details
    lessonStatus = await LessonStatus.findById(lessonStatus._id)
      .populate('lesson', 'lessonTitle duration');

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson marked as complete", 
      data: lessonStatus 
    });
  } catch (error) {
    console.error('Mark complete error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to mark lesson as complete" 
    });
  }
};

// ======================= MARK LESSON AS INCOMPLETE =======================
exports.markIncomplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Check if user is enrolled in the course
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

    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Update lesson status
    let lessonStatus = await LessonStatus.findOne({ 
      learner: userId, 
      lesson: lessonId 
    });

    if (lessonStatus) {
      lessonStatus.isCompleted = false;
      lessonStatus.endDate = null;
      await lessonStatus.save();
    } else {
      lessonStatus = await LessonStatus.create({
        learner: userId,
        lesson: lessonId,
        isCompleted: false
      });
    }

    // Populate lesson details
    lessonStatus = await LessonStatus.findById(lessonStatus._id)
      .populate('lesson', 'lessonTitle duration');

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson marked as incomplete", 
      data: lessonStatus 
    });
  } catch (error) {
    console.error('Mark incomplete error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to mark lesson as incomplete" 
    });
  }
};

// ======================= GET COURSE PROGRESS =======================
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Course not found" 
      });
    }

    // Check if user is enrolled
    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Get all weeks in the course
    const weeks = await Week.find({ course: courseId }).sort({ order: 1 });
    const weekIds = weeks.map(w => w._id);

    // Get all lessons in the course
    const lessons = await Lesson.find({ 
      week: { $in: weekIds },
      isActive: true 
    }).sort({ order: 1 });
    const lessonIds = lessons.map(l => l._id);

    // Get all lesson statuses for this user in this course
    const lessonStatuses = await LessonStatus.find({ 
      learner: userId, 
      lesson: { $in: lessonIds } 
    }).populate('lesson', 'lessonTitle duration order week');

    // Calculate progress statistics
    const totalLessons = lessons.length;
    const completedLessons = lessonStatuses.filter(s => s.isCompleted).length;
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Calculate time spent
    const totalTimeSpent = lessonStatuses.reduce((acc, status) => {
      if (status.startDate && status.endDate) {
        const duration = (new Date(status.endDate) - new Date(status.startDate)) / 1000 / 60; // in minutes
        return acc + duration;
      }
      return acc;
    }, 0);

    // Organize by weeks
    const weekProgress = weeks.map(week => {
      const weekLessons = lessons.filter(l => l.week.toString() === week._id.toString());
      const weekStatuses = lessonStatuses.filter(s => 
        weekLessons.some(wl => wl._id.toString() === s.lesson._id.toString())
      );
      const weekCompleted = weekStatuses.filter(s => s.isCompleted).length;
      const weekTotal = weekLessons.length;
      const weekPercentage = weekTotal > 0 
        ? Math.round((weekCompleted / weekTotal) * 100) 
        : 0;

      return {
        weekId: week._id,
        weekNumber: week.weekNumber,
        weekTitle: week.title,
        totalLessons: weekTotal,
        completedLessons: weekCompleted,
        progressPercentage: weekPercentage,
        isCompleted: weekCompleted === weekTotal && weekTotal > 0
      };
    });

    // Find next lesson to study
    const nextLesson = lessons.find(lesson => {
      const status = lessonStatuses.find(s => 
        s.lesson._id.toString() === lesson._id.toString()
      );
      return !status || !status.isCompleted;
    });

    const progressData = {
      courseId: course._id,
      courseTitle: course.courseTitle,
      totalLessons,
      completedLessons,
      progressPercentage,
      totalTimeSpent: Math.round(totalTimeSpent), // in minutes
      weekProgress,
      nextLesson: nextLesson ? {
        lessonId: nextLesson._id,
        lessonTitle: nextLesson.lessonTitle,
        lessonSlug: nextLesson.lessonSlug
      } : null,
      lessonStatuses: lessonStatuses.map(s => ({
        lessonId: s.lesson._id,
        lessonTitle: s.lesson.lessonTitle,
        isCompleted: s.isCompleted,
        startDate: s.startDate,
        endDate: s.endDate
      }))
    };

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Course progress retrieved successfully", 
      data: progressData 
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get course progress" 
    });
  }
};

// ======================= GET ALL USER PROGRESS =======================
exports.getAllUserProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all courses user is enrolled in
    const courses = await Course.find({ 
      learners: userId,
      published: true 
    }).select('courseTitle courseSlug totalLessons');

    const progressData = [];

    for (const course of courses) {
      // Get all weeks in the course
      const weeks = await Week.find({ course: course._id });
      const weekIds = weeks.map(w => w._id);

      // Get all lessons in the course
      const lessons = await Lesson.find({ 
        week: { $in: weekIds },
        isActive: true 
      });
      const lessonIds = lessons.map(l => l._id);

      // Get all lesson statuses for this user in this course
      const lessonStatuses = await LessonStatus.find({ 
        learner: userId, 
        lesson: { $in: lessonIds } 
      });

      const totalLessons = lessons.length;
      const completedLessons = lessonStatuses.filter(s => s.isCompleted).length;
      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      progressData.push({
        courseId: course._id,
        courseTitle: course.courseTitle,
        courseSlug: course.courseSlug,
        totalLessons,
        completedLessons,
        progressPercentage,
        isCompleted: completedLessons === totalLessons && totalLessons > 0
      });
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "User progress retrieved successfully", 
      data: progressData 
    });
  } catch (error) {
    console.error('Get all user progress error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get user progress" 
    });
  }
};

// ======================= START LESSON =======================
exports.startLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Check if user is enrolled in the course
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

    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Update or create lesson status with start date
    let lessonStatus = await LessonStatus.findOne({ 
      learner: userId, 
      lesson: lessonId 
    });

    if (lessonStatus) {
      if (!lessonStatus.startDate) {
        lessonStatus.startDate = new Date();
        await lessonStatus.save();
      }
    } else {
      lessonStatus = await LessonStatus.create({
        learner: userId,
        lesson: lessonId,
        isCompleted: false,
        startDate: new Date()
      });
    }

    // Increment lesson views
    await Lesson.findByIdAndUpdate(lessonId, {
      $inc: { 'meta.views': 1 }
    });

    // Populate lesson details
    lessonStatus = await LessonStatus.findById(lessonStatus._id)
      .populate('lesson', 'lessonTitle duration');

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson started", 
      data: lessonStatus 
    });
  } catch (error) {
    console.error('Start lesson error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to start lesson" 
    });
  }
};

// ======================= RESET COURSE PROGRESS =======================
exports.resetCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Course not found" 
      });
    }

    // Check if user is enrolled
    if (!course.isUserEnrolled(userId)) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You must be enrolled in this course" 
      });
    }

    // Get all weeks in the course
    const weeks = await Week.find({ course: courseId });
    const weekIds = weeks.map(w => w._id);

    // Get all lessons in the course
    const lessons = await Lesson.find({ week: { $in: weekIds } });
    const lessonIds = lessons.map(l => l._id);

    // Delete all lesson statuses for this user in this course
    const result = await LessonStatus.deleteMany({ 
      learner: userId, 
      lesson: { $in: lessonIds } 
    });

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Course progress reset successfully",
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Reset course progress error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to reset course progress" 
    });
  }
};