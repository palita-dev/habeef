-- เพิ่มคอลัมน์ icon_html ในตาราง ingredients เพื่อเก็บภาพหรืออีโมจิ
ALTER TABLE `ingredients` ADD COLUMN `icon_html` VARCHAR(255) DEFAULT NULL;

-- อัปเดตข้อมูลภาพสำหรับวัตถุดิบ
UPDATE `ingredients` SET `icon_html` = '<img src="images/เส้นเล็กตรานำโชค.jpg.png" class="ing-icon">' WHERE `ingredient_name` = 'เส้นเล็ก';
UPDATE `ingredients` SET `icon_html` = '<img src="images/เส้นใหญ่ตราเสือ.jpg" class="ing-icon">' WHERE `ingredient_name` = 'เส้นใหญ่';
UPDATE `ingredients` SET `icon_html` = '<img src="images/เส้นหมี่ขาวตราเสือ.jpg" class="ing-icon">' WHERE `ingredient_name` = 'เส้นหมี่ขาว';
UPDATE `ingredients` SET `icon_html` = '<img src="images/หมี่หยก.jpg" class="ing-icon">' WHERE `ingredient_name` = 'เส้นหมี่หยก';
UPDATE `ingredients` SET `icon_html` = '<img src="images/หมี่เหลือง.jpg" class="ing-icon">' WHERE `ingredient_name` = 'เส้นหมี่เหลือง';
UPDATE `ingredients` SET `icon_html` = '<img src="images/ผักบุ้ง.jpg" class="ing-icon">' WHERE `ingredient_name` = 'ผักบุ้ง';
UPDATE `ingredients` SET `icon_html` = '<img src="images/ถั่วงอกแต่งสี.jpg" class="ing-icon">' WHERE `ingredient_name` = 'ถั่วงอก';
UPDATE `ingredients` SET `icon_html` = '<img src="images/ลูกชิ้น.jpg" class="ing-icon">' WHERE `ingredient_name` = 'ลูกชิ้น';
UPDATE `ingredients` SET `icon_html` = '<img src="images/เนื้อวัว.png" class="ing-icon">' WHERE `ingredient_name` = 'เนื้อวัว';
UPDATE `ingredients` SET `icon_html` = '<img src="images/น่องไก่.png" class="ing-icon">' WHERE `ingredient_name` = 'น่องไก่';
UPDATE `ingredients` SET `icon_html` = '<img src="images/ไข่แผง.jpg" class="ing-icon">' WHERE `ingredient_name` = 'ไข่';
UPDATE `ingredients` SET `icon_html` = '<img src="images/กุ้ง.jpg" class="ing-icon">' WHERE `ingredient_name` = 'กุ้ง';
UPDATE `ingredients` SET `icon_html` = '<img src="images/หมึก.jpg" class="ing-icon">' WHERE `ingredient_name` = 'หมึก';

-- สร้างตารางใหม่สำหรับตัวเลือกเมนู (Noodles, Meats, Veggies, Extras)
CREATE TABLE `menu_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `option_group` ENUM('noodle', 'meat', 'veggie', 'extra') NOT NULL,
  `option_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `ingredient_name` varchar(100) DEFAULT NULL,
  `price_add` decimal(10,2) DEFAULT 0.00,
  `is_default` tinyint(1) DEFAULT 0,
  `is_none` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `option_key` (`option_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เพิ่มข้อมูลตัวเลือกเส้น (NOODLE_OPTIONS)
INSERT INTO `menu_options` (`option_group`, `option_key`, `name`, `ingredient_name`) VALUES
('noodle', 'sen-lek', 'เล็ก', 'เส้นเล็ก'),
('noodle', 'sen-yai', 'ใหญ่', 'เส้นใหญ่'),
('noodle', 'mee-khao', 'หมี่ขาว', 'เส้นหมี่ขาว'),
('noodle', 'mee-yok', 'หมี่หยก', 'เส้นหมี่หยก'),
('noodle', 'mee-lueng', 'หมี่เหลือง', 'เส้นหมี่เหลือง');

-- เพิ่มข้อมูลตัวเลือกเนื้อสัตว์ (MEAT_OPTIONS)
INSERT INTO `menu_options` (`option_group`, `option_key`, `name`, `ingredient_name`) VALUES
('meat', 'neua-sod', 'เนื้อสด', 'เนื้อวัว'),
('meat', 'neua-peuay', 'เนื้อเปื่อย', 'เนื้อวัว'),
('meat', 'nong-kai', 'น่องไก่', 'น่องไก่');

-- เพิ่มข้อมูลตัวเลือกผัก (VEGGIE_OPTIONS)
INSERT INTO `menu_options` (`option_group`, `option_key`, `name`, `is_default`, `is_none`) VALUES
('veggie', 'veg-yes', 'ใส่', 1, 0),
('veggie', 'veg-no', 'ไม่ใส่', 0, 1);

-- เพิ่มข้อมูลตัวเลือกสั่งเพิ่ม (EXTRA_OPTIONS)
INSERT INTO `menu_options` (`option_group`, `option_key`, `name`, `price_add`, `ingredient_name`, `is_none`) VALUES
('extra', 'extra-none', 'ไม่สั่งเพิ่ม', 0.00, NULL, 1),
('extra', 'extra-egg', 'ไข่', 10.00, 'ไข่', 0),
('extra', 'extra-lc', 'ลูกชิ้น', 10.00, 'ลูกชิ้น', 0),
('extra', 'extra-nk', 'น่องไก่', 20.00, 'น่องไก่', 0),
('extra', 'extra-ns', 'เนื้อสด', 20.00, 'เนื้อวัว', 0),
('extra', 'extra-np', 'เนื้อเปื่อย', 20.00, 'เนื้อวัว', 0);
