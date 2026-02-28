const httpStatus = require('http-status');
const Lesson = require('../models/lessons');
const Week = require('../models/weeks');
const Course = require('../models/course.model');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE LESSON =======================
exports.createLesson = async (req, res) => {
  try {
    const { 
      week, 
      lessonTitle, 
      lessonContent, 
      shortDescription = '',
      order,
      duration = 0,
      videoUrl = '',
      isActive = true
    } = req.body;

    // Check if week exists
    const weekExists = await Week.findById(week);
    if (!weekExists) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    // Check if course exists and user has permission
    const course = await Course.findById(weekExists.course);
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
        msg: "You don't have permission to add lessons to this course" 
      });
    }

    // Create lesson
    const lesson = await Lesson.create({
      week,
      lessonTitle,
      lessonContent,
      shortDescription,
      order: parseInt(order),
      duration: parseInt(duration),
      videoUrl,
      isActive,
      createdBy: req.user._id
    });

    // Update course's totalLessons
    await Course.findByIdAndUpdate(weekExists.course, {
      $inc: { totalLessons: 1 }
    });

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.CREATED, 
      msg: "Lesson created successfully", 
      data: lesson 
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    
    if (error.code === 11000) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.CONFLICT, 
        msg: "Lesson order already exists for this week" 
      });
    }
    
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to create lesson" 
    });
  }
};

// ======================= UPDATE LESSON =======================
exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { 
      lessonTitle, 
      lessonContent, 
      shortDescription,
      order,
      duration,
      videoUrl,
      isActive
    } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Check week and course permission
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

    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You don't have permission to update this lesson" 
      });
    }

    // Update lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        lessonTitle: lessonTitle || lesson.lessonTitle,
        lessonContent: lessonContent || lesson.lessonContent,
        shortDescription: shortDescription || lesson.shortDescription,
        order: order !== undefined ? parseInt(order) : lesson.order,
        duration: duration !== undefined ? parseInt(duration) : lesson.duration,
        videoUrl: videoUrl !== undefined ? videoUrl : lesson.videoUrl,
        isActive: isActive !== undefined ? isActive : lesson.isActive,
      },
      { new: true, runValidators: true }
    );

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson updated successfully", 
      data: updatedLesson 
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to update lesson" 
    });
  }
};

// ======================= DELETE LESSON =======================
exports.deleteLesson = async (req, res) => {
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

    // Check week and course
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

    const canModify = await course.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You don't have permission to delete this lesson" 
      });
    }

    await Lesson.findByIdAndDelete(lessonId);

    // Update course's totalLessons
    await Course.findByIdAndUpdate(week.course, {
      $inc: { totalLessons: -1 }
    });

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson deleted successfully" 
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to delete lesson" 
    });
  }
};

// ======================= GET LESSON BY ID =======================
exports.getLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId)
      .populate({
        path: 'week',
        select: 'title weekNumber',
        populate: {
          path: 'course',
          select: 'courseTitle courseSlug'
        }
      })
      .populate('createdBy', 'firstname lastname');

    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lesson retrieved successfully", 
      data: lesson 
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get lesson" 
    });
  }
};

// ======================= GET LESSONS BY WEEK =======================
exports.getWeekLessons = async (req, res) => {
  try {
    const { weekId } = req.params;

    const week = await Week.findById(weekId);
    if (!week) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    const lessons = await Lesson.find({ week: weekId })
      .sort({ order: 1 })
      .select('lessonTitle lessonContent shortDescription order duration videoUrl isActive');

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Lessons retrieved successfully", 
      data: lessons 
    });
  } catch (error) {
    console.error('Get week lessons error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get lessons" 
    });
  }
};

// ======================= GET ALL LESSONS BY COURSE =======================
exports.getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Course not found"
      });
    }

    // Get all weeks for this course
    const weeks = await Week.find({ course: courseId }).select('_id weekNumber weekTitle');
    const weekIds = weeks.map(w => w._id);

    // Fetch all lessons for all weeks in one query
    const lessons = await Lesson.find({ week: { $in: weekIds } })
      .sort({ order: 1 })
      .select('lessonTitle lessonContent shortDescription order duration videoUrl isActive week');

    // Create a map of weekId to week info for efficient lookup
    const weekMap = {};
    weeks.forEach(w => {
      weekMap[w._id.toString()] = {
        weekNumber: w.weekNumber,
        weekTitle: w.weekTitle
      };
    });

    // Enrich lessons with week info
    const enrichedLessons = lessons.map(lesson => ({
      ...lesson.toObject(),
      weekNumber: weekMap[lesson.week.toString()]?.weekNumber,
      weekTitle: weekMap[lesson.week.toString()]?.weekTitle
    }));

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Course lessons retrieved successfully",
      data: enrichedLessons
    });
  } catch (error) {
    console.error('Get course lessons error:', error);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get course lessons"
    });
  }
};

// ======================= REORDER LESSON =======================
exports.reorderLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    // Find adjacent lesson
    let adjacentLesson;
    if (direction === 'up') {
      adjacentLesson = await Lesson.findOne({
        week: lesson.week,
        order: lesson.order - 1
      });
    } else {
      adjacentLesson = await Lesson.findOne({
        week: lesson.week,
        order: lesson.order + 1
      });
    }

    if (!adjacentLesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: `Cannot move lesson ${direction}` 
      });
    }

    // Swap orders
    const tempOrder = lesson.order;
    lesson.order = adjacentLesson.order;
    adjacentLesson.order = tempOrder;

    await lesson.save();
    await adjacentLesson.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Lesson moved ${direction} successfully` 
    });
  } catch (error) {
    console.error('Reorder lesson error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to reorder lesson" 
    });
  }
};

// ======================= TOGGLE LESSON STATUS =======================
exports.toggleLessonStatus = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { isActive } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Lesson not found" 
      });
    }

    lesson.isActive = isActive;
    await lesson.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Lesson ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: lesson 
    });
  } catch (error) {
    console.error('Toggle lesson status error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to update lesson status" 
    });
  }
};