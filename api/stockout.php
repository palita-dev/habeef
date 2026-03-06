<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT stock_out_id, ingredient_name as item, quantity as qty, unit, stock_out_date, user_id FROM stock_out ORDER BY stock_out_date ASC";
    $result = $conn->query($sql);
    $stockOut = [];

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $stockOut[] = [
                "id" => $row['stock_out_id'],
                "item" => $row['item'],
                "qty" => (float)$row['qty'],
                "unit" => $row['unit'],
                "date" => str_replace(' ', 'T', $row['stock_out_date']),
                "userId" => $row['user_id']
            ];
        }
    }
    echo json_encode($stockOut);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Check if it's a specific action (incremental update)
    if (isset($data['action'])) {
        if ($data['action'] === 'add') {
            $item = $conn->real_escape_string($data['item']);
            $qty = (float)$data['qty'];
            $unit = $conn->real_escape_string($data['unit']);
            $time = date('Y-m-d H:i:s', strtotime($data['date']));
            $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
            
            $stmt = $conn->prepare("INSERT INTO stock_out (ingredient_name, quantity, unit, stock_out_date, user_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sdssi", $item, $qty, $unit, $time, $userId);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $conn->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $conn->error]);
            }
            $stmt->close();
            exit;
        } elseif ($data['action'] === 'delete') {
            $id = (int)$data['id'];
            $stmt = $conn->prepare("DELETE FROM stock_out WHERE stock_out_id = ?");
            $stmt->bind_param("i", $id);
            echo json_encode(["success" => $stmt->execute()]);
            $stmt->close();
            exit;
        }
    }

    // legacy/sync fallback
    if (is_array($data)) {
        $conn->query("TRUNCATE TABLE stock_out");
        
        $stmt = $conn->prepare("INSERT INTO stock_out (ingredient_name, quantity, unit, stock_out_date) VALUES (?, ?, ?, ?)");
        if ($stmt) {
            foreach($data as $entry) {
                $item = $entry['item'];
                $qty = (float)$entry['qty'];
                $unit = isset($entry['unit']) ? $entry['unit'] : '';
                $time = date('Y-m-d H:i:s', strtotime($entry['date']));
                
                $stmt->bind_param("sdss", $item, $qty, $unit, $time);
                $stmt->execute();
            }
            $stmt->close();
        }
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Invalid data"]);
    }
}

$conn->close();
?>
