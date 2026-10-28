<?php
$id = isset($_GET['id']) ? $_GET['id'] : 1;
$db = mysqli_connect('localhost', 'root', '', 'sklep');
$r = mysqli_fetch_assoc(mysqli_query($db, "SELECT nazwa, cena FROM produkty WHERE id = $id"));
echo "<h2>{$r['nazwa']}</h2><h3>Cena: {$r['cena']} zł</h3>";
$res = mysqli_query($db, "SELECT id, nazwa FROM produkty");
while ($w = mysqli_fetch_array($res)) { echo '<a href="index.php?id=' . $w['id'] . '">' . $w['nazwa'] . '</a> '; }
mysqli_close($db);
