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
// In your teacherController.js
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug, teacher: req.user.id },
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
    // First find the course to get its ID for cleanup
    const course = await Course.findOne({
      slug: req.params.slug,
      teacher: req.user.id
    });
    
    if (!course) throw createError.NotFound('Course not found');

    // Delete all related lessons, assignments, and quizzes
    await Lesson.deleteMany({ course: course._id });
    await Assignment.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });

    // Now delete the course
    await Course.deleteOne({ _id: course._id });

    // Remove course from teacher's teachingCourses array
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { teachingCourses: course._id } }
    );

    // Remove course from students' enrolledCourses
    await User.updateMany(
      { 'enrolledCourses.course': course._id },
      { $pull: { enrolledCourses: { course: course._id } } }
    );

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
    .populate({
      path: 'lessons',
      select: 'title _id' // Only include title and _id for lessons
    })
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

// assignment
const createAssignment = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, description, instructions, dueDate, points } = req.body;

    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw createError.NotFound('Lesson not found');
    
    // Check if teacher owns the course
    const course = await Course.findOne({ 
      _id: lesson.course._id, 
      teacher: req.user.id 
    });
    if (!course) throw createError.Forbidden();

    const assignment = await Assignment.create({
      title,
      description,
      instructions,
      lesson: lessonId,
      course: lesson.course._id,
      dueDate,
      points,
      createdBy: req.user.id
    });

    // Add assignment to lesson
    lesson.assignments.push(assignment._id);
    await lesson.save();

    res.status(201).json({ 
      success: true, 
      data: assignment 
    });
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, instructions, dueDate, points, isActive } = req.body;

    const updatedFields = {
      title,
      description,
      instructions,
      dueDate,
      points,
      isActive
    };

    if (req.files && req.files.length > 0) {
      updatedFields.attachments = req.files.map(file => ({
        path: file.path,
        originalName: file.originalname
      }));
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, createdBy: req.user.id },
      updatedFields,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Update Assignment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const gradeAssignment = async (req, res, next) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user.id
    });
    if (!assignment) throw createError.NotFound('Assignment not found');

    const submission = assignment.submissions.id(submissionId);
    if (!submission) throw createError.NotFound('Submission not found');

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    
    await assignment.save();

    res.json({ 
      success: true, 
      data: submission 
    });
  } catch (error) {
    next(error);
  }
};

const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user.id
    }).populate('submissions.student', 'username email profilePicture');

    if (!assignment) throw createError.NotFound('Assignment not found');

    res.json({ 
      success: true, 
      count: assignment.submissions.length,
      data: assignment.submissions 
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOneAndDelete({
      _id: assignmentId,
      createdBy: req.user.id
    });

    if (!assignment) throw createError.NotFound('Assignment not found');

    // Remove assignment from lesson
    await Lesson.updateOne(
      { _id: assignment.lesson },
      { $pull: { assignments: assignmentId } }
    );

    res.json({ 
      success: true, 
      data: null 
    });
  } catch (error) {
    next(error);
  }
};

// Quiz Controllers
const createQuiz = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      questions, 
      timeLimit, 
      passingScore, 
      attemptsAllowed,
      lesson // lessonId now comes from request body
    } = req.body;

    console.log("Received lesson ID:", lesson); // Add this for debugging

    const lessonObj = await Lesson.findById(lesson).populate('course');
    if (!lessonObj) {
      console.log("Lesson lookup failed for ID:", lesson);
      throw createError.NotFound('Lesson not found');
    }
    
    // Check if teacher owns the course
    const course = await Course.findOne({ 
      _id: lessonObj.course._id, 
      teacher: req.user.id 
    });
    if (!course) {
      console.log("Course ownership validation failed");
      throw createError.Forbidden();
    }

    const quiz = await Quiz.create({
      title,
      description,
      lesson,
      course: lessonObj.course._id,
      questions,
      timeLimit,
      passingScore,
      attemptsAllowed,
      createdBy: req.user.id
    });

    // Add quiz to lesson
    lessonObj.quizzes.push(quiz._id);
    await lessonObj.save();

    res.status(201).json({ 
      success: true, 
      data: quiz 
    });
  } catch (error) {
    next(error);
  }
};
const updateQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { 
      title, 
      description, 
      questions, 
      timeLimit, 
      passingScore, 
      attemptsAllowed,
      isActive 
    } = req.body;

    // Find the quiz first to verify ownership
    const existingQuiz = await Quiz.findOne({
      _id: quizId,
      createdBy: req.user.id
    });
    
    if (!existingQuiz) {
      throw createError.NotFound('Quiz not found or not authorized');
    }

    // Prepare update object
    const updateData = {
      title: title || existingQuiz.title,
      description: description || existingQuiz.description,
      timeLimit: timeLimit || existingQuiz.timeLimit,
      passingScore: passingScore || existingQuiz.passingScore,
      attemptsAllowed: attemptsAllowed || existingQuiz.attemptsAllowed,
      isActive: isActive !== undefined ? isActive : existingQuiz.isActive
    };

    // Handle questions update if provided
    if (questions) {
      try {
        const parsedQuestions = JSON.parse(questions);
        
        if (!Array.isArray(parsedQuestions)) {
          throw createError.BadRequest('Questions must be an array');
        }

        updateData.questions = parsedQuestions.map(q => {
          if (!q.options || !Array.isArray(q.options)) {
            throw createError.BadRequest('Each question must have an options array');
          }

          return {
            question: q.question || 'Untitled Question',
            options: q.options.map((opt, idx) => ({
              text: opt.text || `Option ${idx + 1}`,
              isCorrect: idx === q.correctOption
            })),
            explanation: q.explanation || '',
            points: q.points || 1
          };
        });
      } catch (parseError) {
        throw createError.BadRequest('Invalid questions format');
      }
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      data: updatedQuiz 
    });
  } catch (error) {
    next(error);
  }
};

