// Complexity lab: run the real simulations for n = 1..N and plot the counts.
import { h, s, clear } from '../ui/dom.js';
import * as PW from '../core/pointerWorld.js';
import * as SLL from '../core/sll.js';
import * as DLL from '../core/dll.js';
import * as CSLL from '../core/csll.js';
import * as SQ from '../core/stackQueue.js';
import * as T from '../core/tree.js';
import * as G from '../core/graph.js';
import { makeRng } from '../core/rng.js';

const seq = (n) => Array.from({ length: n }, (_, i) => i + 1);
const moves = (tr) => tr.counters.moves || 0;

export const EXPERIMENTS = [
  { id: 'sll-beg', label: 'Singly linked: insert at beginning', unit: 'pointer moves', concept: 'cx.list-costs', theta: 'Θ(1)', assume: 'Only start is kept; count each temp = temp->next.', f: (n) => moves(SLL.insertBeg(PW.buildList('sll', seq(n)), 0, { detail: false })) },
  { id: 'sll-end', label: 'Singly linked: insert at end (start only)', unit: 'pointer moves', concept: 'cx.list-costs', theta: 'Θ(n)', assume: 'Walk temp from start to the last node; linking is 1 write.', f: (n) => moves(SLL.insertEnd(PW.buildList('sll', seq(n)), 0, { detail: false })), g: (n) => SLL.insertEnd(PW.buildList('sll', seq(n)), 0, { detail: false }).counters.linkWrites - 1, gLabel: 'link writes to existing nodes' },
  { id: 'sll-end-tail', label: 'Singly linked: insert at end WITH tail', unit: 'pointer moves', concept: 'cx.tail-pointer', theta: 'Θ(1)', assume: 'start and tail are both maintained.', f: (n) => moves(SLL.insertEndTail(PW.buildList('sll', seq(n)), 0, { detail: false })) },
  { id: 'sll-del-tail', label: 'Singly linked: delete at end WITH tail', unit: 'pointer moves', concept: 'cx.tail-pointer', theta: 'Θ(n)', assume: 'Even with tail, the node BEFORE tail must be found from start.', f: (n) => moves(SLL.deleteEndTail(PW.buildList('sll', seq(n)))) },
  { id: 'dll-del-tail', label: 'Doubly linked: delete at end WITH tail (supplementary)', unit: 'pointer moves', concept: 'cx.tail-pointer', theta: 'Θ(1)', assume: 'tail->left gives the new tail directly: no walk.', f: () => 0 },
  { id: 'creat', label: 'creatlist(n) (append by walking each time)', unit: 'pointer moves (total)', concept: 'cx.list-costs', theta: 'Θ(n²)', assume: 'Lec 08 p.3: every append walks from start.', f: (n) => moves(SLL.createList(seq(n))) },
  { id: 'stack-tail', label: 'Linked stack pop: at the TAIL (notes) vs at the HEAD', unit: 'pointer moves per pop', concept: 'cx.stack-ends', theta: 'tail Θ(n) · head Θ(1)', assume: 'Stack holds n items; one pop.', f: (n) => { const p = seq(n).map((x) => ({ op: 'push', x })); return (SQ.runOps('lstack-tail', [...p, { op: 'pop' }]).counters.moves || 0) - (SQ.runOps('lstack-tail', p).counters.moves || 0); }, g: (n) => { const p = seq(n).map((x) => ({ op: 'push', x })); return (SQ.runOps('lstack-head', [...p, { op: 'pop' }]).counters.moves || 0) - (SQ.runOps('lstack-head', p).counters.moves || 0); }, gLabel: 'head version' },
  { id: 'array-front', label: 'Array: insert at the front', unit: 'element shifts', concept: 'l07.arrays-vs-lists', theta: 'Θ(n)', assume: 'n items stored in a[0..n−1]; each moved element = 1 shift.', f: (n) => n, g: () => 2, gLabel: 'linked list: pointer writes' },
  { id: 'csll-beg', label: 'Circular list: insert at beginning (start only)', unit: 'pointer moves', concept: 'cx.circular-costs', theta: 'Θ(n)', assume: 'The last node must be found to close the circle.', f: (n) => moves(CSLL.insertBeg(CSLL.build(seq(n)), 0, { detail: false })) },
  { id: 'countnode', label: 'Recursive countnode: call-stack depth', unit: 'frames at deepest point', concept: 'l10.countnode', theta: 'Θ(n) space', assume: 'One frame per node plus the NULL call.', f: (n) => Math.max(...DLL.countnode(PW.buildList('dll', seq(n))).steps.map((x) => (x.state.callStack || []).length)) },
  { id: 'bfs', label: 'BFS on a graph with ~2n edges: list vs matrix', unit: 'neighbour checks', concept: 'l14.traversal-cost', theta: 'list Θ(V+E) · matrix Θ(V²)', assume: 'Random undirected graph, V = n, E ≈ 2n; whole-graph BFS.', f: (n) => G.traceBFS(graphOf(n), 'A', { rep: 'list', all: true }).counters.neighborChecks || 0, g: (n) => G.traceBFS(graphOf(n), 'A', { rep: 'matrix', all: true }).counters.neighborChecks || 0, gLabel: 'matrix', min: 2 },
  { id: 'trav-depth', label: 'Tree traversal: recursion depth, skewed vs complete tree', unit: 'max frames on the call stack', concept: 'l14.traversal-cost', theta: 'Θ(h): Θ(n) skewed · Θ(log n) complete', assume: 'n nodes; preorder recursion.', f: (n) => depth(T.randomTree(makeRng(1), n, 'skewed')), g: (n) => depth(T.randomTree(makeRng(1), n, 'complete')), gLabel: 'complete tree' },
];

