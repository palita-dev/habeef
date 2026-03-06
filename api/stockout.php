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
    
    // Check if it's a full array sync
    if (is_array($data) && !isset($data['action'])) {
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
        echo json_encode(["success" => false, "error" => "Unsupported action"]);
    }
}

$conn->close();
?>
