/* Laboratorium: wirtualny serwer (HTML/CSS/JS/PHP) w ramce + narzędzia do automatycznego sprawdzania. */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};

  /* ---------- prosty parser CSS ---------- */
  function parseCSS(text) {
    const rules = []; const s = String(text || '').replace(/\/\*[\s\S]*?\*\//g, '');
    function parseBlock(str, media) {
      let i = 0;
      while (i < str.length) {
        const open = str.indexOf('{', i); if (open < 0) break;
        const head = str.slice(i, open).trim();
        let depth = 1, j = open + 1;
        while (j < str.length && depth) { if (str[j] === '{') depth++; else if (str[j] === '}') depth--; j++; }
        const body = str.slice(open + 1, j - 1);
        if (/^@media/i.test(head)) parseBlock(body, head.replace(/^@media\s*/i, ''));
        else if (/^@(keyframes|-webkit-keyframes|font-face|supports|import)/i.test(head)) { /* pomijamy */ }
        else {
          const decls = {}; const order = [];
          body.split(';').forEach(function (d) { const k = d.indexOf(':'); if (k < 0) return; const p = d.slice(0, k).trim().toLowerCase(); const v = d.slice(k + 1).trim(); if (p) { decls[p] = v; order.push([p, v]); } });
          rules.push({ sel: head, sels: head.split(',').map(function (x) { return x.trim().replace(/\s+/g, ' ').toLowerCase(); }), decls: decls, order: order, media: media || null });
        }
        i = j;
      }
    }
    parseBlock(s, null);
    return rules;
  }
  TR.parseCSS = parseCSS;

  /* ---------- obrazki zastępcze (gdy brak pliku w lab/) ---------- */
  const imgCache = {};
  function placeholder(name) {
    if (imgCache[name]) return imgCache[name];
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',55%,62%)"/><stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',60%,38%)"/></linearGradient></defs><rect width="320" height="220" fill="url(#g)"/><path d="M0 170 L80 110 L140 150 L210 80 L320 160 L320 220 L0 220Z" fill="rgba(0,0,0,.22)"/><circle cx="250" cy="55" r="22" fill="rgba(255,255,255,.55)"/><text x="16" y="205" font-family="sans-serif" font-size="18" fill="#fff">' + name.replace(/[<&]/g, '') + '</text></svg>';
    imgCache[name] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return imgCache[name];
  }
  TR.placeholderImg = placeholder;

  /* ---------- skrypt mostu wstrzykiwany do ramki ---------- */
  function bridge(id) {
    return '<script data-lab-bridge>(function(){var P=window.parent,ID=' + JSON.stringify(id) + ';' +
      'function send(t,a){try{P.__labMsg&&P.__labMsg(ID,t,a)}catch(e){}}' +
      '["log","warn","error","info"].forEach(function(k){var o=console[k];console[k]=function(){var a=[].slice.call(arguments).map(function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}});send("console",{level:k,text:a.join(" ")});o&&o.apply(console,arguments)}});' +
      'window.addEventListener("error",function(e){send("console",{level:"error",text:(e.message||"Błąd")+(e.lineno?" (linia "+e.lineno+")":"")})});' +
      'window.alert=function(m){send("alert",{text:String(m)})};window.confirm=function(m){send("alert",{text:String(m)});return true};window.prompt=function(m,d){send("alert",{text:String(m)});return d==null?"":String(d)};' +
      'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||/^(#|javascript:|mailto:|tel:)/i.test(h))return;e.preventDefault();if(/^https?:/i.test(h)){send("external",{href:h,target:a.getAttribute("target")});return}send("nav",{href:h,target:a.getAttribute("target")})},false);' +
      'document.addEventListener("submit",function(e){if(e.defaultPrevented)return;e.preventDefault();var f=e.target,sb=e.submitter,fd=new FormData(f,sb||undefined),d=[];fd.forEach(function(v,k){d.push([k,typeof v==="string"?v:(v&&v.name)||""])});send("submit",{action:f.getAttribute("action")||"",method:(f.getAttribute("method")||"get").toLowerCase(),data:d})},false);' +
      '})();<\/script>';
  }

  // buduje dokument do ramki z plików wirtualnych
  function buildDoc(files, name, html, id, base) {
    const lower = {}; Object.keys(files).forEach(function (k) { lower[k.toLowerCase()] = k; });
    let out = String(html);
    // CSS z plików
    out = out.replace(/<link\b[^>]*>/gi, function (tag) {
      const m = tag.match(/href\s*=\s*["']?([^"'\s>]+)/i); if (!m || !/stylesheet/i.test(tag)) return tag;
      const f = lower[m[1].replace(/^\.\//, '').toLowerCase()];
      if (f == null) return tag;
      return '<style data-file="' + f + '">' + files[f] + '</style>';
    });
    out = out.replace(/<script\b([^>]*)\bsrc\s*=\s*["']?([^"'\s>]+)["']?([^>]*)>\s*<\/script>/gi, function (tag, a, src, b) {
      const f = lower[src.replace(/^\.\//, '').toLowerCase()];
      if (f == null) return tag;
      return '<script data-file="' + f + '"' + (/defer/i.test(a + b) ? ' data-defer' : '') + '>' + String(files[f]).replace(/<\/script/gi, '<\\/script') + '\n</script>';
    });
    // wstawka (base + most) zaraz po DOCTYPE
    const inj = '<base href="' + base + '">' + bridge(id);
    const dm = out.match(/^\s*<!doctype[^>]*>/i);
    if (dm) out = dm[0] + inj + out.slice(dm[0].length);
    else out = inj + out;
    // skrypty z defer – przenieś na koniec body
    return out;
  }

  /* ---------- Laboratorium ---------- */
  let seq = 0;
  const registry = {};
  root.__labMsg = function (id, type, arg) { const l = registry[id]; if (l) l.onMsg(type, arg); };

  TR.Lab = function (opts) {
    this.id = 'lab' + (++seq);
    registry[this.id] = this;
    this.files = opts.files;
    this.entry = opts.entry || 'index.html';
    this.dbName = opts.db || null;
    this.base = opts.base || (typeof location !== 'undefined' ? location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'lab/' : 'lab/');
    this.onConsole = opts.onConsole || function () { };
    this.onNav = opts.onNav || function () { };
    this.session = { data: null };
    this.cookies = {};
    this.written = {};
    this.conn = null;
    this.frame = null;
    this.cur = { path: this.entry, get: {}, post: {} };
    this.queries = [];
    this.alerts = [];
    this.lastPhp = null;
  };
  const L = TR.Lab.prototype;
  L.dispose = function () { delete registry[this.id]; if (this.conn) this.conn.close(); };
  L.resetDb = function () { if (this.conn) this.conn.close(); this.conn = this.dbName ? TR.dbgen.openAny(this.dbName) : null; this.session = { data: null }; this.written = {}; };
  L.dbFor = function (name) {
    if (!this.dbName) return null;
    const want = String(this.dbName).toLowerCase(); const alias = (TR.dbgen.alias(this.dbName) || '').toLowerCase();
    if (String(name).toLowerCase() !== want && String(name).toLowerCase() !== alias) return null;
    if (!this.conn) this.conn = TR.dbgen.openAny(this.dbName);
    return this.conn;
  };
  L.onMsg = function (type, arg) {
    if (type === 'console') this.onConsole(arg.level, arg.text);
    else if (type === 'alert') { this.alerts.push(arg.text); this.onConsole('alert', 'alert(): ' + arg.text); }
    else if (type === 'external') this.onConsole('info', 'Odnośnik zewnętrzny: ' + arg.href + (arg.target === '_blank' ? ' (w nowej karcie)' : ''));
    else if (type === 'nav') { if (arg.target === '_blank') this.onConsole('info', 'Odnośnik otwiera się w nowej karcie: ' + arg.href); this.navigate(arg.href); }
    else if (type === 'submit') {
      const url = arg.action || this.cur.path; const data = {};
      arg.data.forEach(function (kv) { if (data[kv[0]] === undefined) data[kv[0]] = kv[1]; else if (Array.isArray(data[kv[0]])) data[kv[0]].push(kv[1]); else data[kv[0]] = [data[kv[0]], kv[1]]; });
      if (arg.method === 'post') this.navigate(url, data);
      else { const q = Object.keys(data).map(function (k) { return [].concat(data[k]).map(function (v) { return encodeURIComponent(k) + '=' + encodeURIComponent(v); }).join('&'); }).join('&'); this.navigate(url.replace(/\?.*$/, '') + (q ? '?' + q : '')); }
    }
  };
  function parseUrl(href, curPath) {
    let path = href.replace(/^\.\//, '').replace(/^\/+/, ''); let q = '';
    const hi = path.indexOf('#'); if (hi >= 0) path = path.slice(0, hi);
    const qi = path.indexOf('?'); if (qi >= 0) { q = path.slice(qi + 1); path = path.slice(0, qi); }
    if (!path) path = curPath;
    const get = {};
    q.split('&').filter(Boolean).forEach(function (kv) { const p = kv.split('='); const k = decodeURIComponent(p[0].replace(/\+/g, ' ')); const v = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); if (/\[\]$/.test(k)) { (get[k] = get[k] || []).push(v); } else get[k] = v; });
    return { path: path, get: get, query: q };
  }
  // renderuje stronę (HTML lub PHP) → {html, php}
  L.render = function (href, post) {
    const u = parseUrl(href || this.entry, this.cur.path);
    const lower = {}; const files = this.files; Object.keys(files).forEach(function (k) { lower[k.toLowerCase()] = k; });
    const name = lower[u.path.toLowerCase()];
    this.cur = { path: u.path, get: u.get, post: post || {}, query: u.query };
    if (name == null) return { html: '<!DOCTYPE html><html lang="pl"><body style="font-family:sans-serif;padding:2em"><h1>Not Found</h1><p>The requested URL /' + u.path.replace(/</g, '') + ' was not found on this server.</p><hr><address>Apache/2.4.58 (Win64) PHP/8.2.12 Server at localhost Port 80</address><p style="color:#a00">Brak pliku <b>' + u.path.replace(/</g, '') + '</b> – sprawdź nazwę w odnośniku/formularzu (wielkość liter!).</p></body></html>', name: u.path, missing: true };
    if (/\.php$/i.test(name)) {
      const self = this; const t0 = Date.now();
      const res = TR.php.run({ files: files, entry: name, request: { get: u.get, post: post || {}, method: post ? 'POST' : 'GET', query: u.query, cookies: this.cookies }, written: this.written, env: { db: function (n) { return self.dbFor(n); }, session: this.session, setCookie: function (k, v) { self.cookies[k] = v; }, users: (this.conn && this.conn.users || []), onQuery: function (q) { self.queries.push(q); } } });
      res.ms = Date.now() - t0;
      this.lastPhp = res;
      return { html: res.html, name: name, php: res };
    }
    this.lastPhp = null;
    return { html: files[name], name: name };
  };
  // ładuje stronę do ramki; zwraca Promise<Document>
  L.load = function (frame, href, post, hops) {
    hops = hops || 0;
    const r = this.render(href, post);
    if (r.php && r.php.location && hops < 5) {
      this.onConsole('info', 'Przekierowanie (header Location) → ' + r.php.location);
      return this.load(frame, r.php.location, null, hops + 1);
    }
    if (r.php) {
      r.php.diag.forEach(function (d) { this.onConsole('php', d.type + ': ' + d.msg + ' (linia ' + d.line + ')'); }, this);
      if (r.php.fatal) this.onConsole('php-fatal', r.php.fatal.kind + ': ' + r.php.fatal.msg + (r.php.fatal.line ? ' (linia ' + r.php.fatal.line + ')' : ''));
      if (r.php.refresh != null) this.onConsole('info', 'Strona ustawia automatyczne odświeżanie co ' + r.php.refresh + ' s (header Refresh).');
    }
    this.frame = frame; this.lastRender = r;
    const doc = buildDoc(this.files, r.name, r.html || '', this.id, this.base);
    const self = this;
    this.navCount = (this.navCount || 0) + 1;
    return this.loading = new Promise(function (resolve) {
      let done = false;
      const fin = function () { if (done) return; done = true; setTimeout(function () { resolve(frame.contentDocument); }, 30); };
      frame.onload = fin;
      frame.srcdoc = doc;
      setTimeout(fin, 2500);
      self.onNav(r.name + (self.cur.query ? '?' + self.cur.query : ''), !!post);
    });
  };
  L.navigate = function (href, post) { if (this.frame) return this.load(this.frame, href, post); };
  L.reload = function () { return this.navigate(this.cur.path + (this.cur.query ? '?' + this.cur.query : '')); };

  /* ---------- narzędzia testów ---------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  TR.makeTester = function (lab, frame) {
    const T = {};
    T.lab = lab; T.files = lab.files;
    T.srcOf = function (img) { if (typeof img === 'string') img = T.$(img); return img ? (img.getAttribute('src') || '') : ''; };
    T.src = function (n) { const k = Object.keys(lab.files).find(function (x) { return x.toLowerCase() === String(n).toLowerCase(); }); return k ? lab.files[k] : null; };
    T.has = function (n) { return Object.keys(lab.files).some(function (x) { return x === n; }); };
    T.open = async function (href, post) { T.doc = await lab.load(frame, href, post); T.win = frame.contentWindow; T.php = lab.lastPhp; return T.doc; };
    T.$ = function (s) { return T.doc.querySelector(s); };
    T.$$ = function (s) { return Array.from(T.doc.querySelectorAll(s)); };
    T.text = function (el) { if (typeof el === 'string') el = T.$(el); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
    T.css = function (el, p) { if (typeof el === 'string') el = T.$(el); if (!el) return null; return T.win.getComputedStyle(el).getPropertyValue(p); };
    T.rect = function (el) { if (typeof el === 'string') el = T.$(el); return el ? el.getBoundingClientRect() : null; };
    T.color = function (v) { const d = T.doc.createElement('i'); d.style.color = ''; d.style.color = v; T.doc.body.appendChild(d); const c = T.win.getComputedStyle(d).color; d.remove(); return c; };
    T.sameColor = function (a, b) { return T.color(a) === T.color(b); };
    T.rules = function () {
      let all = [];
      Object.keys(lab.files).filter(function (f) { return /\.css$/i.test(f); }).forEach(function (f) { all = all.concat(parseCSS(lab.files[f])); });
      return all;
    };
    T.inlineCss = function () { const html = Object.keys(lab.files).filter(function (f) { return /\.(html|php)$/i.test(f); }).map(function (f) { return lab.files[f]; }).join('\n'); return /<style[\s>]/i.test(html) || /\sstyle\s*=/i.test(html); };
    // deklaracja dla elementu w regule z :hover (lub innym pseudo)
    T.pseudo = function (el, pseudo, prop) {
      if (typeof el === 'string') el = T.$(el); if (!el) return null;
      const rules = T.rules(); let val = null;
      rules.forEach(function (r) {
        r.sels.forEach(function (s) {
          if (s.indexOf(':' + pseudo) < 0) return;
          const base = s.replace(new RegExp(':' + pseudo + '\\b', 'g'), '').trim() || '*';
          let ok = false; try { ok = el.matches(base) || !!el.closest(base) && /\s/.test(s.split(':' + pseudo)[1] || ''); } catch (e) { }
          if (!ok) { try { ok = el.matches(base); } catch (e) { } }
          if (ok && r.decls[prop] != null) val = r.decls[prop];
        });
      });
      return val;
    };
    T.decl = function (selector, prop) {
      const want = String(selector).trim().replace(/\s+/g, ' ').toLowerCase(); let v = null;
      T.rules().forEach(function (r) { if (r.sels.indexOf(want) >= 0 && r.decls[prop] != null) v = r.decls[prop]; });
      return v;
    };
    T.anyDecl = function (prop, re) { return T.rules().some(function (r) { const v = r.decls[prop]; return v != null && (!re || re.test(v)); }); };
    T.media = function () { return T.rules().filter(function (r) { return r.media; }); };
    T.near = function (a, b, tol) { return Math.abs(a - b) <= (tol == null ? 2 : tol); };
    T.leftOf = function (a, b) { const A = T.rect(a), B = T.rect(b); if (!A || !B) return false; return A.right <= B.left + 2 && A.top < B.bottom && B.top < A.bottom; };
    T.above = function (a, b) { const A = T.rect(a), B = T.rect(b); if (!A || !B) return false; return A.bottom <= B.top + 2; };
    async function settle(before) {
      await sleep(40);
      if (lab.navCount !== before && lab.loading) { await lab.loading; }
      if (lab.frame && lab.frame.contentDocument !== T.doc) { T.doc = lab.frame.contentDocument; T.win = lab.frame.contentWindow; T.php = lab.lastPhp; }
      return T.doc;
    }
    T.click = async function (el) { if (typeof el === 'string') el = T.$(el); if (!el) throw new Error('Brak elementu do kliknięcia'); const before = lab.navCount; el.click(); return settle(before); };
    T.type = function (el, v) { if (typeof el === 'string') el = T.$(el); if (!el) throw new Error('Brak pola'); el.focus && el.focus(); el.value = v; el.dispatchEvent(new T.win.Event('input', { bubbles: true })); el.dispatchEvent(new T.win.Event('change', { bubbles: true })); };
    T.choose = function (el, v) { if (typeof el === 'string') el = T.$(el); if (!el) throw new Error('Brak listy'); const o = Array.from(el.options).find(function (o) { return o.value === v || o.textContent.trim() === v; }); if (o) el.value = o.value; el.dispatchEvent(new T.win.Event('change', { bubbles: true })); el.dispatchEvent(new T.win.Event('input', { bubbles: true })); };
    T.tick = function (el, on) { if (typeof el === 'string') el = T.$(el); if (!el) throw new Error('Brak pola wyboru'); if (el.checked !== !!on) { el.checked = !!on; el.dispatchEvent(new T.win.Event('change', { bubbles: true })); el.dispatchEvent(new T.win.Event('input', { bubbles: true })); } };
    T.hover = function (el) { if (typeof el === 'string') el = T.$(el); el.dispatchEvent(new T.win.MouseEvent('mouseover', { bubbles: true })); el.dispatchEvent(new T.win.MouseEvent('mouseenter', { bubbles: false })); };
    T.submit = async function (form, submitter) { if (typeof form === 'string') form = T.$(form); if (!form) throw new Error('Brak formularza'); if (submitter && typeof submitter === 'string') submitter = form.querySelector(submitter); const before = lab.navCount; if (form.requestSubmit) form.requestSubmit(submitter || undefined); else form.submit(); return settle(before); };
    T.wait = sleep;
    T.resize = async function (w) { frame.style.width = w + 'px'; await sleep(150); T.doc = frame.contentDocument; T.win = frame.contentWindow; };
    T.visible = function (el) { if (typeof el === 'string') el = T.$(el); if (!el) return false; const cs = T.win.getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; let p = el.parentElement; while (p) { if (T.win.getComputedStyle(p).display === 'none') return false; p = p.parentElement; } return true; };
    T.norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); };
    T.code = function () { return Object.keys(lab.files).map(function (f) { return lab.files[f]; }).join('\n'); };
    T.codeOf = function (re) { return Object.keys(lab.files).filter(function (f) { return re.test(f); }).map(function (f) { return lab.files[f]; }).join('\n'); };
    T.noComments = function (s) { return String(s).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/[^\n]*/g, '$1'); };
    T.query = function (sql) { const c = lab.conn || (lab.dbName ? lab.dbFor(lab.dbName) : null); if (!c) return []; const r = c.run1(sql); return r.rows || []; };
    T.alerts = lab.alerts;
    return T;
  };

  // uruchamia listę sprawdzeń; zwraca [{ok, d, msg}]
  TR.runChecks = async function (lab, frame, checks, setup) {
    const T = TR.makeTester(lab, frame);
    const out = [];
    lab.alerts.length = 0;
    frame.style.width = '1280px';
    try { await T.open(lab.entry); } catch (e) { return checks.map(function (c) { return { ok: false, d: c.d, msg: 'Nie udało się otworzyć strony: ' + e.message }; }); }
    for (let i = 0; i < checks.length; i++) {
      const c = checks[i];
      if (c.fresh && i > 0) lab.resetDb();
      if (c.reload) { await T.open(c.reload === true ? lab.entry : c.reload); }
      else if (i > 0 && !c.keep) { await T.open(lab.entry); }
      let ok = false, msg = '';
      try {
        const r = await c.f(T);
        if (r === true) ok = true; else if (typeof r === 'string') msg = r; else ok = !!r;
      } catch (e) { ok = false; msg = 'Błąd podczas sprawdzania: ' + (e && e.message || e); }
      out.push({ ok: ok, d: c.d, msg: ok ? '' : (msg || c.why || ''), pts: c.pts });
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