function depth(t) {
  return Math.max(0, ...T.traceTraversal(t, 'preorder').steps.map((x) => x.state.callStack.length));
}

const gcache = {};
function graphOf(n) {
  if (gcache[n]) return gcache[n];
  const labels = Array.from({ length: n }, (_, i) => (i < 26 ? String.fromCharCode(65 + i) : 'V' + i));
  const g = G.createGraph();
  labels.forEach((l) => G.addVertex(g, l));
  const rng = makeRng(n * 31);
  for (let i = 1; i < n; i++) G.addEdge(g, labels[rng.int(0, i - 1)], labels[i]);
  let extra = n + 1;
  let guard = 0;
  while (extra > 0 && guard++ < 500 && n > 2) {
    const [a, b] = rng.sample(labels, 2);
    if (!G.hasEdge(g, a, b)) {
      G.addEdge(g, a, b);
      extra--;
    }
  }
  gcache[n] = g;
  return g;
}

export function complexityView(ctx) {
  const { store } = ctx;
  let exp = EXPERIMENTS[1];
  let N = 16;
  const root = h('div');
  const sel = h('select', { 'aria-label': 'experiment', onchange: () => { exp = EXPERIMENTS.find((e) => e.id === sel.value); draw(); } }, EXPERIMENTS.map((e) => h('option', { value: e.id, selected: e === exp }, e.label)));
  const nIn = h('input', { type: 'range', min: 4, max: 24, step: 2, value: N, 'aria-label': 'largest n', oninput: () => { N = Number(nIn.value); nIn.nextSibling.textContent = String(N); draw(); } });
  const out = h('div');
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Complexity lab'), h('div', { class: 'subtitle' }, 'Run the real simulations for growing n and watch the work grow.'))),
    h(
      'div',
      { class: 'panel prose', style: { maxWidth: 'none', fontSize: '15px' } },
      h('p', {}, 'Every number here comes from actually running the simulated algorithm and counting its work — the same counters you see in the workspace. Watch how the count grows as n grows.'),
      h('p', {}, h('b', {}, 'O'), ' is an upper bound (“grows no faster than”), ', h('b', {}, 'Ω'), ' a lower bound (“grows at least as fast as”), and ', h('b', {}, 'Θ'), ' a tight bound (both). Inserting at the end of a start-only list is Θ(n): it is O(n) and also Ω(n), because it must walk past every node. Saying it is O(n²) would be true but not tight.'),
    ),
    h('div', { class: 'panel row', style: { margin: '14px 0' } }, h('label', { class: 'inline' }, h('b', {}, 'Experiment'), sel), h('label', { class: 'inline' }, h('b', {}, 'n up to'), nIn, h('span', { class: 'muted small', style: { minWidth: '2ch' } }, String(N)))),
    out,
  );

  function draw() {
    const lo = exp.min || 1;
    const ns = seq(N).filter((n) => n >= lo);
    const ys = ns.map((n) => exp.f(n));
    const ys2 = exp.g ? ns.map((n) => exp.g(n)) : null;
    const W = 640;
    const Hh = 240;
    const max = Math.max(1, ...ys, ...(ys2 || []));
    const bw = (W - 60) / ns.length;
    const svg = s('svg', { viewBox: `0 0 ${W} ${Hh + 40}`, width: '100%', style: { maxWidth: W + 'px' }, role: 'img', 'aria-label': `${exp.label}: counts ${ys.join(', ')} for n = ${ns[0]}..${ns[ns.length - 1]}` });
    svg.append(s('line', { class: 'chart-axis', x1: 40, y1: Hh, x2: W - 10, y2: Hh }), s('line', { class: 'chart-axis', x1: 40, y1: 10, x2: 40, y2: Hh }), s('text', { class: 'chart-txt', x: 4, y: 16 }, String(max)), s('text', { class: 'chart-txt', x: 30, y: Hh }, '0'));
    ns.forEach((n, i) => {
      const x = 44 + i * bw;
      const hh = (ys[i] / max) * (Hh - 20);
      svg.append(s('rect', { class: 'chart-bar', rx: 2, x, y: Hh - hh, width: ys2 ? bw * 0.42 : bw * 0.8, height: hh }));
      if (ys2) {
        const h2 = (ys2[i] / max) * (Hh - 20);
        svg.append(s('rect', { class: 'chart-bar b', rx: 2, x: x + bw * 0.44, y: Hh - h2, width: bw * 0.42, height: h2 }));
      }
      if (ns.length <= 14 || i % 2 === 0) svg.append(s('text', { class: 'chart-txt', x: x + bw * 0.4, y: Hh + 14, 'text-anchor': 'middle' }, String(n)));
    });
    svg.append(s('text', { class: 'chart-txt', x: W / 2, y: Hh + 32, 'text-anchor': 'middle' }, 'n'));
    const k = Math.max(lo, Math.floor(N / 2));
    const r = exp.f(2 * k) / Math.max(1e-9, exp.f(k));
    const truth = exp.f(k) === exp.f(2 * k) ? 'same' : r < 2.6 ? 'double' : 'quad';
    const q = h('div', { class: 'task', style: { marginTop: '12px' } });
    const opts = [
      ['same', 'stays the same (constant)'],
      ['double', 'roughly doubles (linear)'],
      ['quad', 'roughly quadruples (quadratic)'],
    ];
    const fb = h('div', { 'aria-live': 'polite' });
    let answered = false;
    q.append(
      h('h2', {}, 'Predict from the chart'),
      h('p', { class: 'task-prompt' }, `For “${exp.label}”${exp.g ? ' (blue bars)' : ''}: when n doubles from ${k} to ${2 * k}, the ${exp.unit} …`),
      h(
        'div',
        { class: 'row' },
        opts.map(([v, l]) =>
          h('button', {
            class: 'btn',
            onclick: () => {
              const ok = v === truth;
              if (!answered) {
                answered = true;
                store.recordAttempt({ templateId: 'lab-' + exp.id, seed: k, concept: exp.concept, type: 'complexity', lecture: Number(exp.concept.slice(1, 3)) || 8, correct: ok, hints: 0, revealed: false, guidance: 'less', tag: ok ? null : 'growth-rate', message: `Lab ${exp.label}: chose “${l}”` });
              }
              clear(fb).append(h('div', { class: `feedback ${ok ? 'ok' : 'bad'}` }, h('b', { class: 'verdict' }, ok ? 'Correct.' : 'Not quite.'), `The count goes from ${exp.f(k)} to ${exp.f(2 * k)} (×${Number.isFinite(r) ? r.toFixed(2) : '—'}). Growth: ${exp.theta}. ${exp.assume}`));
            },
          }, l),
        ),
      ),
      fb,
    );
    clear(out).append(
      h('div', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h3', {}, `${exp.unit}${ys2 ? ` — blue: ${exp.id === 'stack-tail' ? 'tail version' : 'first'}, violet: ${exp.gLabel}` : ''}`), h('span', { class: 'pill' }, exp.theta)), svg, h('p', { class: 'small muted' }, `Assumption: ${exp.assume}`),
        h('table', { class: 'vars-table', style: { maxWidth: '420px' } }, h('tr', {}, h('td', {}, 'n'), h('td', {}, 'count'), ys2 ? h('td', {}, exp.gLabel) : null), [lo, Math.floor(N / 4), Math.floor(N / 2), N].filter((x, i, a) => x >= lo && a.indexOf(x) === i).map((n) => h('tr', {}, h('td', {}, String(n)), h('td', {}, String(exp.f(n))), ys2 ? h('td', {}, String(exp.g(n))) : null)))),
      q,
    );
  }
  draw();
  return root;
}
