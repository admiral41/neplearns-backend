const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|doc|docx|jpeg|jpg|png)$/i;
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPEG, JPG, PNG files are allowed'));
  }
};

// File filter with 3MB limit for certificates
const certificateFileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|jpeg|jpg|png)$/i;
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, JPG, PNG files are allowed for certificates'));
  }
};

// Default upload (5MB limit)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Government ID file filter (image or PDF only, 600KB limit)
const governmentIdFileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(pdf|jpeg|jpg|png)$/i;
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, JPG, PNG files are allowed for government ID'));
  }
};

// Lecturer application upload with 3MB limit for certificates
const lecturerUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'certificates') {
      // 3MB limit for certificates
      certificateFileFilter(req, file, cb);
    } else if (file.fieldname === 'governmentId') {
      // Government ID (image/PDF)
      governmentIdFileFilter(req, file, cb);
    } else {
      // 5MB limit for CV
      fileFilter(req, file, cb);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB default, we'll check sizes separately
  }
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
  { name: 'governmentId', maxCount: 1 }
]);

// Helper function to delete all uploaded lecturer files
const deleteAllLecturerFiles = (files) => {
  const fs = require('fs');
  if (files.cv) {
    files.cv.forEach(file => {
      try { fs.unlinkSync(file.path); } catch (e) { }
    });
  }
  if (files.certificates) {
    files.certificates.forEach(file => {
      try { fs.unlinkSync(file.path); } catch (e) { }
    });
  }
  if (files.governmentId) {
    files.governmentId.forEach(file => {
      try { fs.unlinkSync(file.path); } catch (e) { }
    });
  }
};

// Middleware to validate file sizes (CV: 1MB max, Certificates: 3MB max, Government ID: 600KB max)
const validateCertificateSizes = (req, res, next) => {
  const cvMaxSize = 1 * 1024 * 1024; // 1MB
  const certMaxSize = 3 * 1024 * 1024; // 3MB
  const govIdMaxSize = 600 * 1024; // 600KB

  // Check CV size
  if (req.files && req.files.cv && req.files.cv.length > 0) {
    const cvFile = req.files.cv[0];
    if (cvFile.size > cvMaxSize) {
      deleteAllLecturerFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'CV/Resume must be under 1MB.'
      });
    }
  }

  // Check certificate sizes
  if (req.files && req.files.certificates) {
    const oversizedFiles = req.files.certificates.filter(file => file.size > certMaxSize);

    if (oversizedFiles.length > 0) {
      deleteAllLecturerFiles(req.files);
      return res.status(400).json({
        success: false,
        message: `Each certificate must be under 3MB. ${oversizedFiles.length} file(s) exceed the limit.`
      });
    }
  }

  // Check government ID size
  if (req.files && req.files.governmentId && req.files.governmentId.length > 0) {
    const govIdFile = req.files.governmentId[0];
    if (govIdFile.size > govIdMaxSize) {
      deleteAllLecturerFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Government ID must be under 600KB.'
      });
    }
  }

  next();
};

// Profile picture upload (600KB limit, images only)
const profilePictureFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|webp)/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed for profile pictures'));
  }
};

const profilePictureUpload = multer({
  storage: storage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: 600 * 1024 // 600KB
  }
}).single('profile_picture');

// Logo upload (1MB limit, images only)
const logoFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/(jpeg|jpg|png|webp|svg\+xml)/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP, and SVG images are allowed for logo'));
  }
};

const logoUpload = multer({
  storage: storage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB
  }
}).single('logo');

// Payment proof upload (5MB limit, images only)
const paymentProofFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const extname = allowedExtensions.test(file.originalname);
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed for payment proof'));
  }
};

const paymentProofUpload = multer({
  storage: storage,
  fileFilter: paymentProofFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('paymentProof');

module.exports = upload;
module.exports.lecturerUpload = lecturerUpload;
module.exports.validateCertificateSizes = validateCertificateSizes;
module.exports.profilePictureUpload = profilePictureUpload;
module.exports.logoUpload = logoUpload;
module.exports.paymentProofUpload = paymentProofUpload;