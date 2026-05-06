const mysql = require('mysql2/promise');
(async ()=>{
  const conn = await mysql.createConnection({host:'localhost',user:'root',database:'bach_hoa_db',port:3366});
  const [rows] = await conn.execute(`
    SELECT s.id, s.supplier_code, s.name, (SELECT IFNULL(SUM(remaining_amount),0) FROM purchase_orders p WHERE p.supplier_id = s.id AND p.status != 'cancelled') AS computed_debt
    FROM suppliers s WHERE s.status = 'active'
  `);
  console.log(rows);
  await conn.end();
})();
