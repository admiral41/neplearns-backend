const router = require("express").Router();
const liveClassController = require("../controllers/liveClassController");
const { verifyUser, verifyRole } = require("../middlewares/auth");

// All routes require authentication
router.use(verifyUser);

// ================ STATIC ROUTES ================
router.get("/", liveClassController.getAllLiveClasses);
router.get("/course/:courseId", liveClassController.getLiveClassesByCourse);
router.get("/upcoming", liveClassController.getUpcomingClasses);
router.get("/stats", liveClassController.getLiveClassStats);

// ================ PARAMETERIZED ROUTES ================
router.get("/:liveClassId/zoom-details", verifyUser, liveClassController.getZoomMeetingDetails);
router.get("/:liveClassId", liveClassController.getLiveClassById);
router.get("/:liveClassId/join", liveClassController.getJoinInfo);
router.get("/:liveClassId/recording", liveClassController.getRecordingInfo);
router.get("/:liveClassId/attendance-report", liveClassController.getAttendanceReport);

router.post("/", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.createLiveClass);
router.post("/:liveClassId/start", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.startLiveClass);
router.post("/:liveClassId/end", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.endLiveClass);
router.post("/:liveClassId/attendance", verifyRole(['LEARNER']), liveClassController.markAttendance);
router.post("/:liveClassId/send-reminder", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.sendReminder);

router.put("/:liveClassId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.updateLiveClass);
router.put("/:liveClassId/reschedule", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.rescheduleLiveClass);

router.delete("/:liveClassId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.deleteLiveClass);
router.delete("/:liveClassId/cancel", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), liveClassController.cancelLiveClass);

module.exports = router;