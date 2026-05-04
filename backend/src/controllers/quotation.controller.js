const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

const calcTotals = (items, discountType, discountValue, taxRate) => {
  const subtotal = items.reduce((s, it) => {
    const base = it.unit_price_snapshot * it.quantity;
    const disc = it.discount_type === 'percent' ? base * (it.discount / 100) : Number(it.discount || 0);
    return s + Math.max(0, base - disc);
  }, 0);
  const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : Number(discountValue || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  return { subtotal, discountAmount, taxAmount, grandTotal: afterDiscount + taxAmount };
};

const nextQuotationNumber = async (prefix = 'QUO') => {
  const year = new Date().getFullYear();
  const { rows } = await db.query(
    `INSERT INTO quotation_counters (year, prefix, last_sequence) VALUES ($1,$2,1)
     ON CONFLICT (year, prefix) DO UPDATE SET last_sequence = quotation_counters.last_sequence + 1
     RETURNING last_sequence`,
    [year, prefix]
  );
  return `${prefix}-${year}-${String(rows[0].last_sequence).padStart(4, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const conds = ['1=1']; const params = [];
    if (search) { conds.push(`(q.quotation_number ILIKE $${params.length+1} OR c.full_name ILIKE $${params.length+1})`); params.push(`%${search}%`); }
    if (status) { conds.push(`q.status = $${params.length+1}`); params.push(status); }
    const where = conds.join(' AND ');

    const [{ rows }, { rows: cnt }] = await Promise.all([
      db.query(`SELECT q.*, c.full_name AS client_name, c.phone AS client_phone
                FROM quotations q JOIN clients c ON q.client_id = c.id
                WHERE ${where} ORDER BY q.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]),
      db.query(`SELECT COUNT(*) FROM quotations q JOIN clients c ON q.client_id = c.id WHERE ${where}`, params),
    ]);

    const total = parseInt(cnt[0].count);
    return sendPaginated(res, 'Quotations fetched', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT q.*, c.full_name AS client_name, c.phone AS client_phone, c.email AS client_email, c.address AS client_address
       FROM quotations q JOIN clients c ON q.client_id = c.id WHERE q.id = $1`, [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'Quotation not found', 404);
    const { rows: items } = await db.query(`SELECT * FROM quotation_items WHERE quotation_id = $1`, [req.params.id]);
    return sendSuccess(res, 'Quotation fetched', { ...rows[0], items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { client_id, items = [], discount_type = 'flat', discount_value = 0, tax_rate = 0, valid_until, notes } = req.body;
    if (!client_id) return sendError(res, 'client_id is required', 400);
    if (!items.length) return sendError(res, 'At least one item is required', 400);

    const quotationNumber = await nextQuotationNumber();
    const { subtotal, discountAmount, taxAmount, grandTotal } = calcTotals(items, discount_type, discount_value, tax_rate);

    const { rows } = await db.query(
      `INSERT INTO quotations (quotation_number, client_id, subtotal, discount_type, discount_value, discount_amount,
         tax_rate, tax_amount, grand_total, valid_until, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [quotationNumber, client_id, subtotal, discount_type, discount_value, discountAmount,
       tax_rate, taxAmount, grandTotal, valid_until || null, notes || null, req.user.id]
    );

    for (const item of items) {
      const base = item.unit_price_snapshot * item.quantity;
      const disc = item.discount_type === 'percent' ? base * (item.discount / 100) : Number(item.discount || 0);
      await db.query(
        `INSERT INTO quotation_items (quotation_id, product_id, product_name_snapshot, model_no_snapshot,
           unit_price_snapshot, quantity, discount_type, discount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [rows[0].id, item.product_id || null, item.product_name_snapshot, item.model_no_snapshot || '',
         item.unit_price_snapshot, item.quantity, item.discount_type || 'flat', item.discount || 0,
         Math.max(0, base - disc)]
      );
    }

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'quotation',
      entityId: rows[0].id, description: `Created quotation ${quotationNumber}` });

    return sendSuccess(res, 'Quotation created', rows[0], 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { rows: existing } = await db.query(`SELECT * FROM quotations WHERE id = $1`, [req.params.id]);
    if (!existing[0]) return sendError(res, 'Quotation not found', 404);
    if (existing[0].status === 'Converted') return sendError(res, 'Cannot edit a converted quotation', 400);

    const { items, discount_type, discount_value, tax_rate, valid_until, notes, status } = req.body;

    if (items) {
      const { subtotal, discountAmount, taxAmount, grandTotal } = calcTotals(
        items, discount_type ?? existing[0].discount_type,
        discount_value ?? existing[0].discount_value, tax_rate ?? existing[0].tax_rate
      );
      await db.query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [req.params.id]);
      for (const item of items) {
        const base = item.unit_price_snapshot * item.quantity;
        const disc = item.discount_type === 'percent' ? base * (item.discount / 100) : Number(item.discount || 0);
        await db.query(
          `INSERT INTO quotation_items (quotation_id, product_id, product_name_snapshot, model_no_snapshot,
             unit_price_snapshot, quantity, discount_type, discount, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [req.params.id, item.product_id || null, item.product_name_snapshot, item.model_no_snapshot || '',
           item.unit_price_snapshot, item.quantity, item.discount_type || 'flat', item.discount || 0,
           Math.max(0, base - disc)]
        );
      }
      await db.query(
        `UPDATE quotations SET subtotal=$1, discount_type=$2, discount_value=$3, discount_amount=$4,
           tax_rate=$5, tax_amount=$6, grand_total=$7, valid_until=$8, notes=$9, status=$10, updated_at=NOW()
         WHERE id=$11`,
        [subtotal, discount_type, discount_value, discountAmount, tax_rate, taxAmount, grandTotal,
         valid_until ?? existing[0].valid_until, notes ?? existing[0].notes, status ?? existing[0].status, req.params.id]
      );
    } else {
      await db.query(
        `UPDATE quotations SET valid_until=$1, notes=$2, status=$3, updated_at=NOW() WHERE id=$4`,
        [valid_until ?? existing[0].valid_until, notes ?? existing[0].notes, status ?? existing[0].status, req.params.id]
      );
    }

    return sendSuccess(res, 'Quotation updated');
  } catch (err) { next(err); }
};

