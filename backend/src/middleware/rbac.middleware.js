const { sendError } = require('../utils/response.utils');
const db = require('../config/db');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

const requireAdmin = requireRole('admin');

const requireModule = (moduleName) => {
  return async (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (req.user.role === 'admin') return next();

    const { rows } = await db.query(
      'SELECT can_access FROM user_permissions WHERE user_id = $1 AND module = $2',
      [req.user.id, moduleName]
    );

    if (!rows[0] || !rows[0].can_access) {
      return sendError(res, `You do not have access to the ${moduleName} module`, 403);
    }

    next();
  };
};

const requireOwnerOrAdmin = (paramKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (req.user.role === 'admin') return next();
    if (req.params[paramKey] === req.user.id) return next();
    return sendError(res, 'You can only access your own resources', 403);
  };
};

module.exports = { requireRole, requireAdmin, requireModule, requireOwnerOrAdmin };
