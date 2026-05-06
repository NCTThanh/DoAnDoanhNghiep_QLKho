# 🚀 QUICK START - Nâng Cấp Hệ Thống Quản Lý Kho

## 📄 TÀI LIỆU ĐÃ CHUẨN BỊ

Dự án của bạn đã được thiết kế chi tiết với 3 file tài liệu:

| File | Mục Đích | Ưu Tiên |
|------|---------|--------|
| **MIGRATION_UPGRADE_SCHEMA.sql** | Script SQL để cập nhật database | 🔴 ĐỌC TRƯỚC |
| **database_schema_design.md** | Thiết kế chi tiết bảng database | 🔵 Tham khảo |
| **IMPLEMENTATION_GUIDE.md** | Hướng dẫn thực hiện từng bước | 🔴 HƯỚNG DẪN CHÍNH |
| **API_SPECIFICATIONS.md** | Chi tiết từng API endpoint | 🟢 Tham khảo khi code |

---

## ✅ BƯỚC 1: CẬP NHẬT DATABASE (Ngay bây giờ - 5 phút)

### Cách 1: Dùng PhpMyAdmin (Dễ nhất)
```
1. Mở http://localhost/phpmyadmin
2. Chọn database: bach_hoa_db
3. Tab "Import"
4. Chọn file: MIGRATION_UPGRADE_SCHEMA.sql
5. Click "Go"
```

### Cách 2: Dùng MySQL Command Line
```bash
cd e:\Đồ_Án_Thực_Tập\DoAnDoanhNghiep_QLKho

# Windows CMD
mysql -u root -p bach_hoa_db < MIGRATION_UPGRADE_SCHEMA.sql

# Hoặc gõ trong MySQL CLI:
SOURCE MIGRATION_UPGRADE_SCHEMA.sql;
```

### Cách 3: Dùng MySQL Workbench
```
1. Mở MySQL Workbench
2. File → Open SQL Script
3. Chọn: MIGRATION_UPGRADE_SCHEMA.sql
4. ⚡ Execute
```

### ✔️ Kiểm Tra Kết Quả
```sql
-- Sau khi chạy, kiểm tra bảng mới
SHOW TABLES;

-- Kiểm tra cột mới của products
DESCRIBE products;

-- Cột mới phải có: barcode, unit, cost_price, min_stock_level, status, updated_at
```

---

## 📚 BƯỚC 2: ĐỌC TÀI LIỆU THIẾT KẾ (15 phút)

1. **Nếu bạn là Backend Dev**: Đọc `IMPLEMENTATION_GUIDE.md` phần **PHASE 2**
2. **Nếu bạn là Frontend Dev**: Đọc `IMPLEMENTATION_GUIDE.md` phần **PHASE 3**
3. **Nếu bạn làm Full Stack**: Đọc toàn bộ `IMPLEMENTATION_GUIDE.md`

**Trọng tâm:**
- Hiểu luồng nhập hàng từ Bước 1-4
- Hiểu cấu trúc API mới
- Hiểu các trang frontend cần tạo

---

## 🎯 BƯỚC 3: LỘ TRÌNH PHÁT TRIỂN

### **PHASE 1** (Đã xong ✅)
- [x] Database migration
- [x] Thiết kế schema

### **PHASE 2** (Backend - 3-4 ngày)

#### 2.1 Tạo API Nhà Cung Cấp
- [ ] `GET /api/suppliers` - Lấy danh sách
- [ ] `POST /api/suppliers` - Tạo mới
- [ ] `GET /api/suppliers/:id` - Chi tiết
- [ ] `PUT /api/suppliers/:id` - Cập nhật
- [ ] `DELETE /api/suppliers/:id` - Xóa

**File cần tạo:**
- `backend/controllers/supplierController.js`
- `backend/routes/supplierRoutes.js`

#### 2.2 Tạo API Phiếu Nhập Hàng
- [ ] `GET /api/purchase-orders` - Danh sách PO
- [ ] `POST /api/purchase-orders` - Tạo PO
- [ ] `GET /api/purchase-orders/:id` - Chi tiết
- [ ] `PUT /api/purchase-orders/:id/confirm` - Xác nhận ⭐
- [ ] `PUT /api/purchase-orders/:id/receive` - Nhập hàng ⭐ (CỰC QUAN TRỌNG)
- [ ] `DELETE /api/purchase-orders/:id` - Xóa

