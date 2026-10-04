// Free exploration: build structures, run operations, inspect nodes,
// edit pointers by hand, build trees and graphs.
import { h, clear, toast } from '../ui/dom.js';
import { createWorkspace } from '../ui/workspace.js';
import { createRewireEditor } from '../ui/rewire.js';
import { renderList } from '../ui/render/list.js';
import { renderTree, renderGraph } from '../ui/render/treegraph.js';
import { renderMatrixRO, renderAdjList, renderArrayStack, renderArrayQueue } from '../ui/render/arrays.js';
import { OPS, GRAPHS, chain } from '../sim/specs.js';
import * as PW from '../core/pointerWorld.js';
import * as CSLL from '../core/csll.js';
import * as SQ from '../core/stackQueue.js';
import * as T from '../core/tree.js';
import * as G from '../core/graph.js';
import { problems } from '../core/invariants.js';

const STRUCTS = [
  { id: 'sll', label: 'Singly linked list', ref: 'Lec 08–09' },
  { id: 'dll', label: 'Doubly linked list', ref: 'Lec 10' },
  { id: 'csll', label: 'Circular list', ref: 'Lec 11' },
  { id: 'astack', label: 'Array stack', ref: 'Lec 12' },
  { id: 'lstack-head', label: 'Linked stack (head)', ref: 'Supplementary' },
  { id: 'lstack-tail', label: 'Linked stack (tail, notes)', ref: 'Lec 12' },
  { id: 'aqueue', label: 'Array queue', ref: 'Lec 12' },
  { id: 'lqueue', label: 'Linked queue', ref: 'Lec 12' },
  { id: 'tree', label: 'Binary tree', ref: 'Lec 13–14' },
  { id: 'graph', label: 'Graph', ref: 'Lec 13–14' },
];

const LIST_OPS = {
  sll: [
    ['insertBeg', 'insert at beginning', 'v'],
    ['insertMid', 'insert at position (middle)', 'vp'],
    ['insertEnd', 'insert at end', 'v'],
    ['insertEndTail', 'insert at end using a tail pointer', 'v'],
    ['deleteBeg', 'delete at beginning', ''],
    ['deleteMid', 'delete at position (middle)', 'p'],
    ['deleteEnd', 'delete at end (corrected)', ''],
    ['deleteEndNotes', 'delete at end (exactly as in notes)', ''],
    ['deleteEndTail', 'delete at end with tail pointer', ''],
    ['traverse', 'traverse / display', ''],
  ],
  dll: [
    ['insertBeg', 'insert at beginning', 'v'],
    ['insertMid', 'insert at position (middle)', 'vp'],
    ['insertEnd', 'insert at end', 'v'],
    ['deleteBeg', 'delete at beginning (corrected)', ''],
    ['deleteBegNotes', 'delete at beginning (exactly as in notes)', ''],
    ['deleteMid', 'delete at position (middle)', 'p'],
    ['deleteEnd', 'delete at end (corrected)', ''],
    ['traverseFwd', 'traverse left → right', ''],
    ['traverseBwd', 'traverse right → left', ''],
    ['countnode', 'countnode (recursive)', ''],
  ],
  csll: [
    ['insertBeg', 'insert at beginning', 'v'],
    ['insertEnd', 'insert at end', 'v'],
    ['deleteBeg', 'delete at beginning', ''],
    ['deleteEnd', 'delete at end (corrected)', ''],
    ['traverse', 'traverse (do-while)', ''],
    ['traverseNullBug', 'WRONG traverse waiting for NULL', ''],
  ],
};

function parseVals(s) {
  return String(s)
    .split(/[^0-9-]+/)
    .filter(Boolean)
    .map(Number)
    .slice(0, 10);
}

