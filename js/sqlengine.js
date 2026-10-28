/* Silnik SQL: sql.js (SQLite) + warstwa zgodności z MySQL/MariaDB, której używa egzamin INF.03.
   Działa w przeglądarce i w Node (testy). */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const E = TR.sql = {};

  /* ---------- inicjalizacja ---------- */
  let SQLlib = null;
  E.ready = function (base) {
    if (E._p) return E._p;
    base = base || 'js/vendor/';
    E._p = new Promise(function (resolve, reject) {
      function viaAsm() {
        if (typeof root.initSqlJs === 'function' && root.__sqlAsm) return root.initSqlJs().then(resolve, reject);
        const s = document.createElement('script');
        s.src = base + 'sql-asm.js';
        s.onload = function () { root.__sqlAsm = 1; root.initSqlJs().then(function (L) { SQLlib = L; resolve(L); }, reject); };
        s.onerror = function () { reject(new Error('Nie udało się wczytać silnika SQL.')); };
        document.head.appendChild(s);
      }
      if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
        const init = require(base + 'sql-wasm.js');
        init({ locateFile: function (f) { return base + f; } }).then(function (L) { SQLlib = L; resolve(L); }, reject);
        return;
      }
      function loadWasm() {
        root.initSqlJs({ locateFile: function (f) { return base + f; } })
          .then(function (L) { SQLlib = L; resolve(L); })
          .catch(function () { root.initSqlJs = undefined; viaAsm(); });
      }
      if (typeof root.initSqlJs === 'function') return loadWasm();
      const s = document.createElement('script');
      s.src = base + 'sql-wasm.js';
      s.onload = loadWasm;
      s.onerror = viaAsm;
      document.head.appendChild(s);
    }).then(function (L) { SQLlib = L; return L; });
    return E._p;
  };

  /* ---------- funkcje MySQL brakujące w SQLite ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  E.clock = null; // ustawiany przy sprawdzaniu, żeby NOW() było takie samo dla wzorca i ucznia
  function nowD() { return E.clock ? new Date(E.clock) : new Date(); }
  function localDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function localTime(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()); }
  function parseD(v) {
    if (v == null) return null;
    const m = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }
  function fixed(fn, n) { Object.defineProperty(fn, 'length', { value: n }); return fn; }
  const DNI = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MIES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function addFunctions(db) {
    const f = function (name, fn) { db.create_function(name, fn); };
    f('MONTH', function (d) { const x = parseD(d); return x ? x.getMonth() + 1 : null; });
    f('YEAR', function (d) { const x = parseD(d); return x ? x.getFullYear() : null; });
    f('DAY', function (d) { const x = parseD(d); return x ? x.getDate() : null; });
    f('DAYOFMONTH', function (d) { const x = parseD(d); return x ? x.getDate() : null; });
    f('DAYOFWEEK', function (d) { const x = parseD(d); return x ? x.getDay() + 1 : null; });
    f('WEEKDAY', function (d) { const x = parseD(d); return x ? (x.getDay() + 6) % 7 : null; });
    f('DAYNAME', function (d) { const x = parseD(d); return x ? DNI[x.getDay()] : null; });
    f('MONTHNAME', function (d) { const x = parseD(d); return x ? MIES[x.getMonth()] : null; });
    f('HOUR', function (d) { const m = String(d).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] : null; });
    f('MINUTE', function (d) { const m = String(d).match(/(\d{1,2}):(\d{2})/); return m ? +m[2] : null; });
    f('CURDATE', function () { return localDate(nowD()); });
    f('CURRENT_DATE', function () { return localDate(nowD()); });
    f('CURTIME', function () { return localTime(nowD()); });
    f('NOW', function () { const d = nowD(); return localDate(d) + ' ' + localTime(d); });
    f('SYSDATE', function () { const d = nowD(); return localDate(d) + ' ' + localTime(d); });
    f('DATEDIFF', function (a, b) { const x = parseD(a), y = parseD(b); if (!x || !y) return null; const ux = Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()), uy = Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()); return Math.round((ux - uy) / 864e5); });
    f('RAND', function () { return E.rng ? E.rng() : Math.random(); });
    f('RAND', function (seed) { return E.rng ? E.rng() : Math.random(); });
    f('MOD', function (a, b) { return b == 0 ? null : a % b; });
    f('POW', function (a, b) { return Math.pow(a, b); });
    f('POWER', function (a, b) { return Math.pow(a, b); });
    f('SQRT', function (a) { return a < 0 ? null : Math.sqrt(a); });
    f('PI', function () { return Math.PI; });
    f('CEIL', function (a) { return a == null ? null : Math.ceil(a); });
    f('CEILING', function (a) { return a == null ? null : Math.ceil(a); });
    f('FLOOR', function (a) { return a == null ? null : Math.floor(a); });
    f('TRUNCATE', function (a, d) { const p = Math.pow(10, d || 0); return Math.trunc(a * p) / p; });
    f('LEFT', function (s, n) { return s == null ? null : String(s).slice(0, n); });
    f('RIGHT', function (s, n) { return s == null ? null : (n <= 0 ? '' : String(s).slice(-n)); });
    f('LCASE', function (s) { return s == null ? null : String(s).toLowerCase(); });
    f('UCASE', function (s) { return s == null ? null : String(s).toUpperCase(); });
    f('LOWER', function (s) { return s == null ? null : String(s).toLowerCase(); });
    f('UPPER', function (s) { return s == null ? null : String(s).toUpperCase(); });
    f('CHAR_LENGTH', function (s) { return s == null ? null : Array.from(String(s)).length; });
    f('REVERSE', function (s) { return s == null ? null : Array.from(String(s)).reverse().join(''); });
    f('IF', function (c, a, b) { return c ? a : b; });
    f('DATE_FORMAT', function (d, fmt) {
      const x = parseD(d); if (!x) return null;
      return String(fmt).replace(/%([a-zA-Z%])/g, function (_, c) {
        switch (c) {
          case 'Y': return x.getFullYear(); case 'y': return String(x.getFullYear()).slice(2);
          case 'm': return pad2(x.getMonth() + 1); case 'c': return x.getMonth() + 1;
          case 'd': return pad2(x.getDate()); case 'e': return x.getDate();
          case 'H': return pad2(x.getHours()); case 'i': return pad2(x.getMinutes()); case 's': return pad2(x.getSeconds());
          case 'M': return MIES[x.getMonth()]; case 'W': return DNI[x.getDay()];
          case '%': return '%'; default: return c;
        }
      });
    });
    for (let k = 1; k <= 8; k++) {
      db.create_function('CONCAT', fixed(function () { for (let i = 0; i < arguments.length; i++) if (arguments[i] == null) return null; return Array.prototype.join.call(arguments, ''); }, k));
      if (k >= 2) db.create_function('CONCAT_WS', fixed(function () { const a = Array.prototype.slice.call(arguments); const sep = a.shift(); return a.filter(function (x) { return x != null; }).join(sep); }, k));
    }
  }

  /* ---------- skaner tekstu SQL ---------- */
  // dzieli tekst na instrukcje po średnikach poza napisami i komentarzami
  E.split = function (text) {
    const out = []; let cur = ''; let i = 0; const s = String(text || '');
    while (i < s.length) {
      const c = s[i], n = s[i + 1];
      if (c === "'" || c === '"' || c === '`') {
        let j = i + 1;
        while (j < s.length) { if (s[j] === '\\' && c !== '`') { j += 2; continue; } if (s[j] === c) { if (s[j + 1] === c) { j += 2; continue; } break; } j++; }
        cur += s.slice(i, j + 1); i = j + 1; continue;
      }
      if ((c === '-' && n === '-') || c === '#') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; cur += ' '; continue; }
      if (c === '/' && n === '*') { const j = s.indexOf('*/', i + 2); i = j < 0 ? s.length : j + 2; cur += ' '; continue; }
      if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
      cur += c; i++;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };

  // tłumaczenie składni MySQL poza napisami: dzielenie jak w MySQL, CURRENT_DATE/TIME jako czas lokalny
  function fixDivision(sql) {
    let out = ''; let i = 0;
    while (i < sql.length) {
      const c = sql[i];
      if (c === "'" || c === '"' || c === '`') {
        let j = i + 1;
        while (j < sql.length) { if (sql[j] === '\\' && c !== '`') { j += 2; continue; } if (sql[j] === c) { if (sql[j + 1] === c) { j += 2; continue; } break; } j++; }
        out += sql.slice(i, j + 1); i = j + 1; continue;
      }
      if (c === '/') { out += '* 1.0 /'; i++; continue; }
      if (/[A-Za-z_]/.test(c) && (i === 0 || !/[\w$.]/.test(sql[i - 1]))) {
        const m = sql.slice(i).match(/^[A-Za-z_][\w$]*/); const w = m[0]; const W = w.toUpperCase();
        let rest = sql.slice(i + w.length); const par = rest.match(/^\s*\(\s*\)/);
        const map = { CURRENT_DATE: 'CURDATE()', CURRENT_TIME: 'CURTIME()', CURRENT_TIMESTAMP: 'NOW()', LOCALTIME: 'NOW()', LOCALTIMESTAMP: 'NOW()', UTC_DATE: 'CURDATE()' };
        if (map[W]) { out += map[W]; i += w.length + (par ? par[0].length : 0); continue; }
        if (W === 'DIV') { out += '/'; i += 3; continue; }
        out += w; i += w.length; continue;
      }
      out += c; i++;
    }
    return out;
  }

  function unq(s) { s = String(s || '').trim(); if (/^(['"`]).*\1$/.test(s)) return s.slice(1, -1); return s; }

  /* ---------- typy kolumn ---------- */
  function typeInfo(def) {
    const t = String(def || '').trim();
    const m = t.match(/^([a-zA-Z]+)\s*(\(([^)]*)\))?/);
    const base = m ? m[1].toUpperCase() : '';
    const args = m && m[3] ? m[3] : '';
    let cat = 'other';
    if (/^(TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT)$/.test(base)) cat = 'int';
    else if (/^(DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL)$/.test(base)) cat = 'real';
    else if (/^(CHAR|VARCHAR|TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT)$/.test(base)) cat = 'text';
    else if (/^(DATE|DATETIME|TIMESTAMP|TIME|YEAR)$/.test(base)) cat = 'date';
    else if (/^(BOOL|BOOLEAN|BIT)$/.test(base)) cat = 'bool';
    return {
      base: base, args: args, cat: cat,
      unsigned: /\bUNSIGNED\b/i.test(t), notnull: /\bNOT\s+NULL\b/i.test(t),
      def: (t.match(/\bDEFAULT\s+('(?:[^']*)'|"(?:[^"]*)"|[^\s,]+)/i) || [])[1],
      ai: /\bAUTO_INCREMENT\b/i.test(t), pk: /\bPRIMARY\s+KEY\b/i.test(t), raw: t
    };
  }
  E.typeInfo = typeInfo;

  // tłumaczy definicję kolumny MySQL na SQLite
  function colDefToSqlite(def) {
    let d = def.replace(/\b(UNSIGNED|ZEROFILL|SIGNED)\b/gi, '')
      .replace(/\bCHARACTER\s+SET\s+\w+/gi, '').replace(/\bCHARSET\s+\w+/gi, '')
      .replace(/\bCOLLATE\s+\w+/gi, '').replace(/\bCOMMENT\s+'[^']*'/gi, '')
      .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(\(\))?/gi, '');
    if (/\bAUTO_INCREMENT\b/i.test(d)) {
      d = d.replace(/\bAUTO_INCREMENT\b/gi, '').replace(/^(\s*[`"]?\w+[`"]?\s+)(TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT)(\s*\(\s*\d+\s*\))?/i, '$1INTEGER');
    }
    if (/^\s*[`"]?\w+[`"]?\s+(VARCHAR|CHAR|TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT)\b/i.test(d) && !/COLLATE/i.test(d)) d += ' COLLATE NOCASE';
    return d.replace(/\s+/g, ' ').trim();
  }

  // dzieli listę po przecinkach na najwyższym poziomie nawiasów
  function splitTop(s) {
    const out = []; let depth = 0, cur = '', q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
      if (c === '(') depth++; if (c === ')') depth--;
      if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  /* ---------- połączenie (baza w pamięci) ---------- */
  function Conn(sqlDb, name) {
    this.db = sqlDb; this.name = name || 'baza';
    this.users = []; this.grants = []; this.meta = {}; this.created = {};
    addFunctions(sqlDb);
  }
  E.Conn = Conn;

  E.openScript = function (script, name) {
    const db = new SQLlib.Database();
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(script);
    return new Conn(db, name);
  };
  E.openBytes = function (bytes, name) { return new Conn(new SQLlib.Database(bytes), name); };
  Conn.prototype.clone = function () {
    const c = new Conn(new SQLlib.Database(this.db.export()), this.name);
    c.users = JSON.parse(JSON.stringify(this.users)); c.grants = JSON.parse(JSON.stringify(this.grants));
    c.meta = JSON.parse(JSON.stringify(this.meta)); c.created = JSON.parse(JSON.stringify(this.created));
    return c;
  };
  Conn.prototype.close = function () { try { this.db.close(); } catch (e) { } };
  Conn.prototype.tables = function () {
    const r = this.db.exec("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
    return r.length ? r[0].values.map(function (v) { return v[0]; }) : [];
  };
  Conn.prototype.columns = function (table) {
    const r = this.db.exec('PRAGMA table_info(' + JSON.stringify(table) + ')');
    const self = this;
    const list = r.length ? r[0].values.map(function (v) {
      const m = (self.meta[table.toLowerCase()] || {})[String(v[1]).toLowerCase()] || {};
      return { name: v[1], type: m.type || v[2], notnull: !!v[3] || !!m.notnull, def: v[4], pk: !!v[5], after: m.after, first: m.first, unsigned: !!m.unsigned };
    }) : [];
    // kolejność jak w MySQL (AFTER / FIRST)
    const moved = list.filter(function (c) { return c.after || c.first; });
    let ord = list.filter(function (c) { return !(c.after || c.first); });
    moved.forEach(function (c) {
      if (c.first) { ord.unshift(c); return; }
      const i = ord.findIndex(function (x) { return x.name.toLowerCase() === String(c.after).toLowerCase(); });
      if (i < 0) ord.push(c); else ord.splice(i + 1, 0, c);
    });
    return ord;
  };
  Conn.prototype.dump = function (table, order) {
    const r = this.db.exec('SELECT * FROM "' + table + '"' + (order ? ' ORDER BY ' + order : ''));
    return r.length ? { columns: r[0].columns, rows: r[0].values } : { columns: this.columns(table).map(function (c) { return c.name; }), rows: [] };
  };

  // wykonuje jedną instrukcję MySQL; zwraca {kind, columns, rows, changes, message, error, simulated}
  Conn.prototype.run1 = function (stmt) {
    const s = stmt.trim().replace(/;\s*$/, '');
    const S = s.replace(/\s+/g, ' ');
    let m;
    try {
      if (/^USE\s+/i.test(S)) return { kind: 'info', message: 'Wybrano bazę ' + unq(S.slice(4)) + '.' };
      if (/^SET\s+NAMES\b/i.test(S) || /^SET\s+(SQL_MODE|time_zone|FOREIGN_KEY_CHECKS|character_set|@@|AUTOCOMMIT)/i.test(S) || /^(START TRANSACTION|COMMIT|ROLLBACK|LOCK TABLES|UNLOCK TABLES)/i.test(S)) return { kind: 'info', message: 'OK' };
      if ((m = S.match(/^CREATE\s+(DATABASE|SCHEMA)\s+(IF\s+NOT\s+EXISTS\s+)?([`'"]?)(\w+)\3/i))) return { kind: 'info', simulated: true, message: 'Baza ' + m[4] + ' – na egzaminie tworzysz ją w phpMyAdmin (zestaw znaków utf8_unicode_ci).' };
      if ((m = S.match(/^CREATE\s+USER\s+(IF\s+NOT\s+EXISTS\s+)?([`'"]?)([^`'"@\s]+)\2\s*(?:@\s*([`'"]?)([^`'"\s]+)\4)?\s*(?:IDENTIFIED\s+BY\s+(['"])((?:[^'"\\]|\\.)*)\6)?\s*$/i))) {
        const u = { user: m[3], host: m[5] || '%', pass: m[7] == null ? null : m[7] };
        if (this.users.some(function (x) { return x.user === u.user && x.host === u.host; })) return { kind: 'error', error: "#1396 - Operation CREATE USER failed for '" + u.user + "'@'" + u.host + "'" };
        this.users.push(u);
        return { kind: 'ok', simulated: true, changes: 0, message: "Utworzono użytkownika '" + u.user + "'@'" + u.host + "'" + (u.pass != null ? ' z hasłem.' : ' bez hasła.') };
      }
      if ((m = S.match(/^DROP\s+USER\s+(IF\s+EXISTS\s+)?([`'"]?)([^`'"@\s]+)\2\s*(?:@\s*([`'"]?)([^`'"\s]+)\4)?\s*$/i))) {
        const before = this.users.length; const uu = m[3], hh = m[5] || '%';
        this.users = this.users.filter(function (x) { return !(x.user === uu && x.host === hh); });
        return before === this.users.length ? { kind: 'error', error: "#1396 - Operation DROP USER failed" } : { kind: 'ok', simulated: true, message: 'Usunięto użytkownika.' };
      }
      if ((m = S.match(/^(GRANT|REVOKE)\s+(.+?)\s+ON\s+(?:TABLE\s+)?([`'"\w.*]+)\s+(TO|FROM)\s+([`'"]?)([^`'"@\s]+)\5\s*(?:@\s*([`'"]?)([^`'"\s]+)\7)?(.*)$/i))) {
        const privs = splitTop(m[2]).map(function (p) { return p.trim().toUpperCase().replace(/\s+/g, ' '); }).map(function (p) { return p === 'ALL' ? 'ALL PRIVILEGES' : p; });
        const tgt = m[3].replace(/[`'"]/g, '');
        const g = { op: m[1].toUpperCase(), privs: privs, target: tgt, user: m[6], host: m[8] || '%', rest: m[9].trim() };
        const self = this;
        if (!this.users.some(function (x) { return x.user === g.user && (x.host === g.host); }) && !/IDENTIFIED/i.test(g.rest)) {
          return { kind: 'error', error: "#1133 - Can't find any matching row in the user table (najpierw CREATE USER '" + g.user + "'@'" + g.host + "')" };
        }
        this.grants.push(g);
        return { kind: 'ok', simulated: true, message: (g.op === 'GRANT' ? 'Nadano' : 'Odebrano') + ' prawa ' + privs.join(', ') + ' na ' + tgt + ' dla ' + g.user + '@' + g.host + '.' };
      }
      if (/^FLUSH\s+PRIVILEGES$/i.test(S)) return { kind: 'ok', simulated: true, message: 'OK' };
      if ((m = S.match(/^SHOW\s+TABLES$/i))) { const t = this.tables(); return { kind: 'select', columns: ['Tables_in_' + this.name], rows: t.map(function (x) { return [x]; }) }; }
      if ((m = S.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM|EXPLAIN)\s+[`'"]?(\w+)[`'"]?$/i))) {
        const cols = this.columns(m[1]); if (!cols.length) return { kind: 'error', error: "#1146 - Table '" + this.name + '.' + m[1] + "' doesn't exist" };
        return { kind: 'select', columns: ['Field', 'Type', 'Null', 'Key', 'Default'], rows: cols.map(function (c) { return [c.name, c.type, c.notnull ? 'NO' : 'YES', c.pk ? 'PRI' : '', c.def]; }) };
      }
      if ((m = S.match(/^SHOW\s+GRANTS\s+FOR\s+(.+)$/i))) {
        const um = m[1].match(/([`'"]?)([^`'"@\s]+)\1\s*(?:@\s*([`'"]?)([^`'"\s]+)\3)?/);
        const rows = this.grants.filter(function (g) { return g.user === um[2]; }).map(function (g) { return [g.op + ' ' + g.privs.join(', ') + ' ON ' + g.target + " TO '" + g.user + "'@'" + g.host + "'"]; });
        return { kind: 'select', columns: ['Grants for ' + um[2]], rows: rows };
      }
      if ((m = S.match(/^ALTER\s+TABLE\s+[`'"]?(\w+)[`'"]?\s+(.*)$/i))) return this.alter(m[1], m[2]);
      if ((m = s.match(/^CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?[`'"]?(\w+)[`'"]?\s*\(([\s\S]*)\)\s*([^)]*)$/i))) return this.createTable(m[2], m[3], !!m[1]);
      if ((m = S.match(/^CREATE\s+(OR\s+REPLACE\s+)?(?:ALGORITHM\s*=\s*\w+\s+)?VIEW\s+[`'"]?(\w+)[`'"]?\s+AS\s+(.*)$/i))) {
        if (m[1]) this.db.exec('DROP VIEW IF EXISTS "' + m[2] + '"');
        this.db.exec('CREATE VIEW "' + m[2] + '" AS ' + fixDivision(m[3]));
        this.created[m[2].toLowerCase()] = { kind: 'view', sql: m[3] };
        return { kind: 'ok', changes: 0, message: 'Utworzono widok ' + m[2] + '.' };
      }
      if ((m = S.match(/^TRUNCATE\s+(TABLE\s+)?[`'"]?(\w+)[`'"]?$/i))) { this.db.exec('DELETE FROM "' + m[2] + '"'); return { kind: 'ok', changes: this.db.getRowsModified(), message: 'Tabela wyczyszczona.' }; }
      if ((m = S.match(/^RENAME\s+TABLE\s+[`'"]?(\w+)[`'"]?\s+TO\s+[`'"]?(\w+)[`'"]?$/i))) { this.db.exec('ALTER TABLE "' + m[1] + '" RENAME TO "' + m[2] + '"'); return { kind: 'ok', message: 'Zmieniono nazwę tabeli.' }; }

      const sql = fixDivision(s).replace(/\bINSERT\s+IGNORE\b/i, 'INSERT OR IGNORE');
      const res = this.db.exec(sql);
      const isSel = /^\s*(SELECT|WITH|\(|VALUES|PRAGMA)/i.test(s);
      if (isSel) {
        const fixName = function (n) { return String(n).replace(/\* 1\.0 \//g, '/'); };
        if (res.length) return { kind: 'select', columns: res[res.length - 1].columns.map(fixName), rows: res[res.length - 1].values };
        // brak wierszy – odczytaj nazwy kolumn przez prepare
        const st = this.db.prepare(sql); const cols = st.getColumnNames(); st.free();
        return { kind: 'select', columns: cols.map(fixName), rows: [] };
      }
      const ch = this.db.getRowsModified();
      let msg = 'Zapytanie wykonane.';
      if (/^\s*INSERT/i.test(s)) msg = 'Wstawiono wierszy: ' + ch + '.';
      else if (/^\s*UPDATE/i.test(s)) msg = 'Zmienionych wierszy: ' + ch + '.';
      else if (/^\s*DELETE/i.test(s)) msg = 'Usuniętych wierszy: ' + ch + '.';
      else if (/^\s*DROP\s+TABLE/i.test(s)) msg = 'Tabela usunięta.';
      return { kind: 'ok', changes: ch, message: msg };
    } catch (e) {
      return { kind: 'error', error: mysqlishError(e.message, s, this) };
    }
  };

  Conn.prototype.alter = function (table, rest) {
    const self = this;
    const tl = table.toLowerCase();
    if (!this.tables().some(function (t) { return t.toLowerCase() === tl; })) return { kind: 'error', error: "#1146 - Table '" + this.name + '.' + table + "' doesn't exist" };
    const parts = splitTop(rest);
    const msgs = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim(); let m;
      if ((m = p.match(/^ADD\s+(?:COLUMN\s+)?(?!INDEX|KEY|PRIMARY|UNIQUE|CONSTRAINT|FOREIGN)([`'"]?)(\w+)\1\s+(.*?)(\s+(FIRST|AFTER\s+[`'"]?(\w+)[`'"]?))?$/i))) {
        const col = m[2], defRaw = m[3];
        const ti = typeInfo(defRaw);
        let def = colDefToSqlite(col + ' ' + defRaw).replace(/^\w+\s+/, '');
        if (ti.notnull && ti.def == null) def += ' DEFAULT ' + (ti.cat === 'text' ? "''" : ti.cat === 'date' ? "'0000-00-00'" : '0');
        if (/\bPRIMARY\s+KEY\b/i.test(def)) def = def.replace(/\bPRIMARY\s+KEY\b/i, '');
        this.db.exec('ALTER TABLE "' + table + '" ADD COLUMN "' + col + '" ' + def);
        this.meta[tl] = this.meta[tl] || {};
        this.meta[tl][col.toLowerCase()] = { type: defRaw.replace(/\s+/g, ' ').trim(), after: m[6] || null, first: /^FIRST$/i.test(m[5] || ''), notnull: ti.notnull, unsigned: ti.unsigned };
        msgs.push('Dodano kolumnę ' + col + '.');
        continue;
      }
      if ((m = p.match(/^DROP\s+(?:COLUMN\s+)?(?!INDEX|KEY|PRIMARY|FOREIGN)([`'"]?)(\w+)\1$/i))) {
        this.db.exec('ALTER TABLE "' + table + '" DROP COLUMN "' + m[2] + '"');
        msgs.push('Usunięto kolumnę ' + m[2] + '.'); continue;
      }
      if ((m = p.match(/^CHANGE\s+(?:COLUMN\s+)?([`'"]?)(\w+)\1\s+([`'"]?)(\w+)\3\s+(.*)$/i))) {
        if (m[2] !== m[4]) this.db.exec('ALTER TABLE "' + table + '" RENAME COLUMN "' + m[2] + '" TO "' + m[4] + '"');
        this.meta[tl] = this.meta[tl] || {};
        this.meta[tl][m[4].toLowerCase()] = Object.assign({}, this.meta[tl][m[2].toLowerCase()] || {}, { type: m[5].replace(/\s+/g, ' ').trim(), renamedFrom: m[2] });
        msgs.push('Zmieniono kolumnę ' + m[2] + ' na ' + m[4] + '.'); continue;
      }
      if ((m = p.match(/^RENAME\s+COLUMN\s+([`'"]?)(\w+)\1\s+TO\s+([`'"]?)(\w+)\3$/i))) {
        this.db.exec('ALTER TABLE "' + table + '" RENAME COLUMN "' + m[2] + '" TO "' + m[4] + '"');
        this.meta[tl] = this.meta[tl] || {}; this.meta[tl][m[4].toLowerCase()] = Object.assign({}, this.meta[tl][m[2].toLowerCase()] || {}, { renamedFrom: m[2] });
        msgs.push('Zmieniono nazwę kolumny.'); continue;
      }
      if ((m = p.match(/^MODIFY\s+(?:COLUMN\s+)?([`'"]?)(\w+)\1\s+(.*)$/i))) {
        const cols = this.columns(table);
        if (!cols.some(function (c) { return c.name.toLowerCase() === m[2].toLowerCase(); })) return { kind: 'error', error: "#1054 - Unknown column '" + m[2] + "' in '" + table + "'" };
        this.meta[tl] = this.meta[tl] || {};
        this.meta[tl][m[2].toLowerCase()] = Object.assign({}, this.meta[tl][m[2].toLowerCase()] || {}, { type: m[3].replace(/\s+/g, ' ').trim(), notnull: /NOT\s+NULL/i.test(m[3]) });
        msgs.push('Zmieniono typ kolumny ' + m[2] + '.'); continue;
      }
      if ((m = p.match(/^RENAME\s+(?:TO|AS)?\s*([`'"]?)(\w+)\1$/i))) { this.db.exec('ALTER TABLE "' + table + '" RENAME TO "' + m[2] + '"'); msgs.push('Zmieniono nazwę tabeli.'); continue; }
      if (/^(ADD\s+(PRIMARY|UNIQUE|INDEX|KEY|CONSTRAINT|FOREIGN))|^(DROP\s+(INDEX|KEY|PRIMARY|FOREIGN))/i.test(p)) { msgs.push('OK (indeks/klucz – zapisane).'); continue; }
      return { kind: 'error', error: '#1064 - Błąd składni w ALTER TABLE near \'' + p.slice(0, 40) + "'" };
    }
    return { kind: 'ok', changes: 0, message: msgs.join(' ') };
  };

  Conn.prototype.createTable = function (name, body, ifNot) {
    const parts = splitTop(body);
    const cols = []; const lines = []; let pkCols = [];
    parts.forEach(function (p) {
      const t = p.trim();
      let m;
      if ((m = t.match(/^PRIMARY\s+KEY\s*\(([^)]*)\)/i))) { pkCols = m[1].split(',').map(function (x) { return unq(x.trim()); }); return; }
      if (/^(KEY|INDEX|UNIQUE|CONSTRAINT|FOREIGN|CHECK|FULLTEXT)\b/i.test(t)) { if (/^UNIQUE/i.test(t)) lines.push(t.replace(/^UNIQUE\s+(KEY|INDEX)\s+\w+/i, 'UNIQUE')); return; }
      if ((m = t.match(/^([`'"]?)(\w+)\1\s+(.*)$/))) {
        cols.push({ name: m[2], ti: typeInfo(m[3]) });
        lines.push(colDefToSqlite('"' + m[2] + '" ' + m[3]));
      }
    });
    if (pkCols.length) {
      // AUTO_INCREMENT + PRIMARY KEY(id) => INTEGER PRIMARY KEY
      lines.push('PRIMARY KEY (' + pkCols.map(function (c) { return '"' + c + '"'; }).join(',') + ')');
    }
    const sql = 'CREATE TABLE ' + (ifNot ? 'IF NOT EXISTS ' : '') + '"' + name + '" (' + lines.join(', ') + ')';
    this.db.exec(sql);
    const tl = name.toLowerCase(); this.meta[tl] = {};
    const self = this;
    cols.forEach(function (c) { self.meta[tl][c.name.toLowerCase()] = { type: c.ti.raw, notnull: c.ti.notnull || pkCols.indexOf(c.name) >= 0 || c.ti.pk, unsigned: c.ti.unsigned, ai: c.ti.ai, pk: c.ti.pk || pkCols.indexOf(c.name) >= 0 }; });
    this.created[tl] = { kind: 'table', cols: cols.map(function (c) { return { name: c.name, ti: c.ti, pk: c.ti.pk || pkCols.indexOf(c.name) >= 0 }; }) };
    return { kind: 'ok', changes: 0, message: 'Utworzono tabelę ' + name + '.' };
  };

  function mysqlishError(msg, sql, conn) {
    let m;
    if ((m = msg.match(/no such table: (\w+)/))) return "#1146 - Table '" + conn.name + '.' + m[1] + "' doesn't exist";
    if ((m = msg.match(/no such column: ([\w.]+)/))) return "#1054 - Unknown column '" + m[1] + "' in 'field list'";
    if ((m = msg.match(/ambiguous column name: ([\w.]+)/))) return "#1052 - Column '" + m[1] + "' in field list is ambiguous (dopisz nazwę tabeli: tabela.kolumna)";
    if ((m = msg.match(/near "([^"]*)": syntax error/))) return "#1064 - You have an error in your SQL syntax; near '" + m[1] + "'";
    if (/incomplete input/.test(msg)) return '#1064 - You have an error in your SQL syntax; zapytanie urywa się (brakuje końca?)';
    if ((m = msg.match(/no such function: (\w+)/))) return '#1305 - FUNCTION ' + conn.name + '.' + m[1] + ' does not exist';
    if ((m = msg.match(/table (\w+) has (\d+) columns but (\d+) values were supplied/))) return '#1136 - Column count doesn\'t match value count (tabela ' + m[1] + ' ma ' + m[2] + ' kolumn, podano ' + m[3] + ' wartości)';
    if (/(\d+) values for (\d+) columns/.test(msg)) return "#1136 - Column count doesn't match value count at row 1";
    if ((m = msg.match(/duplicate column name: (\w+)/))) return "#1060 - Duplicate column name '" + m[1] + "'";
    if ((m = msg.match(/table "?(\w+)"? already exists/))) return "#1050 - Table '" + m[1] + "' already exists";
    if (/UNIQUE constraint failed/.test(msg)) return '#1062 - Duplicate entry for key PRIMARY';
    if (/misuse of aggregate/.test(msg)) return '#1111 - Invalid use of group function';
    if (/wrong number of arguments to function (\w+)/.test(msg)) return '#1582 - Incorrect parameter count in the call to native function';
    return '#1064 - ' + msg;
  }

  // wykonuje cały tekst (wiele zapytań)
  Conn.prototype.runText = function (text) {
    const list = E.split(text); const self = this;
    return list.map(function (st) { const r = self.run1(st); r.sql = st; return r; });
  };

  /* ---------- porównywanie wyników ---------- */
  function norm(v, tol) {
    if (v == null) return '∅';
    if (typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()))) {
      const n = Number(v);
      if (!isFinite(n)) return String(v);
      const d = tol == null ? 2 : tol;
      return 'n:' + (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString();
    }
    return 's:' + String(v).trim().toLowerCase();
  }
  E.norm = norm;
  function colSig(rows, j, tol) { return rows.map(function (r) { return norm(r[j], tol); }).sort().join('|'); }
  function cleanName(n) { return String(n).trim().replace(/^[`'"]|[`'"]$/g, '').replace(/^\w+\./, '').toLowerCase(); }

  // ref, got: {columns, rows}; opt: {ordered, aliases:{refIdx:name}, tol, limitFrom: full rows (losowe), anyRowsOf}
  E.compare = function (ref, got, opt) {
    opt = opt || {};
    const tol = opt.tol == null ? 2 : opt.tol;
    const rc = ref.columns.length, gc = got.columns.length;
    if (gc !== rc) {
      return { ok: false, msg: gc > rc ? 'Za dużo kolumn: masz ' + gc + ', a zadanie wymaga ' + rc + '. „Jedynie” znaczy: tylko wymienione pola – usuń resztę (zwłaszcza *).' : 'Za mało kolumn: masz ' + gc + ', a zadanie wymaga ' + rc + '. Sprawdź, czy wybrałeś wszystkie pola z treści.' };
    }
    if (opt.random) {
      // losowe wiersze: liczba wierszy i każdy wiersz musi istnieć w pełnym zbiorze
      if (got.rows.length !== ref.rows.length) return { ok: false, msg: 'Liczba wierszy: masz ' + got.rows.length + ', powinno być ' + ref.rows.length + '.' };
      const pool = opt.pool.map(function (r) { return r.map(function (v) { return norm(v, tol); }).sort().join('¦'); });
      for (let i = 0; i < got.rows.length; i++) {
        const k = got.rows[i].map(function (v) { return norm(v, tol); }).sort().join('¦');
        if (pool.indexOf(k) < 0) return { ok: false, msg: 'Wiersz ' + (i + 1) + ' nie pasuje do danych z tabeli – sprawdź wybrane kolumny.' };
      }
      return { ok: true, msg: 'Wynik poprawny (wiersze losowe – za każdym uruchomieniem inne).' };
    }
    // dopasowanie kolumn (dowolna kolejność)
    const map = []; const used = {};
    for (let j = 0; j < rc; j++) {
      const sig = colSig(ref.rows, j, tol); let found = -1;
      for (let k = 0; k < gc; k++) if (!used[k] && colSig(got.rows, k, tol) === sig) { found = k; break; }
      if (found < 0) {
        // może się różnić tylko liczbą wierszy
        if (got.rows.length !== ref.rows.length) return { ok: false, msg: 'Liczba wierszy: masz ' + got.rows.length + ', powinno być ' + ref.rows.length + '. Sprawdź warunek WHERE / grupowanie' + (opt.limit ? ' / LIMIT' : '') + '.' };
        return { ok: false, msg: 'Wartości w kolumnie „' + ref.columns[j] + '” się nie zgadzają. Sprawdź, czy wybierasz właściwe pole i warunek.' };
      }
      used[found] = 1; map.push(found);
    }
    if (got.rows.length !== ref.rows.length) return { ok: false, msg: 'Liczba wierszy: masz ' + got.rows.length + ', powinno być ' + ref.rows.length + '.' };
    const R = ref.rows.map(function (r) { return r.map(function (v) { return norm(v, tol); }).join('¦'); });
    const G = got.rows.map(function (r) { return map.map(function (k) { return norm(r[k], tol); }).join('¦'); });
    if (opt.ordered) {
      for (let i = 0; i < R.length; i++) if (R[i] !== G[i]) {
        const sameSet = R.slice().sort().join('#') === G.slice().sort().join('#');
        return { ok: false, msg: sameSet ? 'Wiersze są dobre, ale kolejność nie. Sprawdź ORDER BY (ASC = rosnąco, DESC = malejąco).' : 'Wiersz ' + (i + 1) + ' się nie zgadza.' };
      }
    } else {
      const a = R.slice().sort(), b = G.slice().sort();
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return { ok: false, msg: 'Wiersze różnią się od oczekiwanych. Sprawdź warunek i złączenie.' };
    }
    if (opt.aliases) {
      for (const idx in opt.aliases) {
        const want = opt.aliases[idx]; const have = got.columns[map[idx]];
        if (cleanName(have) !== cleanName(want)) return { ok: false, msg: 'Dane są dobre, ale kolumna ma nazwę „' + have + '”. Zadanie wymaga aliasu „' + want + '” → dopisz AS "' + want + '".' };
      }
    }
    return { ok: true, msg: 'Wynik zgodny z oczekiwanym.' };
  };

  /* ---------- import zrzutu MySQL (phpMyAdmin) do SQLite ---------- */
  // przepisuje literały MySQL ('\'' itp.) na zapis SQLite
  function fixLiterals(sql) {
    let out = ''; let i = 0;
    while (i < sql.length) {
      const c = sql[i];
      if (c === "'" || c === '"') {
        let j = i + 1, val = '';
        while (j < sql.length) {
          const d = sql[j];
          if (d === '\\') {
            const e = sql[j + 1];
            val += e === 'n' ? '\n' : e === 'r' ? '\r' : e === 't' ? '\t' : e === '0' ? '' : e === 'Z' ? '' : e;
            j += 2; continue;
          }
          if (d === c) { if (sql[j + 1] === c) { val += c; j += 2; continue; } break; }
          val += d; j++;
        }
        out += "'" + val.replace(/'/g, "''") + "'"; i = j + 1; continue;
      }
      if (c === '`') { const j = sql.indexOf('`', i + 1); out += '"' + sql.slice(i + 1, j) + '"'; i = j + 1; continue; }
      out += c; i++;
    }
    return out;
  }
  E.importDump = function (text) {
    const st = E.split(String(text).replace(/\/\*![\s\S]*?\*\//g, ' '));
    const tables = {}; const order = []; const inserts = []; const views = [];
    st.forEach(function (s) {
      const S = s.replace(/\s+/g, ' ').trim(); let m;
      if ((m = s.match(/^CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]*)\)[^)]*$/i))) {
        const name = m[2]; const cols = []; const pk = []; const fks = [];
        splitTop(m[3]).forEach(function (p) {
          let k;
          if ((k = p.match(/^PRIMARY\s+KEY\s*\(([^)]*)\)/i))) { k[1].split(',').forEach(function (x) { pk.push(unq(x.trim().replace(/\(\d+\)$/, ''))); }); return; }
          if ((k = p.match(/^(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(([^)]*)\)\s*REFERENCES\s*[`"]?(\w+)[`"]?\s*\(([^)]*)\)/i))) { fks.push({ col: unq(k[1].trim()), ref: k[2], refCol: unq(k[3].trim()) }); return; }
          if (/^(KEY|INDEX|UNIQUE|CONSTRAINT|FULLTEXT|CHECK)\b/i.test(p)) return;
          if ((k = p.match(/^([`"]?)(\w+)\1\s+(.*)$/))) { const ti = typeInfo(k[3]); if (ti.pk) pk.push(k[2]); cols.push({ name: k[2], def: k[3], ti: ti, ai: ti.ai }); }
        });
        tables[name.toLowerCase()] = { name: name, cols: cols, pk: pk, fks: fks }; order.push(name.toLowerCase());
        return;
      }
      if ((m = S.match(/^ALTER TABLE [`"]?(\w+)[`"]? (.*)$/i))) {
        const t = tables[m[1].toLowerCase()]; if (!t) return;
        splitTop(m[2]).forEach(function (p) {
          let k;
          if ((k = p.match(/^ADD PRIMARY KEY\s*\(([^)]*)\)/i))) { k[1].split(',').forEach(function (x) { const c = unq(x.trim().replace(/\(\d+\)$/, '')); if (t.pk.indexOf(c) < 0) t.pk.push(c); }); }
          else if ((k = p.match(/^MODIFY\s+[`"]?(\w+)[`"]?\s+(.*)$/i))) { t.cols.forEach(function (c) { if (c.name.toLowerCase() === k[1].toLowerCase() && /AUTO_INCREMENT/i.test(k[2])) c.ai = true; }); }
          else if ((k = p.match(/^ADD (?:CONSTRAINT \S+ )?FOREIGN KEY\s*\(([^)]*)\)\s*REFERENCES\s*[`"]?(\w+)[`"]?\s*\(([^)]*)\)/i))) { t.fks.push({ col: unq(k[1].trim()), ref: k[2], refCol: unq(k[3].trim()) }); }
        });
        return;
      }
      if (/^INSERT\s/i.test(S)) { inserts.push(fixLiterals(s)); return; }
      if (/^CREATE\s+(ALGORITHM|OR\s+REPLACE|VIEW|DEFINER|SQL)/i.test(S) && /\bVIEW\b/i.test(S)) {
        const v = S.match(/VIEW\s+[`"]?(\w+)[`"]?\s+AS\s+(.*)$/i); if (v) views.push('CREATE VIEW "' + v[1] + '" AS ' + fixLiterals(v[2]));
      }
    });
    const out = [];
    order.forEach(function (key) {
      const t = tables[key];
      const single = t.pk.length === 1 ? t.pk[0].toLowerCase() : null;
      const defs = t.cols.map(function (c) {
        const ti = c.ti;
        let type = ti.cat === 'int' || ti.cat === 'bool' ? 'INTEGER' : ti.cat === 'real' ? 'REAL' : ti.cat === 'text' ? 'TEXT COLLATE NOCASE' : 'TEXT';
        if (ti.base === 'ENUM' || ti.base === 'SET') type = 'TEXT COLLATE NOCASE';
        if (single && c.name.toLowerCase() === single && (ti.cat === 'int')) return '"' + c.name + '" INTEGER PRIMARY KEY';
        let d = '"' + c.name + '" ' + type;
        if (ti.def != null && !/^NULL$/i.test(ti.def) && !/CURRENT_TIMESTAMP|current_timestamp\(\)/i.test(ti.def)) d += ' DEFAULT ' + (/^['"]/.test(ti.def) ? "'" + ti.def.slice(1, -1).replace(/'/g, "''") + "'" : ti.def);
        return d;
      });
      if (t.pk.length && !(single && t.cols.some(function (c) { return c.name.toLowerCase() === single && c.ti.cat === 'int'; }))) defs.push('PRIMARY KEY (' + t.pk.map(function (c) { return '"' + c + '"'; }).join(',') + ')');
      out.push('CREATE TABLE "' + t.name + '" (' + defs.join(', ') + ');');
    });
    inserts.forEach(function (s) { out.push(s.replace(/;\s*$/, '') + ';'); });
    views.forEach(function (v) { out.push(v + ';'); });
    const schema = order.map(function (key) {
      const t = tables[key];
      return { name: t.name, pk: t.pk, fks: t.fks, cols: t.cols.map(function (c) { return { name: c.name, type: c.def.replace(/\s+(NOT NULL|DEFAULT .*|NULL|COLLATE \w+|CHARACTER SET \w+).*$/i, '').trim(), pk: t.pk.indexOf(c.name) >= 0 }; }) };
    });
    return { script: out.join('\n'), schema: schema };
  };

  /* ---------- formatowanie wartości jak w phpMyAdmin ---------- */
  E.fmt = function (v) {
    if (v == null) return 'NULL';
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(Math.round(v * 10000) / 10000);
    }
    return String(v);
  };
})(typeof window !== 'undefined' ? window : globalThis);
