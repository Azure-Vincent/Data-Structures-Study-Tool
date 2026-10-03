// Checking pointer worlds: what is wrong, and which action caused it.
// Used by rewire exercises, repair mode and the free-exploration sandbox.
import { clone, walk, fieldsOf, forwardField, lostNodes, liveNodes, getnode, free, fmtPtr, GARBAGE, reachableFrom } from './pointerWorld.js';

const L = (w, a) => (w.nodes[a] ? `${a} (data ${w.nodes[a].data})` : String(a));

/** Apply one user action to a world (mutates). Returns {ok, error?, addr?}. */
export function applyAction(w, act) {
  switch (act.type) {
    case 'setField': {
      const n = w.nodes[act.addr];
      if (!n) return { ok: false, error: `There is no node at ${act.addr}.` };
      if (n.freed) return { ok: false, error: `Node ${act.addr} has been freed; writing to it is undefined behaviour.` };
      n[act.field] = act.value;
      return { ok: true };
    }
    case 'setVar':
      if (!(act.name in w.vars)) return { ok: false, error: `No pointer variable named ${act.name}.` };
      w.vars[act.name] = act.value;
      return { ok: true };
    case 'alloc': {
      const a = getnode(w, act.data, act.addr != null ? { addr: act.addr } : undefined);
      if (act.var) w.vars[act.var] = a;
      return { ok: true, addr: a };
    }
    case 'free': {
      const n = w.nodes[act.addr];
      if (!n) return { ok: false, error: `No block at ${act.addr}.` };
      if (n.freed) return { ok: false, error: `Double free: ${act.addr} was already freed.` };
      free(w, act.addr);
      return { ok: true };
    }
    default:
      return { ok: false, error: `Unknown action ${act.type}` };
  }
}

export function describeAction(w, act) {
  switch (act.type) {
    case 'setField':
      return `${act.addr}->${act.field} = ${fmtPtr(act.value)}`;
    case 'setVar':
      return `${act.name} = ${fmtPtr(act.value)}`;
    case 'alloc':
      return `${act.var || 'newnode'} = getnode()  (data ${act.data})`;
    case 'free':
      return `free(${act.addr})`;
    default:
      return JSON.stringify(act);
  }
}

/**
 * Structural problems in a world.
 * opts: { head:'start', lastVar:'tail'|'rear'|null, ignoreVars:[...locals that may dangle] }
 * Returns [{code, message, nodes:[], field?}] — most important first.
 */
