-- ============================================================
-- MIGRATION: Nâng cấp Database Schema
-- Thêm tính năng: Nhập hàng, Quản lý NCC, Lịch sử kho
-- Ngày: 2026-04-28
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- ============================================================
-- 1. CẬP NHẬT BẢNG PRODUCTS
-- ============================================================

-- Thêm các cột mới vào products
ALTER TABLE `products` 
ADD COLUMN `barcode` VARCHAR(100) UNIQUE NULL COMMENT 'Mã vạch EAN/UPC' AFTER `product_code`,
ADD COLUMN `unit` VARCHAR(50) NOT NULL DEFAULT 'Cái' COMMENT 'Đơn vị tính (Chai, Lốc, Thùng, Gói, Cái, Kg, Lít)' AFTER `category_id`,
ADD COLUMN `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Giá vốn/giá nhập' AFTER `unit`,
ADD COLUMN `min_stock_level` INT DEFAULT 10 COMMENT 'Tồn kho tối thiểu để báo đỏ' AFTER `discount_percent`,
ADD COLUMN `status` ENUM('active', 'inactive', 'discontinued') DEFAULT 'active' AFTER `image_url`,
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Cập nhật cost_price = base_price nếu chưa có (migration từ dữ liệu cũ)
UPDATE `products` SET `cost_price` = `base_price` WHERE `cost_price` = 0.00;

-- ============================================================
-- 2. TẠO BẢNG SUPPLIERS (Nhà Cung Cấp)
-- ============================================================

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `supplier_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã NCC (VD: NCC001)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Tên nhà cung cấp',
  `phone` VARCHAR(20) NULL COMMENT 'Số điện thoại',
  `email` VARCHAR(100) NULL COMMENT 'Email',
  `address` TEXT NULL COMMENT 'Địa chỉ',
  `tax_id` VARCHAR(50) NULL COMMENT 'Mã số thuế',
  `representative` VARCHAR(100) NULL COMMENT 'Người đại diện',
  `payment_term` VARCHAR(100) NULL COMMENT 'Điều khoản thanh toán (VD: COD, 30 ngày, 60 ngày)',
  
  `total_debt` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Công nợ hiện tại với NCC',
  
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `supplier_code` (`supplier_code`),
  INDEX `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Thêm dữ liệu mẫu
INSERT INTO `suppliers` (`supplier_code`, `name`, `phone`, `address`, `payment_term`, `status`) VALUES
('NCC001', 'NPP Tân Tài Phát', '0918123456', 'Quận 10, TP.HCM', 'COD', 'active'),
('NCC002', 'CTY CP SP Sinh Thái', '0914567890', 'Quận 1, TP.HCM', '30 ngày', 'active'),
('NCC003', 'Công ty TNHH Thương mại XYZ', '0912345678', 'Quận 5, TP.HCM', '60 ngày', 'active');

-- ============================================================
-- 3. TẠO BẢNG PURCHASE_ORDERS (Phiếu Nhập Hàng)
-- ============================================================

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `po_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã PO (VD: PO2026001)',
  `supplier_id` INT NOT NULL COMMENT 'FK → suppliers',
  
  `po_date` DATE NOT NULL COMMENT 'Ngày lập PO',
  `expected_delivery_date` DATE NULL COMMENT 'Ngày dự kiến giao hàng',
  `actual_delivery_date` DATE NULL COMMENT 'Ngày nhập hàng thực tế',
  
  `total_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tổng tiền PO',
  `paid_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tiền đã thanh toán',
  `remaining_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Tiền còn nợ',
  
  `status` ENUM('draft', 'confirmed', 'received', 'cancelled') DEFAULT 'draft'
    COMMENT 'draft=Nháp, confirmed=Đã xác nhận, received=Đã nhập hàng, cancelled=Hủy',
  
  `created_by` INT NULL COMMENT 'FK → users',
  `note` TEXT NULL COMMENT 'Ghi chú',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY `supplier_id` (`supplier_id`),
  KEY `po_code` (`po_code`),
  KEY `status` (`status`),
  KEY `po_date` (`po_date`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 4. TẠO BẢNG PURCHASE_ORDER_DETAILS (Chi Tiết PO)
-- ============================================================

CREATE TABLE IF NOT EXISTS `purchase_order_details` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `po_id` INT NOT NULL COMMENT 'FK → purchase_orders',
  `product_id` INT NOT NULL COMMENT 'FK → products',
  
  `quantity` INT NOT NULL COMMENT 'Số lượng cần nhập',
  `unit_price` DECIMAL(15,2) NOT NULL COMMENT 'Giá nhập từng sản phẩm',
  `total_price` DECIMAL(15,2) NULL COMMENT 'Tổng = quantity × unit_price',
  
  `received_quantity` INT DEFAULT 0 COMMENT 'Số lượng thực nhập (có thể khác quantity)',
  `note` TEXT NULL COMMENT 'Ghi chú từng dòng',
  
  FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  INDEX `po_id` (`po_id`),
  INDEX `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 5. TẠO BẢNG INVENTORY_LOG (Thẻ Kho / Lịch Sử Giao Dịch)
