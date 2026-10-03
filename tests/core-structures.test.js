import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as SQ from '../app/js/core/stackQueue.js';
import * as T from '../app/js/core/tree.js';
import * as G from '../app/js/core/graph.js';
import { makeRng } from '../app/js/core/rng.js';

test('same input, stack vs queue removal order', () => {
  const ops = [{ op: 'push', x: 1 }, { op: 'push', x: 2 }, { op: 'push', x: 3 }, { op: 'pop' }, { op: 'push', x: 4 }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }];
  for (const k of ['astack', 'astack-index', 'lstack-head', 'lstack-tail']) assert.deepEqual(SQ.runOps(k, ops).removed, [3, 4, 2, 1], k);
  for (const k of ['aqueue', 'aqueue-circ', 'lqueue']) assert.deepEqual(SQ.runOps(k, ops).removed, [1, 2, 3, 4], k);
});

test('array stack: notes convention top = count; overflow and underflow', () => {
  let s = SQ.arrayStack(3, 'notes');
  assert.equal(s.top, 0);
  for (const x of [5, 6, 7]) s = SQ.astackPush(s, x).final;
  assert.equal(s.top, 3);
  const of = SQ.astackPush(s, 8);
  assert.equal(of.result.event, 'overflow');
  assert.equal(of.final.top, 3);
  const p = SQ.astackPop(s);
  assert.equal(p.result.value, 7);
  assert.equal(p.final.top, 2);
  let e = SQ.arrayStack(3, 'notes');
  assert.equal(SQ.astackPop(e).result.event, 'underflow');
  let i = SQ.arrayStack(3, 'index');
  assert.equal(i.top, -1);
  i = SQ.astackPush(i, 1).final;
  assert.equal(i.top, 0);
  assert.equal(SQ.astackPeek(i).result.value, 1);
});

test('linear array queue wastes slots; circular reuses them', () => {
  const ops = [1, 2, 3].map((x) => ({ op: 'enqueue', x })).concat([{ op: 'dequeue' }, { op: 'dequeue' }, { op: 'enqueue', x: 4 }]);
  const lin = SQ.runOps('aqueue', ops, 3);
  assert.deepEqual(lin.events.map((e) => e.event), ['overflow']);
  assert.equal(lin.final.F, 2);
  assert.equal(lin.final.R, 3);
  const circ = SQ.runOps('aqueue-circ', ops, 3);
  assert.deepEqual(circ.events, []);
  assert.deepEqual(SQ.contents('aqueue-circ', circ.final), [3, 4]);
});

test('linked queue: removing the final item resets rear', () => {
  let q = SQ.linkedQueue();
  q = SQ.lqueueEnqueue(q, 9).final;
  assert.equal(q.vars.front, q.vars.rear);
  const d = SQ.lqueueDequeue(q);
  assert.equal(d.result.value, 9);
  assert.equal(d.final.vars.front, null);
  assert.equal(d.final.vars.rear, null);
  assert.equal(SQ.lqueueDequeue(d.final).result.event, 'underflow');
});

test('linked stack at the tail pops in O(n), at the head in O(1)', () => {
  const pushes = Array.from({ length: 8 }, (_, i) => ({ op: 'push', x: i }));
  const tail = SQ.runOps('lstack-tail', [...pushes, { op: 'pop' }]);
  const head = SQ.runOps('lstack-head', [...pushes, { op: 'pop' }]);
  assert.equal(tail.counters.moves, 6); // walks to the node below top
  assert.equal(head.counters.moves || 0, 0);
});

test('lecture traversal tree A..G', () => {
  const t = T.LECTURE_TREE();
  assert.deepEqual(T.preorder(t), ['A', 'B', 'D', 'E', 'C', 'F', 'G']);
  assert.deepEqual(T.inorder(t), ['D', 'B', 'E', 'A', 'F', 'C', 'G']);
  assert.deepEqual(T.postorder(t), ['D', 'E', 'B', 'F', 'G', 'C', 'A']);
  for (const o of ['preorder', 'inorder', 'postorder']) {
    const tr = T.traceTraversal(t, o);
    assert.deepEqual(tr.result, T.ORDER_FNS[o](t));
    const entered = tr.steps.filter((s) => s.kind === 'enter').map((s) => s.hl.enter);
    assert.deepEqual(entered, T.preorder(t)); // every order ENTERS nodes in preorder
  }
  const st = T.traceInorderStack(t);
  assert.deepEqual(st.result, T.inorder(t));
  // stack picture: first 3 pushes are A, B, D
  assert.deepEqual(st.steps.filter((s) => s.kind === 'push').slice(0, 3).map((s) => s.hl.node), ['A', 'B', 'D']);
});

