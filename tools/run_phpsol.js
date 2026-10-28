// Rozwiązania wzorcowe zadań PHP: prawdziwe PHP 8.3 (z podkładką mysqli→SQLite) vs MiniPHP
require('../js/sqlengine.js'); require('../js/miniphp.js'); require('../data/dbs.js'); require('../js/dbgen.js');
const TR = globalThis.TR; const fs = require('fs'), cp = require('child_process'), path = require('path');
require('../js/checks.js');
require('../data/lab-php.js');
const CASES = { p07: [{ post: { filtr: 'Wro' } }], p08: [{ post: { imie: 'Tomasz', nazwisko: 'Wilk', klasa: '3TI' } }, { post: { imie: 'Ala', nazwisko: '', klasa: '1TI' } }], p09: [{ post: { cel: 'Barcelona', osoby: '2' } }], p10: [{ get: { usun: '6' } }], p11: [{ entry: 'wycieczka.php', get: { id: '3' } }], p12: [{ get: { st: '4' } }], p13: [{ post: { login: 'admin', haslo: 'zle' } }] };
TR.sql.ready(path.join(__dirname, '../js/vendor/') + '/').then(() => {
  let ok = 0, bad = 0;
  for (const t of TR.LAB.filter(x => x.area === 'php')) {
    const files = Object.assign({}, t.files, t.sol);
    const runs = [{}].concat(CASES[t.id] || []);
    for (const c of runs) {
      const entry = c.entry || t.entry;
      const dir = '/tmp/egzp'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
      for (const f in files) fs.writeFileSync(path.join(dir, f), files[f]);
      let dec = {};
      if (t.db) { fs.writeFileSync('/tmp/soldb.sql', TR.dbgen.sqlite(t.db, 'A')); const cc = TR.dbgen.open(t.db, 'A'); dec = cc.decimals || {}; }
      let real = cp.spawnSync('php', ['-n', '-d', 'extension=pdo', '-d', 'extension=pdo_sqlite', '-d', 'extension=mbstring', '-d', 'html_errors=1', '-d', 'display_errors=1', '-d', 'error_reporting=32767', '-d', 'date.timezone=Europe/Warsaw', '-d', 'auto_prepend_file=' + path.join(__dirname, 'shim.php'), entry], { cwd: dir, env: Object.assign({}, process.env, { MINI_ENV: JSON.stringify({ get: c.get || {}, post: c.post || {} }), MINI_DB: '/tmp/soldb.sql', MINI_DBNAME: t.db || '', MINI_DEC: JSON.stringify(dec), TZ: 'Europe/Warsaw' }), encoding: 'utf8' });
      let rout = real.stdout.split(path.join(dir, entry)).join('C:\\xampp\\htdocs\\egzamin\\' + entry);
      const base = t.db ? TR.dbgen.open(t.db, 'A') : null;
      const res = TR.php.run({ files: files, entry: entry, request: { get: c.get || {}, post: c.post || {}, method: c.post ? 'POST' : 'GET' }, written: {}, env: { db: n => (t.db && n === t.db ? base : null), session: { data: null } } });
      let mine = res.html;
      if (/Cannot modify header|headers already sent/.test(rout)) rout = rout.replace(/<br \/>\n<b>Warning<\/b>:  Cannot modify header[^\n]*\n/g, '');
      const same = rout === mine;
      if (same) { ok++; } else { bad++; console.log('DIFF', t.id, entry, JSON.stringify(c)); const a = rout.split('\n'), b = mine.split('\n'); for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { console.log('  php :', JSON.stringify(a[i])); console.log('  mini:', JSON.stringify(b[i])); break; } }
    }
  }
  console.log('ok', ok, 'bad', bad);
});
