// Structures the Pseudocode Lab can simulate, and builders for their initial
// state. Pure data + functions (no DOM).
import * as G from '../core/graph.js';

/**
 * fields:  link fields every node of this structure has (besides `data`)
 * aliases: other names accepted for a field (stored under the canonical name)
 * roots:   the pointer variables that hold the structure
 */
export const STRUCTURES = {
  sll: { id: 'sll', label: 'Singly linked list', fields: ['next'], aliases: {}, roots: ['start'], forward: 'next', render: 'list', listKind: 'sll', lecture: 8, valuesHelp: 'Values from the first node, e.g. 10 20 30 (leave empty for an empty list).' },
  dll: { id: 'dll', label: 'Doubly linked list', fields: ['left', 'right'], aliases: { prev: 'left', next: 'right' }, roots: ['start'], forward: 'right', back: 'left', render: 'list', listKind: 'dll', lecture: 10, valuesHelp: 'Values from the first node, e.g. 10 20 30.' },
  csll: { id: 'csll', label: 'Circular linked list', fields: ['next'], aliases: {}, roots: ['start'], forward: 'next', circular: true, render: 'list', listKind: 'csll', lecture: 11, valuesHelp: 'Values from start, e.g. 10 20 30 — the last node links back to start.' },
  stack: { id: 'stack', label: 'Stack (linked)', fields: ['next'], aliases: {}, roots: ['top'], forward: 'next', render: 'list', listKind: 'sll', lecture: 12, valuesHelp: 'Values from the top down, e.g. 30 20 10 (30 is on top).' },
  queue: { id: 'queue', label: 'Queue (linked)', fields: ['next'], aliases: {}, roots: ['front', 'rear'], forward: 'next', render: 'list', listKind: 'sll', lecture: 12, valuesHelp: 'Values from front to rear, e.g. 10 20 30 (10 leaves first).' },
  tree: { id: 'tree', label: 'Binary tree', fields: ['left', 'right'], aliases: {}, roots: ['root'], render: 'tree', lecture: 13, valuesHelp: 'Level order with - for an empty spot, e.g. A B C D E - G or 50 30 70 20 40 60 80.' },
  graph: { id: 'graph', label: 'Graph', fields: ['next'], aliases: {}, roots: [], render: 'graph', lecture: 14, valuesHelp: 'Choose one of the lecture graphs. G is the graph, s the start vertex.' },
  // no starting nodes: for programs that work with arrays (Lec 07, the array stack and queue of Lec 12)
  arrays: { id: 'arrays', label: 'Arrays only (no nodes)', fields: ['next'], aliases: {}, roots: [], render: 'none', lecture: 7, valuesHelp: 'Nothing is set up: the program creates its own arrays with new Array(n).' },
};

export const STRUCTURE_ORDER = ['sll', 'dll', 'csll', 'stack', 'queue', 'tree', 'graph', 'arrays'];

export const GRAPH_EXAMPLES = {
  lec14: { label: 'Lecture 14 graph (a–i)', make: G.lec14Graph, start: 'a' },
  weighted: { label: 'Lecture 13 weighted graph (A–G)', make: G.lec13Weighted, start: 'A' },
  directed: { label: 'Lecture 13 directed graph (1–5)', make: G.lec13Directed, start: '1' },
  disconnected: {
    label: 'Two components (A–G)',
    make: () => {
      const g = G.fromEdgeList(['A', 'B', 'C', 'D', 'E', 'F', 'G'], [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['F', 'D'], ['C', 'G']]);
      g.pos = { A: [0.12, 0.25], B: [0.38, 0.1], C: [0.3, 0.5], D: [0.66, 0.35], E: [0.9, 0.15], F: [0.82, 0.7], G: [0.18, 0.85] };
      return g;
    },
    start: 'A',
  },
};

export const ADDR_START = 100;
export const ADDR_STEP = 100;

