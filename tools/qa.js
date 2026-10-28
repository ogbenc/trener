// Przegląd wszystkich widoków: błędy JS/konsoli + zrzuty (desktop i telefon)
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp/shots';
const routes = ['#/', '#/inf/egzamin', '#/inf/sql', '#/inf/sql/q01', '#/inf/sql/q40', '#/inf/arkusze', '#/inf/arkusz/inf03_2024_06_07', '#/inf/arkusz/inf03_2025_01_01', '#/inf/html', '#/inf/lab/h05', '#/inf/js', '#/inf/lab/j10', '#/inf/php', '#/inf/lab/p13', '#/inf/grafika', '#/inf/grafika/g5', '#/inf/probne', '#/inf/probny/m1', '#/inf/probny/m2', '#/inf/sciaga', '#/inf/baza', '#/mat'];
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ n: 'd', width: 1400, height: 900 }, { n: 'm', width: 390, height: 844 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(p.url().split('#')[1] + ' PAGEERR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(p.url().split('#')[1] + ' CONSOLE ' + m.text()); });
    await p.goto('http://localhost:8765/index.html#/'); await p.waitForTimeout(1500);
    for (const r of routes) {
      await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(900);
      const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1: (document.querySelector('main h1') || {}).textContent || '', bad: (document.querySelector('.notice.bad') || {}).textContent || '' }));
      const name = vp.n + '_' + r.replace(/[#/]+/g, '_').replace(/^_|_$/g, '') + '.png';
      await p.screenshot({ path: OUT + '/' + (name === vp.n + '_.png' ? vp.n + '_start.png' : name) });
      console.log(vp.n, r.padEnd(32), 'h1=' + info.h1.slice(0, 40), info.sw > info.cw ? 'HSCROLL ' + info.sw + '>' + info.cw : '', info.bad ? 'ERR:' + info.bad : '');
    }
    console.log(errs.length ? errs.join('\n') : vp.n + ': no errors');
    await ctx.close();
  }
  await b.close();
})();
