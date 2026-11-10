// Singly linked list algorithms, traced step by step.
// Code lines are written in C; comments state the rules the code relies on.
import { Tracer, keyCodes } from './trace.js';
import { addVar, fmtPtr, walk, buildList, create_node as rawGetnode } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const SLL_CODE = {
  insertBeg: {
    title: 'insert_at_beginning()',
    lines: [
      'new_node = create_node();          // malloc, data, next = NULL',
      'if (head == NULL)',
      '    head = new_node;',
      'else {',
      '    new_node->next = head;    // (1) new node -> old first node',
      '    head = new_node;          // (2) head -> new node',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()',
    lines: [
      'new_node = create_node();',
      'if (head == NULL)',
      '    head = new_node;',
      'else {',
      '    temp = head;',
      '    while (temp->next != NULL)',
      '        temp = temp->next;',
      '    temp->next = new_node;',
      '}',
    ],
  },
  insertMid: {
    title: 'insert_at_position(pos)',
    lines: [
      'node_count = count_nodes(head);',
      'if (pos > 1 && pos <= node_count) {   // middle positions: 2 .. node_count',
      '    new_node = create_node();           // allocate only after validating',
      '    temp = prev = head;  i = 1;',
      '    while (i < pos) {',
      '        prev = temp;',
      '        temp = temp->next;',
      '        i++;',
      '    }',
      '    prev->next = new_node;          // (1)',
      '    new_node->next = temp;          // (2) safe: temp saved the rest',
      '} else',
      '    printf("position %d is not a middle position", pos);',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beginning()',
    lines: [
      'if (head == NULL) {',
      '    printf("No nodes exist"); return;',
      '}',
      'temp = head;',
      'head = temp->next;',
      'free(temp);',
    ],
  },
  deleteEnd: {
    title: 'delete_at_end()',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = prev = head;',
      'while (temp->next != NULL) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'if (temp == head)              // one-node list: temp is the only node',
      '    head = NULL;',
      'else',
      '    prev->next = NULL;',
      'free(temp);',
    ],
  },
  deleteEndIncorrect: {
    title: 'delete_at_end() without the one-node case (incorrect)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'temp = prev = head;',
      'while (temp->next != NULL) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'prev->next = NULL;',
      'free(temp);',
    ],
  },
  deleteMid: {
    title: 'delete_at_position(pos)',
    lines: [
      'if (head == NULL) { printf("Empty list"); return; }',
      'node_count = count_nodes(head);',
      'if (pos > 1 && pos < node_count) {',
      '    temp = prev = head;  i = 1;',
      '    while (i < pos) {',
      '        prev = temp;',
      '        temp = temp->next;',
      '        i++;',
      '    }',
      '    prev->next = temp->next;     // bypass the node',
      '    free(temp);                  // then release it',
      '} else',
      '    printf("Invalid position");',
    ],
  },
  traverse: {
    title: 'traverse()',
    lines: [
      'temp = head;',
      'if (head == NULL) printf("Empty list");',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '}',
    ],
  },
  createList: {
    title: 'create_list(n)',
    lines: [
      'for (i = 0; i < n; i++) {',
      '    new_node = create_node();',
      '    if (head == NULL)',
      '        head = new_node;',
      '    else {',
      '        temp = head;',
      '        while (temp->next != NULL)',
      '            temp = temp->next;',
      '        temp->next = new_node;',
      '    }',
      '}',
    ],
  },
};
keyCodes(SLL_CODE, 'sll');


/** Count nodes silently (count_nodes is a helper call, shown as one step). */
function countSilently(t, line) {
  const w = t.state;
  const r = walk(w, w.vars.head);
  t.count('calls');
  t.count('moves', r.addrs.length);
  t.count('visits', r.addrs.length);
  return r.addrs.length;
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, `Is the list empty? head = ${fmtPtr(w.vars.head)}`, { vars: ['head'] })) {
    setVar(t, 2, 'head', a, `head = new_node: head now holds ${a}, the address of the only node.`);
  } else {
    const old = w.vars.head;
    setLink(t, 4, a, 'next', old, `(1) new_node->next = head: the new node (${a}) now points to the old first node (${old}, data ${d(w, old)}). Do this FIRST, while head still remembers the old first node.`);
    setVar(t, 5, 'head', a, `(2) head = new_node: head moves to ${a}. Nothing was lost because the new node already links to ${old}.`);
  }
  return endScope(t, ['new_node']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.head === null, `Is the list empty? head = ${fmtPtr(w.vars.head)}`, { vars: ['head'] })) {
    setVar(t, 2, 'head', a, `head = new_node (${a}).`);
  } else {
    setVar(t, 4, 'temp', w.vars.head, `temp = head: temp and head now refer to the SAME address (${w.vars.head}). Moving temp will not move head.`);
    while (true) {
      const tn = w.nodes[w.vars.temp];
      t.count('visits');
      if (!cond(t, 5, tn.next !== null, `temp->next != NULL? temp->next = ${fmtPtr(tn.next)}`, { nodes: [tn.addr], links: [{ from: tn.addr, field: 'next' }] })) break;
      t.count('moves');
      setVar(t, 6, 'temp', tn.next, `temp = temp->next: temp advances from ${tn.addr} to ${tn.next} (data ${d(w, tn.next)}).`);
    }
    setLink(t, 7, w.vars.temp, 'next', a, `temp->next = new_node: the last node (${w.vars.temp}) used to hold NULL; now it holds ${a}.`);
  }
  return endScope(t, ['new_node', 'temp']);
}


