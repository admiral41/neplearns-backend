const express = require('express');
const router = express.Router();
const featureController = require('../controllers/feature.controller');
const { verifyUser, verifyAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Why Choose Us features management
 */

// ======================= PUBLIC ROUTES =======================

/**
 * @swagger
 * /features/public:
 *   get:
 *     summary: Get active features for landing page
 *     tags: [Features]
 *     responses:
 *       200:
 *         description: List of active features with section content
 */
router.get('/public', featureController.getPublicFeatures);

// ======================= ADMIN ROUTES =======================

/**
 * @swagger
 * /features:
 *   get:
 *     summary: Get all features (Admin only)
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of all features
 */
router.get('/', verifyUser, verifyAdmin, featureController.getAllFeatures);

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     summary: Get feature by ID (Admin only)
 *     tags: [Features]
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
 *         description: Feature details
 *       404:
 *         description: Feature not found
 */
router.get('/:id', verifyUser, verifyAdmin, featureController.getFeatureById);

/**
 * @swagger
 * /features:
 *   post:
 *     summary: Create a new feature (Admin only)
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               icon:
 *                 type: string
 *                 enum: [GraduationCap, Award, Video, Users, BookOpen, TrendingUp, Clock, Shield, Star, Target, Zap, Heart, CheckCircle, MessageCircle, Globe, Laptop]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               displayOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Feature created
 */
router.post('/', verifyUser, verifyAdmin, featureController.createFeature);

/**
 * @swagger
 * /features/{id}:
 *   put:
 *     summary: Update feature (Admin only)
 *     tags: [Features]
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
 *               icon:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               displayOrder:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature updated
 *       404:
 *         description: Feature not found
 */
router.put('/:id', verifyUser, verifyAdmin, featureController.updateFeature);

/**
 * @swagger
 * /features/{id}/toggle-status:
 *   patch:
 *     summary: Toggle feature active status (Admin only)
 *     tags: [Features]
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
 *         description: Status toggled
 *       404:
 *         description: Feature not found
 */
router.patch('/:id/toggle-status', verifyUser, verifyAdmin, featureController.toggleFeatureStatus);

/**
 * @swagger
 * /features/{id}:
 *   delete:
 *     summary: Delete feature (Admin only)
 *     tags: [Features]
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
 *         description: Feature deleted
 *       404:
 *         description: Feature not found
 */
router.delete('/:id', verifyUser, verifyAdmin, featureController.deleteFeature);

/**
 * @swagger
 * /features/reorder:
 *   post:
 *     summary: Reorder features (Admin only)
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureIds
 *             properties:
 *               featureIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Features reordered
 */
router.post('/reorder', verifyUser, verifyAdmin, featureController.reorderFeatures);

/**
 * @swagger
 * /features/section-content:
 *   put:
 *     summary: Update section title and subtitle (Admin only)
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Section content updated
 */
router.put('/section-content', verifyUser, verifyAdmin, featureController.updateSectionContent);

module.exports = router;
