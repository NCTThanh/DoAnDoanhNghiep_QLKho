const pool = require('../config/database');

// ====================== LẤY TẤT CẢ ĐƠN HÀNG ======================
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT o.*, 
             c.name as customer_name, 
             u.fullname as seller 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== LẤY CHI TIẾT ĐƠN HÀNG ======================
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [order] = await pool.execute(`
      SELECT o.*, c.name as customer_name, u.fullname as seller 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = ?
    `, [id]);

    if (order.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const [details] = await pool.execute(`
      SELECT od.*, p.name as product_name 
      FROM order_details od 
      JOIN products p ON od.product_id = p.id 
      WHERE od.order_id = ?
    `, [id]);

    res.json({ 
      success: true, 
      data: { 
        ...order[0], 
        items: details 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== TẠO ĐƠN HÀNG ======================
exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { customer_id, items, discount = 0 } = req.body;
    const user_id = 1; // TODO: Sau này lấy từ JWT

    if (!items || items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất 1 sản phẩm");
    }

    // Tạo order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_code, customer_id, user_id, total_amount, discount, final_amount, status, payment_status) 
       VALUES (?, ?, ?, 0, ?, 0, 'completed', 'paid')`,
      [`DH${Date.now()}`, customer_id || null, user_id, discount]
    );

    const orderId = orderResult.insertId;
    let totalAmount = 0;

    for (const item of items) {
      const subtotal = item.quantity * item.unit_price;
      totalAmount += subtotal;

      await connection.execute(
        `INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, subtotal]
      );

      // Trừ tồn kho
      await connection.execute(
        `UPDATE inventory SET quantity = quantity - ? 
         WHERE product_id = ? LIMIT 1`,
        [item.quantity, item.product_id]
      );
    }

    const finalAmount = totalAmount - discount;

    await connection.execute(
      `UPDATE orders SET total_amount = ?, final_amount = ? WHERE id = ?`,
      [totalAmount, finalAmount, orderId]
    );

    // Tạo hóa đơn
    await connection.execute(
      `INSERT INTO invoices (invoice_code, order_id, total_amount, status) 
       VALUES (?, ?, ?, 'issued')`,
      [`HD${Date.now()}`, orderId, finalAmount]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: "Tạo đơn hàng thành công",
      orderId,
      order_code: `DH${Date.now()}`,
      final_amount: finalAmount 
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// ====================== CẬP NHẬT TRẠNG THÁI ======================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.execute(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== XÓA / HỦY ĐƠN ======================
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, message: "Xóa đơn hàng thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};