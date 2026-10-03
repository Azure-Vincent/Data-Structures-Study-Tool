// Stacks and queues (Lecture 12): array and linked implementations.
import { Tracer } from './trace.js';
import { createWorld, addVar, fmtPtr, walk } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

// ---------------------------------------------------------------- array stack
// conv 'notes': top = number of items = index of the next FREE slot (top = 0 when empty).
// conv 'index': top = index of the TOP item (top = -1 when empty). Standard textbook style.
export function arrayStack(MAX = 6, conv = 'notes') {
  return { type: 'astack', MAX, conv, arr: Array(MAX).fill(null), live: Array(MAX).fill(false), top: conv === 'notes' ? 0 : -1 };
}
export function stackSize(s) {
  return s.conv === 'notes' ? s.top : s.top + 1;
}

export const ASTACK_CODE = {
  notes: {
    push: { title: 'push(x)  — array, notes convention', ref: 'Lec 12 p.3', lines: ['if (top == MAX) {', '    printf("stack overflow"); return;', '}', 'stack[top] = data;', '++top;              // top = top + 1'] },
    pop: { title: 'pop()  — array, notes convention', ref: 'Lec 12 p.3', lines: ['if (top == 0) {', '    printf("stack underflow"); return;', '}', 'x = stack[--top];   // decrement FIRST, then read'] },
    peek: { title: 'peek()  — array, notes convention', ref: 'Supplementary', lines: ['if (top == 0) { printf("empty"); return; }', 'return stack[top - 1];'] },
  },
  index: {
    push: { title: 'push(x)  — array, top = index of top item', ref: 'Supplementary (common textbook convention)', lines: ['if (top == MAX - 1) {', '    printf("stack overflow"); return;', '}', 'top = top + 1;', 'stack[top] = data;'] },
    pop: { title: 'pop()  — array, top = index of top item', ref: 'Supplementary', lines: ['if (top == -1) {', '    printf("stack underflow"); return;', '}', 'x = stack[top--];   // read, THEN decrement'] },
    peek: { title: 'peek()  — array, top = index of top item', ref: 'Supplementary', lines: ['if (top == -1) { printf("empty"); return; }', 'return stack[top];'] },
  },
};

export function astackPush(s, x) {
  const code = ASTACK_CODE[s.conv].push;
  const t = new Tracer(s, code);
  const st = t.state;
  const full = st.conv === 'notes' ? st.top === st.MAX : st.top === st.MAX - 1;
  if (cond(t, 0, full, st.conv === 'notes' ? `top == MAX? ${st.top} == ${st.MAX}` : `top == MAX-1? ${st.top} == ${st.MAX - 1}`)) {
    t.output.push('stack overflow');
    t.fail(1, `Overflow: all ${st.MAX} slots are used, ${x} cannot be pushed.`);
    return t.finish('push rejected (overflow).', { ok: false, event: 'overflow' });
  }
  if (st.conv === 'notes') {
    st.arr[st.top] = x;
    st.live[st.top] = true;
    t.count('arrayWrites');
    t.step(3, 'write', `stack[${st.top}] = ${x}. In the notes' convention top is the index of the next free slot.`, { cells: [st.top] });
    st.top++;
    t.step(4, 'var', `++top → ${st.top}. top now equals the number of items (${st.top}).`, { top: true });
  } else {
    st.top++;
    t.step(3, 'var', `top = top + 1 → ${st.top}.`, { top: true });
    st.arr[st.top] = x;
    st.live[st.top] = true;
    t.count('arrayWrites');
    t.step(4, 'write', `stack[${st.top}] = ${x}. Here top is the index of the top item itself.`, { cells: [st.top] });
  }
  return t.finish(`Pushed ${x}.`, { ok: true });
}

export function astackPop(s) {
  const code = ASTACK_CODE[s.conv].pop;
  const t = new Tracer(s, code);
  const st = t.state;
  const empty = st.conv === 'notes' ? st.top === 0 : st.top === -1;
  if (cond(t, 0, empty, st.conv === 'notes' ? `top == 0? (${st.top})` : `top == -1? (${st.top})`)) {
    t.output.push('stack underflow');
    t.fail(1, 'Underflow: the stack is empty, nothing to pop.');
    return t.finish('pop rejected (underflow).', { ok: false, event: 'underflow' });
  }
  let x;
  if (st.conv === 'notes') {
    st.top--;
    x = st.arr[st.top];
    st.live[st.top] = false;
    t.count('arrayReads');
    t.output.push(x);
    t.step(3, 'read', `--top → ${st.top}, then read stack[${st.top}] = ${x}. The value stays in memory but is no longer part of the stack (shown faded).`, { cells: [st.top], top: true });
  } else {
    x = st.arr[st.top];
    st.live[st.top] = false;
    t.count('arrayReads');
    t.output.push(x);
    st.top--;
    t.step(3, 'read', `read stack[${st.top + 1}] = ${x}, then top-- → ${st.top}.`, { cells: [st.top + 1], top: true });
  }
  return t.finish(`Popped ${x}.`, { ok: true, value: x });
}

