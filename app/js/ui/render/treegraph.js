// SVG renderers for binary trees and graphs.
import { s } from '../dom.js';
import * as T from '../../core/tree.js';
import * as G from '../../core/graph.js';

let uid = 0;

function nodeKeys(g, el, id, label, onClick) {
  if (!onClick) return;
  g.classList.add('clickable-node');
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', label);
  g.addEventListener('click', () => onClick(id));
  g.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(id);
    }
  });
  void el;
}

/**
 * opts: { hl:{node, nodes, visit}, state:{callStack, output, entered, stack}, mark:[ids], picked:[ids],
 *         onNode, numbering:bool, showArray:0|1|null, levels:bool, orderBadges:{id:n}, addButtons:{onAdd(id, side)} }
 */
export function renderTree(tree, opts = {}) {
  const t = tree;
  const { pos, width, height } = T.layout(t);
  const dx = 64;
  const dy = 78;
  const padX = 48;
  const padY = opts.addButtons ? 46 : 36;
  const W = Math.max(320, width * dx + padX * 2);
  const Hh = Math.max(140, height * dy + padY + 40 + (opts.addButtons ? 50 : 0));
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, role: 'img', 'aria-label': `Binary tree with root ${t.root ?? 'none'}; preorder ${T.preorder(t).join(' ')}` });
  const P = (id) => ({ x: padX + pos[id].x * dx + dx / 2 - dx / 2 + 16, y: padY + pos[id].y * dy });
  const hl = opts.hl || {};
  const st = opts.state || {};
  const active = new Set(st.callStack || st.stack || []);
  const output = new Set(st.output || []);
  const marked = new Set(opts.mark || []);
  const picked = new Set(opts.picked || []);
  const hlNodes = new Set([...(hl.nodes || []), hl.node].filter(Boolean));
  const num = opts.numbering || opts.showArray != null ? T.numbering(t) : {};
  if (opts.levels && t.root) {
    for (let l = 0; l <= T.height(t); l++) svg.append(s('text', { class: 'svg-label', x: 6, y: padY + l * dy + 5 }, `level ${l}`));
  }
  if (!t.root) svg.append(s('text', { class: 'svg-label', x: 20, y: 40 }, 'Empty tree (root = NULL).'));
  for (const id of T.ids(t)) {
    const n = t.nodes[id];
    for (const side of ['left', 'right']) {
      const c = n[side];
      if (!c) continue;
      const a = P(id);
      const b = P(c);
      svg.append(s('line', { class: 'g-edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    }
  }
  for (const id of T.ids(t)) {
    const p = P(id);
    const cls = ['g-node'];
    if (output.has(id)) cls.push('processed');
    if (active.has(id)) cls.push('frontier');
    if (hl.visit === id) cls.push('current');
    if (hlNodes.has(id)) cls.push('hl');
    if (marked.has(id)) cls.push('mark');
    if (picked.has(id)) cls.push('picked');
    const g = s('g', { class: cls.join(' '), 'data-node': id });
    g.append(s('circle', { class: 'vtx', cx: p.x, cy: p.y, r: 20 }));
    g.append(s('text', { class: 'vtx-label', x: p.x, y: p.y + 5, 'text-anchor': 'middle' }, id));
    if (opts.numbering && num[id]) g.append(s('text', { class: 'vtx-sub', x: p.x + 22, y: p.y - 14 }, String(num[id])));
    if (opts.showArray != null && num[id]) g.append(s('text', { class: 'vtx-sub', x: p.x + 22, y: p.y - 14 }, `[${num[id] - (opts.showArray === 0 ? 1 : 0)}]`));
    if (opts.orderBadges && opts.orderBadges[id] != null) g.append(s('text', { class: 'order-badge', x: p.x - 30, y: p.y - 16 }, String(opts.orderBadges[id])));
    if (st.entered && st.entered.includes(id) && !output.has(id)) g.append(s('text', { class: 'vtx-sub', x: p.x, y: p.y + 34, 'text-anchor': 'middle' }, 'entered'));
    nodeKeys(g, null, id, `node ${id}`, opts.onNode);
    svg.append(g);
    if (opts.addButtons) {
      for (const side of ['left', 'right']) {
        if (t.nodes[id][side]) continue;
        const bx = p.x + (side === 'left' ? -26 : 26);
        const by = p.y + 38;
        const b = s('g', { class: 'clickable-node', tabindex: 0, role: 'button', 'aria-label': `add ${side} child of ${id}` });
        b.append(s('circle', { class: 'vtx', cx: bx, cy: by, r: 11, style: 'stroke-dasharray:3 3' }));
        b.append(s('text', { class: 'vtx-sub', x: bx, y: by + 4, 'text-anchor': 'middle' }, '+'));
        b.addEventListener('click', () => opts.addButtons.onAdd(id, side));
        b.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            opts.addButtons.onAdd(id, side);
          }
        });
        svg.append(b);
      }
    }
  }
  return svg;
}

