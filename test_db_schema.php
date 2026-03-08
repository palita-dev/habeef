<?php
require_once 'api/db.php';

header('Content-Type: text/plain');

$result = $conn->query("SHOW CREATE TABLE stock_in");
if ($row = $result->fetch_assoc()) {
    echo $row['Create Table'] . "\n\n";
} else {
    echo "stock_in table not found.\n\n";
}

$result2 = $conn->query("SHOW CREATE TABLE users");
if ($row2 = $result2->fetch_assoc()) {
    echo $row2['Create Table'] . "\n\n";
} else {
    echo "users table not found.\n\n";
}

$conn->close();
?>
