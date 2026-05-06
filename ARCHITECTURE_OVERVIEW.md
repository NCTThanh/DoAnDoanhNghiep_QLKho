# 📊 Architecture & System Overview

## 🎨 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WAREHOUSE MANAGEMENT SYSTEM                    │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────┐          ┌─────────────────────────────┐
│   FRONTEND (React + Vite)  │          │   BACKEND (Node.js Express) │
├────────────────────────────┤          ├─────────────────────────────┤
│                            │          │                             │
│ Pages:                     │          │ Routes & Controllers:       │
│ ✓ Dashboard               │◄─────────►│ ✓ /suppliers              │
│ ✓ Products               │          │ ✓ /products               │
│ ✓ Suppliers (NEW)        │          │ ✓ /purchase-orders (NEW)  │
│ ✓ Purchase Orders (NEW)  │          │ ✓ /inventory-log (NEW)    │
│ ✓ Inventory History (NEW)│          │ ✓ /supplier-payments (NEW)│
│ ✓ Invoices               │          │                             │
│ ✓ Warehouse Map          │          │ Services:                   │
│                            │          │ • inventoryService         │
│ Components:                │          │ • supplierService          │
│ • Sidebar (Updated)       │          │ • poService               │
│ • Common UI               │          │                             │
│                            │          │ Controllers:                │
└────────────────────────────┘          │ • supplierController       │
           │                            │ • poController (NEW)       │
           │                            │ • inventoryController      │
           │                            │                             │
           │                            └─────────────────────────────┘
           │                                      │
           └──────────────────┬───────────────────┘
                              │
                    ┌─────────▼────────────┐
                    │   MySQL Database    │
                    │  (bach_hoa_db)      │
                    ├─────────────────────┤
                    │ Tables:             │
                    │ • users             │
                    │ • categories        │
                    │ • products (✏️)    │
                    │ • inventory         │
                    │ • suppliers (🆕)   │
                    │ • purchase_orders   │
                    │   (🆕)              │
                    │ • po_details (🆕) │
                    │ • inventory_log     │
                    │   (🆕)              │
                    │ • supplier_payments │
                    │   (🆕)              │
                    │ • locations         │
                    └─────────────────────┘
```

---

## 📋 Database Schema (New Relations)

```
┌──────────────────────┐         ┌──────────────────────────┐
│    SUPPLIERS         │         │  PURCHASE_ORDERS         │
├──────────────────────┤         ├──────────────────────────┤
│ id (PK)              │◄────────│ id (PK)                  │
│ supplier_code        │   1:N   │ supplier_id (FK)         │
│ name                 │         │ po_code                  │
│ phone                │         │ po_date                  │
│ email                │         │ actual_delivery_date     │
│ address              │         │ total_amount             │
│ tax_id               │         │ paid_amount              │
│ representative       │         │ remaining_amount         │
│ payment_term         │         │ status (draft/confirmed/ │
│ total_debt           │         │         received/cancelled)
│ status               │         │ created_by               │
│ note                 │         │ created_at               │
│ created_at           │         │ updated_at               │
│ updated_at           │         └──────────────────────────┘
└──────────────────────┘                  │
          ▲                                │ 1:N
          │                                ▼
          │                    ┌──────────────────────────┐
          │                    │ PURCHASE_ORDER_DETAILS   │
          │                    ├──────────────────────────┤
          │                    │ id (PK)                  │
          │                    │ po_id (FK)               │
          │                    │ product_id (FK)          │
          │                    │ quantity                 │
          │                    │ unit_price               │
          │                    │ total_price              │
          │                    │ received_quantity        │
          │                    │ note                     │
          │                    └──────────────────────────┘
          │
          │
          │                    ┌──────────────────────────┐
          │                    │   PRODUCTS (✏️)         │
          │                    ├──────────────────────────┤
          │                    │ id (PK)                  │
          │                    │ product_code (UK)        │
          │                    │ barcode (NEW)            │
          │                    │ name                     │
          │                    │ category_id (FK)         │
          │                    │ unit (NEW)               │
          │                    │ cost_price (NEW)         │
          │                    │ base_price               │
          │                    │ sell_price               │
          │                    │ discount_percent         │
          │                    │ min_stock_level (NEW)    │
          │                    │ image_url                │
          │                    │ status (NEW)             │
          │                    │ created_at               │
          │                    │ updated_at (NEW)         │
          │                    └──────────────────────────┘
          │                                 │
          │                                 │ 1:N
          │                                 ▼
          │                    ┌──────────────────────────┐
          │                    │  INVENTORY_LOG (🆕)      │
          │                    ├──────────────────────────┤
          │                    │ id (PK)                  │
          │                    │ product_id (FK)          │
          │                    │ location_id (FK)         │
          │                    │ transaction_type         │
          │                    │ quantity_change          │
          │                    │ quantity_before          │
          │                    │ quantity_after           │
          │                    │ reference_id             │
          │                    │ reference_type           │
          │                    │ supplier_id (FK)─────────┼─────┘
          │                    │ reason                   │
          │                    │ created_by               │
          │                    │ created_at               │
          │                    └──────────────────────────┘
          │
          │
          └────────────────────┐
                               │ 1:N
                               ▼
                    ┌──────────────────────────┐
                    │  SUPPLIER_PAYMENTS (🆕) │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ supplier_id (FK)         │
                    │ po_id (FK)               │
                    │ payment_date             │
                    │ amount                   │
                    │ payment_method           │
                    │ bank_account             │
                    │ transaction_code         │
                    │ note                     │
                    │ created_by               │
                    │ created_at               │
                    └──────────────────────────┘
