<?php
$lines = file('c:/xampp/htdocs/system/webapp/js/staff.js');
foreach($lines as $i => $l) if(strpos($l, 'setInterval') !== false) echo "staff.js:".($i+1).":$l";
$lines2 = file('c:/xampp/htdocs/system/webapp/js/auth.js');
foreach($lines2 as $i => $l) if(strpos($l, 'setInterval') !== false) echo "auth.js:".($i+1).":$l";
?>
