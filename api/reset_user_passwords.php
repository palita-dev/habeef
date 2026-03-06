<?php
require_once 'db.php';

// Reset passwords for the affected users back to plain string or single hash
$users_to_reset = ['palita', 'nana', '09'];
$default_password = '1234';
$hashed_password = hash('sha256', $default_password);

$count = 0;
foreach ($users_to_reset as $user) {
    // Only update if the user exists
    $sql = "UPDATE users SET password = '$hashed_password' WHERE username = '" . $conn->real_escape_string($user) . "'";
    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            $count++;
        }
    }
}

echo json_encode([
    'success' => true, 
    'message' => "Passwords for $count users have been reset to '1234'."
]);
$conn->close();
?>
