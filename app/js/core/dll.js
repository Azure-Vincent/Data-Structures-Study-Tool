// Doubly linked list algorithms, traced step by step. Each node has two links:
// "prev" (the previous node) and "next" (the next node).
import { Tracer, keyCodes } from './trace.js';
import { addVar, fmtPtr, walk } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const DLL_CODE = {
  insertBeg: {
    title: 'insert_at_beginning()  (doubly linked)',
    lines: [
      'new_node = create_node();            // prev = next = NULL',
      'if (head == NULL)',
      '    head = new_node;',
      'else {',
      '    new_node->next = head;     // (1)',
      '    head->prev = new_node;      // (2)',
      '    head = new_node;            // (3)',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()  (doubly linked)',
    lines: [
      'new_node = create_node();',
      'if (head == NULL)',
      '    head = new_node;',
      'else {',
      '    temp = head;',
      '    while (temp->next != NULL)',
      '        temp = temp->next;',
      '    temp->next = new_node;      // (1)',
      '    new_node->prev = temp;       // (2)',
      '}',
    ],
  },
  insertMid: {
    title: 'insert_at_position(pos)  (doubly linked)',
    lines: [
      'node_count = count_nodes(head);',
      'if (pos > 1 && pos <= node_count) {',
      '    new_node = create_node();',
      '    temp = prev = head;  i = 1;',
      '    while (i < pos) {',
      '        prev = temp;',
      '        temp = temp->next;',
      '        i++;',
      '    }',
      '    new_node->prev = prev;       // (1)',
      '    new_node->next = temp;      // (2)',
      '    prev->next = new_node;      // (3)',
      '    temp->prev = new_node;       // (4)',
      '} else',
      '    printf("position %d is not a middle position", pos);',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beginning()  (doubly linked)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = head;                   // (1)',
      'head = temp->next;            // (2)',
      'if (head != NULL)              // the list may now be empty',
      '    head->prev = NULL;         // (3)',
      'free(temp);                     // (4)',
    ],
  },
  deleteBegIncorrect: {
    title: 'delete_at_beginning() without the one-node case (incorrect)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = head;                   // (1)',
      'head = temp->next;            // (2)',
      'head->prev = NULL;             // (3)',
      'free(temp);                     // (4)',
    ],
  },
  deleteEnd: {
    title: 'delete_at_end()  (doubly linked)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = head;',
      'while (temp->next != NULL)',
      '    temp = temp->next;',
      'if (temp->prev == NULL)         // one-node list: temp is the only node',
      '    head = NULL;',
      'else',
      '    temp->prev->next = NULL;',
      'free(temp);',
    ],
  },
  deleteMid: {
    title: 'delete_at_position(pos)  (doubly linked)',
    lines: [
      'node_count = count_nodes(head);',
      'if (pos > 1 && pos < node_count) {',
      '    temp = head;  i = 1;',
      '    while (i < pos) {',
      '        temp = temp->next;',
      '        i++;',
      '    }',
      '    temp->next->prev = temp->prev;   // (1)',
      '    temp->prev->next = temp->next;  // (2)',
      '    free(temp);',
      '} else',
      '    printf("Invalid position");',
    ],
  },
  traverseFwd: {
    title: 'traverse forward (next links)',
    lines: [
      'temp = head;',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '}',
    ],
  },
  traverseBwd: {
    title: 'traverse backward (prev links)',
    extension: true,
    lines: [
      'temp = head;',
      'if (temp == NULL) return;',
      'while (temp->next != NULL)    // first go to the last node',
      '    temp = temp->next;',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->prev;',
      '}',
    ],
  },
  count_nodes: {
    title: 'count_nodes(head)  (recursive)',
    lines: [
      'int count_nodes(node *head) {',
      '    if (head == NULL)',
      '        return 0;',
      '    else',
      '        return 1 + count_nodes(head->next);',
      '}',
    ],
  },
};
keyCodes(DLL_CODE, 'dll');


function countSilently(t) {
  const r = walk(t.state, t.state.vars.head, 'next');
  t.count('calls');
  t.count('moves', r.addrs.length);
  return r.addrs.length;
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, `head == NULL? head = ${fmtPtr(w.vars.head)}`)) {
    setVar(t, 2, 'head', a, `head = new_node (${a}).`);
  } else {
    const old = w.vars.head;
    setLink(t, 4, a, 'next', old, `(1) new_node->next = head: forward link from the new node (${a}) to the old first node (${old}).`);
    setLink(t, 5, old, 'prev', a, `(2) head->prev = new_node: BACKWARD link from ${old} to the new node. Forgetting this leaves ${old}'s prev = NULL, so walking backwards would stop early.`);
    setVar(t, 6, 'head', a, `(3) head = new_node (${a}).`);
  }
  return endScope(t, ['new_node']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, `head == NULL?`)) {
    setVar(t, 2, 'head', a, `head = new_node (${a}).`);
  } else {
    setVar(t, 4, 'temp', w.vars.head, `temp = head.`);
    while (true) {
      const tn = w.nodes[w.vars.temp];
      t.count('visits');
      if (!cond(t, 5, tn.next !== null, `temp->next != NULL? (${fmtPtr(tn.next)})`, { nodes: [tn.addr] })) break;
      t.count('moves');
      setVar(t, 6, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
    }
    setLink(t, 7, w.vars.temp, 'next', a, `(1) temp->next = new_node: forward link ${w.vars.temp} → ${a}.`);
    setLink(t, 8, a, 'prev', w.vars.temp, `(2) new_node->prev = temp: backward link ${a} → ${w.vars.temp}.`);
  }
  return endScope(t, ['new_node', 'temp']);
}

