// Tiny DOM helpers (no framework).

// Let element.append() accept nested arrays and skip null/false — the views
// build children with map() and conditionals.
if (typeof Element !== 'undefined' && !Element.prototype.__dslabAppend) {
  const nativeAppend = Element.prototype.append;
  Element.prototype.append = function (...kids) {
    nativeAppend.apply(
      this,
      kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false),
    );
  };
  Element.prototype.__dslabAppend = true;
}
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  setAttrs(el, attrs);
  append(el, kids);
  return el;
}

const SVGNS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  setAttrs(el, attrs);
  append(el, kids);
  return el;
}

function setAttrs(el, attrs) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
}

function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function inline(t) {
  let x = esc(t);
  x = x.replace(/`([^`]+)`/g, '<code>$1</code>');
  x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  x = x.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return x;
}

/** Minimal markdown: paragraphs, bullet/numbered lists, tables, code fences, inline code/bold/italic. */
export function md(text, cls = 'prose') {
  const div = document.createElement('div');
  div.className = cls;
  const lines = String(text || '').split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre class="code">${esc(buf.join('\n'))}</pre>`;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      html += '<table><thead><tr>' + cells[0].map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' + cells.slice(1).map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
      continue;
    }
    if (/^\s*[-•] /.test(line)) {
      html += '<ul>';
      while (i < lines.length && /^\s*[-•] /.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*[-•] /, ''))}</li>`;
      html += '</ul>';
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      html += '<ol>';
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*\d+\. /, ''))}</li>`;
      html += '</ol>';
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|\||\s*[-•] |\s*\d+\. )/.test(lines[i])) buf.push(lines[i++]);
    html += `<p>${inline(buf.join(' '))}</p>`;
  }
  div.innerHTML = html;
  return div;
}

export function toast(msg, ms = 2200) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 100);
}

export function pill(text, cls = '') {
  return h('span', { class: `pill ${cls}` }, text);
}

export function refPill(ref) {
  if (!ref) return null;
  const supp = /supplementary/i.test(ref);
  return pill(ref, supp ? 'supp' : 'ref');
}
