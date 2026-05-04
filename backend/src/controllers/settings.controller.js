const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

// ─── Get all settings ──────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT key, value FROM system_settings ORDER BY key`);
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    return sendSuccess(res, 'Settings fetched', settings);
  } catch (err) { next(err); }
};

// ─── Update settings (bulk) ────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }
    if (!updates || typeof updates !== 'object') {
      return sendError(res, 'Request body must be a key-value object', 400);
    }

    const entries = Object.entries(updates);
    for (const [key, value] of entries) {
      await db.query(
        `INSERT INTO system_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'settings',
      description: `Updated ${entries.length} setting(s): ${entries.map(([k]) => k).join(', ')}`,
      ipAddress: req.ip });

    return sendSuccess(res, `${entries.length} setting(s) saved`);
  } catch (err) { next(err); }
};
