const router = require('express').Router();
const controller = require('../controllers/tutoringPayment.controller');
const { verifyUser, verifyAdmin, verifyLearner } = require('../middlewares/auth');
const { paymentProofUpload } = require('../middlewares/multer');

// Admin routes (must come first to avoid route conflicts)
// GET /tutoring-payments - Get all pending payments (admin)
router.get('/', verifyAdmin, controller.getPendingPayments);

// POST /tutoring-payments/:id/verify - Verify a payment (admin)
router.post('/:id/verify', verifyAdmin, controller.verifyPayment);

// Student routes
// POST /tutoring-payments - Submit payment proof (student)
router.post('/', verifyUser, verifyLearner, paymentProofUpload, controller.submitPayment);

// GET /tutoring-payments/enrollment/:enrollmentId - Get payment history (student/admin)
router.get('/enrollment/:enrollmentId', verifyUser, controller.getPaymentHistory);

// GET /tutoring-payments/:id - Get single payment (student/admin)
router.get('/:id', verifyUser, controller.getPaymentById);

module.exports = router;
