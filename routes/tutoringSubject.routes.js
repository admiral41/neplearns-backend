const router = require("express").Router();
const controller = require("../controllers/tutoringSubject.controller");
const { verifyAdmin, checkAuth } = require("../middlewares/auth");

// ======================= PUBLIC ROUTES =======================
router.get("/", checkAuth, controller.getAllSubjects);
router.get("/active", checkAuth, controller.getActiveSubjects);
router.get("/:slug", checkAuth, controller.getSubjectBySlug);

// ======================= ADMIN ROUTES =======================
router.post("/create", verifyAdmin, controller.createSubject);
router.put("/:slug", verifyAdmin, controller.updateSubject);
router.delete("/:slug", verifyAdmin, controller.deleteSubject);

module.exports = router;
