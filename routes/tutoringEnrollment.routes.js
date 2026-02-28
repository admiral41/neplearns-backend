const router = require("express").Router();
const controller = require("../controllers/tutoringEnrollment.controller");
const { verifyUser, verifyAdmin, verifyLearner } = require("../middlewares/auth");

// ======================= STUDENT ROUTES =======================
// IMPORTANT: /my-subscriptions MUST come before /:id to avoid "my-subscriptions" being parsed as an ID
router.get("/my-subscriptions", verifyUser, verifyLearner, controller.getMySubscriptions);
router.get("/:id", verifyUser, controller.getSubscriptionById);

// ======================= ADMIN ROUTES =======================
router.get("/", verifyAdmin, controller.getAllSubscriptions);
router.post("/:id/activate", verifyAdmin, controller.activateSubscription);
router.post("/:id/pause", verifyAdmin, controller.pauseSubscription);
router.post("/:id/cancel", verifyAdmin, controller.cancelSubscription);
router.post("/:id/extend", verifyAdmin, controller.extendSubscription);

module.exports = router;
