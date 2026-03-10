<?php
// ====== LOCAL XAMPP SETUP ======
// สร้างฐานข้อมูล habeef ถ้ายังไม่มี แล้วสร้างตารางทั้งหมด

$host = '127.0.0.1';
$db_user = 'root';
$db_pass = '';
$db_name = 'habeef';

// เชื่อมต่อโดยไม่ระบุ DB ก่อน เพื่อสร้าง DB ถ้ายังไม่มี
$conn = new mysqli($host, $db_user, $db_pass);
if ($conn->connect_error) {
    die("<h2 style='color:red'>❌ เชื่อมต่อ MySQL ไม่ได้: " . $conn->connect_error . "</h2><p>ตรวจสอบว่า XAMPP MySQL กำลังรันอยู่ครับ</p>");
}
$conn->set_charset("utf8mb4");

// สร้าง Database ถ้ายังไม่มี
$conn->query("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db($db_name);

$results = [];

// ---- Tables ----
$tables = [
    'users' => "CREATE TABLE IF NOT EXISTS `users` (
      `user_id` int(11) NOT NULL AUTO_INCREMENT,
      `username` varchar(50) NOT NULL,
      `password` varchar(255) NOT NULL,
      `full_name` varchar(100) NOT NULL,
      `email` varchar(255) DEFAULT NULL,
      `role` enum('admin','owner','staff') NOT NULL DEFAULT 'staff',
      `created_at` datetime DEFAULT current_timestamp(),
      PRIMARY KEY (`user_id`),
      UNIQUE KEY `username` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'tables' => "CREATE TABLE IF NOT EXISTS `tables` (
      `table_id` varchar(50) NOT NULL,
      `status` enum('available','occupied') DEFAULT 'available',
      PRIMARY KEY (`table_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'menus' => "CREATE TABLE IF NOT EXISTS `menus` (
      `menu_id` varchar(50) NOT NULL,
      `menu_name` varchar(100) NOT NULL,
      `description` text DEFAULT NULL,
      `base_price` decimal(10,2) NOT NULL,
      `emoji` varchar(20) DEFAULT NULL,
      `has_noodle` tinyint(1) DEFAULT 1,
      `has_meat` tinyint(1) DEFAULT 1,
      `is_seafood` tinyint(1) DEFAULT 0,
      PRIMARY KEY (`menu_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'ingredients' => "CREATE TABLE IF NOT EXISTS `ingredients` (
      `ingredient_name` varchar(100) NOT NULL,
      `unit` varchar(50) NOT NULL,
      PRIMARY KEY (`ingredient_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'stock_in' => "CREATE TABLE IF NOT EXISTS `stock_in` (
      `stock_in_id` int(11) NOT NULL AUTO_INCREMENT,
      `ingredient_name` varchar(100) NOT NULL,
      `quantity` decimal(10,2) NOT NULL,
      `unit` varchar(50) NOT NULL,
      `stock_in_date` datetime DEFAULT current_timestamp(),
      `user_id` int(11) DEFAULT NULL,
      PRIMARY KEY (`stock_in_id`),
      KEY `ingredient_name` (`ingredient_name`),
      KEY `user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'orders' => "CREATE TABLE IF NOT EXISTS `orders` (
      `order_id` varchar(50) NOT NULL,
      `guest_id` varchar(50) DEFAULT NULL,
      `table_id` varchar(50) NOT NULL,
      `total_price` decimal(10,2) NOT NULL,
      `status` enum('pending','served','paid','cancelled') DEFAULT 'pending',
      `created_at` datetime DEFAULT current_timestamp(),
      `completed_at` datetime DEFAULT NULL,
      PRIMARY KEY (`order_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'order_details' => "CREATE TABLE IF NOT EXISTS `order_details` (
      `order_detail_id` int(11) NOT NULL AUTO_INCREMENT,
      `order_id` varchar(50) NOT NULL,
      `menu_id` varchar(50) NOT NULL,
      `quantity` int(11) NOT NULL DEFAULT 1,
      `unit_price` decimal(10,2) NOT NULL,
      `total_price` decimal(10,2) NOT NULL,
      `options_text` text DEFAULT NULL,
      `options_json` longtext DEFAULT NULL,
      PRIMARY KEY (`order_detail_id`),
      KEY `order_id` (`order_id`),
      KEY `menu_id` (`menu_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'order_ingredient_usages' => "CREATE TABLE IF NOT EXISTS `order_ingredient_usages` (
      `usage_id` int(11) NOT NULL AUTO_INCREMENT,
      `order_id` varchar(50) NOT NULL,
      `ingredient_name` varchar(100) NOT NULL,
      `quantity_used` decimal(10,2) NOT NULL,
      PRIMARY KEY (`usage_id`),
      KEY `order_id` (`order_id`),
      KEY `ingredient_name` (`ingredient_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'cart' => "CREATE TABLE IF NOT EXISTS `cart` (
      `cart_id` int(11) NOT NULL AUTO_INCREMENT,
      `table_id` varchar(50) NOT NULL,
      `menu_id` varchar(50) NOT NULL,
      `quantity` int(11) NOT NULL DEFAULT 1,
      `total_price` decimal(10,2) NOT NULL,
      `options_text` text DEFAULT NULL,
      `options_json` longtext DEFAULT NULL,
      `created_at` datetime DEFAULT current_timestamp(),
      PRIMARY KEY (`cart_id`),
      KEY `table_id` (`table_id`),
      KEY `menu_id` (`menu_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'stock_out' => "CREATE TABLE IF NOT EXISTS `stock_out` (
      `stock_out_id` int(11) NOT NULL AUTO_INCREMENT,
      `ingredient_name` varchar(100) NOT NULL,
      `quantity` decimal(10,2) NOT NULL,
      `unit` varchar(50) NOT NULL,
      `stock_out_date` datetime DEFAULT current_timestamp(),
      `user_id` int(11) DEFAULT NULL,
      PRIMARY KEY (`stock_out_id`),
      KEY `ingredient_name` (`ingredient_name`),
      KEY `user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'notifications' => "CREATE TABLE IF NOT EXISTS `notifications` (
      `notification_id` int(11) NOT NULL AUTO_INCREMENT,
      `username` varchar(50) NOT NULL,
      `message` varchar(255) NOT NULL,
      `is_read` tinyint(1) DEFAULT 0,
      `created_at` datetime DEFAULT current_timestamp(),
      PRIMARY KEY (`notification_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
];

foreach ($tables as $name => $sql) {
    $results[] = ['table' => $name, 'status' => $conn->query($sql) ? 'OK ✅' : 'ERROR: ' . $conn->error];
}

// Seed default data
$conn->query("INSERT IGNORE INTO `users` (username, password, full_name, role) VALUES ('admin', '1234', 'Admin ผู้ดูแลระบบ', 'admin')");
$conn->query("INSERT IGNORE INTO `menus` VALUES
  ('nam-khon','ก๋วยเตี๋ยวน้ำข้น','เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น',50,'🍜',1,1,0),
  ('haeng','ก๋วยเตี๋ยวแห้ง','เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น',50,'🥢',1,1,0),
  ('tom-yam','ก๋วยเตี๋ยวต้มยำ','เนื้อสด <br> เนื้อเปื่อย <br> น่องไก่',60,'🌶️',1,1,0),
  ('tom-yam-seafood','ก๋วยเตี๋ยวต้มยำ ทะเล','กุ้ง + หมึก',95,'🦐',1,0,1),
  ('kao-lao','เกาเหลา','เนื้อสด+ลูกชิ้น <br> เนื้อเปื่อย+ลูกชิ้น <br> น่องไก่+ลูกชิ้น',50,'🥣',0,1,0)");
$conn->query("INSERT IGNORE INTO `ingredients` VALUES
  ('กุ้ง','กิโลกรัม'),('ถั่วงอก','กิโลกรัม'),('น่องไก่','กิโลกรัม'),('ผักบุ้ง','กิโลกรัม'),('ลูกชิ้น','ถุง'),
  ('หมึก','กิโลกรัม'),('เนื้อวัว','กิโลกรัม'),('เส้นหมี่ขาว','ถุง'),('เส้นหมี่หยก','ถุง'),('เส้นหมี่เหลือง','ถุง'),
  ('เส้นเล็ก','ถุง'),('เส้นใหญ่','ถุง'),('ไข่','แผง')");

// Inject tables 1-10 + takeaway
$tableInserts = [];
for ($i = 1; $i <= 10; $i++) {
    $tableInserts[] = "('$i', 'available')";
}
$tableInserts[] = "('กลับบ้าน', 'available')";
$conn->query("INSERT IGNORE INTO `tables` (table_id, status) VALUES " . implode(',', $tableInserts));

$conn->close();
?>
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>DB Migration - Local</title>
<style>
  body { font-family: sans-serif; padding: 40px; background: #f5f5f5; max-width: 600px; margin: auto; }
  h2 { color: #333; }
  .item { background: #fff; border-radius: 8px; padding: 12px 20px; margin-bottom: 8px; display: flex; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  .ok { color: #388E3C; font-weight: bold; }
  .err { color: #D32F2F; font-weight: bold; }
  .done { display: inline-block; background: #4CAF50; color: #fff; padding: 10px 24px; border-radius: 8px; margin-top: 16px; text-decoration: none; font-size: 1rem; }
  .note { background: #FFF9C4; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #555; }
</style>
</head>
<body>
<h2>🛠 Database Migration (Local XAMPP)</h2>
<div class="note">📁 Database: <strong>habeef</strong> บน localhost (root)</div>
<?php foreach($results as $r): ?>
  <div class="item">
    <span>📋 <strong><?= htmlspecialchars($r['table']) ?></strong></span>
    <span class="<?= str_contains($r['status'], 'OK') ? 'ok' : 'err' ?>"><?= htmlspecialchars($r['status']) ?></span>
  </div>
<?php endforeach; ?>
<br>
<a href="index.html" class="done">✅ เสร็จแล้ว — ไปหน้าหลัก</a>
</body>
</html>
