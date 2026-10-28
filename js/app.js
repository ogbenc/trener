/* Pracownia 5TI4 – aplikacja (widoki, postęp, nawigacja) */
(function () {
  'use strict';
  const TR = window.TR;

  /* ===================== narzędzia ===================== */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) { if (c == null || c === false) return; if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; } el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // mini-markdown dla własnych treści
  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n'); let out = ''; let i = 0;
    function inline(s) {
      return esc(s).replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; })
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>')
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+|#[^)\s]*)\)/g, function (_, t, u) { return '<a href="' + u + '"' + (/^http/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>'; });
    }
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) { const lang = l.slice(3).trim() || 'txt'; const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out += '<pre class="code">' + TR.highlight(buf.join('\n'), lang) + '</pre>'; continue; }
      if (/^#{2,4} /.test(l)) { const n = l.match(/^#+/)[0].length; out += '<h' + n + '>' + inline(l.slice(n + 1)) + '</h' + n + '>'; i++; continue; }
      if (/^- /.test(l)) { out += '<ul>'; while (i < lines.length && /^- /.test(lines[i])) out += '<li>' + inline(lines[i++].slice(2)) + '</li>'; out += '</ul>'; continue; }
      if (/^\d+\. /.test(l)) { out += '<ol>'; while (i < lines.length && /^\d+\. /.test(lines[i])) out += '<li>' + inline(lines[i++].replace(/^\d+\. /, '')) + '</li>'; out += '</ol>'; continue; }
      if (/^> /.test(l)) { const buf = []; while (i < lines.length && /^> /.test(lines[i])) buf.push(lines[i++].slice(2)); out += '<div class="notice">' + inline(buf.join(' ')) + '</div>'; continue; }
      if (!l.trim()) { i++; continue; }
      const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|#{2,4} |- |\d+\. |> )/.test(lines[i])) buf.push(lines[i++]);
      out += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return out;
  }
  TR.md = md;
  function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2300); }
  function copyText(text) {
    try { navigator.clipboard.writeText(text).then(function () { toast('Skopiowano'); }, fallback); } catch (e) { fallback(); }
    function fallback() { const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Skopiowano'); } catch (e) { } ta.remove(); }
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ===================== postęp ===================== */
  const KEY = 'pracownia5ti4';
  let S = { v: 1, done: {}, code: {}, set: {} };
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function mark(id, ok, extra) { const p = S.done[id] || { tries: 0 }; p.tries++; p.t = Date.now(); if (ok) { p.ok = true; if (extra && extra.peek) p.peek = true; } S.done[id] = Object.assign(p, extra && extra.store || {}); save(); updateNav(); }
  function isDone(id) { return !!(S.done[id] && S.done[id].ok); }
  function getCode(id) { return S.code[id]; }
  function setCode(id, v) { S.code[id] = v; save(); }
  TR.state = S;

  /* ===================== dane pomocnicze ===================== */
  const FREQ = { 3: ['pewniak', 'f3'], 2: ['częste', 'f2'], 1: ['zdarza się', ''] };
  function freqChip(f) { const x = FREQ[f] || FREQ[1]; return h('span', { class: 'chip ' + x[1], title: 'Jak często w arkuszach 2021–2026' }, x[0]); }
  const sqlById = {}; (TR.SQLT || []).forEach(function (t) { sqlById[t.id] = t; });
  const labById = {}; (TR.LAB || []).forEach(function (t) { labById[t.id] = t; });
  const realByKey = {}; (TR.REAL || []).forEach(function (e) { realByKey[e.key] = e; });
  const realRunnable = (TR.REAL || []).filter(function (e) { return e.hasDb; }).reduce(function (a, e) { return a + e.q.length; }, 0);
  function realId(key, n) { return 'r:' + key + ':' + n; }
  function realDoneCount() { let n = 0; (TR.REAL || []).forEach(function (e) { e.q.forEach(function (q) { if (isDone(realId(e.key, q.n))) n++; }); }); return n; }
  function areaTasks(area) { return (TR.LAB || []).filter(function (t) { return t.area === area; }); }

  /* ===================== nawigacja ===================== */
  const NAV = [
    { sec: 'Start' },
    { href: '#/', ico: '⌂', t: 'Dziś' },
    { sec: 'INF.03 – część praktyczna' },
    { href: '#/inf/egzamin', ico: '§', t: 'Mapa egzaminu' },
    { href: '#/inf/sql', ico: 'SQ', t: 'SQL – trening', cnt: function () { return cnt(TR.SQLT); } },
    { href: '#/inf/arkusze', ico: 'CK', t: 'SQL z arkuszy CKE', cnt: function () { return realDoneCount() + '/' + realRunnable; } },
    { href: '#/inf/html', ico: '<>', t: 'HTML i CSS', cnt: function () { return cnt(areaTasks('html')); } },
    { href: '#/inf/js', ico: 'JS', t: 'JavaScript', cnt: function () { return cnt(areaTasks('js')); } },
    { href: '#/inf/php', ico: '<?', t: 'PHP + baza', cnt: function () { return cnt(areaTasks('php')); } },
    { href: '#/inf/grafika', ico: '▣', t: 'Grafika', cnt: function () { return cnt(TR.GFX || []); } },
    { href: '#/inf/probne', ico: '⏱', t: 'Arkusze próbne', cnt: function () { return cnt(TR.MOCK || []); } },
    { href: '#/inf/sciaga', ico: '≡', t: 'Ściąga i słownik' },
    { href: '#/inf/baza', ico: '▤', t: 'Wszystkie arkusze' },
    { sec: 'Matura' },
    { href: '#/mat', ico: '∑', t: 'Matematyka', cnt: function () { return cnt(TR.MAT); } }
  ];
  function cnt(list) { list = list || []; return list.filter(function (t) { return isDone(t.id); }).length + '/' + list.length; }
  function buildNav() {
    const nav = document.getElementById('nav'); nav.innerHTML = '';
    NAV.forEach(function (n) {
      if (n.sec) { nav.appendChild(h('div', { class: 'nav-sec' }, n.sec)); return; }
      nav.appendChild(h('a', { href: n.href, class: n.soon ? 'soon' : null, 'data-href': n.href }, h('span', { class: 'ico' }, n.ico), h('span', null, n.t), n.cnt ? h('span', { class: 'cnt' }, n.cnt()) : (n.soon ? h('span', { class: 'cnt' }, 'wkrótce') : null)));
    });
  }
  function updateNav() {
    const cur = location.hash || '#/';
    document.querySelectorAll('#nav a').forEach(function (a) {
      const href = a.getAttribute('data-href');
      const on = href === '#/' ? (cur === '#/' || cur === '' || cur === '#') : cur.indexOf(href) === 0 || (href === '#/inf/arkusze' && cur.indexOf('#/inf/arkusz/') === 0) || (href === '#/inf/sql' && /^#\/inf\/sql\//.test(cur)) || (href === '#/inf/probne' && cur.indexOf('#/inf/probny/') === 0);
      a.classList.toggle('on', !!on);
      const n = NAV.find(function (x) { return x.href === href; });
      const c = a.querySelector('.cnt'); if (n && n.cnt && c) c.textContent = n.cnt();
    });
  }

  /* ===================== router ===================== */
  let cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function route() {
    cleanup.forEach(function (f) { try { f(); } catch (e) { } }); cleanup = [];
    const hash = location.hash.replace(/^#/, '') || '/';
    const parts = hash.split('/').filter(Boolean);
    const main = document.getElementById('main');
    main.innerHTML = '';
    const wrap = h('div', { class: 'wrap' }); main.appendChild(wrap);
    let title = 'Pracownia 5TI4';
    try {
      if (!parts.length) title = viewStart(wrap);
      else if (parts[0] === 'inf') {
        const p = parts[1];
        if (!p) title = viewInf(wrap);
        else if (p === 'egzamin') title = viewExamMap(wrap);
        else if (p === 'sql' && parts[2]) title = viewSqlTask(wrap, parts[2]);
        else if (p === 'sql') title = viewSqlList(wrap);
        else if (p === 'arkusze') title = viewRealList(wrap);
        else if (p === 'arkusz') title = viewRealExam(wrap, parts[2]);
        else if (p === 'html' || p === 'js' || p === 'php') title = viewLabList(wrap, p);
        else if (p === 'lab') title = viewLab(wrap, parts[2]);
        else if (p === 'grafika') title = TR.viewGfx ? TR.viewGfx(wrap, parts[2], ctx) : 'Grafika';
        else if (p === 'probne') title = viewMockList(wrap);
        else if (p === 'probny') title = TR.viewMock ? TR.viewMock(wrap, parts[2], ctx) : 'Arkusz';
        else if (p === 'sciaga') title = viewSciaga(wrap);
        else if (p === 'baza') title = viewBaza(wrap);
        else title = viewNotFound(wrap);
      } else if (parts[0] === 'mat') title = viewMat(wrap);
      else title = viewNotFound(wrap);
    } catch (e) { console.error(e); wrap.appendChild(h('div', { class: 'notice bad' }, 'Coś poszło nie tak przy otwieraniu tej strony: ' + e.message)); }
    document.title = title === 'Pracownia 5TI4' ? title : title + ' · Pracownia 5TI4';
    const tt = document.getElementById('toptitle'); if (tt) tt.textContent = title;
    updateNav(); closeMenu();
    window.scrollTo(0, 0);
  }
  function closeMenu() { document.getElementById('side').classList.remove('open'); const s = document.getElementById('scrim'); if (s) s.hidden = true; }
  function openMenu() { document.getElementById('side').classList.add('open'); document.getElementById('scrim').hidden = false; }
  function crumbs(list) { return h('nav', { class: 'crumbs', 'aria-label': 'Ścieżka' }, list.map(function (c, i) { return [i ? h('span', null, '›') : null, c[1] ? h('a', { href: c[1] }, c[0]) : h('span', null, c[0])]; })); }
  const ctx = { h: h, md: md, esc: esc, toast: toast, copyText: copyText, download: download, mark: mark, isDone: isDone, getCode: getCode, setCode: setCode, crumbs: crumbs, freqChip: freqChip, onLeave: onLeave, S: S, save: save };
  TR.ctx = ctx;

  /* ===================== START ===================== */
  function nextUp() {
    // propozycje: pierwsze nierozwiązane pewniaki z każdego działu
    const out = [];
    const firstSql = (TR.SQLT || []).find(function (t) { return !isDone(t.id) && t.f >= 2; }) || (TR.SQLT || []).find(function (t) { return !isDone(t.id); });
    if (firstSql) out.push(['SQL', firstSql.t, '#/inf/sql/' + firstSql.id]);
    ['html', 'js', 'php'].forEach(function (a) { const t = areaTasks(a).find(function (x) { return !isDone(x.id); }); if (t) out.push([{ html: 'HTML/CSS', js: 'JS', php: 'PHP' }[a], t.t, '#/inf/lab/' + t.id]); });
    const ex = (TR.REAL || []).filter(function (e) { return e.hasDb && /^inf03/.test(e.key); }).reverse().find(function (e) { return e.q.some(function (q) { return !isDone(realId(e.key, q.n)); }); });
    if (ex) out.push(['Arkusz', ex.code + ' – zapytania', '#/inf/arkusz/' + ex.key]);
    return out.slice(0, 5);
  }
  function viewStart(w) {
    const up = nextUp();
    const sqlDone = (TR.SQLT || []).filter(function (t) { return isDone(t.id); }).length;
    const exam = S.set.examDate ? new Date(S.set.examDate + 'T09:00:00') : null;
    const days = exam ? Math.ceil((exam - new Date()) / 864e5) : null;
    w.appendChild(h('div', { class: 'hello' },
      h('section', { class: 'today' },
        h('div', { class: 'code' }, 'INF.03 · część praktyczna · 150 min'),
        h('h2', null, days != null && days >= 0 ? 'Do egzaminu: ' + days + ' dni' : 'Dzisiejszy trening'),
        h('p', { class: 'muted' }, 'Zadania ułożone według tego, co CKE daje najczęściej. Każde sprawdza się samo – piszesz kod, klikasz „Sprawdź”.'),
        h('ol', null, up.map(function (u) { return h('li', null, h('b', null, u[0] + ': '), h('a', { href: u[2] }, u[1])); })),
        h('div', { class: 'row' }, up[0] ? h('a', { class: 'btn pri', href: up[0][2] }, 'Zacznij od pierwszego') : null, h('a', { class: 'btn', href: '#/inf/egzamin', style: { background: 'transparent', color: 'inherit', borderColor: 'rgba(255,255,255,.3)' } }, 'Jak wygląda egzamin'))
      ),
      h('section', { class: 'stats' },
        statTile('SQL – trening', sqlDone + '/' + (TR.SQLT || []).length, sqlDone / Math.max(1, (TR.SQLT || []).length), '#/inf/sql'),
        statTile('SQL z arkuszy', realDoneCount() + '/' + realRunnable, realDoneCount() / Math.max(1, realRunnable), '#/inf/arkusze'),
        statTile('HTML i CSS', cnt(areaTasks('html')), fr(areaTasks('html')), '#/inf/html'),
        statTile('JavaScript', cnt(areaTasks('js')), fr(areaTasks('js')), '#/inf/js'),
        statTile('PHP + baza', cnt(areaTasks('php')), fr(areaTasks('php')), '#/inf/php'),
        statTile('Arkusze próbne', cnt(TR.MOCK || []), fr(TR.MOCK || []), '#/inf/probne')
      )
    ));
    const dateIn = h('input', { type: 'date', id: 'examdate', value: S.set.examDate || '', class: 'search', style: { maxWidth: '200px' }, onchange: function () { S.set.examDate = this.value; save(); route(); } });
    w.appendChild(h('div', { class: 'card', style: { marginBottom: '18px' } },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('b', null, 'Data Twojego egzaminu praktycznego INF.03'), h('div', { class: 'muted small' }, 'Wpisz datę z harmonogramu szkoły – licznik dni pojawi się wyżej.')), h('label', { class: 'sr', for: 'examdate', style: { position: 'absolute', left: '-9999px' } }, 'Data egzaminu'), dateIn)));
    w.appendChild(h('h2', null, 'Działy'));
    const tiles = h('div', { class: 'tiles' });
    [['Mapa egzaminu', 'Co dokładnie ocenia egzaminator (R.1–R.5), plan na 150 minut, lista plików do oddania.', '#/inf/egzamin', null],
     ['SQL – trening', 'Wszystkie typy zapytań z arkuszy, od SELECT po GRANT. Sprawdzanie także na zmienionych danych.', '#/inf/sql', cnt(TR.SQLT)],
     ['SQL z arkuszy CKE', 'Prawdziwe zapytania z 117 arkuszy INF.03 i EE.09 – w ' + (TR.REAL || []).filter(function (e) { return e.hasDb; }).length + ' z nich na oryginalnej bazie.', '#/inf/arkusze', realDoneCount() + '/' + realRunnable],
     ['HTML i CSS', 'Układ bloków, formularze, tabele, listy i style – sprawdzane jak w inspektorze.', '#/inf/html', cnt(areaTasks('html'))],
     ['JavaScript', 'Obliczenia z formularza, pokazywanie bloków, tworzenie elementów, localStorage.', '#/inf/js', cnt(areaTasks('js'))],
     ['PHP + baza', 'mysqli, pętle po wynikach, formularze POST/GET, sesje – działa w przeglądarce.', '#/inf/php', cnt(areaTasks('php'))],
     ['Grafika', 'Skalowanie, przezroczystość, kadrowanie, GIF. Wgrywasz swój plik – strona go sprawdza.', '#/inf/grafika', cnt(TR.GFX || [])],
     ['Arkusze próbne', 'Pełne zadanie na 150 minut z oceną punkt po punkcie jak w zasadach CKE.', '#/inf/probne', cnt(TR.MOCK || [])]
    ].forEach(function (t) { tiles.appendChild(h('a', { class: 'tile', href: t[2] }, h('h3', null, t[0]), h('p', null, t[1]), t[3] ? h('div', { class: 'row' }, h('span', { class: 'chip' }, t[3])) : null)); });
    w.appendChild(tiles);
    w.appendChild(h('div', { class: 'card', style: { marginTop: '18px' } },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('b', null, 'Postęp zapisuje się w tej przeglądarce.'), h('div', { class: 'muted small' }, 'Żeby przenieść go na inny komputer: pobierz plik i wczytaj go tam.')),
        h('button', { class: 'btn sm', onclick: function () { download('postep-pracownia.json', JSON.stringify(S)); } }, 'Pobierz postęp'),
        h('label', { class: 'btn sm' }, 'Wczytaj', h('input', { type: 'file', accept: '.json', hidden: true, onchange: function () { const f = this.files[0]; if (!f) return; f.text().then(function (t) { try { const o = JSON.parse(t); S.done = Object.assign(S.done, o.done || {}); S.code = Object.assign(S.code, o.code || {}); save(); toast('Wczytano postęp'); route(); } catch (e) { toast('To nie jest plik postępu'); } }); } }))
      )));
    return 'Pracownia 5TI4';
  }
  function fr(list) { return list.length ? list.filter(function (t) { return isDone(t.id); }).length / list.length : 0; }
  function statTile(label, val, frac, href) { return h('a', { class: 'stat', href: href }, h('span', null, label), h('b', null, val), h('div', { class: 'bar ok', style: { marginTop: '6px' } }, h('i', { style: { width: Math.round(frac * 100) + '%' } }))); }

  function viewInf(w) { location.replace('#/inf/egzamin'); return 'INF.03'; }
  function viewNotFound(w) { w.appendChild(h('h1', null, 'Nie ma takiej strony')); w.appendChild(h('p', null, h('a', { href: '#/' }, 'Wróć na start'))); return 'Brak strony'; }
  function viewMat(w) {
    if (TR.viewMat) return TR.viewMat(w, ctx);
    w.appendChild(crumbs([['Start', '#/'], ['Matematyka']]));
    w.appendChild(h('h1', null, 'Matematyka – w przygotowaniu'));
    w.appendChild(h('div', { class: 'prose', html: md((TR.GUIDE && TR.GUIDE.mat) || 'Najpierw INF.03, potem baza zadań maturalnych: poziom podstawowy, potem rozszerzony – z prawdziwych arkuszy CKE od 2015 r., pogrupowanych według działów, z zadaniami, które wracają co roku.') }));
    return 'Matematyka';
  }

  /* ===================== MAPA EGZAMINU ===================== */
  function viewExamMap(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['Mapa egzaminu']]));
    w.appendChild(h('div', { class: 'eyebrow' }, 'INF.03 · część praktyczna'));
    w.appendChild(h('h1', null, 'Mapa egzaminu'));
    const G = TR.GUIDE || {};
    w.appendChild(h('div', { class: 'prose', html: md(G.examIntro || '') }));
    if (TR.STATS) {
      const st = TR.STATS;
      w.appendChild(h('h2', { style: { marginTop: '1.4em' } }, 'Co się powtarza – statystyka z ' + st.n + ' arkuszy'));
      w.appendChild(h('p', { class: 'muted' }, st.note));
      const grid = h('div', { class: 'cols2' });
      st.groups.forEach(function (g) {
        const c = h('div', { class: 'card' }, h('h3', null, g.name));
        g.items.forEach(function (it) {
          c.appendChild(h('div', { class: 'freq' }, h('span', null, it[0]), h('div', { class: 'b' }, h('i', { class: it[1] >= 60 ? 'hot' : '', style: { width: Math.min(100, it[1]) + '%' } })), h('span', { class: 'v' }, it[1] + '%')));
        });
        if (g.foot) c.appendChild(h('p', { class: 'muted small', style: { marginTop: '8px' } }, g.foot));
        grid.appendChild(c);
      });
      w.appendChild(grid);
    }
    w.appendChild(h('div', { class: 'prose', html: md(G.examMore || '') }));
    if (G.plan) {
      w.appendChild(h('h2', { style: { marginTop: '1.4em' } }, 'Plan na 150 minut'));
      const tl = h('div', { class: 'timeline' });
      G.plan.forEach(function (p) { tl.appendChild(h('div', { class: 'tl' }, h('b', null, p[0]), h('div', { html: md(p[1]) }))); });
      w.appendChild(tl);
    }
    if (G.checklist) {
      w.appendChild(h('h2', { style: { marginTop: '1.4em' } }, 'Przed oddaniem – lista kontrolna'));
      const ul = h('ul', { class: 'check-list card' });
      G.checklist.forEach(function (c, i) {
        const id = 'chk' + i; const st = S.set['chk' + i];
        ul.appendChild(h('li', null, h('input', { type: 'checkbox', id: id, checked: st ? true : null, onchange: function () { S.set['chk' + i] = this.checked; save(); } }), h('label', { for: id, html: md(c).replace(/^<p>|<\/p>$/g, '') })));
      });
      w.appendChild(ul);
    }
    w.appendChild(h('div', { class: 'prose', html: md(G.examPoints || '') }));
    return 'Mapa egzaminu';
  }

  /* ===================== SQL – lista ===================== */
  function viewSqlList(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['SQL – trening']]));
    w.appendChild(h('h1', null, 'SQL – trening'));
    w.appendChild(h('p', { class: 'lead' }, 'Treści w stylu arkusza CKE, bazy jak na egzaminie. Każde zapytanie jest sprawdzane dwa razy: na zwykłej bazie i na bazie z dopisanymi rekordami – tak samo jak egzaminator wymaga zapytań „uniwersalnych”.'));
    let filter = S.set.sqlFilter || 'all';
    const fwrap = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filtr' });
    const list = h('div');
    [['all', 'Wszystkie'], ['todo', 'Do zrobienia'], ['f3', 'Pewniaki'], ['done', 'Zrobione']].forEach(function (f) {
      fwrap.appendChild(h('button', { class: 'fbtn' + (filter === f[0] ? ' on' : ''), onclick: function () { filter = f[0]; S.set.sqlFilter = filter; save(); fwrap.querySelectorAll('.fbtn').forEach(function (b) { b.classList.toggle('on', b.textContent === f[1]); }); draw(); } }, f[1]));
    });
    w.appendChild(fwrap); w.appendChild(list);
    function draw() {
      list.innerHTML = '';
      TR.SQLG.forEach(function (g) {
        const ts = TR.SQLT.filter(function (t) { return t.g === g.id; }).filter(function (t) { return filter === 'all' || (filter === 'todo' && !isDone(t.id)) || (filter === 'done' && isDone(t.id)) || (filter === 'f3' && t.f === 3); });
        if (!ts.length) return;
        const grp = h('section', { class: 'group' }, h('div', { class: 'group-head' }, h('h2', null, g.name), freqChip(g.f), h('span', { class: 'chip' }, ts.filter(function (t) { return isDone(t.id); }).length + '/' + ts.length), h('div', { class: 'note' }, g.note)));
        const box = h('div', { class: 'tasks' });
        ts.forEach(function (t) { box.appendChild(taskRow(t.id, t.t, t.q, '#/inf/sql/' + t.id, t.f, TR.DBS[t.db].title)); });
        grp.appendChild(box); list.appendChild(grp);
      });
      if (!list.children.length) list.appendChild(h('p', { class: 'muted' }, 'Brak zadań w tym filtrze.'));
    }
    draw();
    return 'SQL – trening';
  }
  function taskRow(id, title, sub, href, f, extra) {
    const d = S.done[id];
    return h('a', { class: 'trow', href: href },
      h('span', { class: 'dot' + (d && d.ok ? ' ok' : d ? ' part' : '') }, d && d.ok ? '✓' : d ? '·' : ''),
      h('div', { style: { minWidth: '0' } }, h('div', { class: 'tt' }, title), h('div', { class: 'tq' }, sub)),
      h('div', { class: 'meta' }, f ? freqChip(f) : null, extra ? h('span', { class: 'chip' }, extra) : null));
  }

  /* ===================== SQL – zadanie ===================== */
  function schemaView(schema, onPick) {
    const box = h('div', { class: 'schema' });
    schema.forEach(function (t) {
      const tb = h('div', { class: 'tbl' }, h('div', { class: 'tbl-h', title: 'Kliknij, aby wstawić nazwę tabeli', style: { cursor: 'pointer' }, onclick: function () { onPick && onPick(t.name); } }, t.name, t.count != null ? h('span', null, t.count + ' rek.') : null));
      t.cols.forEach(function (c) {
        const fk = !c.pk && /(_id|Id|_ID)$|^id_?[A-Za-z]/.test(c.name) && c.name.toLowerCase() !== 'id';
        tb.appendChild(h('div', { class: 'tbl-c' + (c.pk ? ' pk' : '') + (fk ? ' fk' : ''), title: 'Kliknij, aby wstawić', onclick: function () { onPick && onPick(c.name); } }, h('b', null, c.name), h('span', { class: 'ty' }, String(c.type || '').toLowerCase().replace(/\s+unsigned/, ' ⁺'))));
      });
      box.appendChild(tb);
    });
    return box;
  }
  function resultView(results) {
    const box = h('div');
    if (!results || !results.length) return box;
    results.forEach(function (r, i) {
      if (results.length > 1) box.appendChild(h('div', { class: 'pma-msg mono' }, (i + 1) + '. ' + String(r.sql || '').slice(0, 90)));
      if (r.kind === 'error') { box.appendChild(h('div', { class: 'pma-err' }, 'Błąd\nZapytanie SQL: ' + (r.sql || '') + '\n\nMySQL zwrócił komunikat: ' + r.error)); return; }
      if (r.kind === 'select') {
        box.appendChild(h('div', { class: 'pma-msg' }, r.rows.length ? 'Pokazano rekordy 0 - ' + (r.rows.length - 1) + ' (' + r.rows.length + ' łącznie, wykonanie zapytania trwało 0.0004 sekund(y).)' : 'MySQL zwrócił pusty wynik (zero rekordów).'));
        const tbl = h('table', { class: 'rs' }); const tr = h('tr'); r.columns.forEach(function (c) { tr.appendChild(h('th', null, c)); }); tbl.appendChild(h('thead', null, tr));
        const tb = h('tbody');
        r.rows.slice(0, 500).forEach(function (row) { const trr = h('tr'); row.forEach(function (v) { trr.appendChild(h('td', { class: v == null ? 'null' : typeof v === 'number' ? 'n' : null }, TR.sql.fmt(v))); }); tb.appendChild(trr); });
        tbl.appendChild(tb); box.appendChild(h('div', { class: 'rs-wrap' }, tbl));
        return;
      }
      box.appendChild(h('div', { class: 'pma-ok' }, (r.simulated ? '' : '') + (r.message || 'Zapytanie zostało wykonane poprawnie.')));
    });
    return box;
  }
  TR.resultView = resultView; TR.schemaView = schemaView;

  function sqlWorkbench(opts) {
    // opts: {id, open(variant), task (do sprawdzenia), hint, ref, schema, onOk}
    const box = h('div', { class: 'work' });
    const edPanel = h('div', { class: 'panel' });
    const head = h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, opts.label || 'Zapytanie SQL'));
    const runB = h('button', { class: 'btn sm', onclick: run }, 'Uruchom ', h('kbd', null, 'Ctrl+Enter'));
    const chkB = h('button', { class: 'btn sm pri', onclick: check }, 'Sprawdź ', h('kbd', null, 'Ctrl+S'));
    head.appendChild(runB); head.appendChild(chkB); edPanel.appendChild(head);
    const edHost = h('div', { class: 'ed-sql' }); edPanel.appendChild(edHost);
    const ed = new TR.Editor(edHost, { lang: 'sql', id: 'ed-' + opts.id.replace(/[^\w]/g, '_'), label: 'Zapytanie SQL', onRun: run, onCheck: check, onChange: function (v) { setCode(opts.id, v); }, autoHeight: true, minHeight: opts.minHeight || 140 });
    ed.set(getCode(opts.id) || '');
    box.appendChild(edPanel);
    const verdict = h('div'); box.appendChild(verdict);
    const resPanel = h('div', { class: 'panel', hidden: true }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Wynik (jak w phpMyAdmin)')));
    const resBody = h('div', { class: 'panel-body' }); resPanel.appendChild(resBody); box.appendChild(resPanel);
    function showResults(results) { resBody.innerHTML = ''; resBody.appendChild(resultView(results)); resPanel.hidden = !results || !results.length; }
    function run() {
      const txt = ed.get(); if (!txt.trim()) { verdict.innerHTML = ''; verdict.appendChild(h('div', { class: 'result bad' }, 'Wpisz zapytanie.')); return; }
      const c = opts.open('A'); if (opts.task && opts.task.setup) c.runText(opts.task.setup);
      const r = c.runText(txt); showResults(r); verdict.innerHTML = '';
    }
    function check() {
      const r = TR.sqlcheck.check(opts.task, ed.get(), opts.open);
      verdict.innerHTML = '';
      verdict.appendChild(h('div', { class: 'result ' + (r.ok ? 'ok' : 'bad'), role: 'status' }, r.ok ? '✓ ' + r.msg : '✗ Jeszcze nie.', r.ok ? null : h('span', { class: 'sub' }, r.msg)));
      if (r.results) showResults(r.results);
      mark(opts.id, r.ok, { peek: opts.peeked && opts.peeked() });
      if (r.ok && opts.onOk) opts.onOk();
    }
    box.ed = ed; box.check = check; box.run = run;
    return box;
  }

  function viewSqlTask(w, id) {
    const t = sqlById[id]; if (!t) return viewNotFound(w);
    const idx = TR.SQLT.indexOf(t); const prev = TR.SQLT[idx - 1], next = TR.SQLT[idx + 1];
    const g = TR.SQLG.find(function (x) { return x.id === t.g; });
    w.appendChild(crumbs([['Start', '#/'], ['SQL – trening', '#/inf/sql'], [g.name]]));
    const grid = h('div', { class: 'task' });
    const left = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '0' } });
    let peek = false;
    const sheet = h('div', { class: 'sheet' },
      h('div', { class: 'code-line' }, h('span', null, 'Baza: ' + t.db + ' · ' + TR.DBS[t.db].title), h('span', null, 'zadanie ' + t.id.toUpperCase())),
      h('div', { class: 'row', style: { marginBottom: '8px' } }, freqChip(t.f), isDone(t.id) ? h('span', { class: 'chip ok' }, 'zrobione') : null),
      h('h1', { style: { fontSize: '1.35rem' } }, t.t),
      h('p', { class: 'q' }, h('b', null, 'Zapytanie: '), t.q.replace(/^Zapytanie\s+/i, '')));
    left.appendChild(sheet);
    const hintBox = h('div'); const solBox = h('div');
    const hb = h('div', { class: 'row' },
      h('button', { class: 'btn sm', onclick: function () { hintBox.innerHTML = ''; hintBox.appendChild(h('div', { class: 'hint', html: '<b>Wzorzec:</b> ' + md(t.hint).replace(/^<p>|<\/p>$/g, '') })); } }, 'Podpowiedź'),
      h('button', { class: 'btn sm ghost', onclick: function () { peek = true; solBox.innerHTML = ''; solBox.appendChild(h('div', { class: 'solution' }, h('b', null, 'Przykładowe rozwiązanie'), h('pre', { class: 'code', html: TR.highlight(t.ref, 'sql') }), h('button', { class: 'btn sm', onclick: function () { wb.ed.set(t.ref); setCode(t.id, t.ref); } }, 'Wstaw do edytora'))); } }, 'Pokaż rozwiązanie'));
    left.appendChild(hb); left.appendChild(hintBox); left.appendChild(solBox);
    const sch = h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Struktura bazy ' + t.db), h('a', { class: 'btn sm ghost', href: '#', onclick: function (e) { e.preventDefault(); download(t.db + '.sql', TR.dbgen.mysql(t.db), 'application/sql'); } }, 'Pobierz .sql do XAMPP')));
    const schemaData = TR.dbgen.schema(t.db);
    sch.appendChild(h('div', { class: 'panel-body' }, schemaView(schemaData, function (n) { insertAtCursor(wb.ed, n); })));
    left.appendChild(sch);
    const wb = sqlWorkbench({ id: t.id, open: function (v) { return TR.dbgen.open(t.db, v); }, task: t, peeked: function () { return peek; } });
    grid.appendChild(left); grid.appendChild(wb);
    w.appendChild(grid);
    w.appendChild(h('div', { class: 'navbtns' }, prev ? h('a', { class: 'btn', href: '#/inf/sql/' + prev.id }, '← ' + prev.t) : h('span'), next ? h('a', { class: 'btn pri', href: '#/inf/sql/' + next.id }, next.t + ' →') : h('a', { class: 'btn pri', href: '#/inf/arkusze' }, 'Dalej: prawdziwe arkusze →')));
    setTimeout(function () { if (window.innerWidth > 900) wb.ed.focus(); }, 50);
    return t.t;
  }
  function insertAtCursor(ed, text) {
    const ta = ed.ta; ta.focus(); const s = ta.selectionStart;
    const ok = document.execCommand && document.execCommand('insertText', false, text);
    if (!ok) { ta.value = ta.value.slice(0, s) + text + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + text.length; ta.dispatchEvent(new Event('input')); }
  }

  /* ===================== PRAWDZIWE ARKUSZE ===================== */
  function parseKey(k) { const m = k.match(/^(inf03|ee09)_(\d{4})_(\d\d)_(\d\d)$/); return m ? { q: m[1] === 'inf03' ? 'INF.03' : 'EE.09', y: +m[2], s: m[3] === '01' ? 'styczeń' : 'czerwiec', n: +m[4] } : {}; }
  function viewRealList(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['SQL z arkuszy CKE']]));
    w.appendChild(h('h1', null, 'SQL z prawdziwych arkuszy'));
    w.appendChild(h('p', { class: 'lead' }, 'Treść zapytań przepisana z arkuszy CKE (INF.03 2021–2026 i EE.09 2019–2023). Tam, gdzie mam oryginalną bazę z arkusza, Twoje zapytanie sprawdza się automatycznie. Przy każdym zapytaniu jest też to, co według zasad oceniania musi być widać na zrzucie.'));
    const f = S.set.realF || { q: 'INF.03', db: 'db', s: '' };
    const bar = h('div', { class: 'filters' });
    const search = h('input', { class: 'search', type: 'search', placeholder: 'Szukaj: temat, baza, kod…', value: f.s || '', 'aria-label': 'Szukaj arkusza', oninput: function () { f.s = this.value; S.set.realF = f; save(); draw(); } });
    function fb(key, val, label) { return h('button', { class: 'fbtn' + (f[key] === val ? ' on' : ''), onclick: function () { f[key] = val; S.set.realF = f; save(); route(); } }, label); }
    bar.appendChild(fb('q', 'INF.03', 'INF.03')); bar.appendChild(fb('q', 'EE.09', 'EE.09')); bar.appendChild(fb('q', '', 'Oba'));
    bar.appendChild(h('span', { style: { width: '10px' } }));
    bar.appendChild(fb('db', 'db', 'Z bazą (sprawdzanie)')); bar.appendChild(fb('db', '', 'Wszystkie'));
    w.appendChild(bar); w.appendChild(search);
    const list = h('div', { style: { marginTop: '14px' } }); w.appendChild(list);
    function draw() {
      list.innerHTML = '';
      const ex = (TR.REAL || []).filter(function (e) { const p = parseKey(e.key); return (!f.q || p.q === f.q) && (!f.db || e.hasDb) && (!f.s || (e.code + ' ' + e.theme + ' ' + e.db + ' ' + p.y).toLowerCase().indexOf(f.s.toLowerCase()) >= 0); }).slice().reverse();
      let lastY = null; let grid = null;
      ex.forEach(function (e) {
        const p = parseKey(e.key);
        const y = p.y + ' · ' + p.s;
        if (y !== lastY) { lastY = y; list.appendChild(h('h2', { style: { marginTop: '18px' } }, p.q + ' ' + y)); grid = h('div', { class: 'ex-grid' }); list.appendChild(grid); }
        const done = e.q.filter(function (q) { return isDone(realId(e.key, q.n)); }).length;
        grid.appendChild(h('a', { class: 'ex', href: '#/inf/arkusz/' + e.key }, h('div', { class: 'c' }, e.code), h('div', { class: 'th' }, cap(e.theme) || 'Arkusz ' + e.code), h('div', { class: 'row' }, h('span', { class: 'chip code' }, 'baza ' + e.db), h('span', { class: 'chip' + (done === e.q.length ? ' ok' : '') }, done + '/' + e.q.length + ' zapytań'), e.hasDb ? h('span', { class: 'chip f2' }, 'sprawdzanie') : h('span', { class: 'chip' }, 'bez bazy'))));
      });
      if (!ex.length) list.appendChild(h('p', { class: 'muted' }, 'Nic nie pasuje do filtra.'));
    }
    draw();
    return 'SQL z arkuszy CKE';
  }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function ghPdf(e) {
    const top = e.key.split('_')[0];
    const pdf = (e.pdf || []).find(function (p) { return !/_zo/i.test(p); });
    const zo = (e.pdf || []).find(function (p) { return /_zo/i.test(p); });
    const base = 'https://github.com/Chr1skyy/Egzamin-Zawodowy-E14-EE09-INF03/blob/main/' + top + '/' + e.key + '/';
    return { sheet: pdf ? base + pdf : null, zo: zo ? base + zo : null, folder: 'https://github.com/Chr1skyy/Egzamin-Zawodowy-E14-EE09-INF03/tree/main/' + top + '/' + e.key };
  }
  function viewRealExam(w, key) {
    const e = realByKey[key]; if (!e) return viewNotFound(w);
    const p = parseKey(key);
    w.appendChild(crumbs([['Start', '#/'], ['SQL z arkuszy CKE', '#/inf/arkusze'], [e.code]]));
    w.appendChild(h('div', { class: 'eyebrow' }, p.q + ' · ' + p.s + ' ' + p.y + ' · zadanie ' + String(p.n).padStart(2, '0')));
    w.appendChild(h('h1', null, cap(e.theme) || e.code));
    const links = ghPdf(e);
    w.appendChild(h('div', { class: 'row', style: { marginBottom: '14px' } },
      h('span', { class: 'chip code' }, e.code), h('span', { class: 'chip code' }, 'baza: ' + e.db),
      links.sheet ? h('a', { class: 'btn sm', href: links.sheet, target: '_blank', rel: 'noopener' }, 'Arkusz PDF ↗') : null,
      links.zo ? h('a', { class: 'btn sm', href: links.zo, target: '_blank', rel: 'noopener' }, 'Zasady oceniania ↗') : null,
      h('a', { class: 'btn sm ghost', href: links.folder, target: '_blank', rel: 'noopener' }, 'Pliki do arkusza ↗')));
    if (!e.hasDb) w.appendChild(h('div', { class: 'notice warn', style: { marginBottom: '14px' } }, 'Bazy z tego arkusza nie ma w aplikacji – pliki są w archiwum 7z z hasłem z arkusza. Napisz zapytania tutaj, porównaj z przykładem z zasad oceniania, a sprawdź je w XAMPP: pobierz pliki (link wyżej), rozpakuj 7-Zipem i zaimportuj bazę w phpMyAdmin.'));
    const holder = h('div'); w.appendChild(holder);
    const go = function () {
      let base = null;
      if (e.hasDb) base = TR.sql.openScript(TR.REALDB[key], e.db);
      if (e.schema) {
        const counts = {}; if (base) base.tables().forEach(function (t) { try { counts[t] = base.db.exec('SELECT COUNT(*) FROM "' + t + '"')[0].values[0][0]; } catch (x) { } });
        const sch = e.schema.map(function (t) { return { name: t.name, cols: t.cols, count: counts[t.name] }; });
        holder.appendChild(h('div', { class: 'panel', style: { marginBottom: '14px' } }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Tabele w bazie ' + e.db)), h('div', { class: 'panel-body' }, schemaView(sch, null))));
      }
      const all = [];
      e.q.forEach(function (q) {
        const id = realId(key, q.n);
        const blk = h('section', { class: 'qblock' });
        const num = h('div', { class: 'qnum' + (isDone(id) ? ' ok' : '') }, q.n);
        blk.appendChild(h('div', { class: 'qblock-h' }, num, h('div', { class: 'grow' }, h('div', { class: 'q' }, h('b', null, 'Zapytanie ' + q.n + ': '), q.text), q.crit ? h('div', { class: 'crit', style: { marginTop: '4px' } }, 'Egzaminator sprawdza: ' + q.crit) : null)));
        const inner = h('div', { style: { padding: '0 14px 14px' } });
        const sol = h('div');
        let peek = false;
        inner.appendChild(h('div', { class: 'row', style: { marginBottom: '8px' } }, h('button', { class: 'btn sm ghost', onclick: function () { peek = true; sol.innerHTML = ''; sol.appendChild(h('div', { class: 'solution' }, h('b', null, 'Przykład z zasad oceniania CKE'), h('pre', { class: 'code', html: TR.highlight(q.ref || '(brak)', 'sql') }), q.accept ? h('div', { class: 'small muted' }, 'CKE uznaje też: ' + q.accept) : null, (q.alt && q.alt.length) ? h('pre', { class: 'code', html: TR.highlight(q.alt.join('\n'), 'sql') }) : null)); } }, 'Pokaż wzór CKE')));
        inner.appendChild(sol);
        if (base) {
          const task = { ref: q.ref, alts: q.alt, setup: q.setup, kind: q.kind, aliases: q.aliases, ordered: q.ordered, noB: true, q: q.text };
          const wbx = sqlWorkbench({ id: id, open: function () { return base.clone(); }, task: task, label: 'kwerendy.txt – zapytanie ' + q.n, minHeight: 90, peeked: function () { return peek; }, onOk: function () { num.classList.add('ok'); } });
          all.push(wbx); inner.appendChild(wbx);
          if (q.setup) inner.appendChild(h('p', { class: 'small muted', style: { marginTop: '6px' } }, 'Baza uwzględnia już skutki poprzednich zapytań z tego arkusza (jak na egzaminie, gdy robisz je po kolei).'));
        } else {
          const edHost = h('div', { class: 'panel' }); const ed = new TR.Editor(edHost, { lang: 'sql', autoHeight: true, minHeight: 80, onChange: function (v) { setCode(id, v); } }); ed.set(getCode(id) || '');
          inner.appendChild(edHost);
          inner.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn sm', onclick: function () { mark(id, true, { peek: true }); num.classList.add('ok'); toast('Oznaczono jako zrobione'); } }, 'Porównałem z wzorem – zrobione')));
          all.push({ ed: ed });
        }
        blk.appendChild(inner); holder.appendChild(blk);
      });
      holder.appendChild(h('div', { class: 'card' }, h('h3', null, 'Twój plik kwerendy.txt'), h('p', { class: 'muted small' }, 'Na egzaminie zapytania zapisujesz w pliku tekstowym, a zrzuty wyników jako kw1.png, kw2.png… (cały ekran z paskiem zadań, bez kadrowania).'),
        h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: function () { copyText(kw()); } }, 'Kopiuj'), h('button', { class: 'btn sm', onclick: function () { download('kwerendy.txt', kw()); } }, 'Pobierz kwerendy.txt'))));
      function kw() { return e.q.map(function (q, i) { const t = (all[i] && all[i].ed ? all[i].ed.get() : '').trim(); return t ? t.replace(/;?\s*$/, ';') : '-- zapytanie ' + q.n; }).join('\n'); }
      onLeave(function () { if (base) base.close(); });
    };
    if (e.hasDb && !(TR.REALDB && TR.REALDB[key])) {
      holder.appendChild(h('p', { class: 'muted' }, 'Wczytuję bazę z arkusza…'));
      const s = document.createElement('script'); s.src = 'data/real/' + key + '.js';
      s.onload = function () { holder.innerHTML = ''; go(); };
      s.onerror = function () { holder.innerHTML = ''; holder.appendChild(h('div', { class: 'notice bad' }, 'Nie udało się wczytać bazy tego arkusza.')); };
      document.head.appendChild(s);
    } else go();
    return e.code;
  }

  /* ===================== LABORATORIUM – lista ===================== */
  const AREA = { html: ['HTML i CSS', 'Strona egzaminacyjna od szkieletu po style. Sprawdzanie działa jak egzaminator z inspektorem: liczy się to, co faktycznie działa na stronie.'], js: ['JavaScript', 'Skrypty po stronie przeglądarki: formularze i obliczenia, zmiana stylów, pokazywanie bloków, tworzenie elementów, tablice, localStorage. Test „klika” za Ciebie i sprawdza wynik.'], php: ['PHP + baza danych', 'Skrypty z mysqli – takie jak w ~2/3 arkuszy. PHP wykonuje się tu w przeglądarce (bez XAMPP), na bazie jak z arkusza. Działają formularze, odnośniki z GET i sesje.'] };
  function viewLabList(w, area) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], [AREA[area][0]]]));
    w.appendChild(h('h1', null, AREA[area][0]));
    w.appendChild(h('p', { class: 'lead' }, AREA[area][1]));
    (TR.LABG || []).filter(function (g) { return g.area === area; }).forEach(function (g) {
      const ts = (TR.LAB || []).filter(function (t) { return t.g === g.id; });
      if (!ts.length) return;
      const grp = h('section', { class: 'group' }, h('div', { class: 'group-head' }, h('h2', null, g.name), g.f ? freqChip(g.f) : null, h('span', { class: 'chip' }, cnt(ts)), g.note ? h('div', { class: 'note' }, g.note) : null));
      const box = h('div', { class: 'tasks' });
      ts.forEach(function (t) { box.appendChild(taskRow(t.id, t.t, t.sub || '', '#/inf/lab/' + t.id, t.f)); });
      grp.appendChild(box); w.appendChild(grp);
    });
    return AREA[area][0];
  }
  function viewMockList(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['Arkusze próbne']]));
    w.appendChild(h('h1', null, 'Arkusze próbne'));
    w.appendChild(h('p', { class: 'lead' }, 'Pełne zadania w formie arkusza CKE, z moją treścią i bazą. Masz 150 minut, a na końcu ocenę według rezultatów R.1–R.5 – kryterium po kryterium, jak w zasadach oceniania.'));
    const box = h('div', { class: 'tasks' });
    (TR.MOCK || []).forEach(function (m) { box.appendChild(taskRow(m.id, m.code + ' – ' + m.title, m.sub, '#/inf/probny/' + m.id, null, m.kind)); });
    w.appendChild(box);
    w.appendChild(h('p', { class: 'muted small', style: { marginTop: '12px' } }, 'Po próbnym przejdź do prawdziwych arkuszy (PDF na GitHubie) i rób je w XAMPP – tak jak na egzaminie.'));
    return 'Arkusze próbne';
  }

  /* ===================== LABORATORIUM – zadanie ===================== */
  function viewLab(w, id) {
    const t = labById[id]; if (!t) return viewNotFound(w);
    const list = (TR.LAB || []).filter(function (x) { return x.area === t.area; });
    const idx = list.indexOf(t); const prev = list[idx - 1], next = list[idx + 1];
    w.appendChild(crumbs([['Start', '#/'], [AREA[t.area][0], '#/inf/' + t.area], [t.t]]));
    const env = TR.labWorkspace(w, {
      id: t.id, title: t.t, f: t.f, intro: t.q, checks: t.checks, files: t.files, entry: t.entry, db: t.db, sol: t.sol, hint: t.hint, help: t.help,
      done: isDone(t.id),
      onResult: function (res, peek) { const ok = res.every(function (r) { return r.ok; }); mark(t.id, ok, { peek: peek }); return ok; }
    });
    w.appendChild(h('div', { class: 'navbtns' }, prev ? h('a', { class: 'btn', href: '#/inf/lab/' + prev.id }, '← ' + prev.t) : h('span'), next ? h('a', { class: 'btn pri', href: '#/inf/lab/' + next.id }, next.t + ' →') : h('a', { class: 'btn pri', href: '#/inf/probne' }, 'Dalej: arkusz próbny →')));
    return t.t;
  }

  // wspólna przestrzeń robocza: treść + pliki + podgląd + sprawdzanie (używana też w arkuszach próbnych)
  TR.labWorkspace = function (w, o) {
    const saved = getCode(o.id);
    const files = {}; Object.keys(o.files).forEach(function (k) { files[k] = saved && saved[k] != null ? saved[k] : o.files[k]; });
    const fileNames = Object.keys(files);
    let peek = false;
    const lab = new TR.Lab({ files: files, entry: o.entry, db: o.db, onConsole: log, onNav: function (u, post) { url.innerHTML = '<b>localhost/egzamin/</b>' + esc(u) + (post ? ' <span style="color:var(--accent)">(POST)</span>' : ''); } });
    onLeave(function () { lab.dispose(); });
    const mt = h('div', { class: 'mob-tabs' });
    const grid = h('div', { class: 'task' });
    // --- treść ---
    const left = h('div', { 'data-mpane': 'q', class: 'mshow', style: { display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '0' } });
    const sheet = h('div', { class: 'sheet' });
    sheet.appendChild(h('div', { class: 'code-line' }, h('span', null, (o.db ? 'Baza: ' + (TR.DBS[o.db] ? o.db + ' · ' + TR.DBS[o.db].title : o.db) : 'Bez bazy danych')), h('span', null, 'pliki: ' + fileNames.join(', '))));
    if (o.f) sheet.appendChild(h('div', { class: 'row', style: { marginBottom: '8px' } }, freqChip(o.f), o.done ? h('span', { class: 'chip ok' }, 'zrobione') : null));
    sheet.appendChild(h('h1', { style: { fontSize: '1.35rem' } }, o.title));
    if (o.intro) sheet.appendChild(h('div', { class: 'q', html: md(o.intro) }));
    if (o.afterIntro) sheet.appendChild(o.afterIntro);
    const reqHead = h('h4', null, o.hideReq ? 'Ocena (po sprawdzeniu)' : 'Wymagania (sprawdzane automatycznie)');
    const req = h('ul', { class: 'req' });
    o.checks.forEach(function (c) { req.appendChild(h('li', null, (c.r ? c.r + ' · ' : '') + c.d)); });
    if (o.hideReq) { reqHead.hidden = true; req.hidden = true; }
    sheet.appendChild(reqHead);
    sheet.appendChild(req);
    left.appendChild(sheet);
    const hintBox = h('div');
    left.appendChild(h('div', { class: 'row' },
      o.hint ? h('button', { class: 'btn sm', onclick: function () { hintBox.innerHTML = ''; hintBox.appendChild(h('div', { class: 'hint', html: md(o.hint) })); } }, 'Podpowiedź') : null,
      o.sol ? h('button', { class: 'btn sm ghost', onclick: showSol }, 'Rozwiązanie') : null,
      h('button', { class: 'btn sm ghost', onclick: resetFiles }, 'Od nowa')));
    left.appendChild(hintBox);
    if (o.db && TR.DBS[o.db]) left.appendChild(h('div', { class: 'panel' }, h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Baza ' + o.db), h('button', { class: 'btn sm ghost', onclick: function () { lab.resetDb(); toast('Baza przywrócona'); } }, 'Przywróć bazę')), h('div', { class: 'panel-body' }, schemaView(TR.dbgen.schema(o.db).map(function (s) { return s; }), function (n) { insertAtCursor(ed, n); }))));
    // --- edytor i podgląd ---
    const right = h('div', { class: 'work' });
    const edPanel = h('div', { class: 'panel', 'data-mpane': 'c' });
    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    let cur = fileNames.find(function (f) { return f === o.entry; }) || fileNames[0];
    const head = h('div', { class: 'panel-head' }, h('span', { class: 'ttl' }, 'Kod'), h('button', { class: 'btn sm', onclick: run }, 'Uruchom ', h('kbd', null, 'Ctrl+Enter')), h('button', { class: 'btn sm pri', onclick: check }, 'Sprawdź ', h('kbd', null, 'Ctrl+S')));
    edPanel.appendChild(head); edPanel.appendChild(tabs);
    const edHost = h('div'); edPanel.appendChild(edHost);
    const ed = new TR.Editor(edHost, { lang: TR.langOf(cur), label: 'Edytor pliku', onRun: run, onCheck: check, onChange: function (v) { files[cur] = v; persist(); } });
    function drawTabs() { tabs.innerHTML = ''; fileNames.forEach(function (f) { tabs.appendChild(h('button', { class: 'tab' + (f === cur ? ' on' : ''), role: 'tab', 'aria-selected': f === cur ? 'true' : 'false', onclick: function () { cur = f; ed.setLang(TR.langOf(f)); ed.set(files[f]); drawTabs(); } }, f)); }); }
    drawTabs(); ed.set(files[cur]);
    const url = h('div', { class: 'url' }, 'localhost/egzamin/' + o.entry);
    const frame = h('iframe', { title: 'Podgląd strony' });
    const testFrame = h('iframe', { class: 'frame-test', title: 'Ramka testowa', 'aria-hidden': 'true', tabindex: '-1' });
    const consoleBox = h('div', { class: 'console', 'aria-live': 'polite' });
    const browser = h('div', { class: 'browser', 'data-mpane': 'p' }, h('div', { class: 'addr' }, h('button', { class: 'btn sm ghost', title: 'Strona główna', onclick: function () { consoleBox.innerHTML = ''; lab.load(frame, o.entry); } }, '⌂'), h('button', { class: 'btn sm ghost', title: 'Odśwież', onclick: function () { lab.reload(); } }, '↻'), url), frame, consoleBox);
    const verdict = h('div', { 'data-mpane': 'p' });
    right.appendChild(edPanel); right.appendChild(verdict); right.appendChild(browser);
    document.body.appendChild(testFrame); onLeave(function () { testFrame.remove(); });
    [['q', 'Treść'], ['c', 'Kod'], ['p', 'Podgląd']].forEach(function (p, i) { mt.appendChild(h('button', { class: 'fbtn' + (i === 0 ? ' on' : ''), onclick: function () { showPane(p[0]); } }, p[1])); });
    function showPane(p) { mt.querySelectorAll('.fbtn').forEach(function (b, i) { b.classList.toggle('on', ['q', 'c', 'p'][i] === p); }); [left, edPanel, browser, verdict].forEach(function (el) { el.classList.toggle('mshow', el.getAttribute('data-mpane') === p); }); }
    w.appendChild(mt);
    grid.appendChild(left); grid.appendChild(right); w.appendChild(grid);
    function log(level, text) { consoleBox.appendChild(h('div', { class: level }, text)); consoleBox.scrollTop = 1e6; }
    function persist() { setCode(o.id, Object.assign({}, files)); }
    function run(why) { consoleBox.innerHTML = ''; files[cur] = ed.get(); lab.files = files; lab.load(frame, o.entry); if (why !== 'init' && window.innerWidth <= 760) showPane('p'); }
    async function check() {
      files[cur] = ed.get(); lab.files = files;
      verdict.innerHTML = ''; verdict.appendChild(h('div', { class: 'result' }, 'Sprawdzam…'));
      const tlab = new TR.Lab({ files: files, entry: o.entry, db: o.db, onConsole: function () { } });
      let res;
      try { res = await TR.runChecks(tlab, testFrame, o.checks); } finally { tlab.dispose(); }
      const items = req.querySelectorAll('li');
      reqHead.hidden = false; req.hidden = false;
      res.forEach(function (r, i) { const li = items[i]; li.className = r.ok ? 'ok' : 'bad'; li.innerHTML = ''; li.appendChild(document.createTextNode((o.checks[i].r ? o.checks[i].r + ' · ' : '') + r.d)); if (!r.ok && r.msg) li.appendChild(h('span', { class: 'why' }, r.msg)); });
      const okN = res.filter(function (r) { return r.ok; }).length;
      const all = o.onResult ? o.onResult(res, peek) : okN === res.length;
      verdict.innerHTML = '';
      if (o.noVerdict) { run(); return res; }
      verdict.appendChild(h('div', { class: 'result ' + (okN === res.length ? 'ok' : 'bad'), role: 'status' }, okN === res.length ? '✓ Wszystko działa: ' + okN + '/' + res.length : '✗ Spełnione ' + okN + ' z ' + res.length + ' wymagań', okN === res.length ? null : h('span', { class: 'sub' }, 'Niespełnione są oznaczone na czerwono w treści' + (window.innerWidth <= 760 ? ' (zakładka „Treść”).' : '.'))));
      run();
      return res;
    }
    function showSol() {
      peek = true;
      hintBox.innerHTML = '';
      const box = h('div', { class: 'solution' }, h('b', null, 'Przykładowe rozwiązanie'));
      Object.keys(o.sol).forEach(function (f) { box.appendChild(h('div', { class: 'small mono', style: { marginTop: '8px' } }, f)); box.appendChild(h('pre', { class: 'code', html: TR.highlight(o.sol[f], TR.langOf(f)) })); });
      box.appendChild(h('button', { class: 'btn sm', onclick: function () { Object.keys(o.sol).forEach(function (f) { files[f] = o.sol[f]; if (fileNames.indexOf(f) < 0) fileNames.push(f); }); persist(); ed.set(files[cur]); drawTabs(); run(); toast('Wstawiono rozwiązanie'); } }, 'Wstaw do plików'));
      hintBox.appendChild(box);
    }
    function resetFiles() { Object.keys(o.files).forEach(function (k) { files[k] = o.files[k]; }); persist(); ed.set(files[cur]); lab.resetDb(); run(); toast('Pliki przywrócone'); }
    setTimeout(function () { run('init'); }, 30);
    return { lab: lab, check: check, files: files, ed: ed };
  };

  /* ===================== ŚCIĄGA ===================== */
  function viewSciaga(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['Ściąga i słownik']]));
    w.appendChild(h('h1', null, 'Ściąga i słownik arkusza'));
    const G = TR.GUIDE || {};
    w.appendChild(h('p', { class: 'lead' }, 'Zwroty z arkuszy CKE i kod, który im odpowiada. Wzorce są gotowe do przepisania – na egzaminie nie masz internetu, więc najważniejsze naucz się pisać z pamięci.'));
    const tabs = h('div', { class: 'filters' }); const body = h('div');
    const secs = G.sciaga || [];
    let curS = S.set.sciaga || (secs[0] && secs[0].id);
    secs.forEach(function (s) { tabs.appendChild(h('button', { class: 'fbtn' + (s.id === curS ? ' on' : ''), onclick: function () { curS = s.id; S.set.sciaga = curS; save(); tabs.querySelectorAll('.fbtn').forEach(function (b) { b.classList.toggle('on', b.textContent === s.name); }); draw(); } }, s.name)); });
    w.appendChild(tabs); w.appendChild(body);
    function draw() {
      body.innerHTML = '';
      const s = secs.find(function (x) { return x.id === curS; }); if (!s) return;
      if (s.phrases) { const c = h('div', { class: 'card', style: { padding: '0' } }); s.phrases.forEach(function (p) { c.appendChild(h('div', { class: 'phrase' }, h('div', null, p[0]), h('div', { html: '<code>' + esc(p[1]) + '</code>' }))); }); body.appendChild(c); }
      if (s.md) body.appendChild(h('div', { class: 'prose', style: { marginTop: '12px' }, html: md(s.md) }));
    }
    draw();
    return 'Ściąga i słownik';
  }

  /* ===================== BAZA ARKUSZY ===================== */
  function viewBaza(w) {
    w.appendChild(crumbs([['Start', '#/'], ['INF.03'], ['Wszystkie arkusze']]));
    w.appendChild(h('h1', null, 'Wszystkie arkusze praktyczne'));
    w.appendChild(h('p', { class: 'lead' }, 'Każdy arkusz INF.03 od 2021 r. i EE.09 od 2019 r. z linkiem do PDF, zasad oceniania i plików. Oznaczenia pokazują, co w nim jest – wybieraj te, w których jest coś, czego jeszcze nie umiesz.'));
    const IDX = TR.SHEETS || [];
    const tagsAll = {}; IDX.forEach(function (x) { (x.tags || []).forEach(function (t) { tagsAll[t] = (tagsAll[t] || 0) + 1; }); });
    let sel = S.set.bazaTag || '';
    const bar = h('div', { class: 'filters' });
    bar.appendChild(h('button', { class: 'fbtn' + (!sel ? ' on' : ''), onclick: function () { sel = ''; S.set.bazaTag = ''; save(); route(); } }, 'Wszystkie'));
    Object.keys(tagsAll).sort(function (a, b) { return tagsAll[b] - tagsAll[a]; }).forEach(function (t) { bar.appendChild(h('button', { class: 'fbtn' + (sel === t ? ' on' : ''), onclick: function () { sel = t; S.set.bazaTag = t; save(); route(); } }, t + ' ' + tagsAll[t])); });
    w.appendChild(bar);
    const grid = h('div', { class: 'ex-grid' });
    IDX.filter(function (x) { return !sel || (x.tags || []).indexOf(sel) >= 0; }).slice().reverse().forEach(function (x) {
      const e = realByKey[x.key];
      const links = ghPdf({ key: x.key, pdf: x.pdf });
      grid.appendChild(h('div', { class: 'ex' }, h('div', { class: 'c' }, x.code), h('div', { class: 'th' }, cap(x.theme) || x.code), h('div', { class: 'row' }, (x.tags || []).map(function (t) { return h('span', { class: 'chip' }, t); })),
        h('div', { class: 'row', style: { marginTop: '4px' } }, links.sheet ? h('a', { class: 'btn sm', href: links.sheet, target: '_blank', rel: 'noopener' }, 'PDF ↗') : null, links.zo ? h('a', { class: 'btn sm ghost', href: links.zo, target: '_blank', rel: 'noopener' }, 'Ocenianie ↗') : null, e ? h('a', { class: 'btn sm ghost', href: '#/inf/arkusz/' + x.key }, 'SQL') : null)));
    });
    w.appendChild(grid);
    return 'Wszystkie arkusze';
  }

  /* ===================== start ===================== */
  function init() {
    try { const th = S.set.theme; if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) { }
    buildNav();
    document.getElementById('menubtn').addEventListener('click', openMenu);
    document.getElementById('scrim').addEventListener('click', closeMenu);
    document.getElementById('themebtn').addEventListener('click', function () {
      const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nx); S.set.theme = nx; save();
    });
    window.addEventListener('hashchange', route);
    TR.sql.ready('js/vendor/').then(function () { route(); }, function (e) { document.getElementById('main').innerHTML = '<div class="wrap"><div class="notice bad">Nie udało się uruchomić silnika SQL: ' + esc(e.message) + '</div></div>'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
