require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stratix_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const randomPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${pwd.slice(0, 4)}${pwd.slice(4, 8)}${pwd.slice(8)}!`;
};

async function seed() {
  console.log('\n  ⬡  Stratix BMS — Seeding Database\n');

  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );

  if (rows.length > 0) {
    console.log('  ℹ  Admin user already exists. Skipping seed.\n');
    await pool.end();
    return;
  }

  const password = randomPassword();
  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, role, password_hash, designation, department, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email`,
    ['System Administrator', 'admin@stratix.com', 'admin', hash, 'Administrator', 'Management', true]
  );

  const adminId = result.rows[0].id;

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
    [adminId, hash]
  );

  console.log('  ✓ Admin account created\n');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │                 ADMIN CREDENTIALS                  │');
  console.log('  ├─────────────────────────────────────────────────────┤');
  console.log(`  │  Email:    admin@stratix.com                        │`);
  console.log(`  │  Password: ${password.padEnd(40)} │`);
  console.log('  ├─────────────────────────────────────────────────────┤');
  console.log('  │  ⚠  Change this password immediately after login!  │');
  console.log('  └─────────────────────────────────────────────────────┘\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
