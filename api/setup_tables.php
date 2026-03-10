<?php
require_once 'db.php';

// Populate the `tables` table with table IDs 1-10 and กลับบ้าน
$tables = ['1','2','3','4','5','6','7','8','9','10','กลับบ้าน'];

$results = [];
foreach ($tables as $t) {
    // Use INSERT IGNORE to skip if already exists
    $stmt = $conn->prepare("INSERT IGNORE INTO `tables` (`table_id`, `status`) VALUES (?, 'available')");
    $stmt->bind_param("s", $t);
    $stmt->execute();
    $results[] = $t . ': ' . ($stmt->affected_rows > 0 ? 'inserted' : 'already exists');
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "message" => "Tables populated",
    "details" => $results
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

$conn->close();
?>
