const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const authMiddleware = require('../middlewares/auth');

// Public routes (authentication required)
router.use(authMiddleware.verifyUser);

// User assignment routes (must come before :assignmentId wildcard)
router.get('/user/assignments/me', assignmentController.getMyAssignments);
router.get('/user/submissions/me', assignmentController.getMySubmissions);
router.get('/user/:userId/submissions', authMiddleware.verifyRole(['ADMIN', 'SUPERADMIN']), assignmentController.getUserSubmissions);

// Instructor routes
router.get('/instructor/pending-submissions', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.getInstructorPendingSubmissions);
router.get('/instructor/all-submissions', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.getInstructorAllSubmissions);

// Get assignments by filters (must come before :assignmentId wildcard)
router.get('/lesson/:lessonId', assignmentController.getLessonAssignments);
router.get('/course/:courseId', assignmentController.getCourseAssignments);

// Submission grading and management (must come before :assignmentId wildcard)
router.get('/submissions/:submissionId', assignmentController.getSubmission);
router.post('/submissions/:submissionId/grade', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.gradeSubmission);
router.put('/submissions/:submissionId', authMiddleware.verifyRole(['LEARNER']), assignmentController.updateSubmission);

// Assignment CRUD routes (wildcard routes last)
router.post('/', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.createAssignment);
router.get('/:assignmentId', assignmentController.getAssignment);
router.put('/:assignmentId', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.updateAssignment);
router.delete('/:assignmentId', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.deleteAssignment);
router.patch('/:assignmentId/toggle-status', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.toggleAssignmentStatus);

// Submission routes (wildcard routes)
router.post('/:assignmentId/submit', authMiddleware.verifyRole(['LEARNER']), assignmentController.submitAssignment);
router.get('/:assignmentId/submissions', authMiddleware.verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), assignmentController.getAssignmentSubmissions);

module.exports = router;
