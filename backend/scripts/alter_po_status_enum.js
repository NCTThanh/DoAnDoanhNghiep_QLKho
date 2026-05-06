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
    console.log('Altering purchase_orders.status enum...');
    await pool.query("ALTER TABLE purchase_orders MODIFY status ENUM('draft','pending','completed','cancelled') DEFAULT 'draft'");
    console.log('Done.');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    await pool.end();
  }
})();
