const express = require('express');
const router = express.Router();
const {
  createAssignment,
  submitAssignment,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  gradeSubmission,
  getAssignmentsByLesson
} = require('../controllers/assignmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');

router.post(
  '/',
  protect,
  restrictTo('Teacher'),
  uploadMaterial.array('attachments'),
  createAssignment
);

router.get('/lesson/:lessonId', protect, getAssignmentsByLesson);
router.get('/:id', protect, getAssignment);
router.patch('/:id', protect, restrictTo('Teacher'), updateAssignment);
router.delete('/:id', protect, restrictTo('Teacher'), deleteAssignment);

router.post('/:id/submit', protect, restrictTo('Student'), submitAssignment);
router.get('/:id/submissions', protect, getSubmissions);
router.patch('/submissions/:id/grade', protect, restrictTo('Teacher'), gradeSubmission);

module.exports = router;