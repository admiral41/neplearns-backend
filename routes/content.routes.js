const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer');

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image upload failed' });
  }

  const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`;

  res.status(200).json({
    link: fileUrl
  });
});

// VIDEO upload
router.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Video upload failed' });
  }

  const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`;

  res.status(200).json({
    link: fileUrl
  });
});

// FILE upload
router.post('/upload-file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File upload failed' });
  }

  const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`;

  res.status(200).json({
    link: fileUrl
  });
});

module.exports = router;
