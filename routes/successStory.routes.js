const express = require('express');
const router = express.Router();
const { verifyUser, verifyAdmin } = require('../middlewares/auth');
const successStoryController = require('../controllers/successStory.controller');

// ======================= PUBLIC ROUTES =======================

// Get active success stories (for homepage)
router.get('/public', successStoryController.getActiveSuccessStories);

// ======================= ADMIN ROUTES =======================

// Search users for dropdown (LEARNER/LECTURER only)
router.get('/users/search', verifyUser, verifyAdmin, successStoryController.searchUsers);

// Get all success stories (with filters)
router.get('/', verifyUser, verifyAdmin, successStoryController.getSuccessStories);

// Get single success story
router.get('/:id', verifyUser, verifyAdmin, successStoryController.getSuccessStoryById);

// Create success story
router.post('/', verifyUser, verifyAdmin, successStoryController.createSuccessStory);

// Update success story
router.put('/:id', verifyUser, verifyAdmin, successStoryController.updateSuccessStory);

// Toggle active status
router.patch('/:id/toggle-status', verifyUser, verifyAdmin, successStoryController.toggleStatus);

// Delete success story
router.delete('/:id', verifyUser, verifyAdmin, successStoryController.deleteSuccessStory);

module.exports = router;
