const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');
const { hashPassword, validatePasswordStrength } = require('../utils/password.utils');
const { createNotification } = require('../services/notification.service');
const { sendWelcomeEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const crypto = require('crypto');

// ─── List Users ────────────────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, role, is_active } = req.query;

    const conditions = ['u.is_deleted = FALSE'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (role) { conditions.push(`u.role = $${idx++}`); params.push(role); }
    if (is_active !== undefined && is_active !== '') {
      conditions.push(`u.is_active = $${idx++}`);
      params.push(is_active === 'true');
    }

    const where = conditions.join(' AND ');

    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.designation, u.department,
              u.is_active, u.two_factor_enabled, u.last_login, u.created_at,
              COUNT(DISTINCT al.id) AS action_count
       FROM users u
       LEFT JOIN audit_logs al ON al.user_id = u.id
       WHERE ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM users u WHERE ${where}`, params
    );

    return sendPaginated(res, 'Users fetched', rows, {
      page, limit, total: parseInt(countRows[0].count),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) { next(err); }
};

// ─── Get User ──────────────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.designation, u.department,
              u.is_active, u.two_factor_enabled, u.last_login, u.created_at, u.updated_at
       FROM users u WHERE u.id = $1 AND u.is_deleted = FALSE`, [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'User not found', 404);

    const { rows: permissions } = await db.query(
      `SELECT module, can_access FROM user_permissions WHERE user_id = $1`, [req.params.id]
    );

    const { rows: recentActivity } = await db.query(
      `SELECT action, entity_type, description, created_at FROM audit_logs
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id]
    );

    return sendSuccess(res, 'User fetched', { ...rows[0], permissions, recentActivity });
  } catch (err) { next(err); }
};

// ─── Create User ───────────────────────────────────────────────────────────────
exports.createUser = async (req, res, next) => {
  try {
    const { full_name, email, phone, role = 'employee', designation, department, permissions = [] } = req.body;

    if (!full_name || !email) return sendError(res, 'full_name and email are required', 400);

    const { rows: dup } = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (dup.length) return sendError(res, 'A user with this email already exists', 409);

    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const strength = validatePasswordStrength(tempPassword);
    const hashed = await hashPassword(tempPassword);

    const { rows } = await db.query(
      `INSERT INTO users (full_name, email, phone, role, designation, department, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, full_name, email, role, created_at`,
      [full_name, email, phone || null, role, designation || null, department || null, hashed]
    );

    const userId = rows[0].id;

    // Upsert permissions
    for (const perm of permissions) {
      await db.query(
        `INSERT INTO user_permissions (user_id, module, can_access)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id, module) DO UPDATE SET can_access = $3`,
        [userId, perm.module, perm.can_access]
      );
    }

    // Store initial password hash in history
    await db.query(
      `INSERT INTO password_history (user_id, password_hash) VALUES ($1,$2)`, [userId, hashed]
    );

    // Send welcome email (fire and forget)
    sendWelcomeEmail({ to: email, name: full_name, tempPassword }).catch(() => {});

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'user',
      entityId: userId, description: `Created user: ${full_name} (${email})`, ipAddress: req.ip });

    return sendSuccess(res, 'User created. A welcome email with login credentials has been sent.', rows[0], 201);
  } catch (err) { next(err); }
};

// ─── Update User ───────────────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, designation, department, is_active } = req.body;

    if (id === req.user.id && role && role !== 'admin') {
      return sendError(res, 'You cannot demote your own account', 400);
    }

    const { rows } = await db.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         role = COALESCE($3, role),
         designation = COALESCE($4, designation),
         department = COALESCE($5, department),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
       WHERE id = $7 AND is_deleted = FALSE RETURNING id, full_name, email, role, is_active`,
      [full_name, phone, role, designation, department, is_active, id]
    );
    if (!rows[0]) return sendError(res, 'User not found', 404);

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'user',
      entityId: id, description: `Updated user: ${rows[0].full_name}`, ipAddress: req.ip });

    return sendSuccess(res, 'User updated', rows[0]);
  } catch (err) { next(err); }
};

