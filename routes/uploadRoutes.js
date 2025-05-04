const express = require('express');
const router = express.Router();
const { uploadMaterial } = require('../middleware/uploadMiddleware');

// Teacher role and approval check middleware
router.use((req, res, next) => {
    if (req.user.role !== 'Teacher' || !req.user.isApproved) {
        return res.status(403).json({ message: 'Teacher access required' });
    }
    next();
});

// Image Upload
// Update the response links
router.post('/image', uploadMaterial.single('picture'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload failed' });
    const link = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/materials/${req.file.filename}`;
    res.json({ link });
});


// Video Upload
router.post('/video', uploadMaterial.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload failed' });
    const link = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/materials/${req.file.filename}`;
    res.json({ link });
});

// File Upload
router.post('/file', uploadMaterial.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload failed' });
    const link = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/materials/${req.file.filename}`;
    res.json({ link });
});

module.exports = router;