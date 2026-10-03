// Binary trees (Lectures 13 and 14). Node ids are their labels (unique).
import { Tracer } from './trace.js';

export function emptyTree() {
  return { type: 'tree', nodes: {}, root: null };
}

/** spec: { A: ['B','C'], B: ['D', null] } – first key with no parent is the root. */
export function fromSpec(spec, root) {
  const t = emptyTree();
  const all = new Set();
  for (const [p, [l, r]] of Object.entries(spec)) {
    all.add(p);
    if (l != null) all.add(l);
    if (r != null) all.add(r);
  }
  for (const id of all) t.nodes[id] = { id, left: null, right: null };
  const hasParent = new Set();
  for (const [p, [l, r]] of Object.entries(spec)) {
    if (l != null) {
      t.nodes[p].left = l;
      hasParent.add(l);
    }
    if (r != null) {
      t.nodes[p].right = r;
      hasParent.add(r);
    }
  }
  t.root = root || [...all].find((id) => !hasParent.has(id)) || null;
  return t;
}

export const LECTURE_TREE = () => fromSpec({ A: ['B', 'C'], B: ['D', 'E'], C: ['F', 'G'] }, 'A');

export function clone(t) {
  return JSON.parse(JSON.stringify(t));
}

export function ids(t) {
  return Object.keys(t.nodes);
}
export function size(t) {
  return ids(t).length;
}

export function addChild(t, parent, side, id) {
  if (t.nodes[id]) throw new Error(`Label ${id} already used`);
  if (parent == null) {
    if (t.root) throw new Error('Tree already has a root');
    t.nodes[id] = { id, left: null, right: null };
    t.root = id;
    return;
  }
  const p = t.nodes[parent];
  if (!p) throw new Error(`No node ${parent}`);
  if (p[side]) throw new Error(`${parent} already has a ${side} child`);
  t.nodes[id] = { id, left: null, right: null };
  p[side] = id;
}

/** Remove a node and its whole subtree. */
export function removeSubtree(t, id) {
  const ds = [id, ...descendants(t, id)];
  const p = parentOf(t, id);
  if (p) {
    if (t.nodes[p].left === id) t.nodes[p].left = null;
    else t.nodes[p].right = null;
  } else t.root = null;
  for (const x of ds) delete t.nodes[x];
}

export function children(t, id) {
  const n = t.nodes[id];
  return [n.left, n.right].filter((c) => c != null);
}

export function parentOf(t, id) {
  for (const n of Object.values(t.nodes)) if (n.left === id || n.right === id) return n.id;
  return null;
}

export function siblings(t, id) {
  const p = parentOf(t, id);
  if (!p) return [];
  return children(t, p).filter((c) => c !== id);
}

export function ancestors(t, id) {
  const out = [];
  let p = parentOf(t, id);
  while (p) {
    out.push(p);
    p = parentOf(t, p);
  }
  return out; // nearest first
}

export function descendants(t, id) {
  const out = [];
  const st = [...children(t, id)];
  while (st.length) {
    const x = st.shift();
    out.push(x);
    st.push(...children(t, x));
  }
  return out;
}

export function subtree(t, id) {
  return [id, ...descendants(t, id)];
}

export function pathFromRoot(t, id) {
  return [...ancestors(t, id).reverse(), id];
}

/** Level = number of EDGES from the root (root = level 0), as in the notes. */
export function level(t, id) {
  return ancestors(t, id).length;
}

/** The notes' depth = number of NODES on the root→node path = level + 1. */
export function depthNotes(t, id) {
  return level(t, id) + 1;
}

/** Height = maximum level (edges). Empty tree → -1, single node → 0. */
export function height(t) {
  if (!t.root) return -1;
  return Math.max(...ids(t).map((x) => level(t, x)));
}

export function leaves(t) {
  return ids(t).filter((x) => children(t, x).length === 0);
}
export function internal(t) {
  return ids(t).filter((x) => children(t, x).length > 0);
}

