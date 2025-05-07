const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  applyForCourse,
  getMyCourses,
  getCourseDetails,
} = require('../controllers/studentController');

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


module.exports = router;