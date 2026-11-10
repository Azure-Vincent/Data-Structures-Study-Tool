// Stacks and queues: array and linked implementations.
import { opts, mcq, multi, numeric, fields, rewire, reflect, keep } from './kit.js';
import { values, randList, guide } from './helpers.js';
import * as SQ from '../core/stackQueue.js';
import { walk } from '../core/pointerWorld.js';

function opSeq(rng, { len = 7, maxSize = 5, allowUnder = false } = {}) {
  const ops = [];
  let size = 0;
  const used = new Set();
  for (let i = 0; i < len; i++) {
    const add = size === 0 ? !allowUnder || rng.bool(0.75) : size >= maxSize ? false : rng.bool(0.6);
    if (add) {
      let x;
      do x = rng.int(1, 99);
      while (used.has(x));
      used.add(x);
      ops.push({ op: 'add', x });
      size++;
    } else {
      ops.push({ op: 'remove' });
      size = Math.max(0, size - 1);
    }
  }
  return ops;
}
const asStack = (ops) => ops.map((o) => (o.op === 'add' ? { op: 'push', x: o.x } : { op: 'pop' }));
const asQueue = (ops) => ops.map((o) => (o.op === 'add' ? { op: 'enqueue', x: o.x } : { op: 'dequeue' }));
const showOps = (ops, s) => ops.map((o) => (o.op === 'add' || o.op === 'push' || o.op === 'enqueue' ? `${s ? 'push' : 'enqueue'}(${o.x})` : s ? 'pop()' : 'dequeue()'));

