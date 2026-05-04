const db = require('../config/db');
const logger = require('../utils/logger');

const createNotification = async ({ userId, type, title, message, body, link }) => {
  try {
    const text = message ?? body ?? null;
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, type, title, text, link || null]
    );
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
};

const createNotificationForAdmins = async ({ type, title, message, body, link }) => {
  try {
    const { rows } = await db.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE AND is_deleted = FALSE`);
    for (const admin of rows) {
      await createNotification({ userId: admin.id, type, title, message: message ?? body, link });
    }
  } catch (err) {
    logger.error('Failed to create admin notifications:', err.message);
  }
};

const createGlobalNotification = async ({ type, title, message, body, link }) => {
  try {
    const text = message ?? body ?? null;
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES (NULL, $1, $2, $3, $4)`,
      [type, title, text, link || null]
    );
  } catch (err) {
    logger.error('Failed to create global notification:', err.message);
  }
};

module.exports = { createNotification, createNotificationForAdmins, createGlobalNotification };
