<?php
require_once 'db.php';
$sql = "SELECT * FROM cart";
$result = $conn->query($sql);
$data = [];
if ($result) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}
echo json_encode($data, JSON_PRETTY_PRINT);
$conn->close();
?>
