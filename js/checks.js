/* Gotowe sprawdzenia do zadań laboratoryjnych. Każda funkcja zwraca {d: opis, f: async T => true | 'komunikat'} */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const C = TR.C = {};
  function el(T, sel) { return typeof sel === 'string' ? T.$(sel) : sel; }
  function names(sel) { return sel.replace(/^#/, 'blok #').replace(/^\./, 'klasa .'); }
  function px(v) { return parseFloat(v) || 0; }
  function sameLen(T, el, prop, want) {
    const v = T.css(el, prop);
    if (/%$/.test(want)) {
      const parent = el.parentElement; const pw = parent ? parent.getBoundingClientRect().width - px(T.css(parent, 'padding-left')) - px(T.css(parent, 'padding-right')) : 1280;
      const exp = pw * parseFloat(want) / 100;
      return Math.abs(px(v) - exp) <= Math.max(2, exp * 0.02) || Math.abs(el.getBoundingClientRect().width - exp) <= 3;
    }
    if (/px$/.test(want) || /^\d+$/.test(want)) return Math.abs(px(v) - parseFloat(want)) <= 1;
    return String(v).replace(/\s+/g, '') === String(want).replace(/\s+/g, '');
  }
  C.sameLen = sameLen;

  C.doctype = function () { return { d: 'Deklaracja HTML5 <!DOCTYPE html> na początku pliku', f: function (T) { const s = T.src(T.lab.entry) || ''; if (!/^\s*(<\?php[\s\S]*?\?>\s*)?<!DOCTYPE\s+html\s*>/i.test(s)) return 'Pierwsza linia pliku: <!DOCTYPE html>'; return true; } }; };
  C.lang = function () { return { d: 'Język strony polski: <html lang="pl">', f: function (T) { return T.doc.documentElement.getAttribute('lang') === 'pl' || 'Brak lang="pl" w znaczniku <html>'; } }; };
  C.charset = function () { return { d: 'Jawne kodowanie znaków UTF-8 (<meta charset="UTF-8">)', f: function (T) { const m = T.doc.querySelector('meta[charset]'); if (m && /utf-?8/i.test(m.getAttribute('charset'))) return true; const h = T.doc.querySelector('meta[http-equiv="Content-Type" i]'); if (h && /utf-8/i.test(h.getAttribute('content') || '')) return true; return 'W <head> dopisz <meta charset="UTF-8">'; } }; };
  C.title = function (t) { return { d: 'Tytuł strony (na karcie przeglądarki): „' + t + '”', f: function (T) { const v = T.doc.title.trim(); return v === t || (v ? 'Tytuł to „' + v + '”, a ma być „' + t + '”' : 'Brak <title> w <head>'); } }; };
  C.linkCss = function (name) {
    return { d: 'Arkusz stylów ' + name + ' podłączony znacznikiem <link>', f: function (T) {
      const html = T.codeOf(/\.(html|php)$/i);
      const tags = html.match(/<link\b[^>]*>/gi) || [];
      const ok = tags.some(function (t) { return /rel\s*=\s*["']?stylesheet/i.test(t) && new RegExp('href\\s*=\\s*["\']?(\\./)?' + name.replace('.', '\\.') + '["\'\\s>]', 'i').test(t); });
      if (!ok) return 'Brak <link rel="stylesheet" href="' + name + '"> w <head>' + (tags.length ? ' (sprawdź nazwę pliku i rel)' : '');
      if (!T.doc.querySelector('style[data-file]')) return 'Plik ' + name + ' nie wczytuje się – sprawdź nazwę';
      return true;
    } };
  };
  C.noInline = function () { return { d: 'Formatowanie CSS tylko w pliku zewnętrznym (bez style="" i <style> w HTML)', f: function (T) { const html = T.codeOf(/\.(html|php)$/i).replace(/<\?php[\s\S]*?\?>/g, function (m) { return m.replace(/style\s*=/gi, ''); }); if (/<style[\s>]/i.test(html)) return 'Usuń <style> z HTML – style mają być w pliku .css'; if (/\sstyle\s*=\s*["']/i.test(html)) return 'Usuń atrybuty style="…" – wszystko w pliku .css'; return true; } }; };
  C.exists = function (sel, d, msg) { return { d: d, f: function (T) { return !!T.$(sel) || msg || ('Brak elementu ' + sel); } }; };
  C.text = function (sel, txt, d, exact) {
    return { d: d || ('Element ' + sel + ' z tekstem „' + txt + '”'), f: function (T) {
      const els = T.$$(sel); if (!els.length) return 'Brak elementu ' + sel;
      const want = T.norm(txt);
      const ok = els.some(function (e) { const t = T.norm(e.textContent); return exact ? t === want : t.indexOf(want) >= 0; });
      return ok || ('Tekst w ' + sel + ' to „' + T.text(els[0]).slice(0, 60) + '”, a powinien zawierać „' + txt + '”');
    } };
  };
  C.css = function (sel, prop, want, d) {
    return { d: d || (names(sel) + ': ' + prop + ' ' + want), f: function (T) {
      const e = el(T, sel); if (!e) return 'Brak elementu ' + sel + ' na stronie';
      const v = T.css(e, prop);
      if (/color$/.test(prop) || /^(background-color|color|border-color)$/.test(prop)) return T.color(want) === v || (prop + ' wynosi ' + v + ', a powinno ' + want + ' (' + T.color(want) + ')');
      if (/^(width|height|padding.*|margin.*|font-size|border-radius|line-height|letter-spacing|word-spacing|top|left|right|bottom|border.*-width)$/.test(prop)) return sameLen(T, e, prop, want) || (prop + ' wynosi ' + v + ', a powinno ' + want);
      if (prop === 'font-family') { const f = v.split(',').map(function (x) { return x.trim().replace(/^["']|["']$/g, '').toLowerCase(); }); const w = want.split(',').map(function (x) { return x.trim().replace(/^["']|["']$/g, '').toLowerCase(); }); return w.every(function (x, i) { return f[i] === x; }) || ('font-family: ' + v + ' – powinno być ' + want + ' (w tej kolejności)'); }
      if (prop === 'font-weight' && /bold/.test(want)) return +v >= 600 || v === 'bold' || ('font-weight: ' + v + ' – ma być pogrubiona');
      if (prop === 'text-decoration') { const t = T.css(e, 'text-decoration-line'); return (want === 'none' ? t === 'none' : t.indexOf(want) >= 0) || ('text-decoration: ' + t + ' – ma być ' + want); }
      return String(v).trim() === String(want).trim() || (prop + ': ' + v + ' – ma być ' + want);
    } };
  };
  C.cssAll = function (sels, prop, want, d) {
    return { d: d, f: function (T) { for (let i = 0; i < sels.length; i++) { const r = C.css(sels[i], prop, want).f(T); if (r !== true) return sels[i] + ': ' + r; } return true; } };
  };
  C.hover = function (sel, prop, want, d) {
    return { d: d || ('Po najechaniu kursorem na ' + sel + ': ' + prop + ' ' + want), f: function (T) {
      const e = el(T, sel); if (!e) return 'Brak elementu ' + sel;
      const v = T.pseudo(e, 'hover', prop);
      if (v == null) return 'Brak reguły z :hover ustawiającej ' + prop + ' dla tego elementu';
      if (/color/.test(prop)) return T.color(v.replace(/\s*!important/, '')) === T.color(want) || ('W :hover ' + prop + ' = ' + v + ', a ma być ' + want);
      return T.norm(v).replace(/\s*!important/, '') === T.norm(want) || ('W :hover ' + prop + ' = ' + v + ', a ma być ' + want);
    } };
  };
  C.leftOf = function (a, b, d) { return { d: d || (a + ' i ' + b + ' obok siebie'), f: function (T) { if (!T.$(a) || !T.$(b)) return 'Brak ' + (!T.$(a) ? a : b); return T.leftOf(a, b) || (a + ' nie jest po lewej stronie ' + b + ' (sprawdź float/flex i szerokości – czy suma nie przekracza 100%?)'); } }; };
  C.above = function (a, b, d) { return { d: d || (a + ' nad ' + b), f: function (T) { if (!T.$(a) || !T.$(b)) return 'Brak ' + (!T.$(a) ? a : b); return T.above(a, b) || (b + ' nachodzi na ' + a + ' albo jest wyżej (clear: both?)'); } }; };
  C.attr = function (sel, at, val, d) { return { d: d, f: function (T) { const e = T.$(sel); if (!e) return 'Brak ' + sel; const v = e.getAttribute(at); if (val instanceof RegExp) return val.test(v || '') || (sel + ' [' + at + '="' + v + '"]'); return v === val || (sel + ': ' + at + '="' + (v == null ? '' : v) + '" – ma być "' + val + '"'); } }; };
  C.code = function (re, d, msg, files) { return { d: d, f: function (T) { const s = T.noComments(files ? T.codeOf(files) : T.code()); return re.test(s) || msg || 'Nie widzę tego w kodzie'; } }; };
  C.footerPesel = function () { return { d: 'Stopka zawiera numer zdającego (np. 00000000000)', f: function (T) { const f = T.$('footer') || T.$('#stopka'); if (!f) return 'Brak stopki'; return /\d{6,}/.test(f.textContent) || 'W stopce wpisz swój numer (PESEL)'; } }; };
  C.php = {
    connect: function (db) { return { d: 'Połączenie: mysqli_connect("localhost", "root", "", "' + db + '")', f: function (T) { const s = T.noComments(T.codeOf(/\.php$/i)); if (/new\s+mysqli\s*\(/i.test(s)) return true; const m = s.match(/mysqli_connect\s*\(([^)]*)\)/i); if (!m) return 'Brak mysqli_connect(...)'; return new RegExp('["\']' + db + '["\']', 'i').test(m[1]) || 'Czwarty argument to nazwa bazy: "' + db + '"'; } }; },
    close: function () { return { d: 'Na końcu skryptu połączenie jest zamykane (mysqli_close)', f: function (T) { const s = T.noComments(T.codeOf(/\.php$/i)); if (!/mysqli_close\s*\(|->\s*close\s*\(/i.test(s)) return 'Brak mysqli_close($polaczenie)'; const iClose = Math.max(s.lastIndexOf('mysqli_close'), s.lastIndexOf('->close(')); const iQuery = Math.max(s.lastIndexOf('mysqli_query'), s.lastIndexOf('->query(')); return iClose > iQuery || 'mysqli_close jest przed ostatnim zapytaniem – przenieś je na koniec'; } }; },
    noErrors: function () { return { d: 'Strona wykonuje się bez ostrzeżeń i błędów PHP', f: function (T) { const p = T.php; if (!p) return 'To nie jest strona PHP'; if (p.fatal) return p.fatal.kind + ': ' + p.fatal.msg + ' (linia ' + p.fatal.line + ')'; if (p.diag.length) return p.diag[0].type + ': ' + p.diag[0].msg + ' (linia ' + p.diag[0].line + ')'; return true; } }; },
    query: function (re, d) { return { d: d, f: function (T) { const q = T.lab.queries.join('\n'); return re.test(q) || 'Nie widzę wysłanego zapytania pasującego do treści (wysłane: ' + (q ? q.slice(0, 160) : 'brak') + ')'; } }; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
