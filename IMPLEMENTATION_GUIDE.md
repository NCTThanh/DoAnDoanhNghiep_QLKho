# 📋 Hướng Dẫn Thực Hiện Chi Tiết - Nâng Cấp Hệ Thống Quản Lý Kho

## 🎯 Mục Tiêu Tổng Thể
Chuyển từ hệ thống quản lý hàng hóa **tĩnh** (chỉ CRUD sản phẩm) sang hệ thống **năng động** với:
- ✅ Phiếu nhập hàng thực tế từ NCC
- ✅ Lịch sử giao dịch chi tiết (Thẻ Kho)
- ✅ Quản lý công nợ NCC
- ✅ Tồn kho tự động cập nhật (không tự gõ tay)

---

## 📅 GIAI ĐOẠN THỰC HIỆN

### **PHASE 1: CHUẨN BỊ (1-2 ngày)**

#### Bước 1.1: Chạy Migration SQL
```bash
# Mở PhpMyAdmin hoặc MySQL Command Line
# Import file: MIGRATION_UPGRADE_SCHEMA.sql

mysql -u root -p bach_hoa_db < MIGRATION_UPGRADE_SCHEMA.sql
```

**Kiểm tra sau khi chạy:**
```sql
-- Bảng mới
SHOW TABLES;
-- Kết quả: categories, inventory, inventory_log, locations, products, 
--          purchase_orders, purchase_order_details, suppliers, 
--          supplier_payments, users

-- Cột mới của products
DESCRIBE products;
-- Kiểm tra: barcode, unit, cost_price, min_stock_level, status
```

#### Bước 1.2: Cập nhật Backend Models/Services
Tạo các file mới để xử lý logic:
- `backend/models/Supplier.js`
- `backend/models/PurchaseOrder.js`
- `backend/services/inventoryService.js`

---

### **PHASE 2: BACKEND - TẠO API ENDPOINTS (3-4 ngày)**

#### 2.1 API Nhà Cung Cấp (Suppliers)

**Endpoints cần tạo:**

```javascript
// GET /api/suppliers
// Lấy danh sách tất cả NCC
// Response: { id, supplier_code, name, phone, address, total_debt, status }

// POST /api/suppliers
// Tạo NCC mới
// Body: { supplier_code, name, phone, email, address, payment_term }

// GET /api/suppliers/:id
// Lấy chi tiết NCC + công nợ

// PUT /api/suppliers/:id
// Cập nhật thông tin NCC

// DELETE /api/suppliers/:id
// Xóa NCC (nếu không có PO liên quan)

// GET /api/suppliers/:id/debt-history
// Lịch sử thay đổi công nợ
```

**File: `backend/routes/supplierRoutes.js`**
```javascript
router.get('/suppliers', controllerSupplier.getAll);
router.post('/suppliers', controllerSupplier.create);
router.get('/suppliers/:id', controllerSupplier.getById);
router.put('/suppliers/:id', controllerSupplier.update);
router.delete('/suppliers/:id', controllerSupplier.delete);
router.get('/suppliers/:id/debt-history', controllerSupplier.getDebtHistory);
```

---

#### 2.2 API Phiếu Nhập Hàng (Purchase Orders)

**Endpoints cần tạo:**

