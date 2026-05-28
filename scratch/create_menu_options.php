<?php
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once dirname(__DIR__) . '/api/db.php';

// 1. Create table
$createTableSql = "
CREATE TABLE IF NOT EXISTS `menu_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `option_group` enum('noodle','meat','veggie','extra') NOT NULL,
  `option_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `ingredient_name` varchar(100) DEFAULT NULL,
  `price_add` decimal(10,2) DEFAULT 0.00,
  `is_default` tinyint(1) DEFAULT 0,
  `is_none` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `option_key` (`option_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=17;
";

if ($conn->query($createTableSql)) {
    echo "Table menu_options created or already exists.\n";
} else {
    die("Failed to create table: " . $conn->error . "\n");
}

// 2. Insert data
$insertData = [
    [1, 'noodle', 'sen-lek', 'เล็ก', 'เส้นเล็ก', 0.00, 0, 0],
    [2, 'noodle', 'sen-yai', 'ใหญ่', 'เส้นใหญ่', 0.00, 0, 0],
    [3, 'noodle', 'mee-khao', 'หมี่ขาว', 'เส้นหมี่ขาว', 0.00, 0, 0],
    [4, 'noodle', 'mee-yok', 'หมี่หยก', 'เส้นหมี่หยก', 0.00, 0, 0],
    [5, 'noodle', 'mee-lueng', 'หมี่เหลือง', 'เส้นหมี่เหลือง', 0.00, 0, 0],
    [6, 'meat', 'neua-sod', 'เนื้อสด', 'เนื้อวัว', 0.00, 0, 0],
    [7, 'meat', 'neua-peuay', 'เนื้อเปื่อย', 'เนื้อวัว', 0.00, 0, 0],
    [8, 'meat', 'nong-kai', 'น่องไก่', 'น่องไก่', 0.00, 0, 0],
    [9, 'veggie', 'veg-yes', 'ใส่', null, 0.00, 1, 0],
    [10, 'veggie', 'veg-no', 'ไม่ใส่', null, 0.00, 0, 1],
    [11, 'extra', 'extra-none', 'ไม่สั่งเพิ่ม', null, 0.00, 0, 1],
    [12, 'extra', 'extra-egg', 'ไข่', 'ไข่', 10.00, 0, 0],
    [13, 'extra', 'extra-lc', 'ลูกชิ้น', 'ลูกชิ้น', 10.00, 0, 0],
    [14, 'extra', 'extra-nk', 'น่องไก่', 'น่องไก่', 20.00, 0, 0],
    [15, 'extra', 'extra-ns', 'เนื้อสด', 'เนื้อวัว', 20.00, 0, 0],
    [16, 'extra', 'extra-np', 'เนื้อเปื่อย', 'เนื้อวัว', 20.00, 0, 0]
];

foreach ($insertData as $row) {
    $stmt = $conn->prepare("INSERT IGNORE INTO `menu_options` (`id`, `option_group`, `option_key`, `name`, `ingredient_name`, `price_add`, `is_default`, `is_none`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("issssdii", $row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7]);
        $stmt->execute();
        $stmt->close();
        echo "Inserted/Ignored ID {$row[0]}: {$row[2]}\n";
    } else {
        echo "Prepare failed for ID {$row[0]}: " . $conn->error . "\n";
    }
}

echo "Done populating menu_options!\n";
?>
