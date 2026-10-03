// Singly linked list algorithms (Lectures 08 and 09), traced step by step.
// Code lines follow the notes' C style; corrections are marked in comments.
import { Tracer } from './trace.js';
import { addVar, fmtPtr, walk, buildList, getnode as rawGetnode } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const SLL_CODE = {
  insertBeg: {
    title: 'insert_at_beg()',
    ref: 'Lec 08 p.4',
    lines: [
      'newnode = getnode();          // malloc, data, next = NULL',
      'if (start == NULL)',
      '    start = newnode;',
      'else {',
      '    newnode->next = start;    // (1) new node -> old first node',
      '    start = newnode;          // (2) start -> new node',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()',
    ref: 'Lec 08 p.5',
    lines: [
      'newnode = getnode();',
      'if (start == NULL)',
      '    start = newnode;',
      'else {',
      '    temp = start;',
      '    while (temp->next != NULL)',
      '        temp = temp->next;',
      '    temp->next = newnode;',
      '}',
    ],
  },
  insertEndTail: {
    title: 'insert_at_end() with a tail pointer',
    ref: 'Supplementary (compare with Lec 08 p.5)',
    lines: [
      'newnode = getnode();',
      'if (start == NULL)',
      '    start = tail = newnode;',
      'else {',
      '    tail->next = newnode;',
      '    tail = newnode;',
      '}',
    ],
  },
  insertMid: {
    title: 'insert_at_mid(pos)',
    ref: 'Lec 08 p.6–7',
    lines: [
      'nodectr = countnode(start);',
      'if (pos > 1 && pos <= nodectr) {   // corrected: notes use pos < nodectr',
      '    newnode = getnode();           // corrected: allocate only after validating',
      '    temp = prev = start;  ctr = 1;',
      '    while (ctr < pos) {',
      '        prev = temp;',
      '        temp = temp->next;',
      '        ctr++;',
      '    }',
      '    prev->next = newnode;          // (1)',
      '    newnode->next = temp;          // (2) safe: temp saved the rest',
      '} else',
      '    printf("position %d is not a middle position", pos);',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beg()',
    ref: 'Lec 09 p.1',
    lines: [
      'if (start == NULL) {',
      '    printf("No nodes exist"); return;',
      '}',
      'temp = start;',
      'start = temp->next;',
      'free(temp);',
    ],
  },
  deleteEnd: {
    title: 'delete_at_last()',
    ref: 'Lec 09 p.2 (with one-node correction)',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = prev = start;',
      'while (temp->next != NULL) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'if (temp == start)              // correction: only one node',
      '    start = NULL;',
      'else',
      '    prev->next = NULL;',
      'free(temp);',
    ],
  },
  deleteEndNotes: {
    title: 'delete_at_last() exactly as in the notes',
    ref: 'Lec 09 p.2',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = prev = start;',
      'while (temp->next != NULL) {',
      '    prev = temp;',
      '    temp = temp->next;',
      '}',
      'prev->next = NULL;',
      'free(temp);',
    ],
  },
  deleteEndTail: {
    title: 'delete_at_last() when a tail pointer exists',
    ref: 'Supplementary (complexity comparison)',
    lines: [
      'if (start == NULL) return;',
      'if (start == tail) { free(start); start = tail = NULL; return; }',
      'temp = start;',
      'while (temp->next != tail)      // still must FIND the node before tail',
      '    temp = temp->next;',
      'free(tail);',
      'tail = temp;',
      'tail->next = NULL;',
    ],
  },
  deleteMid: {
    title: 'delete_at_mid(pos)',
    ref: 'Lec 09 p.3–4',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'nodectr = countnode(start);',
      'if (pos > 1 && pos < nodectr) {',
      '    temp = prev = start;  ctr = 1;',
      '    while (ctr < pos) {',
      '        prev = temp;',
      '        temp = temp->next;',
      '        ctr++;',
      '    }',
      '    prev->next = temp->next;     // bypass the node',
      '    free(temp);                  // then release it',
      '} else',
      '    printf("Invalid position");',
    ],
  },
  traverse: {
    title: 'traverse()',
    ref: 'Lec 09 p.5',
    lines: [
      'temp = start;',
      'if (start == NULL) printf("Empty list");',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->next;',
      '}',
    ],
  },
  createList: {
    title: 'creatlist(n)',
    ref: 'Lec 08 p.3',
    lines: [
      'for (i = 0; i < n; i++) {',
      '    newnode = getnode();',
      '    if (start == NULL)',
      '        start = newnode;',
      '    else {',
      '        temp = start;',
      '        while (temp->next != NULL)',
      '            temp = temp->next;',
      '        temp->next = newnode;',
      '    }',
      '}',
    ],
  },
};

