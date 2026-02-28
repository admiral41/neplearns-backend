const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  };
};

exports.validateSignup = validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstname').notEmpty().trim().withMessage('First name is required'),
  body('lastname').notEmpty().trim().withMessage('Last name is required'),
  body('phone').notEmpty().trim().withMessage('Phone number is required'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('currentLevel').optional().trim(),
  body('stream').optional().trim(),
  body('schoolCollege').optional().trim()
]);

// middlewares/validation.js - Update the validateLecturerSignup function
exports.validateLecturerSignup = validate([
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstname').notEmpty().trim().withMessage('First name is required'),
  body('lastname').notEmpty().trim().withMessage('Last name is required'),
  body('phone').notEmpty().trim().withMessage('Phone number is required'),
  body('highestEducation').notEmpty().trim().withMessage('Highest education is required'),
  body('universityCollege').notEmpty().trim().withMessage('University/College is required'),
  
  body('teachingExperience')
    .custom((value) => {
      if (value === '' || value === undefined || value === null) return true;
      
      const num = parseInt(value);
      return !isNaN(num) && num >= 0;
    })
    .withMessage('Teaching experience must be a positive number'),
    
  body('preferredLevel').notEmpty().trim().withMessage('Preferred teaching level is required'),
  body('teachingMotivation').notEmpty().trim().withMessage('Teaching motivation is required'),
  body('subjects').optional(),
  body('availability').optional().trim(),
  body('employmentStatus').optional().trim(),
  body('majorSpecialization').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('dob').optional().isDate().withMessage('Invalid date format'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('province').optional().trim()
]);