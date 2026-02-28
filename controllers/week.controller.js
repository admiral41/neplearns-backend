const httpStatus = require('http-status');
const Week = require('../models/weeks');
const Course = require('../models/course.model');
const Lesson = require('../models/lessons');
const { responseHandler } = require('../helpers/index');
const { sendErrorResponse, sendSuccessResponse } = responseHandler;

// ======================= CREATE WEEK =======================
exports.createWeek = async (req, res) => {
  try {
    const { course, title, weekNumber, description, isActive = true } = req.body;

    // Check if course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Course not found" 
      });
    }

    // Check if user can modify this course
    const canModify = await courseExists.canUserEdit(req.user._id, req.user.roles);
    if (!canModify) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.FORBIDDEN, 
        msg: "You don't have permission to add weeks to this course" 
      });
    }

    // Get next order number
    const lastWeek = await Week.findOne({ course })
      .sort({ order: -1 })
      .select('order');

    const order = lastWeek ? lastWeek.order + 1 : 1;

    // Create week
    const week = await Week.create({
      course,
      title,
      weekNumber: parseInt(weekNumber),
      description: description || '',
      isActive,
      order,
      createdBy: req.user._id
    });

    // Update course's totalWeeks
    await Course.findByIdAndUpdate(course, {
      $inc: { totalWeeks: 1 }
    });

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.CREATED, 
      msg: "Week created successfully", 
      data: week 
    });
  } catch (error) {
    console.error('Create week error:', error);
    
    // Handle duplicate week number error
    if (error.code === 11000) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.CONFLICT, 
        msg: "Week number already exists for this course" 
      });
    }
    
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to create week" 
    });
  }
};

// ======================= UPDATE WEEK =======================
exports.updateWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { title, description, isActive } = req.body;

    const week = await Week.findById(weekId);
    if (!week) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    // Check if course exists and user has permission
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
        msg: "You don't have permission to update this week" 
      });
    }

    // Update week
    const updatedWeek = await Week.findByIdAndUpdate(
      weekId,
      {
        title: title || week.title,
        description: description || week.description,
        isActive: isActive !== undefined ? isActive : week.isActive,
      },
      { new: true, runValidators: true }
    );

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Week updated successfully", 
      data: updatedWeek 
    });
  } catch (error) {
    console.error('Update week error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to update week" 
    });
  }
};

// ======================= DELETE WEEK =======================
exports.deleteWeek = async (req, res) => {
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

    // Check if course exists and user has permission
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
        msg: "You don't have permission to delete this week" 
      });
    }

    // Check if week has lessons
    const lessonCount = await Lesson.countDocuments({ week: weekId });
    if (lessonCount > 0) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: "Cannot delete week with existing lessons. Delete lessons first." 
      });
    }

    await Week.findByIdAndDelete(weekId);

    // Update course's totalWeeks
    await Course.findByIdAndUpdate(week.course, {
      $inc: { totalWeeks: -1 }
    });

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Week deleted successfully" 
    });
  } catch (error) {
    console.error('Delete week error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to delete week" 
    });
  }
};

// ======================= GET WEEK BY ID =======================
exports.getWeek = async (req, res) => {
  try {
    const { weekId } = req.params;

    const week = await Week.findById(weekId)
      .populate({
        path: 'course',
        select: 'courseTitle courseSlug category'
      });

    if (!week) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    // Get lessons count
    const lessonCount = await Lesson.countDocuments({ week: weekId });

    const weekData = week.toObject();
    weekData.lessonCount = lessonCount;

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Week retrieved successfully", 
      data: weekData 
    });
  } catch (error) {
    console.error('Get week error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get week" 
    });
  }
};

// ======================= GET ALL WEEKS FOR COURSE =======================
exports.getCourseWeeks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Course not found" 
      });
    }

    const weeks = await Week.find({ course: courseId })
      .sort({ weekNumber: 1 })
      .select('title weekNumber description isActive order createdAt');

    // Add lesson count to each week
    const weeksWithStats = await Promise.all(
      weeks.map(async (week) => {
        const weekObj = week.toObject();
        const lessonCount = await Lesson.countDocuments({ week: week._id });
        weekObj.lessonCount = lessonCount;
        return weekObj;
      })
    );

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: "Weeks retrieved successfully", 
      data: weeksWithStats 
    });
  } catch (error) {
    console.error('Get course weeks error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to get weeks" 
    });
  }
};

// ======================= REORDER WEEK =======================
exports.reorderWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    const week = await Week.findById(weekId);
    if (!week) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    // Find adjacent week
    let adjacentWeek;
    if (direction === 'up') {
      adjacentWeek = await Week.findOne({
        course: week.course,
        order: week.order - 1
      });
    } else {
      adjacentWeek = await Week.findOne({
        course: week.course,
        order: week.order + 1
      });
    }

    if (!adjacentWeek) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.BAD_REQUEST, 
        msg: `Cannot move week ${direction}` 
      });
    }

    // Swap orders
    const tempOrder = week.order;
    week.order = adjacentWeek.order;
    adjacentWeek.order = tempOrder;

    await week.save();
    await adjacentWeek.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Week moved ${direction} successfully` 
    });
  } catch (error) {
    console.error('Reorder week error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to reorder week" 
    });
  }
};

// ======================= TOGGLE WEEK STATUS =======================
exports.toggleWeekStatus = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { isActive } = req.body;

    const week = await Week.findById(weekId);
    if (!week) {
      return sendErrorResponse({ 
        res, 
        status: httpStatus.NOT_FOUND, 
        msg: "Week not found" 
      });
    }

    week.isActive = isActive;
    await week.save();

    return sendSuccessResponse({ 
      res, 
      status: httpStatus.OK, 
      msg: `Week ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: week 
    });
  } catch (error) {
    console.error('Toggle week status error:', error);
    return sendErrorResponse({ 
      res, 
      status: httpStatus.INTERNAL_SERVER_ERROR, 
      msg: "Failed to update week status" 
    });
  }
};