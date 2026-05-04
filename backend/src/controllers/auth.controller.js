const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { generateAccessToken, generateTempToken, verifyTempToken } = require('../utils/jwt.utils');
const { comparePassword, hashPassword } = require('../utils/password.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');
const { verifyTOTP, verifyBackupCode } = require('../services/twoFactor.service');
const { sendAccountLockedEmail, sendPasswordResetEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const env = require('../config/env');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const saveRefreshToken = async (userId, rawToken, ipAddress, userAgent) => {
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ipAddress, userAgent]
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
};

const recordLogin = async (userId, ipAddress, userAgent, status) => {
  try {
    await db.query(
      `INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4)`,
      [userId || null, ipAddress, userAgent, status]
    );
  } catch (err) {
    logger.error('Login history insert failed:', err.message);
  }
};

const issueTokensAndRespond = async (res, user, ipAddress, userAgent) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const rawRefresh = uuidv4();
  await saveRefreshToken(user.id, rawRefresh, ipAddress, userAgent);
  setRefreshCookie(res, rawRefresh);

  const { password_hash, two_factor_secret, ...safeUser } = user;
  return sendSuccess(res, 'Login successful', { accessToken, user: safeUser });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const ua = req.headers['user-agent'];

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const { rows } = await db.query(
      `SELECT * FROM users WHERE email = $1 AND is_deleted = FALSE`,
      [email.toLowerCase().trim()]
    );
    const user = rows[0];

    if (!user) {
      await recordLogin(null, ip, ua, 'failed');
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'Account deactivated. Contact your administrator.', 401);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
      await recordLogin(user.id, ip, ua, 'locked');
      return sendError(res, `Account locked. Try again in ${mins} minute(s).`, 429);
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      const attempts = user.failed_login_attempts + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        sendAccountLockedEmail({ to: user.email, fullName: user.full_name, minutesLocked: 30 }).catch(() => {});
      }
      await db.query(
        `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockUntil, user.id]
      );
      await recordLogin(user.id, ip, ua, 'failed');
      const left = Math.max(0, 5 - attempts);
      return sendError(
        res,
        left > 0
          ? `Invalid credentials. ${left} attempt(s) remaining.`
          : 'Account locked for 30 minutes due to failed attempts.',
        401
      );
    }

    await db.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1`,
      [user.id]
    );
    await recordLogin(user.id, ip, ua, 'success');

    if (user.two_factor_enabled) {
      const tempToken = generateTempToken({ userId: user.id, type: '2fa_pending' });
      return sendSuccess(res, '2FA required', { requiresTwoFactor: true, tempToken });
    }

    return issueTokensAndRespond(res, user, ip, ua);
  } catch (err) {
    next(err);
  }
};

exports.verifyTwoFactor = async (req, res, next) => {
  try {
    const { tempToken, code, isBackupCode } = req.body;
    if (!tempToken || !code) {
      return sendError(res, 'Token and code are required', 400);
    }

    let decoded;
    try {
      decoded = verifyTempToken(tempToken);
    } catch {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }

    if (decoded.type !== '2fa_pending') {
      return sendError(res, 'Invalid token type', 401);
    }

    const { rows } = await db.query(`SELECT * FROM users WHERE id = $1`, [decoded.userId]);
    const user = rows[0];
    if (!user || !user.two_factor_enabled) {
      return sendError(res, 'User not found or 2FA not enabled', 400);
    }

    if (isBackupCode) {
      const { rows: bcRows } = await db.query(
        `SELECT id, code_hash FROM user_2fa_backup_codes WHERE user_id = $1 AND used = FALSE`,
        [user.id]
      );
      const matchId = await verifyBackupCode(code, bcRows);
      if (!matchId) return sendError(res, 'Invalid backup code', 401);
      await db.query(
        `UPDATE user_2fa_backup_codes SET used = TRUE, used_at = NOW() WHERE id = $1`,
        [matchId]
      );
    } else {
      const valid = verifyTOTP(user.two_factor_secret, code);
      if (!valid) return sendError(res, 'Invalid authentication code', 401);
    }

    const ip = req.ip;
    const ua = req.headers['user-agent'];
    return issueTokensAndRespond(res, user, ip, ua);
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) return sendError(res, 'Refresh token not found', 401);

    const tokenHash = hashToken(rawToken);
    const { rows } = await db.query(
      `SELECT rt.*, u.id as uid, u.role, u.email, u.is_active, u.is_deleted
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );
    const record = rows[0];

    if (!record || new Date(record.expires_at) < new Date()) {
      clearRefreshCookie(res);
      return sendError(res, 'Session expired. Please log in again.', 401);
    }

    if (!record.is_active || record.is_deleted) {
      await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
      clearRefreshCookie(res);
      return sendError(res, 'Account deactivated', 401);
    }

    await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);

    const newRaw = uuidv4();
    await saveRefreshToken(record.user_id, newRaw, req.ip, req.headers['user-agent']);
    setRefreshCookie(res, newRaw);

    const accessToken = generateAccessToken({
      userId: record.user_id,
      role: record.role,
      email: record.email,
    });

    return sendSuccess(res, 'Token refreshed', { accessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
    }
    clearRefreshCookie(res);
    return sendSuccess(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.designation, u.department,
              u.role, u.two_factor_enabled, u.is_active, u.last_login, u.created_at,
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);

    const { rows } = await db.query(
      `SELECT id, full_name, email FROM users WHERE email = $1 AND is_deleted = FALSE AND is_active = TRUE`,
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent user enumeration
    if (!rows[0]) {
      return sendSuccess(res, 'If that email exists, a reset link has been sent.');
    }

    const user = rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [user.id]);
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail({ to: user.email, name: user.full_name, resetUrl }).catch(() => {});

    return sendSuccess(res, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendError(res, 'Token and new password are required', 400);
    if (password.length < 8) return sendError(res, 'Password must be at least 8 characters', 400);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await db.query(
      `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!rows[0]) return sendError(res, 'Invalid or expired reset link', 400);

    const hashed = await hashPassword(password);
    await db.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashed, rows[0].user_id]);
    await db.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [rows[0].id]);

    return sendSuccess(res, 'Password reset successful. You can now log in.');
  } catch (err) {
    next(err);
  }
};

exports.oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const ip = req.ip;
    const ua = req.headers['user-agent'];

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
    const rawRefresh = uuidv4();
    await saveRefreshToken(user.id, rawRefresh, ip, ua);
    setRefreshCookie(res, rawRefresh);

    await db.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    res.redirect(`${env.FRONTEND_URL}/oauth-success?token=${accessToken}`);
  } catch (err) {
    res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};
