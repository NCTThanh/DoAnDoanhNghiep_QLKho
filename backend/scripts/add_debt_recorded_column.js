const pool = require('../config/database');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Altering purchase_orders to add debt_recorded column (if missing)...');
    await conn.execute(`
      ALTER TABLE purchase_orders
      ADD COLUMN IF NOT EXISTS debt_recorded TINYINT(1) DEFAULT 0
    `);
    console.log('Done.');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
