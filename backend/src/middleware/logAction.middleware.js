const db = require('../config/db');
const logger = require('../utils/logger');

const logAction = async ({ userId, action, entityType, entityId, description, ipAddress }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, action, entityType, entityId || null, description, ipAddress || null]
    );
  } catch (err) {
    logger.error('Failed to write audit log:', err.message);
  }
};

const auditMiddleware = (action, entityType, getDescription) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body?.success && req.user) {
        const entityId = body?.data?.id || req.params?.id || null;
        const description =
          typeof getDescription === 'function'
            ? getDescription(req, body)
            : getDescription;

        logAction({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          description,
          ipAddress: req.ip,
        });
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { logAction, auditMiddleware };