-- ============================================================

CREATE TABLE IF NOT EXISTS `inventory_log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL COMMENT 'FK → products',
  `location_id` INT NULL COMMENT 'FK → locations',
  
  `transaction_type` ENUM(
    'import_purchase_order',
    'export_sales',
    'export_return',
    'adjustment_increase',
    'adjustment_decrease',
    'damage',
    'count_check'
  ) NOT NULL COMMENT 'Loại giao dịch',
  
  `quantity_change` INT NOT NULL COMMENT 'Số lượng thay đổi (±)',
  `quantity_before` INT NULL COMMENT 'Số lượng trước giao dịch',
  `quantity_after` INT NULL COMMENT 'Số lượng sau giao dịch',
  
  `reference_id` INT NULL COMMENT 'ID liên quan (PO_id, Order_id)',
  `reference_type` VARCHAR(50) NULL COMMENT 'Loại tham chiếu (purchase_order, sales_order)',
  `supplier_id` INT NULL COMMENT 'FK → suppliers (nếu import)',
  `customer_id` INT NULL COMMENT 'Tương lai: FK → customers (nếu export)',
  
  `reason` TEXT NULL COMMENT 'Lý do thay đổi',
  `created_by` INT NULL COMMENT 'FK → users',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY `product_id` (`product_id`),
  KEY `created_at` (`created_at`),
  KEY `transaction_type` (`transaction_type`),
  KEY `reference_id` (`reference_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 6. TẠO BẢNG SUPPLIER_PAYMENTS (Theo Dõi Thanh Toán NCC)
-- ============================================================

CREATE TABLE IF NOT EXISTS `supplier_payments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `supplier_id` INT NOT NULL COMMENT 'FK → suppliers',
  `po_id` INT NULL COMMENT 'FK → purchase_orders (thanh toán cho PO cụ thể)',
  
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thanh toán',
  `payment_method` ENUM('cash', 'bank_transfer', 'cheque', 'other') DEFAULT 'cash',
  `bank_account` VARCHAR(100) NULL COMMENT 'Tài khoản bank (nếu transfer)',
  `transaction_code` VARCHAR(100) NULL COMMENT 'Mã giao dịch',
  
  `note` TEXT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY `supplier_id` (`supplier_id`),
  KEY `payment_date` (`payment_date`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- COMMIT TRANSACTION
-- ============================================================

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ============================================================
-- ✅ Migration hoàn tất!
-- 
-- Bảng mới tạo:
--   - suppliers (Nhà cung cấp)
--   - purchase_orders (Phiếu nhập hàng)
--   - purchase_order_details (Chi tiết PO)
--   - inventory_log (Thẻ kho / Lịch sử)
--   - supplier_payments (Thanh toán)
--
-- Bảng được cập nhật:
--   - products (Thêm: barcode, unit, cost_price, min_stock_level, status, updated_at)
-- ============================================================