export function astackPeek(s) {
  const t = new Tracer(s, ASTACK_CODE[s.conv].peek);
  const st = t.state;
  const n = stackSize(st);
  if (cond(t, 0, n === 0, 'is the stack empty?')) {
    t.fail(0, 'Peek on an empty stack: nothing to return.');
    return t.finish('', { ok: false, event: 'underflow' });
  }
  const i = st.conv === 'notes' ? st.top - 1 : st.top;
  t.output.push(st.arr[i]);
  t.step(1, 'read', `return stack[${i}] = ${st.arr[i]}. peek does not change top.`, { cells: [i] });
  return t.finish(`Top item is ${st.arr[i]}.`, { ok: true, value: st.arr[i] });
}

// ---------------------------------------------------------------- array queue
// 'linear' = the notes: F = index of the front item, R = index of the next free slot.
// Empty when F == R. "Full" when R == MAX — even if items were dequeued (wasted slots).
// 'circular' = supplementary fix: indices wrap with % MAX and a count tracks size.
export function arrayQueue(MAX = 5, mode = 'linear') {
  return { type: 'aqueue', MAX, mode, arr: Array(MAX).fill(null), live: Array(MAX).fill(false), F: 0, R: 0, count: 0 };
}

export const AQUEUE_CODE = {
  linear: {
    enqueue: { title: 'enqueue(x)  — linear array (notes)', ref: 'Lec 12 p.5', lines: ['if (R == MAX) { printf("queue full"); return; }', 'queue[R] = x;', 'R = R + 1;'] },
    dequeue: { title: 'dequeue()  — linear array (notes)', ref: 'Lec 12 p.5', lines: ['if (F == R) { printf("queue empty"); return; }', 'x = queue[F];', 'F = F + 1;'] },
  },
  circular: {
    enqueue: { title: 'enqueue(x)  — circular array', ref: 'Supplementary', lines: ['if (count == MAX) { printf("queue full"); return; }', 'queue[R] = x;', 'R = (R + 1) % MAX;', 'count++;'] },
    dequeue: { title: 'dequeue()  — circular array', ref: 'Supplementary', lines: ['if (count == 0) { printf("queue empty"); return; }', 'x = queue[F];', 'F = (F + 1) % MAX;', 'count--;'] },
  },
};

export function aqueueEnqueue(q, x) {
  const t = new Tracer(q, AQUEUE_CODE[q.mode].enqueue);
  const s = t.state;
  const full = s.mode === 'linear' ? s.R === s.MAX : s.count === s.MAX;
  if (cond(t, 0, full, s.mode === 'linear' ? `R == MAX? ${s.R} == ${s.MAX}` : `count == MAX? ${s.count} == ${s.MAX}`)) {
    t.output.push('queue full');
    const wasted = s.mode === 'linear' && s.F > 0 ? ` Note: ${s.F} slot(s) before F are empty but unusable in a linear queue.` : '';
    t.fail(0, `Overflow: cannot enqueue ${x}.${wasted}`);
    return t.finish('enqueue rejected (full).', { ok: false, event: 'overflow' });
  }
  s.arr[s.R] = x;
  s.live[s.R] = true;
  t.count('arrayWrites');
  t.step(1, 'write', `queue[${s.R}] = ${x}. Items enter at the REAR.`, { cells: [s.R] });
  if (s.mode === 'linear') {
    s.R++;
    s.count++;
    t.step(2, 'var', `R = R + 1 → ${s.R}. R is the index of the next free slot (one past the last item).`, { R: true });
  } else {
    s.R = (s.R + 1) % s.MAX;
    t.step(2, 'var', `R = (R + 1) % MAX → ${s.R}.`, { R: true });
    s.count++;
    t.step(3, 'var', `count → ${s.count}.`);
  }
  return t.finish(`Enqueued ${x}.`, { ok: true });
}

