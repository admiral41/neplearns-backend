const express = require('express');
const router = express.Router();
const { login, registerTeacher, approveTeacher, registerStudent,getAdminStats, checkAuth, getAllTeachers, getStudents,forgotPassword,resetPassword} = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register/teacher', registerTeacher);
router.post('/register/student', registerStudent);
router.get('/check', protect, checkAuth);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
// Admin protected routes
router.post('/approve-teacher/:id',
  protect,
  restrictTo('Admin'),
  approveTeacher
);
router.get('/students', protect,
  restrictTo('Admin'), getStudents
);
router.get('/teachers', protect,
  restrictTo('Admin'), getAllTeachers
);
router.get('/stats', getAdminStats);

module.exports = router;