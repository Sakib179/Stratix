const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

const nextPoNumber = async (prefix = 'PO') => {
  const year = new Date().getFullYear();
  const { rows } = await db.query(
    `INSERT INTO po_counters (year, prefix, last_sequence) VALUES ($1,$2,1)
     ON CONFLICT (year, prefix) DO UPDATE SET last_sequence = po_counters.last_sequence + 1
     RETURNING last_sequence`, [year, prefix]
  );
  return `${prefix}-${year}-${String(rows[0].last_sequence).padStart(4, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, status, supplier_id } = req.query;

    const conds = ['1=1']; const params = [];
    if (search)     { conds.push(`(po.po_number ILIKE $${params.length+1} OR s.name ILIKE $${params.length+1})`); params.push(`%${search}%`); }
    if (status)     { conds.push(`po.status = $${params.length+1}`); params.push(status); }
    if (supplier_id){ conds.push(`po.supplier_id = $${params.length+1}`); params.push(supplier_id); }
    const where = conds.join(' AND ');

    const [{ rows }, { rows: cnt }] = await Promise.all([
      db.query(`SELECT po.*, s.name AS supplier_name
                FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id
                WHERE ${where} ORDER BY po.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]),
      db.query(`SELECT COUNT(*) FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE ${where}`, params),
    ]);

    const total = parseInt(cnt[0].count);
    return sendPaginated(res, 'Purchase orders fetched', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT po.*, s.name AS supplier_name, s.phone AS supplier_phone
       FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = $1`, [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'Purchase order not found', 404);
    const { rows: items } = await db.query(
      `SELECT poi.*, p.product_name, p.model_no FROM purchase_order_items poi
       JOIN products p ON poi.product_id = p.id WHERE poi.po_id = $1`, [req.params.id]
    );
    return sendSuccess(res, 'Purchase order fetched', { ...rows[0], items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { supplier_id, items = [], expected_date, notes } = req.body;
    if (!items.length) return sendError(res, 'At least one item is required', 400);

    const poNumber = await nextPoNumber();
    const totalAmount = items.reduce((s, it) => s + it.quantity_ordered * it.unit_cost, 0);

    const { rows } = await db.query(
      `INSERT INTO purchase_orders (po_number, supplier_id, expected_date, notes, total_amount, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [poNumber, supplier_id || null, expected_date || null, notes || null, totalAmount, req.user.id]
    );

    for (const item of items) {
      await db.query(
        `INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, unit_cost, line_total)
         VALUES ($1,$2,$3,$4,$5)`,
        [rows[0].id, item.product_id, item.quantity_ordered, item.unit_cost, item.quantity_ordered * item.unit_cost]
      );
    }

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'purchase_order',
      entityId: rows[0].id, description: `Created PO ${poNumber}` });

    return sendSuccess(res, 'Purchase order created', rows[0], 201);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, received_date } = req.body;
    const VALID = ['Draft', 'Ordered', 'Received', 'Cancelled'];
    if (!VALID.includes(status)) return sendError(res, `status must be one of: ${VALID.join(', ')}`, 400);

    const { rows: [po] } = await db.query(
      `SELECT po.*, json_agg(poi.*) AS items FROM purchase_orders po
       JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE po.id = $1 GROUP BY po.id`, [req.params.id]
    );
    if (!po) return sendError(res, 'Purchase order not found', 404);

    await db.query(
      `UPDATE purchase_orders SET status=$1, received_date=$2, updated_at=NOW() WHERE id=$3`,
      [status, received_date || po.received_date, req.params.id]
    );

    // If marking as Received, update stock via stock adjustments
    if (status === 'Received' && po.status !== 'Received') {
      for (const item of po.items) {
        const { rows: [prod] } = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
        if (!prod) continue;
        const qBefore = parseInt(prod.stock_quantity);
        const qAfter  = qBefore + parseInt(item.quantity_ordered);
        await db.query(`UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`, [qAfter, item.product_id]);
        await db.query(
          `INSERT INTO stock_adjustments (product_id, adjustment_type, quantity_change, quantity_before, quantity_after, reason, reference_id, reference_type, adjusted_by)
           VALUES ($1,'restock',$2,$3,$4,$5,$6,'purchase_order',$7)`,
          [item.product_id, item.quantity_ordered, qBefore, qAfter, `PO received: ${po.po_number}`, po.id, req.user.id]
        );
        await db.query(
          `UPDATE purchase_order_items SET quantity_received = quantity_ordered WHERE po_id = $1`, [po.id]
        );
      }
    }

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'purchase_order',
      entityId: req.params.id, description: `PO status updated to ${status}` });

    return sendSuccess(res, 'Purchase order updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT status FROM purchase_orders WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Purchase order not found', 404);
    if (rows[0].status === 'Received') return sendError(res, 'Cannot delete a received purchase order', 400);
    await db.query(`DELETE FROM purchase_orders WHERE id = $1`, [req.params.id]);
    return sendSuccess(res, 'Purchase order deleted');
  } catch (err) { next(err); }
};
