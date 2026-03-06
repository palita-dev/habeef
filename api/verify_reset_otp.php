<?php
ob_start();
error_reporting(0);

require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action']) || $data['action'] !== 'verify_otp') {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

$username = isset($data['username']) ? trim($data['username']) : '';
$otp = isset($data['otp']) ? trim($data['otp']) : '';

if (!$username || !$otp) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
    exit;
}

// Find user and verify token
$usernameEscaped = $conn->real_escape_string($username);
$otpEscaped = $conn->real_escape_string($otp);

$sql = "SELECT reset_expires FROM users WHERE username = '$usernameEscaped' AND reset_token = '$otpEscaped' AND reset_token IS NOT NULL LIMIT 1";
$result = $conn->query($sql);

ob_clean();
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $expires = strtotime($row['reset_expires']);
    
    if (time() > $expires) {
        http_response_code(400);
        echo json_encode(['error' => 'รหัสยืนยันนี้หมดอายุแล้ว']);
    } else {
        // Validation success
        echo json_encode(['success' => true]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'รหัสยืนยันไม่ถูกต้อง']);
}
?>
