<?php
$db = mysqli_connect("localhost", "root", "", "sklep");
$res = mysqli_query($db, "SELECT nazwa, cena, ilosc, opis FROM produkty");
echo "<table>\n<tr><th>Nazwa</th><th>Wartość</th><th>Opis</th></tr>\n";
$lp = 1;
while ($r = mysqli_fetch_array($res)) {
  $wartosc = $r['cena'] * $r['ilosc'];
  echo "<tr><td>$lp. {$r['nazwa']}</td><td>$wartosc</td><td>" . ($r['opis'] ? $r['opis'] : 'brak opisu') . "</td></tr>\n";
  $lp++;
}
echo "</table>";
$all = mysqli_fetch_all(mysqli_query($db, "SELECT nazwa FROM produkty LIMIT 2"));
print_r($all);
$all2 = mysqli_fetch_all(mysqli_query($db, "SELECT nazwa FROM produkty LIMIT 2"), MYSQLI_ASSOC);
print_r($all2);
$o = mysqli_fetch_object(mysqli_query($db, "SELECT nazwa, cena FROM produkty WHERE id=1"));
echo $o->nazwa, " ", $o->cena, "\n";
mysqli_close($db);
