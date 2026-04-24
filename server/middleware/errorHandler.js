const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, errors = [] } = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = Object.values(err.errors).map(e => e.message).join(', ');
  }
  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
  }
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = 'Invalid ID format';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.originalUrl} → ${statusCode}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
