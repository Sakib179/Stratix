const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ─── Overview KPIs ─────────────────────────────────────────────────────────────
exports.overview = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = Math.min(365, Math.max(7, parseInt(period) || 30));
    const since = `NOW() - INTERVAL '${days} days'`;
    const prevSince = `NOW() - INTERVAL '${days * 2} days'`;

    const [rev, prevRev, invoiceCount, prevCount, newClients, prevClients, topStatus, totals, products] =
      await Promise.all([
        db.query(`SELECT COALESCE(SUM(grand_total),0) AS total FROM invoices WHERE status='Paid' AND created_at >= ${since}`),
        db.query(`SELECT COALESCE(SUM(grand_total),0) AS total FROM invoices WHERE status='Paid' AND created_at >= ${prevSince} AND created_at < ${since}`),
        db.query(`SELECT COUNT(*) FROM invoices WHERE created_at >= ${since}`),
        db.query(`SELECT COUNT(*) FROM invoices WHERE created_at >= ${prevSince} AND created_at < ${since}`),
        db.query(`SELECT COUNT(*) FROM clients WHERE created_at >= ${since} AND deleted_at IS NULL`),
        db.query(`SELECT COUNT(*) FROM clients WHERE created_at >= ${prevSince} AND created_at < ${since} AND deleted_at IS NULL`),
        db.query(`SELECT status, COUNT(*) AS count FROM invoices GROUP BY status`),
        db.query(`SELECT COUNT(*) AS total_clients FROM clients WHERE deleted_at IS NULL`),
        db.query(`SELECT COUNT(*) AS total_products FROM products WHERE deleted_at IS NULL`),
      ]);

    const revenue          = parseFloat(rev.rows[0].total);
    const prevRevenue      = parseFloat(prevRev.rows[0].total);
    const invCount         = parseInt(invoiceCount.rows[0].count);
    const prevInvCount     = parseInt(prevCount.rows[0].count);
    const clients          = parseInt(newClients.rows[0].count);
    const prevClientCount  = parseInt(prevClients.rows[0].count);
    const totalClients     = parseInt(totals.rows[0].total_clients);
    const totalProducts    = parseInt(products.rows[0].total_products);

    const pct = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    const statusMap = {};
    topStatus.rows.forEach((r) => { statusMap[r.status] = parseInt(r.count); });

    return sendSuccess(res, 'Analytics overview', {
      revenue_period:     revenue,
      revenue_change_pct: pct(revenue, prevRevenue),
      total_invoices:     invCount,
      invoice_change_pct: pct(invCount, prevInvCount),
      total_clients:      totalClients,
      new_clients_period: clients,
      client_change_pct:  pct(clients, prevClientCount),
      total_products:     totalProducts,
      pending_invoices:   statusMap['Pending'] || 0,
      overdue_invoices:   statusMap['Overdue'] || 0,
      status_breakdown:   statusMap,
    });
  } catch (err) { next(err); }
};

// ─── Revenue over time ─────────────────────────────────────────────────────────
exports.revenueChart = async (req, res, next) => {
  try {
    const { period = '30', group_by = 'day' } = req.query;
    const days = Math.min(365, Math.max(7, parseInt(period) || 30));

    const truncMap = { day: 'day', week: 'week', month: 'month' };
    const trunc = truncMap[group_by] || 'day';

    const { rows } = await db.query(
      `SELECT
         DATE_TRUNC($1, created_at) AS period,
         COALESCE(SUM(CASE WHEN status = 'Paid' THEN grand_total ELSE 0 END), 0) AS revenue,
         COUNT(*) AS invoice_count
       FROM invoices
       WHERE created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY 1 ORDER BY 1`,
      [trunc, String(days)]
    );

    return sendSuccess(res, 'Revenue chart data', rows.map((r) => ({
      period: r.period,
      revenue: parseFloat(r.revenue),
      invoice_count: parseInt(r.invoice_count),
    })));
  } catch (err) { next(err); }
};