**File cần tạo:**
- `backend/controllers/purchaseOrderController.js`
- `backend/routes/purchaseOrderRoutes.js`

#### 2.3 Tạo API Thanh Toán & Lịch Sử
- [ ] `POST /api/supplier-payments` - Ghi nhận thanh toán
- [ ] `GET /api/supplier-payments` - Danh sách thanh toán
- [ ] `GET /api/inventory-log` - Lịch sử kho
- [ ] `GET /api/products/:id/history` - Lịch sử sản phẩm

**File cần tạo:**
- `backend/controllers/supplierPaymentController.js`
- `backend/routes/supplierPaymentRoutes.js`
- `backend/services/inventoryService.js` (Logic chính)

### **PHASE 3** (Frontend - 4-5 ngày)

#### 3.1 Cập Nhật Giao Diện Hàng Hóa
- [ ] Thêm cột: barcode, unit, cost_price, min_stock_level, status
- [ ] Cập nhật form thêm/sửa sản phẩm
- [ ] Cập nhật logic cảnh báo tồn kho (dùng min_stock_level)

**File cần cập nhật:**
- `frontend/src/pages/ProductManagement.jsx`
- `frontend/src/pages/Products.jsx`

#### 3.2 Tạo Trang Nhà Cung Cấp (Suppliers)
- [ ] Danh sách NCC
- [ ] Thêm NCC mới (Modal form)
- [ ] Sửa thông tin NCC
- [ ] Xóa NCC
- [ ] Hiển thị công nợ

**File cần tạo:**
- `frontend/src/pages/Suppliers.jsx`

#### 3.3 Tạo Trang Phiếu Nhập Hàng
- [ ] Danh sách PO (với filter theo status)
- [ ] Tạo PO mới
  - Chọn NCC
  - Thêm sản phẩm
  - Nhập số lượng & giá
  - Tính tổng tiền tự động
- [ ] Chi tiết PO
- [ ] Xác nhận PO
- [ ] Nhập hàng (input số lượng thực)
- [ ] Thanh toán

**File cần tạo:**
- `frontend/src/pages/PurchaseOrders.jsx` (Danh sách)
- `frontend/src/pages/CreatePurchaseOrder.jsx` (Tạo/Sửa)
- `frontend/src/pages/ReceivePurchaseOrder.jsx` (Nhập hàng)

#### 3.4 Tạo Trang Lịch Sử Kho (Inventory History)
- [ ] Chọn sản phẩm
- [ ] Chọn khoảng ngày
- [ ] Hiển thị bảng lịch sử với cột:
  - Ngày
  - Loại giao dịch
  - Supplier/Customer
  - Số lượng thay đổi
  - Tồn trước/Tồn sau
  - Lý do

**File cần tạo:**
- `frontend/src/pages/InventoryHistory.jsx`

#### 3.5 Cập Nhật Sidebar Menu
- [ ] Thêm "Nhà Cung Cấp" → `/suppliers`
- [ ] Thêm "Phiếu Nhập" → `/purchase-orders`
- [ ] Thêm "Lịch Sử Kho" → `/inventory-history`

**File cần cập nhật:**
- `frontend/src/components/common/Sidebar.jsx`

### **PHASE 4** (Test & Optimize - 2-3 ngày)
- [ ] Test tất cả API endpoints
- [ ] Test luồng nhập hàng từ đầu đến cuối
- [ ] Test cảnh báo tồn kho
- [ ] Test lịch sử kho
- [ ] Fix bugs (nếu có)
- [ ] Optimize UI

---

## 🔥 ƯU TIÊN LỲ NHẤT

### Top 3 cần làm ngay:

1. **API `/purchase-orders/:id/receive`** ⭐⭐⭐
   - Đây là API quan trọng nhất
   - Phải UPDATE tồn kho tự động
   - Phải tạo inventory_log record
   - Phải UPDATE supplier debt
   - **Bắt buộc dùng transaction để tránh lỗi**

2. **Frontend trang Phiếu Nhập** ⭐⭐
   - Luồng chính của hệ thống
   - Cần kiểm tra kỹ UI/UX

3. **Frontend trang Nhà Cung Cấp** ⭐
   - Quản lý dữ liệu cơ bản
   - Khá đơn giản

---

## 📖 REFERENCE NHANH