const getQuizResults = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: req.user.id
    }).populate('submissions.student', 'username email profilePicture');

    if (!quiz) throw createError.NotFound('Quiz not found');

    res.json({ 
      success: true, 
      count: quiz.submissions.length,
      data: quiz.submissions 
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      createdBy: req.user.id
    });

    if (!quiz) throw createError.NotFound('Quiz not found');

    // Remove quiz from lesson
    await Lesson.updateOne(
      { _id: quiz.lesson },
      { $pull: { quizzes: quizId } }
    );

    res.json({ 
      success: true, 
      data: null 
    });
  } catch (error) {
    next(error);
  }
};

const getQuizzesByCourse = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ 
      course: req.params.courseId,
      createdBy: req.user.id
    })
    .populate('lesson', 'title')
    .sort('-createdAt');

    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

const getAssignmentsByCourse = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ 
      course: req.params.courseId,
      createdBy: req.user.id
    })
    .populate('lesson', 'title')
    .sort('-createdAt');

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed submission
const getQuizSubmission = async (req, res, next) => {
  try {
    const { quizId, submissionId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: req.user.id
    }).populate({
      path: 'submissions.student',
      select: 'name email profilePicture'
    });

    if (!quiz) throw createError.NotFound('Quiz not found');

    const submission = quiz.submissions.id(submissionId);
    if (!submission) throw createError.NotFound('Submission not found');

    // Map questions with student answers
    const detailedQuestions = quiz.questions.map((question, index) => {
      const answer = submission.answers.find(ans => 
        ans.questionId.toString() === question._id.toString()
      );
      
      return {
        question: question.question,
        options: question.options,
        correctOption: question.options.findIndex(opt => opt.isCorrect),
        selectedOption: answer ? answer.selectedOption : null,
        isCorrect: answer ? answer.isCorrect : false,
        explanation: question.explanation,
        points: question.points
      };
    });

    res.json({ 
      success: true, 
      data: {
        quizTitle: quiz.title,
        student: submission.student,
        score: submission.score,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        percentage: (submission.score / quiz.questions.reduce((sum, q) => sum + q.points, 0)) * 100,
        passed: (submission.score / quiz.questions.reduce((sum, q) => sum + q.points, 0)) * 100 >= quiz.passingScore,
        submittedAt: submission.submittedAt,
        attemptNumber: submission.attemptNumber,
        questions: detailedQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};
// Get all assignments for a lesson
const getAssignmentsByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    
    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) throw createError.NotFound('Lesson not found');
    
    // Verify teacher owns the course
    const course = await Course.findOne({
      _id: lesson.course._id,
      teacher: req.user.id
    });
    if (!course) throw createError.Forbidden();

    const assignments = await Assignment.find({ lesson: lessonId })
      .sort('-createdAt');

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// Get single assignment with submissions
const getAssignmentWithSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user.id
    })
    .populate({
      path: 'submissions.student',
      select: 'username email profilePicture'
    })
    .populate('lesson', 'title');

    if (!assignment) throw createError.NotFound('Assignment not found');

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// Get single submission details
const getSubmissionDetails = async (req, res, next) => {
  try {
    const { assignmentId, submissionId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user.id
    })
    .populate({
      path: 'submissions.student',
      select: 'username email profilePicture'
    });

    if (!assignment) throw createError.NotFound('Assignment not found');

    const submission = assignment.submissions.id(submissionId);
    if (!submission) throw createError.NotFound('Submission not found');

    res.json({
      success: true,
      data: {
        assignment: {
          title: assignment.title,
          points: assignment.points,
          dueDate: assignment.dueDate
        },
        submission
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
  updateEnrollmentStatus,
  createAssignment,
  updateAssignment,
  gradeAssignment,
  getAssignmentSubmissions,
  deleteAssignment,
  createQuiz,
  updateQuiz,
  getQuizResults,
  deleteQuiz,
  getAssignmentsByCourse,
  getQuizzesByCourse,
  getQuizSubmission,
  getAssignmentsByLesson,
  getAssignmentWithSubmissions,
  getSubmissionDetails

};
