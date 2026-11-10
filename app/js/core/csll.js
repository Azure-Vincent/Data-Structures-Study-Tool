// Circular singly linked list algorithms, traced step by step.
// In a non-empty circular list the last node's next holds the address of the
// first node, so NO node's next is ever NULL.
import { Tracer, keyCodes } from './trace.js';
import { addVar, fmtPtr, buildList } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const CSLL_CODE = {
  insertBeg: {
    title: 'insert_at_beginning()  (circular)',
    lines: [
      'new_node = create_node();',
      'if (head == NULL) {',
      '    head = new_node;',
      '    new_node->next = head;      // a single node points to itself',
      '} else {',
      '    last = head;',
      '    while (last->next != head)',
      '        last = last->next;',
      '    new_node->next = head;      // (1)',
      '    head = new_node;            // (2)',
      '    last->next = head;         // (3) close the circle again',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()  (circular)',
    lines: [
      'new_node = create_node();',
      'if (head == NULL) {',
      '    head = new_node;',
      '    new_node->next = head;',
      '} else {',
      '    temp = head;',
      '    while (temp->next != head)',
      '        temp = temp->next;',
      '    temp->next = new_node;       // (1)',
      '    new_node->next = head;      // (2)',
      '}',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beginning()  (circular)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'if (head->next == head) {    // only one node',
      '    free(head);',
      '    head = NULL;  return;',
      '}',
      'last = temp = head;',
      'while (last->next != head)',
      '    last = last->next;',
      'head = temp->next;             // (1)',
      'last->next = head;             // (2)',
      'free(temp);                     // release the removed node explicitly',
    ],
  },
  deleteEnd: {
    title: 'delete_at_end()  (circular)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = prev = head;',
      'while (temp->next != head) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'if (temp == head)              // only one node',
      '    head = NULL;',
      'else',
      '    prev->next = head;         // (1)',
      'free(temp);',
    ],
  },
  traverse: {
    title: 'traverse()  (circular, do-while)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = head;',
      'do {',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '} while (temp != head);',
    ],
  },
  traverseNullBug: {
    title: 'Incorrect traverse(): waiting for NULL',
    lines: [
      'temp = head;',
      'while (temp != NULL) {          // never false in a circle',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '}',
    ],
  },
};
keyCodes(CSLL_CODE, 'csll');


export function build(values) {
  return buildList('csll', values);
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, CSLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, 'head == NULL?')) {
    setVar(t, 2, 'head', a, `head = new_node (${a}).`);
    setLink(t, 3, a, 'next', a, `new_node->next = head: the only node points to ITSELF (${a} → ${a}). This is a valid circle of length 1.`);
    return endScope(t, ['new_node']);
  }
  setVar(t, 5, 'last', w.vars.head, `last = head. The last node is needed because its next must be updated.`);
  while (true) {
    const ln = w.nodes[w.vars.last];
    if (!cond(t, 6, ln.next !== w.vars.head, `last->next != head? (${ln.next} vs ${w.vars.head})`, { nodes: [ln.addr] })) break;
    t.count('moves');
    setVar(t, 7, 'last', ln.next, `last = last->next → ${ln.next}.`);
  }
  setLink(t, 8, a, 'next', w.vars.head, `(1) new_node->next = head (${w.vars.head}).`);
  setVar(t, 9, 'head', a, `(2) head = new_node (${a}).`);
  setLink(t, 10, w.vars.last, 'next', a, `(3) last->next = head: the last node (${w.vars.last}) now points to the new first node, closing the circle.`);
  return endScope(t, ['new_node', 'last']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, CSLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, 'head == NULL?')) {
    setVar(t, 2, 'head', a, `head = new_node (${a}).`);
    setLink(t, 3, a, 'next', a, `new_node->next = head: the node points to itself.`);
    return endScope(t, ['new_node']);
  }
  setVar(t, 5, 'temp', w.vars.head, 'temp = head.');
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 6, tn.next !== w.vars.head, `temp->next != head? (${tn.next} vs ${w.vars.head})`, { nodes: [tn.addr] })) break;
    t.count('moves');
    setVar(t, 7, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  setLink(t, 8, w.vars.temp, 'next', a, `(1) temp->next = new_node: old last node ${w.vars.temp} → ${a}.`);
  setLink(t, 9, a, 'next', w.vars.head, `(2) new_node->next = head: the new last node points back to the first (${w.vars.head}).`);
  return endScope(t, ['new_node', 'temp']);
}

