const express = require('express');
const router = express.Router();
const { verifyUser } = require('../middlewares/auth');
const announcementController = require('../controllers/announcement.controller');

// Get announcements for current user (based on their role)
router.get('/', verifyUser, announcementController.getUserAnnouncements);

// Mark announcement as read
router.patch('/:id/read', verifyUser, announcementController.markAsRead);

module.exports = router;
