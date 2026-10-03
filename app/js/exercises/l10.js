// Lecture 10 — Doubly linked lists (left = previous, right = next).
import { opts, mcq, numeric, sequenceText, orderCode, fillCode, rewire } from './kit.js';
import { values, randList, listText, rewireSpec, withPointers, withNewnode, vals, addrs, guide } from './helpers.js';
import * as DLL from '../core/dll.js';
import { walk, clone } from '../core/pointerWorld.js';

const backVals = (w) => {
  const as = walk(w, w.vars.start, 'right').addrs;
  if (!as.length) return [];
  return walk(w, as[as.length - 1], 'left', 50).values;
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
    lecture: 10,
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
      const linkCount = vs.length === 0 ? 'Only start changes.' : kind === 'mid' ? 'FOUR links change: new→left, new→right, prev→right, next→left.' : 'Two links on the new node side and one on the old neighbour, plus start if inserting at the front.';
      return {
        prompt: `Insert **${v}** ${kind === 'beg' ? 'at the beginning' : kind === 'end' ? 'at the end' : `at position ${pos}`}. Update BOTH directions. Goal: ${listText(vals(spec.goal))} (and backwards: ${listText([...vals(spec.goal)].reverse())}).\n\n${guide(guidance, linkCount, 'Check both directions before you submit.')}`,
        edge: vs.length <= 1,
        ...rewire(spec, { explain: 'Forward and backward traversals agree.' }),
        hints: ['Every forward link X→Y needs a matching backward link Y→X.', { text: 'Find the neighbours of the new node.', hl: { pos: kind === 'mid' ? [pos - 1, pos] : kind === 'beg' ? [1] : [vs.length] } }, kind === 'mid' ? `Set the new node's left and right first, then node ${pos - 1}'s right and node ${pos}'s left.` : kind === 'beg' ? 'new->right = old first; old first->left = new; start = new.' : 'last->right = new; new->left = last.'],
        solutionTrace: { struct: 'dll', op: kind === 'beg' ? 'insertBeg' : kind === 'end' ? 'insertEnd' : 'insertMid', world: w, args: kind === 'mid' ? [v, pos] : [v] },
        params: { kind },
      };
    },
  },
  {
    id: 'l10-rewire-delete',
    lecture: 10,
    concept: 'l10.dll-delete',
    type: 'rewire',
    title: 'Delete from a doubly linked list',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const kind = params.kind || rng.pick(['beg', 'mid', 'end']);
      const vs = params.values || values(rng, kind === 'mid' ? rng.int(3, 5) : rng.int(1, 4));
      const w = randList(rng, 'dll', vs);
      const pos = kind === 'mid' ? params.pos ?? rng.int(2, vs.length - 1) : null;
      const spec = rewireSpec(w, delOp(kind, pos), { vars: ['start', 'temp'] });
      const target = kind === 'beg' ? vs[0] : kind === 'end' ? vs[vs.length - 1] : vs[pos - 1];
      return {
        prompt: `Delete **${target}** and free it. Both neighbours must stop pointing at it. Goal: ${listText(vals(spec.goal))}.\n\n${guide(guidance, kind === 'mid' ? '(1) temp->right->left = temp->left; (2) temp->left->right = temp->right; then free(temp).' : kind === 'beg' ? (vs.length === 1 ? 'Only node: start = NULL, then free.' : 'temp = start; start = temp->right; start->left = NULL; free(temp).') : vs.length === 1 ? 'Only node: start = NULL, then free.' : 'temp on the last node; temp->left->right = NULL; free(temp).', '')}`,
        edge: vs.length === 1,
        ...rewire(spec, { explain: 'No link points to the freed node.' }),
        hints: ['A node in the middle of a doubly linked list is pointed to TWICE: once from each neighbour.', { text: 'Highlight the links that point INTO the node.', hl: { pos: [kind === 'beg' ? 1 : kind === 'end' ? vs.length : pos] } }, 'Keep temp on the node, update the neighbour links, then free.'],
        solutionTrace: { struct: 'dll', op: kind === 'beg' ? 'deleteBeg' : kind === 'end' ? 'deleteEnd' : 'deleteMid', world: w, args: kind === 'mid' ? [pos] : [] },
        params: { kind },
      };
    },
  },
  {
    id: 'l10-order',
    lecture: 10,
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
          { id: 'a', code: 'newnode->left = prev;' },
          { id: 'b', code: 'newnode->right = prev->right;' },
          { id: 'c', code: 'prev->right->left = newnode;' },
          { id: 'd', code: 'prev->right = newnode;' },
        ];
        mk = (w) => ({ world: withPointers(withNewnode(w, v), { prev: 1 }), goal: DLL.insertMid(w, v, 2, { detail: false }).final, opts: { locals: ['newnode', 'prev'] } });
        desc = `link newnode (${v}, already allocated) right after prev (node 1). There is NO temp pointer, so prev->right is the only way to reach node 2.`;
      } else {
        items = [
          { id: 'a', code: 'temp->right->left = temp->left;' },
          { id: 'b', code: 'temp->left->right = temp->right;' },
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
        ...orderCode(sh, cases, items.map((i) => i.id), { explain: kind === 'del' ? 'Lines (1) and (2) are independent, so either order works; free must be last.' : 'Both statements that READ prev->right must run before prev->right is overwritten.' }),
        hints: ['Which statements read a link that another statement overwrites?', { text: 'prev->right is the only path to node 2.' }, kind === 'del' ? 'free(temp) must come after both neighbours are updated.' : 'Do prev->right = newnode last.'],
        params: { kind: kind === 'del' ? 'del' : 'ins' },
      };
    },
  },
  {
    id: 'l10-repair-back',
    lecture: 10,
    concept: 'l10.dll-links',
    type: 'bug',
    title: 'Repair a broken backward link',
    generate(rng, { guidance = 'full' } = {}) {
      const vs = values(rng, rng.int(3, 5));
      const good = randList(rng, 'dll', vs);
      const as = addrs(good);
      const broken = clone(good);
      const i = rng.int(1, as.length - 1); // node index whose left is wrong
      const mode = i >= 2 ? rng.pick(['skip', 'null']) : 'null';
      broken.nodes[as[i]].left = mode === 'null' ? null : as[i - 2];
      broken.vars.temp = null;
      broken.varOrder.push('temp');
      const back = backVals(broken);
      const spec = { world: broken, goal: good, opts: { head: 'start', locals: ['temp'] }, vars: ['start', 'temp'] };
      return {
        prompt: `Going forward this list prints **${listText(vs)}** — it looks fine. Going backward from the last node it prints **${listText(back)}**.\n\nFind the broken backward (left) link and fix it.${guidance === 'full' ? ' Every node’s left must point at the node just before it.' : ''}`,
        edge: true,
        ...rewire(spec, { explain: 'Forward and backward traversals now agree.' }),
        hints: ['Compare the backward output with the forward output reversed: where do they first differ?', { text: `Backward traversal goes wrong right after ${back[back.length - 1] ?? 'the start'}.`, hl: { pos: [i + 1] } }, `Set node ${i + 1}'s left (data ${vs[i]}) to node ${i} (data ${vs[i - 1]}).`],
        params: {},
      };
    },
  },
  {
    id: 'l10-countnode',
    lecture: 10,
    concept: 'l10.countnode',
    type: 'predict',
    title: 'Recursive countnode',
    generate(rng) {
      const n = rng.int(0, 6);
      const w = randList(rng, 'dll', values(rng, n), { scatter: false });
      const tr = DLL.countnode(w);
      const ask = rng.pick(['ret', 'calls', 'depth']);
      const calls = tr.counters.calls;
      const depth = Math.max(...tr.steps.map((s) => (s.state.callStack || []).length));
      const ans = ask === 'ret' ? tr.result : ask === 'calls' ? calls : depth;
      const q = ask === 'ret' ? 'What does countnode(start) return?' : ask === 'calls' ? 'How many times is countnode called in total (including the first call)?' : 'What is the largest number of countnode frames on the call stack at the same time?';
      return {
        prompt: `List with ${n} node(s). \`int countnode(node *start) { if (start == NULL) return 0; else return 1 + countnode(start->right); }\`\n\n${q}`,
        visual: { type: 'list', world: w },
        edge: n === 0,
        ...numeric(ans, {
          explain: `One call per node plus one final call with NULL: ${calls} calls; they are all active at once at the deepest point (${depth} frames). Return value = ${tr.result}. Each call adds 1 on the way BACK out. Time Θ(n); auxiliary space Θ(n) for the call stack (an iterative loop would use Θ(1)).`,
          wrong: { [n]: { msg: ask === 'ret' ? '' : 'Do not forget the last call, made with NULL (the base case).', tag: 'recursion-base' } },
        }),
        hints: ['Each call handles one node, then calls itself on the next.', { text: 'The recursion stops at the call that receives NULL.' }, ask === 'ret' ? 'Add 1 for every non-NULL node.' : 'Count the non-NULL calls and add the one NULL call.'],
        solutionTrace: { struct: 'dll', op: 'countnode', world: w, args: [] },
      };
    },
  },
  {
    id: 'l10-fill',
    lecture: 10,
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
          return { world: w, newValue: v, goal: DLL.insertBeg(w, v, { detail: false }).final, opts: { locals: ['newnode'] }, label: listText(vs) };
        });
        return {
          prompt: `Complete \`insert_at_beg\` (non-empty list, new value ${v}). Lec 10 p.3 steps (1)–(3).`,
          visual: { type: 'list', world: cases[0].world },
          ...fillCode('newnode = getnode();\nnewnode->right = start;\n____;\nstart = newnode;', cases, 'start->left = newnode', { explain: 'Without it the old first node still has left = NULL and a backward traversal would stop before reaching the new node.' }),
          hints: ['Which BACKWARD link is still missing?', { text: 'The old first node must point back to the new node.' }, 'Assign start->left before start moves.'],
          params: { kind },
        };
      }
      const cases = lists.map((vs) => {
        const w = randList(rng, 'dll', vs);
        return { world: withPointers(w, { temp: 2 }), goal: DLL.deleteMid(w, 2).final, opts: { locals: ['temp'] }, label: listText(vs) };
      });
      const tmpl = kind === 'del1' ? '____;\ntemp->left->right = temp->right;\nfree(temp);' : 'temp->right->left = temp->left;\n____;\nfree(temp);';
      return {
        prompt: 'temp is on the node to delete (node 2). Complete the missing line from Lec 10 p.6.',
        visual: { type: 'list', world: cases[0].world },
        ...fillCode(tmpl, cases, kind === 'del1' ? 'temp->right->left = temp->left' : 'temp->left->right = temp->right', { explain: 'One line fixes the forward link, the other the backward link.' }),
        hints: ['Two links point INTO temp; both must skip it.', { text: kind === 'del1' ? 'The node AFTER temp still points back to temp.' : 'The node BEFORE temp still points forward to temp.' }, kind === 'del1' ? 'Assign temp->right->left.' : 'Assign temp->left->right.'],
        params: { kind: 'del' },
      };
    },
  },
  {
    id: 'l10-traverse-both',
    lecture: 10,
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
        w.nodes[as[i]].left = rng.bool() ? null : as[i - 2];
      }
      const dir = broken ? 'back' : rng.pick(['back', 'fwd']);
      const out = dir === 'back' ? DLL.traverseBwd(w).output : DLL.traverseFwd(w).output;
      return {
        prompt: `Look closely at every left AND right field. What does the ${dir === 'back' ? '**right → left** traversal (go to the last node, then follow left)' : '**left → right** traversal (follow right)'} print?`,
        visual: { type: 'list', world: w },
        edge: broken,
        ...sequenceText(out, { explain: broken ? 'A broken left link is invisible to a forward traversal; only the backward traversal exposes it.' : 'In a correct doubly linked list the backward output is the forward output reversed.' }),
        hints: [dir === 'back' ? 'Start on the node whose right is NULL.' : 'Start at start.', { text: 'Follow the arrows of ONE kind only.' }, 'Stop when the pointer you follow is NULL.'],
      };
    },
  },
];
