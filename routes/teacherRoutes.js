const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadCourseImage, uploadAttachment, } = require('../middleware/uploadMiddleware');
const { createCourse, getTeacherCourses, getTeacherCourse, deleteCourse, getQuizSubmission, getAssignmentsByCourse, getQuizzesByCourse, updateCourse, getAllCourses, getEnrollmentRequests, processEnrollmentRequest, getEnrolledStudents, createAssignment, updateAssignment, gradeAssignment, getAssignmentSubmissions, deleteAssignment, createQuiz, updateQuiz, getQuizResults, deleteQuiz } = require('../controllers/teacherController');

// Teacher-specific routes
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'Teacher' || !req.user.isApproved) {
    return res.status(403).json({ message: 'Teacher access required' });
  }
  next();
});

router.post(
  '/add',
  protect,
  restrictTo('Teacher'),
  uploadCourseImage.single('courseImage'),
  createCourse
);
router.get(
  '/me',
  protect,
  restrictTo('Teacher'),
  getTeacherCourses
);
router.delete(
  '/:slug',
  deleteCourse
);
router.patch(
  '/:slug',
  uploadCourseImage.single('courseImage'),
  updateCourse
);
router.get('/enrollment-requests', protect, restrictTo('Teacher'), getEnrollmentRequests);
router.patch('/enrollment-requests/:requestId', protect, restrictTo('Teacher'), processEnrollmentRequest);
router.get('/enrolled-students', protect, restrictTo('Teacher'), getEnrolledStudents);
router.get(
  '/:slug',
  getTeacherCourse
);
router.get(
  '/',
  getAllCourses
);
// Assignment routes
router.post(
  '/lessons/:lessonId/assignments',
  uploadAttachment.array('attachments'),
  createAssignment
);
router.put(
  '/assignments/:assignmentId',
  uploadAttachment.array('attachments'),
  updateAssignment
);
router.patch('/assignments/:assignmentId/submissions/:submissionId/grade', gradeAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.delete('/assignments/:assignmentId', deleteAssignment);

// Quiz routes
router.get('/:courseId/assignments', getAssignmentsByCourse);
router.get('/:courseId/quizzes', getQuizzesByCourse);
router.post('/quizzes', createQuiz);
router.put('/quizzes/:quizId', updateQuiz);
router.get('/quizzes/:quizId/results', getQuizResults);
router.get('/quizzes/:quizId/results/:submissionId', getQuizSubmission);

router.delete('/quizzes/:quizId', deleteQuiz);
module.exports = router;