<?php
function powitanie($imie, $tytul = "Pan") { return "Witaj, $tytul $imie!"; }
echo powitanie("Kowalski"), " ", powitanie("Nowak", "Pani"), "\n";
echo silnia(5), "\n";
function silnia($n) { return $n <= 1 ? 1 : $n * silnia($n - 1); }
$licznik = 0;
function zwieksz() { global $licznik; $licznik++; }
zwieksz(); zwieksz(); echo $licznik, "\n";
function stat_test() { static $n = 0; $n++; return $n; }
stat_test(); stat_test(); echo stat_test(), "\n";
function suma(...$liczby) { return array_sum($liczby); }
echo suma(1, 2, 3, 4), "\n";
$mnoz = function ($x) use ($licznik) { return $x * $licznik; };
echo $mnoz(10), "\n";
$f = fn($x) => $x + $licznik; echo $f(1), "\n";
function binarnie($n) { $b = ""; do { $b = ($n % 2) . $b; $n = intdiv($n, 2); } while ($n > 0); return $b; }
echo binarnie(537), " ", decbin(537), " ", bindec("1010"), " ", dechex(255), "\n";
function tablica() { return ['x' => 1, 'y' => 2]; }
echo tablica()['y'], "\n";
function zmien($t) { $t[] = 4; return count($t); } $t = [1, 2, 3]; echo zmien($t), count($t), "\n";
echo strtoupper(substr(powitanie("x"), 0, 5)), "\n";