// ─── Deactivate / Delete User ──────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return sendError(res, 'You cannot delete your own account', 400);

    const { rows } = await db.query(
      `UPDATE users SET is_deleted = TRUE, is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE RETURNING full_name`, [id]
    );
    if (!rows[0]) return sendError(res, 'User not found', 404);

    await logAction({ userId: req.user.id, action: 'DELETE', entityType: 'user',
      entityId: id, description: `Deleted user: ${rows[0].full_name}`, ipAddress: req.ip });

    return sendSuccess(res, 'User deleted successfully');
  } catch (err) { next(err); }
};

// ─── Reset User Password ───────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`SELECT email, full_name FROM users WHERE id = $1 AND is_deleted = FALSE`, [id]);
    if (!rows[0]) return sendError(res, 'User not found', 404);

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashed = await hashPassword(tempPassword);

    await db.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hashed, id]);
    await db.query(`INSERT INTO password_history (user_id, password_hash) VALUES ($1,$2)`, [id, hashed]);

    const { sendPasswordChangedEmail } = require('../services/email.service');
    sendPasswordChangedEmail({ to: rows[0].email, name: rows[0].full_name, tempPassword }).catch(() => {});

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'user',
      entityId: id, description: `Reset password for ${rows[0].full_name}`, ipAddress: req.ip });

    return sendSuccess(res, `Password reset. New temporary password sent to ${rows[0].email}`);
  } catch (err) { next(err); }
};

// ─── Update Permissions ────────────────────────────────────────────────────────
exports.updatePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) return sendError(res, 'permissions must be an array', 400);

    for (const perm of permissions) {
      await db.query(
        `INSERT INTO user_permissions (user_id, module, can_access)
         VALUES ($1,$2,$3)
         ON CONFLICT (user_id, module) DO UPDATE SET can_access = $3`,
        [id, perm.module, perm.can_access]
      );
    }

    const { rows } = await db.query(`SELECT module, can_access FROM user_permissions WHERE user_id = $1`, [id]);

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'user',
      entityId: id, description: 'Updated user permissions', ipAddress: req.ip });

    return sendSuccess(res, 'Permissions updated', rows);
  } catch (err) { next(err); }
};

// ─── System Stats (for admin dashboard) ───────────────────────────────────────
exports.systemStats = async (req, res, next) => {
  try {
    const [users, products, clients, invoices, revenue, lowStock] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users WHERE is_deleted = FALSE AND is_active = TRUE`),
      db.query(`SELECT COUNT(*) FROM products WHERE is_deleted = FALSE`),
      db.query(`SELECT COUNT(*) FROM clients`),
      db.query(`SELECT COUNT(*), status FROM invoices GROUP BY status`),
      db.query(`SELECT COALESCE(SUM(grand_total),0) AS total FROM invoices WHERE status = 'Paid'`),
      db.query(`SELECT COUNT(*) FROM products WHERE stock_quantity <= stock_threshold AND is_deleted = FALSE`),
    ]);

    const invoiceBreakdown = {};
    invoices.rows.forEach((r) => { invoiceBreakdown[r.status] = parseInt(r.count); });

    return sendSuccess(res, 'System stats fetched', {
      active_users: parseInt(users.rows[0].count),
      total_products: parseInt(products.rows[0].count),
      total_clients: parseInt(clients.rows[0].count),
      invoice_breakdown: invoiceBreakdown,
      total_revenue: parseFloat(revenue.rows[0].total),
      low_stock_count: parseInt(lowStock.rows[0].count),
    });
  } catch (err) { next(err); }
};

// ─── Audit Logs ────────────────────────────────────────────────────────────────
exports.auditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { user_id, action, entity_type, date_from, date_to } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (user_id)    { conditions.push(`al.user_id = $${idx++}`); params.push(user_id); }
    if (action)     { conditions.push(`al.action = $${idx++}`); params.push(action); }
    if (entity_type){ conditions.push(`al.entity_type = $${idx++}`); params.push(entity_type); }
    if (date_from)  { conditions.push(`al.created_at >= $${idx++}`); params.push(date_from); }
    if (date_to)    { conditions.push(`al.created_at <= $${idx++}`); params.push(date_to + 'T23:59:59'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT al.*, u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM audit_logs al ${where}`, params
    );

    return sendPaginated(res, 'Audit logs fetched', rows, {
      page, limit, total: parseInt(countRows[0].count),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) { next(err); }
};
