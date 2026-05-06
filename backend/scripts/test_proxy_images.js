const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pool = require('../config/database');

const idsToTest = [1,2];
const tmpDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

async function saveStreamToFile(stream, filePath) {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);
    writer.on('finish', () => resolve());
    writer.on('error', err => reject(err));
  });
}

async function run() {
  const connection = await pool.getConnection();
  try {
    for (const id of idsToTest) {
      const [rows] = await connection.execute('SELECT id, image FROM products WHERE id = ?', [id]);
      if (rows.length === 0) {
        console.log(`id=${id} not found`);
        continue;
      }
      const img = rows[0].image;
      if (!img) {
        console.log(`id=${id} has no image`);
        continue;
      }

      const isExternal = img.startsWith('http');
      const url = isExternal ? `http://localhost:5000/api/proxy-image?url=${encodeURIComponent(img)}` : `http://localhost:5000${img.startsWith('/')?img:'/'+img}`;
      console.log(`Testing id=${id} -> ${url}`);
      try {
        const res = await axios.get(url, { responseType: 'stream', timeout: 20000 });
        const ct = res.headers['content-type'] || 'application/octet-stream';
        const ext = ct.includes('png') ? '.png' : ct.includes('gif') ? '.gif' : '.jpg';
        const out = path.join(tmpDir, `proxy_test_${id}${ext}`);
        await saveStreamToFile(res.data, out);
        const size = fs.statSync(out).size;
        console.log(`id=${id} saved -> ${out} (${size} bytes) content-type=${ct}`);
      } catch (err) {
        console.error(`id=${id} proxy request failed:`, err.message || err);
      }
    }
  } catch (err) {
    console.error('Script error:', err.message || err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
