const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, message, 429),
    skip: (req) => process.env.NODE_ENV === 'test',
  });

const globalLimiter = createLimiter(
  60 * 1000,
  100,
  'Too many requests from this IP. Please try again in a moment.'
);

const loginLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts from this IP. Please try again in 15 minutes.'
);

const authLimiter = createLimiter(
  60 * 1000,
  20,
  'Too many authentication requests. Please slow down.'
);

module.exports = { globalLimiter, loginLimiter, authLimiter };