export function nodesAtLevel(t, l) {
  return ids(t).filter((x) => level(t, x) === l);
}

/** Notes' "strictly binary": every non-leaf has exactly 2 children. (Many books: "full" or "proper".) */
export function isStrict(t) {
  if (!t.root) return true;
  return ids(t).every((x) => children(t, x).length !== 1);
}

/** Notes' "full binary tree of height h": all leaves on level h, internal nodes have 2 children. (Many books: "perfect".) */
export function isPerfect(t) {
  if (!t.root) return true;
  const h = height(t);
  return isStrict(t) && leaves(t).every((x) => level(t, x) === h);
}

/** Level-order numbering (1-based): root 1, children of k are 2k and 2k+1. */
export function numbering(t) {
  const num = {};
  if (!t.root) return num;
  const q = [[t.root, 1]];
  while (q.length) {
    const [x, k] = q.shift();
    num[x] = k;
    const n = t.nodes[x];
    if (n.left) q.push([n.left, 2 * k]);
    if (n.right) q.push([n.right, 2 * k + 1]);
  }
  return num;
}

/** Complete: the n nodes occupy exactly numbers 1..n of the numbering scheme (Lec 13 p.4). */
export function isComplete(t) {
  const num = numbering(t);
  const ks = Object.values(num);
  const n = ks.length;
  return ks.every((k) => k <= n);
}

export function classify(t) {
  return { strict: isStrict(t), perfect: isPerfect(t), complete: isComplete(t) };
}

/** Array representation. base 0: children of i at 2i+1, 2i+2 (Lec 13 p.5 picture). base 1: 2i, 2i+1. */
export function toArray(t, base = 0) {
  const num = numbering(t);
  const max = Math.max(0, ...Object.values(num));
  const arr = Array(max).fill(null);
  for (const [x, k] of Object.entries(num)) arr[k - 1] = x;
  if (base === 1) return [null, ...arr];
  return arr;
}

export function fromArray(arr, base = 0) {
  const a = base === 1 ? arr.slice(1) : arr;
  const t = emptyTree();
  a.forEach((x, i) => {
    if (x != null) t.nodes[x] = { id: x, left: null, right: null };
  });
  a.forEach((x, i) => {
    if (x == null) return;
    const l = a[2 * i + 1];
    const r = a[2 * i + 2];
    if (l != null) t.nodes[x].left = l;
    if (r != null) t.nodes[x].right = r;
  });
  t.root = a[0] != null ? a[0] : null;
  return t;
}

export function arrayIndexOf(t, id, base = 0) {
  return numbering(t)[id] - (base === 0 ? 1 : 0);
}

// ---------------------------------------------------------------- formulas (Lec 13 p.3)
export const maxNodesOfHeight = (h) => 2 ** (h + 1) - 1;
export const maxLeavesOfHeight = (h) => 2 ** h;
export const maxNodesAtLevel = (l) => 2 ** l;
export const minHeightForNodes = (n) => Math.ceil(Math.log2(n + 1)) - 1;
export const edgesOfTree = (n) => Math.max(0, n - 1);

// ---------------------------------------------------------------- traversals
export function preorder(t, id = t.root, out = []) {
  if (id == null) return out;
  out.push(id);
  preorder(t, t.nodes[id].left, out);
  preorder(t, t.nodes[id].right, out);
  return out;
}
export function inorder(t, id = t.root, out = []) {
  if (id == null) return out;
  inorder(t, t.nodes[id].left, out);
  out.push(id);
  inorder(t, t.nodes[id].right, out);
  return out;
}
export function postorder(t, id = t.root, out = []) {
  if (id == null) return out;
  postorder(t, t.nodes[id].left, out);
  postorder(t, t.nodes[id].right, out);
  out.push(id);
  return out;
}
export function levelorder(t) {
  const out = [];
  if (!t.root) return out;
  const q = [t.root];
  while (q.length) {
    const x = q.shift();
    out.push(x);
    q.push(...children(t, x));
  }
  return out;
}

