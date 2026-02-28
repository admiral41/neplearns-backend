const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcm.controller');
const { verifyUser } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: FCM
 *   description: Firebase Cloud Messaging token management
 */

/**
 * @swagger
 * /fcm/register:
 *   post:
 *     summary: Register FCM token for push notifications
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   device:
 *                     type: string
 *                   os:
 *                     type: string
 *                   appVersion:
 *                     type: string
 *     responses:
 *       200:
 *         description: Token registered successfully
 *       400:
 *         description: FCM token is required
 *       401:
 *         description: Unauthorized
 */
router.post('/register', verifyUser, fcmController.registerToken);

/**
 * @swagger
 * /fcm/unregister:
 *   delete:
 *     summary: Unregister FCM token (on logout)
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token unregistered successfully
 */
router.delete('/unregister', verifyUser, fcmController.unregisterToken);

/**
 * @swagger
 * /fcm/status:
 *   get:
 *     summary: Get FCM registration status
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FCM status retrieved
 */
router.get('/status', verifyUser, fcmController.getStatus);

/**
 * @swagger
 * /fcm/clear:
 *   delete:
 *     summary: Clear all FCM tokens for user
 *     tags: [FCM]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tokens cleared
 */
router.delete('/clear', verifyUser, fcmController.clearAllTokens);

module.exports = router;
