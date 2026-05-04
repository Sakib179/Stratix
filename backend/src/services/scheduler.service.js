const cron = require('node-cron');
const db = require('../config/db');
const logger = require('../utils/logger');
const { createNotificationForAdmins } = require('./notification.service');
const { sendInvoiceEmail } = require('./email.service');

// Mark invoices as Overdue if past due_date and still Issued
const markOverdueInvoices = async () => {
  try {
    const { rows } = await db.query(
      `UPDATE invoices
       SET status = 'Overdue', updated_at = NOW()
       WHERE status = 'Issued' AND due_date < CURRENT_DATE
       RETURNING id, invoice_number, client_id, grand_total`
    );

    if (rows.length > 0) {
      logger.info(`Scheduler: marked ${rows.length} invoice(s) as Overdue`);

      for (const inv of rows) {
        await db.query(
          `INSERT INTO invoice_status_history (invoice_id, old_status, new_status, changed_by)
           VALUES ($1, 'Issued', 'Overdue', NULL)`,
          [inv.id]
        );

        await createNotificationForAdmins({
          type: 'warning',
          title: 'Invoice Overdue',
          message: `Invoice ${inv.invoice_number} is now overdue.`,
          link: `/invoices/${inv.id}`,
        });
      }
    }
  } catch (err) {
    logger.error('Scheduler markOverdue error:', err);
  }
};

// Send reminder emails for invoices due in 3 days
const sendDueReminders = async () => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, c.full_name AS client_name, c.email AS client_email
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       WHERE i.status = 'Issued'
         AND i.due_date = CURRENT_DATE + INTERVAL '3 days'
         AND c.email IS NOT NULL
         AND c.email_unsubscribed = FALSE`
    );

    for (const inv of rows) {
      try {
        const { rows: settings } = await db.query(
          `SELECT value FROM settings WHERE key IN ('company_name','company_address','company_email') ORDER BY key`
        );
        const settingsMap = {};
        settings.forEach((s) => { settingsMap[s.key] = s.value; });

        await sendInvoiceEmail({
          to: inv.client_email,
          clientName: inv.client_name,
          invoiceNumber: inv.invoice_number,
          dueDate: inv.due_date,
          grandTotal: inv.grand_total,
          companyName: settingsMap['company_name'] || 'Stratix',
          isReminder: true,
        });

        logger.info(`Scheduler: sent due reminder for invoice ${inv.invoice_number} to ${inv.client_email}`);
      } catch (emailErr) {
        logger.error(`Scheduler: failed to send reminder for ${inv.invoice_number}:`, emailErr);
      }
    }
  } catch (err) {
    logger.error('Scheduler sendDueReminders error:', err);
  }
};

const startScheduler = () => {
  // Run every day at 01:00 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Scheduler: running daily tasks');
    await markOverdueInvoices();
    await sendDueReminders();
  });

  logger.info('Scheduler: initialized (overdue check + due reminders at 01:00 daily)');
};

module.exports = { startScheduler };
