// Pseudocode Lab interpreter. Executes the AST from lang.js against a
// simulated heap — never as host code. It is a generator: every observable
// action yields one event, so the caller controls pacing, history and the
// instruction limit.
//
// Values:  number | string | boolean | null (NULL) | {ref: addr} (pointer to a node)
//          | {coll: id} (Queue/Stack/Set/Array) | {graph: true}
// Events:  { kind, line, text, hl: {nodes, links, vars, anim}, change }
//   kind ∈ alloc | link | move | data | assign | free | cond | call | return | print | op
import { LabError, exprText } from './lang.js';
import { STRUCTURES } from './structures.js';
import * as G from '../core/graph.js';

export const MAX_DEPTH = 100;

export const isRef = (v) => v !== null && typeof v === 'object' && 'ref' in v;
export const isColl = (v) => v !== null && typeof v === 'object' && 'coll' in v;
export const isGraph = (v) => v !== null && typeof v === 'object' && v.graph === true;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isPrim = (v) => v === null || ['number', 'string', 'boolean'].includes(typeof v);

class Return {
  constructor(value, line) {
    this.value = value;
    this.line = line;
  }
}
const BREAK = { signal: 'break' };
const CONTINUE = { signal: 'continue' };

const COLL_NAMES = { queue: 'Queue', stack: 'Stack', set: 'Set', array: 'Array' };

/** Plain text for print/output. */
export function printText(st, v) {
  if (v === null) return 'NULL';
  if (v === undefined) return '?';
  if (isRef(v)) return `@${v.ref}`;
  if (isColl(v)) return `[${(st.colls[v.coll]?.items || []).map((x) => printText(st, x)).join(', ')}]`;
  if (isGraph(v)) return 'G';
  return String(v);
}

