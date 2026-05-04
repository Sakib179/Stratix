const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, sort = 'created_at', order = 'desc' } = req.query;

    const allowed = ['full_name', 'phone', 'email', 'created_at'];
    const sortField = allowed.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const conditions = ['1=1'];
    const params = [];

    if (search) {
      conditions.push(`(full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)`);
      params.push(`%${search}%`);
    }

    const where = conditions.join(' AND ');
    const p = params.length;

    const { rows } = await db.query(
      `SELECT c.*,
              COUNT(DISTINCT i.id) AS invoice_count,
              COALESCE(SUM(i.grand_total) FILTER (WHERE i.status = 'Paid'), 0) AS total_spent
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       WHERE ${where}
       GROUP BY c.id
       ORDER BY c.${sortField} ${sortOrder}
       LIMIT $${p + 1} OFFSET $${p + 2}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM clients WHERE ${where}`, params
    );

    return sendPaginated(res, 'Clients fetched', rows, {
      page, limit, total: parseInt(countRows[0].count),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) { next(err); }
};

exports.search = async (req, res, next) => {
  try {
    const { phone, name } = req.query;
    const conditions = [];
    const params = [];

    if (phone) { conditions.push(`phone ILIKE $${params.length + 1}`); params.push(`%${phone}%`); }
    if (name)  { conditions.push(`full_name ILIKE $${params.length + 1}`); params.push(`%${name}%`); }

    if (!conditions.length) return sendSuccess(res, 'No query provided', []);

    const { rows } = await db.query(
      `SELECT * FROM clients WHERE ${conditions.join(' OR ')} LIMIT 10`,
      params
    );
    return sendSuccess(res, 'Clients found', rows);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`SELECT * FROM clients WHERE id = $1`, [id]);
    if (!rows[0]) return sendError(res, 'Client not found', 404);

    const { rows: invoices } = await db.query(
      `SELECT i.*, u.full_name AS created_by_name
       FROM invoices i
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.client_id = $1
       ORDER BY i.created_at DESC`,
      [id]
    );

    const stats = {
      invoice_count: invoices.length,
      total_spent: invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.grand_total), 0),
      outstanding: invoices.filter((i) => ['Issued', 'Overdue'].includes(i.status)).reduce((s, i) => s + parseFloat(i.grand_total), 0),
    };

    return sendSuccess(res, 'Client fetched', { ...rows[0], invoices, stats });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, phone, email, address, notes } = req.body;
    if (!full_name || !phone) return sendError(res, 'full_name and phone are required', 400);

    const { rows: dup } = await db.query(`SELECT id FROM clients WHERE phone = $1`, [phone]);
    if (dup.length) return sendError(res, 'A client with this phone number already exists', 409);

    const { rows } = await db.query(
      `INSERT INTO clients (full_name, phone, email, address, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [full_name, phone, email || null, address || null, notes || null]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'client',
      entityId: rows[0].id, description: `Created client: ${full_name} (${phone})`, ipAddress: req.ip });

    return sendSuccess(res, 'Client created successfully', rows[0], 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, address, notes, email_unsubscribed } = req.body;

    const { rows } = await db.query(
      `UPDATE clients SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         address = COALESCE($3, address),
         notes = COALESCE($4, notes),
         email_unsubscribed = COALESCE($5, email_unsubscribed),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [full_name, email, address, notes, email_unsubscribed, id]
    );

    if (!rows[0]) return sendError(res, 'Client not found', 404);

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'client',
      entityId: id, description: `Updated client: ${rows[0].full_name}`, ipAddress: req.ip });

    return sendSuccess(res, 'Client updated successfully', rows[0]);
  } catch (err) { next(err); }
};
