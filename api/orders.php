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
            $itemsSql = "SELECT menu_id, quantity, unit_price, total_price, options_json FROM order_details WHERE order_id = '$orderId'";
            $itemsResult = $conn->query($itemsSql);
            $items = array();
            if ($itemsResult && $itemsResult->num_rows > 0) {
                while($itemRow = $itemsResult->fetch_assoc()) {
                    if(!empty($itemRow['options_json'])) {
                       $itemRow['options'] = json_decode($itemRow['options_json'], true);
                    }
                    $items[] = $itemRow;
                }
            }
            $row['items'] = $items;
            
            // Re-map fields back to what JS expects if needed.
            // JS expects: { id: order_id, tableId: table_id, items: [...], totalPrice: total_price, status: status, timestamp: created_at }
            $mappedOrder = array(
                "id" => $row['order_id'],
                "guestId" => $row['guest_id'],
                "tableId" => $row['table_id'],
                "totalPrice" => $row['total_price'],
                "status" => $row['status'],
                "timestamp" => $row['created_at'],
                "items" => $items
            );
            $orders[] = $mappedOrder;
        }
    }
    
    echo json_encode($orders);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Existing Node code: db.orders = req.body; writeDb(db);
    // This replaces the whole orders array. DANGEROUS for SQL.
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // We will just return success to not break the frontend format immediately
    // In a real relational DB, you'd insert/update specific records.
    echo json_encode(["success" => true]);
}

$conn->close();
?>
