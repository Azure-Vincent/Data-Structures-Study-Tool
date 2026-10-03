// Turns a small, serialisable description ("spec") into a full trace.
// Used by lessons, exercise solutions and the exploration workspace.
import * as PW from '../core/pointerWorld.js';
import * as SLL from '../core/sll.js';
import * as DLL from '../core/dll.js';
import * as CSLL from '../core/csll.js';
import * as SQ from '../core/stackQueue.js';
import * as T from '../core/tree.js';
import * as G from '../core/graph.js';
import { runLines } from '../core/interp.js';

export const OPS = {
  sll: { insertBeg: SLL.insertBeg, insertEnd: SLL.insertEnd, insertMid: SLL.insertMid, insertEndTail: SLL.insertEndTail, deleteBeg: SLL.deleteBeg, deleteEnd: SLL.deleteEnd, deleteEndNotes: (w) => SLL.deleteEnd(w, { notesVersion: true }), deleteEndTail: SLL.deleteEndTail, deleteMid: SLL.deleteMid, traverse: SLL.traverse, createList: (w, vals) => SLL.createList(vals, { detail: false }) },
  dll: { insertBeg: DLL.insertBeg, insertEnd: DLL.insertEnd, insertMid: DLL.insertMid, deleteBeg: DLL.deleteBeg, deleteBegNotes: (w) => DLL.deleteBeg(w, { notesVersion: true }), deleteEnd: DLL.deleteEnd, deleteMid: DLL.deleteMid, traverseFwd: DLL.traverseFwd, traverseBwd: DLL.traverseBwd, countnode: DLL.countnode },
  csll: { insertBeg: CSLL.insertBeg, insertEnd: CSLL.insertEnd, deleteBeg: CSLL.deleteBeg, deleteEnd: CSLL.deleteEnd, traverse: CSLL.traverse, traverseNullBug: CSLL.traverseNullBug },
};

export const GRAPHS = {
  lec14: G.lec14Graph,
  lec13directed: G.lec13Directed,
  lec13weighted: G.lec13Weighted,
  lec13loop: G.lec13SelfLoop,
  disconnected: () => {
    const g = G.fromEdgeList(['A', 'B', 'C', 'D', 'E', 'F', 'G'], [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'E'], ['F', 'D']]);
    g.pos = { A: [0.12, 0.25], B: [0.35, 0.1], C: [0.3, 0.45], D: [0.62, 0.3], E: [0.85, 0.15], F: [0.75, 0.6], G: [0.2, 0.85] };
    return g;
  },
};

export function worldFromSetup(struct, setup = {}) {
  if (setup.world) return PW.clone(setup.world);
  const vals = setup.values || [];
  if (struct === 'csll') return CSLL.build(vals);
  const w = PW.buildList(struct, vals);
  if (setup.vars) for (const [k, v] of Object.entries(setup.vars)) PW.addVar(w, k, typeof v === 'number' && v > 0 && v < 50 ? PW.walk(w, w.vars.start, PW.forwardField(w.kind)).addrs[v - 1] ?? null : v);
  return w;
}

function seqStart(struct, setup) {
  switch (struct) {
    case 'astack':
      return SQ.arrayStack(setup.MAX || 5, setup.conv || 'notes');
    case 'aqueue':
      return SQ.arrayQueue(setup.MAX || 5, setup.mode || 'linear');
    case 'lstack-head':
      return SQ.linkedStackHead();
    case 'lstack-tail':
      return SQ.linkedStackTail();
    case 'lqueue':
      return SQ.linkedQueue();
    default:
      throw new Error('bad struct ' + struct);
  }
}

function applySeq(struct, s, o) {
  const kind = struct === 'astack' ? 'astack' : struct === 'aqueue' ? 'aqueue' : struct;
  if (struct === 'astack') return o.op === 'push' ? SQ.astackPush(s, o.x) : o.op === 'peek' ? SQ.astackPeek(s) : SQ.astackPop(s);
  if (struct === 'aqueue') return o.op === 'enqueue' ? SQ.aqueueEnqueue(s, o.x) : SQ.aqueueDequeue(s);
  return SQ.applyOp(kind, s, { op: o.op, x: o.x });
}

