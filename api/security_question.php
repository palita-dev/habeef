<?php
require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$action = isset($data['action']) ? $data['action'] : '';

// Function to ensure security columns exist
function ensureSecurityColumns($conn) {
    $conn->query("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `security_question` VARCHAR(255) NULL DEFAULT NULL");
    $conn->query("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `security_answer` VARCHAR(255) NULL DEFAULT NULL");
    
    // Set a default question for admin if it doesn't exist
    $result = $conn->query("SELECT security_question FROM users WHERE username = 'admin' LIMIT 1");
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if (empty($row['security_question'])) {
            $conn->query("UPDATE users SET security_question = 'เบอร์โทรศัพท์ร้านคือเบอร์อะไร?', security_answer = '000000' WHERE username = 'admin'");
        }
    }
}

// 1. Get Security Question
if ($action === 'get_question') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    if (!$username) {
        http_response_code(400);
        echo json_encode(['error' => 'กรุณากรอกชื่อบัญชี']);
        exit;
    }

    ensureSecurityColumns($conn);

    $usernameEscaped = $conn->real_escape_string($username);
    $result = $conn->query("SELECT security_question FROM users WHERE username = '$usernameEscaped' LIMIT 1");

    if (!$result || $result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'ไม่พบชื่อบัญชีนี้ในระบบ']);
        exit;
    }

    $row = $result->fetch_assoc();
    $question = $row['security_question'];

    if (empty($question)) {
        http_response_code(400);
        echo json_encode(['error' => 'บัญชีนี้ยังไม่ได้ตั้งคำถามรักษาความปลอดภัย กรุณาติดต่อผู้ดูแลระบบ']);
        exit;
    }

    echo json_encode(['success' => true, 'question' => $question]);
    exit;
}

// 2. Verify Answer and Generate Reset Token
if ($action === 'verify_answer') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    $answer = isset($data['answer']) ? trim($data['answer']) : '';

    if (!$username || !$answer) {
        http_response_code(400);
        echo json_encode(['error' => 'กรุณากรอกคำตอบให้ครบถ้วน']);
        exit;
    }

    $usernameEscaped = $conn->real_escape_string($username);
    $answerEscaped = $conn->real_escape_string($answer);

    $sql = "SELECT username FROM users WHERE username = '$usernameEscaped' AND security_answer = '$answerEscaped' LIMIT 1";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        // Answer is correct, generate a temporary token for the password reset form
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiration
        
        $conn->query("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255) NULL DEFAULT NULL");
        $conn->query("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `reset_expires` DATETIME NULL DEFAULT NULL");
        
        $conn->query("UPDATE users SET reset_token = '$token', reset_expires = '$expires' WHERE username = '$usernameEscaped'");

        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'คำตอบไม่ถูกต้อง']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action']);
?>
