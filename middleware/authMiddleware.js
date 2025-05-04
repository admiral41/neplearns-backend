const { verifyToken } = require('../config/config');
const User = require('../models/User');
const createError = require('http-errors');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw createError.Unauthorized('Authentication required');

    const decoded = verifyToken(token);
    if (!decoded) throw createError.Unauthorized('Invalid token');

    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw createError.NotFound('User not found');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError.Forbidden('Insufficient permissions'));
    }
    next();
  };
};

module.exports = { protect, restrictTo };