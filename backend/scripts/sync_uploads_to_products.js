const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function sync() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.error('Uploads folder does not exist:', uploadsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
  if (files.length === 0) {
    console.log('No image files found in uploads/');
    process.exit(0);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const file of files) {
      const name = path.parse(file).name; // without ext
      // Try match by barcode first
      const [rows] = await connection.execute('SELECT id, barcode, name FROM products WHERE barcode = ?', [name]);
      if (rows.length > 0) {
        const prod = rows[0];
        await connection.execute('UPDATE products SET image = ? WHERE id = ?', [file, prod.id]);
        console.log(`Set image ${file} -> product id=${prod.id} (barcode=${prod.barcode})`);
        continue;
      }

      // Next, try by id numeric
      if (/^\d+$/.test(name)) {
        const pid = Number(name);
        const [r2] = await connection.execute('SELECT id FROM products WHERE id = ?', [pid]);
        if (r2.length > 0) {
          await connection.execute('UPDATE products SET image = ? WHERE id = ?', [file, pid]);
          console.log(`Set image ${file} -> product id=${pid}`);
          continue;
        }
      }

      console.log(`No matching product for file ${file}, skipped.`);
    }
    await connection.commit();
    console.log('Sync completed.');
  } catch (err) {
    await connection.rollback();
    console.error('Error during sync:', err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

sync();
