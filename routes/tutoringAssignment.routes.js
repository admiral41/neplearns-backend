const router = require("express").Router();
const controller = require("../controllers/tutoringAssignment.controller");
const { verifyUser, verifyLecturer, verifyLearner } = require("../middlewares/auth");
const upload = require("../middlewares/multer");

// ======================= INSTRUCTOR ROUTES =======================

// Create a new assignment (with optional file attachments)
router.post("/", verifyUser, verifyLecturer, upload.array('attachments', 5), controller.create);

// Get instructor's assignments
router.get("/instructor", verifyUser, verifyLecturer, controller.getInstructorAssignments);

// Update an assignment
router.patch("/:id", verifyUser, verifyLecturer, controller.update);

// Delete an assignment
router.delete("/:id", verifyUser, verifyLecturer, controller.delete);

// Give feedback on a submission
router.post("/:id/feedback", verifyUser, verifyLecturer, controller.giveFeedback);

// Request changes on a submission
router.post("/:id/request-changes", verifyUser, verifyLecturer, controller.requestChanges);

// ======================= STUDENT ROUTES =======================

// Get student's assignments
router.get("/student", verifyUser, verifyLearner, controller.getStudentAssignments);

// Submit work for an assignment (with optional file attachments)
router.post("/:id/submit", verifyUser, verifyLearner, upload.array('attachments', 5), controller.submit);

// ======================= SHARED ROUTES =======================

// Get assignment by ID (student or instructor)
router.get("/:id", verifyUser, controller.getById);

module.exports = router;
