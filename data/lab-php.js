/* Zadania PHP + MySQL (mysqli) – wykonywane przez MiniPHP na bazie w przeglądarce */
(function (root) {
  const TR = root.TR = root.TR || {};
  const C = TR.C; const P = C.php;
  const R = String.raw;
  TR.LABG = (TR.LABG || []).concat([
    { id: 'pc', area: 'php', name: 'Połączenie i wyświetlanie wyników', f: 3, note: 'Szkielet z ~2/3 arkuszy: mysqli_connect → mysqli_query → while (mysqli_fetch_array) → echo → mysqli_close.' },
    { id: 'pf', area: 'php', name: 'Formularze: POST, GET, INSERT, DELETE', f: 2, note: 'Skrypt działa tylko, gdy formularz wysłał dane (isset / empty).' },
    { id: 'pp', area: 'php', name: 'Podstrony, sesje, daty, pliki', f: 1, note: 'Odnośniki z ?id=, wartość domyślna, logowanie z sesją (2026), date(), zapis do pliku.' }
  ]);
  const L = [];
  function rows(T, sel) { return T.$$(sel); }
  function texts(T, sel) { return T.$$(sel).map(function (e) { return T.norm(e.textContent); }); }

  /* ======================= POŁĄCZENIE I WYNIKI ======================= */
  const p01 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Biblioteka</title>
</head>
<body>
  <h2>Epika w naszej bibliotece</h2>
  <ol>
    <!-- tu skrypt PHP -->
  </ol>
</body>
</html>
`;
  L.push({ id: 'p01', g: 'pc', f: 3, db: 'biblioteka', t: 'Lista z bazy', sub: 'connect, query, while, echo <li>, close',
    q: 'Strona **index.php**, baza **biblioteka**. W liście numerowanej umieść skrypt PHP, który:\n- łączy się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie biblioteka,\n- wysyła do bazy zapytanie wybierające jedynie tytuły książek z gatunku epika (tabela ksiazki),\n- każdy zwrócony tytuł wyświetla jako element listy,\n- na końcu zamyka połączenie z bazą.',
    entry: 'index.php', files: { 'index.php': p01 },
    checks: [P.connect('biblioteka'), P.query(/SELECT[\s\S]+tytul[\s\S]+FROM[\s\S]+ksiazki[\s\S]+epika/i, 'Wysłane zapytanie wybiera tytuły z gatunku epika'), P.noErrors(),
      { d: 'Lista ma 6 elementów – wszystkie książki epickie', f: function (T) { const n = T.$$('ol li').length; return n === 6 || ('Elementów listy: ' + n); } },
      { d: 'Elementy to tytuły, np. „Pan Tadeusz”', f: function (T) { return texts(T, 'ol li').indexOf('pan tadeusz') >= 0 || ('Pierwszy element: „' + (texts(T, 'ol li')[0] || '') + '”'); } },
      P.close()],
    hint: 'Wzorzec z „Ściąga → PHP”:\n```php\n<?php\n$polaczenie = mysqli_connect("localhost", "root", "", "biblioteka");\n$wynik = mysqli_query($polaczenie, "SELECT tytul FROM ksiazki WHERE gatunek = \'epika\';");\nwhile ($wiersz = mysqli_fetch_array($wynik)) {\n    echo "<li>" . $wiersz["tytul"] . "</li>";\n}\nmysqli_close($polaczenie);\n?>\n```',
    sol: { 'index.php': p01.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "biblioteka");
    $zapytanie = "SELECT tytul FROM ksiazki WHERE gatunek = 'epika';";
    $wynik = mysqli_query($polaczenie, $zapytanie);
    while ($wiersz = mysqli_fetch_array($wynik)) {
        echo "<li>" . $wiersz["tytul"] . "</li>";
    }
    mysqli_close($polaczenie);
    ?>`) }
  });
  const p02 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Kadra</title>
</head>
<body>
  <h2>Programiści</h2>
  <table>
    <tr><th>Imię</th><th>Nazwisko</th><th>Pensja</th></tr>
    <!-- tu skrypt PHP -->
  </table>
</body>
</html>
`;
  L.push({ id: 'p02', g: 'pc', f: 3, db: 'firma', t: 'Wiersze tabeli', sub: '<tr><td> dla każdego rekordu',
    q: 'Strona **index.php**, baza **firma**. Skrypt w tabeli:\n- wysyła zapytanie wybierające jedynie imię, nazwisko i pensję pracowników na stanowisku o identyfikatorze 1, posortowane rosnąco według nazwiska,\n- każdy zwrócony rekord wyświetla jako kolejny wiersz tabeli – w odpowiednich komórkach imię, nazwisko i pensję,\n- na końcu zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p02 },
    checks: [P.connect('firma'), P.noErrors(),
      { d: 'Tabela: wiersz nagłówkowy + 3 wiersze danych', f: function (T) { const n = T.$$('table tr').length; return n === 4 || ('Wierszy w tabeli: ' + n); } },
      { d: 'Wiersze posortowane według nazwiska (Adamczyk, Bielecka, Jasińska)', f: function (T) { const t = T.$$('table tr').slice(1).map(function (r) { return T.norm((r.children[1] || {}).textContent || ''); }); return t.join(',') === 'adamczyk,bielecka,jasińska' || ('Druga kolumna: ' + t.join(', ')); } },
      { d: 'Komórki: imię | nazwisko | pensja (3 komórki w wierszu)', f: function (T) { const r = T.$$('table tr')[1]; if (!r) return 'Brak wierszy danych'; const td = r.querySelectorAll('td'); return (td.length === 3 && T.norm(td[0].textContent) === 'krzysztof') || ('Pierwszy wiersz: ' + T.norm(r.textContent)); } },
      P.close()],
    hint: '```php\necho "<tr><td>" . $w["imie"] . "</td><td>" . $w["nazwisko"] . "</td><td>" . $w["pensja"] . "</td></tr>";\n```',
    sol: { 'index.php': p02.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "firma");
    $wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko, pensja FROM pracownicy WHERE stanowisko_id = 1 ORDER BY nazwisko;");
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<tr><td>" . $w["imie"] . "</td><td>" . $w["nazwisko"] . "</td><td>" . $w["pensja"] . "</td></tr>";
    }
    mysqli_close($polaczenie);
    ?>`) }
  });
  const p03 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Promocje</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Gry w promocji</h1>
  <main>
    <!-- tu skrypt PHP -->
  </main>
