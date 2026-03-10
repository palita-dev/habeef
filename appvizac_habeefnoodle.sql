-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 09, 2026 at 12:41 AM
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
('haeng', 'ก๋วยเตี๋ยวแห้ง', 'เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น', 50.00, '🥢', 1, 1, 0),
('kao-lao', 'เกาเหลา', 'เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น', 50.00, '🥣', 0, 1, 0),
('nam-khon', 'ก๋วยเตี๋ยวน้ำข้น', 'เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น', 50.00, '🍜', 1, 1, 0),
('tom-yam', 'ก๋วยเตี๋ยวต้มยำ', 'เนื้อสด <br> เนื้อเปื่อย <br> น่องไก่', 60.00, '🌶️', 1, 1, 0),
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
('ORD-MMGHY9QA', 'GMMGG1M94RPA', '1', 130.00, 'pending', '2026-03-07 22:47:12', NULL),
('ORD-MMGHZW32', 'GMMGG1M94RPA', '1', 1300.00, 'pending', '2026-03-07 22:48:28', NULL),
('ORD-MMGI4100', 'GMMGG1M94RPA', '1', 630.00, 'pending', '2026-03-07 22:51:41', NULL);

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
(1, 'ORD-MMGHY9QA', 'nam-khon', 1, 50.00, 130.00, 'เส้นหมี่เหลือง, เนื้อสด, ไข่ +10฿, เกี๊ยว +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นหมี่เหลือง\":0.25,\"เนื้อวัว\":0.18,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(2, 'ORD-MMGHZW32', 'haeng', 10, 50.00, 130.00, 'เส้นเล็ก, เนื้อสด, ไข่ +10฿, เกี๊ยว +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.18,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(3, 'ORD-MMGI4100', 'nam-khon', 7, 50.00, 90.00, 'เส้นใหญ่, น่องไก่, ไข่ +10฿, เกี๊ยว +10฿, น่องไก่ +20฿', '{\"เส้นใหญ่\":0.05,\"น่องไก่\":0.16,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}');

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

--
-- Dumping data for table `stock_in`
--

INSERT INTO `stock_in` (`stock_in_id`, `ingredient_name`, `quantity`, `unit`, `stock_in_date`, `user_id`) VALUES
(1, 'เส้นเล็ก', 2.00, 'ถุง', '2026-03-07 03:43:43', NULL),
(2, 'เส้นใหญ่', 2.00, 'ถุง', '2026-03-07 21:34:56', NULL),
(3, 'เส้นหมี่ขาว', 2.00, 'ถุง', '2026-03-07 21:35:00', NULL),
(4, 'เส้นหมี่หยก', 2.00, 'ถุง', '2026-03-07 21:35:04', NULL),
(5, 'เส้นหมี่เหลือง', 2.00, 'ถุง', '2026-03-07 21:35:42', NULL),
(6, 'ผักบุ้ง', 2.00, 'กิโลกรัม', '2026-03-07 21:35:46', NULL),
(7, 'ถั่วงอก', 2.00, 'กิโลกรัม', '2026-03-07 21:35:52', NULL),
(8, 'ลูกชิ้น', 2.00, 'ถุง', '2026-03-07 21:35:59', NULL),
(9, 'เนื้อวัว', 2.00, 'กิโลกรัม', '2026-03-07 21:36:06', NULL),
(10, 'กุ้ง', 2.00, 'กิโลกรัม', '2026-03-07 21:36:10', NULL),
(11, 'หมึก', 2.00, 'กิโลกรัม', '2026-03-07 21:36:15', NULL),
(12, 'ไข่', 2.00, 'แผง', '2026-03-07 21:36:31', NULL),
(13, 'น่องไก่', 2.00, 'กิโลกรัม', '2026-03-07 21:36:39', NULL);

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

--
-- Dumping data for table `stock_out`
--

INSERT INTO `stock_out` (`stock_out_id`, `ingredient_name`, `quantity`, `unit`, `stock_out_date`, `user_id`) VALUES
(1, 'เส้นเล็ก', 1.00, 'ถุง', '2026-03-07 03:54:02', NULL),
(2, 'ผักบุ้ง', 1.00, 'กิโลกรัม', '2026-03-08 02:13:17', NULL);

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
  `created_at` datetime DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `role`, `created_at`, `email`, `reset_token`, `reset_expires`, `security_question`, `security_answer`) VALUES
(1, 'admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Admin ผู้ดูแลระบบ', 'admin', '2026-03-02 17:25:36', 'palita.ja@rmutsvmail.com', NULL, NULL, 'เบอร์โทรศัพท์ร้านคือเบอร์อะไร?', '000000'),
(249, 'nana', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'nana', 'staff', '2026-03-08 18:25:57', NULL, NULL, NULL, NULL, NULL),
(258, 'palita', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'palita', 'owner', '2026-03-08 19:15:47', NULL, NULL, NULL, NULL, NULL);

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
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `order_ingredient_usages`
--
ALTER TABLE `order_ingredient_usages`
  MODIFY `usage_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_in`
--
ALTER TABLE `stock_in`
  MODIFY `stock_in_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `stock_out`
--
ALTER TABLE `stock_out`
  MODIFY `stock_out_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=278;

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
