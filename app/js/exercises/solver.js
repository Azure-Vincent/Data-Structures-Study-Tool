// Produces a safe, step-by-step action list that turns a rewire exercise's
// starting world into its goal. Used for "reveal solution" and in tests.
import { clone, fieldsOf, lostNodes, liveNodes } from '../core/pointerWorld.js';
import { applyAction, describeAction } from '../core/invariants.js';

export function solveRewire(spec) {
  const w = clone(spec.world);
  const goal = spec.goal;
  const actions = [];
  const why = [];
  const push = (a, reason) => {
    const r = applyAction(w, a);
    if (!r.ok) throw new Error('solver produced invalid action: ' + r.error);
    actions.push(a);
    why.push(reason);
    return r;
  };
  const holdVar = ['temp', 'prev', 'last', 'old'].find((v) => v in w.vars) || null;
  const newVar = ['newnode'].find((v) => v in w.vars) || null;

  // 1. nodes that exist in the goal but not yet: allocate them
  for (const n of Object.values(goal.nodes)) {
    if (!w.nodes[n.addr]) {
      const r = push({ type: 'alloc', data: n.data, var: newVar }, `getnode() allocates a node for ${n.data}; it starts with every link = NULL.`);
      if (r.addr !== n.addr) throw new Error(`solver: alloc gave ${r.addr}, expected ${n.addr}`);
    }
  }
  // 2. nodes to remove: keep a pointer to them first
  const removed = liveNodes(w).filter((n) => !goal.nodes[n.addr]).map((n) => n.addr);
  if (removed.length && holdVar) {
    for (const a of removed.slice(0, 1)) if (w.vars[holdVar] !== a) push({ type: 'setVar', name: holdVar, value: a }, `${holdVar} = ${a}: keep the address of the node being removed so it can be freed later.`);
  }
  // 3. assignments still needed
  const pending = [];
  const isNew = (a) => !spec.world.nodes[a];
  for (const n of Object.values(goal.nodes)) {
    for (const f of fieldsOf(w.kind)) if (w.nodes[n.addr][f] !== n[f]) pending.push({ type: 'setField', addr: n.addr, field: f, value: n[f] });
  }
  for (const v of goal.globals || Object.keys(goal.vars)) if (w.vars[v] !== goal.vars[v]) pending.push({ type: 'setVar', name: v, value: goal.vars[v] });
  // new nodes' own fields first (nothing depends on them yet)
  pending.sort((a, b) => (isNew(b.addr) ? 1 : 0) - (isNew(a.addr) ? 1 : 0));
  let guard = 0;
  while (pending.length && guard++ < 100) {
    let idx = pending.findIndex((a) => {
      const t = clone(w);
      applyAction(t, a);
      return lostNodes(t).length <= lostNodes(w).length;
    });
    if (idx < 0) idx = 0;
    const a = pending.splice(idx, 1)[0];
    push(a, reasonFor(w, a, isNew));
  }
  // 4. free removed nodes
  for (const a of removed) {
    if (holdVar && w.vars[holdVar] !== a) push({ type: 'setVar', name: holdVar, value: a }, `${holdVar} = ${a}.`);
    push({ type: 'free', addr: a }, `free(${holdVar || a}): the node is unlinked, so it is now safe to release its memory.`);
  }
  return { actions, why, text: actions.map((a, i) => `${i + 1}. ${describeAction(w, a)} — ${why[i]}`).join('\n') };
}

function reasonFor(w, a, isNew) {
  if (a.type === 'setVar') return `${a.name} now points to ${a.value === null ? 'NULL' : a.value}.`;
  if (isNew(a.addr)) return `Set the new node's ${a.field} first — nothing else depends on it yet, so nothing can be lost.`;
  return `Update ${a.addr}->${a.field}. Safe now: every node it used to reach is still reachable through another pointer.`;
}
