/**
 * Creates a test employee account.
 * Run with: node scripts/create-employee.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stratix_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const EMAIL    = 'employee@stratix.com';
const PASSWORD = 'Employee@123';

async function main() {
  console.log('\n  ⬡  Stratix BMS — Create Employee Account\n');

  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE email = $1`, [EMAIL]
  );

  if (existing[0]) {
    console.log(`  ℹ  Account already exists: ${EMAIL}\n`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 12);

  const { rows } = await pool.query(
    `INSERT INTO users (full_name, email, role, password_hash, designation, department, is_active, email_verified)
     VALUES ($1,$2,'employee',$3,$4,$5,TRUE,TRUE)
     RETURNING id, email`,
    ['Test Employee', EMAIL, hash, 'Staff', 'Operations']
  );

  const userId = rows[0].id;

  // Grant access to all standard modules
  const modules = ['products', 'invoices', 'clients', 'analytics'];
  for (const mod of modules) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, module, can_access) VALUES ($1,$2,TRUE)
       ON CONFLICT (user_id, module) DO UPDATE SET can_access = TRUE`,
      [userId, mod]
    );
  }

  console.log('  ✓ Employee account created\n');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log('  │           EMPLOYEE CREDENTIALS             │');
  console.log('  ├────────────────────────────────────────────┤');
  console.log(`  │  Email:    ${EMAIL.padEnd(32)}│`);
  console.log(`  │  Password: ${PASSWORD.padEnd(32)}│`);
  console.log('  ├────────────────────────────────────────────┤');
  console.log('  │  Role: employee  (limited permissions)     │');
  console.log('  └────────────────────────────────────────────┘\n');

  await pool.end();
}

main().catch((err) => {
  console.error('  ✗ Error:', err.message);
  process.exit(1);
});