export function aqueueDequeue(q) {
  const t = new Tracer(q, AQUEUE_CODE[q.mode].dequeue);
  const s = t.state;
  const empty = s.mode === 'linear' ? s.F === s.R : s.count === 0;
  if (cond(t, 0, empty, s.mode === 'linear' ? `F == R? ${s.F} == ${s.R}` : `count == 0? (${s.count})`)) {
    t.output.push('queue empty');
    t.fail(0, 'Underflow: the queue is empty.');
    return t.finish('dequeue rejected (empty).', { ok: false, event: 'underflow' });
  }
  const x = s.arr[s.F];
  s.live[s.F] = false;
  t.output.push(x);
  t.count('arrayReads');
  t.step(1, 'read', `x = queue[${s.F}] = ${x}. Items leave from the FRONT.`, { cells: [s.F] });
  if (s.mode === 'linear') {
    s.F++;
    s.count--;
    t.step(2, 'var', `F = F + 1 → ${s.F}.${s.F === s.R ? ' Now F == R: the queue is empty.' : ''}`, { F: true });
  } else {
    s.F = (s.F + 1) % s.MAX;
    t.step(2, 'var', `F = (F + 1) % MAX → ${s.F}.`, { F: true });
    s.count--;
    t.step(3, 'var', `count → ${s.count}.`);
  }
  return t.finish(`Dequeued ${x}.`, { ok: true, value: x });
}

export function queueSize(q) {
  return q.mode === 'linear' ? q.R - q.F : q.count;
}

// ---------------------------------------------------------------- linked versions
export function linkedStackHead() {
  const w = createWorld('sll', ['top']);
  w.role = 'lstack-head';
  return w;
}
export function linkedStackTail() {
  const w = createWorld('sll', ['start', 'top'], { globals: ['start', 'top'] });
  w.role = 'lstack-tail';
  w.globals = ['start', 'top'];
  return w;
}
export function linkedQueue() {
  const w = createWorld('sll', ['front', 'rear']);
  w.role = 'lqueue';
  w.globals = ['front', 'rear'];
  return w;
}

export const LINKED_CODE = {
  pushHead: { title: 'push(x)  — linked, top = first node', ref: 'Supplementary (standard; compare Lec 12 p.4)', lines: ['newnode = getnode();', 'newnode->next = top;', 'top = newnode;'] },
  popHead: { title: 'pop()  — linked, top = first node', ref: 'Supplementary', lines: ['if (top == NULL) { printf("underflow"); return; }', 'temp = top;', 'top = top->next;', 'x = temp->data;  free(temp);'] },
  pushTail: { title: 'push(x)  — linked, at the END (notes)', ref: 'Lec 12 p.4', lines: ['newnode = getnode();', 'if (start == NULL)', '    start = top = newnode;', 'else {', '    top->next = newnode;', '    top = newnode;', '}'] },
  popTail: {
    title: 'pop()  — linked, at the END (notes)',
    ref: 'Lec 12 p.4',
    lines: ['if (top == NULL) { printf("underflow"); return; }', 'if (start == top) {            // last item', '    x = top->data;  free(top);', '    start = top = NULL;  return;', '}', 'temp = start;', 'while (temp->next != top)     // must find the node BELOW top', '    temp = temp->next;', 'x = top->data;  free(top);', 'top = temp;', 'top->next = NULL;'],
  },
  enqueue: { title: 'enqueue(x)  — linked queue', ref: 'Lec 12 p.6', lines: ['newnode = getnode();', 'if (rear == NULL)              // empty queue', '    front = rear = newnode;', 'else {', '    rear->next = newnode;', '    rear = newnode;', '}'] },
  dequeue: { title: 'dequeue()  — linked queue', ref: 'Lec 12 p.6', lines: ['if (front == NULL) { printf("underflow"); return; }', 'temp = front;', 'front = front->next;', 'if (front == NULL)             // removed the final item', '    rear = NULL;', 'x = temp->data;  free(temp);'] },
};

export function lstackPushHead(w0, x, opts) {
  const t = new Tracer(w0, LINKED_CODE.pushHead);
  const w = t.state;
  const a = getnodeSteps(t, 0, x, opts);
  setLink(t, 1, a, 'next', w.vars.top, `newnode->next = top (${fmtPtr(w.vars.top)}): the new node sits on top of the old top.`);
  setVar(t, 2, 'top', a, `top = newnode (${a}). O(1): no walking.`);
  return endScope(t, ['newnode']);
}

