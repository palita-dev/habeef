<?php
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'db.php';
$res = $conn->query("SELECT order_id, status FROM orders");
while($r = $res->fetch_assoc()) echo $r['order_id'].' - '.$r['status']."\n";
?>