export function problems(w, opts = {}) {
  const head = opts.head || 'start';
  const ignore = new Set(opts.ignoreVars || []);
  const out = [];
  const kind = w.kind;
  const ff = forwardField(kind);

  // 1. dangling pointer variables
  for (const v of w.varOrder) {
    const a = w.vars[v];
    if (typeof a === 'number' && (!w.nodes[a] || w.nodes[a].freed) && !ignore.has(v)) {
      out.push({ code: 'dangling-var', message: `${v} holds ${a}, but that block was freed — ${v} is a dangling pointer. Set it to a valid node or NULL.`, nodes: [a], var: v });
    }
  }
  // 2. live nodes whose fields point to freed memory or garbage
  const reach = reachableFrom(w, [w.vars[head]]);
  for (const a of reach) {
    const n = w.nodes[a];
    for (const f of fieldsOf(kind)) {
      const t = n[f];
      if (typeof t === 'number' && (!w.nodes[t] || w.nodes[t].freed)) out.push({ code: 'dangling-link', message: `${L(w, a)}->${f} still points to ${t}, which was freed (dangling link).`, nodes: [a, t], field: { addr: a, f } });
      if (t === GARBAGE) out.push({ code: 'garbage', message: `${L(w, a)}->${f} was never initialised (garbage).`, nodes: [a], field: { addr: a, f } });
    }
  }
  // 3. lost access / memory leak
  const lost = lostNodes(w);
  if (lost.length) out.push({ code: 'lost', message: `No pointer can reach ${lost.map((a) => L(w, a)).join(', ')} any more — access was lost (memory leak). If this was not meant to be deleted, the rest of the list is gone; if it was, it should have been freed first.`, nodes: lost });

  // 4. shape along the forward chain
  const r = walk(w, w.vars[head], ff);
  if (kind === 'csll') {
    if (r.addrs.length && r.end === 'null') out.push({ code: 'broken-circle', message: `The last node ${L(w, r.addrs[r.addrs.length - 1])} has next = NULL, so the list is not circular. In a circular list the last node must point back to ${head} (${w.vars[head]}).`, nodes: [r.addrs[r.addrs.length - 1]] });
    if (r.end === 'cycle' && r.closedAt !== w.vars[head]) out.push({ code: 'bad-cycle', message: `Following next from ${head} loops back to ${L(w, r.closedAt)}, not to the first node. Some nodes are skipped forever.`, nodes: [r.closedAt] });
  } else if (r.end === 'cycle') {
    const last = r.addrs[r.addrs.length - 1];
    out.push({ code: 'cycle', message: `Unintended cycle: ${L(w, last)}->${ff} points back to ${L(w, r.closedAt)}, so a traversal waiting for NULL would never stop.`, nodes: [last, r.closedAt], field: { addr: last, f: ff } });
  }
  // 5. doubly linked consistency
  if (kind === 'dll' && r.addrs.length) {
    const first = r.addrs[0];
    if (w.nodes[first].left !== null) out.push({ code: 'back-first', message: `The first node ${L(w, first)} has left = ${fmtPtr(w.nodes[first].left)}; it should be NULL because nothing comes before it.`, nodes: [first], field: { addr: first, f: 'left' } });
    for (let i = 1; i < r.addrs.length; i++) {
      const a = r.addrs[i - 1];
      const b = r.addrs[i];
      if (w.nodes[b].left !== a) {
        const was = w.nodes[b].left;
        const why = typeof was === 'number' && w.nodes[was] && w.nodes[was].freed ? ` — that is the removed (freed) node` : was === null ? '' : ` — but going forward, ${L(w, a)} comes before it`;
        out.push({ code: 'back-link', message: `Forward links look fine, but ${L(w, b)}->left = ${fmtPtr(was)}${why}. It should be ${a}. A backward traversal would go wrong here.`, nodes: [b, a], field: { addr: b, f: 'left' } });
      }
    }
  }
  // 6. tail / rear variables must point at the last node
  if (opts.lastVar && opts.lastVar in w.vars) {
    const want = r.addrs.length ? r.addrs[r.addrs.length - 1] : null;
    if (w.vars[opts.lastVar] !== want) out.push({ code: 'last-var', message: `${opts.lastVar} should point to the last node (${fmtPtr(want)}), but it holds ${fmtPtr(w.vars[opts.lastVar])}.`, nodes: want ? [want] : [], var: opts.lastVar });
  }
  return out;
}

/**
 * Compare a world with the expected goal world.
 * opts.head, opts.lastVar, opts.locals (var names that are allowed to be anything)
 * Returns {correct, issues:[string], problems:[...]}.
 */
export function compareToGoal(w, goal, opts = {}) {
  const head = opts.head || 'start';
  const ff = forwardField(w.kind);
  const issues = [];
  const probs = problems(w, { ...opts, ignoreVars: opts.locals || [] });
  const got = walk(w, w.vars[head], ff);
  const want = walk(goal, goal.vars[head], ff);
  const sameAddrs = got.addrs.length === want.addrs.length && got.addrs.every((a, i) => a === want.addrs[i]);
  if (!sameAddrs) {
    const gv = got.values.join(' → ') || '(empty)';
    const wv = want.values.join(' → ') || '(empty)';
    if (gv === wv) issues.push(`The values read ${gv}, which looks right, but the nodes are not the expected ones (check which node addresses are linked; e.g. a new node must be the one getnode() returned).`);
    else issues.push(`Following ${head} gives ${gv}; expected ${wv}.`);
  }
  // globals that must match (tail/rear/top/front)
  for (const v of goal.globals || []) {
    if (v !== head && goal.vars[v] !== w.vars[v]) issues.push(`${v} should hold ${fmtPtr(goal.vars[v])} but holds ${fmtPtr(w.vars[v])}.`);
  }
  // nodes that should be freed / kept
  for (const n of Object.values(goal.nodes)) {
    const mine = w.nodes[n.addr];
    if (n.freed && mine && !mine.freed) issues.push(`Node ${L(w, n.addr)} was removed from the list but never freed (memory leak). Call free on it.`);
  }
  // goal sweeps freed nodes; if a node is absent from the goal but present & live here, it should have been freed
  for (const n of liveNodes(w)) {
    if (!goal.nodes[n.addr] && !(opts.newAddrs || []).includes(n.addr)) issues.push(`Node ${L(w, n.addr)} should have been freed.`);
  }
  for (const n of Object.values(w.nodes)) {
    if (n.freed && goal.nodes[n.addr] && !goal.nodes[n.addr].freed) issues.push(`Node ${n.addr} was freed but it is still part of the expected list.`);
  }
  const correct = issues.length === 0 && probs.filter((p) => p.code !== 'dangling-var').length === 0 && !probs.some((p) => p.code === 'dangling-var' && !(opts.locals || []).includes(p.var));
  return { correct, issues, problems: probs };
}

