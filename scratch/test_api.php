<?php
header('Content-Type: text/plain; charset=utf-8');

$endpoints = [
    'menus' => 'https://habeefnoodle.appviza.com/api/menus.php',
    'options' => 'https://habeefnoodle.appviza.com/api/options.php',
    'ingredients' => 'https://habeefnoodle.appviza.com/api/ingredients.php',
    'formula' => 'https://habeefnoodle.appviza.com/api/ingredients.php?action=get_formula',
    'disabled_list' => 'https://habeefnoodle.appviza.com/api/ingredients.php?action=disabled_list',
    'orders' => 'https://habeefnoodle.appviza.com/api/orders.php',
    'users' => 'https://habeefnoodle.appviza.com/api/users.php'
];

foreach ($endpoints as $name => $url) {
    echo "=== FETCHING $name ($url) ===\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $err = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($err) {
        echo "Curl Error: $err\n";
    } else {
        echo "HTTP Code: $httpCode\n";
        echo "Response Preview (First 500 chars):\n";
        echo substr($response, 0, 500) . "\n";
        echo "\nIs Valid JSON? " . (is_json($response) ? "YES" : "NO") . "\n";
    }
    echo "========================================\n\n";
}

function is_json($string) {
   json_decode($string);
   return json_last_error() === JSON_ERROR_NONE;
}
