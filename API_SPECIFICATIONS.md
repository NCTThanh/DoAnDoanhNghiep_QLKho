# 📡 API Specifications - Hệ Thống Quản Lý Kho

## 🔌 BASE URL
```
http://localhost:3000/api
```

---

## 👥 SUPPLIERS (Nhà Cung Cấp)

### GET /suppliers
**Lấy danh sách tất cả NCC**

**Query Parameters:**
- `status`: active | inactive (tùy chọn)
- `page`: số trang (mặc định: 1)
- `limit`: số record/trang (mặc định: 20)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "supplier_code": "NCC001",
    "name": "NPP Tân Tài Phát",
    "phone": "0918123456",
    "email": "contact@ncc001.com",
    "address": "Quận 10, TP.HCM",
    "tax_id": "0123456789",
    "representative": "Ông Tài",
    "payment_term": "COD",
    "total_debt": 5000000.00,
    "status": "active",
    "note": "Nhà cung cấp uy tín",
    "created_at": "2026-03-25T10:00:00Z",
    "updated_at": "2026-04-28T15:30:00Z"
  }
]
```

---

### POST /suppliers
**Tạo nhà cung cấp mới**

**Request Body:**
```json
{
  "supplier_code": "NCC004",
  "name": "Công ty TNHH Thương mại ABC",
  "phone": "0987654321",
  "email": "sales@nccabc.com",
  "address": "Quận 1, TP.HCM",
  "tax_id": "9876543210",
  "representative": "Ông Minh",
  "payment_term": "30 ngày"
}
```

**Response (201 Created):**
```json
{
  "id": 4,
  "supplier_code": "NCC004",
  "name": "Công ty TNHH Thương mại ABC",
  "total_debt": 0.00,
  "status": "active",
  "message": "Tạo nhà cung cấp thành công"
}
```

---

### GET /suppliers/:id
**Lấy chi tiết nhà cung cấp**

**Response (200 OK):**
```json
{
  "id": 1,
  "supplier_code": "NCC001",
  "name": "NPP Tân Tài Phát",
  "phone": "0918123456",
  "email": "contact@ncc001.com",
  "address": "Quận 10, TP.HCM",
  "total_debt": 5000000.00,
  "recent_po_count": 3,
  "recent_pos": [
    {
      "id": 1,
      "po_code": "PO2026001",
      "po_date": "2026-04-28",
      "total_amount": 2000000.00,
      "paid_amount": 1000000.00,
      "remaining_amount": 1000000.00,
      "status": "received"
    }
  ]
}
```

---

### PUT /suppliers/:id
**Cập nhật nhà cung cấp**

**Request Body:** (các trường cần cập nhật)
```json
{
  "phone": "0918999999",
  "address": "Quận 5, TP.HCM",
  "payment_term": "60 ngày"
}
```

**Response (200 OK):**
```json
{
  "message": "Cập nhật nhà cung cấp thành công"
}
```

---

### DELETE /suppliers/:id
**Xóa nhà cung cấp**

**Điều kiện:** Không có PO nào liên quan (hoặc chỉ draft)

**Response (200 OK):**
```json
{
  "message": "Xóa nhà cung cấp thành công"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Không thể xóa. Nhà cung cấp có phiếu nhập hàng chưa hoàn tất"
}
```

---

## 📦 PURCHASE ORDERS (Phiếu Nhập Hàng)

### GET /purchase-orders
**Lấy danh sách phiếu nhập**

**Query Parameters:**
- `status`: draft | confirmed | received | cancelled
- `supplier_id`: filter theo NCC
- `po_date_from`: từ ngày (YYYY-MM-DD)
- `po_date_to`: đến ngày
- `page`: số trang
- `limit`: số record/trang

**Response (200 OK):**
```json
{
  "total": 25,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": 1,
      "po_code": "PO2026001",
      "supplier_id": 1,
      "supplier_name": "NPP Tân Tài Phát",
      "po_date": "2026-04-28",
      "expected_delivery_date": "2026-05-02",
      "actual_delivery_date": null,
      "total_amount": 2000000.00,
      "paid_amount": 0.00,
      "remaining_amount": 2000000.00,
      "status": "confirmed",
      "item_count": 3,
      "created_by": "admin_thanh"
    }
  ]
}
```

---

### POST /purchase-orders
**Tạo phiếu nhập hàng mới (status='draft')**

**Request Body:**
```json
{
  "supplier_id": 1,
  "po_date": "2026-04-28",
  "expected_delivery_date": "2026-05-02",
  "items": [
    {
      "product_id": 1,
      "quantity": 100,
      "unit_price": 10000.00
    },
    {
      "product_id": 2,
      "quantity": 50,
      "unit_price": 8000.00
    }
  ],
  "note": "Đơn hàng theo yêu cầu"
}
```

**Response (201 Created):**
```json
{
  "id": 5,
  "po_code": "PO2026005",
  "supplier_id": 1,
  "total_amount": 1400000.00,
  "status": "draft",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 100,
      "unit_price": 10000.00,
      "total_price": 1000000.00,
      "received_quantity": 0
    },
    {
      "id": 2,
      "product_id": 2,
      "quantity": 50,
      "unit_price": 8000.00,
      "total_price": 400000.00,
      "received_quantity": 0
    }
  ]
}
```

---

### GET /purchase-orders/:id
**Lấy chi tiết phiếu nhập**

**Response (200 OK):**
```json
{
  "id": 1,
  "po_code": "PO2026001",
  "supplier": {
    "id": 1,
    "supplier_code": "NCC001",
    "name": "NPP Tân Tài Phát"
  },
  "po_date": "2026-04-28",
  "expected_delivery_date": "2026-05-02",
  "actual_delivery_date": "2026-05-01",
  "total_amount": 2000000.00,
  "paid_amount": 1000000.00,
  "remaining_amount": 1000000.00,
  "status": "received",
  "details": [
    {
      "id": 1,
      "product_id": 1,
      "product_code": "SP0001",
      "product_name": "Bia Tiger lon cao 330ml (Thùng)",
      "quantity": 100,
      "unit_price": 10000.00,
      "total_price": 1000000.00,
      "received_quantity": 100,
      "note": null
    },
    {
      "id": 2,
      "product_id": 2,
      "product_code": "SP0002",
      "product_name": "Nước ngọt Coca Cola 320ml (Thùng)",
      "quantity": 100,
      "unit_price": 10000.00,
      "total_price": 1000000.00,
      "received_quantity": 100,
      "note": null
    }
  ],
  "created_by": "admin_thanh",
  "note": "Đơn hàng quan trọng"
}
```

---

### PUT /purchase-orders/:id/confirm
**Xác nhận phiếu nhập (draft → confirmed)**

**Điều kiện:** `status` phải là 'draft'

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "confirmed",
  "message": "Xác nhận phiếu nhập thành công",
  "supplier_debt_updated": {
    "supplier_id": 1,
    "new_total_debt": 7000000.00
  }
}
```