/** Count nodes silently (countnode is a helper call, shown as one step). */
function countSilently(t, line) {
  const w = t.state;
  const r = walk(w, w.vars.start);
  t.count('calls');
  t.count('moves', r.addrs.length);
  t.count('visits', r.addrs.length);
  return r.addrs.length;
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, `Is the list empty? start = ${fmtPtr(w.vars.start)}`, { vars: ['start'] })) {
    setVar(t, 2, 'start', a, `start = newnode: start now holds ${a}, the address of the only node.`);
  } else {
    const old = w.vars.start;
    setLink(t, 4, a, 'next', old, `(1) newnode->next = start: the new node (${a}) now points to the old first node (${old}, data ${d(w, old)}). Do this FIRST, while start still remembers the old first node.`);
    setVar(t, 5, 'start', a, `(2) start = newnode: start moves to ${a}. Nothing was lost because the new node already links to ${old}.`);
  }
  return endScope(t, ['newnode']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, `Is the list empty? start = ${fmtPtr(w.vars.start)}`, { vars: ['start'] })) {
    setVar(t, 2, 'start', a, `start = newnode (${a}).`);
  } else {
    setVar(t, 4, 'temp', w.vars.start, `temp = start: temp and start now refer to the SAME address (${w.vars.start}). Moving temp will not move start.`);
    while (true) {
      const tn = w.nodes[w.vars.temp];
      t.count('visits');
      if (!cond(t, 5, tn.next !== null, `temp->next != NULL? temp->next = ${fmtPtr(tn.next)}`, { nodes: [tn.addr], links: [{ from: tn.addr, field: 'next' }] })) break;
      t.count('moves');
      setVar(t, 6, 'temp', tn.next, `temp = temp->next: temp advances from ${tn.addr} to ${tn.next} (data ${d(w, tn.next)}).`);
    }
    setLink(t, 7, w.vars.temp, 'next', a, `temp->next = newnode: the last node (${w.vars.temp}) used to hold NULL; now it holds ${a}.`);
  }
  return endScope(t, ['newnode', 'temp']);
}

export function insertEndTail(world, value, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertEndTail);
  const w = t.state;
  if (!('tail' in w.vars)) {
    const r = walk(w, w.vars.start);
    addVar(w, 'tail', r.addrs.length ? r.addrs[r.addrs.length - 1] : null);
    w.globals = ['start', 'tail'];
    t.steps[0].state = JSON.parse(JSON.stringify(w));
  }
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, `Is the list empty? start = ${fmtPtr(w.vars.start)}`, { vars: ['start'] })) {
    w.vars.start = a;
    w.vars.tail = a;
    t.count('varWrites', 2);
    t.step(2, 'var', `start = tail = newnode (${a}).`, { vars: ['start', 'tail'] });
  } else {
    setLink(t, 4, w.vars.tail, 'next', a, `tail->next = newnode: no walking needed, tail already knows the last node (${w.vars.tail}).`);
    setVar(t, 5, 'tail', a, `tail = newnode (${a}).`);
  }
  return endScope(t, ['newnode']);
}

export function insertMid(world, value, pos, opts = {}) {
  const t = new Tracer(world, SLL_CODE.insertMid);
  const w = t.state;
  const nodectr = countSilently(t, 0);
  t.step(0, 'call', `countnode(start) walks the list and returns ${nodectr}. nodectr = ${nodectr}.`, {});
  t.state.locals = { nodectr, pos };
  if (!cond(t, 1, pos > 1 && pos <= nodectr, `pos > 1 && pos <= nodectr with pos = ${pos}, nodectr = ${nodectr}`)) {
    t.output.push(`position ${pos} is not a middle position`);
    t.fail(12, `Position ${pos} is not a middle position (valid: 2..${nodectr}). Use insert at beginning (pos 1) or at end (pos ${nodectr + 1}).`);
    delete t.state.locals;
    return endScope(t, ['newnode', 'temp', 'prev']);
  }
  const a = getnodeSteps(t, 2, value, opts);
  addVar(w, 'temp', w.vars.start);
  addVar(w, 'prev', w.vars.start);
  let ctr = 1;
  w.locals = { nodectr, pos, ctr };
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = start (${w.vars.start}); ctr = 1. Both helpers start at the first node.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, ctr < pos, `ctr < pos? ${ctr} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}). prev follows one node behind temp.`);
    const nx = w.nodes[w.vars.temp].next;
    t.count('moves');
    setVar(t, 6, 'temp', nx, `temp = temp->next → ${fmtPtr(nx)} (data ${d(w, nx)}).`);
    ctr++;
    w.locals.ctr = ctr;
    t.step(7, 'var', `ctr++ → ${ctr}.`);
  }
  const p = w.vars.prev;
  const tp = w.vars.temp;
  setLink(t, 9, p, 'next', a, `(1) prev->next = newnode: node ${p} (data ${d(w, p)}) now points to the new node ${a}. Its old link to ${tp} is overwritten — but temp still remembers ${tp}, so nothing is lost.`);
  setLink(t, 10, a, 'next', tp, `(2) newnode->next = temp: the new node points to ${tp} (data ${d(w, tp)}). The chain is whole again.`);
  delete w.locals;
  return endScope(t, ['newnode', 'temp', 'prev']);
}

