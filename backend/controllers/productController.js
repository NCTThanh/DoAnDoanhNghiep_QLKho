const pool = require('../config/database');

// ====================== GET ALL ======================
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category_id } = req.query;
    
    // JOIN 4 bảng để lấy đầy đủ dữ liệu (Hàng hóa, Tồn kho, Vị trí, Danh mục)
    let query = `
      SELECT 
        p.id, p.barcode, p.name, p.unit, p.cost_price, p.selling_price, p.discount_percent, p.image,
        c.name as category_name, p.category_id,
        i.quantity, i.mfg_date, i.exp_date,
        l.zone, l.shelf, i.location_id
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Lỗi lấy sản phẩm:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET BY ID ======================
exports.getProductById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        p.*, c.name as category_name,
        i.quantity, i.mfg_date, i.exp_date, i.location_id,
        l.zone, l.shelf
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== CREATE ======================
exports.createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, barcode, selling_price, cost_price, category_id, unit = 'cái', discount_percent = 0, location_id, quantity = 0, mfg_date, exp_date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    await connection.beginTransaction();

    // 1. Thêm vào bảng products
    const [prodResult] = await connection.execute(`
      INSERT INTO products (name, barcode, selling_price, cost_price, category_id, unit, discount_percent, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, barcode, selling_price, cost_price || 0, category_id, unit, discount_percent, image]);

    const productId = prodResult.insertId;

    // 2. Thêm vào bảng inventory
    await connection.execute(`
      INSERT INTO inventory (product_id, location_id, quantity, mfg_date, exp_date)
      VALUES (?, ?, ?, ?, ?)
    `, [productId, location_id || null, quantity, mfg_date || null, exp_date || null]);

    await connection.commit();
    res.json({ success: true, message: "Thêm sản phẩm thành công", productId: productId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// ====================== UPDATE ======================
exports.updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, barcode, selling_price, cost_price, category_id, unit, discount_percent, location_id, quantity, mfg_date, exp_date } = req.body;
    const { id } = req.params;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    await connection.beginTransaction();

    // 1. Cập nhật products
    let updateProductQuery = `
      UPDATE products 
      SET name = ?, barcode = ?, selling_price = ?, cost_price = ?, category_id = ?, unit = ?, discount_percent = ?
    `;
    const productParams = [name, barcode, selling_price, cost_price, category_id, unit, discount_percent || 0];

    if (image) {
      updateProductQuery += `, image = ?`;
      productParams.push(image);
    }
    updateProductQuery += ` WHERE id = ?`;
    productParams.push(id);

    const [prodResult] = await connection.execute(updateProductQuery, productParams);

    if (prodResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    // 2. Cập nhật inventory
    // Kiểm tra xem sản phẩm đã có trong kho chưa
    const [invCheck] = await connection.execute(`SELECT id FROM inventory WHERE product_id = ?`, [id]);
    
    if (invCheck.length > 0) {
        await connection.execute(`
          UPDATE inventory 
          SET location_id = ?, quantity = ?, mfg_date = ?, exp_date = ?
          WHERE product_id = ?
        `, [location_id || null, quantity || 0, mfg_date || null, exp_date || null, id]);
    } else {
        await connection.execute(`
          INSERT INTO inventory (product_id, location_id, quantity, mfg_date, exp_date)
          VALUES (?, ?, ?, ?, ?)
        `, [id, location_id || null, quantity || 0, mfg_date || null, exp_date || null]);
    }

    await connection.commit();
    res.json({ success: true, message: "Cập nhật sản phẩm thành công" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// ====================== DELETE ======================
exports.deleteProduct = async (req, res) => {
  try {
    // Nhờ ON DELETE CASCADE trong SQL, khi xóa products thì inventory cũng tự động bị xóa
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};