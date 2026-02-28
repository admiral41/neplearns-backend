const router = require("express").Router();
const studentController = require("../controllers/student.controller");
const { verifyUser } = require('../middlewares/auth');

/**
 * @swagger
 * /student/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", verifyUser, studentController.getProfile);

/**
 * @swagger
 * /student/profile:
 *   put:
 *     summary: Update student profile
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               phone:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               province:
 *                 type: string
 *               currentLevel:
 *                 type: string
 *               stream:
 *                 type: string
 *               schoolCollege:
 *                 type: string
 *               fatherName:
 *                 type: string
 *               fatherPhone:
 *                 type: string
 *               motherName:
 *                 type: string
 *               motherPhone:
 *                 type: string
 *               guardianName:
 *                 type: string
 *               guardianPhone:
 *                 type: string
 *               guardianRelation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", verifyUser, studentController.updateProfile);

/**
 * @swagger
 * /student/payments:
 *   get:
 *     summary: Get student payment history
 *     tags: [Student]
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
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/payments", verifyUser, studentController.getPaymentHistory);

/**
 * @swagger
 * /student/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", verifyUser, studentController.getStats);

module.exports = router;
