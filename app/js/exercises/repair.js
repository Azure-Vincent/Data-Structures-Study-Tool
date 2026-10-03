// Repair-mode scenarios: a buggy sequence of actions has already been applied.
// The learner observes it, finds the first problematic action, undoes back to
// it and fixes the structure. Checking uses the same deterministic diagnoser.
import { rewire } from './kit.js';
import { buildList, addVar, clone, walk } from '../core/pointerWorld.js';
import * as SLL from '../core/sll.js';
import * as DLL from '../core/dll.js';
import { makeRng } from '../core/rng.js';

function base(kind, vals, vars = ['temp', 'newnode']) {
  const w = buildList(kind, vals);
  w.globals = ['start'];
  for (const v of vars) addVar(w, v, null);
  return w;
}

export const REPAIRS = [
  {
    id: 'broken-link',
    title: 'Broken link: the rest of the list is cut off',
    concept: 'l09.preserve-access',
    ref: 'Lec 09',
    make(rng) {
      const vals = rng.distinct(4, 1, 99);
      const w = base('sll', vals, ['temp']);
      const as = walk(w, w.vars.start).addrs;
      return {
        world: w,
        initialActions: [{ type: 'setVar', name: 'temp', value: as[2] }, { type: 'setField', addr: as[1], field: 'next', value: null }],
        goal: buildList('sll', vals),
        story: `Someone saved node 3 in temp and then set node 2's next to NULL. Going from start you now reach only ${vals[0]} → ${vals[1]}. Restore ${vals.join(' → ')}.`,
      };
    },
  },
  {
    id: 'lost-access',
    title: 'Lost access: start overwritten too early',
    concept: 'l08.insert-beg',
    ref: 'Lec 08 p.4',
    make(rng) {
      const vals = rng.distinct(3, 10, 99);
      const v = rng.int(1, 9);
      const w = base('sll', vals);
      const goal = SLL.insertBeg(buildList('sll', vals), v, { detail: false }).final;
      return {
        world: w,
        initialActions: [{ type: 'alloc', data: v, var: 'newnode' }, { type: 'setVar', name: 'start', value: goal.vars.start }],
        goal,
        newValue: v,
        story: `The goal was to insert ${v} at the beginning. The code ran “newnode = getnode(); start = newnode;” — and the old nodes became unreachable. Undo back to the problematic action and do it in the right order.`,
      };
    },
  },
  {
    id: 'dangling',
    title: 'Dangling pointer after deleting the only node',
    concept: 'l09.delete-end',
    ref: 'Lec 09 p.2',
    make(rng) {
      const v = rng.int(1, 99);
      const w = base('sll', [v], ['temp']);
      return {
        world: w,
        initialActions: [{ type: 'setVar', name: 'temp', value: w.vars.start }, { type: 'free', addr: w.vars.start }],
        goal: SLL.deleteEnd(buildList('sll', [v])).final,
        story: `delete_at_last() from the notes ran on a one-node list: temp = start; free(temp). start still holds the freed address. Make the list correctly empty.`,
      };
    },
  },
  {
    id: 'cycle',
    title: 'Unintended cycle when appending',
    concept: 'l08.insert-end',
    ref: 'Lec 08 p.5',
    make(rng) {
      const vals = rng.distinct(3, 10, 99);
      const v = rng.int(1, 9);
      const w = base('sll', vals);
      const goal = SLL.insertEnd(buildList('sll', vals), v, { detail: false }).final;
      const as = walk(w, w.vars.start).addrs;
      const newAddr = walk(goal, goal.vars.start).addrs[3];
      return {
        world: w,
        initialActions: [{ type: 'alloc', data: v, var: 'newnode' }, { type: 'setField', addr: as[2], field: 'next', value: newAddr }, { type: 'setField', addr: newAddr, field: 'next', value: as[0] }],
        goal,
        newValue: v,
        story: `Appending ${v} accidentally linked the new last node back to the first node (as if this were a circular list). A traversal waiting for NULL would never stop.`,
      };
    },
  },
  {
    id: 'back-link',
    title: 'Forward correct, backward wrong (doubly linked insert)',
    concept: 'l10.dll-links',
    ref: 'Lec 10 p.4',
    make(rng) {
      const vals = rng.distinct(3, 10, 99);
      const v = rng.int(1, 9);
      const w = base('dll', vals);
      const goal = DLL.insertMid(buildList('dll', vals), v, 2, { detail: false }).final;
      const as = walk(w, w.vars.start, 'right').addrs;
      const na = walk(goal, goal.vars.start, 'right').addrs[1];
      return {
        world: w,
        initialActions: [{ type: 'alloc', data: v, var: 'newnode' }, { type: 'setField', addr: na, field: 'left', value: as[0] }, { type: 'setField', addr: na, field: 'right', value: as[1] }, { type: 'setField', addr: as[0], field: 'right', value: na }],
        goal,
        newValue: v,
        story: `Inserting ${v} at position 2 updated three of the four links. Forward traversal prints the right thing, but a backward traversal skips ${v}.`,
      };
    },
  },
  {
    id: 'dll-free',
    title: 'Freed node still referenced by a backward link',
    concept: 'l10.dll-delete',
    ref: 'Lec 10 p.6',
    make(rng) {
      const vals = rng.distinct(3, 10, 99);
      const w = base('dll', vals, ['temp']);
      const as = walk(w, w.vars.start, 'right').addrs;
      return {
        world: w,
        initialActions: [{ type: 'setVar', name: 'temp', value: as[1] }, { type: 'setField', addr: as[0], field: 'right', value: as[2] }, { type: 'free', addr: as[1] }],
        goal: DLL.deleteMid(buildList('dll', vals), 2).final,
        story: `Deleting ${vals[1]}: the forward link was fixed and the node was freed — but ${vals[2]}'s left link still points to the freed node.`,
      };
    },
  },
];

export function makeRepair(id, seed) {
  const r = REPAIRS.find((x) => x.id === id);
  const rng = makeRng(seed);
  const sc = r.make(rng);
  const spec = { world: sc.world, goal: sc.goal, opts: { head: 'start', locals: Object.keys(sc.world.vars).filter((v) => v !== 'start') }, newValue: sc.newValue ?? null };
  const ex = rewire(spec, { explain: 'Repaired: the structure matches the goal and nothing dangles or leaks.' });
  return {
    ...ex,
    initialActions: sc.initialActions,
    templateId: 'repair-' + r.id,
    seed,
    concept: r.concept,
    lecture: Number(r.concept.slice(1, 3)) || 9,
    type: 'bug',
    title: r.title,
    guidance: 'less',
    prompt: `${sc.story}\n\nThe actions already applied are listed below the diagram. Find the FIRST problematic one (Check will tell you), undo back to it if needed, and fix the structure.`,
    hints: [
      'Ask after each action: can every node still be reached, and does any pointer refer to freed memory?',
      { text: 'Look for orange (unreachable) or red (freed) nodes in the diagram.' },
      'Click an action in the list to undo back to it, then redo the remaining steps in a safe order.',
    ],
    solutionText: 'The solution replay below starts from the ORIGINAL list (before the buggy actions).',
    edge: true,
    ref: r.ref,
  };
}

export { clone };
