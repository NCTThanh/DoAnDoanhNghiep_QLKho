const pool = require('../config/database');

async function main() {
  try {
    const [pos] = await pool.execute('SELECT id, po_code, supplier_id, po_date, total_amount, status, created_at FROM purchase_orders ORDER BY id DESC LIMIT 10');
    console.log('Latest purchase_orders:', JSON.stringify(pos, null, 2));

    for (const po of pos) {
      const [details] = await pool.execute('SELECT id, product_id, quantity, unit_price, total_price, received_quantity FROM purchase_order_details WHERE po_id = ?', [po.id]);
      console.log(`Details for PO ${po.id} (${po.po_code}):`, JSON.stringify(details, null, 2));
    }
  } catch (err) {
    console.error('Error querying purchase orders:', err);
  } finally {
    process.exit(0);
  }
}

main();
