// Buduje zestaw prawdziwych zadań SQL z arkuszy (tekst CKE + przykład z zasad oceniania + baza z arkusza).
require('../js/sqlengine.js'); require('../js/sqlcheck.js');
const fs = require('fs'), path = require('path');
const TR = globalThis.TR;
const S = '/tmp/claude-0/-home-claude/83a87a52-39a1-5dc2-9de2-904e7c7c905d/scratchpad';
const T = JSON.parse(fs.readFileSync(S + '/an/tasks.json', 'utf8'));
const Z = JSON.parse(fs.readFileSync(S + '/an/zo.json', 'utf8'));
const PDF = {}; fs.readFileSync(S + '/an/pdfs.txt', 'utf8').split('\n').filter(Boolean).forEach(l => { const [d, f] = l.split('|'); PDF[d.split('/')[1]] = f.split(',').filter(Boolean); });
const OV = fs.existsSync(__dirname + '/real_overrides.json') ? JSON.parse(fs.readFileSync(__dirname + '/real_overrides.json', 'utf8')) : {};

function sqlFileFor(key) {
  const cands = [];
  const d1 = S + '/realsql/' + key;
  if (fs.existsSync(d1)) fs.readdirSync(d1).forEach(f => cands.push(d1 + '/' + f));
  const m = key.match(/^inf03_20(\d\d)_(\d\d)_(\d\d)$/);
  if (m) { const d2 = S + '/realsql/mc_INF.03-' + m[3] + '-' + m[1] + '.' + m[2] + '-SG'; if (fs.existsSync(d2)) fs.readdirSync(d2).forEach(f => cands.push(d2 + '/' + f)); }
  return cands.filter(f => /CREATE TABLE/i.test(fs.readFileSync(f, 'utf8')))[0] || null;
}
function queriesFromSheet(key) {
  const flat = (T[key] ? T[key].text : '').split('\n').join(' ');
  const out = {};
  const re = /Zapytanie (\d)\s*:\s*(.*?)(?=Zapytanie \d\s*:|−\s*Wykonaj|‒\s*Wykonaj|–\s*Wykonaj|Witryna internetowa|Grafika|Ilustracja \d|Skrypt|Operacje na|$)/g;
  let m; while ((m = re.exec(flat))) { if (!out[m[1]]) out[m[1]] = m[2].replace(/\s+[−‒–-]\s*$/, '').replace(/\s+/g, ' ').trim(); }
  return out;
}
function theme(key) {
  const t = (T[key] ? T[key].text : '').split('\n').join(' ');
  const m = t.match(/Wykonaj (?:\w+ )?(?:witrynę|aplikację|stronę)[^.]*?(?=,? wykorzyst|\. |$)/);
  return m ? m[0].replace(/^Wykonaj /, '').replace(/,$/, '') : '';
}
function dbName(key) { const t = (T[key] ? T[key].text : '').split('\n').join(' '); const m = t.match(/bazę danych o nazwie (\w+)/); return m ? m[1] : 'baza'; }
function crit(body) {
  // fragment opisujący, co ma być widoczne na zrzucie
  const i = body.search(/oraz (?:na zrzucie|wynik|zrzut)/);
  let c = i >= 0 ? body.slice(i + 5) : '';
  c = c.replace(/\s*(Wykonano|Wykonane|Prawidłowo|R\.\d).*$/, '').trim();
  return c.slice(0, 400);
}
function accept(body) { const m = body.match(/\(([^()]*(?:lub|dowoln|możliw|opcjonaln|dopuszcz)[^()]*)\)/); return m ? m[1].trim().slice(0, 300) : ''; }

