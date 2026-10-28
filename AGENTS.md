# Pracownia 5TI4 – instrukcja dla agenta (Codex)

Statyczna strona (vanilla JS, routing po hashu `#/inf/...`) do nauki INF.03 (część praktyczna) i później matury.
Uczeń: technikum, egzamin INF.03 styczeń 2027, matura maj 2027 (mat. podst.+rozsz., ang. podst.+rozsz., polski podst.).
Zasada treści: **100% praktyka, 0 zbędnej teorii**, zadania wzorowane na prawdziwych arkuszach CKE. Treści własne – nie kopiować płatnych kursów ani cudzego kodu rozwiązań (linkować). Zadania CKE podpisywać źródłem.

## Uruchomienie
```
python3 -m http.server 8765        # w katalogu projektu
# http://localhost:8765/index.html
powershell -ExecutionPolicy Bypass -File tools\serve.ps1   # Windows bez Pythona (port z $env:PORT albo 8765)
```
Bez bundlera, bez npm w aplikacji. sql.js 1.10.3 jest w `js/vendor/` (wasm + fallback asm.js).
Postęp ucznia: localStorage, klucz `pracownia5ti4`, kształt `{v, done, code, set, mock}`.

## Architektura (kolejność skryptów w index.html ma znaczenie)
- `js/editor.js` – edytor z podświetlaniem (`TR.Editor`, `TR.highlight`).
- `js/sqlengine.js` – `TR.sql`: sql.js + warstwa zgodności z MySQL (funkcje MySQL, `/` → `* 1.0 /`, CURDATE/NOW z zamrożonym zegarem `E.clock`, ziarniste RAND `E.rng`, CREATE USER/GRANT symulowane, ALTER ADD/AFTER/CHANGE/MODIFY, AUTO_INCREMENT, komunikaty błędów jak MySQL, import zrzutów phpMyAdmin `importDump`).
- `js/sqlcheck.js` – `TR.sqlcheck.check(task, userText, open)`: SELECT porównuje wynik (dowolna kolejność kolumn; `ordered`, `aliases`), druga baza „B” z dodatkowymi rekordami wyłapuje zapytania niuniwersalne; DML/DDL porównuje snapshot (tabele, kolumny, wiersze, użytkownicy, granty); `must` = reguły tekstowe; `alts` = alternatywne wzorce.
- `js/miniphp.js` – interpreter podzbioru PHP 8 (lexer → Pratt parser → interpreter), mysqli (proceduralnie i obiektowo), sesje, header Location/Refresh, zapis plików, ostrzeżenia jak PHP 8.2. `TR.php.run({...})`.
- `data/dbs.js` + `js/dbgen.js` – własne bazy (podroze, sklep, biblioteka, firma, pogoda, schronisko, remonty); `TR.dbgen.open(name, variant)`, `mysql(name)` = zrzut .sql do XAMPP.
- `js/lab.js` – wirtualny serwer w iframe (srcdoc, wstrzyknięty mostek: konsola, błędy, alert, linki, formularze). `TR.makeTester` (helpery T.$, T.css, T.click, T.submit, T.query…), `TR.runChecks(lab, frame, checks)` – przed każdym sprawdzeniem przeładowanie strony (chyba że `keep`), `fresh: true` = świeża baza.
- `js/checks.js` – gotowe sprawdzenia `TR.C` (doctype, lang, charset, title, linkCss, css, hover, leftOf, above, footerPesel, php.connect/close/noErrors…).
- `data/sql-tasks.js` – 57 własnych zadań SQL w 7 grupach, pole `f` = częstość (3 pewniak, 2 częste, 1 zdarza się).
- `data/real-index.js` + `data/real/<key>.js` – 117 prawdziwych arkuszy EE.09/INF.03 (2019–2026), 478 zapytań, 255 uruchamialnych (zweryfikowane). Generowane przez `tools/build_real.js` (dane źródłowe nie są w repo).
- `data/lab-html.js`, `lab-js.js`, `lab-php.js` – zadania h01–h19, j01–j19, p01–p16 (wszystkie zweryfikowane).
- `js/gfx.js` – ćwiczenia z grafiki g1–g7 (skalowanie, przezroczystość, kadrowanie, szarość, GIF, lustro, logo) z analizą wgranego pliku.
- `data/mocks.js` + `js/mock.js` – 2 arkusze próbne (m1 Schronisko – PHP, m2 Remonty – JS), licznik 150 min, ocena R.1–R.5, próg 75%.
- `data/guides.js` (statystyki, plan, ściąga), `data/sheets.js` (120 arkuszy z tagami), `js/app.js` (router, widoki, `TR.labWorkspace`, `TR.ctx`).
- `css/app.css` – tokeny jasny/ciemny; mobile: zakładki Treść/Kod/Podgląd (`.mob-tabs`).
- `lab/` – obrazki do zadań (generowane `tools/gen_images.py tools/images.txt`).

