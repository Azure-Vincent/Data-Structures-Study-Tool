// Doubly linked list algorithms (Lecture 10). The notes call the links
// "left" (previous) and "right" (next).
import { Tracer } from './trace.js';
import { addVar, fmtPtr, walk } from './pointerWorld.js';
import { getnodeSteps, setVar, setLink, freeStep, cond, endScope, d } from './listCommon.js';

export const DLL_CODE = {
  insertBeg: {
    title: 'insert_at_beg()  (doubly linked)',
    ref: 'Lec 10 p.3',
    lines: [
      'newnode = getnode();            // left = right = NULL',
      'if (start == NULL)',
      '    start = newnode;',
      'else {',
      '    newnode->right = start;     // (1)',
      '    start->left = newnode;      // (2)',
      '    start = newnode;            // (3)',
      '}',
    ],
  },
  insertEnd: {
    title: 'insert_at_end()  (doubly linked)',
    ref: 'Lec 10 p.3',
    lines: [
      'newnode = getnode();',
      'if (start == NULL)',
      '    start = newnode;',
      'else {',
      '    temp = start;',
      '    while (temp->right != NULL)',
      '        temp = temp->right;',
      '    temp->right = newnode;      // (1)',
      '    newnode->left = temp;       // (2)',
      '}',
    ],
  },
  insertMid: {
    title: 'insert_at_mid(pos)  (doubly linked)',
    ref: 'Lec 10 p.4',
    lines: [
      'nodectr = countnode(start);',
      'if (pos > 1 && pos <= nodectr) {',
      '    newnode = getnode();',
      '    temp = prev = start;  ctr = 1;',
      '    while (ctr < pos) {',
      '        prev = temp;',
      '        temp = temp->right;',
      '        ctr++;',
      '    }',
      '    newnode->left = prev;       // (1)',
      '    newnode->right = temp;      // (2)',
      '    prev->right = newnode;      // (3)',
      '    temp->left = newnode;       // (4)',
      '} else',
      '    printf("position %d is not a middle position", pos);',
    ],
  },
  deleteBeg: {
    title: 'delete_at_beg()  (doubly linked)',
    ref: 'Lec 10 p.5 (with one-node correction)',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = start;                   // (1)',
      'start = temp->right;            // (2)',
      'if (start != NULL)              // correction: list may now be empty',
      '    start->left = NULL;         // (3)',
      'free(temp);                     // (4)',
    ],
  },
  deleteBegNotes: {
    title: 'delete_at_beg() exactly as in the notes',
    ref: 'Lec 10 p.5',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = start;                   // (1)',
      'start = temp->right;            // (2)',
      'start->left = NULL;             // (3)',
      'free(temp);                     // (4)',
    ],
  },
  deleteEnd: {
    title: 'delete_at_end()  (doubly linked)',
    ref: 'Lec 10 p.5 (with one-node correction)',
    lines: [
      'if (start == NULL) { printf("Empty list"); return; }',
      'temp = start;',
      'while (temp->right != NULL)',
      '    temp = temp->right;',
      'if (temp->left == NULL)         // correction: only one node',
      '    start = NULL;',
      'else',
      '    temp->left->right = NULL;',
      'free(temp);',
    ],
  },
  deleteMid: {
    title: 'delete_at_mid(pos)  (doubly linked)',
    ref: 'Lec 10 p.6',
    lines: [
      'nodectr = countnode(start);',
      'if (pos > 1 && pos < nodectr) {',
      '    temp = start;  i = 1;',
      '    while (i < pos) {',
      '        temp = temp->right;',
      '        i++;',
      '    }',
      '    temp->right->left = temp->left;   // (1)',
      '    temp->left->right = temp->right;  // (2)',
      '    free(temp);',
      '} else',
      '    printf("Invalid position");',
    ],
  },
  traverseFwd: {
    title: 'traverse left → right',
    ref: 'Lec 10 p.7',
    lines: [
      'temp = start;',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->right;',
      '}',
    ],
  },
  traverseBwd: {
    title: 'traverse right → left',
    ref: 'Supplementary (uses the left links from Lec 10)',
    lines: [
      'temp = start;',
      'if (temp == NULL) return;',
      'while (temp->right != NULL)    // first go to the last node',
      '    temp = temp->right;',
      'while (temp != NULL) {',
      '    printf("%d ", temp->data);',
      '    temp = temp->left;',
      '}',
    ],
  },
  countnode: {
    title: 'countnode(start)  (recursive)',
    ref: 'Lec 10 p.7',
    lines: [
      'int countnode(node *start) {',
      '    if (start == NULL)',
      '        return 0;',
      '    else',
      '        return 1 + countnode(start->right);',
      '}',
    ],
  },
};

