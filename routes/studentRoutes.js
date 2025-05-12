const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  applyForCourse,
  getMyCourses,
  getCourseDetails,
  submitAssignment, 
  getAssignment,
  takeQuiz,
  submitQuiz,
  getQuizResult,
  getQuizzesByLesson,
  getAssignmentsByLesson

} = require('../controllers/studentController');
const { uploadAttachment } = require('../middleware/uploadMiddleware');

// Protect all routes
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
});

// Enrollment routes
router.post('/courses/:courseId/apply', applyForCourse);
router.get('/courses/my-courses', getMyCourses);
router.get('/courses/:courseId', getCourseDetails);

router.post(
  '/assignments/:assignmentId/submit', 
  submitAssignment
);
router.get('/assignments/:assignmentId', getAssignment);
router.get('/lessons/:lessonId/assignments', getAssignmentsByLesson);

// Quiz routes
router.get('/quizzes/:quizId', takeQuiz);
router.post('/quizzes/:quizId/submit', submitQuiz);
router.get('/quizzes/:quizId/results', getQuizResult);
router.get('/lessons/:lessonId/quizzes', getQuizzesByLesson);

module.exports = router;