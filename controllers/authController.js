const User = require('../models/User');
const { generateToken } = require('../config/config');
const createError = require('http-errors');
const Course = require('../models/Courses');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError.BadRequest('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw createError.Unauthorized('Invalid credentials');
    }

    if (user.role === 'Teacher' && !user.isApproved) {
      throw createError.Forbidden('Account pending admin approval');
    }

    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (error) {
    next(error);
  }
};

const registerTeacher = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw createError.Conflict('User already exists');
    }

    const teacher = await User.create({
      username,
      email,
      password,
      role: 'Teacher'
    });

    res.status(201).json({
      success: true,
      message: 'Teacher registered. Pending admin approval',
      userId: teacher._id
    });
  } catch (error) {
    next(error);
  }
};

const approveTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true, runValidators: true }
    );

    if (!teacher || teacher.role !== 'Teacher') {
      throw createError.NotFound('Teacher not found');
    }

    res.json({ success: true, message: 'Teacher approved successfully' });
  } catch (error) {
    next(error);
  }
};
const registerStudent = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) throw createError.Conflict('User already exists');

    const student = await User.create({
      username,
      email,
      password,
      role: 'Student'
    });

    res.status(201).json({
      success: true,
      data: { id: student._id }
    });
  } catch (error) {
    next(error);
  }
};
const checkAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) throw createError.NotFound('User not found');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
const getStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      User.find({ role: 'Student' })
        .select('-password')
        .populate('enrolledCourses', 'name code -_id')
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'Student' })
    ]);

    res.json({ 
      success: true, 
      data: students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total
      },
      message: students.length === 0 ? 'No students found' : ''
    });
  } catch (error) {
    next(error);
  }
};
const getAllTeachers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch teachers from the database
    const teachers = await User.find({ role: 'Teacher' })
      .select('-password') // Exclude password (enrolledCourses is not needed anymore)
      .skip(skip)
      .limit(limit)
      .exec();

    // Loop through the teachers and ensure they only see the courses they created
    const updatedTeachers = await Promise.all(teachers.map(async teacher => {
      // Fetch the courses that the teacher is teaching (using teacher._id)
      const teacherCourses = await Course.find({ teacher: teacher._id }).exec();

      return {
        ...teacher.toObject(),
        coursesTaught: teacherCourses // Add courses the teacher is teaching (not enrolled in)
      };
    }));

    // Count the total number of teachers
    const total = await User.countDocuments({ role: 'Teacher' });

    // Send the response
    res.json({
      success: true,
      data: updatedTeachers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTeachers: total
      },
      message: updatedTeachers.length === 0 ? 'No teachers found' : ''
    });
  } catch (error) {
    next(error);
  }
};



const getAdminStats = async (req, res) => {
  try {
    const [students, teachers, courses] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Teacher' }),
      Course.countDocuments()
    ]);

    res.json({ students, teachers, courses });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports = {
  login,
  registerTeacher,
  approveTeacher,
  registerStudent,
  checkAuth,
  getAllTeachers,
  getStudents,
  getAdminStats
};