export function deleteBeg(world) {
  const t = new Tracer(world, CSLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  if (cond(t, 1, w.nodes[w.vars.head].next === w.vars.head, `head->next == head? (only one node)`)) {
    addVar(w, 'temp', w.vars.head);
    freeStep(t, 2, 'temp', `free(head): the only node (${w.vars.head}) is released.`);
    setVar(t, 3, 'head', null, 'head = NULL: the list is empty. Without this, head would dangle.');
    return endScope(t, ['temp']);
  }
  addVar(w, 'last', w.vars.head);
  addVar(w, 'temp', w.vars.head);
  t.count('varWrites', 2);
  t.step(5, 'var', `last = temp = head (${w.vars.head}).`, { vars: ['last', 'temp'] });
  while (true) {
    const ln = w.nodes[w.vars.last];
    if (!cond(t, 6, ln.next !== w.vars.head, `last->next != head? (${ln.next})`)) break;
    t.count('moves');
    setVar(t, 7, 'last', ln.next, `last = last->next → ${ln.next}.`);
  }
  const nx = w.nodes[w.vars.temp].next;
  setVar(t, 8, 'head', nx, `(1) head = temp->next → ${nx} (data ${d(w, nx)}).`);
  setLink(t, 9, w.vars.last, 'next', nx, `(2) last->next = head: the last node skips the removed node and points to the new first node.`);
  freeStep(t, 10, 'temp');
  return endScope(t, ['last', 'temp']);
}

export function deleteEnd(world) {
  const t = new Tracer(world, CSLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.head);
  addVar(w, 'prev', w.vars.head);
  t.count('varWrites', 2);
  t.step(1, 'var', `temp = prev = head.`, { vars: ['temp', 'prev'] });
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.next !== w.vars.head, `temp->next != head? (${tn.next})`)) break;
    setVar(t, 3, 'prev', w.vars.temp, `prev = temp.`);
    t.count('moves');
    setVar(t, 4, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  if (cond(t, 6, w.vars.temp === w.vars.head, 'temp == head? (only one node)')) {
    setVar(t, 7, 'head', null, 'head = NULL: the list becomes empty.');
  } else {
    setLink(t, 9, w.vars.prev, 'next', w.vars.head, `(1) prev->next = head: node ${w.vars.prev} becomes the last node and points back to the first.`);
  }
  freeStep(t, 10, 'temp');
  return endScope(t, ['temp', 'prev']);
}

export function traverse(world) {
  const t = new Tracer(world, CSLL_CODE.traverse);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.head, `temp = head (${w.vars.head}).`);
  let guard = 0;
  do {
    const n = w.nodes[w.vars.temp];
    t.output.push(n.data);
    t.count('visits');
    t.step(3, 'output', `prints ${n.data}. (do-while: the body runs BEFORE the first test, so the loop does not stop immediately at head.)`, { nodes: [n.addr], visit: n.addr });
    t.count('moves');
    setVar(t, 4, 'temp', n.next, `temp = temp->next → ${n.next}.`);
    if (++guard > 200) break;
  } while (cond(t, 5, w.vars.temp !== w.vars.head, `temp != head? (${w.vars.temp} vs ${w.vars.head})`));
  return endScope(t, ['temp'], `Exactly one lap. Output: ${t.output.join(' ')}`);
}

/** Demonstrates the infinite loop: stops after `cap` iterations. */
export function traverseNullBug(world, cap) {
  const t = new Tracer(world, CSLL_CODE.traverseNullBug);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.head, 'temp = head.');
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
    t.step(2, 'output', `prints ${n.data}${it >= n0 ? ' AGAIN: temp is on the second lap' : ''}.`, { nodes: [n.addr], visit: n.addr });
    setVar(t, 3, 'temp', n.next, `temp = temp->next → ${n.next}.`);
    it++;
  }
  return endScope(t, ['temp']);
}
