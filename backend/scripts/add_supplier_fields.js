const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'bach_hoa_db',
    port: 3366,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  try {
    console.log('Adding tax_id and email columns to suppliers if missing...');
    await pool.query(`
      ALTER TABLE suppliers
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `);
    console.log('Done.');
  } catch (err) {
    console.error('Error altering suppliers table:', err.message);
  } finally {
    await pool.end();
  }
})();
