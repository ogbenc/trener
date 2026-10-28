// Każde rozwiązanie wzorcowe musi przejść wszystkie sprawdzenia; pliki startowe – nie.
const { chromium } = require('playwright');
(async () => {
  const only = process.argv[2] || '';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8765/index.html#/'); await p.waitForTimeout(1200);
  const res = await p.evaluate(async (only) => {
    const out = [];
    const frame = document.createElement('iframe'); frame.className = 'frame-test'; document.body.appendChild(frame);
    for (const t of TR.LAB) {
      if (only && !t.id.startsWith(only) && t.area !== only) continue;
      const lab = new TR.Lab({ files: Object.assign({}, t.files, t.sol), entry: t.entry, db: t.db });
      let r; try { r = await TR.runChecks(lab, frame, t.checks); } catch (e) { r = [{ ok: false, d: 'EXC', msg: e.message }]; }
      lab.dispose();
      const lab2 = new TR.Lab({ files: Object.assign({}, t.files), entry: t.entry, db: t.db });
      let r2; try { r2 = await TR.runChecks(lab2, frame, t.checks); } catch (e) { r2 = []; }
      lab2.dispose();
      out.push({ id: t.id, fail: r.filter(x => !x.ok).map(x => x.d + ' :: ' + x.msg), starterPass: r2.filter(x => x.ok).length, n: r.length });
    }
    return out;
  }, only);
  let bad = 0;
  for (const r of res) { if (r.fail.length) { bad++; console.log('FAIL', r.id, r.fail); } else console.log('ok  ', r.id, r.n + ' checks; starter passes ' + r.starterPass); }
  console.log('tasks', res.length, 'bad', bad); console.log(errs.join('\n'));
  await b.close();
})();