```javascript
// GET /api/purchase-orders
// Lấy danh sách PO
// Query: ?status=draft&supplier_id=1
// Response: Danh sách PO với status, total_amount, paid_amount

// POST /api/purchase-orders
// Tạo PO mới (status='draft')
// Body: {
//   supplier_id: 1,
//   po_date: "2026-04-28",
//   items: [
//     { product_id: 1, quantity: 100, unit_price: 10000 },
//     { product_id: 2, quantity: 50, unit_price: 8000 }
//   ]
// }
// Response: { id, po_code, total_amount, status: 'draft' }

// GET /api/purchase-orders/:id
// Lấy chi tiết PO + chi tiết dòng hàng

// PUT /api/purchase-orders/:id
// Cập nhật PO (chỉ khi status='draft')

// PUT /api/purchase-orders/:id/confirm
// Xác nhận PO (status: draft → confirmed)
// Cộng công nợ NCC

// PUT /api/purchase-orders/:id/receive
// Nhập hàng (status: confirmed → received)
// ⭐ TỰ ĐỘNG UPDATE tồn kho + tạo inventory_log
// Body: {
//   actual_delivery_date: "2026-04-28",
//   details: [
//     { po_detail_id: 1, received_quantity: 100 },
//     { po_detail_id: 2, received_quantity: 50 }
//   ]
// }

// DELETE /api/purchase-orders/:id
// Xóa PO (chỉ khi status='draft')
```

**Logic Quan Trọng - Khi Nhập Hàng (`/receive`):**