</body>
</html>
`;
  L.push({ id: 'p03', g: 'pc', f: 3, db: 'sklep', t: 'Bloki z obrazem dla każdego rekordu', sub: 'div z klasą, img src z bazy – typowe 2025–2026',
    q: 'Strona **index.php**, baza **sklep**. Skrypt w bloku głównym:\n- wysyła zapytanie wybierające jedynie nazwę, cenę i plik produktów objętych promocją (pole promocja = 1),\n- **dla każdego** zwróconego rekordu tworzy blok z przypisaną klasą CSS **produkt**, który zawiera:\n  obraz, którego źródłem jest pole plik, a tekstem alternatywnym pole nazwa; nagłówek trzeciego stopnia z nazwą; akapit „Cena: <cena> zł”,\n- na końcu zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p03, 'styl.css': '.produkt { display: inline-block; width: 220px; margin: 10px; padding: 10px; border: 1px solid #ccc; vertical-align: top; }\n.produkt img { width: 100%; }\n' },
    checks: [P.connect('sklep'), P.noErrors(),
      { d: 'Cztery bloki z klasą produkt', f: function (T) { const n = T.$$('.produkt').length; return n === 4 || ('Bloków .produkt: ' + n); } },
      { d: 'W bloku obraz: src = plik, alt = nazwa', f: function (T) { const b = T.$$('.produkt'); const i = b[0] && b[0].querySelector('img'); if (!i) return 'Brak <img> w bloku'; return (/\.jpg$/.test(T.srcOf(i)) && i.getAttribute('alt') === 'Pociągi przez Europę') || ('Obraz: src="' + T.srcOf(i) + '" alt="' + i.getAttribute('alt') + '"'); } },
      { d: 'W bloku <h3> z nazwą', f: function (T) { const h = T.$$('.produkt h3').map(function (x) { return T.norm(x.textContent); }); return h.indexOf('wieża hanoi') >= 0 || ('Nagłówki: ' + h.join(', ')); } },
      { d: 'Akapit „Cena: 29.99 zł” (cena tak, jak zwraca ją baza)', f: function (T) { const p = texts(T, '.produkt p'); return p.indexOf('cena: 29.99 zł') >= 0 || ('Akapity: ' + p.slice(0, 2).join(' | ')); } },
      P.close()],
    hint: '```php\nwhile ($w = mysqli_fetch_array($wynik)) {\n    echo "<div class=\'produkt\'>";\n    echo "<img src=\'" . $w["plik"] . "\' alt=\'" . $w["nazwa"] . "\'>";\n    echo "<h3>" . $w["nazwa"] . "</h3>";\n    echo "<p>Cena: " . $w["cena"] . " zł</p>";\n    echo "</div>";\n}\n```\nW echo w cudzysłowie `"…"` atrybuty HTML zapisuj w apostrofach `\'…\'`.',
    sol: { 'index.php': p03.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "sklep");
    $wynik = mysqli_query($polaczenie, "SELECT nazwa, cena, plik FROM produkty WHERE promocja = 1;");
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<div class='produkt'>";
        echo "<img src='" . $w["plik"] . "' alt='" . $w["nazwa"] . "'>";
        echo "<h3>" . $w["nazwa"] . "</h3>";
        echo "<p>Cena: " . $w["cena"] . " zł</p>";
        echo "</div>";
    }
    mysqli_close($polaczenie);
    ?>`) }
  });
  const p04 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Biuro podróży</title>
</head>
<body>
  <form action="index.php" method="post">
    <label for="kraj">Kraj:</label>
    <select name="kraj" id="kraj">
      <!-- tu skrypt PHP -->
    </select>
    <button type="submit">Pokaż</button>
  </form>
</body>
</html>
`;
  L.push({ id: 'p04', g: 'pc', f: 2, db: 'podroze', t: 'Opcje listy rozwijanej z bazy', sub: '<option value="id">nazwa</option>',
    q: 'Strona **index.php**, baza **podroze**. Skrypt wewnątrz listy rozwijanej:\n- wysyła zapytanie wybierające jedynie id i nazwę wszystkich krajów (tabela kraje),\n- z każdego zwróconego rekordu generuje kolejną opcję listy w ten sposób, że **id jest przypisane do atrybutu value**, a nazwa jest treścią opcji,\n- zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p04 },
    checks: [P.connect('podroze'), P.noErrors(),
      { d: 'Lista ma 8 opcji', f: function (T) { const n = T.$$('#kraj option').length; return n === 8 || ('Opcji: ' + n); } },
      { d: 'Treść opcji = nazwa kraju', f: function (T) { const o = texts(T, '#kraj option'); return (o[0] === 'polska' && o.indexOf('japonia') >= 0) || ('Opcje: ' + o.slice(0, 3).join(', ')); } },
      { d: 'value opcji = id kraju', f: function (T) { const o = T.$$('#kraj option'); const j = o.find(function (x) { return T.norm(x.textContent) === 'islandia'; }); return (j && j.getAttribute('value') === '5') || ('Islandia: value="' + (j && j.getAttribute('value')) + '" – ma być 5'); } },
      P.close()],
    hint: '```php\necho "<option value=\'" . $w["id"] . "\'>" . $w["nazwa"] . "</option>";\n```',
    sol: { 'index.php': p04.replace('      <!-- tu skrypt PHP -->', R`      <?php
      $polaczenie = mysqli_connect("localhost", "root", "", "podroze");
      $wynik = mysqli_query($polaczenie, "SELECT id, nazwa FROM kraje;");
      while ($w = mysqli_fetch_array($wynik)) {
          echo "<option value='" . $w["id"] . "'>" . $w["nazwa"] . "</option>";
      }
      mysqli_close($polaczenie);
      ?>`) }
  });
  const p05 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Pogoda</title>
</head>
<body>
  <h2>Lipiec w Europie</h2>
  <table>
    <tr><th>Miasto</th><th>Kraj</th><th>Temperatura</th><th>Pogoda</th></tr>
    <!-- tu skrypt PHP -->
  </table>