/** Concatenate the traces of several operations into one replayable trace. */
export function chain(struct, ops, setup = {}) {
  let state = setup.state ? JSON.parse(JSON.stringify(setup.state)) : seqStart(struct, setup);
  if (setup.prefill) for (const o of setup.prefill) state = applySeq(struct, state, o).final;
  const steps = [];
  const counters = {};
  const output = [];
  let first = null;
  ops.forEach((o, k) => {
    const tr = applySeq(struct, state, o);
    if (!first) first = tr.code;
    tr.steps.forEach((s, i) => {
      if (i === 0 && k > 0) return;
      const base = {};
      for (const [c, v] of Object.entries(counters)) base[c] = v;
      steps.push({ ...s, code: tr.code, opLabel: `${o.op}${o.x !== undefined ? '(' + o.x + ')' : '()'}`, counters: sumCounters(base, s.counters), output: [...output, ...s.output] });
    });
    for (const [c, v] of Object.entries(tr.counters)) counters[c] = (counters[c] || 0) + v;
    output.push(...tr.output);
    state = tr.final;
  });
  if (!steps.length) steps.push({ line: -1, kind: 'start', explain: 'Nothing to run.', hl: {}, state, counters: {}, output: [] });
  return { code: first || { title: struct, lines: [] }, steps, final: state, counters, output };
}

function sumCounters(a, b) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = (o[k] || 0) + v;
  return o;
}

export function treeFrom(spec) {
  if (!spec || spec === 'lecture') return T.LECTURE_TREE();
  if (spec.nodes) return T.clone(spec);
  return T.fromSpec(spec);
}

export function graphFrom(g) {
  if (typeof g === 'string') return GRAPHS[g]();
  return G.ensureLayout(G.clone(g));
}

/** Build a trace from a spec. */
export function buildTrace(spec) {
  const s = spec;
  if (s.struct === 'sll' || s.struct === 'dll' || s.struct === 'csll') {
    const w = s.world ? PW.clone(s.world) : worldFromSetup(s.struct, s.setup);
    const fn = OPS[s.struct][s.op];
    if (!fn) throw new Error(`No op ${s.op} for ${s.struct}`);
    return fn(w, ...(s.args || []));
  }
  if (s.struct === 'code') {
    const w = s.world ? PW.clone(s.world) : worldFromSetup(s.kind || 'sll', s.setup);
    return runLines(w, s.lines, { title: s.title, newValue: s.newValue, ref: s.ref });
  }
  if (['astack', 'aqueue', 'lstack-head', 'lstack-tail', 'lqueue'].includes(s.struct)) return chain(s.struct, s.ops || [], s.setup || {});
  if (s.struct === 'lqueue1') {
    // single op on a given linked queue world (exercise solutions)
    return s.op === 'enqueue' ? SQ.lqueueEnqueue(s.world, s.args[0]) : SQ.lqueueDequeue(s.world);
  }
  if (s.struct === 'tree') {
    const t = treeFrom(s.tree);
    if (s.op === 'inorderStack') return T.traceInorderStack(t);
    return T.traceTraversal(t, s.op);
  }
  if (s.struct === 'graph') {
    const g = graphFrom(s.graph);
    const o = { order: s.order || 'alpha', rep: s.rep || 'list', all: !!s.all };
    return s.op === 'dfs' ? G.traceDFS(g, s.start, o) : G.traceBFS(g, s.start, o);
  }
  if (s.struct === 'lqueue' && s.world) return s.op === 'enqueue' ? SQ.lqueueEnqueue(s.world, s.args[0]) : SQ.lqueueDequeue(s.world);
  throw new Error('Unknown spec ' + JSON.stringify(spec).slice(0, 80));
}

/** Normalise exercise "solutionTrace" objects to specs. */
export function solutionSpec(st) {
  if (!st) return null;
  if (st.struct === 'lqueue') return { struct: 'lqueue1', op: st.op, world: st.world, args: st.args };
  if (st.struct === 'tree') return { struct: 'tree', op: st.op, tree: st.tree };
  if (st.struct === 'graph') return { struct: 'graph', op: st.op, graph: st.graph, start: st.start, all: st.all };
  return { struct: st.struct, op: st.op, world: st.world, args: st.args };
}
