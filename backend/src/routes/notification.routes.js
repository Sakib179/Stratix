const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response.utils');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, type, title, body AS message, is_read, link, created_at
       FROM notifications
       WHERE (user_id = $1 OR user_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return sendSuccess(res, 'Notifications fetched', rows);
  } catch (err) { next(err); }
});

router.patch('/mark-all-read', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE`,
      [req.user.id]
    );
    return sendSuccess(res, 'All notifications marked as read');
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [req.params.id, req.user.id]
    );
    return sendSuccess(res, 'Notification marked as read');
  } catch (err) { next(err); }
});

module.exports = router;
