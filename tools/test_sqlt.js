require('../js/sqlengine.js'); require('../js/sqlcheck.js'); require('../data/dbs.js'); require('../js/dbgen.js'); require('../data/sql-tasks.js');
const TR = globalThis.TR;
TR.sql.ready(__dirname + '/../js/vendor/').then(() => {
  let ok = 0, bad = 0;
  for (const t of TR.SQLT) {
    const open = v => TR.dbgen.open(t.db, v);
    const r = TR.sqlcheck.check(t, t.ref, open);
    const c = open('A'); if (t.setup) c.runText(t.setup); const rr = c.runText(t.ref); const sel = rr.filter(x => x.kind === 'select').pop();
    const cB = open('B'); if (t.setup) cB.runText(t.setup); const rB = cB.runText(t.ref).filter(x => x.kind === 'select').pop();
    if (r.ok) ok++; else bad++;
    console.log((r.ok ? 'OK ' : 'BAD') + ' ' + t.id + ' ' + (sel ? 'rows A=' + sel.rows.length + ' B=' + (rB ? rB.rows.length : '-') + ' ' + JSON.stringify(sel.rows.slice(0, 3)) : rr.map(x => x.message || x.error).join('|')) + (r.ok ? '' : ' :: ' + r.msg));
  }
  console.log('ok', ok, 'bad', bad);
  // kilka negatywnych przykładów
  const T = id => TR.SQLT.find(x => x.id === id);
  const neg = [['q01', 'SELECT * FROM wycieczki;'], ['q03', "SELECT imie, nazwisko FROM klienci WHERE id IN (1,3,6,10);"], ['q20', 'SELECT nazwa, cena FROM produkty ORDER BY cena;'], ['q31', 'SELECT COUNT(*) FROM ksiazki;'], ['q52', 'UPDATE wycieczki SET cena = 1790;'], ['q61', 'ALTER TABLE klienci ADD telefon VARCHAR(15);'], ['q70', "CREATE USER 'kasjer'@'localhost' IDENTIFIED BY 'k@sa2025!';"], ['q71', "GRANT SELECT, INSERT ON sklep.produkty TO 'kasjer'@'localhost';"], ['q43', 'SELECT nazwa, COUNT(produkty.id) AS "liczba produktów" FROM kategorie JOIN produkty ON produkty.kategoria_id = kategorie.id GROUP BY kategorie.nazwa;'], ['q24', 'SELECT nazwa, cena FROM produkty LIMIT 2;'], ['q12', 'SELECT ksiazka_id, dataWypozyczenia FROM wypozyczenia WHERE dataOddania = NULL;'], ['q40', 'SELECT cel, nazwa FROM wycieczki, kraje;'], ['q63', 'ALTER TABLE wycieczki ADD liczbaMiejsc INT;'], ['q22', 'SELECT cel, cena FROM wycieczki ORDER BY cena DESC LIMIT 5'], ['q40', 'select cel, nazwa from wycieczki inner join kraje on kraj_id = kraje.id']];
  for (const [id, sql] of neg) { const t = T(id); const r = TR.sqlcheck.check(t, sql, v => TR.dbgen.open(t.db, v)); console.log('NEG', id, r.ok ? 'PASSED' : 'fail', '->', r.msg); }
});
