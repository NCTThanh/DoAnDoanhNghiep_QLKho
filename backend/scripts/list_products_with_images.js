const pool = require('../config/database');

(async () => {
  try {
    const [rows] = await pool.execute("SELECT id, name, barcode, image FROM products WHERE image IS NOT NULL AND image <> '' ORDER BY id ASC LIMIT 200");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  }
})();
