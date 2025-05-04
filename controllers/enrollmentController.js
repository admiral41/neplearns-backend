const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

exports.requestEnrollment = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });
  
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const existingRequest = course.enrollmentRequests.find(
    r => r.student.toString() === req.user.id
  );

  if (existingRequest) {
    res.status(400);
    throw new Error('Enrollment request already exists');
  }

  course.enrollmentRequests.push({
    student: req.user.id,
    status: 'pending'
  });

  await course.save();
  res.json({ message: 'Enrollment request submitted' });
});

exports.approveEnrollment = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });
  
  if (!course || course.teacher.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Course not found');
  }

  const request = course.enrollmentRequests.find(
    r => r.student.toString() === req.params.studentId
  );

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  request.status = 'approved';
  course.enrolledStudents.push(req.params.studentId);
  
  await course.save();
  
  // Add course to student's enrolled courses
  await User.findByIdAndUpdate(
    req.params.studentId,
    { $addToSet: { enrolledCourses: course._id } }
  );

  res.json({ message: 'Enrollment approved' });
});