```

---

## 🔄 Purchase Order Workflow

```
WORKFLOW NHẬP HÀNG (Purchase Order Cycle)

┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: TẠO PHIẾU NHẬP                                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/purchase-orders                                   │
│ ├─ supplier_id: Chọn NCC                                   │
│ ├─ po_date: Ngày lập PO                                    │
│ └─ items: Danh sách hàng cần nhập                          │
│                                                              │
│ ✓ Tạo record: purchase_orders (status='draft')             │
│ ✓ Tạo N records: purchase_order_details                    │
│ ✓ Tính total_amount = SUM(quantity × unit_price)           │
│ ✓ Tồn kho: KHÔNG thay đổi                                  │
│ ✓ Công nợ: KHÔNG thay đổi                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: XÁC NHẬN PHIẾU NHẬP                                 │
├─────────────────────────────────────────────────────────────┤
│ PUT /api/purchase-orders/:id/confirm                        │
│ ├─ status: 'draft' → 'confirmed'                           │
│ └─ Update: purchase_orders                                  │
│                                                              │
│ ✓ Tồn kho: KHÔNG thay đổi                                  │
│ ✓ Công nợ: TĂNG (suppliers.total_debt += po.total_amount) │
│ ✓ Logic: Cộng công nợ để theo dõi                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: NHẬP HÀNG THỰC TẾ ⭐ QUAN TRỌNG                    │
├─────────────────────────────────────────────────────────────┤
│ PUT /api/purchase-orders/:id/receive                        │
│ ├─ actual_delivery_date: Ngày nhập thực tế                │
│ ├─ details: Số lượng thực nhập (có thể ≠ quantity)        │
│ └─ status: 'confirmed' → 'received'                        │
│                                                              │
│ FOR EACH detail IN received_items:                         │
│   1. UPDATE purchase_order_details.received_quantity      │
│   2. UPDATE inventory.quantity += received_quantity       │
│   3. CREATE inventory_log record                          │
│      ├─ transaction_type: 'import_purchase_order'         │
│      ├─ quantity_change: +received_quantity               │
│      ├─ reference_id: po.id                               │
│      ├─ supplier_id: po.supplier_id                       │
│      └─ reason: f"Nhập từ PO{po.po_code}"                │
│                                                              │
│ ✓ Tồn kho: TĂNG (inventory.quantity += received_qty)     │
│ ✓ Giá vốn: CẬP NHẬT (cost_price = unit_price)            │
│ ✓ Lịch sử: TẠO log chi tiết                               │
│ ✓ Công nợ: KHÔNG thay đổi (vẫn nợ toàn bộ)              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4 (TÙY CHỌN): THANH TOÁN                              │
├─────────────────────────────────────────────────────────────┤
│ POST /api/supplier-payments                                 │
│ ├─ supplier_id: Nhà cung cấp                              │
│ ├─ po_id: Phiếu nhập                                      │
│ ├─ amount: Số tiền thanh toán                             │
│ ├─ payment_date: Ngày thanh toán                          │
│ └─ payment_method: cash / bank_transfer / etc              │
│                                                              │
│ ✓ CREATE supplier_payments record                          │
│ ✓ UPDATE purchase_orders:                                  │
│   ├─ paid_amount += payment.amount                         │
│   └─ remaining_amount = total_amount - paid_amount         │
│ ✓ UPDATE suppliers:                                        │
│   └─ total_debt -= payment.amount                          │
└─────────────────────────────────────────────────────────────┘

RESULT: 
  • Tồn kho → Chính xác (cộng dồn từ phiếu nhập)
  • Lịch sử → Đầy đủ (mỗi lần nhập/bán ghi lại)
  • Công nợ → Rõ ràng (biết nợ NCC bao nhiêu)
```

---

## 📝 File Structure (Updated)

```
backend/
├── controllers/
│   ├── inventoryController.js (✏️ Cập nhật - thêm log)
│   ├── productController.js (✏️ Cập nhật - thêm trường mới)
│   ├── orderController.js (Giữ nguyên)
│   ├── supplierController.js (🆕)
│   ├── purchaseOrderController.js (🆕)
│   └── supplierPaymentController.js (🆕)
├── routes/
│   ├── productRoutes.js (✏️ Cập nhật)
│   ├── orderRoutes.js (Giữ nguyên)
│   ├── inventoryRoutes.js (✏️ Cập nhật)
│   ├── supplierRoutes.js (🆕)
│   ├── purchaseOrderRoutes.js (🆕)
│   └── supplierPaymentRoutes.js (🆕)
├── middleware/
│   └── upload.js (Giữ nguyên)
├── config/
│   └── database.js (Giữ nguyên)
├── services/ (🆕)
│   └── inventoryService.js (Logic chính)
├── app.js (✏️ Cập nhật - thêm routes mới)
├── server.js (Giữ nguyên)
├── package.json (✏️ Nếu cần package mới)
└── README.md

frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx (Giữ nguyên)
│   │   ├── Products.jsx (Giữ nguyên)
│   │   ├── ProductManagement.jsx (✏️ Cập nhật - thêm field)
│   │   ├── Orders.jsx (Giữ nguyên)
│   │   ├── CreateOrderPage.jsx (Giữ nguyên)
│   │   ├── Invoices.jsx (Giữ nguyên)
│   │   ├── WarehouseMap.jsx (Giữ nguyên)
│   │   ├── Suppliers.jsx (🆕)
│   │   ├── PurchaseOrders.jsx (🆕)
│   │   ├── CreatePurchaseOrder.jsx (🆕)
│   │   ├── ReceivePurchaseOrder.jsx (🆕)
│   │   └── InventoryHistory.jsx (🆕)
│   ├── components/
│   │   └── common/
│   │       └── Sidebar.jsx (✏️ Cập nhật - thêm menu)
│   ├── services/
│   │   ├── api.js (✏️ Cập nhật - thêm calls mới)
│   │   └── supplierService.js (🆕 Tùy chọn)
│   ├── App.jsx (Giữ nguyên)
│   ├── main.jsx (Giữ nguyên)
│   ├── index.css (Giữ nguyên)
│   └── App.css (Giữ nguyên)
├── package.json (Giữ nguyên)
├── vite.config.js (Giữ nguyên)
└── README.md

Database/
└── bach_hoa_db (✏️ Cập nhật qua migration)
```

---

## ✨ Key Features Added

### 1. Supplier Management
- ✅ CRUD operations cho NCC
- ✅ Theo dõi công nợ tự động
- ✅ Lịch sử giao dịch với từng NCC

### 2. Purchase Order System
- ✅ Tạo PO từ giao diện
- ✅ Xác nhận & cộng công nợ
- ✅ Nhập hàng → Tồn kho tự động UPDATE
- ✅ Thanh toán & cập nhật công nợ

### 3. Inventory Management (Enhanced)
- ✅ Tồn kho chỉ thay đổi qua phiếu nhập/bán
- ✅ Lịch sử giao dịch chi tiết (Thẻ Kho)
- ✅ Cảnh báo tồn kho theo ngưỡng (min_stock_level)

### 4. Product Enhancement
- ✅ Thêm barcode (Mã vạch)
- ✅ Thêm unit (Đơn vị tính)
- ✅ Thêm cost_price (Giá vốn)
- ✅ Thêm min_stock_level (Ngưỡng tồn kho)
- ✅ Thêm status (Trạng thái sản phẩm)

### 5. Reporting (Foundation)
- ✅ Inventory log → Dữ liệu cho báo cáo
- ✅ Supplier payments → Dữ liệu công nợ
- ✅ Product history → Dữ liệu nhập/xuất

---

## 📊 Status by Phase

| Phase | Component | Status | Duration |
|-------|-----------|--------|----------|
| 1 | Database Migration | ✅ Ready | 5 min |
| 2.1 | API - Suppliers | ⏳ To Do | 1 day |
| 2.2 | API - PurchaseOrders | ⏳ To Do | 1.5 days |
| 2.3 | API - Payments & Logs | ⏳ To Do | 1 day |
| 3.1 | Frontend - Suppliers | ⏳ To Do | 1 day |
| 3.2 | Frontend - PurchaseOrders | ⏳ To Do | 1.5 days |
| 3.3 | Frontend - Inventory History | ⏳ To Do | 1 day |
| 3.4 | UI Updates (Products, Sidebar) | ⏳ To Do | 0.5 days |
| 4 | Testing & Optimization | ⏳ To Do | 2 days |
| **Total** | **All** | ⏳ **9-10 days** | - |

---

## 🎯 Success Criteria

✅ System achieves when:
1. [x] Database schema updated with all new tables
2. [ ] All API endpoints functional and tested
3. [ ] Frontend pages created and linked
4. [ ] Purchase order workflow end-to-end working
5. [ ] Inventory auto-updates on receive
6. [ ] Inventory history visible for all products
7. [ ] Supplier debt tracking accurate
8. [ ] UI/UX matches KiotViet/Haravan standards
9. [ ] All data validations in place
10. [ ] Error handling & logging working

---

## 🚀 Next Steps

1. **NOW**: Review this document & database_schema_design.md
2. **TODAY**: Run database migration (MIGRATION_UPGRADE_SCHEMA.sql)
3. **TOMORROW**: Start Phase 2.1 - Supplier API
4. **Follow**: IMPLEMENTATION_GUIDE.md for each step
5. **Reference**: API_SPECIFICATIONS.md during coding

---

**You're ready to build! Let's go! 🎉**