/** "10 20 30" / "10, 20, 30" → [10, 20, 30]; numbers stay numbers, '-' / NULL → null. */
export function parseValues(text) {
  return String(text || '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 31)
    .map((x) => (/^(-|null|nil|_)$/i.test(x) ? null : /^-?\d+(\.\d+)?$/.test(x) ? Number(x) : x));
}

export function freshState(structure) {
  return {
    structure,
    nodes: {},
    nextAddr: ADDR_START,
    frames: [{ fn: 'main', vars: {}, order: [], temps: [] }],
    colls: {},
    nextColl: 1,
    output: [],
    lastVertex: null,
  };
}

function newNode(st, S, data) {
  const addr = st.nextAddr;
  st.nextAddr += ADDR_STEP;
  const n = { addr, data, freed: false };
  for (const f of S.fields) n[f] = null;
  st.nodes[addr] = n;
  return addr;
}

function setGlobal(st, name, v) {
  const f = st.frames[0];
  if (!(name in f.vars)) f.order.push(name);
  f.vars[name] = v;
}

const ref = (a) => (a == null ? null : { ref: a });

/**
 * setup: { structure, values?: [...], graph?: key, vars?: {name: value} }
 * Returns { state, graph } — graph is the (read-only) graph object or null.
 */
export function buildInitial(setup) {
  const S = STRUCTURES[setup.structure] || STRUCTURES.sll;
  const st = freshState(S.id);
  let graph = null;
  const values = (setup.values || []).slice(0, 31);
  if (S.render === 'list') {
    const vals = values.filter((v) => v !== null);
    const addrs = vals.map((v) => newNode(st, S, v));
    addrs.forEach((a, i) => {
      if (i + 1 < addrs.length) st.nodes[a][S.forward] = addrs[i + 1];
      if (S.back && i > 0) st.nodes[a][S.back] = addrs[i - 1];
    });
    if (S.circular && addrs.length) st.nodes[addrs[addrs.length - 1]].next = addrs[0];
    setGlobal(st, S.roots[0], ref(addrs[0]));
    if (S.id === 'queue') setGlobal(st, 'rear', ref(addrs[addrs.length - 1]));
  } else if (S.render === 'tree') {
    // level order: children of index i are 2i+1 and 2i+2
    const addrs = values.map((v, i) => {
      if (v === null) return null;
      if (i > 0 && parentMissing(values, i)) return null;
      return newNode(st, S, v);
    });
    addrs.forEach((a, i) => {
      if (a == null) return;
      const l = addrs[2 * i + 1];
      const r = addrs[2 * i + 2];
      if (l != null) st.nodes[a].left = l;
      if (r != null) st.nodes[a].right = r;
    });
    setGlobal(st, 'root', ref(addrs[0] ?? null));
  } else if (S.render === 'graph') {
    const ex = GRAPH_EXAMPLES[setup.graph] || GRAPH_EXAMPLES.lec14;
    graph = G.ensureLayout(ex.make());
    setGlobal(st, 'G', { graph: true });
    setGlobal(st, 's', setup.vars && 's' in setup.vars ? setup.vars.s : ex.start);
  }
  for (const [k, v] of Object.entries(setup.vars || {})) if (!(k in st.frames[0].vars)) setGlobal(st, k, v);
  return { state: st, graph };
}

// a level-order slot only exists if its parent exists
function parentMissing(values, i) {
  let k = i;
  while (k > 0) {
    k = Math.floor((k - 1) / 2);
    if (values[k] === null || values[k] === undefined) return true;
  }
  return false;
}

/** Short human description of a setup, e.g. "start → 10 → 20 → 30". */
export function describeSetup(setup) {
  const S = STRUCTURES[setup.structure] || STRUCTURES.sll;
  const vals = (setup.values || []).filter((v) => v !== null);
  if (S.render === 'graph') {
    const ex = GRAPH_EXAMPLES[setup.graph] || GRAPH_EXAMPLES.lec14;
    return `${ex.label}, s = ${setup.vars?.s ?? ex.start}`;
  }
  if (S.render === 'none') return 'no nodes — only the arrays and variables the program creates';
  if (S.render === 'tree') return vals.length ? `tree (level order) ${setup.values.map((v) => (v === null ? '–' : v)).join(' ')}` : 'empty tree (root = NULL)';
  const root = S.roots[0];
  if (!vals.length) return S.id === 'queue' ? 'empty queue (front = rear = NULL)' : `empty (${root} = NULL)`;
  return `${root} → ${vals.join(' → ')}${S.circular ? ' → (back to start)' : ''}`;
}
