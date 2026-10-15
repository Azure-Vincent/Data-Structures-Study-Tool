// Array-based pictures: array stack, array queue, plain arrays, matrices,
// adjacency lists, and the contiguous-vs-scattered memory comparison.
import { h, s } from '../dom.js';
import { stackSize } from '../../core/stackQueue.js';

export function renderArrayStack(st, opts = {}) {
  const hl = opts.hl || {};
  const cells = new Set(hl.cells || []);
  const cw = 92;
  const ch = 34;
  const x0 = 120;
  const H = st.MAX * ch + 70;
  const svg = s('svg', { viewBox: `0 0 340 ${H}`, width: 340, height: H, role: 'img', 'aria-label': `Array stack, MAX ${st.MAX}, top ${st.top}, items ${st.arr.slice(0, stackSize(st)).join(', ') || 'none'}` });
  for (let i = 0; i < st.MAX; i++) {
    const y = H - 30 - (i + 1) * ch;
    const cls = ['cell', st.live[i] ? 'live' : st.arr[i] != null ? 'stale' : '', cells.has(i) ? 'hl' : ''].join(' ');
    const g = s('g', { class: cls });
    g.append(s('rect', { x: x0, y, width: cw, height: ch }));
    g.append(s('text', { class: 'v', x: x0 + cw / 2, y: y + 22, 'text-anchor': 'middle' }, st.arr[i] == null ? '' : String(st.arr[i])));
    g.append(s('text', { class: 'i', x: x0 + cw + 8, y: y + 21 }, String(i)));
    svg.append(g);
  }
  // top arrow: notes convention points at the next free slot, index convention at the top item
  const ti = st.top;
  const ty = H - 30 - (ti + 1) * ch + ch / 2;
  const clampY = Math.max(14, Math.min(H - 14, ty));
  svg.append(s('path', { class: 'idx-arrow', d: `M30,${clampY} L${x0 - 6},${clampY}`, 'marker-end': 'none' }));
  svg.append(s('text', { class: 'idx-label', x: 6, y: clampY - 6 }, `top = ${ti}`));
  svg.append(s('text', { class: 'svg-label', x: x0, y: H - 8 }, st.conv === 'notes' ? 'top = next free slot (notes)' : 'top = index of top item'));
  if (ti >= st.MAX) svg.append(s('text', { class: 'svg-label', x: 6, y: 12 }, '(full)'));
  return svg;
}

export function renderArrayQueue(q, opts = {}) {
  const hl = opts.hl || {};
  const cells = new Set(hl.cells || []);
  const cw = 58;
  const x0 = 30;
  const W = x0 * 2 + q.MAX * cw + 30;
  const svg = s('svg', { viewBox: `0 0 ${W} 150`, width: W, height: 150, role: 'img', 'aria-label': `Array queue, MAX ${q.MAX}, F ${q.F}, R ${q.R}` });
  for (let i = 0; i < q.MAX; i++) {
    const x = x0 + i * cw;
    const g = s('g', { class: ['cell', q.live[i] ? 'live' : q.arr[i] != null ? 'stale' : '', cells.has(i) ? 'hl' : ''].join(' ') });
    g.append(s('rect', { x, y: 40, width: cw, height: 40 }));
    g.append(s('text', { class: 'v', x: x + cw / 2, y: 66, 'text-anchor': 'middle' }, q.arr[i] == null ? '' : String(q.arr[i])));
    g.append(s('text', { class: 'i', x: x + cw / 2, y: 30, 'text-anchor': 'middle' }, String(i)));
    svg.append(g);
  }
  const arrow = (idx, label, row) => {
    const x = x0 + Math.min(idx, q.MAX) * cw + 12 + (row ? 14 : 0);
    svg.append(s('path', { class: 'idx-arrow', d: `M${x},${118 + row * 14} L${x},86` }));
    svg.append(s('text', { class: 'idx-label', x: x - 4, y: 132 + row * 14 }, `${label}=${idx}`));
  };
  arrow(q.F, 'F', 0);
  arrow(q.R, 'R', 1);
  if (q.mode === 'circular') svg.append(s('text', { class: 'svg-label', x: x0, y: 14 }, `circular, count = ${q.count}`));
  else svg.append(s('text', { class: 'svg-label', x: x0, y: 14 }, `linear (notes): empty when F == R, full when R == ${q.MAX}`));
  return svg;
}

export function renderArray(v) {
  const n = v.n;
  const cw = 64;
  const W = 40 + n * cw + 40;
  const svg = s('svg', { viewBox: `0 0 ${W} 110`, width: W, height: 110, role: 'img', 'aria-label': `array of ${n} cells` });
  for (let i = 0; i < n; i++) {
    const x = 30 + i * cw;
    const filled = v.filled == null || i < v.filled;
    const g = s('g', { class: ['cell', filled && v.filled != null ? 'live' : '', v.highlight === i ? 'hl' : ''].join(' ') });
    g.append(s('rect', { x, y: 34, width: cw, height: 38 }));
    g.append(s('text', { class: 'i', x: x + cw / 2, y: 26, 'text-anchor': 'middle' }, `[${i}]`));
    if (v.base != null) g.append(s('text', { class: 'i', x: x + 3, y: 90 }, String(v.base + i * v.size)));
    svg.append(g);
  }
  if (v.label) svg.append(s('text', { class: 'svg-label', x: 30, y: 106 }, v.base != null ? `addresses (${v.label}, ${v.size} byte${v.size > 1 ? 's' : ''} each)` : ''));
  return svg;
}