export const l12 = [
  {
    id: 'l12-removal-order',
    concept: 'l12.lifo-fifo',
    type: 'predict',
    title: 'Same input: stack versus queue',
    generate(rng) {
      const ops = opSeq(rng, { len: rng.int(6, 9) });
      const st = SQ.runOps('astack', asStack(ops), 10).removed;
      const qu = SQ.runOps('aqueue', asQueue(ops), 10).removed;
      const text = ops.map((o) => (o.op === 'add' ? `add ${o.x}` : 'remove')).join(', ');
      return {
        prompt: `Apply the same sequence to an empty STACK (add = push, remove = pop) and an empty QUEUE (add = enqueue, remove = dequeue):\n\n**${text}**\n\nIn what order are values removed from each?`,
        ...fields(
          [
            { id: 's', label: 'Stack removal order', answer: st, tag: 'lifo-fifo' },
            { id: 'q', label: 'Queue removal order', answer: qu, tag: 'lifo-fifo' },
          ],
          { explain: `Stack = LIFO: each remove takes the MOST recent value still inside → ${st.join(' ')}. Queue = FIFO: each remove takes the OLDEST value still inside → ${qu.join(' ')}.` },
        ),
        hints: ['Stack: last in, first out. Queue: first in, first out.', { text: 'Write the contents after every operation.' }, `First remove: stack gives the latest value added before it; queue gives ${qu[0]}.`],
      };
    },
  },
  {
    id: 'l12-astack-top',
    concept: 'l12.array-stack',
    type: 'predict',
    title: 'Array stack: final value of top',
    generate(rng) {
      const conv = rng.pick(['count', 'count', 'index']);
      const MAX = rng.int(3, 5);
      const ops = asStack(opSeq(rng, { len: rng.int(5, 9), maxSize: MAX + 1, allowUnder: true }));
      const r = SQ.runOps(conv === 'count' ? 'astack' : 'astack-index', ops, MAX);
      const top = r.final.top;
      const ev = r.events.map((e) => `operation ${e.i + 1} (${e.op}) → ${e.event}`).join('; ');
      return {
        prompt: `Array stack, MAX = ${MAX}, ${conv === 'count' ? '**count convention**: top starts at 0 and counts the stored items, so it is also the index of the next free slot' : '**index convention**: top starts at −1 and is the index of the top item'}. Operations that would overflow or underflow are rejected and change nothing.\n\n${showOps(ops, true).join(', ')}\n\nWhat is \`top\` at the end?`,
        visual: { type: 'astack', state: SQ.arrayStack(MAX, conv) },
        edge: r.events.length > 0,
        ...numeric(top, {
          explain: `${ev ? `Rejected: ${ev}. ` : ''}${SQ.stackSize(r.final)} item(s) remain, so top = ${top}. ${conv === 'count' ? 'Count convention: top = number of items; empty when top == 0, full when top == MAX.' : 'Index convention: top = number of items − 1; empty when top == −1, full when top == MAX − 1.'}`,
          wrong: { [conv === 'count' ? top - 1 : top + 1]: { msg: 'Check which convention is used for top.', tag: 'top-convention' } },
        }),
        hints: ['Track the number of items after each operation (ignoring rejected ones).', { text: conv === 'count' ? 'top equals the number of items.' : 'top equals the number of items minus one.' }, `Push is rejected when ${conv === 'count' ? 'top == MAX' : 'top == MAX − 1'}; pop when ${conv === 'count' ? 'top == 0' : 'top == −1'}.`],
      };
    },
  },
  {
    id: 'l12-fails',
    concept: 'l12.array-stack',
    conceptBy: (p) => (p.q ? 'l12.array-queue' : 'l12.array-stack'),
    type: 'predict',
    title: 'Which operations overflow or underflow?',
    generate(rng) {
      const isQ = rng.bool();
      const MAX = rng.int(2, 4);
      const base = opSeq(rng, { len: rng.int(6, 8), maxSize: MAX + 1, allowUnder: true });
      const ops = isQ ? asQueue(base) : asStack(base);
      const r = SQ.runOps(isQ ? 'aqueue' : 'astack', ops, MAX);
      const bad = new Set(r.events.map((e) => e.i));
      const names = showOps(ops, !isQ);
      const o = names.map((n, i) => ({ text: `${i + 1}. ${n}`, correct: bad.has(i), why: bad.has(i) ? r.events.find((e) => e.i === i).event : 'succeeds', tag: isQ ? 'linear-queue-full' : 'overflow' }));
      return {
        prompt: `${isQ ? 'Linear array QUEUE (front = rear = 0 at the start; enqueue writes queue[rear] and then increments rear; dequeue increments front; full when rear == MAX)' : 'Array STACK (count convention: top starts at 0; full when top == MAX)'} with MAX = ${MAX}. Select every operation that FAILS.`,
        edge: true,
        ...multi(keep(o), { explain: isQ ? 'In the linear queue, slots before front are never reused: once rear reaches MAX, enqueue fails even if the queue is nearly empty. A circular queue (rear = (rear + 1) % MAX) removes this limitation.' : 'Push fails when the stack is full, pop when it is empty.' }),
        hints: ['Keep a running count of the items (and of front and rear for the queue).', { text: isQ ? 'Watch rear: it only ever increases.' : 'Watch top.' }, isQ ? 'Enqueue fails exactly when rear == MAX.' : 'Pop on an empty stack is underflow.'],
        params: { q: isQ },
      };
    },
  },
  {
    id: 'l12-aqueue-fr',
    concept: 'l12.array-queue',
    type: 'predict',
    title: 'Array queue: front and rear',
    generate(rng) {
      const circ = rng.bool(0.3);
      const MAX = rng.int(4, 6);
      const ops = asQueue(opSeq(rng, { len: rng.int(5, 9), maxSize: MAX, allowUnder: rng.bool(0.3) }));
      const r = SQ.runOps(circ ? 'aqueue-circ' : 'aqueue', ops, MAX);
      return {
        prompt: `${circ ? '**Circular** array queue (extension): front = index of the front item, rear = index of the next free slot; both wrap around with % MAX' : '**Linear** array queue: front = index of the front item, rear = index of the next free slot (one past the last item)'}. MAX = ${MAX}, starting with front = rear = 0. Failed operations change nothing.\n\n${showOps(ops, false).join(', ')}\n\nWhat are front and rear at the end?`,
        visual: { type: 'aqueue', state: SQ.arrayQueue(MAX, circ ? 'circular' : 'linear') },
        edge: r.events.length > 0,
        ...fields(
          [
            { id: 'F', label: 'front', answer: r.final.F, tag: 'queue-indices' },
            { id: 'R', label: 'rear', answer: r.final.R, tag: 'queue-indices' },
          ],
          { explain: `Each enqueue moves rear forward, each dequeue moves front forward${circ ? ' (wrapping to 0 after MAX − 1)' : ''}. The queue holds ${SQ.queueSize(r.final)} item(s): ${SQ.contents(circ ? 'aqueue-circ' : 'aqueue', r.final).join(' ') || 'none'}.${r.events.length ? ' Rejected: ' + r.events.map((e) => `#${e.i + 1} ${e.event}`).join(', ') + '.' : ''}` },
        ),
        hints: ['Enqueue changes only rear; dequeue changes only front.', { text: 'The linear queue is empty when front == rear.' }, 'Count the successful enqueues for rear and the successful dequeues for front.'],
      };
    },
  },
  {
    id: 'l12-meaning',
    concept: 'l12.linked-queue',
    conceptBy: (p) => p.concept,
    type: 'choose',
    title: 'What exactly does top / rear mean?',
    generate(rng) {
      const qs = [
        { q: 'In an ARRAY stack where top starts at 0 and push does stack[top] = data; ++top, top is…', a: 'The index of the next free slot (= number of items)', c: 'l12.array-stack', d: ['The index of the top item', 'The address of the top node', 'Always MAX − 1'] },
        { q: 'In the INDEX-convention array stack (top = −1 initially; stack[++top] = data), top is…', a: 'The index of the top item', c: 'l12.array-stack', d: ['The index of the next free slot (= number of items)', 'The number of free slots', 'The address of the top node'] },
        { q: 'In a LINKED queue, rear is…', a: 'A pointer to the last node (NULL when the queue is empty)', c: 'l12.linked-queue', d: ['The index one past the last item', 'A pointer to the first node', 'The number of items'] },
        { q: 'In a LINEAR ARRAY queue where front = rear = 0 at the start and enqueue does queue[rear] = x; rear++, rear is…', a: 'The index of the next free slot (one past the last item)', c: 'l12.array-queue', d: ['The index of the last item', 'A pointer to the last node', 'The number of items in the queue'] },
        { q: 'In a LINKED stack that pushes and pops at the TAIL of the list (head points to the first node), top is…', a: 'A pointer to the last node of the list', c: 'l12.linked-stack', d: ['A pointer to the first node (head)', 'The index of the top item', 'The number of items'] },
        { q: 'In a linked stack that pushes and pops at the HEAD of the list, top is…', a: 'A pointer to the first node (NULL when empty)', c: 'l12.linked-stack', d: ['A pointer to the last node', 'The index of the next free slot', 'Always NULL'] },
      ];
      const x = rng.pick(qs);
      const o = opts(rng, [{ text: x.a, correct: true, why: 'Correct. Every condition in the code depends on this meaning.' }, ...x.d.map((t) => ({ text: t, correct: false, why: `Not in this implementation: ${x.a.charAt(0).toLowerCase() + x.a.slice(1)}.`, tag: 'top-convention' }))]);
      return {
        prompt: x.q,
        ...mcq(o, { explain: 'The same word (top, rear) means different things in array and linked implementations — always check how the code initializes and updates it.' }),
        hints: ['Look at the initial value and at what happens on the first push/enqueue.', { text: 'Array versions store indices; linked versions store addresses.' }, 'What is the value after exactly one insertion?'],
        params: { concept: x.c },
      };
    },
  },
  {
    id: 'l12-rewire-queue',
    concept: 'l12.linked-queue',
    type: 'rewire',
    title: 'Linked queue: enqueue / dequeue',
    generate(rng, { guidance = 'full', params = {} } = {}) {
      const op = params.op || rng.pick(['enqueue', 'dequeue', 'dequeue']);
      const n = params.n ?? (op === 'dequeue' ? rng.pick([1, 1, 2, 3, 4]) : rng.int(0, 3));
      const vs = values(rng, n);
      const w = randList(rng, 'sll', vs, { vars: ['front', 'rear'], globals: ['front', 'rear'] });
      const as = walk(w, w.vars.front).addrs;
      w.vars.rear = as.length ? as[as.length - 1] : null;
      w.role = 'lqueue';
      const v = rng.int(1, 99);
      const opf = op === 'enqueue' ? (x) => SQ.lqueueEnqueue(x, v, { detail: false }) : (x) => SQ.lqueueDequeue(x);
      const goal = opf(w).final;
      goal.globals = ['front', 'rear'];
      const world = JSON.parse(JSON.stringify(w));
      world.vars.temp = null;
      world.vars.new_node = null;
      world.varOrder.push('temp', 'new_node');
      const spec = { world, goal, opts: { head: 'front', lastVar: 'rear', locals: ['temp', 'new_node'] }, vars: ['front', 'rear', 'temp', 'new_node'], newValue: v };
      return {
        prompt: `${op === 'enqueue' ? `Enqueue **${v}**` : `Dequeue (remove ${vs[0]} and free it)`}. front points AT the first node, rear points AT the last node.${n === 1 && op === 'dequeue' ? ' This removes the FINAL item.' : ''}${n === 0 ? ' The queue is empty.' : ''}\n\n${guide(guidance, op === 'enqueue' ? (n === 0 ? 'Empty queue: front and rear must BOTH point to the new node.' : 'Link after rear, then move rear.') : n === 1 ? 'When the last item leaves, BOTH front and rear must become NULL — otherwise rear dangles.' : 'temp = front; front = front->next; free(temp).', '')}`,
        edge: n <= 1,
        ...rewire(spec, { explain: 'front and rear are consistent with the list.' }),
        hints: [op === 'enqueue' ? 'Items join at the rear.' : 'Items leave at the front.', { text: op === 'enqueue' ? 'Look at rear.' : 'Look at front (and rear if only one item).', hl: { vars: [op === 'enqueue' ? 'rear' : 'front'] } }, op === 'enqueue' ? (n === 0 ? 'new_node = create_node(); front = new_node; rear = new_node.' : 'new_node = create_node(); rear->next = new_node; rear = new_node.') : n === 1 ? 'temp = front; front = NULL; rear = NULL; free(temp).' : 'temp = front; front = second node; free(temp).'],
        solutionTrace: { struct: 'lqueue', op, world: w, args: op === 'enqueue' ? [v] : [] },
        params: {},
      };
    },
  },
  {
    id: 'l12-rewire-stack',
    concept: 'l12.linked-stack',
    type: 'rewire',
    title: 'Linked stack at the head: push / pop',
    generate(rng, { guidance = 'full' } = {}) {
      const op = rng.pick(['push', 'pop', 'pop']);
      const n = op === 'pop' ? rng.pick([1, 2, 3]) : rng.int(0, 3);
      const vs = values(rng, n);
      const w = randList(rng, 'sll', vs, { vars: ['top'], globals: ['top'] });
      const v = rng.int(1, 99);
      const goal = (op === 'push' ? SQ.lstackPushHead(w, v, { detail: false }) : SQ.lstackPopHead(w)).final;
      goal.globals = ['top'];
      const world = JSON.parse(JSON.stringify(w));
      world.vars.temp = null;
      world.vars.new_node = null;
      world.varOrder.push('temp', 'new_node');
      const spec = { world, goal, opts: { head: 'top', locals: ['temp', 'new_node'] }, vars: ['top', 'temp', 'new_node'], newValue: v };
      return {
        prompt: `This stack keeps its top at the HEAD of the list (top points to the first node). ${op === 'push' ? `Push **${v}**.` : `Pop (remove ${vs[0]} and free it).`}${n === 1 && op === 'pop' ? ' It is the last item.' : ''}\n\n${guide(guidance, op === 'push' ? 'This is an insertion at the beginning of the list.' : 'This is a deletion at the beginning of the list.', '')}`,
        edge: n <= 1,
        ...rewire(spec, { explain: 'With the top at the head, push and pop change only the links next to top — no walking through the list.' }),
        hints: ['With the top at the head, push is an insertion and pop a deletion at the beginning.', { text: 'Only top and one link change.', hl: { vars: ['top'] } }, op === 'push' ? 'new_node = create_node(); new_node->next = top; top = new_node.' : 'temp = top; top = top->next; free(temp).'],
      };
    },
  },
  {
    id: 'l12-choose',
    concept: 'l12.lifo-fifo',
    type: 'choose',
    title: 'Stack or queue?',
    generate(rng) {
      const sc = rng.pick([
        { s: 'Undo in a text editor: the most recent change is undone first.', a: 'stack' },
        { s: 'Print jobs sent to a shared printer are printed in the order they arrived.', a: 'queue' },
        { s: 'Checking that brackets in “{ ( [ ] ) }” are balanced.', a: 'stack' },
        { s: 'Breadth-first search keeps the discovered-but-not-yet-processed vertices.', a: 'queue' },
        { s: 'The computer keeps track of function calls so each call returns to the right place (recursion).', a: 'stack' },
        { s: 'Customers waiting at a ticket window.', a: 'queue' },
        { s: 'The browser “Back” button returns to the most recently visited page.', a: 'stack' },
        { s: 'Keyboard characters waiting to be processed by a slow program, in typing order.', a: 'queue' },
      ]);
      const o = opts(rng, [
        { text: 'Stack (LIFO)', correct: sc.a === 'stack', why: sc.a === 'stack' ? 'The newest item must come out first.' : 'Here the OLDEST item must come out first.', tag: 'lifo-fifo' },
        { text: 'Queue (FIFO)', correct: sc.a === 'queue', why: sc.a === 'queue' ? 'The oldest item must come out first.' : 'Here the NEWEST item must come out first.', tag: 'lifo-fifo' },
      ]);
      return {
        prompt: `**Scenario.** ${sc.s}\n\nWhich structure fits?`,
        ...mcq(o),
        reflection: reflect('Describe what goes wrong if you used the other structure here.'),
        hints: ['Which item should be removed next — the newest or the oldest?', { text: 'A stack is LIFO (last in, first out); a queue is FIFO (first in, first out).' }, 'Newest first → stack; oldest first → queue.'],
      };
    },
  },
];
