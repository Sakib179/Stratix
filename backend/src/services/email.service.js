const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      secure: env.SMTP_PORT === 465,
    });
  }
  return transporter;
};

const send = async ({ to, subject, html, text }) => {
  if (!env.SMTP_HOST) {
    logger.warn(`[Email skipped - no SMTP configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1e; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid rgba(99,102,241,0.2); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; color: #e5e7eb; }
    .body h2 { color: #f9fafb; font-size: 20px; margin: 0 0 16px; }
    .body p { line-height: 1.6; color: #9ca3af; margin: 0 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .code { background: #1f2937; border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6366f1; margin: 16px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(99,102,241,0.1); text-align: center; color: #4b5563; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⬡ Stratix</h1>
      <p>Business Management System</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${env.COMPANY_NAME}. This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

const sendWelcomeEmail = async ({ to, fullName, temporaryPassword }) => {
  await send({
    to,
    subject: `Welcome to ${env.COMPANY_NAME} — Your Account is Ready`,
    html: baseTemplate('Welcome', `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your account has been created. Use the credentials below to log in for the first time.</p>
      <p><strong style="color:#f9fafb;">Email:</strong> <span style="color:#6366f1;">${to}</span></p>
      <p><strong style="color:#f9fafb;">Temporary Password:</strong></p>
      <div class="code">${temporaryPassword}</div>
      <p>You will be prompted to change your password after your first login.</p>
    `),
    text: `Welcome ${fullName}! Your login: ${to} / Password: ${temporaryPassword}`,
  });
};

const sendPasswordChangedEmail = async ({ to, fullName }) => {
  await send({
    to,
    subject: 'Your Stratix Password Was Changed',
    html: baseTemplate('Password Changed', `
      <h2>Password Updated</h2>
      <p>Hi ${fullName}, your password was recently changed.</p>
      <p>If you made this change, no further action is needed.</p>
      <p>If you did <strong>not</strong> make this change, please contact your administrator immediately.</p>
    `),
    text: `Hi ${fullName}, your Stratix password was changed. If this wasn't you, contact your admin.`,
  });
};

const sendAccountLockedEmail = async ({ to, fullName, minutesLocked }) => {
  await send({
    to,
    subject: 'Stratix Account Temporarily Locked',
    html: baseTemplate('Account Locked', `
      <h2>Account Locked</h2>
      <p>Hi ${fullName}, your account has been temporarily locked due to ${minutesLocked > 0 ? '5 consecutive failed login attempts' : 'suspicious activity'}.</p>
      <p>Your account will automatically unlock in <strong style="color:#f59e0b;">${minutesLocked} minutes</strong>.</p>
      <p>If this wasn't you, please contact your administrator immediately.</p>
    `),
    text: `Account locked. Unlocks in ${minutesLocked} minutes.`,
  });
};

const sendBackupNotificationEmail = async ({ to, status, fileName, fileSizeMb }) => {
  const isSuccess = status === 'success';
  await send({
    to,
    subject: `Stratix Backup ${isSuccess ? 'Completed' : 'Failed'}`,
    html: baseTemplate('Backup Notification', `
      <h2>Scheduled Backup ${isSuccess ? '✓ Completed' : '✗ Failed'}</h2>
      <p>A scheduled database backup has ${isSuccess ? 'completed successfully' : 'failed'}.</p>
      ${isSuccess ? `<p><strong>File:</strong> ${fileName}<br/><strong>Size:</strong> ${fileSizeMb}MB</p>` : ''}
      <p>Time: ${new Date().toLocaleString()}</p>
    `),
    text: `Backup ${status}: ${fileName}`,
  });
};

const sendInvoiceEmail = async ({ to, clientName, invoiceNumber, dueDate, grandTotal, companyName, isReminder = false, pdfBuffer }) => {
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtMoney = (n) => `৳${parseFloat(n || 0).toFixed(2)}`;
  const subject = isReminder
    ? `Payment Reminder: Invoice ${invoiceNumber} due ${fmtDate(dueDate)}`
    : `Invoice ${invoiceNumber} from ${companyName}`;

  await send({
    to,
    subject,
    html: baseTemplate(subject, `
      <h2>${isReminder ? 'Payment Reminder' : 'Your Invoice'}</h2>
      <p>Dear ${clientName},</p>
      <p>${isReminder
        ? `This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is due on <strong>${fmtDate(dueDate)}</strong>.`
        : `Please find attached invoice <strong>${invoiceNumber}</strong> from ${companyName}.`
      }</p>
      <p><strong>Amount Due:</strong> ${fmtMoney(grandTotal)}</p>
      <p><strong>Due Date:</strong> ${fmtDate(dueDate)}</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Thank you for your business.</p>
    `),
    text: `Invoice ${invoiceNumber} — Amount: ${fmtMoney(grandTotal)}, Due: ${fmtDate(dueDate)}`,
    attachments: pdfBuffer ? [{
      filename: `${invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : [],
  });
};

const sendLowStockAlert = async ({ to, productName, modelNo, stockQuantity, threshold }) => {
  await send({
    to,
    subject: `Low Stock Alert: ${productName}`,
    html: baseTemplate('Low Stock Alert', `
      <h2>Low Stock Warning</h2>
      <p>The following product has fallen below its stock threshold:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;font-weight:bold;">Product</td><td style="padding:8px;">${productName}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Model No</td><td style="padding:8px;">${modelNo}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Current Stock</td><td style="padding:8px;color:#ef4444;font-weight:bold;">${stockQuantity}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Threshold</td><td style="padding:8px;">${threshold}</td></tr>
      </table>
      <p>Please restock this item as soon as possible.</p>
    `),
    text: `Low stock alert: ${productName} (${modelNo}) — Current: ${stockQuantity}, Threshold: ${threshold}`,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  await send({
    to,
    subject: 'Reset Your Stratix Password',
    html: baseTemplate('Password Reset', `
      <h2>Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your Stratix account. Click the button below to set a new password.</p>
      <p style="text-align:center;"><a href="${resetUrl}" class="btn">Reset Password</a></p>
      <p>This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="font-size:12px;color:#6b7280;">If the button doesn't work, copy and paste this URL into your browser:<br/><span style="color:#6366f1;">${resetUrl}</span></p>
    `),
    text: `Reset your Stratix password: ${resetUrl} (expires in 1 hour)`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendAccountLockedEmail,
  sendBackupNotificationEmail,
  sendInvoiceEmail,
  sendLowStockAlert,
  sendPasswordResetEmail,
  send,
  baseTemplate,
};
