const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

const VALID_TYPES = ['restock', 'return_in', 'correction', 'removal', 'damage', 'theft', 'return_out'];
const REMOVAL_TYPES = new Set(['removal', 'damage', 'theft', 'return_out']);

const ADJ_ALIAS = `
  sa.id, sa.product_id, sa.adjustment_type, sa.reason,
  sa.quantity_before, sa.quantity_after,
  ABS(sa.quantity_change) AS quantity,
  sa.reference_id, sa.reference_type, sa.adjusted_by,
  sa.created_at,
  p.product_name, p.model_no,
  u.full_name AS adjusted_by_name
`;

exports.list = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = [20, 25, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 25;
    const offset = (page - 1) * limit;
    const { product_id, type, search } = req.query;

    const conds = ['1=1']; const params = [];
    if (product_id) { conds.push(`sa.product_id = $${params.length + 1}`); params.push(product_id); }
    if (type)       { conds.push(`sa.adjustment_type = $${params.length + 1}`); params.push(type); }
    if (search)     { conds.push(`(p.product_name ILIKE $${params.length + 1} OR sa.reason ILIKE $${params.length + 1})`); params.push(`%${search}%`); }
    const where = conds.join(' AND ');

    const [{ rows }, { rows: cnt }] = await Promise.all([
      db.query(
        `SELECT ${ADJ_ALIAS}
         FROM stock_adjustments sa
         JOIN products p ON sa.product_id = p.id
         LEFT JOIN users u ON sa.adjusted_by = u.id
         WHERE ${where}
         ORDER BY sa.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) FROM stock_adjustments sa JOIN products p ON sa.product_id = p.id WHERE ${where}`, params),
    ]);

    const total = parseInt(cnt[0].count);
    return sendPaginated(res, 'Adjustments fetched', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { product_id, adjustment_type, quantity, reason, reference_id, reference_type } = req.body;

    if (!product_id || !adjustment_type || !quantity) {
      return sendError(res, 'product_id, adjustment_type, and quantity are required', 400);
    }
    const qty = parseInt(quantity);
    if (!qty || qty < 1) return sendError(res, 'quantity must be a positive integer', 400);
    if (!VALID_TYPES.includes(adjustment_type)) {
      return sendError(res, `adjustment_type must be one of: ${VALID_TYPES.join(', ')}`, 400);
    }

    const { rows: prod } = await db.query(
      `SELECT id, stock_quantity FROM products WHERE id = $1 AND is_deleted = FALSE`, [product_id]
    );
    if (!prod[0]) return sendError(res, 'Product not found', 404);

    const isRemoval      = REMOVAL_TYPES.has(adjustment_type);
    const quantityBefore = parseInt(prod[0].stock_quantity);
    const quantityChange = isRemoval ? -qty : qty;
    const quantityAfter  = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
      return sendError(res, `Cannot reduce stock below 0 (current stock: ${quantityBefore})`, 400);
    }

    const { rows } = await db.query(
      `INSERT INTO stock_adjustments
         (product_id, adjustment_type, quantity_change, quantity_before, quantity_after, reason, reference_id, reference_type, adjusted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, product_id, adjustment_type, quantity_before, quantity_after, reason, created_at,
                 ABS(quantity_change) AS quantity`,
      [product_id, adjustment_type, quantityChange, quantityBefore, quantityAfter,
       reason || null, reference_id || null, reference_type || null, req.user.id]
    );

    await db.query(`UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`, [quantityAfter, product_id]);

    await logAction({
      userId: req.user.id, action: 'UPDATE', entityType: 'product', entityId: product_id,
      description: `Stock adjusted (${adjustment_type}): ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
    });

    return sendSuccess(res, 'Stock adjustment recorded', rows[0], 201);
  } catch (err) { next(err); }
};

exports.productHistory = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ${ADJ_ALIAS}
       FROM stock_adjustments sa
       JOIN products p ON sa.product_id = p.id
       LEFT JOIN users u ON sa.adjusted_by = u.id
       WHERE sa.product_id = $1
       ORDER BY sa.created_at DESC LIMIT 50`,
      [req.params.productId]
    );
    return sendSuccess(res, 'Stock history fetched', rows);
  } catch (err) { next(err); }
};
