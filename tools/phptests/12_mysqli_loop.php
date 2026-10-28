<?php
$polaczenie = mysqli_connect('localhost', 'root', '', 'sklep');
$zapytanie = "SELECT nazwa, cena FROM produkty WHERE cena < 100;";
$wynik = mysqli_query($polaczenie, $zapytanie);
echo "<ol>\n";
while ($wiersz = mysqli_fetch_array($wynik)) {
    echo "<li>" . $wiersz['nazwa'] . " - " . $wiersz[1] . " zł</li>\n";
}
echo "</ol>\n";
echo "Liczba: " . mysqli_num_rows($wynik) . "\n";
$w2 = mysqli_query($polaczenie, "SELECT * FROM produkty WHERE id = 2");
$r = mysqli_fetch_assoc($w2);
var_dump($r);
$w3 = mysqli_query($polaczenie, "SELECT id, nazwa FROM kategorie");
while ($k = mysqli_fetch_row($w3)) { echo "<option value=\"$k[0]\">$k[1]</option>\n"; }
mysqli_close($polaczenie);
