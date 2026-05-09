<?php
include 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'get_menus';

if ($action == 'get_menus') {
    $sql = "SELECT * FROM menus";
    $result = $conn->query($sql);
    
    $menus = [];
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $menus[] = [
                'id' => $row['menu_id'],
                'name' => $row['menu_name'],
                'desc' => $row['description'],
                'price' => (float)$row['base_price'],
                'emoji' => $row['emoji'],
                'hasNoodle' => (bool)$row['has_noodle'],
                'hasMeat' => (bool)$row['has_meat'],
                'isSeafood' => (bool)$row['is_seafood']
            ];
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($menus);
}
?>
