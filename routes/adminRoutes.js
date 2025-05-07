const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Admin-only routes
router.use(protect, restrictTo('Admin'));
// User Management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/approve', adminController.approveTeacher);


// Course Management
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', getCourse);
router.delete('/courses/:id', adminController.deleteCourse);

module.exports = router;