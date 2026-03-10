<?php
// ===== RESET DATA API =====
// Clears all transactional data: stock_in, stock_out, orders, order_details,
// order_ingredient_usages, cart, notifications
// Does NOT clear: users, menus, ingredients, tables

require_once 'db.php';

header('Content-Type: application/json');
ob_start();
error_reporting(0);

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($input['action']) ? $input['action'] : '';

if ($action !== 'reset_all') {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit;
}

$tables = [
    'stock_in',
    'stock_out',
    'order_ingredient_usages',
    'order_details',
    'orders',
    'cart',
    'notifications'
];

$conn->query('SET FOREIGN_KEY_CHECKS = 0');

$errors = [];
foreach ($tables as $table) {
    $result = $conn->query("TRUNCATE TABLE `$table`");
    if (!$result) {
        $errors[] = $table . ': ' . $conn->error;
    }
}

$conn->query('SET FOREIGN_KEY_CHECKS = 1');
$conn->close();

ob_clean();
if (empty($errors)) {
    echo json_encode(['success' => true, 'message' => 'ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว']);
} else {
    echo json_encode(['success' => false, 'message' => 'มีข้อผิดพลาด: ' . implode(', ', $errors)]);
}
?>
