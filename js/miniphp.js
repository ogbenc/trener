/* MiniPHP – interpreter podzbioru PHP 8 używanego na egzaminie INF.03 (mysqli, formularze, sesje).
   Działa w przeglądarce bez serwera. Nie jest pełnym PHP – obsługuje to, czego wymagają arkusze. */
(function (root) {
  'use strict';
  const TR = root.TR = root.TR || {};

  /* ===================== wartości ===================== */
  class PArr {
    constructor() { this.m = new Map(); this.next = 0; }
    static normKey(k) {
      if (typeof k === 'number') return Number.isInteger(k) ? k : Math.trunc(k);
      if (typeof k === 'boolean') return k ? 1 : 0;
      if (k === null || k === undefined) return '';
      if (typeof k === 'string' && /^(0|-?[1-9][0-9]*)$/.test(k) && Math.abs(+k) <= Number.MAX_SAFE_INTEGER) return +k;
      return String(k);
    }
    get(k) { return this.m.get(PArr.normKey(k)); }
    has(k) { return this.m.has(PArr.normKey(k)); }
    set(k, v) { k = PArr.normKey(k); this.m.set(k, v); if (typeof k === 'number' && k >= this.next) this.next = k + 1; }
    push(v) { this.m.set(this.next, v); this.next++; }
    del(k) { this.m.delete(PArr.normKey(k)); }
    get size() { return this.m.size; }
    keys() { return Array.from(this.m.keys()); }
    values() { return Array.from(this.m.values()); }
    entries() { return Array.from(this.m.entries()); }
    copy() { const a = new PArr(); this.m.forEach(function (v, k) { a.m.set(k, v instanceof PArr ? v.copy() : v); }); a.next = this.next; return a; }
    static from(list) { const a = new PArr(); list.forEach(function (v) { a.push(v); }); return a; }
    static assoc(obj) { const a = new PArr(); Object.keys(obj).forEach(function (k) { a.set(k, obj[k]); }); return a; }
  }
  class PObj { constructor(cls, props) { this.cls = cls || 'stdClass'; this.props = props || {}; } }
  class PFatal extends Error { constructor(msg, line, kind) { super(msg); this.line = line; this.kind = kind || 'Fatal error'; } }
  class PThrow extends Error { constructor(cls, msg, line) { super(msg); this.cls = cls; this.line = line; } }
  class BreakSig { constructor(n) { this.n = n || 1; } }
  class ContinueSig { constructor(n) { this.n = n || 1; } }
  class ReturnSig { constructor(v) { this.v = v; } }
  class ExitSig { }

  function isNumStr(s) { return typeof s === 'string' && /^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?[ \t\n\r\v\f]*$/.test(s); }
  function leadNum(s) { const m = String(s).match(/^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/); return m ? m[0] : null; }
  function fmtFloat(n) {
    if (!isFinite(n)) return isNaN(n) ? 'NAN' : (n > 0 ? 'INF' : '-INF');
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    let s = parseFloat(n.toPrecision(14));
    if (Math.abs(s) >= 1e15 || (Math.abs(s) < 1e-4 && s !== 0)) {
      let e = s.toExponential(); e = e.replace(/e\+?/, 'E+').replace('E+-', 'E-');
      if (!/\./.test(e.split('E')[0])) e = e.replace('E', '.0E');
      return e;
    }
    return String(s);
  }

  /* ===================== lekser ===================== */
  const KW = new Set(['echo', 'print', 'if', 'else', 'elseif', 'endif', 'while', 'endwhile', 'do', 'for', 'endfor', 'foreach', 'endforeach', 'as', 'switch', 'endswitch', 'case', 'default', 'break', 'continue', 'function', 'return', 'global', 'static', 'true', 'false', 'null', 'new', 'and', 'or', 'xor', 'isset', 'empty', 'unset', 'exit', 'die', 'require', 'require_once', 'include', 'include_once', 'array', 'list', 'try', 'catch', 'finally', 'throw', 'instanceof', 'fn', 'match', 'const']);
  const OPS = ['<=>', '**=', '...', '<<=', '>>=', '===', '!==', '??=', '?->', '++', '--', '->', '=>', '::', '==', '!=', '<>', '<=', '>=', '&&', '||', '??', '+=', '-=', '*=', '/=', '.=', '%=', '**', '<<', '>>', '&=', '|=', '^=', '+', '-', '*', '/', '%', '=', '<', '>', '!', '.', '(', ')', '[', ']', '{', '}', ',', ';', '?', ':', '&', '|', '^', '~', '@', '$'];

  function lex(src, file) {
    const toks = []; let i = 0, line = 1; const n = src.length;
    function push(t, v, extra) { const o = { t: t, v: v, line: line }; if (extra) Object.assign(o, extra); toks.push(o); return o; }
    function err(msg) { throw new PFatal(msg, line, 'Parse error'); }
    function count(s) { for (let k = 0; k < s.length; k++) if (s[k] === '\n') line++; }
    while (i < n) {
      // tryb HTML
      let j = src.indexOf('<?', i);
      while (j >= 0 && !(src.substr(j, 5).toLowerCase() === '<?php' || src[j + 2] === '=')) j = src.indexOf('<?', j + 2);
      const html = j < 0 ? src.slice(i) : src.slice(i, j);
      if (html) { push('html', html); count(html); }
      if (j < 0) break;
      if (src[j + 2] === '=') { i = j + 3; push('id', 'echo'); }
      else { i = j + 5; }
      // tryb PHP
      let closed = false;
      while (i < n) {
        const c = src[i];
        if (c === '\n') { line++; i++; continue; }
        if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
        if (c === '?' && src[i + 1] === '>') {
          push('op', ';', { close: 1 }); i += 2;
          if (src[i] === '\n') { i++; line++; } else if (src[i] === '\r' && src[i + 1] === '\n') { i += 2; line++; }
          closed = true; break;
        }
        if (c === '#' || (c === '/' && src[i + 1] === '/')) {
          while (i < n && src[i] !== '\n') { if (src[i] === '?' && src[i + 1] === '>') break; i++; }
          continue;
        }
        if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) err('Unterminated comment starting line ' + line); count(src.slice(i, e)); i = e + 2; continue; }
        if (c === '$' && /[a-zA-Z_\x80-\uffff]/.test(src[i + 1] || '')) {
          const m = src.slice(i + 1).match(/^[a-zA-Z_\x80-\uffff][a-zA-Z0-9_\x80-\uffff]*/);
          push('var', m[0]); i += 1 + m[0].length; continue;
        }
        if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
          let m = src.slice(i).match(/^0[xX][0-9a-fA-F_]+/) || src.slice(i).match(/^0[bB][01_]+/) || src.slice(i).match(/^(\d[\d_]*)?(\.\d[\d_]*)?([eE][+-]?\d+)?/);
          let s = m[0];
          if (/^\d+\.$/.test(src.slice(i, i + s.length + 1)) && !/[0-9a-zA-Z_.]/.test(src[i + s.length + 1] || '')) { /* 1. */ }
          if (s === '' ) { m = src.slice(i).match(/^\d+/); s = m[0]; }
          // obsługa "1." (liczba z kropką)
          if (src[i + s.length] === '.' && /^\d+$/.test(s) && !/[0-9.]/.test(src[i + s.length + 1] || '') && !/[=]/.test(src[i + s.length + 1] || '') && false) s += '.';
          const clean = s.replace(/_/g, '');
          let v;
          if (/^0[xX]/.test(clean)) v = parseInt(clean, 16); else if (/^0[bB]/.test(clean)) v = parseInt(clean.slice(2), 2);
          else if (/^0[0-7]+$/.test(clean)) v = parseInt(clean, 8);
          else v = Number(clean);
          push('num', v, { float: /[.eE]/.test(clean) && !/^0[xX]/.test(clean) }); i += s.length; continue;
        }
        if (/[a-zA-Z_\x80-\uffff\\]/.test(c)) {
          const m = src.slice(i).match(/^\\?[a-zA-Z_\x80-\uffff][a-zA-Z0-9_\x80-\uffff\\]*/);
          let w = m[0].replace(/^\\/, '');
          i += m[0].length;
          // rzutowania (int) itp. obsłużone przy '('
          push('id', w); continue;
        }
        if (c === "'") {
          let k = i + 1, s = '';
          while (k < n && src[k] !== "'") { if (src[k] === '\\' && (src[k + 1] === "'" || src[k + 1] === '\\')) { s += src[k + 1]; k += 2; continue; } if (src[k] === '\n') line++; s += src[k]; k++; }
          if (k >= n) err('syntax error, unexpected end of file (niezamknięty apostrof \' )');
          push('str', s); i = k + 1; continue;
        }
        if (c === '"') { const startLine = line; const r = lexDq(src, i + 1, '"'); push('tpl', null, { parts: r.parts, line: startLine }); count(src.slice(i, r.end)); i = r.end + 1; continue; }
        if (c === '<' && src.substr(i, 3) === '<<<') {
          const m = src.slice(i).match(/^<<<[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1\r?\n/);
          if (m) {
            const label = m[2]; const bodyStart = i + m[0].length;
            const re = new RegExp('\\n([ \\t]*)' + label + '\\b');
            const mm = re.exec(src.slice(bodyStart - 1));
            if (!mm) err('syntax error, unexpected end of file (heredoc)');
            let body = src.slice(bodyStart, bodyStart - 1 + mm.index);
            const ind = mm[1]; if (ind) body = body.split('\n').map(function (l) { return l.startsWith(ind) ? l.slice(ind.length) : l; }).join('\n');
            const startLine = line;
            if (m[1] === "'") push('str', body); else { const r = lexDq(body + '\u0000', 0, '\u0000'); push('tpl', null, { parts: r.parts, line: startLine }); }
            count(src.slice(i, bodyStart - 1 + mm.index + mm[0].length));
            i = bodyStart - 1 + mm.index + mm[0].length; continue;
          }
        }
        if (c === '`') err('syntax error, unexpected character "`"');
        let op = null;
        for (let k = 0; k < OPS.length; k++) if (src.substr(i, OPS[k].length) === OPS[k]) { op = OPS[k]; break; }
        if (!op) err('syntax error, unexpected character "' + c + '"');
        push('op', op); i += op.length;
      }
      if (!closed) break;
    }
    push('eof', null);
    return toks;

    function lexDq(s, k, q) {
      const parts = []; let buf = '';
      function flush() { if (buf) { parts.push({ s: buf }); buf = ''; } }
      while (k < s.length && s[k] !== q) {
        const c = s[k];
        if (c === '\\') {
          const d = s[k + 1];
          const map = { n: '\n', t: '\t', r: '\r', v: '\v', e: '\x1b', f: '\f', '\\': '\\', '$': '$', '"': '"' };
          if (d === q && q !== '"') { buf += d; k += 2; continue; }
          if (map[d] !== undefined && !(d === '"' && q !== '"')) { buf += map[d]; k += 2; continue; }
          if (/[0-7]/.test(d)) { const m = s.slice(k + 1).match(/^[0-7]{1,3}/); buf += String.fromCharCode(parseInt(m[0], 8)); k += 1 + m[0].length; continue; }
          if (d === 'x' && /[0-9a-fA-F]/.test(s[k + 2])) { const m = s.slice(k + 2).match(/^[0-9a-fA-F]{1,2}/); buf += String.fromCharCode(parseInt(m[0], 16)); k += 2 + m[0].length; continue; }
          if (d === 'u' && s[k + 2] === '{') { const e = s.indexOf('}', k); buf += String.fromCodePoint(parseInt(s.slice(k + 3, e), 16)); k = e + 1; continue; }
          buf += '\\'; k++; continue;
        }
        if (c === '$' && /[a-zA-Z_\x80-\uffff]/.test(s[k + 1] || '')) {
          flush();
          const m = s.slice(k + 1).match(/^[a-zA-Z_\x80-\uffff][a-zA-Z0-9_\x80-\uffff]*/);
          let node = { k: 'var', name: m[0], line: line };
          k += 1 + m[0].length;
          if (s[k] === '[') {
            const e = s.indexOf(']', k);
            if (e < 0) throw new PFatal('syntax error, unexpected end of string', line, 'Parse error');
            const inner = s.slice(k + 1, e);
            let key;
            if (/^-?\d+$/.test(inner)) key = { k: 'lit', v: parseInt(inner, 10) };
            else if (/^[a-zA-Z_\x80-\uffff][a-zA-Z0-9_\x80-\uffff]*$/.test(inner)) key = { k: 'lit', v: inner };
            else if (/^\$[a-zA-Z_\x80-\uffff][a-zA-Z0-9_\x80-\uffff]*$/.test(inner)) key = { k: 'var', name: inner.slice(1), line: line };
            else throw new PFatal('syntax error, unexpected string content "", expecting "-" or identifier or variable or number' + (/^['"]/.test(inner) ? ' (w "…" nie pisz $tab[\'klucz\'] – użyj {$tab[\'klucz\']} albo $tab[klucz] albo sklejania kropką)' : ''), line, 'Parse error');
            node = { k: 'idx', obj: node, key: key, line: line }; k = e + 1;
          } else if (s[k] === '-' && s[k + 1] === '>' && /[a-zA-Z_]/.test(s[k + 2] || '')) {
            const mm = s.slice(k + 2).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            node = { k: 'prop', obj: node, name: mm[0], line: line }; k += 2 + mm[0].length;
          }
          parts.push({ e: node }); continue;
        }
        if (c === '{' && s[k + 1] === '$') {
          flush();
          // znajdź pasujący }
          let depth = 0, e = k;
          for (; e < s.length; e++) { if (s[e] === '{') depth++; else if (s[e] === '}') { depth--; if (depth === 0) break; } else if (s[e] === "'" || (s[e] === '"' && q !== '"')) { const qq = s[e]; e++; while (e < s.length && s[e] !== qq) { if (s[e] === '\\') e++; e++; } } }
          const code = s.slice(k + 1, e);
          const sub = lex('<?php ' + code + ';', file);
          sub.forEach(function (t) { t.line = line; });
          const p = new Parser(sub, file); const ex = p.expr(); parts.push({ e: ex });
          k = e + 1; continue;
        }
        if (c === '\n') line++;
        buf += c; k++;
      }
      if (k >= s.length && q === '"') throw new PFatal('syntax error, unexpected end of file (niezamknięty cudzysłów ")', line, 'Parse error');
      flush();
      return { parts: parts, end: k };
    }
  }

  /* ===================== parser ===================== */
  const BIN = {
    'or': [1, 'L'], 'xor': [2, 'L'], 'and': [3, 'L'],
    '=': [5, 'R'], '+=': [5, 'R'], '-=': [5, 'R'], '*=': [5, 'R'], '/=': [5, 'R'], '.=': [5, 'R'], '%=': [5, 'R'], '**=': [5, 'R'], '??=': [5, 'R'],
    '?': [7, 'R'], '??': [8, 'R'], '||': [9, 'L'], '&&': [10, 'L'], '|': [11, 'L'], '^': [12, 'L'], '&': [13, 'L'],
    '==': [14, 'N'], '!=': [14, 'N'], '<>': [14, 'N'], '===': [14, 'N'], '!==': [14, 'N'], '<=>': [14, 'N'],
    '<': [15, 'N'], '<=': [15, 'N'], '>': [15, 'N'], '>=': [15, 'N'],
    '.': [16, 'L'], '<<': [17, 'L'], '>>': [17, 'L'], '+': [18, 'L'], '-': [18, 'L'],
    '*': [19, 'L'], '/': [19, 'L'], '%': [19, 'L'], 'instanceof': [21, 'N'], '**': [23, 'R']
  };
  const CASTS = { 'int': 'int', 'integer': 'int', 'float': 'float', 'double': 'float', 'string': 'string', 'bool': 'bool', 'boolean': 'bool', 'array': 'array', 'object': 'object' };

  class Parser {
    constructor(toks, file) { this.t = toks; this.p = 0; this.file = file; }
    peek(o) { return this.t[this.p + (o || 0)]; }
    next() { return this.t[this.p++]; }
    is(t, v) { const k = this.peek(); return k.t === t && (v === undefined || (t === 'id' ? String(k.v).toLowerCase() === v : k.v === v)); }
    isOp(v) { return this.is('op', v); }
    isKw(v) { return this.is('id', v); }
    accept(t, v) { if (this.is(t, v)) return this.next(); return null; }
    desc(tok) {
      if (!tok || tok.t === 'eof') return 'end of file';
      if (tok.t === 'var') return 'variable "$' + tok.v + '"';
      if (tok.t === 'str' || tok.t === 'tpl') return 'double-quoted string';
      if (tok.t === 'num') return (tok.float ? 'floating-point number' : 'integer') + ' "' + tok.v + '"';
      if (tok.t === 'html') return 'inline html (?>…<?php)';
      if (tok.t === 'id') return (KW.has(String(tok.v).toLowerCase()) ? 'token "' + tok.v + '"' : 'identifier "' + tok.v + '"');
      return 'token "' + tok.v + '"';
    }
    fail(expect) {
      const tok = this.peek();
      let msg = 'syntax error, unexpected ' + this.desc(tok) + (expect && expect !== '";"' ? ', expecting ' + expect : '');
      let line = tok.line;
      const prev = this.t[this.p - 1];
      if (expect === '";"' || expect === '"," or ";"') { msg += ' (brakuje średnika ; na końcu poprzedniej instrukcji?)'; if (prev) line = tok.line; }
      if (tok.t === 'eof') msg += ' (brakuje zamykającego nawiasu } albo ) ?)';
      throw new PFatal(msg, line, 'Parse error');
    }
    expectOp(v) { if (!this.isOp(v)) this.fail('"' + v + '"'); return this.next(); }
    semi() { if (this.isOp(';')) { this.next(); return; } if (this.is('eof')) return; if (this.is('html')) return; this.fail('";"'); }

    program() { const body = []; while (!this.is('eof')) body.push(this.stmt()); return body; }
    block() {
      if (this.isOp('{')) { const open = this.next(); const body = []; while (!this.isOp('}')) { if (this.is('eof')) throw new PFatal("Unclosed '{' on line " + open.line + ' (brakuje zamykającego nawiasu } )', this.peek().line, 'Parse error'); body.push(this.stmt()); } this.next(); return { k: 'block', body: body }; }
      return this.stmt();
    }
    altBody(ends) {
      const body = [];
      while (!ends.some(function (e) { return this.isKw(e); }, this)) { if (this.is('eof')) this.fail('"' + ends[0] + '"'); body.push(this.stmt()); }
      return { k: 'block', body: body };
    }
    stmt() {
      const tok = this.peek(); const line = tok.line;
      if (tok.t === 'html') { this.next(); return { k: 'echo', args: [{ k: 'lit', v: tok.v }], line: line }; }
      if (tok.t === 'op') {
        if (tok.v === ';') { this.next(); return { k: 'nop' }; }
        if (tok.v === '{') return this.block();
      }
      if (tok.t === 'id') {
        const w = String(tok.v).toLowerCase();
        switch (w) {
          case 'echo': {
            this.next(); const args = [this.expr()]; while (this.accept('op', ',')) args.push(this.expr()); this.semi(); return { k: 'echo', args: args, line: line };
          }
          case 'if': return this.ifStmt();
          case 'while': {
            this.next(); this.expectOp('('); const c = this.expr(); this.expectOp(')');
            let body; if (this.accept('op', ':')) { body = this.altBody(['endwhile']); this.next(); this.semi(); } else body = this.block();
            return { k: 'while', cond: c, body: body, line: line };
          }
          case 'do': {
            this.next(); const body = this.block(); if (!this.isKw('while')) this.fail('"while"'); this.next(); this.expectOp('('); const c = this.expr(); this.expectOp(')'); this.semi();
            return { k: 'dowhile', cond: c, body: body, line: line };
          }
          case 'for': {
            this.next(); this.expectOp('(');
            const lst = (end) => { const a = []; if (!this.isOp(end)) { a.push(this.expr()); while (this.accept('op', ',')) a.push(this.expr()); } this.expectOp(end); return a; };
            const init = lst(';'), cond = lst(';'), step = lst(')');
            let body; if (this.accept('op', ':')) { body = this.altBody(['endfor']); this.next(); this.semi(); } else body = this.block();
            return { k: 'for', init: init, cond: cond, step: step, body: body, line: line };
          }
          case 'foreach': {
            this.next(); this.expectOp('('); const subj = this.expr(); if (!this.isKw('as')) this.fail('"as"'); this.next();
            let byRef = !!this.accept('op', '&'); let kv = this.expr(); let key = null, val = kv;
            if (this.accept('op', '=>')) { key = kv; byRef = !!this.accept('op', '&'); val = this.expr(); }
            this.expectOp(')');
            let body; if (this.accept('op', ':')) { body = this.altBody(['endforeach']); this.next(); this.semi(); } else body = this.block();
            return { k: 'foreach', subj: subj, key: key, val: val, byRef: byRef, body: body, line: line };
          }
          case 'switch': {
            this.next(); this.expectOp('('); const subj = this.expr(); this.expectOp(')');
            const alt = !this.isOp('{'); if (alt) this.expectOp(':'); else this.next();
            const cases = [];
            while (!(alt ? this.isKw('endswitch') : this.isOp('}'))) {
              if (this.is('eof')) this.fail('"}"');
              if (this.accept('op', ';')) continue;
              let test = null;
              if (this.isKw('case')) { this.next(); test = this.expr(); } else if (this.isKw('default')) { this.next(); } else this.fail('"case" or "default"');
              if (!this.accept('op', ':')) this.expectOp(';');
              const body = [];
              while (!this.isKw('case') && !this.isKw('default') && !(alt ? this.isKw('endswitch') : this.isOp('}'))) body.push(this.stmt());
              cases.push({ test: test, body: body });
            }
            this.next(); if (alt) this.semi();
            return { k: 'switch', subj: subj, cases: cases, line: line };
          }
          case 'break': case 'continue': {
            this.next(); let n = 1; if (this.is('num')) n = this.next().v; this.semi(); return { k: w, n: n, line: line };
          }
          case 'return': { this.next(); let e = null; if (!this.isOp(';') && !this.is('eof') && !this.is('html')) e = this.expr(); this.semi(); return { k: 'return', e: e, line: line }; }
          case 'function': {
            if (this.peek(1).t === 'id') {
              this.next(); const name = this.next().v; const params = this.params(); if (this.accept('op', ':')) this.typeHint();
              const body = this.block(); return { k: 'fndecl', name: name, params: params, body: body, line: line };
            }
            break;
          }
          case 'global': { this.next(); const names = []; do { const v = this.next(); if (v.t !== 'var') this.fail('variable'); names.push(v.v); } while (this.accept('op', ',')); this.semi(); return { k: 'global', names: names, line: line }; }
          case 'static': {
            if (this.peek(1).t === 'var') { this.next(); const items = []; do { const v = this.next().v; let init = null; if (this.accept('op', '=')) init = this.expr(); items.push({ name: v, init: init }); } while (this.accept('op', ',')); this.semi(); return { k: 'static', items: items, line: line }; }
            break;
          }
          case 'unset': { this.next(); this.expectOp('('); const a = [this.expr()]; while (this.accept('op', ',')) { if (this.isOp(')')) break; a.push(this.expr()); } this.expectOp(')'); this.semi(); return { k: 'unset', args: a, line: line }; }
          case 'try': {
            this.next(); const body = this.block(); const catches = []; let fin = null;
            while (this.isKw('catch')) { this.next(); this.expectOp('('); const types = [this.next().v]; while (this.accept('op', '|')) types.push(this.next().v); let v = null; if (this.is('var')) v = this.next().v; this.expectOp(')'); catches.push({ types: types, v: v, body: this.block() }); }
            if (this.isKw('finally')) { this.next(); fin = this.block(); }
            return { k: 'try', body: body, catches: catches, fin: fin, line: line };
          }
          case 'throw': { this.next(); const e = this.expr(); this.semi(); return { k: 'throw', e: e, line: line }; }
          case 'const': { this.next(); const name = this.next().v; this.expectOp('='); const e = this.expr(); this.semi(); return { k: 'const', name: name, e: e, line: line }; }
          case 'class': case 'interface': case 'trait': case 'namespace':
            throw new PFatal('MiniPHP: „' + w + '” nie jest obsługiwane (na egzaminie niepotrzebne).', line);
          case 'declare': { this.next(); this.expectOp('('); while (!this.isOp(')')) this.next(); this.next(); this.semi(); return { k: 'nop' }; }
          case 'use': { while (!this.isOp(';')) this.next(); this.next(); return { k: 'nop' }; }
        }
      }
      const e = this.expr(); this.semi();
      return { k: 'expr', e: e, line: line };
    }
    typeHint() { this.accept('op', '?'); this.next(); while (this.accept('op', '|')) this.next(); }
    params() {
      this.expectOp('('); const ps = [];
      while (!this.isOp(')')) {
        if (this.is('id') || this.isOp('?')) { if (!this.is('var')) this.typeHint(); }
        const ref = !!this.accept('op', '&'); const variadic = !!this.accept('op', '...');
        const v = this.next(); if (v.t !== 'var') { this.p--; this.fail('variable'); }
        let def; if (this.accept('op', '=')) def = this.expr();
        ps.push({ name: v.v, def: def, ref: ref, variadic: variadic });
        if (!this.accept('op', ',')) break;
      }
      this.expectOp(')'); return ps;
    }
    ifStmt() {
      const line = this.next().line; this.expectOp('('); const c = this.expr(); this.expectOp(')');
      if (this.accept('op', ':')) {
        const then = this.altBody(['elseif', 'else', 'endif']); let els = null;
        if (this.isKw('elseif')) { els = this.altIf(); }
        else if (this.isKw('else')) { this.next(); if (this.isKw('if')) { els = this.altIf(); } else { this.expectOp(':'); els = this.altBody(['endif']); this.next(); this.semi(); } }
        else { this.next(); this.semi(); }
        return { k: 'if', cond: c, then: then, els: els, line: line };
      }
      const then = this.block(); let els = null;
      if (this.isKw('elseif')) { els = this.ifStmt(); }
      else if (this.isKw('else')) { this.next(); els = this.isKw('if') ? this.ifStmt() : this.block(); }
      return { k: 'if', cond: c, then: then, els: els, line: line };
    }
    altIf() {
      const line = this.next().line; this.expectOp('('); const c = this.expr(); this.expectOp(')'); this.expectOp(':');
      const then = this.altBody(['elseif', 'else', 'endif']); let els = null;
      if (this.isKw('elseif')) els = this.altIf();
      else if (this.isKw('else')) { this.next(); this.expectOp(':'); els = this.altBody(['endif']); this.next(); this.semi(); }
      else { this.next(); this.semi(); }
      return { k: 'if', cond: c, then: then, els: els, line: line };
    }

    expr(minPrec) {
      minPrec = minPrec || 0;
      let left = this.unary();
      for (;;) {
        const tok = this.peek();
        let op = null;
        if (tok.t === 'op' && BIN[tok.v]) op = tok.v;
        else if (tok.t === 'id' && BIN[String(tok.v).toLowerCase()]) op = String(tok.v).toLowerCase();
        if (!op) break;
        const pr = BIN[op];
        if (pr[0] < minPrec) break;
        this.next();
        if (op === '?') {
          let a = null; if (!this.isOp(':')) a = this.expr(6); this.expectOp(':'); const b = this.expr(pr[0]);
          left = { k: 'tern', c: left, a: a, b: b, line: tok.line }; continue;
        }
        if (pr[0] === 5) {
          if (!isLval(left)) throw new PFatal('syntax error, unexpected token "' + op + '" (po lewej stronie przypisania musi być zmienna)', tok.line, 'Parse error');
          if (op === '=' && this.isOp('&')) { this.next(); }
          const right = this.expr(pr[0]);
          left = { k: 'assign', op: op, l: left, r: right, line: tok.line }; continue;
        }
        const nextMin = pr[1] === 'R' ? pr[0] : pr[0] + 1;
        const right = this.expr(nextMin);
        left = { k: 'bin', op: op, a: left, b: right, line: tok.line };
      }
      return left;
    }
    unary() {
      const tok = this.peek();
      if (tok.t === 'op') {
        switch (tok.v) {
          case '!': this.next(); return { k: 'not', e: this.expr(20), line: tok.line };
          case '-': this.next(); return { k: 'neg', e: this.expr(22), line: tok.line };
          case '+': this.next(); return { k: 'pos', e: this.expr(22), line: tok.line };
          case '~': this.next(); return { k: 'bnot', e: this.expr(22), line: tok.line };
          case '@': this.next(); return { k: 'silence', e: this.expr(22), line: tok.line };
          case '&': this.next(); return this.unary();
          case '++': case '--': { this.next(); const e = this.unary(); if (!isLval(e)) this.fail('variable'); return { k: 'preinc', op: tok.v, e: e, line: tok.line }; }
          case '(': {
            const n1 = this.peek(1), n2 = this.peek(2);
            if (n1 && n1.t === 'id' && CASTS[String(n1.v).toLowerCase()] && n2 && n2.t === 'op' && n2.v === ')') { this.p += 3; return { k: 'cast', to: CASTS[String(n1.v).toLowerCase()], e: this.expr(22), line: tok.line }; }
          }
        }
      }
      if (tok.t === 'id') {
        const w = String(tok.v).toLowerCase();
        if (w === 'new') { this.next(); const cls = this.next(); let args = []; if (this.isOp('(')) args = this.args(); return this.postfix({ k: 'new', cls: cls.v, args: args, line: tok.line }); }
        if (w === 'print') { this.next(); return { k: 'print', e: this.expr(4), line: tok.line }; }
        if (w === 'clone') { this.next(); return this.unary(); }
        if (w === 'include' || w === 'require' || w === 'include_once' || w === 'require_once') { this.next(); return { k: 'include', kind: w, e: this.expr(4), line: tok.line }; }
      }
      return this.postfix(this.primary());
    }
    args() {
      this.expectOp('('); const a = [];
      while (!this.isOp(')')) {
        if (this.accept('op', '...')) { a.push({ k: 'spread', e: this.expr() }); }
        else if (this.peek().t === 'id' && this.peek(1).t === 'op' && this.peek(1).v === ':' && !(this.peek(2).t === 'op' && this.peek(2).v === ':')) { this.next(); this.next(); a.push(this.expr()); }
        else a.push(this.expr());
        if (!this.accept('op', ',')) break;
      }
      this.expectOp(')'); return a;
    }
    postfix(e) {
      for (;;) {
        const tok = this.peek();
        if (tok.t !== 'op') break;
        if (tok.v === '[') {
          this.next();
          if (this.isOp(']')) { this.next(); e = { k: 'idx', obj: e, key: null, line: tok.line }; continue; }
          const key = this.expr(); this.expectOp(']'); e = { k: 'idx', obj: e, key: key, line: tok.line }; continue;
        }
        if (tok.v === '{' && false) break;
        if (tok.v === '->' || tok.v === '?->') {
          this.next(); const nm = this.next();
          let name = nm.t === 'id' ? nm.v : nm.t === 'var' ? { k: 'var', name: nm.v } : null;
          if (name === null) this.fail('identifier');
          if (this.isOp('(')) { e = { k: 'mcall', obj: e, name: name, args: this.args(), line: tok.line, nullsafe: tok.v === '?->' }; continue; }
          e = { k: 'prop', obj: e, name: name, line: tok.line, nullsafe: tok.v === '?->' }; continue;
        }
        if (tok.v === '::') { this.next(); const nm = this.next(); if (this.isOp('(')) { e = { k: 'call', name: (e.name || '') + '::' + nm.v, args: this.args(), line: tok.line }; continue; } e = { k: 'const', name: (e.name || '') + '::' + nm.v, line: tok.line }; continue; }
        if (tok.v === '(' && (e.k === 'var' || e.k === 'closure' || e.k === 'idx')) { e = { k: 'dyncall', fn: e, args: this.args(), line: tok.line }; continue; }
        if (tok.v === '++' || tok.v === '--') { if (!isLval(e)) break; this.next(); e = { k: 'postinc', op: tok.v, e: e, line: tok.line }; continue; }
        break;
      }
      return e;
    }
    primary() {
      const tok = this.next();
      switch (tok.t) {
        case 'var': return { k: 'var', name: tok.v, line: tok.line };
        case 'num': return { k: 'lit', v: tok.v, line: tok.line };
        case 'str': return { k: 'lit', v: tok.v, line: tok.line };
        case 'tpl': return { k: 'tpl', parts: tok.parts, line: tok.line };
        case 'op':
          if (tok.v === '(') { const e = this.expr(); this.expectOp(')'); return e; }
          if (tok.v === '[') { return this.arrayLit(']', tok.line); }
          if (tok.v === '$' && this.isOp('{')) { this.next(); const e = this.expr(); this.expectOp('}'); return { k: 'varvar', e: e, line: tok.line }; }
          if (tok.v === '$' && this.is('var')) { const v = this.next(); return { k: 'varvar', e: { k: 'var', name: v.v }, line: tok.line }; }
          break;
        case 'id': {
          const w = String(tok.v).toLowerCase();
          if (w === 'true') return { k: 'lit', v: true };
          if (w === 'false') return { k: 'lit', v: false };
          if (w === 'null') return { k: 'lit', v: null };
          if (w === 'array' && this.isOp('(')) { this.next(); return this.arrayLit(')', tok.line); }
          if (w === 'list' && this.isOp('(')) { this.next(); return this.arrayLit(')', tok.line); }
          if (w === 'isset') { const a = this.args(); return { k: 'isset', args: a, line: tok.line }; }
          if (w === 'empty') { const a = this.args(); return { k: 'empty', e: a[0], line: tok.line }; }
          if (w === 'exit' || w === 'die') { let a = []; if (this.isOp('(')) a = this.args(); return { k: 'exit', e: a[0] || null, line: tok.line }; }
          if (w === 'function' || w === 'fn') {
            const params = this.params(); let uses = [];
            if (this.isKw('use')) { this.next(); this.expectOp('('); while (!this.isOp(')')) { this.accept('op', '&'); uses.push(this.next().v); if (!this.accept('op', ',')) break; } this.expectOp(')'); }
            if (this.accept('op', ':')) this.typeHint();
            if (w === 'fn') { this.expectOp('=>'); const e = this.expr(5); return { k: 'closure', params: params, body: { k: 'block', body: [{ k: 'return', e: e }] }, arrow: true, uses: uses, line: tok.line }; }
            return { k: 'closure', params: params, body: this.block(), uses: uses, line: tok.line };
          }
          if (w === 'match') {
            this.expectOp('('); const subj = this.expr(); this.expectOp(')'); this.expectOp('{'); const arms = [];
            while (!this.isOp('}')) { let conds = null; if (this.isKw('default')) this.next(); else { conds = [this.expr()]; while (this.accept('op', ',')) { if (this.isOp('=>')) break; conds.push(this.expr()); } } this.expectOp('=>'); arms.push({ conds: conds, e: this.expr() }); if (!this.accept('op', ',')) break; }
            this.expectOp('}'); return { k: 'match', subj: subj, arms: arms, line: tok.line };
          }
          if (this.isOp('(')) return { k: 'call', name: tok.v, args: this.args(), line: tok.line };
          return { k: 'const', name: tok.v, line: tok.line };
        }
        case 'html': this.p--; this.fail();
      }
      this.p--; this.fail();
    }
    arrayLit(end, line) {
      const items = [];
      while (!this.isOp(end)) {
        if (this.isOp(',')) { this.next(); items.push(null); continue; }
        if (this.accept('op', '...')) { items.push({ spread: this.expr() }); }
        else {
          this.accept('op', '&');
          const a = this.expr(); if (this.accept('op', '=>')) { this.accept('op', '&'); items.push({ key: a, val: this.expr() }); } else items.push({ key: null, val: a });
        }
        if (!this.accept('op', ',')) break;
      }
      this.expectOp(end); return { k: 'arr', items: items, line: line };
    }
  }
  function isLval(e) { return e && (e.k === 'var' || e.k === 'idx' || e.k === 'prop' || e.k === 'varvar' || (e.k === 'arr')); }

  /* ===================== interpreter ===================== */
  function Interp(opts) {
    this.files = opts.files || {};
    this.out = [];
    this.diag = [];
    this.globals = new Map();
    this.funcs = Object.create(null);
    this.consts = Object.create(null);
    this.env = opts.env || {};
    this.headers = [];
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 3000000;
    this.file = opts.entry || 'index.php';
    this.included = {};
    this.request = opts.request || {};
    this.written = opts.written || {};
    this.statics = new Map();
    this.silence = 0;
    const g = this.globals;
    const req = this.request;
    g.set('_GET', { v: toPArr(req.get || {}) });
    g.set('_POST', { v: toPArr(req.post || {}) });
    const reqA = toPArr(Object.assign({}, req.get || {}, req.post || {}));
    g.set('_REQUEST', { v: reqA });
    g.set('_COOKIE', { v: toPArr(req.cookies || {}) });
    g.set('_FILES', { v: toPArr(req.files || {}) });
    g.set('_SERVER', { v: toPArr({ REQUEST_METHOD: req.method || (req.post && Object.keys(req.post).length ? 'POST' : 'GET'), PHP_SELF: '/' + this.file, SCRIPT_NAME: '/' + this.file, REQUEST_URI: '/' + this.file + (req.query ? '?' + req.query : ''), QUERY_STRING: req.query || '', HTTP_HOST: 'localhost', SERVER_NAME: 'localhost', REMOTE_ADDR: '127.0.0.1', HTTP_USER_AGENT: (typeof navigator !== 'undefined' ? navigator.userAgent : 'MiniPHP') }) });
    this.session = opts.session || null; // obiekt trwały między żądaniami
    this.sessionStarted = false;
  }
  function toPArr(o) {
    if (o instanceof PArr) return o;
    const a = new PArr();
    Object.keys(o).forEach(function (k) {
      const v = o[k];
      // klucze "x[]" z formularzy
      const m = k.match(/^([^\[]+)\[(.*)\]$/);
      if (m) { let sub = a.get(m[1]); if (!(sub instanceof PArr)) { sub = new PArr(); a.set(m[1], sub); } (Array.isArray(v) ? v : [v]).forEach(function (x) { if (m[2] === '') sub.push(x); else sub.set(m[2], x); }); return; }
      a.set(k, Array.isArray(v) ? (v.length > 1 ? PArr.from(v) : v[v.length - 1]) : (v && typeof v === 'object' ? toPArr(v) : v));
    });
    return a;
  }

  const P = Interp.prototype;
  P.echo = function (s) { this.out.push(s); };
  P.warn = function (kind, msg, line) {
    if (this.silence) return;
    this.diag.push({ type: kind, msg: msg, line: line, file: this.file });
    this.out.push('<br />\n<b>' + kind + '</b>:  ' + String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + ' in <b>' + this.path() + '</b> on line <b>' + line + '</b><br />\n');
  };
  P.path = function () { return 'C:\\xampp\\htdocs\\egzamin\\' + this.file; };
  P.fatal = function (msg, line) { throw new PFatal(msg, line); };
  function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  P.typeName = function (v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return 'bool';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
    if (typeof v === 'string') return 'string';
    if (v instanceof PArr) return 'array';
    if (v instanceof PObj) return v.cls;
    if (v && v.__fn) return 'Closure';
    return 'object';
  };
  P.str = function (v, line) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'boolean') return v ? '1' : '';
    if (typeof v === 'number') return fmtFloat(v);
    if (v instanceof PArr) { this.warn('Warning', 'Array to string conversion', line); return 'Array'; }
    if (v instanceof PObj && v.cls === 'mysqli_sql_exception') return v.props.message;
    throw new PFatal('Uncaught Error: Object of class ' + this.typeName(v) + ' could not be converted to string', line);
  };
  P.bool = function (v) {
    if (v === null || v === undefined) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0 && !isNaN(v) ? true : (isNaN(v) ? true : false);
    if (typeof v === 'string') return !(v === '' || v === '0');
    if (v instanceof PArr) return v.size > 0;
    return true;
  };
  P.num = function (v, line, op) {
    if (typeof v === 'number') return v;
    if (v === null || v === undefined) return 0;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string') {
      if (isNumStr(v)) return Number(v.trim());
      const ln = leadNum(v);
      if (ln !== null) { this.warn('Warning', 'A non-numeric value encountered', line); return Number(ln.trim()); }
      if (op) throw new PFatal('Uncaught TypeError: Unsupported operand types: string ' + op + ' ' + 'int', line);
      return 0;
    }
    if (v instanceof PArr) { if (op) throw new PFatal('Uncaught TypeError: Unsupported operand types: array ' + op + ' int', line); return v.size ? 1 : 0; }
    return 1;
  };
  // PHP 8: arytmetyka na napisach nieliczbowych → TypeError (np. "" * 2)
  P.arith = function (v, line, op, other) {
    if (typeof v === 'string' && !isNumStr(v)) {
      const ln = leadNum(v);
      if (ln === null) throw new PFatal('Uncaught TypeError: Unsupported operand types: string ' + op + ' ' + this.typeName(other) + (v === '' ? ' (pusty napis – pole formularza nie zostało wypełnione?)' : ''), line);
      this.warn('Warning', 'A non-numeric value encountered', line); return Number(ln.trim());
    }
    if (v instanceof PArr) throw new PFatal('Uncaught TypeError: Unsupported operand types: array ' + op + ' ' + this.typeName(other), line);
    return this.num(v, line);
  };
  P.toInt = function (v) { const n = this.numLoose(v); return isFinite(n) ? Math.trunc(n) : 0; };
  P.numLoose = function (v) { if (typeof v === 'string') { const ln = leadNum(v); return ln === null ? 0 : Number(ln.trim()); } return this.num(v); };

  P.looseEq = function (a, b) {
    if (a === null || a === undefined) a = null; if (b === null || b === undefined) b = null;
    if (typeof a === 'boolean' || typeof b === 'boolean' || a === null || b === null) {
      if (a === null && typeof b === 'string') return b === '';
      if (b === null && typeof a === 'string') return a === '';
      if (a === null && b === null) return true;
      return this.bool(a) === this.bool(b);
    }
    if (typeof a === 'number' && typeof b === 'number') return a === b;
    if (typeof a === 'number' && typeof b === 'string') return isNumStr(b) ? a === Number(b.trim()) : fmtFloat(a) === b;
    if (typeof a === 'string' && typeof b === 'number') return this.looseEq(b, a);
    if (typeof a === 'string' && typeof b === 'string') { if (isNumStr(a) && isNumStr(b)) return Number(a.trim()) === Number(b.trim()); return a === b; }
    if (a instanceof PArr && b instanceof PArr) { if (a.size !== b.size) return false; for (const [k, v] of a.m) { if (!b.m.has(k) || !this.looseEq(v, b.m.get(k))) return false; } return true; }
    return a === b;
  };
  P.strictEq = function (a, b) {
    if (a === undefined) a = null; if (b === undefined) b = null;
    if (a instanceof PArr && b instanceof PArr) { if (a.size !== b.size) return false; const ka = a.keys(), kb = b.keys(); for (let i = 0; i < ka.length; i++) { if (ka[i] !== kb[i] || !this.strictEq(a.m.get(ka[i]), b.m.get(kb[i]))) return false; } return true; }
    return a === b;
  };
  P.cmp = function (a, b) {
    if (a === undefined) a = null; if (b === undefined) b = null;
    if (typeof a === 'string' && typeof b === 'string') {
      if (isNumStr(a) && isNumStr(b)) { const x = Number(a.trim()), y = Number(b.trim()); return x < y ? -1 : x > y ? 1 : 0; }
      return a < b ? -1 : a > b ? 1 : 0;
    }
    if (typeof a === 'boolean' || typeof b === 'boolean' || a === null || b === null) {
      if (a === null && typeof b === 'string') return b === '' ? 0 : -1;
      if (b === null && typeof a === 'string') return a === '' ? 0 : 1;
      const x = this.bool(a) ? 1 : 0, y = this.bool(b) ? 1 : 0; return x - y;
    }
    if (typeof a === 'number' && typeof b === 'string' && !isNumStr(b)) { const s = fmtFloat(a); return s < b ? -1 : s > b ? 1 : 0; }
    if (typeof b === 'number' && typeof a === 'string' && !isNumStr(a)) { const s = fmtFloat(b); return a < s ? -1 : a > s ? 1 : 0; }
    if (a instanceof PArr && b instanceof PArr) return a.size - b.size;
    const x = this.num(a), y = this.num(b); return x < y ? -1 : x > y ? 1 : 0;
  };

  /* ----- zmienne ----- */
  P.lookup = function (scope, name, create) {
    if (/^(_GET|_POST|_SERVER|_REQUEST|_SESSION|_COOKIE|_FILES|GLOBALS)$/.test(name)) {
      if (name === '_SESSION') {
        if (!this.globals.has('_SESSION')) { if (!create) return null; this.globals.set('_SESSION', { v: new PArr() }); }
      }
      if (name === 'GLOBALS') { const a = new PArr(); this.globals.forEach(function (c, k) { a.set(k, c.v); }); return { v: a }; }
      return this.globals.get(name);
    }
    let c = scope.get(name);
    if (!c && create) { c = { v: null }; scope.set(name, c); }
    return c || null;
  };
  P.getVar = function (scope, name, line) {
    if (name === 'this') return null;
    const c = this.lookup(scope, name, false);
    if (!c) { this.warn('Warning', 'Undefined variable $' + name, line); return null; }
    return c.v;
  };

  // referencja (komórka) dla l-wartości
  P.ref = function (scope, e, autoviv) {
    if (e.k === 'var') return this.lookup(scope, e.name, true);
    if (e.k === 'varvar') return this.lookup(scope, this.str(this.ev(scope, e.e)), true);
    if (e.k === 'idx') {
      const pc = this.ref(scope, e.obj, true);
      let arr = pc.v;
      if (arr === null || arr === undefined || arr === '') { arr = new PArr(); pc.v = arr; }
      if (typeof arr === 'string') throw new PFatal('Uncaught Error: Cannot use assign-op operators with string offsets', e.line);
      if (arr === false) { this.warn('Deprecated', 'Automatic conversion of false to array is deprecated', e.line); arr = new PArr(); pc.v = arr; }
      if (!(arr instanceof PArr)) {
        if (arr instanceof PObj) throw new PFatal('Uncaught Error: Cannot use object of type ' + arr.cls + ' as array', e.line);
        throw new PFatal('Uncaught Error: Cannot use a scalar value as an array', e.line);
      }
      const self = this;
      if (e.key === null) {
        return { get v() { return undefined; }, set v(x) { arr.push(x); } };
      }
      const k = this.keyOf(this.ev(scope, e.key), e.line);
      return { get v() { return arr.get(k); }, set v(x) { arr.set(k, x); } };
    }
    if (e.k === 'prop') {
      const obj = this.ev(scope, e.obj);
      const name = typeof e.name === 'string' ? e.name : this.str(this.ev(scope, e.name));
      if (!(obj instanceof PObj)) throw new PFatal('Uncaught Error: Attempt to assign property "' + name + '" on ' + this.typeName(obj), e.line);
      return { get v() { return obj.props[name]; }, set v(x) { obj.props[name] = x; } };
    }
    throw new PFatal('Cannot assign to this expression', e.line);
  };
  P.keyOf = function (k, line) {
    if (k === null || k === undefined) return '';
    if (typeof k === 'boolean') return k ? 1 : 0;
    if (typeof k === 'number') return Math.trunc(k);
    if (typeof k === 'string') return k;
    if (k instanceof PArr) throw new PFatal('Uncaught TypeError: Illegal offset type', line);
    return this.str(k, line);
  };
  function cp(v) { return v instanceof PArr ? v.copy() : v; }

  P.assignTo = function (scope, l, v, line) {
    if (l.k === 'arr') { // list() / [..] =
      const src = v;
      let pos = 0;
      l.items.forEach(function (it) {
        if (it === null) { pos++; return; }
        const key = it.key ? this.ev(scope, it.key) : pos++;
        const val = src instanceof PArr ? src.get(key) : null;
        this.assignTo(scope, it.val, cp(val === undefined ? null : val), line);
      }, this);
      return v;
    }
    const r = this.ref(scope, l, true); r.v = cp(v); return v;
  };

  /* ----- wykonanie ----- */
  P.tick = function (line) { if (++this.steps > this.maxSteps) throw new PFatal('Maximum execution time of 30 seconds exceeded (nieskończona pętla?)', line); };

  P.execBlock = function (scope, list) { for (let i = 0; i < list.length; i++) this.exec(scope, list[i]); };
  P.hoist = function (list) { list.forEach(function (s) { if (s.k === 'fndecl') this.declare(s); }, this); };
  P.declare = function (s) {
    const n = s.name.toLowerCase();
    if (this.funcs[n] || BUILTINS[n]) throw new PFatal('Cannot redeclare ' + s.name + '()' + (BUILTINS[n] ? ' (to nazwa wbudowanej funkcji PHP)' : ''), s.line);
    this.funcs[n] = { name: s.name, params: s.params, body: s.body };
  };
  P.exec = function (scope, s) {
    this.tick(s.line);
    switch (s.k) {
      case 'nop': return;
      case 'echo': for (let i = 0; i < s.args.length; i++) this.echo(this.str(this.ev(scope, s.args[i]), s.line)); return;
      case 'expr': this.ev(scope, s.e); return;
      case 'block': this.execBlock(scope, s.body); return;
      case 'if': if (this.bool(this.ev(scope, s.cond))) this.exec(scope, s.then); else if (s.els) this.exec(scope, s.els); return;
      case 'while':
        while (this.bool(this.ev(scope, s.cond))) {
          this.tick(s.line);
          try { this.exec(scope, s.body); } catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } break; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } continue; } throw x; }
        }
        return;
      case 'dowhile':
        do {
          this.tick(s.line);
          try { this.exec(scope, s.body); } catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } break; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } continue; } throw x; }
        } while (this.bool(this.ev(scope, s.cond)));
        return;
      case 'for': {
        s.init.forEach(function (e) { this.ev(scope, e); }, this);
        for (;;) {
          let ok = true; for (let i = 0; i < s.cond.length; i++) { const v = this.ev(scope, s.cond[i]); if (i === s.cond.length - 1) ok = this.bool(v); }
          if (!ok) break;
          this.tick(s.line);
          try { this.exec(scope, s.body); } catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } break; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } } else throw x; }
          s.step.forEach(function (e) { this.ev(scope, e); }, this);
        }
        return;
      }
      case 'foreach': {
        const subj = this.ev(scope, s.subj);
        if (!(subj instanceof PArr)) {
          if (subj instanceof PObj && subj.cls === 'mysqli_result') {
            let row;
            while ((row = this.fetch(subj, 'assoc')) !== null) {
              this.tick(s.line);
              this.assignTo(scope, s.val, row, s.line);
              try { this.exec(scope, s.body); } catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } break; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } continue; } throw x; }
            }
            return;
          }
          this.warn('Warning', 'foreach() argument must be of type array|object, ' + this.typeName(subj) + ' given', s.line); return;
        }
        const entries = s.byRef ? subj.entries() : subj.copy().entries();
        for (let i = 0; i < entries.length; i++) {
          this.tick(s.line);
          if (s.key) this.assignTo(scope, s.key, entries[i][0], s.line);
          if (s.byRef) {
            const k = entries[i][0]; const cell = { get v() { return subj.get(k); }, set v(x) { subj.set(k, x); } };
            if (s.val.k === 'var') scope.set(s.val.name, cell);
          } else this.assignTo(scope, s.val, entries[i][1], s.line);
          try { this.exec(scope, s.body); } catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } break; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } continue; } throw x; }
        }
        if (s.byRef && s.val.k === 'var') { const last = scope.get(s.val.name); if (last) scope.set(s.val.name, last); }
        return;
      }
      case 'switch': {
        const v = this.ev(scope, s.subj);
        let start = -1;
        for (let i = 0; i < s.cases.length; i++) if (s.cases[i].test && this.looseEq(v, this.ev(scope, s.cases[i].test))) { start = i; break; }
        if (start < 0) start = s.cases.findIndex(function (c) { return c.test === null; });
        if (start < 0) return;
        try { for (let i = start; i < s.cases.length; i++) this.execBlock(scope, s.cases[i].body); }
        catch (x) { if (x instanceof BreakSig) { if (x.n > 1) { x.n--; throw x; } return; } if (x instanceof ContinueSig) { if (x.n > 1) { x.n--; throw x; } return; } throw x; }
        return;
      }
      case 'break': throw new BreakSig(s.n);
      case 'continue': throw new ContinueSig(s.n);
      case 'return': throw new ReturnSig(s.e ? this.ev(scope, s.e) : null);
      case 'fndecl': if (!this.funcs[s.name.toLowerCase()] || this.funcs[s.name.toLowerCase()].body !== s.body) this.declare(s); return;
      case 'global': s.names.forEach(function (n) { let c = this.globals.get(n); if (!c) { c = { v: null }; this.globals.set(n, c); } scope.set(n, c); }, this); return;
      case 'static': s.items.forEach(function (it) { const key = (scope.__fn || '') + '::' + it.name; if (!this.statics.has(key)) this.statics.set(key, { v: it.init ? this.ev(scope, it.init) : null }); scope.set(it.name, this.statics.get(key)); }, this); return;
      case 'unset': s.args.forEach(function (a) {
        if (a.k === 'var') { scope.delete(a.name); if (a.name === '_SESSION') this.globals.delete('_SESSION'); }
        else if (a.k === 'idx') { const pc = this.lookupCell(scope, a.obj); if (pc && pc instanceof PArr) pc.del(this.keyOf(this.ev(scope, a.key))); }
      }, this); return;
      case 'try': {
        try { this.exec(scope, s.body); }
        catch (x) {
          if (x instanceof PThrow || (x instanceof PFatal && x.exObj)) {
            const obj = x.exObj || new PObj(x.cls, { message: x.message });
            const c = s.catches.find(function (c) { return c.types.some(function (t) { t = t.replace(/^\\/, ''); return t === obj.cls || t === 'Exception' || t === 'Throwable' || (t === 'Error' && /Error$/.test(obj.cls)); }); });
            if (!c) throw x;
            if (c.v) scope.set(c.v, { v: obj });
            this.exec(scope, c.body);
          } else throw x;
        } finally { if (s.fin) this.exec(scope, s.fin); }
        return;
      }
      case 'throw': { const o = this.ev(scope, s.e); const err = new PFatal('Uncaught ' + (o && o.cls) + ': ' + (o && o.props.message), s.line); err.exObj = o; throw err; }
      case 'const': this.consts[s.name] = this.ev(scope, s.e); return;
    }
    throw new PFatal('MiniPHP: nieznana instrukcja ' + s.k, s.line);
  };
  P.lookupCell = function (scope, e) {
    if (e.k === 'var') { const c = this.lookup(scope, e.name, false); return c ? c.v : null; }
    if (e.k === 'idx') { const p = this.lookupCell(scope, e.obj); return p instanceof PArr ? p.get(this.keyOf(this.ev(scope, e.key))) : null; }
    return this.ev(scope, e);
  };

  P.ev = function (scope, e) {
    switch (e.k) {
      case 'lit': return e.v;
      case 'tpl': { let s = ''; for (let i = 0; i < e.parts.length; i++) { const p = e.parts[i]; s += p.s !== undefined ? p.s : this.str(this.ev(scope, p.e), e.line); } return s; }
      case 'var': return this.getVar(scope, e.name, e.line);
      case 'varvar': return this.getVar(scope, this.str(this.ev(scope, e.e)), e.line);
      case 'arr': {
        const a = new PArr();
        e.items.forEach(function (it) {
          if (!it) return;
          if (it.spread) { const s = this.ev(scope, it.spread); if (s instanceof PArr) s.entries().forEach(function (kv) { if (typeof kv[0] === 'number') a.push(cp(kv[1])); else a.set(kv[0], cp(kv[1])); }); return; }
          const v = cp(this.ev(scope, it.val));
          if (it.key) a.set(this.keyOf(this.ev(scope, it.key), e.line), v); else a.push(v);
        }, this);
        return a;
      }
      case 'idx': {
        if (e.key === null) throw new PFatal('Cannot use [] for reading', e.line);
        const obj = this.ev(scope, e.obj);
        const k = this.ev(scope, e.key);
        return this.index(obj, k, e.line);
      }
      case 'prop': {
        const obj = this.ev(scope, e.obj);
        if (obj === null && e.nullsafe) return null;
        const name = typeof e.name === 'string' ? e.name : this.str(this.ev(scope, e.name));
        return this.getProp(obj, name, e.line);
      }
      case 'assign': return this.assign(scope, e);
      case 'preinc': case 'postinc': {
        const r = this.ref(scope, e.e, true); let old = r.v;
        if (old === undefined) { old = null; if (e.e.k === 'var') {} }
        let nv;
        if (old === null) nv = e.op === '++' ? 1 : null;
        else if (typeof old === 'string' && !isNumStr(old)) { nv = e.op === '++' ? strInc(old) : old; }
        else nv = this.num(old, e.line) + (e.op === '++' ? 1 : -1);
        r.v = nv; return e.k === 'preinc' ? nv : old;
      }
      case 'not': return !this.bool(this.ev(scope, e.e));
      case 'neg': { const v = this.ev(scope, e.e); return -this.arith(v, e.line, '*', 1); }
      case 'pos': return this.arith(this.ev(scope, e.e), e.line, '*', 1);
      case 'bnot': return ~this.toInt(this.ev(scope, e.e));
      case 'silence': { this.silence++; try { return this.ev(scope, e.e); } finally { this.silence--; } }
      case 'cast': {
        const v = this.ev(scope, e.e);
        switch (e.to) {
          case 'int': if (v instanceof PArr) return v.size ? 1 : 0; return this.toInt(v);
          case 'float': return this.numLoose(v);
          case 'string': return this.str(v, e.line);
          case 'bool': return this.bool(v);
          case 'array': if (v instanceof PArr) return v.copy(); if (v === null) return new PArr(); if (v instanceof PObj) return PArr.assoc(v.props); return PArr.from([v]);
          case 'object': { if (v instanceof PArr) { const o = new PObj('stdClass'); v.entries().forEach(function (kv) { o.props[kv[0]] = kv[1]; }); return o; } return v; }
        }
        return v;
      }
      case 'tern': {
        const c = this.ev(scope, e.c);
        if (e.a === null) return this.bool(c) ? c : this.ev(scope, e.b);
        return this.bool(c) ? this.ev(scope, e.a) : this.ev(scope, e.b);
      }
      case 'bin': return this.binop(scope, e);
      case 'isset': return e.args.every(function (a) { return this.isset(scope, a); }, this);
      case 'empty': { if (!this.isset(scope, e.e)) return true; this.silence++; try { return !this.bool(this.ev(scope, e.e)); } finally { this.silence--; } }
      case 'exit': { if (e.e) { const v = this.ev(scope, e.e); if (typeof v === 'string') this.echo(v); } throw new ExitSig(); }
      case 'print': this.echo(this.str(this.ev(scope, e.e), e.line)); return 1;
      case 'call': return this.call(scope, e);
      case 'dyncall': {
        const f = this.ev(scope, e.fn);
        const args = this.evalArgs(scope, e.args);
        if (f && f.__fn) return this.invoke(f.__fn, args, e.line, f.bound);
        if (typeof f === 'string') return this.callName(scope, f, args, e.line, e.args);
        throw new PFatal('Uncaught Error: Value not callable', e.line);
      }
      case 'closure': {
        const bound = new Map();
        if (e.arrow) { scope.forEach(function (c, k) { bound.set(k, { v: cp(c.v) }); }); }
        else e.uses.forEach(function (n) { const c = scope.get(n); bound.set(n, { v: c ? cp(c.v) : null }); });
        return { __fn: { name: '{closure}', params: e.params, body: e.body }, bound: bound };
      }
      case 'const': {
        const n = e.name; const u = n.toUpperCase();
        if (this.consts[n] !== undefined) return this.consts[n];
        if (CONSTS[u] !== undefined) return CONSTS[u];
        if (CONSTS[n] !== undefined) return CONSTS[n];
        throw new PFatal('Uncaught Error: Undefined constant "' + n + '"' + (/^[a-z]/.test(n) ? ' (brakuje $ przed nazwą zmiennej albo cudzysłowów wokół tekstu?)' : ''), e.line);
      }
      case 'new': {
        const args = this.evalArgs(scope, e.args); const cls = String(e.cls).replace(/^\\/, '');
        if (/^mysqli$/i.test(cls)) return this.mysqliConnect(args, e.line, true);
        if (/^(Exception|Error|InvalidArgumentException|RuntimeException)$/i.test(cls)) return new PObj(cls, { message: args[0] == null ? '' : this.str(args[0]), code: args[1] || 0 });
        if (/^stdClass$/i.test(cls)) return new PObj('stdClass');
        if (/^DateTime$/i.test(cls)) return new PObj('DateTime', { ts: args[0] ? this.strtotime(this.str(args[0])) : Math.floor(Date.now() / 1000) });
        throw new PFatal('Uncaught Error: Class "' + cls + '" not found', e.line);
      }
      case 'mcall': return this.mcall(scope, e);
      case 'include': return this.include(scope, this.str(this.ev(scope, e.e)), e.kind, e.line);
      case 'match': {
        const v = this.ev(scope, e.subj);
        for (let i = 0; i < e.arms.length; i++) { const a = e.arms[i]; if (!a.conds) continue; for (let j = 0; j < a.conds.length; j++) if (this.strictEq(v, this.ev(scope, a.conds[j]))) return this.ev(scope, a.e); }
        const d = e.arms.find(function (a) { return !a.conds; }); if (d) return this.ev(scope, d.e);
        throw new PFatal('Uncaught UnhandledMatchError: Unhandled match case ' + JSON.stringify(v), e.line);
      }
      case 'spread': return this.ev(scope, e.e);
    }
    throw new PFatal('MiniPHP: nieobsługiwane wyrażenie ' + e.k, e.line);
  };
  function strInc(s) {
    if (s === '') return '1';
    const a = s.split(''); let i = a.length - 1;
    while (i >= 0) {
      const c = a[i];
      if (c === 'z') { a[i] = 'a'; i--; } else if (c === 'Z') { a[i] = 'A'; i--; } else if (c === '9') { a[i] = '0'; i--; }
      else if (/[a-yA-Y0-8]/.test(c)) { a[i] = String.fromCharCode(c.charCodeAt(0) + 1); return a.join(''); }
      else return a.join('');
    }
    const f = s[0]; return (f === 'z' || f === 'Z' ? (f === 'z' ? 'a' : 'A') : '1') + a.join('');
  }
  P.index = function (obj, k, line) {
    if (obj instanceof PArr) {
      const key = this.keyOf(k, line);
      const v = obj.get(key);
      if (v === undefined) { this.warn('Warning', 'Undefined array key ' + (typeof PArr.normKey(key) === 'number' ? PArr.normKey(key) : '"' + key + '"'), line); return null; }
      return v;
    }
    if (typeof obj === 'string') {
      let i = this.toInt(k); if (i < 0) i += obj.length;
      if (i < 0 || i >= obj.length) { this.warn('Warning', 'Uninitialized string offset ' + this.toInt(k), line); return ''; }
      return obj[i];
    }
    if (obj === null || obj === undefined) { this.warn('Warning', 'Trying to access array offset on value of type null', line); return null; }
    if (typeof obj === 'boolean' || typeof obj === 'number') { this.warn('Warning', 'Trying to access array offset on value of type ' + this.typeName(obj), line); return null; }
    if (obj instanceof PObj) throw new PFatal('Uncaught Error: Cannot use object of type ' + obj.cls + ' as array' + (obj.cls === 'mysqli_result' ? ' (najpierw pobierz wiersz: $wiersz = mysqli_fetch_array($wynik))' : ''), line);
    return null;
  };
  P.isset = function (scope, a) {
    if (a.k === 'var') { const c = this.lookup(scope, a.name, false); return !!c && c.v !== null && c.v !== undefined; }
    if (a.k === 'idx') {
      if (!this.isset(scope, a.obj)) return false;
      this.silence++;
      try {
        const o = this.ev(scope, a.obj); const k = this.ev(scope, a.key);
        if (o instanceof PArr) { const v = o.get(this.keyOf(k)); return v !== undefined && v !== null; }
        if (typeof o === 'string') { const i = this.toInt(k); return i >= 0 && i < o.length && (typeof k === 'number' || isNumStr(String(k))); }
        return false;
      } finally { this.silence--; }
    }
    if (a.k === 'prop') { this.silence++; try { const o = this.ev(scope, a.obj); return o instanceof PObj && o.props[a.name] !== undefined && o.props[a.name] !== null; } catch (x) { return false; } finally { this.silence--; } }
    this.silence++; try { const v = this.ev(scope, a); return v !== null && v !== undefined; } finally { this.silence--; }
  };
  P.assign = function (scope, e) {
    if (e.op === '=') { const v = this.ev(scope, e.r); return this.assignTo(scope, e.l, v, e.line); }
    if (e.op === '??=') { if (this.isset(scope, e.l)) return this.ev(scope, e.l); return this.assignTo(scope, e.l, this.ev(scope, e.r), e.line); }
    const r = this.ref(scope, e.l, true);
    let cur = r.v; if (cur === undefined) { if (e.l.k === 'var') this.warn('Warning', 'Undefined variable $' + e.l.name, e.line); else if (e.l.k === 'idx') { } cur = null; }
    const rv = this.ev(scope, e.r);
    const v = this.arithOp(e.op.slice(0, -1), cur, rv, e.line);
    r.v = v; return v;
  };
  P.arithOp = function (op, a, b, line) {
    switch (op) {
      case '.': return this.str(a, line) + this.str(b, line);
      case '+':
        if (a instanceof PArr && b instanceof PArr) { const r = a.copy(); b.entries().forEach(function (kv) { if (!r.has(kv[0])) r.set(kv[0], cp(kv[1])); }); return r; }
        return this.arith(a, line, '+', b) + this.arith(b, line, '+', a);
      case '-': return this.arith(a, line, '-', b) - this.arith(b, line, '-', a);
      case '*': return this.arith(a, line, '*', b) * this.arith(b, line, '*', a);
      case '/': { const x = this.arith(a, line, '/', b), y = this.arith(b, line, '/', a); if (y === 0) throw new PFatal('Uncaught DivisionByZeroError: Division by zero', line); return x / y; }
      case '%': { const x = Math.trunc(this.arith(a, line, '%', b)), y = Math.trunc(this.arith(b, line, '%', a)); if (y === 0) throw new PFatal('Uncaught DivisionByZeroError: Modulo by zero', line); const r = x % y; return r === 0 ? 0 : r; }
      case '**': return Math.pow(this.arith(a, line, '**', b), this.arith(b, line, '**', a));
      case '<<': return this.toInt(a) << this.toInt(b);
      case '>>': return this.toInt(a) >> this.toInt(b);
      case '&': return this.toInt(a) & this.toInt(b);
      case '|': return this.toInt(a) | this.toInt(b);
      case '^': return this.toInt(a) ^ this.toInt(b);
    }
    throw new PFatal('op ' + op, line);
  };
  P.binop = function (scope, e) {
    const op = e.op;
    if (op === '&&' || op === 'and') return this.bool(this.ev(scope, e.a)) && this.bool(this.ev(scope, e.b));
    if (op === '||' || op === 'or') return this.bool(this.ev(scope, e.a)) || this.bool(this.ev(scope, e.b));
    if (op === 'xor') return this.bool(this.ev(scope, e.a)) !== this.bool(this.ev(scope, e.b));
    if (op === '??') { if (this.isset(scope, e.a)) { const v = this.ev(scope, e.a); if (v !== null && v !== undefined) return v; } return this.ev(scope, e.b); }
    const a = this.ev(scope, e.a), b = this.ev(scope, e.b);
    switch (op) {
      case '==': return this.looseEq(a, b);
      case '!=': case '<>': return !this.looseEq(a, b);
      case '===': return this.strictEq(a, b);
      case '!==': return !this.strictEq(a, b);
      case '<': return this.cmp(a, b) < 0;
      case '<=': return this.cmp(a, b) <= 0;
      case '>': return this.cmp(a, b) > 0;
      case '>=': return this.cmp(a, b) >= 0;
      case '<=>': { const c = this.cmp(a, b); return c < 0 ? -1 : c > 0 ? 1 : 0; }
      case 'instanceof': return a instanceof PObj && String(b && b.cls || e.b.name).toLowerCase() === a.cls.toLowerCase();
    }
    return this.arithOp(op, a, b, e.line);
  };
  P.evalArgs = function (scope, args) {
    const out = [];
    args.forEach(function (a) { if (a.k === 'spread') { const v = this.ev(scope, a.e); if (v instanceof PArr) v.values().forEach(function (x) { out.push(x); }); } else out.push(this.ev(scope, a)); }, this);
    return out;
  };
  P.call = function (scope, e) {
    const name = String(e.name).replace(/^\\/, '');
    const ln = name.toLowerCase();
    // funkcje z argumentami przez referencję
    if (REFARGS[ln]) {
      const refs = e.args.map(function (a, i) { return REFARGS[ln].indexOf(i) >= 0 && isLval(a) ? this.ref(scope, a, true) : null; }, this);
      const vals = e.args.map(function (a, i) { return refs[i] ? refs[i].v : this.ev(scope, a); }, this);
      return BUILTINS[ln].call(this, vals, e.line, refs);
    }
    if (ln === 'compact') { const a = new PArr(); this.evalArgs(scope, e.args).forEach(function (n) { const c = scope.get(n); if (c) a.set(n, cp(c.v)); }); return a; }
    if (ln === 'extract') { const arr = this.ev(scope, e.args[0]); if (arr instanceof PArr) arr.entries().forEach(function (kv) { scope.set(String(kv[0]), { v: cp(kv[1]) }); }); return arr instanceof PArr ? arr.size : 0; }
    if (ln === 'get_defined_vars') { const a = new PArr(); scope.forEach(function (c, k) { a.set(k, cp(c.v)); }); return a; }
    const args = this.evalArgs(scope, e.args);
    return this.callName(scope, name, args, e.line, e.args);
  };
  P.callName = function (scope, name, args, line) {
    const ln = String(name).toLowerCase();
    if (this.funcs[ln]) return this.invoke(this.funcs[ln], args, line);
    if (BUILTINS[ln]) return BUILTINS[ln].call(this, args, line);
    let hint = '';
    const near = Object.keys(BUILTINS).concat(Object.keys(this.funcs)).filter(function (f) { return lev(f, ln) <= 2; })[0];
    if (near) hint = ' (literówka? może ' + near + '())';
    if (/^mysql_/.test(ln)) hint = ' (stare mysql_* nie istnieje w PHP 8 – użyj mysqli_*)';
    throw new PFatal('Uncaught Error: Call to undefined function ' + name + '()' + hint, line);
  };
  P.invoke = function (fn, args, line, bound) {
    const sc = new Map(); sc.__fn = fn.name;
    if (bound) bound.forEach(function (c, k) { sc.set(k, { v: cp(c.v) }); });
    fn.params.forEach(function (p, i) {
      if (p.variadic) { sc.set(p.name, { v: PArr.from(args.slice(i)) }); return; }
      if (i < args.length) sc.set(p.name, { v: cp(args[i]) });
      else if (p.def) sc.set(p.name, { v: this.ev(sc, p.def) });
      else throw new PFatal('Uncaught ArgumentCountError: Too few arguments to function ' + fn.name + '(), ' + args.length + ' passed and at least ' + fn.params.filter(function (q) { return !q.def; }).length + ' expected', line);
    }, this);
    this.depth = (this.depth || 0) + 1;
    if (this.depth > 500) throw new PFatal('Maximum function nesting level reached (nieskończona rekurencja?)', line);
    try { this.execBlock(sc, fn.body.body); }
    catch (x) { if (x instanceof ReturnSig) return x.v; throw x; }
    finally { this.depth--; }
    return null;
  };
  P.include = function (scope, path, kind, line) {
    const name = path.replace(/^\.\//, '');
    if (/_once$/.test(kind) && this.included[name]) return true;
    if (this.files[name] === undefined) {
      if (/^require/.test(kind)) throw new PFatal('Uncaught Error: Failed opening required \'' + path + '\'', line);
      this.warn('Warning', 'include(' + path + '): Failed to open stream: No such file or directory', line); return false;
    }
    this.included[name] = true;
    const toks = lex(this.files[name], name);
    const ast = new Parser(toks, name).program();
    const prev = this.file; this.file = name;
    try { this.hoist(ast); this.execBlock(scope, ast); }
    catch (x) { if (x instanceof ReturnSig) return x.v; throw x; }
    finally { this.file = prev; }
    return 1;
  };

  /* ----- obiekty i mysqli ----- */
  P.getProp = function (obj, name, line) {
    if (obj instanceof PObj) {
      if (obj.cls === 'mysqli_result') { if (name === 'num_rows') return obj.res.rows.length; if (name === 'field_count') return obj.res.columns.length; if (name === 'current_field') return 0; }
      if (obj.cls === 'mysqli') { if (name === 'insert_id') return obj.insertId || 0; if (name === 'affected_rows') return obj.affected == null ? 0 : obj.affected; if (name === 'error') return obj.error || ''; if (name === 'errno') return obj.errno || 0; if (name === 'connect_error') return null; if (name === 'connect_errno') return 0; }
      if (obj.props[name] === undefined) { this.warn('Warning', 'Undefined property: ' + obj.cls + '::$' + name, line); return null; }
      return obj.props[name];
    }
    this.warn('Warning', 'Attempt to read property "' + name + '" on ' + this.typeName(obj), line);
    return null;
  };
  P.mcall = function (scope, e) {
    const obj = this.ev(scope, e.obj);
    if (obj === null && e.nullsafe) return null;
    const args = this.evalArgs(scope, e.args);
    const m = String(typeof e.name === 'string' ? e.name : this.str(this.ev(scope, e.name))).toLowerCase();
    if (!(obj instanceof PObj)) throw new PFatal('Uncaught Error: Call to a member function ' + m + '() on ' + this.typeName(obj) + (obj === false ? ' (zapytanie się nie wykonało?)' : obj === null ? ' (zmienna jest pusta – literówka w nazwie?)' : ''), e.line);
    if (obj.cls === 'mysqli') {
      const map = { query: 'mysqli_query', close: 'mysqli_close', real_escape_string: 'mysqli_real_escape_string', select_db: 'mysqli_select_db', set_charset: 'mysqli_set_charset', escape_string: 'mysqli_real_escape_string' };
      if (map[m]) return BUILTINS[map[m]].call(this, [obj].concat(args), e.line);
    }
    if (obj.cls === 'mysqli_result') {
      const map = { fetch_assoc: 'mysqli_fetch_assoc', fetch_array: 'mysqli_fetch_array', fetch_row: 'mysqli_fetch_row', fetch_all: 'mysqli_fetch_all', fetch_object: 'mysqli_fetch_object', free: 'mysqli_free_result', close: 'mysqli_free_result', data_seek: 'mysqli_data_seek' };
      if (map[m]) return BUILTINS[map[m]].call(this, [obj].concat(args), e.line);
    }
    if ((obj.cls === 'Exception' || obj.cls === 'mysqli_sql_exception' || /Error$/.test(obj.cls)) && m === 'getmessage') return obj.props.message;
    if (obj.cls === 'DateTime' && m === 'format') return BUILTINS.date.call(this, [args[0], obj.props.ts], e.line);
    throw new PFatal('Uncaught Error: Call to undefined method ' + obj.cls + '::' + m + '()', e.line);
  };
  P.mysqliConnect = function (args, line, oop) {
    const host = args[0] == null ? 'localhost' : this.str(args[0]); const user = args[1] == null ? 'root' : this.str(args[1]); const pass = args[2] == null ? '' : this.str(args[2]); const db = args[3] == null ? '' : this.str(args[3]);
    const ex = (msg) => { const o = new PObj('mysqli_sql_exception', { message: msg }); const f = new PFatal('Uncaught mysqli_sql_exception: ' + msg, line); f.exObj = o; return f; };
    if (!/^(localhost|127\.0\.0\.1|::1|p?:?localhost)$/i.test(host)) throw ex('php_network_getaddresses: getaddrinfo for ' + host + ' failed: Nieznany host. (serwer to localhost)');
    if (user !== 'root' || pass !== '') {
      const users = (this.env.users || []);
      if (!users.some(function (u) { return u.user === user && u.pass === pass; })) throw ex("Access denied for user '" + user + "'@'localhost' (using password: " + (pass ? 'YES' : 'NO') + ')' + (user === 'root' ? ' (na egzaminie: root bez hasła → "")' : ''));
    }
    const o = new PObj('mysqli'); o.closed = false; o.dbname = null;
    if (db) this.selectDb(o, db, line, ex);
    return o;
  };
  P.selectDb = function (o, db, line, ex) {
    const conn = this.env.db ? this.env.db(db) : null;
    if (!conn) { const msg = "Unknown database '" + db + "'"; if (ex) throw ex(msg); const f = new PFatal('Uncaught mysqli_sql_exception: ' + msg, line); f.exObj = new PObj('mysqli_sql_exception', { message: msg }); throw f; }
    o.dbname = db; o.conn = conn; return true;
  };
  P.needConn = function (c, fn, line) {
    if (!(c instanceof PObj) || c.cls !== 'mysqli') throw new PFatal('Uncaught TypeError: ' + fn + '(): Argument #1 ($mysql) must be of type mysqli, ' + this.typeName(c) + ' given' + (c === null ? ' (zmienna połączenia jest pusta – sprawdź nazwę zmiennej)' : ''), line);
    if (c.closed) throw new PFatal('Uncaught Error: mysqli object is already closed (połączenie zamknięte za wcześnie – mysqli_close daj na końcu)', line);
    return c;
  };
  P.needRes = function (r, fn, line) {
    if (!(r instanceof PObj) || r.cls !== 'mysqli_result') {
      let hint = '';
      if (r === true) hint = ' (to zapytanie nie jest SELECT – nie zwraca wierszy)';
      if (typeof r === 'string') hint = ' (przekazujesz tekst zapytania – najpierw $wynik = mysqli_query($polaczenie, $zapytanie))';
      if (r instanceof PObj && r.cls === 'mysqli') hint = ' (przekazujesz połączenie zamiast wyniku zapytania)';
      throw new PFatal('Uncaught TypeError: ' + fn + '(): Argument #1 ($result) must be of type mysqli_result, ' + this.typeName(r) + ' given' + hint, line);
    }
    return r;
  };
  P.fetch = function (r, mode) {
    const res = r.res; if (r.pos >= res.rows.length) return null;
    const row = res.rows[r.pos++];
    const a = new PArr();
    const dec = (r.conn && r.conn.decimals) || {};
    for (let i = 0; i < res.columns.length; i++) {
      let v = row[i];
      if (v !== null && v !== undefined) {
        const d = dec[String(res.columns[i]).toLowerCase()];
        if (typeof v === 'number' && d != null) v = v.toFixed(d);
        else v = typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)) : String(v);
      } else v = null;
      if (mode === 'num' || mode === 'both') a.set(i, v);
      if (mode === 'assoc' || mode === 'both') a.set(res.columns[i], v);
    }
    return a;
  };

  /* ----- czas ----- */
  P.now = function () { return this.env.now ? this.env.now() : new Date(); };
  P.strtotime = function (s, base) {
    s = String(s).trim().toLowerCase();
    const b = base != null ? new Date(base * 1000) : this.now();
    let d = new Date(b.getTime()); let m; let rest = s;
    const take = (re) => { const mm = rest.match(re); if (mm) rest = rest.slice(mm[0].length).trim(); return mm; };
    if (take(/^now\b/)) { }
    else if (take(/^today\b|^midnight\b/)) d = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    else if (take(/^tomorrow\b/)) d = new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1);
    else if (take(/^yesterday\b/)) d = new Date(b.getFullYear(), b.getMonth(), b.getDate() - 1);
    else if ((m = take(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ t](\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    else if ((m = take(/^(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) d = new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    else if ((m = take(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) d = new Date(+m[3], +m[1] - 1, +m[2]);
    else if ((m = take(/^@(-?\d+)/))) d = new Date(+m[1] * 1000);
    let guard = 0;
    while (rest && guard++ < 10) {
      if ((m = take(/^([+-]?\s*\d+)\s*(sec|second|min|minute|hour|day|week|fortnight|month|year)s?\b/))) {
        const n = +m[1].replace(/\s/g, ''); const u = m[2];
        if (u === 'sec' || u === 'second') d.setSeconds(d.getSeconds() + n); else if (u === 'min' || u === 'minute') d.setMinutes(d.getMinutes() + n); else if (u === 'hour') d.setHours(d.getHours() + n);
        else if (u === 'day') d.setDate(d.getDate() + n); else if (u === 'week') d.setDate(d.getDate() + 7 * n); else if (u === 'fortnight') d.setDate(d.getDate() + 14 * n); else if (u === 'month') d.setMonth(d.getMonth() + n); else d.setFullYear(d.getFullYear() + n);
        continue;
      }
      if ((m = take(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/))) { d.setHours(+m[1], +m[2], +(m[3] || 0)); continue; }
      if ((m = take(/^(next|last)\s+(day|week|month|year)\b/))) { const n = m[1] === 'next' ? 1 : -1; if (m[2] === 'day') d.setDate(d.getDate() + n); else if (m[2] === 'week') d.setDate(d.getDate() + 7 * n); else if (m[2] === 'month') d.setMonth(d.getMonth() + n); else d.setFullYear(d.getFullYear() + n); continue; }
      return false;
    }
    return Math.floor(d.getTime() / 1000);
  };

  /* ===================== funkcje wbudowane ===================== */
  const CONSTS = { PHP_EOL: '\n', PHP_VERSION: '8.2.12', M_PI: Math.PI, PHP_INT_MAX: 9007199254740991, MYSQLI_ASSOC: 1, MYSQLI_NUM: 2, MYSQLI_BOTH: 3, E_ALL: 32767, E_ERROR: 1, E_WARNING: 2, E_NOTICE: 8, MYSQLI_REPORT_OFF: 0, MYSQLI_REPORT_ERROR: 1, MYSQLI_REPORT_STRICT: 2, MYSQLI_REPORT_ALL: 255, SORT_REGULAR: 0, SORT_NUMERIC: 1, SORT_STRING: 2, ENT_QUOTES: 3, JSON_PRETTY_PRINT: 128, JSON_UNESCAPED_UNICODE: 256, FILE_APPEND: 8, PHP_ROUND_HALF_UP: 1, FILTER_VALIDATE_EMAIL: 274, FILTER_VALIDATE_INT: 257, FILTER_DEFAULT: 516, COUNT_RECURSIVE: 1, STR_PAD_RIGHT: 1, STR_PAD_LEFT: 0, STR_PAD_BOTH: 2, LC_ALL: 6, DIRECTORY_SEPARATOR: '\\' };
  const REFARGS = { sort: [0], rsort: [0], asort: [0], arsort: [0], ksort: [0], krsort: [0], usort: [0], uasort: [0], uksort: [0], shuffle: [0], array_push: [0], array_pop: [0], array_shift: [0], array_unshift: [0], array_splice: [0], settype: [0], preg_match: [2], preg_match_all: [2] };
  const DNI = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MIES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }
  function lev(a, b) { const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; } for (let j = 0; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function phpRound(x, p) { p = p || 0; const f = Math.pow(10, p); const v = x * f; const r = Math.round(Math.abs(v) + 1e-9) * Math.sign(v); return r / f; }
  function sortVals(self, arr, cmpFn, keepKeys, byKey, desc) {
    const ent = arr.entries();
    ent.sort(function (a, b) { const r = cmpFn(byKey ? a[0] : a[1], byKey ? b[0] : b[1]); return desc ? -r : r; });
    arr.m = new Map(); arr.next = 0;
    ent.forEach(function (kv) { if (keepKeys) arr.set(kv[0], kv[1]); else arr.push(kv[1]); });
  }
  function needArr(self, v, fn, n, line) { if (!(v instanceof PArr)) throw new PFatal('Uncaught TypeError: ' + fn + '(): Argument #' + (n || 1) + ' must be of type array, ' + self.typeName(v) + ' given', line); return v; }
  function sprintf(self, args, line) {
    const fmt = self.str(args[0]); let ai = 1;
    return fmt.replace(/%(?:(\d+)\$)?([-+ 0]|'.)*(\d+)?(?:\.(\d+))?([bcdeEfFgGosuxX%])/g, function (all, argn, flag, width, prec, conv) {
      if (conv === '%') return '%';
      const flags = (all.match(/^%(?:\d+\$)?((?:[-+ 0]|'.)*)/) || [])[1] || '';
      let v = args[argn ? +argn : ai++];
      let s;
      switch (conv) {
        case 'd': case 'u': s = String(self.toInt(v)); if (flags.indexOf('+') >= 0 && self.toInt(v) >= 0) s = '+' + s; break;
        case 'f': case 'F': s = self.numLoose(v).toFixed(prec == null ? 6 : +prec); if (flags.indexOf('+') >= 0 && self.numLoose(v) >= 0) s = '+' + s; break;
        case 'e': case 'E': s = self.numLoose(v).toExponential(prec == null ? 6 : +prec).replace('e', conv === 'E' ? 'E' : 'e'); break;
        case 'g': case 'G': s = String(parseFloat(self.numLoose(v).toPrecision(prec == null ? 6 : +prec))); break;
        case 's': s = self.str(v); if (prec != null) s = s.slice(0, +prec); break;
        case 'x': s = (self.toInt(v) >>> 0).toString(16); break; case 'X': s = (self.toInt(v) >>> 0).toString(16).toUpperCase(); break;
        case 'o': s = (self.toInt(v) >>> 0).toString(8); break; case 'b': s = (self.toInt(v) >>> 0).toString(2); break;
        case 'c': s = String.fromCharCode(self.toInt(v)); break;
      }
      if (width && s.length < +width) {
        let padc = ' '; const pm = flags.match(/'(.)/); if (pm) padc = pm[1]; else if (flags.indexOf('0') >= 0) padc = '0';
        if (flags.indexOf('-') >= 0) s = s + Array(+width - s.length + 1).join(padc === '0' ? ' ' : padc);
        else s = Array(+width - s.length + 1).join(padc) + s;
      }
      return s;
    });
  }
  function htmlsc(s, quotes) { s = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); if (quotes !== 0) s = s.replace(/'/g, '&#039;'); return s; }
  function phpDate(self, fmt, ts) {
    const d = ts == null ? self.now() : new Date(self.toInt(ts) * 1000);
    let out = '';
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt[i];
      if (c === '\\') { out += fmt[++i] || ''; continue; }
      switch (c) {
        case 'd': out += pad(d.getDate()); break; case 'j': out += d.getDate(); break;
        case 'D': out += DNI[d.getDay()].slice(0, 3); break; case 'l': out += DNI[d.getDay()]; break;
        case 'N': out += (d.getDay() || 7); break; case 'w': out += d.getDay(); break;
        case 'z': { const st = new Date(d.getFullYear(), 0, 1); out += Math.floor((d - st) / 864e5); break; }
        case 'm': out += pad(d.getMonth() + 1); break; case 'n': out += d.getMonth() + 1; break;
        case 'F': out += MIES[d.getMonth()]; break; case 'M': out += MIES[d.getMonth()].slice(0, 3); break;
        case 't': out += new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); break;
        case 'L': { const y = d.getFullYear(); out += ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 1 : 0; break; }
        case 'Y': out += d.getFullYear(); break; case 'y': out += String(d.getFullYear()).slice(2); break;
        case 'a': out += d.getHours() < 12 ? 'am' : 'pm'; break; case 'A': out += d.getHours() < 12 ? 'AM' : 'PM'; break;
        case 'G': out += d.getHours(); break; case 'H': out += pad(d.getHours()); break;
        case 'g': out += (d.getHours() % 12 || 12); break; case 'h': out += pad(d.getHours() % 12 || 12); break;
        case 'i': out += pad(d.getMinutes()); break; case 's': out += pad(d.getSeconds()); break;
        case 'U': out += Math.floor(d.getTime() / 1000); break;
        case 'S': { const n = d.getDate(); out += (n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th'; break; }
        default: out += c;
      }
    }
    return out;
  }
  function jsonEnc(self, v, flags) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return fmtFloat(v);
    if (typeof v === 'string') { let s = JSON.stringify(v); if (!(flags & 256)) s = s.replace(/[\u0080-\uffff]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }); return s.replace(/\//g, '\\/'); }
    if (v instanceof PArr) {
      const ks = v.keys(); const isList = ks.every(function (k, i) { return k === i; });
      if (isList) return '[' + v.values().map(function (x) { return jsonEnc(self, x, flags); }).join(',') + ']';
      return '{' + v.entries().map(function (kv) { return JSON.stringify(String(kv[0])) + ':' + jsonEnc(self, kv[1], flags); }).join(',') + '}';
    }
    if (v instanceof PObj) return '{' + Object.keys(v.props).map(function (k) { return JSON.stringify(k) + ':' + jsonEnc(self, v.props[k], flags); }).join(',') + '}';
    return 'null';
  }
  function fromJs(v, assoc) {
    if (v === null) return null;
    if (Array.isArray(v)) return PArr.from(v.map(function (x) { return fromJs(x, assoc); }));
    if (typeof v === 'object') { if (assoc) { const a = new PArr(); Object.keys(v).forEach(function (k) { a.set(k, fromJs(v[k], assoc)); }); return a; } const o = new PObj('stdClass'); Object.keys(v).forEach(function (k) { o.props[k] = fromJs(v[k], assoc); }); return o; }
    return v;
  }
  function dump(self, v, ind) {
    ind = ind || '';
    if (v === null || v === undefined) return 'NULL\n';
    if (typeof v === 'boolean') return 'bool(' + v + ')\n';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int(' + v + ')\n' : 'float(' + fmtFloat(v) + ')\n';
    if (typeof v === 'string') return 'string(' + new TextEncoder().encode(v).length + ') "' + v + '"\n';
    if (v instanceof PArr) { let s = 'array(' + v.size + ') {\n'; v.entries().forEach(function (kv) { s += ind + '  [' + (typeof kv[0] === 'number' ? kv[0] : '"' + kv[0] + '"') + ']=>\n' + ind + '  ' + dump(self, kv[1], ind + '  '); }); return s + ind + '}\n'; }
    if (v instanceof PObj) {
      if (v.cls === 'mysqli_result') return 'object(mysqli_result)#2 (5) {\n' + ind + '  ["current_field"]=>\n' + ind + '  int(0)\n' + ind + '  ["field_count"]=>\n' + ind + '  int(' + v.res.columns.length + ')\n' + ind + '  ["lengths"]=>\n' + ind + '  NULL\n' + ind + '  ["num_rows"]=>\n' + ind + '  int(' + v.res.rows.length + ')\n' + ind + '  ["type"]=>\n' + ind + '  int(0)\n' + ind + '}\n';
      let s = 'object(' + v.cls + ')#1 (' + Object.keys(v.props).length + ') {\n'; Object.keys(v.props).forEach(function (k) { s += ind + '  ["' + k + '"]=>\n' + ind + '  ' + dump(self, v.props[k], ind + '  '); }); return s + ind + '}\n';
    }
    return 'NULL\n';
  }
  function printR(self, v, ind) {
    ind = ind || '';
    if (v instanceof PArr) { let s = 'Array\n' + ind + '(\n'; v.entries().forEach(function (kv) { s += ind + '    [' + kv[0] + '] => ' + printR(self, kv[1], ind + '        ') + '\n'; }); return s + ind + ')\n'; }
    if (v instanceof PObj) { if (v.cls === 'mysqli_result') return 'mysqli_result Object\n' + ind + '(\n' + ind + '    [current_field] => 0\n' + ind + '    [field_count] => ' + v.res.columns.length + '\n' + ind + '    [lengths] => \n' + ind + '    [num_rows] => ' + v.res.rows.length + '\n' + ind + '    [type] => 0\n' + ind + ')\n'; let s = v.cls + ' Object\n' + ind + '(\n'; Object.keys(v.props).forEach(function (k) { s += ind + '    [' + k + '] => ' + printR(self, v.props[k], ind + '        ') + '\n'; }); return s + ind + ')\n'; }
    return self.str(v);
  }
  function exportV(self, v, ind) {
    ind = ind || '';
    if (v === null) return 'NULL'; if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return fmtFloat(v) + (Number.isInteger(v) ? '' : '');
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (v instanceof PArr) { let s = 'array (\n'; v.entries().forEach(function (kv) { s += ind + '  ' + (typeof kv[0] === 'number' ? kv[0] : "'" + kv[0] + "'") + ' => ' + (kv[1] instanceof PArr ? '\n' + ind + '  ' : '') + exportV(self, kv[1], ind + '  ') + ',\n'; }); return s + ind + ')'; }
    return 'NULL';
  }
  function cmpFnFor(self, flag) {
    if (flag === 2) return function (a, b) { a = self.str(a); b = self.str(b); return a < b ? -1 : a > b ? 1 : 0; };
    if (flag === 1) return function (a, b) { return self.numLoose(a) - self.numLoose(b); };
    return function (a, b) { return self.cmp(a, b); };
  }
  function userCmp(self, fn, line) { return function (a, b) { const r = fn.__fn ? self.invoke(fn.__fn, [a, b], line, fn.bound) : self.callName(null, self.str(fn), [a, b], line); return self.toInt(r); }; }
  function callFn(self, fn, args, line) { if (fn && fn.__fn) return self.invoke(fn.__fn, args, line, fn.bound); return self.callName(null, self.str(fn), args, line); }

  const BUILTINS = {
    // --- wyjście / zmienne ---
    var_dump: function (a) { a.forEach(function (v) { this.echo(dump(this, v)); }, this); return null; },
    print_r: function (a) { const s = printR(this, a[0]); if (a[1]) return s; this.echo(s); return true; },
    var_export: function (a) { const s = exportV(this, a[0]); if (a[1]) return s; this.echo(s); return null; },
    printf: function (a, l) { const s = sprintf(this, a, l); this.echo(s); return s.length; },
    sprintf: function (a, l) { return sprintf(this, a, l); },
    vsprintf: function (a, l) { return sprintf(this, [a[0]].concat(a[1] instanceof PArr ? a[1].values() : []), l); },
    number_format: function (a) {
      const n = this.numLoose(a[0]); const d = a[1] == null ? 0 : this.toInt(a[1]); const dp = a[2] == null ? '.' : this.str(a[2]); const ts = a[3] == null ? ',' : this.str(a[3]);
      const r = phpRound(n, d); const neg = r < 0; const parts = Math.abs(r).toFixed(d).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts);
      return (neg && r !== 0 ? '-' : '') + parts[0] + (d > 0 ? dp + parts[1] : '');
    },
    gettype: function (a) { const t = this.typeName(a[0]); return { int: 'integer', float: 'double', bool: 'boolean', 'null': 'NULL', string: 'string', array: 'array' }[t] || 'object'; },
    get_debug_type: function (a) { return this.typeName(a[0]); },
    settype: function (a, l, r) { const t = this.str(a[1]).toLowerCase(); let v = a[0]; if (/^int/.test(t)) v = this.toInt(v); else if (/^(float|double)/.test(t)) v = this.numLoose(v); else if (t === 'string') v = this.str(v); else if (/^bool/.test(t)) v = this.bool(v); if (r[0]) r[0].v = v; return true; },
    intval: function (a) { if (a[1] && this.toInt(a[1]) !== 10 && typeof a[0] === 'string') return parseInt(a[0], this.toInt(a[1])) || 0; return this.toInt(a[0]); },
    floatval: function (a) { return this.numLoose(a[0]); }, doubleval: function (a) { return this.numLoose(a[0]); },
    strval: function (a, l) { return this.str(a[0], l); }, boolval: function (a) { return this.bool(a[0]); },
    is_numeric: function (a) { return typeof a[0] === 'number' || (typeof a[0] === 'string' && isNumStr(a[0]) && !/\s$/.test(a[0]) || (typeof a[0] === 'string' && isNumStr(a[0]))); },
    is_int: function (a) { return typeof a[0] === 'number' && Number.isInteger(a[0]); }, is_integer: function (a) { return typeof a[0] === 'number' && Number.isInteger(a[0]); },
    is_float: function (a) { return typeof a[0] === 'number' && !Number.isInteger(a[0]); },
    is_string: function (a) { return typeof a[0] === 'string'; }, is_bool: function (a) { return typeof a[0] === 'boolean'; },
    is_array: function (a) { return a[0] instanceof PArr; }, is_null: function (a) { return a[0] === null || a[0] === undefined; },
    is_object: function (a) { return a[0] instanceof PObj; }, is_callable: function (a) { return !!(a[0] && a[0].__fn) || (typeof a[0] === 'string' && !!(BUILTINS[a[0].toLowerCase()] || this.funcs[a[0].toLowerCase()])); },
    function_exists: function (a) { const n = this.str(a[0]).toLowerCase(); return !!(BUILTINS[n] || this.funcs[n]); },
    define: function (a) { this.consts[this.str(a[0])] = a[1]; return true; },
    defined: function (a) { return this.consts[this.str(a[0])] !== undefined || CONSTS[this.str(a[0])] !== undefined; },
    constant: function (a, l) { const n = this.str(a[0]); if (this.consts[n] !== undefined) return this.consts[n]; if (CONSTS[n] !== undefined) return CONSTS[n]; throw new PFatal('Uncaught Error: Undefined constant "' + n + '"', l); },
    // --- napisy ---
    strlen: function (a) { return new TextEncoder().encode(this.str(a[0])).length; },
    mb_strlen: function (a) { return Array.from(this.str(a[0])).length; },
    strtoupper: function (a) { return this.str(a[0]).replace(/[a-z]+/g, function (s) { return s.toUpperCase(); }); },
    strtolower: function (a) { return this.str(a[0]).replace(/[A-Z]+/g, function (s) { return s.toLowerCase(); }); },
    mb_strtoupper: function (a) { return this.str(a[0]).toUpperCase(); }, mb_strtolower: function (a) { return this.str(a[0]).toLowerCase(); },
    mb_convert_case: function (a) { const s = this.str(a[0]); const m = this.toInt(a[1]); return m === 0 ? s.toUpperCase() : m === 1 ? s.toLowerCase() : s.replace(/(^|\s)(\S)/g, function (x, p, c) { return p + c.toUpperCase(); }); },
    ucfirst: function (a) { const s = this.str(a[0]); return s.charAt(0).replace(/[a-z]/, function (c) { return c.toUpperCase(); }) + s.slice(1); },
    lcfirst: function (a) { const s = this.str(a[0]); return s.charAt(0).toLowerCase() + s.slice(1); },
    ucwords: function (a) { return this.str(a[0]).replace(/(^|[\s\t\r\n\f\v])([a-z])/g, function (x, p, c) { return p + c.toUpperCase(); }); },
    trim: function (a) { const ch = a[1] == null ? ' \t\n\r\0\x0B' : this.str(a[1]); return trimChars(this.str(a[0]), ch, 3); },
    ltrim: function (a) { const ch = a[1] == null ? ' \t\n\r\0\x0B' : this.str(a[1]); return trimChars(this.str(a[0]), ch, 1); },
    rtrim: function (a) { const ch = a[1] == null ? ' \t\n\r\0\x0B' : this.str(a[1]); return trimChars(this.str(a[0]), ch, 2); },
    chop: function (a) { return trimChars(this.str(a[0]), a[1] == null ? ' \t\n\r\0\x0B' : this.str(a[1]), 2); },
    substr: function (a) { return bsub(this.str(a[0]), this.toInt(a[1]), a[2] == null ? null : this.toInt(a[2])); },
    mb_substr: function (a) { const s = Array.from(this.str(a[0])); let st = this.toInt(a[1]); if (st < 0) st = Math.max(0, s.length + st); let len = a[2] == null ? s.length : this.toInt(a[2]); if (len < 0) len = Math.max(0, s.length - st + len); return s.slice(st, st + len).join(''); },
    strpos: function (a) { const s = this.str(a[0]), n = this.str(a[1]); const i = s.indexOf(n, a[2] == null ? 0 : this.toInt(a[2])); return i < 0 ? false : i; },
    stripos: function (a) { const s = this.str(a[0]).toLowerCase(), n = this.str(a[1]).toLowerCase(); const i = s.indexOf(n, a[2] == null ? 0 : this.toInt(a[2])); return i < 0 ? false : i; },
    strrpos: function (a) { const s = this.str(a[0]), n = this.str(a[1]); const i = s.lastIndexOf(n); return i < 0 ? false : i; },
    mb_strpos: function (a) { const s = Array.from(this.str(a[0])).join(''), n = this.str(a[1]); const i = s.indexOf(n); return i < 0 ? false : Array.from(s.slice(0, i)).length; },
    strstr: function (a) { const s = this.str(a[0]), n = this.str(a[1]); const i = s.indexOf(n); if (i < 0) return false; return a[2] ? s.slice(0, i) : s.slice(i); },
    str_contains: function (a) { return this.str(a[0]).indexOf(this.str(a[1])) >= 0; },
    str_starts_with: function (a) { return this.str(a[0]).startsWith(this.str(a[1])); },
    str_ends_with: function (a) { return this.str(a[0]).endsWith(this.str(a[1])); },
    str_replace: function (a) { return strReplace(this, a[0], a[1], a[2], false); },
    str_ireplace: function (a) { return strReplace(this, a[0], a[1], a[2], true); },
    str_repeat: function (a) { return this.str(a[0]).repeat(Math.max(0, this.toInt(a[1]))); },
    str_pad: function (a) { const s = this.str(a[0]); const len = this.toInt(a[1]); const p = a[2] == null ? ' ' : this.str(a[2]); const t = a[3] == null ? 1 : this.toInt(a[3]); if (len <= s.length || !p) return s; const need = len - s.length; if (t === 0) return rep(p, need) + s; if (t === 2) { const l = Math.floor(need / 2); return rep(p, l) + s + rep(p, need - l); } return s + rep(p, need); },
    strrev: function (a) { return this.str(a[0]).split('').reverse().join(''); },
    str_split: function (a) { const s = this.str(a[0]); const n = a[1] == null ? 1 : this.toInt(a[1]); const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return PArr.from(out.length ? out : ['']); },
    mb_str_split: function (a) { const s = Array.from(this.str(a[0])); const n = a[1] == null ? 1 : this.toInt(a[1]); const out = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n).join('')); return PArr.from(out); },
    explode: function (a, l) { const sep = this.str(a[0]); if (sep === '') throw new PFatal('Uncaught ValueError: explode(): Argument #1 ($separator) cannot be empty', l); let parts = this.str(a[1]).split(sep); if (a[2] != null) { const lim = this.toInt(a[2]); if (lim > 0 && parts.length > lim) parts = parts.slice(0, lim - 1).concat([parts.slice(lim - 1).join(sep)]); else if (lim < 0) parts = parts.slice(0, lim); } return PArr.from(parts); },
    implode: function (a, l) { let sep = a[0], arr = a[1]; if (sep instanceof PArr) { const t = sep; sep = arr == null ? '' : arr; arr = t; } needArr(this, arr, 'implode', 2, l); const self = this; return arr.values().map(function (v) { return self.str(v, l); }).join(this.str(sep)); },
    join: function (a, l) { return BUILTINS.implode.call(this, a, l); },
    nl2br: function (a) { return this.str(a[0]).replace(/(\r\n|\n\r|\n|\r)/g, '<br />$1'); },
    htmlspecialchars: function (a) { return htmlsc(this.str(a[0]), a[1] === 0 ? 0 : 3); },
    htmlentities: function (a) { return htmlsc(this.str(a[0]), 3); },
    html_entity_decode: function (a) { return this.str(a[0]).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&'); },
    strip_tags: function (a) { return this.str(a[0]).replace(/<[^>]*>/g, ''); },
    addslashes: function (a) { return this.str(a[0]).replace(/([\\'"])/g, '\\$1').replace(/\0/g, '\\0'); },
    stripslashes: function (a) { return this.str(a[0]).replace(/\\(.)/g, '$1'); },
    wordwrap: function (a) { const s = this.str(a[0]), w = a[1] == null ? 75 : this.toInt(a[1]), br = a[2] == null ? '\n' : this.str(a[2]); const words = s.split(' '); const lines = []; let cur = ''; words.forEach(function (x) { if (cur && (cur + ' ' + x).length > w) { lines.push(cur); cur = x; } else cur = cur ? cur + ' ' + x : x; }); lines.push(cur); return lines.join(br); },
    strcmp: function (a) { const x = this.str(a[0]), y = this.str(a[1]); return x < y ? -1 : x > y ? 1 : 0; },
    strcasecmp: function (a) { const x = this.str(a[0]).toLowerCase(), y = this.str(a[1]).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; },
    strncmp: function (a) { const n = this.toInt(a[2]); const x = this.str(a[0]).slice(0, n), y = this.str(a[1]).slice(0, n); return x < y ? -1 : x > y ? 1 : 0; },
    substr_count: function (a) { const s = this.str(a[0]), n = this.str(a[1]); if (!n) return 0; return s.split(n).length - 1; },
    str_word_count: function (a) { const m = this.str(a[0]).match(/[A-Za-z'-]+/g); return m ? m.length : 0; },
    ord: function (a) { const b = new TextEncoder().encode(this.str(a[0])); return b.length ? b[0] : 0; },
    chr: function (a) { return String.fromCharCode(((this.toInt(a[0]) % 256) + 256) % 256); },
    lcg_value: function () { return Math.random(); },
    uniqid: function () { return Date.now().toString(16) + Math.floor(Math.random() * 1e5).toString(16); },
    md5: function (a) { return md5(unescape(encodeURIComponent(this.str(a[0])))); },
    password_hash: function (a) { return '$2y$10$' + md5('sol' + this.str(a[0])).slice(0, 22) + md5(this.str(a[0])).slice(0, 31); },
    password_verify: function (a) { return BUILTINS.password_hash.call(this, [a[0]]) === this.str(a[1]); },
    sha1: function (a) { return md5('sha1:' + this.str(a[0])) + md5(this.str(a[0])).slice(0, 8); },
    base64_encode: function (a) { try { return btoa(unescape(encodeURIComponent(this.str(a[0])))); } catch (e) { return ''; } },
    base64_decode: function (a) { try { return decodeURIComponent(escape(atob(this.str(a[0])))); } catch (e) { return false; } },
    urlencode: function (a) { return encodeURIComponent(this.str(a[0])).replace(/%20/g, '+'); },
    rawurlencode: function (a) { return encodeURIComponent(this.str(a[0])); },
    urldecode: function (a) { try { return decodeURIComponent(this.str(a[0]).replace(/\+/g, ' ')); } catch (e) { return this.str(a[0]); } },
    http_build_query: function (a) { const arr = a[0]; return arr instanceof PArr ? arr.entries().map(function (kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(String(kv[1])); }).join('&') : ''; },
    preg_match: function (a, l, r) { const re = phpRe(this.str(a[0]), l); const m = this.str(a[1]).match(re.global ? new RegExp(re.source, re.flags.replace('g', '')) : re); if (r && r[2]) r[2].v = m ? PArr.from(Array.from(m).map(function (x) { return x == null ? '' : x; })) : new PArr(); return m ? 1 : 0; },
    preg_match_all: function (a, l, r) { const re = phpRe(this.str(a[0]), l, true); const all = Array.from(this.str(a[1]).matchAll(re)); if (r && r[2]) { const out = new PArr(); const groups = all.length ? all[0].length : 1; for (let g = 0; g < groups; g++) out.push(PArr.from(all.map(function (m) { return m[g] == null ? '' : m[g]; }))); r[2].v = out; } return all.length; },
    preg_replace: function (a, l) { const re = phpRe(this.str(a[0]), l, true); return this.str(a[2]).replace(re, this.str(a[1]).replace(/\$(\d)|\\(\d)/g, '$$$1$2')); },
    preg_split: function (a, l) { const re = phpRe(this.str(a[0]), l, true); return PArr.from(this.str(a[1]).split(re)); },
    // --- liczby ---
    abs: function (a) { return Math.abs(this.numLoose(a[0])); },
    round: function (a) { return phpRound(this.numLoose(a[0]), a[1] == null ? 0 : this.toInt(a[1])); },
    floor: function (a) { return Math.floor(this.numLoose(a[0])); }, ceil: function (a) { return Math.ceil(this.numLoose(a[0])); },
    sqrt: function (a) { return Math.sqrt(this.numLoose(a[0])); }, pow: function (a) { return Math.pow(this.numLoose(a[0]), this.numLoose(a[1])); },
    exp: function (a) { return Math.exp(this.numLoose(a[0])); }, log: function (a) { return a[1] == null ? Math.log(this.numLoose(a[0])) : Math.log(this.numLoose(a[0])) / Math.log(this.numLoose(a[1])); },
    log10: function (a) { return Math.log10(this.numLoose(a[0])); }, sin: function (a) { return Math.sin(this.numLoose(a[0])); }, cos: function (a) { return Math.cos(this.numLoose(a[0])); }, tan: function (a) { return Math.tan(this.numLoose(a[0])); },
    pi: function () { return Math.PI; }, deg2rad: function (a) { return this.numLoose(a[0]) * Math.PI / 180; },
    intdiv: function (a, l) { const y = this.toInt(a[1]); if (y === 0) throw new PFatal('Uncaught DivisionByZeroError: Division by zero', l); return Math.trunc(this.toInt(a[0]) / y); },
    fmod: function (a) { return this.numLoose(a[0]) % this.numLoose(a[1]); },
    max: function (a, l) { let v = a.length === 1 && a[0] instanceof PArr ? a[0].values() : a; if (!v.length) throw new PFatal('Uncaught ValueError: max(): Argument #1 ($value) must contain at least one element', l); const self = this; return v.reduce(function (m, x) { return self.cmp(x, m) > 0 ? x : m; }); },
    min: function (a, l) { let v = a.length === 1 && a[0] instanceof PArr ? a[0].values() : a; if (!v.length) throw new PFatal('Uncaught ValueError: min(): Argument #1 ($value) must contain at least one element', l); const self = this; return v.reduce(function (m, x) { return self.cmp(x, m) < 0 ? x : m; }); },
    rand: function (a) { if (a.length >= 2) { const lo = this.toInt(a[0]), hi = this.toInt(a[1]); return lo + Math.floor(Math.random() * (hi - lo + 1)); } return Math.floor(Math.random() * 2147483648); },
    mt_rand: function (a) { return BUILTINS.rand.call(this, a); }, random_int: function (a) { return BUILTINS.rand.call(this, a); },
    mt_srand: function () { return null; }, srand: function () { return null; }, mt_getrandmax: function () { return 2147483647; }, getrandmax: function () { return 2147483647; },
    is_nan: function (a) { return isNaN(this.numLoose(a[0])); }, is_finite: function (a) { return isFinite(this.numLoose(a[0])); },
    decbin: function (a) { return (this.toInt(a[0]) >>> 0).toString(2); }, bindec: function (a) { return parseInt(this.str(a[0]).replace(/[^01]/g, '') || '0', 2); },
    dechex: function (a) { return (this.toInt(a[0]) >>> 0).toString(16); }, hexdec: function (a) { return parseInt(this.str(a[0]).replace(/[^0-9a-fA-F]/g, '') || '0', 16); },
    decoct: function (a) { return (this.toInt(a[0]) >>> 0).toString(8); }, octdec: function (a) { return parseInt(this.str(a[0]).replace(/[^0-7]/g, '') || '0', 8); },
    base_convert: function (a) { return parseInt(this.str(a[0]).toLowerCase(), this.toInt(a[1])).toString(this.toInt(a[2])); },
    // --- tablice ---
    count: function (a, l) { if (a[0] instanceof PObj && a[0].cls === 'mysqli_result') return a[0].res.rows.length; if (!(a[0] instanceof PArr)) throw new PFatal('Uncaught TypeError: count(): Argument #1 ($value) must be of type Countable|array, ' + this.typeName(a[0]) + ' given' + (a[0] instanceof PObj ? '' : ''), l); if (a[1]) { let n = 0; const rec = function (x) { x.values().forEach(function (v) { n++; if (v instanceof PArr) rec(v); }); }; rec(a[0]); return n; } return a[0].size; },
    sizeof: function (a, l) { return BUILTINS.count.call(this, a, l); },
    array_push: function (a, l, r) { const arr = r[0] ? (r[0].v instanceof PArr ? r[0].v : (r[0].v = new PArr())) : needArr(this, a[0], 'array_push', 1, l); for (let i = 1; i < a.length; i++) arr.push(cp(a[i])); return arr.size; },
    array_pop: function (a, l, r) { const arr = a[0]; if (!(arr instanceof PArr) || !arr.size) return null; const ks = arr.keys(); const k = ks[ks.length - 1]; const v = arr.get(k); arr.del(k); arr.next = 0; arr.keys().forEach(function (x) { if (typeof x === 'number' && x >= arr.next) arr.next = x + 1; }); return v; },
    array_shift: function (a) { const arr = a[0]; if (!(arr instanceof PArr) || !arr.size) return null; const ent = arr.entries(); const v = ent[0][1]; arr.m = new Map(); arr.next = 0; ent.slice(1).forEach(function (kv) { if (typeof kv[0] === 'number') arr.push(kv[1]); else arr.set(kv[0], kv[1]); }); return v; },
    array_unshift: function (a) { const arr = a[0]; const ent = arr.entries(); arr.m = new Map(); arr.next = 0; a.slice(1).forEach(function (v) { arr.push(v); }); ent.forEach(function (kv) { if (typeof kv[0] === 'number') arr.push(kv[1]); else arr.set(kv[0], kv[1]); }); return arr.size; },
    array_splice: function (a) { const arr = a[0]; const vals = arr.values(); let off = this.toInt(a[1]); const len = a[2] == null ? vals.length : this.toInt(a[2]); const repl = a[3] instanceof PArr ? a[3].values() : (a[3] == null ? [] : [a[3]]); const removed = vals.splice(off, len, ...repl); arr.m = new Map(); arr.next = 0; vals.forEach(function (v) { arr.push(v); }); return PArr.from(removed); },
    in_array: function (a, l) { const arr = needArr(this, a[1], 'in_array', 2, l); const self = this; return arr.values().some(function (v) { return a[2] ? self.strictEq(v, a[0]) : self.looseEq(v, a[0]); }); },
    array_search: function (a, l) { const arr = needArr(this, a[1], 'array_search', 2, l); for (const [k, v] of arr.m) if (a[2] ? this.strictEq(v, a[0]) : this.looseEq(v, a[0])) return k; return false; },
    array_keys: function (a, l) { return PArr.from(needArr(this, a[0], 'array_keys', 1, l).keys()); },
    array_values: function (a, l) { return PArr.from(needArr(this, a[0], 'array_values', 1, l).values().map(cp)); },
    array_key_exists: function (a) { return a[1] instanceof PArr && a[1].has(this.keyOf(a[0])); },
    key_exists: function (a) { return a[1] instanceof PArr && a[1].has(this.keyOf(a[0])); },
    array_key_first: function (a) { const k = a[0].keys(); return k.length ? k[0] : null; }, array_key_last: function (a) { const k = a[0].keys(); return k.length ? k[k.length - 1] : null; },
    array_merge: function (a) { const r = new PArr(); a.forEach(function (arr) { if (arr instanceof PArr) arr.entries().forEach(function (kv) { if (typeof kv[0] === 'number') r.push(cp(kv[1])); else r.set(kv[0], cp(kv[1])); }); }); return r; },
    array_combine: function (a) { const r = new PArr(); const k = a[0].values(), v = a[1].values(); k.forEach(function (x, i) { r.set(this.keyOf(x), v[i]); }, this); return r; },
    array_flip: function (a) { const r = new PArr(); a[0].entries().forEach(function (kv) { r.set(this.keyOf(kv[1]), kv[0]); }, this); return r; },
    array_reverse: function (a) { const ent = a[0].entries().reverse(); const r = new PArr(); ent.forEach(function (kv) { if (typeof kv[0] === 'number' && !a[1]) r.push(cp(kv[1])); else r.set(kv[0], cp(kv[1])); }); return r; },
    array_slice: function (a) { const ent = a[0].entries(); let off = this.toInt(a[1]); if (off < 0) off = Math.max(0, ent.length + off); let len = a[2] == null ? ent.length : this.toInt(a[2]); if (len < 0) len = Math.max(0, ent.length - off + len); const r = new PArr(); ent.slice(off, off + len).forEach(function (kv) { if (typeof kv[0] === 'number' && !a[3]) r.push(cp(kv[1])); else r.set(kv[0], cp(kv[1])); }); return r; },
    array_sum: function (a, l) { const self = this; return needArr(this, a[0], 'array_sum', 1, l).values().reduce(function (s, v) { return s + self.numLoose(v); }, 0); },
    array_product: function (a) { const self = this; return a[0].values().reduce(function (s, v) { return s * self.numLoose(v); }, 1); },
    array_unique: function (a) { const r = new PArr(); const seen = []; a[0].entries().forEach(function (kv) { const s = this.str(kv[1]); if (seen.indexOf(s) < 0) { seen.push(s); r.set(kv[0], kv[1]); } }, this); return r; },
    array_count_values: function (a) { const r = new PArr(); a[0].values().forEach(function (v) { const k = this.keyOf(v); r.set(k, (r.get(k) || 0) + 1); }, this); return r; },
    array_fill: function (a) { const r = new PArr(); const st = this.toInt(a[0]); for (let i = 0; i < this.toInt(a[1]); i++) r.set(st + i, cp(a[2])); return r; },
    array_fill_keys: function (a) { const r = new PArr(); a[0].values().forEach(function (k) { r.set(this.keyOf(k), cp(a[1])); }, this); return r; },
    array_column: function (a) { const r = new PArr(); a[0].values().forEach(function (row) { if (!(row instanceof PArr)) return; const v = a[1] == null ? row : row.get(this.keyOf(a[1])); if (v === undefined) return; if (a[2] != null) r.set(this.keyOf(row.get(this.keyOf(a[2]))), cp(v)); else r.push(cp(v)); }, this); return r; },
    array_map: function (a, l) { const fn = a[0]; const arrs = a.slice(1); const r = new PArr(); if (arrs.length === 1) { arrs[0].entries().forEach(function (kv) { const v = fn === null ? kv[1] : callFn(this, fn, [kv[1]], l); if (typeof kv[0] === 'string') r.set(kv[0], v); else r.set(kv[0], v); }, this); return r; } const n = Math.max.apply(null, arrs.map(function (x) { return x.size; })); for (let i = 0; i < n; i++) r.push(callFn(this, fn, arrs.map(function (x) { const v = x.values()[i]; return v === undefined ? null : v; }), l)); return r; },
    array_filter: function (a, l) { const r = new PArr(); a[0].entries().forEach(function (kv) { const keep = a[1] == null ? this.bool(kv[1]) : this.bool(callFn(this, a[1], [kv[1]], l)); if (keep) r.set(kv[0], kv[1]); }, this); return r; },
    array_walk: function (a, l) { a[0].entries().forEach(function (kv) { callFn(this, a[1], [kv[1], kv[0]], l); }, this); return true; },
    array_reduce: function (a, l) { let acc = a[2] === undefined ? null : a[2]; a[0].values().forEach(function (v) { acc = callFn(this, a[1], [acc, v], l); }, this); return acc; },
    array_rand: function (a) { const ks = a[0].keys(); const n = a[1] == null ? 1 : this.toInt(a[1]); if (n === 1) return ks[Math.floor(Math.random() * ks.length)]; const pick = ks.slice().sort(function () { return Math.random() - 0.5; }).slice(0, n); return PArr.from(ks.filter(function (k) { return pick.indexOf(k) >= 0; })); },
    shuffle: function (a) { const arr = a[0]; const vals = arr.values(); for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = vals[i]; vals[i] = vals[j]; vals[j] = t; } arr.m = new Map(); arr.next = 0; vals.forEach(function (v) { arr.push(v); }); return true; },
    range: function (a, l) {
      let st = a[0], en = a[1]; const step = a[2] == null ? 1 : Math.abs(this.numLoose(a[2])) || 1;
      if (typeof st === 'string' && typeof en === 'string' && st.length === 1 && en.length === 1 && !/\d/.test(st + en)) { const out = []; let x = st.charCodeAt(0), y = en.charCodeAt(0); if (x <= y) for (; x <= y; x += step) out.push(String.fromCharCode(x)); else for (; x >= y; x -= step) out.push(String.fromCharCode(x)); return PArr.from(out); }
      st = this.numLoose(st); en = this.numLoose(en); const out = []; if (st <= en) for (let x = st; x <= en + 1e-9; x += step) out.push(x); else for (let x = st; x >= en - 1e-9; x -= step) out.push(x);
      if (out.length > 1e6) throw new PFatal('range(): za duży zakres', l); return PArr.from(out);
    },
    sort: function (a, l, r) { sortVals(this, needArr(this, a[0], 'sort', 1, l), cmpFnFor(this, a[1] == null ? 0 : this.toInt(a[1])), false, false, false); return true; },
    rsort: function (a, l, r) { sortVals(this, needArr(this, a[0], 'rsort', 1, l), cmpFnFor(this, a[1] == null ? 0 : this.toInt(a[1])), false, false, true); return true; },
    asort: function (a, l) { sortVals(this, needArr(this, a[0], 'asort', 1, l), cmpFnFor(this, 0), true, false, false); return true; },
    arsort: function (a, l) { sortVals(this, needArr(this, a[0], 'arsort', 1, l), cmpFnFor(this, 0), true, false, true); return true; },
    ksort: function (a, l) { sortVals(this, needArr(this, a[0], 'ksort', 1, l), cmpFnFor(this, 0), true, true, false); return true; },
    krsort: function (a, l) { sortVals(this, needArr(this, a[0], 'krsort', 1, l), cmpFnFor(this, 0), true, true, true); return true; },
    usort: function (a, l) { sortVals(this, a[0], userCmp(this, a[1], l), false, false, false); return true; },
    uasort: function (a, l) { sortVals(this, a[0], userCmp(this, a[1], l), true, false, false); return true; },
    uksort: function (a, l) { sortVals(this, a[0], userCmp(this, a[1], l), true, true, false); return true; },
    array_is_list: function (a) { return a[0].keys().every(function (k, i) { return k === i; }); },
    current: function (a) { const v = a[0] instanceof PArr ? a[0].values()[0] : undefined; return v === undefined ? false : v; },
    reset: function (a) { return BUILTINS.current.call(this, a); },
    end: function (a) { const v = a[0] instanceof PArr ? a[0].values() : []; return v.length ? v[v.length - 1] : false; },
    // --- data i czas ---
    date: function (a) { return phpDate(this, this.str(a[0]), a[1]); },
    gmdate: function (a) { return phpDate(this, this.str(a[0]), a[1]); },
    time: function () { return Math.floor(this.now().getTime() / 1000); },
    mktime: function (a) { const n = this.now(); const v = function (i, d) { return a[i] == null ? d : this.toInt(a[i]); }.bind(this); return Math.floor(new Date(v(5, n.getFullYear()), v(3, n.getMonth() + 1) - 1, v(4, n.getDate()), v(0, n.getHours()), v(1, n.getMinutes()), v(2, n.getSeconds())).getTime() / 1000); },
    strtotime: function (a) { return this.strtotime(this.str(a[0]), a[1] == null ? null : this.toInt(a[1])); },
    checkdate: function (a) { const m = this.toInt(a[0]), d = this.toInt(a[1]), y = this.toInt(a[2]); if (m < 1 || m > 12 || d < 1) return false; return d <= new Date(y, m, 0).getDate(); },
    cal_days_in_month: function (a) { return new Date(this.toInt(a[2]), this.toInt(a[1]), 0).getDate(); },
    date_default_timezone_set: function () { return true; }, date_default_timezone_get: function () { return 'Europe/Warsaw'; },
    getdate: function (a) { const d = a[0] == null ? this.now() : new Date(this.toInt(a[0]) * 1000); return PArr.assoc({ seconds: d.getSeconds(), minutes: d.getMinutes(), hours: d.getHours(), mday: d.getDate(), wday: d.getDay(), mon: d.getMonth() + 1, year: d.getFullYear(), yday: 0, weekday: DNI[d.getDay()], month: MIES[d.getMonth()], 0: Math.floor(d.getTime() / 1000) }); },
    microtime: function (a) { const t = Date.now() / 1000; return a[0] ? t : (t % 1).toFixed(8) + ' ' + Math.floor(t); },
    hrtime: function () { return PArr.from([Math.floor(Date.now() / 1000), 0]); },
    sleep: function () { return 0; }, usleep: function () { return null; }, set_time_limit: function () { return true; },
    // --- HTTP / sesje / pliki ---
    header: function (a) { const h = this.str(a[0]); this.headers.push(h); return null; },
    http_response_code: function () { return 200; }, headers_sent: function () { return false; },
    setcookie: function (a) { (this.env.setCookie || function () { })(this.str(a[0]), a[1] == null ? '' : this.str(a[1]), a[2]); return true; },
    session_start: function (a, l) {
      if (this.sessionStarted) { this.warn('Notice', 'session_start(): Ignoring session_start() because a session is already active', l); return true; }
      this.sessionStarted = true;
      const store = this.env.session; // {data: PArr}
      const arr = store && store.data instanceof PArr ? store.data.copy() : new PArr();
      this.globals.set('_SESSION', { v: arr }); return true;
    },
    session_destroy: function () { if (this.env.session) this.env.session.data = new PArr(); this.sessionDestroyed = true; return true; },
    session_unset: function () { const c = this.globals.get('_SESSION'); if (c) c.v = new PArr(); return true; },
    session_id: function () { return 'mini' + (this.env.sessionId || '1a2b3c'); },
    session_regenerate_id: function () { return true; }, session_status: function () { return this.sessionStarted ? 2 : 1; },
    ob_start: function () { this.obStack = (this.obStack || []).concat([this.out.length]); return true; },
    ob_get_clean: function () { const st = (this.obStack || []).pop(); if (st == null) return false; const s = this.out.splice(st).join(''); return s; },
    ob_end_clean: function () { const st = (this.obStack || []).pop(); if (st != null) this.out.splice(st); return true; },
    ob_end_flush: function () { (this.obStack || []).pop(); return true; }, flush: function () { return null; },
    error_reporting: function () { return 32767; }, ini_set: function () { return false; }, ini_get: function () { return false; }, set_error_handler: function () { return null; },
    mysqli_report: function () { return true; },
    file_put_contents: function (a) { const n = this.str(a[0]); const v = a[1] instanceof PArr ? a[1].values().map(function (x) { return this.str(x); }, this).join('') : this.str(a[1]); const app = this.toInt(a[2]) & 8; this.written[n] = (app && this.written[n] != null ? this.written[n] : (app && this.files[n] != null ? this.files[n] : '')) + v; return new TextEncoder().encode(v).length; },
    file_get_contents: function (a, l) { const n = this.str(a[0]); if (this.written[n] != null) return this.written[n]; if (this.files[n] != null) return this.files[n]; this.warn('Warning', 'file_get_contents(' + n + '): Failed to open stream: No such file or directory', l); return false; },
    file_exists: function (a) { const n = this.str(a[0]); return this.written[n] != null || this.files[n] != null; },
    is_file: function (a) { return BUILTINS.file_exists.call(this, a); },
    file: function (a, l) { const s = BUILTINS.file_get_contents.call(this, a, l); if (s === false) return false; const lines = s.split(/(?<=\n)/); const fl = this.toInt(a[1]); return PArr.from(lines.filter(function (x) { return x !== ''; }).map(function (x) { return (fl & 2) ? x.replace(/\r?\n$/, '') : x; })); },
    unlink: function (a) { const n = this.str(a[0]); delete this.written[n]; return true; },
    fopen: function (a, l) { const n = this.str(a[0]); const m = this.str(a[1]); if (/^r/.test(m) && this.written[n] == null && this.files[n] == null) { this.warn('Warning', 'fopen(' + n + '): Failed to open stream: No such file or directory', l); return false; } if (/^w/.test(m)) this.written[n] = ''; if (/^a/.test(m) && this.written[n] == null) this.written[n] = this.files[n] != null ? this.files[n] : ''; const h = new PObj('resource'); h.file = n; h.mode = m; h.pos = 0; return h; },
    fwrite: function (a, l) { const h = a[0]; if (!(h instanceof PObj) || h.cls !== 'resource') throw new PFatal('Uncaught TypeError: fwrite(): Argument #1 ($stream) must be of type resource, ' + this.typeName(h) + ' given', l); const s = this.str(a[1]); this.written[h.file] = (this.written[h.file] || '') + s; return new TextEncoder().encode(s).length; },
    fputs: function (a, l) { return BUILTINS.fwrite.call(this, a, l); },
    fgets: function (a) { const h = a[0]; const s = this.written[h.file] != null ? this.written[h.file] : this.files[h.file] || ''; if (h.pos >= s.length) return false; let e = s.indexOf('\n', h.pos); e = e < 0 ? s.length : e + 1; const line = s.slice(h.pos, e); h.pos = e; return line; },
    feof: function (a) { const h = a[0]; const s = this.written[h.file] != null ? this.written[h.file] : this.files[h.file] || ''; return h.pos >= s.length; },
    fclose: function () { return true; },
    json_encode: function (a) { return jsonEnc(this, a[0], this.toInt(a[1])); },
    json_decode: function (a) { try { return fromJs(JSON.parse(this.str(a[0])), !!a[1]); } catch (e) { return null; } },
    filter_var: function (a) { const v = this.str(a[0]); const f = this.toInt(a[1]); if (f === 274) return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v) ? v : false; if (f === 257) return /^[+-]?\d+$/.test(v.trim()) ? parseInt(v, 10) : false; return v; },
    // --- mysqli ---
    mysqli_connect: function (a, l) { return this.mysqliConnect(a, l, false); },
    mysqli_select_db: function (a, l) { const c = this.needConn(a[0], 'mysqli_select_db', l); return this.selectDb(c, this.str(a[1]), l); },
    mysqli_set_charset: function (a, l) { this.needConn(a[0], 'mysqli_set_charset', l); return true; },
    mysqli_query: function (a, l) {
      if (typeof a[0] === 'string' && a[1] instanceof PObj) throw new PFatal('Uncaught TypeError: mysqli_query(): Argument #1 ($mysql) must be of type mysqli, string given (kolejność: mysqli_query($polaczenie, $zapytanie))', l);
      const c = this.needConn(a[0], 'mysqli_query', l);
      if (!c.conn) { const f = new PFatal('Uncaught mysqli_sql_exception: No database selected', l); f.exObj = new PObj('mysqli_sql_exception', { message: 'No database selected' }); throw f; }
      const sql = this.str(a[1], l);
      const list = TR.sql.split(sql);
      if (this.env.onQuery) this.env.onQuery(sql);
      if (list.length > 1) { const msg = "You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '" + list[1].slice(0, 40) + "' at line 1 (mysqli_query wykonuje jedno zapytanie)"; const f = new PFatal('Uncaught mysqli_sql_exception: ' + msg, l); f.exObj = new PObj('mysqli_sql_exception', { message: msg }); throw f; }
      if (!list.length) { const msg = 'Query was empty'; const f = new PFatal('Uncaught mysqli_sql_exception: ' + msg, l); f.exObj = new PObj('mysqli_sql_exception', { message: msg }); throw f; }
      const r = c.conn.run1(list[0]);
      if (r.kind === 'error') {
        const msg = String(r.error).replace(/^#\d+ - /, '');
        c.error = msg; c.errno = +((String(r.error).match(/^#(\d+)/) || [])[1] || 1064);
        const f = new PFatal('Uncaught mysqli_sql_exception: ' + msg, l); f.exObj = new PObj('mysqli_sql_exception', { message: msg }); throw f;
      }
      c.error = ''; c.errno = 0;
      if (r.kind === 'select') { const o = new PObj('mysqli_result'); o.res = { columns: r.columns, rows: r.rows }; o.pos = 0; o.conn = c.conn; return o; }
      c.affected = r.changes || 0;
      if (/^\s*INSERT/i.test(list[0])) { try { c.insertId = c.conn.db.exec('SELECT last_insert_rowid()')[0].values[0][0]; } catch (e) { } }
      return true;
    },
    mysqli_fetch_array: function (a, l) { const r = this.needRes(a[0], 'mysqli_fetch_array', l); const m = a[1] == null ? 3 : this.toInt(a[1]); return this.fetch(r, m === 1 ? 'assoc' : m === 2 ? 'num' : 'both'); },
    mysqli_fetch_assoc: function (a, l) { return this.fetch(this.needRes(a[0], 'mysqli_fetch_assoc', l), 'assoc'); },
    mysqli_fetch_row: function (a, l) { return this.fetch(this.needRes(a[0], 'mysqli_fetch_row', l), 'num'); },
    mysqli_fetch_object: function (a, l) { const r = this.fetch(this.needRes(a[0], 'mysqli_fetch_object', l), 'assoc'); if (r === null) return null; const o = new PObj('stdClass'); r.entries().forEach(function (kv) { o.props[kv[0]] = kv[1]; }); return o; },
    mysqli_fetch_all: function (a, l) { const r = this.needRes(a[0], 'mysqli_fetch_all', l); const m = a[1] == null ? 2 : this.toInt(a[1]); const out = new PArr(); let row; while ((row = this.fetch(r, m === 1 ? 'assoc' : m === 2 ? 'num' : 'both')) !== null) out.push(row); return out; },
    mysqli_num_rows: function (a, l) { return this.needRes(a[0], 'mysqli_num_rows', l).res.rows.length; },
    mysqli_num_fields: function (a, l) { return this.needRes(a[0], 'mysqli_num_fields', l).res.columns.length; },
    mysqli_field_count: function (a) { return 0; },
    mysqli_data_seek: function (a, l) { const r = this.needRes(a[0], 'mysqli_data_seek', l); r.pos = this.toInt(a[1]); return true; },
    mysqli_free_result: function () { return null; },
    mysqli_affected_rows: function (a, l) { const c = this.needConn(a[0], 'mysqli_affected_rows', l); return c.affected == null ? -1 : c.affected; },
    mysqli_insert_id: function (a, l) { const c = this.needConn(a[0], 'mysqli_insert_id', l); return c.insertId || 0; },
    mysqli_error: function (a, l) { const c = this.needConn(a[0], 'mysqli_error', l); return c.error || ''; },
    mysqli_errno: function (a, l) { const c = this.needConn(a[0], 'mysqli_errno', l); return c.errno || 0; },
    mysqli_connect_error: function () { return null; }, mysqli_connect_errno: function () { return 0; },
    mysqli_real_escape_string: function (a, l) { this.needConn(a[0], 'mysqli_real_escape_string', l); return this.str(a[1]).replace(/([\\'"])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\0/g, '\\0'); },
    mysqli_escape_string: function (a, l) { return BUILTINS.mysqli_real_escape_string.call(this, a, l); },
    mysqli_close: function (a, l) { const c = this.needConn(a[0], 'mysqli_close', l); c.closed = true; return true; },
    mysqli_ping: function () { return true; }
  };
  function trimChars(s, ch, side) {
    const set = ch.replace(/(.)\.\.(.)/g, function (_, a, b) { let r = ''; for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) r += String.fromCharCode(c); return r; });
    let a = 0, b = s.length;
    if (side & 1) while (a < b && set.indexOf(s[a]) >= 0) a++;
    if (side & 2) while (b > a && set.indexOf(s[b - 1]) >= 0) b--;
    return s.slice(a, b);
  }
  function bsub(s, st, len) {
    // substr na bajtach UTF-8 (jak PHP)
    const bytes = new TextEncoder().encode(s); const n = bytes.length;
    if (st < 0) st = Math.max(0, n + st); if (st > n) return '';
    let end = len == null ? n : (len < 0 ? n + len : st + len); if (end > n) end = n; if (end <= st) return '';
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(st, end)).replace(/\uFFFD/g, '?');
  }
  function rep(p, n) { let s = ''; while (s.length < n) s += p; return s.slice(0, n); }
  function strReplace(self, search, replace, subject, ci) {
    const doOne = function (s) {
      s = self.str(s);
      const srch = search instanceof PArr ? search.values() : [search];
      const repl = replace instanceof PArr ? replace.values() : null;
      srch.forEach(function (x, i) {
        x = self.str(x); if (!x) return;
        const r = repl ? (repl[i] == null ? '' : self.str(repl[i])) : self.str(replace);
        if (ci) s = s.replace(new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), function () { return r; }); else s = s.split(x).join(r);
      });
      return s;
    };
    if (subject instanceof PArr) { const out = new PArr(); subject.entries().forEach(function (kv) { out.set(kv[0], doOne(kv[1])); }); return out; }
    return doOne(subject);
  }
  function phpRe(p, line, global) {
    const d = p[0]; const end = p.lastIndexOf(d === '(' ? ')' : d === '{' ? '}' : d);
    if (end <= 0) throw new PFatal('preg: zły wzorzec ' + p, line);
    const body = p.slice(1, end); const fl = p.slice(end + 1).replace(/[^imsux]/g, '').replace('x', '');
    return new RegExp(body, (global ? 'g' : '') + fl.replace('u', '') + 'u');
  }
  // md5 (kompaktowa implementacja)
  function md5(s) {
    function rh(n) { let s = '', j; for (j = 0; j < 4; j++) s += ('0' + ((n >> (j * 8)) & 255).toString(16)).slice(-2); return s; }
    function ad(x, y) { const l = (x & 0xFFFF) + (y & 0xFFFF); return (((x >> 16) + (y >> 16) + (l >> 16)) << 16) | (l & 0xFFFF); }
    function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
    function cm(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
    const n = ((s.length + 8) >> 6) + 1; const x = new Array(n * 16).fill(0);
    let i; for (i = 0; i < s.length; i++) x[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
    x[i >> 2] |= 0x80 << ((i % 4) * 8); x[n * 16 - 2] = s.length * 8;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (i = 0; i < x.length; i += 16) {
      const oa = a, ob = b, oc = c, od = d;
      a = ff(a, b, c, d, x[i], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i], 20, -373897302);
      a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = ii(a, b, c, d, x[i], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = ad(a, oa); b = ad(b, ob); c = ad(c, oc); d = ad(d, od);
    }
    return rh(a) + rh(b) + rh(c) + rh(d);
  }

  /* ===================== API ===================== */
  // opts: {files, entry, request:{get,post,method,query}, env:{db(name)->Conn, session:{data}, now(), users:[{user,pass}]}, written:{}}
  function run(opts) {
    const it = new Interp(opts);
    const res = { html: '', diag: it.diag, headers: it.headers, written: it.written, fatal: null, queries: [] };
    const src = opts.files[opts.entry];
    if (src == null) { res.fatal = { kind: 'Fatal error', msg: 'Nie ma pliku ' + opts.entry, line: 0 }; res.html = '<h1>Not Found</h1><p>The requested URL was not found on this server.</p>'; res.notFound = true; return res; }
    try {
      const ast = new Parser(lex(src, opts.entry), opts.entry).program();
      it.hoist(ast);
      it.execBlock(it.globals, ast);
    } catch (x) {
      if (x instanceof ExitSig) { }
      else if (x instanceof PFatal) {
        res.fatal = { kind: x.kind, msg: x.message, line: x.line, file: it.file };
        if (x.kind === 'Parse error') it.out = [];
        it.out.push('<br />\n<b>' + x.kind + '</b>:  ' + escHtml(x.message) + ' in <b>' + it.path() + (x.kind === 'Parse error' ? '</b> on line <b>' + x.line + '</b>' : ':' + x.line + '\nStack trace:\n#0 {main}\n  thrown</b> in <b>' + it.path() + '</b> on line <b>' + x.line + '</b>') + '<br />\n');
      } else if (x instanceof BreakSig || x instanceof ContinueSig) {
        res.fatal = { kind: 'Fatal error', msg: "'break' not in the 'loop' or 'switch' context", line: 0 };
      } else if (x instanceof ReturnSig) { }
      else { res.fatal = { kind: 'Fatal error', msg: 'MiniPHP: błąd wewnętrzny – ' + x.message, line: 0 }; if (typeof console !== 'undefined') console.error(x); }
    }
    // zapis sesji
    if (it.sessionStarted && opts.env && opts.env.session && !it.sessionDestroyed) { const c = it.globals.get('_SESSION'); opts.env.session.data = c && c.v instanceof PArr ? c.v.copy() : new PArr(); }
    res.html = it.out.join('');
    res.steps = it.steps;
    const loc = it.headers.map(function (h) { const m = h.match(/^\s*Location\s*:\s*(.+)$/i); return m ? m[1].trim() : null; }).filter(Boolean).pop();
    if (loc) res.location = loc;
    const ref = it.headers.map(function (h) { const m = h.match(/^\s*Refresh\s*:\s*(\d+)/i); return m ? +m[1] : null; }).filter(function (x) { return x != null; }).pop();
    if (ref != null) res.refresh = ref;
    return res;
  }
  // tylko sprawdzenie składni
  function lint(src, name) {
    try { new Parser(lex(src, name || 'index.php'), name).program(); return null; }
    catch (x) { if (x instanceof PFatal) return { kind: x.kind, msg: x.message, line: x.line }; return { kind: 'Error', msg: x.message, line: 0 }; }
  }
  TR.php = { run: run, lint: lint, PArr: PArr, fmtFloat: fmtFloat, _lex: lex, _Parser: Parser };
})(typeof window !== 'undefined' ? window : globalThis);
