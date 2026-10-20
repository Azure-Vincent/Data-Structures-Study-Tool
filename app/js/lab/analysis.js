// Structural analysis of interpreter states: reachability (lost references),
// cycles, broken links, dangling roots. Pure functions over plain state.
//
// Issue: { severity: 'error'|'warning'|'note', category: 'syntax'|'runtime'|'logic',
//          title, message, hint, tag, line, addrs }
//  - notes describe a temporary state that is fine if fixed later;
//  - warnings are logical problems (lost nodes, final structure broken).
import { STRUCTURES } from './structures.js';
import { isRef, isColl, dataText } from './machine.js';

export function structureOf(st) {
  return STRUCTURES[st.structure] || STRUCTURES.sll;
}

const nodeTxt = (st, a) => `@${a} (${dataText(st.nodes[a]?.data)})`;

/** Every node address held by a variable, a pending temporary, or a reachable collection. */
export function rootAddrs(st) {
  const out = new Set();
  const seenColl = new Set();
  const visit = (v) => {
    if (isRef(v)) out.add(v.ref);
    else if (isColl(v) && !seenColl.has(v.coll)) {
      seenColl.add(v.coll);
      for (const x of st.colls[v.coll]?.items || []) visit(x);
    }
  };
  for (const fr of st.frames) {
    for (const v of Object.values(fr.vars)) visit(v);
    for (const a of fr.temps || []) out.add(a);
  }
  return out;
}

/** Live nodes reachable from the roots by following link fields (freed nodes block the path). */
export function reachable(st) {
  const S = structureOf(st);
  const seen = new Set();
  const stack = [...rootAddrs(st)];
  while (stack.length) {
    const a = stack.pop();
    const n = st.nodes[a];
    if (!n || n.freed || seen.has(a)) continue;
    seen.add(a);
    for (const f of S.fields) if (n[f] != null) stack.push(n[f]);
  }
  return seen;
}

/** Live nodes nothing can reach any more (lost references / leaked memory). */
export function lostAddrs(st) {
  const r = reachable(st);
  return Object.values(st.nodes)
    .filter((n) => !n.freed && !r.has(n.addr))
    .map((n) => n.addr)
    .sort((a, b) => a - b);
}

/** Walk a forward chain from a pointer value. end ∈ null | cycle | freed | limit | missing */
export function chain(st, startVal, field) {
  const addrs = [];
  const seen = new Set();
  let cur = isRef(startVal) ? startVal.ref : null;
  while (true) {
    if (cur == null) return { addrs, end: 'null' };
    const n = st.nodes[cur];
    if (!n) return { addrs, end: 'missing', at: cur };
    if (n.freed) return { addrs, end: 'freed', at: cur };
    if (seen.has(cur)) return { addrs, end: 'cycle', closedAt: cur };
    if (addrs.length > 200) return { addrs, end: 'limit' };
    seen.add(cur);
    addrs.push(cur);
    cur = n[field];
  }
}

export function globalVal(st, name) {
  return st.frames[0].vars[name];
}

/** "start → 10 → 20 → NULL" style summary of the structure. */
export function structureText(st) {
  const S = structureOf(st);
  if (S.render === 'graph') return 'graph G';
  if (S.render === 'none') return 'arrays and variables';
  const root = S.roots[0];
  const rv = globalVal(st, root);
  if (rv === undefined) return `${root} is not set`;
  if (S.render === 'tree') {
    const lo = levelOrder(st, rv);
    return lo.values.length ? `tree, level order: ${lo.values.map((v) => (v === null ? '–' : dataText(v))).join(' ')}${lo.problem ? ` (${lo.problem})` : ''}` : `${root} = NULL (empty tree)`;
  }
  const c = chain(st, rv, S.forward);
  const vals = c.addrs.map((a) => dataText(st.nodes[a].data));
  if (!vals.length && c.end === 'null') return `${root} = NULL (empty)`;
  let tail = ' → NULL';
  if (c.end === 'cycle') tail = c.closedAt === c.addrs[0] ? ` → (back to ${S.circular ? 'start' : `@${c.closedAt}`})` : ` → (loops back to @${c.closedAt})`;
  if (c.end === 'freed') tail = ` → @${c.at} (deleted!)`;
  return `${root} → ${vals.join(' → ')}${tail}`;
}

