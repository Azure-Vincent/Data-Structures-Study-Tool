// Draws Pseudocode Lab interpreter states: the structure diagram (list, tree
// or graph), the variables / call stack, collections and output.
import { h, s } from '../dom.js';
import { renderList } from './list.js';
import { renderGraph } from './treegraph.js';
import { STRUCTURES } from '../../lab/structures.js';
import { lostAddrs } from '../../lab/analysis.js';
import { isRef, isColl, isGraph, fmt, dataText } from '../../lab/machine.js';

const COLL_LABEL = { queue: 'Queue · front → rear', stack: 'Stack · bottom → top', set: 'Set', array: 'Array' };

/** Variables visible right now: globals, overridden by the current frame's locals. */
export function visibleVars(st) {
  const g = st.frames[0];
  const top = st.frames[st.frames.length - 1];
  const out = new Map();
  for (const n of g.order) if (n in g.vars) out.set(n, { value: g.vars[n], global: true });
  if (top !== g) for (const n of top.order) if (n in top.vars) out.set(n, { value: top.vars[n], global: false });
  return out;
}

function toWorld(st) {
  const S = STRUCTURES[st.structure];
  const nodes = {};
  for (const n of Object.values(st.nodes)) {
    const m = { addr: n.addr, data: dataText(n.data), freed: n.freed };
    for (const f of S.fields) m[f] = n[f];
    nodes[n.addr] = m;
  }
  const vars = {};
  const varOrder = [];
  const globals = [];
  for (const [name, { value, global }] of visibleVars(st)) {
    if (value !== null && !isRef(value)) continue;
    vars[name] = isRef(value) ? value.ref : null;
    varOrder.push(name);
    if (global) globals.push(name);
  }
  // keep the structure's own pointers first so they sit nearest their nodes
  varOrder.sort((a, b) => (S.roots.includes(b) ? 1 : 0) - (S.roots.includes(a) ? 1 : 0));
  return { kind: S.listKind, nodes, vars, varOrder, globals };
}

function graphState(st, graph) {
  const discovered = new Set();
  const frontier = [];
  for (const { value } of visibleVars(st).values()) {
    if (!isColl(value)) continue;
    const c = st.colls[value.coll];
    if (!c) continue;
    for (const x of c.items) {
      if (typeof x !== 'string' || !graph.vertices.includes(x)) continue;
      if (c.kind === 'set') discovered.add(x);
      if (c.kind === 'queue' || c.kind === 'stack') frontier.push(x);
    }
  }
  const output = [...new Set(st.output.filter((x) => graph.vertices.includes(x)))];
  for (const v of [...frontier, ...output]) discovered.add(v);
  return { discovered: [...discovered], frontier, processed: output, output, current: st.lastVertex };
}

/** The structure diagram for one interpreter state. hl = step highlights. */
export function renderLabDiagram(st, graph, hl = {}) {
  const S = STRUCTURES[st.structure];
  if (S.render === 'graph') return renderGraph(graph, { state: graphState(st, graph), size: [520, 340] });
  if (S.render === 'tree') return renderHeapTree(st, hl);
  if (S.render === 'none') return renderCollections(st) || h('p', { class: 'small muted', style: { padding: '12px' } }, 'No arrays yet — the program creates them with new Array(n).');
  return renderList(toWorld(st), { hl, head: S.roots[0], lost: lostAddrs(st) });
}

// ---------------------------------------------------------------- binary tree of heap nodes
const TW = 132; // node width: [left 34 | data 64 | right 34]
const TH = 40;
const DX = 150;
const DY = 96;
let uid = 0;

