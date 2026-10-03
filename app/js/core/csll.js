// Circular singly linked list algorithms (Lecture 11).
// In a non-empty circular list the last node's next holds the address of the
// first node, so NO node's next is ever NULL.
import { Tracer } from './trace.js';
import { addVar, fmtPtr, buildList } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const CSLL_CODE = {
  insertBeg: {
    title: 'insert_at_beg()  (circular)',
    ref: 'Lec 11 p.2',
    lines: [
      'newnode = getnode();',
      'if (start == NULL) {',
      '    start = newnode;',
      '    newnode->next = start;      // a single node points to itself',
      '} else {',
      '    last = start;',
      '    while (last->next != start)',
      '        last = last->next;',
      '    newnode->next = start;      // (1)',
      '    start = newnode;            // (2)',
      '    last->next = start;         // (3) close the circle again',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()  (circular)',
    ref: 'Lec 11 p.2',
    lines: [
      'newnode = getnode();',
      'if (start == NULL) {',
      '    start = newnode;',
      '    newnode->next = start;',
      '} else {',
      '    temp = start;',
      '    while (temp->next != start)',
      '        temp = temp->next;',
      '    temp->next = newnode;       // (1)',
      '    newnode->next = start;      // (2)',
      '}',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beg()  (circular)',
    ref: 'Lec 11 p.3 (free and one-node case made explicit)',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'if (start->next == start) {    // only one node',
      '    free(start);',
      '    start = NULL;  return;',
      '}',
      'last = temp = start;',
      'while (last->next != start)',
      '    last = last->next;',
      'start = temp->next;             // (1)',
      'last->next = start;             // (2)',
      'free(temp);                     // the notes cross temp out; free it explicitly',
    ],
  },
  deleteEnd: {
    title: 'delete_at_end()  (circular)',
    ref: 'Lec 11 p.3 (with one-node correction)',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = prev = start;',
      'while (temp->next != start) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'if (temp == start)              // only one node',
      '    start = NULL;',
      'else',
      '    prev->next = start;         // (1)',
      'free(temp);',
    ],
  },
  traverse: {
    title: 'traverse()  (circular, do-while)',
    ref: 'Lec 11 p.4',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = start;',
      'do {',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '} while (temp != start);',
    ],
  },
  traverseNullBug: {
    title: 'WRONG traverse(): waiting for NULL',
    ref: 'Common mistake (compare Lec 09 p.5 vs Lec 11 p.4)',
    lines: [
      'temp = start;',
      'while (temp != NULL) {          // never false in a circle!',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '}',
    ],
  },
};

export function build(values) {
  return buildList('csll', values);
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, CSLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, 'start == NULL?')) {
    setVar(t, 2, 'start', a, `start = newnode (${a}).`);
    setLink(t, 3, a, 'next', a, `newnode->next = start: the only node points to ITSELF (${a} → ${a}). This is a valid circle of length 1.`);
    return endScope(t, ['newnode']);
  }
  setVar(t, 5, 'last', w.vars.start, `last = start. We need the last node because its next must be updated.`);
  while (true) {
    const ln = w.nodes[w.vars.last];
    if (!cond(t, 6, ln.next !== w.vars.start, `last->next != start? (${ln.next} vs ${w.vars.start})`, { nodes: [ln.addr] })) break;
    t.count('moves');
    setVar(t, 7, 'last', ln.next, `last = last->next → ${ln.next}.`);
  }
  setLink(t, 8, a, 'next', w.vars.start, `(1) newnode->next = start (${w.vars.start}).`);
  setVar(t, 9, 'start', a, `(2) start = newnode (${a}).`);
  setLink(t, 10, w.vars.last, 'next', a, `(3) last->next = start: the last node (${w.vars.last}) now points to the new first node, closing the circle.`);
  return endScope(t, ['newnode', 'last']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, CSLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, 'start == NULL?')) {
    setVar(t, 2, 'start', a, `start = newnode (${a}).`);
    setLink(t, 3, a, 'next', a, `newnode->next = start: the node points to itself.`);
    return endScope(t, ['newnode']);
  }
  setVar(t, 5, 'temp', w.vars.start, 'temp = start.');
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 6, tn.next !== w.vars.start, `temp->next != start? (${tn.next} vs ${w.vars.start})`, { nodes: [tn.addr] })) break;
    t.count('moves');
    setVar(t, 7, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  setLink(t, 8, w.vars.temp, 'next', a, `(1) temp->next = newnode: old last node ${w.vars.temp} → ${a}.`);
  setLink(t, 9, a, 'next', w.vars.start, `(2) newnode->next = start: the new last node points back to the first (${w.vars.start}).`);
  return endScope(t, ['newnode', 'temp']);
}