function countSilently(t) {
  const r = walk(t.state, t.state.vars.start, 'right');
  t.count('calls');
  t.count('moves', r.addrs.length);
  return r.addrs.length;
}

export function insertBeg(world, value, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertBeg);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, `start == NULL? start = ${fmtPtr(w.vars.start)}`)) {
    setVar(t, 2, 'start', a, `start = newnode (${a}).`);
  } else {
    const old = w.vars.start;
    setLink(t, 4, a, 'right', old, `(1) newnode->right = start: forward link from the new node (${a}) to the old first node (${old}).`);
    setLink(t, 5, old, 'left', a, `(2) start->left = newnode: BACKWARD link from ${old} to the new node. Forgetting this leaves ${old}'s left = NULL, so walking backwards would stop early.`);
    setVar(t, 6, 'start', a, `(3) start = newnode (${a}).`);
  }
  return endScope(t, ['newnode']);
}

export function insertEnd(world, value, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertEnd);
  const w = t.state;
  const a = getnodeSteps(t, 0, value, opts);
  if (cond(t, 1, w.vars.start === null, `start == NULL?`)) {
    setVar(t, 2, 'start', a, `start = newnode (${a}).`);
  } else {
    setVar(t, 4, 'temp', w.vars.start, `temp = start.`);
    while (true) {
      const tn = w.nodes[w.vars.temp];
      t.count('visits');
      if (!cond(t, 5, tn.right !== null, `temp->right != NULL? (${fmtPtr(tn.right)})`, { nodes: [tn.addr] })) break;
      t.count('moves');
      setVar(t, 6, 'temp', tn.right, `temp = temp->right → ${tn.right}.`);
    }
    setLink(t, 7, w.vars.temp, 'right', a, `(1) temp->right = newnode: forward link ${w.vars.temp} → ${a}.`);
    setLink(t, 8, a, 'left', w.vars.temp, `(2) newnode->left = temp: backward link ${a} → ${w.vars.temp}.`);
  }
  return endScope(t, ['newnode', 'temp']);
}

export function insertMid(world, value, pos, opts = {}) {
  const t = new Tracer(world, DLL_CODE.insertMid);
  const w = t.state;
  const nodectr = countSilently(t);
  w.locals = { nodectr, pos };
  t.step(0, 'call', `nodectr = countnode(start) = ${nodectr}.`);
  if (!cond(t, 1, pos > 1 && pos <= nodectr, `pos > 1 && pos <= nodectr with pos = ${pos}, nodectr = ${nodectr}`)) {
    t.output.push(`position ${pos} is not a middle position`);
    delete w.locals;
    t.fail(14, `Position ${pos} is not a middle position (valid: 2..${nodectr}).`);
    return endScope(t, []);
  }
  const a = getnodeSteps(t, 2, value, opts);
  addVar(w, 'temp', w.vars.start);
  addVar(w, 'prev', w.vars.start);
  let ctr = 1;
  w.locals.ctr = 1;
  t.count('varWrites', 2);
  t.step(3, 'var', `temp = prev = start; ctr = 1.`, { vars: ['temp', 'prev'] });
  while (cond(t, 4, ctr < pos, `ctr < pos? ${ctr} < ${pos}`)) {
    setVar(t, 5, 'prev', w.vars.temp, `prev = temp (${w.vars.temp}).`);
    t.count('moves');
    setVar(t, 6, 'temp', w.nodes[w.vars.temp].right, `temp = temp->right → ${w.nodes[w.vars.temp].right}.`);
    ctr++;
    w.locals.ctr = ctr;
    t.step(7, 'var', `ctr++ → ${ctr}.`);
  }
  const p = w.vars.prev;
  const q = w.vars.temp;
  setLink(t, 9, a, 'left', p, `(1) newnode->left = prev: new node points back to ${p} (data ${d(w, p)}).`);
  setLink(t, 10, a, 'right', q, `(2) newnode->right = temp: new node points forward to ${q} (data ${d(w, q)}).`);
  setLink(t, 11, p, 'right', a, `(3) prev->right = newnode: ${p} now points forward to the new node.`);
  setLink(t, 12, q, 'left', a, `(4) temp->left = newnode: ${q} now points back to the new node. All four links agree.`);
  delete w.locals;
  return endScope(t, ['newnode', 'temp', 'prev']);
}

