<?php
require_once 'api/db.php';

echo "<h2>Migrating Formula to Database...</h2>";

// 1. Add column if it doesn't exist
$sql_add_column = "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS usage_per_order decimal(10,4) NOT NULL DEFAULT 0.0000";
if ($conn->query($sql_add_column) === TRUE) {
    echo "Column usage_per_order ensured.<br>";
} else {
    echo "Error adding column: " . $conn->error . "<br>";
}

// 2. Set default formulas based on existing cart.js data
$formulas = [
    'เส้นเล็ก' => 55 / 1000,
    'เส้นใหญ่' => 25 / 500,
    'เส้นหมี่ขาว' => 25 / 500,
    'เส้นหมี่หยก' => 2 / 4,
    'เส้นหมี่เหลือง' => 2 / 4,
    'ผักบุ้ง' => 15 / 1000,
    'ถั่วงอก' => 35 / 1000,
    'ลูกชิ้น' => 2 / 90,
    'เนื้อวัว' => 60 / 1000,
    'น่องไก่' => 80 / 1000,
    'กุ้ง' => 80 / 1000,
    'หมึก' => 45 / 1000,
    'ไข่' => 1 / 30
];

foreach ($formulas as $name => $usage) {
    $usage_formatted = number_format($usage, 4, '.', '');
    $stmt = $conn->prepare("UPDATE ingredients SET usage_per_order = ? WHERE ingredient_name = ?");
    if ($stmt) {
        $stmt->bind_param("ds", $usage_formatted, $name);
        $stmt->execute();
        $stmt->close();
    }
}

echo "Database formula migration completed successfully.<br>";
echo "<a href='index.html'>Go back to Home</a>";

$conn->close();
?>
