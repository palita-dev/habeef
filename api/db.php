<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$http_host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
$server_addr = isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : '';

// Clean port from HTTP_HOST if present (e.g. "localhost:8080" -> "localhost")
$host_only = explode(':', $http_host)[0];

$is_local = false;

// Check if hostname or server address is localhost, 127.0.0.1, ::1
if ($host_only === 'localhost' || $host_only === '127.0.0.1' || $host_only === '::1' ||
    $server_addr === '127.0.0.1' || $server_addr === '::1') {
    $is_local = true;
}
// Check private IP ranges (e.g. 192.168.x.x, 10.x.x.x, 172.16.x.x to 172.31.x.x)
elseif (preg_match('/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/', $host_only) ||
        preg_match('/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/', $server_addr)) {
    $is_local = true;
}

// Load environment variables from .env if it exists
$env = [];
$env_path = dirname(__DIR__) . '/.env';
if (file_exists($env_path)) {
    $lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $env[trim($parts[0])] = trim($parts[1]);
        }
    }
}

if ($is_local) {
    $host = '127.0.0.1';
    $db_user = 'root';
    $db_pass = '';
    $db_name = 'appvizac_habeefnoodle';
} else {
    $host = isset($env['DB_HOST']) ? $env['DB_HOST'] : 'localhost';
    $db_user = isset($env['DB_USER']) ? $env['DB_USER'] : 'appvizac_habeefnoodle';
    $db_pass = isset($env['DB_PASSWORD']) ? $env['DB_PASSWORD'] : 'kh89mNtD';
    $db_name = isset($env['DB_NAME']) ? $env['DB_NAME'] : 'appvizac_habeefnoodle';
}

// Create connection
$conn = @new mysqli($host, $db_user, $db_pass, $db_name);

// Fallback check: If we resolved to production but connection fails, try local root connection as a last resort
if ($conn->connect_error && !$is_local) {
    $host = '127.0.0.1';
    $db_user = 'root';
    $db_pass = '';
    $db_name = 'appvizac_habeefnoodle';
    $conn = @new mysqli($host, $db_user, $db_pass, $db_name);
}

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Set charset to utf8mb4
if (!$conn->set_charset("utf8mb4")) {
    die(json_encode(["error" => "Error loading character set utf8mb4: " . $conn->error]));
}
?>
