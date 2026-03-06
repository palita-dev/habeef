<?php
ob_start();
error_reporting(0);

require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action'])) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
    exit;
}

if ($data['action'] === 'reset_password') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    $token = isset($data['token']) ? trim($data['token']) : '';
    $newPassword = isset($data['new_password']) ? trim($data['new_password']) : '';

    if (!$username || !$token || !$newPassword) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Username, Token and new password required']);
        exit;
    }

    // Ensure token columns exist (Safe for all MySQL versions)
    $resToken = $conn->query("SHOW COLUMNS FROM `users` LIKE 'reset_token'");
    if (!$resToken || $resToken->num_rows == 0) {
        $conn->query("ALTER TABLE `users` ADD `reset_token` VARCHAR(255) NULL DEFAULT NULL");
    }
    $resExp = $conn->query("SHOW COLUMNS FROM `users` LIKE 'reset_expires'");
    if (!$resExp || $resExp->num_rows == 0) {
        $conn->query("ALTER TABLE `users` ADD `reset_expires` DATETIME NULL DEFAULT NULL");
    }

    $usernameEsc = $conn->real_escape_string($username);
    $tokenEsc = $conn->real_escape_string($token);
    
    $sql = "SELECT username, reset_expires FROM users WHERE username = '$usernameEsc' AND reset_token = '$tokenEsc' AND reset_token IS NOT NULL LIMIT 1";
    $result = $conn->query($sql);

    ob_clean();
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $expires = strtotime($row['reset_expires']);
        
        if (time() > $expires) {
            http_response_code(400);
            echo json_encode(['error' => 'รหัสยืนยันนี้หมดอายุแล้ว']);
        } else {
            $pwdEsc = $conn->real_escape_string($newPassword);
            $userEsc = $conn->real_escape_string($row['username']);
            $updateSql = "UPDATE users SET password = '$pwdEsc', reset_token = NULL, reset_expires = NULL WHERE username = '$userEsc'";
            $conn->query($updateSql);

            echo json_encode(['success' => true, 'message' => 'Password reset successful']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'รหัสยืนยันไม่ถูกต้อง']);
    }
}
?>
