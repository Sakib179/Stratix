const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const { rows } = await db.query(
      'SELECT id, full_name, email, role, is_active, is_deleted FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = rows[0];

    if (!user || user.is_deleted || !user.is_active) {
      return sendError(res, 'Account not found or deactivated', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid authentication token', 401);
    }
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const { rows } = await db.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (rows[0] && rows[0].is_active) {
      req.user = rows[0];
    }
  } catch (_) {}
  next();
};

module.exports = { authenticate, optionalAuth };
