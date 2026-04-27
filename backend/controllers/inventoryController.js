const pool = require('../config/database');

// 1. Hàm lấy dữ liệu cho Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const [revenue] = await pool.query(`
            SELECT DATE(created_at) as date, SUM(total_amount) as daily_revenue 
            FROM orders 
            GROUP BY DATE(created_at) 
            ORDER BY date DESC LIMIT 7
        `);
        // Nếu không có dữ liệu, trả về mảng mặc định để tránh lỗi biểu đồ
        res.json(revenue.length > 0 ? revenue : [{date: 'Chưa có đơn hàng', daily_revenue: 0}]);
    } catch (error) {
        console.error("Lỗi Dashboard:", error.message);
        res.status(500).json({ error: "Lỗi truy vấn bảng orders" });
    }
};

// 2. Hàm tạo Phiếu Nhập Hàng (Purchase Order)
exports.createPurchaseOrder = async (req, res) => {
    const { supplier_id, products, total_value } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        // Tạo phiếu nhập
        const [poResult] = await connection.query(
            'INSERT INTO purchase_orders (supplier_id, total_value) VALUES (?, ?)',
            [supplier_id, total_value]
        );
        const poId = poResult.insertId;

        // Thêm chi tiết và cập nhật tồn kho
        for (let item of products) {
            await connection.query(
                'INSERT INTO purchase_order_details (po_id, product_id, quantity, import_price) VALUES (?, ?, ?, ?)',
                [poId, item.product_id, item.quantity, item.import_price]
            );

            await connection.query(
                'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND location_id = ?',
                [item.quantity, item.product_id, item.location_id]
            );
        }

        await connection.commit();
        res.status(201).json({ id: poId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};