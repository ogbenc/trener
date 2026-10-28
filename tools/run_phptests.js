// Porównanie MiniPHP z prawdziwym PHP 8.3 (CLI, html_errors=1)
require('../js/sqlengine.js'); require('../js/miniphp.js');
const TR = globalThis.TR; const fs = require('fs'); const cp = require('child_process'); const path = require('path');
const DIR = path.join(__dirname, 'phptests');
const DBSQL = "CREATE TABLE produkty (id INTEGER PRIMARY KEY, nazwa TEXT, cena REAL, ilosc INTEGER, kategoria TEXT, opis TEXT);" +
  "INSERT INTO produkty VALUES (1,'Kostka',39.5,25,'logiczne','Klasyczna łamigłówka'),(2,'Szachy',129,4,'logiczne',NULL),(3,'Kalambury',34.9,18,'imprezowe','Karty z hasłami'),(4,'Osadnicy',169.99,12,'planszowe','Budujesz osady'),(5,'Puzzle 1000',59,0,'puzzle','');" +
  "CREATE TABLE kategorie (id INTEGER PRIMARY KEY, nazwa TEXT); INSERT INTO kategorie VALUES (1,'logiczne'),(2,'imprezowe'),(3,'planszowe'),(4,'puzzle');";
fs.writeFileSync('/tmp/minidb.sql', DBSQL);
TR.sql.ready(path.join(__dirname, '../js/vendor/') + '/').then(() => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.php')).sort();
  let ok = 0, bad = 0; const only = process.argv[2];
  for (const f of files) {
    if (only && !f.includes(only)) continue;
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const envf = path.join(DIR, f.replace('.php', '.json'));
    const env = fs.existsSync(envf) ? JSON.parse(fs.readFileSync(envf, 'utf8')) : {};
    const tmp = '/tmp/egz/index.php'; fs.mkdirSync('/tmp/egz', { recursive: true }); fs.writeFileSync(tmp, src);
    let real = cp.spawnSync('php', ['-n', '-d', 'extension=pdo', '-d', 'extension=pdo_sqlite', '-d', 'extension=mbstring', '-d', 'html_errors=1', '-d', 'display_errors=1', '-d', 'error_reporting=32767', '-d', 'date.timezone=Europe/Warsaw', '-d', 'auto_prepend_file=' + path.join(__dirname, 'shim.php'), tmp], { env: Object.assign({}, process.env, { MINI_ENV: JSON.stringify(env), MINI_DB: '/tmp/minidb.sql', MINI_DBNAME: 'sklep', TZ: 'Europe/Warsaw' }), encoding: 'utf8' }).stdout;
    real = real.split('/tmp/egz/index.php').join('C:\\xampp\\htdocs\\egzamin\\index.php');
    const base = TR.sql.openScript(DBSQL, 'sklep');
    const res = TR.php.run({ files: { 'index.php': src }, entry: 'index.php', request: { get: env.get || {}, post: env.post || {} }, env: { db: n => n === 'sklep' ? base : null } });
    let mine = res.html;
    // porównanie błędów krytycznych tylko po komunikacie
    const norm = s => s.replace(/<br \/>\n<b>Fatal error<\/b>:  ([^\n]*?) in [\s\S]*$/, 'FATAL: $1').replace(/ \(([^()]*[ąćęłńóśźż][^()]*|[^()]*–[^()]*)\)(?=( in|$))/g, '').replace(/(Uncaught mysqli_sql_exception: )[^\n]*/, '$1').replace('array offset on null', 'array offset on value of type null');
    let a = norm(real), b = norm(mine);
    if (a === b) { ok++; console.log('OK  ', f); }
    else {
      bad++; console.log('DIFF', f);
      const la = a.split('\n'), lb = b.split('\n');
      for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) { console.log('   line', i + 1, '\n   php : ' + JSON.stringify(la[i]) + '\n   mini: ' + JSON.stringify(lb[i])); break; }
    }
  }
  console.log('ok', ok, 'bad', bad);
});