export function deleteBeg(world) {
  const t = new Tracer(world, SLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, `start == NULL? start = ${fmtPtr(w.vars.start)}`, { vars: ['start'] })) {
    t.output.push('No nodes exist');
    t.fail(1, 'Underflow: the list is empty, nothing to delete.');
    return endScope(t, []);
  }
  setVar(t, 3, 'temp', w.vars.start, `temp = start (${w.vars.start}): save the first node so we can free it after unlinking.`);
  const nx = w.nodes[w.vars.temp].next;
  setVar(t, 4, 'start', nx, nx === null ? `start = temp->next = NULL: the list becomes empty.` : `start = temp->next: start now points to ${nx} (data ${d(w, nx)}).`);
  freeStep(t, 5, 'temp');
  return endScope(t, ['temp']);
}

export function deleteEnd(world, { notesVersion = false } = {}) {
  const t = new Tracer(world, notesVersion ? SLL_CODE.deleteEndNotes : SLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, `start == NULL? start = ${fmtPtr(w.vars.start)}`, { vars: ['start'] })) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty, nothing to delete.');
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.start);
  addVar(w, 'prev', w.vars.start);
  t.count('varWrites', 2);
  t.step(1, 'var', `temp = prev = start (${w.vars.start}).`, { vars: ['temp', 'prev'] });
  while (true) {
    const tn = w.nodes[w.vars.temp];
    t.count('visits');
    if (!cond(t, 2, tn.next !== null, `temp->next != NULL? temp->next = ${fmtPtr(tn.next)}`, { nodes: [tn.addr] })) break;
    setVar(t, 3, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    t.count('moves');
    setVar(t, 4, 'temp', tn.next, `temp = temp->next → ${tn.next} (data ${d(w, tn.next)}).`);
  }
  if (notesVersion) {
    setLink(t, 6, w.vars.prev, 'next', null, w.vars.prev === w.vars.temp
      ? `prev->next = NULL — but prev and temp are the SAME node (the only node), so this only changes the node we are about to free.`
      : `prev->next = NULL: node ${w.vars.prev} becomes the new last node.`);
    const wasOnly = w.vars.start === w.vars.temp;
    freeStep(t, 7, 'temp', wasOnly
      ? `free(temp) releases ${w.vars.temp}. BUG: start still holds ${w.vars.start}, the address of freed memory — start is now a DANGLING pointer. The notes need "start = NULL" for a one-node list.`
      : undefined);
    return endScope(t, ['temp', 'prev']);
  }
  if (cond(t, 6, w.vars.temp === w.vars.start, `temp == start? (was this the only node?)`, { vars: ['temp', 'start'] })) {
    setVar(t, 7, 'start', null, `start = NULL: the list becomes empty. Without this line start would dangle.`);
  } else {
    setLink(t, 9, w.vars.prev, 'next', null, `prev->next = NULL: node ${w.vars.prev} (data ${d(w, w.vars.prev)}) is the new last node.`);
  }
  freeStep(t, 10, 'temp');
  return endScope(t, ['temp', 'prev']);
}