export function insertMid(world, value, pos, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertMid);
  const w = t.state;
  const node_count = countSilently(t, 0);
  t.step(0, 'call', `count_nodes(head) walks the list and returns ${node_count}. node_count = ${node_count}.`, {});
  t.state.locals = { node_count, pos };
  if (!cond(t, 1, pos > 1 && pos <= node_count, `pos > 1 && pos <= node_count with pos = ${pos}, node_count = ${node_count}`)) {
    t.output.push(`position ${pos} is not a middle position`);
    t.fail(12, `Position ${pos} is not a middle position (valid: 2..${node_count}). Use insert at beginning (pos 1) or at end (pos ${node_count + 1}).`);
    delete t.state.locals;
    return endScope(t, ['new_node', 'temp', 'prev']);
  }
  const a = getnodeSteps(t, 2, value, opts);
  addVar(w, 'temp', w.vars.head);
  addVar(w, 'prev', w.vars.head);
  let i = 1;
  w.locals = { node_count, pos, i };
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = head (${w.vars.head}); i = 1. Both pointers start at the first node.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, i < pos, `i < pos? ${i} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}). prev follows one node behind temp.`);
    const nx = w.nodes[w.vars.temp].next;
    t.count('moves');
    setVar(t, 6, 'temp', nx, `temp = temp->next → ${fmtPtr(nx)} (data ${d(w, nx)}).`);
    i++;
    w.locals.i = i;
    t.step(7, 'var', `i++ → ${i}.`);
  }
  const p = w.vars.prev;
  const tp = w.vars.temp;
  setLink(t, 9, p, 'next', a, `(1) prev->next = new_node: node ${p} (data ${d(w, p)}) now points to the new node ${a}. Its old link to ${tp} is overwritten — but temp still remembers ${tp}, so nothing is lost.`);
  setLink(t, 10, a, 'next', tp, `(2) new_node->next = temp: the new node points to ${tp} (data ${d(w, tp)}). The chain is whole again.`);
  delete w.locals;
  return endScope(t, ['new_node', 'temp', 'prev']);
}

export function deleteBeg(world) {
  const t = new Tracer(world, SLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, `head == NULL? head = ${fmtPtr(w.vars.head)}`, { vars: ['head'] })) {
    t.output.push('No nodes exist');
    t.fail(1, 'Underflow: the list is empty, nothing to delete.');
    return endScope(t, []);
  }
  setVar(t, 3, 'temp', w.vars.head, `temp = head (${w.vars.head}): save the first node so that it can be freed after unlinking.`);
  const nx = w.nodes[w.vars.temp].next;
  setVar(t, 4, 'head', nx, nx === null ? `head = temp->next = NULL: the list becomes empty.` : `head = temp->next: head now points to ${nx} (data ${d(w, nx)}).`);
  freeStep(t, 5, 'temp');
  return endScope(t, ['temp']);
}

export function deleteEnd(world, { incorrectVersion = false } = {}) {
  const t = new Tracer(world, incorrectVersion ? SLL_CODE.deleteEndIncorrect : SLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, `head == NULL? head = ${fmtPtr(w.vars.head)}`, { vars: ['head'] })) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty, nothing to delete.');
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.head);
  addVar(w, 'prev', w.vars.head);
  t.count('varWrites', 2);
  t.step(1, 'var', `temp = prev = head (${w.vars.head}).`, { vars: ['temp', 'prev'] });
  while (true) {
    const tn = w.nodes[w.vars.temp];
    t.count('visits');
    if (!cond(t, 2, tn.next !== null, `temp->next != NULL? temp->next = ${fmtPtr(tn.next)}`, { nodes: [tn.addr] })) break;
    setVar(t, 3, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    t.count('moves');
    setVar(t, 4, 'temp', tn.next, `temp = temp->next → ${tn.next} (data ${d(w, tn.next)}).`);
  }
  if (incorrectVersion) {
    setLink(t, 6, w.vars.prev, 'next', null, w.vars.prev === w.vars.temp
      ? `prev->next = NULL, but prev and temp are the SAME node (the only node), so this only changes the node that is about to be freed.`
      : `prev->next = NULL: node ${w.vars.prev} becomes the new last node.`);
    const wasOnly = w.vars.head === w.vars.temp;
    freeStep(t, 7, 'temp', wasOnly
      ? `free(temp) releases ${w.vars.temp}. BUG: head still holds ${w.vars.head}, the address of freed memory: head is now a DANGLING pointer. A one-node list needs "head = NULL".`
      : undefined);
    return endScope(t, ['temp', 'prev']);
  }
  if (cond(t, 6, w.vars.temp === w.vars.head, `temp == head? (was this the only node?)`, { vars: ['temp', 'head'] })) {
    setVar(t, 7, 'head', null, `head = NULL: the list becomes empty. Without this line head would dangle.`);
  } else {
    setLink(t, 9, w.vars.prev, 'next', null, `prev->next = NULL: node ${w.vars.prev} (data ${d(w, w.vars.prev)}) is the new last node.`);
  }
  freeStep(t, 10, 'temp');
  return endScope(t, ['temp', 'prev']);
}

