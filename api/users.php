<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT username, password, role, full_name as name FROM users";
    $result = $conn->query($sql);
    $users = array();

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }
    
    // For local fallback if table is empty
    if (empty($users)) {
        $users[] = array("username" => "admin", "password" => "123", "role" => "admin", "name" => "Admin ผู้ดูแลระบบ");
    }
    
    echo json_encode($users);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Note: The existing node API rewrites the whole user array. 
    // For PHP/MySQL, we might need a sync logic or just handle individual create/update elsewhere.
    // To match node behavior as closely as possible for `saveUsers(users)`, we might truncate & insert, 
    // but that's dangerous. Let's assume standard behavior: just return success or implement sync.
    
    // For now, mirroring the "fake" success of Node if it was just dumping JSON.
    // In a real DB, you'd insert/update records.
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (is_array($data)) {
        // Very basic sync: Clear and insert (DANGEROUS IN PROD, but matches local DB JSON behavior)
        $conn->query("TRUNCATE TABLE users");
        $stmt = $conn->prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)");
        foreach($data as $u) {
            $name = isset($u['name']) ? $u['name'] : $u['username'];
            $stmt->bind_param("ssss", $u['username'], $u['password'], $u['role'], $name);
            $stmt->execute();
        }
        $stmt->close();
    }
    
    echo json_encode(["success" => true]);
}

$conn->close();
?>