const index = []; const report = [];
TR.sql.ready(path.join(__dirname, '../js/vendor/') + '/').then(() => {
  const keys = Object.keys(T).filter(k => /^(inf03|ee09)_/.test(k)).sort();
  keys.forEach(key => {
    const code = T[key].code.startsWith('INF') || T[key].code.startsWith('EE') ? T[key].code : key;
    const zq = Z[key] || {}; const sq = queriesFromSheet(key);
    const nums = Array.from(new Set(Object.keys(sq).concat(Object.keys(zq)))).sort();
    if (!nums.length) return;
    const file = sqlFileFor(key);
    let conn = null, schema = null;
    if (file) {
      let buf = fs.readFileSync(file); let txt = buf.toString('utf8'); if (txt.includes('�')) txt = buf.toString('latin1');
      try { const r = TR.sql.importDump(txt); conn = TR.sql.openScript(r.script, dbName(key)); schema = r.schema;
        fs.writeFileSync(path.join(__dirname, '../data/real/' + key + '.js'), 'TR.REALDB=TR.REALDB||{};TR.REALDB[' + JSON.stringify(key) + ']=' + JSON.stringify(r.script) + ';\n');
      } catch (e) { report.push(key + ' IMPORT ' + e.message); }
    }
    const qs = []; let prior = [];
    nums.forEach(n => {
      const z = zq[n] || { sql: [], count: [], body: '' };
      const o = (OV[key] || {})[n] || {};
      let cands = o.ref ? [o.ref] : z.sql.map(x => x.trim()).filter(x => /^(SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|GRANT|DROP|REVOKE)\s+(?!,)/i.test(x));
      const setup = prior.join('\n');
      if (!cands.length) {
        const t = o.text || sq[n] || '';
        const mu = t.match(/tworząc\w* (?:konto )?(?:nowego )?użytkownika (?:lokalnego )?(?:o nazwie )?([\w.-]+)(?:@localhost| na (?:serwerze )?localhost)?.*?(?:z )?(?:haśle|hasłem)\s+(\S+)/i);
        if (mu) cands = ["CREATE USER '" + mu[1] + "'@'localhost' IDENTIFIED BY '" + mu[2].replace(/[.,;]$/, '') + "';"];
      }
      let ref = cands[0] || '';
      if (conn && cands.length > 1) {
        for (const c of cands) { const c2 = conn.clone(); if (setup) c2.runText(setup); const rr = c2.runText(c); if (!rr.some(r => r.kind === 'error')) { ref = c; break; } }
      }
      const kRef = TR.sqlcheck.kindOf(ref || 'SELECT');
      const altOk = conn ? cands.filter(x => x !== ref && TR.sqlcheck.kindOf(x) === kRef && (() => { const c3 = conn.clone(); if (setup) c3.runText(setup); return !c3.runText(x).some(r => r.kind === 'error'); })()) : [];
      const zt = (z.body || '').split(/W pliku z kwerendami|W pliku kwerendy/)[0].replace(/\s+\.\s*$/, '').trim();
      const q = { n: +n, text: o.text || sq[n] || zt, ref: ref, alt: altOk, crit: o.crit || crit(z.body), accept: accept(z.body), count: z.count[0] ? +z.count[0] : null };
      if (setup) q.setup = setup;
      if (o.ordered != null) q.ordered = o.ordered; if (o.aliases) q.aliases = o.aliases; if (o.kind) q.kind = o.kind; if (o.skip) q.skip = 1;
      if (!q.aliases && /alias|nazw\w* kolumn|podpisan\w* jako|nazwę \(alias\)/i.test(q.text)) {
        const al = []; const re = /\bAS\s+("[^"]+"|'[^']+'|`[^`]+`|[\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/gi; let mm; while ((mm = re.exec(ref))) al.push(mm[1].replace(/^["'`]|["'`]$/g, ''));
        if (al.length) q.aliases = al;
      }
      q.kind = q.kind || TR.sqlcheck.kindOf(ref || 'SELECT');
      if (conn && ref && !q.skip) {
        const c2 = conn.clone(); if (setup) c2.runText(setup);
        const res = c2.runText(ref); const err = res.find(r => r.kind === 'error');
        if (err) { q.status = 'err'; report.push(key + ' Q' + n + ' ERR ' + err.error + ' :: ' + ref); }
        else {
          const sel = res.filter(r => r.kind === 'select').pop();
          if (sel) { q.rows = sel.rows.length; if (q.count != null && q.count !== sel.rows.length && q.kind !== 'random') { q.status = 'count'; report.push(key + ' Q' + n + ' COUNT want ' + q.count + ' got ' + sel.rows.length + ' :: ' + ref); } else q.status = 'ok'; }
          else q.status = 'ok';
        }
      } else q.status = conn ? (ref ? 'skip' : 'noref') : 'nodb';
      if (ref && !/^\s*SELECT/i.test(ref)) prior.push(ref.replace(/;?\s*$/, ';'));
      qs.push(q);
    });
    index.push({ key: key, code: code, theme: theme(key), db: dbName(key), hasDb: !!conn, schema: schema, pdf: PDF[key] || [], q: qs });
  });
  fs.writeFileSync(path.join(__dirname, '../data/real-index.js'), 'TR.REAL=' + JSON.stringify(index) + ';\n');
  const tot = index.reduce((a, e) => a + e.q.length, 0), withDb = index.filter(e => e.hasDb).reduce((a, e) => a + e.q.length, 0);
  const st = {}; index.forEach(e => e.q.forEach(q => st[q.status] = (st[q.status] || 0) + 1));
  console.log('exams', index.length, 'queries', tot, 'with db', withDb, JSON.stringify(st));
  console.log(report.join('\n'));
});