export function exploreView(ctx, which) {
  const { store } = ctx;
  let struct = STRUCTS.find((x) => x.id === which) ? which : 'sll';
  const root = h('div');
  const tabs = h('div', { class: 'seg', role: 'toolbar', 'aria-label': 'Choose a structure' });
  const area = h('div', { style: { marginTop: '12px' } });
  let destroy = [];
  ctx.setCleanup(() => destroy.forEach((f) => f()));
  root.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Explore workspace'), h('div', { class: 'subtitle' }, 'Build a structure, run operations step by step, edit pointers by hand.')), h('span', { class: 'muted small' }, 'Free exploration — nothing here is graded.')), tabs, area);

  const drawTabs = () => {
    clear(tabs).append(STRUCTS.map((s) => h('button', { class: 'btn small', 'aria-pressed': String(s.id === struct), onclick: () => { struct = s.id; history.replaceState(null, '', `#/explore/${s.id}`); drawTabs(); drawArea(); } }, s.label)));
  };
  const drawArea = () => {
    destroy.forEach((f) => f());
    destroy = [];
    clear(area);
    let c;
    if (struct === 'sll' || struct === 'dll' || struct === 'csll') c = listExplorer(store, struct);
    else if (struct === 'tree') c = treeBuilder(store, { traverse: true });
    else if (struct === 'graph') c = graphEditor(store);
    else c = seqExplorer(store, struct);
    destroy.push(c.destroy);
    area.append(h('p', { class: 'small muted' }, `Based on ${STRUCTS.find((s) => s.id === struct).ref}.`), c.el);
  };
  drawTabs();
  drawArea();
  return root;
}

