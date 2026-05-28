<?php
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

// Whitelist of settings that can be queried publicly
$allowed_keys = ['secret_salt'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $key = isset($_GET['key']) ? $_GET['key'] : '';

    if ($action === 'public_settings') {
        // Return all whitelisted settings as a key-value map
        $keys_placeholder = implode("','", $allowed_keys);
        $result = $conn->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('$keys_placeholder')");
        $settings = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
        echo json_encode($settings);
        exit;
    }

    if ($key !== '') {
        if (!in_array($key, $allowed_keys)) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied for setting key']);
            exit;
        }

        $stmt = $conn->prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?");
        if ($stmt) {
            $stmt->bind_param("s", $key);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result && $row = $result->fetch_assoc()) {
                echo json_encode([$key => $row['setting_value']]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Setting not found']);
            }
            $stmt->close();
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to prepare query']);
        }
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Invalid parameters']);
    exit;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
?>