export function renderMatrixRO(v) {
  const t = h('table', { class: 'matrix', 'aria-label': 'adjacency matrix' });
  t.append(h('tr', {}, h('th'), v.labels.map((l) => h('th', { scope: 'col' }, l))));
  v.labels.forEach((r, i) => t.append(h('tr', {}, h('th', { scope: 'row' }, r), v.m[i].map((x) => h('td', { class: 'ro' }, x === Infinity ? '∞' : String(x))))));
  return t;
}

export function renderAdjList(v) {
  const wrap = h('div', { class: 'adjlist', style: { fontFamily: 'var(--mono)' } });
  for (const [k, ns] of Object.entries(v.list)) {
    wrap.append(h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', margin: '4px 0' } }, h('span', { class: 'chip', style: { minWidth: '34px', textAlign: 'center' } }, k), '→', ns.length ? ns.map((x, i) => [h('span', { class: 'chip' }, x), i < ns.length - 1 ? '→' : '']) : h('span', { class: 'muted' }, 'NULL'), ns.length ? h('span', { class: 'muted' }, '→ NULL') : null));
  }
  return wrap;
}

export function renderCompareMemory(v) {
  const vals = v.values;
  const W = 640;
  const svg = s('svg', { viewBox: `0 0 ${W} 250`, width: W, height: 250, role: 'img', 'aria-label': 'An array stored contiguously compared with list nodes scattered in memory' });
  svg.append(s('text', { class: 'svg-title', x: 10, y: 20 }, 'Array: one contiguous block'));
  vals.forEach((x, i) => {
    const g = s('g', { class: 'cell live' });
    g.append(s('rect', { x: 10 + i * 60, y: 30, width: 60, height: 36 }));
    g.append(s('text', { class: 'v', x: 40 + i * 60, y: 54, 'text-anchor': 'middle' }, String(x)));
    g.append(s('text', { class: 'i', x: 12 + i * 60, y: 82 }, String(1000 + i * 4)));
    svg.append(g);
  });
  svg.append(s('text', { class: 'svg-title', x: 10, y: 120 }, 'Linked list: nodes anywhere on the heap, joined by addresses'));
  const addrs = [340, 120, 520, 260];
  const xs = [30, 190, 350, 500];
  const ys = [140, 190, 145, 195];
  vals.forEach((x, i) => {
    const g = s('g', { class: 'svg-node' });
    g.append(s('rect', { class: 'box', x: xs[i], y: ys[i], width: 100, height: 34 }));
    g.append(s('rect', { class: 'field', x: xs[i] + 50, y: ys[i], width: 50, height: 34 }));
    g.append(s('text', { class: 'data', x: xs[i] + 25, y: ys[i] + 23, 'text-anchor': 'middle' }, String(x)));
    g.append(s('text', { class: i < vals.length - 1 ? 'ptrtxt' : 'nulltxt', x: xs[i] + 75, y: ys[i] + 21, 'text-anchor': 'middle' }, i < vals.length - 1 ? String(addrs[i + 1]) : 'NULL'));
    g.append(s('text', { class: 'addr', x: xs[i], y: ys[i] + 48 }, '@' + addrs[i]));
    svg.append(g);
    if (i < vals.length - 1) svg.append(s('path', { class: 'edge', d: `M${xs[i] + 92},${ys[i] + 17} L${xs[i + 1]},${ys[i + 1] + 17}` }));
  });
  return svg;
}

export function renderArrayTree(v) {
  const n = v.arr.length;
  const cw = 46;
  const W = 20 + n * cw + 20;
  const svg = s('svg', { viewBox: `0 0 ${W} 80`, width: W, height: 80, role: 'img', 'aria-label': `array ${v.arr.map((x) => x ?? 'empty').join(', ')}` });
  v.arr.forEach((x, i) => {
    const g = s('g', { class: ['cell', x != null ? 'live' : ''].join(' ') });
    g.append(s('rect', { x: 10 + i * cw, y: 26, width: cw, height: 34 }));
    g.append(s('text', { class: 'v', x: 10 + i * cw + cw / 2, y: 49, 'text-anchor': 'middle' }, x == null ? '—' : String(x)));
    g.append(s('text', { class: 'i', x: 10 + i * cw + cw / 2, y: 18, 'text-anchor': 'middle' }, String(i)));
    svg.append(g);
  });
  if (v.base === 1) svg.append(s('text', { class: 'svg-label', x: 10, y: 76 }, 'index 0 unused (1-based)'));
  return svg;
}

export function renderCode(v) {
  const pre = h('pre', { class: 'code' });
  pre.textContent = v.lines.map((l, i) => (v.numbered ? `${String(i + 1).padStart(2)}  ` : '') + l).join('\n');
  return pre;
}
