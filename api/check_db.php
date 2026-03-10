<?php
$conn = new mysqli('127.0.0.1', 'root', '');
if ($conn->connect_error) { die("Connection failed: " . $conn->connect_error); }
$result = $conn->query("SHOW DATABASES");
while ($row = $result->fetch_assoc()) {
    echo $row['Database'] . "\n";
}
?>