## Testy (wymagają serwera na :8765, Playwright z Chromium; PHP 8.3 CLI do testów interpretera)
- `node tools/test_real.js` – zapytania z prawdziwych arkuszy (oczekiwane: 255 ok, 130/130 negatywnych wykrytych).
- `node tools/test_lab.js [html|js|php|id]` – każde rozwiązanie wzorcowe przechodzi wszystkie sprawdzenia.
- `node tools/test_mock.js` – arkusze próbne: wzorzec = komplet, pusty = 0, 22 celowe błędy wykryte.
- `node tools/run_phptests.js`, `node tools/run_phpsol.js` – MiniPHP vs prawdziwe PHP (shim `tools/shim.php`, `php -n` + pdo_sqlite, mbstring).
- `node tools/qa.js <katalog_na_zrzuty>` – przejście wszystkich widoków desktop 1400 px i telefon 390 px, błędy konsoli, poziomy scroll.

## Status
Zrobione: SQL (własne + prawdziwe), HTML/CSS, JS, PHP, grafika, arkusze próbne, ściąga, mapa egzaminu, eksport/import postępu.
Ograniczenie: bazy do arkuszy 2025–2026 są w archiwach .7z, których nie udało się rozpakować – te arkusze działają w trybie „bez bazy” (samosprawdzanie). Można je dołożyć: rozpakować .7z, przepuścić przez `tools/build_real.js`.

## Do zrobienia (kolejność)
1. ~~Przegląd widoków~~ – zrobione 27.10.2026: 22 widoki × (desktop + telefon) bez błędów JS i bez poziomego scrolla (`tools/qa.js`, `tools/qa_mock_mobile.js`). Jedyny błąd konsoli to brak dostępu do Google Fonts w piaskownicy testowej.
2. Wdrożenie na GitHub Pages (repo publiczne lub Pages z prywatnego, folder główny = ten katalog; `tools/` można zostawić).
   - Przygotowane 28.10.2026: `.nojekyll`, `.gitignore` (bez `__pycache__`), `README.md`, wszystkie ścieżki względne (działa pod `/nazwa-repo/`). Publikację robi uczeń przez GitHub Desktop (na komputerze nie ma gita). Po wdrożeniu wpisać tu adres strony.
3. Bazy do arkuszy 2025–2026 (patrz wyżej).
4. Moduł matematyki: zadania z prawdziwych matur CKE od 2015, najpierw podstawa, potem rozszerzenie; pogrupowane po działach, z częstością („pewniaki” powtarzające się co roku), sprawdzanie odpowiedzi, zero zbędnej teorii. Podpisywać źródło (CKE, rok, nr zadania).
   - Zaczęte 27.10.2026: `data/mat.js` (`TR.MATG` – 8 działów, `TR.MAT` – 28 zadań z PP maj 2024 i maj 2025, odpowiedzi przeliczone ręcznie), `js/mat.js` (`TR.viewMat`, `TR.matCheck`: zamknięte A–D + krótka odpowiedź z normalizacją przecinka/ułamka). Sprawdzone 28.10.2026 w przeglądarce: każda poprawna odpowiedź przechodzi, zła nie; brak błędów konsoli; telefon 375 px bez poziomego scrolla; postęp zapisuje się w localStorage.
   - Dalej: test `tools/test_mat.js` (każde `a`/`ans[0]` przechodzi `TR.matCheck`, zła litera nie), PP maj 2023 (treść w szaloneliczby.pl jako źródło pomocnicze, weryfikować z PDF CKE), zadania z rysunkami (wykres SVG generowany z wzoru), formuła 2015 (2015–2022), rozszerzenie, kafel na stronie startowej.
5. Później: angielski i polski.

## Konwencje
- Teksty UI po polsku. Komunikaty błędów mówią uczniowi, co poprawić.
- Każde nowe zadanie: wzorcowe rozwiązanie + sprawdzenia + test w `tools/`, który potwierdza, że wzorzec przechodzi, a typowe błędy są wykrywane.
- Nie dodawać zależności z CDN poza Google Fonts.
