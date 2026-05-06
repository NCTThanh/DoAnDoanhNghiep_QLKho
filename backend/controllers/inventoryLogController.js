const pool = require('../config/database');

// ====================== GET INVENTORY LOG ======================
exports.getInventoryLog = async (req, res) => {
  try {
    const { product_id, transaction_type, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        il.id, il.product_id, p.barcode as product_code, p.name as product_name,
        il.transaction_type, il.quantity_change, il.quantity_before, il.quantity_after,
        il.reference_id, il.reference_type, il.supplier_id, s.name as supplier_name,
        il.reason, il.created_by, il.created_at
      FROM inventory_log il
      LEFT JOIN products p ON il.product_id = p.id
      LEFT JOIN suppliers s ON il.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ` AND il.product_id = ?`;
      params.push(product_id);
    }

    if (transaction_type) {
      query += ` AND il.transaction_type = ?`;
      params.push(transaction_type);
    }

    if (start_date) {
      query += ` AND DATE(il.created_at) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(il.created_at) <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY il.created_at DESC LIMIT 500`;

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi lấy lịch sử kho:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET PRODUCT HISTORY ======================
exports.getProductHistory = async (req, res) => {
  try {
    const { product_id } = req.params;

    // Lấy sản phẩm
    const [productRows] = await pool.execute(
      'SELECT id, barcode as product_code, name FROM products WHERE id = ?',
      [product_id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Lấy tồn kho hiện tại
    const [invRows] = await pool.execute(
      'SELECT quantity FROM inventory WHERE product_id = ?',
      [product_id]
    );
    const currentStock = invRows.length > 0 ? invRows[0].quantity : 0;

    // Lấy lịch sử
    const [history] = await pool.execute(`
      SELECT 
        DATE_FORMAT(il.created_at, '%d/%m/%Y') as date,
        il.transaction_type,
        il.quantity_change,
        il.quantity_before,
        il.quantity_after,
        s.name as supplier_name,
        il.reason
      FROM inventory_log il
      LEFT JOIN suppliers s ON il.supplier_id = s.id
      WHERE il.product_id = ?
      ORDER BY il.created_at DESC
    `, [product_id]);

    res.json({
      success: true,
      data: {
        product: productRows[0],
        current_stock: currentStock,
        history
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
