<?php
for ($i = 1; $i <= 10; $i++) { if ($i == 3) continue; if ($i > 6) break; echo $i; } echo "\n";
$i = 0; while ($i < 5) { echo $i; $i++; } echo "\n";
$i = 10; do { echo $i; } while ($i < 5); echo "\n";
for ($i = 0; $i < 3; $i++) for ($j = 0; $j < 3; $j++) { if ($j == 2) continue 2; if ($i == 2) break 2; echo "$i$j "; } echo "\n";
$ocena = 4;
switch ($ocena) { case 1: echo "ndst"; break; case 3: case 4: echo "db/dst"; case 5: echo "+bdb"; break; default: echo "inne"; } echo "\n";
$d = "2"; switch ($d) { case 2: echo "liczba"; break; case "2": echo "napis"; break; } echo "\n";
$n = 15; if ($n % 15 == 0) echo "FizzBuzz"; elseif ($n % 3 == 0) echo "Fizz"; else if ($n % 5 == 0) echo "Buzz"; else echo $n; echo "\n";
echo $n > 10 ? "duże" : "małe", " ", $brak ?? "domyślne", " ", null ?: "pusty", "\n";
$t = ['a' => 1]; echo $t['b'] ?? 'brak', "\n";
echo match(true) { $n < 10 => "mało", $n < 20 => "średnio", default => "dużo" }, "\n";
$k = 3;
if ($k > 1):
  echo "alt-if\n";
elseif ($k > 0):
  echo "x";
else:
  echo "y";
endif;
foreach ([1, 2] as $v): echo "v$v "; endforeach; echo "\n";
for ($i = 0; $i < 2; $i++): echo "f$i "; endfor; echo "\n";
while ($k-- > 0): echo "w$k "; endwhile; echo "\n";
$a = [1, 2, 3]; foreach ($a as $k => $v) { $a[$k] = $v * 10; } echo implode(",", $a), "\n";
foreach ($a as &$v) { $v++; } unset($v); echo implode(",", $a), "\n";
