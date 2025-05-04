const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Admin-only routes
router.use(protect, restrictTo('Admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/approve', adminController.approveTeacher);
router.delete('/users/:id', adminController.deleteUser);
router.get('/courses', adminController.getAllCourses);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;