const express = require("express");
const httpStatus = require("http-status");
const moment = require("moment");
const router = express.Router();
// const fcm = require("../helpers/fcm")


router.get("/", (req, res) => {
    res.json({ message: "API Working ✅" });
});
router.use("/auth", require("../routes/auth.routes"));
router.use("/verification", require("../routes/verification.routes"));
router.use("/lecturer", require("../routes/lecturer"));
router.use("/enquiry", require("../routes/enquiry.route"));
router.use("/newsletter", require("../routes/newsletter.route"));
router.use("/course", require("../routes/course.routes"));
router.use("/admin", require("../routes/admin.routes"));
router.use("/fcm", require("../routes/fcm.routes"));
router.use("/notifications", require("../routes/notification.routes"));
router.use("/announcements", require("../routes/announcement.routes"));
router.use("/categories", require("../routes/category.routes"));
router.use("/tutoring-subjects", require("../routes/tutoringSubject.routes"));
router.use("/tutoring-requests", require("../routes/tutoringRequest.routes"));
router.use("/tutoring-enrollments", require("../routes/tutoringEnrollment.routes"));
router.use("/tutoring-payments", require("../routes/tutoringPayment.routes"));
router.use("/tutoring-sessions", require("../routes/tutoringSession.routes"));
router.use("/recurring-schedules", require("../routes/recurringSchedule.routes"));
router.use("/tutoring-earnings", require("../routes/tutoringEarnings.routes"));
router.use("/tutoring-assignments", require("../routes/tutoringAssignment.routes"));
router.use("/weeks", require("../routes/week.routes"));
router.use("/assignments", require("../routes/assignment.routes"));
router.use("/lessons", require("../routes/lesson.routes"));
router.use("/resources", require("../routes/resource.routes"));
router.use("/success-stories", require("../routes/successStory.routes"));
router.use("/live-classes", require("../routes/liveClass.routes"));
router.use("/quizzes", require("../routes/quizRoutes"));
router.use("/lesson-status", require("../routes/lessonstatus.routes"));
router.use("/content", require("../routes/content.routes"));
router.use("/livestreams", require("../routes/liveStream.routes"));
router.use("/student", require("../routes/student.routes"));
router.use("/settings", require("../routes/settings.routes"));
router.use("/activity-logs", require("../routes/activityLog.routes"));
router.use("/features", require("../routes/feature.routes"));
router.use("/instructor-tools", require("../routes/instructorTool.routes"));

module.exports = router;
