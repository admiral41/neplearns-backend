const { createError } = require('http-errors');
const User = require('../models/User');
const Course = require('../models/Course');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.approveTeacher = async (req, res, next) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true, runValidators: true }
    );
    
    if (!teacher || teacher.role !== 'Teacher') {
      throw createError.NotFound('Teacher not found');
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw createError.NotFound('User not found');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('teacher', 'username email');
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) throw createError.NotFound('Course not found');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};