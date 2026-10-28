<?php
$db = mysqli_connect('localhost', 'root', '', 'sklep');
echo "ok\n";
$w = mysqli_query($db, "SELECT nazwa FROM produktyy");
echo "nie dojdzie";
