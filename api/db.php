<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$db_user = 'appvizac_habeefnoodle';
$db_pass = 'kh89mNtD';
$db_name = 'appvizac_habeefnoodle';

// Create connection
$conn = new mysqli($host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Set charset to utf8mb4
if (!$conn->set_charset("utf8mb4")) {
    die(json_encode(["error" => "Error loading character set utf8mb4: " . $conn->error]));
}
?>