// ------------------------------------------------------------------ lists
function listExplorer(store, kind) {
  let world = kind === 'csll' ? CSLL.build([10, 20, 30]) : PW.buildList(kind, [10, 20, 30]);
  let ws = null;
  let mode = 'run'; // run | edit
  let inspected = null;
  const el = h('div');
  const controls = h('div', { class: 'panel' });
  const stage = h('div');
  el.append(controls, stage);

  const valsIn = h('input', { type: 'text', value: '10 20 30', 'aria-label': 'initial values', style: { width: '180px' } });
  const opSel = h('select', { 'aria-label': 'operation' }, LIST_OPS[kind].map(([id, label]) => h('option', { value: id }, label)));
  const vIn = h('input', { type: 'number', value: 15, 'aria-label': 'value', style: { width: '80px' } });
  const pIn = h('input', { type: 'number', value: 2, 'aria-label': 'position', style: { width: '70px' } });
  const vLab = h('label', { class: 'inline' }, 'value', vIn);
  const pLab = h('label', { class: 'inline' }, 'pos', pIn);
  const syncInputs = () => {
    const spec = LIST_OPS[kind].find((x) => x[0] === opSel.value)[2];
    vLab.style.display = spec.includes('v') ? '' : 'none';
    pLab.style.display = spec.includes('p') ? '' : 'none';
  };
  opSel.addEventListener('change', syncInputs);
  syncInputs();
  const predict = h('input', { type: 'checkbox', checked: !!store.data.settings.predictMode });

  controls.append(
    h('div', { class: 'row' }, h('label', { class: 'inline' }, 'Values', valsIn), h('button', { class: 'btn', onclick: () => { const v = parseVals(valsIn.value); world = kind === 'csll' ? CSLL.build(v) : PW.buildList(kind, v); ws = null; inspected = null; draw(); } }, 'Create list'), h('button', { class: 'btn ghost', onclick: () => { world = kind === 'csll' ? CSLL.build([]) : PW.buildList(kind, []); ws = null; draw(); } }, 'Empty list')),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'inline' }, 'Operation', opSel), vLab, pLab, h('button', { class: 'btn primary', onclick: run }, 'Run step by step'), h('label', { class: 'inline small' }, predict, 'ask me to predict'), h('span', { class: 'spacer' }), h('button', { class: 'btn', 'aria-pressed': 'false', onclick: (e) => { mode = mode === 'edit' ? 'run' : 'edit'; e.target.setAttribute('aria-pressed', String(mode === 'edit')); draw(); } }, 'Edit pointers by hand')),
  );

  function run() {
    const op = opSel.value;
    const spec = LIST_OPS[kind].find((x) => x[0] === op)[2];
    const args = [];
    if (spec.includes('v')) args.push(Number(vIn.value));
    if (spec.includes('p')) args.push(Number(pIn.value));
    const tr = OPS[kind][op](PW.clone(world), ...args);
    if (ws) ws.destroy();
    ws = createWorkspace(tr, { predictKinds: predict.checked ? ['link', 'var', 'free', 'output'] : null, settings: store.data.settings });
    world = PW.clone(tr.final);
    if (op.endsWith('Notes')) PW.sweepFreed(world);
    mode = 'run';
    draw();
    ws.el.focus();
  }

  function draw() {
    clear(stage);
    if (mode === 'edit') {
      const diag = h('div');
      const ew = PW.clone(world);
      ew.globals = ew.globals || [ew.varOrder[0]];
      for (const v of ['temp', 'prev', 'newnode']) if (!(v in ew.vars)) PW.addVar(ew, v, null);
      const ed = createRewireEditor({
        world: ew,
        newValue: Number(vIn.value),
        allowValueInput: true,
        onChange: () => showProblems(),
      });
      // give the sandbox the usual helper variables
      const showProblems = () => {
        const w = ed.world();
        const ps = problems(w, { ignoreVars: ['temp', 'prev', 'newnode'] });
        clear(diag).append(
          h('h3', {}, 'Diagnosis of the current pointers'),
          ps.length ? h('ul', {}, ps.map((p) => h('li', {}, p.message))) : h('p', { class: 'small', style: { color: 'var(--ok)' } }, 'No problems found: every node is reachable, nothing dangles, links are consistent.'),
          h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { world = PW.clone(ed.world()); PW.sweepFreed(world); for (const v of ['temp', 'prev', 'newnode']) PW.dropVar(world, v); mode = 'run'; draw(); toast('Saved as the current list'); } }, 'Use this as the current list'), h('button', { class: 'btn ghost', onclick: () => { mode = 'run'; draw(); } }, 'Cancel')),
        );
      };
      stage.append(h('div', { class: 'panel', style: { marginTop: '12px' } }, h('h2', {}, 'Manual pointer editing'), h('p', { class: 'small muted' }, 'Every change is an action you can undo. Unreachable nodes are flagged orange, freed nodes red.'), ed.el, diag));
      showProblems();
      return;
    }
    if (ws) stage.append(ws.el);
    // inspector on the current list
    const ins = h('div', { class: 'panel', style: { marginTop: '12px' } });
    const node = inspected != null ? world.nodes[inspected] : null;
    ins.append(
      h('div', { class: 'panel-title' }, h('h3', {}, ws ? 'Current list after the operation — click a node to inspect it' : 'Current list — click a node to inspect it')),
      h('div', { class: 'diagram-box' }, renderList(world, { clickable: { onNode: (a) => { inspected = a; draw(); }, picked: inspected != null ? [inspected] : [] } })),
      node
        ? h(
            'table',
            { class: 'vars-table', style: { marginTop: '8px', maxWidth: '560px' } },
            h('tr', {}, h('td', {}, 'address'), h('td', {}, String(node.addr), h('span', { class: 'muted' }, '  (where the node lives — what pointers store)'))),
            h('tr', {}, h('td', {}, 'data'), h('td', {}, String(node.data), h('span', { class: 'muted' }, '  (the value inside the node)'))),
            PW.fieldsOf(kind).map((f) => h('tr', {}, h('td', {}, f), h('td', {}, PW.fmtPtr(node[f]), typeof node[f] === 'number' ? h('span', { class: 'muted' }, `  → node ${world.nodes[node[f]]?.data}`) : null))),
            h('tr', {}, h('td', {}, 'pointed to by'), h('td', {}, PW.pointersTo(world, node.addr).map((p) => (p.type === 'var' ? p.name : `${p.addr}->${p.field}`)).join(', ') || 'nothing')),
          )
        : null,
    );
    stage.append(ins);
  }
  draw();
  return { el, destroy: () => ws && ws.destroy() };
}

