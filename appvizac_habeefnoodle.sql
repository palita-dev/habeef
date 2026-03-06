-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 06, 2026 at 02:30 AM
-- Server version: 10.6.17-MariaDB
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `appvizac_habeefnoodle`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `table_id` varchar(50) NOT NULL,
  `menu_id` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(10,2) NOT NULL,
  `options_text` text DEFAULT NULL,
  `options_json` longtext DEFAULT NULL CHECK (json_valid(`options_json`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `ingredient_name` varchar(100) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `is_disabled` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`ingredient_name`, `unit`, `is_disabled`) VALUES
('กุ้ง', 'กิโลกรัม', 0),
('ถั่วงอก', 'กิโลกรัม', 0),
('น่องไก่', 'กิโลกรัม', 0),
('ผักบุ้ง', 'กิโลกรัม', 0),
('ลูกชิ้น', 'ถุง', 0),
('หมึก', 'กิโลกรัม', 0),
('เนื้อวัว', 'กิโลกรัม', 0),
('เส้นหมี่ขาว', 'ถุง', 0),
('เส้นหมี่หยก', 'ถุง', 0),
('เส้นหมี่เหลือง', 'ถุง', 0),
('เส้นเล็ก', 'ถุง', 0),
('เส้นใหญ่', 'ถุง', 0),
('ไข่', 'แผง', 0);

-- --------------------------------------------------------

--
-- Table structure for table `menus`
--

CREATE TABLE `menus` (
  `menu_id` varchar(50) NOT NULL COMMENT 'ใช้ Varchar ตามโค้ดเช่น nam-khon',
  `menu_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `emoji` varchar(20) DEFAULT NULL,
  `has_noodle` tinyint(1) DEFAULT 1,
  `has_meat` tinyint(1) DEFAULT 1,
  `is_seafood` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menus`
--

INSERT INTO `menus` (`menu_id`, `menu_name`, `description`, `base_price`, `emoji`, `has_noodle`, `has_meat`, `is_seafood`) VALUES
('haeng', 'ก๋วยเตี๋ยวแห้ง', '(เนื้อวัว / น่องไก่) +ลูกชิ้น', 50.00, '🥢', 1, 1, 0),
('kao-lao', 'เกาเหลา', '(เนื้อวัว / น่องไก่) +ลูกชิ้น', 50.00, '🥣', 0, 1, 0),
('nam-khon', 'ก๋วยเตี๋ยวน้ำข้น', '(เนื้อวัว / น่องไก่) +ลูกชิ้น', 50.00, '🍜', 1, 1, 0),
('tom-yam', 'ก๋วยเตี๋ยวต้มยำ', '(เนื้อวัว / น่องไก่) +ลูกชิ้น', 60.00, '🌶️', 1, 1, 0),
('tom-yam-seafood', 'ก๋วยเตี๋ยวต้มยำ ทะเล', 'กุ้ง + หมึก + ลูกชิ้น', 95.00, '🦐', 1, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` varchar(50) NOT NULL,
  `guest_id` varchar(50) DEFAULT NULL,
  `table_id` varchar(50) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','served','paid','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `guest_id`, `table_id`, `total_price`, `status`, `created_at`, `completed_at`) VALUES
('ord_69a3f447a0ce4', 'GMM7GXTVDOHT', '', 140.00, 'cancelled', '2026-03-01 15:09:43', NULL),
('ord_69a3f50d174e6', 'GMM7H1P6SX3H', '', 185.00, 'cancelled', '2026-03-01 15:13:01', NULL),
('ord_69a3f53da561d', 'GMM7GY13ZM5O', '', 220.00, 'cancelled', '2026-03-01 15:13:49', NULL),
('ord_69a3f5d757874', 'GMM7GY13ZM5O', '', 100.00, 'cancelled', '2026-03-01 15:16:23', NULL),
('ord_69a3f5f10aa8c', 'GMM7H0EY9RWK', '', 330.00, 'cancelled', '2026-03-01 15:16:49', NULL),
('ord_69a3f692c0935', 'GMM7H1P6SX3H', '', 140.00, 'cancelled', '2026-03-01 15:19:30', NULL),
('ord_69a3f6ff6b1cf', 'GMM7H1P6SX3H', '', 730.00, 'cancelled', '2026-03-01 15:21:19', NULL),
('ord_69a3fcb2d24a3', 'GMM7GZH0OPCW', '', 90.00, 'cancelled', '2026-03-01 15:45:38', NULL),
('ord_69a5910e9b901', 'GMM7SJO1QEQV', '', 60.00, 'cancelled', '2026-03-02 20:30:54', NULL),
('ORD-MMBOKIT5', 'GMM7GWBDNVQ9', '1', 60.00, 'paid', '2026-03-04 13:53:37', NULL),
('ORD-MMBOQ6J5', 'GMM7GWBDNVQ9', '1', 60.00, 'paid', '2026-03-04 13:58:01', NULL),
('ORD-MMBPDEXJ', 'GMMBPCCFOKXA', '1', 170.00, 'paid', '2026-03-04 14:16:05', NULL),
('ORD-MMBPFTIX', 'GMM7GY13ZM5O', '1', 15680.00, 'cancelled', '2026-03-04 14:17:57', NULL),
('ORD-MMBPGUCL', 'GMMBPAUA95SS', '2', 60.00, 'served', '2026-03-04 14:18:45', NULL),
('ORD-MMBPID4E', 'GMMBPFYBH8TA', '1', 80.00, 'cancelled', '2026-03-04 14:19:56', NULL),
('ORD-MMBPK3ZG', 'GMMBPCE2P4Q5', '1', 29970.00, 'served', '2026-03-04 14:21:18', NULL),
('ORD-MMBPO11I', 'GMMBPCE2P4Q5', '8', 1500.00, 'paid', '2026-03-04 14:24:20', NULL),
('ORD-MMBPPGG0', 'GMMBPCE2P4Q5', 'กลับบ้านคิว 1', 50.00, 'paid', '2026-03-04 14:25:27', NULL),
('ORD-MMBPQM2W', 'GMMBPCE2P4Q5', 'กลับบ้านคิว 2', 95.00, 'served', '2026-03-04 14:26:21', NULL),
('ORD-MMBQ2EZT', 'GMMBPCE2P4Q5', 'กลับบ้านคิว 3', 115.00, 'cancelled', '2026-03-04 14:35:32', NULL),
('ORD-MMBQ2GPP', 'GMM7GWBDNVQ9', 'กลับบ้านคิว 4', 50.00, 'cancelled', '2026-03-04 14:35:34', NULL),
('ORD-MMBTU8M0', 'GMM7GWHXVPAQ', '8', 210.00, 'paid', '2026-03-04 16:21:09', NULL),
('ORD-MMBU977I', 'GMM7GWHXVPAQ', '8', 1400.00, 'paid', '2026-03-04 16:32:47', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `order_detail_id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `menu_id` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `options_text` text DEFAULT NULL,
  `options_json` longtext DEFAULT NULL CHECK (json_valid(`options_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`order_detail_id`, `order_id`, `menu_id`, `quantity`, `unit_price`, `total_price`, `options_text`, `options_json`) VALUES
(20, 'ORD-MMBOKIT5', 'nam-khon', 1, 50.00, 60.00, 'เส้นใหญ่, เนื้อสด, ไม่ใส่ผัก, ไข่ +10฿', '{\"เส้นใหญ่\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ไข่\":0.033333333333333}'),
(21, 'ORD-MMBOQ6J5', 'nam-khon', 1, 50.00, 60.00, 'เส้นหมี่หยก, เนื้อเปื่อย, ไม่ใส่ผัก, เกี๊ยว +10฿', '{\"เส้นหมี่หยก\":0.25,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222}'),
(22, 'ORD-MMBPDEXJ', 'haeng', 1, 50.00, 100.00, 'เส้นหมี่ขาว, เนื้อเปื่อย, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿, เนื้อสด +20฿', '{\"เส้นหมี่ขาว\":0.05,\"เนื้อวัว\":0.12,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(23, 'ORD-MMBPDEXJ', 'haeng', 1, 50.00, 70.00, 'เส้นหมี่ขาว, ผสมเส้นหมี่หยก, เนื้อสด, เกี๊ยว +10฿, ลูกชิ้น +10฿', '{\"เส้นหมี่ขาว\":0.05,\"เส้นหมี่หยก\":0.25,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(24, 'ORD-MMBPFTIX', 'kao-lao', 112, 50.00, 140.00, 'เนื้อสด, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เนื้อวัว\":0.18,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(25, 'ORD-MMBPGUCL', 'nam-khon', 1, 50.00, 60.00, 'เส้นเล็ก, เนื้อสด, ไข่ +10฿', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(26, 'ORD-MMBPID4E', 'nam-khon', 1, 50.00, 80.00, 'เส้นเล็ก, ผสมเส้นหมี่ขาว, เนื้อเปื่อย, ไม่ใส่ผัก, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿', '{\"เส้นเล็ก\":0.055,\"เส้นหมี่ขาว\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"ไข่\":0.033333333333333}'),
(27, 'ORD-MMBPK3ZG', 'tom-yam-seafood', 162, 95.00, 185.00, 'เส้นเล็ก, ผสมเส้นหมี่เหลือง, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นเล็ก\":0.055,\"เส้นหมี่เหลือง\":0.25,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"ลูกชิ้น\":0.022222222222222,\"น่องไก่\":0.08,\"เนื้อวัว\":0.12}'),
(28, 'ORD-MMBPO11I', 'tom-yam', 10, 60.00, 150.00, 'เส้นเล็ก, เนื้อสด, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.18,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"ลูกชิ้น\":0.022222222222222,\"น่องไก่\":0.08}'),
(29, 'ORD-MMBPPGG0', 'kao-lao', 1, 50.00, 50.00, 'เนื้อสด', '{\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(30, 'ORD-MMBPQM2W', 'tom-yam-seafood', 1, 95.00, 95.00, 'เส้นเล็ก', '{\"เส้นเล็ก\":0.055,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(31, 'ORD-MMBQ2EZT', 'tom-yam-seafood', 1, 95.00, 115.00, 'เส้นเล็ก, ไม่ใส่ผัก, เกี๊ยว +10฿, ลูกชิ้น +10฿', '{\"เส้นเล็ก\":0.055,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ลูกชิ้น\":0.022222222222222}'),
(32, 'ORD-MMBQ2GPP', 'nam-khon', 1, 50.00, 50.00, 'เส้นใหญ่, น่องไก่', '{\"เส้นใหญ่\":0.05,\"น่องไก่\":0.08,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(33, 'ORD-MMBTU8M0', 'haeng', 1, 50.00, 80.00, 'เส้นใหญ่, ผสมเส้นหมี่หยก, เนื้อเปื่อย, ไข่ +10฿, น่องไก่ +20฿', '{\"เส้นใหญ่\":0.05,\"เส้นหมี่หยก\":0.25,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(34, 'ORD-MMBTU8M0', 'tom-yam', 1, 60.00, 70.00, 'เส้นหมี่ขาว, เนื้อสด, ไม่ใส่ผัก, ลูกชิ้น +10฿', '{\"เส้นหมี่ขาว\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222}'),
(35, 'ORD-MMBTU8M0', 'nam-khon', 1, 50.00, 60.00, 'เส้นใหญ่, เนื้อเปื่อย, ไม่ใส่ผัก, ลูกชิ้น +10฿', '{\"เส้นใหญ่\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444}'),
(36, 'ORD-MMBU977I', 'nam-khon', 10, 50.00, 140.00, 'เส้นเล็ก, เนื้อสด, ไข่ +10฿, เกี๊ยว +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.18,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}');

-- --------------------------------------------------------

--
-- Table structure for table `order_ingredient_usages`
--

CREATE TABLE `order_ingredient_usages` (
  `usage_id` int(11) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `ingredient_name` varchar(100) NOT NULL,
  `quantity_used` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_in`
--

CREATE TABLE `stock_in` (
  `stock_in_id` int(11) NOT NULL,
  `ingredient_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock_in_date` datetime DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_out`
--

CREATE TABLE `stock_out` (
  `stock_out_id` int(11) NOT NULL,
  `ingredient_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock_out_date` datetime DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `table_id` varchar(50) NOT NULL COMMENT 'ใช้ Varchar เพื่อรองรับกลับบ้านคิว 1',
  `status` enum('available','occupied') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','owner','staff') NOT NULL DEFAULT 'staff',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `role`, `created_at`) VALUES
(1, 'admin', '123', 'Admin ผู้ดูแลระบบ', 'admin', '2026-03-02 17:25:36'),
(2, 'Nana', '1234', 'Nana', 'staff', '2026-03-02 17:25:36'),
(5, 'palita', '123', 'palita', 'owner', '2026-03-02 20:13:02'),
(18, 'tata', 'abc456', 'tata', 'staff', '2026-03-04 16:44:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indexes for table `ingredients`
--
ALTER TABLE `ingredients`
  ADD PRIMARY KEY (`ingredient_name`);

--
-- Indexes for table `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`menu_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`order_detail_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_id` (`menu_id`);

--
-- Indexes for table `order_ingredient_usages`
--
ALTER TABLE `order_ingredient_usages`
  ADD PRIMARY KEY (`usage_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `ingredient_name` (`ingredient_name`);

--
-- Indexes for table `stock_in`
--
ALTER TABLE `stock_in`
  ADD PRIMARY KEY (`stock_in_id`),
  ADD KEY `ingredient_name` (`ingredient_name`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `stock_out`
--
ALTER TABLE `stock_out`
  ADD PRIMARY KEY (`stock_out_id`),
  ADD KEY `ingredient_name` (`ingredient_name`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`table_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `order_ingredient_usages`
--
ALTER TABLE `order_ingredient_usages`
  MODIFY `usage_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_in`
--
ALTER TABLE `stock_in`
  MODIFY `stock_in_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_out`
--
ALTER TABLE `stock_out`
  MODIFY `stock_out_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `tables` (`table_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `order_details_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_details_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_ingredient_usages`
--
ALTER TABLE `order_ingredient_usages`
  ADD CONSTRAINT `order_ingredient_usages_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_ingredient_usages_ibfk_2` FOREIGN KEY (`ingredient_name`) REFERENCES `ingredients` (`ingredient_name`) ON UPDATE CASCADE;

--
-- Constraints for table `stock_in`
--
ALTER TABLE `stock_in`
  ADD CONSTRAINT `stock_in_ibfk_1` FOREIGN KEY (`ingredient_name`) REFERENCES `ingredients` (`ingredient_name`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_in_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_out`
--
ALTER TABLE `stock_out`
  ADD CONSTRAINT `stock_out_ibfk_1` FOREIGN KEY (`ingredient_name`) REFERENCES `ingredients` (`ingredient_name`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_out_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
