const pool = require('../config/database');

// ====================== GET ALL SUPPLIER PAYMENTS ======================
exports.getAllPayments = async (req, res) => {
  try {
    const { supplier_id, po_id, search } = req.query;
    
    let query = `
      SELECT 
        sp.id, sp.supplier_id, s.name as supplier_name,
        sp.po_id, po.po_code,
        sp.payment_date, sp.amount, sp.payment_method, sp.bank_account,
        sp.transaction_code, sp.note, sp.created_by, sp.created_at
      FROM supplier_payments sp
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN purchase_orders po ON sp.po_id = po.id
      WHERE 1=1
    `;
    const params = [];

    if (supplier_id) {
      query += ` AND sp.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (po_id) {
      query += ` AND sp.po_id = ?`;
      params.push(po_id);
    }

    if (search) {
      query += ` AND (s.name LIKE ? OR po.po_code LIKE ? OR sp.transaction_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY sp.payment_date DESC`;

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi lấy danh sách thanh toán:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== CREATE SUPPLIER PAYMENT ======================
exports.createPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note } = req.body;

    await connection.beginTransaction();

    // 1. Tạo record supplier_payments
    const [result] = await connection.execute(`
      INSERT INTO supplier_payments 
      (supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, 1]);

    // 2. Cập nhật purchase_orders (nếu có po_id)
    if (po_id) {
      await connection.execute(`
        UPDATE purchase_orders 
        SET paid_amount = paid_amount + ?,
            remaining_amount = total_amount - (paid_amount + ?),
            updated_at = NOW()
        WHERE id = ?
      `, [amount, amount, po_id]);
    }

    // 3. Cập nhật suppliers (trừ công nợ)
    await connection.execute(`
      UPDATE suppliers 
      SET total_debt = total_debt - ?,
          updated_at = NOW()
      WHERE id = ?
    `, [amount, supplier_id]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Ghi nhận thanh toán thành công',
      data: { id: result.insertId, amount }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi tạo thanh toán:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    await connection.release();
  }
};

// ====================== GET PAYMENT BY ID ======================
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT * FROM supplier_payments WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi thanh toán' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