// ------------------------------------------------------------------ stacks & queues
function seqExplorer(store, kind) {
  const el = h('div');
  const isQ = kind.includes('queue');
  const MAXin = h('input', { type: 'number', value: 5, min: 1, max: 10, 'aria-label': 'MAX', style: { width: '70px' } });
  const convSel = h('select', { 'aria-label': 'convention' }, kind === 'astack' ? [h('option', { value: 'notes' }, 'top = next free slot (notes)'), h('option', { value: 'index' }, 'top = index of top item')] : [h('option', { value: 'linear' }, 'linear (notes)'), h('option', { value: 'circular' }, 'circular (supplementary)')]);
  let state = fresh();
  let ws = null;
  const vIn = h('input', { type: 'number', value: 11, 'aria-label': 'value', style: { width: '80px' } });
  const stage = h('div');
  function fresh() {
    if (kind === 'astack') return SQ.arrayStack(Number(MAXin?.value || 5), convSel?.value || 'notes');
    if (kind === 'aqueue') return SQ.arrayQueue(Number(MAXin?.value || 5), convSel?.value || 'linear');
    if (kind === 'lstack-head') return SQ.linkedStackHead();
    if (kind === 'lstack-tail') return SQ.linkedStackTail();
    return SQ.linkedQueue();
  }
  const run = (op) => {
    const tr = chain(kind, [{ op, x: Number(vIn.value) }], { state });
    state = tr.final;
    if (ws) ws.destroy();
    ws = createWorkspace(tr, { settings: store.data.settings });
    vIn.value = Number(vIn.value) + 11;
    clear(stage).append(ws.el);
  };
  const isArr = kind === 'astack' || kind === 'aqueue';
  el.append(
    h(
      'div',
      { class: 'panel' },
      isArr ? h('div', { class: 'row' }, h('label', { class: 'inline' }, 'MAX', MAXin), convSel, h('button', { class: 'btn', onclick: () => { state = fresh(); ws = null; clear(stage).append(h('div', { class: 'diagram-box' }, isQ ? renderArrayQueue(state) : renderArrayStack(state))); } }, 'New empty structure')) : h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { state = fresh(); clear(stage); } }, 'New empty structure')),
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'inline' }, 'value', vIn), isQ ? [h('button', { class: 'btn primary', onclick: () => run('enqueue') }, 'enqueue'), h('button', { class: 'btn', onclick: () => run('dequeue') }, 'dequeue')] : [h('button', { class: 'btn primary', onclick: () => run('push') }, 'push'), h('button', { class: 'btn', onclick: () => run('pop') }, 'pop'), kind === 'astack' ? h('button', { class: 'btn', onclick: () => run('peek') }, 'peek') : null]),
      h('p', { class: 'small muted' }, isQ ? 'front/F is where items leave; rear/R is where they enter.' : 'Try pushing past MAX (overflow) and popping an empty stack (underflow).'),
    ),
    stage,
  );
  if (isArr) stage.append(h('div', { class: 'diagram-box' }, isQ ? renderArrayQueue(state) : renderArrayStack(state)));
  return { el, destroy: () => ws && ws.destroy() };
}