</body>
</html>
`;
  L.push({ id: 'p05', g: 'pc', f: 2, db: 'pogoda', t: 'Warunek w pętli: obraz zależny od danych', sub: 'if / elseif w while – styczeń 2026',
    q: 'Strona **index.php**, baza **pogoda**. Skrypt w tabeli:\n- wysyła zapytanie wybierające jedynie nazwę miasta i kraj z tabeli miasta oraz odpowiadającą im temperaturę z tabeli pomiary dla miesiąca 7 (należy posłużyć się relacją),\n- w pierwszych trzech kolumnach tabeli zapisuje miasto, kraj i temperaturę,\n- czwarta kolumna zawiera obraz: **slonce.png**, gdy temperatura jest powyżej 30, **deszcz.png**, gdy jest poniżej 16, **chmury.png** w innych przypadkach; tekst alternatywny obrazu to „pogoda”.',
    entry: 'index.php', files: { 'index.php': p05 },
    checks: [P.connect('pogoda'), P.noErrors(),
      { d: 'Sześć wierszy z danymi (lipiec)', f: function (T) { const n = T.$$('table tr').length - 1; return n === 6 || ('Wierszy z danymi: ' + n); } },
      { d: 'Rzym 31° → slonce.png', f: function (T) { const r = T.$$('table tr').find(function (x) { return /Rzym/.test(x.textContent); }); const i = r && r.querySelector('img'); return (i && T.srcOf(i) === 'slonce.png') || ('Rzym: ' + (i ? T.srcOf(i) : 'brak obrazu')); } },
      { d: 'Londyn 14° → deszcz.png', f: function (T) { const r = T.$$('table tr').find(function (x) { return /Londyn/.test(x.textContent); }); const i = r && r.querySelector('img'); return (i && T.srcOf(i) === 'deszcz.png') || ('Londyn: ' + (i ? T.srcOf(i) : 'brak obrazu')); } },
      { d: 'Warszawa 24° → chmury.png', f: function (T) { const r = T.$$('table tr').find(function (x) { return /Warszawa/.test(x.textContent); }); const i = r && r.querySelector('img'); return (i && T.srcOf(i) === 'chmury.png') || ('Warszawa: ' + (i ? T.srcOf(i) : 'brak obrazu')); } },
      { d: 'Obrazy mają alt „pogoda”', f: function (T) { return T.$$('table img').length === 6 && T.$$('table img').every(function (i) { return i.getAttribute('alt') === 'pogoda'; }) || 'Każdy obraz: alt="pogoda"'; } }],
    hint: '```php\nif ($w["temperatura"] > 30) { $obraz = "slonce.png"; }\nelseif ($w["temperatura"] < 16) { $obraz = "deszcz.png"; }\nelse { $obraz = "chmury.png"; }\n```\nWartości z bazy przychodzą jako tekst, ale PHP porówna je z liczbą poprawnie.',
    sol: { 'index.php': p05.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "pogoda");
    $zapytanie = "SELECT nazwa, kraj, temperatura FROM miasta JOIN pomiary ON pomiary.miasto_id = miasta.id WHERE miesiac = 7;";
    $wynik = mysqli_query($polaczenie, $zapytanie);
    while ($w = mysqli_fetch_array($wynik)) {
        if ($w["temperatura"] > 30) {
            $obraz = "slonce.png";
        } elseif ($w["temperatura"] < 16) {
            $obraz = "deszcz.png";
        } else {
            $obraz = "chmury.png";
        }
        echo "<tr><td>" . $w["nazwa"] . "</td><td>" . $w["kraj"] . "</td><td>" . $w["temperatura"] . "</td>";
        echo "<td><img src='$obraz' alt='pogoda'></td></tr>";
    }
    mysqli_close($polaczenie);
    ?>`) }
  });
  const p06 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Pracownicy</title>
</head>
<body>
  <section id="lista">
    <!-- tu skrypt PHP -->
  </section>
</body>
</html>
`;
  L.push({ id: 'p06', g: 'pc', f: 2, db: 'firma', t: 'Numeracja i liczba rekordów', sub: 'licznik w pętli, mysqli_num_rows – styczeń 2025',
    q: 'Strona **index.php**, baza **firma**. Skrypt:\n- wysyła zapytanie wybierające jedynie nazwisko i miasto wszystkich pracowników, posortowane rosnąco według nazwiska,\n- każdy rekord wyświetla w osobnym akapicie w postaci „<nr>. <nazwisko> (<miasto>)”, gdzie nr to obliczony przez skrypt kolejny numer, począwszy od 1,\n- po liście wyświetla nagłówek czwartego stopnia „Liczba pracowników: <liczba>” – liczbę wierszy wyniku zapytania (funkcja mysqli),\n- zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p06 },
    checks: [P.connect('firma'), P.noErrors(),
      { d: 'Pierwszy akapit: „1. Adamczyk (Wrocław)”', f: function (T) { const p = texts(T, '#lista p'); return p[0] === '1. adamczyk (wrocław)' || ('Pierwszy akapit: „' + (p[0] || '') + '”'); } },
      { d: 'Numeracja kolejna – dwunasty: „12. Lis (Wrocław)”', f: function (T) { const p = texts(T, '#lista p'); return p[11] === '12. lis (wrocław)' || ('Akapitów: ' + p.length + ', ostatni: „' + (p[p.length - 1] || '') + '”'); } },
      C.text('#lista h4', 'Liczba pracowników: 12', '„Liczba pracowników: 12” w <h4>'),
      C.code(/mysqli_num_rows\s*\(|->num_rows/, 'Użyta funkcja mysqli_num_rows', 'Policz rekordy funkcją mysqli_num_rows($wynik)')],
    hint: '```php\n$nr = 1;\nwhile ($w = mysqli_fetch_array($wynik)) {\n    echo "<p>$nr. {$w[\'nazwisko\']} ({$w[\'miasto\']})</p>";\n    $nr++;\n}\necho "<h4>Liczba pracowników: " . mysqli_num_rows($wynik) . "</h4>";\n```',
    sol: { 'index.php': p06.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "firma");
    $wynik = mysqli_query($polaczenie, "SELECT nazwisko, miasto FROM pracownicy ORDER BY nazwisko;");
    $nr = 1;
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<p>$nr. {$w['nazwisko']} ({$w['miasto']})</p>";
        $nr++;
    }
    echo "<h4>Liczba pracowników: " . mysqli_num_rows($wynik) . "</h4>";
    mysqli_close($polaczenie);
    ?>`) }
  });

  /* ======================= FORMULARZE ======================= */
  const p07 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Klienci</title>
</head>
<body>
  <form action="index.php" method="post">
    <label>Miasto zaczyna się od: <input type="text" name="filtr"></label>
    <button type="submit">Szukaj</button>
  </form>
  <!-- tu skrypt PHP -->
