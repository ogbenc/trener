<?php
$db = mysqli_connect('localhost', 'root', '', 'sklep');
mysqli_close($db);
$w = mysqli_query($db, "SELECT 1");