// ------------------------------------------------------------------ tree builder
export function treeBuilder(store, { traverse = true } = {}) {
  let t = T.LECTURE_TREE();
  let sel = null;
  let bst = false;
  let ws = null;
  const el = h('div');
  const nextLabel = () => {
    const used = new Set(T.ids(t));
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!used.has(c)) return c;
    return 'Z' + used.size;
  };
  const labIn = h('input', { type: 'text', value: nextLabel(), 'aria-label': 'label for a new node', style: { width: '70px' } });
  const top = h('div', { class: 'panel' });
  const canvas = h('div', { class: 'diagram-box', style: { marginTop: '8px' } });
  const info = h('div', { class: 'grid-2', style: { marginTop: '8px' } });
  const stage = h('div');
  el.append(top, canvas, info, stage);

  const add = (p, side) => {
    const label = labIn.value.trim();
    if (!label) return toast('Type a label first.');
    try {
      T.addChild(t, p, side, label);
      labIn.value = nextLabel();
      draw();
    } catch (e) {
      toast(e.message);
    }
  };
  const bstInsert = () => {
    const v = labIn.value.trim();
    if (!v) return;
    const less = (a, b) => (!Number.isNaN(Number(a)) && !Number.isNaN(Number(b)) ? Number(a) < Number(b) : a < b);
    try {
      if (!t.root) T.addChild(t, null, null, v);
      else {
        let cur = t.root;
        while (true) {
          if (cur === v) throw new Error(`${v} is already in the tree`);
          const side = less(v, cur) ? 'left' : 'right';
          if (!t.nodes[cur][side]) {
            T.addChild(t, cur, side, v);
            break;
          }
          cur = t.nodes[cur][side];
        }
      }
      labIn.value = '';
      draw();
    } catch (e) {
      toast(e.message);
    }
  };

  function draw() {
    clear(top).append(
      h(
        'div',
        { class: 'row' },
        h('label', { class: 'inline' }, 'New node label', labIn),
        bst ? h('button', { class: 'btn primary', onclick: bstInsert }, 'BST insert') : h('button', { class: 'btn', disabled: !!t.root, onclick: () => add(null, null) }, 'Add as root'),
        h('button', { class: 'btn ghost', onclick: () => { t = T.emptyTree(); sel = null; labIn.value = bst ? '' : 'A'; draw(); } }, 'Clear'),
        h('button', { class: 'btn ghost', onclick: () => { t = T.LECTURE_TREE(); sel = null; labIn.value = nextLabel(); draw(); } }, 'Lecture tree A–G'),
        h('span', { class: 'spacer' }),
        h('label', { class: 'inline small' }, h('input', { type: 'checkbox', checked: bst, onchange: (e) => { bst = e.target.checked; t = T.emptyTree(); sel = null; labIn.value = bst ? '50' : 'A'; draw(); } }), 'BST mode (supplementary)'),
      ),
      h('p', { class: 'kbd-help', style: { margin: '6px 0 0' } }, bst ? 'Supplementary — binary SEARCH trees are not in Lectures 13–14. Smaller values go left, larger go right; inorder then prints them sorted.' : 'Click a dashed + to add the labelled node there (Tab + Enter works too). Click a node to select it.'),
    );
    clear(canvas).append(renderTree(t, { addButtons: bst ? null : { onAdd: add }, onNode: (id) => { sel = id; draw(); }, mark: sel ? [sel] : [], levels: true, showArray: 0 }));
    const c = T.classify(t);
    clear(info).append(
      h(
        'div',
        { class: 'panel' },
        h('h3', {}, 'Whole tree'),
        h(
          'table',
          { class: 'vars-table' },
          h('tr', {}, h('td', {}, 'nodes n'), h('td', {}, String(T.size(t)))),
          h('tr', {}, h('td', {}, 'edges'), h('td', {}, `${T.edgesOfTree(T.size(t))} (= n − 1)`)),
          h('tr', {}, h('td', {}, 'height'), h('td', {}, `${T.height(t)} (edges; root = level 0)`)),
          h('tr', {}, h('td', {}, 'leaves'), h('td', {}, T.leaves(t).join(', ') || '—')),
          h('tr', {}, h('td', {}, 'strictly binary'), h('td', {}, c.strict ? 'yes (books: “full/proper”)' : 'no')),
          h('tr', {}, h('td', {}, '“full” (notes)'), h('td', {}, c.perfect ? 'yes (books: “perfect”)' : 'no')),
          h('tr', {}, h('td', {}, 'complete'), h('td', {}, c.complete ? 'yes' : 'no')),
          h('tr', {}, h('td', {}, 'array (0-based)'), h('td', {}, '[' + T.toArray(t, 0).map((x) => x ?? '—').join(', ') + ']')),
          h('tr', {}, h('td', {}, 'preorder'), h('td', {}, T.preorder(t).join(' '))),
          h('tr', {}, h('td', {}, 'inorder'), h('td', {}, T.inorder(t).join(' '))),
          h('tr', {}, h('td', {}, 'postorder'), h('td', {}, T.postorder(t).join(' '))),
        ),
      ),
      h(
        'div',
        { class: 'panel' },
        h('h3', {}, sel ? `Selected node ${sel}` : 'Select a node'),
        sel && t.nodes[sel]
          ? [
              h(
                'table',
                { class: 'vars-table' },
                h('tr', {}, h('td', {}, 'parent'), h('td', {}, T.parentOf(t, sel) ?? 'none (root)')),
                h('tr', {}, h('td', {}, 'children'), h('td', {}, T.children(t, sel).join(', ') || 'none (leaf)')),
                h('tr', {}, h('td', {}, 'siblings'), h('td', {}, T.siblings(t, sel).join(', ') || 'none')),
                h('tr', {}, h('td', {}, 'ancestors'), h('td', {}, T.ancestors(t, sel).join(', ') || 'none')),
                h('tr', {}, h('td', {}, 'descendants'), h('td', {}, T.descendants(t, sel).join(', ') || 'none')),
                h('tr', {}, h('td', {}, 'subtree'), h('td', {}, T.subtree(t, sel).join(', '))),
                h('tr', {}, h('td', {}, 'level'), h('td', {}, String(T.level(t, sel)))),
                h('tr', {}, h('td', {}, 'depth (notes: nodes on path)'), h('td', {}, String(T.depthNotes(t, sel)))),
                h('tr', {}, h('td', {}, 'array index'), h('td', {}, `${T.arrayIndexOf(t, sel, 0)} (0-based) · ${T.arrayIndexOf(t, sel, 1)} (1-based)`)),
              ),
              h('button', { class: 'btn small danger', style: { marginTop: '6px' }, onclick: () => { T.removeSubtree(t, sel); sel = null; draw(); } }, `Remove ${sel} and its subtree`),
            ]
          : h('p', { class: 'small muted' }, 'Parents, siblings, ancestors, subtrees and levels appear here.'),
      ),
    );
    if (traverse) {
      clear(stage).append(
        h('div', { class: 'row', style: { marginTop: '12px' } }, h('b', {}, 'Traverse this tree:'), ['preorder', 'inorder', 'postorder'].map((o) => h('button', { class: 'btn', disabled: !t.root, onclick: () => runTrav(o) }, o)), h('button', { class: 'btn', disabled: !t.root, onclick: () => runTrav('inorderStack') }, 'inorder with explicit stack')),
      );
      if (ws) stage.append(ws.el);
    }
  }
  function runTrav(o) {
    if (ws) ws.destroy();
    const tr = o === 'inorderStack' ? T.traceInorderStack(t) : T.traceTraversal(t, o);
    ws = createWorkspace(tr, { predictKinds: ['output'], predictOn: false, settings: store.data.settings });
    draw();
  }
  draw();
  return { el, destroy: () => ws && ws.destroy() };
}