export function deleteEndTail(world) {
  const t = new Tracer(world, SLL_CODE.deleteEndTail);
  const w = t.state;
  if (!('tail' in w.vars)) {
    const r = walk(w, w.vars.start);
    addVar(w, 'tail', r.addrs.length ? r.addrs[r.addrs.length - 1] : null);
    w.globals = ['start', 'tail'];
    t.steps[0].state = JSON.parse(JSON.stringify(w));
  }
  if (cond(t, 0, w.vars.start === null, `start == NULL?`)) {
    t.fail(0, 'Underflow: empty list.');
    return endScope(t, []);
  }
  if (cond(t, 1, w.vars.start === w.vars.tail, `start == tail? (only one node)`)) {
    addVar(w, 'temp', w.vars.start);
    freeStep(t, 1, 'temp', `free(start): the only node is released.`);
    w.vars.start = null;
    w.vars.tail = null;
    t.count('varWrites', 2);
    t.step(1, 'var', 'start = tail = NULL.', { vars: ['start', 'tail'] });
    return endScope(t, ['temp']);
  }
  setVar(t, 2, 'temp', w.vars.start, `temp = start. Even though tail is known, we need the node BEFORE tail, and singly linked nodes cannot point backwards.`);
  while (true) {
    const tn = w.nodes[w.vars.temp];
    t.count('visits');
    if (!cond(t, 3, tn.next !== w.vars.tail, `temp->next != tail? temp->next = ${fmtPtr(tn.next)}, tail = ${w.vars.tail}`)) break;
    t.count('moves');
    setVar(t, 4, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
  }
  addVar(w, 'old', w.vars.tail);
  freeStep(t, 5, 'old', `free(tail) releases ${w.vars.tail}.`);
  setVar(t, 6, 'tail', w.vars.temp, `tail = temp (${w.vars.temp}).`);
  setLink(t, 7, w.vars.tail, 'next', null, 'tail->next = NULL.');
  return endScope(t, ['temp', 'old']);
}

export function deleteMid(world, pos) {
  const t = new Tracer(world, SLL_CODE.deleteMid);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, `start == NULL?`, { vars: ['start'] })) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  const nodectr = countSilently(t, 1);
  w.locals = { nodectr, pos };
  t.step(1, 'call', `nodectr = countnode(start) = ${nodectr}.`);
  if (!cond(t, 2, pos > 1 && pos < nodectr, `pos > 1 && pos < nodectr with pos = ${pos}, nodectr = ${nodectr}`)) {
    t.output.push('Invalid position');
    delete w.locals;
    t.fail(12, `Position ${pos} is not an intermediate position (valid: 2..${nodectr - 1}). Use delete at beginning or delete at end instead.`);
    return endScope(t, []);
  }
  addVar(w, 'temp', w.vars.start);
  addVar(w, 'prev', w.vars.start);
  let ctr = 1;
  w.locals.ctr = ctr;
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = start (${w.vars.start}); ctr = 1.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, ctr < pos, `ctr < pos? ${ctr} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    const nx = w.nodes[w.vars.temp].next;
    t.count('moves');
    setVar(t, 6, 'temp', nx, `temp = temp->next → ${nx} (data ${d(w, nx)}).`);
    ctr++;
    w.locals.ctr = ctr;
    t.step(7, 'var', `ctr++ → ${ctr}.`);
  }
  const after = w.nodes[w.vars.temp].next;
  setLink(t, 9, w.vars.prev, 'next', after, `prev->next = temp->next: node ${w.vars.prev} (data ${d(w, w.vars.prev)}) now skips over ${w.vars.temp} and points to ${fmtPtr(after)}. temp still holds the removed node, so we can free it.`);
  freeStep(t, 10, 'temp');
  delete w.locals;
  return endScope(t, ['temp', 'prev']);
}

export function traverse(world) {
  const t = new Tracer(world, SLL_CODE.traverse);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.start, `temp = start (${fmtPtr(w.vars.start)}).`);
  if (cond(t, 1, w.vars.start === null, 'start == NULL?')) {
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
    if (cond(t, 2, w.vars.start === null, 'start == NULL?')) {
      setVar(t, 3, 'start', a, `start = newnode (${a}).`);
    } else {
      setVar(t, 5, 'temp', w.vars.start, `temp = start.`);
      while (true) {
        const tn = w.nodes[w.vars.temp];
        if (!cond(t, 6, tn.next !== null, `temp->next != NULL? (${fmtPtr(tn.next)})`)) break;
        t.count('moves');
        setVar(t, 7, 'temp', tn.next, `temp = temp->next → ${tn.next}.`);
      }
      setLink(t, 8, w.vars.temp, 'next', a, `temp->next = newnode: append ${values[i]}.`);
    }
  }
  cond(t, 0, false, `i < n? ${values.length} < ${values.length}`);
  return endScope(t, ['newnode', 'temp']);
}

/** Exact count of `temp = temp->next` executions in creatlist(n). */
export function creatlistMoves(n) {
  // inserting the i-th node (1-based) walks over i-2 links when i >= 2
  let s = 0;
  for (let i = 2; i <= n; i++) s += i - 2;
  return s; // = (n-1)(n-2)/2
}

export { buildList, rawGetnode };
