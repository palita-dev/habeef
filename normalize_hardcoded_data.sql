-- CREATE app_settings TABLE
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INSERT DEFAULT SETTINGS
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`) VALUES
('secret_salt', 'habeef_secret_2024', 'คีย์เข้ารหัส QR Code / URL'),
('resend_api_key', 're_AXo6Xymc_BsonXPxrr67xAXxWHdcwTcvF', 'API Key สำหรับส่งอีเมล Resend')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- ALTER TABLE ingredients
ALTER TABLE `ingredients` 
ADD COLUMN IF NOT EXISTS `secondary_unit` VARCHAR(50) DEFAULT NULL COMMENT 'หน่วยย่อยที่แสดง เช่น ฟอง, ก้อน, ชิ้น, ตัว',
ADD COLUMN IF NOT EXISTS `conversion_factor` DECIMAL(10,4) DEFAULT NULL COMMENT 'จำนวนหน่วยย่อย/หน่วยหลัก เช่น ไข่ 30 ฟอง/แผง',
ADD COLUMN IF NOT EXISTS `display_label` VARCHAR(100) DEFAULT NULL COMMENT 'ป้ายแสดง เช่น กก. สำหรับ กิโลกรัม';

-- UPDATE ingredients WITH CONVERSION DATA
UPDATE `ingredients` SET `secondary_unit` = 'ฟอง', `conversion_factor` = 30.0000 WHERE `ingredient_name` = 'ไข่';
UPDATE `ingredients` SET `secondary_unit` = 'ก้อน', `conversion_factor` = 4.0000 WHERE `ingredient_name` IN ('เส้นหมี่หยก', 'เส้นหมี่เหลือง');
UPDATE `ingredients` SET `secondary_unit` = 'ชิ้น', `conversion_factor` = 90.0000 WHERE `ingredient_name` = 'ลูกชิ้น';
UPDATE `ingredients` SET `secondary_unit` = 'กรัม', `conversion_factor` = 1000.0000 WHERE `ingredient_name` = 'เส้นเล็ก';
UPDATE `ingredients` SET `secondary_unit` = 'กรัม', `conversion_factor` = 500.0000 WHERE `ingredient_name` IN ('เส้นใหญ่', 'เส้นหมี่ขาว');
UPDATE `ingredients` SET `secondary_unit` = 'ชิ้น', `conversion_factor` = 12.4615, `display_label` = 'กก.' WHERE `ingredient_name` = 'น่องไก่';
UPDATE `ingredients` SET `secondary_unit` = 'ตัว', `conversion_factor` = 25.0000, `display_label` = 'กก.' WHERE `ingredient_name` = 'กุ้ง';
UPDATE `ingredients` SET `display_label` = 'กก.' WHERE `ingredient_name` IN ('เนื้อวัว', 'ผักบุ้ง', 'ถั่วงอก', 'หมึก');
