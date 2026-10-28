/* Matematyka – lista zadań maturalnych z natychmiastowym sprawdzaniem */
(function () {
  'use strict';
  const TR = window.TR;
  // normalizacja krótkiej odpowiedzi: spacje, przecinek dziesiętny, minusy
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').replace(/^[a-z]+=/, ''); }
  function num(s) { const m = s.match(/^(-?\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?$/); return m ? (m[2] ? +m[1] / +m[2] : +m[1]) : null; }
  function checkAnswer(t, val) {
    if (t.opts) return val === t.a;
    const v = norm(val); if (!v) return false;
    return t.ans.some(function (a) { const n = norm(a); if (n === v) return true; const x = num(n), y = num(v); return x != null && y != null && Math.abs(x - y) < 1e-9; });
  }
  TR.matCheck = checkAnswer;

  TR.viewMat = function (w, c) {
    const h = c.h;
    w.appendChild(c.crumbs([['Start', '#/'], ['Matura'], ['Matematyka']]));
    w.appendChild(h('div', { class: 'eyebrow' }, 'Matura · poziom podstawowy'));
    w.appendChild(h('h1', null, 'Matematyka – zadania z arkuszy CKE'));
    w.appendChild(h('p', { class: 'lead' }, 'Prawdziwe zadania z matur (formuła 2023), pogrupowane po działach. Przy każdym źródło: rok i numer zadania. Zamknięte – klikasz odpowiedź; otwarte – wpisujesz sam wynik, a pełne rozwiązanie robisz na kartce.'));
    let filter = c.S.set.matFilter || 'all';
    const fwrap = h('div', { class: 'filters', role: 'group', 'aria-label': 'Filtr' });
    const list = h('div');
    [['all', 'Wszystkie'], ['todo', 'Do zrobienia'], ['f3', 'Pewniaki'], ['done', 'Zrobione']].forEach(function (f) {
      fwrap.appendChild(h('button', { class: 'fbtn' + (filter === f[0] ? ' on' : ''), onclick: function () { filter = f[0]; c.S.set.matFilter = filter; c.save(); fwrap.querySelectorAll('.fbtn').forEach(function (b) { b.classList.toggle('on', b.textContent === f[1]); }); draw(); } }, f[1]));
    });
    w.appendChild(fwrap); w.appendChild(list);
    function draw() {
      list.innerHTML = '';
      (TR.MATG || []).forEach(function (g) {
        const ts = (TR.MAT || []).filter(function (t) { return t.g === g.id; }).filter(function (t) { return filter === 'all' || (filter === 'todo' && !c.isDone(t.id)) || (filter === 'done' && c.isDone(t.id)) || (filter === 'f3' && t.f === 3); });
        if (!ts.length) return;
        const grp = h('section', { class: 'group' }, h('div', { class: 'group-head' }, h('h2', null, g.name), c.freqChip(g.f), h('span', { class: 'chip' }, ts.filter(function (t) { return c.isDone(t.id); }).length + '/' + ts.length), h('div', { class: 'note' }, g.note)));
        ts.forEach(function (t) { grp.appendChild(card(t)); });
        list.appendChild(grp);
      });
      if (!list.children.length) list.appendChild(h('p', { class: 'muted' }, 'Brak zadań w tym filtrze.'));
    }
    function card(t) {
      const verdict = h('div'); const hintBox = h('div');
      const box = h('div', { class: 'card', style: { marginBottom: '10px' } },
        h('div', { class: 'row', style: { marginBottom: '6px' } }, h('span', { class: 'chip code' }, t.src), t.pts ? h('span', { class: 'chip' }, t.pts + ' pkt') : null, c.isDone(t.id) ? h('span', { class: 'chip ok' }, 'zrobione') : null),
        h('p', { class: 'q' }, t.q));
      let input;
      if (t.opts) {
        const opts = h('div', { class: 'row', role: 'radiogroup' });
        t.opts.forEach(function (o, i) {
          const L = 'ABCD'[i];
          opts.appendChild(h('button', { class: 'btn sm', onclick: function () { submit(L); opts.querySelectorAll('.btn').forEach(function (b) { b.classList.remove('pri'); }); this.classList.add('pri'); } }, L + '. ' + o));
        });
        box.appendChild(opts);
      } else {
        input = h('input', { class: 'search', type: 'text', placeholder: 'Wynik', 'aria-label': 'Wynik', style: { maxWidth: '220px' }, onkeydown: function (e) { if (e.key === 'Enter') submit(this.value); } });
        box.appendChild(h('div', { class: 'row' }, input, h('button', { class: 'btn sm pri', onclick: function () { submit(input.value); } }, 'Sprawdź')));
      }
      box.appendChild(verdict);
      box.appendChild(h('div', { class: 'row', style: { marginTop: '6px' } }, t.hint ? h('button', { class: 'btn sm ghost', onclick: function () { hintBox.innerHTML = ''; hintBox.appendChild(h('div', { class: 'hint' }, t.hint)); } }, 'Podpowiedź') : null));
      box.appendChild(hintBox);
      function submit(val) {
        const ok = checkAnswer(t, val);
        c.mark(t.id, ok);
        verdict.innerHTML = '';
        verdict.appendChild(h('div', { class: 'result ' + (ok ? 'ok' : 'bad'), role: 'status' }, ok ? '✓ Dobrze.' : '✗ Jeszcze nie.', ok ? null : h('span', { class: 'sub' }, t.opts ? 'Sprawdź podpowiedź i policz jeszcze raz.' : 'Wpisz sam wynik: liczbę, ułamek a/b albo zapis z √ lub π.')));
      }
      return box;
    }
    draw();
    return 'Matematyka';
  };
})();
