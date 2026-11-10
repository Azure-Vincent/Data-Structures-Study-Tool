// Doubly linked lists: each node has a prev (previous node) and a next (next node) link.
import { opts, mcq, numeric, sequenceText, orderCode, fillCode, rewire } from './kit.js';
import { values, randList, listText, rewireSpec, withPointers, withNewnode, vals, addrs, guide } from './helpers.js';
import * as DLL from '../core/dll.js';
import { walk, clone } from '../core/pointerWorld.js';

const backVals = (w) => {
  const as = walk(w, w.vars.head, 'next').addrs;
  if (!as.length) return [];
  return walk(w, as[as.length - 1], 'prev', 50).values;
};

function insOp(kind, v, pos) {
  if (kind === 'beg') return (w) => DLL.insertBeg(w, v, { detail: false });
  if (kind === 'end') return (w) => DLL.insertEnd(w, v, { detail: false });
  return (w) => DLL.insertMid(w, v, pos, { detail: false });
}
function delOp(kind, pos) {
  if (kind === 'beg') return (w) => DLL.deleteBeg(w);
  if (kind === 'end') return (w) => DLL.deleteEnd(w);
  return (w) => DLL.deleteMid(w, pos);
}

export const l10 = [
  {
    id: 'l10-rewire-insert',
    concept: 'l10.dll-insert',
    type: 'rewire',
    title: 'Insert into a doubly linked list',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const vs = params.values || values(rng, kind === 'mid' ? rng.int(2, 4) : rng.int(0, 3));
      const w = randList(rng, 'dll', vs);
      const v = params.value ?? rng.int(1, 99);
      const pos = kind === 'mid' ? params.pos ?? rng.int(2, vs.length) : null;
      const spec = rewireSpec(w, insOp(kind, v, pos), { newValue: v });
      const linkCount = vs.length === 0 ? 'Only head changes.' : kind === 'mid' ? 'FOUR links change: new→prev, new→next, prev→next, next→prev.' : 'Two links change (one in the new node, one in its neighbor), plus head when inserting at the front.';
      return {
        prompt: `Insert **${v}** ${kind === 'beg' ? 'at the beginning' : kind === 'end' ? 'at the end' : `at position ${pos}`}. Update BOTH directions. Goal: ${listText(vals(spec.goal))} (and backwards: ${listText([...vals(spec.goal)].reverse())}).\n\n${guide(guidance, linkCount, 'Check both directions before you submit.')}`,
        edge: vs.length <= 1,
        ...rewire(spec, { explain: 'Forward and backward traversals agree.' }),
        hints: ['Every forward link X→Y needs a matching backward link Y→X.', { text: 'Find the neighbors of the new node.', hl: { pos: kind === 'mid' ? [pos - 1, pos] : kind === 'beg' ? [1] : [vs.length] } }, kind === 'mid' ? `Set the new node's prev and next first, then node ${pos - 1}'s next and node ${pos}'s prev.` : kind === 'beg' ? 'new->next = old first; old first->prev = new; head = new.' : 'last->next = new; new->prev = last.'],
        solutionTrace: { struct: 'dll', op: kind === 'beg' ? 'insertBeg' : kind === 'end' ? 'insertEnd' : 'insertMid', world: w, args: kind === 'mid' ? [v, pos] : [v] },
        params: { kind },
      };
    },
  },
  {
    id: 'l10-rewire-delete',
    concept: 'l10.dll-delete',
    type: 'rewire',
    title: 'Delete from a doubly linked list',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const vs = params.values || values(rng, kind === 'mid' ? rng.int(3, 5) : rng.int(1, 4));
      const w = randList(rng, 'dll', vs);
      const pos = kind === 'mid' ? params.pos ?? rng.int(2, vs.length - 1) : null;
      const spec = rewireSpec(w, delOp(kind, pos), { vars: ['head', 'temp'] });
      const target = kind === 'beg' ? vs[0] : kind === 'end' ? vs[vs.length - 1] : vs[pos - 1];
      return {
        prompt: `Delete **${target}** and free it. Both neighbors must stop pointing at it. Goal: ${listText(vals(spec.goal))}.\n\n${guide(guidance, kind === 'mid' ? '(1) temp->next->prev = temp->prev; (2) temp->prev->next = temp->next; then free(temp).' : kind === 'beg' ? (vs.length === 1 ? 'Only node: head = NULL, then free.' : 'temp = head; head = temp->next; head->prev = NULL; free(temp).') : vs.length === 1 ? 'Only node: head = NULL, then free.' : 'temp on the last node; temp->prev->next = NULL; free(temp).', '')}`,
        edge: vs.length === 1,
        ...rewire(spec, { explain: 'No link points to the freed node.' }),
        hints: ['A node in the middle of a doubly linked list is pointed to TWICE: once from each neighbor.', { text: 'Highlight the links that point INTO the node.', hl: { pos: [kind === 'beg' ? 1 : kind === 'end' ? vs.length : pos] } }, 'Keep temp on the node, update the neighbor links, then free.'],
        solutionTrace: { struct: 'dll', op: kind === 'beg' ? 'deleteBeg' : kind === 'end' ? 'deleteEnd' : 'deleteMid', world: w, args: kind === 'mid' ? [pos] : [] },
        params: { kind },
      };
    },
  },
  {
    id: 'l10-order',
    concept: 'l10.dll-insert',
    conceptBy: (p) => (p.kind === 'del' ? 'l10.dll-delete' : 'l10.dll-insert'),
    type: 'order',
    title: 'Order the doubly linked updates',
    generate(rng) {
      const kind = rng.pick(['insNoTemp', 'insNoTemp', 'del']);
      const v = rng.int(1, 99);
      const lists = [values(rng, 3), values(rng, 4)];
      let items;
      let mk;
      let desc;
      if (kind === 'insNoTemp') {
        items = [
          { id: 'a', code: 'new_node->prev = prev;' },
          { id: 'b', code: 'new_node->next = prev->next;' },
          { id: 'c', code: 'prev->next->prev = new_node;' },
          { id: 'd', code: 'prev->next = new_node;' },
        ];
        mk = (w) => ({ world: withPointers(withNewnode(w, v), { prev: 1 }), goal: DLL.insertMid(w, v, 2, { detail: false }).final, opts: { locals: ['new_node', 'prev'] } });
        desc = `link new_node (${v}, already allocated) right after prev (node 1). There is NO temp pointer, so prev->next is the only way to reach node 2.`;
      } else {
        items = [
          { id: 'a', code: 'temp->next->prev = temp->prev;' },
          { id: 'b', code: 'temp->prev->next = temp->next;' },
          { id: 'c', code: 'free(temp);' },
        ];
        mk = (w) => ({ world: withPointers(w, { temp: 2 }), goal: DLL.deleteMid(w, 2).final, opts: { locals: ['temp'] } });
        desc = 'delete the middle node temp (node 2) and free it.';
      }
      const cases = lists.map((vs) => mk(randList(rng, 'dll', vs)));
      let sh = rng.shuffle(items);
      if (sh.map((i) => i.id).join() === items.map((i) => i.id).join()) sh = [...sh].reverse();
      return {
        prompt: `Arrange the statements to ${desc} Several orders may be valid — any that works is accepted.`,
        visual: { type: 'list', world: cases[0].world },
        ...orderCode(sh, cases, items.map((i) => i.id), { explain: kind === 'del' ? 'Lines (1) and (2) are independent, so either order works; free must be last.' : 'Both statements that READ prev->next must run before prev->next is overwritten.' }),
        hints: ['Which statements read a link that another statement overwrites?', { text: 'prev->next is the only path to node 2.' }, kind === 'del' ? 'free(temp) must come after both neighbors are updated.' : 'Do prev->next = new_node last.'],
        params: { kind: kind === 'del' ? 'del' : 'ins' },
      };
    },
  },
  {
    id: 'l10-repair-back',
    concept: 'l10.dll-links',
    type: 'bug',
    title: 'Repair a broken backward link',
    generate(rng, { guidance = 'full' } = {}) {
      const vs = values(rng, rng.int(3, 5));
      const good = randList(rng, 'dll', vs);
      const as = addrs(good);
      const broken = clone(good);
      const i = rng.int(1, as.length - 1); // node index whose prev is wrong
      const mode = i >= 2 ? rng.pick(['skip', 'null']) : 'null';
      broken.nodes[as[i]].prev = mode === 'null' ? null : as[i - 2];
      broken.vars.temp = null;
      broken.varOrder.push('temp');
      const back = backVals(broken);
      const spec = { world: broken, goal: good, opts: { head: 'head', locals: ['temp'] }, vars: ['head', 'temp'] };
      return {
        prompt: `Going forward this list prints **${listText(vs)}** — it looks fine. Going backward from the last node it prints **${listText(back)}**.\n\nFind the broken backward (prev) link and fix it.${guidance === 'full' ? ' Every node’s prev must point at the node just before it.' : ''}`,
        edge: true,
        ...rewire(spec, { explain: 'Forward and backward traversals now agree.' }),
        hints: ['Compare the backward output with the forward output reversed: where do they first differ?', { text: `Backward traversal goes wrong right after ${back[back.length - 1] ?? 'the head'}.`, hl: { pos: [i + 1] } }, `Set node ${i + 1}'s prev (data ${vs[i]}) to node ${i} (data ${vs[i - 1]}).`],
        params: {},
      };
    },
  },
  {
    id: 'l10-countnode',
    concept: 'l10.countnode',
    type: 'predict',
    title: 'Recursive count_nodes',
    generate(rng) {
      const n = rng.int(0, 6);
      const w = randList(rng, 'dll', values(rng, n), { scatter: false });
      const tr = DLL.count_nodes(w);
      const ask = rng.pick(['ret', 'calls', 'depth']);
      const calls = tr.counters.calls;
      const depth = Math.max(...tr.steps.map((s) => (s.state.callStack || []).length));
      const ans = ask === 'ret' ? tr.result : ask === 'calls' ? calls : depth;
      const q = ask === 'ret' ? 'What does count_nodes(head) return?' : ask === 'calls' ? 'How many times is count_nodes called in total (including the first call)?' : 'What is the largest number of count_nodes frames on the call stack at the same time?';
      return {
        prompt: `List with ${n} node(s). \`int count_nodes(node *head) { if (head == NULL) return 0; else return 1 + count_nodes(head->next); }\`\n\n${q}`,
        visual: { type: 'list', world: w },
        edge: n === 0,
        ...numeric(ans, {
          explain: `One call per node plus one final call with NULL: ${calls} calls; they are all active at once at the deepest point (${depth} frames). Return value = ${tr.result}. Each call adds 1 on the way BACK out.`,
          wrong: { [n]: { msg: ask === 'ret' ? '' : 'Do not forget the last call, made with NULL (the base case).', tag: 'recursion-base' } },
        }),
        hints: ['Each call handles one node, then calls itself on the next.', { text: 'The recursion stops at the call that receives NULL.' }, ask === 'ret' ? 'Add 1 for every non-NULL node.' : 'Count the non-NULL calls and add the one NULL call.'],
        solutionTrace: { struct: 'dll', op: 'count_nodes', world: w, args: [] },
      };
    },
  },
  {
    id: 'l10-fill',
    concept: 'l10.dll-delete',
    conceptBy: (p) => (p.kind === 'beg' ? 'l10.dll-insert' : 'l10.dll-delete'),
    type: 'fill',
    title: 'Complete the doubly linked code',
    generate(rng) {
      const kind = rng.pick(['del1', 'del2', 'beg']);
      const lists = [values(rng, 3), values(rng, rng.int(4, 5))];
      if (kind === 'beg') {
        const v = rng.int(1, 99);
        const cases = lists.map((vs) => {
          const w = randList(rng, 'dll', vs);
          return { world: w, newValue: v, goal: DLL.insertBeg(w, v, { detail: false }).final, opts: { locals: ['new_node'] }, label: listText(vs) };
        });
        return {
          prompt: `Complete \`insert_at_beginning\` (non-empty list, new value ${v}).`,
          visual: { type: 'list', world: cases[0].world },
          ...fillCode('new_node = create_node();\nnew_node->next = head;\n____;\nhead = new_node;', cases, 'head->prev = new_node', { explain: 'Without it the old first node still has prev = NULL and a backward traversal would stop before reaching the new node.' }),
          hints: ['Which BACKWARD link is still missing?', { text: 'The old first node must point back to the new node.' }, 'Assign head->prev before head moves.'],
          params: { kind },
        };
      }
      const cases = lists.map((vs) => {
        const w = randList(rng, 'dll', vs);
        return { world: withPointers(w, { temp: 2 }), goal: DLL.deleteMid(w, 2).final, opts: { locals: ['temp'] }, label: listText(vs) };
      });
      const tmpl = kind === 'del1' ? '____;\ntemp->prev->next = temp->next;\nfree(temp);' : 'temp->next->prev = temp->prev;\n____;\nfree(temp);';
      return {
        prompt: 'temp is on the node to delete (node 2). Complete the missing line.',
        visual: { type: 'list', world: cases[0].world },
        ...fillCode(tmpl, cases, kind === 'del1' ? 'temp->next->prev = temp->prev' : 'temp->prev->next = temp->next', { explain: 'One line fixes the forward link, the other the backward link.' }),
        hints: ['Two links point INTO temp; both must skip it.', { text: kind === 'del1' ? 'The node AFTER temp still points back to temp.' : 'The node BEFORE temp still points forward to temp.' }, kind === 'del1' ? 'Assign temp->next->prev.' : 'Assign temp->prev->next.'],
        params: { kind: 'del' },
      };
    },
  },
  {
    id: 'l10-traverse-both',
    concept: 'l10.dll-traverse',
    type: 'predict',
    title: 'Forward and backward traversal',
    generate(rng) {
      const vs = values(rng, rng.int(2, 5));
      const w = randList(rng, 'dll', vs);
      const as = addrs(w);
      const broken = rng.bool(0.5) && vs.length >= 3;
      if (broken) {
        const i = rng.int(2, as.length - 1);
        w.nodes[as[i]].prev = rng.bool() ? null : as[i - 2];
      }
      const dir = broken ? 'back' : rng.pick(['back', 'fwd']);
      const out = dir === 'back' ? DLL.traverseBwd(w).output : DLL.traverseFwd(w).output;
      return {
        prompt: `Look closely at every prev AND next field. What does the ${dir === 'back' ? '**backward** traversal (go to the last node, then follow prev)' : '**forward** traversal (follow next from head)'} print?`,
        visual: { type: 'list', world: w },
        edge: broken,
        ...sequenceText(out, { explain: broken ? 'A broken prev link is invisible to a forward traversal; only the backward traversal exposes it.' : 'In a correct doubly linked list the backward output is the forward output reversed.' }),
        hints: [dir === 'back' ? 'Start on the node whose next is NULL.' : 'Start at head.', { text: 'Follow the arrows of ONE kind only.' }, 'Stop when the pointer you follow is NULL.'],
      };
    },
  },
];