export function deleteMid(world, pos) {
  const t = new Tracer(world, SLL_CODE.deleteMid);
  const w = t.state;
  if (cond(t, 0, w.vars.head === null, `head == NULL?`, { vars: ['head'] })) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  const node_count = countSilently(t, 1);
  w.locals = { node_count, pos };
  t.step(1, 'call', `node_count = count_nodes(head) = ${node_count}.`);
  if (!cond(t, 2, pos > 1 && pos < node_count, `pos > 1 && pos < node_count with pos = ${pos}, node_count = ${node_count}`)) {
    t.output.push('Invalid position');
    delete w.locals;
    t.fail(12, `Position ${pos} is not an intermediate position (valid: 2..${node_count - 1}). Use delete at beginning or delete at end instead.`);
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.head);
  addVar(w, 'prev', w.vars.head);
  let i = 1;
  w.locals.i = i;
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = head (${w.vars.head}); i = 1.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, i < pos, `i < pos? ${i} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    const nx = w.nodes[w.vars.temp].next;
    t.count('moves');
    setVar(t, 6, 'temp', nx, `temp = temp->next → ${nx} (data ${d(w, nx)}).`);
    i++;
    w.locals.i = i;
    t.step(7, 'var', `i++ → ${i}.`);
  }
  const after = w.nodes[w.vars.temp].next;
  setLink(t, 9, w.vars.prev, 'next', after, `prev->next = temp->next: node ${w.vars.prev} (data ${d(w, w.vars.prev)}) now skips over ${w.vars.temp} and points to ${fmtPtr(after)}. temp still holds the removed node, so it can be freed.`);
  freeStep(t, 10, 'temp');
  delete w.locals;
  return endScope(t, ['temp', 'prev']);
}

export function traverse(world) {
  const t = new Tracer(world, SLL_CODE.traverse);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.head, `temp = head (${fmtPtr(w.vars.head)}).`);
  if (cond(t, 1, w.vars.head === null, 'head == NULL?')) {
    t.output.push('Empty list');
    t.step(1, 'output', 'Prints "Empty list".');
    return endScope(t, ['temp']);
  }
  while (cond(t, 2, w.vars.temp !== null, `temp != NULL? temp = ${fmtPtr(w.vars.temp)}`, { vars: ['temp'] })) {
    const n = w.nodes[w.vars.temp];
    t.count('visits');
    t.output.push(n.data);
    t.step(3, 'output', `printf temp->data: prints ${n.data} (the value stored at address ${n.addr}).`, { nodes: [n.addr], visit: n.addr });
    t.count('moves');
    setVar(t, 4, 'temp', n.next, `temp = temp->next → ${fmtPtr(n.next)}.`);
  }
  return endScope(t, ['temp'], `Done. Output: ${t.output.join(' ')}`);
}

export function createList(values, { detail = false } = {}) {
  const w0 = buildList('sll', []);
  const t = new Tracer(w0, SLL_CODE.createList);
  const w = t.state;
  for (let i = 0; i < values.length; i++) {
    cond(t, 0, true, `i < n? ${i} < ${values.length}`);
    const a = getnodeSteps(t, 1, values[i], { detail });
    if (cond(t, 2, w.vars.head === null, 'head == NULL?')) {
      setVar(t, 3, 'head', a, `head = new_node (${a}).`);
    } else {
      setVar(t, 5, 'temp', w.vars.head, `temp = head.`);
      while (true) {
        const tn = w.nodes[w.vars.temp];
        if (!cond(t, 6, tn.next !== null, `temp->next != NULL? (${fmtPtr(tn.next)})`)) break;
        t.count('moves');
        setVar(t, 7, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
      }
      setLink(t, 8, w.vars.temp, 'next', a, `temp->next = new_node: append ${values[i]}.`);
    }
  }
  cond(t, 0, false, `i < n? ${values.length} < ${values.length}`);
  return endScope(t, ['new_node', 'temp']);
}

export { buildList, rawGetnode };