---

### PUT /purchase-orders/:id/receive
**Nhập hàng thực tế (confirmed → received) ⭐ QUAN TRỌNG**

**Điều kiện:** `status` phải là 'confirmed'

**Request Body:**
```json
{
  "actual_delivery_date": "2026-05-01",
  "details": [
    {
      "po_detail_id": 1,
      "received_quantity": 100
    },
    {
      "po_detail_id": 2,
      "received_quantity": 98
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "received",
  "actual_delivery_date": "2026-05-01",
  "message": "Nhập hàng thành công",
  "inventory_updates": [
    {
      "product_id": 1,
      "product_name": "Bia Tiger lon cao 330ml (Thùng)",
      "quantity_before": 100,
      "quantity_received": 100,
      "quantity_after": 200
    },
    {
      "product_id": 2,
      "product_name": "Nước ngọt Coca Cola 320ml (Thùng)",
      "quantity_before": 100,
      "quantity_received": 98,
      "quantity_after": 198
    }
  ],
  "logs_created": 2
}
```

**Logic Backend khi nhập hàng:**
```javascript
FOR EACH detail IN details:
  1. UPDATE inventory: quantity += received_quantity
  2. INSERT inventory_log record
  3. UPDATE cost_price nếu cần
  
THEN:
  - UPDATE purchase_orders: status = 'received'
  - GHI NHẬT LẠI tổng nhập từ purchase_order_details
```

---

