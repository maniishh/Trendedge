const jwt      = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * Require a valid Bearer access-token.
 * Sets req.user = { id, iat, exp }
 */
const verifyJWT = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Access token missing'));
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Access token expired'
      : 'Invalid access token';
    next(new ApiError(401, msg));
  }
};

/**
 * Allow requests with or without a token.
 * If valid token present, sets req.user; otherwise continues anonymously.
 */
const optionalJWT = (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.ACCESS_TOKEN_SECRET);
    } catch { /* anonymous */ }
  }
  next();
};

module.exports = { verifyJWT, optionalJWT };
