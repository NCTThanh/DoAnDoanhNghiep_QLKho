const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pool = require('../config/database');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const contentTypeToExt = (ct) => {
  if (!ct) return '.jpg';
  if (ct.includes('jpeg')) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('gif')) return '.gif';
  return '.jpg';
};

async function downloadToFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios.get(url, { responseType: 'stream', timeout: 20000 });
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    let error = null;
    writer.on('error', err => { error = err; writer.close(); reject(err); });
    writer.on('close', () => { if (!error) resolve(); });
  });
}

async function run() {
  try {
    const [rows] = await pool.execute("SELECT id, barcode, image FROM products WHERE image IS NOT NULL AND (image LIKE 'http%' OR image LIKE 'https%')");
    if (!rows.length) {
      console.log('No external images found to download.');
      process.exit(0);
    }

    for (const r of rows) {
      const url = r.image;
      const id = r.id;
      const barcode = r.barcode || id;
      try {
        // determine extension from URL path or HEAD content-type
        let ext = path.extname(new URL(url).pathname) || '';
        if (!ext) {
          // try HEAD to get content-type
          try {
            const head = await axios.head(url, { timeout: 10000 });
            ext = contentTypeToExt((head.headers['content-type'] || ''));
          } catch (e) {
            ext = '.jpg';
          }
        }
        if (!ext.startsWith('.')) ext = '.' + ext;

        let filename = `${id}_${barcode}${ext}`.replace(/[^a-zA-Z0-9_\-.]/g, '');
        let filePath = path.join(uploadsDir, filename);
        // ensure unique
        if (fs.existsSync(filePath)) {
          const t = Date.now();
          filename = `${id}_${barcode}_${t}${ext}`;
          filePath = path.join(uploadsDir, filename);
        }

        await downloadToFile(url, filePath);
        // update DB to point to local uploads path
        await pool.execute('UPDATE products SET image = ? WHERE id = ?', [`/uploads/${filename}`, id]);
        console.log(`Downloaded and updated product id=${id} -> ${filename}`);
      } catch (err) {
        console.error(`Failed for product id=${r.id}, url=${r.image}:`, err.message || err);
      }
    }
    console.log('Done processing external images.');
  } catch (err) {
    console.error('Script error:', err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
