<?php
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_ADDR'] = '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require 'orders.php';
$out = ob_get_clean();
echo substr($out, 0, 1000);
?>
