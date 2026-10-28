/* Arkusze próbne – treści własne w formie arkusza CKE, ocena kryterium po kryterium */
(function (root) {
  const TR = root.TR = root.TR || {};
  const C = TR.C; const P = C.php; const R = String.raw;

  function kw(db, n, q) {
    // zapytanie n z pliku kwerendy.txt – zalicza, jeśli któreś zapytanie w pliku je spełnia
    return { r: 'R.1', d: 'Zapytanie ' + n + ' poprawne (w kwerendy.txt)', f: function (T) {
      const list = TR.sql.split(T.src('kwerendy.txt') || '');
      if (!list.length) return 'Plik kwerendy.txt jest pusty';
      let last = '';
      for (let i = 0; i < list.length; i++) { const r = TR.sqlcheck.check(q, list[i], function (v) { return TR.dbgen.open(db, v); }); if (r.ok) return true; if (i === n - 1) last = r.msg; }
      return 'Żadne zapytanie w pliku nie spełnia treści' + (last ? ' (zapytanie nr ' + n + ': ' + last + ')' : '');
    } };
  }
  function r(code, check) { check.r = code; return check; }
  function noCss(T) { return !T.inlineCss(); }

  /* ================= ARKUSZ 1: SCHRONISKO (PHP) ================= */
  const m1q = [
    { n: 1, text: 'wybierające jedynie pola imie, wiek i zdjecie z tabeli zwierzeta dla psów (gatunek_id równy 1), które nie zostały adoptowane (pole adopcja równe 0)', ref: 'SELECT imie, wiek, zdjecie FROM zwierzeta WHERE gatunek_id = 1 AND adopcja = 0;' },
    { n: 2, text: 'wybierające jedynie pole imie z tabeli zwierzeta oraz odpowiadające mu pole nazwa z tabeli gatunki dla zwierząt przyjętych do schroniska w 2026 roku. Należy posłużyć się relacją', ref: 'SELECT imie, nazwa FROM zwierzeta JOIN gatunki ON zwierzeta.gatunek_id = gatunki.id WHERE YEAR(dataPrzyjecia) = 2026;' },
    { n: 3, text: 'wybierające jedynie nazwę gatunku oraz zliczające liczbę zwierząt danego gatunku. Kolumna z liczbą zwierząt powinna mieć nazwę (alias) „liczba zwierząt”. Należy posłużyć się relacją i grupowaniem', ref: 'SELECT nazwa, COUNT(*) AS "liczba zwierząt" FROM gatunki JOIN zwierzeta ON zwierzeta.gatunek_id = gatunki.id GROUP BY nazwa;', aliases: ['liczba zwierząt'] },
    { n: 4, text: 'wstawiające do tabeli adopcje rekord: identyfikator zwierzęcia 3, imię Jan, nazwisko Kowalski, data – aktualna data wstawiona funkcją. Klucz główny nadawany automatycznie', ref: "INSERT INTO adopcje (zwierze_id, imie, nazwisko, data) VALUES (3, 'Jan', 'Kowalski', CURDATE());", must: [{ re: /CURDATE\s*\(\s*\)|CURRENT_DATE|NOW\s*\(\s*\)|SYSDATE\s*\(/i, msg: 'Datę wstaw funkcją (np. CURDATE()), a nie wpisaną ręcznie.' }] }
  ];
  const m1sheet = [
    'Wykonaj witrynę internetową schroniska dla zwierząt. Wykorzystaj pakiet XAMPP oraz edytor zaznaczający składnię.',
    '> W tej aplikacji baza **schronisko** jest już zaimportowana. Na egzaminie: utwórz bazę o nazwie schronisko z zestawem znaków utf8_unicode_ci i zaimportuj do niej plik schronisko.sql (przycisk „Pobierz schronisko.sql” nad arkuszem – przećwicz import u siebie w XAMPP).',
    '## Operacje na bazie danych',
    'Baza składa się z tabel: gatunki, zwierzeta, adopcje. Tabela zwierzeta jest połączona relacją z tabelą gatunki (pole gatunek_id), a tabela adopcje z tabelą zwierzeta (pole zwierze_id).',
    'Za pomocą narzędzia phpMyAdmin wykonaj zapytania SQL działające na bazie schronisko. Zapytania zapisz w pliku **kwerendy.txt** (w tej aplikacji: zakładka pliku kwerendy.txt). Na egzaminie wykonaj zrzuty ekranu z wynikami: kw1, kw2, kw3, kw4 (format PNG, cały ekran z paskiem zadań).',
    m1q.map(function (q) { return '- **Zapytanie ' + q.n + ':** ' + q.text; }).join('\n'),
    '## Witryna internetowa',
    'Witryna składa się ze strony **schronisko.php**. Cechy strony:',
    '- zapisana w języku HTML5, zadeklarowany polski język zawartości, jawnie zastosowany standard kodowania polskich znaków,\n- tytuł strony widoczny na karcie przeglądarki: „Schronisko Azyl”,\n- arkusz stylów w pliku **styl.css** prawidłowo połączony z kodem strony,\n- podział strony na bloki: nagłówkowy, lewy, prawy i stopki, zrealizowany za pomocą znaczników semantycznych: **header**, **aside** (blok lewy), **main** (blok prawy), **footer**. Bloki lewy i prawy są obok siebie, stopka pod nimi.',
    'Zawartość bloku nagłówkowego: nagłówek pierwszego stopnia „Schronisko Azyl” i akapit „Znajdź przyjaciela na całe życie”.',
    'Zawartość bloku lewego:\n- nagłówek trzeciego stopnia „Gatunki”,\n- lista punktowana z efektem działania skryptu 1,\n- nagłówek trzeciego stopnia „Zgłoś adopcję”,\n- formularz wysyłający dane metodą POST do pliku schronisko.php, zawierający: listę rozwijaną o nazwie **zwierze** wypełnioną skryptem 3, pole edycyjne o nazwie **imie**, pole edycyjne o nazwie **nazwisko**, przycisk „Zgłoś”,\n- pod formularzem efekt działania skryptu 4.',
    'Zawartość bloku prawego: nagłówek drugiego stopnia „Czekają na dom” i efekt działania skryptu 2.',
    'Zawartość stopki: akapit „Autor: ”, dalej numer zdającego, oraz odnośnik o treści „Regulamin adopcji” prowadzący do pliku regulamin.pdf.',
    '## Styl CSS witryny internetowej',
    'Cechy formatowania CSS (wyłącznie w pliku styl.css):\n- domyślnie dla wszystkich selektorów: krój czcionki Verdana, w przypadku braku sans-serif,\n- dla ciała strony: kolor tła OldLace,\n- dla bloku nagłówkowego: kolor tła SaddleBrown, biały kolor czcionki, wyrównanie tekstu do środka, marginesy wewnętrzne 15 px,\n- dla bloku lewego: kolor tła Wheat, szerokość 25%, wysokość 600 px,\n- dla bloku prawego: szerokość 75%, wysokość 600 px, paski przewijania pojawiające się tylko wtedy, gdy zawartość nie mieści się w bloku,\n- dla stopki: kolor tła SaddleBrown, biały kolor czcionki, marginesy wewnętrzne 10 px,\n- dla klasy **zwierze** (bloki tworzone skryptem 2): sposób wyświetlania liniowo-blokowy, szerokość 200 px, marginesy zewnętrzne 10 px, obramowanie linią ciągłą 1 px w kolorze SaddleBrown, zaokrąglenie rogów 10 px, kolor tła biały,\n- dla obrazów w blokach z klasą zwierze: szerokość 100%,\n- gdy kursor znajdzie się na bloku z klasą zwierze: cień o przesunięciu 5 px w obu osiach, rozmyciu 10 px i kolorze DimGray,\n- jedynie dla odnośników w bloku lewym: kolor czcionki SaddleBrown, czcionka pogrubiona, bez podkreślenia.',
    '## Skrypty działające po stronie serwera',
    'Wymagania wspólne: skrypty napisane w języku PHP; znaczące nazewnictwo zmiennych; skrypty łączą się z serwerem bazodanowym na localhost, użytkownik root bez hasła, baza danych o nazwie schronisko; na końcu połączenie jest zamykane.',
    '**Skrypt 1** – wysyła zapytanie wybierające id i nazwę wszystkich gatunków. Dla każdego rekordu wypisuje element listy z odnośnikiem: treścią jest nazwa gatunku, odnośnik prowadzi do strony schronisko.php i przesyła metodą GET parametr **gatunek** równy id gatunku.',
    '**Skrypt 2** – jeżeli do strony przesłano metodą GET parametr gatunek, używa jego wartości, w przeciwnym wypadku wartości 1. Wysyła zapytanie 1 zmodyfikowane tak, że w warunku jest sprawdzany ten gatunek. Dla każdego zwróconego rekordu tworzy blok z klasą **zwierze** zawierający: obraz (źródło – pole zdjecie, tekst alternatywny – pole imie), nagłówek trzeciego stopnia z imieniem, akapit „Wiek: <wiek> lat”.',
    '**Skrypt 3** – wypełnia listę rozwijaną: każde zwierzę, które nie zostało adoptowane (z wszystkich gatunków), jest opcją, w której atrybut value to id zwierzęcia, a treść to imię.',
    '**Skrypt 4** – wykonywany tylko wtedy, gdy z formularza przesłano niepuste imię i nazwisko: wysyła zapytanie 4 zmodyfikowane tak, że wstawione są wartości z formularza (id wybranego zwierzęcia, imię, nazwisko), następnie ustawia w tabeli zwierzeta pole adopcja na 1 dla wybranego zwierzęcia i wyświetla akapit „Dziękujemy! Zgłoszenie przyjęte.”',
    '## Rezultaty',
    'Ocenie podlega 5 rezultatów: operacje na bazie danych, zawartość witryny, działanie witryny, styl CSS, skrypty. Czas: 150 minut.'
  ].join('\n\n');
  const m1sol = {
    'kwerendy.txt': m1q.map(function (q) { return q.ref; }).join('\n') + '\n',
    'schronisko.php': R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Schronisko Azyl</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
<?php
$polaczenie = mysqli_connect("localhost", "root", "", "schronisko");
?>
  <header>
    <h1>Schronisko Azyl</h1>
    <p>Znajdź przyjaciela na całe życie</p>
  </header>
  <aside>
    <h3>Gatunki</h3>
    <ul>
      <?php
      $wynik = mysqli_query($polaczenie, "SELECT id, nazwa FROM gatunki;");
      while ($wiersz = mysqli_fetch_array($wynik)) {
          echo "<li><a href='schronisko.php?gatunek={$wiersz['id']}'>{$wiersz['nazwa']}</a></li>";
      }
      ?>
    </ul>
    <h3>Zgłoś adopcję</h3>
    <form action="schronisko.php" method="post">
      <select name="zwierze">
        <?php
        $wynik = mysqli_query($polaczenie, "SELECT id, imie FROM zwierzeta WHERE adopcja = 0;");
        while ($wiersz = mysqli_fetch_array($wynik)) {
            echo "<option value='{$wiersz['id']}'>{$wiersz['imie']}</option>";
        }
        ?>
      </select><br>
      <input type="text" name="imie" placeholder="imię"><br>
      <input type="text" name="nazwisko" placeholder="nazwisko"><br>
      <button type="submit">Zgłoś</button>
    </form>
    <?php
    if (!empty($_POST["imie"]) && !empty($_POST["nazwisko"])) {
        $zwierze = $_POST["zwierze"];
        $imie = $_POST["imie"];
        $nazwisko = $_POST["nazwisko"];
        mysqli_query($polaczenie, "INSERT INTO adopcje (zwierze_id, imie, nazwisko, data) VALUES ($zwierze, '$imie', '$nazwisko', CURDATE());");
        mysqli_query($polaczenie, "UPDATE zwierzeta SET adopcja = 1 WHERE id = $zwierze;");
        echo "<p>Dziękujemy! Zgłoszenie przyjęte.</p>";
    }
    ?>
  </aside>
  <main>
    <h2>Czekają na dom</h2>
    <?php
    if (isset($_GET["gatunek"])) {
        $gatunek = $_GET["gatunek"];
    } else {
        $gatunek = 1;
    }
    $wynik = mysqli_query($polaczenie, "SELECT imie, wiek, zdjecie FROM zwierzeta WHERE gatunek_id = $gatunek AND adopcja = 0;");
    while ($wiersz = mysqli_fetch_array($wynik)) {
        echo "<div class='zwierze'>";
        echo "<img src='{$wiersz['zdjecie']}' alt='{$wiersz['imie']}'>";
        echo "<h3>{$wiersz['imie']}</h3>";
        echo "<p>Wiek: {$wiersz['wiek']} lat</p>";
        echo "</div>";
    }
    mysqli_close($polaczenie);
    ?>
  </main>
  <footer>
    <p>Autor: 00000000000</p>
    <a href="regulamin.pdf">Regulamin adopcji</a>
  </footer>
</body>
</html>
`,
    'styl.css': R`* {
  font-family: Verdana, sans-serif;
}
body {
  background-color: OldLace;
}
header {
  background-color: SaddleBrown;
  color: white;
  text-align: center;
  padding: 15px;
}
aside {
  background-color: Wheat;
  width: 25%;
  height: 600px;
  float: left;
}
main {
  width: 75%;
  height: 600px;
  float: left;
  overflow: auto;
}
footer {
  clear: both;
  background-color: SaddleBrown;
  color: white;
  padding: 10px;
}
.zwierze {
  display: inline-block;
  width: 200px;
  margin: 10px;
  border: 1px solid SaddleBrown;
  border-radius: 10px;
  background-color: white;
}
.zwierze img {
  width: 100%;
}
.zwierze:hover {
  box-shadow: 5px 5px 10px DimGray;
}
aside a {
  color: SaddleBrown;
  font-weight: bold;
  text-decoration: none;
}
`
  };
  const m1checks = [
    r('R.1', { d: 'W pliku kwerendy.txt zapisano co najmniej jedno zapytanie SQL', f: function (T) { return TR.sql.split(T.src('kwerendy.txt') || '').length > 0 || 'Plik kwerendy.txt jest pusty'; } }),
    kw('schronisko', 1, m1q[0]), kw('schronisko', 2, m1q[1]), kw('schronisko', 3, m1q[2]), kw('schronisko', 4, m1q[3]),
    r('R.2', { d: 'DOCTYPE HTML5 i <html lang="pl">', f: function (T) { const a = C.doctype().f(T); if (a !== true) return a; return C.lang().f(T); } }),
    r('R.2', { d: 'Kodowanie UTF-8 i tytuł „Schronisko Azyl”', f: function (T) { const a = C.charset().f(T); if (a !== true) return a; return C.title('Schronisko Azyl').f(T); } }),
    r('R.2', { d: 'Bloki semantyczne: header, aside, main, footer', f: function (T) { const miss = ['header', 'aside', 'main', 'footer'].filter(function (t) { return !T.$(t); }); return !miss.length || 'Brak: ' + miss.join(', '); } }),
    r('R.2', { d: 'Nagłówek: <h1> „Schronisko Azyl” i akapit', f: function (T) { return (T.text('header h1') === 'Schronisko Azyl' && /Znajdź przyjaciela na całe życie/.test(T.text('header p'))) || 'Sprawdź h1 i akapit w <header>'; } }),
    r('R.2', { d: 'Blok lewy: dwa <h3> („Gatunki”, „Zgłoś adopcję”) i lista punktowana', f: function (T) { const h = T.$$('aside h3').map(function (x) { return x.textContent.trim(); }); return (h[0] === 'Gatunki' && h[1] === 'Zgłoś adopcję' && !!T.$('aside ul')) || ('Nagłówki: ' + h.join(', ')); } }),
    r('R.2', { d: 'Formularz POST: lista zwierze, pola imie i nazwisko, przycisk „Zgłoś”', f: function (T) { const f = T.$('aside form'); if (!f) return 'Brak formularza w bloku lewym'; if ((f.getAttribute('method') || '').toLowerCase() !== 'post') return 'method="post"'; if (!f.querySelector('select[name="zwierze"]')) return 'Brak <select name="zwierze">'; if (!f.querySelector('input[name="imie"]') || !f.querySelector('input[name="nazwisko"]')) return 'Brak pól imie / nazwisko'; const b = f.querySelector('button, input[type="submit"]'); return (b && /Zgłoś/.test(b.textContent || b.value)) || 'Brak przycisku „Zgłoś”'; } }),
    r('R.2', { d: 'Blok prawy: <h2> „Czekają na dom”', f: function (T) { return T.text('main h2') === 'Czekają na dom' || 'Brak <h2> w <main>'; } }),
    r('R.2', { d: 'Stopka: numer zdającego i odnośnik „Regulamin adopcji” → regulamin.pdf', f: function (T) { const a = C.footerPesel().f(T); if (a !== true) return a; const l = T.$$('footer a').find(function (x) { return /Regulamin adopcji/.test(x.textContent); }); return (l && l.getAttribute('href') === 'regulamin.pdf') || 'Brak odnośnika do regulamin.pdf'; } }),
    r('R.3', { d: 'Bloki lewy i prawy obok siebie, stopka pod nimi', f: function (T) { if (!T.leftOf('aside', 'main')) return 'aside i main nie są obok siebie'; return (T.above('aside', 'footer') && T.above('main', 'footer')) || 'Stopka nachodzi na bloki (clear: both?)'; } }),
    r('R.3', { d: 'Działający arkusz styl.css, bez stylów w HTML', f: function (T) { const a = C.linkCss('styl.css').f(T); if (a !== true) return a; return noCss(T) || 'Usuń style z HTML'; } }),
    r('R.3', { d: 'Odnośnik gatunku otwiera stronę z parametrem GET (np. koty)', f: async function (T) { const a = T.$$('aside ul a').find(function (x) { return x.textContent.trim() === 'kot'; }); if (!a) return 'Brak odnośnika „kot”'; if (!/schronisko\.php\?gatunek=2$/.test(a.getAttribute('href'))) return 'href="' + a.getAttribute('href') + '"'; await T.click(a); const imgs = T.$$('main .zwierze h3').map(function (x) { return x.textContent.trim(); }); return imgs.join(',') === 'Mruczek,Kicia' || ('Po kliknięciu „kot”: ' + imgs.join(', ')); } }),
    r('R.3', { d: 'Formularz wysyła dane i strona wyświetla potwierdzenie', f: async function (T) { T.choose('select[name="zwierze"]', 'Luna'); T.type('input[name="imie"]', 'Ewa'); T.type('input[name="nazwisko"]', 'Lis'); await T.submit('aside form'); return /Dziękujemy! Zgłoszenie przyjęte\./.test(T.text('aside')) || 'Po wysłaniu brak komunikatu „Dziękujemy! Zgłoszenie przyjęte.”'; } }),
    r('R.4', { d: 'Czcionka Verdana, sans-serif dla wszystkich; tło strony OldLace', f: function (T) { const a = C.css('main h2', 'font-family', 'Verdana, sans-serif').f(T); if (a !== true) return a; return C.css('body', 'background-color', 'OldLace').f(T); } }),
    r('R.4', { d: 'Nagłówek: tło SaddleBrown, biała czcionka, wyśrodkowanie, padding 15 px', f: function (T) { for (const c of [C.css('header', 'background-color', 'SaddleBrown'), C.css('header', 'color', 'white'), C.css('header', 'text-align', 'center'), C.css('header', 'padding-top', '15px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Blok lewy: tło Wheat, szerokość 25%, wysokość 600 px', f: function (T) { for (const c of [C.css('aside', 'background-color', 'Wheat'), C.css('aside', 'width', '25%'), C.css('aside', 'height', '600px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Blok prawy: szerokość 75%, wysokość 600 px, overflow auto', f: function (T) { for (const c of [C.css('main', 'width', '75%'), C.css('main', 'height', '600px'), C.css('main', 'overflow-y', 'auto')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Stopka: tło SaddleBrown, biała czcionka, padding 10 px', f: function (T) { for (const c of [C.css('footer', 'background-color', 'SaddleBrown'), C.css('footer', 'color', 'white'), C.css('footer', 'padding-top', '10px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Klasa zwierze: inline-block, szerokość 200 px, margines 10 px', f: function (T) { if (!T.$('.zwierze')) return 'Brak bloków .zwierze'; for (const c of [C.css('.zwierze', 'display', 'inline-block'), C.css('.zwierze', 'width', '200px'), C.css('.zwierze', 'margin-left', '10px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Klasa zwierze: obramowanie 1px solid SaddleBrown, zaokrąglenie 10 px, tło białe', f: function (T) { if (!T.$('.zwierze')) return 'Brak bloków .zwierze'; for (const c of [C.css('.zwierze', 'border-top-style', 'solid'), C.css('.zwierze', 'border-top-width', '1px'), C.css('.zwierze', 'border-top-color', 'SaddleBrown'), C.css('.zwierze', 'border-top-left-radius', '10px'), C.css('.zwierze', 'background-color', 'white')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Obrazy w blokach zwierze: szerokość 100%', f: function (T) { const i = T.$('.zwierze img'); if (!i) return 'Brak obrazów w blokach'; return C.sameLen(T, i, 'width', '100%') || 'Szerokość obrazu ≠ 100% bloku'; } }),
    r('R.4', { d: 'Kursor na bloku zwierze: cień 5px 5px 10px DimGray', f: function (T) { const e = T.$('.zwierze'); if (!e) return 'Brak bloków .zwierze'; const v = T.pseudo(e, 'hover', 'box-shadow'); return (v && /5px\s+5px\s+10px/.test(v) && /dimgr[ae]y/i.test(v)) || ('W :hover box-shadow = ' + v); } }),
    r('R.4', { d: 'Odnośniki w bloku lewym: SaddleBrown, pogrubione, bez podkreślenia', f: function (T) { if (!T.$('aside a')) return 'Brak odnośników w bloku lewym'; for (const c of [C.css('aside a', 'color', 'SaddleBrown'), C.css('aside a', 'font-weight', 'bold'), C.css('aside a', 'text-decoration', 'none')]) { const x = c.f(T); if (x !== true) return x; } const f = T.$('footer a'); return !f || T.css(f, 'color') !== T.color('SaddleBrown') || 'Styl odnośników ma dotyczyć tylko bloku lewego (aside a)'; } }),
    r('R.5', { d: 'Połączenie z bazą schronisko i zamknięcie na końcu', f: function (T) { const a = P.connect('schronisko').f(T); if (a !== true) return a; return P.close().f(T); } }),
    r('R.5', { d: 'Skrypty bez błędów, zmienne o znaczących nazwach', f: function (T) { if (!/<\?php/.test(T.codeOf(/\.php$/))) return 'Brak skryptów PHP'; const a = P.noErrors().f(T); if (a !== true) return a; const vars = (T.codeOf(/\.php$/).match(/\$[a-zA-Z_]\w*/g) || []).filter(function (v) { return !/^\$_(GET|POST|SESSION|SERVER)$/.test(v); }); const bad = vars.filter(function (v) { return v.length <= 2 && !/^\$[ijk]$/.test(v); }); return !bad.length || 'Krótkie, nic nieznaczące nazwy zmiennych: ' + Array.from(new Set(bad)).join(', '); } }),
    r('R.5', { d: 'Skrypt 1: odnośniki do gatunków z parametrem GET', f: function (T) { const a = T.$$('aside ul li a'); return (a.length === 3 && /\?gatunek=1$/.test(a[0].getAttribute('href'))) || ('Odnośników: ' + a.length); } }),
    r('R.5', { d: 'Skrypt 2: domyślnie psy (4 bloki: Burek, Saba, Luna, Kajtek)', f: function (T) { const h = T.$$('main .zwierze h3').map(function (x) { return x.textContent.trim(); }); return h.join(',') === 'Burek,Saba,Luna,Kajtek' || ('Bloki: ' + h.join(', ')); } }),
    r('R.5', { d: 'Skrypt 2: obraz z pola zdjecie, alt z imienia, akapit „Wiek: … lat”', f: function (T) { const b = T.$('.zwierze'); if (!b) return 'Brak bloków .zwierze'; const i = b.querySelector('img'); if (!i || T.srcOf(i) !== 'burek.jpg' || i.getAttribute('alt') !== 'Burek') return 'Pierwszy obraz: src="' + (i && T.srcOf(i)) + '" alt="' + (i && i.getAttribute('alt')) + '"'; return /^Wiek: 5 lat$/.test(T.text(b.querySelector('p'))) || ('Akapit: „' + T.text(b.querySelector('p')) + '”'); } }),
    r('R.5', { d: 'Skrypt 3: opcje = zwierzęta nieadoptowane, value = id', f: function (T) { const o = T.$$('select[name="zwierze"] option'); if (o.length !== 8) return 'Opcji: ' + o.length + ' (powinno być 8 – bez Reksia i Filemona)'; const l = o.find(function (x) { return x.textContent.trim() === 'Luna'; }); return (l && l.getAttribute('value') === '3') || 'value opcji ma być id zwierzęcia'; } }),
    r('R.5', { d: 'Skrypt 4: zapis do tabeli adopcje i zmiana pola adopcja', f: async function (T) { T.choose('select[name="zwierze"]', 'Puszek'); T.type('input[name="imie"]', 'Ola'); T.type('input[name="nazwisko"]', 'Mazur'); await T.submit('aside form'); const a = T.query("SELECT zwierze_id, imie, nazwisko, data FROM adopcje WHERE nazwisko = 'Mazur'"); if (a.length !== 1 || a[0][0] !== 8) return 'W tabeli adopcje brak poprawnego rekordu (zwierze_id 8, Ola Mazur)'; const z = T.query('SELECT adopcja FROM zwierzeta WHERE id = 8'); return (z[0] && z[0][0] === 1) || 'Pole adopcja dla wybranego zwierzęcia nie zmieniło się na 1'; } }),
    r('R.5', { d: 'Skrypt 4 nie działa przy pustym nazwisku', f: async function (T) { const before = T.query('SELECT COUNT(*) FROM adopcje')[0][0]; T.type('input[name="imie"]', 'Jan'); T.type('input[name="nazwisko"]', ''); await T.submit('aside form'); return T.query('SELECT COUNT(*) FROM adopcje')[0][0] === before || 'Dodano rekord mimo pustego nazwiska'; } })
  ];

  /* ================= ARKUSZ 2: REMONTY (JavaScript) ================= */
  const m2q = [
    { n: 1, text: 'wybierające jedynie nazwy i liczbę pracowników firm z Wrocławia, posortowane alfabetycznie według nazwy', ref: "SELECT nazwa, liczbaPracownikow FROM firmy WHERE miasto = 'Wrocław' ORDER BY nazwa;" },
    { n: 2, text: 'wybierające jedynie najmniejszą, największą i średnią liczbę pracowników firm. Kolumnom należy nadać nazwy (aliasy) kolejno: „najmniej”, „najwięcej”, „średnio”', ref: 'SELECT MIN(liczbaPracownikow) AS "najmniej", MAX(liczbaPracownikow) AS "najwięcej", AVG(liczbaPracownikow) AS "średnio" FROM firmy;', aliases: ['najmniej', 'najwięcej', 'średnio'] },
    { n: 3, text: 'wybierające jedynie nazwę firmy z tabeli firmy, rodzaj usługi z tabeli uslugi oraz metraż z tabeli zlecenia dla zleceń o metrażu większym niż 50 m². Należy posłużyć się relacją', ref: 'SELECT nazwa, rodzaj, metraz FROM zlecenia JOIN firmy ON zlecenia.firma_id = firmy.id JOIN uslugi ON zlecenia.usluga_id = uslugi.id WHERE metraz > 50;' },
    { n: 4, text: 'dodające do tabeli firmy kolumnę telefon typu napisowego o długości 15 znaków, wstawioną po kolumnie miasto', ref: 'ALTER TABLE firmy ADD telefon VARCHAR(15) AFTER miasto;', checkOrder: true, checkLen: true }
  ];
  const m2sheet = [
    'Wykonaj witrynę internetową firmy remontowej. Wykorzystaj pakiet XAMPP oraz edytor zaznaczający składnię.',
    '## Operacje na bazie danych',
    '> W tej aplikacji baza **remonty** jest już zaimportowana. Na egzaminie: utwórz bazę remonty (utf8_unicode_ci) i zaimportuj plik remonty.sql (przycisk nad arkuszem).',
    'Baza składa się z tabel: firmy, uslugi, zlecenia. Tabela zlecenia jest połączona relacjami z tabelami firmy (firma_id) i uslugi (usluga_id).',
    'Wykonaj zapytania SQL działające na bazie remonty i zapisz je w pliku **kwerendy.txt**:',
    m2q.map(function (q) { return '- **Zapytanie ' + q.n + ':** ' + q.text; }).join('\n'),
    '## Witryna internetowa',
    'Witryna składa się ze strony **index.html**:',
    '- zapisana w HTML5, język polski, kodowanie UTF-8, tytuł „Remonty bez stresu”, arkusz stylów **styl.css**, skrypt w pliku **skrypt.js** dołączony na końcu ciała strony,\n- bloki (znaczniki semantyczne): nagłówkowy (header), nawigacyjny (nav), główny (main) zawierający dwie sekcje o id **kalkulator** i **cennik**, stopki (footer).',
    'Zawartość bloków:\n- nagłówkowy: nagłówek pierwszego stopnia „Remonty bez stresu”,\n- nawigacyjny: dwa przyciski: „Kalkulator” (id **bk**) i „Cennik” (id **bc**), wywołujące odpowiednie funkcje skryptu,\n- sekcja kalkulator: nagłówek drugiego stopnia „Kalkulator”, trzy pola opcji (radio) z grupy **usluga** o wartościach 18, 35, 90 i podpisach „malowanie”, „panele”, „glazura” (pierwsze zaznaczone), pole numeryczne o id **metraz**, pole wyboru o id **material** z podpisem „z materiałami (+30%)”, przycisk „Oblicz” wywołujący funkcję **oblicz()**, akapit o id **wynik**,\n- sekcja cennik: nagłówek drugiego stopnia „Cennik” i tabela: wiersz nagłówkowy „Usługa”, „Cena za m²” oraz trzy wiersze: malowanie 18 zł, panele 35 zł, glazura 90 zł (oznaczenie m² zapisane z indeksem górnym),\n- stopka: akapit „Autor: ”, dalej numer zdającego.',
    '## Styl CSS witryny internetowej',
    '- dla ciała strony: krój czcionki Tahoma, kolor tła #F2F2F2,\n- dla bloku nagłówkowego i stopki: kolor tła #2E7D32, biały kolor czcionki, wyrównanie tekstu do środka, marginesy wewnętrzne 10 px,\n- dla przycisków w bloku nawigacyjnym: kolor tła #A5D6A7, bez obramowania, marginesy wewnętrzne 10 px, marginesy zewnętrzne 5 px,\n- dla sekcji: marginesy zewnętrzne 20 px, marginesy wewnętrzne 15 px, kolor tła biały, cień o przesunięciu 3 px w obu osiach, rozmyciu 6 px i kolorze Gray,\n- sekcja cennik jest na starcie usunięta (display: none),\n- dla tabeli i komórek: obramowanie 1 px linią ciągłą w kolorze #2E7D32, obramowanie połączone,\n- gdy kursor znajdzie się na wierszu tabeli: kolor tła #C8E6C9.',
    '## Skrypt działający po stronie klienta',
    'Skrypt napisany w JavaScript, znaczące nazwy zmiennych i funkcji.',
    '- **pokaz(n)** – dla n = 1 widoczna jest sekcja kalkulator (display block), a cennik usunięty; dla n = 2 odwrotnie. Przycisk aktywnej sekcji ma kolor tła #2E7D32 i białą czcionkę, drugi przycisk – kolor tła #A5D6A7 i czarną czcionkę.\n- **oblicz()** – pobiera metraż; jeżeli metraż jest pusty lub nie jest większy od 0, w akapicie wynik wypisuje „Podaj poprawny metraż” w kolorze czerwonym. W przeciwnym wypadku liczy koszt = metraż × cena za m² z zaznaczonego pola opcji, a gdy zaznaczono pole materiałów, zwiększa koszt o 30%; wypisuje „Koszt usługi: <koszt> zł” z dwoma miejscami po przecinku, w kolorze czarnym.'
  ].join('\n\n');
  const m2sol = {
    'kwerendy.txt': m2q.map(function (q) { return q.ref; }).join('\n') + '\n',
    'index.html': R`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Remonty bez stresu</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <header>
    <h1>Remonty bez stresu</h1>
  </header>
  <nav>
    <button type="button" id="bk" onclick="pokaz(1)">Kalkulator</button>
    <button type="button" id="bc" onclick="pokaz(2)">Cennik</button>
  </nav>
  <main>
    <section id="kalkulator">
      <h2>Kalkulator</h2>
      <input type="radio" name="usluga" value="18" checked> malowanie
      <input type="radio" name="usluga" value="35"> panele
      <input type="radio" name="usluga" value="90"> glazura<br>
      <input type="number" id="metraz"><br>
      <input type="checkbox" id="material"> z materiałami (+30%)<br>
      <button type="button" onclick="oblicz()">Oblicz</button>
      <p id="wynik"></p>
    </section>
    <section id="cennik">
      <h2>Cennik</h2>
      <table>
        <tr><th>Usługa</th><th>Cena za m<sup>2</sup></th></tr>
        <tr><td>malowanie</td><td>18 zł</td></tr>
        <tr><td>panele</td><td>35 zł</td></tr>
        <tr><td>glazura</td><td>90 zł</td></tr>
      </table>
    </section>
  </main>
  <footer>
    <p>Autor: 00000000000</p>
  </footer>
  <script src="skrypt.js"></script>
</body>
</html>
`,
    'styl.css': R`body {
  font-family: Tahoma;
  background-color: #F2F2F2;
}
header, footer {
  background-color: #2E7D32;
  color: white;
  text-align: center;
  padding: 10px;
}
nav button {
  background-color: #A5D6A7;
  border: none;
  padding: 10px;
  margin: 5px;
}
section {
  margin: 20px;
  padding: 15px;
  background-color: white;
  box-shadow: 3px 3px 6px Gray;
}
#cennik {
  display: none;
}
table, th, td {
  border: 1px solid #2E7D32;
  border-collapse: collapse;
}
tr:hover {
  background-color: #C8E6C9;
}
`,
    'skrypt.js': R`function pokaz(n) {
  let kalkulator = document.getElementById("kalkulator");
  let cennik = document.getElementById("cennik");
  let bk = document.getElementById("bk");
  let bc = document.getElementById("bc");
  if (n == 1) {
    kalkulator.style.display = "block";
    cennik.style.display = "none";
    bk.style.backgroundColor = "#2E7D32"; bk.style.color = "white";
    bc.style.backgroundColor = "#A5D6A7"; bc.style.color = "black";
  } else {
    kalkulator.style.display = "none";
    cennik.style.display = "block";
    bc.style.backgroundColor = "#2E7D32"; bc.style.color = "white";
    bk.style.backgroundColor = "#A5D6A7"; bk.style.color = "black";
  }
}
function oblicz() {
  let metraz = Number(document.getElementById("metraz").value);
  let wynik = document.getElementById("wynik");
  if (!(metraz > 0)) {
    wynik.innerHTML = "Podaj poprawny metraż";
    wynik.style.color = "red";
    return;
  }
  let cena = Number(document.querySelector('input[name="usluga"]:checked').value);
  let koszt = metraz * cena;
  if (document.getElementById("material").checked) {
    koszt = koszt * 1.3;
  }
  wynik.innerHTML = "Koszt usługi: " + koszt.toFixed(2) + " zł";
  wynik.style.color = "black";
}
`
  };
  const m2checks = [
    r('R.1', { d: 'W pliku kwerendy.txt zapisano co najmniej jedno zapytanie SQL', f: function (T) { return TR.sql.split(T.src('kwerendy.txt') || '').length > 0 || 'Plik kwerendy.txt jest pusty'; } }),
    kw('remonty', 1, m2q[0]), kw('remonty', 2, m2q[1]), kw('remonty', 3, m2q[2]), kw('remonty', 4, m2q[3]),
    r('R.2', { d: 'DOCTYPE HTML5, lang="pl", UTF-8, tytuł „Remonty bez stresu”', f: function (T) { for (const c of [C.doctype(), C.lang(), C.charset(), C.title('Remonty bez stresu')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.2', { d: 'Bloki: header, nav, main z sekcjami #kalkulator i #cennik, footer', f: function (T) { const miss = ['header', 'nav', 'main', 'main #kalkulator', 'main #cennik', 'footer'].filter(function (t) { return !T.$(t); }); return !miss.length || 'Brak: ' + miss.join(', '); } }),
    r('R.2', { d: 'h1 w nagłówku, przyciski #bk „Kalkulator” i #bc „Cennik” w nav', f: function (T) { if (T.text('header h1') !== 'Remonty bez stresu') return 'h1: „' + T.text('header h1') + '”'; return (T.text('nav #bk') === 'Kalkulator' && T.text('nav #bc') === 'Cennik') || 'Przyciski w nav: ' + T.text('nav'); } }),
    r('R.2', { d: 'Kalkulator: 3 radio „usluga” (18, 35, 90; pierwsze zaznaczone)', f: function (T) { const r1 = T.$$('#kalkulator input[type="radio"][name="usluga"]'); if (r1.length !== 3) return 'Radio z name="usluga": ' + r1.length; if (r1.map(function (x) { return x.value; }).join() !== '18,35,90') return 'value: ' + r1.map(function (x) { return x.value; }).join(', '); return r1[0].checked || 'Pierwsze radio ma być zaznaczone (checked)'; } }),
    r('R.2', { d: 'Kalkulator: pole number #metraz, checkbox #material, przycisk „Oblicz”, akapit #wynik', f: function (T) { const m = T.$('#metraz'); if (!m || m.type !== 'number') return 'Brak <input type="number" id="metraz">'; const c = T.$('#material'); if (!c || c.type !== 'checkbox') return 'Brak checkboxa #material'; if (!T.$$('#kalkulator button').some(function (b) { return /Oblicz/.test(b.textContent); })) return 'Brak przycisku „Oblicz”'; return !!T.$('#wynik') || 'Brak akapitu #wynik'; } }),
    r('R.2', { d: 'Cennik: tabela 4 wiersze, nagłówek z m<sup>2</sup>', f: function (T) { const tr = T.$$('#cennik table tr'); if (tr.length !== 4) return 'Wierszy: ' + tr.length; const th = tr[0].querySelectorAll('th'); if (th.length !== 2) return 'Pierwszy wiersz: 2 komórki <th>'; return !!th[1].querySelector('sup') || 'm² zapisz jako m<sup>2</sup>'; } }),
    r('R.2', { d: 'Stopka z numerem zdającego', f: function (T) { return C.footerPesel().f(T); } }),
    r('R.3', { d: 'Działający styl.css i skrypt.js (dołączony na końcu body), brak stylów w HTML', f: function (T) { const a = C.linkCss('styl.css').f(T); if (a !== true) return a; if (!/<script[^>]+src=["']?skrypt\.js/i.test(T.src('index.html'))) return 'Brak <script src="skrypt.js">'; return noCss(T) || 'Usuń style z HTML'; } }),
    r('R.3', { d: 'Na starcie widoczny tylko kalkulator', f: function (T) { return (T.visible('#kalkulator') && !T.visible('#cennik')) || 'Na starcie: kalkulator ' + (T.visible('#kalkulator') ? 'widoczny' : 'ukryty') + ', cennik ' + (T.visible('#cennik') ? 'widoczny' : 'ukryty'); } }),
    r('R.4', { d: 'Ciało strony: Tahoma, tło #F2F2F2', f: function (T) { for (const c of [C.css('body', 'font-family', 'Tahoma'), C.css('body', 'background-color', '#F2F2F2')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Nagłówek i stopka: tło #2E7D32, biała czcionka, wyśrodkowanie, padding 10 px', f: function (T) { for (const s of ['header', 'footer']) for (const c of [C.css(s, 'background-color', '#2E7D32'), C.css(s, 'color', 'white'), C.css(s, 'text-align', 'center'), C.css(s, 'padding-top', '10px')]) { const x = c.f(T); if (x !== true) return s + ': ' + x; } return true; } }),
    r('R.4', { d: 'Przyciski w nav: tło #A5D6A7, bez obramowania, padding 10 px, margin 5 px', f: function (T) { for (const c of [C.css('nav button', 'background-color', '#A5D6A7'), C.css('nav button', 'border-top-style', 'none'), C.css('nav button', 'padding-top', '10px'), C.css('nav button', 'margin-left', '5px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Sekcje: margin 20 px, padding 15 px, tło białe, cień 3px 3px 6px Gray', f: function (T) { for (const c of [C.css('#kalkulator', 'margin-left', '20px'), C.css('#kalkulator', 'padding-top', '15px'), C.css('#kalkulator', 'background-color', 'white')]) { const x = c.f(T); if (x !== true) return x; } const v = T.css('#kalkulator', 'box-shadow'); return (/3px 3px 6px/.test(v) && v.indexOf(T.color('Gray')) >= 0) || ('box-shadow: ' + v); } }),
    r('R.4', { d: 'Tabela i komórki: 1px solid #2E7D32, obramowanie połączone', f: function (T) { for (const c of [C.css('#cennik table', 'border-collapse', 'collapse'), C.css('#cennik td', 'border-top-style', 'solid'), C.css('#cennik td', 'border-top-color', '#2E7D32'), C.css('#cennik th', 'border-top-width', '1px')]) { const x = c.f(T); if (x !== true) return x; } return true; } }),
    r('R.4', { d: 'Kursor na wierszu tabeli: tło #C8E6C9', f: function (T) { return C.hover('#cennik tr', 'background-color', '#C8E6C9').f(T); } }),
    r('R.5', { d: 'pokaz(2): widoczny cennik, kalkulator usunięty', f: async function (T) { await T.click('#bc'); return (T.visible('#cennik') && !T.visible('#kalkulator')) || 'Po kliknięciu „Cennik” widoczność sekcji się nie zgadza'; } }),
    r('R.5', { d: 'pokaz(n): kolory aktywnego i nieaktywnego przycisku', f: async function (T) { await T.click('#bc'); if (T.css('#bc', 'background-color') !== T.color('#2E7D32') || T.css('#bc', 'color') !== T.color('white')) return 'Aktywny przycisk: tło #2E7D32, biała czcionka'; await T.click('#bk'); return (T.css('#bc', 'background-color') === T.color('#A5D6A7') && T.css('#bc', 'color') === T.color('black') && T.visible('#kalkulator')) || 'Po powrocie do kalkulatora przycisk Cennik ma tło #A5D6A7 i czarną czcionkę'; } }),
    r('R.5', { d: 'oblicz(): 20 m², malowanie → „Koszt usługi: 360.00 zł”', f: async function (T) { T.type('#metraz', '20'); T.tick(T.$$('input[name="usluga"]')[0], true); T.tick('#material', false); await T.click(T.$$('#kalkulator button')[0]); return T.text('#wynik') === 'Koszt usługi: 360.00 zł' || ('Akapit: „' + T.text('#wynik') + '”'); } }),
    r('R.5', { d: 'oblicz(): glazura 12 m² z materiałami → 1404.00 zł', f: async function (T) { T.type('#metraz', '12'); T.tick(T.$$('input[name="usluga"]')[2], true); T.tick('#material', true); await T.click(T.$$('#kalkulator button')[0]); return T.text('#wynik') === 'Koszt usługi: 1404.00 zł' || ('Akapit: „' + T.text('#wynik') + '”'); } }),
    r('R.5', { d: 'oblicz(): pusty metraż → czerwony komunikat', f: async function (T) { T.type('#metraz', ''); await T.click(T.$$('#kalkulator button')[0]); if (T.text('#wynik') !== 'Podaj poprawny metraż') return 'Akapit: „' + T.text('#wynik') + '”'; return T.css('#wynik', 'color') === T.color('red') || 'Komunikat ma być czerwony'; } }),
    r('R.5', { d: 'oblicz(): po błędzie poprawne dane znów na czarno', f: async function (T) { T.type('#metraz', '-5'); await T.click(T.$$('#kalkulator button')[0]); T.type('#metraz', '10'); await T.click(T.$$('#kalkulator button')[0]); return (/^Koszt usługi:/.test(T.text('#wynik')) && T.css('#wynik', 'color') === T.color('black')) || 'Po poprawce wynik ma być czarny'; } })
  ];

  TR.MOCK = [
    { id: 'm1', code: 'INF.03-P1-SG', title: 'Schronisko dla zwierząt', sub: 'PHP + mysqli, odnośniki GET, formularz z INSERT i UPDATE', kind: 'PHP', db: 'schronisko', entry: 'schronisko.php', files: { 'kwerendy.txt': '', 'schronisko.php': '', 'styl.css': '' }, sheet: m1sheet, checks: m1checks, sol: m1sol, layout: [['header', 'nagłówkowy'], ['aside', 'lewy', 'main', 'prawy'], ['footer', 'stopka']] },
    { id: 'm2', code: 'INF.03-P2-SG', title: 'Kalkulator firmy remontowej', sub: 'JavaScript: obliczenia, walidacja, pokazywanie sekcji', kind: 'JS', db: 'remonty', entry: 'index.html', files: { 'kwerendy.txt': '', 'index.html': '', 'styl.css': '', 'skrypt.js': '' }, sheet: m2sheet, checks: m2checks, sol: m2sol, layout: [['header', 'nagłówkowy'], ['nav', 'nawigacyjny'], ['main', 'główny: sekcje kalkulator / cennik'], ['footer', 'stopka']] }
  ];
  m1checks.forEach(function (c) { c.fresh = true; });
  TR.MOCK.forEach(function (m) { m.manual = ['Utworzona baza z utf8_unicode_ci i import (zrzut import)', 'Zrzuty kw1–kw4: cały ekran, pasek zadań, format PNG', 'Folder z numerem PESEL zawiera wszystkie pliki i grafikę', 'Strona przetestowana w przeglądarce przez http://localhost/']; });
})(typeof window !== 'undefined' ? window : globalThis);
