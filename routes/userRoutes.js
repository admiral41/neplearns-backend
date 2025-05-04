const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfile } = require('../middleware/uploadMiddleware');

router.patch('/profile',
  protect,
  uploadProfile.single('profile'),
  userController.updateProfile
);

module.exports = router;