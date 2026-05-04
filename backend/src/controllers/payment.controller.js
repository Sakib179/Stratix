const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

exports.listByInvoice = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.full_name AS recorded_by_name
       FROM payments p
       LEFT JOIN users u ON p.recorded_by = u.id
       WHERE p.invoice_id = $1
       ORDER BY p.paid_at DESC`,
      [req.params.invoiceId]
    );
    return sendSuccess(res, 'Payments fetched', rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { amount, payment_method = 'Cash', reference_number, notes, paid_at } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const { rows: inv } = await db.query(
      `SELECT id, grand_total, amount_paid, status FROM invoices WHERE id = $1`, [invoiceId]
    );
    if (!inv[0]) return sendError(res, 'Invoice not found', 404);
    if (inv[0].status === 'Cancelled') return sendError(res, 'Cannot record payment on a cancelled invoice', 400);

    const remaining = parseFloat(inv[0].grand_total) - parseFloat(inv[0].amount_paid || 0);
    if (parseFloat(amount) > remaining + 0.01) {
      return sendError(res, `Payment amount exceeds remaining balance of ${remaining.toFixed(2)}`, 400);
    }

    const { rows } = await db.query(
      `INSERT INTO payments (invoice_id, amount, payment_method, reference_number, notes, paid_at, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [invoiceId, amount, payment_method, reference_number || null, notes || null, paid_at || new Date(), req.user.id]
    );

    const newPaid = parseFloat(inv[0].amount_paid || 0) + parseFloat(amount);
    const newStatus = newPaid >= parseFloat(inv[0].grand_total) - 0.01 ? 'Paid' : inv[0].status;
    await db.query(
      `UPDATE invoices SET amount_paid = $1, status = $2, updated_at = NOW() WHERE id = $3`,
      [newPaid, newStatus, invoiceId]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'payment',
      entityId: rows[0].id, description: `Recorded payment of ${amount} for invoice` });

    return sendSuccess(res, 'Payment recorded', rows[0], 201);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM payments WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Payment not found', 404);

    await db.query(`DELETE FROM payments WHERE id = $1`, [req.params.id]);

    const newPaid = Math.max(0, parseFloat((await db.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id = $1`, [rows[0].invoice_id]
    )).rows[0].total));

    const { rows: inv } = await db.query(
      `SELECT grand_total, status FROM invoices WHERE id = $1`, [rows[0].invoice_id]
    );
    const newStatus = inv[0]?.status === 'Paid' && newPaid < parseFloat(inv[0].grand_total) - 0.01
      ? 'Issued' : inv[0]?.status;

    await db.query(
      `UPDATE invoices SET amount_paid = $1, status = $2, updated_at = NOW() WHERE id = $3`,
      [newPaid, newStatus, rows[0].invoice_id]
    );

    return sendSuccess(res, 'Payment deleted');
  } catch (err) { next(err); }
};
