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
    console.log('Creating supplier_payments table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS supplier_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT,
        po_id INT,
        payment_date DATETIME,
        amount DECIMAL(15,2),
        payment_method VARCHAR(50),
        bank_account VARCHAR(100),
        transaction_code VARCHAR(100),
        note TEXT,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log('Done.');
  } catch (err) {
    console.error('Error creating table:', err.message);
  } finally {
    await pool.end();
  }
})();
