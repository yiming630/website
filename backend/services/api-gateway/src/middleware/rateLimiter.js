const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes
    max: max || 100, // limit each IP to max requests per windowMs
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// General API rate limiter
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later.'
);

// Auth rate limiter (more restrictive)
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many authentication attempts, please try again later.'
);

// Upload rate limiter
const uploadLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads per minute
  'Too many file uploads, please try again later.'
);

// Chat rate limiter
const chatLimiter = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 messages per minute
  'Too many chat messages, please slow down.'
);

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  chatLimiter,
  createRateLimit
};