<?php
require_once 'api/db.php';
$username = 'palita';
$sql = "SELECT username, password, role FROM users WHERE username = '$username'";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    echo json_encode($result->fetch_assoc());
} else {
    echo json_encode(["error" => "User not found"]);
}
?>
