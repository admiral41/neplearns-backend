const express = require('express');
const router = express.Router();
const { uploadMaterial } = require('../middleware/uploadFile');

// Unified Upload Route
router.post('/', uploadMaterial.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileName = req.file.filename;
    const link = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${fileName}`;

    return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        fileName,
        link,
    });
});

module.exports = router;
