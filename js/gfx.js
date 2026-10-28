/* Grafika: przewodnik GIMP + ćwiczenia z automatycznym sprawdzeniem wgranego pliku */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};

  TR.GFX = [
    { id: 'g1', f: 3, t: 'Skalowanie z zachowaniem proporcji', src: 'wycieczka.jpg', out: 'wycieczka-mala.jpg',
      q: 'Plik **wycieczka.jpg** (1200 × 800 px) należy przeskalować **z zachowaniem proporcji** tak, aby jego szerokość wynosiła **300 px**. Zapisz go pod nazwą **wycieczka-mala** w formacie **JPEG**.',
      steps: ['**Plik → Otwórz…** i wybierz wycieczka.jpg.', '**Obraz → Skaluj obraz…**', 'Sprawdź, że ikona łańcucha przy szerokości i wysokości jest **połączona** – wtedy wysokość policzy się sama.', 'Wpisz szerokość **300** (jednostka px) i kliknij **Skaluj**. Wysokość powinna wynosić 200.', '**Plik → Wyeksportuj jako…** (Shift+Ctrl+E), nazwa `wycieczka-mala.jpg`, **Eksportuj**, potem jeszcze raz **Eksportuj** w oknie jakości.'],
      want: { format: 'jpeg', w: 300, h: 200, ratioOf: [1200, 800] } },
    { id: 'g2', f: 3, t: 'Przezroczyste tło (PNG)', src: 'logo-bialy.png', out: 'logo.png',
      q: 'Na obrazie **logo-bialy.png** białe tło należy zamienić na **przezroczyste**. Wymiary bez zmian (400 × 200 px). Zapisz jako **logo** w formacie umożliwiającym zapis przezroczystości.',
      steps: ['Otwórz logo-bialy.png.', '**Warstwa → Przezroczystość → Dodaj kanał alfa** (jeśli opcja jest szara – kanał już jest).', 'Najszybciej: **Kolory → Kolor na alfę…** – kolor biały → **OK**. Albo: narzędzie **Zaznaczanie według koloru** (Shift+O), klik w białe tło, klawisz **Delete**, potem **Zaznaczenie → Nic**.', 'Tło ma wyglądać jak szachownica – to znaczy, że jest przezroczyste.', '**Plik → Wyeksportuj jako…**, nazwa `logo.png` (JPEG nie zapisuje przezroczystości!), **Eksportuj**.'],
      want: { format: 'png', w: 400, h: 200, transparentCorners: true, opaqueMin: 0.05 } },
    { id: 'g3', f: 2, t: 'Kadrowanie do kwadratu', src: 'kwiat.jpg', out: 'kwiat-kwadrat.jpg',
      q: 'Plik **kwiat.jpg** (900 × 600 px) należy **przyciąć (wykadrować) do proporcji 1:1**, tak aby kwiat był w środku, a potem przeskalować do **250 × 250 px**. Zapisz jako **kwiat-kwadrat** w formacie **JPEG**.',
      steps: ['Otwórz kwiat.jpg i wybierz narzędzie **Kadrowanie** (Shift+C).', 'W opcjach narzędzia zaznacz **Stałe: Proporcje** i wpisz **1:1**.', 'Zaznacz kwadrat na środku obrazu (cała wysokość) i naciśnij **Enter**.', '**Obraz → Skaluj obraz…** → 250 × 250 → **Skaluj**.', '**Plik → Wyeksportuj jako…** → `kwiat-kwadrat.jpg`.'],
      want: { format: 'jpeg', w: 250, h: 250, centerLike: true } },
    { id: 'g4', f: 2, t: 'Odcienie szarości i rozmiar bez proporcji', src: 'dom.jpg', out: 'dom-szary.jpg',
      q: 'Plik **dom.jpg** (640 × 480 px) należy przeskalować **bez zachowania proporcji** do wymiarów **300 × 300 px** oraz zapisać **w odcieniach szarości** w formacie **JPEG** pod nazwą **dom-szary** (jak w arkuszu INF.03 ze stycznia 2023).',
      steps: ['Otwórz dom.jpg.', '**Obraz → Skaluj obraz…**, kliknij ikonę łańcucha, żeby go **rozłączyć**, wpisz 300 i 300 → **Skaluj**.', '**Kolory → Odbarwianie → Odbarwianie…** → **OK** (albo **Obraz → Tryb → Skala szarości**).', '**Plik → Wyeksportuj jako…** → `dom-szary.jpg`.'],
      want: { format: 'jpeg', w: 300, h: 300, gray: true } },
    { id: 'g5', f: 1, t: 'Animacja GIF z dwóch klatek', src: 'baner1.png', src2: 'baner2.png', out: 'animacja.gif',
      q: 'Z obrazów **baner1.png** i **baner2.png** (1000 × 200 px) przygotuj animację, w której banery wyświetlają się **na zmianę**, z **opóźnieniem 3000 ms** między klatkami, w nieskończonej pętli. Nazwa pliku: **animacja.gif** (jak w arkuszach ze stycznia 2024).',
      steps: ['**Plik → Otwórz jako warstwy…** (Ctrl+Alt+O), zaznacz oba pliki (Ctrl+klik) → **Otwórz**. Każda warstwa to jedna klatka.', '**Plik → Wyeksportuj jako…** → nazwa `animacja.gif` → **Eksportuj**.', 'W oknie GIF zaznacz **Jako animację** i **Pętla nieskończona**, wpisz **Opóźnienie między klatkami: 3000** ms, zaznacz **Użyj opóźnienia dla wszystkich klatek**.', 'Na egzaminie zrób zrzut ekranu tego okna z wpisanym opóźnieniem (np. `klatki.jpg`) – to osobny punkt.', '**Eksportuj**.'],
      want: { format: 'gif', w: 1000, h: 200, frames: 2, delay: 3000 } },
    { id: 'g6', f: 1, t: 'Lustrzane odbicie', src: 'strzalka.png', out: 'strzalka2.png',
      q: 'Utwórz obraz **strzalka2.png**, który jest **lustrzanym odbiciem względem osi pionowej** pliku strzalka.png (strzałka ma wskazywać w lewo). Rozmiar i przezroczystość bez zmian.',
      steps: ['Otwórz strzalka.png.', '**Obraz → Przekształć → Odbij poziomo**.', '**Plik → Wyeksportuj jako…** → `strzalka2.png`.'],
      want: { format: 'png', w: 300, h: 300, mirrorOf: 'strzalka.png', transparentCorners: true } },
    { id: 'g7', f: 1, t: 'Logo z literą na przezroczystym tle', src: null, out: 'logo-m.png',
      q: 'Utwórz logo: obraz **100 × 100 px** z **przezroczystym tłem**, na którym litera **M** w kolorze **czerwonym** (dowolna czcionka szeryfowa) wypełnia prawie cały obraz. Zapisz jako **logo-m.png** (jak w arkuszu ze stycznia 2025).',
      steps: ['**Plik → Nowy…** → 100 × 100 px → rozwiń **Opcje zaawansowane** → **Wypełnienie: Przezroczystość** → OK.', 'Narzędzie **Tekst** (T): czcionka szeryfowa (np. Serif Bold), rozmiar ok. 100 px, kolor czerwony (#FF0000). Kliknij na obrazie i wpisz **M**.', 'Ustaw literę na środku narzędziem **Wyrównanie** albo **Przesunięcie** (M).', '**Obraz → Spłaszcz obraz** NIE używaj (zabiera przezroczystość). Od razu **Plik → Wyeksportuj jako…** → `logo-m.png`.'],
      want: { format: 'png', w: 100, h: 100, transparentCorners: true, dominant: 'red', opaqueMin: 0.15 } }
  ];

  /* ---------- analiza pliku ---------- */
  function fmtOf(b) {
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'png';
    if (b[0] === 0xFF && b[1] === 0xD8) return 'jpeg';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
    if (b[0] === 0x42 && b[1] === 0x4D) return 'bmp';
    if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
    return 'nieznany';
  }
  function gifInfo(b) {
    // liczy klatki i opóźnienia (Graphic Control Extension)
    let i = 6; const w = b[i] | (b[i + 1] << 8), h = b[i + 2] | (b[i + 3] << 8); const packed = b[i + 4]; i += 7;
    if (packed & 0x80) i += 3 * (1 << ((packed & 7) + 1));
    let frames = 0; const delays = []; let loop = false; let pendingDelay = 0;
    while (i < b.length) {
      const c = b[i];
      if (c === 0x21) {
        const label = b[i + 1]; i += 2;
        if (label === 0xF9) { pendingDelay = (b[i + 2] | (b[i + 3] << 8)) * 10; }
        if (label === 0xFF) { const id = String.fromCharCode.apply(null, Array.from(b.slice(i + 1, i + 12))); if (/NETSCAPE2\.0/.test(id)) loop = true; }
        while (i < b.length && b[i] !== 0) i += b[i] + 1;
        i++;
      } else if (c === 0x2C) {
        frames++; delays.push(pendingDelay); pendingDelay = 0;
        const p = b[i + 9]; i += 10; if (p & 0x80) i += 3 * (1 << ((p & 7) + 1));
        i++; while (i < b.length && b[i] !== 0) i += b[i] + 1; i++;
      } else if (c === 0x3B) break; else i++;
    }
    return { w: w, h: h, frames: frames, delays: delays, loop: loop };
  }
  function loadImg(src) { return new Promise(function (res, rej) { const im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('Nie da się odczytać obrazu')); }; im.src = src; }); }
  function pixels(im, w, h) { const c = document.createElement('canvas'); c.width = w || im.naturalWidth; c.height = h || im.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height); return x.getImageData(0, 0, c.width, c.height).data; }

  async function analyse(file, task) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const fmt = fmtOf(buf);
    const url = URL.createObjectURL(file);
    const res = [];
    const want = task.want;
    const name = file.name;
    const add = function (ok, d, msg) { res.push({ ok: ok, d: d, msg: ok ? '' : msg }); };
    add(fmt === want.format, 'Format pliku: ' + want.format.toUpperCase(), 'Plik jest w formacie ' + fmt.toUpperCase() + (want.format === 'png' && fmt === 'jpeg' ? ' – JPEG nie ma przezroczystości, eksportuj jako .png' : '') + '. Zmiana rozszerzenia w nazwie nie zmienia formatu – użyj „Wyeksportuj jako”.');
    add(name.replace(/\.[^.]+$/, '').toLowerCase() === task.out.replace(/\.[^.]+$/, ''), 'Nazwa pliku: ' + task.out, 'Plik nazywa się „' + name + '”, a ma „' + task.out + '”');
    let im;
    try { im = await loadImg(url); } catch (e) { add(false, 'Obraz da się otworzyć', e.message); return { res: res, url: url }; }
    const W = im.naturalWidth, H = im.naturalHeight;
    add(W === want.w && H === want.h, 'Wymiary ' + want.w + ' × ' + want.h + ' px', 'Twój obraz ma ' + W + ' × ' + H + ' px');
    if (want.ratioOf) { const r1 = want.ratioOf[0] / want.ratioOf[1], r2 = W / H; add(Math.abs(r1 - r2) < 0.02, 'Zachowane proporcje', 'Proporcje się zmieniły (' + (r2).toFixed(3) + ' zamiast ' + r1.toFixed(3) + ') – łańcuch przy skalowaniu musi być połączony'); }
    const px = pixels(im);
    const a = function (x, y) { return px[(y * W + x) * 4 + 3]; };
    if (want.transparentCorners) {
      const corners = [a(0, 0), a(W - 1, 0), a(0, H - 1), a(W - 1, H - 1)];
      add(corners.every(function (v) { return v < 20; }), 'Tło przezroczyste (narożniki obrazu)', 'Narożniki nie są przezroczyste (kanał alfa = ' + corners.join(', ') + '). Dodaj kanał alfa i usuń tło.');
    }
    let opaque = 0, gray = true, red = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 200) { opaque++; if (px[i] > 170 && px[i + 1] < 90 && px[i + 2] < 90) red++; }
      if (Math.abs(px[i] - px[i + 1]) > 6 || Math.abs(px[i + 1] - px[i + 2]) > 6) gray = false;
    }
    const total = W * H;
    if (want.opaqueMin) add(opaque / total >= want.opaqueMin, 'Na obrazie jest rysunek (nie jest pusty)', 'Obraz jest prawie cały przezroczysty');
    if (want.gray) add(gray, 'Obraz w odcieniach szarości', 'W obrazie są kolory – użyj Kolory → Odbarwianie');
    if (want.dominant === 'red') add(red / Math.max(1, opaque) > 0.6, 'Litera w kolorze czerwonym', 'Niewidoczne/za mało czerwonych pikseli – kolor tekstu #FF0000');
    if (want.centerLike && task.src) {
      // porównanie ze środkowym kwadratem źródła
      const src = await loadImg('lab/gfx/' + task.src);
      const sw = src.naturalWidth, sh = src.naturalHeight, s = Math.min(sw, sh);
      const c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d'); x.drawImage(src, (sw - s) / 2, (sh - s) / 2, s, s, 0, 0, 32, 32);
      const a1 = x.getImageData(0, 0, 32, 32).data, a2 = pixels(im, 32, 32);
      let d = 0; for (let i = 0; i < a1.length; i += 4) d += Math.abs(a1[i] - a2[i]) + Math.abs(a1[i + 1] - a2[i + 1]) + Math.abs(a1[i + 2] - a2[i + 2]);
      d /= (32 * 32 * 3);
      add(d < 30, 'Kadr ze środka obrazu (kwiat w centrum)', 'Wycięty fragment nie pokrywa się ze środkiem zdjęcia (średnia różnica ' + d.toFixed(0) + ')');
    }
    if (want.mirrorOf) {
      const src = await loadImg('lab/gfx/' + want.mirrorOf);
      const c = document.createElement('canvas'); c.width = 48; c.height = 48; const x = c.getContext('2d'); x.translate(48, 0); x.scale(-1, 1); x.drawImage(src, 0, 0, 48, 48);
      const m = x.getImageData(0, 0, 48, 48).data, u = pixels(im, 48, 48);
      let d = 0, d0 = 0;
      const c2 = document.createElement('canvas'); c2.width = 48; c2.height = 48; const x2 = c2.getContext('2d'); x2.drawImage(src, 0, 0, 48, 48); const o = x2.getImageData(0, 0, 48, 48).data;
      for (let i = 0; i < m.length; i += 4) { d += Math.abs(m[i + 3] - u[i + 3]); d0 += Math.abs(o[i + 3] - u[i + 3]); }
      add(d < d0 * 0.5, 'Odbicie względem osi pionowej', d0 < d ? 'Obraz nie jest odbity (wygląda jak oryginał)' : 'Obraz różni się od lustrzanego odbicia oryginału');
    }
    if (want.frames) {
      const g = fmt === 'gif' ? gifInfo(buf) : { frames: 1, delays: [] };
      add(g.frames === want.frames, 'Animacja ma ' + want.frames + ' klatki', 'Liczba klatek: ' + g.frames + ' – otwórz oba banery jako warstwy');
      add(g.delays.length && g.delays.every(function (d) { return Math.abs(d - want.delay) <= 10; }), 'Opóźnienie ' + want.delay + ' ms dla każdej klatki', 'Opóźnienia: ' + (g.delays.join(', ') || 'brak') + ' ms');
      add(g.loop, 'Pętla nieskończona', 'Animacja odtworzy się tylko raz – zaznacz „Pętla nieskończona”');
    }
    return { res: res, url: url, w: W, h: H, fmt: fmt };
  }

  /* ---------- widoki ---------- */
  TR.viewGfx = function (w, id, ctx) {
    const h = ctx.h, md = ctx.md;
    if (id) {
      const t = TR.GFX.find(function (x) { return x.id === id; });
      if (!t) { w.appendChild(h('p', null, 'Nie ma takiego ćwiczenia.')); return 'Grafika'; }
      w.appendChild(ctx.crumbs([['Start', '#/'], ['Grafika', '#/inf/grafika'], [t.t]]));
      const grid = h('div', { class: 'task' });
      const left = h('div', { class: 'sheet' }, h('div', { class: 'code-line' }, h('span', null, 'Grafika'), h('span', null, 'wynik: ' + t.out)), h('div', { class: 'row', style: { marginBottom: '8px' } }, ctx.freqChip(t.f), ctx.isDone(t.id) ? h('span', { class: 'chip ok' }, 'zrobione') : null), h('h1', { style: { fontSize: '1.35rem' } }, t.t), h('div', { class: 'q', html: md(t.q) }));
      if (t.src) left.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, h('a', { class: 'btn sm', href: 'lab/gfx/' + t.src, download: t.src }, 'Pobierz ' + t.src), t.src2 ? h('a', { class: 'btn sm', href: 'lab/gfx/' + t.src2, download: t.src2 }, 'Pobierz ' + t.src2) : null));
      left.appendChild(h('h4', null, 'W GIMP krok po kroku'));
      left.appendChild(h('ol', null, t.steps.map(function (s) { return h('li', { html: md(s).replace(/^<p>|<\/p>$/g, '') }); })));
      left.appendChild(h('p', { class: 'muted small' }, 'Inny program w szkole (Paint.NET, Photoshop)? Nazwy menu są inne, czynności te same.'));
      const right = h('div', { class: 'work' });
      const out = h('div');
      const inp = h('input', { type: 'file', id: 'gfxfile', accept: 'image/*', hidden: true, onchange: function () { if (this.files[0]) check(this.files[0]); } });
      const drop = h('label', { class: 'drop', for: 'gfxfile' }, h('b', null, 'Wgraj swój plik ' + t.out), h('div', { class: 'small' }, 'kliknij albo przeciągnij tutaj – plik nie wychodzi z Twojej przeglądarki'), inp);
      ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); if (ev === 'drop' && e.dataTransfer.files[0]) check(e.dataTransfer.files[0]); }); });
      right.appendChild(h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Sprawdzenie pliku')), h('div', { class: 'panel-body' }, drop, out)));
      if (t.src) right.appendChild(h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Plik źródłowy')), h('div', { class: 'panel-body' }, h('img', { src: 'lab/gfx/' + t.src, alt: 'plik źródłowy ' + t.src, style: { maxHeight: '220px' } }))));
      grid.appendChild(left); grid.appendChild(right); w.appendChild(grid);
      async function check(file) {
        out.innerHTML = ''; out.appendChild(h('p', { class: 'muted' }, 'Sprawdzam…'));
        const r = await analyse(file, t);
        out.innerHTML = '';
        const okN = r.res.filter(function (x) { return x.ok; }).length;
        out.appendChild(h('div', { class: 'result ' + (okN === r.res.length ? 'ok' : 'bad'), style: { margin: '12px 0' } }, okN === r.res.length ? '✓ Plik spełnia wszystkie wymagania' : '✗ Spełnione ' + okN + ' z ' + r.res.length));
        out.appendChild(h('div', { class: 'imgres' }, h('img', { src: r.url, alt: 'Twój plik' }), h('ul', { class: 'req', style: { listStyle: 'none', padding: '0', margin: '0', flex: '1', minWidth: '220px' } }, r.res.map(function (x) { return h('li', { class: x.ok ? 'ok' : 'bad', style: { padding: '3px 0' } }, (x.ok ? '✓ ' : '✗ ') + x.d, x.msg ? h('span', { class: 'why', style: { display: 'block', color: 'var(--bad)', fontSize: '.86rem' } }, x.msg) : null); }))));
        ctx.mark(t.id, okN === r.res.length);
      }
      return t.t;
    }
    w.appendChild(ctx.crumbs([['Start', '#/'], ['INF.03'], ['Grafika']]));
    w.appendChild(h('h1', null, 'Grafika'));
    w.appendChild(h('div', { class: 'prose', html: md('Coś z grafiki jest w około 3/4 arkuszy, zwykle 1–3 punkty. Najczęściej: **przeskaluj z zachowaniem proporcji** i **zapisz z przezroczystym tłem**. Pobierz plik, zrób zadanie w GIMP, wgraj wynik – strona sprawdzi format, wymiary, proporcje, przezroczystość, szarość, klatki GIF.\n\n> Zasada z zasad oceniania: oceniają **plik** (format, wymiary, nazwa), więc nie wystarczy, że obraz „dobrze wygląda” na stronie. Zawsze **Wyeksportuj jako…** – zwykłe „Zapisz” w GIMP tworzy plik .xcf.') }));
    const box = h('div', { class: 'tasks', style: { marginTop: '14px' } });
    TR.GFX.forEach(function (t) {
      const d = ctx.S.done[t.id];
      box.appendChild(h('a', { class: 'trow', href: '#/inf/grafika/' + t.id }, h('span', { class: 'dot' + (d && d.ok ? ' ok' : d ? ' part' : '') }, d && d.ok ? '✓' : ''), h('div', { style: { minWidth: '0' } }, h('div', { class: 'tt' }, t.t), h('div', { class: 'tq' }, t.q.replace(/\*\*/g, ''))), h('div', { class: 'meta' }, ctx.freqChip(t.f))));
    });
    w.appendChild(box);
    w.appendChild(h('div', { class: 'prose', style: { marginTop: '18px' }, html: md('## Skróty GIMP, które oszczędzają czas\n- **Shift+Ctrl+E** – Wyeksportuj jako (PNG, JPG, GIF)\n- **Obraz → Skaluj obraz…** – zmiana rozmiaru (łańcuch = proporcje)\n- **Obraz → Rozmiar płótna…** – dodanie pustego miejsca bez skalowania\n- **Kolory → Kolor na alfę…** – usunięcie jednolitego tła\n- **Warstwa → Warstwa do rozmiaru obrazu** – przed eksportem, gdy tekst „wystaje”\n- **Ctrl+Alt+O** – Otwórz jako warstwy (klatki GIF)\n- **Obraz → Przekształć → Odbij poziomo / Obróć** – odbicia i obroty') }));
    return 'Grafika';
  };
  TR.gfxAnalyse = analyse;
})(typeof window !== 'undefined' ? window : globalThis);
