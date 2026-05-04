const PDFDocument = require('pdfkit');

const NAVY   = '#0a0f1e';
const INDIGO = '#6366f1';
const VIOLET = '#8b5cf6';
const GRAY   = '#6b7280';
const LGRAY  = '#f3f4f6';
const BLACK  = '#111827';
const WHITE  = '#ffffff';
const RED    = '#ef4444';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtMoney = (n) => `৳${parseFloat(n || 0).toFixed(2)}`;

const generateInvoicePDF = ({ invoice, client, items, company }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - 100;
      const ML = 50;

      // ─── Header band ────────────────────────────────────────────────────────
      doc.rect(ML, 40, W, 90).fill(NAVY);

      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
         .text(company.name || 'Stratix', ML + 20, 60);
      if (company.address) {
        doc.fillColor('#9ca3af').font('Helvetica').fontSize(9)
           .text(company.address, ML + 20, 88, { width: 200 });
      }

      doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(26)
         .text('INVOICE', ML, 55, { align: 'right', width: W });
      doc.fillColor(WHITE).font('Helvetica').fontSize(11)
         .text(invoice.invoice_number, ML, 87, { align: 'right', width: W });

      // ─── Info row (Bill To + Invoice Details) ──────────────────────────────
      let y = 155;

      doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(8)
         .text('BILL TO', ML, y);

      doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12)
         .text(client.full_name, ML, y + 14);

      let infoY = y + 30;
      doc.fillColor(GRAY).font('Helvetica').fontSize(10);
      if (client.phone)   { doc.text(client.phone,   ML, infoY); infoY += 14; }
      if (client.email)   { doc.text(client.email,   ML, infoY); infoY += 14; }
      if (client.address) { doc.text(client.address, ML, infoY, { width: 220 }); }

      // Right side details
      const detailX = ML + W - 170;
      let detailY = y;
      const addDetail = (label, value) => {
        doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(label, detailX, detailY);
        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(10).text(value, detailX, detailY + 10);
        detailY += 28;
      };
      addDetail('DATE ISSUED',    fmtDate(invoice.created_at));
      addDetail('DUE DATE',       fmtDate(invoice.due_date));
      addDetail('STATUS',         (invoice.status || '').toUpperCase());

      // ─── Divider ────────────────────────────────────────────────────────────
      y = Math.max(detailY, infoY) + 20;
      doc.moveTo(ML, y).lineTo(ML + W, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      y += 16;

      // ─── Table header ────────────────────────────────────────────────────────
      const cols = [
        { label: '#',        x: ML,       w: 24,  align: 'left' },
        { label: 'PRODUCT',  x: ML + 28,  w: 160, align: 'left' },
        { label: 'MODEL',    x: ML + 192, w: 80,  align: 'left' },
        { label: 'QTY',      x: ML + 276, w: 36,  align: 'right' },
        { label: 'UNIT',     x: ML + 316, w: 70,  align: 'right' },
        { label: 'DISC',     x: ML + 390, w: 55,  align: 'right' },
        { label: 'TOTAL',    x: ML + 449, w: W - 399, align: 'right' },
      ];

      doc.rect(ML, y, W, 26).fill(INDIGO);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8);
      cols.forEach((c) => doc.text(c.label, c.x, y + 9, { width: c.w, align: c.align }));
      y += 26;

      // ─── Table rows ──────────────────────────────────────────────────────────
      items.forEach((item, i) => {
        const rowH = 28;
        if (i % 2 === 0) doc.rect(ML, y, W, rowH).fill(LGRAY);

        doc.fillColor(BLACK).font('Helvetica').fontSize(9);
        cols[0].align = 'left';
        doc.text(String(i + 1), cols[0].x, y + 9, { width: cols[0].w });
        doc.text(item.product_name_snapshot, cols[1].x, y + 9, { width: cols[1].w });
        doc.text(item.model_no_snapshot,     cols[2].x, y + 9, { width: cols[2].w });
        doc.text(String(item.quantity),      cols[3].x, y + 9, { width: cols[3].w, align: 'right' });
        doc.text(fmtMoney(item.unit_price_snapshot), cols[4].x, y + 9, { width: cols[4].w, align: 'right' });

        const discText = parseFloat(item.discount) > 0
          ? (item.discount_type === 'percent' ? `${item.discount}%` : fmtMoney(item.discount))
          : '—';
        doc.text(discText,              cols[5].x, y + 9, { width: cols[5].w, align: 'right' });
        doc.text(fmtMoney(item.line_total), cols[6].x, y + 9, { width: cols[6].w, align: 'right' });

        y += rowH;
      });

      // ─── Totals ──────────────────────────────────────────────────────────────
      y += 16;
      const addTotalRow = (label, value, bold = false, color = BLACK) => {
        doc.fillColor(GRAY).font('Helvetica').fontSize(10)
           .text(label, ML + W - 220, y, { width: 140, align: 'right' });
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
           .text(value, ML + W - 76, y, { width: 76, align: 'right' });
        y += 20;
      };

      addTotalRow('Subtotal',    fmtMoney(invoice.subtotal));
      if (parseFloat(invoice.discount_amount) > 0) {
        addTotalRow('Discount',  `− ${fmtMoney(invoice.discount_amount)}`, false, RED);
      }
      if (parseFloat(invoice.tax_amount) > 0) {
        addTotalRow(`Tax (${invoice.tax_rate}%)`, fmtMoney(invoice.tax_amount));
      }

      doc.moveTo(ML + W - 220, y).lineTo(ML + W, y).strokeColor(INDIGO).lineWidth(1).stroke();
      y += 6;
      addTotalRow('TOTAL DUE',  fmtMoney(invoice.grand_total), true, INDIGO);

      // ─── Notes ───────────────────────────────────────────────────────────────
      if (invoice.notes) {
        y += 20;
        doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(9).text('NOTES', ML, y);
        y += 14;
        doc.fillColor(BLACK).font('Helvetica').fontSize(9).text(invoice.notes, ML, y, { width: W * 0.55 });
      }

      // ─── Footer ──────────────────────────────────────────────────────────────
      doc.fillColor('#9ca3af').font('Helvetica').fontSize(8)
         .text(
           `${company.name || 'Stratix'} · ${invoice.invoice_number} · Generated ${fmtDate(new Date().toISOString())}`,
           ML, 790, { align: 'center', width: W }
         );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