export function renderHeapTree(st, hl = {}) {
  const id = ++uid;
  const rootVal = st.frames[0].vars.root;
  const pos = new Map();
  let slot = 0;
  let maxDepth = 0;
  const seen = new Set();
  const place = (a, depth) => {
    if (a == null || depth > 12) return;
    const n = st.nodes[a];
    if (!n || seen.has(a)) return;
    seen.add(a);
    if (!n.freed) place(n.left, depth + 1);
    pos.set(a, { x: 24 + slot++ * DX, y: 70 + depth * DY, inTree: true });
    maxDepth = Math.max(maxDepth, depth);
    if (!n.freed) place(n.right, depth + 1);
  };
  if (isRef(rootVal)) place(rootVal.ref, 0);
  const detachedY = 70 + (maxDepth + 1) * DY + 30;
  const others = Object.keys(st.nodes)
    .map(Number)
    .filter((a) => !pos.has(a))
    .sort((a, b) => a - b);
  others.forEach((a, i) => pos.set(a, { x: 24 + i * DX, y: detachedY, inTree: false }));
  const width = Math.max(420, 48 + Math.max(slot, others.length) * DX);
  const height = (others.length ? detachedY + TH + 46 : 70 + (maxDepth + 1) * DY) + 10;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': `Binary tree of ${pos.size} node(s) from root` });
  svg.append(s('defs', {}, ...['a', 'h', 'b'].map((k) => s('marker', { id: `t${k}${id}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', fill: `var(--${k === 'a' ? 'pointer' : k === 'h' ? 'marker' : 'bad'})` })))));
  const gE = s('g');
  const gN = s('g');
  const gV = s('g');
  svg.append(gE, gN, gV);
  if (others.length) svg.append(s('text', { class: 'svg-label', x: 24, y: detachedY - 12 }, 'not in the tree from root'));
  if (!pos.size) svg.append(s('text', { class: 'svg-label', x: 24, y: 60 }, 'root = NULL — the tree is empty'));
  const lost = new Set(lostAddrs(st));
  const hlNodes = new Set(hl.nodes || []);
  const hlLinks = new Set((hl.links || []).map((l) => `${l.from}.${l.field}`));
  for (const [a, p] of pos) {
    const n = st.nodes[a];
    const cls = ['svg-node'];
    if (hlNodes.has(a)) cls.push('hl');
    if (n.freed) cls.push('freed');
    else if (lost.has(a)) cls.push('lost');
    if (hl.anim === 'alloc' && hlNodes.has(a)) cls.push('anim-alloc');
    if (hl.anim === 'free' && hlNodes.has(a)) cls.push('anim-free');
    const g = s('g', { class: cls.join(' '), 'data-addr': a });
    g.append(s('rect', { class: 'box', x: p.x, y: p.y, width: TW, height: TH, rx: 3 }));
    for (const [f, x0, x1] of [
      ['left', 0, 34],
      ['right', 98, 132],
    ]) {
      g.append(s('rect', { class: 'field', x: p.x + x0, y: p.y, width: x1 - x0, height: TH }));
      g.append(s('text', { class: n[f] == null ? 'nulltxt' : 'ptrtxt', x: p.x + (x0 + x1) / 2, y: p.y + TH / 2 + 4, 'text-anchor': 'middle', style: 'font-size:10px' }, n[f] == null ? 'NULL' : String(n[f])));
      g.append(s('text', { class: 'svg-label', x: p.x + (x0 + x1) / 2, y: p.y - 5, 'text-anchor': 'middle', style: 'font-size:10px' }, f));
    }
    g.append(s('text', { class: 'data', x: p.x + 66, y: p.y + TH / 2 + 6, 'text-anchor': 'middle' }, dataText(n.data)));
    g.append(s('text', { class: 'addr', x: p.x + 2, y: p.y + TH + 15 }, `@${a}`));
    if (n.freed) g.append(s('text', { class: 'tag', x: p.x + TW, y: p.y + TH + 15, 'text-anchor': 'end' }, 'deleted'));
    else if (lost.has(a)) g.append(s('text', { class: 'tag', x: p.x + TW, y: p.y + TH + 15, 'text-anchor': 'end' }, 'unreachable'));
    gN.append(g);
    for (const [f, cx] of [
      ['left', 17],
      ['right', 115],
    ]) {
      const t = n[f];
      if (t == null) continue;
      const tp = pos.get(t);
      const key = `${a}.${f}`;
      const bad = !st.nodes[t] || st.nodes[t].freed;
      const cls2 = ['edge', f === 'left' ? 'left' : '', hlLinks.has(key) ? 'hl' : '', bad ? 'bad' : '', hl.anim === 'link' && hlLinks.has(key) ? 'anim-link' : ''].filter(Boolean).join(' ');
      const sx = p.x + cx;
      const sy = p.y + TH;
      let d;
      if (!tp) d = `M${sx},${sy} l20,26`;
      else if (tp.y > p.y) d = `M${sx},${sy} C${sx},${sy + 30} ${tp.x + TW / 2},${tp.y - 34} ${tp.x + TW / 2},${tp.y}`;
      else d = `M${sx},${sy} C${sx},${sy + 60} ${tp.x + TW / 2},${tp.y + TH + 60} ${tp.x + TW / 2},${tp.y + TH}`;
      gE.append(s('path', { class: cls2, d, 'marker-end': `url(#t${hlLinks.has(key) ? 'h' : bad ? 'b' : 'a'}${id})` }));
    }
  }
  // pointer variables: little tags above the node they point to; NULL ones in a strip
  const over = new Map();
  let nullX = 24;
  const hlVars = new Set(hl.vars || []);
  for (const [name, { value, global }] of visibleVars(st)) {
    if (value !== null && !isRef(value)) continue;
    const cls = `var-box${global ? '' : ' local'}${hlVars.has(name) ? ' hl' : ''}`;
    const w = Math.max(44, name.length * 8 + 14);
    if (value === null || !pos.has(value.ref)) {
      const g = s('g', { class: cls });
      g.append(s('rect', { x: nullX, y: 8, width: w + 40, height: 24, rx: 4 }), s('text', { class: 'name', x: nullX + 6, y: 24 }, name), s('text', { class: 'v', x: nullX + w - 2, y: 24 }, value === null ? 'NULL' : `@${value.ref}`));
      gV.append(g);
      nullX += w + 48;
      continue;
    }
    const p = pos.get(value.ref);
    const k = over.get(value.ref) || 0;
    over.set(value.ref, k + 1);
    const bx = p.x + 34 + k * (w + 6) - (k ? 0 : 0);
    const by = p.y - 40;
    const g = s('g', { class: cls });
    g.append(s('rect', { x: bx, y: by, width: w, height: 20, rx: 4 }), s('text', { class: 'name', x: bx + 6, y: by + 14 }, name));
    gV.append(g);
    gE.append(s('path', { class: `var-edge${hlVars.has(name) ? ' hl' : ''}`, d: `M${bx + 12},${by + 20} L${bx + 12},${p.y - 2}` }));
  }
  return svg;
}

// ---------------------------------------------------------------- panels
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Variables of every frame (current first), changed values highlighted against prev. lines:false hides pseudocode line numbers. */
export function renderVariables(st, prev, { lines = true } = {}) {
  const wrap = h('div', { class: 'lab-vars' });
  const frames = [...st.frames].reverse();
  frames.forEach((fr, k) => {
    const isTop = k === 0;
    const pfr = prev && prev.frames.find((f, i) => i === st.frames.indexOf(fr) && f.fn === fr.fn);
    const rows = fr.order
      .filter((n) => n in fr.vars)
      .map((name) => {
        const v = fr.vars[name];
        const changed = prev && (!pfr || !(name in pfr.vars) || !same(pfr.vars[name], v));
        const kind = isRef(v) || v === null ? 'pointer' : isColl(v) ? 'collection' : isGraph(v) ? 'graph' : 'value';
        return h('tr', { class: changed ? 'changed' : '' }, h('td', {}, name), h('td', {}, isRef(v) ? [h('span', { class: 'addr' }, `@${v.ref}`), h('span', { class: 'val' }, st.nodes[v.ref]?.freed ? '  → deleted node!' : `  → node with data ${dataText(st.nodes[v.ref]?.data)}`)] : v === null ? h('span', { class: 'addr' }, 'NULL') : fmt(st, v)), h('td', { class: 'small muted' }, kind));
      });
    wrap.append(
      h('div', { class: 'lab-frame' + (isTop ? ' top' : '') }, h('div', { class: 'lab-frame-title' }, fr.fn === 'main' ? 'Global variables' : `${fr.fn}() — ${isTop ? 'running now' : 'waiting'}${fr.callLine && lines ? `, called on line ${fr.callLine}` : ''}`), rows.length ? h('table', { class: 'vars-table' }, rows) : h('p', { class: 'small muted', style: { margin: '4px 0' } }, 'No variables yet.')),
    );
  });
  return wrap;
}

/** Queues, stacks, sets and arrays held by visible variables. */
export function renderCollections(st) {
  const rows = [];
  for (const [name, { value }] of visibleVars(st)) {
    if (!isColl(value)) continue;
    const c = st.colls[value.coll];
    if (!c) continue;
    const title = h('div', { class: 'small' }, h('b', {}, name), ' ', h('span', { class: 'muted' }, COLL_LABEL[c.kind]));
    if (c.kind === 'array' && c.items.length && c.items.every((x) => isColl(x) && st.colls[x.coll])) rows.push(h('div', { class: 'lab-coll' }, title, renderMatrix(st, c)));
    else if (c.kind === 'array' && st.structure === 'arrays' && c.items.some(isRef) && c.items.every((x) => x === null || isRef(x))) rows.push(h('div', { class: 'lab-coll' }, title, renderChains(st, c)));
    else {
      const cells = c.items.map((x, i) => h('span', { class: 'cell' }, c.kind === 'array' ? h('small', { class: 'idx' }, String(i)) : null, cellText(st, x)));
      rows.push(h('div', { class: 'lab-coll' }, title, h('div', { class: 'frontier' }, cells.length ? cells : h('span', { class: 'muted small' }, 'empty'))));
    }
  }
  return rows.length ? h('div', { class: 'lab-colls' }, rows) : null;
}

function cellText(st, x) {
  if (isRef(x)) {
    const n = st.nodes[x.ref];
    return n ? `@${x.ref} (${dataText(n.data)})` : `@${x.ref}`;
  }
  if (isColl(x)) return `array #${x.coll}`;
  return x === null ? '–' : typeof x === 'string' ? x : String(x);
}

// an array of arrays (e.g. an adjacency matrix): one row per inner array
function renderMatrix(st, c) {
  const inner = c.items.map((x) => st.colls[x.coll].items);
  const width = Math.max(0, ...inner.map((r) => r.length));
  const cols = Array.from({ length: width }, (_, j) => j);
  return h(
    'table',
    { class: 'lab-matrix' },
    h('thead', {}, h('tr', {}, h('th', {}, ''), cols.map((j) => h('th', { scope: 'col' }, String(j))))),
    h('tbody', {}, inner.map((r, i) => h('tr', {}, h('th', { scope: 'row' }, String(i)), cols.map((j) => h('td', { class: r[j] === 1 ? 'on' : '' }, j < r.length ? cellText(st, r[j]) : ''))))),
  );
}

// an array whose slots hold the first node of a linked list (e.g. adjacency lists)
function renderChains(st, c) {
  return h(
    'div',
    { class: 'lab-chains' },
    c.items.map((x, i) => {
      const parts = [h('span', { class: 'slot' }, `[${i}]`)];
      let a = isRef(x) ? x.ref : null;
      const seen = new Set();
      while (a != null && st.nodes[a] && !seen.has(a) && seen.size < 30) {
        seen.add(a);
        const n = st.nodes[a];
        parts.push(h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'), h('span', { class: `cell${n.freed ? ' freed' : ''}`, title: `node @${a}` }, dataText(n.data)));
        a = n.next;
      }
      parts.push(h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'), h('span', { class: 'null' }, 'NULL'));
      return h('div', { class: 'frontier' }, parts);
    }),
  );
}
