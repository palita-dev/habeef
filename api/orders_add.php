<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $order = json_decode($input, true);
    
    if (!$order) {
        echo json_encode(["success" => false, "error" => "Invalid JSON"]);
        exit;
    }
    
    $orderId = isset($order['orderId']) ? $order['orderId'] : (isset($order['id']) ? $order['id'] : uniqid('ORD-'));
    $tableId = isset($order['table']) ? $order['table'] : (isset($order['tableId']) ? $order['tableId'] : '');
    $guestId = isset($order['guestId']) ? $order['guestId'] : '';
    $totalPrice = isset($order['totalPrice']) ? floatval($order['totalPrice']) : 0;
    $status = isset($order['status']) ? $order['status'] : 'pending';
    $createdAt = isset($order['createdAt']) ? date('Y-m-d H:i:s', strtotime($order['createdAt'])) : date('Y-m-d H:i:s');
    
    // Insert into orders table
    $stmt = $conn->prepare("INSERT INTO orders (order_id, guest_id, table_id, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(["success" => false, "error" => $conn->error]);
        exit;
    }
    $stmt->bind_param("sssds", $orderId, $guestId, $tableId, $totalPrice, $status, $createdAt);
    
    if ($stmt->execute()) {
        $stmt->close();
        // Insert items
        if (isset($order['items']) && is_array($order['items'])) {
            $itemStmt = $conn->prepare("INSERT INTO order_details (order_id, menu_id, quantity, unit_price, total_price, options_json, options_text) VALUES (?, ?, ?, ?, ?, ?, ?)");
            if ($itemStmt) {
                foreach($order['items'] as $item) {
                    $menuId = isset($item['menuId']) ? $item['menuId'] : (isset($item['id']) ? $item['id'] : '');
                    $qty = isset($item['qty']) ? intval($item['qty']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);
                    $itemTotal = isset($item['totalPrice']) ? floatval($item['totalPrice']) : 0;
                    $price = isset($item['basePrice']) ? floatval($item['basePrice']) : ($qty > 0 ? $itemTotal / $qty : 0);
                    
                    $optionsJson = isset($item['ingredients']) ? json_encode($item['ingredients'], JSON_UNESCAPED_UNICODE) : NULL;
                    $optionsText = isset($item['details']) && is_array($item['details']) ? implode(', ', $item['details']) : '';
                    
                    $itemStmt->bind_param("ssiddss", $orderId, $menuId, $qty, $price, $itemTotal, $optionsJson, $optionsText);
                    $itemStmt->execute();
                }
                $itemStmt->close();
            }
        }
        echo json_encode(["success" => true, "orderId" => $orderId]);
    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
        $stmt->close();
    }
}
$conn->close();
?>
