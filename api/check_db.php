<?php
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'db.php';
$res = $conn->query("SELECT * FROM orders ORDER BY created_at DESC");
$orders = [];
while ($row = $res->fetch_assoc()) {
    $orders[] = $row;
}
echo json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
