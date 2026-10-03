// Lecture 11 — Circular singly linked lists.
import { opts, mcq, numeric, sequenceClick, orderCode, fillCode, rewire } from './kit.js';
import { values, randList, listText, rewireSpec, vals, addrs, guide, emptyWorld } from './helpers.js';
import * as CSLL from '../core/csll.js';

function csl(rng, vs) {
  return vs.length ? randList(rng, 'csll', vs) : emptyWorld('csll');
}
const cvals = (w) => CSLL.traverse(w).output.filter((x) => x !== 'Empty list');

export const l11 = [
  {
    id: 'l11-null-loop',
    lecture: 11,
    concept: 'l11.csll-traverse',
    type: 'predict',
    title: 'Why waiting for NULL fails',
    generate(rng) {
      const n = rng.pick([0, 1, 2, 3, 4, 3]);
      const vs = values(rng, n);
      const w = csl(rng, vs);
      const infinite = n > 0;
      const o = opts(rng, [
        { text: 'It prints every value once and stops', correct: false, why: infinite ? 'temp never becomes NULL: after the last node it returns to the first node.' : 'Nothing is printed at all.', tag: 'circular-null' },
        { text: 'It never stops: it keeps printing the values around the circle', correct: infinite, why: infinite ? `In a non-empty circular list no next field is NULL (the last node points back to ${addrs(w)[0]}), so “temp != NULL” is always true.` : 'With start = NULL the loop condition is false immediately.', tag: 'circular-null' },
        { text: 'It prints nothing', correct: !infinite, why: !infinite ? 'The list is empty: temp = start = NULL, so the loop body never runs. The bug only shows on NON-empty circles.' : 'temp starts on the first node, which is not NULL.', tag: 'circular-null' },
        { text: 'It crashes immediately (NULL dereference)', correct: false, why: 'The loop tests temp before using it.', tag: 'circular-null' },
      ]);
      return {
        prompt: `This loop works for ordinary lists (Lec 09 p.5). What happens on the circular list shown${n === 0 ? ' (empty: start = NULL)' : ''}?`,
        visual: { type: 'list', world: w, code: ['temp = start;', 'while (temp != NULL) {', '    print(temp->data);', '    temp = temp->next;', '}'] },
        edge: n <= 1,
        ...mcq(o, { explain: 'Use the do-while from Lec 11 p.4 and stop when temp comes back to start.' }),
        hints: ['Look at the last node’s next field.', { text: 'Is any next field NULL in this circle?' }, 'If no field is NULL, temp can never become NULL.'],
        solutionTrace: n > 0 ? { struct: 'csll', op: 'traverseNullBug', world: w, args: [] } : null,
      };
    },
  },
  {
    id: 'l11-fill-dowhile',
    lecture: 11,
    concept: 'l11.csll-traverse',
    type: 'fill',
    title: 'Stop after exactly one lap',
    generate(rng) {
      const lists = [values(rng, 1), values(rng, rng.int(2, 3)), values(rng, rng.int(4, 5))];
      const cases = lists.map((vs) => ({ world: csl(rng, vs), expectOutput: vs, label: `the circle ${listText(vs)}` }));
      return {
        prompt: 'Complete the condition so that every node is printed exactly once (the list is not empty).',
        visual: { type: 'list', world: cases[1].world },
        edge: true,
        ...fillCode('temp = start;\ndo {\n    print(temp->data);\n    temp = temp->next;\n} while (____);', cases, 'temp != start', { explain: 'do-while runs the body once BEFORE testing, so starting at start does not stop immediately. It works for a one-node circle too (that node points to itself).' }),
        hints: ['Where does temp end up after visiting the last node?', { text: 'The last node’s next is the first node.' }, 'Stop when temp is back at start.'],
      };
    },
  },
  {
    id: 'l11-rewire-insert',
    lecture: 11,
    concept: 'l11.csll-insert',
    type: 'rewire',
    title: 'Insert into a circular list',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'end']);
      const vs = params.values || values(rng, rng.int(0, 4));
      const w = csl(rng, vs);
      const v = params.value ?? rng.int(1, 99);
      const op = kind === 'beg' ? (x) => CSLL.insertBeg(x, v, { detail: false }) : (x) => CSLL.insertEnd(x, v, { detail: false });
      const spec = rewireSpec(w, op, { vars: ['start', 'temp', 'last', 'newnode'], newValue: v });
      return {
        prompt: `Insert **${v}** at the ${kind === 'beg' ? 'beginning' : 'end'} and keep the list circular. Goal (one lap): ${listText(cvals(spec.goal))}.\n\n${guide(guidance, vs.length === 0 ? 'Empty list: the single new node must point to ITSELF, and start points to it.' : kind === 'beg' ? 'The LAST node must be updated too: it has to point to the new first node.' : 'The new last node must point back to start.', '')}`,
        edge: vs.length <= 1,
        ...rewire(spec, { explain: 'The circle is closed: following next from start returns to start after one lap.' }),
        hints: [vs.length === 0 ? 'A one-node circle points to itself.' : 'In a circle the last node’s next is always the first node.', { text: 'Find the node whose next is start.', hl: { pos: [vs.length || 1] } }, kind === 'beg' ? 'new->next = start; last->next = new; start = new.' : 'last->next = new; new->next = start.'],
        solutionTrace: { struct: 'csll', op: kind === 'beg' ? 'insertBeg' : 'insertEnd', world: w, args: [v] },
        params: { kind },
      };
    },
  },
  {
    id: 'l11-rewire-delete',
    lecture: 11,
    concept: 'l11.csll-delete',
    conceptBy: (p) => (p.single ? 'l11.csll-edge' : 'l11.csll-delete'),
    type: 'rewire',
    title: 'Delete from a circular list',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'end']);
      const single = params.single ?? rng.bool(0.35);
      const vs = params.values || values(rng, single ? 1 : rng.int(2, 4));
      const w = csl(rng, vs);
      const op = kind === 'beg' ? CSLL.deleteBeg : CSLL.deleteEnd;
      const spec = rewireSpec(w, (x) => op(x), { vars: ['start', 'temp', 'last'] });
      return {
        prompt: `Delete the ${kind === 'beg' ? 'first' : 'last'} node${vs.length === 1 ? ' — it is the ONLY node' : ''} and free it. Goal: ${vs.length === 1 ? 'empty list (start = NULL)' : listText(cvals(spec.goal)) + ', still circular'}.\n\n${guide(guidance, vs.length === 1 ? 'Keep the node in temp, set start = NULL, then free it. Do not leave start pointing at freed memory.' : kind === 'beg' ? 'The last node must skip the removed first node and point to the new first node.' : 'The second-to-last node becomes the last: it must point to start.', '')}`,
        edge: vs.length === 1,
        ...rewire(spec, { explain: vs.length === 1 ? 'start is NULL and the node was freed: no dangling pointer.' : 'The circle is still closed.' }),
        hints: [vs.length === 1 ? 'After removing the only node, the list is empty.' : 'Which node points INTO the node you remove?', { text: vs.length === 1 ? 'start must not keep the freed address.' : 'Find the node whose next is the node being removed.' }, vs.length === 1 ? 'temp = start; start = NULL; free(temp).' : kind === 'beg' ? 'temp = start; start = second node; last->next = start; free(temp).' : 'temp = last node; second-to-last->next = start; free(temp).'],
        solutionTrace: { struct: 'csll', op: kind === 'beg' ? 'deleteBeg' : 'deleteEnd', world: w, args: [] },
        params: { kind, single: vs.length === 1 },
      };
    },
  },
  {
    id: 'l11-order-delbeg',
    lecture: 11,
    concept: 'l11.csll-delete',
    type: 'order',
    title: 'Order the circular delete-at-beginning',
    generate(rng) {
      const items = [
        { id: 'a', code: 'last = temp = start;' },
        { id: 'b', code: 'while (last->next != start) last = last->next;', label: 'while (last->next != start)\n    last = last->next;' },
        { id: 'c', code: 'start = temp->next;' },
        { id: 'd', code: 'last->next = start;' },
        { id: 'e', code: 'free(temp);' },
      ];
      const lists = [values(rng, rng.int(2, 3)), values(rng, rng.int(4, 5))];
      const cases = lists.map((vs) => {
        const w = csl(rng, vs);
        return { world: w, goal: CSLL.deleteBeg(w).final, opts: { locals: ['last', 'temp'] }, label: listText(vs) };
      });
      let sh = rng.shuffle(items);
      if (sh.map((i) => i.id).join() === 'a,b,c,d,e') sh = [...sh].reverse();
      return {
        prompt: 'Arrange the statements to delete the FIRST node of a circular list (at least 2 nodes) and free it (Lec 11 p.3).',
        visual: { type: 'list', world: cases[0].world },
        ...orderCode(sh, cases, ['a', 'b', 'c', 'd', 'e'], { explain: 'The walk compares with start, so it must run BEFORE start moves; free(temp) comes last. The notes cross temp out — free(temp) makes the release explicit.' }),
        hints: ['The loop condition mentions start — what if start has already moved?', { text: 'last must end on the node before the old first node.' }, 'Find last first, then move start, then close the circle, then free.'],
      };
    },
  },
  {
    id: 'l11-count',
    lecture: 11,
    concept: 'cx.circular-costs',
    type: 'complexity',
    title: 'Counting work in a circle',
    generate(rng) {
      const n = rng.int(1, 8);
      const vs = values(rng, n);
      const w = csl(rng, vs);
      const k = rng.pick(['insBeg', 'insEnd', 'trav', 'delBeg']);
      let tr;
      let q;
      let explain;
      if (k === 'insBeg') {
        tr = CSLL.insertBeg(w, 0, { detail: false });
        q = 'insert_at_beg() — count `last = last->next` moves';
        explain = `To close the circle again the last node must be found: n − 1 = ${n - 1} moves. So inserting at the FRONT of a circular list with only start costs Θ(n). (Keeping a pointer to the last node instead of start makes both ends Θ(1).)`;
      } else if (k === 'insEnd') {
        tr = CSLL.insertEnd(w, 0, { detail: false });
        q = 'insert_at_end() — count `temp = temp->next` moves';
        explain = `temp walks from node 1 to node n: ${n - 1} moves → Θ(n).`;
      } else if (k === 'delBeg') {
        tr = CSLL.deleteBeg(w);
        q = 'delete_at_beg() — count `last = last->next` moves';
        explain = n === 1 ? 'One node: the special case frees it without walking (0 moves).' : `The last node must be found to update its next: ${n - 1} moves.`;
      } else {
        tr = CSLL.traverse(w);
        q = 'traverse() with do-while — count how many values are printed';
        explain = `Exactly one lap: ${n} values.`;
      }
      const ans = k === 'trav' ? tr.output.length : tr.counters.moves || 0;
      return {
        prompt: `Circular list with **${n}** node(s). ${q}?`,
        visual: { type: 'list', world: w },
        edge: n === 1,
        ...numeric(ans, { explain }),
        hints: ['Which loop runs, and when does it stop?', { text: 'The walk stops on the node whose next is start.' }, 'Count the arrows walked.'],
      };
    },
  },
  {
    id: 'l11-one-lap',
    lecture: 11,
    concept: 'l11.circular-links',
    type: 'traverse',
    title: 'Click exactly one lap',
    generate(rng) {
      const n = rng.pick([1, 2, 3, 4, 5]);
      const vs = values(rng, n);
      const w = csl(rng, vs);
      const as = addrs(w).map(String);
      return {
        prompt: `Click the nodes in the order the do-while traversal visits them, starting at start. Stop after **exactly one lap**, then press Check.`,
        visual: { type: 'list', world: w, clickable: true },
        edge: n === 1,
        ...sequenceClick(as, {
          explain: `One lap visits ${n} node(s): ${listText(vs)}.`,
          diagnose: (got) => (got.length > as.length && got[as.length] === as[0] ? { msg: 'You came back to start — that begins a second lap.', tag: 'circular-lap' } : null),
        }),
        hints: ['Follow next from start.', { text: 'The lap ends when the next node would be start again.', hl: { vars: ['start'] } }, `Click ${n} node(s) in total.`],
      };
    },
  },
];
