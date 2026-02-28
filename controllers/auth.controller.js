const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");
const httpStatus = require("http-status");
const helper = require("../helpers/mailer");
const { generator, responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const { generateRandomNum } = generator;
const { validationResult } = require("express-validator");
const upload = require('../middlewares/multer');
const notificationService = require('../services/notificationService');
const { forceLogoutUser } = require('../socket/socketManager');
const { logAuth, logLecturer } = require('../helpers/activityLogger');

// ======================= LEARNER SIGNUP =======================
exports.learnerSignup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: errors.array()[0].msg
      });
    }

    const {
      email,
      password,
      firstname,
      lastname,
      phone,
      dob,
      gender,
      address,
      city,
      province,
      currentLevel,
      stream,
      schoolCollege,
      termsAccepted,
      privacyPolicyAccepted
    } = req.body;

    // Check if user exists
    let userExists = await User.findOne({ email });
    if (userExists) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: "Email already registered"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const verificationCode = generateRandomNum(100000, 999999);

    // Create learner user
    const now = new Date();
    const user = await User.create({
      email,
      firstname,
      lastname,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      address,
      city,
      province,
      currentLevel,
      stream,
      schoolCollege,
      hash,
      salt,
      verificationCode,
      roles: ['LEARNER'],
      isVerified: false,
      termsAcceptedAt: termsAccepted ? now : null,
      privacyPolicyAcceptedAt: privacyPolicyAccepted ? now : null
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URI}/verify-email/${user._id}/${verificationCode}`;
    try {
      await helper.sendVerificationMail({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        link: verificationLink
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // Generate token
    const token = await generateToken(user._id);

    // Notify admins about new learner registration (real-time + push)
    try {
      await notificationService.notifyNewLearnerRegistration(user);
    } catch (notifyError) {
      console.error('Failed to send registration notification:', notifyError);
    }

    const { hash: _, salt: __, verificationCode: ___, ...responseBody } = user.toJSON();

    // Log registration
    logAuth.register(req, user, 'STUDENT');

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg: "Learner registration successful. Please verify your email.",
      data: responseBody,
      token
    });

  } catch (err) {
    console.error('Learner signup error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to register learner.",
      err: err.message
    });
  }
};

// ======================= LECTURER SIGNUP =======================
// exports.lecturerSignup = async (req, res) => {
//   const uploadFile = upload.any();

//   uploadFile(req, res, async (err) => {
//     try {
//       if (err) {
//         return sendErrorResponse({
//           res,
//           status: httpStatus.BAD_REQUEST,
//           msg: "File upload failed: " + err.message
//         });
//       }

//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return sendErrorResponse({
//           res,
//           status: httpStatus.BAD_REQUEST,
//           msg: errors.array()[0].msg
//         });
//       }

//       const {
//         email,
//         password,
//         firstname,
//         lastname,
//         phone,
//         dob,
//         gender,
//         address,
//         city,
//         province,
//         highestEducation,
//         universityCollege,
//         majorSpecialization,
//         teachingExperience,
//         employmentStatus,
//         preferredLevel,
//         subjects,
//         availability,
//         teachingMotivation,
//         termsAccepted,
//         privacyPolicyAccepted
//       } = req.body;

//       // Check if user exists
//       let userExists = await User.findOne({ email });
//       if (userExists) {
//         return sendErrorResponse({
//           res,
//           status: httpStatus.CONFLICT,
//           msg: "Email already registered"
//         });
//       }

//       // Parse subjects if it's a string
//       let subjectsArray = [];
//       if (subjects) {
//         if (typeof subjects === 'string') {
//           subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
//         } else if (Array.isArray(subjects)) {
//           subjectsArray = subjects;
//         }
//       }

//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const hash = await bcrypt.hash(password, salt);
//       const verificationCode = generateRandomNum(100000, 999999);

//       // Create lecturer user with LECTURER role (but pending approval)
//       const now = new Date();
//       const user = await User.create({
//         email,
//         firstname,
//         lastname,
//         phone,
//         dob: dob ? new Date(dob) : null,
//         gender,
//         address,
//         city,
//         province,
//         highestEducation,
//         universityCollege,
//         majorSpecialization,
//         teachingExperience: parseInt(teachingExperience) || 0,
//         employmentStatus,
//         preferredLevel,
//         subjects: subjectsArray,
//         availability,
//         teachingMotivation,
//         hash,
//         salt,
//         verificationCode,
//         roles: ['LECTURER'], // LECTURER role - but pending approval via Lecturer model
//         isLecturerApplicant: true,
//         isVerified: false,
//         termsAcceptedAt: termsAccepted ? now : null,
//         privacyPolicyAcceptedAt: privacyPolicyAccepted ? now : null
//       });

//       // Handle file uploads (using multer fields)
//       let cvPath = '';
//       let certificates = [];

//       if (req.files) {
//         if (req.files.cv && req.files.cv.length > 0) {
//           cvPath = req.files.cv[0].path;
//         }
//         if (req.files.certificates && req.files.certificates.length > 0) {
//           certificates = req.files.certificates.map(file => file.path);
//         }
//       }

//       if (!cvPath) {
//         // Rollback user creation if CV is missing
//         await User.findByIdAndDelete(user._id);
//         return sendErrorResponse({
//           res,
//           status: httpStatus.BAD_REQUEST,
//           msg: "CV file is required"
//         });
//       }

//       // Create lecturer request
//       const lecturerRequest = await Lecturer.create({
//         user: user._id,
//         cv: cvPath,
//         certificates: certificates,
//         requestStatus: 'pending'
//       });

//       // Send verification email
//       const verificationLink = `${process.env.FRONTEND_URI}/verify-email/${user._id}/${verificationCode}`;
//       try {
//         await helper.sendVerificationMail({
//           email: user.email,
//           firstname: user.firstname,
//           lastname: user.lastname,
//           link: verificationLink
//         });
//       } catch (emailError) {
//         console.error('Failed to send verification email:', emailError);
//       }

//       // Notify admin about new lecturer request (email)
//       try {
//         await notifyAdminAboutLecturerRequest(user, lecturerRequest);
//       } catch (notifyError) {
//         console.error('Failed to notify admin via email:', notifyError);
//       }

//       // Notify admins via real-time + push notifications
//       try {
//         await notificationService.notifyNewLecturerApplication(user, lecturerRequest);
//       } catch (notifyError) {
//         console.error('Failed to send real-time notification:', notifyError);
//       }

//       // Generate token (they can login as learner while waiting for approval)
//       const token = await generateToken(user._id);

//       const { hash: _, salt: __, verificationCode: ___, ...responseBody } = user.toJSON();

//       // Log lecturer application
//       logAuth.register(req, user, 'LECTURER');
//       logLecturer.applied(req, user);

//       return sendSuccessResponse({
//         res,
//         status: httpStatus.CREATED,
//         msg: "Lecturer registration submitted. Please verify your email. Your application is pending admin approval. You can login as a learner in the meantime.",
//         data: {
//           user: responseBody,
//           lecturerRequest: {
//             id: lecturerRequest._id,
//             requestStatus: lecturerRequest.requestStatus
//           }
//         },
//         token
//       });

//     } catch (err) {
//       console.error('Lecturer signup error:', err);
//       return sendErrorResponse({
//         res,
//         status: httpStatus.INTERNAL_SERVER_ERROR,
//         msg: "Failed to register as lecturer.",
//         err: err.message
//       });
//     }
//   });
// };
exports.lecturerSignup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: errors.array()[0].msg
      });
    }

    const {
      email,
      password,
      firstname,
      lastname,
      phone,
      dob,
      gender,
      address,
      city,
      province,
      highestEducation,
      universityCollege,
      majorSpecialization,
      teachingExperience,
      employmentStatus,
      preferredLevel,
      subjects,
      availability,
      teachingMotivation,
      termsAccepted,
      privacyPolicyAccepted,
      governmentIdType
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendErrorResponse({
        res,
        status: httpStatus.CONFLICT,
        msg: "Email already registered"
      });
    }

    let subjectsArray = [];
    if (subjects) {
      if (typeof subjects === "string") {
        subjectsArray = subjects
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(subjects)) {
        subjectsArray = subjects;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const verificationCode = generateRandomNum(100000, 999999);
    const now = new Date();

    const user = await User.create({
      email,
      firstname,
      lastname,
      phone,
      dob: dob ? new Date(dob) : null,
      gender,
      address,
      city,
      province,
      highestEducation,
      universityCollege,
      majorSpecialization,
      teachingExperience: parseInt(teachingExperience) || 0,
      employmentStatus,
      preferredLevel,
      subjects: subjectsArray,
      availability,
      teachingMotivation,
      hash,
      salt,
      verificationCode,
      roles: ["LECTURER"],
      isLecturerApplicant: true,
      isVerified: false,
      termsAcceptedAt: termsAccepted ? now : null,
      privacyPolicyAcceptedAt: privacyPolicyAccepted ? now : null
    });

    // Helper to delete uploaded files on failure
    const deleteUploadedFiles = () => {
      const fs = require('fs');
      if (req.files?.cv) {
        req.files.cv.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
      }
      if (req.files?.certificates) {
        req.files.certificates.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
      }
      if (req.files?.governmentId) {
        req.files.governmentId.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
      }
    };

    let cvPath = "";
    let certificates = [];
    let governmentIdPath = "";

    if (req.files?.cv?.length) {
      cvPath = req.files.cv[0].path;
    }

    if (req.files?.certificates?.length) {
      certificates = req.files.certificates.map(file => file.path);
    }

    if (req.files?.governmentId?.length) {
      governmentIdPath = req.files.governmentId[0].path;
    }

    // Validate government ID type if provided
    const validIdTypes = ['citizenship', 'nid', 'passport', 'driving_license'];
    const finalGovernmentIdType = (governmentIdType && validIdTypes.includes(governmentIdType))
      ? governmentIdType
      : null;

    const lecturerRequest = await Lecturer.create({
      user: user._id,
      cv: cvPath || null,
      certificates,
      governmentIdType: finalGovernmentIdType,
      governmentId: governmentIdPath || null,
      requestStatus: "pending"
    });


    const verificationLink = `${process.env.FRONTEND_URI}/verify-email/${user._id}/${verificationCode}`;
    try {
      await helper.sendVerificationMail({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        link: verificationLink
      });
    } catch (err) {
      console.error("Verification email failed:", err);
    }

    try {
      await notifyAdminAboutLecturerRequest(user, lecturerRequest);
    } catch (err) {
      console.error("Admin email failed:", err);
    }

    try {
      await notificationService.notifyNewLecturerApplication(
        user,
        lecturerRequest
      );
    } catch (err) {
      console.error("Admin notification failed:", err);
    }

    const token = await generateToken(user._id);

    const {
      hash: _,
      salt: __,
      verificationCode: ___,
      ...safeUser
    } = user.toJSON();

    logAuth.register(req, user, "LECTURER");
    logLecturer.applied(req, user);

    return sendSuccessResponse({
      res,
      status: httpStatus.CREATED,
      msg:
        "Lecturer registration submitted. Please verify your email. Your application is pending admin approval.",
      data: {
        user: safeUser,
        lecturerRequest: {
          id: lecturerRequest._id,
          requestStatus: lecturerRequest.requestStatus
        }
      },
      token
    });

  } catch (err) {
    console.error("Lecturer signup error:", err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to register as lecturer",
      err: err.message
    });
  }
};


// ======================= LOGIN (UPDATED FOR LECTURER APPLICANTS) =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Email and password are required."
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Invalid email or password."
      });
    }

    // Check if suspended
    if (user.isSuspended) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Account is suspended. Contact administrator."
      });
    }

    // Check email verification
    if (!user.isVerified) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Please verify your email first."
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.hash);
    if (!validPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Invalid email or password."
      });
    }

    // SINGLE SESSION ENFORCEMENT
    // Force logout any existing sessions before creating new one
    const userIdStr = user._id.toString();
    forceLogoutUser(userIdStr, 'logged_in_elsewhere', {
      newDevice: req.headers['user-agent'] || 'Unknown device'
    });

    // Increment token version (invalidates all previous tokens)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.lastLoginAt = new Date();
    user.lastLoginDevice = req.headers['user-agent'] || 'Unknown device';
    await user.save();

    // Generate token with new tokenVersion
    const token = await generateToken(user._id, user.tokenVersion);

    // Remove sensitive data
    const { hash, salt, verificationCode, ...responseBody } = user.toJSON();

    // Check lecturer status for users with LECTURER role
    if (user.roles.includes('LECTURER')) {
      const lecturerRecord = await Lecturer.findOne({ user: user._id });

      if (lecturerRecord) {
        responseBody.lecturerStatus = lecturerRecord.requestStatus; // 'pending', 'approved', or 'rejected'
        if (lecturerRecord.requestStatus === 'approved') {
          responseBody.lecturerProfile = lecturerRecord;
        }
      } else {
        // Edge case: has LECTURER role but no Lecturer record
        responseBody.lecturerStatus = 'pending';
      }
    }

    // Log successful login
    logAuth.login(req, user, true);

    // Add forcePasswordReset flag to response
    responseBody.forcePasswordReset = user.forcePasswordReset || false;

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Login successful.",
      data: responseBody,
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    // Log failed login attempt
    logAuth.login(req, { email: req.body?.email }, false);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Login failed.",
      err: err.message
    });
  }
};

// ======================= VERIFY EMAIL =======================
exports.verifyEmail = async (req, res) => {
  try {
    const { id, code } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    if (user.isVerified) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Email already verified."
      });
    }

    if (!user.verificationCode || user.verificationCode.toString() !== code.toString()) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Invalid verification code."
      });
    }

    user.isVerified = true;
    await user.save();

    // If this is a lecturer applicant, notify admin again
    if (user.isLecturerApplicant) {
      const lecturerRequest = await Lecturer.findOne({ user: user._id });
      if (lecturerRequest && lecturerRequest.requestStatus === 'pending') {
        try {
          await notifyAdminAboutLecturerRequest(user, lecturerRequest);
        } catch (notifyError) {
          console.error('Failed to notify admin after verification:', notifyError);
        }
      }
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Email verified successfully. You can now login."
    });

  } catch (err) {
    console.error('Email verification error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Email verification failed.",
      err: err.message
    });
  }
};

// ======================= GET PROFILE =======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-hash -salt -verificationCode -__v')
      .lean();

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Check lecturer status
    if (user.roles.includes('LECTURER')) {
      const lecturerProfile = await Lecturer.findOne({
        user: user._id,
        requestStatus: 'approved'
      }).lean();

      if (lecturerProfile) {
        user.lecturerProfile = lecturerProfile;
        user.lecturerStatus = 'approved';
      }
    } else if (user.isLecturerApplicant) {
      const lecturerRequest = await Lecturer.findOne({ user: user._id }).lean();
      user.lecturerStatus = lecturerRequest ? lecturerRequest.requestStatus : 'not_applied';
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: user,
      msg: "Profile retrieved successfully."
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get profile.",
      err: err.message
    });
  }
};

// ======================= UPDATE PROFILE =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      // Common fields
      firstname,
      lastname,
      phone,
      dob,
      gender,
      address,
      city,
      province,
      bio,
      // Instructor-specific fields
      highestEducation,
      universityCollege,
      majorSpecialization,
      teachingExperience,
      employmentStatus,
      preferredLevel,
      subjects,
      availability,
      teachingMotivation,
      expertise,
      // Social links (future use)
      socialLinks
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Update common fields if provided
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (phone) user.phone = phone;
    if (dob) user.dob = new Date(dob);
    if (gender) user.gender = gender;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (province !== undefined) user.province = province;

    // Store bio in teachingMotivation for instructors
    if (bio !== undefined) user.teachingMotivation = bio;

    // Update instructor-specific fields if user is a lecturer
    if (user.roles.includes('LECTURER') || user.isLecturerApplicant) {
      if (highestEducation) user.highestEducation = highestEducation;
      if (universityCollege !== undefined) user.universityCollege = universityCollege;
      if (majorSpecialization !== undefined) user.majorSpecialization = majorSpecialization;
      if (expertise !== undefined) user.majorSpecialization = expertise;
      if (teachingExperience !== undefined) user.teachingExperience = parseInt(teachingExperience, 10) || 0;
      if (employmentStatus) user.employmentStatus = employmentStatus;
      if (preferredLevel) user.preferredLevel = preferredLevel;
      if (subjects && Array.isArray(subjects)) user.subjects = subjects;
      if (availability) user.availability = availability;
      if (teachingMotivation !== undefined) user.teachingMotivation = teachingMotivation;
    }

    // Update social links
    if (socialLinks) {
      if (socialLinks.linkedin !== undefined) user.linkedin = socialLinks.linkedin;
      if (socialLinks.twitter !== undefined) user.twitter = socialLinks.twitter;
      if (socialLinks.website !== undefined) user.website = socialLinks.website;
    }

    await user.save();

    // Get the updated user without sensitive fields
    const updatedUser = await User.findById(userId)
      .select('-hash -salt -verificationCode -resetPasswordToken -resetPasswordExpires -__v')
      .lean();

    // Add lecturer status if applicable
    if (updatedUser.roles.includes('LECTURER')) {
      const lecturerProfile = await Lecturer.findOne({
        user: updatedUser._id,
        requestStatus: 'approved'
      }).lean();

      if (lecturerProfile) {
        updatedUser.lecturerProfile = lecturerProfile;
        updatedUser.lecturerStatus = 'approved';
      }
    } else if (updatedUser.isLecturerApplicant) {
      const lecturerRequest = await Lecturer.findOne({ user: updatedUser._id }).lean();
      updatedUser.lecturerStatus = lecturerRequest ? lecturerRequest.requestStatus : 'not_applied';
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { user: updatedUser },
      msg: "Profile updated successfully."
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update profile.",
      err: err.message
    });
  }
};

// ======================= UPDATE PROFILE PICTURE =======================
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "No image file provided."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      // Delete uploaded file if user not found
      const fs = require('fs');
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Delete old profile picture if exists
    if (user.userImage) {
      const fs = require('fs');
      const oldPath = user.userImage;
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('Failed to delete old profile picture:', e);
        }
      }
    }

    // Update user with new profile picture path
    user.userImage = req.file.path;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        userImage: req.file.path,
        profile_picture_url: req.file.path
      },
      msg: "Profile picture updated successfully."
    });
  } catch (err) {
    console.error('Update profile picture error:', err);
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file:', e);
      }
    }
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to update profile picture.",
      err: err.message
    });
  }
};

// ======================= FORGOT PASSWORD =======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Email is required."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Generate reset token
    const resetToken = generateRandomNum(100000, 999999);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URI}/reset-password/${resetToken}`;

    try {
      await helper.sendPasswordResetMail({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        link: resetLink
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "If an account exists with this email, you will receive a password reset link."
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to process password reset.",
      err: err.message
    });
  }
};

