<?php
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'db.php';

$res = $conn->query("SHOW CREATE TABLE orders");
if ($res) {
    $row = $res->fetch_assoc();
    echo "CREATE TABLE:\n" . $row['Create Table'] . "\n\n";
} else {
    echo "Failed to get CREATE TABLE\n";
}

$res2 = $conn->query("DESCRIBE orders");
if ($res2) {
    echo "COLUMNS:\n";
    while ($row2 = $res2->fetch_assoc()) {
        print_r($row2);
    }
}
?>
