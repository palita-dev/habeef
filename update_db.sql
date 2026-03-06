-- SQL Script สำหรับอัปเดตฐานข้อมูลบนเซิร์ฟเวอร์ (Production Update)
-- ใช้รันใน phpMyAdmin ในแท็บ SQL ได้เลย โดยไม่ต้องลบตารางเก่าข้อมูลจะไม่หายครับ

-- 1. เพิ่มคอลัมน์ is_disabled ให้กับตาราง ingredients (ถ้ายังไม่มี)
ALTER TABLE `ingredients` ADD COLUMN IF NOT EXISTS `is_disabled` TINYINT(1) DEFAULT 0;

-- 2. สร้างตาราง cart สำหรับเก็บสินค้าในตะกร้า
CREATE TABLE IF NOT EXISTS `cart` (
  `cart_id` int(11) NOT NULL AUTO_INCREMENT,
  `table_id` varchar(50) NOT NULL,
  `menu_id` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(10,2) NOT NULL,
  `options_text` text DEFAULT NULL,
  `options_json` longtext DEFAULT NULL CHECK (json_valid(`options_json`)),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`cart_id`),
  KEY `table_id` (`table_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `tables` (`table_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. สร้างตาราง stock_out สำหรับพนักงานตัดสต๊อกด้วยตัวเอง (Manual Deduction)
CREATE TABLE IF NOT EXISTS `stock_out` (
  `stock_out_id` int(11) NOT NULL AUTO_INCREMENT,
  `ingredient_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock_out_date` datetime DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`stock_out_id`),
  KEY `ingredient_name` (`ingredient_name`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `stock_out_ibfk_1` FOREIGN KEY (`ingredient_name`) REFERENCES `ingredients` (`ingredient_name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_out_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. สร้างตาราง notifications สำหรับเก็บการแจ้งเตือนพนักงาน (วัตถุดิบหมด ฯลฯ)
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