/** Text for explanations: pointers show their target's data. */
export function fmt(st, v) {
  if (v === null) return 'NULL';
  if (v === undefined) return 'nothing';
  if (isRef(v)) {
    const n = st.nodes[v.ref];
    if (!n) return `@${v.ref}`;
    return n.freed ? `@${v.ref} (deleted)` : `@${v.ref} (${dataText(n.data)})`;
  }
  if (isColl(v)) {
    const c = st.colls[v.coll];
    return c ? `${COLL_NAMES[c.kind]} [${c.items.map((x) => fmt(st, x)).join(', ')}]` : 'collection';
  }
  if (isGraph(v)) return 'the graph G';
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

export function dataText(d) {
  if (d === null) return 'NULL';
  if (typeof d === 'string') return d;
  return String(d);
}

function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function suggest(name, candidates) {
  let best = null;
  let bd = 3;
  for (const c of candidates) {
    const dist = c.toLowerCase() === name.toLowerCase() ? 0 : levenshtein(name, c);
    if (dist < bd) {
      bd = dist;
      best = c;
    }
  }
  return best;
}

function varsIn(e, out = new Set()) {
  if (!e || typeof e !== 'object') return out;
  if (e.t === 'var') out.add(e.name);
  for (const k of ['a', 'b', 'obj', 'idx']) if (e[k]) varsIn(e[k], out);
  for (const k of ['args', 'items']) if (e[k]) e[k].forEach((x) => varsIn(x, out));
  return out;
}

export class Machine {
  /**
   * program: parse() result; state: from buildInitial(); graph: read-only graph or null
   */
  constructor(program, state, { graph = null, maxDepth = MAX_DEPTH } = {}) {
    this.prog = program;
    this.st = state;
    this.graph = graph;
    this.S = STRUCTURES[state.structure] || STRUCTURES.sll;
    this.maxDepth = maxDepth;
    this.line = null;
    this.lastCmp = null;
  }

  get top() {
    return this.st.frames[this.st.frames.length - 1];
  }
  get globals() {
    return this.st.frames[0];
  }

  *run() {
    for (const s of this.prog.body) yield* this.exec(s);
  }

  // ---------------------------------------------------------------- helpers
  err(msg, node, hint, tag) {
    throw new LabError('runtime', msg, { line: node?.line ?? this.line, col: node?.col, hint, tag });
  }
  ev(kind, line, text, hl = {}, change = null) {
    return { kind, line, text, hl: { nodes: [], links: [], vars: [], ...hl }, change };
  }
  f(v) {
    return fmt(this.st, v);
  }
  node(addr) {
    return this.st.nodes[addr];
  }
  visibleNames() {
    return [...new Set([...Object.keys(this.top.vars), ...Object.keys(this.globals.vars)])];
  }

  lookup(name, e) {
    if (own(this.top.vars, name)) return this.top.vars[name];
    if (this.top !== this.globals && own(this.globals.vars, name)) return this.globals.vars[name];
    if (own(this.prog.funcs, name)) this.err(`${name} is a function; call it with parentheses: ${name}(…)`, e);
    const near = suggest(name, this.visibleNames());
    const root = this.S.roots.includes(name) ? '' : this.S.roots.length ? ` The structure is held in ${this.S.roots.join(' and ')}.` : '';
    this.err(`The variable ${name} has no value yet.`, e, near ? `Did you mean ${near}? Names are case-sensitive.` : `Assign it before using it (for example ${name} = ${this.S.roots[0] || 'NULL'}).${root}`, 'undefined-var');
    return undefined;
  }

  /** C-like scoping: assigning inside a function updates a global of that name if it exists, otherwise creates a local. */
  setVar(name, v) {
    let fr = this.top;
    if (fr !== this.globals && !own(fr.vars, name) && own(this.globals.vars, name)) fr = this.globals;
    if (!own(fr.vars, name)) fr.order.push(name);
    const old = fr.vars[name];
    fr.vars[name] = v;
    if (typeof v === 'string' && this.graph && this.graph.vertices.includes(v)) this.st.lastVertex = v;
    return { old, frame: fr };
  }

  temp(v) {
    if (isRef(v)) this.top.temps.push(v.ref);
  }

  canonField(name, e) {
    const low = name.toLowerCase();
    if (low === 'data') return 'data';
    if (own(this.S.aliases, low)) return this.S.aliases[low];
    if (this.S.fields.includes(low)) return low;
    const list = ['data', ...this.S.fields, ...Object.keys(this.S.aliases)].join(', ');
    let hint = `A node here has the fields: ${list}.`;
    if ((low === 'prev' || low === 'left') && this.S.id !== 'dll' && this.S.id !== 'tree') hint += ' A singly linked node has no backward pointer — keep a second variable that trails one node behind.';
    if (low === 'value' || low === 'info' || low === 'val') hint = 'The value inside a node is called data.';
    this.err(`Nodes in a ${this.S.label.toLowerCase()} have no field “${name}”.`, e, hint, 'value-vs-address');
    return null;
  }

  /** Follow a pointer value to its live node, or raise a precise error. */
  deref(v, objExpr, fieldName, e) {
    const what = exprText(objExpr);
    if (v === null) this.err(`${what} is NULL, so ${what}.${fieldName} does not exist.`, e, `Following a NULL pointer crashes a C program. Check ${what} != NULL before using ${what}.${fieldName}.`, 'null-deref');
    if (!isRef(v)) {
      const hint = typeof v === 'number' || typeof v === 'string' ? `${what} holds a value, not a node. Values live in .data; to move along the structure keep the node itself, e.g. p = p.next rather than p = p.data.` : `Only nodes have fields like .${fieldName}.`;
      this.err(`${what} is ${this.f(v)}, not a node, so it has no .${fieldName}.`, e, hint, 'value-vs-address');
    }
    const n = this.node(v.ref);
    if (!n) this.err(`${what} points to @${v.ref}, which does not exist.`, e);
    if (n.freed) this.err(`${what} points to @${v.ref}, which was deleted on line ${n.freedLine}.`, e, 'Using a node after deleting it is a dangling-pointer bug. Save what you need (such as its next pointer) before deleting it.', 'dangling');
    return n;
  }

  truthy(v, e) {
    if (typeof v === 'boolean') return v;
    if (v === null) return false;
    if (isRef(v) || isColl(v) || isGraph(v)) return true;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v !== '';
    this.err('This condition has no value.', e);
    return false;
  }

  eq(a, b, e) {
    if (isRef(a) && isRef(b)) return a.ref === b.ref;
    if ((isRef(a) && b === null) || (a === null && isRef(b))) return false;
    if ((isRef(a) && isPrim(b)) || (isPrim(a) && isRef(b))) {
      const [p, side] = isRef(a) ? [b, e.a] : [a, e.b];
      this.err(`This compares a node (${this.f(isRef(a) ? a : b)}) with the value ${this.f(p)}.`, e, `A pointer holds an address, never a value. Compare ${exprText(side)}.data instead, or compare the pointer with NULL.`, 'value-vs-address');
    }
    if (isColl(a) && isColl(b)) return a.coll === b.coll;
    return a === b;
  }

  // ---------------------------------------------------------------- statements
  *execBody(stmts) {
    for (const s of stmts) yield* this.exec(s);
  }

  *exec(s) {
    this.line = s.line;
    switch (s.t) {
      case 'assign':
        yield* this.execAssign(s);
        break;
      case 'expr':
        if (s.expr.t === 'call') yield* this.call(s.expr, true);
        else yield* this.eval(s.expr);
        break;
      case 'print': {
        const vals = [];
        for (const a of s.args) vals.push(yield* this.eval(a));
        const text = vals.map((v) => printText(this.st, v)).join(' ');
        this.st.output.push(text);
        const vs = [...varsIn({ args: s.args })];
        yield this.ev('print', s.line, `Printed “${text}”.`, { vars: vs, nodes: vals.filter(isRef).map((v) => v.ref) });
        break;
      }
      case 'delete':
        yield* this.execDelete(s);
        break;
      case 'if': {
        let ran = false;
        for (let k = 0; k < s.arms.length; k++) {
          const arm = s.arms[k];
          this.line = arm.line;
          const c = yield* this.condStep(arm.cond, arm.line, (v) => (v ? 'so this branch runs' : k < s.arms.length - 1 ? 'so the next condition is checked' : s.elseBody ? 'so the else branch runs' : 'so the if body is skipped'));
          if (c) {
            yield* this.execBody(arm.body);
            ran = true;
            break;
          }
        }
        if (!ran && s.elseBody) yield* this.execBody(s.elseBody);
        break;
      }
      case 'while':
        while (true) {
          const c = yield* this.condStep(s.cond, s.line, (v) => (v ? 'so the loop body runs' : 'so the loop ends'));
          if (!c) break;
          try {
            yield* this.execBody(s.body);
          } catch (x) {
            if (x === BREAK) break;
            if (x !== CONTINUE) throw x;
          }
        }
        break;
      case 'repeat':
        while (true) {
          try {
            yield* this.execBody(s.body);
          } catch (x) {
            if (x === BREAK) break;
            if (x !== CONTINUE) throw x;
          }
          this.line = s.condLine;
          const c = yield* this.condStep(s.cond, s.condLine, (v) => ((s.stopWhen ? v : !v) ? 'so the loop ends' : 'so the body runs again'));
          if (s.stopWhen ? c : !c) break;
        }
        break;
      case 'for':
        yield* this.execFor(s);
        break;
      case 'foreach':
        yield* this.execForEach(s);
        break;
      case 'return': {
        const v = s.expr ? yield* this.eval(s.expr) : undefined;
        throw new Return(v, s.line);
      }
      case 'break':
        throw BREAK;
      case 'continue':
        throw CONTINUE;
      default:
        this.err(`Unsupported statement ${s.t}.`, s);
    }
    this.top.temps = [];
  }

  *condStep(cond, line, after) {
    this.lastCmp = null;
    const v = yield* this.eval(cond);
    const c = this.truthy(v, cond);
    let detail = '';
    if (this.lastCmp && this.lastCmp.e === cond) {
      const parts = [];
      for (const [side, val] of [
        [cond.a, this.lastCmp.a],
        [cond.b, this.lastCmp.b],
      ]) {
        if (!['num', 'str', 'null', 'bool'].includes(side.t)) parts.push(`${exprText(side)} is ${this.f(val)}`);
      }
      if (parts.length) detail = ` (${parts.join(', ')})`;
    }
    const vars = [...varsIn(cond)];
    const nodes = vars.map((n) => (own(this.top.vars, n) ? this.top.vars[n] : own(this.globals.vars, n) ? this.globals.vars[n] : null)).filter(isRef).map((r) => r.ref);
    yield this.ev('cond', line, `Checked ${exprText(cond)}${detail} → ${c ? 'true' : 'false'}, ${after(c)}.`, { vars, nodes });
    return c;
  }

  *execFor(s) {
    const from = yield* this.eval(s.from);
    const to = yield* this.eval(s.to);
    const step = s.step ? yield* this.eval(s.step) : 1;
    for (const [v, e] of [
      [from, s.from],
      [to, s.to],
      [step, s.step || s],
    ])
      if (typeof v !== 'number') this.err(`A counting loop needs numbers, but ${exprText(e)} is ${this.f(v)}.`, e);
    if (step === 0) this.err('The step of a for loop cannot be 0.', s.step);
    let i = from;
    while (step > 0 ? i <= to : i >= to) {
      this.setVar(s.var, i);
      yield this.ev('assign', s.line, `Loop counter ${s.var} = ${i} (runs while ${s.var} ${step > 0 ? '≤' : '≥'} ${to}).`, { vars: [s.var] });
      try {
        yield* this.execBody(s.body);
      } catch (x) {
        if (x === BREAK) return;
        if (x !== CONTINUE) throw x;
      }
      const cur = this.lookup(s.var, s);
      if (typeof cur !== 'number') this.err(`The loop counter ${s.var} was changed to ${this.f(cur)}.`, s);
      i = cur + step;
    }
    yield this.ev('cond', s.line, `${s.var} would be ${i}, past ${to}, so the loop ends.`, { vars: [s.var] });
  }

  *execForEach(s) {
    const c = yield* this.eval(s.coll);
    if (!isColl(c)) this.err(`for each needs a list, queue, stack or set, but ${exprText(s.coll)} is ${this.f(c)}.`, s.coll, 'Loop over a linked list with while p != NULL do … p = p.next … end.');
    const items = [...this.st.colls[c.coll].items];
    if (!items.length) yield this.ev('cond', s.line, `${exprText(s.coll)} is empty, so the loop body never runs.`);
    for (let k = 0; k < items.length; k++) {
      this.setVar(s.var, items[k]);
      yield this.ev('assign', s.line, `${s.var} = ${this.f(items[k])} (item ${k + 1} of ${items.length} in ${exprText(s.coll)}).`, { vars: [s.var], nodes: isRef(items[k]) ? [items[k].ref] : [] });
      try {
        yield* this.execBody(s.body);
      } catch (x) {
        if (x === BREAK) return;
        if (x !== CONTINUE) throw x;
      }
    }
  }

  *execAssign(s) {
    let val = yield* this.eval(s.expr);
    if (s.op !== '=') {
      const cur = yield* this.eval(s.target);
      val = this.arith(s.op[0], cur, val, { ...s, a: s.target, b: s.expr });
    }
    yield* this.store(s.target, val, s);
  }

  *store(t, val, s) {
    if (val === undefined) this.err('There is no value to assign.', s);
    if (t.t === 'var') {
      const { old } = this.setVar(t.name, val);
      const ptr = isRef(val) || (val === null && (old === undefined || old === null || isRef(old)));
      if (ptr) {
        let text;
        const was = old === undefined ? '' : ` (was ${this.f(old)})`;
        if (s.expr.t === 'field' && isRef(old) && isRef(val)) text = `${t.name} moves along ${exprText(s.expr)}: from ${this.f(old)} to ${this.f(val)}. Only the variable changed — no node was modified.`;
        else if (s.expr.t === 'new') text = `${t.name} now holds the address of the new node, ${this.f(val)}.`;
        else if (val === null) text = `${t.name} is now NULL${was}.`;
        else text = `${t.name} now points to ${this.f(val)}${was}. No node was modified.`;
        yield this.ev('move', s.line, text, { vars: [t.name], nodes: isRef(val) ? [val.ref] : [] }, { type: 'var', name: t.name, from: old ?? null, to: val });
      } else {
        const was = old === undefined ? '' : ` (was ${this.f(old)})`;
        yield this.ev('assign', s.line, `${t.name} = ${this.f(val)}${was}.`, { vars: [t.name] }, { type: 'var', name: t.name, from: old ?? null, to: val });
      }
      return;
    }
    if (t.t === 'field') {
      const obj = yield* this.eval(t.obj);
      const n = this.deref(obj, t.obj, t.name, t);
      const f = this.canonField(t.name, t);
      if (f === 'data') {
        if (!isPrim(val)) this.err(`${exprText(t)} holds a value, but ${this.f(val)} is a ${isRef(val) ? 'pointer' : 'collection'}.`, t, isRef(val) ? `To link nodes, assign to a pointer field instead, e.g. ${exprText(t.obj)}.${this.S.forward || this.S.fields[0]} = ${exprText(s.expr)}.` : '', 'value-vs-address');
        const old = n.data;
        n.data = val;
        yield this.ev('data', s.line, `Value change: the data of @${n.addr} changed from ${this.f(old)} to ${this.f(val)}. No pointer moved — the node keeps its address and its links.`, { nodes: [n.addr], vars: [...varsIn(t.obj)] }, { type: 'data', addr: n.addr, from: old, to: val });
        return;
      }
      if (val !== null && !isRef(val)) {
        this.err(`${exprText(t)} must point to a node or be NULL, but ${exprText(s.expr)} is ${this.f(val)}.`, s.expr, typeof val === 'number' || typeof val === 'string' ? `To store the value, use ${exprText(t.obj)}.data = ${exprText(s.expr)}. To link, assign a node: ${exprText(t)} = newnode.` : '', 'value-vs-address');
      }
      if (isRef(val)) {
        const target = this.node(val.ref);
        if (!target || target.freed) this.err(`${exprText(s.expr)} points to @${val.ref}, which was deleted on line ${target?.freedLine}; linking to it would create a dangling pointer.`, s.expr, '', 'dangling');
      }
      const old = n[f];
      const to = isRef(val) ? val.ref : null;
      n[f] = to;
      const fromTxt = old === null ? 'NULL' : this.f({ ref: old });
      const toTxt = to === null ? 'NULL' : this.f({ ref: to });
      const same = old === to ? ' (it already pointed there, so nothing changed)' : '';
      yield this.ev('link', s.line, `Pointer change: ${exprText(t)} — the ${f} field of @${n.addr} — was ${fromTxt}, now ${toTxt}${same}.`, { nodes: [n.addr, to].filter((x) => x != null), links: [{ from: n.addr, field: f }], vars: [...varsIn(t.obj)], anim: 'link' }, { type: 'field', addr: n.addr, field: f, from: old, to, text: exprText(t) });
      return;
    }
    if (t.t === 'index') {
      const c = yield* this.eval(t.obj);
      const idx = yield* this.eval(t.idx);
      const coll = this.arrayOf(c, t);
      this.checkIndex(coll, idx, t);
      const old = coll.items[idx];
      coll.items[idx] = val;
      yield this.ev('assign', s.line, `${exprText(t.obj)}[${idx}] = ${this.f(val)} (was ${this.f(old)}).`, { vars: [...varsIn(t.obj)] });
      return;
    }
    this.err('You can only assign to a variable, a field, or an array slot.', s);
  }

  *execDelete(s) {
    const v = yield* this.eval(s.expr);
    const what = exprText(s.expr);
    if (v === null) {
      yield this.ev('free', s.line, `${what} is NULL, so delete does nothing (allowed, but there was no node to delete).`, { vars: [...varsIn(s.expr)] });
      return;
    }
    if (!isRef(v)) this.err(`delete needs a pointer to a node, but ${what} is ${this.f(v)}.`, s.expr, 'Delete the node itself (delete p), not its value (delete p.data).', 'value-vs-address');
    const n = this.node(v.ref);
    if (n.freed) this.err(`@${n.addr} was already deleted on line ${n.freedLine} (deleting it twice).`, s.expr, 'After delete, the pointer still holds the old address. Set it to NULL or move it before deleting again.', 'dangling');
    n.freed = true;
    n.freedLine = s.line;
    const holders = this.holdersOf(n.addr);
    const tail = holders.length ? `${holders.join(', ')} still hold${holders.length === 1 ? 's' : ''} @${n.addr}; following ${holders.length === 1 ? 'it' : 'them'} now would be a dangling-pointer bug.` : 'Nothing points to it any more.';
    yield this.ev('free', s.line, `Deleted node @${n.addr} (${dataText(n.data)}). Its memory is released. ${tail}`, { nodes: [n.addr], vars: [...varsIn(s.expr)], anim: 'free' }, { type: 'free', addr: n.addr });
  }

  /** Names of variables/fields currently holding addr (for messages). */
  holdersOf(addr) {
    const out = [];
    this.st.frames.forEach((fr, i) => {
      for (const name of fr.order) if (isRef(fr.vars[name]) && fr.vars[name].ref === addr) out.push(i === 0 || fr === this.top ? name : `${name} (in ${fr.fn})`);
    });
    for (const n of Object.values(this.st.nodes)) {
      if (n.freed) continue;
      for (const f of this.S.fields) if (n[f] === addr) out.push(`@${n.addr}.${f}`);
    }
    return out;
  }

  // ---------------------------------------------------------------- expressions
  *eval(e) {
    switch (e.t) {
      case 'num':
      case 'str':
      case 'bool':
        return e.v;
      case 'null':
        return null;
      case 'var':
        return this.lookup(e.name, e);
      case 'field': {
        const obj = yield* this.eval(e.obj);
        const n = this.deref(obj, e.obj, e.name, e);
        const f = this.canonField(e.name, e);
        if (f === 'data') return n.data;
        return n[f] === null ? null : { ref: n[f] };
      }
      case 'index': {
        const c = yield* this.eval(e.obj);
        const idx = yield* this.eval(e.idx);
        const coll = this.arrayOf(c, e);
        this.checkIndex(coll, idx, e);
        return coll.items[idx];
      }
      case 'list': {
        const items = [];
        for (const x of e.items) items.push(yield* this.eval(x));
        return this.newColl('array', items);
      }
      case 'new':
        return yield* this.construct(e);
      case 'call':
        return yield* this.call(e, false);
      case 'un': {
        const a = yield* this.eval(e.a);
        if (e.op === 'not') return !this.truthy(a, e.a);
        if (typeof a !== 'number') this.err(`Can't negate ${this.f(a)}.`, e);
        return -a;
      }
      case 'bin': {
        if (e.op === 'and') {
          const a = yield* this.eval(e.a);
          if (!this.truthy(a, e.a)) return false;
          return this.truthy(yield* this.eval(e.b), e.b);
        }
        if (e.op === 'or') {
          const a = yield* this.eval(e.a);
          if (this.truthy(a, e.a)) return true;
          return this.truthy(yield* this.eval(e.b), e.b);
        }
        const a = yield* this.eval(e.a);
        const b = yield* this.eval(e.b);
        if (['==', '!=', '<', '<=', '>', '>='].includes(e.op)) {
          const r = this.compare(e.op, a, b, e);
          this.lastCmp = { e, a, b };
          return r;
        }
        return this.arith(e.op, a, b, e);
      }
      default:
        this.err('Unsupported expression.', e);
        return null;
    }
  }

  compare(op, a, b, e) {
    if (op === '==') return this.eq(a, b, e);
    if (op === '!=') return !this.eq(a, b, e);
    for (const [v, side] of [
      [a, e.a],
      [b, e.b],
    ]) {
      if (isRef(v)) this.err(`${exprText(side)} is a pointer (${this.f(v)}); pointers can't be ordered with ${op}.`, e, `Compare the values: ${exprText(side)}.data ${op} …`, 'value-vs-address');
      if (v === null) this.err(`${exprText(side)} is NULL and can't be compared with ${op}.`, e, '', 'null-deref');
    }
    if (typeof a !== typeof b) this.err(`Can't compare ${this.f(a)} with ${this.f(b)} using ${op}.`, e);
    if (op === '<') return a < b;
    if (op === '<=') return a <= b;
    if (op === '>') return a > b;
    return a >= b;
  }

  arith(op, a, b, e) {
    if (op === '+' && (typeof a === 'string' || typeof b === 'string') && isPrim(a) && isPrim(b)) return printText(this.st, a) + printText(this.st, b);
    for (const [v, side] of [
      [a, e.a],
      [b, e.b],
    ]) {
      if (isRef(v)) this.err(`${exprText(side)} is a pointer (${this.f(v)}); arithmetic on pointers isn't supported.`, e, `Use ${exprText(side)}.data for the node's value, or ${exprText(side)}.next to move to the next node.`, 'value-vs-address');
      if (typeof v !== 'number') this.err(`Arithmetic needs numbers, but ${exprText(side)} is ${this.f(v)}.`, e);
    }
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
      case 'div':
        if (b === 0) this.err('Division by zero.', e);
        return Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(a / b) : a / b;
      case '%':
        if (b === 0) this.err('Division by zero (mod 0).', e);
        return a % b;
      default:
        this.err(`Unknown operator ${op}.`, e);
        return null;
    }
  }

  newColl(kind, items = []) {
    const id = this.st.nextColl++;
    this.st.colls[id] = { id, kind, items };
    return { coll: id };
  }

  arrayOf(c, e) {
    if (!isColl(c) || this.st.colls[c.coll].kind !== 'array') this.err(`${exprText(e.obj)} is ${this.f(c)}, not an array, so it can't be indexed with [ ].`, e);
    return this.st.colls[c.coll];
  }
  checkIndex(coll, idx, e) {
    if (!Number.isInteger(idx)) this.err(`An array index must be a whole number, not ${this.f(idx)}.`, e);
    if (idx < 0 || idx >= coll.items.length) this.err(`Index ${idx} is outside the array (valid: 0 to ${coll.items.length - 1}).`, e, 'Arrays are numbered from 0.', 'off-by-one');
  }

  *construct(e) {
    const args = [];
    for (const a of e.args) args.push(yield* this.eval(a));
    if (e.what === 'Node') {
      if (args.length > 1) this.err('new Node takes one value: new Node(15).', e);
      const data = args.length ? args[0] : null;
      if (!isPrim(data)) this.err(`A node's data must be a value, but ${this.f(data)} is a ${isRef(data) ? 'pointer' : 'collection'}.`, e, 'Create the node with its value and link it afterwards: n = new Node(15) then n.next = p.', 'value-vs-address');
      const addr = this.st.nextAddr;
      this.st.nextAddr += 100;
      const n = { addr, data, freed: false, bornLine: e.line };
      for (const f of this.S.fields) n[f] = null;
      this.st.nodes[addr] = n;
      this.top.temps.push(addr);
      const links = this.S.fields.join(' and ');
      yield this.ev('alloc', e.line, `Created a new node at address @${addr} with data ${dataText(data)}; its ${links} ${this.S.fields.length > 1 ? 'are' : 'is'} NULL. Nothing points to it yet.`, { nodes: [addr], anim: 'alloc' }, { type: 'alloc', addr });
      return { ref: addr };
    }
    if (e.what === 'Array') {
      if (args.length > 1 || (args.length && (!Number.isInteger(args[0]) || args[0] < 0 || args[0] > 100))) this.err('new Array(n) needs a size from 0 to 100.', e);
      return this.newColl('array', Array(args[0] || 0).fill(null));
    }
    if (args.length) this.err(`new ${e.what}() takes no arguments.`, e);
    return this.newColl(e.what.toLowerCase());
  }

  *call(e, asStatement) {
    const user = own(this.prog.funcs, e.name) ? this.prog.funcs[e.name] : null;
    const builtin = own(BUILTINS, e.name) ? BUILTINS[e.name] : null;
    if (!user && !builtin) {
      if (own(this.top.vars, e.name) || own(this.globals.vars, e.name)) this.err(`${e.name} is a variable, not a function.`, e);
      const near = suggest(e.name, [...Object.keys(this.prog.funcs), ...Object.keys(BUILTINS)]);
      this.err(`There is no function called ${e.name}.`, e, near ? `Did you mean ${near}?` : 'Define it with function name(params) … end, or see the syntax reference for built-in functions.');
    }
    const args = [];
    for (const a of e.args) {
      const v = yield* this.eval(a);
      if (v === undefined) this.err(`${exprText(a)} has no value to pass.`, a);
      args.push(v);
    }
    let result;
    if (user) result = yield* this.callUser(user, args, e);
    else {
      if (args.length < builtin.min || args.length > builtin.max) this.err(`${e.name} takes ${builtin.min === builtin.max ? builtin.min : `${builtin.min}–${builtin.max}`} argument${builtin.max === 1 ? '' : 's'}: ${builtin.sig}.`, e);
      result = yield* builtin.fn.call(this, args, e);
    }
    if (result === undefined && !asStatement) this.err(`${e.name}(…) doesn't return a value, so it can't be used here.`, e, user ? `Add return … in ${e.name}, or call it on its own line.` : '');
    return result;
  }

  *callUser(fn, args, e) {
    if (args.length !== fn.params.length) this.err(`${fn.name} expects ${fn.params.length} argument${fn.params.length === 1 ? '' : 's'} (${fn.params.join(', ') || 'none'}) but got ${args.length}.`, e);
    if (this.st.frames.length > this.maxDepth) this.err(`More than ${this.maxDepth} nested calls — the recursion never stops.`, e, 'A recursive function needs a base case that returns without calling itself, for example: if p == NULL then return … end.', 'infinite-loop');
    const caller = this.top;
    const fr = { fn: fn.name, vars: {}, order: [], temps: [], callLine: e.line };
    fn.params.forEach((p, i) => {
      fr.vars[p] = args[i];
      fr.order.push(p);
    });
    this.st.frames.push(fr);
    const bind = fn.params.map((p, i) => `${p} = ${this.f(args[i])}`).join(', ');
    yield this.ev('call', fn.line, `Called ${fn.name}(${args.map((a) => this.f(a)).join(', ')}) from line ${e.line}. A new frame starts${bind ? ` with ${bind}` : ''} (parameters are copies).`, { vars: [...fn.params], nodes: args.filter(isRef).map((a) => a.ref) }, { type: 'call', fn: fn.name });
    let ret = null;
    try {
      yield* this.execBody(fn.body);
    } catch (x) {
      if (x instanceof Return) ret = x;
      else if (x === BREAK || x === CONTINUE) this.err('break/continue used outside a loop.', e);
      else throw x;
    }
    const locals = fr.order;
    this.st.frames.pop();
    const value = ret ? ret.value : undefined;
    if (isRef(value)) caller.temps.push(value.ref);
    this.line = e.line;
    yield this.ev('return', ret ? ret.line : fn.endLine, `${fn.name} ${value === undefined ? 'finished' : `returned ${this.f(value)}`} and control goes back to line ${e.line}. Its local variables${locals.length ? ` (${locals.join(', ')})` : ''} no longer exist.`, { nodes: isRef(value) ? [value.ref] : [] }, { type: 'frame-pop', fn: fn.name, vars: locals });
    return value;
  }

  // ---------------------------------------------------------------- built-in helpers
  collOf(v, kinds, e, name) {
    if (!isColl(v) || !kinds.includes(this.st.colls[v.coll].kind)) {
      const want = kinds.map((k) => COLL_NAMES[k]).join(' or ');
      const have = isColl(v) ? `a ${COLL_NAMES[this.st.colls[v.coll].kind]}` : this.f(v);
      let hint = `Create one first, e.g. q = new ${COLL_NAMES[kinds[0]]}().`;
      if (isRef(v) || v === null) hint = 'The linked stack/queue in this structure is made of nodes — use pointer assignments. The built-in Queue/Stack/Set are helpers for graph and tree traversals.';
      this.err(`${name} works on a ${want}, but ${exprText(e.args[0])} is ${have}.`, e, hint);
    }
    return this.st.colls[v.coll];
  }
  vertex(v, e, argExpr) {
    if (!this.graph) this.err('There is no graph here. Choose the Graph structure to use graph functions.', e);
    if (!this.graph.vertices.includes(v)) this.err(`${exprText(argExpr)} is ${this.f(v)}, which is not a vertex of G.`, e, `The vertices are ${this.graph.vertices.join(', ')} (labels are text, so write "${this.graph.vertices[0]}" with quotes).`);
    return v;
  }
  graphArgs(args, e, n) {
    // allow neighbors(G, v) and neighbors(v)
    if (args.length === n + 1) {
      if (!isGraph(args[0])) this.err(`The first argument should be the graph G, not ${this.f(args[0])}.`, e);
      return args.slice(1);
    }
    return args;
  }
  opEvent(text, e, extraNodes = []) {
    const vars = [...varsIn({ args: e.args })];
    return this.ev('op', e.line, text, { vars, nodes: extraNodes });
  }
  collText(c) {
    return `[${c.items.map((x) => this.f(x)).join(', ')}]`;
  }
}

