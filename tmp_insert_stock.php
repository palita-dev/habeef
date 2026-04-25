<?php
$host = 'localhost';
$db_user = 'appvizac_habeefnoodle';
$db_pass = 'kh89mNtD';
$db_name = 'appvizac_habeefnoodle';

$conn = new mysqli($host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}
$conn->set_charset("utf8mb4");

$items = [
    ['name' => 'เส้นเล็ก', 'qty' => 11, 'unit' => 'ถุง'],
    ['name' => 'เส้นใหญ่', 'qty' => 10, 'unit' => 'ถุง'],
    ['name' => 'เส้นหมี่ขาว', 'qty' => 10, 'unit' => 'ถุง'],
    ['name' => 'เส้นหมี่หยก', 'qty' => 100, 'unit' => 'ถุง'],
    ['name' => 'เส้นหมี่เหลือง', 'qty' => 100, 'unit' => 'ถุง'],
    ['name' => 'ผักบุ้ง', 'qty' => 10, 'unit' => 'กิโลกรัม'],
    ['name' => 'ถั่วงอก', 'qty' => 10, 'unit' => 'กิโลกรัม'],
    ['name' => 'ลูกชิ้น', 'qty' => 5, 'unit' => 'ถุง'],
    ['name' => 'เนื้อวัว', 'qty' => 18, 'unit' => 'กิโลกรัม'],
    ['name' => 'น่องไก่', 'qty' => 15, 'unit' => 'กิโลกรัม'],
    ['name' => 'ไข่', 'qty' => 3, 'unit' => 'แผง'],
    ['name' => 'กุ้ง', 'qty' => 3, 'unit' => 'กิโลกรัม'],
    ['name' => 'หมึก', 'qty' => 1, 'unit' => 'กิโลกรัม']
];

$now = date('Y-m-d H:i:s');
$stmt = $conn->prepare("INSERT INTO stock_in (ingredient_name, quantity, unit, stock_in_date) VALUES (?, ?, ?, ?)");

foreach ($items as $item) {
    $stmt->bind_param("sdss", $item['name'], $item['qty'], $item['unit'], $now);
    if ($stmt->execute()) {
        echo "Inserted: {$item['name']} ({$item['qty']} {$item['unit']})\n";
    } else {
        echo "Failed: {$item['name']} - " . $stmt->error . "\n";
    }
}

$stmt->close();
$conn->close();
?>
