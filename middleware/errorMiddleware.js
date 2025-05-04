const createError = require('http-errors');

const notFound = (req, res, next) => {
  next(createError.NotFound('Route not found'));
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
};


module.exports = { notFound, errorHandler };