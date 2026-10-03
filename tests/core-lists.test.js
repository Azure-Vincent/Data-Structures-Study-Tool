import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as PW from '../app/js/core/pointerWorld.js';
import * as SLL from '../app/js/core/sll.js';
import * as DLL from '../app/js/core/dll.js';
import * as CSLL from '../app/js/core/csll.js';
import { problems, diagnoseHistory, compareToGoal } from '../app/js/core/invariants.js';

const vals = (w) => PW.listValues(w);
const back = (w) => {
  const r = PW.walk(w, w.vars.start, 'right');
  if (!r.addrs.length) return [];
  return PW.walk(w, r.addrs[r.addrs.length - 1], 'left').values;
};

test('SLL insert at beginning, end, middle (lecture example 10 20 30)', () => {
  let w = PW.buildList('sll', [10, 20, 30]);
  assert.deepEqual(vals(SLL.insertBeg(w, 5).final), [5, 10, 20, 30]);
  assert.deepEqual(vals(SLL.insertEnd(w, 40).final), [10, 20, 30, 40]);
  const mid = SLL.insertMid(w, 15, 2);
  assert.deepEqual(vals(mid.final), [10, 15, 20, 30]);
  assert.equal(mid.error, null);
  // locals are gone, freed nodes swept
  assert.deepEqual(Object.keys(mid.final.vars), ['start']);
  // delete 20 (now position 3)
  const del = SLL.deleteMid(mid.final, 3);
  assert.deepEqual(vals(del.final), [10, 15, 30]);
  assert.equal(PW.liveNodes(del.final).length, 3);
  assert.deepEqual(problems(del.final), []);
});

test('SLL operations on empty and singleton lists', () => {
  const empty = PW.buildList('sll', []);
  assert.deepEqual(vals(SLL.insertBeg(empty, 7).final), [7]);
  assert.deepEqual(vals(SLL.insertEnd(empty, 7).final), [7]);
  assert.ok(SLL.deleteBeg(empty).error);
  assert.ok(SLL.deleteEnd(empty).error);
  assert.ok(SLL.deleteMid(empty, 2).error);
  const one = PW.buildList('sll', [9]);
  const d1 = SLL.deleteEnd(one);
  assert.equal(d1.final.vars.start, null);
  assert.deepEqual(problems(d1.final), []);
  const d2 = SLL.deleteBeg(one);
  assert.equal(d2.final.vars.start, null);
});

test('notes version of delete_at_last leaves start dangling for one node', () => {
  const one = PW.buildList('sll', [9]);
  const tr = SLL.deleteEnd(one, { notesVersion: true });
  // before sweep, the last-but-one step shows start pointing at a freed block
  const freeStep = tr.steps.find((s) => s.kind === 'free');
  const st = freeStep.state;
  assert.equal(st.vars.start, 100);
  assert.equal(st.nodes[100].freed, true);
  assert.ok(problems(st).some((p) => p.code === 'dangling-var' && p.var === 'start'));
});

test('invalid positions are rejected without allocating', () => {
  const w = PW.buildList('sll', [1, 2, 3]);
  for (const pos of [0, 1, 5, -2]) {
    const tr = SLL.insertMid(w, 99, pos);
    assert.ok(tr.error, `pos ${pos} should be invalid`);
    assert.deepEqual(vals(tr.final), [1, 2, 3]);
    assert.equal(PW.liveNodes(tr.final).length, 3);
  }
  assert.deepEqual(vals(SLL.insertMid(w, 99, 3).final), [1, 2, 99, 3]); // pos == nodectr is a valid middle insert
  for (const pos of [1, 3, 4]) assert.ok(SLL.deleteMid(w, pos).error);
  assert.deepEqual(vals(SLL.deleteMid(w, 2).final), [1, 3]);
});

test('repeated operations keep the list consistent', () => {
  let w = PW.buildList('sll', []);
  for (let i = 0; i < 6; i++) w = SLL.insertEnd(w, i).final;
  for (let i = 0; i < 3; i++) w = SLL.deleteBeg(w).final;
  w = SLL.deleteEnd(w).final;
  assert.deepEqual(vals(w), [3, 4]);
  w = SLL.deleteEnd(w).final;
  w = SLL.deleteEnd(w).final;
  assert.equal(w.vars.start, null);
  assert.ok(SLL.deleteEnd(w).error);
});

test('traverse output and counters', () => {
  const w = PW.buildList('sll', [4, 5, 6]);
  const tr = SLL.traverse(w);
  assert.deepEqual(tr.output, [4, 5, 6]);
  assert.equal(tr.counters.visits, 3);
  const ins = SLL.insertEnd(w, 7);
  assert.equal(ins.counters.moves, 2); // n-1 moves for n = 3
});

test('tail pointer: insert O(1) but delete tail still walks', () => {
  let w = PW.buildList('sll', [1, 2, 3, 4, 5]);
  const a = SLL.insertEndTail(w, 6);
  assert.equal(a.counters.moves || 0, 0);
  assert.deepEqual(vals(a.final), [1, 2, 3, 4, 5, 6]);
  assert.equal(a.final.vars.tail, PW.walk(a.final, a.final.vars.start).addrs.at(-1));
  const d = SLL.deleteEndTail(a.final);
  assert.equal(d.counters.moves, 4); // n-2 moves for n = 6
  assert.deepEqual(vals(d.final), [1, 2, 3, 4, 5]);
});