</body>
</html>
`;
  L.push({ id: 'p07', g: 'pf', f: 3, db: 'podroze', t: 'Wyszukiwarka z formularza', sub: 'isset($_POST), LIKE z danymi z formularza – styczeń 2025',
    q: 'Strona **index.php**, baza **podroze**. Skrypt pod formularzem **sprawdza, czy z formularza zostały wysłane dane** i jeżeli tak:\n- wyświetla akapit „Szukane miasto: <filtr>”,\n- wysyła zapytanie wybierające jedynie imię, nazwisko i miasto klientów, których miasto **rozpoczyna się** od tekstu wysłanego formularzem,\n- tworzy tabelę z wierszem komórek nagłówkowych „Imię”, „Nazwisko”, „Miasto” i wyświetla zwrócone rekordy w kolejnych wierszach,\n- zamyka połączenie.\n\nW stanie początkowym (formularz nie był wysłany) tabela się nie wyświetla.',
    entry: 'index.php', files: { 'index.php': p07 },
    checks: [P.noErrors(),
      { d: 'Stan początkowy: brak tabeli', f: function (T) { return !T.$('table') || 'Tabela pokazuje się przed wysłaniem formularza – dodaj if (isset($_POST["filtr"]))'; } },
      { d: 'Po wysłaniu „Wro”: akapit „Szukane miasto: Wro”', f: async function (T) { T.type('input[name="filtr"]', 'Wro'); await T.submit('form'); return texts(T, 'p').indexOf('szukane miasto: wro') >= 0 || ('Akapity: ' + texts(T, 'p').join(' | ')); } },
      { d: 'Po wysłaniu „Wro”: 4 klientów z Wrocławia', f: async function (T) { T.type('input[name="filtr"]', 'Wro'); await T.submit('form'); const n = T.$$('table tr').length - 1; return n === 4 || ('Wierszy z danymi: ' + n); } },
      { d: 'Wiersz nagłówkowy: Imię | Nazwisko | Miasto', f: async function (T) { T.type('input[name="filtr"]', 'K'); await T.submit('form'); const th = texts(T, 'table th'); return th.join('|') === 'imię|nazwisko|miasto' || ('Nagłówki: ' + th.join(', ')); } },
      { d: 'Filtr „Ko” nie łapie Krakowa – „zaczyna się”, a nie „zawiera”', f: async function (T) { T.type('input[name="filtr"]', 'Kr'); await T.submit('form'); const n = T.$$('table tr').length - 1; return n === 2 || ('Dla „Kr” wierszy: ' + n + ' (powinno być 2)'); } }],
    hint: '```php\nif (isset($_POST["filtr"])) {\n    $filtr = $_POST["filtr"];\n    echo "<p>Szukane miasto: $filtr</p>";\n    $wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko, miasto FROM klienci WHERE miasto LIKE \'$filtr%\';");\n    …\n}\n```',
    sol: { 'index.php': p07.replace('  <!-- tu skrypt PHP -->', R`  <?php
  if (isset($_POST["filtr"])) {
      $filtr = $_POST["filtr"];
      echo "<p>Szukane miasto: $filtr</p>";
      $polaczenie = mysqli_connect("localhost", "root", "", "podroze");
      $wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko, miasto FROM klienci WHERE miasto LIKE '$filtr%';");
      echo "<table>";
      echo "<tr><th>Imię</th><th>Nazwisko</th><th>Miasto</th></tr>";
      while ($w = mysqli_fetch_array($wynik)) {
          echo "<tr><td>{$w['imie']}</td><td>{$w['nazwisko']}</td><td>{$w['miasto']}</td></tr>";
      }
      echo "</table>";
      mysqli_close($polaczenie);
  }
  ?>`) }
  });
  const p08 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Nowy czytelnik</title>
</head>
<body>
  <form action="index.php" method="post">
    <input type="text" name="imie" placeholder="imię">
    <input type="text" name="nazwisko" placeholder="nazwisko">
    <input type="text" name="klasa" placeholder="klasa">
    <button type="submit">Dodaj dane</button>
  </form>
  <!-- tu skrypt PHP -->
