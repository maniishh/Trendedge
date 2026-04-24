const rateLimit = require('express-rate-limit');

/** Strict limiter for login / register to block brute-force */
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 min
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many attempts — try again in 15 minutes' },
});

/** General API limiter */
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,   // 1 min
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Rate limit exceeded — slow down' },
});

module.exports = { authLimiter, apiLimiter };
