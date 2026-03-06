<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM notifications ORDER BY created_at DESC";
    $result = $conn->query($sql);
    $notifications = [];

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $notifications[] = [
                "id" => $row['notification_id'],
                "username" => $row['username'],
                "message" => $row['message'],
                "read" => (bool)$row['is_read'],
                "createdAt" => str_replace(' ', 'T', $row['created_at'])
            ];
        }
    }
    echo json_encode($notifications);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'add') {
        $username = isset($data['username']) ? $conn->real_escape_string($data['username']) : '';
        $message = isset($data['message']) ? $conn->real_escape_string($data['message']) : 'ขอเปลี่ยนรหัสผ่าน';
        
        if (!empty($username)) {
            $sql = "INSERT INTO notifications (username, message) VALUES ('$username', '$message')";
            $conn->query($sql);
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Username is required"]);
        }
    } elseif ($action === 'delete') {
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        if ($id > 0) {
            $sql = "DELETE FROM notifications WHERE notification_id = $id";
            $conn->query($sql);
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Invalid ID"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Invalid action"]);
    }
}

$conn->close();
?>
