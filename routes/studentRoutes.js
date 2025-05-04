const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
});

router.post('/courses/:id/enroll', studentController.enrollCourse);
router.get('/my-courses', studentController.getMyCourses);
router.post('/assignments/:id/submit', studentController.submitAssignment);
router.post('/quizzes/:id/attempt', studentController.attemptQuiz);
router.post('/courses/:id/review', studentController.submitReview);

module.exports = router;