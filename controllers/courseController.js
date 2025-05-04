const Course = require('../models/Courses');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
// Create Course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, lessons } = req.body;
    const userId = req.user.id;

    const teacher = await User.findById(userId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }

    const course = new Course({
      title,
      description,
      price,
      teacher: userId,
      lessons,
    });

    if (req.file) course.profilePicture = req.file.path;
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get All Courses
exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'username profilePicture')
      .select('-enrolledStudents -enrollmentRequests');
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};
// Get Course by Slug (public)
exports.getCourseBySlug = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate('teacher', 'firstName lastName profilePicture')
      .populate({
        path: 'lessons',
        select: 'title description'
      });

    if (!course) return res.status(404).json({ 
      success: false,
      message: 'Course not found'
    });

    res.json({ 
      success: true, 
      data: course
    });  
  } catch (error) {
    next(error);
  }
};

// Get Lessons by Course (public)
exports.getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course: courseId })
      .populate('quizzes assignments')
      .select('-__v');

    res.json({ 
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

exports.getCourseDetails = async (req, res, next) => {
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

exports.getCourseLessons = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'lessons',
        select: 'title content createdAt'
      });

    if (!course) throw createError.NotFound('Course not found');

    if (!course.enrolledStudents.includes(req.user.id) && 
        course.teacher.toString() !== req.user.id) {
      throw createError.Forbidden('Not authorized to view these lessons');
    }

    res.json({ success: true, data: course.lessons });
  } catch (error) {
    next(error);
  }
};

// Update Course
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, price, lessons } = req.body;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { title, description, price, lessons },
      { new: true }
    );

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    await Course.findByIdAndDelete(courseId);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

