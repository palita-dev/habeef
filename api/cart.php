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
            ensureTableExists($conn, $table_id);
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
            echo json_encode(empty($errors) ? ["success" => true] : ["success" => false, "errors" => $errors]);
        } else {
            echo json_encode(["success" => false, "error" => "Empty table_id"]);
        }

    } elseif ($action === 'add_item') {
        // Add a single item to the cart (does NOT delete other items)
        $table_id = isset($data['table_id']) ? $conn->real_escape_string($data['table_id']) : '';
        $item = isset($data['item']) ? $data['item'] : null;

        if (!empty($table_id) && $item) {
            ensureTableExists($conn, $table_id);
            $menuId = $item['menuId'];
            $qty = (int)$item['qty'];
            $totalPrice = (float)$item['totalPrice'];
            $optionsText = isset($item['details']) && is_array($item['details']) ? implode(',', $item['details']) : '';
            $optionsJson = isset($item['ingredients']) ? json_encode($item['ingredients'], JSON_UNESCAPED_UNICODE) : '{}';

            // Check if same menu+options already exists → increment qty
            $checkStmt = $conn->prepare("SELECT cart_id, quantity FROM cart WHERE table_id = ? AND menu_id = ? AND options_text = ?");
            $checkStmt->bind_param("sss", $table_id, $menuId, $optionsText);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult && $checkResult->num_rows > 0) {
                $row = $checkResult->fetch_assoc();
                $newQty = (int)$row['quantity'] + $qty;
                $updateStmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE cart_id = ?");
                $updateStmt->bind_param("ii", $newQty, $row['cart_id']);
                $updateStmt->execute();
                $updateStmt->close();
            } else {
                $stmt = $conn->prepare("INSERT INTO cart (table_id, menu_id, quantity, total_price, options_text, options_json) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssidss", $table_id, $menuId, $qty, $totalPrice, $optionsText, $optionsJson);
                $stmt->execute();
                $stmt->close();
            }
            $checkStmt->close();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Missing table_id or item"]);
        }

    } elseif ($action === 'remove_item') {
        // Remove a specific cart entry by cart_id
        $cart_id = isset($data['cart_id']) ? (int)$data['cart_id'] : 0;
        if ($cart_id > 0) {
            $stmt = $conn->prepare("DELETE FROM cart WHERE cart_id = ?");
            $stmt->bind_param("i", $cart_id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Missing cart_id"]);
        }

    } elseif ($action === 'update_qty') {
        // Update quantity of a specific cart entry
        $cart_id = isset($data['cart_id']) ? (int)$data['cart_id'] : 0;
        $qty = isset($data['qty']) ? (int)$data['qty'] : 0;
        if ($cart_id > 0 && $qty > 0) {
            $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE cart_id = ?");
            $stmt->bind_param("ii", $qty, $cart_id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
        } elseif ($cart_id > 0 && $qty <= 0) {
            // qty 0 or less means remove
            $stmt = $conn->prepare("DELETE FROM cart WHERE cart_id = ?");
            $stmt->bind_param("i", $cart_id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Missing cart_id or qty"]);
        }

    } elseif ($action === 'update_item') {
        // Update an existing cart item's details (for edit flow)
        $cart_id = isset($data['cart_id']) ? (int)$data['cart_id'] : 0;
        $item = isset($data['item']) ? $data['item'] : null;
        if ($cart_id > 0 && $item) {
            $totalPrice = (float)$item['totalPrice'];
            $optionsText = isset($item['details']) && is_array($item['details']) ? implode(',', $item['details']) : '';
            $optionsJson = isset($item['ingredients']) ? json_encode($item['ingredients'], JSON_UNESCAPED_UNICODE) : '{}';
            $stmt = $conn->prepare("UPDATE cart SET total_price = ?, options_text = ?, options_json = ? WHERE cart_id = ?");
            $stmt->bind_param("dssi", $totalPrice, $optionsText, $optionsJson, $cart_id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Missing cart_id or item"]);
        }

    } else {
        echo json_encode(["success" => false, "error" => "Invalid action"]);
    }
}

$conn->close();
?>