export function lstackPopHead(w0) {
  const t = new Tracer(w0, LINKED_CODE.popHead);
  const w = t.state;
  if (cond(t, 0, w.vars.top === null, 'top == NULL?')) {
    t.output.push('underflow');
    t.fail(0, 'Underflow: the stack is empty.');
    const tr = endScope(t, []);
    tr.result = { ok: false, event: 'underflow' };
    return tr;
  }
  setVar(t, 1, 'temp', w.vars.top, `temp = top (${w.vars.top}).`);
  setVar(t, 2, 'top', w.nodes[w.vars.temp].next, `top = top->next → ${fmtPtr(w.nodes[w.vars.temp].next)}.`);
  const x = w.nodes[w.vars.temp].data;
  t.output.push(x);
  freeStep(t, 3, 'temp', `x = ${x}; free(temp). O(1).`);
  const tr = endScope(t, ['temp']);
  tr.result = { ok: true, value: x };
  return tr;
}

export function lstackPushTail(w0, x, opts) {
  const t = new Tracer(w0, LINKED_CODE.pushTail);
  const w = t.state;
  const a = getnodeSteps(t, 0, x, opts);
  if (cond(t, 1, w.vars.start === null, 'start == NULL?')) {
    w.vars.start = a;
    w.vars.top = a;
    t.count('varWrites', 2);
    t.step(2, 'var', `start = top = newnode (${a}).`, { vars: ['start', 'top'] });
  } else {
    setLink(t, 4, w.vars.top, 'next', a, `top->next = newnode: append after the current top (${w.vars.top}).`);
    setVar(t, 5, 'top', a, `top = newnode (${a}). With the top pointer, push at the end is O(1).`);
  }
  return endScope(t, ['newnode']);
}

