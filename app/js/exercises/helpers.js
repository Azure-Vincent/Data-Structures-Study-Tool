// Shared generators used by several lecture templates.
import { buildList, createWorld, addVar, walk, forwardField, clone } from '../core/pointerWorld.js';

/** Random list values (distinct). */
export function values(rng, n, lo = 1, hi = 99) {
  return rng.distinct(n, lo, hi);
}

/** Build a list whose addresses are either lecture-style (100, 200, ...) or scattered. */
export function randList(rng, kind, vals, { vars = ['start'], scatter = null, globals } = {}) {
  const useScatter = scatter ?? rng.bool(0.5);
  const opts = { vars, globals: globals || [vars[0]] };
  if (useScatter) {
    const pool = rng.distinct(vals.length + 4, 10, 98).map((x) => x * 10);
    opts.addrPool = pool;
  }
  const w = buildList(kind, vals, opts);
  w.globals = globals || [vars[0]];
  return w;
}

export function withVars(w, names) {
  const c = clone(w);
  for (const v of names) if (!(v in c.vars)) addVar(c, v, null);
  return c;
}

export function addrs(w, head = 'start') {
  return walk(w, w.vars[head], forwardField(w.kind)).addrs;
}

export function vals(w, head = 'start') {
  return walk(w, w.vars[head], forwardField(w.kind)).values;
}

export function listText(vs) {
  return vs.length ? vs.join(' → ') : '(empty)';
}

export function arrow(kind) {
  return kind === 'dll' ? '⇄' : '→';
}

export function emptyWorld(kind, vars = ['start']) {
  const w = createWorld(kind, vars);
  w.globals = [vars[0]];
  return w;
}

/** Guidance text by level. */
export function guide(level, full, less = '') {
  if (level === 'full') return full;
  if (level === 'less') return less;
  return '';
}

import { getnode as _getnode } from '../core/pointerWorld.js';

/** Build a rewire spec from a world and a core operation (op returns a trace). */
export function rewireSpec(world, op, { vars = ['start', 'temp', 'prev', 'newnode'], head = 'start', lastVar = null, locals, newValue = null } = {}) {
  const goal = op(world).final;
  goal.globals = world.globals || [head];
  const w = withVars(world, vars);
  w.globals = world.globals || [head];
  return { world: w, goal, opts: { head, lastVar, locals: locals || vars.filter((v) => !(world.globals || [head]).includes(v)) }, newValue, vars };
}

/** A copy of `world` with a freshly getnode()'d newnode (same address malloc would give). */
export function withNewnode(world, value, name = 'newnode') {
  const w = clone(world);
  const a = _getnode(w, value);
  addVar(w, name, a);
  return w;
}

/** Copy of world with named pointer vars set to node positions (1-based; 0 = NULL). */
export function withPointers(world, map) {
  const w = clone(world);
  const as = addrs(w);
  for (const [k, pos] of Object.entries(map)) addVar(w, k, pos ? as[pos - 1] : null);
  return w;
}

import { fieldsOf as _fieldsOf } from '../core/pointerWorld.js';

/**
 * Options for "which pointers change?" — every var and every link field of
 * every node that exists before or after; correct = value differs.
 */
export function linkChoices(before, after, { newLabel = 'the new node' } = {}) {
  const out = [];
  const label = (a) => `node ${before.nodes[a] ? before.nodes[a].data : after.nodes[a]?.data} (@${a})`;
  for (const v of before.globals || [before.varOrder[0]]) out.push({ text: `${v}`, correct: before.vars[v] !== after.vars[v], key: 'var:' + v });
  const addrsAll = [...new Set([...Object.keys(before.nodes), ...Object.keys(after.nodes)].map(Number))];
  for (const a of addrsAll) {
    const isNew = !before.nodes[a];
    const gone = !after.nodes[a];
    for (const f of _fieldsOf(before.kind)) {
      const b = isNew ? null : before.nodes[a][f];
      const c = gone ? b : after.nodes[a][f];
      out.push({ text: isNew ? `${newLabel}'s ${f}` : `${label(a)}->${f}${gone ? ' (node being removed)' : ''}`, correct: isNew ? c !== null : b !== c, key: `${a}.${f}` });
    }
  }
  return out;
}