</body>
</html>
`;
  L.push({ id: 'p08', g: 'pf', f: 2, db: 'biblioteka', t: 'INSERT z formularza', sub: 'empty(), INSERT, komunikat – czerwiec 2025',
    q: 'Strona **index.php**, baza **biblioteka**. Skrypt pod formularzem, wykonywany po kliknięciu „Dodaj dane”:\n- jeżeli imię, nazwisko i klasa zostały wprowadzone: wstawia do tabeli **czytelnicy** nowy rekord z tymi danymi (klucz główny nadawany automatycznie, pole kod pomijamy) i wyświetla akapit „Czytelnik <imię> <nazwisko> został dodany”,\n- w przeciwnym wypadku wyświetla akapit „Wprowadź wszystkie dane”.\n\nPrzed wysłaniem formularza żaden komunikat się nie wyświetla.',
    entry: 'index.php', files: { 'index.php': p08 },
    checks: [P.noErrors(),
      { d: 'Przed wysłaniem: brak komunikatu', f: function (T) { return !T.$('p') || ('Na starcie widać: „' + T.text('p') + '” – skrypt ma działać dopiero po wysłaniu formularza'); } },
      { d: 'Wysłane dane trafiają do tabeli czytelnicy', f: async function (T) { T.type('input[name="imie"]', 'Tomasz'); T.type('input[name="nazwisko"]', 'Wilk'); T.type('input[name="klasa"]', '3TI'); await T.submit('form'); const r = T.query("SELECT imie, nazwisko, klasa FROM czytelnicy WHERE nazwisko = 'Wilk'"); return (r.length === 1 && r[0][0] === 'Tomasz' && r[0][2] === '3TI') || ('Rekordów z nazwiskiem Wilk: ' + r.length); } },
      { d: 'Komunikat „Czytelnik Tomasz Wilk został dodany”', f: async function (T) { T.type('input[name="imie"]', 'Tomasz'); T.type('input[name="nazwisko"]', 'Wilk'); T.type('input[name="klasa"]', '3TI'); await T.submit('form'); return texts(T, 'p').indexOf('czytelnik tomasz wilk został dodany') >= 0 || ('Akapity: ' + texts(T, 'p').join(' | ')); } },
      { d: 'Brak nazwiska → „Wprowadź wszystkie dane” i nic nie dodano', f: async function (T) { const before = T.query('SELECT COUNT(*) FROM czytelnicy')[0][0]; T.type('input[name="imie"]', 'Ala'); T.type('input[name="nazwisko"]', ''); T.type('input[name="klasa"]', '1TI'); await T.submit('form'); const after = T.query('SELECT COUNT(*) FROM czytelnicy')[0][0]; if (after !== before) return 'Dodano rekord mimo pustego nazwiska'; return texts(T, 'p').indexOf('wprowadź wszystkie dane') >= 0 || ('Akapity: ' + texts(T, 'p').join(' | ')); } }],
    hint: '```php\nif (isset($_POST["imie"])) {\n    if (!empty($_POST["imie"]) && !empty($_POST["nazwisko"]) && !empty($_POST["klasa"])) {\n        … INSERT INTO czytelnicy (imie, nazwisko, klasa) VALUES (\'$imie\', \'$nazwisko\', \'$klasa\');\n    } else { echo "<p>Wprowadź wszystkie dane</p>"; }\n}\n```',
    sol: { 'index.php': p08.replace('  <!-- tu skrypt PHP -->', R`  <?php
  if (isset($_POST["imie"])) {
      if (!empty($_POST["imie"]) && !empty($_POST["nazwisko"]) && !empty($_POST["klasa"])) {
          $imie = $_POST["imie"];
          $nazwisko = $_POST["nazwisko"];
          $klasa = $_POST["klasa"];
          $polaczenie = mysqli_connect("localhost", "root", "", "biblioteka");
          mysqli_query($polaczenie, "INSERT INTO czytelnicy (imie, nazwisko, klasa) VALUES ('$imie', '$nazwisko', '$klasa');");
          mysqli_close($polaczenie);
          echo "<p>Czytelnik $imie $nazwisko został dodany</p>";
      } else {
          echo "<p>Wprowadź wszystkie dane</p>";
      }
  }
  ?>`) }
  });
  const p09 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Kalkulator wycieczki</title>
</head>
<body>
  <?php
  $polaczenie = mysqli_connect("localhost", "root", "", "podroze");
  ?>
  <form action="index.php" method="post">
    <select name="cel">
      <!-- skrypt 1: opcje z bazy -->
    </select>
    <input type="number" name="osoby" min="1">
    <button type="submit">Oblicz</button>
  </form>
  <!-- skrypt 2: wynik -->
  <?php
  mysqli_close($polaczenie);
  ?>
</body>
</html>
`;
  L.push({ id: 'p09', g: 'pf', f: 2, db: 'podroze', t: 'Koszt z ceny w bazie', sub: 'lista z bazy + obliczenie po wysłaniu – 2025/2026',
    q: 'Strona **index.php**, baza **podroze** (połączenie i zamknięcie są już w kodzie). Uzupełnij dwa skrypty:\n- **skrypt 1** – w liście rozwijanej: każdy cel z tabeli wycieczki (posortowane alfabetycznie) jest treścią opcji,\n- **skrypt 2** – wykonywany tylko, gdy wysłano formularz: pobiera cenę wycieczki o wybranym celu, oblicza koszt dla podanej liczby osób i wyświetla akapit „Wycieczka <cel>: <osoby> × <cena> zł = <koszt> zł”.',
    entry: 'index.php', files: { 'index.php': p09 },
    checks: [P.noErrors(),
      { d: 'Lista rozwijana: 14 celów alfabetycznie', f: function (T) { const o = texts(T, 'select[name="cel"] option'); return (o.length === 14 && o[0] === 'ateny' && o[13] === 'zakopane') || ('Opcje: ' + o.length + ', pierwsza: ' + o[0] + ', ostatnia: ' + o[o.length - 1]); } },
      { d: 'Barcelona × 2 → „Wycieczka Barcelona: 2 × 3200.00 zł = 6400 zł”', f: async function (T) { T.choose('select[name="cel"]', 'Barcelona'); T.type('input[name="osoby"]', '2'); await T.submit('form'); return texts(T, 'p').indexOf('wycieczka barcelona: 2 × 3200.00 zł = 6400 zł') >= 0 || ('Akapit: „' + (texts(T, 'p')[0] || '') + '”'); } },
      { d: 'Przed wysłaniem brak wyniku', f: function (T) { return !T.$('p') || 'Wynik pokazuje się przed wysłaniem formularza'; } }],
    hint: 'Skrypt 2:\n```php\nif (isset($_POST["cel"])) {\n    $cel = $_POST["cel"]; $osoby = $_POST["osoby"];\n    $w = mysqli_fetch_array(mysqli_query($polaczenie, "SELECT cena FROM wycieczki WHERE cel = \'$cel\';"));\n    $koszt = $w["cena"] * $osoby;\n    echo "<p>Wycieczka $cel: $osoby × {$w[\'cena\']} zł = $koszt zł</p>";\n}\n```',
    sol: { 'index.php': p09.replace('      <!-- skrypt 1: opcje z bazy -->', R`      <?php
      $wynik = mysqli_query($polaczenie, "SELECT cel FROM wycieczki ORDER BY cel;");
      while ($w = mysqli_fetch_array($wynik)) {
          echo "<option>" . $w["cel"] . "</option>";
      }
      ?>`).replace('  <!-- skrypt 2: wynik -->', R`  <?php
  if (isset($_POST["cel"])) {
      $cel = $_POST["cel"];
      $osoby = $_POST["osoby"];
      $wynik = mysqli_query($polaczenie, "SELECT cena FROM wycieczki WHERE cel = '$cel';");
      $w = mysqli_fetch_array($wynik);
      $koszt = $w["cena"] * $osoby;
      echo "<p>Wycieczka $cel: $osoby × {$w['cena']} zł = $koszt zł</p>";
  }
  ?>`) }
  });
  const p10 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Zamówienia</title>
</head>
<body>
  <?php
  $polaczenie = mysqli_connect("localhost", "root", "", "sklep");
  // skrypt 1: usuwanie
  ?>
  <table>
    <tr><th>Nr</th><th>Data</th><th>Status</th><th></th></tr>
    <?php
    // skrypt 2: wiersze z odnośnikiem Usuń
    ?>
  </table>
  <?php mysqli_close($polaczenie); ?>
</body>
</html>
`;
  L.push({ id: 'p10', g: 'pf', f: 1, db: 'sklep', t: 'Usuwanie przez odnośnik (GET)', sub: 'index.php?usun=ID → DELETE – czerwiec 2025',
    q: 'Strona **index.php**, baza **sklep**. Uzupełnij:\n- **skrypt 2** – wyświetla w tabeli wszystkie zamówienia (id, dataZamowienia, status), a w czwartej kolumnie odnośnik „Usuń” prowadzący do tej samej strony z parametrem GET **usun** równym id zamówienia,\n- **skrypt 1** – jeżeli do strony przesłano parametr usun, usuwa z tabeli zamowienia rekord o tym id (przed wyświetleniem tabeli).',
    entry: 'index.php', files: { 'index.php': p10 },
    checks: [P.noErrors(),
      { d: 'Tabela: 12 zamówień', f: function (T) { const n = T.$$('table tr').length - 1; return n === 12 || ('Wierszy: ' + n); } },
      { d: 'Odnośnik „Usuń” → index.php?usun=<id>', f: function (T) { const a = T.$$('table a').find(function (x) { return /usu/i.test(x.textContent); }); if (!a) return 'Brak odnośników „Usuń”'; return /^index\.php\?usun=\d+$/.test(a.getAttribute('href')) || ('href="' + a.getAttribute('href') + '"'); } },
      { d: 'Kliknięcie „Usuń” przy zamówieniu 6 usuwa je z bazy i z tabeli', f: async function (T) { const row = T.$$('table tr').find(function (r) { return r.children[0] && r.children[0].textContent.trim() === '6'; }); if (!row) return 'Brak wiersza z id 6'; const a = row.querySelector('a'); if (!a) return 'Brak odnośnika w wierszu'; await T.click(a); await T.wait(80); T.doc = T.lab.frame.contentDocument; const left = T.query('SELECT COUNT(*) FROM zamowienia WHERE id = 6')[0][0]; if (left) return 'Rekord 6 nadal jest w bazie'; const n = T.doc.querySelectorAll('table tr').length - 1; return n === 11 || ('Po usunięciu wierszy: ' + n); } }],
    hint: '```php\nif (isset($_GET["usun"])) {\n    $id = $_GET["usun"];\n    mysqli_query($polaczenie, "DELETE FROM zamowienia WHERE id = $id;");\n}\n…\necho "<td><a href=\'index.php?usun={$w[\'id\']}\'>Usuń</a></td>";\n```',
    sol: { 'index.php': p10.replace('  // skrypt 1: usuwanie', R`  if (isset($_GET["usun"])) {
      $id = $_GET["usun"];
      mysqli_query($polaczenie, "DELETE FROM zamowienia WHERE id = $id;");
  }`).replace('    // skrypt 2: wiersze z odnośnikiem Usuń', R`    $wynik = mysqli_query($polaczenie, "SELECT id, dataZamowienia, status FROM zamowienia;");
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<tr><td>{$w['id']}</td><td>{$w['dataZamowienia']}</td><td>{$w['status']}</td>";
        echo "<td><a href='index.php?usun={$w['id']}'>Usuń</a></td></tr>";
    }`) }
  });

  /* ======================= PODSTRONY, SESJE ======================= */
  const p11a = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Wycieczki</title>
</head>
<body>
  <h1>Nasze wycieczki</h1>
  <ul>
    <!-- skrypt 1 -->
  </ul>
</body>
</html>
`;
  const p11b = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Szczegóły wycieczki</title>
</head>
<body>
  <a href="index.php">Powrót</a>
  <!-- skrypt 2 -->
</body>
</html>
`;
  L.push({ id: 'p11', g: 'pp', f: 2, db: 'podroze', t: 'Lista → strona szczegółów (?id=)', sub: 'dwa pliki, parametr GET, JOIN – 2026',
    q: 'Dwie strony, baza **podroze**.\n\n**Skrypt 1** (index.php): dla każdej wycieczki z tabeli wycieczki wypisuje element listy z odnośnikiem, którego treścią jest cel wycieczki, a adresem strona **wycieczka.php** z parametrem GET **id** równym id wycieczki.\n\n**Skrypt 2** (wycieczka.php): wysyła zapytanie wybierające cel, cenę i liczbę dni wycieczki oraz nazwę kraju (relacja z tabelą kraje) dla id przesłanego metodą GET i wyświetla:\n- nagłówek drugiego stopnia z celem,\n- nagłówek trzeciego stopnia z nazwą kraju,\n- akapit „<liczbaDni> dni, <cena> zł”.\n\nOba skrypty łączą się z bazą i na końcu zamykają połączenie.',
    entry: 'index.php', files: { 'index.php': p11a, 'wycieczka.php': p11b },
    checks: [P.noErrors(),
      { d: 'index.php: 14 odnośników do wycieczka.php?id=…', f: function (T) { const a = T.$$('ul a'); if (a.length !== 14) return 'Odnośników: ' + a.length; return /^wycieczka\.php\?id=\d+$/.test(a[0].getAttribute('href')) || ('href="' + a[0].getAttribute('href') + '"'); } },
      { d: 'Kliknięcie „Rzym” otwiera wycieczka.php z <h2>Rzym</h2>', f: async function (T) { const a = T.$$('ul a').find(function (x) { return T.norm(x.textContent) === 'rzym'; }); if (!a) return 'Brak odnośnika „Rzym”'; await T.click(a); await T.wait(80); T.doc = T.lab.frame.contentDocument; const h = T.doc.querySelector('h2'); return (h && h.textContent.trim() === 'Rzym') || ('Nagłówek: ' + (h ? h.textContent : 'brak')); } },
      { d: 'Szczegóły: kraj w <h3> (relacja) i „5 dni, 2150.00 zł”', f: async function (T) { await T.open('wycieczka.php?id=3'); const h3 = T.$('h3'); const p = texts(T, 'p'); if (!h3 || h3.textContent.trim() !== 'Włochy') return 'h3: ' + (h3 ? h3.textContent : 'brak'); return p.indexOf('5 dni, 2150.00 zł') >= 0 || ('Akapit: „' + (p[0] || '') + '”'); } },
      { d: 'Szczegóły bez błędów PHP dla innej wycieczki (id=13)', f: async function (T) { await T.open('wycieczka.php?id=13'); const h = T.$('h2'); return ((!T.php.fatal && !T.php.diag.length) && h && h.textContent.trim() === 'Tokio') || ('Dla id=13: ' + (T.php.fatal ? T.php.fatal.msg : (h ? h.textContent : 'brak h2'))); } }],
    hint: 'Skrypt 1:\n```php\necho "<li><a href=\'wycieczka.php?id={$w[\'id\']}\'>{$w[\'cel\']}</a></li>";\n```\nSkrypt 2:\n```php\n$id = $_GET["id"];\n$zap = "SELECT cel, cena, liczbaDni, nazwa FROM wycieczki JOIN kraje ON wycieczki.kraj_id = kraje.id WHERE wycieczki.id = $id;";\n```\nPole `id` jest w obu tabelach – w warunku napisz `wycieczki.id`.',
    sol: { 'index.php': p11a.replace('    <!-- skrypt 1 -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "podroze");
    $wynik = mysqli_query($polaczenie, "SELECT id, cel FROM wycieczki;");
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<li><a href='wycieczka.php?id={$w['id']}'>{$w['cel']}</a></li>";
    }
    mysqli_close($polaczenie);
    ?>`), 'wycieczka.php': p11b.replace('  <!-- skrypt 2 -->', R`  <?php
  $id = $_GET["id"];
  $polaczenie = mysqli_connect("localhost", "root", "", "podroze");
  $zapytanie = "SELECT cel, cena, liczbaDni, nazwa FROM wycieczki JOIN kraje ON wycieczki.kraj_id = kraje.id WHERE wycieczki.id = $id;";
  $w = mysqli_fetch_array(mysqli_query($polaczenie, $zapytanie));
  echo "<h2>{$w['cel']}</h2>";
  echo "<h3>{$w['nazwa']}</h3>";
  echo "<p>{$w['liczbaDni']} dni, {$w['cena']} zł</p>";
  mysqli_close($polaczenie);
  ?>`) }
  });
  const p12 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Stanowiska</title>
</head>
<body>
  <nav>
    <a href="index.php?st=1">Programiści</a>
    <a href="index.php?st=2">Administratorzy</a>
    <a href="index.php?st=4">Księgowi</a>
  </nav>
  <main>
    <!-- tu skrypt PHP -->
  </main>
</body>
</html>
`;
  L.push({ id: 'p12', g: 'pp', f: 1, db: 'firma', t: 'Wartość domyślna parametru GET', sub: 'isset($_GET) ? … : 1 – styczeń/czerwiec 2026',
    q: 'Strona **index.php**, baza **firma**. Skrypt w bloku głównym:\n- jeżeli do strony przesłano metodą GET parametr **st**, zmienna stanowiska przyjmuje jego wartość, **w przeciwnym wypadku wartość 1**,\n- wysyła zapytanie wybierające jedynie imiona i nazwiska pracowników z tego stanowiska,\n- każdego pracownika wyświetla w akapicie „<imię> <nazwisko>”,\n- zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p12 },
    checks: [P.noErrors(),
      { d: 'Bez parametru: programiści (3 osoby)', f: function (T) { const p = texts(T, 'main p'); return (p.length === 3 && p.indexOf('monika bielecka') >= 0) || ('Akapity: ' + p.join(' | ')); } },
      { d: 'Klik „Księgowi” → Ekiert i Fijałkowska', f: async function (T) { const a = T.$$('nav a')[2]; await T.click(a); await T.wait(80); T.doc = T.lab.frame.contentDocument; const p = Array.from(T.doc.querySelectorAll('main p')).map(function (e) { return T.norm(e.textContent); }); return p.join('|') === 'rafał ekiert|iwona fijałkowska' || ('Akapity: ' + p.join(' | ')); } },
      { d: 'Brak ostrzeżenia „Undefined array key” przy wejściu bez parametru', f: function (T) { return !(T.php && T.php.diag.some(function (d) { return /Undefined array key/.test(d.msg); })) || 'Sprawdź isset($_GET["st"]) przed odczytem'; } }],
    hint: '```php\nif (isset($_GET["st"])) { $st = $_GET["st"]; } else { $st = 1; }\n// albo krócej: $st = $_GET["st"] ?? 1;\n```',
    sol: { 'index.php': p12.replace('    <!-- tu skrypt PHP -->', R`    <?php
    if (isset($_GET["st"])) {
        $stanowisko = $_GET["st"];
    } else {
        $stanowisko = 1;
    }
    $polaczenie = mysqli_connect("localhost", "root", "", "firma");
    $wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko FROM pracownicy WHERE stanowisko_id = $stanowisko;");
    while ($w = mysqli_fetch_array($wynik)) {
        echo "<p>{$w['imie']} {$w['nazwisko']}</p>";
    }
    mysqli_close($polaczenie);
    ?>`) }
  });
  const p13login = R`<?php
// skrypt 1
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Logowanie</title>
</head>
<body>
  <form action="login.php" method="post">
    <input type="text" name="login" placeholder="login">
    <input type="password" name="haslo" placeholder="hasło">
    <button type="submit">Zaloguj</button>
  </form>
</body>
</html>
`;
  const p13panel = R`<?php
// skrypt 2
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Wyniki badań</title>
</head>
<body>
  <header>
    <!-- skrypt 3: powitanie -->
    <a href="wyloguj.php">Wyloguj</a>
  </header>
</body>
</html>
`;
  L.push({ id: 'p13', g: 'pp', f: 1, db: null, t: 'Logowanie: sesja i przekierowanie', sub: 'session_start, $_SESSION, header("Location") – czerwiec 2026',
    q: 'Trzy pliki (jak w arkuszu laboratorium medycznego z czerwca 2026):\n- **login.php, skrypt 1**: jeżeli z formularza wysłano login **admin** i hasło **Tajne123**, ustawia zmienną sesji uzytkownik z nazwą użytkownika i przekierowuje do **panel.php**; jeżeli wysłano inne dane – wyświetla akapit „Błędny login lub hasło”,\n- **panel.php, skrypt 2**: jeżeli zmienna sesji uzytkownik nie jest ustawiona, przekierowuje do **login.php**; **skrypt 3**: w bloku nagłówkowym akapit „Witaj, <użytkownik>”, nazwa użytkownika w znaczniku tekstu ważnego,\n- **wyloguj.php**: niszczy sesję i przekierowuje do login.php.',
    entry: 'login.php', files: { 'login.php': p13login, 'panel.php': p13panel, 'wyloguj.php': '<?php\n\n?>\n' },
    checks: [
      { d: 'Wejście na panel.php bez logowania → przekierowanie do login.php', f: async function (T) { await T.open('panel.php'); return /Logowanie/.test(T.doc.title) || ('Otworzyła się strona: ' + T.doc.title); } },
      { d: 'Złe hasło → komunikat „Błędny login lub hasło”', f: async function (T) { T.type('input[name="login"]', 'admin'); T.type('input[name="haslo"]', 'zle'); await T.submit('form'); return texts(T, 'p').indexOf('błędny login lub hasło') >= 0 || ('Akapity: ' + texts(T, 'p').join(' | ')); } },
      { d: 'admin / Tajne123 → panel z „Witaj, admin” (admin w <strong>)', f: async function (T) { T.type('input[name="login"]', 'admin'); T.type('input[name="haslo"]', 'Tajne123'); await T.submit('form'); if (!/Wyniki/.test(T.doc.title)) return 'Po zalogowaniu otworzyło się: ' + T.doc.title + (T.php && T.php.fatal ? ' (' + T.php.fatal.msg + ')' : ''); const s = T.$('header strong'); return (/Witaj, admin/.test(T.text('header')) && s && s.textContent.trim() === 'admin') || ('Nagłówek: „' + T.text('header') + '”'); } },
      { d: 'Sesja pamięta zalogowanie przy ponownym wejściu na panel.php', f: async function (T) { T.type('input[name="login"]', 'admin'); T.type('input[name="haslo"]', 'Tajne123'); await T.submit('form'); await T.open('panel.php'); return /Wyniki/.test(T.doc.title) || 'Po ponownym wejściu panel przekierował do logowania – zmienna sesji się nie zapisała (session_start?)'; } },
      { d: 'Wyloguj → login.php, a panel.php znów niedostępny', f: async function (T) { T.type('input[name="login"]', 'admin'); T.type('input[name="haslo"]', 'Tajne123'); await T.submit('form'); await T.open('wyloguj.php'); if (!/Logowanie/.test(T.doc.title)) return 'Po wylogowaniu: ' + T.doc.title; await T.open('panel.php'); return /Logowanie/.test(T.doc.title) || 'Po wylogowaniu panel nadal działa – session_destroy()'; } },
      C.code(/session_start\s*\(\s*\)/, 'session_start() w skryptach', 'Brak session_start()')],
    hint: '```php\n<?php\nsession_start();\nif (isset($_POST["login"])) {\n    if ($_POST["login"] == "admin" && $_POST["haslo"] == "Tajne123") {\n        $_SESSION["uzytkownik"] = $_POST["login"];\n        header("Location: panel.php");\n        exit;\n    }\n    $blad = true;\n}\n?>\n```\nKomunikat o błędzie wypisz w części HTML (np. `<?php if (isset($blad)) echo "<p>…</p>"; ?>`).',
    sol: { 'login.php': p13login.replace('// skrypt 1', R`session_start();
$blad = false;
if (isset($_POST["login"])) {
    if ($_POST["login"] == "admin" && $_POST["haslo"] == "Tajne123") {
        $_SESSION["uzytkownik"] = $_POST["login"];
        header("Location: panel.php");
        exit;
    }
    $blad = true;
}`).replace('  </form>\n', '  </form>\n  <?php if ($blad) { echo "<p>Błędny login lub hasło</p>"; } ?>\n'), 'panel.php': p13panel.replace('// skrypt 2', R`session_start();
if (!isset($_SESSION["uzytkownik"])) {
    header("Location: login.php");
    exit;
}`).replace('    <!-- skrypt 3: powitanie -->', R`    <?php echo "<p>Witaj, <strong>" . $_SESSION["uzytkownik"] . "</strong></p>"; ?>`), 'wyloguj.php': R`<?php
session_start();
session_destroy();
header("Location: login.php");
?>
` }
  });
  const p14 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Kalendarz</title>
</head>
<body>
  <header>
    <!-- tu skrypt PHP -->
  </header>
</body>
</html>
`;
  L.push({ id: 'p14', g: 'pp', f: 1, db: null, t: 'Data i dzień tygodnia w PHP', sub: 'date(), tablica dni – styczeń 2025',
    q: 'Strona **index.php**. Skrypt w bloku nagłówkowym wyświetla akapit „Dzisiaj jest <dzień tygodnia>, <data>”, gdzie dzień tygodnia to polska nazwa bieżącego dnia małymi literami (np. „wtorek”), a data – bieżąca data w formacie **dd-mm-yyyy** (np. 05-01-2027).',
    entry: 'index.php', files: { 'index.php': p14 },
    checks: [P.noErrors(),
      { d: 'Poprawna data dd-mm-yyyy', f: function (T) { const d = new Date(); const w = String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear(); return T.text('header p').indexOf(w) >= 0 || ('Akapit: „' + T.text('header p') + '”, oczekiwana data ' + w); } },
      { d: 'Polski dzień tygodnia', f: function (T) { const dni = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']; const w = 'Dzisiaj jest ' + dni[new Date().getDay()] + ','; return T.text('header p').indexOf(w) === 0 || ('Akapit: „' + T.text('header p') + '”'); } }],
    hint: '```php\n$dni = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];\necho "<p>Dzisiaj jest " . $dni[date("w")] . ", " . date("d-m-Y") . "</p>";\n```\n`date("w")` – numer dnia tygodnia, 0 = niedziela.',
    sol: { 'index.php': p14.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $dni = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
    echo "<p>Dzisiaj jest " . $dni[date("w")] . ", " . date("d-m-Y") . "</p>";
    ?>`) }
  });
  const p15 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Biblioteka</title>
