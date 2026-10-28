require('../js/sqlengine.js'); require('../js/sqlcheck.js');
const TR = globalThis.TR; require('../data/real-index.js');
const fs = require('fs');
TR.sql.ready(__dirname + '/../js/vendor/').then(() => {
  let ok = 0, bad = 0, altOk = 0, altBad = 0, neg = 0, negMiss = 0;
  for (const e of TR.REAL) {
    if (!e.hasDb) continue;
    require('../data/real/' + e.key + '.js');
    const base = TR.sql.openScript(TR.REALDB[e.key], e.db);
    const open = () => base.clone();
    for (const q of e.q) {
      const task = { ref: q.ref, alts: q.alt, setup: q.setup, kind: q.kind, aliases: q.aliases, ordered: q.ordered, noB: true };
      const r = TR.sqlcheck.check(task, q.ref, open);
      if (r.ok) ok++; else { bad++; console.log('SELF FAIL', e.key, q.n, r.msg, '::', q.ref); }
      for (const a of q.alt || []) { const ra = TR.sqlcheck.check(task, a, open); if (ra.ok) altOk++; else { altBad++; console.log('  alt fail', e.key, q.n, ra.msg, '::', a); } }
      // negatywny: usuń warunek WHERE
      if (/^SELECT/i.test(q.ref) && /\bWHERE\b/i.test(q.ref)) {
        const broken = q.ref.replace(/\bWHERE\b[\s\S]*?(?=\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|;|$)/i, ' ');
        const rn = TR.sqlcheck.check(task, broken, open); neg++; if (rn.ok) { negMiss++; console.log('  NEG passed?', e.key, q.n, broken); }
      }
    }
  }
  console.log({ ok, bad, altOk, altBad, neg, negMiss });
});
