// Lecture 08 — Singly linked lists part 1: nodes, start, temp, creation, insertion.
import { opts, mcq, multi, numeric, sequenceText, orderCode, fillCode, rewire, reflect, keep } from './kit.js';
import { values, randList, listText, rewireSpec, withNewnode, withPointers, addrs, vals, guide, emptyWorld, linkChoices } from './helpers.js';
import * as SLL from '../core/sll.js';
import { run } from '../core/interp.js';
import { clone } from '../core/pointerWorld.js';

const INSERT_KINDS = ['beg', 'mid', 'end'];

export function insertGoal(kind, world, value, pos) {
  if (kind === 'beg') return (w) => SLL.insertBeg(w, value, { detail: false });
  if (kind === 'end') return (w) => SLL.insertEnd(w, value, { detail: false });
  return (w) => SLL.insertMid(w, value, pos, { detail: false });
}

export const l08 = [
  {
    id: 'l08-which-links',
    lecture: 8,
    concept: 'l08.insert-mid',
    conceptBy: (p) => (p.op === 'ins' ? `l08.insert-${p.kind}` : `l09.delete-${p.kind}`),
    variants: { 'l08.insert-beg': { op: 'ins', kind: 'beg' }, 'l08.insert-mid': { op: 'ins', kind: 'mid' }, 'l08.insert-end': { op: 'ins', kind: 'end' } },
    type: 'predict',
    title: 'Which pointers change?',
    generate(rng, { params = {} } = {}) {
      const op = params.op || rng.pick(['ins', 'ins', 'del']);
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const vs = params.values || values(rng, kind === 'mid' ? rng.int(3, 4) : rng.int(1, 4));
      const w = randList(rng, 'sll', vs, { scatter: params.values ? false : undefined });
      const v = params.value ?? rng.int(1, 99);
      let pos = params.pos ?? (kind === 'mid' ? rng.int(2, op === 'ins' ? vs.length : vs.length - 1) : null);
      const tr = op === 'ins' ? insertGoal(kind, w, v, pos)(w) : kind === 'beg' ? SLL.deleteBeg(w) : kind === 'end' ? SLL.deleteEnd(w) : SLL.deleteMid(w, pos);
      const after = tr.final;
      const list = linkChoices(w, after).map((o) => ({ ...o, why: o.correct ? 'this pointer gets a new value' : 'this pointer keeps its value', tag: 'which-links' }));
      const what = op === 'ins' ? `insert ${v} ${kind === 'beg' ? 'at the beginning' : kind === 'end' ? 'at the end' : `at position ${pos} (after ${vs[pos - 2]})`}` : `delete ${kind === 'beg' ? 'the first node' : kind === 'end' ? 'the last node' : `node ${pos} (${vs[pos - 1]})`}`;
      return {
        prompt: `You will **${what}**. Before doing it, select EVERY pointer whose value changes (ignore temporary variables like temp/prev).`,
        visual: { type: 'list', world: w },
        edge: vs.length === 1,
        ...multi(keep(list), { explain: `Before: ${listText(vs)}. After: ${listText(vals(after))}. ${op === 'ins' ? 'Insertion touches only the links around the gap — that is why it is cheap once the position is found.' : 'Deletion only redirects the link that pointed INTO the removed node (and start/NULL in the end cases); the removed node’s own fields do not matter once it is freed.'}` }),
        hints: ['Compare the picture before and after: which arrows move?', { text: 'Only arrows next to the changed spot can move.' }, op === 'ins' ? 'Count: the new node gets a next, and ONE existing pointer is redirected to it.' : 'Exactly one existing pointer is redirected (or set to NULL).'],
        params: { op, kind },
      };
    },
  },
  {
    id: 'l08-predict-temp',
    lecture: 8,
    concept: 'l08.traversal-pointer',
    conceptBy: (p) => (p.ask === 'temp' ? 'l08.traversal-pointer' : 'l08.node-anatomy'),
    type: 'predict',
    title: 'Where does temp point?',
    generate(rng) {
      const n = rng.int(3, 5);
      const w = randList(rng, 'sll', values(rng, n), { scatter: true });
      const as = addrs(w);
      const vs = vals(w);
      const edge = rng.bool(0.2);
      const k = edge ? n : rng.int(1, n - 1);
      const ask = edge ? 'temp' : rng.pick(['temp', 'temp', 'temp->data', 'temp->next']);
      const target = k < n ? as[k] : null;
      let right;
      let why;
      if (ask === 'temp') {
        right = target === null ? 'NULL' : String(target);
        why = target === null ? `After ${n} moves temp has walked off the end: the last node's next is NULL.` : `After ${k} move(s) temp holds the ADDRESS of node ${k + 1}, which is ${target}.`;
      } else if (ask === 'temp->data') {
        right = String(vs[k]);
        why = `temp is on node ${k + 1} (address ${target}); its data field holds the VALUE ${vs[k]}.`;
      } else {
        const nx = k + 1 < n ? as[k + 1] : null;
        right = nx === null ? 'NULL' : String(nx);
        why = `temp is on node ${k + 1}; temp->next is the address stored in its next field: ${right}.`;
      }
      const cand = new Set([right, 'NULL', String(as[Math.min(k, n - 1)]), String(vs[Math.min(k, n - 1)]), String(as[Math.max(0, k - 1)]), String(as[0])]);
      const list = [...cand].slice(0, 5).map((t) => ({
        text: t,
        correct: t === right,
        why:
          t === right
            ? why
            : t === String(vs[Math.min(k, n - 1)]) && ask !== 'temp->data'
              ? `${t} is a data VALUE, not an address. Pointers hold addresses. ${why}`
              : t === String(as[Math.max(0, k - 1)]) || t === String(as[k - 1])
                ? `Off by one: count the moves again — temp started ON node 1. ${why}`
                : why,
        tag: t === String(vs[Math.min(k, n - 1)]) && ask !== 'temp->data' ? 'value-vs-address' : 'pointer-walk',
      }));
      return {
        prompt: `Run \`temp = start;\` and then \`temp = temp->next;\` **${k}** time(s).\n\nWhat is \`${ask}\` now?`,
        visual: { type: 'list', world: w },
        edge,
        ...mcq(opts(rng, list)),
        hints: [
          'A pointer variable stores an address (the number under a node), never the data inside it.',
          { text: 'Follow the arrows from start, one per move.', hl: { vars: ['start'] } },
          `Node 1 is at ${as[0]}. Each move copies that node's next field into temp.`,
        ],
        params: { ask },
      };
    },
  },
  {
    id: 'l08-rewire-insert',
    lecture: 8,
    concept: 'l08.insert-mid',
    conceptBy: (p) => `l08.insert-${p.kind}`,
    type: 'rewire',
    title: 'Insert by rewiring pointers',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(INSERT_KINDS);
      const n = params.values ? params.values.length : kind === 'mid' ? rng.int(2, 4) : rng.int(0, 4);
      const vs = params.values || values(rng, n);
      const w = params.values ? randList(rng, 'sll', vs, { scatter: false }) : randList(rng, 'sll', vs);
      const val = params.value ?? rng.int(1, 99);
      const pos = params.pos ?? (kind === 'mid' ? rng.int(2, n) : null);
      const spec = rewireSpec(w, insertGoal(kind, w, val, pos), { newValue: val });
      const goalList = vals(spec.goal);
      const what = kind === 'beg' ? 'at the beginning' : kind === 'end' ? 'at the end' : `at position ${pos} (after ${vs[pos - 2]})`;
      const steps = {
        beg: ['getnode() to allocate the new node (it starts with next = NULL).', 'newnode->next = start  (link the new node to the old first node).', 'start = newnode.'],
        end: ['getnode().', 'Set temp = start and move temp until temp->next is NULL.', 'temp->next = newnode.'],
        mid: ['getnode().', `Place prev on node ${pos - 1} and temp on node ${pos}.`, 'prev->next = newnode, then newnode->next = temp (temp remembers the rest).'],
      }[kind];
      const edge = n <= 1;
      return {
        prompt: `Insert **${val}** ${what}. Goal: ${listText(goalList)}.\n\n${guide(guidance, 'Steps: ' + steps.map((s, i) => `(${i + 1}) ${s}`).join(' '), 'Remember: never overwrite the only pointer to the rest of the list.')}`,
        edge,
        ...rewire(spec, { explain: 'Every link was changed without losing access to any node.' }),
        hints: [
          kind === 'beg' ? 'The new node must point at the old first node BEFORE start moves.' : kind === 'end' ? 'Only the last node’s next changes (from NULL to the new node).' : 'Two links change: the one INTO the new node and the one OUT of it.',
          { text: kind === 'beg' ? 'Look at start and the new node.' : kind === 'end' ? 'Look at the node whose next is NULL.' : `Look at node ${pos - 1} (${vs[pos - 2]}) and node ${pos} (${vs[pos - 1]}).`, hl: { pos: kind === 'mid' ? [pos - 1, pos] : kind === 'end' ? [n] : [1] } },
          kind === 'beg' ? 'Click “getnode()”, then click the new node’s next field and then the old first node.' : kind === 'end' ? (n ? 'After getnode(), set the last node’s next to the new node.' : 'The list is empty: after getnode(), just set start = newnode.') : 'After getnode(), set newnode->next to node ' + pos + ' first; then node ' + (pos - 1) + '->next to the new node.',
        ],
        solutionTrace: { struct: 'sll', op: kind === 'beg' ? 'insertBeg' : kind === 'end' ? 'insertEnd' : 'insertMid', world: w, args: kind === 'mid' ? [val, pos] : [val] },
        params: { kind },
      };
    },
  },
  {
    id: 'l08-order-insert',
    lecture: 8,
    concept: 'l08.insert-beg',
    conceptBy: (p) => `l08.insert-${p.kind}`,
    type: 'order',
    title: 'Arrange the insertion steps',
    generate(rng, { params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'end', 'mid', 'mid2']);
      const val = rng.int(1, 99);
      const lists = [values(rng, rng.int(2, 4)), values(rng, rng.int(3, 5))];
      let items;
      let mk;
      if (kind === 'beg') {
        items = [
          { id: 'a', code: 'newnode = getnode();' },
          { id: 'b', code: 'newnode->next = start;' },
          { id: 'c', code: 'start = newnode;' },
        ];
        mk = (w) => ({ world: w, goal: SLL.insertBeg(w, val, { detail: false }).final, newValue: val, opts: { locals: ['newnode'] } });
      } else if (kind === 'end') {
        items = [
          { id: 'a', code: 'newnode = getnode();' },
          { id: 'b', code: 'temp = start;' },
          { id: 'c', code: 'while (temp->next != NULL) temp = temp->next;', label: 'while (temp->next != NULL)\n    temp = temp->next;' },
          { id: 'd', code: 'temp->next = newnode;' },
        ];
        mk = (w) => ({ world: w, goal: SLL.insertEnd(w, val, { detail: false }).final, newValue: val, opts: { locals: ['newnode', 'temp'] } });
      } else {
        // prev/temp already placed by the search loop
        const pos = 2;
        items =
          kind === 'mid'
            ? [
                { id: 'a', code: 'newnode = getnode();' },
                { id: 'b', code: 'prev->next = newnode;' },
                { id: 'c', code: 'newnode->next = temp;' },
              ]
            : [
                { id: 'a', code: 'newnode = getnode();' },
                { id: 'b', code: 'newnode->next = prev->next;' },
                { id: 'c', code: 'prev->next = newnode;' },
              ];
        mk = (w) => ({ world: kind === 'mid' ? withPointers(w, { prev: pos - 1, temp: pos }) : withPointers(w, { prev: pos - 1 }), goal: SLL.insertMid(w, val, pos, { detail: false }).final, newValue: val, opts: { locals: ['newnode', 'temp', 'prev'] } });
      }
      const cases = lists.map((vs) => mk(randList(rng, 'sll', vs)));
      const shuffled = rng.shuffle(items);
      if (shuffled.map((i) => i.id).join() === items.map((i) => i.id).join()) shuffled.reverse();
      const desc = { beg: `insert ${val} at the beginning`, end: `insert ${val} at the end (list is not empty)`, mid: `insert ${val} between prev and temp (prev = node 1, temp = node 2 are already placed)`, mid2: `insert ${val} after prev (prev = node 1 is already placed; there is NO temp)` }[kind];
      return {
        prompt: `Put the statements in a valid order to **${desc}**. Use the arrows or drag. The simulator runs your order on test lists.`,
        visual: { type: 'list', world: cases[0].world },
        ...orderCode(shuffled, cases, items.map((i) => i.id), {
          explain: kind === 'mid' ? 'Because temp saved the address of the rest, the two link assignments can be done in either order (Lec 08 p.7).' : kind === 'mid2' ? 'Without temp, newnode->next must copy prev->next BEFORE prev->next is overwritten; otherwise the rest of the list is lost.' : kind === 'beg' ? 'newnode->next = start must come before start = newnode; the reverse order makes the new node point to itself and loses the old list.' : 'The walk must finish before the last node is linked to the new node.',
        }),
        hints: ['Which assignment would destroy the only copy of an address if done too early?', { text: 'Find the arrow that is overwritten.' }, kind === 'beg' ? 'Link newnode first, move start last.' : kind === 'end' ? 'Allocate, walk to the end, then link.' : 'getnode() must come first, since the other lines use newnode.'],
        params: { kind: kind.startsWith('mid') ? 'mid' : kind },
      };
    },
  },
  {
    id: 'l08-fill',
    lecture: 8,
    concept: 'l08.insert-end',
    conceptBy: (p) => `l08.insert-${p.kind}`,
    type: 'fill',
    title: 'Complete the missing code',
    generate(rng) {
      const kind = rng.pick(['endcond', 'beg', 'mid']);
      const val = rng.int(1, 99);
      const lists = [values(rng, 1), values(rng, rng.int(2, 3)), values(rng, rng.int(4, 5))];
      if (kind === 'endcond') {
        const cases = lists.map((vs) => {
          const w = randList(rng, 'sll', vs);
          return { world: withNewnode(w, val), goal: SLL.insertEnd(w, val, { detail: false }).final, opts: { locals: ['newnode', 'temp'] }, label: `the list ${listText(vs)}` };
        });
        return {
          prompt: `\`newnode\` already holds a new node (data ${val}). Complete the loop condition so that temp stops on the LAST node.`,
          visual: { type: 'list', world: cases[1].world },
          edge: true,
          ...fillCode('temp = start;\nwhile (____)\n    temp = temp->next;\ntemp->next = newnode;', cases, 'temp->next != NULL', { explain: 'Stop when the CURRENT node has no next. Testing temp != NULL would walk past the last node and then crash on temp->next = newnode.', placeholder: 'condition' }),
          hints: ['You want temp to stand ON the last node when the loop ends.', { text: 'Which field is NULL only on the last node?' }, 'The last node is the one whose next is NULL.'],
          params: { kind: 'end' },
        };
      }
      if (kind === 'beg') {
        const cases = lists.map((vs) => {
          const w = randList(rng, 'sll', vs);
          return { world: w, newValue: val, goal: SLL.insertBeg(w, val, { detail: false }).final, opts: { locals: ['newnode'] }, label: `the list ${listText(vs)}` };
        });
        return {
          prompt: `Complete \`insert_at_beg\` for a non-empty list (new value ${val}).`,
          visual: { type: 'list', world: cases[1].world },
          ...fillCode('newnode = getnode();\n____;\nstart = newnode;', cases, 'newnode->next = start', { explain: 'The new node must remember the old first node before start is moved (Lec 08 p.4, step c-1).', placeholder: 'one assignment' }),
          hints: ['After the last line, start will no longer remember the old first node.', { text: 'The new node needs an arrow to the current first node.' }, 'Assign the new node’s next field.'],
          params: { kind: 'beg' },
        };
      }
      const cases = lists.slice(1).map((vs) => {
        const w = randList(rng, 'sll', vs);
        return { world: withPointers(withNewnode(w, val), { prev: 1, temp: 2 }), goal: SLL.insertMid(w, val, 2, { detail: false }).final, opts: { locals: ['newnode', 'temp', 'prev'] }, label: `the list ${listText(vs)}` };
      });
      return {
        prompt: `prev is on node 1, temp on node 2, newnode holds a new node (${val}). Complete the insertion between them.`,
        visual: { type: 'list', world: cases[0].world },
        ...fillCode('prev->next = newnode;\n____;', cases, 'newnode->next = temp', { explain: 'temp kept the address of node 2, so it is still available after prev->next was overwritten.', placeholder: 'one assignment' }),
        hints: ['After line 1, prev->next no longer leads to node 2.', { text: 'Which pointer still remembers node 2?', hl: { vars: ['temp'] } }, 'Link the new node to the node temp points at.'],
        params: { kind: 'mid' },
      };
    },
  },
  {
    id: 'l08-bug',
    lecture: 8,
    concept: 'l08.insert-beg',
    type: 'bug',
    title: 'Find the bug with a failing example',
    generate(rng) {
      const val = rng.int(1, 99);
      const vs = values(rng, 3);
      const w = randList(rng, 'sll', vs, { scatter: false });
      const bugs = [
        { lines: ['newnode = getnode();', 'start = newnode;', 'newnode->next = start;'], bad: 1, world: w, concept: 'l08.insert-beg', why: 'start was overwritten while it held the only address of the old first node. The next line then makes the new node point to ITSELF (a cycle) and the old nodes are lost.' },
        { lines: ['newnode = getnode();', 'prev->next = newnode;', 'newnode->next = prev->next;'], bad: 2, world: withPointers(w, { prev: 1 }), concept: 'l08.insert-mid', why: 'After line 2, prev->next already IS newnode, so line 3 makes newnode point to itself. Nodes after prev are lost. Fix: save prev->next in temp first (or swap the two lines).' },
        { lines: ['newnode = getnode();', 'temp = start;', 'while (temp != NULL)', '    temp = temp->next;', 'temp->next = newnode;'], bad: 2, world: w, concept: 'l08.insert-end', why: 'The loop runs until temp is NULL — one step past the last node — so temp->next dereferences NULL and the program crashes. Test temp->next != NULL instead.' },
        { lines: ['while (start != NULL) {', '    print(start->data);', '    start = start->next;', '}'], bad: 2, world: w, concept: 'l08.traversal-pointer', why: 'Moving start itself walks it off the list: after printing, start is NULL and every node is lost (memory leak). Use a temporary pointer: temp = start; and move temp.' },
      ];
      const b = rng.pick(bugs);
      const r = run(b.world, b.lines.join('\n'), { newValue: val });
      let observed;
      if (r.error) observed = r.error.message;
      else if (r.lost.length) observed = `${r.lost[0].addrs.length} node(s) become unreachable${r.output.length ? `; it printed ${r.output.join(' ')}` : ''}.`;
      else observed = `Result: ${listText(vals(r.world))}`;
      const o = opts(
        rng,
        b.lines.map((l, i) => ({ text: `Line ${i + 1}:  ${l.trim()}`, correct: i === b.bad, why: i === b.bad ? b.why : `Line ${i + 1} is fine on its own. ${b.why}`, tag: b.bad === 2 && b.lines[2].includes('while') ? 'loop-condition' : 'lost-access' })),
      );
      return {
        prompt: `This code is supposed to ${b.concept === 'l08.insert-beg' ? `insert ${val} at the beginning` : b.concept === 'l08.insert-mid' ? `insert ${val} after prev (node 1)` : b.concept === 'l08.insert-end' ? `insert ${val} at the end` : 'print the list'}.\n\n**Failing example** on ${listText(vs)}: ${observed}\n\nWhich line FIRST causes the problem?`,
        visual: { type: 'code', lines: b.lines, numbered: true },
        ...mcq(o),
        concept: b.concept,
        hints: ['Draw the pointers after each line.', { text: 'Find the line after which some node has no pointer to it.' }, 'Watch for a variable that is overwritten while it holds the only copy of an address.'],
        solutionTrace: null,
      };
    },
  },
  {
    id: 'l08-predict-state',
    lecture: 8,
    concept: 'l08.insert-end',
    type: 'predict',
    title: 'Predict the list after several insertions',
    generate: generatePredictState,
  },
  {
    id: 'l08-cost',
    lecture: 8,
    concept: 'cx.list-costs',
    type: 'complexity',
    title: 'Count the pointer moves',
    generate(rng) {
      const kind = rng.pick(['end', 'end', 'beg', 'tail', 'create', 'mid']);
      const n = kind === 'create' ? rng.int(1, 7) : rng.int(0, 9);
      const w = randList(rng, 'sll', values(rng, kind === 'mid' ? Math.max(2, n) : n), { scatter: false });
      let tr;
      let q;
      let explain;
      if (kind === 'end') {
        tr = SLL.insertEnd(w, 1, { detail: false });
        q = `insert_at_end() on a list with ${n} node(s)`;
        explain = `temp starts on node 1 and stops on node ${n}: ${Math.max(0, n - 1)} move(s). With only a head pointer, inserting at the end costs Θ(n) moves (finding the position), plus Θ(1) link writes (changing links).`;
      } else if (kind === 'beg') {
        tr = SLL.insertBeg(w, 1, { detail: false });
        q = `insert_at_beg() on a list with ${n} node(s)`;
        explain = 'No walking at all: 0 moves for any n → Θ(1).';
      } else if (kind === 'tail') {
        tr = SLL.insertEndTail(w, 1, { detail: false });
        q = `insert_at_end() on a list with ${n} node(s) that ALSO keeps a tail pointer`;
        explain = 'tail already points at the last node, so no search is needed: 0 moves → Θ(1).';
      } else if (kind === 'mid') {
        const m = Math.max(2, n);
        const pos = rng.int(2, m);
        tr = SLL.insertMid(w, 1, pos, { detail: false });
        const moves = tr.steps.filter((s) => s.line === 6 && s.kind === 'var').length;
        return {
          prompt: `In \`insert_at_mid\` with pos = ${pos} on a ${m}-node list, how many times does \`temp = temp->next;\` inside the \`while (ctr < pos)\` loop run? (Do not count countnode.)`,
          visual: { type: 'list', world: w },
          ...numeric(moves, { explain: `ctr goes 1 → ${pos}, so the body runs pos − 1 = ${pos - 1} times. Finding the position costs Θ(pos); the two link writes cost Θ(1).` }),
          hints: ['ctr starts at 1 and the loop stops when ctr == pos.', { text: 'Each iteration moves temp one node.' }, 'Count iterations: pos − 1.'],
        };
      } else {
        tr = SLL.createList(Array.from({ length: n }, (_, i) => i + 1));
        q = `creatlist(${n}) from Lec 08 p.3 (it appends every node by walking from start)`;
        explain = `Appending node i walks over i−2 links, so the total is 0 + 0 + 1 + 2 + … + (n−2) = (n−1)(n−2)/2 = ${((n - 1) * (n - 2)) / 2 + 0}. That is Θ(n²) for building a list! Keeping a pointer to the last node makes it Θ(n).`;
      }
      const moves = tr.counters.moves || 0;
      return {
        prompt: `Counting model: count every execution of \`temp = temp->next;\`.\n\nHow many moves does **${q}** make?`,
        visual: kind === 'create' ? null : { type: 'list', world: w },
        edge: n <= 1,
        ...numeric(moves, { explain, wrong: { [n]: { msg: 'temp already starts ON node 1.', tag: 'off-by-one' } } }),
        hints: ['Moves happen only inside loops that walk the list.', { text: 'Where does temp start, and where must it stop?' }, kind === 'create' ? 'Add up the moves for each appended node.' : 'Count the arrows temp crosses.'],
      };
    },
  },
];

