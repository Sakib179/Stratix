const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');
const { createNotification, createNotificationForAdmins } = require('../services/notification.service');
const { calcLineTotal, calcInvoiceTotals } = require('../utils/invoiceCalc');
const { generateInvoicePDF } = require('../services/pdf.service');
const { send, baseTemplate } = require('../services/email.service');
const env = require('../config/env');
const logger = require('../utils/logger');

// ─── Generate invoice number ───────────────────────────────────────────────────
const generateInvoiceNumber = async (client) => {
  const year = new Date().getFullYear();
  await client.query(
    `INSERT INTO invoice_counters (year, counter) VALUES ($1, 0) ON CONFLICT (year) DO NOTHING`,
    [year]
  );
  const { rows } = await client.query(
    `UPDATE invoice_counters SET counter = counter + 1 WHERE year = $1 RETURNING counter`,
    [year]
  );
  return `INV-${year}-${String(rows[0].counter).padStart(4, '0')}`;
};

// ─── List invoices ─────────────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.query.status)    { conditions.push(`i.status = $${idx++}`); params.push(req.query.status); }
    if (req.query.created_by){ conditions.push(`i.created_by = $${idx++}`); params.push(req.query.created_by); }
    if (req.query.client_id) { conditions.push(`i.client_id = $${idx++}`); params.push(req.query.client_id); }
    if (req.query.date_from) { conditions.push(`i.created_at >= $${idx++}`); params.push(req.query.date_from); }
    if (req.query.date_to)   { conditions.push(`i.created_at <= $${idx++}`); params.push(req.query.date_to + 'T23:59:59'); }
    if (req.query.search) {
      conditions.push(`(i.invoice_number ILIKE $${idx} OR c.full_name ILIKE $${idx} OR c.phone ILIKE $${idx})`);
      params.push(`%${req.query.search}%`);
      idx++;
    }

    const allowed = ['invoice_number', 'grand_total', 'status', 'created_at', 'due_date'];
    const sortField = allowed.includes(req.query.sort) ? `i.${req.query.sort}` : 'i.created_at';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT i.*, c.full_name AS client_name, c.phone AS client_phone,
              u.full_name AS created_by_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       LEFT JOIN users u ON i.created_by = u.id
       ${where}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM invoices i JOIN clients c ON i.client_id = c.id ${where}`, params
    );

    return sendPaginated(res, 'Invoices fetched', rows, {
      page, limit, total: parseInt(countRows[0].count),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) { next(err); }
};

// ─── Get single invoice ────────────────────────────────────────────────────────
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `SELECT i.*, c.full_name AS client_name, c.phone AS client_phone,
              c.email AS client_email, c.address AS client_address,
              u.full_name AS created_by_name
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = $1`,
      [id]
    );
    if (!rows[0]) return sendError(res, 'Invoice not found', 404);

    const { rows: itemRows } = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1`, [id]
    );

    const { rows: statusHistory } = await db.query(
      `SELECT sh.*, u.full_name AS changed_by_name
       FROM invoice_status_history sh
       LEFT JOIN users u ON sh.changed_by = u.id
       WHERE sh.invoice_id = $1
       ORDER BY sh.changed_at DESC`,
      [id]
    );

    return sendSuccess(res, 'Invoice fetched', {
      ...rows[0],
      items: itemRows,
      status_history: statusHistory,
    });
  } catch (err) { next(err); }
};

