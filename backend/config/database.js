
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',           
  password: '',           
  port: 3307,
  database: 'bach_hoa_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Database pool đã được tạo!');
module.exports = pool;