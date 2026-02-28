const router = require("express").Router();
const controller = require("../controllers/enquiry.controller");
const { verifyUser, verifyAdmin } = require("../middlewares/auth");
const { enquiryLimiter } = require("../middlewares/rateLimiter.middleware");
const { body } = require("express-validator");

// Validation rules for creating an enquiry
const createEnquiryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(), // XSS protection

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

  body('level')
    .notEmpty().withMessage('Current level is required')
    .isIn(['see', 'plus2-science', 'plus2-management', 'plus2-humanities', 'other'])
    .withMessage('Invalid level selected'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message must not exceed 1000 characters')
    .escape() // XSS protection
];

// Validation rules for updating enquiry status
const updateEnquiryValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'contacted', 'resolved', 'rejected'])
    .withMessage('Invalid status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Notes must not exceed 2000 characters')
    .escape(), // XSS protection

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID')
];

// ======================= PUBLIC ROUTES =======================

/**
 * @swagger
 * /enquiry:
 *   post:
 *     summary: Submit a new enquiry
 *     tags: [Enquiry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Ram Sharma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ram@example.com
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *                 example: '9841234567'
 *               level:
 *                 type: string
 *                 enum: [see, plus2-science, plus2-management, plus2-humanities, other]
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Enquiry submitted successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests (rate limited)
 */
router.post('/', enquiryLimiter, createEnquiryValidation, controller.createEnquiry);

// ======================= ADMIN/SUPERADMIN ROUTES =======================
// All routes below require authentication and admin privileges
router.use((req, res, next) => verifyUser(req, res, next));
router.use((req, res, next) => verifyAdmin(req, res, next));

/**
 * @swagger
 * /enquiry:
 *   get:
 *     summary: Get all enquiries (Admin only)
 *     tags: [Enquiry]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, contacted, resolved, rejected]
 *     responses:
 *       200:
 *         description: List of enquiries
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', controller.getAllEnquiries);

/**
 * @swagger
 * /enquiry/stats:
 *   get:
 *     summary: Get enquiry statistics (Admin only)
 *     tags: [Enquiry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enquiry statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 pending:
 *                   type: integer
 *                 contacted:
 *                   type: integer
 *                 resolved:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', controller.getEnquiryStats);

/**
 * @swagger
 * /enquiry/{id}:
 *   get:
 *     summary: Get single enquiry by ID (Admin only)
 *     tags: [Enquiry]
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
 *         description: Enquiry details
 *       404:
 *         description: Enquiry not found
 */
router.get('/:id', controller.getEnquiryById);

/**
 * @swagger
 * /enquiry/{id}:
 *   patch:
 *     summary: Update enquiry status/notes (Admin only)
 *     tags: [Enquiry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, contacted, resolved, rejected]
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign
 *     responses:
 *       200:
 *         description: Enquiry updated
 *       404:
 *         description: Enquiry not found
 */
router.patch('/:id', updateEnquiryValidation, controller.updateEnquiryStatus);

/**
 * @swagger
 * /enquiry/{id}:
 *   delete:
 *     summary: Delete an enquiry (Admin only)
 *     tags: [Enquiry]
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
 *         description: Enquiry deleted
 *       404:
 *         description: Enquiry not found
 */
router.delete('/:id', controller.deleteEnquiry);

module.exports = router;
