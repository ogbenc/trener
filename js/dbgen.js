/* Generator skryptów baz: SQLite (do przeglądarki) i MySQL (plik .sql do XAMPP/phpMyAdmin). */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const G = TR.dbgen = {};

  function lit(v) {
    if (v == null) return 'NULL';
    if (typeof v === 'number') return String(v);
    return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
  }
  function sqliteType(t) {
    const T = t.toUpperCase();
    if (/^(TINYINT|SMALLINT|INT|INTEGER|BIGINT)/.test(T)) return 'INTEGER';
    if (/^(DECIMAL|FLOAT|DOUBLE|REAL)/.test(T)) return 'REAL';
    if (/^(DATE|DATETIME|TIME)/.test(T)) return 'TEXT';
    return 'TEXT COLLATE NOCASE';
  }

  G.sqlite = function (name, variant) {
    const db = TR.DBS[name]; if (!db) throw new Error('Brak bazy ' + name);
    const out = [];
    db.tables.forEach(function (t) {
      const cols = t.cols.map(function (c) {
        if (c[2] === 'pk') return '"' + c[0] + '" INTEGER PRIMARY KEY';
        return '"' + c[0] + '" ' + sqliteType(c[1]) + (c[2] === 'null' ? '' : '');
      });
      out.push('CREATE TABLE "' + t.name + '" (' + cols.join(', ') + ');');
      const rows = t.rows.concat(variant === 'B' && t.extra ? t.extra : []);
      if (rows.length) out.push('INSERT INTO "' + t.name + '" VALUES ' + rows.map(function (r) { return '(' + r.map(lit).join(',') + ')'; }).join(',') + ';');
    });
    return out.join('\n');
  };

  G.mysql = function (name) {
    const db = TR.DBS[name];
    const L = [];
    L.push('-- Baza ćwiczeniowa: ' + db.title + ' (dane fikcyjne)');
    L.push('-- Import: phpMyAdmin → utwórz bazę „' + name + '” (utf8_unicode_ci) → Import → wybierz ten plik.');
    L.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
    L.push('SET NAMES utf8mb4;');
    L.push('');
    db.tables.forEach(function (t) {
      L.push('CREATE TABLE `' + t.name + '` (');
      const defs = t.cols.map(function (c) {
        if (c[2] === 'pk') return '  `' + c[0] + '` int(10) UNSIGNED NOT NULL AUTO_INCREMENT';
        return '  `' + c[0] + '` ' + c[1].toLowerCase().replace(/^int$/, 'int(11)') + (c[2] === 'null' ? ' DEFAULT NULL' : ' NOT NULL');
      });
      const pk = t.cols.filter(function (c) { return c[2] === 'pk'; }).map(function (c) { return c[0]; });
      if (pk.length) defs.push('  PRIMARY KEY (`' + pk.join('`,`') + '`)');
      L.push(defs.join(',\n'));
      L.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
      L.push('');
      if (t.rows.length) {
        L.push('INSERT INTO `' + t.name + '` (`' + t.cols.map(function (c) { return c[0]; }).join('`, `') + '`) VALUES');
        L.push(t.rows.map(function (r) { return '(' + r.map(lit).join(', ') + ')'; }).join(',\n') + ';');
        L.push('');
      }
    });
    return L.join('\n');
  };

  // opis struktury do wyświetlania schematu
  G.schema = function (name) {
    const db = TR.DBS[name];
    return db.tables.map(function (t) {
      return { name: t.name, cols: t.cols.map(function (c) { return { name: c[0], type: c[1], pk: c[2] === 'pk', fk: /_id$/.test(c[0]) ? c[0].replace(/_id$/, '') : null }; }), count: t.rows.length };
    });
  };

  // kolumny DECIMAL(x,y) – mysqli zwraca je z miejscami po przecinku (np. "890.00")
  function decimals(name) {
    const db = TR.DBS[name]; const out = {}; const clash = {};
    db.tables.forEach(function (t) { t.cols.forEach(function (c) { const m = String(c[1]).match(/DECIMAL\(\d+,(\d+)\)/i); const k = c[0].toLowerCase(); if (m) { if (out[k] != null && out[k] !== +m[1]) clash[k] = 1; out[k] = +m[1]; } else if (out[k] == null) { /* nic */ } }); });
    db.tables.forEach(function (t) { t.cols.forEach(function (c) { const k = c[0].toLowerCase(); if (out[k] != null && !/DECIMAL/i.test(c[1])) clash[k] = 1; }); });
    Object.keys(clash).forEach(function (k) { delete out[k]; });
    return out;
  }
  // cache baz w pamięci (kopie)
  const cache = {};
  G.open = function (name, variant) {
    const key = name + ':' + (variant || 'A');
    if (!cache[key]) { cache[key] = TR.sql.openScript(G.sqlite(name, variant), name); cache[key].decimals = decimals(name); }
    const c = cache[key].clone(); c.decimals = cache[key].decimals; return c;
  };
  // baza własna albo z prawdziwego arkusza (TR.REALDB)
  G.openAny = function (name) {
    if (TR.DBS[name]) return G.open(name, 'A');
    if (TR.REALDB && TR.REALDB[name]) { const e = (TR.REAL || []).find(function (x) { return x.key === name; }); return TR.sql.openScript(TR.REALDB[name], e ? e.db : name); }
    return null;
  };
  G.alias = function (name) { if (TR.DBS[name]) return name; const e = (TR.REAL || []).find(function (x) { return x.key === name; }); return e ? e.db : name; };
})(typeof window !== 'undefined' ? window : globalThis);