### DELETE /purchase-orders/:id
**Xóa phiếu nhập (chỉ khi status='draft')**

**Response (200 OK):**
```json
{
  "message": "Xóa phiếu nhập thành công"
}
```

---

## 💳 SUPPLIER PAYMENTS (Thanh Toán NCC)

### GET /supplier-payments
**Lấy danh sách thanh toán**

**Query Parameters:**
- `supplier_id`: filter theo NCC
- `payment_date_from`: từ ngày
- `payment_date_to`: đến ngày
- `po_id`: filter theo PO

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "supplier_id": 1,
    "supplier_name": "NPP Tân Tài Phát",
    "po_id": 1,
    "po_code": "PO2026001",
    "payment_date": "2026-05-05",
    "amount": 1000000.00,
    "payment_method": "bank_transfer",
    "bank_account": "123456789 - Vietcombank",
    "transaction_code": "TT20260505001",
    "created_by": "admin_thanh"
  }
]
```

---

### POST /supplier-payments
**Ghi nhận thanh toán cho NCC**

**Request Body:**
```json
{
  "supplier_id": 1,
  "po_id": 1,
  "payment_date": "2026-05-05",
  "amount": 1000000.00,
  "payment_method": "bank_transfer",
  "bank_account": "123456789 - Vietcombank",
  "transaction_code": "TT20260505001",
  "note": "Thanh toán trả trước cho PO2026001"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "message": "Ghi nhận thanh toán thành công",
  "updates": {
    "purchase_order": {
      "id": 1,
      "paid_amount": 1000000.00,
      "remaining_amount": 1000000.00
    },
    "supplier": {
      "id": 1,
      "total_debt": 6000000.00
    }
  }
}
```

---

## 📊 INVENTORY LOG (Lịch Sử Kho)

### GET /inventory-log
**Lấy lịch sử giao dịch kho**

**Query Parameters:**
- `product_id`: filter theo sản phẩm
- `transaction_type`: import_purchase_order | export_sales | export_return | adjustment_increase | adjustment_decrease | damage | count_check
- `created_date_from`: từ ngày
- `created_date_to`: đến ngày
- `page`: số trang
- `limit`: số record/trang

**Response (200 OK):**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_code": "SP0001",
      "product_name": "Bia Tiger lon cao 330ml (Thùng)",
      "transaction_type": "import_purchase_order",
      "quantity_change": 100,
      "quantity_before": 0,
      "quantity_after": 100,
      "reference_id": 1,
      "reference_type": "purchase_order",
      "reference_code": "PO2026001",
      "supplier_id": 1,
      "supplier_name": "NPP Tân Tài Phát",
      "reason": "Nhập từ PO2026001",
      "created_by": "admin_thanh",
      "created_at": "2026-05-01T14:30:00Z"
    },
    {
      "id": 2,
      "product_id": 1,
      "product_code": "SP0001",
      "product_name": "Bia Tiger lon cao 330ml (Thùng)",
      "transaction_type": "export_sales",
      "quantity_change": -5,
      "quantity_before": 100,
      "quantity_after": 95,
      "reference_id": 101,
      "reference_type": "sales_order",
      "reference_code": "ORDER20260502001",
      "customer_id": null,
      "reason": "Bán lẻ",
      "created_by": "staff_001",
      "created_at": "2026-05-02T16:45:00Z"
    }
  ]
}
```

---

### GET /products/:product_id/history
**Lấy lịch sử của một sản phẩm cụ thể**

**Response (200 OK):**
```json
{
  "product_id": 1,
  "product_code": "SP0001",
  "product_name": "Bia Tiger lon cao 330ml (Thùng)",
  "current_stock": 95,
  "history": [
    {
      "date": "2026-05-01",
      "transaction_type": "import_purchase_order",
      "quantity_change": 100,
      "quantity_before": 0,
      "quantity_after": 100,
      "supplier": "NPP Tân Tài Phát",
      "reason": "Nhập từ PO2026001"
    },
    {
      "date": "2026-05-02",
      "transaction_type": "export_sales",
      "quantity_change": -5,
      "quantity_before": 100,
      "quantity_after": 95,
      "customer": "Khách lẻ",
      "reason": "Bán lẻ"
    }
  ]
}
```

---