const BUILTINS = {
  enqueue: {
    min: 2, max: 2, sig: 'enqueue(q, x)',
    *fn([q, x], e) {
      const c = this.collOf(q, ['queue'], e, 'enqueue');
      c.items.push(x);
      yield this.opEvent(`enqueue: ${this.f(x)} joins the rear. Queue (front → rear): ${this.collText(c)}.`, e);
      return undefined;
    },
  },
  dequeue: {
    min: 1, max: 1, sig: 'dequeue(q)',
    *fn([q], e) {
      const c = this.collOf(q, ['queue'], e, 'dequeue');
      if (!c.items.length) this.err('dequeue on an empty queue (underflow).', e, 'Check isEmpty(q) before dequeuing.', 'overflow');
      const v = c.items.shift();
      this.temp(v);
      yield this.opEvent(`dequeue: ${this.f(v)} leaves the front. Queue now ${this.collText(c)}.`, e);
      return v;
    },
  },
  push: {
    min: 2, max: 2, sig: 'push(s, x)',
    *fn([s, x], e) {
      const c = this.collOf(s, ['stack'], e, 'push');
      c.items.push(x);
      yield this.opEvent(`push: ${this.f(x)} goes on top. Stack (bottom → top): ${this.collText(c)}.`, e);
      return undefined;
    },
  },
  pop: {
    min: 1, max: 1, sig: 'pop(s)',
    *fn([s], e) {
      const c = this.collOf(s, ['stack'], e, 'pop');
      if (!c.items.length) this.err('pop on an empty stack (underflow).', e, 'Check isEmpty(s) before popping.', 'overflow');
      const v = c.items.pop();
      this.temp(v);
      yield this.opEvent(`pop: ${this.f(v)} comes off the top. Stack now ${this.collText(c)}.`, e);
      return v;
    },
  },
  peek: {
    min: 1, max: 1, sig: 'peek(s or q)',
    *fn([s], e) {
      const c = this.collOf(s, ['stack', 'queue'], e, 'peek');
      if (!c.items.length) this.err(`peek on an empty ${COLL_NAMES[c.kind]}.`, e, 'Check isEmpty first.', 'overflow');
      return c.kind === 'stack' ? c.items[c.items.length - 1] : c.items[0];
    },
  },
  isEmpty: {
    min: 1, max: 1, sig: 'isEmpty(c)',
    *fn([s], e) {
      return this.collOf(s, ['stack', 'queue', 'set', 'array'], e, 'isEmpty').items.length === 0;
    },
  },
  size: {
    min: 1, max: 1, sig: 'size(c)',
    *fn([s], e) {
      return this.collOf(s, ['stack', 'queue', 'set', 'array'], e, 'size').items.length;
    },
  },
  add: {
    min: 2, max: 2, sig: 'add(set, x)',
    *fn([s, x], e) {
      const c = this.collOf(s, ['set'], e, 'add');
      const had = c.items.some((y) => this.eq(y, x, { a: e.args[0], b: e.args[1] }));
      if (!had) c.items.push(x);
      yield this.opEvent(`add: ${this.f(x)} ${had ? 'was already in' : 'is now in'} the set ${this.collText(c)}.`, e);
      return undefined;
    },
  },
  contains: {
    min: 2, max: 2, sig: 'contains(c, x)',
    *fn([s, x], e) {
      const c = this.collOf(s, ['set', 'array', 'queue', 'stack'], e, 'contains');
      return c.items.some((y) => (isRef(y) && isRef(x) ? y.ref === x.ref : y === x));
    },
  },
  remove: {
    min: 2, max: 2, sig: 'remove(set, x)',
    *fn([s, x], e) {
      const c = this.collOf(s, ['set', 'array'], e, 'remove');
      const i = c.items.findIndex((y) => (isRef(y) && isRef(x) ? y.ref === x.ref : y === x));
      if (i >= 0) c.items.splice(i, 1);
      yield this.opEvent(`remove: ${this.f(x)} ${i >= 0 ? 'removed' : 'was not there'}; now ${this.collText(c)}.`, e);
      return undefined;
    },
  },
  append: {
    min: 2, max: 2, sig: 'append(a, x)',
    *fn([s, x], e) {
      const c = this.collOf(s, ['array'], e, 'append');
      if (c.items.length >= 200) this.err('The array is full (200 items).', e);
      c.items.push(x);
      yield this.opEvent(`append: ${this.f(x)} added at the end. Now ${this.collText(c)}.`, e);
      return undefined;
    },
  },
  neighbors: {
    min: 1, max: 2, sig: 'neighbors(G, v)',
    *fn(args, e) {
      const [v] = this.graphArgs(args, e, 1);
      this.vertex(v, e, e.args[e.args.length - 1]);
      return this.newColl('array', G.neighbors(this.graph, v, 'alpha'));
    },
  },
  vertices: {
    min: 0, max: 1, sig: 'vertices(G)',
    *fn(args, e) {
      if (!this.graph) this.vertex(null, e, e);
      if (args.length && !isGraph(args[0])) this.err('vertices takes the graph G.', e);
      return this.newColl('array', G.sortedVertices(this.graph, 'alpha'));
    },
  },
  degree: {
    min: 1, max: 2, sig: 'degree(G, v)',
    *fn(args, e) {
      const [v] = this.graphArgs(args, e, 1);
      this.vertex(v, e, e.args[e.args.length - 1]);
      return G.degree(this.graph, v);
    },
  },
  hasEdge: {
    min: 2, max: 3, sig: 'hasEdge(G, u, v)',
    *fn(args, e) {
      const [u, v] = this.graphArgs(args, e, 2);
      this.vertex(u, e, e.args[e.args.length - 2]);
      this.vertex(v, e, e.args[e.args.length - 1]);
      return G.hasEdge(this.graph, u, v);
    },
  },
  abs: {
    min: 1, max: 1, sig: 'abs(x)',
    *fn([x], e) {
      if (typeof x !== 'number') this.err('abs needs a number.', e);
      return Math.abs(x);
    },
  },
  min: {
    min: 2, max: 2, sig: 'min(a, b)',
    *fn([a, b], e) {
      if (typeof a !== 'number' || typeof b !== 'number') this.err('min needs two numbers.', e);
      return Math.min(a, b);
    },
  },
  max: {
    min: 2, max: 2, sig: 'max(a, b)',
    *fn([a, b], e) {
      if (typeof a !== 'number' || typeof b !== 'number') this.err('max needs two numbers.', e);
      return Math.max(a, b);
    },
  },
};
BUILTINS.length = BUILTINS.size;

export const BUILTIN_SIGNATURES = Object.fromEntries(Object.entries(BUILTINS).map(([k, b]) => [k, b.sig]));
