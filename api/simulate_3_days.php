<?php
// Mock $_SERVER variables for CLI execution
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';

require_once dirname(__FILE__) . '/db.php';

// Turn off foreign key checks for truncation
$conn->query("SET FOREIGN_KEY_CHECKS = 0");
$conn->query("TRUNCATE TABLE orders");
$conn->query("TRUNCATE TABLE order_details");
$conn->query("TRUNCATE TABLE order_ingredient_usages");
$conn->query("TRUNCATE TABLE stock_in");
$conn->query("TRUNCATE TABLE stock_out");
$conn->query("TRUNCATE TABLE cart");
$conn->query("SET FOREIGN_KEY_CHECKS = 1");

$ingredients = [
    'เส้นเล็ก' => 'ถุง', 'เส้นใหญ่' => 'ถุง', 'เส้นหมี่ขาว' => 'ถุง', 'เส้นหมี่หยก' => 'ถุง', 'เส้นหมี่เหลือง' => 'ถุง',
    'ผักบุ้ง' => 'กิโลกรัม', 'ถั่วงอก' => 'กิโลกรัม', 'ลูกชิ้น' => 'ถุง', 'เนื้อวัว' => 'กิโลกรัม', 'น่องไก่' => 'กิโลกรัม',
    'ไข่' => 'แผง', 'กุ้ง' => 'กิโลกรัม', 'หมึก' => 'กิโลกรัม'
];

$daily_stock_in = [
    'เส้นเล็ก' => 5, 'เส้นใหญ่' => 5, 'เส้นหมี่ขาว' => 5, 'เส้นหมี่หยก' => 5, 'เส้นหมี่เหลือง' => 5,
    'ผักบุ้ง' => 5, 'ถั่วงอก' => 5, 'ลูกชิ้น' => 2, 'เนื้อวัว' => 5, 'น่องไก่' => 5,
    'ไข่' => 2, 'กุ้ง' => 3, 'หมึก' => 3
];

$menus = [
    ['id' => 'nam-khon', 'name' => 'ก๋วยเตี๋ยวน้ำข้น', 'price' => 50, 'ingredients' => ['เส้นเล็ก' => 0.055, 'ผักบุ้ง' => 0.02, 'เนื้อวัว' => 0.08, 'ลูกชิ้น' => 0.022]],
    ['id' => 'haeng', 'name' => 'ก๋วยเตี๋ยวแห้ง', 'price' => 50, 'ingredients' => ['เส้นใหญ่' => 0.025, 'ถั่วงอก' => 0.02, 'น่องไก่' => 0.1, 'ลูกชิ้น' => 0.022]],
    ['id' => 'tom-yam', 'name' => 'ก๋วยเตี๋ยวต้มยำ', 'price' => 60, 'ingredients' => ['เส้นหมี่ขาว' => 0.025, 'ถั่วงอก' => 0.02, 'น่องไก่' => 0.1, 'ลูกชิ้น' => 0.022, 'ไข่' => 0.033]],
    ['id' => 'tom-yam-seafood', 'name' => 'ก๋วยเตี๋ยวต้มยำ ทะเล', 'price' => 95, 'ingredients' => ['เส้นหมี่หยก' => 0.25, 'ผักบุ้ง' => 0.02, 'กุ้ง' => 0.04, 'หมึก' => 0.03, 'ลูกชิ้น' => 0.022]],
    ['id' => 'kao-lao', 'name' => 'เกาเหลา', 'price' => 50, 'ingredients' => ['ผักบุ้ง' => 0.02, 'ถั่วงอก' => 0.02, 'เนื้อวัว' => 0.08, 'ลูกชิ้น' => 0.022]]
];

$base_time = strtotime('-2 days');

// Loop 3 days
for ($day = 0; $day < 3; $day++) {
    $current_date_ts = $base_time + ($day * 86400); // Add 1 day
    
    // 1. Owner adds stock in morning
    $stock_time = date('Y-m-d 08:00:00', $current_date_ts);
    foreach ($daily_stock_in as $ing_name => $qty) {
        $unit = $ingredients[$ing_name];
        $stmt = $conn->prepare("INSERT INTO stock_in (ingredient_name, quantity, unit, stock_in_date, user_id) VALUES (?, ?, ?, ?, NULL)");
        $stmt->bind_param("sdss", $ing_name, $qty, $unit, $stock_time);
        $stmt->execute();
        $stmt->close();
    }
    
    // 2. Customers order
    // 10 tables, 2 orders each
    for ($table = 1; $table <= 10; $table++) {
        for ($order_num = 1; $order_num <= 2; $order_num++) {
            
            // Random time between 11:00 and 21:00
            $order_h = rand(11, 21);
            $order_m = rand(0, 59);
            $order_time = date('Y-m-d H:i:00', $current_date_ts);
            $order_time = date('Y-m-d H:i:s', strtotime(date('Y-m-d', $current_date_ts) . " $order_h:$order_m:00"));
            $completed_time = date('Y-m-d H:i:s', strtotime($order_time) + 600); // 10 mins later
            
            $order_id = uniqid('ORD-' . $day . $table . $order_num . '-');
            
            // Select 2 random menus for this order to ensure all menus are ordered often
            $selected_menus = [];
            // To ensure all menus are ordered, we purposely rotate menus
            $menu1 = $menus[($table + $order_num) % count($menus)];
            $menu2 = $menus[($table + 2) % count($menus)];
            $selected_menus = [$menu1, $menu2];
            
            $total_price = $menu1['price'] + $menu2['price'];
            
            // Insert Order
            $stmt = $conn->prepare("INSERT INTO orders (order_id, guest_id, table_id, total_price, status, created_at, completed_at) VALUES (?, '', ?, ?, 'served', ?, ?)");
            $table_str = strval($table);
            $stmt->bind_param("ssdss", $order_id, $table_str, $total_price, $order_time, $completed_time);
            $stmt->execute();
            $stmt->close();
            
            // Insert Details
            foreach ($selected_menus as $menu) {
                $item_qty = 1;
                $options_json = json_encode($menu['ingredients'], JSON_UNESCAPED_UNICODE);
                $options_text = "เส้นปกติ";
                
                $stmt = $conn->prepare("INSERT INTO order_details (order_id, menu_id, quantity, unit_price, total_price, options_json, options_text) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssiddss", $order_id, $menu['id'], $item_qty, $menu['price'], $menu['price'], $options_json, $options_text);
                $stmt->execute();
                $stmt->close();
                
                // Track usage
                foreach ($menu['ingredients'] as $ing_name => $ing_qty) {
                    $stmt = $conn->prepare("INSERT INTO order_ingredient_usages (order_id, ingredient_name, quantity_used) VALUES (?, ?, ?)");
                    $stmt->bind_param("ssd", $order_id, $ing_name, $ing_qty);
                    $stmt->execute();
                    $stmt->close();
                }
            }
        }
    }
}

echo "Successfully injected 3 days of simulation data (stock and orders).";
?>
