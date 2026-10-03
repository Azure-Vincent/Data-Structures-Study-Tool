// A tiny interpreter for the pointer statements used in the lectures, e.g.
//   newnode->next = start;   temp = temp->next;   free(temp);
//   while (temp->next != NULL) temp = temp->next;
//   do { print(temp->data); temp = temp->next; } while (temp != start);
// It lets the app GRADE pseudocode ordering and fill-in-the-blank answers by
// running them, so any equivalent correct answer is accepted.
import { clone, getnode, free, fieldsOf, lostNodes, GARBAGE } from './pointerWorld.js';

export class InterpError extends Error {
  constructor(msg, kind = 'runtime') {
    super(msg);
    this.kind = kind;
  }
}

function tokenize(src) {
  const toks = [];
  const re = /\s*(->|==|!=|&&|\|\||<=|>=|\+\+|--|"(?:[^"\\]|\\.)*"|[A-Za-z_]\w*|\d+|[(){};=,!<>+\-*/%&])/y;
  let m;
  let i = 0;
  const s = src.replace(/\/\/[^\n]*/g, '');
  while (i < s.length) {
    re.lastIndex = i;
    m = re.exec(s);
    if (!m) {
      if (/^\s*$/.test(s.slice(i))) break;
      throw new InterpError(`Unexpected character "${s.slice(i).trim()[0]}"`, 'syntax');
    }
    toks.push(m[1]);
    i = re.lastIndex;
  }
  return toks;
}

class Parser {
  constructor(toks) {
    this.t = toks;
    this.i = 0;
  }
  peek(k = 0) {
    return this.t[this.i + k];
  }
  eat(x) {
    const v = this.t[this.i];
    if (x !== undefined && v !== x) throw new InterpError(`Expected "${x}" but found "${v ?? 'end of input'}"`, 'syntax');
    this.i++;
    return v;
  }
  done() {
    return this.i >= this.t.length;
  }
  program() {
    const out = [];
    while (!this.done()) out.push(this.stmt());
    return out;
  }
  block() {
    if (this.peek() === '{') {
      this.eat('{');
      const out = [];
      while (this.peek() !== '}') {
        if (this.done()) throw new InterpError('Missing "}"', 'syntax');
        out.push(this.stmt());
      }
      this.eat('}');
      return out;
    }
    return [this.stmt()];
  }
  stmt() {
    const k = this.peek();
    if (k === ';') {
      this.eat();
      return { t: 'nop' };
    }
    if (k === '{') return { t: 'block', body: this.block() };
    if (k === 'while') {
      this.eat();
      this.eat('(');
      const c = this.cond();
      this.eat(')');
      return { t: 'while', c, body: this.block() };
    }
    if (k === 'do') {
      this.eat();
      const body = this.block();
      this.eat('while');
      this.eat('(');
      const c = this.cond();
      this.eat(')');
      if (this.peek() === ';') this.eat();
      return { t: 'do', c, body };
    }
    if (k === 'if') {
      this.eat();
      this.eat('(');
      const c = this.cond();
      this.eat(')');
      const then = this.block();
      let els = null;
      if (this.peek() === 'else') {
        this.eat();
        els = this.block();
      }
      return { t: 'if', c, then, els };
    }
    if (k === 'free') {
      this.eat();
      this.eat('(');
      const e = this.expr();
      this.eat(')');
      this.semi();
      return { t: 'free', e };
    }
    if (k === 'print' || k === 'printf') {
      this.eat();
      this.eat('(');
      if (this.peek() && this.peek().startsWith('"')) {
        this.eat();
        if (this.peek() === ',') this.eat(',');
        else {
          this.eat(')');
          this.semi();
          return { t: 'nop' };
        }
      }
      const e = this.expr();
      this.eat(')');
      this.semi();
      return { t: 'print', e };
    }
    if (k === 'return') {
      this.eat();
      this.semi();
      return { t: 'return' };
    }
    // assignment chain: a = b = c;
    const targets = [this.lvalue()];
    this.eat('=');
    let rhs = this.expr();
    while (this.peek() === '=') {
      if (rhs.t !== 'var' && rhs.t !== 'field') throw new InterpError('Invalid assignment target', 'syntax');
      targets.push(rhs);
      this.eat('=');
      rhs = this.expr();
    }
    this.semi();
    return { t: 'assign', targets, rhs };
  }
  semi() {
    if (this.peek() === ';') this.eat();
  }
  lvalue() {
    const e = this.expr();
    if (e.t !== 'var' && e.t !== 'field') throw new InterpError(`Cannot assign to "${show(e)}"`, 'syntax');
    return e;
  }
  expr() {
    const k = this.peek();
    if (k === 'NULL' || k === 'nullptr' || k === '0') {
      this.eat();
      return { t: 'null' };
    }
    if (k === 'getnode') {
      this.eat();
      this.eat('(');
      this.eat(')');
      return { t: 'getnode' };
    }
    if (k === '(') {
      this.eat('(');
      const e = this.expr();
      this.eat(')');
      return e;
    }
    if (!k || !/^[A-Za-z_]\w*$/.test(k)) throw new InterpError(`Expected a pointer expression, found "${k ?? 'end'}"`, 'syntax');
    let e = { t: 'var', name: this.eat() };
    while (this.peek() === '->') {
      this.eat();
      e = { t: 'field', of: e, f: this.eat() };
    }
    return e;
  }
  cond() {
    let c = this.cmp();
    while (this.peek() === '&&' || this.peek() === '||') {
      const op = this.eat();
      c = { t: op, a: c, b: this.cmp() };
    }
    return c;
  }
  cmp() {
    if (this.peek() === '!') {
      this.eat();
      return { t: 'not', a: this.cmp() };
    }
    if (this.peek() === '(') {
      // parenthesised condition
      const save = this.i;
      try {
        this.eat('(');
        const c = this.cond();
        this.eat(')');
        return c;
      } catch {
        this.i = save;
      }
    }
    const a = this.expr();
    if (this.peek() === '==' || this.peek() === '!=') {
      const op = this.eat();
      return { t: op, a, b: this.expr() };
    }
    return { t: 'truthy', a };
  }
}