// ─── Create invoice ────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { client_id, items, discount_type = 'flat', discount_value = 0,
            tax_rate = 0, due_date, notes, status = 'Issued' } = req.body;

    if (!client_id) return sendError(res, 'client_id is required', 400);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one product is required', 400);
    }

    const { rows: clientRows } = await client.query(`SELECT id FROM clients WHERE id = $1`, [client_id]);
    if (!clientRows[0]) return sendError(res, 'Client not found', 404);

    // Enrich items with product snapshots
    const enrichedItems = [];
    for (const item of items) {
      let productName = item.product_name;
      let modelNo = item.model_no;
      const unitPrice = parseFloat(item.unit_price_override ?? item.unit_price ?? 0);

      if (item.product_id && (!productName || !modelNo)) {
        const { rows: pRows } = await client.query(
          `SELECT product_name, model_no, unit_price FROM products WHERE id = $1 AND is_deleted = FALSE`,
          [item.product_id]
        );
        if (!pRows[0]) return sendError(res, `Product ${item.product_id} not found`, 404);
        productName = productName || pRows[0].product_name;
        modelNo = modelNo || pRows[0].model_no;
      }

      const lineItem = {
        ...item,
        product_name: productName,
        model_no: modelNo,
        unit_price: unitPrice,
      };
      enrichedItems.push({ ...lineItem, line_total: calcLineTotal(lineItem) });
    }

    const totals = calcInvoiceTotals({ items: enrichedItems, discount_type, discount_value, tax_rate });
    const invoiceNumber = await generateInvoiceNumber(client);

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices (invoice_number, client_id, subtotal, discount_amount, discount_type,
        discount_value, tax_rate, tax_amount, grand_total, status, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [invoiceNumber, client_id, totals.subtotal, totals.discount_amount,
       discount_type, parseFloat(discount_value), parseFloat(tax_rate), totals.tax_amount,
       totals.grand_total, status, due_date || null, notes || null, req.user.id]
    );
    const invoice = invRows[0];

    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name_snapshot, model_no_snapshot,
          unit_price_snapshot, quantity, discount_type, discount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [invoice.id, item.product_id || null, item.product_name, item.model_no,
         item.unit_price, parseInt(item.quantity),
         item.discount_type || 'flat', parseFloat(item.discount || 0), item.line_total]
      );

      if (item.product_id) {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2`,
          [parseInt(item.quantity), item.product_id]
        );
      }
    }

    await client.query(
      `INSERT INTO invoice_status_history (invoice_id, old_status, new_status, changed_by)
       VALUES ($1, NULL, $2, $3)`,
      [invoice.id, status, req.user.id]
    );

    await client.query('COMMIT');

    // Post-commit: check low stock, create notifications
    checkLowStockAfterInvoice(items, invoice.invoice_number).catch(() => {});

    await createNotification({
      userId: req.user.id,
      type: 'invoice_created',
      title: `Invoice ${invoiceNumber} created`,
      body: `Grand total: ৳${totals.grand_total.toFixed(2)}`,
      link: `/invoices/${invoice.id}`,
    });

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'invoice',
      entityId: invoice.id, description: `Created invoice ${invoiceNumber} for ৳${totals.grand_total.toFixed(2)}`,
      ipAddress: req.ip });

    return sendSuccess(res, 'Invoice created successfully', invoice, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ─── Update status ─────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const { rows: current } = await db.query(`SELECT status FROM invoices WHERE id = $1`, [id]);
    if (!current[0]) return sendError(res, 'Invoice not found', 404);

    await db.query(`UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
    await db.query(
      `INSERT INTO invoice_status_history (invoice_id, old_status, new_status, changed_by) VALUES ($1,$2,$3,$4)`,
      [id, current[0].status, status, req.user.id]
    );

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'invoice',
      entityId: id, description: `Changed invoice status from ${current[0].status} to ${status}`, ipAddress: req.ip });

    return sendSuccess(res, `Invoice status updated to ${status}`);
  } catch (err) { next(err); }
};

// ─── Duplicate invoice ─────────────────────────────────────────────────────────
exports.duplicate = async (req, res, next) => {
  const dbClient = await db.getClient();
  try {
    await dbClient.query('BEGIN');
    const { id } = req.params;

    const { rows: origRows } = await dbClient.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (!origRows[0]) return sendError(res, 'Invoice not found', 404);
    const orig = origRows[0];

    const { rows: origItems } = await dbClient.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [id]);
    const invoiceNumber = await generateInvoiceNumber(dbClient);

    const { rows: newInv } = await dbClient.query(
      `INSERT INTO invoices (invoice_number, client_id, subtotal, discount_amount, discount_type,
        discount_value, tax_rate, tax_amount, grand_total, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Draft',$10,$11) RETURNING *`,
      [invoiceNumber, orig.client_id, orig.subtotal, orig.discount_amount,
       orig.discount_type, orig.discount_value, orig.tax_rate, orig.tax_amount,
       orig.grand_total, orig.notes, req.user.id]
    );

    for (const item of origItems) {
      await dbClient.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name_snapshot, model_no_snapshot,
          unit_price_snapshot, quantity, discount_type, discount, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newInv[0].id, item.product_id, item.product_name_snapshot, item.model_no_snapshot,
         item.unit_price_snapshot, item.quantity, item.discount_type, item.discount, item.line_total]
      );
    }

    await dbClient.query(
      `INSERT INTO invoice_status_history (invoice_id, new_status, changed_by) VALUES ($1,'Draft',$2)`,
      [newInv[0].id, req.user.id]
    );

    await dbClient.query('COMMIT');

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'invoice',
      entityId: newInv[0].id, description: `Duplicated invoice ${orig.invoice_number} → ${invoiceNumber}`, ipAddress: req.ip });

    return sendSuccess(res, 'Invoice duplicated', newInv[0], 201);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
};