## 🛍️ PRODUCTS (Hàng Hóa - CẬP NHẬT)

### GET /products
**Lấy danh sách sản phẩm**

**Query Parameters:**
- `category_id`: filter theo danh mục
- `status`: active | inactive | discontinued
- `search`: tìm kiếm theo tên hoặc mã
- `min_stock_alert`: true (chỉ hiển thị sắp hết)
- `page`: số trang
- `limit`: số record/trang

**Response (200 OK) - CẤU TRÚC MỚI:**
```json
[
  {
    "id": 1,
    "product_code": "SP0001",
    "barcode": "8936043001234",
    "name": "Bia Tiger lon cao 330ml (Thùng)",
    "category_id": 1,
    "category_name": "Nước giải khát",
    "unit": "Thùng",
    "cost_price": 320000.00,
    "base_price": 320000.00,
    "sell_price": 350000.00,
    "discount_percent": 0.00,
    "min_stock_level": 50,
    "current_stock": 95,
    "stock_status": "ok",
    "status": "active",
    "image_url": null,
    "created_at": "2026-03-25T13:41:35Z",
    "updated_at": "2026-04-28T15:30:00Z"
  }
]
```

---

### POST /products
**Tạo sản phẩm mới - CẬP NHẬT**

**Request Body:**
```json
{
  "product_code": "SP0031",
  "barcode": "8936043099999",
  "name": "Bia Heineken 330ml (Thùng)",
  "category_id": 1,
  "unit": "Thùng",
  "cost_price": 350000.00,
  "base_price": 350000.00,
  "sell_price": 380000.00,
  "discount_percent": 0.00,
  "min_stock_level": 30
}
```

**Response (201 Created):**
```json
{
  "id": 31,
  "product_code": "SP0031",
  "name": "Bia Heineken 330ml (Thùng)",
  "unit": "Thùng",
  "cost_price": 350000.00,
  "min_stock_level": 30
}
```

---

### PUT /products/:id
**Cập nhật sản phẩm - CẬP NHẬT**

**Request Body:** (các trường cần cập nhật)
```json
{
  "barcode": "8936043099999",
  "unit": "Lốc",
  "cost_price": 330000.00,
  "sell_price": 365000.00,
  "min_stock_level": 100,
  "status": "active"
}
```

**Response (200 OK):**
```json
{
  "message": "Cập nhật sản phẩm thành công"
}
```

---

## ⚠️ ERROR RESPONSES

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": {
    "quantity": "Số lượng phải > 0"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Vui lòng đăng nhập"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Bạn không có quyền thực hiện hành động này"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Không tìm thấy nhà cung cấp"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Lỗi xử lý trên server"
}
```

---

## 📌 STATUS CODES THƯỜNG DÙNG

| Code | Ý Nghĩa |
|------|---------|
| 200 | OK - Thành công |
| 201 | Created - Tạo thành công |
| 400 | Bad Request - Yêu cầu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập |
| 403 | Forbidden - Không có quyền |
| 404 | Not Found - Không tìm thấy |
| 409 | Conflict - Xung đột dữ liệu |
| 500 | Internal Server Error - Lỗi server |

---

## 🔐 AUTHENTICATION

Tất cả endpoints (trừ login) yêu cầu:

**Header:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 📝 NOTES

- Tất cả `amount` là kiểu số nguyên (đơn vị: VNĐ)
- `date` format: YYYY-MM-DD (ISO 8601)
- `datetime` format: YYYY-MM-DDTHH:mm:ssZ (ISO 8601)
- Tất cả response JSON lấy cấu trúc: `{ data: ..., message: ..., error: ... }`
- Pagination: `page` bắt đầu từ 1

---

## 🧪 TESTING DENGAN CURL

```bash
# Lấy danh sách NCC
curl -X GET http://localhost:3000/api/suppliers \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json"

# Tạo PO mới
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "po_date": "2026-04-28",
    "items": [{"product_id": 1, "quantity": 100, "unit_price": 10000}]
  }'

# Nhập hàng
curl -X PUT http://localhost:3000/api/purchase-orders/1/receive \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_delivery_date": "2026-04-28",
    "details": [{"po_detail_id": 1, "received_quantity": 100}]
  }'
```

---

Good luck! 🚀
