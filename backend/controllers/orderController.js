const pool = require('../config/database');

const tableExists = async (connectionOrPool, tableName) => {
  const [rows] = await connectionOrPool.execute(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
};

const columnExists = async (connectionOrPool, tableName, columnName) => {
  const [rows] = await connectionOrPool.execute(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
};

const ensureSalesSchema = async (connectionOrPool) => {
  const hasOrders = await tableExists(connectionOrPool, 'orders');
  if (!hasOrders) {
    await connectionOrPool.execute(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(50) UNIQUE,
        customer_id INT NULL,
        user_id INT NULL,
        total_amount DECIMAL(15,2) DEFAULT 0,
        discount DECIMAL(15,2) DEFAULT 0,
        final_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'completed',
        payment_status VARCHAR(30) DEFAULT 'paid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  const ordersColumns = [
    { name: 'order_code', sql: "ALTER TABLE orders ADD COLUMN order_code VARCHAR(50) UNIQUE NULL AFTER id" },
    { name: 'customer_id', sql: "ALTER TABLE orders ADD COLUMN customer_id INT NULL AFTER order_code" },
    { name: 'user_id', sql: "ALTER TABLE orders ADD COLUMN user_id INT NULL AFTER customer_id" },
    { name: 'discount', sql: "ALTER TABLE orders ADD COLUMN discount DECIMAL(15,2) DEFAULT 0 AFTER total_amount" },
    { name: 'final_amount', sql: "ALTER TABLE orders ADD COLUMN final_amount DECIMAL(15,2) DEFAULT 0 AFTER discount" },
    { name: 'status', sql: "ALTER TABLE orders ADD COLUMN status VARCHAR(30) DEFAULT 'completed' AFTER final_amount" },
    { name: 'payment_status', sql: "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'paid' AFTER status" },
    { name: 'updated_at', sql: "ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at" }
  ];

  for (const col of ordersColumns) {
    const exists = await columnExists(connectionOrPool, 'orders', col.name);
    if (!exists) {
      await connectionOrPool.execute(col.sql);
    }
  }

  const hasOrderDetails = await tableExists(connectionOrPool, 'order_details');
  if (!hasOrderDetails) {
    await connectionOrPool.execute(`
      CREATE TABLE order_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        subtotal DECIMAL(15,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX(order_id),
        INDEX(product_id)
      )
    `);
  }

  const hasInvoices = await tableExists(connectionOrPool, 'invoices');
  if (!hasInvoices) {
    await connectionOrPool.execute(`
      CREATE TABLE invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_code VARCHAR(50) UNIQUE,
        order_id INT NOT NULL,
        total_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'issued',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX(order_id)
      )
    `);
  }
};

// ====================== LẤY TẤT CẢ ĐƠN HÀNG ======================
exports.getAllOrders = async (req, res) => {
  try {
    await ensureSalesSchema(pool);
    const { search, status, start_date, end_date } = req.query;
    const hasCustomers = await tableExists(pool, 'customers');
    const hasUsers = await tableExists(pool, 'users');
    const userNameField = hasUsers
      ? ((await columnExists(pool, 'users', 'fullname')) ? 'fullname' : ((await columnExists(pool, 'users', 'full_name')) ? 'full_name' : null))
      : null;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      if (hasCustomers) {
        whereClause += ' AND (o.order_code LIKE ? OR c.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      } else {
        whereClause += ' AND o.order_code LIKE ?';
        params.push(`%${search}%`);
      }
    }

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (start_date) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      params.push(end_date);
    }

    const [rows] = await pool.execute(`
      SELECT o.*,
             COALESCE(o.order_code, CONCAT('DH', LPAD(o.id, 6, '0'))) as order_code,
             ${hasCustomers ? 'c.name' : 'NULL'} as customer_name,
             ${userNameField ? `u.${userNameField}` : 'NULL'} as seller
      FROM orders o 
      ${hasCustomers ? 'LEFT JOIN customers c ON o.customer_id = c.id' : ''}
      ${hasUsers ? 'LEFT JOIN users u ON o.user_id = u.id' : ''}
      ${whereClause}
      ORDER BY o.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== LẤY CHI TIẾT ĐƠN HÀNG ======================
exports.getOrderById = async (req, res) => {
  try {
    await ensureSalesSchema(pool);
    const { id } = req.params;
    const hasCustomers = await tableExists(pool, 'customers');
    const hasUsers = await tableExists(pool, 'users');
    const userNameField = hasUsers
      ? ((await columnExists(pool, 'users', 'fullname')) ? 'fullname' : ((await columnExists(pool, 'users', 'full_name')) ? 'full_name' : null))
      : null;
    const [order] = await pool.execute(`
      SELECT o.*,
             COALESCE(o.order_code, CONCAT('DH', LPAD(o.id, 6, '0'))) as order_code,
             ${hasCustomers ? 'c.name' : 'NULL'} as customer_name,
             ${userNameField ? `u.${userNameField}` : 'NULL'} as seller
      FROM orders o 
      ${hasCustomers ? 'LEFT JOIN customers c ON o.customer_id = c.id' : ''}
      ${hasUsers ? 'LEFT JOIN users u ON o.user_id = u.id' : ''}
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
    await ensureSalesSchema(connection);
    const { customer_id, items, discount = 0 } = req.body;
    const user_id = 1; // TODO: Sau này lấy từ JWT

    if (!items || items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất 1 sản phẩm");
    }

    const safeDiscount = Number(discount) || 0;
    if (safeDiscount < 0) {
      throw new Error("Giảm giá không hợp lệ");
    }

    const orderCode = `DH${Date.now()}`;
    const invoiceCode = `HD${Date.now()}`;

    // Tạo order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_code, customer_id, user_id, total_amount, discount, final_amount, status, payment_status) 
       VALUES (?, ?, ?, 0, ?, 0, 'completed', 'paid')`,
      [orderCode, customer_id || null, user_id, safeDiscount]
    );

    const orderId = orderResult.insertId;
    let totalAmount = 0;

    for (const item of items) {
      const productId = Number(item.product_id);
      const qty = Number(item.quantity);

      if (!productId || !qty || qty <= 0) {
        throw new Error("Thông tin sản phẩm hoặc số lượng không hợp lệ");
      }

      const [productRows] = await connection.execute(
        `SELECT p.id, p.name, p.selling_price, IFNULL(i.quantity, 0) as inventory_quantity
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ? FOR UPDATE`,
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`Không tìm thấy sản phẩm ID ${productId}`);
      }

      const product = productRows[0];
      const unitPrice = Number(product.selling_price || 0);
      const subtotal = qty * unitPrice;
      totalAmount += subtotal;

      await connection.execute(
        `INSERT INTO order_details (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, productId, qty, unitPrice, subtotal]
      );

      // Trừ tồn kho + ghi lịch sử thẻ kho
      const [invRows] = await connection.execute(
        `SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE`,
        [productId]
      );
      if (invRows.length === 0) {
        throw new Error(`Sản phẩm ${product.name} chưa có tồn kho`);
      }

      const quantityBefore = Number(invRows[0].quantity || 0);
      if (qty > quantityBefore) {
        throw new Error(`Không đủ tồn kho cho sản phẩm ${product.name}. Tồn hiện tại: ${quantityBefore}`);
      }
      const quantityAfter = quantityBefore - qty;

      await connection.execute(
        `UPDATE inventory SET quantity = ?, last_updated = NOW() WHERE product_id = ? LIMIT 1`,
        [quantityAfter, productId]
      );

      await connection.execute(
        `INSERT INTO inventory_log
         (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, reference_type, reason, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          'export_sales',
          -qty,
          quantityBefore,
          quantityAfter,
          orderId,
          'sales_order',
          `Xuất bán từ ${orderCode}`,
          user_id
        ]
      );
    }

    const finalAmount = Math.max(0, totalAmount - safeDiscount);

    await connection.execute(
      `UPDATE orders SET total_amount = ?, final_amount = ? WHERE id = ?`,
      [totalAmount, finalAmount, orderId]
    );

    // Tạo hóa đơn
    await connection.execute(
      `INSERT INTO invoices (invoice_code, order_id, total_amount, status) 
       VALUES (?, ?, ?, 'issued')`,
      [invoiceCode, orderId, finalAmount]
    );

    await connection.commit();

    res.json({ 
      success: true, 
      message: "Tạo đơn hàng thành công",
      orderId,
      order_code: orderCode,
      total_amount: totalAmount,
      discount: safeDiscount,
      final_amount: finalAmount
    });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// ====================== CẬP NHẬT TRẠNG THÁI ======================
exports.updateOrderStatus = async (req, res) => {
  try {
    await ensureSalesSchema(pool);
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