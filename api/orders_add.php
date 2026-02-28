<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $order = json_decode($input, true);
    
    if (!$order) {
        echo json_encode(["success" => false, "error" => "Invalid JSON"]);
        exit;
    }
    
    $orderId = isset($order['id']) ? $order['id'] : uniqid('ord_');
    $tableId = isset($order['tableId']) ? $order['tableId'] : '';
    $guestId = isset($order['guestId']) ? $order['guestId'] : '';
    $totalPrice = isset($order['totalPrice']) ? floatval($order['totalPrice']) : 0;
    $status = isset($order['status']) ? $order['status'] : 'pending';
    
    // Insert into orders table
    $stmt = $conn->prepare("INSERT INTO orders (order_id, guest_id, table_id, total_price, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssds", $orderId, $guestId, $tableId, $totalPrice, $status);
    
    if ($stmt->execute()) {
        // Insert items
        if (isset($order['items']) && is_array($order['items'])) {
            $itemStmt = $conn->prepare("INSERT INTO order_details (order_id, menu_id, quantity, unit_price, total_price, options_json) VALUES (?, ?, ?, ?, ?, ?)");
            foreach($order['items'] as $item) {
                $menuId = isset($item['id']) ? $item['id'] : '';
                $qty = isset($item['quantity']) ? intval($item['quantity']) : 1;
                $price = isset($item['price']) ? floatval($item['price']) : 0;
                $itemTotal = $price * $qty;
                $optionsJson = isset($item['options']) ? json_encode($item['options']) : NULL;
                
                $itemStmt->bind_param("ssidds", $orderId, $menuId, $qty, $price, $itemTotal, $optionsJson);
                $itemStmt->execute();
            }
            $itemStmt->close();
        }
        echo json_encode(["success" => true, "orderId" => $orderId]);
    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    
    $stmt->close();
}
$conn->close();
?>
