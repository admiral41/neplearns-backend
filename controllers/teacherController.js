const createError = require('http-errors');
const Course = require('../models/Courses');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const slugify = require('slugify');
const User = require('../models/User');

const createCourse = async (req, res, next) => {
  try {
    const { title, subtitle, description, price, tags } = req.body;
    
    // Parse tags if they exist
    const parsedTags = tags ? JSON.parse(tags) : [];

    const course = await Course.create({
      title,
      subtitle,
      slug: slugify(title, { lower: true }),
      description,
      price,
      tags: parsedTags,
      teacher: req.user.id,
      image: req.file?.path
    });

    res.status(201).json({ 
      success: true, 
      data: {
        ...course._doc,
        image: req.file?.path
      }
    });
  } catch (error) {
    next(error);
  }
};
const getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user.id })
      .populate('teacher', 'username email profilePicture')
      .sort('-createdAt');

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      {
        ...req.body,
        ...(req.body.title && { slug: slugify(req.body.title, { lower: true }) }),
        ...(req.file && { image: req.file.path })
      },
      { new: true, runValidators: true }
    );

    if (!course) throw createError.NotFound('Course not found');
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user.id
    });
    if (!course) throw createError.NotFound('Course not found');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

const createLesson = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw createError.NotFound('Course not found');
    if (course.teacher.toString() !== req.user.id) throw createError.Forbidden();

    const materials = req.files.map(file => ({
      type: file.mimetype.split('/')[0] === 'image' ? 'image' : file.mimetype.split('/')[1],
      file: file.path
    }));

    const lesson = await Lesson.create({
      title,
      content,
      course: courseId,
      materials
    });

    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

const approveEnrollment = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;
    
    const course = await Course.findOne({
      _id: courseId,
      teacher: req.user.id
    });
    if (!course) throw createError.NotFound('Course not found');

    const index = course.enrollmentRequests.indexOf(studentId);
    if (index === -1) throw createError.NotFound('Enrollment request not found');

    course.enrollmentRequests.splice(index, 1);
    course.enrolledStudents.push(studentId);
    await course.save();

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};
// Add to teacherController.js
const getTeacherCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
      teacher: req.user.id
    })
    // .populate({
    //   path: 'lessons',
    //   populate: [
    //     { path: 'assignment' },
    //     { path: 'quiz' }
    //   ]
    // })    
    .populate('enrolledStudents', 'name email')
    .populate('enrollmentRequests', 'name email');

    if (!course) throw createError.NotFound('Course not found');
    
    res.json({ 
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};
const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'username profilePicture')
      .select('-enrolledStudents -enrollmentRequests');
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

const getCourseDetails = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'username profilePicture')
      .select('-enrolledStudents -enrollmentRequests');

    if (!course) throw createError.NotFound('Course not found');
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};
const getEnrollmentRequests = async (req, res, next) => {
  try {
    const courses = await Course.find({ 
      teacher: req.user.id,
      'enrollmentRequests.status': 'pending'
    })
    .populate({
      path: 'enrollmentRequests.student',
      select: 'username email profilePicture'
    })
    .select('title slug enrollmentRequests');

    const requests = courses.flatMap(course => {
      return course.enrollmentRequests
        .filter(request => request.status === 'pending')
        .map(request => ({
          _id: request._id,
          student: request.student,
          status: request.status,
          requestedAt: request.requestedAt,
          course: {
            _id: course._id,
            title: course.title,
            slug: course.slug
          }
        }));
    });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// Process enrollment request (approve/reject)
const processEnrollmentRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      throw createError.BadRequest('Invalid action');
    }

    // Find the course containing this request
    const course = await Course.findOne({
      'enrollmentRequests._id': requestId,
      teacher: req.user.id
    });

    if (!course) {
      throw createError.NotFound('Request not found or not authorized');
    }

    // Find the specific request
    const request = course.enrollmentRequests.id(requestId);
    if (!request) {
      throw createError.NotFound('Request not found');
    }

    // Update request status
    request.status = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'approve') {
      // Check if student is already enrolled
      const isAlreadyEnrolled = course.enrolledStudents.some(
        enrollment => enrollment.student.toString() === request.student._id.toString()
      );

      if (!isAlreadyEnrolled) {
        course.enrolledStudents.push({
          student: request.student._id,
          status: 'active' // Add status field
        });
      }
    }

    // Remove the request from enrollmentRequests array
    course.enrollmentRequests = course.enrollmentRequests.filter(
      req => req._id.toString() !== requestId
    );

    await course.save();

    // Update user's enrolledCourses status
    await User.updateOne(
      {
        _id: request.student._id,
        'enrolledCourses.course': course._id
      },
      {
        $set: {
          'enrolledCourses.$.status': action === 'approve' ? 'approved' : 'rejected',
          'enrolledCourses.$.updatedAt': new Date()
        }
      }
    );

    res.json({
      success: true,
      data: {
        _id: request._id,
        status: request.status,
        student: request.student,
        course: {
          _id: course._id,
          title: course.title
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get enrolled students for teacher's courses
const getEnrolledStudents = async (req, res, next) => {
  try {
    // Find all courses by this teacher with enrolled students
    const courses = await Course.find({ 
      teacher: req.user.id,
      'enrolledStudents.student': { $exists: true }
    })
    .populate({
      path: 'enrolledStudents.student',
      select: 'username email profilePicture'
    })
    .select('title slug enrolledStudents');

    // Flatten all enrolled students with course info
    const enrollments = courses.flatMap(course => {
      return course.enrolledStudents.map(enrollment => ({
        _id: enrollment._id,
        student: enrollment.student,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        course: {
          _id: course._id,
          title: course.title,
          slug: course.slug
        }
      }));
    });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};
const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    // Find the course containing this enrollment
    const course = await Course.findOne({
      'enrolledStudents._id': enrollmentId,
      teacher: req.user.id
    });

    if (!course) {
      throw createError.NotFound('Enrollment not found or not authorized');
    }

    // Find the specific enrollment
    const enrollment = course.enrolledStudents.id(enrollmentId);
    if (!enrollment) {
      throw createError.NotFound('Enrollment not found');
    }

    // Update enrollment status
    enrollment.status = status;
    await course.save();

    // Update user's enrolledCourses status
    await User.updateOne(
      {
        _id: enrollment.student,
        'enrolledCourses.course': course._id
      },
      {
        $set: {
          'enrolledCourses.$.status': status
        }
      }
    );

    res.json({
      success: true,
      data: {
        _id: enrollment._id,
        status: enrollment.status,
        student: enrollment.student,
        course: {
          _id: course._id,
          title: course.title
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createCourse,
  getTeacherCourses,
  updateCourse,
  deleteCourse,
  createLesson,
  approveEnrollment,
  getTeacherCourse,
  getAllCourses,
  getCourseDetails,
  getEnrollmentRequests,
  processEnrollmentRequest,
  getEnrolledStudents,
  updateEnrollmentStatus
};
