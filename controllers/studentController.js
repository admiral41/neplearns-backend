const Course = require('../models/Courses');
const User = require('../models/User');
const { createError } = require('http-errors');

// Apply for course enrollment
const applyForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw createError.NotFound('Course not found');
    }

    // Check if student is already enrolled or has pending request
    const isEnrolled = course.enrolledStudents.some(enrollment => 
      enrollment.student.toString() === req.user.id
    );
    
    const hasPendingRequest = course.enrollmentRequests.some(request => 
      request.student.toString() === req.user.id && request.status === 'pending'
    );

    if (isEnrolled) {
      throw createError.Conflict('You are already enrolled in this course');
    }

    if (hasPendingRequest) {
      throw createError.Conflict('You already have a pending enrollment request for this course');
    }

    // Add enrollment request
    course.enrollmentRequests.push({
      student: req.user.id,
      status: 'pending'
    });
    await course.save();

    // Add to user's enrolledCourses with pending status
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: {
        enrolledCourses: {
          course: courseId,
          status: 'pending'
        }
      }
    });

    res.json({
      success: true,
      message: 'Enrollment request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get student's enrolled courses
const getMyCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title description price image slug teacher',
        populate: {
          path: 'teacher',
          select: 'username profilePicture'
        }
      });

    const approvedCourses = user.enrolledCourses.filter(
      ec => ec.status === 'approved'
    ).map(ec => ec.course);

    const pendingCourses = user.enrolledCourses.filter(
      ec => ec.status === 'pending'
    ).map(ec => ec.course);

    res.json({
      success: true,
      data: {
        approvedCourses,
        pendingCourses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get course details with access check
const getCourseDetails = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Check if student is enrolled and approved
    const user = await User.findOne({
      _id: req.user.id,
      'enrolledCourses.course': courseId,
      'enrolledCourses.status': 'approved'
    });

    if (!user) {
      throw createError.Forbidden('You are not enrolled in this course or your enrollment is not approved yet');
    }

    const course = await Course.findById(courseId)
      .populate('teacher', 'username profilePicture')
      .populate('lessons');

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForCourse,
  getMyCourses,
  getCourseDetails
};