```javascript
// File: backend/controllers/purchaseOrderController.js

async receivePurchaseOrder(req, res) {
  const { id } = req.params;
  const { actual_delivery_date, details } = req.body;
  
  try {
    // 1. Bắt đầu transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 2. Lấy thông tin PO
    const [poRows] = await connection.query(
      'SELECT * FROM purchase_orders WHERE id = ?',
      [id]
    );
    const po = poRows[0];
    
    // 3. Cập nhật từng chi tiết PO
    for (const detail of details) {
      // 3a. Cập nhật received_quantity
      await connection.query(
        'UPDATE purchase_order_details SET received_quantity = ? WHERE id = ?',
        [detail.received_quantity, detail.po_detail_id]
      );
      
      // 3b. Lấy thông tin product
      const [poDetail] = await connection.query(
        'SELECT product_id FROM purchase_order_details WHERE id = ?',
        [detail.po_detail_id]
      );
      const productId = poDetail[0].product_id;
      
      // 3c. Lấy tồn kho hiện tại
      const [invRows] = await connection.query(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [productId]
      );
      const quantityBefore = invRows[0]?.quantity || 0;
      
      // 3d. CẬP NHẬT TỒN KHO
      await connection.query(
        'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
        [detail.received_quantity, productId]
      );
      
      // 3e. Lấy tồn kho sau
      const [newInvRows] = await connection.query(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [productId]
      );
      const quantityAfter = newInvRows[0].quantity;
      
      // 3f. GHI LOG - Thẻ Kho
      await connection.query(
        `INSERT INTO inventory_log 
        (product_id, transaction_type, quantity_change, quantity_before, 
         quantity_after, reference_id, reference_type, supplier_id, reason, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          'import_purchase_order',
          detail.received_quantity,
          quantityBefore,
          quantityAfter,
          id,
          'purchase_order',
          po.supplier_id,
          `Nhập từ PO${po.po_code}`,
          req.user?.id || 1 // user_id
        ]
      );
    }
    
    // 4. Cập nhật trạng thái PO
    await connection.query(
      'UPDATE purchase_orders SET status = ?, actual_delivery_date = ? WHERE id = ?',
      ['received', actual_delivery_date, id]
    );
    
    // 5. Commit transaction
    await connection.commit();
    await connection.release();
    
    res.json({ success: true, message: 'Nhập hàng thành công!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  }
}
```

---

#### 2.3 API Thanh Toán NCC

```javascript
// POST /api/supplier-payments
// Ghi nhận thanh toán cho NCC
// Body: {
//   supplier_id: 1,
//   po_id: 123,
//   amount: 500000,
//   payment_date: "2026-04-28",
//   payment_method: "bank_transfer"
// }
// Logic:
//   - Tạo supplier_payments record
//   - Cập nhật purchase_orders (paid_amount, remaining_amount)
//   - Cập nhật suppliers (total_debt)

// GET /api/supplier-payments
// Lấy danh sách thanh toán
```

---

#### 2.4 API Lịch Sử Kho (Inventory Log)

```javascript
// GET /api/inventory-log
// Lấy danh sách giao dịch
// Query: ?product_id=1&start_date=2026-01-01&end_date=2026-04-28

// GET /api/inventory-log/:id
// Chi tiết giao dịch

// GET /api/products/:product_id/history
// Lịch sử tồn kho của 1 sản phẩm
// Response: [
//   { date, transaction_type, quantity_change, quantity_before, quantity_after, reason }
// ]
```

---

### **PHASE 3: FRONTEND - TẠO GIAO DIỆN (4-5 ngày)**

#### 3.1 Trang Quản Lý Nhà Cung Cấp

**File: `frontend/src/pages/Suppliers.jsx`**

```javascript
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Lấy danh sách NCC
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      message.error('Lỗi tải danh sách NCC');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Cột hiển thị
  const columns = [
    { title: 'Mã NCC', dataIndex: 'supplier_code', key: 'supplier_code', width: 100 },
    { title: 'Tên NCC', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true },
    { 
      title: 'Công nợ', 
      dataIndex: 'total_debt', 
      key: 'total_debt',
      render: (debt) => (
        <span style={{ color: debt > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
          {debt.toLocaleString('vi-VN')} ₫
        </span>
      )
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => status === 'active' ? '✓ Hoạt động' : '✗ Ngừng' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleEdit(record)}>
            <EditOutlined /> Sửa
          </Button>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small">
              <DeleteOutlined /> Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      message.success('Xóa NCC thành công');
      fetchSuppliers();
    } catch (error) {
      message.error('Lỗi xóa NCC');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers';
      const method = editingId ? 'PUT' : 'POST';
      await fetch(url, { method, body: JSON.stringify(values), headers: { 'Content-Type': 'application/json' } });
      message.success(editingId ? 'Cập nhật thành công' : 'Thêm NCC thành công');
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Nhà Cung Cấp
        </Button>
      </div>

      <Table columns={columns} dataSource={suppliers} loading={loading} rowKey="id" />

      <Modal
        title={editingId ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Mã NCC" name="supplier_code" rules={[{ required: true }]}>
            <Input placeholder="VD: NCC001" />
          </Form.Item>
          <Form.Item label="Tên NCC" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Hạn thanh toán" name="payment_term">
            <Select placeholder="Chọn hạn">
              <Select.Option value="COD">COD (Trả khi nhận)</Select.Option>
              <Select.Option value="30 ngày">30 ngày</Select.Option>
              <Select.Option value="60 ngày">60 ngày</Select.Option>
              <Select.Option value="Khác">Khác</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" initialValue="active">
            <Select>
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Ngừng</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

**Sidebar Update: Thêm menu item**
```javascript
{
  key: 'suppliers',
  icon: <ShopOutlined />,
  label: 'Nhà Cung Cấp',
  to: '/suppliers'
}
```

---

#### 3.2 Trang Phiếu Nhập Hàng

**File: `frontend/src/pages/PurchaseOrders.jsx`** (Trang chính)

**Tính năng:**
- Danh sách PO với filter theo status, supplier
- Nút "Tạo PO mới"
- Hiển thị: Mã PO, NCC, Ngày, Tổng tiền, Công nợ, Trạng thái
- Thao tác: Xem, Sửa (khi draft), Xác nhận, Nhập hàng, Thanh toán

**File: `frontend/src/pages/CreatePurchaseOrder.jsx`** (Tạo/Sửa PO)

**Tính năng:**
- Chọn Nhà Cung Cấp từ dropdown
- Thêm chi tiết sản phẩm:
  - Chọn sản phẩm
  - Nhập số lượng
  - Nhập giá nhập (hoặc lấy từ cost_price của sản phẩm)
  - Tính tự động tổng tiền
- Hiển thị tổng tiền PO
- Nút "Lưu nháp" / "Xác nhận" / "Nhập hàng"

**File: `frontend/src/pages/ReceivePurchaseOrder.jsx`** (Nhập hàng)

**Tính năng:**
- Hiển thị chi tiết PO (chỉ khi status=confirmed)
- Cho phép nhập số lượng thực nhập (có thể khác quantity)
- Ngày nhập hàng thực tế
- Nút "Xác nhận nhập"

---

#### 3.3 Cập Nhật Trang Hàng Hóa (Products)

**File: `frontend/src/pages/ProductManagement.jsx`** (Cập nhật)

**Thêm các trường:**
- `barcode`: Mã vạch
- `unit`: Đơn vị tính (dropdown)
- `cost_price`: Giá vốn
- `min_stock_level`: Tồn kho tối thiểu (báo đỏ)
- `status`: Trạng thái (active/inactive)

**Cập nhật cảnh báo tồn kho:**
```javascript
// Thay vì: quantity > 10 ? 'green' : 'red'
// Dùng: quantity > product.min_stock_level ? 'green' : 'red'

const getStockStatus = (quantity, minLevel) => {
  if (quantity === 0) return { color: 'red', text: '✗ Hết hàng' };
  if (quantity < minLevel) return { color: 'orange', text: '⚠ Sắp hết' };
  return { color: 'green', text: '✓ Đủ' };
};
```

**Thêm nút xem lịch sử:**
```javascript
<Button size="small" onClick={() => showInventoryHistory(product.id)}>
  📊 Lịch sử
</Button>
```

---

#### 3.4 Trang Lịch Sử Kho (Inventory History)

**File: `frontend/src/pages/InventoryHistory.jsx`** (Mới)

**Tính năng:**
- Chọn sản phẩm
- Khoảng ngày
- Hiển thị bảng:
  - Ngày
  - Loại giao dịch (Nhập, Bán, Trả, Điều chỉnh)
  - Nhà cung cấp / Khách hàng
  - Số lượng thay đổi
  - Tồn trước / Tồn sau
  - Lý do

**Ví dụ dữ liệu:**

| Ngày | Loại | Supplier/Customer | Số lượng | Tồn Trước | Tồn Sau | Lý do |
|------|------|-------------------|---------|-----------|---------|-------|
| 01/04 | Nhập | NCC Tân Tài | +100 | 0 | 100 | PO0001 |
| 05/04 | Bán | Khách lẻ | -5 | 100 | 95 | ORDER001 |
| 08/04 | Trả | NCC Tân Tài | -2 | 95 | 93 | Lỗi sản phẩm |

---

### **PHASE 4: TÍCH HỢP & TEST (2-3 ngày)**

#### 4.1 Kiểm Tra API
```javascript
// Test tạo NCC
POST /api/suppliers
{ "supplier_code": "TEST001", "name": "Test Supplier", "phone": "0912345678" }

// Test tạo PO
POST /api/purchase-orders
{ 
  "supplier_id": 1,
  "po_date": "2026-04-28",
  "items": [{ "product_id": 1, "quantity": 100, "unit_price": 10000 }]
}

// Test nhập hàng (QUAN TRỌNG - kiểm tra tồn kho tự động cộng)
PUT /api/purchase-orders/1/receive
{
  "actual_delivery_date": "2026-04-28",
  "details": [{ "po_detail_id": 1, "received_quantity": 100 }]
}

// Verify: GET /api/inventory → quantity phải +100
// Verify: GET /api/inventory-log → phải có record import_purchase_order
// Verify: GET /api/suppliers/1 → total_debt phải thay đổi
```

#### 4.2 Kiểm Tra Frontend
- [ ] Trang Suppliers: Thêm, sửa, xóa, xem danh sách
- [ ] Trang PurchaseOrders: Tạo, xác nhận, nhập hàng
- [ ] Trang ProductManagement: Hiển thị các trường mới
- [ ] Trang InventoryHistory: Xem lịch sử

---

## 📦 CẤU TRÚC FILE SAU NÂNG CẬP

```
backend/
├── controllers/
│   ├── inventoryController.js (cập nhật)
│   ├── productController.js (cập nhật)
│   ├── supplierController.js (mới)
│   ├── purchaseOrderController.js (mới)
│   └── supplierPaymentController.js (mới)
├── routes/
│   ├── supplierRoutes.js (mới)
│   ├── purchaseOrderRoutes.js (mới)
│   ├── productRoutes.js (cập nhật)
│   └── app.js (thêm routes mới)
└── services/
    └── inventoryService.js (mới - logic tích hợp)

frontend/src/
├── pages/
│   ├── ProductManagement.jsx (cập nhật)
│   ├── Suppliers.jsx (mới)
│   ├── PurchaseOrders.jsx (mới)
│   ├── CreatePurchaseOrder.jsx (mới)
│   ├── ReceivePurchaseOrder.jsx (mới)
│   └── InventoryHistory.jsx (mới)
└── components/
    └── common/
        └── Sidebar.jsx (cập nhật menu)
```

---

## ✅ CHECKLIST HOÀN THÀNH

### Backend
- [ ] Migration SQL chạy thành công
- [ ] API Suppliers (CRUD)
- [ ] API PurchaseOrders (CRUD + confirm + receive)
- [ ] API SupplierPayments
- [ ] API InventoryLog
- [ ] Logic UPDATE tồn kho tự động khi receive
- [ ] Logic UPDATE công nợ NCC
- [ ] Test tất cả endpoints

### Frontend
- [ ] Trang Suppliers
- [ ] Trang PurchaseOrders (danh sách)
- [ ] Trang CreatePurchaseOrder
- [ ] Trang ReceivePurchaseOrder
- [ ] Cập nhật ProductManagement (thêm các trường)
- [ ] Trang InventoryHistory
- [ ] Sidebar menu updates
- [ ] Test tất cả pages

### Database
- [ ] Backup database cũ
- [ ] Chạy migration
- [ ] Verify bảng mới + cột mới
- [ ] Test foreign keys

---

## 🎓 HƯỚNG DẪN SỬ DỤNG

### Quy Trình Nhập Hàng Hoàn Chỉnh

1. **Trang Nhà Cung Cấp**: Quản lý danh sách NCC
   - Thêm NCC mới: Click "Thêm NCC" → Nhập thông tin → Lưu

2. **Trang Phiếu Nhập**: Tạo PO
   - Click "Tạo PO mới"
   - Chọn NCC
   - Thêm sản phẩm cần nhập (chọn từ dropdown, nhập SL, nhập giá)
   - Lưu nháp hoặc xác nhận ngay

3. **Xác Nhận PO**: Nút "Xác nhận" → Cộng công nợ NCC

4. **Nhập Hàng**: Nút "Nhập hàng"
   - Nhập ngày thực tế
   - Nhập SL thực nhập (nếu khác)
   - Click "Xác nhận"
   → **Tồn kho tự động cộng**

5. **Thanh Toán**: Nút "Thanh toán"
   - Nhập số tiền
   - Chọn phương thức
   → **Công nợ tự động trừ**

---

## 🚀 LỢI ÍCH NGAY LẬP TỨC

✅ **Tồn kho chính xác**: Không còn gõ tay sai
✅ **Lịch sử đầy đủ**: Xem được lý do tồn kho thay đổi
✅ **Quản lý công nợ**: Biết mình nợ NCC bao nhiêu
✅ **Báo cáo**: Dữ liệu đủ để tính lợi nhuận, phân tích
✅ **Tiêu chuẩn thực tế**: Sát với quy trình KiotViet, Haravan

---

## 📞 SUPPORT

Nếu gặp lỗi trong quá trình thực hiện:
1. Kiểm tra file log backend
2. Mở DevTools (F12) xem lỗi frontend
3. Verify database schema: `DESCRIBE [table_name];`
4. Test từng API riêng lẻ trước khi tích hợp

Good luck! 🎉