export function deleteBeg(world) {
  const t = new Tracer(world, CSLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, 'start == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  if (cond(t, 1, w.nodes[w.vars.start].next === w.vars.start, `start->next == start? (only one node)`)) {
    addVar(w, 'temp', w.vars.start);
    freeStep(t, 2, 'temp', `free(start): the only node (${w.vars.start}) is released.`);
    setVar(t, 3, 'start', null, 'start = NULL: the list is empty. Without this, start would dangle.');
    return endScope(t, ['temp']);
  }
  addVar(w, 'last', w.vars.start);
  addVar(w, 'temp', w.vars.start);
  t.count('varWrites', 2);
  t.step(5, 'var', `last = temp = start (${w.vars.start}).`, { vars: ['last', 'temp'] });
  while (true) {
    const ln = w.nodes[w.vars.last];
    if (!cond(t, 6, ln.next !== w.vars.start, `last->next != start? (${ln.next})`)) break;
    t.count('moves');
    setVar(t, 7, 'last', ln.next, `last = last->next → ${ln.next}.`);
  }
  const nx = w.nodes[w.vars.temp].next;
  setVar(t, 8, 'start', nx, `(1) start = temp->next → ${nx} (data ${d(w, nx)}).`);
  setLink(t, 9, w.vars.last, 'next', nx, `(2) last->next = start: the last node skips the removed node and points to the new first node.`);
  freeStep(t, 10, 'temp');
  return endScope(t, ['last', 'temp']);
}

export function deleteEnd(world) {
  const t = new Tracer(world, CSLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, 'start == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.start);
  addVar(w, 'prev', w.vars.start);
  t.count('varWrites', 2);
  t.step(1, 'var', `temp = prev = start.`, { vars: ['temp', 'prev'] });
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.next !== w.vars.start, `temp->next != start? (${tn.next})`)) break;
    setVar(t, 3, 'prev', w.vars.temp, `prev = temp.`);
    t.count('moves');
    setVar(t, 4, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  if (cond(t, 6, w.vars.temp === w.vars.start, 'temp == start? (only one node)')) {
    setVar(t, 7, 'start', null, 'start = NULL: list becomes empty.');
  } else {
    setLink(t, 9, w.vars.prev, 'next', w.vars.start, `(1) prev->next = start: node ${w.vars.prev} becomes the last node and points back to the first.`);
  }
  freeStep(t, 10, 'temp');
  return endScope(t, ['temp', 'prev']);
}

export function traverse(world) {
  const t = new Tracer(world, CSLL_CODE.traverse);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, 'start == NULL?')) {
    t.output.push('Empty list');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.start, `temp = start (${w.vars.start}).`);
  let guard = 0;
  do {
    const n = w.nodes[w.vars.temp];
    t.output.push(n.data);
    t.count('visits');
    t.step(3, 'output', `prints ${n.data}. (do-while: the body runs BEFORE the first test, so we do not stop immediately at start.)`, { nodes: [n.addr], visit: n.addr });
    t.count('moves');
    setVar(t, 4, 'temp', n.next, `temp = temp->next → ${n.next}.`);
    if (++guard > 200) break;
  } while (cond(t, 5, w.vars.temp !== w.vars.start, `temp != start? (${w.vars.temp} vs ${w.vars.start})`));
  return endScope(t, ['temp'], `Exactly one lap. Output: ${t.output.join(' ')}`);
}

/** Demonstrates the infinite loop: stops after `cap` iterations. */
export function traverseNullBug(world, cap) {
  const t = new Tracer(world, CSLL_CODE.traverseNullBug);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.start, 'temp = start.');
  let it = 0;
  const n0 = Object.keys(w.nodes).length;
  const limit = cap || Math.max(3, n0 * 2 + 1);
  while (cond(t, 1, w.vars.temp !== null, `temp != NULL? (${fmtPtr(w.vars.temp)})`)) {
    if (it >= limit) {
      t.fail(1, `Stopped by the simulator after ${it} prints. In a valid circle temp NEVER becomes NULL, so a real program loops forever, printing ${t.output.slice(0, n0).join(' ')} again and again.`);
      return t.finish('Infinite loop detected.');
    }
    const n = w.nodes[w.vars.temp];
    t.output.push(n.data);
    t.step(2, 'output', `prints ${n.data}${it >= n0 ? ' — AGAIN, we are on the second lap' : ''}.`, { nodes: [n.addr], visit: n.addr });
    setVar(t, 3, 'temp', n.next, `temp = temp->next → ${n.next}.`);
    it++;
  }
  return endScope(t, ['temp']);
}
