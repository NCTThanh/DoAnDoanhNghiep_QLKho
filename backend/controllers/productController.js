const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Hàm làm sạch dữ liệu từ FormData (tránh chuỗi "null", "undefined" hoặc rỗng)
const parseNumber = (val, defaultVal = null) => {
  if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') {
    return defaultVal;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

// Helper: ensure no undefined in params passed to mysql
const sanitizeParams = (arr) => arr.map(v => (v === undefined ? null : v));

// ====================== GET ALL ======================
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category_id } = req.query;
    
    let query = `
      SELECT 
        p.id, p.barcode as product_code, p.barcode, p.name, p.unit, p.cost_price, p.selling_price as selling_price, p.discount_percent, p.image as image, p.status,
        c.name as category_name, p.category_id,
        i.quantity, i.mfg_date, i.exp_date,
        l.zone, l.shelf, i.location_id
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE p.status = 'active'
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
    // Debug: log query and params to help trace 'Unknown column' errors
    console.log('[DEBUG] products.getAllProducts SQL:', query);
    console.log('[DEBUG] products.getAllProducts params:', params);

    const [rows] = await pool.execute(query, params);

    // Normalize image paths for frontend: ensure images start with '/uploads/...'
    const normalized = rows.map(r => {
      const copy = { ...r };
      if (copy.image) {
        // If image stored as filename, or without /uploads prefix, normalize it
        if (!copy.image.startsWith('/')) {
          copy.image = `/uploads/${copy.image}`;
        } else if (!copy.image.startsWith('/uploads')) {
          // if it's something like 'uploads/...' make it '/uploads/...'
          copy.image = copy.image.replace(/^\/*uploads/, '/uploads');
        }
      }
      return copy;
    });

    res.json({ success: true, data: normalized });
  } catch (err) {
    console.error("Lỗi lấy sản phẩm:", err);
    if (err && err.sqlMessage) console.error('[SQL ERROR]', err.sqlMessage);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET BY ID ======================
exports.getProductById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, c.name as category_name, i.quantity, i.mfg_date, i.exp_date, i.location_id, l.zone, l.shelf
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE p.id = ? AND p.status = 'active'
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    const row = { ...rows[0] };
    if (row.image) {
      if (!row.image.startsWith('/')) row.image = `/uploads/${row.image}`;
      else if (!row.image.startsWith('/uploads')) row.image = row.image.replace(/^\/*uploads/, '/uploads');
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== CREATE ======================
exports.createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('[DEBUG] createProduct req.body:', req.body);
    console.log('[DEBUG] createProduct req.file:', req.file);
    const { name, barcode, selling_price, cost_price, category_id, unit, discount_percent, location_id, quantity, mfg_date, exp_date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null; // stored in `image` column

    // Ép kiểu an toàn 100%
    const pCategoryId = parseNumber(category_id);
    const pLocationId = parseNumber(location_id);
    const pSellPrice = parseNumber(selling_price, 0);
    const pCostPrice = parseNumber(cost_price, 0);
    const pDiscount = parseNumber(discount_percent, 0);
    const pQty = parseNumber(quantity, 0);
    const safeUnit = (unit && unit !== 'undefined' && unit !== 'null') ? unit : 'Cái';
    const safeBarcode = (barcode && barcode !== 'undefined' && barcode !== 'null') ? barcode : null;

    await connection.beginTransaction();

    // Nếu không có barcode, tự sinh 1 giá trị duy nhất
    let finalBarcode = safeBarcode;
    if (!finalBarcode) {
      finalBarcode = 'BC' + Date.now().toString().slice(-8);
    }

    // Kiểm tra duplicate barcode trước khi insert
    if (finalBarcode) {
      const [existing] = await connection.execute('SELECT id FROM products WHERE barcode = ?', [finalBarcode]);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Lỗi: barcode đã tồn tại trong hệ thống' });
      }
    }

    const [prodResult] = await connection.execute(`
      INSERT INTO products (name, barcode, selling_price, cost_price, category_id, unit, discount_percent, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, sanitizeParams([name, finalBarcode, pSellPrice, pCostPrice, pCategoryId, safeUnit, pDiscount, image]));

    const productId = prodResult.insertId;

    await connection.execute(`
      INSERT INTO inventory (product_id, location_id, quantity, mfg_date, exp_date)
      VALUES (?, ?, ?, ?, ?)
    `, sanitizeParams([
      productId, pLocationId, pQty, 
      (mfg_date && mfg_date !== 'undefined' && mfg_date !== 'null') ? mfg_date : null, 
      (exp_date && exp_date !== 'undefined' && exp_date !== 'null') ? exp_date : null
    ]));

    if (pQty > 0) {
      await connection.execute(`
        INSERT INTO inventory_log
        (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, reference_type, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        productId,
        'adjustment_increase',
        pQty,
        0,
        pQty,
        productId,
        'product',
        'Khởi tạo tồn kho khi thêm sản phẩm',
        1
      ]);
    }

    await connection.commit();
    res.json({ success: true, message: "Thêm sản phẩm thành công", productId: productId });
  } catch (err) {
    await connection.rollback();
    console.error("Lỗi khi thêm:", err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: "Lỗi: Danh mục (Category) hoặc Vị trí kho bạn chọn không tồn tại trong DB!" });
    }
    res.status(500).json({ success: false, message: "Lỗi DB: " + err.message });
  } finally {
    connection.release();
  }
};

// ====================== UPDATE ======================
exports.updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('[DEBUG] updateProduct req.body:', req.body);
    console.log('[DEBUG] updateProduct req.file:', req.file);
    const { name, barcode, selling_price, cost_price, category_id, unit, discount_percent, location_id, quantity, mfg_date, exp_date } = req.body;
    const { id } = req.params;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const pCategoryId = parseNumber(category_id);
    const pLocationId = parseNumber(location_id);
    const pSellPrice = parseNumber(selling_price, 0);
    const pCostPrice = parseNumber(cost_price, 0);
    const pDiscount = parseNumber(discount_percent, 0);
    const pQty = parseNumber(quantity, 0);
    const safeUnit = (unit && unit !== 'undefined' && unit !== 'null') ? unit : 'Cái';
    const safeBarcode = (barcode && barcode !== 'undefined' && barcode !== 'null') ? barcode : null;

    await connection.beginTransaction();

    let query = `UPDATE products SET name=?, barcode=?, selling_price=?, cost_price=?, category_id=?, unit=?, discount_percent=?`;
    const params = [name, safeBarcode, pSellPrice, pCostPrice, pCategoryId, safeUnit, pDiscount];

    // Nếu thay đổi barcode, kiểm tra trùng lặp (ngoại trừ chính bản ghi này)
    if (safeBarcode) {
      const [dups] = await connection.execute('SELECT id FROM products WHERE barcode = ? AND id <> ?', [safeBarcode, id]);
      if (dups.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Lỗi: barcode đã tồn tại trong hệ thống' });
      }
    }

    if (image) {
      query += `, image=?`;
      params.push(image);
    }
    query += ` WHERE id=?`;
    params.push(id);

    const [prodResult] = await connection.execute(query, sanitizeParams(params));
    if (prodResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    const [invCheck] = await connection.execute(`SELECT id, quantity FROM inventory WHERE product_id = ? FOR UPDATE`, [id]);
    const mfg = (mfg_date && mfg_date !== 'undefined' && mfg_date !== 'null') ? mfg_date : null;
    const exp = (exp_date && exp_date !== 'undefined' && exp_date !== 'null') ? exp_date : null;

    if (invCheck.length > 0) {
      const oldQty = Number(invCheck[0].quantity || 0);
      await connection.execute(`UPDATE inventory SET location_id=?, quantity=?, mfg_date=?, exp_date=? WHERE product_id=?`, sanitizeParams([pLocationId, pQty, mfg, exp, id]));

      const qtyDiff = pQty - oldQty;
      if (qtyDiff !== 0) {
        await connection.execute(`
          INSERT INTO inventory_log
          (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, reference_type, reason, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          Number(id),
          qtyDiff > 0 ? 'adjustment_increase' : 'adjustment_decrease',
          qtyDiff,
          oldQty,
          pQty,
          Number(id),
          'product',
          'Điều chỉnh tồn kho khi cập nhật sản phẩm',
          1
        ]);
      }
    } else {
      await connection.execute(`INSERT INTO inventory (product_id, location_id, quantity, mfg_date, exp_date) VALUES (?, ?, ?, ?, ?)`, sanitizeParams([id, pLocationId, pQty, mfg, exp]));

      if (pQty > 0) {
        await connection.execute(`
          INSERT INTO inventory_log
          (product_id, transaction_type, quantity_change, quantity_before, quantity_after, reference_id, reference_type, reason, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          Number(id),
          'adjustment_increase',
          pQty,
          0,
          pQty,
          Number(id),
          'product',
          'Khởi tạo tồn kho khi cập nhật sản phẩm',
          1
        ]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Cập nhật sản phẩm thành công" });
  } catch (err) {
    await connection.rollback();
    console.error("Lỗi khi sửa:", err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: "Lỗi: Danh mục (Category) hoặc Vị trí kho bạn chọn không tồn tại trong DB!" });
    }
    res.status(500).json({ success: false, message: "Lỗi DB: " + err.message });
  } finally {
    connection.release();
  }
};

// ====================== DELETE (Xóa vĩnh viễn) ======================
exports.deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = req.params.id;
    await connection.beginTransaction();

    // Lấy thông tin sản phẩm để biết image và kiểm tra tồn tại
    const [rows] = await connection.execute('SELECT image FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const imagePath = rows[0].image; // ví dụ: /uploads/abc.jpg

    // Xóa các bản ghi liên quan trong các bảng khác (inventory, inventory_log, purchase_order_details)
    await connection.execute('DELETE FROM inventory WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM inventory_log WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM purchase_order_details WHERE product_id = ?', [id]);

    // Xóa sản phẩm
    const [del] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);
    if (del.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Xóa sản phẩm thất bại' });
    }

    // Xóa file ảnh trên disk nếu có
    if (imagePath) {
      // imagePath lưu dưới dạng '/uploads/filename.ext'
      const filename = path.basename(imagePath);
      const fileOnDisk = path.join(__dirname, '..', 'uploads', filename);
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (e) {
        // Không dừng thao tác nếu xóa file lỗi, chỉ log
        console.error('Không thể xóa file ảnh:', fileOnDisk, e.message);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};