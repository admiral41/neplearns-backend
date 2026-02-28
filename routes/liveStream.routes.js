const express = require('express');
const router = express.Router();
const livestreamController = require('../controllers/livestream.controller');
const { verifyUser, verifyRole, checkAuth } = require('../middlewares/auth');

// Public routes (with optional auth)
router.get('/', checkAuth, livestreamController.getAllLivestreams);
router.get('/:slug', checkAuth, livestreamController.getLivestreamDetails);

// Protected routes - require authentication
router.use(verifyUser);

// Create livestream - Only lecturers and admins
router.post(
  '/', 
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), 
  livestreamController.createLivestream
);

// Join livestream - Any authenticated user (access control happens in controller)
router.post('/:slug/join', livestreamController.joinLivestream);

// Leave livestream - Any authenticated user
router.post('/:slug/leave', livestreamController.leaveLivestream);

// Start livestream - Only lecturers and admins
router.post(
  '/:slug/start', 
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), 
  livestreamController.startLivestream
);

// End livestream - Only lecturers and admins
router.post(
  '/:slug/end', 
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), 
  livestreamController.endLivestream
);

// Update livestream - Only creator, assigned lecturers, or admins
router.put(
  '/:slug', 
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), 
  livestreamController.updateLivestream
);

// Delete/Cancel livestream - Only creator or admins
router.delete(
  '/:slug', 
  verifyRole(['LECTURER', 'ADMIN', 'SUPERADMIN']), 
  livestreamController.deleteLivestream
);

module.exports = router;