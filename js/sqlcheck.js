/* Sprawdzanie zapytań ucznia względem zapytania wzorcowego. */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const C = TR.sqlcheck = {};
  const E = TR.sql;

  function firstWord(sql) { const m = String(sql).trim().match(/^\(?\s*(\w+)(\s+\w+)?(\s+\w+)?/); return m ? (m[1] + ' ' + (m[2] || '') + ' ' + (m[3] || '')).toUpperCase().replace(/\s+/g, ' ').trim() : ''; }
  C.kindOf = function (sql) {
    const w = firstWord(sql);
    if (/^(SELECT|WITH)/.test(w)) return /\bRAND\s*\(/i.test(sql) ? 'random' : 'select';
    if (/^(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE)/.test(w)) return 'dml';
    if (/^CREATE USER/.test(w)) return 'user';
    if (/^(GRANT|REVOKE)/.test(w)) return 'grant';
    if (/^CREATE (OR REPLACE )?VIEW|^CREATE ALGORITHM/.test(w)) return 'view';
    if (/^CREATE TABLE/.test(w)) return 'create';
    if (/^ALTER/.test(w)) return 'alter';
    if (/^DROP TABLE/.test(w)) return 'drop';
    if (/^DROP USER/.test(w)) return 'user';
    return 'dml';
  };

  // deterministyczny RNG – wzorzec i uczeń dostają te same „losowe” liczby
  function seeded(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function lastSelect(results) {
    for (let i = results.length - 1; i >= 0; i--) if (results[i].kind === 'select') return results[i];
    return null;
  }
  function firstError(results) { for (let i = 0; i < results.length; i++) if (results[i].kind === 'error') return results[i]; return null; }

  function catOf(type) { return E.typeInfo(type).cat; }
  function snapshot(conn) {
    const out = { tables: {}, users: conn.users.map(function (u) { return u.user + '@' + u.host + '#' + (u.pass == null ? '' : u.pass); }).sort(), grants: [] };
    conn.tables().forEach(function (t) {
      const cols = conn.columns(t);
      const d = conn.dump(t);
      // wiersze w kolejności kolumn logicznych
      const idx = cols.map(function (c) { return d.columns.indexOf(c.name); });
      out.tables[t.toLowerCase()] = {
        name: t,
        cols: cols.map(function (c) { return { name: c.name, cat: catOf(c.type), type: c.type, notnull: c.notnull, def: c.def == null ? null : String(c.def).replace(/^'|'$/g, ''), unsigned: c.unsigned }; }),
        rows: d.rows.map(function (r) { return idx.map(function (i) { return E.norm(r[i], 2); }).join('¦'); }).sort()
      };
    });
    out.grants = conn.grants.map(function (g) {
      let tgt = g.target.toLowerCase(); if (tgt.indexOf('.') < 0) tgt = conn.name.toLowerCase() + '.' + tgt;
      const pr = g.privs.slice().map(function (p) { return p.replace(/\s*\(.*\)$/, ''); }).sort().join(',');
      return g.op + ' ' + pr + ' ON ' + tgt + ' TO ' + g.user + '@' + g.host;
    }).sort();
    return out;
  }
  C.snapshot = snapshot;

  function diff(ref, got, opt) {
    opt = opt || {};
    // użytkownicy
    if (ref.users.join() !== got.users.join()) {
      const ru = ref.users.filter(function (u) { return got.users.indexOf(u) < 0; });
      if (ru.length) {
        const want = ru[0].split(/[@#]/);
        const near = got.users.filter(function (u) { return u.split('@')[0] === want[0]; })[0];
        if (!near) return 'Nie ma użytkownika ' + want[0] + '. Składnia: CREATE USER \'' + want[0] + '\'@\'' + want[1] + '\' IDENTIFIED BY \'hasło\';';
        const g = near.split(/[@#]/);
        if (g[1] !== want[1]) return 'Użytkownik ' + want[0] + ' ma host „' + g[1] + '”, a powinien być „' + want[1] + '” (…@\'' + want[1] + '\').';
        return 'Hasło użytkownika ' + want[0] + ' jest inne niż w treści zadania – przepisz je znak w znak (wielkość liter i znaki specjalne mają znaczenie).';
      }
      return 'Utworzyłeś więcej użytkowników niż wymaga zadanie.';
    }
    if (ref.grants.join() !== got.grants.join()) {
      if (!got.grants.length) return 'Brak instrukcji GRANT nadającej prawa.';
      const r = ref.grants[0], g = got.grants[0];
      const rp = r.split(' ON ')[0].split(' ')[1], gp = g.split(' ON ')[0].split(' ')[1];
      if (rp !== gp) return 'Prawa się nie zgadzają: masz ' + gp.replace(/,/g, ', ') + ', a zadanie wymaga ' + rp.replace(/,/g, ', ') + '.';
      const rt = r.split(' ON ')[1].split(' TO ')[0], gt = g.split(' ON ')[1].split(' TO ')[0];
      if (rt !== gt) return 'Prawa nadane na „' + gt + '”, a powinny być na „' + rt + '” (baza.tabela).';
      return 'Prawa nadane innemu użytkownikowi lub hostowi: ' + g.split(' TO ')[1] + ' zamiast ' + r.split(' TO ')[1] + '.';
    }
    const rt = Object.keys(ref.tables).sort(), gt = Object.keys(got.tables).sort();
    for (let i = 0; i < rt.length; i++) if (gt.indexOf(rt[i]) < 0) return 'Brakuje tabeli/widoku „' + ref.tables[rt[i]].name + '”.' + (opt.kind === 'drop' ? '' : ' Sprawdź nazwę.');
    for (let i = 0; i < gt.length; i++) if (rt.indexOf(gt[i]) < 0) return opt.kind === 'drop' ? 'Tabela „' + got.tables[gt[i]].name + '” nadal istnieje.' : 'Powstała dodatkowa tabela „' + got.tables[gt[i]].name + '” – sprawdź nazwę (np. literówka).';
    for (let i = 0; i < rt.length; i++) {
      const A = ref.tables[rt[i]], B = got.tables[rt[i]];
      const an = A.cols.map(function (c) { return c.name.toLowerCase(); }), bn = B.cols.map(function (c) { return c.name.toLowerCase(); });
      for (let j = 0; j < an.length; j++) if (bn.indexOf(an[j]) < 0) return 'W tabeli ' + A.name + ' brakuje kolumny „' + A.cols[j].name + '”.';
      for (let j = 0; j < bn.length; j++) if (an.indexOf(bn[j]) < 0) return 'W tabeli ' + A.name + ' jest kolumna „' + B.cols[j].name + '”, której nie powinno być (zła nazwa albo nieusunięta kolumna).';
      for (let j = 0; j < A.cols.length; j++) {
        const a = A.cols[j], b = B.cols[bn.indexOf(an[j])];
        if (opt.strictTypes !== false && a.cat !== b.cat && !(a.cat === 'bool' && b.cat === 'int') && !(a.cat === 'int' && b.cat === 'bool')) return 'Kolumna „' + a.name + '” ma zły typ: ' + b.type + '. Oczekiwany typ: ' + label(a.cat) + '.';
        if (opt.checkUnsigned && a.unsigned && !b.unsigned) return 'Kolumna „' + a.name + '” powinna przyjmować tylko liczby naturalne → dopisz UNSIGNED.';
        if (opt.checkLen) { const la = (a.type.match(/\((\d+)/) || [])[1], lb = (b.type.match(/\((\d+)/) || [])[1]; if (la && la !== lb && !(a.cat === 'text' && /TEXT/i.test(b.type) && +la > 255)) return 'Kolumna „' + a.name + '”: rozmiar ' + (lb || 'brak') + ', a powinien być ' + la + ' (np. ' + a.type.replace(/\s.*$/, '') + ').'; }
        if (a.notnull !== b.notnull && opt.checkNull) return 'Kolumna „' + a.name + '”: ' + (a.notnull ? 'dopisz NOT NULL' : 'usuń NOT NULL') + '.';
        if ((a.def != null) && String(a.def) !== String(b.def)) return 'Kolumna „' + a.name + '” powinna mieć wartość domyślną ' + a.def + ' (DEFAULT ' + a.def + ').';
      }
      if (an.join() !== bn.join() && opt.checkOrder) {
        return 'Kolumny są w złej kolejności. Oczekiwana kolejność: ' + A.cols.map(function (c) { return c.name; }).join(', ') + ' (użyj AFTER kolumna).';
      }
      if (A.rows.length !== B.rows.length) {
        const d = B.rows.length - A.rows.length;
        return 'Tabela ' + A.name + ': ' + (d > 0 ? 'o ' + d + ' wiersz(y) za dużo' : 'brakuje ' + (-d) + ' wiersz(y)') + '. ' + (opt.kind === 'dml' ? (d < 0 ? 'Czy DELETE nie usuwa za dużo?' : 'Czy nie wstawiłeś rekordu dwa razy?') : '');
      }
      if (A.rows.join('\n') !== B.rows.join('\n')) {
        // policz różniące się
        let n = 0; const bset = B.rows.slice();
        A.rows.forEach(function (r) { const k = bset.indexOf(r); if (k < 0) n++; else bset.splice(k, 1); });
        return 'Tabela ' + A.name + ': ' + n + ' wiersz(y) różni się od oczekiwanych. ' + (opt.kind === 'dml' ? 'Sprawdź wartości w SET/VALUES i warunek WHERE (czy nie zmieniasz za dużo albo za mało wierszy).' : '');
      }
    }
    return null;
  }
  function label(cat) { return { int: 'liczba całkowita (INT, TINYINT…)', real: 'liczba rzeczywista (DECIMAL, FLOAT, DOUBLE)', text: 'tekst (VARCHAR, TEXT)', date: 'data (DATE, DATETIME)', bool: 'logiczny (BOOLEAN / TINYINT(1))' }[cat] || cat; }

  /* task: {ref, setup?, kind?, ordered?, aliases?(array nazw), checkUnsigned, checkLen, checkOrder, checkNull, tol}
     open(variant) -> Conn */
  C.check = function (task, userText, open) {
    const must = (task.must || []).slice();
    if (C.kindOf(task.ref) === 'random') must.push({ re: /RAND\s*\(/i, msg: 'Wynik ma być losowy – użyj ORDER BY RAND().' });
    if (/\(\s*SELECT/i.test(task.ref) && /zagnieżdż|podzapyt/i.test(task.q || task.text || '')) must.push({ re: /\(\s*SELECT/i, msg: 'Zadanie wymaga zapytania zagnieżdżonego: … WHERE pole = (SELECT …).' });
    for (let i = 0; i < must.length; i++) if (!must[i].re.test(String(userText || ''))) return { ok: false, msg: must[i].msg };
    const r = check1(task, userText, open);
    if (!r.ok && !r.error && task.alts && task.alts.length) {
      for (let i = 0; i < task.alts.length; i++) { const t2 = Object.assign({}, task, { ref: task.alts[i], alts: null }); const r2 = check1(t2, userText, open); if (r2.ok) return r2; }
    }
    return r;
  };
  function check1(task, userText, open) {
    const text = String(userText || '').trim();
    if (!text) return { ok: false, msg: 'Wpisz zapytanie.' };
    const stmts = E.split(text);
    if (!stmts.length) return { ok: false, msg: 'Wpisz zapytanie.' };
    const kind = task.kind || C.kindOf(task.ref);
    E.clock = Date.now();
    const seed = 12345;
    try {
      const variants = task.noB ? ['A'] : ['A', 'B'];
      let display = null;
      for (let vi = 0; vi < variants.length; vi++) {
        const v = variants[vi];
        const cRef = open(v), cUser = open(v);
        if (!cRef) break;
        if (task.setup) { E.rng = seeded(seed + 7); cRef.runText(task.setup); E.rng = seeded(seed + 7); cUser.runText(task.setup); }
        E.rng = seeded(seed); const rRef = cRef.runText(task.ref);
        const refErr = firstError(rRef);
        if (refErr) return { ok: false, msg: 'Błąd wzorca: ' + refErr.error, internal: true };
        E.rng = seeded(seed); const rUser = cUser.runText(text);
        if (vi === 0) display = rUser;
        const err = firstError(rUser);
        if (err) return { ok: false, msg: 'MySQL zwraca błąd: ' + err.error, results: rUser, error: true };
        let res;
        if (kind === 'select' || kind === 'random') {
          const a = lastSelect(rRef), b = lastSelect(rUser);
          if (!b) return { ok: false, msg: 'To zadanie wymaga zapytania SELECT – Twoje zapytanie nie zwraca tabeli wyników.', results: rUser };
          const opt = { ordered: task.ordered != null ? task.ordered : /ORDER\s+BY/i.test(task.ref) && !/RAND\s*\(/i.test(task.ref), tol: task.tol, limit: /LIMIT/i.test(task.ref) };
          if (task.aliases) { opt.aliases = {}; task.aliases.forEach(function (al) { const i = a.columns.findIndex(function (c) { return c.toLowerCase() === al.toLowerCase(); }); if (i >= 0) opt.aliases[i] = al; }); }
          if (kind === 'random') {
            opt.random = true;
            const poolSql = task.pool || task.ref.replace(/ORDER\s+BY\s+RAND\s*\(\s*\)/i, '').replace(/LIMIT\s+\d+(\s*,\s*\d+)?/i, '');
            const pr = cRef.run1(poolSql); opt.pool = pr.rows || [];
          }
          res = E.compare(a, b, opt);
          if (!res.ok) { res.results = display; if (vi > 0) res.msg = 'Na bazie z dodatkowymi rekordami wynik jest zły – zapytanie musi być uniwersalne, a nie dopasowane do obecnych danych. (' + res.msg + ')'; return res; }
        } else {
          const d = diff(snapshot(cRef), snapshot(cUser), { kind: kind, checkUnsigned: task.checkUnsigned, checkLen: task.checkLen, checkOrder: task.checkOrder, checkNull: task.checkNull, strictTypes: task.strictTypes });
          if (d) return { ok: false, msg: (vi > 0 ? 'Na bazie z dodatkowymi rekordami: ' : '') + d, results: display };
        }
        cRef.close(); cUser.close();
      }
      return { ok: true, msg: kind === 'random' ? 'Dobrze! (wynik losowy – przy każdym uruchomieniu inne wiersze)' : 'Dobrze! Wynik zgodny z oczekiwanym' + (variants.length > 1 ? ', także na bazie z dodatkowymi rekordami.' : '.'), results: display };
    } finally { E.clock = null; E.rng = null; }
  }
})(typeof window !== 'undefined' ? window : globalThis);
