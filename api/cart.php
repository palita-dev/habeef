<?php
require_once 'db.php';

// Helper: ensure table_id exists in `tables` table (for FK constraint)
function ensureTableExists($conn, $table_id) {
    $stmt = $conn->prepare("INSERT IGNORE INTO `tables` (`table_id`, `status`) VALUES (?, 'available')");
    $stmt->bind_param("s", $table_id);
    $stmt->execute();
    $stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $table_id = isset($_GET['table_id']) ? $conn->real_escape_string($_GET['table_id']) : '';
    if (empty($table_id)) {
        echo json_encode([]);
        exit;
    }

    $sql = "SELECT c.cart_id, c.table_id, c.menu_id, c.quantity, c.total_price, c.options_text, c.options_json, m.menu_name, m.base_price 
            FROM cart c 
            JOIN menus m ON c.menu_id = m.menu_id 
            WHERE c.table_id = '$table_id'";
    $result = $conn->query($sql);
    $cart = [];

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $ingredients = new stdClass();
            if(!empty($row['options_json'])) {
                $parsed = json_decode($row['options_json'], true);
                if (!empty($parsed)) $ingredients = $parsed;
            }
            $details = [];
            if(!empty(trim($row['options_text']))) {
                $details = array_map('trim', explode(',', $row['options_text']));
            }

            $cart[] = [
                "cartId" => $row['cart_id'],
                "menuId" => $row['menu_id'],
                "name" => $row['menu_name'],
                "basePrice" => (float)$row['base_price'],
                "totalPrice" => (float)$row['total_price'],
                "details" => $details,
                "ingredients" => $ingredients,
                "qty" => (int)$row['quantity']
            ];
        }
    }
    echo json_encode($cart);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'sync') {
        $table_id = isset($data['table_id']) ? $conn->real_escape_string($data['table_id']) : '';
        $cartItems = isset($data['cart']) ? $data['cart'] : [];

        if (!empty($table_id)) {
            // Ensure the table_id exists in `tables` (FK requirement)
            ensureTableExists($conn, $table_id);

            // Delete existing cart for this table
            $conn->query("DELETE FROM cart WHERE table_id = '$table_id'");

            $errors = [];
            if (!empty($cartItems)) {
                $stmt = $conn->prepare("INSERT INTO cart (table_id, menu_id, quantity, total_price, options_text, options_json) VALUES (?, ?, ?, ?, ?, ?)");
                if (!$stmt) {
                    echo json_encode(["success" => false, "error" => "Prepare failed: " . $conn->error]);
                    $conn->close();
                    exit;
                }
                foreach($cartItems as $item) {
                    $menuId = $item['menuId'];
                    $qty = (int)$item['qty'];
                    $totalPrice = (float)$item['totalPrice'];
                    
                    $optionsText = isset($item['details']) && is_array($item['details']) ? implode(',', $item['details']) : '';
                    $optionsJson = isset($item['ingredients']) ? json_encode($item['ingredients'], JSON_UNESCAPED_UNICODE) : '{}';

                    $stmt->bind_param("ssidss", $table_id, $menuId, $qty, $totalPrice, $optionsText, $optionsJson);
                    if (!$stmt->execute()) {
                        $errors[] = "Insert failed for menu $menuId: " . $stmt->error;
                    }
                }
                $stmt->close();
            }

            if (empty($errors)) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "errors" => $errors]);
            }
        } else {
            echo json_encode(["success" => false, "error" => "Empty table_id"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Invalid action"]);
    }
}

$conn->close();
?>
