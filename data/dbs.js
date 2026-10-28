/* Bazy ćwiczeniowe w stylu INF.03. Dane są fikcyjne.
   Kolumny: [nazwa, typ MySQL, flagi]  flagi: 'pk' = INT AUTO_INCREMENT PRIMARY KEY, 'null' = może być NULL
   extra = wiersze dopisywane w wariancie B (sprawdzanie, czy zapytanie jest „uniwersalne”). */
(function (root) {
  const TR = root.TR = root.TR || {};
  TR.DBS = {
    podroze: {
      title: 'Biuro podróży „Odkrywca”',
      tables: [
        { name: 'kraje', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(40)'], ['kontynent', 'VARCHAR(20)']],
          rows: [[1, 'Polska', 'Europa'], [2, 'Włochy', 'Europa'], [3, 'Hiszpania', 'Europa'], [4, 'Grecja', 'Europa'], [5, 'Islandia', 'Europa'], [6, 'Egipt', 'Afryka'], [7, 'Maroko', 'Afryka'], [8, 'Japonia', 'Azja']],
          extra: [[9, 'Norwegia', 'Europa'], [10, 'Tunezja', 'Afryka']] },
        { name: 'wycieczki', cols: [['id', 'INT', 'pk'], ['cel', 'VARCHAR(50)'], ['kraj_id', 'INT'], ['dataWyjazdu', 'DATE'], ['liczbaDni', 'INT'], ['cena', 'DECIMAL(8,2)'], ['dostepna', 'TINYINT(1)'], ['wyzywienie', 'VARCHAR(20)']],
          rows: [
            [1, 'Zakopane', 1, '2025-07-05', 4, 890, 1, 'śniadania'],
            [2, 'Gdańsk', 1, '2025-08-14', 3, 650, 1, 'śniadania'],
            [3, 'Rzym', 2, '2025-07-20', 5, 2150, 1, 'śniadania'],
            [4, 'Wenecja', 2, '2025-09-02', 4, 1890, 0, 'brak'],
            [5, 'Barcelona', 3, '2025-07-11', 7, 3200, 1, 'all inclusive'],
            [6, 'Teneryfa', 3, '2025-11-15', 10, 4590, 1, 'all inclusive'],
            [7, 'Kreta', 4, '2025-06-21', 8, 3780, 0, 'all inclusive'],
            [8, 'Ateny', 4, '2025-10-03', 5, 2490, 1, 'śniadania'],
            [9, 'Reykjavik', 5, '2025-08-01', 6, 5400, 1, 'brak'],
            [10, 'Hurghada', 6, '2025-12-27', 7, 3990, 1, 'all inclusive'],
            [11, 'Kair', 6, '2026-02-10', 5, 2980, 0, 'śniadania'],
            [12, 'Marrakesz', 7, '2025-10-18', 6, 3350, 1, 'śniadania'],
            [13, 'Tokio', 8, '2026-04-04', 9, 8900, 1, 'brak'],
            [14, 'Kraków', 1, '2025-07-26', 2, 420, 1, 'brak']],
          extra: [[15, 'Oslo', 9, '2025-07-15', 4, 2600, 1, 'śniadania'], [16, 'Malbork', 1, '2025-08-09', 1, 180, 0, 'brak']] },
        { name: 'zdjecia', cols: [['id', 'INT', 'pk'], ['nazwaPliku', 'VARCHAR(30)'], ['podpis', 'VARCHAR(60)'], ['wycieczka_id', 'INT']],
          rows: [[1, 'zakopane.jpg', 'Giewont o świcie', 1], [2, 'gdansk.jpg', 'Żuraw nad Motławą', 2], [3, 'rzym.jpg', 'Koloseum', 3], [4, 'wenecja.jpg', 'Gondole na Canal Grande', 4], [5, 'barcelona.jpg', 'Sagrada Família', 5], [6, 'teneryfa.jpg', 'Wulkan Teide', 6], [7, 'kreta.jpg', 'Plaża Balos', 7], [8, 'ateny.jpg', 'Akropol', 8], [9, 'reykjavik.jpg', 'Zorza polarna', 9], [10, 'hurghada.jpg', 'Rafa koralowa', 10], [11, 'tokio.jpg', 'Shibuya nocą', 13], [12, 'rzym2.jpg', 'Fontanna di Trevi', 3]],
          extra: [[13, 'oslo.jpg', 'Opera w Oslo', 15]] },
        { name: 'klienci', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['miasto', 'VARCHAR(30)'], ['rokUrodzenia', 'INT'], ['email', 'VARCHAR(50)']],
          rows: [[1, 'Anna', 'Kowalska', 'Wrocław', 1985, 'anna.k@poczta.pl'], [2, 'Jan', 'Nowak', 'Poznań', 1972, 'jan.nowak@poczta.pl'], [3, 'Katarzyna', 'Wiśniewska', 'Wrocław', 1999, 'kasia.w@poczta.pl'], [4, 'Piotr', 'Zieliński', 'Kraków', 2001, 'piotr.z@poczta.pl'], [5, 'Agnieszka', 'Lewandowska', 'Gdańsk', 1990, 'aga.l@poczta.pl'], [6, 'Marek', 'Wójcik', 'Wrocław', 1968, 'marek.w@poczta.pl'], [7, 'Julia', 'Kamińska', 'Opole', 2003, 'julia.k@poczta.pl'], [8, 'Tomasz', 'Dąbrowski', 'Poznań', 1995, 'tomek.d@poczta.pl'], [9, 'Aleksandra', 'Mazur', 'Kraków', 1988, 'ola.m@poczta.pl'], [10, 'Bartosz', 'Krawczyk', 'Wrocław', 2002, 'bartek.k@poczta.pl'], [11, 'Zofia', 'Pawlak', 'Opole', 1979, 'zosia.p@poczta.pl'], [12, 'Adam', 'Sikora', 'Gdańsk', 1993, 'adam.s@poczta.pl']],
          extra: [[13, 'Alicja', 'Baran', 'Wrocław', 2004, 'ala.b@poczta.pl'], [14, 'Kamil', 'Szymański', 'Łódź', 1981, 'kamil.s@poczta.pl']] },
        { name: 'rezerwacje', cols: [['id', 'INT', 'pk'], ['klient_id', 'INT'], ['wycieczka_id', 'INT'], ['liczbaOsob', 'INT'], ['dataRezerwacji', 'DATE'], ['zaplacone', 'TINYINT(1)']],
          rows: [[1, 1, 3, 2, '2025-03-02', 1], [2, 2, 5, 4, '2025-03-15', 1], [3, 3, 9, 1, '2025-04-01', 0], [4, 1, 7, 2, '2025-04-11', 1], [5, 4, 14, 3, '2025-05-05', 1], [6, 5, 10, 2, '2025-06-20', 0], [7, 6, 3, 2, '2025-05-18', 1], [8, 7, 2, 1, '2025-06-01', 1], [9, 8, 5, 2, '2025-06-03', 0], [10, 9, 12, 2, '2025-07-09', 1], [11, 2, 6, 3, '2025-07-21', 1], [12, 10, 1, 5, '2025-05-30', 1], [13, 11, 8, 2, '2025-08-02', 0], [14, 3, 13, 1, '2025-09-14', 1], [15, 12, 5, 2, '2025-06-25', 1], [16, 6, 1, 1, '2025-06-10', 0]],
          extra: [[17, 13, 15, 2, '2025-06-12', 1], [18, 14, 3, 1, '2025-06-13', 0]] }
      ]
    },

    sklep: {
      title: 'Sklep z grami „Kostka”',
      tables: [
        { name: 'kategorie', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(30)']],
          rows: [[1, 'planszowe'], [2, 'karciane'], [3, 'logiczne'], [4, 'puzzle'], [5, 'akcesoria']],
          extra: [[6, 'figurkowe']] },
        { name: 'produkty', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(50)'], ['kategoria_id', 'INT'], ['cena', 'DECIMAL(7,2)'], ['ilosc', 'INT'], ['promocja', 'TINYINT(1)'], ['plik', 'VARCHAR(30)'], ['minGraczy', 'INT'], ['maxGraczy', 'INT'], ['czasGry', 'INT'], ['opis', 'TEXT']],
          rows: [
            [1, 'Osadnicy z Wyspy', 1, 169.99, 12, 0, 'osadnicy.jpg', 3, 4, 90, 'Budujesz drogi i osady, handlujesz surowcami.'],
            [2, 'Pociągi przez Europę', 1, 189.00, 7, 1, 'pociagi.jpg', 2, 5, 60, 'Łączysz miasta trasami kolejowymi.'],
            [3, 'Szybkie Karty', 2, 29.99, 40, 1, 'karty.jpg', 2, 10, 20, 'Proste karty dla całej rodziny.'],
            [4, 'Pojedynek Magów', 2, 79.50, 15, 0, 'magowie.jpg', 2, 2, 30, 'Karciany pojedynek dwóch czarodziejów.'],
            [5, 'Kostka 3x3', 3, 39.00, 25, 0, 'kostka.jpg', 1, 1, 10, 'Klasyczna łamigłówka.'],
            [6, 'Wieża Hanoi', 3, 49.90, 9, 1, 'hanoi.jpg', 1, 1, 15, 'Drewniana łamigłówka z krążkami.'],
            [7, 'Mapa świata 1000', 4, 59.99, 6, 0, 'mapa.jpg', 1, 4, 180, 'Puzzle 1000 elementów.'],
            [8, 'Kraków nocą 500', 4, 44.99, 0, 0, 'krakow.jpg', 1, 2, 120, 'Puzzle 500 elementów.'],
            [9, 'Koszulki na karty', 5, 14.99, 100, 0, 'koszulki.jpg', 1, 1, 0, 'Opakowanie 100 sztuk.'],
            [10, 'Kości do gry 7 szt.', 5, 24.00, 30, 1, 'kosci.jpg', 1, 1, 0, 'Zestaw kości wielościennych.'],
            [11, 'Zamki i smoki', 1, 249.00, 3, 0, 'zamki.jpg', 2, 6, 120, 'Przygodowa gra z figurkami.'],
            [12, 'Kalambury', 2, 34.90, 18, 0, 'kalambury.jpg', 4, 12, 45, 'Imprezowe karty z hasłami.']],
          extra: [[13, 'Szachy turniejowe', 3, 129.00, 4, 0, 'szachy.jpg', 2, 2, 60, 'Drewniane szachy.'], [14, 'Statki na morzu', 1, 99.00, 0, 1, 'statki.jpg', 2, 2, 30, 'Klasyczna bitwa morska.']] },
        { name: 'klienci', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['miasto', 'VARCHAR(30)'], ['email', 'VARCHAR(50)']],
          rows: [[1, 'Michał', 'Grabowski', 'Wrocław', 'm.grabowski@poczta.pl'], [2, 'Natalia', 'Jabłońska', 'Legnica', 'natalia.j@poczta.pl'], [3, 'Paweł', 'Król', 'Wrocław', 'pawel.krol@poczta.pl'], [4, 'Weronika', 'Michalska', 'Opole', 'wera.m@poczta.pl'], [5, 'Jakub', 'Wróbel', 'Wałbrzych', 'kuba.w@poczta.pl'], [6, 'Oliwia', 'Zając', 'Wrocław', 'oliwia.z@poczta.pl'], [7, 'Szymon', 'Duda', 'Legnica', 'szymon.d@poczta.pl']],
          extra: [[8, 'Maja', 'Wieczorek', 'Opole', 'maja.w@poczta.pl']] },
        { name: 'zamowienia', cols: [['id', 'INT', 'pk'], ['klient_id', 'INT'], ['produkt_id', 'INT'], ['ilosc', 'INT'], ['dataZamowienia', 'DATE'], ['status', 'VARCHAR(20)']],
          rows: [[1, 1, 1, 1, '2025-11-03', 'wysłane'], [2, 1, 9, 2, '2025-11-03', 'wysłane'], [3, 2, 3, 3, '2025-11-05', 'wysłane'], [4, 3, 11, 1, '2025-11-06', 'nowe'], [5, 4, 5, 2, '2025-11-06', 'wysłane'], [6, 5, 2, 1, '2025-11-07', 'anulowane'], [7, 6, 12, 1, '2025-11-08', 'nowe'], [8, 2, 10, 4, '2025-11-08', 'nowe'], [9, 7, 4, 2, '2025-11-10', 'wysłane'], [10, 3, 3, 1, '2025-11-10', 'wysłane'], [11, 6, 7, 1, '2025-11-12', 'nowe'], [12, 1, 6, 1, '2025-11-12', 'nowe']],
          extra: [[13, 8, 13, 1, '2025-11-13', 'nowe'], [14, 4, 3, 2, '2025-11-13', 'wysłane']] }
      ]
    },

    biblioteka: {
      title: 'Biblioteka szkolna',
      tables: [
        { name: 'autorzy', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['narodowosc', 'VARCHAR(30)']],
          rows: [[1, 'Henryk', 'Sienkiewicz', 'polska'], [2, 'Adam', 'Mickiewicz', 'polska'], [3, 'Bolesław', 'Prus', 'polska'], [4, 'Juliusz', 'Słowacki', 'polska'], [5, 'William', 'Szekspir', 'angielska'], [6, 'Wisława', 'Szymborska', 'polska'], [7, 'Jan', 'Kochanowski', 'polska'], [8, 'Albert', 'Camus', 'francuska']],
          extra: [[9, 'Stanisław', 'Wyspiański', 'polska']] },
        { name: 'ksiazki', cols: [['id', 'INT', 'pk'], ['tytul', 'VARCHAR(60)'], ['autor_id', 'INT'], ['gatunek', 'VARCHAR(20)'], ['rokWydania', 'INT'], ['liczbaStron', 'INT'], ['kod', 'VARCHAR(10)']],
          rows: [[1, 'Krzyżacy', 1, 'epika', 1900, 780, 'E-101'], [2, 'Quo vadis', 1, 'epika', 1896, 620, 'E-102'], [3, 'Pan Tadeusz', 2, 'epika', 1834, 410, 'E-103'], [4, 'Dziady cz. III', 2, 'dramat', 1832, 180, 'D-201'], [5, 'Lalka', 3, 'epika', 1890, 690, 'E-104'], [6, 'Kordian', 4, 'dramat', 1834, 160, 'D-202'], [7, 'Makbet', 5, 'dramat', 1623, 150, 'D-203'], [8, 'Romeo i Julia', 5, 'dramat', 1597, 170, 'D-204'], [9, 'Wiersze wybrane', 6, 'liryka', 2000, 220, 'L-301'], [10, 'Treny', 7, 'liryka', 1580, 60, 'L-302'], [11, 'Dżuma', 8, 'epika', 1947, 280, 'E-105'], [12, 'Sonety krymskie', 2, 'liryka', 1826, 70, 'L-303'], [13, 'Potop', 1, 'epika', 1886, 980, 'E-106']],
          extra: [[14, 'Wesele', 9, 'dramat', 1901, 190, 'D-205'], [15, 'Faraon', 3, 'epika', 1897, 700, 'E-107']] },
        { name: 'czytelnicy', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['klasa', 'VARCHAR(5)'], ['kod', 'INT']],
          rows: [[1, 'Ewa', 'Kowalczyk', '2TI', 145321], [2, 'Marcin', 'Szewczyk', '3TI', 145322], [3, 'Lena', 'Ostrowska', '2TE', 145323], [4, 'Igor', 'Baranowski', '4TI', 145324], [5, 'Hanna', 'Kubiak', '1TI', 145325], [6, 'Oskar', 'Tomaszewski', '3TE', 145326], [7, 'Nikola', 'Górska', '5TI', 145327]],
          extra: [[8, 'Filip', 'Adamski', '2TI', 145328]] },
        { name: 'wypozyczenia', cols: [['id', 'INT', 'pk'], ['ksiazka_id', 'INT'], ['czytelnik_id', 'INT'], ['dataWypozyczenia', 'DATE'], ['dataOddania', 'DATE', 'null']],
          rows: [[1, 1, 1, '2025-09-08', '2025-09-29'], [2, 4, 2, '2025-09-10', null], [3, 9, 1, '2025-09-15', '2025-10-01'], [4, 5, 3, '2025-09-22', null], [5, 7, 4, '2025-10-01', '2025-10-14'], [6, 3, 2, '2025-10-03', '2025-10-30'], [7, 10, 5, '2025-10-06', null], [8, 2, 2, '2025-10-13', null], [9, 11, 7, '2025-10-20', '2025-11-03'], [10, 6, 5, '2025-10-21', null], [11, 1, 7, '2025-11-04', null], [12, 8, 3, '2025-11-05', '2025-11-12']],
          extra: [[13, 14, 8, '2025-11-06', null], [14, 15, 1, '2025-11-07', null]] }
      ]
    },

    firma: {
      title: 'Firma „Kadra” – pracownicy',
      tables: [
        { name: 'stanowiska', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(40)'], ['dzial', 'VARCHAR(30)']],
          rows: [[1, 'programista', 'IT'], [2, 'administrator', 'IT'], [3, 'grafik', 'marketing'], [4, 'księgowy', 'finanse'], [5, 'handlowiec', 'sprzedaż'], [6, 'kierownik', 'zarząd']],
          extra: [[7, 'tester', 'IT']] },
        { name: 'pracownicy', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['stanowisko_id', 'INT'], ['pensja', 'DECIMAL(8,2)'], ['staz', 'INT'], ['dataUrodzenia', 'DATE'], ['miasto', 'VARCHAR(30)']],
          rows: [[1, 'Krzysztof', 'Adamczyk', 1, 9800, 12, '1985-04-12', 'Wrocław'], [2, 'Monika', 'Bielecka', 1, 8700, 6, '1994-09-30', 'Wrocław'], [3, 'Łukasz', 'Czarnecki', 2, 7600, 9, '1989-01-17', 'Legnica'], [4, 'Dorota', 'Dziedzic', 3, 6400, 3, '1998-06-05', 'Wrocław'], [5, 'Rafał', 'Ekiert', 4, 7200, 21, '1972-11-23', 'Oława'], [6, 'Iwona', 'Fijałkowska', 4, 6900, 15, '1980-03-08', 'Wrocław'], [7, 'Grzegorz', 'Górecki', 5, 5800, 2, '2000-07-19', 'Legnica'], [8, 'Beata', 'Hajduk', 5, 6100, 7, '1991-12-01', 'Oława'], [9, 'Damian', 'Iwański', 6, 14500, 18, '1978-05-27', 'Wrocław'], [10, 'Ewelina', 'Jasińska', 1, 11200, 10, '1987-08-14', 'Wrocław'], [11, 'Wojciech', 'Kalinowski', 2, 7600, 4, '1996-02-29', 'Legnica'], [12, 'Patrycja', 'Lis', 3, 5800, 1, '2002-10-10', 'Wrocław']],
          extra: [[13, 'Sebastian', 'Mróz', 7, 6200, 5, '1997-04-04', 'Oława'], [14, 'Karolina', 'Nowicka', 1, 14500, 20, '1975-01-01', 'Wrocław']] },
        { name: 'szkolenia', cols: [['id', 'INT', 'pk'], ['temat', 'VARCHAR(60)'], ['data', 'DATE'], ['pracownik_id', 'INT'], ['koszt', 'DECIMAL(7,2)']],
          rows: [[1, 'Bezpieczeństwo sieci', '2025-09-15', 3, 1200], [2, 'React od podstaw', '2025-09-22', 2, 1800], [3, 'Excel dla finansów', '2025-10-06', 5, 650], [4, 'Negocjacje w sprzedaży', '2025-10-13', 7, 900], [5, 'Docker w praktyce', '2025-10-20', 1, 1500], [6, 'Projektowanie UI', '2025-11-03', 4, 1100], [7, 'Bezpieczeństwo sieci', '2025-11-17', 11, 1200], [8, 'Excel dla finansów', '2025-11-24', 6, 650]],
          extra: [[9, 'Testy automatyczne', '2025-12-01', 13, 1300]] }
      ]
    },

    pogoda: {
      title: 'Stacja meteorologiczna',
      tables: [
        { name: 'miasta', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(40)'], ['kraj', 'VARCHAR(40)']],
          rows: [[1, 'Warszawa', 'Polska'], [2, 'Rzym', 'Włochy'], [3, 'Oslo', 'Norwegia'], [4, 'Ateny', 'Grecja'], [5, 'Londyn', 'Wielka Brytania'], [6, 'Madryt', 'Hiszpania']],
          extra: [[7, 'Kair', 'Egipt']] },
        { name: 'pomiary', cols: [['id', 'INT', 'pk'], ['miasto_id', 'INT'], ['miesiac', 'INT'], ['temperatura', 'INT']],
          rows: [[1, 1, 1, -2], [2, 2, 1, 12], [3, 3, 1, -5], [4, 4, 1, 13], [5, 5, 1, 8], [6, 6, 1, 11], [7, 1, 7, 24], [8, 2, 7, 31], [9, 3, 7, 17], [10, 4, 7, 33], [11, 5, 7, 14], [12, 6, 7, 32]],
          extra: [[13, 7, 7, 36], [14, 7, 1, 20]] }
      ]
    },

    schronisko: {
      title: 'Schronisko „Azyl” (arkusz próbny 1)',
      tables: [
        { name: 'gatunki', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(20)']],
          rows: [[1, 'pies'], [2, 'kot'], [3, 'królik']], extra: [[4, 'świnka morska']] },
        { name: 'zwierzeta', cols: [['id', 'INT', 'pk'], ['imie', 'VARCHAR(30)'], ['gatunek_id', 'INT'], ['wiek', 'INT'], ['plec', 'VARCHAR(10)'], ['zdjecie', 'VARCHAR(30)'], ['adopcja', 'TINYINT(1)'], ['dataPrzyjecia', 'DATE']],
          rows: [[1, 'Burek', 1, 5, 'samiec', 'burek.jpg', 0, '2025-11-04'], [2, 'Saba', 1, 3, 'samica', 'saba.jpg', 0, '2026-01-15'], [3, 'Luna', 1, 1, 'samica', 'luna.jpg', 0, '2026-03-02'], [4, 'Reksio', 1, 8, 'samiec', 'reksio.jpg', 1, '2024-09-20'], [5, 'Mruczek', 2, 2, 'samiec', 'mruczek.jpg', 0, '2026-02-11'], [6, 'Kicia', 2, 6, 'samica', 'kicia.jpg', 0, '2025-07-30'], [7, 'Filemon', 2, 4, 'samiec', 'filemon.jpg', 1, '2025-05-12'], [8, 'Puszek', 3, 1, 'samiec', 'puszek.jpg', 0, '2026-04-18'], [9, 'Śnieżka', 3, 2, 'samica', 'sniezka.jpg', 0, '2025-12-01'], [10, 'Kajtek', 1, 6, 'samiec', 'kajtek.jpg', 0, '2026-05-09']],
          extra: [[11, 'Max', 1, 2, 'samiec', 'max.jpg', 0, '2026-06-01'], [12, 'Tola', 2, 1, 'samica', 'tola.jpg', 0, '2024-12-24']] },
        { name: 'adopcje', cols: [['id', 'INT', 'pk'], ['zwierze_id', 'INT'], ['imie', 'VARCHAR(30)'], ['nazwisko', 'VARCHAR(40)'], ['data', 'DATE']],
          rows: [[1, 4, 'Anna', 'Nowak', '2025-01-10'], [2, 7, 'Piotr', 'Lis', '2025-08-03']], extra: [] }
      ]
    },

    remonty: {
      title: 'Firmy remontowe (arkusz próbny 2)',
      tables: [
        { name: 'firmy', cols: [['id', 'INT', 'pk'], ['nazwa', 'VARCHAR(40)'], ['miasto', 'VARCHAR(30)'], ['liczbaPracownikow', 'INT']],
          rows: [[1, 'Remix', 'Wrocław', 12], [2, 'Malbud', 'Opole', 5], [3, 'Dom-Art', 'Wrocław', 30], [4, 'Fachowiec', 'Legnica', 8], [5, 'Kolor Plus', 'Wrocław', 45], [6, 'Glazurex', 'Opole', 22]],
          extra: [[7, 'Nowy Dom', 'Wrocław', 60], [8, 'Elbud', 'Legnica', 3]] },
        { name: 'uslugi', cols: [['id', 'INT', 'pk'], ['rodzaj', 'VARCHAR(30)'], ['cenaZaM2', 'INT']],
          rows: [[1, 'malowanie', 18], [2, 'panele', 35], [3, 'glazura', 90], [4, 'gładzie', 25]], extra: [[5, 'tapetowanie', 30]] },
        { name: 'zlecenia', cols: [['id', 'INT', 'pk'], ['firma_id', 'INT'], ['usluga_id', 'INT'], ['metraz', 'INT'], ['klient', 'VARCHAR(40)'], ['data', 'DATE']],
          rows: [[1, 1, 1, 60, 'Kowalscy', '2026-03-02'], [2, 3, 3, 24, 'Nowak', '2026-03-05'], [3, 5, 2, 75, 'Lis', '2026-03-09'], [4, 2, 1, 120, 'Wiśniewska', '2026-03-12'], [5, 6, 3, 40, 'Mazur', '2026-03-18'], [6, 4, 4, 55, 'Zając', '2026-03-21'], [7, 5, 1, 30, 'Król', '2026-03-25'], [8, 3, 2, 90, 'Duda', '2026-04-01']],
          extra: [[9, 7, 5, 66, 'Sikora', '2026-04-04'], [10, 8, 1, 45, 'Baran', '2026-04-06']] }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
