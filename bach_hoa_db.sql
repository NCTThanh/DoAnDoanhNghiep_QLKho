-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 25, 2026 at 04:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bach_hoa_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Nước giải khát', NULL),
(2, 'Sữa', NULL),
(3, 'Bánh kẹo', NULL),
(4, 'Gia vị', NULL),
(5, 'Đồ dùng cá nhân', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `product_id`, `location_id`, `quantity`, `last_updated`) VALUES
(1, 1, 1, 100, '2026-03-25 13:41:35'),
(2, 2, 1, 100, '2026-03-25 13:41:35'),
(3, 10, 1, 100, '2026-03-25 13:41:35'),
(4, 21, 1, 100, '2026-03-25 13:41:35'),
(5, 22, 1, 100, '2026-03-25 13:41:35'),
(6, 23, 1, 100, '2026-03-25 13:41:35'),
(8, 3, 2, 50, '2026-03-25 13:41:35'),
(9, 11, 2, 50, '2026-03-25 13:41:35'),
(10, 29, 2, 50, '2026-03-25 13:41:35'),
(11, 30, 2, 50, '2026-03-25 13:41:35');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `zone` varchar(50) NOT NULL,
  `shelf` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `zone`, `shelf`, `description`) VALUES
(1, 'Khu A', 'Kệ 1', 'Đồ uống'),
(2, 'Khu A', 'Kệ 2', 'Sữa'),
(3, 'Khu B', 'Kệ 1', 'Đồ ăn vặt'),
(4, 'Khu C', 'Kệ 1', 'Gia vị');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `sell_price` decimal(15,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `product_code`, `name`, `category_id`, `base_price`, `sell_price`, `discount_percent`, `image_url`, `created_at`) VALUES
(1, 'SP0001', 'Bia Tiger lon cao 330ml (Thùng)', 1, 320000.00, 350000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(2, 'SP0002', 'Nước ngọt Coca Cola 320ml (Thùng)', 1, 150000.00, 180000.00, 5.00, NULL, '2026-03-25 13:41:35'),
(3, 'SP0003', 'Sữa tươi Vinamilk có đường 180ml (Thùng)', 2, 280000.00, 310000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(4, 'SP0004', 'Bánh mì tươi Kinh Đô', 3, 10000.00, 15000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(5, 'SP0005', 'Nước mắm Nam Ngư 500ml', 4, 35000.00, 42000.00, 10.00, NULL, '2026-03-25 13:41:35'),
(6, 'SP0006', 'Dầu ăn Tường An 1L', 4, 45000.00, 55000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(7, 'SP0007', 'Mì Hảo Hảo tôm chua cay (Thùng)', 3, 100000.00, 120000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(8, 'SP0008', 'Kem đánh răng PS 200g', 5, 25000.00, 32000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(9, 'SP0009', 'Dầu gội Clear 630g', 5, 120000.00, 145000.00, 5.00, NULL, '2026-03-25 13:41:35'),
(10, 'SP0010', 'Trà xanh Không Độ 500ml (Thùng)', 1, 140000.00, 170000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(11, 'SP0011', 'Sữa đặc Ông Thọ', 2, 22000.00, 26000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(12, 'SP0012', 'Đường tinh luyện Biên Hòa 1kg', 4, 20000.00, 24000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(13, 'SP0013', 'Muối tinh I-ốt 500g', 4, 4000.00, 6000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(14, 'SP0014', 'Bột ngọt Ajinomoto 400g', 4, 28000.00, 33000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(15, 'SP0015', 'Nước tương Chinsu 250ml', 4, 18000.00, 22000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(16, 'SP0016', 'Tương ớt Chinsu 250g', 4, 12000.00, 15000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(17, 'SP0017', 'Gạo ST25 5kg', 4, 150000.00, 180000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(18, 'SP0018', 'Xúc xích Vissan', 3, 35000.00, 42000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(19, 'SP0019', 'Bánh quy Cosy', 3, 40000.00, 48000.00, 5.00, NULL, '2026-03-25 13:41:35'),
(20, 'SP0020', 'Kẹo dừa Bến Tre', 3, 25000.00, 30000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(21, 'SP0021', 'Trà túi lọc Lipton', 1, 35000.00, 42000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(22, 'SP0022', 'Cà phê G7 3in1', 1, 45000.00, 55000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(23, 'SP0023', 'Nước khoáng Lavie 500ml (Thùng)', 1, 80000.00, 100000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(24, 'SP0024', 'Bột giặt OMO 800g', 5, 38000.00, 45000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(25, 'SP0025', 'Nước xả vải Downy 1.5L', 5, 85000.00, 105000.00, 10.00, NULL, '2026-03-25 13:41:35'),
(26, 'SP0026', 'Nước rửa chén Sunlight 750g', 5, 24000.00, 29000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(27, 'SP0027', 'Giấy vệ sinh Watersilk (Lốc)', 5, 30000.00, 38000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(28, 'SP0028', 'Khăn ướt Baby', 5, 15000.00, 20000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(29, 'SP0029', 'Sữa chua Vinamilk (Lốc)', 2, 22000.00, 26000.00, 0.00, NULL, '2026-03-25 13:41:35'),
(30, 'SP0030', 'Phô mai Con Bò Cười', 2, 32000.00, 38000.00, 0.00, NULL, '2026-03-25 13:41:35');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','staff') DEFAULT 'staff',
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `status`, `created_at`) VALUES
(1, 'admin_thanh', 'hashed_password_1', 'Nguyễn Chí Thanh', 'admin', 1, '2026-03-25 13:41:35'),
(2, 'admin_thao', 'hashed_password_2', 'Mr Thảo', 'admin', 1, '2026-03-25 13:41:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `location_id` (`location_id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_code` (`product_code`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
