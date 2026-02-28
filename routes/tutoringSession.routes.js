const router = require("express").Router();
const controller = require("../controllers/tutoringSession.controller");
const { verifyUser, verifyLecturer, verifyLearner } = require("../middlewares/auth");

// ======================= INSTRUCTOR ROUTES =======================

// Get instructor's assigned students grouped by subject
router.get("/my-students", verifyUser, verifyLecturer, controller.getMyStudents);

// Get instructor's sessions
router.get("/instructor", verifyUser, verifyLecturer, controller.getInstructorSessions);

// Create a new session
router.post("/", verifyUser, verifyLecturer, controller.createSession);

// Update a session
router.patch("/:id", verifyUser, verifyLecturer, controller.updateSession);

// Cancel a session (soft delete)
router.delete("/:id", verifyUser, verifyLecturer, controller.cancelSession);

// Start session early (go live)
router.post("/:id/start", verifyUser, verifyLecturer, controller.startSession);

// End a live session
router.post("/:id/end", verifyUser, verifyLecturer, controller.endSession);

// Mark attendance
router.post("/:id/attendance", verifyUser, verifyLecturer, controller.markAttendance);

// ======================= STUDENT ROUTES =======================

// Get student's sessions
router.get("/student", verifyUser, verifyLearner, controller.getStudentSessions);

// ======================= SHARED ROUTES =======================

// Get session by ID (student or instructor)
router.get("/:id", verifyUser, controller.getSessionById);

module.exports = router;
