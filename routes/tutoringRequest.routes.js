const router = require("express").Router();
const controller = require("../controllers/tutoringRequest.controller");
const { verifyUser, verifyAdmin, verifyLearner } = require("../middlewares/auth");

// ======================= STUDENT ROUTES =======================
// IMPORTANT: /my-requests MUST come before /:id to avoid "my-requests" being parsed as an ID
router.get("/my-requests", verifyUser, verifyLearner, controller.getMyRequests);
router.post("/", verifyUser, verifyLearner, controller.createRequest);
router.get("/:id", verifyUser, controller.getRequestById);

// ======================= ADMIN ROUTES =======================
router.get("/", verifyAdmin, controller.getAllRequests);
router.post("/:id/assign", verifyAdmin, controller.assignInstructor);
router.post("/:id/reject", verifyAdmin, controller.rejectRequest);
router.patch("/:id/notes", verifyAdmin, controller.updateAdminNotes);

module.exports = router;
