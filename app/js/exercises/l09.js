// Lecture 09 — Singly linked lists part 2: deletion, traversal, preserving access, free().
import { opts, mcq, multi, numeric, sequenceText, orderCode, fillCode, rewire, keep } from './kit.js';
import { values, randList, listText, rewireSpec, withPointers, vals, guide } from './helpers.js';
import * as SLL from '../core/sll.js';
import { run } from '../core/interp.js';

function delOp(kind, pos) {
  if (kind === 'beg') return (w) => SLL.deleteBeg(w);
  if (kind === 'end') return (w) => SLL.deleteEnd(w);
  return (w) => SLL.deleteMid(w, pos);
}

export const l09 = [
  {
    id: 'l09-rewire-delete',
    lecture: 9,
    concept: 'l09.delete-mid',
    conceptBy: (p) => `l09.delete-${p.kind}`,
    variants: { 'l09.delete-beg': { kind: 'beg' }, 'l09.delete-mid': { kind: 'mid' }, 'l09.delete-end': { kind: 'end' }, 'l09.preserve-access': { kind: 'mid' } },
    type: 'rewire',
    title: 'Delete by rewiring pointers',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const vs = params.values || values(rng, kind === 'mid' ? rng.int(3, 5) : rng.int(1, 4));
      const w = randList(rng, 'sll', vs, { scatter: params.values ? false : undefined });
      const n = vs.length;
      let pos = params.pos ?? (kind === 'mid' ? rng.int(2, n - 1) : null);
      if (params.deleteValue != null) pos = vs.indexOf(params.deleteValue) + 1;
      const spec = rewireSpec(w, delOp(kind, pos));
      const target = kind === 'beg' ? vs[0] : kind === 'end' ? vs[n - 1] : vs[pos - 1];
      const edge = n === 1;
      const steps = {
        beg: 'temp = start → start = temp->next → free(temp).',
        end: n === 1 ? 'Only one node: keep it in temp, set start = NULL, free(temp).' : 'Put prev on the second-to-last node and temp on the last; prev->next = NULL; free(temp).',
        mid: `prev on node ${pos - 1}, temp on node ${pos}; prev->next = temp->next; free(temp).`,
      }[kind];
      return {
        prompt: `Delete **${target}** (${kind === 'beg' ? 'the first node' : kind === 'end' ? 'the last node' : `position ${pos}`}) and release its memory. Goal: ${listText(vals(spec.goal))}.\n\n${guide(guidance, 'Steps: ' + steps, 'Keep a pointer to the node before unlinking it, and free it at the end.')}`,
        edge,
        ...rewire(spec, { explain: 'The node was unlinked first and freed afterwards, and no other node lost its pointer.' }),
        hints: [
          'Before changing any link, make sure some pointer variable still holds the node you will free.',
          { text: kind === 'beg' ? 'start and the first node.' : kind === 'end' ? 'the last two nodes.' : `nodes ${pos - 1} and ${pos}.`, hl: { pos: kind === 'beg' ? [1] : kind === 'end' ? [Math.max(1, n - 1), n] : [pos - 1, pos] } },
          kind === 'beg' ? 'Set temp to the first node, move start to the second node, then free temp.' : kind === 'end' ? (n === 1 ? 'Set temp = start, start = NULL, then free.' : `Set temp to node ${n}, set node ${n - 1}'s next to NULL, then free temp.`) : `Set temp to node ${pos}, make node ${pos - 1}'s next skip to node ${pos + 1}, then free temp.`,
        ],
        solutionTrace: { struct: 'sll', op: kind === 'beg' ? 'deleteBeg' : kind === 'end' ? 'deleteEnd' : 'deleteMid', world: w, args: kind === 'mid' ? [pos] : [] },
        params: { kind },
      };
    },
  },
  {
    id: 'l09-order-delete',
    lecture: 9,
    concept: 'l09.delete-beg',
    conceptBy: (p) => `l09.delete-${p.kind}`,
    variants: { 'l09.delete-beg': { kind: 'beg' }, 'l09.delete-mid': { kind: 'mid' }, 'l09.delete-end': { kind: 'end' } },
    type: 'order',
    title: 'Arrange the deletion steps',
    generate(rng, { params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const lists = [values(rng, rng.int(3, 4)), values(rng, rng.int(4, 6))];
      let items;
      let mk;
      if (kind === 'beg') {
        items = [
          { id: 'a', code: 'temp = start;' },
          { id: 'b', code: 'start = temp->next;' },
          { id: 'c', code: 'free(temp);' },
        ];
        mk = (w) => ({ world: w, goal: SLL.deleteBeg(w).final, opts: { locals: ['temp'] } });
      } else if (kind === 'mid') {
        items = [
          { id: 'a', code: 'temp = prev->next;' },
          { id: 'b', code: 'prev->next = temp->next;' },
          { id: 'c', code: 'free(temp);' },
        ];
        mk = (w) => ({ world: withPointers(w, { prev: 1 }), goal: SLL.deleteMid(w, 2).final, opts: { locals: ['temp', 'prev'] } });
      } else {
        items = [
          { id: 'a', code: 'temp = prev = start;' },
          { id: 'b', code: 'while (temp->next != NULL) { prev = temp; temp = temp->next; }', label: 'while (temp->next != NULL) {\n    prev = temp;\n    temp = temp->next;\n}' },
          { id: 'c', code: 'prev->next = NULL;' },
          { id: 'd', code: 'free(temp);' },
        ];
        mk = (w) => ({ world: w, goal: SLL.deleteEnd(w).final, opts: { locals: ['temp', 'prev'] } });
      }
      const cases = lists.map((vs) => mk(randList(rng, 'sll', vs)));
      let sh = rng.shuffle(items);
      if (sh.map((i) => i.id).join() === items.map((i) => i.id).join()) sh = [...sh].reverse();
      return {
        prompt: `Arrange the statements to **${kind === 'beg' ? 'delete the first node' : kind === 'mid' ? 'delete the node right after prev (prev = node 1 is already placed)' : 'delete the last node (the list has at least 2 nodes)'}** and free its memory.`,
        visual: { type: 'list', world: cases[0].world },
        ...orderCode(sh, cases, items.map((i) => i.id), { explain: 'Unlink first, free last: free(temp) before relinking would read temp->next from freed memory.' }),
        hints: ['A node must be unlinked before it is freed, and you need its address to free it.', { text: 'Which pointer holds the node being removed?' }, 'Save → relink → free.'],
        params: { kind },
      };
    },
  },
  {
    id: 'l09-bug',
    lecture: 9,
    concept: 'l09.preserve-access',
    type: 'bug',
    title: 'Find the deletion bug',
    generate(rng) {
      const vs = values(rng, 4);
      const w = randList(rng, 'sll', vs, { scatter: false });
      const bugs = [
        { lines: ['temp = start;', 'free(temp);', 'start = temp->next;'], bad: 1, world: w, goal: 'delete the first node', why: 'free(temp) releases the node while start still points to it and BEFORE its next field is read. Line 3 then reads freed memory (use after free). Relink first, then free.', tag: 'free-before-unlink' },
        { lines: ['start = start->next;', 'free(start);'], bad: 0, world: w, goal: 'delete the first node', why: 'Line 1 overwrites the only pointer to the first node — it is lost forever (leak). Line 2 then frees the NEW first node, which is still in the list. Keep the old first node in temp.', tag: 'lost-access' },
        { lines: ['free(temp);', 'prev->next = temp->next;'], bad: 0, world: withPointers(w, { prev: 1, temp: 2 }), goal: 'delete the node temp (prev is the node before it)', why: 'The node is freed while prev->next still points to it, and line 2 reads temp->next from freed memory.', tag: 'free-before-unlink' },
        { lines: ['prev->next = NULL;', 'free(temp);'], bad: 0, world: withPointers(w, { prev: 1, temp: 2 }), goal: 'delete the node temp (prev is the node before it)', why: 'prev->next = NULL cuts the list after prev: every node after temp becomes unreachable. Use prev->next = temp->next.', tag: 'lost-access' },
      ];
      const b = rng.pick(bugs);
      const r = run(b.world, b.lines.join('\n'));
      const observed = r.error ? r.error.message : r.lost.length ? `${r.lost.map((l) => l.addrs.length).reduce((a, x) => a + x, 0)} node(s) can no longer be reached.` : `Result: ${listText(vals(r.world))}`;
      const o = opts(rng, b.lines.map((l, i) => ({ text: `Line ${i + 1}:  ${l}`, correct: i === b.bad, why: b.why, tag: b.tag })));
      return {
        prompt: `Goal: ${b.goal} from ${listText(vs)}.\n\n**Failing example:** ${observed}\n\nWhich line causes the FIRST problem?`,
        visual: { type: 'code', lines: b.lines, numbered: true },
        ...mcq(o),
        hints: ['A node must stay reachable until you free it, and must be unlinked before you free it.', { text: 'Look for free() too early or an overwritten pointer.' }, 'The first problem is where memory becomes lost or is freed while still in use.'],
      };
    },
  },
  {
    id: 'l09-singleton',
    lecture: 9,
    concept: 'l09.delete-end',
    type: 'predict',
    title: 'Delete the last node of a one-node list',
    generate(rng) {
      const v = rng.int(1, 99);
      const w = randList(rng, 'sll', [v], { scatter: false });
      const tr = SLL.deleteEnd(w, { notesVersion: true });
      const fs = tr.steps.find((s) => s.kind === 'free').state;
      const ask = rng.pick(['state', 'fix']);
      if (ask === 'state') {
        const o = opts(rng, [
          { text: `start still holds ${fs.vars.start}, which is freed memory (dangling)`, correct: true, why: 'Nothing in the notes’ code changes start, and the only node was freed.' },
          { text: 'start becomes NULL automatically', correct: false, why: 'free() never changes any pointer variable; it only releases memory.', tag: 'free-semantics' },
          { text: 'The program crashes at prev->next = NULL', correct: false, why: 'prev == start == the only node, which is still valid at that moment, so the write succeeds.', tag: 'singleton' },
          { text: 'The while loop never ends', correct: false, why: 'temp->next is NULL right away, so the loop body never runs.', tag: 'singleton' },
        ]);
        return {
          prompt: `The list has ONE node (${v}). Run \`delete_at_last()\` exactly as written in Lec 09 p.2:\n\nWhat is true afterwards?`,
          visual: { type: 'code', lines: ['temp = prev = start;', 'while (temp->next != NULL) {', '    prev = temp;  temp = temp->next;', '}', 'prev->next = NULL;', 'free(temp);'] },
          edge: true,
          ...mcq(o, { explain: 'Correction: add “if (temp == start) start = NULL; else prev->next = NULL;”.' }),
          hints: ['With one node, temp, prev and start all hold the same address.', { text: 'Which variables does the code assign after the loop?' }, 'Does any line assign start?'],
        };
      }
      const o = opts(rng, [
        { text: 'if (temp == start) start = NULL; else prev->next = NULL;', correct: true, why: 'When the only node is removed the list must become empty.' },
        { text: 'free(start);', correct: false, why: 'That would free the same block twice (double free).', tag: 'double-free' },
        { text: 'prev = NULL;', correct: false, why: 'prev is a local variable; start (global) would still dangle.', tag: 'singleton' },
        { text: 'temp->next = start;', correct: false, why: 'That creates a self-loop and still leaves start pointing at freed memory.', tag: 'singleton' },
      ]);
      return {
        prompt: `\`delete_at_last()\` from Lec 09 p.2 breaks on a one-node list (${v}). Which change fixes it?`,
        edge: true,
        visual: { type: 'list', world: w },
        ...mcq(o),
        hints: ['After deleting the only node, what should start be?', { text: 'start must not point at freed memory.' }, 'Detect the one-node case: temp == start after the loop.'],
      };
    },
  },
  {
    id: 'l09-traverse-predict',
    lecture: 9,
    concept: 'l09.traverse',
    type: 'predict',
    title: 'Predict the output of traverse()',
    generate(rng) {
      const n = rng.int(2, 5);
      const w0 = randList(rng, 'sll', values(rng, n));
      let w = w0;
      const ops = [];
      const k = rng.int(1, 3);
      for (let i = 0; i < k; i++) {
        const len = vals(w).length;
        const kind = rng.pick(['beg', 'end', 'mid', 'mid']);
        const pos = kind === 'mid' ? rng.int(1, len + 1) : null;
        ops.push(kind === 'beg' ? 'delete_at_beg()' : kind === 'end' ? 'delete_at_last()' : `delete_at_mid(pos = ${pos})`);
        w = delOp(kind, pos)(w).final;
      }
      const out = SLL.traverse(w).output.filter((x) => x !== 'Empty list');
      const empty = vals(w).length === 0;
      return {
        prompt: `Starting from the list shown, these run in order (invalid positions just print an error and change nothing):\n\n${ops.map((o, i) => `${i + 1}. \`${o}\``).join('\n')}\n\nWhat does \`traverse()\` print? ${empty ? '' : ''}(Type the numbers; type “empty” if nothing is left.)`,
        visual: { type: 'list', world: w0 },
        edge: empty || ops.some((o) => /pos = (1|0)\)/.test(o)),
        ...sequenceText(out, { explain: `delete_at_mid only accepts 1 < pos < nodectr (Lec 09 p.3). Final list: ${listText(vals(w))}.` }),
        hints: ['Apply the operations one at a time, re-numbering positions after each.', { text: 'Positions are 1-based and change after every deletion.' }, 'Check each delete_at_mid position against 1 < pos < nodectr first.'],
      };
    },
  },
  {
    id: 'l09-valid-pos',
    lecture: 9,
    concept: 'l09.delete-mid',
    type: 'predict',
    title: 'Which positions are accepted?',
    generate(rng) {
      const n = rng.int(1, 6);
      const w = randList(rng, 'sll', values(rng, n));
      const cands = Array.from({ length: n + 2 }, (_, i) => i);
      const op = rng.pick(['delete', 'insert']);
      const ok = cands.filter((p) => !(op === 'delete' ? SLL.deleteMid(w, p) : SLL.insertMid(w, 0, p)).error);
      const o = cands.map((p) => ({ text: `pos = ${p}`, correct: ok.includes(p), why: ok.includes(p) ? 'a middle position' : p <= 1 ? 'use the "at the beginning" function' : 'beyond the middle range', tag: 'position-range' }));
      return {
        prompt: `The list has **${n}** node(s). Which positions does \`${op === 'delete' ? 'delete_at_mid' : 'insert_at_mid'}(pos)\` accept? ${op === 'delete' ? '(condition: pos > 1 && pos < nodectr)' : '(corrected condition: pos > 1 && pos <= nodectr — the new node becomes node pos)'}`,
        visual: { type: 'list', world: w },
        edge: n <= 2,
        ...multi(keep(o), {
          explain: `Valid: ${ok.length ? ok.join(', ') : 'none'} for nodectr = ${n}. ${op === 'insert' ? 'Lec 08 p.7 writes pos < nodectr for insertion, which wrongly rejects pos = nodectr (inserting just before the last node is still a middle insertion).' : 'Deleting position 1 or n needs delete_at_beg / delete_at_last instead.'}`,
        }),
        hints: ['Substitute each position into the condition.', { text: `nodectr = ${n}.` }, op === 'delete' ? `Valid positions satisfy 1 < pos < ${n}.` : `Valid positions satisfy 1 < pos ≤ ${n}.`],
      };
    },
  },
  {
    id: 'l09-fill',
    lecture: 9,
    concept: 'l09.delete-mid',
    conceptBy: (p) => `l09.delete-${p.kind}`,
    type: 'fill',
    title: 'Complete the deletion code',
    generate(rng) {
      const kind = rng.pick(['mid', 'beg', 'end']);
      const lists = [values(rng, 3), values(rng, rng.int(4, 5))];
      if (kind === 'mid') {
        const cases = lists.map((vs) => {
          const w = randList(rng, 'sll', vs);
          return { world: withPointers(w, { prev: 1, temp: 2 }), goal: SLL.deleteMid(w, 2).final, opts: { locals: ['temp', 'prev'] }, label: listText(vs) };
        });
        return {
          prompt: 'prev is on node 1 and temp on node 2 (the node to delete). Complete the main line of `delete_at_mid` (Lec 09 p.4).',
          visual: { type: 'list', world: cases[0].world },
          ...fillCode('____;\nfree(temp);', cases, 'prev->next = temp->next', { explain: 'prev must skip over temp to the node after it — and temp->next must be read BEFORE temp is freed.' }),
          hints: ['After deletion, node 1 should be followed by node 3.', { text: 'Which field holds the address of node 3?' }, 'Assign prev->next.'],
          params: { kind },
        };
      }
      if (kind === 'beg') {
        const cases = lists.map((vs) => {
          const w = randList(rng, 'sll', vs);
          return { world: w, goal: SLL.deleteBeg(w).final, opts: { locals: ['temp'] }, label: listText(vs) };
        });
        return {
          prompt: 'Complete `delete_at_beg` (Lec 09 p.1).',
          visual: { type: 'list', world: cases[0].world },
          ...fillCode('temp = start;\n____;\nfree(temp);', cases, 'start = temp->next', { explain: 'start moves to the second node; temp keeps the old first node so it can be freed.' }),
          hints: ['start must end up on the second node.', { text: 'temp holds the first node.' }, 'Use temp->next.'],
          params: { kind },
        };
      }
      const cases = lists.map((vs) => {
        const w = randList(rng, 'sll', vs);
        return { world: w, goal: SLL.deleteEnd(w).final, opts: { locals: ['temp', 'prev'] }, label: listText(vs) };
      });
      return {
        prompt: 'Complete the loop condition in `delete_at_last` (list has at least 2 nodes).',
        visual: { type: 'list', world: cases[0].world },
        ...fillCode('temp = prev = start;\nwhile (____) {\n    prev = temp;\n    temp = temp->next;\n}\nprev->next = NULL;\nfree(temp);', cases, 'temp->next != NULL', { explain: 'temp must stop ON the last node and prev one behind it.' }),
        hints: ['When the loop ends, temp should be on the last node.', { text: 'The last node is the one with next == NULL.' }, 'Keep looping while temp has a next node.'],
        params: { kind },
      };
    },
  },
  {
    id: 'l09-tail-cost',
    lecture: 9,
    concept: 'cx.tail-pointer',
    type: 'complexity',
    title: 'Does a tail pointer help deletion?',
    generate(rng) {
      const n = rng.int(1, 9);
      const w = randList(rng, 'sll', values(rng, n), { scatter: false });
      const ask = rng.pick(['delTail', 'delTail', 'delNoTail', 'insTail']);
      let tr;
      let q;
      let explain;
      if (ask === 'delTail') {
        tr = SLL.deleteEndTail(w);
        q = `delete the LAST node of a ${n}-node list that keeps both start and tail`;
        explain = `Even with tail, we must find the node BEFORE tail to set its next to NULL and to move tail there. Singly linked nodes have no backward link, so we walk from start: ${Math.max(0, n - 2)} moves → still Θ(n). (A doubly linked list with tail does it in Θ(1).)`;
      } else if (ask === 'delNoTail') {
        tr = SLL.deleteEnd(w);
        q = `delete the LAST node of a ${n}-node list with only start (Lec 09 p.2)`;
        explain = `temp walks to the last node: ${Math.max(0, n - 1)} moves → Θ(n).`;
      } else {
        tr = SLL.insertEndTail(w, 0);
        q = `INSERT at the end of a ${n}-node list that keeps a tail pointer`;
        explain = 'tail->next = newnode; tail = newnode — no walking: Θ(1). The tail pointer helps insertion at the end, but not deletion at the end.';
      }
      return {
        prompt: `Counting model: count every execution of \`temp = temp->next\`.\n\nHow many moves are needed to ${q}?`,
        visual: { type: 'list', world: w },
        edge: n <= 2,
        ...numeric(tr.counters.moves || 0, { explain }),
        hints: ['Which node’s next field has to change?', { text: 'Can you reach that node directly from tail?' }, 'Count the steps from start to that node.'],
      };
    },
  },
];
