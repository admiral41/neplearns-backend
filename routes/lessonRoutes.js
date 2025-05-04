const express = require('express');
const router = express.Router();
const {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');

// Public routes
router.get('/course/:courseId', getLessonsByCourse);
router.get('/:lessonId', getLessonById);

// Protected routes
const { protect, restrictTo } = require('../middleware/authMiddleware');
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'Teacher' || !req.user.isApproved) {
    return res.status(403).json({ message: 'Teacher access required' });
  }
  next();
});

router.post('/add', restrictTo('Teacher'), createLesson);
router.patch('/:lessonId', restrictTo('Teacher'), updateLesson);
router.delete('/:lessonId', restrictTo('Teacher'), deleteLesson);

module.exports = router;