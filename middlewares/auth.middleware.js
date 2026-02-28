const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const User = require("../models/user.model");
const { sendErrorResponse } = require("../helpers/responseHandler");

/**
 * Middleware to verify JWT token
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "No token provided. Please login.",
      });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendErrorResponse({
        res,
        status: httpStatus.NOT_FOUND,
        msg: "User not found.",
      });
    }

    // SINGLE SESSION ENFORCEMENT
    // Check if token version matches (token was issued after last login)
    const tokenVersion = decoded.tokenVersion || 0;
    const userTokenVersion = user.tokenVersion || 0;

    if (tokenVersion !== userTokenVersion) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Session expired. You have been logged out because your account was accessed from another device.",
        code: "SESSION_INVALID",
      });
    }

    if (user.isSuspended) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Account is suspended.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return sendErrorResponse({
      res,
      status: httpStatus.UNAUTHORIZED,
      msg: "Invalid or expired token.",
      err: err.message,
    });
  }
};

/**
 * Middleware to check if user is admin or superadmin
 */
exports.isAdminOrSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "User not authenticated.",
      });
    }

    const hasAdminRole = req.user.roles.some((role) =>
      ["ADMIN", "SUPERADMIN"].includes(role),
    );

    if (!hasAdminRole) {
      return sendErrorResponse({
        res,
        status: httpStatus.FORBIDDEN,
        msg: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (err) {
    return sendErrorResponse({
      res,
      status: httpStatus.INTERNAL_SERVER_ERROR,
      msg: "Authorization check failed.",
      err: err.message,
    });
  }
};
