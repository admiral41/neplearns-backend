const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const announcementController = require('../controllers/announcement.controller');
const analyticsController = require('../controllers/analytics.controller');
const { verifyUser, verifyAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

// ======================= DASHBOARD =======================

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', verifyUser, verifyAdmin, adminController.getDashboardStats);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get comprehensive analytics data (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 3months, 6months, 1year]
 *           default: 6months
 *         description: Time range for analytics data
 *     responses:
 *       200:
 *         description: Analytics data including user growth, revenue, enrollments, top courses, top instructors, and category stats
 */
router.get('/analytics', verifyUser, verifyAdmin, analyticsController.getAnalytics);

// ======================= USER MANAGEMENT =======================

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, student, instructor, admin]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, suspended]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', verifyUser, verifyAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:id', verifyUser, verifyAdmin, adminController.getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user details (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put('/users/:id', verifyUser, verifyAdmin, adminController.updateUser);

/**
 * @swagger
 * /admin/users/{id}/suspend:
 *   post:
 *     summary: Suspend a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *     responses:
 *       200:
 *         description: User suspended
 *       404:
 *         description: User not found
 */
router.post('/users/:id/suspend', verifyUser, verifyAdmin, adminController.suspendUser);

/**
 * @swagger
 * /admin/users/{id}/activate:
 *   post:
 *     summary: Activate a suspended user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated
 *       404:
 *         description: User not found
 */
router.post('/users/:id/activate', verifyUser, verifyAdmin, adminController.activateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', verifyUser, verifyAdmin, adminController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/resend-verification:
 *   post:
 *     summary: Resend verification email to a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: User already verified
 *       404:
 *         description: User not found
 */
router.post('/users/:id/resend-verification', verifyUser, verifyAdmin, adminController.resendVerificationEmail);

/**
 * @swagger
 * /admin/users/{id}/reset-password:
 *   post:
 *     summary: Reset a user's password (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tempPassword:
 *                       type: string
 *                       description: Temporary password (shown if email fails)
 *                     emailSent:
 *                       type: boolean
 *                       description: Whether email was sent successfully
 *       403:
 *         description: Cannot reset admin password
 *       404:
 *         description: User not found
 */
router.post('/users/:id/reset-password', verifyUser, verifyAdmin, adminController.resetUserPassword);

// ======================= ENROLLMENTS =======================

/**
 * @swagger
 * /admin/enrollments:
 *   get:
 *     summary: Get all enrollments (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by student name, email, or course name
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped, expired]
 *         description: Filter by enrollment status
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [free, esewa, khalti, bank_transfer, cash, other]
 *         description: Filter by payment method
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter enrollments from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter enrollments until this date
 *     responses:
 *       200:
 *         description: List of enrollments with pagination and stats
 */
router.get('/enrollments', verifyUser, verifyAdmin, adminController.getAllEnrollments);

/**
 * @swagger
 * /admin/enrollments/stats:
 *   get:
 *     summary: Get enrollment statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in stats
 *     responses:
 *       200:
 *         description: Enrollment statistics
 */
router.get('/enrollments/stats', verifyUser, verifyAdmin, adminController.getEnrollmentStats);

/**
 * @swagger
 * /admin/enrollments/courses:
 *   get:
 *     summary: Get courses for enrollment filter dropdown (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses for filter
 */
router.get('/enrollments/courses', verifyUser, verifyAdmin, adminController.getCoursesForFilter);

/**
 * @swagger
 * /admin/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *       404:
 *         description: Enrollment not found
 */
router.get('/enrollments/:id', verifyUser, verifyAdmin, adminController.getEnrollmentById);

/**
 * @swagger
 * /admin/enrollments/{id}:
 *   put:
 *     summary: Update enrollment status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, completed, dropped, expired]
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Enrollment updated
 *       404:
 *         description: Enrollment not found
 */
router.put('/enrollments/:id', verifyUser, verifyAdmin, adminController.updateEnrollmentStatus);

// ======================= TUTORING METRICS =======================

/**
 * @swagger
 * /admin/tutoring-metrics:
 *   get:
 *     summary: Get tutoring metrics for dashboard (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutoring metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingRequests:
 *                   type: number
 *                 activeSubscriptions:
 *                   type: number
 *                 todaySessions:
 *                   type: number
 *                 upcomingSessions:
 *                   type: number
 */
router.get('/tutoring-metrics', verifyUser, verifyAdmin, adminController.getTutoringMetrics);

/**
 * @swagger
 * /admin/tutoring-sessions:
 *   get:
 *     summary: Get all tutoring sessions (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by student or instructor name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, scheduled, live, completed, cancelled]
 *         description: Filter by session status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           enum: [today, thisWeek, all]
 *         description: Filter by date range
 *     responses:
 *       200:
 *         description: List of tutoring sessions
 */
router.get('/tutoring-sessions', verifyUser, verifyAdmin, adminController.getAllSessions);

// ======================= PAYMENTS =======================

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user name, email, or transaction ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, completed, pending, failed]
 *         description: Filter by payment status
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [all, esewa, khalti, bank_transfer, cash, other]
 *         description: Filter by payment method
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, course, tutoring]
 *         description: Filter by payment type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date
 *     responses:
 *       200:
 *         description: List of payments with pagination
 */
router.get('/payments', verifyUser, verifyAdmin, adminController.getAllPayments);

/**
 * @swagger
 * /admin/payments/stats:
 *   get:
 *     summary: Get payment statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days]
 *           default: 7days
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Payment statistics including totals, chart data, and method breakdown
 */
router.get('/payments/stats', verifyUser, verifyAdmin, adminController.getPaymentStats);

// ======================= ANNOUNCEMENTS =======================

// Get all announcements
router.get('/announcements', verifyUser, verifyAdmin, announcementController.getAnnouncements);

// Get single announcement
router.get('/announcements/:id', verifyUser, verifyAdmin, announcementController.getAnnouncementById);

// Create announcement
router.post('/announcements', verifyUser, verifyAdmin, announcementController.createAnnouncement);

// Update announcement
router.put('/announcements/:id', verifyUser, verifyAdmin, announcementController.updateAnnouncement);

// Delete announcement
router.delete('/announcements/:id', verifyUser, verifyAdmin, announcementController.deleteAnnouncement);

module.exports = router;