/** Values of the list from the structure's first root, following the forward link. */
export function listValues(st) {
  const S = structureOf(st);
  const c = chain(st, globalVal(st, S.roots[0]), S.forward);
  return { values: c.addrs.map((a) => st.nodes[a].data), end: c.end, closedAt: c.closedAt, addrs: c.addrs };
}

/** Level-order array (with nulls, trailing nulls trimmed) of the tree reachable from rootVal. */
export function levelOrder(st, rootVal) {
  const out = [];
  const seen = new Set();
  let problem = null;
  let q = [isRef(rootVal) ? rootVal.ref : null];
  let guard = 0;
  while (q.some((x) => x != null) && guard++ < 12) {
    const nq = [];
    for (const a of q) {
      if (a == null) {
        out.push(null);
        nq.push(null, null);
        continue;
      }
      const n = st.nodes[a];
      if (!n || n.freed) {
        problem = problem || `leads into deleted node @${a}`;
        out.push(null);
        nq.push(null, null);
        continue;
      }
      if (seen.has(a)) {
        problem = problem || `@${a} is reached twice`;
        out.push(null);
        nq.push(null, null);
        continue;
      }
      seen.add(a);
      out.push(n.data);
      nq.push(n.left, n.right);
    }
    q = nq;
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return { values: out, problem };
}

/** A cycle reachable from the structure's roots, if the structure should not have one. */
function cycleNow(st) {
  const S = structureOf(st);
  if (S.circular || S.render === 'graph') return null;
  if (S.render === 'tree') {
    const rv = globalVal(st, 'root');
    if (!isRef(rv)) return null;
    const onPath = new Set();
    const done = new Set();
    let found = null;
    const dfs = (a, depth) => {
      if (found || a == null || depth > 60) return;
      const n = st.nodes[a];
      if (!n || n.freed) return;
      if (onPath.has(a)) {
        found = a;
        return;
      }
      if (done.has(a)) return;
      onPath.add(a);
      dfs(n.left, depth + 1);
      dfs(n.right, depth + 1);
      onPath.delete(a);
      done.add(a);
    };
    dfs(rv.ref, 0);
    return found == null ? null : { at: found, root: 'root' };
  }
  for (const root of S.roots) {
    const c = chain(st, globalVal(st, root), S.forward);
    if (c.end === 'cycle') return { at: c.closedAt, root, addrs: c.addrs };
  }
  return null;
}

function causeText(st, prev, ev, lost) {
  const ch = ev && ev.change;
  if (!ch) return '';
  const lostSet = new Set(lost);
  if (ch.type === 'field') {
    const what = ch.text ? `${ch.text} (the ${ch.field} field of @${ch.addr})` : `@${ch.addr}.${ch.field}`;
    if (ch.from != null && lostSet.has(ch.from)) return `${what} changed from @${ch.from} to ${ch.to == null ? 'NULL' : `@${ch.to}`}, and it was the last reference to @${ch.from}.`;
    return `${what} changed from ${ch.from == null ? 'NULL' : `@${ch.from}`} to ${ch.to == null ? 'NULL' : `@${ch.to}`}.`;
  }
  if (ch.type === 'var') {
    const from = isRef(ch.from) ? ch.from.ref : null;
    if (from != null && lostSet.has(from)) return `${ch.name} was the last reference to @${from}; it now ${ch.to === null ? 'is NULL' : isRef(ch.to) ? `points to @${ch.to.ref}` : `holds ${String(ch.to)}`}.`;
    return `${ch.name} changed.`;
  }
  if (ch.type === 'frame-pop') return `When ${ch.fn} returned, its local variables (${ch.vars.join(', ') || 'none'}) disappeared, and they were the only references.`;
  if (ch.type === 'free') {
    const n = prev.nodes[ch.addr];
    const f = structureOf(st).fields.find((x) => n && n[x] != null && lostSet.has(n[x]));
    return f ? `Deleting @${ch.addr} also threw away its ${f} pointer, which was the only way to reach @${n[f]}. Save it first (e.g. temp = p.${f}).` : `Deleting @${ch.addr} removed the only path to them.`;
  }
  if (ch.type === 'alloc') return '';
  return '';
}

/**
 * Issues caused by one step (prev → st via event ev).
 * prevLost: lostAddrs(prev) (passed in to avoid recomputing).
 */
export function stepIssues(prev, st, ev, prevLost) {
  const out = [];
  const S = structureOf(st);
  const nowLost = lostAddrs(st);
  const before = new Set(prevLost);
  const newly = nowLost.filter((a) => !before.has(a));
  if (newly.length) {
    const names = newly.map((a) => nodeTxt(st, a)).join(', ');
    const cause = causeText(st, prev, ev, newly);
    out.push({
      severity: 'warning',
      category: 'logic',
      title: 'Lost reference',
      message: `${newly.length === 1 ? 'Node' : 'Nodes'} ${names} can no longer be reached from any variable. ${cause}`.trim(),
      hint: ev && ev.change && ev.change.type === 'field' ? 'Order matters: before overwriting a pointer, make sure something else (a variable or another node) still points to what it pointed at — for example set newnode.next first, then change the old link.' : 'Keep a variable on a node until it is linked into the structure or deleted.',
      tag: 'lost-access',
      line: ev ? ev.line : null,
      addrs: newly,
    });
  }
  if (ev && ev.change && ev.change.type === 'free') {
    const a = ev.change.addr;
    const linked = [];
    for (const n of Object.values(st.nodes)) if (!n.freed) for (const f of S.fields) if (n[f] === a) linked.push(`@${n.addr}.${f}`);
    for (const r of S.roots) if (isRef(globalVal(st, r)) && globalVal(st, r).ref === a) linked.push(r);
    if (linked.length)
      out.push({
        severity: 'note',
        category: 'logic',
        title: 'Deleted node still linked',
        message: `@${a} was deleted while ${linked.join(' and ')} still ${linked.length === 1 ? 'points' : 'point'} to it. That is fine for a moment, but update ${linked.length === 1 ? 'it' : 'them'} next (for example to NULL) or the structure leads into freed memory.`,
        hint: 'The usual order is: unlink the node, then delete it.',
        tag: 'free-before-unlink',
        line: ev.line,
        addrs: [a],
      });
  }
  const cyc = cycleNow(st);
  if (cyc && !cycleNow(prev)) {
    out.push({
      severity: 'note',
      category: 'logic',
      title: 'Temporary cycle',
      message: `Following ${S.render === 'tree' ? 'the child links' : S.forward} from ${cyc.root} now loops back to @${cyc.at} instead of ending at NULL. That’s acceptable as an in-between state, but it must be gone before the program ends.`,
      hint: 'A node pointing back to an earlier node usually means two assignments are in the wrong order.',
      tag: 'pointer-walk',
      line: ev ? ev.line : null,
      addrs: [cyc.at],
    });
  }
  return { issues: out, lost: nowLost };
}

/** Problems with the finished structure (only meaningful at the end of a run). */
export function finalIssues(st) {
  const S = structureOf(st);
  const out = [];
  const warn = (title, message, tag, addrs = [], hint = '') => out.push({ severity: 'warning', category: 'logic', title, message, hint, tag, line: null, addrs });
  for (const r of S.roots) {
    const v = globalVal(st, r);
    if (isRef(v) && st.nodes[v.ref]?.freed) warn('Dangling pointer', `${r} still points to @${v.ref}, which was deleted. Anything that uses ${r} next would read freed memory.`, 'dangling', [v.ref], `Set ${r} to the next node or to NULL when you delete what it points to.`);
  }
  if (S.render === 'list') {
    const rv = globalVal(st, S.roots[0]);
    const c = chain(st, rv, S.forward);
    if (c.end === 'freed') warn('Broken link', `The ${S.forward === 'right' ? 'right' : 'next'} pointers from ${S.roots[0]} lead into deleted node @${c.at}${c.addrs.length ? ` (from @${c.addrs[c.addrs.length - 1]})` : ''}.`, 'dangling', [c.at], 'Unlink a node before deleting it, or set the pointer to NULL afterwards.');
    if (S.circular) {
      if (c.addrs.length && c.end === 'null') warn('Circle not closed', `The last node ${nodeTxt(st, c.addrs[c.addrs.length - 1])} has next = NULL, so the list is no longer circular.`, 'circle-not-closed', [c.addrs[c.addrs.length - 1]], 'In a circular list the last node’s next must point back to start.');
      if (c.end === 'cycle' && c.closedAt !== c.addrs[0]) warn('Circle closes in the wrong place', `Following next from start loops back to @${c.closedAt}, not to start (@${c.addrs[0]}), so some nodes are never revisited.`, 'circle-not-closed', [c.closedAt]);
    } else if (c.end === 'cycle') {
      warn('Unintended cycle', `Following ${S.forward} from ${S.roots[0]} never reaches NULL: it loops back to @${c.closedAt}. Any traversal of this ${S.label.toLowerCase()} would run forever.`, 'pointer-walk', [c.closedAt], 'Check which node should have NULL in its link.');
    }
    if (S.id === 'dll' && c.addrs.length && c.end !== 'freed') {
      const first = st.nodes[c.addrs[0]];
      if (first.left !== null) warn('Broken back link', `The first node ${nodeTxt(st, first.addr)} should have left = NULL, but left is @${first.left}.`, 'back-link', [first.addr]);
      for (let i = 1; i < c.addrs.length; i++) {
        const a = st.nodes[c.addrs[i]];
        if (a.left !== c.addrs[i - 1]) {
          warn('Broken back link', `${nodeTxt(st, a.addr)}.left should point back to @${c.addrs[i - 1]} (the node before it) but is ${a.left === null ? 'NULL' : `@${a.left}`}.`, 'back-link', [a.addr], 'In a doubly linked list every insert/delete updates both directions: the right link of one node and the left link of the next.');
          break;
        }
      }
    }
    if (S.id === 'queue') {
      const rear = globalVal(st, 'rear');
      const last = c.addrs[c.addrs.length - 1] ?? null;
      const rearAddr = isRef(rear) ? rear.ref : rear === null ? null : undefined;
      if (rearAddr === undefined) warn('Rear missing', 'rear should be a pointer to the last node (or NULL).', 'tail-rear');
      else if (c.end === 'null' && rearAddr !== last && !(rearAddr != null && st.nodes[rearAddr]?.freed)) warn('Rear is wrong', last == null ? `The queue is empty (front = NULL) but rear still points to @${rearAddr}.` : `rear should point to the last node ${nodeTxt(st, last)} but ${rearAddr == null ? 'is NULL' : `points to @${rearAddr}`}.`, 'tail-rear', [last, rearAddr].filter((x) => x != null), 'enqueue updates rear; dequeuing the last node must also set rear = NULL.');
    }
  }
  if (S.render === 'tree') {
    const cyc = cycleNow(st);
    if (cyc) warn('Cycle in the tree', `Following child links from root comes back to @${cyc.at}. A tree can never contain a cycle.`, 'pointer-walk', [cyc.at]);
    else {
      const lo = levelOrder(st, globalVal(st, 'root'));
      if (lo.problem) warn('Broken tree', `The tree from root ${lo.problem}.`, 'dangling');
    }
  }
  const lost = lostAddrs(st);
  if (lost.length) warn('Memory leak', `${lost.map((a) => nodeTxt(st, a)).join(', ')} ${lost.length === 1 ? 'is' : 'are'} unreachable at the end and ${lost.length === 1 ? 'was' : 'were'} never deleted.`, 'lost-access', lost, 'Every node you remove from the structure should be deleted; every node you keep must stay linked.');
  return out;
}