/**
 * Replay actions and find the FIRST problematic one.
 * - lost access (irreversible in C: the address is gone),
 * - freeing a node that is still linked from the structure,
 * - using a node after access to it had been lost,
 * - otherwise the action that last wrote the field/var behind a final problem.
 */
export function diagnoseHistory(initial, actions, opts = {}) {
  const w = clone(initial);
  const lostAt = {};
  const lastWrite = {};
  const head = opts.head || 'start';
  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    // using a lost node?
    const refs = [act.addr, act.value].filter((x) => typeof x === 'number');
    for (const a of refs) {
      if (lostAt[a] != null) {
        return { index: i, code: 'use-lost', message: `Action ${i + 1} (${describeAction(w, act)}) uses node ${a}, but after action ${lostAt[a] + 1} no pointer held its address. In a real program you could not write this line. Undo back to action ${lostAt[a] + 1} and save the address first (e.g. in temp).`, nodes: [a] };
      }
    }
    if (act.type === 'free') {
      const holders = [];
      for (const n of liveNodes(w)) for (const f of fieldsOf(w.kind)) if (n[f] === act.addr && n.addr !== act.addr) holders.push(`${n.addr}->${f}`);
      const inList = walk(w, w.vars[head], forwardField(w.kind)).addrs.includes(act.addr);
      if (inList || holders.length) {
        const r = applyAction(w, act);
        const back = holders.find((h) => h.endsWith('->left'));
        const msg = !inList && back
          ? `Action ${i + 1} frees ${act.addr}, but ${back} still points at it. You updated the forward link but left the backward link pointing at the removed node — it now dangles. Update ${back} before freeing.`
          : `Action ${i + 1} frees ${act.addr} while it is still linked (${inList ? `reachable from ${head}` : holders.join(', ')}). Those links now dangle. Unlink the node first, then free it.`;
        return { index: i, code: 'free-linked', message: msg, nodes: [act.addr], ok: r.ok };
      }
    }
    const before = new Set(lostNodes(w));
    const r = applyAction(w, act);
    if (!r.ok) return { index: i, code: 'invalid', message: `Action ${i + 1}: ${r.error}` };
    if (act.type === 'setField') lastWrite[`${act.addr}.${act.field}`] = i;
    if (act.type === 'setVar') lastWrite[`var.${act.name}`] = i;
    const nowLost = lostNodes(w).filter((a) => !before.has(a));
    if (nowLost.length) {
      nowLost.forEach((a) => (lostAt[a] = i));
      if (!opts.allowLoss || !nowLost.every((a) => (opts.allowLoss || []).includes(a))) {
        return { index: i, code: 'lost', message: `Action ${i + 1} (${describeAction(w, act)}) overwrote the only pointer to ${nowLost.map((a) => L(w, a)).join(', ')}. Access to ${nowLost.length > 1 ? 'those nodes' : 'that node'} is lost${nowLost.length > 1 ? ' — the rest of the list is unreachable' : ''}. Fix: save that address in a temporary pointer BEFORE overwriting, or do the assignments in the other order.`, nodes: nowLost };
      }
    }
  }
  const probs = problems(w, { ...opts, ignoreVars: opts.locals || [] });
  if (probs.length) {
    const p = probs[0];
    let idx = null;
    if (p.field) idx = lastWrite[`${p.field.addr}.${p.field.f}`];
    if (p.var) idx = lastWrite[`var.${p.var}`];
    const where = idx != null ? `It comes from action ${idx + 1} (${describeAction(w, actions[idx])}). ` : p.field ? `You never updated ${p.field.addr}->${p.field.f}. ` : '';
    return { index: idx, code: p.code, message: where + p.message, nodes: p.nodes, final: true };
  }
  return null;
}
