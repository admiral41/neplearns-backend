const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const {
  verifyUser,
  verifyRole
} = require('../middlewares/auth');

// ==========================
// PUBLIC ROUTES (Optional Auth)
// ==========================

// Note: For public quiz access, you might need to adjust controller logic

// ==========================
// QUIZ CRUD OPERATIONS
// ==========================

// Create quiz (Lecturers, Admins, SuperAdmins only)
router.post(
  '/',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.createQuiz
);

// Get all quizzes (Admin/SuperAdmin view)
router.get(
  '/',
  verifyUser,
  verifyRole(['ADMIN', 'SUPERADMIN']),
  quizController.getAllQuizzes
);

// Get quizzes for dashboard (All authenticated users)
router.get(
  '/dashboard/all',
  verifyUser,
  quizController.getDashboardQuizzes
);

// Search quizzes (All authenticated users)
router.get(
  '/search/all',
  verifyUser,
  quizController.searchQuizzes
);

// Get quizzes by course (Accessible by enrolled users, lecturers, admins)
router.get(
  '/course/:courseId',
  verifyUser,
  quizController.getQuizzesByCourse
);

// Get quizzes by week (Accessible by enrolled users, lecturers, admins)
router.get(
  '/week/:weekId',
  verifyUser,
  quizController.getQuizzesByWeek
);

// Get quizzes by lesson (Accessible by enrolled users, lecturers, admins)
router.get(
  '/lesson/:lessonId',
  verifyUser,
  quizController.getQuizzesByLesson
);

// Get single quiz by ID (Accessible by authorized users)
router.get(
  '/:id',
  verifyUser,
  quizController.getQuiz
);

// Update quiz (Lecturers, Admins, SuperAdmins only)
router.put(
  '/:id',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.updateQuiz
);

// Delete quiz (Lecturers, Admins, SuperAdmins only)
router.delete(
  '/:id',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.deleteQuiz
);

// Duplicate quiz (Lecturers, Admins, SuperAdmins only)
router.post(
  '/:id/duplicate',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.duplicateQuiz
);

// Publish/Unpublish quiz (Lecturers, Admins, SuperAdmins only)
router.patch(
  '/:id/publish',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.togglePublish
);

// Get quiz statistics (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:id/stats',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuizStats
);

// Validate quiz (check readiness) (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:id/validate',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.validateQuiz
);

// Export quiz (for backup/template) (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:id/export',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.exportQuiz
);

// ==========================
// QUESTION MANAGEMENT
// ==========================

// Add question to quiz (Lecturers, Admins, SuperAdmins only)
router.post(
  '/:quizId/questions',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.addQuestion
);

// Get all questions for a quiz (Accessible by authorized users)
router.get(
  '/:quizId/questions',
  verifyUser,
  quizController.getQuizQuestions
);

// Get single question (Lecturers, Admins, SuperAdmins only)
router.get(
  '/questions/:questionId',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuestion
);

// Update a question (Lecturers, Admins, SuperAdmins only)
router.put(
  '/questions/:questionId',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.updateQuestion
);

// Delete a question (Lecturers, Admins, SuperAdmins only)
router.delete(
  '/questions/:questionId',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.deleteQuestion
);

// Bulk delete questions (Lecturers, Admins, SuperAdmins only)
router.post(
  '/questions/bulk-delete',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.bulkDeleteQuestions
);

// Reorder questions (Lecturers, Admins, SuperAdmins only)
router.put(
  '/:quizId/questions/reorder',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.reorderQuestions
);

// Toggle question status (Lecturers, Admins, SuperAdmins only)
router.patch(
  '/questions/:questionId/status',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.toggleQuestionStatus
);

// Import questions (CSV/Excel) (Lecturers, Admins, SuperAdmins only)
router.post(
  '/:quizId/questions/import',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.importQuestions
);

// Export questions as CSV (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/questions/export',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.exportQuestions
);

// ==========================
// QUIZ ATTEMPTS & TAKING
// ==========================

// Start quiz attempt (Enrolled learners, Admins, SuperAdmins)
router.post(
  '/:quizId/attempts/start',
  verifyUser,
  quizController.startQuizAttempt
);

// Submit quiz attempt (Enrolled learners, Admins, SuperAdmins)
router.post(
  '/:quizId/attempts/:attemptId/submit',
  verifyUser,
  quizController.submitQuizAttempt
);

// Get student's attempts (Student can see their own attempts)
router.get(
  '/:quizId/student/attempts',
  verifyUser,
  quizController.getStudentAttempts
);

// Get single attempt (Student can see their own, Instructors can see all)
router.get(
  '/attempts/:attemptId',
  verifyUser,
  quizController.getAttempt
);

// ==========================
// INSTRUCTOR VIEWS & MANAGEMENT
// ==========================

// Get all attempts for a quiz (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/attempts',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuizAttempts
);

// Reset attempt (allow retake) (Lecturers, Admins, SuperAdmins only)
router.post(
  '/attempts/:attemptId/reset',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.resetAttempt
);

// Delete attempt (Admin, SuperAdmin only)
router.delete(
  '/attempts/:attemptId',
  verifyUser,
  verifyRole(['ADMIN', 'SUPERADMIN']),
  quizController.deleteAttempt
);

// Bulk delete attempts (Admin, SuperAdmin only)
router.post(
  '/attempts/bulk-delete',
  verifyUser,
  verifyRole(['ADMIN', 'SUPERADMIN']),
  quizController.bulkDeleteAttempts
);

// ==========================
// RESULTS & ANALYTICS
// ==========================

// Get quiz results (Students see their own, Instructors see all)
router.get(
  '/:quizId/results',
  verifyUser,
  quizController.getQuizResults
);

// Get quiz analytics (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/analytics',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuizAnalytics
);

// Get question analysis (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/question-analysis',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuestionAnalysis
);

// Get time analytics (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/time-analytics',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getTimeAnalytics
);

// Export attempts as CSV (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/attempts/export',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.exportAttempts
);

// ==========================
// ESSAY GRADING
// ==========================

// Grade essay question (Lecturers, Admins, SuperAdmins only)
router.post(
  '/attempts/:attemptId/grade/:questionId',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.gradeEssayQuestion
);

// Get questions needing grading (Lecturers, Admins, SuperAdmins only)
router.get(
  '/:quizId/grading-queue',
  verifyUser,
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']),
  quizController.getQuestionsNeedingGrading
);

module.exports = router;