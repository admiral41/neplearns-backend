const router = require('express').Router();
const verificationController = require('../controllers/verification.controller');
const { verifyUser, verifyAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * /verification/lecturers/pending:
 *   get:
 *     summary: Get pending lecturer verification requests (Admin only)
 *     tags: [Verification]
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
 *     responses:
 *       200:
 *         description: List of pending lecturer requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/lecturers/pending', verifyUser, verifyAdmin, verificationController.getPendingLecturerRequests);

/**
 * @swagger
 * /verification/lecturers/{id}/process:
 *   put:
 *     summary: Approve or reject a lecturer request (Admin only)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lecturer user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if rejecting)
 *     responses:
 *       200:
 *         description: Lecturer request processed
 *       400:
 *         description: Invalid action
 *       404:
 *         description: Lecturer not found
 */
router.put('/lecturers/:id/process', verifyUser, verifyAdmin, verificationController.processLecturerRequest);

/**
 * @swagger
 * /verification/lecturers:
 *   get:
 *     summary: Get all lecturers (Admin only)
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of lecturers
 *       401:
 *         description: Unauthorized
 */
router.get('/lecturers', verifyUser, verifyAdmin, verificationController.getAllLecturers);

/**
 * @swagger
 * /verification/lecturers/{id}:
 *   get:
 *     summary: Get lecturer details by ID
 *     tags: [Verification]
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
 *         description: Lecturer details
 *       404:
 *         description: Lecturer not found
 */
router.get('/lecturers/:id', verifyUser, verificationController.getLecturerById);

module.exports = router;