export function lstackPopTail(w0) {
  const t = new Tracer(w0, LINKED_CODE.popTail);
  const w = t.state;
  if (cond(t, 0, w.vars.top === null, 'top == NULL?')) {
    t.output.push('underflow');
    t.fail(0, 'Underflow: the stack is empty.');
    const tr = endScope(t, []);
    tr.result = { ok: false, event: 'underflow' };
    return tr;
  }
  if (cond(t, 1, w.vars.start === w.vars.top, 'start == top? (last item)')) {
    const x = w.nodes[w.vars.top].data;
    t.output.push(x);
    addVar(w, 'temp', w.vars.top);
    freeStep(t, 2, 'temp', `x = ${x}; free(top).`);
    w.vars.start = null;
    w.vars.top = null;
    t.count('varWrites', 2);
    t.step(3, 'var', 'start = top = NULL: the stack is empty.', { vars: ['start', 'top'] });
    const tr = endScope(t, ['temp']);
    tr.result = { ok: true, value: x };
    return tr;
  }
  setVar(t, 5, 'temp', w.vars.start, 'temp = start. To pop at the tail we need the node below top, and links only go forward.');
  while (true) {
    const tn = w.nodes[w.vars.temp];
    t.count('visits');
    if (!cond(t, 6, tn.next !== w.vars.top, `temp->next != top? (${tn.next} vs ${w.vars.top})`)) break;
    t.count('moves');
    setVar(t, 7, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  const x = w.nodes[w.vars.top].data;
  t.output.push(x);
  addVar(w, 'old', w.vars.top);
  freeStep(t, 8, 'old', `x = ${x}; free(top).`);
  setVar(t, 9, 'top', w.vars.temp, `top = temp (${w.vars.temp}).`);
  setLink(t, 10, w.vars.top, 'next', null, 'top->next = NULL.');
  const tr = endScope(t, ['temp', 'old']);
  tr.result = { ok: true, value: x };
  return tr;
}

export function lqueueEnqueue(w0, x, opts) {
  const t = new Tracer(w0, LINKED_CODE.enqueue);
  const w = t.state;
  const a = getnodeSteps(t, 0, x, opts);
  if (cond(t, 1, w.vars.rear === null, 'rear == NULL? (empty queue)')) {
    w.vars.front = a;
    w.vars.rear = a;
    t.count('varWrites', 2);
    t.step(2, 'var', `front = rear = newnode (${a}). One item is both the front and the rear.`, { vars: ['front', 'rear'] });
  } else {
    setLink(t, 4, w.vars.rear, 'next', a, `rear->next = newnode: link after the current rear (${w.vars.rear}).`);
    setVar(t, 5, 'rear', a, `rear = newnode (${a}). rear always points AT the last node.`);
  }
  return endScope(t, ['newnode']);
}

export function lqueueDequeue(w0) {
  const t = new Tracer(w0, LINKED_CODE.dequeue);
  const w = t.state;
  if (cond(t, 0, w.vars.front === null, 'front == NULL?')) {
    t.output.push('underflow');
    t.fail(0, 'Underflow: the queue is empty.');
    const tr = endScope(t, []);
    tr.result = { ok: false, event: 'underflow' };
    return tr;
  }
  setVar(t, 1, 'temp', w.vars.front, `temp = front (${w.vars.front}).`);
  setVar(t, 2, 'front', w.nodes[w.vars.temp].next, `front = front->next → ${fmtPtr(w.nodes[w.vars.temp].next)}.`);
  if (cond(t, 3, w.vars.front === null, 'front == NULL? (did we remove the final item?)')) {
    setVar(t, 4, 'rear', null, 'rear = NULL. Without this, rear would still hold the address of the node we are about to free (dangling).');
  }
  const x = w.nodes[w.vars.temp].data;
  t.output.push(x);
  freeStep(t, 5, 'temp', `x = ${x}; free(temp).`);
  const tr = endScope(t, ['temp']);
  tr.result = { ok: true, value: x };
  return tr;
}

// ---------------------------------------------------------------- batch helpers (no tracing UI needed)
/**
 * Run a sequence like [{op:'push',x:3},{op:'pop'}] on a structure kind and
 * return {removed:[...], events:[...], final}.
 * kinds: astack, astack-index, aqueue, aqueue-circ, lstack-head, lstack-tail, lqueue
 */
export function runOps(kind, ops, MAX = 6) {
  let s;
  if (kind === 'astack') s = arrayStack(MAX, 'notes');
  else if (kind === 'astack-index') s = arrayStack(MAX, 'index');
  else if (kind === 'aqueue') s = arrayQueue(MAX, 'linear');
  else if (kind === 'aqueue-circ') s = arrayQueue(MAX, 'circular');
  else if (kind === 'lstack-head') s = linkedStackHead();
  else if (kind === 'lstack-tail') s = linkedStackTail();
  else if (kind === 'lqueue') s = linkedQueue();
  const removed = [];
  const events = [];
  const counters = {};
  ops.forEach((o, i) => {
    const tr = applyOp(kind, s, o);
    s = tr.final;
    for (const [k, v] of Object.entries(tr.counters)) counters[k] = (counters[k] || 0) + v;
    if (tr.result && tr.result.event) events.push({ i, op: o.op, event: tr.result.event });
    if (tr.result && tr.result.value !== undefined && (o.op === 'pop' || o.op === 'dequeue')) removed.push(tr.result.value);
  });
  return { removed, events, final: s, counters };
}

export function applyOp(kind, s, o) {
  const isPush = o.op === 'push' || o.op === 'enqueue' || o.op === 'add';
  if (kind.startsWith('astack')) return isPush ? astackPush(s, o.x) : o.op === 'peek' ? astackPeek(s) : astackPop(s);
  if (kind.startsWith('aqueue')) return isPush ? aqueueEnqueue(s, o.x) : aqueueDequeue(s);
  if (kind === 'lstack-head') return isPush ? lstackPushHead(s, o.x, { detail: false }) : lstackPopHead(s);
  if (kind === 'lstack-tail') return isPush ? lstackPushTail(s, o.x, { detail: false }) : lstackPopTail(s);
  if (kind === 'lqueue') return isPush ? lqueueEnqueue(s, o.x, { detail: false }) : lqueueDequeue(s);
  throw new Error('unknown kind ' + kind);
}

/** Items of a structure from the removal end: stacks top→bottom, queues front→rear. */
export function contents(kind, s) {
  if (kind.startsWith('astack')) {
    const n = stackSize(s);
    return s.arr.slice(0, n).reverse();
  }
  if (kind === 'aqueue') return s.arr.slice(s.F, s.R);
  if (kind === 'aqueue-circ') {
    const out = [];
    for (let i = 0; i < s.count; i++) out.push(s.arr[(s.F + i) % s.MAX]);
    return out;
  }
  if (kind === 'lstack-head') return walk(s, s.vars.top).values;
  if (kind === 'lstack-tail') return walk(s, s.vars.start).values.reverse();
  if (kind === 'lqueue') return walk(s, s.vars.front).values;
  return [];
}

export { d };
