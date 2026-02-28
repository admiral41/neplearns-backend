const express = require('express');
const router = express.Router();
const { verifyUser, verifyLecturer } = require('../middlewares/auth');
const controller = require('../controllers/instructorTool.controller');

/**
 * @swagger
 * /instructor-tools:
 *   get:
 *     summary: Get all tools for the logged-in instructor
 *     tags: [Instructor Tools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tools retrieved successfully
 */
router.get('/', verifyUser, verifyLecturer, controller.getTools);

/**
 * @swagger
 * /instructor-tools:
 *   post:
 *     summary: Create a new instructor tool
 *     tags: [Instructor Tools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tool created successfully
 */
router.post('/', verifyUser, verifyLecturer, controller.createTool);

/**
 * @swagger
 * /instructor-tools/{id}:
 *   put:
 *     summary: Update an instructor tool
 *     tags: [Instructor Tools]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tool updated successfully
 */
router.put('/:id', verifyUser, verifyLecturer, controller.updateTool);

/**
 * @swagger
 * /instructor-tools/{id}:
 *   delete:
 *     summary: Soft-delete an instructor tool
 *     tags: [Instructor Tools]
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
 *         description: Tool deleted successfully
 */
router.delete('/:id', verifyUser, verifyLecturer, controller.deleteTool);

module.exports = router;
