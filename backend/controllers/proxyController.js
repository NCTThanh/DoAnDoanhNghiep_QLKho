const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

exports.proxyImage = async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url');

  try {
    console.log('[proxyImage] requested url:', url);
    // create a cache filename based on url hash
    const hash = crypto.createHash('sha1').update(url).digest('hex');
    let ext = path.extname(new URL(url).pathname) || '';
    if (!ext) ext = '.jpg';
    const filename = `${hash}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    if (fs.existsSync(filepath)) {
      console.log('[proxyImage] serving cached file:', filepath);
      return res.sendFile(filepath);
    }

    // download and save
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log('[proxyImage] downloaded and saved to:', filepath);
    res.type(contentType);
    return res.sendFile(filepath);
  } catch (err) {
    console.error('proxyImage error:', err.message || err);
    // serve a small inline SVG placeholder instead of failing
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="10">No Img</text></svg>`;
    res.type('image/svg+xml');
    return res.send(svg);
  }
};
