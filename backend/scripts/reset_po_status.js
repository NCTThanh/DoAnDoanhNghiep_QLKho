const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'bach_hoa_db', port: 3366 });
  try {
    await conn.execute("UPDATE purchase_orders SET status='draft' WHERE id = 11");
    console.log('PO 11 status reset to draft');
  } catch (err) {
    console.error(err.message);
  } finally {
    await conn.end();
  }
})();