export const ORDER_FNS = { preorder, inorder, postorder, levelorder };

export const TRAV_CODE = {
  preorder: { title: 'preorder(node)  (Root, Left, Right)', ref: 'Lec 14 p.1', lines: ['void preorder(node *root) {', '    if (root == NULL) return;', '    visit(root);            // output FIRST', '    preorder(root->left);', '    preorder(root->right);', '}'] },
  inorder: { title: 'inorder(node)  (Left, Root, Right)', ref: 'Lec 14 p.1', lines: ['void inorder(node *root) {', '    if (root == NULL) return;', '    inorder(root->left);', '    visit(root);            // output BETWEEN the subtrees', '    inorder(root->right);', '}'] },
  postorder: { title: 'postorder(node)  (Left, Right, Root)', ref: 'Lec 14 p.2', lines: ['void postorder(node *root) {', '    if (root == NULL) return;', '    postorder(root->left);', '    postorder(root->right);', '    visit(root);            // output LAST', '}'] },
  inorderStack: {
    title: 'inorder with an explicit stack',
    ref: 'Lec 14 p.1 (stack pictures)',
    lines: ['cur = root;', 'while (cur != NULL || !isEmpty(S)) {', '    while (cur != NULL) {     // go as far left as possible', '        push(S, cur);', '        cur = cur->left;', '    }', '    cur = pop(S);', '    visit(cur);', '    cur = cur->right;', '}'],
  },
};

const VISIT_LINE = { preorder: 2, inorder: 3, postorder: 4 };

/** Recursive traversal trace showing when each node is ENTERED and when it is OUTPUT. */
export function traceTraversal(tree, order) {
  const st = { type: 'tree', tree: clone(tree), callStack: [], entered: [], output: [], current: null, nullCall: null };
  const t = new Tracer(st, TRAV_CODE[order]);
  const s = t.state;
  const lines = { preorder: [3, 4], inorder: [2, 4], postorder: [2, 3] }[order];
  function rec(id, via) {
    t.count('calls');
    if (id == null) {
      s.nullCall = via;
      t.step(1, 'check', `${via ? via + ': ' : ''}call with NULL → return immediately (base case).`, {});
      s.nullCall = null;
      return;
    }
    s.callStack.push(id);
    s.current = id;
    s.entered.push(id);
    t.step(0, 'enter', `ENTER ${id}. Frame pushed: call stack = [${s.callStack.join(', ')}].`, { node: id, enter: id });
    const visit = () => {
      s.current = id;
      s.output.push(id);
      t.output.push(id);
      t.count('visits');
      t.step(VISIT_LINE[order], 'output', `OUTPUT ${id}. Output so far: ${s.output.join(' ')}.`, { node: id, visit: id });
    };
    if (order === 'preorder') visit();
    s.current = id;
    t.step(lines[0], 'recurse', `${id}: go to the LEFT child (${tree.nodes[id].left ?? 'NULL'}).`, { node: id });
    rec(tree.nodes[id].left, `${id}->left`);
    s.current = id;
    if (order === 'inorder') visit();
    t.step(order === 'inorder' ? 4 : lines[1], 'recurse', `${id}: go to the RIGHT child (${tree.nodes[id].right ?? 'NULL'}).`, { node: id });
    rec(tree.nodes[id].right, `${id}->right`);
    s.current = id;
    if (order === 'postorder') visit();
    s.callStack.pop();
    t.step(5, 'return', `LEAVE ${id} (backtrack). Call stack = [${s.callStack.join(', ')}].`, { node: id });
    s.current = s.callStack[s.callStack.length - 1] ?? null;
  }
  rec(tree.root, null);
  return t.finish(`${order}: ${s.output.join(' ')}`, s.output);
}