test('creatlist move count matches (n-1)(n-2)/2', () => {
  for (const n of [1, 2, 3, 5, 8]) {
    const tr = SLL.createList(Array.from({ length: n }, (_, i) => i));
    const want = ((n - 1) * (n - 2)) / 2 + 0;
    assert.equal(tr.counters.moves || 0, want);
    assert.equal(SLL.creatlistMoves(n), want);
  }
});

test('DLL operations keep both directions consistent', () => {
  const w = PW.buildList('dll', [10, 20, 30]);
  for (const tr of [DLL.insertBeg(w, 5), DLL.insertEnd(w, 40), DLL.insertMid(w, 15, 2), DLL.deleteBeg(w), DLL.deleteEnd(w), DLL.deleteMid(w, 2)]) {
    const f = PW.walk(tr.final, tr.final.vars.start, 'right').values;
    assert.deepEqual(back(tr.final), [...f].reverse());
    assert.deepEqual(problems(tr.final), []);
  }
  const one = PW.buildList('dll', [1]);
  assert.equal(DLL.deleteBeg(one).final.vars.start, null);
  assert.equal(DLL.deleteEnd(one).final.vars.start, null);
  const crash = DLL.deleteBeg(one, { notesVersion: true });
  assert.match(crash.error, /CRASH/);
});

test('DLL traversals and recursive countnode', () => {
  const w = PW.buildList('dll', [1, 2, 3, 4]);
  assert.deepEqual(DLL.traverseFwd(w).output, [1, 2, 3, 4]);
  assert.deepEqual(DLL.traverseBwd(w).output, [4, 3, 2, 1]);
  const c = DLL.countnode(w);
  assert.equal(c.result, 4);
  assert.equal(c.counters.calls, 5);
  const maxDepth = Math.max(...c.steps.map((s) => (s.state.callStack || []).length));
  assert.equal(maxDepth, 5);
  assert.equal(DLL.countnode(PW.buildList('dll', [])).result, 0);
});

test('DLL broken back link is detected while forward looks fine', () => {
  const w = PW.buildList('dll', [1, 2, 3]);
  w.nodes[300].left = 100; // should be 200
  assert.deepEqual(PW.walk(w, w.vars.start, 'right').values, [1, 2, 3]);
  const p = problems(w);
  assert.equal(p[0].code, 'back-link');
  assert.deepEqual(back(w), [3, 1]);
});

test('circular list operations, singleton and traversal', () => {
  const w = CSLL.build([10, 20, 30]);
  assert.deepEqual(CSLL.traverse(w).output, [10, 20, 30]);
  const bug = CSLL.traverseNullBug(w);
  assert.ok(bug.error && bug.output.length > 3);
  const ib = CSLL.insertBeg(w, 5).final;
  assert.deepEqual(CSLL.traverse(ib).output, [5, 10, 20, 30]);
  assert.deepEqual(problems(ib), []);
  const ie = CSLL.insertEnd(w, 40).final;
  assert.deepEqual(CSLL.traverse(ie).output, [10, 20, 30, 40]);
  const db = CSLL.deleteBeg(w).final;
  assert.deepEqual(CSLL.traverse(db).output, [20, 30]);
  assert.deepEqual(problems(db), []);
  const de = CSLL.deleteEnd(w).final;
  assert.deepEqual(CSLL.traverse(de).output, [10, 20]);
  const one = CSLL.build([7]);
  assert.equal(one.nodes[100].next, 100);
  assert.equal(CSLL.deleteBeg(one).final.vars.start, null);
  assert.equal(CSLL.deleteEnd(one).final.vars.start, null);
  const empty = CSLL.build([]);
  assert.deepEqual(CSLL.traverse(CSLL.insertBeg(empty, 1).final).output, [1]);
  assert.ok(CSLL.deleteBeg(empty).error);
});

test('diagnoseHistory finds the lost-access action and accepts the safe order', () => {
  const init = PW.buildList('sll', [10, 20, 30]);
  init.vars.newnode = null;
  init.varOrder.push('newnode');
  // wrong: 100->next = new (loses 200 and 300)
  const bad = [{ type: 'alloc', data: 15, var: 'newnode' }, { type: 'setField', addr: 100, field: 'next', value: 400 }, { type: 'setField', addr: 400, field: 'next', value: 200 }];
  const dg = diagnoseHistory(init, bad, { locals: ['newnode'] });
  assert.equal(dg.index, 1);
  assert.equal(dg.code, 'lost');
  // right: link new node first
  const good = [{ type: 'alloc', data: 15, var: 'newnode' }, { type: 'setField', addr: 400, field: 'next', value: 200 }, { type: 'setField', addr: 100, field: 'next', value: 400 }];
  assert.equal(diagnoseHistory(init, good, { locals: ['newnode'] }), null);
  const goal = SLL.insertMid(PW.buildList('sll', [10, 20, 30]), 15, 2).final;
  const w = PW.clone(init);
  for (const a of good) (await_apply(w, a));
  const cmp = compareToGoal(w, goal, { locals: ['newnode'], newAddrs: [400] });
  assert.equal(cmp.correct, true, JSON.stringify(cmp));
});

import { applyAction } from '../app/js/core/invariants.js';
function await_apply(w, a) {
  const r = applyAction(w, a);
  assert.ok(r.ok, r.error);
}

test('freeing a node still linked backwards is reported specifically', () => {
  const init = PW.buildList('dll', [1, 2, 3]);
  init.vars.temp = 200;
  init.varOrder.push('temp');
  const acts = [{ type: 'setField', addr: 100, field: 'right', value: 300 }, { type: 'free', addr: 200 }];
  const dg = diagnoseHistory(init, acts, { locals: ['temp'] });
  assert.equal(dg.code, 'free-linked');
  assert.match(dg.message, /backward link/);
});