export function deleteBeg(world, { notesVersion = false } = {}) {
  const t = new Tracer(world, notesVersion ? DLL_CODE.deleteBegNotes : DLL_CODE.deleteBeg);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, 'start == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.start, `(1) temp = start (${w.vars.start}).`);
  const nx = w.nodes[w.vars.temp].right;
  setVar(t, 2, 'start', nx, `(2) start = temp->right → ${fmtPtr(nx)}.`);
  if (notesVersion) {
    if (w.vars.start === null) {
      t.fail(3, 'CRASH: start is NULL (we just removed the only node), so start->left dereferences NULL — segmentation fault. The notes need a check "if (start != NULL)".');
      return t.finish('Program would crash here.');
    }
    setLink(t, 3, w.vars.start, 'left', null, `(3) start->left = NULL: the new first node has no previous node.`);
    freeStep(t, 4, 'temp');
    return endScope(t, ['temp']);
  }
  if (cond(t, 3, w.vars.start !== null, 'start != NULL? (is anything left?)')) {
    setLink(t, 4, w.vars.start, 'left', null, `(3) start->left = NULL: the new first node no longer points back to the node being removed.`);
  }
  freeStep(t, 5, 'temp');
  return endScope(t, ['temp']);
}

export function deleteEnd(world) {
  const t = new Tracer(world, DLL_CODE.deleteEnd);
  const w = t.state;
  if (cond(t, 0, w.vars.start === null, 'start == NULL?')) {
    t.output.push('Empty list');
    t.fail(0, 'Underflow: the list is empty.');
    return endScope(t, []);
  }
  setVar(t, 1, 'temp', w.vars.start, `temp = start.`);
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.right !== null, `temp->right != NULL? (${fmtPtr(tn.right)})`)) break;
    t.count('moves');
    setVar(t, 3, 'temp', tn.right, `temp = temp->right → ${tn.right}.`);
  }
  const tn = w.nodes[w.vars.temp];
  if (cond(t, 4, tn.left === null, `temp->left == NULL? (only one node)`)) {
    setVar(t, 5, 'start', null, 'start = NULL: the list is now empty.');
  } else {
    setLink(t, 7, tn.left, 'right', null, `temp->left->right = NULL: node ${tn.left} (data ${d(w, tn.left)}) becomes the last node.`);
  }
  freeStep(t, 8, 'temp');
  return endScope(t, ['temp']);
}

