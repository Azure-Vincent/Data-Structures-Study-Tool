// Lecture 13 — Trees and graphs: terminology, properties, representations.
import { opts, multi, numeric, nodePick } from './kit.js';
import * as T from '../core/tree.js';
import * as G from '../core/graph.js';

const REL = {
  parent: { q: 'the PARENT of', f: (t, x) => { const p = T.parentOf(t, x); return p ? [p] : []; } },
  children: { q: 'the CHILDREN of', f: (t, x) => T.children(t, x) },
  siblings: { q: 'the SIBLINGS of', f: (t, x) => T.siblings(t, x) },
  ancestors: { q: 'all ANCESTORS of', f: (t, x) => T.ancestors(t, x) },
  descendants: { q: 'all DESCENDANTS of', f: (t, x) => T.descendants(t, x) },
  subtree: { q: 'every node of the SUBTREE rooted at', f: (t, x) => T.subtree(t, x) },
};

function smallTree(rng, lo = 5, hi = 9) {
  const shape = rng.pick(['any', 'any', 'complete', 'strict', 'skewed', 'perfect']);
  return T.randomTree(rng, rng.int(lo, hi), shape);
}

export const l13 = [
  {
    id: 'l13-relations',
    lecture: 13,
    concept: 'l13.tree-terms',
    type: 'classify',
    title: 'Tree relationships',
    generate(rng) {
      const t = smallTree(rng);
      const ids = T.ids(t);
      const kind = rng.pick([...Object.keys(REL), 'leaves', 'internal']);
      if (kind === 'leaves' || kind === 'internal') {
        const ans = kind === 'leaves' ? T.leaves(t) : T.internal(t);
        return {
          prompt: `Select every **${kind === 'leaves' ? 'leaf' : 'internal (non-leaf)'}** node.`,
          visual: { type: 'tree', tree: t, clickable: true },
          ...nodePick(ans, { explain: 'A leaf has no children (Lec 13 p.2); every other node is internal — including the root when it has children.' }),
          hints: ['Count each node’s children.', { text: 'Leaves are at the bottom of their branches.' }, kind === 'leaves' ? 'Pick the nodes with 0 children.' : 'Pick the nodes with 1 or 2 children.'],
        };
      }
      const edgeNode = rng.bool(0.3);
      let x;
      if (edgeNode) x = rng.pick(kind === 'parent' || kind === 'siblings' || kind === 'ancestors' ? [t.root] : T.leaves(t));
      else x = rng.pick(ids);
      const ans = REL[kind].f(t, x);
      return {
        prompt: `Select ${REL[kind].q} **${x}**. ${ans.length === 0 ? '' : ''}If there are none, press “None”.`,
        visual: { type: 'tree', tree: t, clickable: true, mark: [x] },
        edge: ans.length === 0,
        ...nodePick(ans, {
          explain: {
            parent: 'The parent is the node whose link points to it; the root has no parent.',
            children: 'Children are the nodes directly below it.',
            siblings: 'Siblings share the same parent; the root and an only child have none.',
            ancestors: 'Ancestors lie on the path from the root down to the node (not including the node itself).',
            descendants: 'Descendants are all nodes below it, at any depth.',
            subtree: 'The subtree is the node itself plus all of its descendants (Lec 13 p.2).',
          }[kind],
        }),
        hints: ['Use the definitions on Lec 13 p.1–2.', { text: `Start from ${x}.`, hl: { nodes: [x] } }, kind === 'ancestors' ? `Walk upward from ${x} to the root.` : kind === 'subtree' ? `Include ${x} itself.` : kind === 'descendants' ? `Everything below ${x}.` : `Look one level ${kind === 'parent' || kind === 'siblings' ? 'up' : 'down'}.`],
      };
    },
  },
  {
    id: 'l13-measures',
    lecture: 13,
    concept: 'l13.tree-measures',
    type: 'predict',
    title: 'Level, height and depth',
    generate(rng) {
      const t = rng.bool(0.15) ? T.randomTree(rng, 1) : smallTree(rng, 4, 10);
      const x = rng.pick(T.ids(t));
      const kind = rng.pick(['level', 'height', 'depth', 'atLevel', 'leaves']);
      let ans;
      let q;
      let explain;
      if (kind === 'level') {
        ans = T.level(t, x);
        q = `What is the LEVEL of ${x}?`;
        explain = `Level = number of edges from the root; the root is level 0 (Lec 13 p.3). ${x} is level ${ans}.`;
      } else if (kind === 'height') {
        ans = T.height(t);
        q = 'What is the HEIGHT of the tree?';
        explain = `Height = the maximum level (counted in edges): ${ans}. A single-node tree has height 0. Convention warning: some books count NODES instead, giving ${ans + 1}; and some define the empty tree’s height as −1.`;
      } else if (kind === 'depth') {
        ans = T.depthNotes(t, x);
        q = `Using the notes’ definition (depth = number of NODES on the path from the root), what is the depth of ${x}?`;
        explain = `The path from the root to ${x} has ${ans} node(s). Correction: most textbooks define depth = number of EDGES = level (${T.level(t, x)} here). The notes’ depth is always level + 1 — always check which convention a question uses.`;
      } else if (kind === 'atLevel') {
        const l = rng.int(0, T.height(t));
        ans = T.nodesAtLevel(t, l).length;
        q = `How many nodes are on level ${l}?`;
        explain = `Level ${l} holds ${ans} node(s); at most 2^${l} = ${2 ** l} are possible (Lec 13 p.3 property ③).`;
      } else {
        ans = T.leaves(t).length;
        q = 'How many LEAF nodes does the tree have?';
        explain = `Leaves: ${T.leaves(t).join(', ')}.`;
      }
      return {
        prompt: q,
        visual: { type: 'tree', tree: t, mark: kind === 'level' || kind === 'depth' ? [x] : [], levels: kind !== 'level' && kind !== 'depth' },
        edge: T.size(t) === 1 || x === t.root,
        ...numeric(ans, { explain, wrong: { [ans + 1]: { msg: 'Off by one — are you counting nodes instead of edges (or the other way round)?', tag: 'height-convention' }, [ans - 1]: { msg: 'Off by one — check the convention: levels and height count EDGES; the notes’ depth counts NODES.', tag: 'height-convention' } } }),
        hints: ['Level and height count edges; the notes’ depth counts nodes.', { text: 'The root is level 0.', hl: { nodes: [t.root] } }, kind === 'height' ? 'Find the deepest node and count edges from the root.' : 'Count along the path from the root.'],
      };
    },
  },
  {
    id: 'l13-classify',
    lecture: 13,
    concept: 'l13.tree-classify',
    type: 'classify',
    title: 'Classify the binary tree',
    generate(rng) {
      const shape = rng.pick(['perfect', 'complete', 'strict', 'any', 'skewed', 'any']);
      const t = T.randomTree(rng, rng.int(shape === 'perfect' ? 3 : 2, 9), shape);
      const c = T.classify(t);
      const none = !c.strict && !c.perfect && !c.complete;
      const o = opts(rng, [
        { text: 'Strictly binary (notes) — every internal node has exactly 2 children. Many books call this FULL or PROPER.', correct: c.strict, why: c.strict ? 'No node has exactly one child.' : 'Some node has exactly one child.', tag: 'full-vs-perfect' },
        { text: '“Full” as defined in the notes — all leaves on the last level and every internal node has 2 children. Most books call this PERFECT.', correct: c.perfect, why: c.perfect ? `All leaves are on level ${T.height(t)}.` : 'Not every leaf is on the last level, or some node has one child.', tag: 'full-vs-perfect' },
        { text: 'Complete — the nodes fill numbers 1..n of the level-order numbering (no gaps).', correct: c.complete, why: c.complete ? 'Every level is full except possibly the last, which is filled from the left.' : `There is a gap in the numbering (numbers used: ${Object.values(T.numbering(t)).sort((a, b) => a - b).join(', ')}).`, tag: 'complete' },
        { text: 'None of these', correct: none, why: none ? 'It fails all three definitions.' : 'At least one definition holds.', tag: 'tree-shape' },
      ]);
      return {
        prompt: 'Select EVERY description that fits this tree.',
        visual: { type: 'tree', tree: t, numbering: true },
        edge: T.size(t) <= 2,
        ...multi(o, { explain: 'Every perfect tree is also strictly binary and complete; a complete tree need not be strictly binary.' }),
        hints: ['Check each definition separately.', { text: 'The small numbers show the level-order numbering (root 1, children 2k and 2k+1).' }, 'Look for a node with one child, and for gaps in the numbering.'],
      };
    },
  },
  {
    id: 'l13-array-index',
    lecture: 13,
    concept: 'l13.tree-repr',
    type: 'convert',
    title: 'Array representation',
    generate(rng) {
      const base = rng.pick([0, 1]);
      const t = T.randomTree(rng, rng.int(4, 10), rng.pick(['complete', 'complete', 'any']));
      const kind = rng.pick(['indexOf', 'childIdx', 'parentIdx']);
      const f = base === 0 ? 'left = 2i + 1, right = 2i + 2, parent = ⌊(i − 1)/2⌋' : 'left = 2i, right = 2i + 1, parent = ⌊i/2⌋';
      if (kind === 'indexOf') {
        const x = rng.pick(T.ids(t));
        const ans = T.arrayIndexOf(t, x, base);
        return {
          prompt: `The tree is stored in an array using level-order positions, **${base}-based** (${f}). At which index is **${x}** stored? (Empty positions stay unused.)`,
          visual: { type: 'tree', tree: t, mark: [x], showArray: base },
          edge: x === t.root,
          ...numeric(ans, { explain: `Root at index ${base}; each move down-left/down-right applies the formula. Lec 13 p.5 draws the 0-based layout (children of 0 at 1 and 2). In the LINKED representation the same node is reached by following left/right pointers instead — no index arithmetic, but extra memory for two pointers per node.`, wrong: { [base === 0 ? ans + 1 : ans - 1]: { msg: 'That would be the other (0-/1-based) convention.', tag: 'array-base' } } }),
          hints: ['Number the nodes level by level, left to right, counting empty spots under existing nodes.', { text: 'Follow the path from the root: left or right at each step.', hl: { nodes: T.pathFromRoot(t, x) } }, `Start at ${base} and apply the child formula along the path.`],
        };
      }
      const i = rng.int(base, 6);
      if (kind === 'childIdx') {
        const side = rng.pick(['left', 'right']);
        const ans = base === 0 ? (side === 'left' ? 2 * i + 1 : 2 * i + 2) : side === 'left' ? 2 * i : 2 * i + 1;
        return {
          prompt: `${base}-based array representation (${f}). At which index is the **${side} child** of the node at index ${i}?`,
          ...numeric(ans, { explain: `${side} child of i = ${base === 0 ? (side === 'left' ? '2i + 1' : '2i + 2') : side === 'left' ? '2i' : '2i + 1'} = ${ans}.`, wrong: { [base === 0 ? ans - 1 : ans + 1]: { msg: 'Check whether the array is 0-based or 1-based.', tag: 'array-base' } } }),
          hints: ['Use the formula for this base.', { text: 'Lec 13 p.5: arrows from index 0 go to 1 and 2.' }, `Compute with i = ${i}.`],
        };
      }
      const j = rng.int(base + 1, 14);
      const ans = base === 0 ? Math.floor((j - 1) / 2) : Math.floor(j / 2);
      return {
        prompt: `${base}-based array representation (${f}). At which index is the **parent** of the node at index ${j}?`,
        ...numeric(ans, { explain: `parent(j) = ${base === 0 ? '⌊(j − 1)/2⌋' : '⌊j/2⌋'} = ${ans}.` }),
        hints: ['Invert the child formulas.', { text: 'Both children of a node map back to the same parent.' }, 'Use integer (floor) division.'],
      };
    },
  },
  {
    id: 'l13-formulas',
    lecture: 13,
    concept: 'l13.tree-measures',
    type: 'complexity',
    title: 'Node-count formulas',
    generate(rng) {
      const kind = rng.pick(['maxNodes', 'maxLeaves', 'atLevel', 'nextLevel', 'edges', 'minHeight']);
      const h = rng.int(0, 5);
      let ans;
      let q;
      let explain;
      let visual = null;
      if (kind === 'maxNodes') {
        ans = T.maxNodesOfHeight(h);
        q = `What is the MAXIMUM number of nodes in a binary tree of height ${h}?`;
        explain = `Levels 0..${h} hold at most 1 + 2 + … + 2^${h} = 2^(${h}+1) − 1 = ${ans} nodes (Lec 13 p.3 ①).`;
        if (h <= 3) visual = { type: 'tree', tree: T.randomTree(rng, ans, 'perfect'), levels: true };
      } else if (kind === 'maxLeaves') {
        ans = T.maxLeavesOfHeight(h);
        q = `What is the MAXIMUM number of leaves in a binary tree of height ${h}?`;
        explain = `All leaves on level ${h}: 2^${h} = ${ans}.`;
        if (h <= 3) visual = { type: 'tree', tree: T.randomTree(rng, T.maxNodesOfHeight(h), 'perfect'), levels: true };
      } else if (kind === 'atLevel') {
        ans = T.maxNodesAtLevel(h);
        q = `At most how many nodes can a binary tree have on level ${h}?`;
        explain = `Each level can at most double: 2^${h} = ${ans} (Lec 13 p.3 ③).`;
      } else if (kind === 'nextLevel') {
        const m = rng.int(1, 9);
        ans = 2 * m;
        q = `A binary tree has ${m} node(s) on level ${h}. At most how many nodes can it have on level ${h + 1}?`;
        explain = `Each of the ${m} nodes has at most 2 children: 2m = ${ans} (Lec 13 p.3 ②).`;
      } else if (kind === 'edges') {
        const n = rng.int(1, 30);
        ans = T.edgesOfTree(n);
        q = `A binary tree has ${n} node(s). How many edges does it have?`;
        explain = `Every node except the root has exactly one incoming edge: n − 1 = ${ans}. Correction to Lec 13 p.3 ④: this holds for EVERY tree, not only full ones.`;
        if (n <= 9) visual = { type: 'tree', tree: T.randomTree(rng, n, 'any') };
      } else {
        const n = rng.int(1, 40);
        ans = T.minHeightForNodes(n);
        q = `What is the MINIMUM possible height of a binary tree with ${n} node(s)?`;
        explain = `Height h holds at most 2^(h+1) − 1 nodes, so we need the smallest h with 2^(h+1) − 1 ≥ ${n}: h = ⌈log₂(n+1)⌉ − 1 = ${ans}.`;
      }
      return {
        prompt: q,
        visual,
        edge: h === 0,
        ...numeric(ans, { explain, wrong: { [ans * 2]: { msg: 'Check the exponent: level l has at most 2^l nodes.', tag: 'formula' }, [ans + 1]: { msg: 'Off by one — remember levels start at 0.', tag: 'height-convention' } } }),
        hints: ['Level l can hold at most 2^l nodes.', { text: 'Picture the fullest possible tree.' }, 'Use the formulas on Lec 13 p.3.'],
      };
    },
  },
  {
    id: 'l13-matrix',
    lecture: 13,
    concept: 'l13.graph-repr',
    type: 'convert',
    title: 'Drawing → adjacency matrix',
    generate(rng) {
      const directed = rng.bool();
      const g = G.randomGraph(rng, { n: rng.int(3, 5), directed, selfLoop: rng.bool(0.4), isolated: rng.bool(0.3), density: 0.35 });
      const { labels, m } = G.matrix(g);
      const hasLoop = g.edges.some((e) => e.u === e.v);
      return {
        prompt: `Fill in the adjacency matrix of this **${directed ? 'directed' : 'undirected'}** graph (row = from, column = to). Click a cell to toggle 0/1.`,
        visual: { type: 'graph', graph: g },
        edge: hasLoop || g.vertices.some((v) => G.degree(g, v) === 0),
        kind: 'matrix',
        labels,
        answer: m,
        check(resp) {
          const wrong = [];
          labels.forEach((u, i) => labels.forEach((v, j) => {
            if ((resp?.[i]?.[j] ?? 0) !== m[i][j]) wrong.push({ u, v, want: m[i][j] });
          }));
          if (!wrong.length) return { correct: true, message: `${directed ? 'A directed graph’s matrix need not be symmetric.' : 'An undirected edge appears twice (row u col v AND row v col u), so the matrix is symmetric.'}${hasLoop ? ' A self-loop is a 1 on the diagonal.' : ''} Space: Θ(V²) entries regardless of how many edges exist.` };
          const sym = !directed && wrong.some((w) => resp?.[labels.indexOf(w.v)]?.[labels.indexOf(w.u)] === w.want);
          const transposed = directed && wrong.every((w) => (resp?.[labels.indexOf(w.v)]?.[labels.indexOf(w.u)] ?? 0) === w.want);
          return {
            correct: false,
            message: `${wrong.length} cell(s) are wrong, e.g. row ${wrong[0].u}, column ${wrong[0].v} should be ${wrong[0].want}. ${sym ? 'For an undirected graph fill BOTH [u][v] and [v][u].' : transposed ? 'It looks transposed: the row is the edge’s START vertex.' : ''}`,
            tag: sym ? 'matrix-symmetry' : transposed ? 'matrix-direction' : 'matrix',
          };
        },
        solutionText: labels.map((u, i) => `${u}: ${m[i].join(' ')}`).join('\n'),
        hints: ['Entry [u][v] is 1 when there is an edge from u to v.', { text: directed ? 'Follow each arrow from its tail (row) to its head (column).' : 'Each line connects two vertices in BOTH directions.' }, hasLoop ? 'A loop on v gives [v][v] = 1.' : 'Count: the number of 1s should be ' + m.flat().filter((x) => x).length + '.'],
      };
    },
  },
  {
    id: 'l13-adjlist',
    lecture: 13,
    concept: 'l13.graph-repr',
    type: 'convert',
    title: 'Matrix → adjacency list',
    generate(rng) {
      const directed = rng.bool(0.6);
      const g = G.randomGraph(rng, { n: rng.int(3, 5), directed, selfLoop: rng.bool(0.35), isolated: rng.bool(0.25) });
      const { labels, m } = G.matrix(g);
      const list = G.adjList(g);
      return {
        prompt: `Write the adjacency list for this **${directed ? 'directed' : 'undirected'}** graph's matrix. For each vertex type its neighbours separated by spaces (leave empty if none).`,
        visual: { type: 'matrix', labels, m },
        edge: true,
        kind: 'adjlist',
        labels,
        answer: Object.fromEntries(labels.map((v) => [v, list[v].join(' ')])),
        check(resp) {
          const bad = labels.filter((v) => {
            const got = String(resp?.[v] ?? '').split(/[^A-Za-z0-9]+/).filter(Boolean).map((x) => x.toUpperCase()).sort();
            const want = list[v].map((x) => x.toUpperCase()).sort();
            return got.join() !== want.join();
          });
          if (!bad.length) return { correct: true, message: `Each row of the matrix becomes one linked list (Lec 13 p.6, bottom). Space: Θ(V + E) — smaller than Θ(V²) for sparse graphs. The ORDER inside a list does not change the graph, but it does change BFS/DFS results.` };
          return { correct: false, message: `Check ${bad.map((v) => `${v} (should be: ${list[v].join(' ') || 'none'})`).join('; ')}.`, tag: 'adjlist' };
        },
        solutionText: labels.map((v) => `${v}: ${list[v].join(' → ') || '(none)'}`).join('\n'),
        hints: ['Row v lists the vertices v points to.', { text: 'Read across one row at a time.' }, 'Every 1 in row v, column u means u goes into v’s list.'],
      };
    },
  },
  {
    id: 'l13-draw',
    lecture: 13,
    concept: 'l13.graph-repr',
    type: 'convert',
    title: 'Adjacency list → drawing',
    generate(rng) {
      const directed = rng.bool();
      const g = G.randomGraph(rng, { n: rng.int(3, 5), directed, selfLoop: rng.bool(0.3), isolated: rng.bool(0.2) });
      const list = G.adjList(g);
      const empty = G.createGraph({ directed });
      g.vertices.forEach((v) => G.addVertex(empty, v, g.pos[v]));
      const answer = g.edges.map((e) => [e.u, e.v]);
      const key = (u, v) => (directed ? `${u}>${v}` : [u, v].sort().join('-'));
      return {
        prompt: `Draw the **${directed ? 'directed' : 'undirected'}** graph described by this adjacency list. Click a start vertex, then an end vertex to add (or remove) an edge. Click the same vertex twice for a self-loop.`,
        visual: { type: 'adjlist', list },
        canvas: empty,
        kind: 'graphdraw',
        directed,
        edge: g.edges.some((e) => e.u === e.v),
        answer,
        check(resp) {
          const want = new Set(answer.map(([u, v]) => key(u, v)));
          const got = new Set((resp || []).map(([u, v]) => key(u, v)));
          const missing = [...want].filter((k) => !got.has(k));
          const extra = [...got].filter((k) => !want.has(k));
          if (!missing.length && !extra.length) return { correct: true, message: directed ? 'Each list entry is one arrow.' : 'In an undirected list each edge appears in BOTH endpoints’ lists but is drawn once.' };
          return { correct: false, message: `${missing.length ? `Missing edge(s): ${missing.join(', ')}. ` : ''}${extra.length ? `Extra edge(s): ${extra.join(', ')}.` : ''}`, tag: directed ? 'matrix-direction' : 'adjlist' };
        },
        solutionText: answer.map(([u, v]) => `${u} ${directed ? '→' : '–'} ${v}`).join(', '),
        hints: ['Each entry “u: v” means an edge from u to v.', { text: directed ? 'Arrows point FROM the list owner.' : 'B in A’s list and A in B’s list are the SAME edge.' }, `There are ${answer.length} edge(s) in total.`],
      };
    },
  },
  {
    id: 'l13-build-tree',
    lecture: 13,
    concept: 'l13.tree-repr',
    type: 'build',
    title: 'Build the tree from its array',
    generate(rng) {
      const base = rng.pick([0, 1]);
      const t = T.randomTree(rng, rng.int(3, 7), rng.pick(['any', 'complete', 'skewed']));
      const arr = T.toArray(t, base);
      return {
        prompt: `Build the binary tree stored in this **${base}-based** array (“—” = empty). Add the root, then use the + buttons to add left/right children.`,
        visual: { type: 'arrayTree', arr, base },
        kind: 'treebuild',
        labels: T.ids(t).sort(),
        edge: T.size(t) <= 3,
        answer: T.clone(t),
        check(resp) {
          if (!resp || !resp.root) return { correct: false, message: 'Add the root first.' };
          const same = (a, b) => (a == null && b == null) || (a != null && b != null && a === b && same(resp.nodes[a].left, t.nodes[b].left) && same(resp.nodes[a].right, t.nodes[b].right));
          if (resp.root === t.root && same(resp.root, t.root) && T.size(resp) === T.size(t)) return { correct: true, message: `Index i's children are at ${base === 0 ? '2i+1 and 2i+2' : '2i and 2i+1'}. An array wastes slots when the tree is not complete; the linked version wastes two pointers per node instead.` };
          const wrong = T.ids(t).find((x) => !resp.nodes[x] || T.parentOf(resp, x) !== T.parentOf(t, x) || (T.parentOf(t, x) && (resp.nodes[T.parentOf(t, x)].left === x) !== (t.nodes[T.parentOf(t, x)].left === x)));
          return { correct: false, message: wrong ? `${wrong} is in the wrong place: it should be the ${t.nodes[T.parentOf(t, wrong)]?.left === wrong ? 'left' : 'right'} child of ${T.parentOf(t, wrong) ?? '(root)'}.` : 'The shape differs from the array.', tag: 'array-base' };
        },
        solutionText: `Preorder of the tree: ${T.preorder(t).join(' ')}`,
        hints: ['The root is at the first used index.', { text: base === 0 ? 'Children of index i: 2i+1 (left), 2i+2 (right).' : 'Children of index i: 2i (left), 2i+1 (right).' }, `Root = ${t.root}.`],
      };
    },
  },
];
