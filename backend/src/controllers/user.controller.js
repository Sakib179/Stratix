const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { hashPassword, comparePassword, validatePasswordStrength, isPasswordInHistory } = require('../utils/password.utils');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { generateSecret, generateQRCode, verifyTOTP, generateBackupCodes, hashBackupCode } = require('../services/twoFactor.service');
const { sendPasswordChangedEmail } = require('../services/email.service');
const { logAction } = require('../middleware/logAction.middleware');

exports.getProfile = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.designation, u.department,
              u.role, u.two_factor_enabled, u.is_active, u.last_login, u.created_at, u.updated_at,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('module', up.module, 'can_access', up.can_access))
                FILTER (WHERE up.module IS NOT NULL), '[]'
              ) AS permissions
       FROM users u
       LEFT JOIN user_permissions up ON up.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );
    if (!rows[0]) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'Profile fetched', rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, designation, department } = req.body;
    const userId = req.params.id || req.user.id;

    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return sendError(res, 'You can only update your own profile', 403);
    }

    const { rows } = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           designation = COALESCE($3, designation),
           department = COALESCE($4, department),
           updated_at = NOW()
       WHERE id = $5 AND is_deleted = FALSE
       RETURNING id, full_name, email, phone, designation, department, role, updated_at`,
      [full_name, phone, designation, department, userId]
    );

    if (!rows[0]) return sendError(res, 'User not found', 404);

    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: userId,
      description: `Updated profile for ${rows[0].full_name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Profile updated successfully', rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return sendError(res, 'Current and new password are required', 400);
    }

    const validation = validatePasswordStrength(new_password);
    if (!validation.valid) {
      return sendError(res, 'Password does not meet requirements', 400, validation.errors);
    }

    const { rows } = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = rows[0];

    const currentMatch = await comparePassword(current_password, user.password_hash);
    if (!currentMatch) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    const { rows: historyRows } = await db.query(
      `SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );
    const historyHashes = historyRows.map((r) => r.password_hash);
    const inHistory = await isPasswordInHistory(new_password, historyHashes);
    if (inHistory) {
      return sendError(res, 'Cannot reuse one of your last 5 passwords', 400);
    }

    const newHash = await hashPassword(new_password);

    await db.query(
      `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
      [req.user.id, user.password_hash]
    );

    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, req.user.id]
    );

    await db.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.user.id]);

    sendPasswordChangedEmail({ to: user.email, fullName: user.full_name }).catch(() => {});

    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: req.user.id,
      description: 'Changed account password',
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Password changed successfully. Please log in again.');
  } catch (err) {
    next(err);
  }
};

exports.getActivityLog = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const { rows: logs } = await db.query(
      `SELECT id, action, entity_type, entity_id, description, ip_address, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM audit_logs WHERE user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countRows[0].count);

    return sendPaginated(res, 'Activity log fetched', logs, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400);

    const userId = req.params.id || req.user.id;
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    const { rows } = await db.query(
      `INSERT INTO user_attachments (user_id, file_name, file_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
    );

    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'attachment',
      entityId: rows[0].id,
      description: `Uploaded file: ${req.file.originalname}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'File uploaded successfully', rows[0], 201);
  } catch (err) {
    next(err);
  }
};

exports.getAttachments = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id;
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    const { rows } = await db.query(
      `SELECT id, file_name, file_path, file_size, mime_type, uploaded_at
       FROM user_attachments WHERE user_id = $1 ORDER BY uploaded_at DESC`,
      [userId]
    );
    return sendSuccess(res, 'Attachments fetched', rows);
  } catch (err) {
    next(err);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;

    const { rows } = await db.query(
      `SELECT * FROM user_attachments WHERE id = $1`,
      [attachmentId]
    );
    if (!rows[0]) return sendError(res, 'Attachment not found', 404);

    const attachment = rows[0];
    if (req.user.role !== 'admin' && attachment.user_id !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    await db.query(`DELETE FROM user_attachments WHERE id = $1`, [attachmentId]);

    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'attachment',
      entityId: attachmentId,
      description: `Deleted file: ${attachment.file_name}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, 'Attachment deleted successfully');
  } catch (err) {
    next(err);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT email, two_factor_enabled FROM users WHERE id = $1`, [req.user.id]);
    const user = rows[0];
    if (user.two_factor_enabled) {
      return sendError(res, '2FA is already enabled. Disable it first.', 400);
    }

    const secret = generateSecret(user.email);
    const qrCode = await generateQRCode(secret.otpauth_url);

    await db.query(`UPDATE users SET two_factor_secret = $1 WHERE id = $2`, [secret.base32, req.user.id]);

    return sendSuccess(res, '2FA setup initiated', { qrCode, secret: secret.base32 });
  } catch (err) {
    next(err);
  }
};

exports.verify2FASetup = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return sendError(res, 'Verification code is required', 400);

    const { rows } = await db.query(
      `SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];

    if (!user.two_factor_secret) {
      return sendError(res, 'Please initiate 2FA setup first', 400);
    }
    if (user.two_factor_enabled) {
      return sendError(res, '2FA is already enabled', 400);
    }

    const valid = verifyTOTP(user.two_factor_secret, code);
    if (!valid) return sendError(res, 'Invalid verification code', 400);

    const backupCodes = generateBackupCodes();
    const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

    await db.query(`UPDATE users SET two_factor_enabled = TRUE WHERE id = $1`, [req.user.id]);
    await db.query(`DELETE FROM user_2fa_backup_codes WHERE user_id = $1`, [req.user.id]);

    for (const hash of hashedCodes) {
      await db.query(
        `INSERT INTO user_2fa_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [req.user.id, hash]
      );
    }

    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: req.user.id,
      description: 'Enabled two-factor authentication',
      ipAddress: req.ip,
    });

    return sendSuccess(res, '2FA enabled successfully', {
      backupCodes: backupCodes.map((c) => `${c.slice(0, 4)}-${c.slice(4)}`),
    });
  } catch (err) {
    next(err);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return sendError(res, 'Password confirmation required', 400);

    const { rows } = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    const user = rows[0];

    if (!user.two_factor_enabled) {
      return sendError(res, '2FA is not enabled', 400);
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) return sendError(res, 'Incorrect password', 401);

    await db.query(
      `UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1`,
      [req.user.id]
    );
    await db.query(`DELETE FROM user_2fa_backup_codes WHERE user_id = $1`, [req.user.id]);

    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'user',
      entityId: req.user.id,
      description: 'Disabled two-factor authentication',
      ipAddress: req.ip,
    });

    return sendSuccess(res, '2FA disabled successfully');
  } catch (err) {
    next(err);
  }
};