// ─── Top products ──────────────────────────────────────────────────────────────
exports.topProducts = async (req, res, next) => {
  try {
    const { period = '30', limit = '10' } = req.query;
    const days = Math.min(365, Math.max(7, parseInt(period) || 30));
    const lim  = Math.min(50, parseInt(limit) || 10);

    const { rows } = await db.query(
      `SELECT
         ii.product_name_snapshot AS product_name,
         ii.model_no_snapshot     AS model_no,
         SUM(ii.quantity)         AS units_sold,
         SUM(ii.line_total)       AS revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.status = 'Paid' AND i.created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY ii.product_name_snapshot, ii.model_no_snapshot
       ORDER BY revenue DESC
       LIMIT $2`,
      [String(days), lim]
    );

    return sendSuccess(res, 'Top products', rows.map((r) => ({
      product_name: r.product_name,
      model_no: r.model_no,
      units_sold: parseInt(r.units_sold),
      revenue: parseFloat(r.revenue),
    })));
  } catch (err) { next(err); }
};

// ─── Top clients ───────────────────────────────────────────────────────────────
exports.topClients = async (req, res, next) => {
  try {
    const { period = '30', limit = '10' } = req.query;
    const days = Math.min(365, Math.max(7, parseInt(period) || 30));
    const lim  = Math.min(50, parseInt(limit) || 10);

    const { rows } = await db.query(
      `SELECT
         c.id, c.full_name, c.phone, c.email,
         COUNT(i.id)           AS invoice_count,
         SUM(i.grand_total)    AS total_spent
       FROM clients c
       JOIN invoices i ON i.client_id = c.id
       WHERE i.status = 'Paid' AND i.created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY c.id
       ORDER BY total_spent DESC
       LIMIT $2`,
      [String(days), lim]
    );

    return sendSuccess(res, 'Top clients', rows.map((r) => ({
      ...r,
      invoice_count: parseInt(r.invoice_count),
      total_spent: parseFloat(r.total_spent),
    })));
  } catch (err) { next(err); }
};

// ─── Invoice aging ─────────────────────────────────────────────────────────────
exports.invoiceAging = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE due_date >= CURRENT_DATE)                               AS current_count,
         COALESCE(SUM(grand_total) FILTER (WHERE due_date >= CURRENT_DATE), 0)          AS current_amt,
         COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - 30) AS overdue_30_count,
         COALESCE(SUM(grand_total) FILTER (WHERE due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - 30), 0) AS overdue_30_amt,
         COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - 30 AND due_date >= CURRENT_DATE - 60) AS overdue_60_count,
         COALESCE(SUM(grand_total) FILTER (WHERE due_date < CURRENT_DATE - 30 AND due_date >= CURRENT_DATE - 60), 0) AS overdue_60_amt,
         COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - 60)                          AS overdue_90plus_count,
         COALESCE(SUM(grand_total) FILTER (WHERE due_date < CURRENT_DATE - 60), 0)     AS overdue_90plus_amt
       FROM invoices
       WHERE status IN ('Issued','Overdue')`
    );

    const r = rows[0];
    return sendSuccess(res, 'Invoice aging', [
      { bucket: 'Current',     count: parseInt(r.current_count),       amount: parseFloat(r.current_amt) },
      { bucket: '1–30 days',   count: parseInt(r.overdue_30_count),    amount: parseFloat(r.overdue_30_amt) },
      { bucket: '31–60 days',  count: parseInt(r.overdue_60_count),    amount: parseFloat(r.overdue_60_amt) },
      { bucket: '60+ days',    count: parseInt(r.overdue_90plus_count), amount: parseFloat(r.overdue_90plus_amt) },
    ]);
  } catch (err) { next(err); }
};

// ─── Stock summary ─────────────────────────────────────────────────────────────
exports.stockSummary = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE stock_quantity > stock_threshold)                           AS in_stock,
         COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= stock_threshold)   AS low_stock,
         COUNT(*) FILTER (WHERE stock_quantity = 0)                                         AS out_of_stock,
         COALESCE(SUM(unit_price * stock_quantity), 0)                                      AS inventory_value
       FROM products WHERE is_deleted = FALSE`
    );

    const { rows: critical } = await db.query(
      `SELECT product_name, model_no, stock_quantity, stock_threshold, unit_price
       FROM products WHERE stock_quantity <= stock_threshold AND is_deleted = FALSE
       ORDER BY stock_quantity ASC LIMIT 10`
    );

    const r = rows[0];
    return sendSuccess(res, 'Stock summary', {
      in_stock: parseInt(r.in_stock),
      low_stock: parseInt(r.low_stock),
      out_of_stock: parseInt(r.out_of_stock),
      inventory_value: parseFloat(r.inventory_value),
      critical_items: critical,
    });
  } catch (err) { next(err); }
};
