const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDirs = () => {
  ['images', 'videos', 'files'].forEach(folder => {
    const dir = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
createUploadDirs();

const storage = folder => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, `../uploads/${folder}`)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const fileFilter = allowedExts => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  allowedExts.includes(ext) ? cb(null, true) : cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
};

const limits = { fileSize: 50 * 1024 * 1024 }; // 50MB

exports.uploadImage = multer({
  storage: storage('images'),
  fileFilter: fileFilter(['.jpg', '.jpeg', '.png', '.gif', '.webp']),
  limits
});

exports.uploadVideo = multer({
  storage: storage('videos'),
  fileFilter: fileFilter(['.mp4', '.webm', '.ogg', '.mov']),
  limits
});

exports.uploadFile = multer({
  storage: storage('files'),
  fileFilter: fileFilter(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip', '.rar']),
  limits
});