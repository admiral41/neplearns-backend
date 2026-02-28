const router = require('express').Router();
const verificationController = require('../controllers/verification.controller');

/**
 * @swagger
 * /lecturer/public:
 *   get:
 *     summary: Get all approved lecturers (Public)
 *     tags: [Lecturers]
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
 *         description: List of approved lecturers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       qualification:
 *                         type: string
 *                       experience:
 *                         type: string
 */
router.get('/public', verificationController.getAllLecturers);

/**
 * @swagger
 * /lecturer/public/{id}:
 *   get:
 *     summary: Get lecturer profile by ID (Public)
 *     tags: [Lecturers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lecturer ID
 *     responses:
 *       200:
 *         description: Lecturer profile
 *       404:
 *         description: Lecturer not found
 */
router.get('/public/:id', verificationController.getLecturerById);

module.exports = router;
