-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 09, 2026 at 03:21 PM
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
  `is_disabled` tinyint(1) DEFAULT 0,
  `usage_per_order` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `pieces_per_order` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`ingredient_name`, `unit`, `is_disabled`, `usage_per_order`, `pieces_per_order`) VALUES
('กุ้ง', 'กิโลกรัม', 0, 0.0800, 2),
('ถั่วงอก', 'กิโลกรัม', 0, 0.0350, 1),
('น่องไก่', 'กิโลกรัม', 0, 0.0800, 1),
('ผักบุ้ง', 'กิโลกรัม', 0, 0.0150, 1),
('ลูกชิ้น', 'ถุง', 0, 0.0222, 1),
('หมึก', 'กิโลกรัม', 0, 0.0450, 1),
('เนื้อวัว', 'กิโลกรัม', 0, 0.0600, 1),
('เส้นหมี่ขาว', 'ถุง', 0, 0.0500, 1),
('เส้นหมี่หยก', 'ถุง', 0, 0.5000, 1),
('เส้นหมี่เหลือง', 'ถุง', 1, 0.5000, 1),
('เส้นเล็ก', 'ถุง', 0, 0.0550, 1),
('เส้นใหญ่', 'ถุง', 0, 0.0500, 1),
('ไข่', 'แผง', 0, 0.0333, 1);

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
('ORD-MMSV3AA6', 'GMMSUWHX8FMG', '7', 130.00, 'paid', '2026-03-16 14:28:15', NULL),
('ORD-MMSV443Q', 'GMMSUWEY9ZP0', '4', 145.00, 'paid', '2026-03-16 14:28:54', NULL),
('ORD-MMSV50XY', 'GMMSUW73RJOG', '1', 130.00, 'paid', '2026-03-16 14:29:37', NULL),
('ORD-MMT91R53', 'GMMT8XTDH2DP', '1', 230.00, 'paid', '2026-03-16 20:58:58', NULL),
('ORD-MMT94E2T', 'GMMT8XTDH2DP', '1', 70.00, 'paid', '2026-03-16 21:01:02', NULL),
('ORD-MMUQIDQ3', 'GMMUQHROCWSY', '2', 150.00, 'paid', '2026-03-17 21:55:34', NULL),
('ORD-MMUQIX6E', 'GMMUQIKUT56C', '6', 60.00, 'paid', '2026-03-17 21:55:59', NULL),
('ORD-MMUQJUHZ', 'GMMUQJBK9S43', '8', 155.00, 'paid', '2026-03-17 21:56:42', NULL),
('ORD-MN1LOIUN', 'GMN1LCZXLNHO', '1', 160.00, 'paid', '2026-03-22 17:14:46', NULL),
('ORD-MN1LV2K7', 'GMN1LUB7DJQW', '2', 70.00, 'paid', '2026-03-22 17:19:51', NULL),
('ORD-MN1M1D4R', 'GMN1LUWAOGE6', '3', 9725.00, 'paid', '2026-03-22 17:24:45', NULL),
('ORD-MN1M7N33', 'GMN1LCZXLNHO', '1', 50.00, 'paid', '2026-03-22 17:29:38', NULL),
('ORD-MOEAT7CO', 'GMOE8TCEHCOW', '1', 160.00, 'paid', '2026-04-25 19:11:11', NULL),
('ORD-MOY2DWJN', 'GMOY25SH12Y0', '1', 70.00, 'paid', '2026-05-09 15:10:44', NULL);

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
(1, 'ORD-MMSV3AA6', 'nam-khon', 1, 50.00, 50.00, 'เส้นเล็ก, เนื้อสด', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(2, 'ORD-MMSV3AA6', 'tom-yam', 1, 60.00, 80.00, 'เส้นใหญ่, เนื้อเปื่อย, ไม่ใส่ผัก, น่องไก่ +20฿', '{\"เส้นใหญ่\":0.05,\"เนื้อวัว\":0.06,\"น่องไก่\":0.08}'),
(3, 'ORD-MMSV443Q', 'haeng', 1, 50.00, 50.00, 'เส้นหมี่ขาว, เนื้อเปื่อย', '{\"เส้นหมี่ขาว\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(4, 'ORD-MMSV443Q', 'tom-yam-seafood', 1, 95.00, 95.00, 'เส้นเล็ก', '{\"เส้นเล็ก\":0.055,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(5, 'ORD-MMSV50XY', 'kao-lao', 1, 50.00, 130.00, 'เนื้อสด, ไข่ +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เนื้อวัว\":0.18,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(6, 'ORD-MMT91R53', 'nam-khon', 1, 50.00, 70.00, 'ผสมเส้นเล็ก+, ผสมเส้นหมี่เหลือง, เนื้อสด, เนื้อสด +20฿', '{\"เส้นเล็ก\":0.0275,\"เส้นหมี่เหลือง\":0.25,\"เนื้อวัว\":0.12,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(7, 'ORD-MMT91R53', 'nam-khon', 1, 50.00, 90.00, 'ผสมเส้นเล็ก+, ผสมเส้นหมี่ขาว, เนื้อสด, ไข่ +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿', '{\"เส้นเล็ก\":0.0275,\"เส้นหมี่ขาว\":0.025,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(8, 'ORD-MMT91R53', 'nam-khon', 1, 50.00, 70.00, 'ผสมเส้นเล็ก+, ผสมเส้นหมี่ขาว, เนื้อสด, ไข่ +10฿, ลูกชิ้น +10฿', '{\"เส้นเล็ก\":0.0275,\"เส้นหมี่ขาว\":0.025,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(9, 'ORD-MMT94E2T', 'nam-khon', 1, 50.00, 70.00, 'ผสมเส้นใหญ่+, ผสมเส้นเล็ก, เนื้อเปื่อย, ไม่ใส่ผัก, ไข่ +10฿, ลูกชิ้น +10฿', '{\"เส้นใหญ่\":0.025,\"เส้นเล็ก\":0.0275,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"ไข่\":0.033333333333333}'),
(10, 'ORD-MMUQIDQ3', 'kao-lao', 1, 50.00, 80.00, 'เนื้อสด, ไข่ +10฿, น่องไก่ +20฿', '{\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"น่องไก่\":0.08}'),
(11, 'ORD-MMUQIDQ3', 'tom-yam', 1, 60.00, 70.00, 'ผสมเส้นหมี่เหลือง+, ผสมเส้นหมี่ขาว, เนื้อเปื่อย, ไข่ +10฿', '{\"เส้นหมี่เหลือง\":0.25,\"เส้นหมี่ขาว\":0.025,\"เนื้อวัว\":0.06,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(12, 'ORD-MMUQIX6E', 'nam-khon', 1, 50.00, 60.00, 'เส้นเล็ก, เนื้อสด, ไข่ +10฿', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(13, 'ORD-MMUQJUHZ', 'nam-khon', 1, 50.00, 50.00, 'เส้นใหญ่, เนื้อสด', '{\"เส้นใหญ่\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(14, 'ORD-MMUQJUHZ', 'tom-yam-seafood', 1, 95.00, 105.00, 'เส้นใหญ่, ไข่ +10฿', '{\"เส้นใหญ่\":0.05,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333}'),
(15, 'ORD-MN1LOIUN', 'nam-khon', 2, 50.00, 80.00, 'ผสมเส้นเล็ก+, ผสมเส้นหมี่ขาว, เนื้อสด, ไม่ใส่ผัก, ลูกชิ้น +10฿, น่องไก่ +20฿', '{\"เส้นเล็ก\":0.0275,\"เส้นหมี่ขาว\":0.025,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.044444444444444,\"น่องไก่\":0.08}'),
(16, 'ORD-MN1LV2K7', 'tom-yam', 1, 60.00, 70.00, 'ผสมเส้นเล็ก+, ผสมเส้นหมี่เหลือง, เนื้อเปื่อย, ลูกชิ้น +10฿', '{\"เส้นเล็ก\":0.0275,\"เส้นหมี่เหลือง\":0.25,\"เนื้อวัว\":0.06,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ลูกชิ้น\":0.022222222222222}'),
(17, 'ORD-MN1M1D4R', 'nam-khon', 72, 50.00, 50.00, 'ผสมเส้นหมี่หยก+, ผสมเส้นหมี่ขาว, น่องไก่', '{\"เส้นหมี่หยก\":0.25,\"เส้นหมี่ขาว\":0.025,\"น่องไก่\":0.08,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(18, 'ORD-MN1M1D4R', 'tom-yam-seafood', 35, 95.00, 175.00, 'ผสมเส้นเล็ก+, ผสมเส้นใหญ่, ไข่ +10฿, ลูกชิ้น +10฿, น่องไก่ +20฿, เนื้อสด +20฿, เนื้อเปื่อย +20฿', '{\"เส้นเล็ก\":0.0275,\"เส้นใหญ่\":0.025,\"กุ้ง\":0.08,\"หมึก\":0.045,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035,\"ไข่\":0.033333333333333,\"ลูกชิ้น\":0.022222222222222,\"น่องไก่\":0.08,\"เนื้อวัว\":0.12}'),
(19, 'ORD-MN1M7N33', 'nam-khon', 1, 50.00, 50.00, 'เส้นเล็ก, เนื้อสด', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.022222222222222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(20, 'ORD-MOEAT7CO', 'nam-khon', 1, 50.00, 50.00, 'เส้นเล็ก, เนื้อสด', '{\"เส้นเล็ก\":0.055,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.0222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(21, 'ORD-MOEAT7CO', 'nam-khon', 1, 50.00, 50.00, 'เส้นหมี่ขาว, เนื้อเปื่อย, ไม่ใส่ผัก', '{\"เส้นหมี่ขาว\":0.05,\"เนื้อวัว\":0.06,\"ลูกชิ้น\":0.0222}'),
(22, 'ORD-MOEAT7CO', 'tom-yam', 1, 60.00, 60.00, 'ผสมเส้นหมี่หยก+, ผสมเส้นหมี่ขาว, น่องไก่', '{\"เส้นหมี่หยก\":0.25,\"เส้นหมี่ขาว\":0.025,\"น่องไก่\":0.08,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}'),
(23, 'ORD-MOY2DWJN', 'nam-khon', 1, 50.00, 70.00, 'เส้นใหญ่, เนื้อสด, เนื้อสด +20฿', '{\"เส้นใหญ่\":0.05,\"เนื้อวัว\":0.12,\"ลูกชิ้น\":0.0222,\"ผักบุ้ง\":0.015,\"ถั่วงอก\":0.035}');

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
(1, 'เส้นหมี่หยก', 2.00, 'ถุง', '2026-03-16 13:45:54', NULL),
(2, 'เส้นเล็ก', 11.00, 'ถุง', '2026-03-16 14:14:24', NULL),
(3, 'เส้นใหญ่', 10.00, 'ถุง', '2026-03-16 14:14:35', NULL),
(4, 'เส้นหมี่ขาว', 11.00, 'ถุง', '2026-03-16 14:14:51', NULL),
(5, 'เส้นหมี่หยก', 100.00, 'ถุง', '2026-03-16 14:15:04', NULL),
(6, 'เส้นหมี่เหลือง', 100.00, 'ถุง', '2026-03-16 14:15:56', NULL),
(7, 'ผักบุ้ง', 11.00, 'กิโลกรัม', '2026-03-16 14:16:05', NULL),
(8, 'ถั่วงอก', 11.00, 'กิโลกรัม', '2026-03-16 14:16:11', NULL),
(9, 'ลูกชิ้น', 6.00, 'ถุง', '2026-03-16 14:16:18', NULL),
(10, 'เนื้อวัว', 20.00, 'กิโลกรัม', '2026-03-16 14:16:29', NULL),
(11, 'น่องไก่', 15.00, 'กิโลกรัม', '2026-03-16 14:16:37', NULL),
(12, 'ไข่', 3.00, 'แผง', '2026-03-16 14:16:42', NULL),
(13, 'หมึก', 1.00, 'กิโลกรัม', '2026-03-16 14:16:50', NULL),
(14, 'กุ้ง', 3.00, 'กิโลกรัม', '2026-03-16 14:17:01', NULL),
(15, 'หมึก', 4.00, 'กิโลกรัม', '2026-03-16 14:26:50', NULL),
(16, 'เส้นหมี่ขาว', 9.00, 'ถุง', '2026-03-16 21:06:06', NULL),
(17, 'เส้นหมี่ขาว', 1.00, 'ถุง', '2026-03-22 17:34:10', NULL),
(18, 'เส้นเล็ก', 5.00, 'ถุง', '2026-05-09 15:00:06', NULL),
(19, 'เส้นใหญ่', 5.00, 'ถุง', '2026-05-09 15:00:37', NULL);

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
(1, 'เส้นใหญ่', 1.00, 'ถุง', '2026-05-09 15:02:47', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `table_id` varchar(50) NOT NULL COMMENT 'ใช้ Varchar เพื่อรองรับกลับบ้านคิว 1',
  `status` enum('available','occupied') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`table_id`, `status`) VALUES
('1', 'available'),
('10', 'available'),
('2', 'available'),
('3', 'available'),
('4', 'available'),
('6', 'available'),
('7', 'available'),
('8', 'available'),
('Table 1', 'available'),
('กลับบ้าน', 'available');

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
(1, 'admin', '16431890fa2d3603311a28425764b84529594c439f9f364baf3a67d36f312195', 'Admin ผู้ดูแลระบบ', 'admin', '2026-03-02 17:25:36', 'palita.ja@rmutsvmail.com', '637087', '2026-03-16 01:35:30', 'เบอร์โทรศัพท์ร้านคือเบอร์อะไร?', '000000'),
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
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_ingredient_usages`
--
ALTER TABLE `order_ingredient_usages`
  MODIFY `usage_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_in`
--
ALTER TABLE `stock_in`
  MODIFY `stock_in_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `stock_out`
--
ALTER TABLE `stock_out`
  MODIFY `stock_out_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=311;

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
