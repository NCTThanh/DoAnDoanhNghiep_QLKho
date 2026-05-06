const pool = require('../config/database');

// ====================== GET ALL PURCHASE ORDERS ======================
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier_id, search } = req.query;
    
    let query = `
      SELECT 
        po.id, po.po_code, po.supplier_id, s.name as supplier_name,
        po.po_date, po.expected_delivery_date, po.actual_delivery_date,
        po.total_amount, po.paid_amount, po.remaining_amount, po.status,
        COUNT(pod.id) as item_count,
        po.created_by, po.note, po.created_at, po.updated_at
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_details pod ON po.id = pod.po_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND po.status = ?`;
      params.push(status);
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (search) {
      query += ` AND (po.po_code LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY po.id ORDER BY po.po_date DESC`;

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi lấy danh sách PO:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== GET PURCHASE ORDER BY ID ======================
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [poRows] = await pool.execute(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `, [id]);

    if (poRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    const [details] = await pool.execute(`
      SELECT 
        pod.id, pod.po_id, pod.product_id, p.barcode as product_code, p.name as product_name,
        p.unit, pod.quantity, pod.unit_price, pod.total_price, pod.received_quantity, pod.note
      FROM purchase_order_details pod
      LEFT JOIN products p ON pod.product_id = p.id
      WHERE pod.po_id = ?
    `, [id]);

    res.json({ 
      success: true, 
      data: { ...poRows[0], details } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====================== CREATE PURCHASE ORDER ======================
exports.createPurchaseOrder = async (req, res) => {
  let connection = null;
  try {
    const { supplier_id, po_date, expected_delivery_date, items, note, payment_amount } = req.body;

    // Basic validation BEFORE acquiring DB connection
    if (!supplier_id) {
      return res.status(400).json({ success: false, message: 'supplier_id is required' });
    }
    if (!po_date) {
      return res.status(400).json({ success: false, message: 'po_date is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items must be a non-empty array' });
    }
    // Filter out any invalid/empty items (frontend may send blank rows)
    const validItems = (items || []).filter(it => it && it.product_id);
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: 'no valid items provided' });
    }

    // Log request body for debugging
    console.log('Creating PO payload:', JSON.stringify(req.body));

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Normalize optional fields to SQL NULL when undefined
    const expectedDelivery = typeof expected_delivery_date === 'undefined' ? null : expected_delivery_date;
    const noteValue = typeof note === 'undefined' ? null : note;

    // Generate human-friendly PO code: PN + DDMMYY + - + sequence per day
    const dt = new Date(po_date);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear()).slice(-2);
    const dateKey = `${dd}${mm}${yy}`;

    // Count existing PO for the same date to compute sequence
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) AS cnt FROM purchase_orders WHERE DATE(po_date) = ?',
      [po_date]
    );
    const seq = (countRows && countRows[0] && Number(countRows[0].cnt) ? Number(countRows[0].cnt) : 0) + 1;
    const poCode = `PN${dateKey}-${String(seq).padStart(3, '0')}`;

    // 1. Tạo record purchase_orders
    const poParams = [supplier_id, poCode, po_date, expectedDelivery, 1, noteValue];
    console.log('PO insert params:', poParams);
    const [poResult] = await connection.execute(
      `INSERT INTO purchase_orders (supplier_id, po_code, po_date, expected_delivery_date, status, created_by, note)
      VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
      poParams
    );

    const poId = poResult.insertId;

    // 2. Tạo chi tiết từng sản phẩm + tính total_amount
    let totalAmount = 0;
    for (const item of validItems) {
      try {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const totalPrice = quantity * unitPrice;
        totalAmount += totalPrice;

        await connection.execute(
          `INSERT INTO purchase_order_details (po_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)`,
          [poId, item.product_id, quantity, unitPrice, totalPrice]
        );
      } catch (innerErr) {
        console.error('Error inserting PO detail for item:', item, innerErr);
        throw innerErr;
      }
    }

    // 3. Cập nhật total_amount
    await connection.execute(
      `UPDATE purchase_orders SET total_amount = ?, updated_at = NOW() WHERE id = ?`,
      [totalAmount, poId]
    );

    // 4. Xử lý thanh toán (nếu có) ở thời điểm tạo PO
    const payAmt = Number(payment_amount) || 0;
    if (payAmt > 0) {
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT,
            po_id INT,
            payment_date DATETIME,
            amount DECIMAL(15,2),
            payment_method VARCHAR(50),
            bank_account VARCHAR(100),
            transaction_code VARCHAR(100),
            note TEXT,
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;
        `);

        await connection.execute(`
          INSERT INTO supplier_payments (supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, created_by)
          VALUES (?, ?, NOW(), ?, NULL, NULL, NULL, ?, ?)
        `, [supplier_id, poId, payAmt, 'Thanh toán khi tạo PO', 1]);
      } catch (paymentErr) {
        console.warn('Could not record supplier payment (create):', paymentErr.message);
      }
    }

    // 5. Cập nhật paid_amount & remaining_amount theo payment vừa nhập
    const newPaid = payAmt;
    let newRemaining = totalAmount - newPaid;
    if (newRemaining < 0) newRemaining = 0;
    await connection.execute(`
      UPDATE purchase_orders
      SET paid_amount = ?, remaining_amount = ?, updated_at = NOW()
      WHERE id = ?
    `, [newPaid, newRemaining, poId]);

    // 6. Nếu tạo kèm thanh toán hoặc có remaining > 0, ghi nhận công nợ nhà cung cấp và đánh dấu debt_recorded
    if (newRemaining > 0) {
      await connection.execute(
        'UPDATE suppliers SET total_debt = IFNULL(total_debt,0) + ? WHERE id = ?',
        [newRemaining, supplier_id]
      );
      // mark debt recorded on PO
      await connection.execute('UPDATE purchase_orders SET debt_recorded = 1 WHERE id = ?', [poId]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu nhập hàng thành công',
      data: { id: poId, po_code: poCode, total_amount: totalAmount }
    });
  } catch (err) {
    // Attempt to rollback if we have an open connection
    try {
      if (typeof connection !== 'undefined' && connection && connection.rollback) await connection.rollback();
    } catch (rbErr) {
      console.error('Rollback error:', rbErr);
    }
    console.error('Lỗi tạo PO (full):', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    try {
      if (typeof connection !== 'undefined' && connection && connection.release) connection.release();
    } catch (relErr) {
      console.error('Release connection error:', relErr);
    }
  }
};

// ====================== CONFIRM PURCHASE ORDER ======================
exports.confirmPurchaseOrder = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    await connection.beginTransaction();

    // 1. Lấy thông tin PO và khóa hàng bằng FOR UPDATE
    const [poRows] = await connection.execute(
      'SELECT id, supplier_id, total_amount, paid_amount, remaining_amount, debt_recorded, status FROM purchase_orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (poRows.length === 0) {
      if (connection) await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    const po = poRows[0];
    if (po.status !== 'draft') {
      if (connection) await connection.rollback();
      return res.status(400).json({ success: false, message: 'Phiếu nhập phải ở trạng thái Nháp' });
    }

    // 2. Cập nhật status PO -> 'pending'
    await connection.execute(
      'UPDATE purchase_orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['pending', id]
    );

    // 3. Tăng công nợ nhà cung cấp bằng remaining hiện thời nếu chưa được ghi nhận
    const total = Number(po.total_amount || 0);
    const oldPaid = Number(po.paid_amount || 0);
    const remaining = Math.max(total - oldPaid, 0);
    if (!po.debt_recorded && remaining > 0) {
      await connection.execute(
        'UPDATE suppliers SET total_debt = IFNULL(total_debt,0) + ? WHERE id = ?',
        [remaining, po.supplier_id]
      );
      await connection.execute('UPDATE purchase_orders SET debt_recorded = 1 WHERE id = ?', [id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Xác nhận phiếu nhập thành công',
      data: { supplier_debt_added: remaining }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Lỗi xác nhận PO:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ====================== UPDATE PURCHASE ORDER (Draft only) ======================
exports.updatePurchaseOrder = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { po_date, expected_delivery_date, items, note, payment_amount } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items must be a non-empty array' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock PO and read existing financials
    const [poRows] = await connection.execute('SELECT id, supplier_id, status, paid_amount, remaining_amount, debt_recorded FROM purchase_orders WHERE id = ? FOR UPDATE', [id]);
    if (poRows.length === 0) {
      if (connection) await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    const po = poRows[0];
    if (po.status !== 'draft') {
      if (connection) await connection.rollback();
      return res.status(400).json({ success: false, message: 'Chỉ được chỉnh sửa phiếu ở trạng thái Nháp' });
    }

    // Update header fields
    const expectedDelivery = typeof expected_delivery_date === 'undefined' ? null : expected_delivery_date;
    const noteValue = typeof note === 'undefined' ? null : note;
    await connection.execute('UPDATE purchase_orders SET po_date = ?, expected_delivery_date = ?, note = ?, updated_at = NOW() WHERE id = ?', [po_date, expectedDelivery, noteValue, id]);

    // Replace details: delete then insert new
    await connection.execute('DELETE FROM purchase_order_details WHERE po_id = ?', [id]);
    let totalAmount = 0;
    const validItems = (items || []).filter(it => it && it.product_id);
    for (const item of validItems) {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;
      await connection.execute(
        `INSERT INTO purchase_order_details (po_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [id, item.product_id, quantity, unitPrice, totalPrice]
      );
    }

    // Update totals on PO
    // preserve previous paid_amount/remaining_amount for debt adjustments
    const oldRemaining = Number(po.remaining_amount || 0);
    await connection.execute('UPDATE purchase_orders SET total_amount = ?, updated_at = NOW() WHERE id = ?', [totalAmount, id]);

    // Handle optional payment at update time (record payment and update PO amounts)
    const payAmt = Number(payment_amount) || 0;
    if (payAmt > 0) {
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT,
            po_id INT,
            payment_date DATETIME,
            amount DECIMAL(15,2),
            payment_method VARCHAR(50),
            bank_account VARCHAR(100),
            transaction_code VARCHAR(100),
            note TEXT,
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;
        `);

        await connection.execute(`
          INSERT INTO supplier_payments (supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, created_by)
          VALUES (?, ?, NOW(), ?, NULL, NULL, NULL, ?, ?)
        `, [po.supplier_id, id, payAmt, 'Thanh toán khi chỉnh sửa PO', 1]);
      } catch (paymentErr) {
        console.warn('Could not record supplier payment (update):', paymentErr.message);
      }

      // Update paid/remaining on PO
      const [poFresh] = await connection.execute('SELECT paid_amount, total_amount FROM purchase_orders WHERE id = ? FOR UPDATE', [id]);
      const oldPaid = Number((poFresh && poFresh[0] && poFresh[0].paid_amount) || 0);
      const totalFresh = Number((poFresh && poFresh[0] && poFresh[0].total_amount) || 0);
      const newPaid = oldPaid + payAmt;
      let newRemaining = totalFresh - newPaid;
      if (newRemaining < 0) newRemaining = 0;
      await connection.execute('UPDATE purchase_orders SET paid_amount = ?, remaining_amount = ?, updated_at = NOW() WHERE id = ?', [newPaid, newRemaining, id]);

      // If debt was already recorded for this PO, we must reduce supplier.total_debt by the payment (handled elsewhere on receive),
      // but since update can happen in Draft state, adjust supplier.total_debt delta relative to previous remaining.
      const poAfter = (poFresh && poFresh[0]) ? poFresh[0] : null;
      const prevRemaining = oldRemaining;
      const delta = newRemaining - prevRemaining; // positive -> increase debt, negative -> decrease debt
      if (po.debt_recorded) {
        if (delta !== 0) {
          await connection.execute('UPDATE suppliers SET total_debt = IFNULL(total_debt,0) + ? WHERE id = ?', [delta, po.supplier_id]);
        }
      }
    }

    // If no immediate payment but total changed, and debt was recorded, adjust supplier.total_debt to new remaining
    if (!Number(payment_amount) && po.debt_recorded) {
      // read current paid_amount to compute new remaining
      const [poNow] = await connection.execute('SELECT paid_amount, total_amount FROM purchase_orders WHERE id = ? FOR UPDATE', [id]);
      const paidNow = Number((poNow && poNow[0] && poNow[0].paid_amount) || 0);
      const totalNow = Number((poNow && poNow[0] && poNow[0].total_amount) || 0);
      const newRemaining = Math.max(totalNow - paidNow, 0);
      const delta = newRemaining - oldRemaining;
      if (delta !== 0) {
        await connection.execute('UPDATE suppliers SET total_debt = IFNULL(total_debt,0) + ? WHERE id = ?', [delta, po.supplier_id]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Cập nhật phiếu nhập thành công', data: { id, total_amount: totalAmount } });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Lỗi cập nhật PO:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ====================== RECEIVE PURCHASE ORDER (⭐ QUAN TRỌNG) ======================
exports.receivePurchaseOrder = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { actual_delivery_date, details } = req.body;

    await connection.beginTransaction();

    const { payment_amount } = req.body;
    const payAmt = Number(payment_amount) || 0;

    // 1. Lấy thông tin PO bằng SELECT ... FOR UPDATE để khóa hàng
    const [poRows] = await connection.execute(
      'SELECT id, po_code, supplier_id, total_amount, paid_amount, remaining_amount, status FROM purchase_orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (poRows.length === 0) {
      if (connection) await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    const po = poRows[0];
    if (po.status !== 'pending') {
      if (connection) await connection.rollback();
      return res.status(400).json({ success: false, message: 'Phiếu nhập phải ở trạng thái Đang chờ (pending)' });
    }

    const inventoryUpdates = [];

    // 2. Xử lý từng chi tiết PO
    for (const detail of details || []) {
      const receivedQty = Number(detail.received_quantity) || 0;

      // 2a. Cập nhật received_quantity
      await connection.execute(
        'UPDATE purchase_order_details SET received_quantity = ? WHERE id = ?',
        [receivedQty, detail.po_detail_id]
      );

      // 2b. Lấy product_id
      const [podRows] = await connection.execute(
        'SELECT product_id FROM purchase_order_details WHERE id = ?',
        [detail.po_detail_id]
      );
      const productId = podRows[0].product_id;

      // 2c. Lấy tồn kho hiện tại
      const [invRows] = await connection.execute(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [productId]
      );
      const quantityBefore = invRows.length > 0 ? Number(invRows[0].quantity) : 0;

      // 2d. CẬP NHẬT TỒN KHO
      if (invRows.length > 0) {
        await connection.execute(
          'UPDATE inventory SET quantity = quantity + ?, last_updated = NOW() WHERE product_id = ?',
          [receivedQty, productId]
        );
      } else {
        // Tạo record inventory nếu chưa có
        await connection.execute(
          'INSERT INTO inventory (product_id, quantity, last_updated) VALUES (?, ?, NOW())',
          [productId, receivedQty]
        );
      }

      // 2e. Lấy tồn kho sau
      const [newInvRows] = await connection.execute(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [productId]
      );
      const quantityAfter = Number(newInvRows[0].quantity);

      // 2f. GHI LOG - Thẻ Kho
      await connection.execute(`
        INSERT INTO inventory_log 
        (product_id, transaction_type, quantity_change, quantity_before, quantity_after, 
         reference_id, reference_type, supplier_id, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        productId,
        'import_purchase_order',
        receivedQty,
        quantityBefore,
        quantityAfter,
        id,
        'purchase_order',
        po.supplier_id,
        `Nhập từ ${po.po_code}`,
        1 // user_id (có thể lấy từ JWT token)
      ]);

      inventoryUpdates.push({
        product_id: productId,
        quantity_before: quantityBefore,
        quantity_received: receivedQty,
        quantity_after: quantityAfter
      });
    }

    // 3. Nếu có thanh toán khi nhận hàng, ghi vào supplier_payments và cập nhật công nợ
    if (payAmt > 0) {
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplier_id INT,
            po_id INT,
            payment_date DATETIME,
            amount DECIMAL(15,2),
            payment_method VARCHAR(50),
            bank_account VARCHAR(100),
            transaction_code VARCHAR(100),
            note TEXT,
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB;
        `);

        await connection.execute(`
          INSERT INTO supplier_payments (supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, created_by)
          VALUES (?, ?, NOW(), ?, NULL, NULL, NULL, ?, ?)
        `, [po.supplier_id, id, payAmt, 'Thanh toán khi nhận hàng', 1]);
      } catch (paymentErr) {
        console.warn('Could not record supplier payment (receive):', paymentErr.message);
      }

      // Re-read paid_amount in case it changed, then compute deterministically
      const [poFresh] = await connection.execute('SELECT paid_amount, total_amount FROM purchase_orders WHERE id = ? FOR UPDATE', [id]);
      const oldPaid = Number((poFresh && poFresh[0] && poFresh[0].paid_amount) || 0);
      const total = Number((poFresh && poFresh[0] && poFresh[0].total_amount) || 0);
      const newPaid = oldPaid + payAmt;
      let newRemaining = total - newPaid;
      if (newRemaining < 0) newRemaining = 0;

      await connection.execute(`
        UPDATE purchase_orders
        SET paid_amount = ?, remaining_amount = ?, updated_at = NOW()
        WHERE id = ?
      `, [newPaid, newRemaining, id]);

      // Trừ công nợ nhà cung cấp
      await connection.execute(
        'UPDATE suppliers SET total_debt = total_debt - ? WHERE id = ?',
        [payAmt, po.supplier_id]
      );
    }

    // 4. Cập nhật trạng thái PO -> 'completed'
    await connection.execute(
      'UPDATE purchase_orders SET status = ?, actual_delivery_date = ?, updated_at = NOW() WHERE id = ?',
      ['completed', actual_delivery_date, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Nhập hàng thành công',
      data: {
        po_id: id,
        status: 'completed',
        inventory_updates: inventoryUpdates
      }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Lỗi nhập hàng:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ====================== RETURN PURCHASE ORDER ======================
exports.returnPurchaseOrder = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { details, refund_amount, reason } = req.body;

    await connection.beginTransaction();

    const refundAmt = Number(refund_amount) || 0;

    // 1. Lấy thông tin PO và khóa hàng
    const [poRows] = await connection.execute(
      'SELECT id, po_code, supplier_id, paid_amount, total_amount, status FROM purchase_orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (poRows.length === 0) {
      if (connection) await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu nhập' });
    }

    const po = poRows[0];
    if (po.status !== 'completed') {
      if (connection) await connection.rollback();
      return res.status(400).json({ success: false, message: 'Chỉ có thể hoàn trả phiếu ở trạng thái Hoàn thành' });
    }

    // 2. Xử lý từng chi tiết hoàn trả
    for (const detail of details || []) {
      const returnedQty = Number(detail.returned_quantity) || 0;
      if (returnedQty <= 0) continue;

      // 2a. Lấy product_id và received_quantity
      const [podRows] = await connection.execute(
        'SELECT product_id, received_quantity FROM purchase_order_details WHERE id = ? AND po_id = ? FOR UPDATE',
        [detail.po_detail_id, id]
      );

      if (podRows.length === 0) continue;
      const podDetail = podRows[0];
      const productId = podDetail.product_id;
      const receivedQty = Number(podDetail.received_quantity) || 0;

      if (returnedQty > receivedQty) {
        if (connection) await connection.rollback();
        return res.status(400).json({ success: false, message: `Số lượng hoàn trả không thể vượt quá số lượng nhập` });
      }

      // 2b. Cập nhật returned_quantity trong chi tiết
      await connection.execute(
        'UPDATE purchase_order_details SET received_quantity = received_quantity - ? WHERE id = ?',
        [returnedQty, detail.po_detail_id]
      );

      // 2c. Giảm inventory
      const [invRows] = await connection.execute(
        'SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE',
        [productId]
      );

      if (invRows.length === 0) {
        if (connection) await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy tồn kho cho sản phẩm ID ${productId}`
        });
      }

      const currentQty = Number(invRows[0].quantity);
      if (returnedQty > currentQty) {
        if (connection) await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho để hoàn trả. Tồn hiện tại: ${currentQty}, cần hoàn: ${returnedQty}`
        });
      }

      const newQty = currentQty - returnedQty;
      await connection.execute(
        'UPDATE inventory SET quantity = ?, last_updated = NOW() WHERE product_id = ?',
        [newQty, productId]
      );

      // 2d. Ghi log
      await connection.execute(`
        INSERT INTO inventory_log 
        (product_id, transaction_type, quantity_change, quantity_before, quantity_after, 
         reference_id, reference_type, supplier_id, reason, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        productId,
        'export_return',
        -returnedQty,
        currentQty,
        newQty,
        id,
        'purchase_order',
        po.supplier_id,
        `Hoàn trả từ ${po.po_code}: ${reason || 'Không có lý do'}`,
        1
      ]);
    }

    // 3. Xử lý hoàn tiền
    if (refundAmt > 0) {
      try {
        await connection.execute(`
          INSERT INTO supplier_payments (supplier_id, po_id, payment_date, amount, payment_method, bank_account, transaction_code, note, created_by)
          VALUES (?, ?, NOW(), ?, NULL, NULL, NULL, ?, ?)
        `, [po.supplier_id, id, -refundAmt, `Hoàn tiền hoàn trả: ${reason || 'Không có lý do'}`, 1]);
      } catch (paymentErr) {
        console.warn('Could not record refund:', paymentErr.message);
      }

      // Cập nhật paid_amount và remaining_amount
      const oldPaid = Number(po.paid_amount || 0);
      const newPaid = Math.max(oldPaid - refundAmt, 0);
      const totalAmount = Number(po.total_amount || 0);
      let newRemaining = totalAmount - newPaid;
      if (newRemaining < 0) newRemaining = 0;

      await connection.execute(
        'UPDATE purchase_orders SET paid_amount = ?, remaining_amount = ?, updated_at = NOW() WHERE id = ?',
        [newPaid, newRemaining, id]
      );

      // Tăng lại công nợ (hoàn tiền = tăng nợ)
      await connection.execute(
        'UPDATE suppliers SET total_debt = IFNULL(total_debt,0) + ? WHERE id = ?',
        [refundAmt, po.supplier_id]
      );
    }

    // 4. Cập nhật status PO (giữ nguyên 'completed' hoặc có thể thêm trạng thái 'returned')
    await connection.execute(
      'UPDATE purchase_orders SET updated_at = NOW() WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Hoàn trả phiếu nhập thành công',
      data: { po_id: id, refund_amount: refundAmt }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Lỗi hoàn trả:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ====================== DELETE PURCHASE ORDER ======================
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ cho xóa khi status = 'draft'
    const [result] = await pool.execute(
      'DELETE FROM purchase_orders WHERE id = ? AND status = ?',
      [id, 'draft']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể xóa phiếu ở trạng thái Nháp' });
    }

    res.json({ success: true, message: 'Xóa phiếu nhập thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
