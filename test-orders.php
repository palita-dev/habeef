<?php
require_once 'api/db.php';
$sql = "SELECT order_id, guest_id, table_id, total_price, status, created_at, completed_at FROM orders";
$result = $conn->query($sql);
$orders = array();

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
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
        
        $mappedOrder = array(
            "orderId" => $row['order_id'],
            "guestId" => $row['guest_id'],
            "table" => $row['table_id'],
            "totalPrice" => $row['total_price'],
            "status" => $row['status'],
            "createdAt" => $row['created_at'],
            "completedAt" => $row['completed_at'],
            "items" => $items
        );
        $orders[] = $mappedOrder;
    }
}
echo json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
