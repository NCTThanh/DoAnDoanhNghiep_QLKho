const pool = require('../config/db'); // Giả định file config db của bạn

const supplierController = {
    getAll: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        const { supplier_code, name, phone, email, address, tax_id, representative, payment_term } = req.body;
        try {
            const [result] = await pool.query(
                'INSERT INTO suppliers (supplier_code, name, phone, email, address, tax_id, representative, payment_term) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [supplier_code, name, phone, email, address, tax_id, representative, payment_term]
            );
            res.status(201).json({ id: result.insertId, message: 'Tạo nhà cung cấp thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        try {
            await pool.query('UPDATE suppliers SET ? WHERE id = ?', [data, id]);
            res.json({ message: 'Cập nhật thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        const { id } = req.params;
        try {
            // Kiểm tra xem có PO nào liên quan không trước khi xóa
            const [pos] = await pool.query('SELECT id FROM purchase_orders WHERE supplier_id = ? LIMIT 1', [id]);
            if (pos.length > 0) {
                return res.status(400).json({ error: 'Không thể xóa nhà cung cấp đã có phiếu nhập hàng' });
            }
            await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
            res.json({ message: 'Xóa thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = supplierController;