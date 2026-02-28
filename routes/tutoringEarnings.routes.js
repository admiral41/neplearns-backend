const router = require('express').Router();
const controller = require('../controllers/tutoringEarnings.controller');
const { verifyUser, verifyLecturer } = require('../middlewares/auth');

// All routes require authentication + LECTURER role

// GET /tutoring-earnings/summary - Get earnings summary
router.get('/summary', verifyUser, verifyLecturer, controller.getSummary);

// GET /tutoring-earnings/by-student - Get breakdown by student
router.get('/by-student', verifyUser, verifyLecturer, controller.getBreakdownByStudent);

// GET /tutoring-earnings/monthly - Get monthly breakdown
router.get('/monthly', verifyUser, verifyLecturer, controller.getMonthlyBreakdown);

module.exports = router;
