const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const FCM = require("../models/fcm");
const httpStatus = require("http-status");
const helper = require("../helpers/mailer");
const { generator, responseHandler } = require("../helpers/index");
const { sendErrorResponse, sendSuccessResponse } = responseHandler;
const { generateRandomNum } = generator;
const passwordGenerator = require("generate-password");
const gravatar = require("gravatar");
const { validationResult } = require("express-validator");

// ======================= SIGNUP =======================
exports.signup = async (req, res, next) => {
  try {
    const { email, password, firstname, lastname } = req.body;

    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse({ res, status: httpStatus.BAD_REQUEST, msg: errors.array() });

    // check if user exists
    let userExists = await User.findOne({ email });
    if (userExists) {
      return sendErrorResponse({ res, status: httpStatus.CONFLICT, msg: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const verificationCode = generateRandomNum(100000, 999999);

    const user = await User.create({
      email,
      firstname,
      lastname,
      hash,
      salt,
      verificationCode,
    });

    // send verification email
    user.link = `${process.env.FRONTEND_URI}emailVerification/${user._id}/${verificationCode}`;
    const result = helper.sendVerificationMail(user);

    if (result) {
      return sendSuccessResponse({
        res,
        status: httpStatus.OK,
        msg: "Sign up successful, please verify your email.",
      });
    } else {
      return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: "Failed to send verification mail." });
    }
  } catch (err) {
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: "Failed to signup.", err: err.message });
  }
};

// ======================= LOGIN =======================
exports.login = async (req, res, next) => {
  try {
    const { email, password, fcm_token } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "User not registered." });
    if (user.isSuspended) return sendErrorResponse({ res, status: httpStatus.FORBIDDEN, msg: "Account is suspended." });

    const validPassword = await bcrypt.compare(password, user.hash);
    if (!validPassword) return sendErrorResponse({ res, status: httpStatus.UNAUTHORIZED, msg: "Invalid email/password." });

    const token = await generateToken(user._id);

    // register FCM token
    if (fcm_token) await registerFCM(fcm_token, user._id);

    const { hash, salt, verificationCode, ...responseBody } = user.toJSON();
    return sendSuccessResponse({ res, status: httpStatus.OK, data: responseBody, token });
  } catch (err) {
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: "Login failed.", err: err.message });
  }
};

// ======================= VERIFY EMAIL =======================
exports.verifyEmail = async (req, res, next) => {
  try {
    const { id, code } = req.params;
    const user = await User.findById(id);
    if (!user) return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "User not found." });
    if (user.isVerified) return sendErrorResponse({ res, status: httpStatus.ALREADY_REPORTED, msg: "User already verified." });

    if (user.verificationCode.toString() === code) {
      user.isVerified = true;
      await user.save();
      return sendSuccessResponse({ res, status: httpStatus.OK, msg: "Email verified successfully." });
    } else {
      return sendErrorResponse({ res, status: httpStatus.PRECONDITION_FAILED, msg: "Invalid verification code." });
    }
  } catch (err) {
    return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: "Email verification failed.", err: err.message });
  }
};

// ======================= ENROLL & PAY FOR COURSE =======================
// exports.buyCourse = async (req, res, next) => {
//   try {
//     const { userId, courseId, paymentInfo } = req.body;

//     const user = await User.findById(userId);
//     const course = await Course.findById(courseId);
//     if (!user || !course) return sendErrorResponse({ res, status: httpStatus.NOT_FOUND, msg: "User or Course not found." });

//     // create payment record
//     const payment = await Payment.create({
//       user: userId,
//       course: courseId,
//       amount: course.price,
//       paymentMethod: paymentInfo.method,
//       status: "PAID", // For simplicity, mark as paid. In real, integrate payment gateway
//       transactionId: paymentInfo.transactionId,
//     });

//     // add course to user's enrolled courses
//     if (!user.courses) user.courses = [];
//     user.courses.push(courseId);
//     await user.save();

//     return sendSuccessResponse({
//       res,
//       status: httpStatus.OK,
//       msg: `Course '${course.title}' purchased successfully.`,
//       data: payment,
//     });
//   } catch (err) {
//     return sendErrorResponse({ res, status: httpStatus.INTERNAL_SERVER_ERROR, msg: "Course purchase failed.", err: err.message });
//   }
// };

// ======================= HELPERS =======================
const generateToken = async (id) => {
  const accessToken = jwt.sign({ userId: id }, process.env.SESSION_SECRET, { expiresIn: "1d" });
  const refreshToken = jwt.sign({ userId: id }, process.env.SESSION_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const registerFCM = async (fcm_token, user_id) => {
  let fcm = await FCM.findOne({ user_id });
  if (fcm) {
    if (!fcm.fcm_token.includes(fcm_token)) {
      fcm.fcm_token.push(fcm_token);
      await fcm.save();
    }
  } else {
    await FCM.create({ user_id, fcm_token: [fcm_token] });
  }
};
