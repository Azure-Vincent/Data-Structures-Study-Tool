// Lecture 14 — Traversals: preorder/inorder/postorder, DFS, BFS.
import { opts, mcq, numeric, sequenceClick, sequenceText, nodePick } from './kit.js';
import * as T from '../core/tree.js';
import * as G from '../core/graph.js';

const ORDER_NAME = { preorder: 'Preorder (Root, Left, Right)', inorder: 'Inorder (Left, Root, Right)', postorder: 'Postorder (Left, Right, Root)' };

function travGraph(rng, { allowDisc = false } = {}) {
  const pick = rng.int(0, 9);
  if (pick === 0) return { g: G.lec14Graph(), lecture: true };
  if (pick === 1) return { g: G.lec13Directed(), lecture: true };
  const directed = rng.bool(0.35);
  const g = G.randomGraph(rng, { n: rng.int(5, 7), directed, density: 0.45, selfLoop: rng.bool(0.3), isolated: allowDisc && rng.bool(0.4) });
  return { g, lecture: false };
}

export const l14 = [
  {
    id: 'l14-tree-order',
    lecture: 14,
    concept: 'l14.tree-traversal',
    type: 'traverse',
    title: 'Click the tree traversal',
    generate(rng, { guidance = 'less', params = {} } = {}) {
      const order = params.order || rng.pick(['preorder', 'inorder', 'postorder']);
      const t = params.lectureTree ? T.LECTURE_TREE() : T.randomTree(rng, rng.int(params.small ? 1 : 3, 9), rng.pick(['any', 'any', 'complete', 'skewed']));
      const ans = T.ORDER_FNS[order](t);
      const others = ['preorder', 'inorder', 'postorder'].filter((o) => o !== order);
      return {
        prompt: `Click the nodes in **${ORDER_NAME[order]}** order.${guidance === 'full' ? ` A node is OUTPUT ${order === 'preorder' ? 'as soon as it is entered' : order === 'inorder' ? 'after its whole left subtree is finished' : 'after BOTH subtrees are finished'}.` : ''}`,
        visual: { type: 'tree', tree: t, clickable: true },
        edge: T.size(t) <= 2 || T.height(t) === T.size(t) - 1,
        ...sequenceClick(ans, {
          explain: `${order}: ${ans.join(' ')}. Every traversal ENTERS nodes in the same order (${T.preorder(t).join(' ')}); they differ only in WHEN each node is output.`,
          diagnose: (got, i) => {
            for (const o of others) {
              const alt = T.ORDER_FNS[o](t);
              if (got.length > i && got.slice(0, i + 1).every((x, k) => x === alt[k])) return { msg: `That matches ${o}, not ${order}.`, tag: 'order-confusion' };
            }
            return null;
          },
        }),
        hints: [`${ORDER_NAME[order]}: apply the rule at EVERY subtree, not just at the root.`, { text: `Start at the root ${t.root}: ${order === 'preorder' ? 'it is output first.' : order === 'inorder' ? 'first finish its entire left subtree.' : 'it is output last.'}`, hl: { nodes: [t.root] } }, `The first node is ${ans[0]}.`],
        solutionTrace: { struct: 'tree', op: order, tree: t },
        params: { order },
      };
    },
  },
  {
    id: 'l14-entered-output',
    lecture: 14,
    concept: 'l14.tree-traversal',
    type: 'predict',
    title: 'Entered vs output',
    generate(rng, { params = {} } = {}) {
      const order = params.order || rng.pick(['preorder', 'inorder', 'postorder']);
      const t = params.lectureTree ? T.LECTURE_TREE() : T.randomTree(rng, rng.int(4, 9), 'any');
      const tr = T.traceTraversal(t, order);
      const outs = tr.steps.filter((s) => s.kind === 'output');
      const st = rng.pick(outs);
      const x = st.hl.visit;
      const stack = [...st.state.callStack];
      return {
        prompt: `During the recursive **${order}** traversal, at the moment **${x}** is OUTPUT, which nodes have a call that is still active (entered but not yet left)? Include ${x} itself.`,
        visual: { type: 'tree', tree: t, clickable: true, mark: [x] },
        edge: x === t.root || T.children(t, x).length === 0,
        ...nodePick(stack, {
          explain: `Active calls = the path from the root to ${x}: ${stack.join(' → ')}. ${order === 'postorder' ? 'In postorder a node is output just before its call returns.' : order === 'preorder' ? 'In preorder a node is output right after it is entered.' : 'In inorder a node is output between its two recursive calls.'} The recursion stack never holds more than height + 1 frames → Θ(h) auxiliary space.`,
        }),
        hints: ['Recursive calls nest along a path from the root.', { text: `Which nodes lie on the path from ${t.root} to ${x}?`, hl: { nodes: T.pathFromRoot(t, x) } }, 'Exactly the ancestors of the node, plus the node itself.'],
        solutionTrace: { struct: 'tree', op: order, tree: t },
        params: { order },
      };
    },
  },
  {
    id: 'l14-bfs-click',
    lecture: 14,
    concept: 'l14.bfs',
    type: 'traverse',
    title: 'Click the BFS order',
    generate(rng, { guidance = 'less', params = {} } = {}) {
      const { g } = params.lecture ? { g: G.lec14Graph() } : travGraph(rng);
      const s = params.start || rng.pick(G.sortedVertices(g).filter((v) => G.neighbors(g, v).length));
      const tr = G.traceBFS(g, s);
      const ans = tr.result;
      const queueAfter = (k) => {
        const st = [...tr.steps].reverse().find((x) => x.state.output.length === k);
        return { label: 'Queue (front → rear)', items: st ? st.state.frontier : [] };
      };
      return {
        prompt: `Run **BFS from ${s}**. Neighbour order: **ascending (alphabetical/numeric)**. Click vertices in the order they are OUTPUT (dequeued). ${g.directed ? 'Edges are directed: follow arrows only.' : ''}${ans.length < g.vertices.length ? '' : ''}`,
        visual: { type: 'graph', graph: g, clickable: true, mark: [s] },
        edge: ans.length < g.vertices.length || g.edges.some((e) => e.u === e.v),
        ...sequenceClick(ans, {
          explain: `BFS output: ${ans.join(' ')}${ans.length < g.vertices.length ? `. Not reachable from ${s}: ${g.vertices.filter((v) => !ans.includes(v)).join(', ')} — a single BFS explores only what is reachable` : ''}. Vertices are marked discovered when ENQUEUED, so none enters the queue twice even with cycles.`,
          frontierAt: guidance !== 'none' ? queueAfter : null,
          diagnose: (got, i) => {
            const dfs = G.dfsOrder(g, s);
            if (got.length > i && got.slice(0, i + 1).every((x, k) => x === dfs[k])) return { msg: 'That is the DFS order — BFS finishes ALL neighbours of a vertex before going deeper.', tag: 'bfs-dfs-confusion' };
            return null;
          },
        }),
        hints: ['BFS uses a QUEUE: the earliest discovered vertex is processed next.', { text: `Start: queue = [${s}].`, hl: { nodes: [s] } }, `After ${s}, its neighbours in ascending order: ${G.neighbors(g, s).join(', ')}.`],
        solutionTrace: { struct: 'graph', op: 'bfs', graph: g, start: s },
      };
    },
  },
  {
    id: 'l14-dfs-click',
    lecture: 14,
    concept: 'l14.dfs',
    type: 'traverse',
    title: 'Click the DFS order',
    generate(rng, { guidance = 'less', params = {} } = {}) {
      const { g } = params.lecture ? { g: G.lec14Graph() } : travGraph(rng);
      const s = params.start || rng.pick(G.sortedVertices(g).filter((v) => G.neighbors(g, v).length));
      const tr = G.traceDFS(g, s);
      const ans = tr.result;
      const stackAfter = (k) => {
        const st = tr.steps.find((x) => x.state.output.length === k);
        return { label: 'Stack (bottom → top)', items: st ? st.state.frontier : [] };
      };
      return {
        prompt: `Run **recursive DFS from ${s}**. Neighbour order: **ascending**. Click vertices in the order they are first visited (output).`,
        visual: { type: 'graph', graph: g, clickable: true, mark: [s] },
        edge: ans.length < g.vertices.length || g.edges.some((e) => e.u === e.v),
        ...sequenceClick(ans, {
          explain: `DFS output: ${ans.join(' ')}. When a vertex has no undiscovered neighbour left, DFS backtracks (pops) to the previous vertex and continues with ITS next neighbour.`,
          frontierAt: guidance !== 'none' ? stackAfter : null,
          diagnose: (got, i) => {
            const bfs = G.bfsOrder(g, s);
            if (got.length > i && got.slice(0, i + 1).every((x, k) => x === bfs[k])) return { msg: 'That is the BFS order — DFS goes as DEEP as possible before trying the next neighbour.', tag: 'bfs-dfs-confusion' };
            return null;
          },
        }),
        hints: ['DFS = go deeper immediately; backtrack when stuck.', { text: `Start at ${s}; its first neighbour is ${G.neighbors(g, s)[0]}.`, hl: { nodes: [s] } }, 'Keep the current path as a stack; the top is where you are.'],
        solutionTrace: { struct: 'graph', op: 'dfs', graph: g, start: s },
      };
    },
  },
  {
    id: 'l14-frontier',
    lecture: 14,
    concept: 'l14.bfs',
    conceptBy: (p) => (p.kind === 'dfs' ? 'l14.dfs' : 'l14.bfs'),
    type: 'predict',
    title: 'What is in the queue / stack?',
    generate(rng) {
      const kind = rng.pick(['bfs', 'dfs']);
      const { g } = travGraph(rng);
      const s = rng.pick(G.sortedVertices(g).filter((v) => G.neighbors(g, v).length));
      const tr = kind === 'bfs' ? G.traceBFS(g, s) : G.traceDFS(g, s);
      const n = tr.result.length;
      const k = rng.int(1, Math.max(1, n - 1));
      let st;
      if (kind === 'bfs') st = tr.steps.find((x) => x.kind === 'process' && x.state.processed.length === k);
      else st = tr.steps.find((x) => x.state.output.length === k);
      const items = st.state.frontier;
      return {
        prompt: `${kind === 'bfs' ? `BFS from ${s}` : `Recursive DFS from ${s}`} (ascending neighbour order). ${kind === 'bfs' ? `Right after the ${k}${['st', 'nd', 'rd'][k - 1] || 'th'} dequeued vertex has had ALL its neighbours examined, what is in the queue (front → rear)?` : `Right after the ${k}${['st', 'nd', 'rd'][k - 1] || 'th'} vertex is visited, what is on the stack of active calls (bottom → top)?`} Type “empty” if nothing.`,
        visual: { type: 'graph', graph: g, mark: [s] },
        edge: items.length === 0,
        ...sequenceText(items, { explain: `Output so far: ${st.state.output.join(' ')}. Discovered: ${st.state.discovered.join(' ')}. Processed: ${st.state.processed.join(' ') || 'none'}. ${kind === 'bfs' ? 'Queue space can reach Θ(V) in the worst case.' : 'Stack depth can reach Θ(V) (a long path).'}` }),
        hints: [kind === 'bfs' ? 'Discovered-but-not-yet-dequeued vertices wait in the queue.' : 'The stack holds the current path from the start vertex.', { text: 'Simulate step by step and write the frontier down.' }, `The output so far is ${st.state.output.join(' ')}.`],
        solutionTrace: { struct: 'graph', op: kind, graph: g, start: s },
        params: { kind },
      };
    },
  },
  {
    id: 'l14-components',
    lecture: 14,
    concept: 'l14.components',
    type: 'predict',
    title: 'One component or the whole graph?',
    generate(rng) {
      const labels = 'ABCDEFG'.split('').slice(0, rng.int(5, 7));
      const g = G.createGraph({ directed: false });
      labels.forEach((l) => G.addVertex(g, l));
      const cut = rng.int(2, labels.length - 2);
      const parts = [labels.slice(0, cut), labels.slice(cut)];
      const shuffledLabels = rng.shuffle(labels);
      // make each part connected, then add an extra edge (cycle) sometimes
      for (const p of parts) {
        const sp = rng.shuffle(p);
        for (let i = 1; i < sp.length; i++) G.addEdge(g, sp[rng.int(0, i - 1)], sp[i]);
        if (sp.length >= 3 && rng.bool()) {
          const [a, b] = rng.sample(sp, 2);
          if (!G.hasEdge(g, a, b)) G.addEdge(g, a, b);
        }
      }
      void shuffledLabels;
      if (rng.bool(0.3)) G.addVertex(g, 'Z');
      G.circleLayout(g);
      const kind = rng.pick(['reach', 'full']);
      const s = rng.pick(parts[1]);
      if (kind === 'reach') {
        const ans = G.bfsOrder(g, s);
        return {
          prompt: `Run ONE BFS (or DFS) starting at **${s}**. Select every vertex it visits.`,
          visual: { type: 'graph', graph: g, clickable: true, mark: [s] },
          edge: true,
          ...nodePick(ans, { explain: `A single search reaches only ${s}'s component (${ans.join(', ')}). To visit EVERY vertex, loop over all vertices and start a new search from each one that is still undiscovered.` }),
          hints: ['A search can only follow edges.', { text: 'Which vertices are connected to the start by some path?', hl: { nodes: [s] } }, 'Vertices in other pieces of the graph are never reached.'],
        };
      }
      const full = G.fullTraversal(g, 'bfs');
      return {
        prompt: 'Traverse the WHOLE graph with BFS: loop over vertices in ascending order and start a new BFS from each one not yet discovered (neighbours ascending). Type the full output order.',
        visual: { type: 'graph', graph: g },
        edge: true,
        ...sequenceText(full.order, { explain: `Components: ${full.components.map((c) => '{' + c.join(', ') + '}').join(' ')}. There were ${full.components.length} separate BFS calls — one per connected component (an isolated vertex is a component by itself).` }),
        hints: ['Start with the alphabetically first vertex.', { text: 'When the queue empties, pick the next undiscovered vertex in ascending order.' }, `The first BFS starts at ${G.sortedVertices(g)[0]}.`],
        solutionTrace: { struct: 'graph', op: 'bfs', graph: g, start: G.sortedVertices(g)[0], all: true },
      };
    },
  },
  {
    id: 'l14-bfs-weight',
    lecture: 14,
    concept: 'l14.bfs',
    type: 'choose',
    title: 'BFS paths on a weighted graph',
    generate(rng) {
      let g;
      let s;
      let t;
      let bp;
      let best;
      if (rng.bool(0.35)) {
        g = G.lec13Weighted();
        s = 'A';
        t = rng.pick(['D', 'E', 'G']);
      } else {
        g = G.randomGraph(rng, { n: 6, weighted: true, density: 0.5 });
        [s, t] = rng.sample(g.vertices, 2);
      }
      const { parent } = G.bfsTree(g, s);
      bp = G.pathTo(parent, t);
      best = G.lightestPath(g, s, t);
      const bw = G.pathWeight(g, bp);
      const lighter = best.dist < bw;
      const o = opts(rng, [
        { text: `BFS finds ${bp.join('–')} (${bp.length - 1} edges, total weight ${bw}); ${lighter ? `but ${best.path.join('–')} weighs only ${best.dist}` : 'and no lighter path exists here'}`, correct: true, why: 'BFS minimises the number of EDGES, ignoring weights.' },
        { text: `BFS always finds the path of minimum total weight, so ${bp.join('–')} is the lightest`, correct: false, why: lighter ? `Counter-example right here: ${best.path.join('–')} weighs ${best.dist} < ${bw}.` : 'It happens to be lightest here, but BFS ignores weights in general.', tag: 'bfs-weight' },
        { text: `BFS finds ${best.path.join('–')} because it follows the smallest weights first`, correct: !lighter && best.path.join() === bp.join() ? false : false, why: 'BFS does not look at weights at all — it expands level by level (number of edges).', tag: 'bfs-weight' },
      ]);
      return {
        prompt: `Weighted, undirected graph. Run BFS from **${s}** (ascending neighbour order) and follow BFS parents to reach **${t}**. Which statement is true?`,
        visual: { type: 'graph', graph: g, mark: [s, t] },
        edge: !lighter,
        ...mcq(o, { explain: 'For minimum total weight use Dijkstra’s algorithm (supplementary — not in Lec 14).' }),
        hints: ['BFS discovers vertices in rings: 1 edge away, 2 edges away, …', { text: 'Ignore the numbers on the edges while running BFS.' }, 'Compare the BFS path’s total weight with other paths.'],
      };
    },
  },
  {
    id: 'l14-cost',
    lecture: 14,
    concept: 'l14.traversal-cost',
    type: 'complexity',
    title: 'Traversal cost: list vs matrix',
    generate(rng) {
      const directed = rng.bool();
      const g = G.randomGraph(rng, { n: rng.int(4, 7), directed, density: 0.4, selfLoop: rng.bool(0.25) });
      const rep = rng.pick(['list', 'matrix']);
      const s = G.sortedVertices(g)[0];
      const tr = G.traceBFS(g, s, { rep, all: true });
      const ans = tr.counters.neighborChecks;
      const V = g.vertices.length;
      const E = g.edges.length;
      return {
        prompt: `Counting model: one “neighbour check” per entry examined while finding a vertex's neighbours. A full BFS (all components) processes every vertex once.\n\nThe ${directed ? 'directed' : 'undirected'} graph has V = ${V}, E = ${E}. Stored as an **adjacency ${rep}**, how many neighbour checks happen in total?`,
        visual: { type: 'graph', graph: g },
        edge: g.edges.some((e) => e.u === e.v),
        ...numeric(ans, {
          explain: rep === 'matrix' ? `Each vertex scans its whole row of V entries: V × V = ${V * V}. Total Θ(V²) — independent of E.` : `Each vertex scans only its own list. Sum of list lengths = ${directed ? 'E' : '2E (each undirected edge is stored in both lists; a self-loop once)'} = ${ans}. Total time Θ(V + E). Auxiliary space: the visited marks Θ(V) plus the queue, up to Θ(V).`,
          wrong: { [V * V]: { msg: 'That is the matrix cost.', tag: 'list-vs-matrix' }, [2 * E]: { msg: directed ? 'Directed edges appear in only ONE list.' : 'Check self-loops: a loop appears once in its vertex’s list.', tag: 'list-vs-matrix' }, [E]: { msg: directed ? '' : 'An undirected edge appears in BOTH endpoints’ lists.', tag: 'list-vs-matrix' } },
        }),
        hints: ['What does finding the neighbours of ONE vertex cost in this representation?', { text: rep === 'matrix' ? 'A matrix row always has V entries.' : 'A list holds only real neighbours.' }, rep === 'matrix' ? 'Multiply V by V.' : 'Add up the lengths of all lists.'],
      };
    },
  },
  {
    id: 'l14-inorder-stack',
    lecture: 14,
    concept: 'l14.tree-traversal',
    type: 'predict',
    title: 'Inorder with an explicit stack',
    generate(rng, { params = {} } = {}) {
      const t = params.lectureTree ? T.LECTURE_TREE() : T.randomTree(rng, rng.int(3, 8), 'any');
      const tr = T.traceInorderStack(t);
      const pops = tr.steps.map((s, i) => [s, i]).filter(([s]) => s.kind === 'pop');
      const k = rng.int(1, pops.length);
      const before = tr.steps[pops[k - 1][1] - 1].state.stack;
      return {
        prompt: `Iterative inorder (Lec 14 p.1 stack pictures): push nodes while going left, pop & output, then go right. What does the stack contain (bottom → top) right BEFORE pop number ${k}?`,
        visual: { type: 'tree', tree: t },
        edge: k === 1,
        ...sequenceText(before, { explain: `Pop ${k} outputs ${pops[k - 1][0].hl.node}. Inorder: ${T.inorder(t).join(' ')}. The stack holds the ancestors still waiting for their left subtree to finish.` }),
        hints: ['Every node is pushed once and popped once.', { text: 'Before the first pop: the whole leftmost path is pushed.' }, 'After popping a node, its RIGHT child (and that child’s left path) is pushed next.'],
        solutionTrace: { struct: 'tree', op: 'inorderStack', tree: t },
      };
    },
  },
];