test('tree measures, classification and array representation', () => {
  const t = T.LECTURE_TREE();
  assert.equal(T.height(t), 2);
  assert.equal(T.level(t, 'D'), 2);
  assert.equal(T.depthNotes(t, 'D'), 3);
  assert.deepEqual(T.classify(t), { strict: true, perfect: true, complete: true });
  assert.deepEqual(T.toArray(t, 0), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.equal(T.arrayIndexOf(t, 'E', 0), 4);
  assert.equal(T.arrayIndexOf(t, 'E', 1), 5);
  assert.deepEqual(T.preorder(T.fromArray(T.toArray(t, 1), 1)), T.preorder(t));
  const u = T.fromSpec({ A: ['B', 'C'], B: [null, 'D'] });
  assert.deepEqual(T.classify(u), { strict: false, perfect: false, complete: false });
  const c = T.fromSpec({ A: ['B', 'C'], B: ['D', null] });
  assert.deepEqual(T.classify(c), { strict: false, perfect: false, complete: true });
  assert.deepEqual(T.siblings(t, 'D'), ['E']);
  assert.deepEqual(T.ancestors(t, 'G'), ['C', 'A']);
  assert.deepEqual(T.subtree(t, 'B').sort(), ['B', 'D', 'E']);
  assert.equal(T.height(T.emptyTree()), -1);
  assert.equal(T.maxNodesOfHeight(3), 15);
  assert.equal(T.maxLeavesOfHeight(3), 8);
});

test('random trees respect requested shapes', () => {
  const rng = makeRng(7);
  for (let i = 0; i < 30; i++) {
    const n = rng.int(1, 12);
    assert.equal(T.size(T.randomTree(rng, n, 'any')), n);
    assert.ok(T.isComplete(T.randomTree(rng, n, 'complete')));
    assert.ok(T.isStrict(T.randomTree(rng, n, 'strict')));
    assert.ok(T.isPerfect(T.randomTree(rng, n, 'perfect')));
  }
});

test('lecture 14 graph: DFS and BFS match the notes with alphabetical order', () => {
  const g = G.lec14Graph();
  assert.equal(G.dfsOrder(g, 'a').join(''), 'abcgdefih');
  assert.equal(G.bfsOrder(g, 'a').join(''), 'abefcdgih');
  assert.equal(G.traceDFS(g, 'a').result.join(''), 'abcgdefih');
  assert.equal(G.traceBFS(g, 'a').result.join(''), 'abefcdgih');
  const { dist } = G.bfsTree(g, 'a');
  assert.equal(dist.e, 1);
  assert.equal(dist.h, 3);
});

test('graph representations, self-loops, disconnected traversal', () => {
  const g = G.lec13SelfLoop();
  const m = G.matrix(g).m;
  assert.deepEqual(m, [[1, 1, 1], [0, 0, 1], [0, 1, 0]]);
  assert.deepEqual(G.adjList(g), { 1: ['1', '2', '3'], 2: ['3'], 3: ['2'] });
  assert.deepEqual(G.traceBFS(g, '1').result, ['1', '2', '3']);
  const d = G.fromEdgeList(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']]);
  assert.deepEqual(G.bfsOrder(d, 'A'), ['A', 'B', 'C']);
  assert.deepEqual(G.fullTraversal(d, 'bfs').components, [['A', 'B', 'C'], ['D', 'E']]);
  assert.deepEqual(G.traceDFS(d, 'A', { all: true }).result, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(G.degree(g, '1'), 4); // directed: out 3 (incl. loop) + in 1 (loop)
  // matrix ↔ list round trip
  const w = G.lec13Weighted();
  const mm = G.matrix(w);
  assert.equal(mm.m[0][0], 0);
  assert.equal(mm.m[0][3], Infinity);
  const back = G.fromMatrix(mm.labels, mm.m, { weighted: true });
  assert.equal(back.edges.length, w.edges.length);
});

test('BFS minimises edges, not weight', () => {
  const w = G.lec13Weighted();
  const { parent } = G.bfsTree(w, 'A');
  const p = G.pathTo(parent, 'D');
  assert.deepEqual(p, ['A', 'B', 'D']);
  assert.equal(G.pathWeight(w, p), 7);
  const best = G.lightestPath(w, 'A', 'D');
  assert.equal(best.dist, 6);
  assert.deepEqual(best.path, ['A', 'B', 'C', 'D']);
});

test('traversal cost: adjacency list vs matrix neighbour checks', () => {
  const g = G.lec14Graph();
  const L = G.traceBFS(g, 'a', { rep: 'list' }).counters.neighborChecks;
  const M = G.traceBFS(g, 'a', { rep: 'matrix' }).counters.neighborChecks;
  assert.equal(L, 2 * g.edges.length);
  assert.equal(M, g.vertices.length ** 2);
});
