<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // In Node: res.json(db.ingredients || []);
    // The previous frontend expected a flat array of ingredient usages or similar.
    // We'll simulate fetching ingredients list or usages depending on what JS expects.
    
    // JS reads from localStorage 'habeef_ingredients'
    echo json_encode([]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    // Just acknowledge for now
    echo json_encode(["success" => true]);
}

$conn->close();
?>
