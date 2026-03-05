<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all orders (we'd realistically need to structure this to match the JSON structure expected by JS)
    // The JS expects an array of order objects.
    
    // This is a simplified fetch to get orders table. 
    // If JS expects nested items, we need a JOIN or multiple queries.
    // Let's assume for now the node app was just dumping JSON from database.json
    
    // Since the frontend stores raw JSON in `database.json`'s "orders" array, 
    // if we are fully migrating to relational, we should fetch from `orders` and `order_details`.
    // However, if we just need to quickly get it running on PHP using a flat file approach similar to Node:
    
    // We will simulate the Node behavior by using a flat file for now if the DB structure is too complex to map instantly, 
    // OR we will serve from DB. Let's serve from DB:
    
    $sql = "SELECT order_id, guest_id, table_id, total_price, status, created_at, completed_at FROM orders";
    $result = $conn->query($sql);
    $orders = array();

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Fetch items for this order
            $orderId = $row['order_id'];
            $itemsSql = "SELECT d.menu_id, d.quantity, d.unit_price, d.total_price, d.options_json, d.options_text, m.menu_name 
                         FROM order_details d 
                         LEFT JOIN menus m ON d.menu_id = m.menu_id 
                         WHERE d.order_id = '$orderId'";
            $itemsResult = $conn->query($itemsSql);
            $items = array();
            if ($itemsResult && $itemsResult->num_rows > 0) {
                while($itemRow = $itemsResult->fetch_assoc()) {
                    $ingredients = new stdClass();
                    if(!empty($itemRow['options_json'])) {
                        $parsed = json_decode($itemRow['options_json'], true);
                        if (!empty($parsed)) $ingredients = $parsed;
                    }
                    $details = array();
                    if(!empty(trim($itemRow['options_text']))) {
                        $details = array_map('trim', explode(',', $itemRow['options_text']));
                    }
                    $items[] = array(
                        "menuId" => $itemRow['menu_id'],
                        "name" => $itemRow['menu_name'] ? $itemRow['menu_name'] : 'ไม่ทราบชื่อเมนู',
                        "qty" => (int)$itemRow['quantity'],
                        "basePrice" => (float)$itemRow['unit_price'],
                        "totalPrice" => (float)$itemRow['total_price'],
                        "details" => $details,
                        "ingredients" => $ingredients
                    );
                }
            }
            $row['items'] = $items;
            
            $createdAtISO = $row['created_at'] ? str_replace(' ', 'T', $row['created_at']) : null;
            $completedAtISO = $row['completed_at'] ? str_replace(' ', 'T', $row['completed_at']) : null;

            $mappedOrder = array(
                "orderId" => $row['order_id'],
                "guestId" => $row['guest_id'],
                "table" => $row['table_id'],
                "totalPrice" => (float)$row['total_price'],
                "status" => $row['status'],
                "createdAt" => $createdAtISO,
                "completedAt" => $completedAtISO,
                "items" => $items
            );
            $orders[] = $mappedOrder;
        }
    }
    
    echo json_encode($orders);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // In original code, the frontend posts the *entire* orders array on every change. 
    // This is problematic for SQL. We need to check if the input is a single order object or an array.
    // If it's an array, we might need a sync mechanism, but for new orders, we can find what's missing.
    // However, the best approach is to fix the client to POST a single new order, OR sync the array securely.
    
    // Let's implement a quick sync for complete array override (DANGEROUS but matches Node behavior for now)
    // or better yet, assume $data is the full array and iterate over it to insert/update.
    
    if (is_array($data)) {
        foreach($data as $order) {
            $orderId = isset($order['orderId']) ? $conn->real_escape_string($order['orderId']) : (isset($order['id']) ? $conn->real_escape_string($order['id']) : '');
            if (empty($orderId)) continue;
            
            $guestId = isset($order['guestId']) ? $conn->real_escape_string($order['guestId']) : '';
            $tableId = isset($order['table']) ? $conn->real_escape_string($order['table']) : (isset($order['tableId']) ? $conn->real_escape_string($order['tableId']) : '');
            
            $totalPrice = isset($order['totalPrice']) ? floatval($order['totalPrice']) : 0;
            $status = isset($order['status']) ? $conn->real_escape_string($order['status']) : 'pending';
            
            $createdAt = isset($order['createdAt']) ? $conn->real_escape_string(date('Y-m-d H:i:s', strtotime($order['createdAt']))) : (isset($order['timestamp']) ? $conn->real_escape_string($order['timestamp']) : date('Y-m-d H:i:s'));
            
            // Check if order exists
            $checkSql = "SELECT order_id FROM orders WHERE order_id = '$orderId'";
            $checkRes = $conn->query($checkSql);
            
            if ($checkRes && $checkRes->num_rows > 0) {
                // Update status if exists
                $updateSql = "UPDATE orders SET status = '$status' WHERE order_id = '$orderId'";
                $conn->query($updateSql);
            } else {
                // Insert new
                $insertSql = "INSERT INTO orders (order_id, guest_id, table_id, total_price, status, created_at) 
                              VALUES ('$orderId', '$guestId', '$tableId', $totalPrice, '$status', '$createdAt')";
                if ($conn->query($insertSql) === TRUE) {
                    // Insert details
                    if (isset($order['items']) && is_array($order['items'])) {
                        foreach($order['items'] as $item) {
                            $menuId = isset($item['menuId']) ? $conn->real_escape_string($item['menuId']) : (isset($item['id']) ? $conn->real_escape_string($item['id']) : '');
                            $qty = isset($item['qty']) ? intval($item['qty']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);
                            
                            $itemTotal = isset($item['totalPrice']) ? floatval($item['totalPrice']) : 0;
                            $uPrice = isset($item['basePrice']) ? floatval($item['basePrice']) : ($qty > 0 ? $itemTotal / $qty : 0);
                            
                            $optionsJson = isset($item['ingredients']) ? $conn->real_escape_string(json_encode($item['ingredients'], JSON_UNESCAPED_UNICODE)) : '';
                            
                            $optionsText = isset($item['details']) && is_array($item['details']) ? $conn->real_escape_string(implode(', ', $item['details'])) : '';
                            
                            $detSql = "INSERT INTO order_details (order_id, menu_id, quantity, unit_price, total_price, options_json, options_text)
                                       VALUES ('$orderId', '$menuId', $qty, $uPrice, $itemTotal, '$optionsJson', '$optionsText')";
                            $conn->query($detSql);
                        }
                    }
                }
            }
        }
    }

    echo json_encode(["success" => true]);
}

$conn->close();
?>
