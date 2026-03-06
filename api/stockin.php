<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT s.stock_in_id, s.ingredient_name, s.quantity, s.unit, s.stock_in_date, u.username 
            FROM stock_in s
            LEFT JOIN users u ON s.user_id = u.user_id
            ORDER BY s.stock_in_date ASC";
    $result = $conn->query($sql);
    $stockIn = [];

    // The frontend expects a grouped object by dateKey: {"2024-02-23": {"กุ้ง": {"qty": 10, "unit": "กิโลกรัม", "entries": [...]}}}
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $dateFull = $row['stock_in_date'];
            // Shift hours if needed to match frontend logic or just use date
            $dateKey = date('Y-m-d', strtotime("-4 hours", strtotime($dateFull)));
            
            $ing = $row['ingredient_name'];
            if (!isset($stockIn[$dateKey])) {
                $stockIn[$dateKey] = [];
            }
            if (!isset($stockIn[$dateKey][$ing])) {
                $stockIn[$dateKey][$ing] = [
                    "qty" => 0,
                    "unit" => $row['unit'],
                    "entries" => []
                ];
            }
            $stockIn[$dateKey][$ing]['qty'] += (float)$row['quantity'];
            $stockIn[$dateKey][$ing]['entries'][] = [
                "qty" => (float)$row['quantity'],
                "unit" => $row['unit'],
                "time" => str_replace(' ', 'T', $dateFull),
                "id" => $row['stock_in_id'],
                "username" => $row['username']
            ];
        }
    }
    echo json_encode($stockIn);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (isset($data['action'])) {
        if ($data['action'] === 'add') {
            $ingName = $conn->real_escape_string($data['ingredient_name']);
            $qty = (float)$data['quantity'];
            $unit = $conn->real_escape_string($data['unit']);
            $time = date('Y-m-d H:i:s', strtotime($data['time']));
            $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
            
            $stmt = $conn->prepare("INSERT INTO stock_in (ingredient_name, quantity, unit, stock_in_date, user_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sdssi", $ingName, $qty, $unit, $time, $userId);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $conn->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $conn->error]);
            }
            $stmt->close();
            exit;
        } elseif ($data['action'] === 'edit') {
            $id = (int)$data['stock_in_id'];
            $ingName = $conn->real_escape_string($data['ingredient_name']);
            $qty = (float)$data['quantity'];
            $unit = $conn->real_escape_string($data['unit']);
            // We usually don't change the time on edit in this UI, but we could.
            
            $stmt = $conn->prepare("UPDATE stock_in SET ingredient_name = ?, quantity = ?, unit = ? WHERE stock_in_id = ?");
            $stmt->bind_param("sdsi", $ingName, $qty, $unit, $id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $conn->error]);
            }
            $stmt->close();
            exit;
        } elseif ($data['action'] === 'delete') {
            $id = (int)$data['stock_in_id'];
            $stmt = $conn->prepare("DELETE FROM stock_in WHERE stock_in_id = ?");
            $stmt->bind_param("i", $id);
            echo json_encode(["success" => $stmt->execute()]);
            $stmt->close();
            exit;
        }
    }

    // Fallback/Legacy Sync (Matches existing behavior but warned)
    if (is_array($data)) {
        $conn->query("TRUNCATE TABLE stock_in");
        
        $stmt = $conn->prepare("INSERT INTO stock_in (ingredient_name, quantity, unit, stock_in_date) VALUES (?, ?, ?, ?)");
        if ($stmt) {
            foreach($data as $dateKey => $dayData) {
                if (!is_array($dayData)) continue; 
                foreach($dayData as $ingName => $itemData) {
                    if (isset($itemData['entries']) && is_array($itemData['entries'])) {
                        foreach($itemData['entries'] as $entry) {
                            $qty = (float)$entry['qty'];
                            $unit = isset($entry['unit']) ? $entry['unit'] : (isset($itemData['unit']) ? $itemData['unit'] : '');
                            $time = date('Y-m-d H:i:s', strtotime($entry['time']));
                            
                            $stmt->bind_param("sdss", $ingName, $qty, $unit, $time);
                            $stmt->execute();
                        }
                    }
                }
            }
            $stmt->close();
        }
    }
    
    echo json_encode(["success" => true]);
}

$conn->close();
?>
