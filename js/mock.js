/* Arkusz próbny: treść jak w arkuszu CKE, licznik 150 minut, ocena R.1–R.5 */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const LIMIT = 150 * 60 * 1000;
  const RES = [['R.1', 'Operacje na bazie danych'], ['R.2', 'Zawartość witryny (HTML)'], ['R.3', 'Działanie witryny'], ['R.4', 'Styl CSS'], ['R.5', 'Skrypty']];

  function fmt(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
    return (hh ? hh + ':' : '') + String(mm).padStart(hh ? 2 : 1, '0') + ':' + String(ss).padStart(2, '0');
  }

  function blocks(h, layout) {
    const box = h('figure', { class: 'blocks', 'aria-label': 'Podział strony na bloki' });
    layout.forEach(function (row) {
      const r = h('div', { class: 'brow' });
      for (let i = 0; i < row.length; i += 2) {
        const wide = row.length === 4 ? (i === 0 ? 1 : 3) : 1;
        r.appendChild(h('div', { class: 'b', style: { flex: String(wide) } }, h('code', null, '<' + row[i] + '>'), h('span', null, row[i + 1])));
      }
      box.appendChild(r);
    });
    box.appendChild(h('figcaption', null, 'Obraz 1. Podział strony na bloki'));
    return box;
  }

  TR.viewMock = function (w, id, ctx) {
    const h = ctx.h, S = ctx.S;
    const m = (TR.MOCK || []).find(function (x) { return x.id === id; });
    if (!m) { w.appendChild(h('div', { class: 'notice bad' }, 'Nie ma takiego arkusza.')); return 'Arkusz'; }
    S.mock = S.mock || {};
    const st = S.mock[m.id] = Object.assign({ acc: 0, since: null, hist: [], manual: {} }, S.mock[m.id] || {});
    function save() { ctx.save(); }
    function elapsed() { return st.acc + (st.since ? Date.now() - st.since : 0); }

    w.appendChild(ctx.crumbs([['Start', '#/'], ['INF.03'], ['Arkusze próbne', '#/inf/probne'], [m.title]]));

    // ---------- pasek arkusza: czas, baza, wynik ----------
    const clock = h('b', { class: 'mclock', 'aria-live': 'off' }, fmt(LIMIT));
    const clockBar = h('div', { class: 'bar' }, h('i', { style: { width: '0%' } }));
    const startBtn = h('button', { class: 'btn pri', type: 'button', onclick: toggle }, 'Start');
    const resetBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: resetTime }, 'Wyzeruj czas');
    const pill = h('button', { class: 'mpill', type: 'button', title: 'Pozostały czas – kliknij, żeby zatrzymać lub wznowić', onclick: toggle, hidden: true });
    document.body.appendChild(pill); ctx.onLeave(function () { pill.remove(); });
    const bar = h('section', { class: 'mockbar' },
      h('div', { class: 'mhead' },
        h('div', { style: { minWidth: '0' } },
          h('div', { class: 'row', style: { gap: '6px', marginBottom: '4px' } }, h('span', { class: 'chip code' }, m.code), h('span', { class: 'chip' }, m.kind), ctx.isDone(m.id) ? h('span', { class: 'chip ok' }, 'zdany') : null),
          h('h1', null, m.title),
          h('p', { class: 'muted small', style: { margin: '0' } }, 'Czas pracy: 150 minut · ocena: rezultaty R.1–R.5 · próg zdania części praktycznej: 75% punktów')),
        h('div', { class: 'mtime' }, h('span', { class: 'small muted' }, 'Pozostało'), clock, clockBar, h('div', { class: 'row', style: { gap: '6px', justifyContent: 'flex-end' } }, resetBtn, startBtn))),
      h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
        h('button', { class: 'btn sm', type: 'button', onclick: function () { ctx.download(m.db + '.sql', TR.dbgen.mysql(m.db), 'application/sql;charset=utf-8'); } }, 'Pobierz ' + m.db + '.sql (do XAMPP)'),
        h('span', { class: 'small muted' }, 'Pliki tworzysz w zakładkach edytora; „Sprawdź” ocenia cały arkusz.')));
    w.appendChild(bar);
    const score = h('section', { class: 'mscore', 'aria-live': 'polite' });
    w.appendChild(score);

    let warned = elapsed() >= LIMIT;
    function tick() {
      const e = elapsed(), left = LIMIT - e;
      clock.textContent = left >= 0 ? fmt(left) : '−' + fmt(-left);
      clock.classList.toggle('over', left < 0);
      clock.classList.toggle('low', left >= 0 && left < 15 * 60 * 1000);
      clockBar.firstChild.style.width = Math.min(100, e / LIMIT * 100) + '%';
      startBtn.textContent = st.since ? 'Pauza' : (e > 0 ? 'Wznów' : 'Start');
      pill.hidden = !st.since && e === 0;
      pill.textContent = (st.since ? '' : '❚❚ ') + (left >= 0 ? fmt(left) : '−' + fmt(-left));
      pill.classList.toggle('over', left < 0); pill.classList.toggle('paused', !st.since);
      if (left < 0 && !warned && st.since) { warned = true; ctx.toast('Minęło 150 minut – na egzaminie to koniec. Sprawdź, ile masz punktów.'); }
    }
    function toggle() { if (st.since) { st.acc += Date.now() - st.since; st.since = null; } else st.since = Date.now(); save(); tick(); }
    function resetTime() { st.acc = 0; st.since = null; warned = false; save(); tick(); }
    const iv = setInterval(tick, 1000); ctx.onLeave(function () { clearInterval(iv); });
    tick();

    // ---------- przestrzeń robocza ----------
    const env = TR.labWorkspace(w, {
      id: 'mock_' + m.id, title: 'Treść zadania', intro: m.sheet, afterIntro: m.layout ? blocks(h, m.layout) : null,
      checks: m.checks, files: m.files, entry: m.entry, db: m.db, sol: m.sol, hideReq: true, noVerdict: true,
      onResult: function (res, peek) { return showScore(res, peek); }
    });

    function showScore(res, peek) {
      const groups = RES.map(function (r) {
        const idx = m.checks.map(function (c, i) { return c.r === r[0] ? i : -1; }).filter(function (i) { return i >= 0; });
        const ok = idx.filter(function (i) { return res[i].ok; }).length;
        return { r: r[0], name: r[1], ok: ok, max: idx.length, miss: idx.filter(function (i) { return !res[i].ok; }).map(function (i) { return res[i]; }) };
      });
      const pts = groups.reduce(function (a, g) { return a + g.ok; }, 0), max = groups.reduce(function (a, g) { return a + g.max; }, 0);
      const pct = max ? Math.round(pts / max * 100) : 0, pass = pct >= 75;
      st.hist.push({ t: Date.now(), pts: pts, max: max, time: elapsed(), peek: !!peek }); if (st.hist.length > 20) st.hist.shift();
      st.best = Math.max(st.best || 0, pct);
      ctx.mark(m.id, pass && !peek, { peek: peek, store: { best: st.best } });
      save();
      score.innerHTML = '';
      score.appendChild(h('div', { class: 'mtotal ' + (pass ? 'ok' : 'bad') },
        h('div', null, h('span', { class: 'small' }, 'Wynik automatyczny'), h('b', null, pts + ' / ' + max + ' pkt'), h('span', null, pct + '%')),
        h('p', null, pass ? (peek ? 'Próg 75% przekroczony, ale podglądałeś rozwiązanie – zrób arkusz jeszcze raz bez niego.' : 'Zdałbyś część praktyczną (próg 75%). Teraz zrób to samo w XAMPP, na czas.') : 'Do progu 75% brakuje ' + Math.max(0, Math.ceil(max * 0.75) - pts) + ' pkt. Niżej masz dokładnie, które kryteria nie przeszły.'),
        h('p', { class: 'small', style: { margin: '0' } }, 'Czas: ' + fmt(elapsed()) + (elapsed() > LIMIT ? ' – po czasie' : '') + (st.hist.length > 1 ? ' · poprzednia próba: ' + st.hist[st.hist.length - 2].pts + '/' + st.hist[st.hist.length - 2].max : ''))));
      const tbl = h('div', { class: 'mres' });
      groups.forEach(function (g) {
        const row = h('details', { class: 'mrow', open: g.miss.length && g.miss.length <= 4 ? true : null },
          h('summary', null, h('span', { class: 'chip code' }, g.r), h('span', { class: 'mname' }, g.name), h('span', { class: 'bar' + (g.ok === g.max ? ' ok' : '') }, h('i', { style: { width: (g.max ? g.ok / g.max * 100 : 0) + '%' } })), h('b', null, g.ok + '/' + g.max)));
        if (g.miss.length) row.appendChild(h('ul', null, g.miss.map(function (x) { return h('li', null, h('b', null, x.d), x.msg ? h('span', { class: 'why' }, x.msg) : null); })));
        else row.appendChild(h('p', { class: 'small muted' }, 'Wszystkie kryteria spełnione.'));
        tbl.appendChild(row);
      });
      score.appendChild(tbl);
      if (m.manual && m.manual.length) {
        const man = h('div', { class: 'mman' }, h('b', null, 'Sprawdź sam (tego aplikacja nie widzi, a na egzaminie jest punktowane):'));
        m.manual.forEach(function (t, i) {
          const cb = h('input', { type: 'checkbox', id: 'mm' + i }); cb.checked = !!st.manual[i];
          cb.addEventListener('change', function () { st.manual[i] = cb.checked; save(); });
          man.appendChild(h('label', { for: 'mm' + i }, cb, ' ' + t));
        });
        score.appendChild(man);
      }
      score.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return pass;
    }
    return m.title;
  };
})(typeof window !== 'undefined' ? window : globalThis);
