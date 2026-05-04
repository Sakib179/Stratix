require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stratix_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function runMigrations() {
  console.log('\n  ⬡  Stratix BMS — Running Migrations\n');

  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`  → Running: ${file}`);
    try {
      await pool.query(sql);
      console.log(`  ✓ Completed: ${file}\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${file}`);
      console.error(`    ${err.message}\n`);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('  ✓ All migrations completed successfully\n');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
