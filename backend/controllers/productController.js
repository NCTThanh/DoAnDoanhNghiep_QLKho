const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.name as category_name, i.quantity, l.zone, l.shelf 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN locations l ON i.location_id = l.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    const { product_code, name, category_id, base_price, sell_price, discount_percent, location_id, quantity } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [p] = await connection.query(
            'INSERT INTO products (product_code, name, category_id, base_price, sell_price, discount_percent, image_url) VALUES (?,?,?,?,?,?,?)',
            [product_code, name, category_id, base_price, sell_price, discount_percent, image_url]
        );
        await connection.query(
            'INSERT INTO inventory (product_id, location_id, quantity) VALUES (?,?,?)',
            [p.insertId, location_id, quantity || 0]
        );
        await connection.commit();
        res.status(201).json({ id: p.insertId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, base_price, sell_price, discount_percent } = req.body;
    try {
        await pool.query(
            'UPDATE products SET name=?, base_price=?, sell_price=?, discount_percent=? WHERE id=?',
            [name, base_price, sell_price, discount_percent, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};