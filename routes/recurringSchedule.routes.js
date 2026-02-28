const router = require("express").Router();
const controller = require("../controllers/recurringSchedule.controller");
const { verifyUser, verifyLecturer, verifyLearner } = require("../middlewares/auth");

// ======================= INSTRUCTOR ROUTES =======================

// Create a recurring schedule
router.post("/", verifyUser, verifyLecturer, controller.create);

// Get instructor's recurring schedules
router.get("/instructor", verifyUser, verifyLecturer, controller.getMySchedules);

// Get schedules by student
router.get("/student/:studentId", verifyUser, verifyLecturer, controller.getSchedulesByStudent);

// Update a recurring schedule
router.put("/:id", verifyUser, verifyLecturer, controller.update);

// Delete a recurring schedule (soft delete)
router.delete("/:id", verifyUser, verifyLecturer, controller.delete);

// ======================= STUDENT ROUTES =======================

// Get student's own schedules
router.get("/my-schedule", verifyUser, verifyLearner, controller.getStudentSchedule);

module.exports = router;
