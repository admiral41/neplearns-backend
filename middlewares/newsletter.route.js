const router = require("express").Router();
const controller = require("../controllers/newsletter.controller");
const { verifyToken, isAdminOrSuperAdmin } = require("../middlewares/auth");
const { newsletterLimiter } = require("../middlewares/rateLimiter.middleware");
const { body } = require("express-validator");

// Validation rules for subscribing to newsletter
const subscribeValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .escape() // XSS protection
];

// Validation rules for unsubscribing
const unsubscribeValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail()
];

// ======================= PUBLIC ROUTES =======================
// Subscribe to newsletter (no authentication required)
router.post('/subscribe', newsletterLimiter, subscribeValidation, controller.subscribeNewsletter);

// Unsubscribe from newsletter (no authentication required)
router.post('/unsubscribe', newsletterLimiter, unsubscribeValidation, controller.unsubscribeNewsletter);

// ======================= ADMIN/SUPERADMIN ROUTES =======================
// All routes below require authentication and admin privileges
router.use(verifyToken, isAdminOrSuperAdmin);

// Get all subscribers with filters and pagination
router.get('/', controller.getAllSubscribers);

// Get newsletter statistics
router.get('/stats', controller.getNewsletterStats);

// Export active subscribers
router.get('/export', controller.exportActiveSubscribers);

// Get single subscriber by ID
router.get('/:id', controller.getSubscriberById);

// Delete subscriber
router.delete('/:id', controller.deleteSubscriber);

module.exports = router;