// ─── PDF Export ────────────────────────────────────────────────────────────────
exports.exportPDF = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, c.full_name AS client_name, c.phone AS client_phone,
              c.email AS client_email, c.address AS client_address
       FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'Invoice not found', 404);

    const { rows: items } = await db.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [req.params.id]);

    const pdfBuffer = await generateInvoicePDF({
      invoice: rows[0],
      client: { full_name: rows[0].client_name, phone: rows[0].client_phone, email: rows[0].client_email, address: rows[0].client_address },
      items,
      company: { name: env.COMPANY_NAME, address: env.COMPANY_ADDRESS },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${rows[0].invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// ─── Send email to client ──────────────────────────────────────────────────────
exports.sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const { rows } = await db.query(
      `SELECT i.*, c.full_name AS client_name, c.email AS client_email,
              c.phone AS client_phone, c.address AS client_address
       FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = $1`,
      [id]
    );
    if (!rows[0]) return sendError(res, 'Invoice not found', 404);
    const inv = rows[0];

    if (!inv.client_email) return sendError(res, 'Client has no email address on record', 400);

    const { rows: items } = await db.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [id]);
    const pdfBuffer = await generateInvoicePDF({
      invoice: inv,
      client: { full_name: inv.client_name, phone: inv.client_phone, email: inv.client_email, address: inv.client_address },
      items,
      company: { name: env.COMPANY_NAME, address: env.COMPANY_ADDRESS },
    });

    await send({
      to: inv.client_email,
      subject: `Invoice ${inv.invoice_number} from ${env.COMPANY_NAME}`,
      html: baseTemplate('Invoice', `
        <h2>Invoice ${inv.invoice_number}</h2>
        <p>Dear ${inv.client_name},</p>
        <p>${message || `Please find your invoice attached. Total amount due: <strong>৳${parseFloat(inv.grand_total).toFixed(2)}</strong>.`}</p>
        <p>Invoice is attached to this email as a PDF.</p>
      `),
      text: `Invoice ${inv.invoice_number} – Total: ৳${inv.grand_total}`,
      attachments: [{
        filename: `${inv.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    await db.query(`UPDATE invoices SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1`, [id]);

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'invoice',
      entityId: id, description: `Emailed invoice ${inv.invoice_number} to ${inv.client_email}`, ipAddress: req.ip });

    return sendSuccess(res, `Invoice emailed to ${inv.client_email}`);
  } catch (err) { next(err); }
};

// ─── Post-invoice low stock check (fire-and-forget) ───────────────────────────
async function checkLowStockAfterInvoice(items, invoiceNumber) {
  const { send: sendEmail, baseTemplate } = require('../services/email.service');
  for (const item of items) {
    if (!item.product_id) continue;
    try {
      const { rows } = await db.query(
        `SELECT product_name, model_no, stock_quantity, stock_threshold FROM products WHERE id = $1`,
        [item.product_id]
      );
      const p = rows[0];
      if (!p || p.stock_quantity > p.stock_threshold) continue;

      const { rows: recent } = await db.query(
        `SELECT id FROM notifications WHERE type = 'low_stock' AND body ILIKE $1
         AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1`,
        [`%${item.product_id}%`]
      );
      if (recent.length) continue;

      await createNotificationForAdmins({
        type: 'low_stock',
        title: `Low Stock: ${p.product_name}`,
        body: `Only ${p.stock_quantity} units left (threshold: ${p.stock_threshold}) · ${item.product_id}`,
        link: `/products/${item.product_id}`,
      });

      const { rows: admins } = await db.query(
        `SELECT email FROM users WHERE role = 'admin' AND is_active = TRUE AND is_deleted = FALSE`
      );
      for (const admin of admins) {
        sendEmail({
          to: admin.email,
          subject: `⚠ Low Stock Alert: ${p.product_name}`,
          html: baseTemplate('Low Stock Alert', `
            <h2>Low Stock Alert</h2>
            <p>Product <strong>${p.product_name}</strong> (${p.model_no}) is running low.</p>
            <p>Current stock: <strong style="color:#f59e0b;">${p.stock_quantity} units</strong></p>
            <p>Threshold: ${p.stock_threshold} units</p>
            <p>Triggered by invoice: ${invoiceNumber}</p>
          `),
          text: `Low stock: ${p.product_name} – ${p.stock_quantity} units remaining`,
        }).catch(() => {});
      }
    } catch (err) {
      logger.error('Low stock check failed:', err.message);
    }
  }
}
