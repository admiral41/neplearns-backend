const { createError } = require('http-errors');
const Course = require('../models/Courses');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const slugify = require('slugify');

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
module.exports = {
  createCourse,
  getTeacherCourses,
  updateCourse,
  deleteCourse,
  createLesson,
  approveEnrollment,
  getTeacherCourse,
  getAllCourses,
  getCourseDetails
};