### Mỗi khi cần:
- **Chi tiết API**: Xem `API_SPECIFICATIONS.md`
- **Cấu trúc Backend**: Xem `IMPLEMENTATION_GUIDE.md` - PHASE 2
- **Cấu trúc Frontend**: Xem `IMPLEMENTATION_GUIDE.md` - PHASE 3
- **Luồng nhập hàng**: Xem `database_schema_design.md` - WORKFLOW

---

## 🧪 TEST NHANH

Sau khi code xong Phase 2, test bằng cURL hoặc Postman:

```bash
# 1. Tạo PO
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": 1,
    "po_date": "2026-04-28",
    "items": [{"product_id": 1, "quantity": 100, "unit_price": 10000}]
  }'

# 2. Xác nhận PO
curl -X PUT http://localhost:3000/api/purchase-orders/1/confirm

# 3. NHẬP HÀNG (Đây là test quan trọng!)
curl -X PUT http://localhost:3000/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -d '{
    "actual_delivery_date": "2026-04-28",
    "details": [{"po_detail_id": 1, "received_quantity": 100}]
  }'

# 4. Kiểm tra tồn kho đã tăng
curl -X GET http://localhost:3000/api/products/1

# 5. Kiểm tra lịch sử kho
curl -X GET http://localhost:3000/api/inventory-log?product_id=1
```

---

## ⚡ QUICK START CHECKLIST

```
[ ] 1. Chạy MIGRATION_UPGRADE_SCHEMA.sql ✅
[ ] 2. Kiểm tra database (DESCRIBE products)
[ ] 3. Đọc IMPLEMENTATION_GUIDE.md
[ ] 4. Tạo supplier routes + controller
[ ] 5. Tạo purchase order routes + controller
[ ] 6. Tạo API /purchase-orders/:id/receive (Cực quan trọng!)
[ ] 7. Test API /purchase-orders/:id/receive
[ ] 8. Tạo frontend Suppliers page
[ ] 9. Tạo frontend PurchaseOrders page
[ ] 10. Tạo frontend ReceivePurchaseOrder page
[ ] 11. Test luồng nhập hàng hoàn chỉnh
[ ] 12. Tạo frontend InventoryHistory page
[ ] 13. Cập nhật ProductManagement page (thêm cột mới)
[ ] 14. Cập nhật Sidebar menu
[ ] 15. Bug fix & optimize UI
```

---

## 🎓 HỌC THÊM

**Xem chi tiết về từng feature:**
- Nhà cung cấp → `IMPLEMENTATION_GUIDE.md` → "3.1 Trang Quản Lý Nhà Cung Cấp"
- Phiếu nhập → `IMPLEMENTATION_GUIDE.md` → "3.2 Trang Phiếu Nhập Hàng"
- Lịch sử kho → `IMPLEMENTATION_GUIDE.md` → "3.4 Trang Lịch Sử Kho"
- Cấu trúc API → `API_SPECIFICATIONS.md`
- Workflow → `database_schema_design.md` → "WORKFLOW - Khi Nhập Hàng"

---

## 🆘 CẦN GIÚP?

Nếu gặp vấn đề:

1. **Database errors**: Kiểm tra file migration, chạy lại từ đầu
2. **API không hoạt động**: 
   - Check console backend xem lỗi gì
   - Verify foreign keys trong database
   - Test từng endpoint riêng lẻ
3. **Frontend không hiển thị**: 
   - Check DevTools (F12)
   - Xem Network tab, API response đúng không
   - Verify data structure
4. **Tồn kho không cộng**: 
   - Kiểm tra logic trong `/receive` endpoint
   - Verify database transaction
   - Check inventory_log có record không

---

## 🎯 MỤC TIÊU CUỐI

✅ Sau 2-3 tuần, bạn sẽ có:
- Hệ thống quản lý nhà cung cấp hoàn chỉnh
- Phiếu nhập hàng tự động UPDATE tồn kho
- Lịch sử giao dịch chi tiết cho mỗi sản phẩm
- Quản lý công nợ NCC
- **Tiêu chuẩn thực tế như KiotViet, Haravan**

---

## 🚀 LET'S BUILD!

```
Bước 1: Database ✅
Bước 2: Backend 🔄
Bước 3: Frontend 🔄
Bước 4: Test ⏳
Bước 5: Deploy 🎉
```

**Good luck! You got this! 💪**

---

**Cần câu hỏi?** Xem chi tiết trong các file `.md` được chuẩn bị sẵn.
