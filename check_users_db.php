<?php
require_once 'api/db.php';

echo "Table Schema:\n";
$res = $conn->query("DESCRIBE users");
while($r = $res->fetch_assoc()) {
    echo $r['Field'] . " - " . $r['Type'] . "\n";
}

echo "\nUsers Data:\n";
$res = $conn->query("SELECT username, password, LENGTH(password) as pw_len FROM users");
while($r = $res->fetch_assoc()) {
    echo $r['username'] . " | " . $r['pw_len'] . " chars | " . $r['password'] . "\n";
}
?>
