const router = require('express').Router();
const activityLogController = require('../controllers/activityLog.controller');
const { verifyAdmin, verifyUser } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Activity logging and audit trail
 */

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Get all activity logs (Admin only)
 *     tags: [Activity Logs]
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
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [AUTH, COURSE, LESSON, WEEK, LECTURER, ADMIN, CATEGORY, LIVE_CLASS, ANNOUNCEMENT, QUIZ, OTHER]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILED, PENDING]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activity logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', verifyAdmin, activityLogController.getActivityLogs);

/**
 * @swagger
 * /activity-logs/stats:
 *   get:
 *     summary: Get activity statistics (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Activity statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', verifyAdmin, activityLogController.getActivityStats);

/**
 * @swagger
 * /activity-logs/export:
 *   get:
 *     summary: Export activity logs as CSV (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', verifyAdmin, activityLogController.exportActivityLogs);

/**
 * @swagger
 * /activity-logs/user/{userId}:
 *   get:
 *     summary: Get activity logs for a specific user (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's activity logs
 */
router.get('/user/:userId', verifyAdmin, activityLogController.getUserActivityLogs);

/**
 * @swagger
 * /activity-logs/my-activity:
 *   get:
 *     summary: Get current user's activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Current user's activity logs
 */
router.get('/my-activity', verifyUser, (req, res) => {
  req.params.userId = req.user._id;
  activityLogController.getUserActivityLogs(req, res);
});

/**
 * @swagger
 * /activity-logs/{id}:
 *   get:
 *     summary: Get activity log by ID (Admin only)
 *     tags: [Activity Logs]
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
 *         description: Activity log details
 *       404:
 *         description: Log not found
 */
router.get('/:id', verifyAdmin, activityLogController.getActivityLogById);

/**
 * @swagger
 * /activity-logs/cleanup:
 *   delete:
 *     summary: Delete old activity logs (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 90
 *                 description: Delete logs older than this many days
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.delete('/cleanup', verifyAdmin, activityLogController.cleanupOldLogs);

module.exports = router;
