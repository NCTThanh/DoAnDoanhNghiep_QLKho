const pool = require('../config/database');

// ====================== GET ALL SUPPLIERS ======================
exports.getAllSuppliers = async (req, res) => {
  try {
    const { status = 'active', search } = req.query;
    
    let query = `
      SELECT 
        s.id, s.supplier_code, s.name, s.phone, s.email, s.address, s.tax_id,
        s.representative, s.payment_term, s.total_debt, s.status, s.note,
        s.created_at, s.updated_at,
        (SELECT IFNULL(SUM(remaining_amount),0) FROM purchase_orders p WHERE p.supplier_id = s.id AND p.status != 'cancelled') AS computed_debt
      FROM suppliers s
      WHERE s.status = ?
    `;
    const params = [status];

    if (search) {
      query += ` AND (name LIKE ? OR supplier_code LIKE ? OR phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query, params);
    // Map rows to return computed_debt and hide manual total_debt if desired
    const normalized = rows.map(r => ({
      ...r,
      computed_debt: Number(r.computed_debt || 0),
      total_debt: Number(r.total_debt || 0)
    }));
    res.json({ success: true, data: normalized, total: normalized.length });
  } catch (err) {
    console.error('Lỗi lấy danh sách NCC:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET SUPPLIER BY ID ======================
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT s.*, (SELECT IFNULL(SUM(remaining_amount),0) FROM purchase_orders p WHERE p.supplier_id = s.id AND p.status != 'cancelled') AS computed_debt
      FROM suppliers s WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
    }

    const out = { ...rows[0], computed_debt: Number(rows[0].computed_debt || 0) };
    res.json({ success: true, data: out });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== CREATE SUPPLIER ======================
exports.createSupplier = async (req, res) => {
  try {
    const { supplier_code, name, phone, email, address, tax_id, representative, payment_term } = req.body;

    // Kiểm tra mã NCC không được trùng
    const [existing] = await pool.execute(
      'SELECT id FROM suppliers WHERE supplier_code = ?',
      [supplier_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã NCC đã tồn tại' });
    }

    const [result] = await pool.execute(`
      INSERT INTO suppliers (supplier_code, name, phone, email, address, tax_id, representative, payment_term, total_debt, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')
    `, [supplier_code, name, phone, email, address, tax_id, representative, payment_term]);

    res.status(201).json({
      success: true,
      message: 'Thêm nhà cung cấp thành công',
      data: { id: result.insertId, supplier_code, name }
    });
  } catch (err) {
    console.error('Lỗi tạo NCC:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== UPDATE SUPPLIER ======================
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, tax_id, representative, payment_term, status, note } = req.body;

    // Avoid undefined params which cause mysql2 bind errors
    const toParam = (v) => (v === undefined ? null : v);
    const params = [toParam(name), toParam(phone), toParam(email), toParam(address), toParam(tax_id), toParam(representative), toParam(payment_term), toParam(status), toParam(note), id];

    const [result] = await pool.execute(`
      UPDATE suppliers 
      SET name = ?, phone = ?, email = ?, address = ?, tax_id = ?, representative = ?, payment_term = ?, status = ?, note = ?, updated_at = NOW()
      WHERE id = ?
    `, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
    }

    res.json({ success: true, message: 'Cập nhật nhà cung cấp thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== DELETE SUPPLIER ======================
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem NCC này có PO không
    const [poCheck] = await pool.execute(
      'SELECT id FROM purchase_orders WHERE supplier_id = ? AND status != ?',
      [id, 'cancelled']
    );

    if (poCheck.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa. Nhà cung cấp này có phiếu nhập hàng chưa hủy' 
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM suppliers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
    }

    res.json({ success: true, message: 'Xóa nhà cung cấp thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET SUPPLIER DEBT HISTORY ======================
exports.getDebtHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy lịch PO + thanh toán
    const [history] = await pool.execute(`
      SELECT 
        'po_created' as type, 
        po_date as date,
        po_code as ref_code,
        total_amount as amount,
        'Phiếu nhập hàng' as description
      FROM purchase_orders 
      WHERE supplier_id = ? AND status IN ('confirmed', 'received')
      
      UNION ALL
      
      SELECT 
        'payment' as type,
        payment_date as date,
        transaction_code as ref_code,
        amount,
        'Thanh toán' as description
      FROM supplier_payments
      WHERE supplier_id = ?
      
      ORDER BY date DESC
    `, [id, id]);

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
