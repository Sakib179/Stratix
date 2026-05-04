const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, is_active } = req.query;

    const conds = ['1=1']; const params = [];
    if (search)    { conds.push(`(name ILIKE $${params.length+1} OR contact_person ILIKE $${params.length+1})`); params.push(`%${search}%`); }
    if (is_active !== undefined) { conds.push(`is_active = $${params.length+1}`); params.push(is_active === 'true'); }
    const where = conds.join(' AND ');

    const [{ rows }, { rows: cnt }] = await Promise.all([
      db.query(`SELECT s.*, COUNT(po.id) AS po_count
                FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id
                WHERE ${where} GROUP BY s.id ORDER BY s.name
                LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]),
      db.query(`SELECT COUNT(*) FROM suppliers WHERE ${where}`, params),
    ]);

    const total = parseInt(cnt[0].count);
    return sendPaginated(res, 'Suppliers fetched', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Supplier not found', 404);

    const { rows: orders } = await db.query(
      `SELECT id, po_number, status, total_amount, created_at FROM purchase_orders
       WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id]
    );
    return sendSuccess(res, 'Supplier fetched', { ...rows[0], recent_orders: orders });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, notes } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const { rows } = await db.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, contact_person || null, phone || null, email || null, address || null, notes || null]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'supplier',
      entityId: rows[0].id, description: `Created supplier: ${name}` });

    return sendSuccess(res, 'Supplier created', rows[0], 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, notes, is_active } = req.body;
    const { rows } = await db.query(`SELECT id FROM suppliers WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Supplier not found', 404);

    await db.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5, notes=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8`,
      [name, contact_person || null, phone || null, email || null, address || null, notes || null, is_active ?? true, req.params.id]
    );
    return sendSuccess(res, 'Supplier updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT id FROM suppliers WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Supplier not found', 404);
    await db.query(`UPDATE suppliers SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    return sendSuccess(res, 'Supplier deactivated');
  } catch (err) { next(err); }
};
