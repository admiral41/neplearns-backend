const router = require("express").Router();
const lessonController = require("../controllers/lesson.controller");
const { verifyUser, verifyRole } = require("../middlewares/auth");

// All routes require authentication
router.use(verifyUser);

// Bulk course lessons (must be before :lessonId routes)
router.get("/course/:courseId", lessonController.getCourseLessons);

// Week lessons
router.get("/week/:weekId", lessonController.getWeekLessons);
router.post("/", lessonController.createLesson);
router.get("/:lessonId", lessonController.getLesson);
router.put("/:lessonId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), lessonController.updateLesson);
router.delete("/:lessonId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), lessonController.deleteLesson);
router.put("/:lessonId/reorder", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), lessonController.reorderLesson);
router.put("/:lessonId/status", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), lessonController.toggleLessonStatus);

module.exports = router;