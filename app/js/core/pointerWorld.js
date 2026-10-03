// Simulated heap for pointer-based structures (singly, doubly, circular lists,
// linked stacks and queues). Pure data + pure helpers: no DOM here.
//
// A "world" is a plain JSON-serialisable object so it can be snapshotted for
// step-back and saved in progress files.
//
//   nodes[addr] = { addr, data, next | left,right, freed }
//   vars[name]  = addr | null        (named pointer variables: start, temp, ...)
//
// A field value is an address (number), null (NULL) or GARBAGE ('?') for a
// freshly malloc'd, not yet initialised field.

export const GARBAGE = '?';

export const FIELDS = {
  sll: ['next'],
  csll: ['next'],
  dll: ['left', 'right'],
};

export function fieldsOf(kind) {
  return FIELDS[kind] || ['next'];
}

/** The "forward" field used to walk a list from start. */
export function forwardField(kind) {
  return kind === 'dll' ? 'right' : 'next';
}

export function createWorld(kind, varNames = ['start'], opts = {}) {
  return {
    kind,
    nodes: {},
    vars: Object.fromEntries(varNames.map((v) => [v, null])),
    varOrder: [...varNames],
    globals: opts.globals || [varNames[0]],
    nextAddr: opts.firstAddr || 100,
    addrStep: opts.addrStep || 100,
    addrPool: opts.addrPool ? [...opts.addrPool] : null,
  };
}

export function clone(w) {
  return JSON.parse(JSON.stringify(w));
}

/** malloc(sizeof(node)) – fields are uninitialised garbage until assigned. */
export function malloc(w, { addr } = {}) {
  let a = addr;
  if (a == null) {
    if (w.addrPool && w.addrPool.length) a = w.addrPool.shift();
    else {
      a = w.nextAddr;
      while (w.nodes[a]) a += w.addrStep;
      w.nextAddr = a + w.addrStep;
    }
  }
  const n = { addr: a, data: GARBAGE, freed: false };
  for (const f of fieldsOf(w.kind)) n[f] = GARBAGE;
  w.nodes[a] = n;
  return a;
}

/** getnode() from the notes: malloc + data + every link = NULL. */
export function getnode(w, data, opts) {
  const a = malloc(w, opts);
  w.nodes[a].data = data;
  for (const f of fieldsOf(w.kind)) w.nodes[a][f] = null;
  return a;
}

export function free(w, addr) {
  const n = w.nodes[addr];
  if (!n) throw new Error(`free(${addr}): no such block`);
  if (n.freed) throw new Error(`double free of ${addr}`);
  n.freed = true;
}

/** Remove freed blocks from the picture (after an operation finishes). */
export function sweepFreed(w) {
  for (const a of Object.keys(w.nodes)) if (w.nodes[a].freed) delete w.nodes[a];
}

export function addVar(w, name, value = null) {
  if (!(name in w.vars)) w.varOrder.push(name);
  w.vars[name] = value;
}

export function dropVar(w, name) {
  delete w.vars[name];
  w.varOrder = w.varOrder.filter((v) => v !== name);
}

export function liveNodes(w) {
  return Object.values(w.nodes).filter((n) => !n.freed);
}

/** Build a clean list from values (no tracing). Returns world. */
export function buildList(kind, values, opts = {}) {
  const w = createWorld(kind, opts.vars || ['start'], opts);
  const ff = forwardField(kind);
  let prev = null;
  const addrs = [];
  for (const v of values) {
    const a = getnode(w, v);
    addrs.push(a);
    if (prev == null) w.vars[w.varOrder[0]] = a;
    else {
      w.nodes[prev][ff] = a;
      if (kind === 'dll') w.nodes[a].left = prev;
    }
    prev = a;
  }
  if (kind === 'csll' && addrs.length) w.nodes[addrs[addrs.length - 1]].next = addrs[0];
  return w;
}

/**
 * Walk forward from a variable. Stops at NULL, at a revisit (cycle), on garbage,
 * at a freed node, or after `limit` steps. Returns {addrs, values, end}.
 * end ∈ 'null' | 'cycle' | 'garbage' | 'freed' | 'limit' | 'missing'
 * For circular lists a return to the first node is reported as 'cycle' with
 * `closedAt` = first address.
 */
export function walk(w, fromAddr, field = forwardField(w.kind), limit = 200) {
  const addrs = [];
  const seen = new Set();
  let cur = fromAddr;
  while (true) {
    if (cur === null) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'null' };
    if (cur === GARBAGE) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'garbage' };
    const n = w.nodes[cur];
    if (!n) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'missing', at: cur };
    if (n.freed) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'freed', at: cur };
    if (seen.has(cur)) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'cycle', closedAt: cur };
    if (addrs.length >= limit) return { addrs, values: addrs.map((a) => w.nodes[a].data), end: 'limit' };
    seen.add(cur);
    addrs.push(cur);
    cur = n[field];
  }
}

/** Values of the list from start (forward). */
export function listValues(w, startVar = w.varOrder[0]) {
  return walk(w, w.vars[startVar]).values;
}

/** Addresses every live node can be reached from, following all link fields. */
export function reachableFrom(w, roots) {
  const seen = new Set();
  const stack = [...roots].filter((a) => typeof a === 'number' && w.nodes[a] && !w.nodes[a].freed);
  while (stack.length) {
    const a = stack.pop();
    if (seen.has(a)) continue;
    seen.add(a);
    for (const f of fieldsOf(w.kind)) {
      const t = w.nodes[a][f];
      if (typeof t === 'number' && w.nodes[t] && !w.nodes[t].freed && !seen.has(t)) stack.push(t);
    }
  }
  return seen;
}

/** Nodes nobody can reach any more (memory leak / lost access). */
export function lostNodes(w) {
  const roots = Object.values(w.vars);
  const r = reachableFrom(w, roots);
  return liveNodes(w).filter((n) => !r.has(n.addr)).map((n) => n.addr);
}

/** Who points at an address: vars and node fields. */
export function pointersTo(w, addr) {
  const out = [];
  for (const v of w.varOrder) if (w.vars[v] === addr) out.push({ type: 'var', name: v });
  for (const n of Object.values(w.nodes)) {
    for (const f of fieldsOf(w.kind)) if (n[f] === addr) out.push({ type: 'field', addr: n.addr, field: f });
  }
  return out;
}

export function fmtPtr(v) {
  if (v === null) return 'NULL';
  if (v === GARBAGE) return '? (garbage)';
  return String(v);
}