</head>
<body>
  <section id="liryka">
    <!-- skrypt 1 -->
  </section>
</body>
</html>
`;
  L.push({ id: 'p15', g: 'pp', f: 1, db: null, t: 'Pętla for bez bazy', sub: '20 razy ten sam obraz – czerwiec 2025',
    q: 'Strona **index.php**. Skrypt 1 w sekcji liryka wyświetla **20 razy** grafikę **obraz.png** z tekstem alternatywnym „książka”. Należy zastosować instrukcję iteracyjną (pętlę).',
    entry: 'index.php', files: { 'index.php': p15 },
    checks: [P.noErrors(), { d: 'W sekcji jest 20 obrazów obraz.png', f: function (T) { const i = T.$$('#liryka img'); return (i.length === 20 && i.every(function (x) { return T.srcOf(x) === 'obraz.png'; })) || ('Obrazów: ' + i.length); } },
      { d: 'Obrazy mają alt „książka”', f: function (T) { return T.$$('#liryka img').every(function (x) { return x.getAttribute('alt') === 'książka'; }) || 'alt="książka"'; } },
      C.code(/\b(for|while)\s*\(/, 'Użyta pętla', 'Zadanie wymaga pętli (for / while)', /\.php$/i)],
    hint: '```php\nfor ($i = 1; $i <= 20; $i++) {\n    echo "<img src=\'obraz.png\' alt=\'książka\'>";\n}\n```',
    sol: { 'index.php': p15.replace('    <!-- skrypt 1 -->', R`    <?php
    for ($i = 1; $i <= 20; $i++) {
        echo "<img src='obraz.png' alt='książka'>";
    }
    ?>`) }
  });
  const p16 = R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Szkolenia</title>
</head>
<body>
  <main>
    <!-- tu skrypt PHP -->
  </main>
</body>
</html>
`;
  L.push({ id: 'p16', g: 'pp', f: 1, db: 'firma', t: 'Zapis wyników do pliku', sub: 'fopen, fwrite, fclose – styczeń 2025',
    q: 'Strona **index.php**, baza **firma**. Skrypt:\n- wysyła zapytanie wybierające jedynie datę i temat wszystkich szkoleń, posortowane rosnąco według daty,\n- każdy rekord wyświetla w osobnym akapicie: data i temat oddzielone spacją,\n- dodatkowo zapisuje każdy rekord **jako osobną linię** w pliku tekstowym **harmonogram.txt** (w tej samej postaci),\n- na końcu zamyka połączenie.',
    entry: 'index.php', files: { 'index.php': p16 },
    checks: [P.noErrors(), { d: 'Osiem akapitów „data temat”', f: function (T) { const p = texts(T, 'main p'); return (p.length === 8 && p[0] === '2025-09-15 bezpieczeństwo sieci') || ('Akapity: ' + p.length + ', pierwszy: „' + (p[0] || '') + '”'); } },
      { d: 'Plik harmonogram.txt z 8 liniami', f: function (T) { const f = T.lab.written['harmonogram.txt']; if (f == null) return 'Skrypt nie utworzył pliku harmonogram.txt'; const lines = f.split(/\r?\n/).filter(function (x) { return x.trim(); }); return (lines.length === 8 && lines[0].trim() === '2025-09-15 Bezpieczeństwo sieci') || ('Linii w pliku: ' + lines.length + ', pierwsza: „' + (lines[0] || '') + '”'); } }],
    hint: '```php\n$plik = fopen("harmonogram.txt", "w");\nwhile ($w = mysqli_fetch_array($wynik)) {\n    $linia = $w["data"] . " " . $w["temat"];\n    echo "<p>$linia</p>";\n    fwrite($plik, $linia . PHP_EOL);\n}\nfclose($plik);\n```\nPlik, który „zapisał” skrypt, możesz podejrzeć w konsoli pod podglądem (zakładka plików pojawi się po uruchomieniu).',
    sol: { 'index.php': p16.replace('    <!-- tu skrypt PHP -->', R`    <?php
    $polaczenie = mysqli_connect("localhost", "root", "", "firma");
    $wynik = mysqli_query($polaczenie, "SELECT data, temat FROM szkolenia ORDER BY data;");
    $plik = fopen("harmonogram.txt", "w");
    while ($w = mysqli_fetch_array($wynik)) {
        $linia = $w["data"] . " " . $w["temat"];
        echo "<p>$linia</p>";
        fwrite($plik, $linia . PHP_EOL);
    }
    fclose($plik);
    mysqli_close($polaczenie);
    ?>`) }
  });

  L.forEach(function (t) { t.area = 'php'; });
  TR.LAB = (TR.LAB || []).concat(L);
})(typeof window !== 'undefined' ? window : globalThis);