export function show(e) {
  if (!e) return '';
  if (e.t === 'null') return 'NULL';
  if (e.t === 'var') return e.name;
  if (e.t === 'field') return `${show(e.of)}->${e.f}`;
  if (e.t === 'getnode') return 'getnode()';
  return '?';
}

export function parse(src) {
  return new Parser(tokenize(src)).program();
}

export function parseCond(src) {
  const p = new Parser(tokenize(src));
  const c = p.cond();
  if (!p.done()) throw new InterpError(`Unexpected "${p.peek()}" after the condition`, 'syntax');
  return c;
}

/**
 * Run statements on a COPY of world.
 * opts: { newValue, maxSteps, newAddr }
 * Returns { world, output, error, lost:[{stmt, addrs}] , steps }
 */
export function run(world, program, opts = {}) {
  const w = clone(world);
  const prog = typeof program === 'string' ? parse(program) : program;
  const output = [];
  const lost = [];
  let steps = 0;
  const max = opts.maxSteps || 400;
  const F = new Set(fieldsOf(w.kind));

  const val = (e) => {
    if (e.t === 'null') return null;
    if (e.t === 'getnode') {
      const a = getnode(w, opts.newValue ?? 0, opts.newAddr != null ? { addr: opts.newAddr } : undefined);
      return a;
    }
    if (e.t === 'var') {
      if (!(e.name in w.vars)) throw new InterpError(`${e.name} was never assigned`);
      return w.vars[e.name];
    }
    const base = val(e.of);
    const n = deref(base, show(e.of));
    if (e.f === 'data') return n.data;
    if (!F.has(e.f)) throw new InterpError(`A ${w.kind === 'dll' ? 'doubly linked' : 'singly linked'} node has no field "${e.f}"`);
    return n[e.f];
  };
  const deref = (a, label) => {
    if (a === null) throw new InterpError(`${label} is NULL — dereferencing it crashes (segmentation fault).`);
    if (a === GARBAGE) throw new InterpError(`${label} holds garbage (uninitialised).`);
    const n = w.nodes[a];
    if (!n) throw new InterpError(`${label} = ${a} is not a valid address.`);
    if (n.freed) throw new InterpError(`${label} points to freed memory (use after free).`);
    return n;
  };
  const assign = (target, v) => {
    if (target.t === 'var') {
      if (!(target.name in w.vars)) w.varOrder.push(target.name);
      w.vars[target.name] = v;
    } else {
      const n = deref(val(target.of), show(target.of));
      if (target.f === 'data') {
        n.data = v;
        return;
      }
      if (!F.has(target.f)) throw new InterpError(`No field "${target.f}"`);
      n[target.f] = v;
    }
  };
  const test = (c) => {
    switch (c.t) {
      case '==':
        return val(c.a) === val(c.b);
      case '!=':
        return val(c.a) !== val(c.b);
      case '&&':
        return test(c.a) && test(c.b);
      case '||':
        return test(c.a) || test(c.b);
      case 'not':
        return !test(c.a);
      case 'truthy':
        return val(c.a) !== null;
      default:
        throw new InterpError('bad condition');
    }
  };
  const tick = () => {
    if (++steps > max) throw new InterpError(`Stopped after ${max} steps — the loop never ends (infinite loop).`, 'loop');
  };
  class Ret {}
  const exec = (list) => {
    for (const s of list) {
      tick();
      const before = lostNodes(w);
      switch (s.t) {
        case 'nop':
          break;
        case 'block':
          exec(s.body);
          break;
        case 'assign': {
          const v = val(s.rhs);
          for (let i = s.targets.length - 1; i >= 0; i--) assign(s.targets[i], v);
          break;
        }
        case 'free': {
          const a = val(s.e);
          const n = deref(a, show(s.e));
          void n;
          free(w, a);
          break;
        }
        case 'print':
          output.push(val(s.e));
          break;
        case 'while':
          while (test(s.c)) {
            tick();
            exec(s.body);
          }
          break;
        case 'do':
          do {
            tick();
            exec(s.body);
          } while (test(s.c));
          break;
        case 'if':
          if (test(s.c)) exec(s.then);
          else if (s.els) exec(s.els);
          break;
        case 'return':
          throw new Ret();
        default:
          throw new InterpError('unknown statement');
      }
      const after = lostNodes(w).filter((a) => !before.includes(a));
      if (after.length) lost.push({ stmt: s, addrs: after });
    }
  };
  let error = null;
  try {
    exec(prog);
  } catch (e) {
    if (e instanceof Ret) {
      /* normal */
    } else if (e instanceof InterpError) error = e;
    else throw e;
  }
  return { world: w, output, error, lost, steps };
}

