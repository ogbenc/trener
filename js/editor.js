/* Lekki edytor kodu: textarea + podświetlanie składni (SQL, HTML, CSS, JS, PHP). */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};
  const esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  const sp = function (c, s) { return '<span class="t-' + c + '">' + esc(s) + '</span>'; };

  const SQLKW = 'SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|ASC|DESC|DISTINCT|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|CROSS|ON|USING|UNION|ALL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|DATABASE|ALTER|ADD|DROP|COLUMN|CHANGE|MODIFY|RENAME|TO|AFTER|FIRST|PRIMARY|KEY|FOREIGN|REFERENCES|AUTO_INCREMENT|DEFAULT|UNSIGNED|USER|IDENTIFIED|GRANT|REVOKE|PRIVILEGES|EXISTS|CASE|WHEN|THEN|ELSE|END|TRUE|FALSE|INT|INTEGER|TINYINT|SMALLINT|BIGINT|VARCHAR|CHAR|TEXT|DATE|DATETIME|TIME|YEAR|DECIMAL|FLOAT|DOUBLE|BOOLEAN|BOOL|ENGINE|CHARSET|COLLATE|SHOW|DESCRIBE|USE|INDEX|UNIQUE|IF|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|FLUSH|TRUNCATE|WITH';
  const SQLRE = new RegExp('^(?:' + SQLKW + ')$', 'i');
  function hlSQL(s) {
    let o = ''; const re = /(--[^\n]*|#[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\]|\\.|'')*'?|"(?:[^"\\]|\\.)*"?)|(`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w$]*)(\s*\()?|([^\w\s]+|\s+)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) o += sp('com', m[1]); else if (m[2]) o += sp('str', m[2]); else if (m[3]) o += sp('id', m[3]); else if (m[4]) o += sp('num', m[4]);
      else if (m[5]) { if (m[6]) o += sp('fn', m[5]) + esc(m[6]); else o += SQLRE.test(m[5]) ? sp('kw', m[5]) : esc(m[5]); }
      else o += esc(m[7]);
    }
    return o;
  }
  const JSKW = /^(var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|this|true|false|null|undefined|typeof|instanceof|in|of|class|try|catch|finally|throw|async|await|default|delete|void)$/;
  function hlJS(s) {
    let o = ''; const re = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|(\.)([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)(\s*\()?|([^\w\s]+|\s+)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) o += sp('com', m[1]); else if (m[2]) o += sp('str', m[2]); else if (m[3]) o += sp('num', m[3]);
      else if (m[4]) o += '.' + sp('prop', m[5]);
      else if (m[6]) { if (JSKW.test(m[6])) o += sp('kw', m[6]) + (m[7] ? esc(m[7]) : ''); else if (m[7]) o += sp('fn', m[6]) + esc(m[7]); else o += esc(m[6]); }
      else o += esc(m[8]);
    }
    return o;
  }
  const PHPKW = /^(echo|print|if|else|elseif|endif|while|endwhile|for|endfor|foreach|endforeach|as|switch|case|break|continue|default|function|return|global|static|true|false|null|new|and|or|isset|empty|unset|exit|die|require|require_once|include|include_once|array|list|try|catch|throw|match|fn|TRUE|FALSE|NULL)$/i;
  function hlPHP(s) {
    let o = ''; const re = /(\/\/[^\n]*?(?=\?>|\n|$)|#[^\n]*?(?=\?>|\n|$)|\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\]|\\.)*'?)|("(?:[^"\\]|\\.)*"?)|(\$[A-Za-z_][\w]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)(\s*\()?|([^\w\s$]+|\s+|\$)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) o += sp('com', m[1]); else if (m[2]) o += sp('str', m[2]);
      else if (m[3]) o += '<span class="t-str">' + esc(m[3]).replace(/(\$[A-Za-z_]\w*(?:\[[^\]]*\])?|\{\$[^}]*\})/g, '<span class="t-var">$1</span>') + '</span>';
      else if (m[4]) o += sp('var', m[4]); else if (m[5]) o += sp('num', m[5]);
      else if (m[6]) { if (PHPKW.test(m[6])) o += sp('kw', m[6]) + (m[7] ? esc(m[7]) : ''); else if (m[7]) o += sp('fn', m[6]) + esc(m[7]); else o += esc(m[6]); }
      else o += esc(m[8]);
    }
    return o;
  }
  function hlCSS(s) {
    let o = ''; let depth = 0; const re = /(\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?)|(\{)|(\})|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|(-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|pt|fr)?\b)|([\w-]+)(\s*:)?|(\s+|[^\s{}]+?)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) o += sp('com', m[1]); else if (m[2]) o += sp('str', m[2]);
      else if (m[3]) { depth++; o += '{'; } else if (m[4]) { depth = Math.max(0, depth - 1); o += '}'; }
      else if (m[5]) o += sp('kw', m[5]); else if (m[6]) o += sp('num', m[6]); else if (m[7]) o += depth ? sp('num', m[7]) : sp('sel', m[7]);
      else if (m[8]) { if (depth && m[9]) o += sp('prop', m[8]) + esc(m[9]); else o += depth ? sp('val', m[8]) : sp('sel', m[8]) + (m[9] ? esc(m[9]) : ''); }
      else o += depth ? esc(m[10]) : sp('sel', m[10]);
    }
    return o;
  }
  function hlTag(s) {
    // s = "<tag attr="x">" itp.
    const m = s.match(/^(<\/?)([\w:-]*)([\s\S]*?)(\/?>)?$/);
    if (!m) return esc(s);
    let attrs = m[3].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    attrs = attrs.replace(/([\w:-]+)(\s*=\s*)("[^"]*"?|'[^']*'?|[^\s"']+)?/g, function (a, n, eq, v) { return '<span class="t-attr">' + n + '</span>' + (eq || '') + (v ? '<span class="t-val">' + v + '</span>' : ''); });
    return esc(m[1]) + '<span class="t-tag">' + esc(m[2]) + '</span>' + attrs + (m[4] ? esc(m[4]) : '');
  }
  function hlHTML(s) {
    let o = ''; let i = 0;
    while (i < s.length) {
      if (s.startsWith('<?', i)) {
        const e = s.indexOf('?>', i + 2); const end = e < 0 ? s.length : e + 2;
        const head = s.startsWith('<?php', i) ? 5 : s.startsWith('<?=', i) ? 3 : 2;
        o += '<span class="t-php">' + sp('kw', s.slice(i, i + head)) + hlPHP(s.slice(i + head, e < 0 ? s.length : e)) + (e < 0 ? '' : sp('kw', '?>')) + '</span>';
        i = end; continue;
      }
      if (s.startsWith('<!--', i)) { const e = s.indexOf('-->', i); const end = e < 0 ? s.length : e + 3; o += sp('com', s.slice(i, end)); i = end; continue; }
      if (s[i] === '<' && /[a-zA-Z\/!]/.test(s[i + 1] || '')) {
        let j = i + 1, q = null;
        while (j < s.length) { const c = s[j]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>' ) break; else if (c === '<' && s[j + 1] === '?') break; j++; }
        if (s[j] === '<') { // PHP w środku znacznika
          o += hlTag(s.slice(i, j)); i = j; continue;
        }
        const tag = s.slice(i, j + 1);
        o += /^<!/i.test(tag) ? sp('kw', tag) : hlTag(tag);
        i = j + 1;
        const tn = (tag.match(/^<([a-zA-Z]+)/) || [])[1];
        if (tn && /^(style|script)$/i.test(tn)) {
          const close = s.toLowerCase().indexOf('</' + tn.toLowerCase(), i);
          const end = close < 0 ? s.length : close;
          const inner = s.slice(i, end);
          o += /^style$/i.test(tn) ? hlCSS(inner) : hlJS(inner);
          i = end;
        }
        continue;
      }
      const n = s.slice(i).search(/<|&/); const len = n < 0 ? s.length - i : Math.max(n, 1);
      const chunk = s.slice(i, i + len);
      o += chunk[0] === '&' ? (function () { const m = s.slice(i).match(/^&[#\w]+;/); if (m) { i += m[0].length; return sp('ent', m[0]); } i += 1; return '&amp;'; })() : (i += len, esc(chunk));
    }
    return o;
  }
  const HL = { sql: hlSQL, js: hlJS, css: hlCSS, html: hlHTML, php: hlHTML, txt: esc };
  TR.highlight = function (code, lang) { return (HL[lang] || esc)(code); };
  TR.langOf = function (name) { const e = String(name).split('.').pop().toLowerCase(); return { html: 'html', htm: 'html', css: 'css', js: 'js', php: 'php', sql: 'sql', txt: 'txt' }[e] || 'txt'; };

  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

  TR.Editor = function (host, opts) {
    opts = opts || {};
    const wrap = document.createElement('div'); wrap.className = 'ed';
    const gut = document.createElement('div'); gut.className = 'ed-gut'; gut.setAttribute('aria-hidden', 'true');
    const box = document.createElement('div'); box.className = 'ed-box';
    const pre = document.createElement('pre'); pre.className = 'ed-hl'; pre.setAttribute('aria-hidden', 'true');
    const ta = document.createElement('textarea'); ta.className = 'ed-ta';
    ta.setAttribute('spellcheck', 'false'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('aria-label', opts.label || 'Edytor kodu');
    if (opts.id) ta.id = opts.id;
    box.appendChild(pre); box.appendChild(ta); wrap.appendChild(gut); wrap.appendChild(box); host.appendChild(wrap);
    let lang = opts.lang || 'txt';
    const self = this;
    this.ta = ta; this.el = wrap;
    function render() {
      const v = ta.value;
      pre.innerHTML = TR.highlight(v, lang) + '\n ';
      const n = v.split('\n').length; let g = '';
      for (let i = 1; i <= n; i++) g += i + '\n';
      gut.textContent = g;
      if (opts.autoHeight) { ta.style.height = 'auto'; const h = Math.max(opts.minHeight || 0, ta.scrollHeight); ta.style.height = h + 'px'; pre.style.height = h + 'px'; }
    }
    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; }
    ta.addEventListener('scroll', sync);
    ta.addEventListener('input', function () { render(); sync(); if (opts.onChange) opts.onChange(ta.value); });
    function insert(text, selStart, selEnd) {
      // execCommand zachowuje historię cofania
      ta.focus();
      const ok = document.execCommand && document.execCommand('insertText', false, text);
      if (!ok) { const s = ta.selectionStart, e = ta.selectionEnd; ta.value = ta.value.slice(0, s) + text + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + text.length; ta.dispatchEvent(new Event('input')); }
      if (selStart != null) { ta.selectionStart = selStart; ta.selectionEnd = selEnd == null ? selStart : selEnd; }
    }
    ta.addEventListener('keydown', function (ev) {
      const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); if (opts.onRun) opts.onRun(); return; }
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) { ev.preventDefault(); if (opts.onCheck) opts.onCheck(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === '/') {
        ev.preventDefault();
        const ls = v.lastIndexOf('\n', s - 1) + 1; let le = v.indexOf('\n', e); if (le < 0) le = v.length;
        const block = v.slice(ls, le);
        const cm = lang === 'sql' ? '-- ' : lang === 'css' ? null : '// ';
        let out;
        if (lang === 'css' || lang === 'html') { const o = lang === 'css' ? ['/* ', ' */'] : ['<!-- ', ' -->']; out = block.startsWith(o[0]) ? block.slice(o[0].length, block.length - (block.endsWith(o[1]) ? o[1].length : 0)) : o[0] + block + o[1]; }
        else { const lines = block.split('\n'); const all = lines.every(function (l) { return !l.trim() || l.trim().startsWith(cm.trim()); }); out = lines.map(function (l) { return all ? l.replace(cm, '').replace(cm.trim(), '') : (l.trim() ? cm + l : l); }).join('\n'); }
        ta.selectionStart = ls; ta.selectionEnd = le; insert(out, ls, ls + out.length); return;
      }
      if (ev.key === 'Tab') {
        ev.preventDefault();
        if (s !== e || ev.shiftKey) {
          const ls = v.lastIndexOf('\n', s - 1) + 1; let le = v.indexOf('\n', e - (e > s && v[e - 1] === '\n' ? 1 : 0)); if (le < 0) le = v.length;
          const lines = v.slice(ls, le).split('\n');
          const out = lines.map(function (l) { return ev.shiftKey ? l.replace(/^( {1,2}|\t)/, '') : '  ' + l; }).join('\n');
          ta.selectionStart = ls; ta.selectionEnd = le; insert(out, ls, ls + out.length);
        } else insert('  ');
        return;
      }
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.altKey) {
        const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s); const ind = (line.match(/^[ \t]*/) || [''])[0];
        const prev = v[s - 1], next = v[s];
        if ((prev === '{' && next === '}') || (prev === '(' && next === ')') || (prev === '[' && next === ']') || (/<([a-zA-Z][\w-]*)[^<>]*>$/.test(line) && /^<\//.test(v.slice(s)))) {
          ev.preventDefault(); insert('\n' + ind + '  ' + '\n' + ind, s + 1 + ind.length + 2); return;
        }
        if (prev === '{' || prev === ':' && /^\s*(case|default)/.test(line) || /<(ul|ol|table|tr|div|section|header|main|footer|nav|aside|article|form|select|body|head|html|style|script)\b[^<>]*>$/i.test(line.trim())) { ev.preventDefault(); insert('\n' + ind + '  '); return; }
        ev.preventDefault(); insert('\n' + ind); return;
      }
      if (ev.key === 'Backspace' && s === e && s > 0) {
        const prev = v[s - 1], next = v[s];
        if (PAIRS[prev] && PAIRS[prev] === next) { ev.preventDefault(); ta.selectionStart = s - 1; ta.selectionEnd = s + 1; insert(''); return; }
        const ls = v.lastIndexOf('\n', s - 1) + 1; const before = v.slice(ls, s);
        if (/^( {2})+$/.test(before)) { ev.preventDefault(); ta.selectionStart = s - 2; insert(''); return; }
      }
      if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.key.length === 1) {
        const k = ev.key, next = v[s];
        if ((k === ')' || k === ']' || k === '}' || k === '"' || k === "'") && next === k && s === e) { ev.preventDefault(); ta.selectionStart = ta.selectionEnd = s + 1; return; }
        if (PAIRS[k] && opts.autoClose !== false) {
          const prevC = v[s - 1] || ' ';
          const okNext = !next || /[\s)\]};,>]/.test(next);
          if ((k === '"' || k === "'") && /[\w]/.test(prevC)) { /* apostrof w słowie */ }
          else if (okNext || s !== e) { ev.preventDefault(); const sel = v.slice(s, e); insert(k + sel + PAIRS[k], s + 1, s + 1 + sel.length); return; }
        }
        if (k === '>' && (lang === 'html' || lang === 'php') && s === e) {
          const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s);
          const m = line.match(/<([a-zA-Z][\w-]*)(?:\s[^<>]*)?$/);
          const inPhp = v.lastIndexOf('<?', s) > v.lastIndexOf('?>', s);
          if (m && !inPhp && !VOID.test(m[1]) && !/\/$/.test(line) && !/["']$/.test(line.replace(/=\s*"[^"]*"|='[^']*'/g, ''))) {
            ev.preventDefault(); insert('></' + m[1] + '>', s + 1); return;
          }
        }
      }
    });
    this.get = function () { return ta.value; };
    this.set = function (v) { ta.value = v == null ? '' : v; render(); sync(); };
    this.setLang = function (l) { lang = l; render(); };
    this.focus = function () { ta.focus(); };
    this.setReadOnly = function (b) { ta.readOnly = !!b; wrap.classList.toggle('ro', !!b); };
    this.markLine = function (n) {
      wrap.querySelectorAll('.ed-mark').forEach(function (x) { x.remove(); });
      if (!n) return;
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; const pt = parseFloat(getComputedStyle(ta).paddingTop) || 0;
      const mk = document.createElement('div'); mk.className = 'ed-mark'; mk.style.top = (pt + (n - 1) * lh - ta.scrollTop) + 'px'; mk.style.height = lh + 'px'; box.appendChild(mk);
    };
    render();
  };
})(typeof window !== 'undefined' ? window : globalThis);
