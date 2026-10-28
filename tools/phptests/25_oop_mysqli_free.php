<?php
$w = ['a' => 1, 'b' => 2];
foreach ($w as $k => $v) { echo $k, $v; }
echo "\n";
echo count($w, COUNT_RECURSIVE), "\n";
$liczba = 13;
$czyPierwsza = true;
for ($d = 2; $d * $d <= $liczba; $d++) { if ($liczba % $d == 0) { $czyPierwsza = false; break; } }
echo $czyPierwsza ? "pierwsza" : "złożona", "\n";
$suma = 0; $n = 0;
foreach ([4, 5, 6] as $x) { $suma += $x; $n++; }
echo "Średnia: " . $suma / $n . "\n";
echo "Średnia2: " . round(10 / 3, 2) . "\n";
echo 10 / 3 . "\n";
echo 2 / 3 * 3 . "\n";
echo 0.1 + 0.7, " ", (0.1 + 0.7) * 10, " ", (int)((0.1 + 0.7) * 10), "\n";
echo 1.23456789012345678, " ", 123456789.12345678, " ", 1/7, "\n";
