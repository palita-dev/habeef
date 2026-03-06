<?php
/**
 * API: send_reset_email.php
 * Handles username checking, sending OTP via Resend/mail(), and notifying admin.
 * Secured with output buffering to ensure clean JSON responses.
 */
ob_start();
error_reporting(0); // ป้องกัน Error หลุดไปพัง JSON

// Compatibility for PHP < 7.0
if (!function_exists('random_int')) {
    function random_int($min, $max) {
        return mt_rand($min, $max);
    }
}

require_once 'db.php';

header('Content-Type: application/json');

// Read input
$inputJson = file_get_contents('php://input');
$data = json_decode($inputJson, true);
$action = isset($data['action']) ? $data['action'] : '';

if (!$action) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['error' => 'No action specified']);
    exit;
}

// ==========================================
// ACTION: check_username
// ==========================================
if ($action === 'check_username') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    if (!$username) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'กรุณากรอกชื่อบัญชี']);
        exit;
    }

    $usernameEscaped = $conn->real_escape_string($username);
    $result = $conn->query("SELECT username, role FROM users WHERE username = '$usernameEscaped' LIMIT 1");

    if (!$result || $result->num_rows === 0) {
        ob_clean();
        http_response_code(404);
        echo json_encode(['error' => 'ไม่พบชื่อบัญชีนี้ในระบบ']);
        exit;
    }

    $row = $result->fetch_assoc();
    ob_clean();
    echo json_encode(['success' => true, 'role' => $row['role'], 'username' => $row['username']]);
    exit;
}

// ==========================================
// ACTION: send_reset_by_email (Admin path)
// ==========================================
if ($action === 'send_reset_by_email') {
    $email = isset($data['email']) ? trim($data['email']) : '';
    $username = isset($data['username']) ? trim($data['username']) : '';

    if (!$email) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'กรุณากรอก Email']);
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

    // Verify email matches DB
    $usernameEscaped = $conn->real_escape_string($username);
    $emailEscaped = $conn->real_escape_string($email);
    
    $checkSql = "SELECT username, email FROM users WHERE role = 'admin' ";
    if ($username) {
        $checkSql .= "AND username = '$usernameEscaped' ";
    }
    $checkSql .= "AND email = '$emailEscaped' LIMIT 1";
    
    $result = $conn->query($checkSql);

    if (!$result || $result->num_rows === 0) {
        ob_clean();
        http_response_code(404);
        echo json_encode(['error' => 'Email ไม่ตรงกับที่ลงทะเบียนไว้ในระบบ หรือไม่ใช่บัญชีแอดมิน']);
        exit;
    }
    $row = $result->fetch_assoc();
    $targetUsername = $row['username'];

    // Generate 6-digit OTP
    $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires = date('Y-m-d H:i:s', time() + 3600);
    $targetUsernameEsc = $conn->real_escape_string($targetUsername);
    $conn->query("UPDATE users SET reset_token = '$otp', reset_expires = '$expires' WHERE username = '$targetUsernameEsc'");

    $subject = "รหัสยืนยันเพื่อรีเซ็ตรหัสผ่านแอดมิน - ก๋วยเตี๋ยวฮาบีฟ";
    $htmlBody = "
        <div style='font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;'>
            <div style='background-color: #fff; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                <h2 style='color: #333;'>รีเซ็ตรหัสผ่านบัญชี: {$targetUsername}</h2>
                <p style='color: #555; font-size: 16px; line-height: 1.5;'>สวัสดีแอดมิน,</p>
                <p style='color: #555; font-size: 16px; line-height: 1.5;'>กรุณานำรหัสรักษาความปลอดภัยด้านล่างนี้ไปกรอกในหน้าเว็บเพื่อตั้งรหัสผ่านใหม่ รหัสนี้จะหมดอายุใน 1 ชั่วโมง</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <span style='background-color: #f0f0f0; color: #333; padding: 15px 30px; letter-spacing: 5px; border-radius: 8px; font-weight: bold; font-size: 28px; border: 2px dashed #ccc;'>{$otp}</span>
                </div>
                <p style='color: #777; font-size: 14px;'>หากคุณไม่ได้เป็นผู้ร้องขอ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
                <p style='color: #777; font-size: 14px;'>ขอบคุณครับ/ค่ะ<br>จากระบบร้านก๋วยเตี๋ยวฮาบีฟ</p>
            </div>
        </div>
    ";

    $resendApiKey = 're_AXo6Xymc_BsonXPxrr67xAXxWHdcwTcvF';
    $postData = json_encode([
        'from' => 'Habeef Noodle System <onboarding@resend.dev>', 
        'to' => [$email],  
        'subject' => $subject,
        'html' => $htmlBody
    ]);

    // Try Resend via CURL
    $mailSent = false;
    $curlError = '';
    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $resendApiKey, 'Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            $mailSent = true;
        } else {
            $respObj = json_decode($response, true);
            $curlError = isset($respObj['message']) ? $respObj['message'] : 'Resend API Error (HTTP ' . $httpCode . ')';
            if ($httpCode == 403) $curlError = 'Resend blocked this email (Unauthorized or unverified).';
        }
    }

    // Fallback to PHP mail()
    if (!$mailSent) {
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Habeef Noodle System <noreply@" . (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost') . ">" . "\r\n";
        
        if (@mail($email, $subject, $htmlBody, $headers)) {
            $mailSent = true;
        }
    }

    ob_clean();
    if ($mailSent) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $curlError ? $curlError : 'ไม่สามารถส่งอีเมลได้ ระบบเมลบนเซิร์ฟเวอร์อาจขัดข้อง']);
    }
    exit;
}

// ==========================================
// ACTION: notify_admin (Staff/Owner path)
// ==========================================
if ($action === 'notify_admin') {
    $username = isset($data['username']) ? trim($data['username']) : '';
    if (!$username) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'กรุณากรอกชื่อบัญชี']);
        exit;
    }

    $usernameEsc = $conn->real_escape_string($username);
    $result = $conn->query("SELECT username FROM users WHERE username = '$usernameEsc' LIMIT 1");
    if (!$result || $result->num_rows === 0) {
        ob_clean();
        http_response_code(404);
        echo json_encode(['error' => 'ไม่พบชื่อบัญชีนี้ในระบบ']);
        exit;
    }

    // Check if notifications table exists, create if not
    $conn->query("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(100) DEFAULT NULL,
        `message` TEXT,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $msg = $conn->real_escape_string("ขอเปลี่ยนรหัสผ่าน");
    $conn->query("INSERT INTO notifications (username, message, created_at) VALUES ('$usernameEsc', '$msg', NOW())");

    ob_clean();
    echo json_encode(['success' => true]);
    exit;
}

// Default response
ob_clean();
http_response_code(400);
echo json_encode(['error' => 'Action path not found']);
?>