// ======================= RESET PASSWORD =======================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Token and new password are required."
      });
    }

    // Convert token to number (stored as number in DB)
    const numericToken = parseInt(token, 10);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: numericToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Invalid or expired reset token."
      });
    }

    // Check that new password is not the same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.hash);
    if (isSamePassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password cannot be the same as your old password."
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token
    user.hash = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Password has been reset successfully."
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to reset password.",
      err: err.message
    });
  }
};

// ======================= CHANGE PASSWORD (AUTHENTICATED) =======================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Current password, new password, and confirm password are required."
      });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password and confirm password do not match."
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Password must be at least 8 characters long."
      });
    }

    // Check for at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      });
    }

    // Find user with hash field
    const user = await User.findById(userId).select('+hash');
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hash);
    if (!isCurrentPasswordValid) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Current password is incorrect."
      });
    }

    // Check that new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.hash);
    if (isSamePassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password cannot be the same as your current password."
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.hash = hash;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Password changed successfully."
    });
  } catch (err) {
    console.error('Change password error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to change password.",
      err: err.message
    });
  }
};

// ======================= FORCE CHANGE PASSWORD (AFTER ADMIN RESET) =======================
exports.forceChangePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!newPassword || !confirmPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password and confirm password are required."
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password and confirm password do not match."
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number."
      });
    }

    // Find user
    const user = await User.findById(userId).select('+hash');
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Verify that forcePasswordReset flag is set (this endpoint is only for admin-reset passwords)
    if (!user.forcePasswordReset) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Password change not required. Use regular change password instead."
      });
    }

    // Check that new password is different from current (temp) password
    const isSameAsTemp = await bcrypt.compare(newPassword, user.hash);
    if (isSameAsTemp) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "New password cannot be the same as the temporary password. Please choose a different password."
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update user: set new password, clear forcePasswordReset flag
    user.hash = hash;
    user.salt = salt;
    user.forcePasswordReset = false;
    await user.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Password changed successfully. You can now access your account."
    });

  } catch (err) {
    console.error('Force change password error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to change password.",
      err: err.message
    });
  }
};

