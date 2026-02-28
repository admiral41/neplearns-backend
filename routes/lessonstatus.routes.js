const router = require("express").Router();
const lessonStatusController = require("../controllers/lessonstatus.controller");
const { verifyUser } = require("../middlewares/auth");

router.use(verifyUser);

router.get("/:lessonId", lessonStatusController.getLessonStatus);

router.post("/:lessonId/complete", lessonStatusController.markComplete);
router.post("/:lessonId/incomplete", lessonStatusController.markIncomplete);
router.post("/:lessonId/start", lessonStatusController.startLesson);

router.get("/course/:courseId", lessonStatusController.getCourseProgress);

router.get("/user/all-progress", lessonStatusController.getAllUserProgress);

router.delete("/course/:courseId/reset", lessonStatusController.resetCourseProgress);

module.exports = router;