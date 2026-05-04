const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const { logAction } = require('../middleware/logAction.middleware');
const { createNotificationForAdmins } = require('../services/notification.service');
const { sendLowStockAlert } = require('../services/email.service');
const logger = require('../utils/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildProductFilters = (query) => {
  const conditions = ['p.is_deleted = FALSE'];
  const params = [];
  let idx = 1;

  if (query.search) {
    conditions.push(`(p.product_name ILIKE $${idx} OR p.model_no ILIKE $${idx} OR p.serial_no ILIKE $${idx})`);
    params.push(`%${query.search}%`);
    idx++;
  }
  if (query.category_id) {
    const cats = Array.isArray(query.category_id) ? query.category_id : [query.category_id];
    conditions.push(`p.category_id = ANY($${idx}::uuid[])`);
    params.push(cats);
    idx++;
  }
  if (query.min_price) {
    conditions.push(`p.unit_price >= $${idx}`);
    params.push(parseFloat(query.min_price));
    idx++;
  }
  if (query.max_price) {
    conditions.push(`p.unit_price <= $${idx}`);
    params.push(parseFloat(query.max_price));
    idx++;
  }
  if (query.stock === 'in') {
    conditions.push(`p.stock_quantity > p.stock_threshold`);
  } else if (query.stock === 'low') {
    conditions.push(`p.stock_quantity > 0 AND p.stock_quantity <= p.stock_threshold`);
  } else if (query.stock === 'out') {
    conditions.push(`p.stock_quantity = 0`);
  }
  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    conditions.push(`p.tags && $${idx}::text[]`);
    params.push(tags);
    idx++;
  }

  const allowed = ['product_name', 'model_no', 'unit_price', 'stock_quantity', 'created_at', 'serial_no'];
  const sortField = allowed.includes(query.sort) ? `p.${query.sort}` : 'p.created_at';
  const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';

  return { conditions, params, sortField, sortOrder, nextIdx: idx };
};

// ─── List Products ─────────────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = [20, 50, 100].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;

    const { conditions, params, sortField, sortOrder, nextIdx } = buildProductFilters(req.query);
    const where = conditions.join(' AND ');

    const { rows } = await db.query(
      `SELECT p.*, pc.name AS category_name, pc.color_hex AS category_color
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE ${where}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM products p WHERE ${where}`,
      params
    );

    return sendPaginated(res, 'Products fetched', rows, {
      page, limit, total: parseInt(countRows[0].count),
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) { next(err); }
};

// ─── Get Single ────────────────────────────────────────────────────────────────
exports.get = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, pc.name AS category_name, pc.color_hex AS category_color
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = $1 AND p.is_deleted = FALSE`,
      [req.params.id]
    );
    if (!rows[0]) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, 'Product fetched', rows[0]);
  } catch (err) { next(err); }
};

// ─── Create ────────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { product_name, model_no, serial_no, category_id, description,
            unit_price, stock_quantity, stock_threshold, tags } = req.body;

    if (!product_name || !model_no || unit_price === undefined) {
      return sendError(res, 'product_name, model_no, and unit_price are required', 400);
    }
    if (parseFloat(unit_price) < 0) return sendError(res, 'unit_price cannot be negative', 400);

    const { rows: dup } = await db.query(`SELECT id FROM products WHERE model_no = $1 AND is_deleted = FALSE`, [model_no]);
    if (dup.length) return sendError(res, 'A product with this model number already exists', 409);

    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : null;
    const tagsArr = typeof tags === 'string' ? JSON.parse(tags || '[]') : (tags || []);

    const { rows } = await db.query(
      `INSERT INTO products (product_name, model_no, serial_no, category_id, description, unit_price,
        stock_quantity, stock_threshold, tags, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [product_name, model_no, serial_no || null, category_id || null, description || null,
       parseFloat(unit_price), parseInt(stock_quantity || 0), parseInt(stock_threshold || 10),
       tagsArr, imagePath]
    );

    await logAction({ userId: req.user.id, action: 'CREATE', entityType: 'product',
      entityId: rows[0].id, description: `Created product: ${product_name} (${model_no})`, ipAddress: req.ip });

    return sendSuccess(res, 'Product created successfully', rows[0], 201);
  } catch (err) { next(err); }
};

