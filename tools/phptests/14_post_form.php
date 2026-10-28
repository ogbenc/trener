<?php
if (isset($_POST['ilosc']) && !empty($_POST['nazwa'])) {
  $p = mysqli_connect('localhost', 'root', '', 'sklep');
  $nazwa = $_POST['nazwa'];
  $ilosc = $_POST['ilosc'];
  $w = mysqli_query($p, "SELECT cena FROM produkty WHERE nazwa = '$nazwa'");
  $r = mysqli_fetch_array($w);
  $koszt = $r['cena'] * $ilosc;
  echo "<p>Za $ilosc szt. produktu $nazwa zapłacisz $koszt zł</p>";
  echo "<p>" . round($koszt, 1) . " / " . number_format($koszt, 2, ',', ' ') . "</p>";
  mysqli_close($p);
} else {
  echo "<p>Wypełnij formularz</p>";
}
echo "<p>Metoda: " . $_SERVER['REQUEST_METHOD'] . "</p>";
