const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadCourseImage, uploadMaterial } = require('../middleware/uploadMiddleware');
const {createCourse,getTeacherCourses,getTeacherCourse,getAllCourses} = require('../controllers/teacherController');

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
router.get(
  '/:slug',
  getTeacherCourse
);
router.get(
  '/',
  getAllCourses
);
// router.patch('/courses/:id', uploadCourseImage.single('image'), updateCourse);
// router.delete('/courses/:id', deleteCourse);

// router.post('/courses/:courseId/lessons', uploadMaterial.array('materials'), reateLesson);
// router.post('/lessons/:lessonId/assignments', createAssignment);
// router.post('/lessons/:lessonId/quizzes', createQuiz);

module.exports = router;