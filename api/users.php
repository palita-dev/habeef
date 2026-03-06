<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Ensure email column exists (auto-fix for production)
    $conn->query("ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `email` VARCHAR(255) NULL DEFAULT NULL");
    
    $sql = "SELECT username, password, role, full_name as name, email FROM users";
    $result = $conn->query($sql);
    $users = array();

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }
    
    // For local fallback if table is empty
    if (empty($users)) {
        $users[] = array("username" => "admin", "password" => "1234", "role" => "admin", "name" => "Admin ผู้ดูแลระบบ");
    }
    
    echo json_encode($users);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // The frontend sends the entire users array whenever changes are made (Node.js legacy behavior).
    // We should safely merge (UPSERT) these into MySQL.
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (is_array($data)) {
        // Prepare an UPSERT statement (Insert, on duplicate key update)
        // Requires 'username' to be UNIQUE KEY in MySQL, which it is.
        $stmt = $conn->prepare("
            INSERT INTO users (username, password, role, full_name, email) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                password = VALUES(password),
                role = VALUES(role),
                full_name = VALUES(full_name),
                email = VALUES(email)
        ");

        if ($stmt) {
            // Keep track of incoming usernames so we can delete ones that were removed from the frontend list
            $incomingUsernames = [];

            foreach($data as $u) {
                if (empty($u['username'])) continue;
                $incomingUsernames[] = "'" . $conn->real_escape_string($u['username']) . "'";
                
                $name = isset($u['name']) ? $u['name'] : $u['username'];
                $email = isset($u['email']) ? $u['email'] : null;
                $stmt->bind_param("sssss", $u['username'], $u['password'], $u['role'], $name, $email);
                $stmt->execute();
            }
            $stmt->close();

            // Delete users that are no longer in the payload (unless table is empty)
            // But NEVER delete the default 'admin' just in case.
            if (!empty($incomingUsernames)) {
                $usernamesList = implode(',', $incomingUsernames);
                $conn->query("DELETE FROM users WHERE username NOT IN ($usernamesList) AND username != 'admin'");
            }
        }
    }
    
    echo json_encode(["success" => true]);
}

$conn->close();
?>
