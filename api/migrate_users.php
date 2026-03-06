<?php
require_once 'db.php';

$json_file = '../database.json';
if (!file_exists($json_file)) {
    die(json_encode(['error' => 'database.json not found']));
}

$data = json_decode(file_get_contents($json_file), true);
if (!isset($data['users'])) {
    die(json_encode(['error' => 'No users in database.json']));
}

$count = 0;
foreach ($data['users'] as $user) {
    $username = $conn->real_escape_string($user['username']);
    $password = $conn->real_escape_string($user['password']);
    $role = $conn->real_escape_string($user['role']);
    $name = $conn->real_escape_string($user['name'] ?? $username);
    
    $sql = "INSERT IGNORE INTO users (username, password, full_name, role) VALUES ('$username', '$password', '$name', '$role')";
    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            $count++;
        }
    }
}

echo json_encode(['success' => true, 'migrated' => $count]);
?>
