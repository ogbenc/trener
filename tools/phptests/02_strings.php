<?php
$imie = "Jan"; $tab = ['nazwa' => 'Kostka', 'cena' => 39.5, 3 => 'x'];
echo "Witaj $imie!\n";
echo "Produkt: $tab[nazwa] za {$tab['cena']} zł\n";
echo 'Pojedynczy $imie\n', "\n";
echo "Klamry: {$imie}owi\n";
echo "Indeks: $tab[3]\n";
echo strlen("zażółć"), " ", mb_strlen("zażółć"), " ", strtoupper("abc żół"), " ", mb_strtoupper("abc żół"), "\n";
echo ucfirst("kot"), " ", ucwords("ala ma kota"), " ", strtolower("ABC"), " ", lcfirst("Kot"), "\n";
echo substr("Informatyka", 0, 4), "|", substr("Informatyka", -3), "|", substr("abc", 1), "|", mb_substr("żółw", 1, 2), "\n";
echo str_replace("a", "o", "banana"), " ", str_repeat("=", 5), " ", strrev("abc"), " ", trim("  x  "), "|", "\n";
echo str_pad("7", 3, "0", STR_PAD_LEFT), " ", str_pad("ab", 6, "-", STR_PAD_BOTH), " ", str_pad("x", 4), "|\n";
var_dump(strpos("Ala ma kota", "ma"), strpos("abc", "x"), str_contains("abc", "b"));
echo implode(", ", ["a", "b", "c"]), " | ", implode(["x", "y"]), "\n";
print_r(explode(";", "a;b;;c"));
echo sprintf("%05.2f|%d|%s|%'*8s|%-6s|%x|%b|%u", 3.14159, "42abc" ?? 0, "tekst", "ab", "cd", 255, 5, 3), "\n";
printf("Cena: %.2f zł\n", 12.5);
echo number_format(1234567.891, 2), " ", number_format(1234567.891, 2, ',', ' '), " ", number_format(0.5), " ", number_format(1234.5), "\n";
echo nl2br("a\nb"), " ", htmlspecialchars("<b>\"x\" & 'y'</b>"), "\n";
echo ucfirst(strtolower("WARSZAWA")), " ", strcmp("a", "b"), " ", str_word_count("Ala ma kota"), " ", substr_count("banana", "an"), "\n";
$h = <<<TXT
Imię: $imie
Cena: {$tab['cena']}
TXT;
echo $h, "\n";
echo "Escape: \t tab \\ backslash \$dolar \"cudzy\" \x41 \101 \u{263A}\n";