export function insertMid(world, value, pos, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertMid);
  const w = t.state;
  const node_count = countSilently(t);
  w.locals = { node_count, pos };
  t.step(0, 'call', `node_count = count_nodes(head) = ${node_count}.`);
  if (!cond(t, 1, pos > 1 && pos <= node_count, `pos > 1 && pos <= node_count with pos = ${pos}, node_count = ${node_count}`)) {
    t.output.push(`position ${pos} is not a middle position`);
    delete w.locals;
    t.fail(14, `Position ${pos} is not a middle position (valid: 2..${node_count}).`);
    return endScope(t, []);
  }
  const a = getnodeSteps(t, 2, value, opts);
  addVar(w, 'temp', w.vars.head);
  addVar(w, 'prev', w.vars.head);
  let i = 1;
  w.locals.i = 1;
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = head; i = 1.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, i < pos, `i < pos? ${i} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    t.count('moves');
    setVar(t, 6, 'temp', w.nodes[w.vars.temp].next, `temp = temp->next → ${w.nodes[w.vars.temp].next}.`);
    i++;
    w.locals.i = i;
    t.step(7, 'var', `i++ → ${i}.`);
  }
  const p = w.vars.prev;
  const q = w.vars.temp;
  setLink(t, 9, a, 'prev', p, `(1) new_node->prev = prev: new node points back to ${p} (data ${d(w, p)}).`);
  setLink(t, 10, a, 'next', q, `(2) new_node->next = temp: new node points forward to ${q} (data ${d(w, q)}).`);
  setLink(t, 11, p, 'next', a, `(3) prev->next = new_node: ${p} now points forward to the new node.`);
  setLink(t, 12, q, 'prev', a, `(4) temp->prev = new_node: ${q} now points back to the new node. All four links agree.`);
  delete w.locals;
  return endScope(t, ['new_node', 'temp', 'prev']);
}

export function deleteBeg(world, { incorrectVersion = false } = {}) {
  const t = new Tracer(world, incorrectVersion ? DLL_CODE.deleteBegIncorrect : DLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.head, `(1) temp = head (${w.vars.head}).`);
  const nx = w.nodes[w.vars.temp].next;
  setVar(t, 2, 'head', nx, `(2) head = temp->next → ${fmtPtr(nx)}.`);
  if (incorrectVersion) {
    if (w.vars.head === null) {
      t.fail(3, 'CRASH: head is NULL (the only node was just removed), so head->prev dereferences NULL: segmentation fault. The assignment needs the check "if (head != NULL)".');
      return t.finish('Program would crash here.');
    }
    setLink(t, 3, w.vars.head, 'prev', null, `(3) head->prev = NULL: the new first node has no previous node.`);
    freeStep(t, 4, 'temp');
    return endScope(t, ['temp']);
  }
  if (cond(t, 3, w.vars.head !== null, 'head != NULL? (does the list still have a node?)')) {
    setLink(t, 4, w.vars.head, 'prev', null, `(3) head->prev = NULL: the new first node no longer points back to the node being removed.`);
  }
  freeStep(t, 5, 'temp');
  return endScope(t, ['temp']);
}

export function deleteEnd(world) {
  const t = new Tracer(world, DLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.head, `temp = head.`);
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.next !== null, `temp->next != NULL? (${fmtPtr(tn.next)})`)) break;
    t.count('moves');
    setVar(t, 3, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  const tn = w.nodes[w.vars.temp];
  if (cond(t, 4, tn.prev === null, `temp->prev == NULL? (only one node)`)) {
    setVar(t, 5, 'head', null, 'head = NULL: the list is now empty.');
  } else {
    setLink(t, 7, tn.prev, 'next', null, `temp->prev->next = NULL: node ${tn.prev} (data ${d(w, tn.prev)}) becomes the last node.`);
  }
  freeStep(t, 8, 'temp');
  return endScope(t, ['temp']);
}

export function deleteMid(world, pos) {
  const t = new Tracer(world, DLL_CODE.deleteMid);
  const w = t.state;
  const node_count = countSilently(t);
  w.locals = { node_count, pos };
  t.step(0, 'call', `node_count = count_nodes(head) = ${node_count}.`);
  if (!cond(t, 1, pos > 1 && pos < node_count, `pos > 1 && pos < node_count with pos = ${pos}, node_count = ${node_count}`)) {
    t.output.push('Invalid position');
    delete w.locals;
    t.fail(11, `Position ${pos} is not an intermediate position (valid: 2..${node_count - 1}).`);
    return endScope(t, []);
  }
  setVar(t, 2, 'temp', w.vars.head, `temp = head; i = 1.`);
  let i = 1;
  w.locals.i = 1;
  while (cond(t, 3, i < pos, `i < pos? ${i} < ${pos}`)) {
    t.count('moves');
    setVar(t, 4, 'temp', w.nodes[w.vars.temp].next, `temp = temp->next → ${w.nodes[w.vars.temp].next}.`);
    i++;
    w.locals.i = i;
    t.step(5, 'var', `i++ → ${i}.`);
  }
  const tn = w.nodes[w.vars.temp];
  setLink(t, 7, tn.next, 'prev', tn.prev, `(1) temp->next->prev = temp->prev: node ${tn.next} (data ${d(w, tn.next)}) now points BACK to ${tn.prev}, skipping ${tn.addr}.`);
  setLink(t, 8, tn.prev, 'next', tn.next, `(2) temp->prev->next = temp->next: node ${tn.prev} (data ${d(w, tn.prev)}) now points FORWARD to ${tn.next}, skipping ${tn.addr}.`);
  freeStep(t, 9, 'temp');
  delete w.locals;
  return endScope(t, ['temp']);
}

export function traverseFwd(world) {
  const t = new Tracer(world, DLL_CODE.traverseFwd);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.head, `temp = head (${fmtPtr(w.vars.head)}).`);
  let guard = 0;
  while (cond(t, 1, w.vars.temp !== null, `temp != NULL? (${fmtPtr(w.vars.temp)})`)) {
    const n = w.nodes[w.vars.temp];
    if (!n || n.freed || ++guard > 100) {
      t.fail(1, `temp holds ${w.vars.temp}, which is not a valid node.`);
      return t.finish();
    }
    t.output.push(n.data);
    t.count('visits');
    t.step(2, 'output', `prints ${n.data}.`, { nodes: [n.addr], visit: n.addr });
    t.count('moves');
    setVar(t, 3, 'temp', n.next, `temp = temp->next → ${fmtPtr(n.next)}.`);
  }
  return endScope(t, ['temp'], `Forward output: ${t.output.join(' ')}`);
}

export function traverseBwd(world) {
  const t = new Tracer(world, DLL_CODE.traverseBwd);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.head, `temp = head.`);
  if (cond(t, 1, w.vars.temp === null, 'temp == NULL?')) return endScope(t, ['temp']);
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.next !== null, `temp->next != NULL? (${fmtPtr(tn.next)})`)) break;
    t.count('moves');
    setVar(t, 3, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  let guard = 0;
  while (cond(t, 4, w.vars.temp !== null, `temp != NULL? (${fmtPtr(w.vars.temp)})`)) {
    const n = w.nodes[w.vars.temp];
    if (!n || n.freed || ++guard > 100) {
      t.fail(4, `temp holds ${w.vars.temp}, which is not a valid node.`);
      return t.finish();
    }
    t.output.push(n.data);
    t.count('visits');
    t.step(5, 'output', `prints ${n.data}.`, { nodes: [n.addr], visit: n.addr });
    t.count('moves');
    setVar(t, 6, 'temp', n.prev, `temp = temp->prev → ${fmtPtr(n.prev)}.`);
  }
  return endScope(t, ['temp'], `Backward output: ${t.output.join(' ')}`);
}

/** Recursive count_nodes with a visible call stack (state.callStack). */
export function count_nodes(world) {
  const t = new Tracer(world, DLL_CODE.count_nodes);
  const w = t.state;
  w.callStack = [];
  function rec(addr, depth) {
    t.count('calls');
    w.callStack.push({ fn: 'count_nodes', arg: addr, ret: null });
    t.step(0, 'call', `Call count_nodes(${fmtPtr(addr)}) — depth ${depth}. A new frame is pushed on the call stack; its parameter "head" is a LOCAL copy holding ${fmtPtr(addr)}.`, { nodes: addr ? [addr] : [], frame: w.callStack.length - 1 });
    if (cond(t, 1, addr === null, `head == NULL? (frame ${depth}: ${fmtPtr(addr)})`)) {
      w.callStack[w.callStack.length - 1].ret = 0;
      t.step(2, 'return', `Base case: return 0. This frame is popped.`);
      w.callStack.pop();
      return 0;
    }
    t.count('visits');
    t.step(4, 'recurse', `Not NULL: the call must compute 1 + count_nodes(head->next) = 1 + count_nodes(${fmtPtr(w.nodes[addr].next)}). This frame waits.`, { nodes: [addr] });
    const sub = rec(w.nodes[addr].next, depth + 1);
    const r = 1 + sub;
    w.callStack[w.callStack.length - 1].ret = r;
    t.step(4, 'return', `Back in frame ${depth} (node ${addr}, data ${d(w, addr)}): the inner call returned ${sub}, so return 1 + ${sub} = ${r}.`, { nodes: [addr] });
    w.callStack.pop();
    return r;
  }
  const n = rec(w.vars.head, 0);
  t.output.push(n);
  delete w.callStack;
  return t.finish(`count_nodes returns ${n}. Maximum call-stack depth was ${n + 1} frames (one per node plus the NULL call).`, n);
}
