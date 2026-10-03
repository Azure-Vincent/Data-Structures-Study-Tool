// Small interactive demos used inside lessons.
import { h, s, clear } from '../ui/dom.js';
import * as T from '../core/tree.js';
import { renderTree } from '../ui/render/treegraph.js';

/** Node-count formulas: the fullest tree of height h, level by level. */
export function formulasDemo() {
  const wrap = h('div', { class: 'panel' });
  const slider = h('input', { type: 'range', min: 0, max: 4, value: 2, 'aria-label': 'height h' });
  const out = h('div');
  const draw = () => {
    const hh = Number(slider.value);
    const t = T.randomTree({ pick: (a) => a[0] }, T.maxNodesOfHeight(hh), 'perfect', Array.from({ length: 31 }, (_, i) => String(i + 1)));
    const rows = [];
    for (let l = 0; l <= hh; l++) rows.push(h('tr', {}, h('td', {}, `level ${l}`), h('td', {}, `2^${l} = ${2 ** l}`), h('td', {}, `running total ${2 ** (l + 1) - 1}`)));
    clear(out).append(
      h('div', { class: 'diagram-box' }, renderTree(t, { levels: true })),
      h(
        'div',
        { class: 'grid-2', style: { marginTop: '8px' } },
        h('table', { class: 'vars-table' }, rows),
        h(
          'div',
          { class: 'prose', style: { fontSize: '15px' } },
          h('p', {}, h('b', {}, `Height h = ${hh}`)),
          h('p', {}, `Max nodes = 2^(h+1) − 1 = ${T.maxNodesOfHeight(hh)}`),
          h('p', {}, `Max leaves = 2^h = ${T.maxLeavesOfHeight(hh)}`),
          h('p', {}, `Edges = n − 1 = ${T.edgesOfTree(T.maxNodesOfHeight(hh))} (true for every tree)`),
          h('p', {}, 'Each level can at most double the previous one: m nodes on level l → at most 2m on level l + 1.'),
        ),
      ),
    );
  };
  slider.addEventListener('input', draw);
  wrap.append(h('label', { class: 'row' }, h('b', {}, 'Height h'), slider), out);
  draw();
  return wrap;
}

/** Same tree: array positions vs linked nodes with left/right addresses. */
export function treeReprDemo() {
  const t = T.fromSpec({ A: ['B', 'C'], B: ['D', 'E'], C: [null, 'G'] }, 'A');
  const wrap = h('div', { class: 'panel' });
  const info = h('div', { 'aria-live': 'polite', class: 'small', style: { marginTop: '6px' } });
  let sel = 'E';
  const addr = Object.fromEntries(T.preorder(t).map((id, i) => [id, 100 * (i + 1)]));
  const draw = () => {
    const num = T.numbering(t);
    const arr0 = T.toArray(t, 0);
    const svgArr = s('svg', { viewBox: `0 0 ${arr0.length * 52 + 20} 70`, width: arr0.length * 52 + 20, height: 70, role: 'img', 'aria-label': 'array representation' });
    arr0.forEach((x, i) => {
      const g = s('g', { class: ['cell', x ? 'live' : '', x === sel ? 'hl' : ''].join(' ') });
      g.append(s('rect', { x: 10 + i * 52, y: 22, width: 52, height: 34 }), s('text', { class: 'v', x: 36 + i * 52, y: 45, 'text-anchor': 'middle' }, x || '—'), s('text', { class: 'i', x: 36 + i * 52, y: 15, 'text-anchor': 'middle' }, String(i)));
      svgArr.append(g);
    });
    const nodes = T.preorder(t).map((id) => {
      const n = t.nodes[id];
      return h('div', { class: 'chip', style: { borderRadius: '4px', background: id === sel ? 'var(--marker-soft)' : '' } }, `@${addr[id]}  [ ${n.left ? addr[n.left] : 'NULL'} | ${id} | ${n.right ? addr[n.right] : 'NULL'} ]`);
    });
    clear(wrap).append(
      h('div', { class: 'grid-2' }, h('div', {}, h('h3', {}, 'The tree (click a node)'), h('div', { class: 'diagram-box' }, renderTree(t, { onNode: (id) => { sel = id; draw(); }, mark: [sel], showArray: 0 }))), h('div', {}, h('h3', {}, 'Array (0-based, level order)'), h('div', { class: 'diagram-box' }, svgArr), h('h3', { style: { marginTop: '10px' } }, 'Linked nodes: [left | data | right]'), h('div', { style: { display: 'grid', gap: '4px', fontFamily: 'var(--mono)' } }, nodes))),
      info,
    );
    const i0 = num[sel] - 1;
    const n = t.nodes[sel];
    clear(info).append(
      h('p', {}, h('b', {}, `${sel}: `), `array index ${i0} (0-based) / ${i0 + 1} (1-based). Its children would be at ${2 * i0 + 1} and ${2 * i0 + 2}; its parent at ${i0 > 0 ? Math.floor((i0 - 1) / 2) : '— (root)'}. Linked: left = ${n.left ? addr[n.left] : 'NULL'}, right = ${n.right ? addr[n.right] : 'NULL'}.`),
      h('p', { class: 'muted' }, 'Index 5 is empty because C has no left child: an incomplete tree wastes array slots. The linked version never wastes slots but spends two pointers per node, and it cannot jump to “the parent of i” without an extra parent pointer.'),
    );
  };
  draw();
  return wrap;
}