/** Inorder using an explicit stack, as in the stack pictures of Lec 14 p.1. */
export function traceInorderStack(tree) {
  const st = { type: 'tree', tree: clone(tree), stack: [], output: [], current: tree.root, cur: tree.root };
  const t = new Tracer(st, TRAV_CODE.inorderStack);
  const s = t.state;
  t.step(0, 'var', `cur = root (${s.cur ?? 'NULL'}).`, { node: s.cur });
  while (true) {
    t.count('comparisons');
    if (!(s.cur != null || s.stack.length)) {
      t.step(1, 'check', 'cur is NULL and the stack is empty → stop.');
      break;
    }
    t.step(1, 'check', `cur = ${s.cur ?? 'NULL'}, stack size ${s.stack.length} → continue.`);
    while (s.cur != null) {
      s.stack.push(s.cur);
      t.step(3, 'push', `push ${s.cur}. Stack (bottom→top): [${s.stack.join(', ')}].`, { node: s.cur });
      s.cur = tree.nodes[s.cur].left;
      s.current = s.cur;
      t.step(4, 'var', `cur = cur->left → ${s.cur ?? 'NULL'}.`, { node: s.cur });
    }
    s.cur = s.stack.pop();
    s.current = s.cur;
    t.step(6, 'pop', `pop → ${s.cur}. Stack: [${s.stack.join(', ')}].`, { node: s.cur });
    s.output.push(s.cur);
    t.output.push(s.cur);
    t.step(7, 'output', `OUTPUT ${s.cur}. Output: ${s.output.join(' ')}.`, { node: s.cur, visit: s.cur });
    s.cur = tree.nodes[s.cur].right;
    s.current = s.cur;
    t.step(8, 'var', `cur = cur->right → ${s.cur ?? 'NULL'}.`, { node: s.cur });
  }
  return t.finish(`inorder: ${s.output.join(' ')}`, s.output);
}

// ---------------------------------------------------------------- random trees
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Random binary tree with n nodes. shape: 'any' | 'perfect' | 'complete' | 'strict' | 'skewed' */
export function randomTree(rng, n, shape = 'any', labels) {
  const lab = labels || LETTERS.split('');
  if (shape === 'perfect') {
    const h = Math.max(0, Math.round(Math.log2(n + 1)) - 1);
    return completeOf(lab, 2 ** (h + 1) - 1);
  }
  if (shape === 'complete') return completeOf(lab, n);
  const t = emptyTree();
  if (n <= 0) return t;
  t.nodes[lab[0]] = { id: lab[0], left: null, right: null };
  t.root = lab[0];
  let made = 1;
  if (shape === 'skewed') {
    let cur = lab[0];
    const side = rng.pick(['left', 'right', 'zig']);
    while (made < n) {
      const s = side === 'zig' ? (made % 2 ? 'left' : 'right') : side;
      addChild(t, cur, s, lab[made]);
      cur = lab[made];
      made++;
    }
    return t;
  }
  if (shape === 'strict') {
    // grow by giving a leaf two children at once
    const target = n % 2 === 0 ? n + 1 : n;
    while (made < target) {
      const ls = leaves(t);
      const p = rng.pick(ls);
      addChild(t, p, 'left', lab[made++]);
      addChild(t, p, 'right', lab[made++]);
    }
    return t;
  }
  let guard = 0;
  while (made < n && guard++ < 1000) {
    const cand = ids(t).filter((x) => children(t, x).length < 2 && level(t, x) < 4);
    const p = rng.pick(cand.length ? cand : ids(t).filter((x) => children(t, x).length < 2));
    const free = ['left', 'right'].filter((s) => !t.nodes[p][s]);
    addChild(t, p, rng.pick(free), lab[made++]);
  }
  return t;
}

function completeOf(lab, n) {
  const arr = lab.slice(0, n);
  return fromArray(arr, 0);
}

/** Tidy layout: x by inorder position, y by level. Returns {id:{x,y}} in unit coordinates. */
export function layout(t) {
  const pos = {};
  const io = inorder(t);
  io.forEach((id, i) => {
    pos[id] = { x: i, y: level(t, id) };
  });
  return { pos, width: io.length, height: height(t) + 1 };
}