export function deleteMid(world, pos) {
  const t = new Tracer(world, DLL_CODE.deleteMid);
  const w = t.state;
  const nodectr = countSilently(t);
  w.locals = { nodectr, pos };
  t.step(0, 'call', `nodectr = countnode(start) = ${nodectr}.`);
  if (!cond(t, 1, pos > 1 && pos < nodectr, `pos > 1 && pos < nodectr with pos = ${pos}, nodectr = ${nodectr}`)) {
    t.output.push('Invalid position');
    delete w.locals;
    t.fail(11, `Position ${pos} is not an intermediate position (valid: 2..${nodectr - 1}).`);
    return endScope(t, []);
  }
  setVar(t, 2, 'temp', w.vars.start, `temp = start; i = 1.`);
  let i = 1;
  w.locals.i = 1;
  while (cond(t, 3, i < pos, `i < pos? ${i} < ${pos}`)) {
    t.count('moves');
    setVar(t, 4, 'temp', w.nodes[w.vars.temp].right, `temp = temp->right → ${w.nodes[w.vars.temp].right}.`);
    i++;
    w.locals.i = i;
    t.step(5, 'var', `i++ → ${i}.`);
  }
  const tn = w.nodes[w.vars.temp];
  setLink(t, 7, tn.right, 'left', tn.left, `(1) temp->right->left = temp->left: node ${tn.right} (data ${d(w, tn.right)}) now points BACK to ${tn.left}, skipping ${tn.addr}.`);
  setLink(t, 8, tn.left, 'right', tn.right, `(2) temp->left->right = temp->right: node ${tn.left} (data ${d(w, tn.left)}) now points FORWARD to ${tn.right}, skipping ${tn.addr}.`);
  freeStep(t, 9, 'temp');
  delete w.locals;
  return endScope(t, ['temp']);
}

export function traverseFwd(world) {
  const t = new Tracer(world, DLL_CODE.traverseFwd);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.start, `temp = start (${fmtPtr(w.vars.start)}).`);
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
    setVar(t, 3, 'temp', n.right, `temp = temp->right → ${fmtPtr(n.right)}.`);
  }
  return endScope(t, ['temp'], `Forward output: ${t.output.join(' ')}`);
}

export function traverseBwd(world) {
  const t = new Tracer(world, DLL_CODE.traverseBwd);
  const w = t.state;
  setVar(t, 0, 'temp', w.vars.start, `temp = start.`);
  if (cond(t, 1, w.vars.temp === null, 'temp == NULL?')) return endScope(t, ['temp']);
  while (true) {
    const tn = w.nodes[w.vars.temp];
    if (!cond(t, 2, tn.right !== null, `temp->right != NULL? (${fmtPtr(tn.right)})`)) break;
    t.count('moves');
    setVar(t, 3, 'temp', tn.right, `temp = temp->right → ${tn.right}.`);
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
    setVar(t, 6, 'temp', n.left, `temp = temp->left → ${fmtPtr(n.left)}.`);
  }
  return endScope(t, ['temp'], `Backward output: ${t.output.join(' ')}`);
}

/** Recursive countnode with a visible call stack (state.callStack). */
export function countnode(world) {
  const t = new Tracer(world, DLL_CODE.countnode);
  const w = t.state;
  w.callStack = [];
  function rec(addr, depth) {
    t.count('calls');
    w.callStack.push({ fn: 'countnode', arg: addr, ret: null });
    t.step(0, 'call', `Call countnode(${fmtPtr(addr)}) — depth ${depth}. A new frame is pushed on the call stack; its parameter "start" is a LOCAL copy holding ${fmtPtr(addr)}.`, { nodes: addr ? [addr] : [], frame: w.callStack.length - 1 });
    if (cond(t, 1, addr === null, `start == NULL? (frame ${depth}: ${fmtPtr(addr)})`)) {
      w.callStack[w.callStack.length - 1].ret = 0;
      t.step(2, 'return', `Base case: return 0. This frame is popped.`);
      w.callStack.pop();
      return 0;
    }
    t.count('visits');
    t.step(4, 'recurse', `Not NULL: we must compute 1 + countnode(start->right) = 1 + countnode(${fmtPtr(w.nodes[addr].right)}). This frame waits.`, { nodes: [addr] });
    const sub = rec(w.nodes[addr].right, depth + 1);
    const r = 1 + sub;
    w.callStack[w.callStack.length - 1].ret = r;
    t.step(4, 'return', `Back in frame ${depth} (node ${addr}, data ${d(w, addr)}): the inner call returned ${sub}, so return 1 + ${sub} = ${r}.`, { nodes: [addr] });
    w.callStack.pop();
    return r;
  }
  const n = rec(w.vars.start, 0);
  t.output.push(n);
  delete w.callStack;
  return t.finish(`countnode returns ${n}. Maximum call-stack depth was ${n + 1} frames (one per node plus the NULL call).`, n);
}