// ======================= REFRESH TOKEN =======================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendErrorResponse({
        res,
        status: httpStatus.BAD_REQUEST,
        msg: "Refresh token is required."
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || process.env.SESSION_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Invalid refresh token."
      });
    }

    // Generate new access token with the user's current tokenVersion
    const newTokens = await generateToken(user._id, user.tokenVersion || 0);

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: { accessToken: newTokens.token, refreshToken: newTokens.refreshToken },
      msg: "Token refreshed successfully."
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.UNAUTHORIZED,
      msg: "Invalid or expired refresh token."
    });
  }
};

// ======================= HELPER FUNCTIONS =======================
const generateToken = async (userId, tokenVersion = 0) => {
  const payload = {
    userId,
    tokenVersion, // Include for single-session enforcement
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_SECRET || process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
};

const notifyAdminAboutLecturerRequest = async (user, lecturerRequest) => {
  try {
    // Find all admin users
    const admins = await User.find({
      roles: { $in: ['ADMIN', 'SUPERADMIN'] }
    });

    // Send email notification to each admin
    for (const admin of admins) {
      try {
        await helper.sendLecturerRequestNotification({
          adminEmail: admin.email,
          adminName: `${admin.firstname} ${admin.lastname}`,
          applicantName: `${user.firstname} ${user.lastname}`,
          applicantEmail: user.email,
          applicationId: lecturerRequest._id,
          dashboardLink: `${process.env.ADMIN_DASHBOARD_URI || process.env.FRONTEND_URI}/admin-dashboard/applications`
        });
      } catch (emailError) {
        console.error(`Failed to send notification to admin ${admin.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Failed to notify admin:', error);
    throw error;
  }
};

// NEW: Send approval email to lecturer
const sendLecturerApprovalEmail = async (user) => {
  try {
    await helper.sendLecturerApprovalMail({
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      loginLink: `${process.env.FRONTEND_URI}/login`,
      dashboardLink: `${process.env.FRONTEND_URI}/instructor-dashboard`
    });
  } catch (error) {
    console.error('Failed to send lecturer approval email:', error);
    throw error;
  }
};

// NEW: Send rejection email to lecturer
const sendLecturerRejectionEmail = async (user, reason = '') => {
  try {
    await helper.sendLecturerRejectionMail({
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      reason: reason
    });
  } catch (error) {
    console.error('Failed to send lecturer rejection email:', error);
    throw error;
  }
};

// ======================= GET LECTURER APPLICATION =======================
exports.getLecturerApplication = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-hash -salt -verificationCode -__v')
      .lean();

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Check if user is a lecturer applicant
    if (!user.roles.includes('LECTURER')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Not a lecturer applicant."
      });
    }

    // Get lecturer application record
    const lecturerRecord = await Lecturer.findOne({ user: user._id }).lean();

    if (!lecturerRecord) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "Lecturer application not found."
      });
    }

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      data: {
        user,
        lecturerApplication: lecturerRecord
      },
      msg: "Lecturer application retrieved successfully."
    });
  } catch (err) {
    console.error('Get lecturer application error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to get lecturer application.",
      err: err.message
    });
  }
};

// ======================= LECTURER REAPPLY =======================
exports.lecturerReapply = async (req, res) => {
  const uploadFile = upload.any();

  uploadFile(req, res, async (err) => {
    try {
      if (err) {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: "File upload failed: " + err.message
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return sendErrorResponse({
          res,
          status: httpStatus.NOT_FOUND,
          msg: "User not found."
        });
      }

      // Check if user is a lecturer
      if (!user.roles.includes('LECTURER')) {
        return sendErrorResponse({
          res,
          status: httpStatus.FORBIDDEN,
          msg: "Not a lecturer applicant."
        });
      }

      // Get lecturer record
      const lecturerRecord = await Lecturer.findOne({ user: user._id });

      if (!lecturerRecord) {
        return sendErrorResponse({
          res,
          status: httpStatus.NOT_FOUND,
          msg: "Lecturer application not found."
        });
      }

      // Check if status is rejected (only rejected users can reapply)
      if (lecturerRecord.requestStatus !== 'rejected') {
        return sendErrorResponse({
          res,
          status: httpStatus.BAD_REQUEST,
          msg: `Cannot reapply. Current status is: ${lecturerRecord.requestStatus}`
        });
      }

      const {
        phone,
        dob,
        gender,
        address,
        city,
        province,
        highestEducation,
        universityCollege,
        majorSpecialization,
        teachingExperience,
        employmentStatus,
        preferredLevel,
        subjects,
        availability,
        teachingMotivation,
        governmentIdType
      } = req.body;

      // Parse subjects if it's a string
      let subjectsArray = [];
      if (subjects) {
        if (typeof subjects === 'string') {
          subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (Array.isArray(subjects)) {
          subjectsArray = subjects;
        }
      }

      // Update user fields
      if (phone) user.phone = phone;
      if (dob) user.dob = new Date(dob);
      if (gender) user.gender = gender;
      if (address) user.address = address;
      if (city) user.city = city;
      if (province) user.province = province;
      if (highestEducation) user.highestEducation = highestEducation;
      if (universityCollege) user.universityCollege = universityCollege;
      if (majorSpecialization) user.majorSpecialization = majorSpecialization;
      if (teachingExperience !== undefined) user.teachingExperience = parseInt(teachingExperience) || 0;
      if (employmentStatus) user.employmentStatus = employmentStatus;
      if (preferredLevel) user.preferredLevel = preferredLevel;
      if (subjectsArray.length > 0) user.subjects = subjectsArray;
      if (availability) user.availability = availability;
      if (teachingMotivation) user.teachingMotivation = teachingMotivation;

      await user.save();

      // Handle file uploads (using multer fields)
      let newCvPath = lecturerRecord.cv; // Keep existing if no new upload
      let newCertificates = lecturerRecord.certificates || [];
      let newGovernmentIdPath = lecturerRecord.governmentId; // Keep existing if no new upload
      let newGovernmentIdType = lecturerRecord.governmentIdType;

      if (req.files) {
        if (req.files.cv && req.files.cv.length > 0) {
          newCvPath = req.files.cv[0].path;
        }
        if (req.files.certificates && req.files.certificates.length > 0) {
          newCertificates = [...newCertificates, ...req.files.certificates.map(file => file.path)];
        }
        if (req.files.governmentId && req.files.governmentId.length > 0) {
          newGovernmentIdPath = req.files.governmentId[0].path;
        }
      }

      // Update government ID type if provided
      if (governmentIdType) {
        const validIdTypes = ['citizenship', 'nid', 'passport', 'driving_license'];
        if (validIdTypes.includes(governmentIdType)) {
          newGovernmentIdType = governmentIdType;
        }
      }

      // Update lecturer record
      lecturerRecord.cv = newCvPath;
      lecturerRecord.certificates = newCertificates;
      lecturerRecord.governmentIdType = newGovernmentIdType;
      lecturerRecord.governmentId = newGovernmentIdPath;
      lecturerRecord.requestStatus = 'pending'; // Reset to pending
      await lecturerRecord.save();

      // Notify admin about reapplication
      try {
        await notifyAdminAboutLecturerRequest(user, lecturerRecord);
      } catch (notifyError) {
        console.error('Failed to notify admin about reapplication:', notifyError);
      }

      const { hash: _, salt: __, verificationCode: ___, ...responseBody } = user.toJSON();

      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Application resubmitted successfully. Your application is now pending review.",
        data: {
          user: responseBody,
          lecturerApplication: {
            id: lecturerRecord._id,
            requestStatus: lecturerRecord.requestStatus
          }
        }
      });

    } catch (err) {
      console.error('Lecturer reapply error:', err);
      return sendErrorResponse({
        res,
        status: httpStatus.INTERNAL_SERVER_ERROR,
        msg: "Failed to resubmit application.",
        err: err.message
      });
    }
  });
};

/**
 * Update lecturer documents (CV, certificates, government ID)
 * Allows approved instructors to upload/update their documents from profile
 */
exports.updateLecturerDocuments = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found."
      });
    }

    // Check if user is a lecturer
    if (!user.roles.includes('LECTURER')) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Only lecturers can upload documents."
      });
    }

    // Get or create lecturer record
    let lecturerRecord = await Lecturer.findOne({ user: user._id });

    if (!lecturerRecord) {
      // Create a new lecturer record if it doesn't exist
      lecturerRecord = new Lecturer({
        user: user._id,
        requestStatus: user.lecturerStatus || 'pending'
      });
    }

    const { governmentIdType } = req.body;

    // Handle file uploads
    if (req.files) {
      if (req.files.cv && req.files.cv.length > 0) {
        lecturerRecord.cv = req.files.cv[0].path;
      }
      if (req.files.certificates && req.files.certificates.length > 0) {
        // Replace existing certificates with new ones
        lecturerRecord.certificates = req.files.certificates.map(file => file.path);
      }
      if (req.files.governmentId && req.files.governmentId.length > 0) {
        lecturerRecord.governmentId = req.files.governmentId[0].path;
      }
    }

    // Update government ID type if provided
    if (governmentIdType) {
      const validIdTypes = ['citizenship', 'nid', 'passport', 'driving_license'];
      if (validIdTypes.includes(governmentIdType)) {
        lecturerRecord.governmentIdType = governmentIdType;
      }
    }

    await lecturerRecord.save();

    return sendSuccessResponse({
      res,
      status: httpStatus.OK,
      msg: "Documents uploaded successfully.",
      data: {
        cv: lecturerRecord.cv,
        certificates: lecturerRecord.certificates,
        governmentIdType: lecturerRecord.governmentIdType,
        governmentId: lecturerRecord.governmentId
      }
    });

  } catch (err) {
    console.error('Update lecturer documents error:', err);
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Failed to upload documents.",
      err: err.message
    });
  }
};