const router = require("express").Router();
const controller = require("../controllers/newsletter.controller");
const { verifyUser, verifyAdmin } = require("../middlewares/auth");
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

/**
 * @swagger
 * /newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: subscriber@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Successfully subscribed
 *       400:
 *         description: Validation error or already subscribed
 *       429:
 *         description: Too many requests (rate limited)
 */
router.post('/subscribe', newsletterLimiter, subscribeValidation, controller.subscribeNewsletter);

/**
 * @swagger
 * /newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       404:
 *         description: Email not found
 *       429:
 *         description: Too many requests (rate limited)
 */
router.post('/unsubscribe', newsletterLimiter, unsubscribeValidation, controller.unsubscribeNewsletter);

// ======================= ADMIN/SUPERADMIN ROUTES =======================
// All routes below require authentication and admin privileges
router.use((req, res, next) => verifyUser(req, res, next));
router.use((req, res, next) => verifyAdmin(req, res, next));

/**
 * @swagger
 * /newsletter:
 *   get:
 *     summary: Get all subscribers (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of subscribers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', controller.getAllSubscribers);

/**
 * @swagger
 * /newsletter/stats:
 *   get:
 *     summary: Get newsletter statistics (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Newsletter statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSubscribers:
 *                   type: integer
 *                 activeSubscribers:
 *                   type: integer
 *                 unsubscribed:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', controller.getNewsletterStats);

/**
 * @swagger
 * /newsletter/export:
 *   get:
 *     summary: Export active subscribers (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV export of active subscribers
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/export', controller.exportActiveSubscribers);

/**
 * @swagger
 * /newsletter/{id}:
 *   get:
 *     summary: Get subscriber by ID (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber details
 *       404:
 *         description: Subscriber not found
 */
router.get('/:id', controller.getSubscriberById);

/**
 * @swagger
 * /newsletter/{id}:
 *   delete:
 *     summary: Delete a subscriber (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber deleted
 *       404:
 *         description: Subscriber not found
 */
router.delete('/:id', controller.deleteSubscriber);

module.exports = router;