// ─── Update ────────────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_name, model_no, serial_no, category_id, description,
            unit_price, stock_quantity, stock_threshold, tags } = req.body;

    const { rows: existing } = await db.query(
      `SELECT * FROM products WHERE id = $1 AND is_deleted = FALSE`, [id]
    );
    if (!existing[0]) return sendError(res, 'Product not found', 404);

    if (model_no && model_no !== existing[0].model_no) {
      const { rows: dup } = await db.query(
        `SELECT id FROM products WHERE model_no = $1 AND id != $2 AND is_deleted = FALSE`, [model_no, id]
      );
      if (dup.length) return sendError(res, 'A product with this model number already exists', 409);
    }

    if (unit_price !== undefined && parseFloat(unit_price) < 0) {
      return sendError(res, 'unit_price cannot be negative', 400);
    }

    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : existing[0].image;
    const tagsArr = tags !== undefined
      ? (typeof tags === 'string' ? JSON.parse(tags || '[]') : tags)
      : existing[0].tags;

    const { rows } = await db.query(
      `UPDATE products SET
         product_name = COALESCE($1, product_name),
         model_no = COALESCE($2, model_no),
         serial_no = COALESCE($3, serial_no),
         category_id = $4,
         description = COALESCE($5, description),
         unit_price = COALESCE($6, unit_price),
         stock_quantity = COALESCE($7, stock_quantity),
         stock_threshold = COALESCE($8, stock_threshold),
         tags = $9,
         image = $10,
         updated_at = NOW()
       WHERE id = $11 AND is_deleted = FALSE RETURNING *`,
      [product_name, model_no, serial_no, category_id || existing[0].category_id,
       description, unit_price !== undefined ? parseFloat(unit_price) : null,
       stock_quantity !== undefined ? parseInt(stock_quantity) : null,
       stock_threshold !== undefined ? parseInt(stock_threshold) : null,
       tagsArr, imagePath, id]
    );

    if (req.file && existing[0].image && fs.existsSync(existing[0].image)) {
      fs.unlinkSync(existing[0].image);
    }

    await logAction({ userId: req.user.id, action: 'UPDATE', entityType: 'product',
      entityId: id, description: `Updated product: ${rows[0].product_name}`, ipAddress: req.ip });

    return sendSuccess(res, 'Product updated successfully', rows[0]);
  } catch (err) { next(err); }
};

// ─── Soft Delete ───────────────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: invCheck } = await db.query(
      `SELECT COUNT(*) FROM invoice_items WHERE product_id = $1`, [id]
    );
    if (parseInt(invCheck[0].count) > 0) {
      await db.query(`UPDATE products SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`, [id]);
    } else {
      await db.query(`UPDATE products SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`, [id]);
    }

    const { rows } = await db.query(`SELECT product_name FROM products WHERE id = $1`, [id]);
    await logAction({ userId: req.user.id, action: 'DELETE', entityType: 'product',
      entityId: id, description: `Deleted product: ${rows[0]?.product_name}`, ipAddress: req.ip });

    return sendSuccess(res, 'Product deleted successfully');
  } catch (err) { next(err); }
};

// ─── Categories ────────────────────────────────────────────────────────────────
exports.listCategories = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM product_categories ORDER BY name ASC`);
    return sendSuccess(res, 'Categories fetched', rows);
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, color_hex = '#6366f1' } = req.body;
    if (!name) return sendError(res, 'Category name is required', 400);

    const { rows } = await db.query(
      `INSERT INTO product_categories (name, color_hex) VALUES ($1, $2) RETURNING *`,
      [name, color_hex]
    );
    return sendSuccess(res, 'Category created', rows[0], 201);
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_deleted = FALSE`, [id]
    );
    if (parseInt(rows[0].count) > 0) {
      return sendError(res, 'Cannot delete a category that has products assigned to it', 400);
    }
    await db.query(`DELETE FROM product_categories WHERE id = $1`, [id]);
    return sendSuccess(res, 'Category deleted');
  } catch (err) { next(err); }
};

// ─── Bulk CSV Import ───────────────────────────────────────────────────────────
exports.bulkImport = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'CSV file is required', 400);

    const Papa = require('papaparse');
    const content = fs.readFileSync(req.file.path, 'utf8');
    const { data: rows, errors: parseErrors } = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (parseErrors.length > 0) {
      return sendError(res, 'CSV parsing failed', 400, parseErrors.map((e) => e.message));
    }

    const imported = [];
    const skipped = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.product_name) { skipped.push({ row: rowNum, reason: 'Missing product_name' }); continue; }
      if (!row.model_no)     { skipped.push({ row: rowNum, reason: 'Missing model_no' }); continue; }
      if (!row.unit_price || isNaN(parseFloat(row.unit_price)) || parseFloat(row.unit_price) < 0) {
        skipped.push({ row: rowNum, reason: 'Invalid unit_price' }); continue;
      }

      try {
        const { rows: dup } = await db.query(
          `SELECT id FROM products WHERE model_no = $1 AND is_deleted = FALSE`, [row.model_no]
        );
        if (dup.length) { skipped.push({ row: rowNum, reason: `Duplicate model_no: ${row.model_no}` }); continue; }

        await db.query(
          `INSERT INTO products (product_name, model_no, serial_no, description, unit_price, stock_quantity, stock_threshold, tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [row.product_name, row.model_no, row.serial_no || null, row.description || null,
           parseFloat(row.unit_price), parseInt(row.stock_quantity || 0), parseInt(row.stock_threshold || 10),
           row.tags ? row.tags.split(',').map((t) => t.trim()) : []]
        );
        imported.push(row.model_no);
      } catch (err) {
        skipped.push({ row: rowNum, reason: err.message });
      }
    }

    fs.unlinkSync(req.file.path);

    await logAction({ userId: req.user.id, action: 'IMPORT', entityType: 'product',
      description: `CSV import: ${imported.length} products imported, ${skipped.length} skipped`, ipAddress: req.ip });

    return sendSuccess(res, `Import complete: ${imported.length} imported, ${skipped.length} skipped`, { imported: imported.length, skipped });
  } catch (err) { next(err); }
};

// ─── CSV Template Download ─────────────────────────────────────────────────────
exports.csvTemplate = (req, res) => {
  const headers = 'product_name,model_no,serial_no,description,unit_price,stock_quantity,stock_threshold,tags\n';
  const sample  = 'Sample Product,MDL-001,SN-001,Product description,999.99,100,10,"electronics,featured"\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.send(headers + sample);
};
