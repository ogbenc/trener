const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#/inf/probny/m1'); await p.waitForTimeout(1500);
  const pane = await p.evaluate(() => document.querySelector('.mob-tabs .fbtn.on').textContent);
  // wstaw rozwiązanie, sprawdź, zobacz kartę wyniku
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent === 'Rozwiązanie'); b.click(); });
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent === 'Wstaw do plików'); b.click(); });
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Sprawdź/.test(x.textContent)); b.click(); });
  await p.waitForFunction(() => document.querySelector('.mtotal'), null, { timeout: 120000 });
  await p.waitForTimeout(800);
  const total = await p.evaluate(() => document.querySelector('.mtotal').innerText.replace(/\s+/g, ' '));
  await p.screenshot({ path: process.argv[2] });
  console.log('start pane:', pane, '| score:', total, '| errors:', errs.join('; ') || 'none');
  await b.close();
})();