// ------------------------------------------------------------------ graph editor
export function graphEditor(store) {
  let g = G.lec14Graph();
  let first = null;
  let ws = null;
  const el = h('div');
  const top = h('div', { class: 'panel' });
  const canvas = h('div', { class: 'diagram-box' });
  const reps = h('div', { class: 'panel' });
  const runP = h('div', { class: 'panel', style: { marginTop: '12px' } });
  const stage = h('div');
  el.append(top, h('div', { class: 'grid-2', style: { marginTop: '12px' } }, h('div', {}, canvas, h('p', { class: 'kbd-help' }, 'Click two vertices to add/remove the edge between them (same vertex twice = self-loop). Vertices are focusable: Tab + Enter.')), reps), runP, stage);

  const vIn = h('input', { type: 'text', 'aria-label': 'new vertex label', style: { width: '70px' } });
  const wIn = h('input', { type: 'number', value: 1, 'aria-label': 'weight for new edges', style: { width: '70px' } });

  function toggleEdge(u, v) {
    try {
      if (G.hasEdge(g, u, v)) G.removeEdge(g, u, v);
      else G.addEdge(g, u, v, Number(wIn.value) || 1);
    } catch (e) {
      toast(e.message);
    }
  }
  function draw() {
    clear(top).append(
      h(
        'div',
        { class: 'row' },
        h('label', { class: 'inline' }, 'Example', h('select', { onchange: (e) => { g = GRAPHS[e.target.value](); first = null; draw(); } }, [['lec14', 'Lec 14 p.4 (a–i)'], ['lec13directed', 'Lec 13 p.6 directed'], ['lec13weighted', 'Lec 13 p.6 weighted'], ['lec13loop', 'Lec 13 p.6 with self-loop'], ['disconnected', 'Disconnected + self-loop']].map(([k, l]) => h('option', { value: k }, l)))),
        h('button', { class: 'btn ghost', onclick: () => { g = G.createGraph({ directed: g.directed, weighted: g.weighted }); first = null; draw(); } }, 'Empty graph'),
        h('label', { class: 'inline small' }, h('input', { type: 'checkbox', checked: g.directed, onchange: (e) => { g.directed = e.target.checked; draw(); } }), 'directed'),
        h('label', { class: 'inline small' }, h('input', { type: 'checkbox', checked: g.weighted, onchange: (e) => { g.weighted = e.target.checked; draw(); } }), 'weighted'),
      ),
      h(
        'div',
        { class: 'row', style: { marginTop: '8px' } },
        h('label', { class: 'inline' }, 'Vertex', vIn),
        h('button', { class: 'btn', onclick: () => { const v = vIn.value.trim(); if (!v) return; try { G.addVertex(g, v); G.ensureLayout(g); vIn.value = ''; draw(); } catch (e) { toast(e.message); } } }, 'Add vertex'),
        h('select', { 'aria-label': 'vertex to remove', id: 'rmv' }, g.vertices.map((v) => h('option', { value: v }, v))),
        h('button', { class: 'btn ghost', onclick: () => { const v = top.querySelector('#rmv').value; if (v) { G.removeVertex(g, v); draw(); } } }, 'Remove vertex'),
        g.weighted ? h('label', { class: 'inline' }, 'weight', wIn) : null,
      ),
    );
    clear(canvas).append(renderGraph(g, { onNode: (v) => { if (!first) first = v; else { toggleEdge(first, v); first = null; } draw(); }, picked: first ? [first] : [] }));
    const m = G.matrix(g);
    clear(reps).append(h('h3', {}, 'Adjacency matrix (rows = from)'), m.labels.length ? renderMatrixRO(m) : h('p', { class: 'muted small' }, 'No vertices.'), h('h3', { style: { marginTop: '10px' } }, 'Adjacency list (ascending order)'), renderAdjList({ list: G.adjList(g) }), h('p', { class: 'small muted' }, `V = ${g.vertices.length}, E = ${g.edges.length}. Matrix space Θ(V²) = ${g.vertices.length ** 2} cells; list space Θ(V + E).`));
    const startSel = h('select', { 'aria-label': 'start vertex' }, G.sortedVertices(g).map((v) => h('option', { value: v }, v)));
    const orderSel = h('select', { 'aria-label': 'neighbour order' }, h('option', { value: 'alpha' }, 'ascending'), h('option', { value: 'insertion' }, 'edge insertion order'));
    const repSel = h('select', { 'aria-label': 'representation' }, h('option', { value: 'list' }, 'adjacency list'), h('option', { value: 'matrix' }, 'adjacency matrix'));
    const all = h('input', { type: 'checkbox' });
    const run = (kind) => {
      if (!g.vertices.length) return;
      if (ws) ws.destroy();
      const o = { order: orderSel.value, rep: repSel.value, all: all.checked };
      const tr = kind === 'bfs' ? G.traceBFS(g, startSel.value, o) : G.traceDFS(g, startSel.value, o);
      ws = createWorkspace(tr, { predictKinds: ['discover', 'output'], predictOn: false, settings: store.data.settings });
      clear(stage).append(ws.el);
    };
    clear(runP).append(
      h('div', { class: 'row' }, h('b', {}, 'Traverse:'), h('label', { class: 'inline' }, 'start', startSel), h('label', { class: 'inline' }, 'neighbour order', orderSel), h('label', { class: 'inline' }, 'stored as', repSel), h('label', { class: 'inline small' }, all, 'whole graph (restart at undiscovered vertices)'), h('button', { class: 'btn primary', onclick: () => run('bfs') }, 'Run BFS'), h('button', { class: 'btn primary', onclick: () => run('dfs') }, 'Run DFS')),
      g.weighted ? h('p', { class: 'small muted' }, 'BFS and DFS ignore weights: BFS finds paths with the fewest EDGES, not the smallest total weight.') : null,
    );
  }
  draw();
  return { el, destroy: () => ws && ws.destroy() };
}
