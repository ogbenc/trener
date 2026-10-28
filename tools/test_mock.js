// Arkusze próbne: rozwiązanie wzorcowe = komplet punktów; pliki startowe = 0; wybrane błędy muszą zostać wykryte.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('http://localhost:8765/index.html#/'); await p.waitForTimeout(1200);
  const res = await p.evaluate(async () => {
    const out = [];
    const frame = document.createElement('iframe'); frame.className = 'frame-test'; document.body.appendChild(frame);
    async function run(m, files) {
      const lab = new TR.Lab({ files: files, entry: m.entry, db: m.db });
      let r; try { r = await TR.runChecks(lab, frame, m.checks); } catch (e) { r = [{ ok: false, d: 'EXC', msg: e.message }]; }
      lab.dispose(); return r;
    }
    const NEG = {
      m1: [
        ['bez mysqli_close', f => (f['schronisko.php'] = f['schronisko.php'].replace('mysqli_close($polaczenie);', ''), f), /zamknięcie/],
        ['zła kwerenda 1 (bez adopcja)', f => (f['kwerendy.txt'] = f['kwerendy.txt'].replace(' AND adopcja = 0', ''), f), /Zapytanie 1/],
        ['brak aliasu w 3', f => (f['kwerendy.txt'] = f['kwerendy.txt'].replace(' AS "liczba zwierząt"', ''), f), /Zapytanie 3/],
        ['INSERT bez CURDATE', f => (f['kwerendy.txt'] = f['kwerendy.txt'].replace('CURDATE()', "'2026-10-27'"), f), /Zapytanie 4/],
        ['hover bez cienia', f => (f['styl.css'] = f['styl.css'].replace('.zwierze:hover', '.zwierze:focus'), f), /cień/],
        ['styl wszystkich a', f => (f['styl.css'] = f['styl.css'].replace('aside a {', 'a {'), f), /tylko bloku lewego|bloku lewym/],
        ['brak UPDATE', f => (f['schronisko.php'] = f['schronisko.php'].replace(/mysqli_query\(\$polaczenie, "UPDATE[^\n]*\n/, ''), f), /Skrypt 4: zapis/],
        ['brak warunku pustych pól', f => (f['schronisko.php'] = f['schronisko.php'].replace('if (!empty($_POST["imie"]) && !empty($_POST["nazwisko"]))', 'if (isset($_POST["imie"]))'), f), /pustym nazwisku/],
        ['skrypt 2 ignoruje GET', f => (f['schronisko.php'] = f['schronisko.php'].replace('$gatunek = $_GET["gatunek"];', '$gatunek = 1;'), f), /GET \(np\. koty\)/],
        ['krótkie zmienne', f => (f['schronisko.php'] = f['schronisko.php'].split('$wiersz').join('$w'), f), /znaczących/],
        ['aside bez float', f => (f['styl.css'] = f['styl.css'].replace(/height: 600px;\n  float: left;\n\}/, 'height: 600px;\n}'), f), /obok siebie/],
        ['opcje z adoptowanymi', f => (f['schronisko.php'] = f['schronisko.php'].replace('SELECT id, imie FROM zwierzeta WHERE adopcja = 0;', 'SELECT id, imie FROM zwierzeta;'), f), /Skrypt 3/]
      ],
      m2: [
        ['ALTER bez AFTER', f => (f['kwerendy.txt'] = f['kwerendy.txt'].replace(' AFTER miasto', ''), f), /Zapytanie 4/],
        ['zła kwerenda 3 (>=)', f => (f['kwerendy.txt'] = f['kwerendy.txt'].replace('metraz > 50', 'metraz >= 40'), f), /Zapytanie 3/],
        ['bez materiałów +30%', f => (f['skrypt.js'] = f['skrypt.js'].replace('koszt = koszt * 1.3;', ''), f), /1404/],
        ['bez toFixed', f => (f['skrypt.js'] = f['skrypt.js'].replace('koszt.toFixed(2)', 'koszt'), f), /360\.00/],
        ['komunikat nie czerwony', f => (f['skrypt.js'] = f['skrypt.js'].replace('wynik.style.color = "red";', ''), f), /czerwony/],
        ['nie wraca na czarno', f => (f['skrypt.js'] = f['skrypt.js'].replace('wynik.style.color = "black";', ''), f), /czarno/],
        ['cennik widoczny na starcie', f => (f['styl.css'] = f['styl.css'].replace('#cennik {\n  display: none;\n}', ''), f), /Na starcie/],
        ['m2 bez sup', f => (f['index.html'] = f['index.html'].replace('m<sup>2</sup>', 'm2'), f), /sup/],
        ['brak koloru przycisku', f => (f['skrypt.js'] = f['skrypt.js'].replace('bc.style.backgroundColor = "#2E7D32"; bc.style.color = "white";', ''), f), /kolory aktywnego/],
        ['brak hover tr', f => (f['styl.css'] = f['styl.css'].replace('tr:hover', 'tr:active'), f), /Kursor/]
      ]
    };
    for (const m of TR.MOCK) {
      const r = await run(m, Object.assign({}, m.files, m.sol));
      const r0 = await run(m, Object.assign({}, m.files));
      const neg = [];
      for (const [name, mod, want] of (NEG[m.id] || [])) {
        const rr = await run(m, mod(Object.assign({}, m.files, m.sol)));
        const failed = rr.filter(x => !x.ok);
        const hit = failed.some(x => want.test(x.d));
        neg.push({ name, hit, lost: failed.length, which: failed.map(x => x.d + ' :: ' + x.msg).slice(0, 4) });
      }
      out.push({ id: m.id, n: r.length, fail: r.filter(x => !x.ok).map(x => x.d + ' :: ' + x.msg), starter: r0.filter(x => x.ok).map(x => x.d), neg });
    }
    return out;
  });
  for (const r of res) {
    console.log(r.fail.length ? 'FAIL' : 'ok  ', r.id, r.n + ' checks', r.fail);
    console.log('   starter passes:', r.starter.length, r.starter);
    for (const n of r.neg) console.log('   ' + (n.hit ? 'caught' : 'MISSED') + ' ' + n.name + ' (−' + n.lost + ')', n.hit ? '' : n.which);
  }
  console.log(errs.join('\n'));
  await b.close();
})();
