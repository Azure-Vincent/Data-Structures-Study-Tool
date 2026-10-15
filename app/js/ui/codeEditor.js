// Small code editor: a transparent <textarea> over a syntax-highlighted <pre>,
// with a line-number gutter, current-line / error-line marks and pseudocode
// auto-indentation. The textarea stays the real input, so native undo/redo,
// selection, copy/paste and screen readers keep working.
// The editor has no scrollbars: it grows with its text and wraps long lines (the
// <pre> and the textarea wrap identically; each gutter row takes its line's height).
import { h } from './dom.js';
import { highlightLine, nextIndent, reindent } from '../lab/lang.js';

const LINE_H = 21; // px — must match .code-editor line-height (a line that wraps is taller)
const CLOSER = /^\s*(end\b|endif\b|endwhile\b|endfor\b|endfunction\b|else\b|elif\b|elseif\b|until\b)/i;

const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

/**
 * opts: { value, label, onChange(value), onRun() }
 * returns { el, textarea, getValue, setValue, setMarks({active, activeKind, error, warn:[lines]}), revealLine, focus }
 */
export function createCodeEditor(opts = {}) {
  const ta = h('textarea', { class: 'ce-input', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'soft', 'aria-label': opts.label || 'Pseudocode editor', 'aria-multiline': 'true' });
  ta.value = opts.value || '';
  const code = h('code', { class: 'ce-code' });
  const pre = h('pre', { class: 'ce-hl', 'aria-hidden': 'true' }, code);
  const nums = h('div', { class: 'ce-nums' });
  const gutter = h('div', { class: 'ce-gutter', 'aria-hidden': 'true' }, nums);
  const body = h('div', { class: 'ce-body' }, pre, ta);
  const el = h('div', { class: 'code-editor' }, gutter, body);
  let marks = { active: null, activeKind: null, error: null, warn: [] };
  let escaped = false;

  function render() {
    const lines = ta.value.split('\n');
    const warn = new Set(marks.warn || []);
    let html = '';
    let g = '';
    lines.forEach((text, i) => {
      const n = i + 1;
      const cls = ['ce-line'];
      if (n === marks.active) cls.push('cur', marks.activeKind === 'error' ? 'cur-err' : '');
      if (n === marks.error) cls.push('err');
      else if (warn.has(n)) cls.push('warn');
      const spans = highlightLine(text)
        .map((s) => (s.cls ? `<span class="${s.cls}">${esc(s.text)}</span>` : esc(s.text)))
        .join('');
      html += `<span class="${cls.join(' ')}">${spans || ' '}</span>`;
      const mark = n === marks.error ? '<i class="ce-mk err" title="error">●</i>' : n === marks.active ? '<i class="ce-mk cur">▶</i>' : warn.has(n) ? '<i class="ce-mk warn">▲</i>' : '';
      g += `<div class="ce-ln${n === marks.active ? ' cur' : ''}${n === marks.error ? ' err' : ''}">${mark}${n}</div>`;
    });
    code.innerHTML = html;
    nums.innerHTML = g;
    fitGutter();
    sync();
  }
  // a wrapped line is several rows tall: give its line number the same height
  function fitGutter() {
    const rows = code.children;
    const ln = nums.children;
    for (let i = 0; i < rows.length && i < ln.length; i++) {
      const tall = rows[i].offsetHeight;
      ln[i].style.height = tall > LINE_H ? `${tall}px` : '';
    }
  }
  function sync() {
    pre.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    nums.style.transform = `translateY(${-ta.scrollTop}px)`;
  }

  function insert(text) {
    ta.focus();
    // execCommand keeps the browser's undo stack; fall back for engines without it
    let ok = false;
    try {
      ok = document.execCommand('insertText', false, text);
    } catch {
      ok = false;
    }
    if (!ok) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function selectedLineRange() {
    const v = ta.value;
    const s = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let e = v.indexOf('\n', Math.max(ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && v[ta.selectionEnd - 1] === '\n' ? 1 : 0), ta.selectionStart));
    if (e < 0) e = v.length;
    return [s, e];
  }

  function shiftLines(dir) {
    const [s, e] = selectedLineRange();
    const block = ta.value.slice(s, e);
    const out = block
      .split('\n')
      .map((l) => (dir > 0 ? '  ' + l : l.replace(/^ {1,2}|^\t/, '')))
      .join('\n');
    ta.setSelectionRange(s, e);
    insert(out);
    ta.setSelectionRange(s, s + out.length);
  }

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      escaped = true;
      return;
    }
    if (e.key === 'Tab' && escaped) {
      escaped = false;
      return; // let focus move on
    }
    escaped = false;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      opts.onRun && opts.onRun();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) shiftLines(-1);
      else if (ta.value.slice(ta.selectionStart, ta.selectionEnd).includes('\n')) shiftLines(1);
      else insert('  ');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const v = ta.value;
      const lineStart = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
      let line = v.slice(lineStart, ta.selectionStart);
      // a line that closes a block (end/else/until…) snaps to its proper indentation
      if (CLOSER.test(line)) {
        const fixed = reindent(v.slice(0, lineStart) + line).split('\n').pop();
        if (fixed !== line) {
          ta.setSelectionRange(lineStart, ta.selectionStart);
          insert(fixed);
          line = fixed;
        }
      }
      insert('\n' + nextIndent(line));
    }
  });
  ta.addEventListener('input', () => {
    render();
    opts.onChange && opts.onChange(ta.value);
  });
  ta.addEventListener('scroll', sync);
  // re-measure wrapped lines when the editor's width changes
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitGutter).observe(body);

  render();
  return {
    el,
    textarea: ta,
    getValue: () => ta.value,
    setValue(v) {
      ta.value = v;
      render();
    },
    /** Replace the whole text as one undoable edit. */
    replaceAll(v) {
      ta.focus();
      ta.select();
      insert(v);
      render();
    },
    setMarks(m) {
      marks = { ...marks, ...m };
      render();
    },
    // every line is always shown (the editor grows to fit), so there is nothing to scroll;
    // kept so callers need not know that
    revealLine() {},
    focus: () => ta.focus(),
  };
}
