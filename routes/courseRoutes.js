const express = require('express');
const router = express.Router();
const { 
  getAllCourses,
  getCourseBySlug,
  getLessonsByCourse
} = require('../controllers/courseController');

// Public routes
router.get('/get', getAllCourses);
router.get('/get/:slug', getCourseBySlug);
router.get('/:courseId/lessons', getLessonsByCourse);

module.exports = router;