/**
 * opts: { state (graph trace state), hl:{vertex, edge}, mark:[v], picked:[v], onNode, size }
 */
export function renderGraph(graph, opts = {}) {
  const id = ++uid;
  const g = G.ensureLayout(G.clone(graph));
  const W = opts.size?.[0] || 520;
  const Hh = opts.size?.[1] || 360;
  const pad = 34;
  const P = (v) => ({ x: pad + g.pos[v][0] * (W - 2 * pad), y: pad + g.pos[v][1] * (Hh - 2 * pad) });
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, role: 'img', 'aria-label': `${g.directed ? 'Directed' : 'Undirected'}${g.weighted ? ' weighted' : ''} graph with vertices ${g.vertices.join(', ')} and ${g.edges.length} edges` });
  svg.append(s('defs', {}, s('marker', { id: `ga${id}`, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'var(--ink-2)' }))));
  const st = opts.state || {};
  const hl = opts.hl || {};
  const tree = new Set((st.treeEdges || []).map(([a, b]) => a + '>' + b));
  const hlEdge = hl.edge ? hl.edge.join('>') : null;
  for (const e of g.edges) {
    const a = P(e.u);
    const b = P(e.v);
    const isTree = tree.has(e.u + '>' + e.v) || (!g.directed && tree.has(e.v + '>' + e.u));
    const isHl = hlEdge === e.u + '>' + e.v || (!g.directed && hlEdge === e.v + '>' + e.u);
    const cls = ['g-edge', isTree && 'tree', isHl && 'hl'].filter(Boolean).join(' ');
    let d;
    let mx;
    let my;
    if (e.u === e.v) {
      d = `M${a.x - 10},${a.y - 17} C${a.x - 40},${a.y - 70} ${a.x + 40},${a.y - 70} ${a.x + 10},${a.y - 17}`;
      mx = a.x;
      my = a.y - 58;
    } else {
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      const both = g.directed && G.hasEdge({ ...g, directed: true }, e.v, e.u);
      const off = both ? 8 : 0;
      const ox = -uy * off;
      const oy = ux * off;
      const x1 = a.x + ux * 21 + ox;
      const y1 = a.y + uy * 21 + oy;
      const x2 = b.x - ux * 23 + ox;
      const y2 = b.y - uy * 23 + oy;
      d = `M${x1},${y1} L${x2},${y2}`;
      mx = (x1 + x2) / 2 + ox;
      my = (y1 + y2) / 2 + oy;
    }
    svg.append(s('path', { class: cls, d, 'marker-end': g.directed ? `url(#ga${id})` : null }));
    if (g.weighted) svg.append(s('text', { class: 'g-weight', x: mx, y: my - 3, 'text-anchor': 'middle' }, String(e.w)));
  }
  const disc = new Set(st.discovered || []);
  const proc = new Set(st.processed || []);
  const fr = new Set(st.frontier || []);
  const marked = new Set(opts.mark || []);
  const picked = new Set(opts.picked || []);
  const outIdx = Object.fromEntries((st.output || []).map((v, i) => [v, i + 1]));
  for (const v of g.vertices) {
    const p = P(v);
    const cls = ['g-node'];
    if (disc.has(v)) cls.push('discovered');
    if (fr.has(v)) cls.push('frontier');
    if (proc.has(v)) cls.push('processed');
    if (st.current === v) cls.push('current');
    if (hl.vertex === v) cls.push('hl');
    if (marked.has(v)) cls.push('mark');
    if (picked.has(v)) cls.push('picked');
    const gg = s('g', { class: cls.join(' '), 'data-node': v });
    gg.append(s('circle', { class: 'vtx', cx: p.x, cy: p.y, r: 19 }));
    gg.append(s('text', { class: 'vtx-label', x: p.x, y: p.y + 5, 'text-anchor': 'middle' }, v));
    if (outIdx[v]) gg.append(s('text', { class: 'order-badge', x: p.x + 21, y: p.y - 15 }, '#' + outIdx[v]));
    const status = proc.has(v) ? 'processed' : fr.has(v) ? 'in frontier' : disc.has(v) ? 'discovered' : 'not discovered';
    nodeKeys(gg, null, v, `vertex ${v}, ${status}`, opts.onNode);
    if (opts.onNode) gg.setAttribute('aria-label', `vertex ${v}`);
    svg.append(gg);
  }
  return svg;
}
