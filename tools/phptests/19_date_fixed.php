<?php
$ts = mktime(14, 5, 9, 7, 4, 2025);
echo date("Y-m-d H:i:s", $ts), "\n", date("d.m.Y", $ts), " ", date("D, l, N, j n y", $ts), " ", date("F M t L", $ts), "\n";
echo date("Y-m-d", strtotime("2025-12-31")), " ", date("d.m.Y", strtotime("2025-01-31 +1 day")), "\n";
$dni = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
echo $dni[date("w", $ts)], "\n";
var_dump(checkdate(2, 29, 2024), checkdate(2, 29, 2025));
echo date("Y", $ts) - 2000, "\n";
