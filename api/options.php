<?php
include 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'get_options';

if ($action == 'get_options') {
    $sql = "SELECT * FROM menu_options ORDER BY id ASC";
    $result = $conn->query($sql);
    
    $options = [
        'noodle' => [],
        'meat' => [],
        'veggie' => [],
        'extra' => []
    ];
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $group = $row['option_group'];
            $item = [
                'id' => $row['option_key'],
                'name' => $row['name'],
                'ingredient' => $row['ingredient_name'],
                'price' => (float)$row['price_add'],
                'isDefault' => (bool)$row['is_default'],
                'isNone' => (bool)$row['is_none']
            ];
            $options[$group][] = $item;
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($options);
}
?>
