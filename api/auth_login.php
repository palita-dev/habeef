<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $username = isset($data['username']) ? $conn->real_escape_string($data['username']) : '';
    $password = isset($data['password']) ? $conn->real_escape_string($data['password']) : '';
    $hashedPassword = hash('sha256', $password);

    if (empty($username) || empty($password)) {
        echo json_encode(["success" => false, "error" => "Username and password required"]);
        exit;
    }

    $sql = "SELECT username, full_name as name, role, email, password FROM users WHERE username = '$username'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Verify with hashed password or plain text (auto-upgrade happens in JS, but let's allow plain text for transition)
        if ($user['password'] === $hashedPassword || $user['password'] === $password) {
            // Unset password before sending back
            unset($user['password']);
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            echo json_encode(["success" => false, "error" => "Invalid credentials"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "User not found"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}

$conn->close();
?>