function buildPredictState(rng, n, ops, finalWorld) {
  const answer = vals(finalWorld);
  return {
    prompt: `The list starts as shown${n === 0 ? ' (empty: start = NULL)' : ''}. Then these run in order:\n\n${ops.map((o, i) => `${i + 1}. \`${o}\``).join('\n')}\n\nType the final list from start (values separated by spaces).`,
    edge: n === 0,
    ...sequenceText(answer, { explain: `Final list: ${listText(answer)}. Position p means the new node becomes node p.` }),
    hints: ['Apply one operation at a time and write the list down after each.', { text: 'insert_at_mid(x, pos=p) makes x the p-th node.' }, `After operation 1: apply ${ops[0]} to the starting list.`],
  };
}

function generatePredictState(rng) {
  const n = rng.int(0, 3);
  const w0 = randList(rng, 'sll', values(rng, n));
  let w = w0;
  const ops = [];
  const k = rng.int(2, 3);
  for (let i = 0; i < k; i++) {
    const len = vals(w).length;
    const kind = len >= 2 ? rng.pick(INSERT_KINDS) : rng.pick(['beg', 'end']);
    const v = rng.int(1, 99);
    const pos = kind === 'mid' ? rng.int(2, len) : null;
    ops.push(kind === 'beg' ? `insert_at_beg(${v})` : kind === 'end' ? `insert_at_end(${v})` : `insert_at_mid(${v}, pos = ${pos})`);
    w = insertGoal(kind, w, v, pos)(w).final;
  }
  return { visual: { type: 'list', world: w0 }, ...buildPredictState(rng, n, ops, w) };
}

export { emptyWorld, clone, reflect };
