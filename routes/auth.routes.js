const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { validateSignup, validateLecturerSignup } = require("../middlewares/validation");
const { verifyUser } = require('../middlewares/auth');
const { lecturerUpload, validateCertificateSizes, profilePictureUpload } = require('../middlewares/multer');

/**
 * @swagger
 * /auth/learner/signup:
 *   post:
 *     summary: Register a new learner
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "9812345678"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-15"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: Male
 *               address:
 *                 type: string
 *                 example: Kathmandu
 *               currentLevel:
 *                 type: string
 *                 example: SEE
 *               stream:
 *                 type: string
 *                 example: Science
 *               schoolCollege:
 *                 type: string
 *                 example: ABC Higher Secondary School
 *               termsAccepted:
 *                 type: boolean
 *                 description: User accepted Terms and Conditions
 *                 example: true
 *               privacyPolicyAccepted:
 *                 type: boolean
 *                 description: User accepted Privacy Policy
 *                 example: true
 *     responses:
 *       201:
 *         description: Learner registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/learner/signup", authController.learnerSignup);

/**
 * @swagger
 * /auth/lecturer/signup:
 *   post:
 *     summary: Register a new lecturer (requires admin approval)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *               - phone
 *               - cv
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 format: password
 *               firstname:
 *                 type: string
 *                 example: Jane
 *               lastname:
 *                 type: string
 *                 example: Smith
 *               phone:
 *                 type: string
 *                 example: "9812345678"
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               address:
 *                 type: string
 *               highestEducation:
 *                 type: string
 *                 example: Masters
 *               universityCollege:
 *                 type: string
 *                 example: Tribhuvan University
 *               majorSpecialization:
 *                 type: string
 *                 example: Computer Science
 *               teachingExperience:
 *                 type: integer
 *                 example: 5
 *               employmentStatus:
 *                 type: string
 *                 example: fulltime-teacher
 *               preferredLevel:
 *                 type: string
 *                 example: plus2
 *               subjects:
 *                 type: string
 *                 description: Comma-separated list of subjects
 *                 example: Mathematics,Physics
 *               availability:
 *                 type: string
 *                 example: fulltime
 *               teachingMotivation:
 *                 type: string
 *                 example: I love teaching and want to help students succeed
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV/Resume file (PDF, DOC, DOCX)
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Educational certificates (optional)
 *               governmentIdType:
 *                 type: string
 *                 enum: [citizenship, nid, passport, driving_license]
 *                 description: Type of government-issued ID
 *                 example: citizenship
 *               governmentId:
 *                 type: string
 *                 format: binary
 *                 description: Government ID document (image or PDF, max 600KB)
 *               termsAccepted:
 *                 type: boolean
 *                 description: User accepted Terms and Conditions
 *                 example: true
 *               privacyPolicyAccepted:
 *                 type: boolean
 *                 description: User accepted Privacy Policy
 *                 example: true
 *     responses:
 *       201:
 *         description: Lecturer registration submitted for approval
 *       400:
 *         description: Validation error
 */
router.post("/lecturer/signup", lecturerUpload, validateCertificateSizes, authController.lecturerSignup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/verify-email/{id}/{code}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification code
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */
router.get("/verify-email/:id/:code", authController.verifyEmail);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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
router.get("/profile", verifyUser, authController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
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
 *               bio:
 *                 type: string
 *               highestEducation:
 *                 type: string
 *               universityCollege:
 *                 type: string
 *               majorSpecialization:
 *                 type: string
 *               teachingExperience:
 *                 type: integer
 *               expertise:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put("/profile", verifyUser, authController.updateProfile);

/**
 * @swagger
 * /auth/profile/picture:
 *   post:
 *     summary: Update profile picture
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profile_picture
 *             properties:
 *               profile_picture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (JPG, PNG, WEBP - max 600KB)
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *       400:
 *         description: No file provided or file too large
 *       401:
 *         description: Unauthorized
 */
router.post("/profile/picture", verifyUser, (req, res, next) => {
  profilePictureUpload(req, res, (err) => {
    if (err) {
      // Handle multer errors (file too large, wrong type, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          msg: 'File too large. Maximum size is 600KB.'
        });
      }
      return res.status(400).json({
        success: false,
        msg: err.message || 'Error uploading file.'
      });
    }
    next();
  });
}, authController.updateProfilePicture);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", verifyUser, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (cannot be same as old password)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid/expired token or same as old password
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated user)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or same as current password
 *       401:
 *         description: Current password is incorrect
 */
router.post("/change-password", verifyUser, authController.changePassword);

/**
 * @swagger
 * /auth/force-change-password:
 *   post:
 *     summary: Force change password after admin reset
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or force reset not required
 *       401:
 *         description: Unauthorized
 */
router.post("/force-change-password", verifyUser, authController.forceChangePassword);

/**
 * @swagger
 * /auth/lecturer/application:
 *   get:
 *     summary: Get current user's lecturer application
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lecturer application retrieved
 *       403:
 *         description: Not a lecturer applicant
 *       404:
 *         description: Application not found
 */
router.get("/lecturer/application", verifyUser, authController.getLecturerApplication);

/**
 * @swagger
 * /auth/lecturer/reapply:
 *   patch:
 *     summary: Resubmit rejected lecturer application
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv:
 *                 type: string
 *                 format: binary
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               governmentIdType:
 *                 type: string
 *                 enum: [citizenship, nid, passport, driving_license]
 *                 description: Type of government-issued ID (optional - keep existing)
 *               governmentId:
 *                 type: string
 *                 format: binary
 *                 description: Government ID document (optional - keep existing)
 *               teachingMotivation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application resubmitted successfully
 *       400:
 *         description: Cannot reapply (status not rejected)
 *       403:
 *         description: Not a lecturer applicant
 */
router.patch("/lecturer/reapply", verifyUser, lecturerUpload, validateCertificateSizes, authController.lecturerReapply);

/**
 * @swagger
 * /auth/lecturer/documents:
 *   post:
 *     summary: Upload or update lecturer documents (CV, certificates, government ID)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV/Resume file (PDF, DOC, DOCX - max 1MB)
 *               certificates:
 *                 type: string
 *                 format: binary
 *                 description: Educational certificates (PDF - max 3MB)
 *               governmentIdType:
 *                 type: string
 *                 enum: [citizenship, nid, passport, driving_license]
 *                 description: Type of government-issued ID
 *               governmentId:
 *                 type: string
 *                 format: binary
 *                 description: Government ID document (image or PDF - max 600KB)
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a lecturer
 */
router.post("/lecturer/documents", verifyUser, lecturerUpload, validateCertificateSizes, authController.updateLecturerDocuments);

module.exports = router;
