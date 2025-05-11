const multer = require('multer');
const path = require('path');
const createError = require('http-errors');
const fs = require('fs');

const MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg'
};

const createUploadsFolder = (folder) => {
  const dir = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = (folder) => {
  createUploadsFolder(folder);
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, `uploads/${folder}`),
    filename: (req, file, cb) => {
      const ext = MIME_TYPES[file.mimetype];
      cb(null, `${Date.now()}-${file.originalname}.${ext}`);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const isValid = Object.keys(MIME_TYPES).includes(file.mimetype);
  isValid ? cb(null, true) : cb(createError(400, 'Invalid file type'), false);
};

const limits = { fileSize: 300 * 1024 * 1024 }; // 300MB

exports.uploadMaterial = multer({ storage: storage('materials'), fileFilter, limits });
exports.uploadAttachment = multer({ storage: storage('attachments'), fileFilter, limits });
exports.uploadCourseImage = multer({
  storage: storage('courses'),
  fileFilter: (req, file, cb) => 
    ['image/jpeg', 'image/png'].includes(file.mimetype) 
      ? cb(null, true) 
      : cb(createError(400, 'Images only!'), false),
  limits
});