const { createError } = require('http-errors');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');

exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError.NotFound('Course not found');

    if (course.enrolledStudents.includes(req.user.id)) {
      throw createError.Conflict('Already enrolled in this course');
    }

    if (!course.enrollmentRequests.includes(req.user.id)) {
      course.enrollmentRequests.push(req.user.id);
      await course.save();
    }

    res.json({ 
      success: true, 
      message: 'Enrollment request submitted. Waiting for teacher approval'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      $or: [
        { enrolledStudents: req.user.id },
        { enrollmentRequests: req.user.id }
      ]
    }).populate('teacher', 'username');

    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw createError.NotFound('Assignment not found');

    const course = await Course.findOne({
      _id: assignment.course,
      enrolledStudents: req.user.id
    });
    if (!course) throw createError.Forbidden('Not enrolled in this course');

    if (new Date() > assignment.dueDate) {
      throw createError.Forbidden('Submission deadline has passed');
    }

    assignment.submissions.push({
      student: req.user.id,
      file: req.file.path,
      submissionDate: new Date()
    });

    await assignment.save();
    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

exports.attemptQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('lesson')
      .populate('course');
    
    if (!quiz) throw createError.NotFound('Quiz not found');

    const course = await Course.findOne({
      _id: quiz.lesson.course,
      enrolledStudents: req.user.id
    });
    if (!course) throw createError.Forbidden('Not enrolled in this course');

    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const isCorrect = question.correctAnswer === req.body.answers[index];
      if (isCorrect) score++;
      return { question: question.question, correct: isCorrect };
    });

    res.json({
      success: true,
      data: {
        score,
        total: quiz.questions.length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};