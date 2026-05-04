const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');

exports.listCategories = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM expense_categories ORDER BY name`);
    return sendSuccess(res, 'Categories fetched', rows);
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, color_hex = '#6366f1' } = req.body;
    if (!name) return sendError(res, 'name is required', 400);
    const { rows } = await db.query(
      `INSERT INTO expense_categories (name, color_hex) VALUES ($1,$2)
       ON CONFLICT (name) DO UPDATE SET color_hex = $2 RETURNING *`, [name, color_hex]
    );
    return sendSuccess(res, 'Category saved', rows[0], 201);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    const { search, category_id, date_from, date_to } = req.query;

    const conds = ['1=1']; const params = [];
    if (search)      { conds.push(`e.title ILIKE $${params.length+1}`); params.push(`%${search}%`); }
    if (category_id) { conds.push(`e.category_id = $${params.length+1}`); params.push(category_id); }
    if (date_from)   { conds.push(`e.expense_date >= $${params.length+1}`); params.push(date_from); }
    if (date_to)     { conds.push(`e.expense_date <= $${params.length+1}`); params.push(date_to); }
    const where = conds.join(' AND ');

    const [{ rows }, { rows: cnt }, { rows: agg }] = await Promise.all([
      db.query(`SELECT e.*, ec.name AS category_name, ec.color_hex
                FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id
                WHERE ${where} ORDER BY e.expense_date DESC, e.created_at DESC
                LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]),
      db.query(`SELECT COUNT(*) FROM expenses e WHERE ${where}`, params),
      db.query(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses e WHERE ${where}`, params),
    ]);

    const total = parseInt(cnt[0].count);
    return sendPaginated(res, 'Expenses fetched', rows, { page, limit, total, totalPages: Math.ceil(total / limit) }, { total_amount: parseFloat(agg[0].total) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, ec.name AS category_name, ec.color_hex
       FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.id = $1`, [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'Expense not found', 404);
    return sendSuccess(res, 'Expense fetched', rows[0]);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { category_id, title, amount, payment_method = 'Cash', reference_number, expense_date, notes } = req.body;
    if (!title || !amount) return sendError(res, 'title and amount are required', 400);

    const { rows } = await db.query(
      `INSERT INTO expenses (category_id, title, amount, payment_method, reference_number, expense_date, notes, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [category_id || null, title, amount, payment_method, reference_number || null, expense_date || new Date(), notes || null, req.user.id]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'expense',
      entityId: rows[0].id, description: `Recorded expense: ${title} (${amount})` });

    return sendSuccess(res, 'Expense recorded', rows[0], 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { category_id, title, amount, payment_method, reference_number, expense_date, notes } = req.body;
    const { rows } = await db.query(`SELECT id FROM expenses WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Expense not found', 404);

    await db.query(
      `UPDATE expenses SET category_id=$1, title=$2, amount=$3, payment_method=$4,
         reference_number=$5, expense_date=$6, notes=$7, updated_at=NOW() WHERE id=$8`,
      [category_id || null, title, amount, payment_method, reference_number || null, expense_date, notes || null, req.params.id]
    );
    return sendSuccess(res, 'Expense updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await db.query(`DELETE FROM expenses WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!rows[0]) return sendError(res, 'Expense not found', 404);
    return sendSuccess(res, 'Expense deleted');
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const { date_from, date_to, category_id } = req.query;
    const conds = ['1=1']; const params = [];
    if (date_from)   { conds.push(`e.expense_date >= $${params.length+1}`); params.push(date_from); }
    if (date_to)     { conds.push(`e.expense_date <= $${params.length+1}`); params.push(date_to); }
    if (category_id) { conds.push(`e.category_id = $${params.length+1}`); params.push(category_id); }

    const { rows } = await db.query(
      `SELECT e.expense_date, e.title, ec.name AS category, e.amount, e.payment_method, e.reference_number, e.notes
       FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE ${conds.join(' AND ')} ORDER BY e.expense_date DESC`, params
    );

    const header = 'Date,Title,Category,Amount,Payment Method,Reference,Notes\n';
    const body = rows.map((r) =>
      [r.expense_date, r.title, r.category || '', r.amount, r.payment_method, r.reference_number || '', (r.notes || '').replace(/,/g, ';')]
        .map((v) => `"${v}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(header + body);
  } catch (err) { next(err); }
};