/** Normalise C-ish text for display/comparison. */
export function normCode(s) {
  return String(s)
    .replace(/\s+/g, '')
    .replace(/;+$/, '')
    .replace(/nullptr|\b0\b/g, 'NULL');
}

import { Tracer } from './trace.js';
import { fmtPtr, sweepFreed } from './pointerWorld.js';

/** Describe what changed between two worlds (for step explanations). */
export function diffWorlds(a, b) {
  const out = [];
  for (const v of b.varOrder) if (a.vars[v] !== b.vars[v]) out.push(`${v}: ${fmtPtr(a.vars[v] === undefined ? null : a.vars[v])} → ${fmtPtr(b.vars[v])}`);
  for (const n of Object.values(b.nodes)) {
    const o = a.nodes[n.addr];
    if (!o) {
      out.push(`new node allocated at ${n.addr} (data ${n.data})`);
      continue;
    }
    for (const f of fieldsOf(b.kind)) if (o[f] !== n[f]) out.push(`${n.addr}->${f}: ${fmtPtr(o[f])} → ${fmtPtr(n[f])}`);
    if (!o.freed && n.freed) out.push(`block ${n.addr} freed`);
  }
  return out;
}

/**
 * Run one statement per line and record a step after each line —
 * used to animate correct and buggy code side by side.
 */
export function runLines(world, lines, { title = 'code', newValue, ref = '' } = {}) {
  const t = new Tracer(world, { title, ref, lines });
  let w = clone(world);
  for (let i = 0; i < lines.length; i++) {
    const src = lines[i];
    if (!src.trim() || /^\s*(\/\/|[{}])/.test(src)) continue;
    const before = w;
    const r = run(w, src, { newValue });
    if (r.error) {
      t.state = r.world;
      t.fail(i, r.error.message);
      return t.finish('Execution stopped.');
    }
    w = r.world;
    t.state = clone(w);
    const changes = diffWorlds(before, w);
    const lost = lostNodes(w).filter((a) => !lostNodes(before).includes(a));
    let msg = changes.length ? changes.join('; ') + '.' : 'Nothing changed.';
    if (r.output.length) msg += ` Printed: ${r.output.join(' ')}.`;
    if (lost.length) msg += ` ⚠ Access LOST to ${lost.join(', ')}: no pointer holds ${lost.length > 1 ? 'these addresses' : 'this address'} any more.`;
    const kind = lost.length ? 'error' : /free\s*\(/.test(src) ? 'free' : /getnode/.test(src) ? 'alloc' : /->\s*\w+\s*=/.test(src) ? 'link' : 'var';
    t.step(i, kind, msg, { lost, error: lost.length > 0 });
  }
  t.state = clone(w);
  return t.finish('Done.');
}
