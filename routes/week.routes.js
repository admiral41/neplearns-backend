const router = require("express").Router();
const weekController = require("../controllers/week.controller");
const { verifyUser, verifyRole } = require("../middlewares/auth");

// All routes require authentication
router.use(verifyUser);

// Course weeks
router.get("/course/:courseId", weekController.getCourseWeeks);
router.post("/", weekController.createWeek);
router.get("/:weekId", weekController.getWeek);
router.put("/:weekId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), weekController.updateWeek);
router.delete("/:weekId", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), weekController.deleteWeek);
router.put("/:weekId/reorder", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), weekController.reorderWeek);
router.put("/:weekId/status", verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), weekController.toggleWeekStatus);

module.exports = router;