exports.convertToInvoice = async (req, res, next) => {
  try {
    const { rows: [quot] } = await db.query(
      `SELECT q.*, c.full_name AS client_name FROM quotations q JOIN clients c ON q.client_id = c.id WHERE q.id = $1`,
      [req.params.id]
    );
    if (!quot) return sendError(res, 'Quotation not found', 404);
    if (quot.status === 'Converted') return sendError(res, 'Already converted', 400);

    const { rows: items } = await db.query(`SELECT * FROM quotation_items WHERE quotation_id = $1`, [req.params.id]);
    if (!items.length) return sendError(res, 'Quotation has no items', 400);

    const { due_date } = req.body;

    // Generate invoice number — same logic as invoice controller
    const year = new Date().getFullYear();
    await db.query(
      `INSERT INTO invoice_counters (year, counter) VALUES ($1, 0) ON CONFLICT (year) DO NOTHING`, [year]
    );
    const { rows: counter } = await db.query(
      `UPDATE invoice_counters SET counter = counter + 1 WHERE year = $1 RETURNING counter`, [year]
    );
    const invoiceNumber = `INV-${year}-${String(counter[0].counter).padStart(4, '0')}`;

    const { rows: [inv] } = await db.query(
      `INSERT INTO invoices (invoice_number, client_id, subtotal, discount_type, discount_value, discount_amount,
         tax_rate, tax_amount, grand_total, status, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Draft',$10,$11,$12) RETURNING *`,
      [invoiceNumber, quot.client_id, quot.subtotal, quot.discount_type, quot.discount_value, quot.discount_amount,
       quot.tax_rate, quot.tax_amount, quot.grand_total, due_date || null, quot.notes, req.user.id]
    );

    for (const item of items) {
      await db.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name_snapshot, model_no_snapshot,
           unit_price_snapshot, quantity, discount_type, discount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [inv.id, item.product_id, item.product_name_snapshot, item.model_no_snapshot,
         item.unit_price_snapshot, item.quantity, item.discount_type, item.discount, item.line_total]
      );
    }

    await db.query(
      `UPDATE quotations SET status = 'Converted', converted_invoice_id = $1, updated_at = NOW() WHERE id = $2`,
      [inv.id, req.params.id]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'invoice',
      entityId: inv.id, description: `Converted quotation ${quot.quotation_number} to invoice ${invoiceNumber}` });

    return sendSuccess(res, 'Quotation converted to invoice', { invoice_id: inv.id, invoice_number: invoiceNumber });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM quotations WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Quotation not found', 404);
    if (rows[0].status === 'Converted') return sendError(res, 'Cannot delete a converted quotation', 400);
    await db.query(`DELETE FROM quotations WHERE id = $1`, [req.params.id]);
    return sendSuccess(res, 'Quotation deleted');
  } catch (err) { next(err); }
};
