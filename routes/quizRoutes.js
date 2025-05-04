const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizzesByLesson,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  attemptQuiz
} = require('../controllers/quizController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, restrictTo('Teacher'), createQuiz);
router.get('/lesson/:lessonId', protect, getQuizzesByLesson);
router.get('/:id', protect, getQuiz);
router.patch('/:id', protect, restrictTo('Teacher'), updateQuiz);
router.delete('/:id', protect, restrictTo('Teacher'), deleteQuiz);
router.post('/:id/attempt', protect, restrictTo('Student'), attemptQuiz);

module.exports = router;