<?php
ob_start();
error_reporting(0);

require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action']) || $data['action'] !== 'check_username') {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

$username = isset($data['username']) ? trim($data['username']) : '';

if (!$username) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Username required']);
    exit;
}

$usernameEscaped = $conn->real_escape_string($username);
$sql = "SELECT user_id, username, role FROM users WHERE username = '$usernameEscaped' LIMIT 1";
$result = $conn->query($sql);

ob_clean();
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'username' => $row['username'],
        'role' => $row['role']
    ]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'ไม่พบชื่อบัญชีนี้ในระบบ']);
}
?>
