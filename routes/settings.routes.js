const router = require("express").Router();
const settingsController = require("../controllers/settings.controller");
const { verifyUser, verifyAdmin } = require('../middlewares/auth');
const { logoUpload } = require('../middlewares/multer');

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get platform settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get("/", settingsController.getSettings);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update all settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformName:
 *                 type: string
 *               tagline:
 *                 type: string
 *               description:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               supportEmail:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *               features:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/", verifyUser, verifyAdmin, settingsController.updateAllSettings);

/**
 * @swagger
 * /settings/general:
 *   put:
 *     summary: Update general settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/general", verifyUser, verifyAdmin, settingsController.updateGeneralSettings);

/**
 * @swagger
 * /settings/contact:
 *   put:
 *     summary: Update contact settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/contact", verifyUser, verifyAdmin, settingsController.updateContactSettings);

/**
 * @swagger
 * /settings/social:
 *   put:
 *     summary: Update social media links (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/social", verifyUser, verifyAdmin, settingsController.updateSocialLinks);

/**
 * @swagger
 * /settings/features:
 *   put:
 *     summary: Update feature toggles (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/features", verifyUser, verifyAdmin, settingsController.updateFeatures);

/**
 * @swagger
 * /settings/features/{feature}/toggle:
 *   post:
 *     summary: Toggle a single feature (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feature
 *         required: true
 *         schema:
 *           type: string
 *           enum: [maintenanceMode, newRegistrations, instructorApplications, courseReviews, refundRequests]
 */
router.post("/features/:feature/toggle", verifyUser, verifyAdmin, settingsController.toggleFeature);

/**
 * @swagger
 * /settings/logo:
 *   post:
 *     summary: Upload platform logo (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPG, PNG, WEBP, SVG - max 1MB)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/logo", verifyUser, verifyAdmin, (req, res) => {
  logoUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          msg: 'Logo file must be under 1MB.'
        });
      }
      return res.status(400).json({
        success: false,
        msg: err.message || 'Error uploading logo.'
      });
    }
    settingsController.uploadLogo(req, res);
  });
});

module.exports = router;
