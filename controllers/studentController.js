const Course = require('../models/Courses');
const User = require('../models/User');
const { createError } = require('http-errors');
const Quiz = require('../models/Quiz');
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
const submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'enrolledStudents');
    if (!assignment) throw createError.NotFound('Assignment not found');

    // Check if student is enrolled in the course
    const isEnrolled = assignment.course.enrolledStudents.some(
      student => student.student.toString() === req.user.id
    );
    if (!isEnrolled) throw createError.Forbidden();

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user.id
    );
    if (existingSubmission) throw createError.Conflict('Already submitted');

    const files = req.files?.map(file => ({
      path: file.path,
      originalName: file.originalname
    })) || [];

    assignment.submissions.push({
      student: req.user.id,
      files
    });

    await assignment.save();

    res.status(201).json({ 
      success: true, 
      data: assignment.submissions[assignment.submissions.length - 1] 
    });
  } catch (error) {
    next(error);
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'enrolledStudents')
      .populate('createdBy', 'username profilePicture');

    if (!assignment) throw createError.NotFound('Assignment not found');

    // Check if student is enrolled in the course
    const isEnrolled = assignment.course.enrolledStudents.some(
      student => student.student.toString() === req.user.id
    );
    if (!isEnrolled) throw createError.Forbidden();

    // Get student's submission if exists
    const submission = assignment.submissions.find(
      sub => sub.student.toString() === req.user.id
    );

    res.json({ 
      success: true, 
      data: {
        assignment,
        submission
      }
    });
  } catch (error) {
    next(error);
  }
};

// Quiz Controllers
// In your takeQuiz controller
const takeQuiz = async (req, res, next) => {
  try {
    // First check if user has already completed the quiz
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('course', 'enrolledStudents');
    
    if (!quiz) throw createError.NotFound('Quiz not found');

    // Check if already completed
    const attempts = quiz.submissions.filter(
      sub => sub.student.toString() === req.user.id
    ).length;
    
    if (attempts >= quiz.attemptsAllowed) {
      return res.json({
        success: true,
        data: null,
        message: 'You have already completed this quiz'
      });
    }

    // Only return quiz data if not completed
    const quizForStudent = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(opt => opt.text),
        points: q.points
      })),
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore
    };

    res.json({ success: true, data: quizForStudent });
  } catch (error) {
    next(error);
  }
};

const submitQuiz = async (req, res, next) => {
  try {
    console.log('Received body:', req.body); // Debug log
    const { quizId } = req.params;
    const { answers } = req.body;

    // Validate answers exists and is an array
    if (!answers || !Array.isArray(answers)) {
      throw createError(400, 'Answers must be provided as an array');
    }

   const quiz = await Quiz.findById(quizId)
      .populate('course', 'enrolledStudents');
    if (!quiz) throw createError.NotFound('Quiz not found');

    // Check enrollment
    const isEnrolled = quiz.course.enrolledStudents.some(
      student => student.student.toString() === req.user.id
    );
    if (!isEnrolled) throw createError.Forbidden();

    // Check if quiz is active
    if (!quiz.isActive) throw createError.Forbidden('Quiz is not active');

    // Check attempts
    const attempts = quiz.submissions.filter(
      sub => sub.student.toString() === req.user.id
    ).length;
    
    if (attempts >= quiz.attemptsAllowed) {
      throw createError.Forbidden('Maximum attempts reached');
    }

    // Calculate score
    let score = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question) => {
      const studentAnswer = answers.find(a => 
        a.questionId === question._id.toString()
      );
      
      if (studentAnswer) {
        const isCorrect = question.options[studentAnswer.selectedOption]?.isCorrect || false;
        if (isCorrect) score += question.points;
        
        detailedAnswers.push({
          questionId: question._id,
          selectedOption: studentAnswer.selectedOption,
          isCorrect
        });
      }
    });

    const totalPossible = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalPossible) * 100);

    // Save submission
    quiz.submissions.push({
      student: req.user.id,
      answers: detailedAnswers,
      score: percentage,
      attemptNumber: attempts + 1
    });

    await quiz.save();

    res.status(201).json({ 
      success: true, 
      data: {
        score: percentage,
        passingScore: quiz.passingScore,
        passed: percentage >= quiz.passingScore,
        attemptNumber: attempts + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

const getQuizResult = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('course', 'enrolledStudents')
      .populate('submissions.student', 'username profilePicture');

    if (!quiz) throw createError.NotFound('Quiz not found');

    // Get student's submissions
    const submissions = quiz.submissions.filter(
      sub => sub.student._id.toString() === req.user.id
    );

    // Calculate statistics
    const latestSubmission = submissions[submissions.length - 1];
    const totalQuestions = quiz.questions.length;
    const correctAnswers = latestSubmission?.answers?.filter(a => a.isCorrect).length || 0;
    const passingScore = quiz.passingScore || 70; // Default if not set

    // Return quiz with enhanced result data
    const quizWithResults = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      passingScore,
      timeLimit: quiz.timeLimit,
      attemptsAllowed: quiz.attemptsAllowed,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(opt => opt.text),
        correctOption: q.options.findIndex(opt => opt.isCorrect),
        explanation: q.explanation,
        points: q.points
      })),
      submissions,
      statistics: {
        totalQuestions,
        correctAnswers,
        score: latestSubmission?.score || 0,
        passed: latestSubmission?.score >= passingScore
      }
    };

    res.json({ 
      success: true, 
      data: quizWithResults 
    });
  } catch (error) {
    next(error);
  }
};
const getQuizzesByLesson = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ lesson: req.params.lessonId })
      .select('title description timeLimit passingScore');
    res.json({ success: true, data: quizzes });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  applyForCourse,
  getMyCourses,
  getCourseDetails,
  submitAssignment,
  getAssignment,
  takeQuiz,
  submitQuiz,
  getQuizResult,
  getQuizzesByLesson
};