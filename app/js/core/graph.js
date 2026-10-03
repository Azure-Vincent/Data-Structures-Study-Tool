// Graphs (Lectures 13 and 14): representation, BFS and DFS traces.
import { Tracer } from './trace.js';

export function createGraph({ directed = false, weighted = false } = {}) {
  return { type: 'graph', directed, weighted, vertices: [], edges: [], pos: {} };
}

export function clone(g) {
  return JSON.parse(JSON.stringify(g));
}

export function addVertex(g, v, p) {
  if (g.vertices.includes(v)) throw new Error(`Vertex ${v} already exists`);
  g.vertices.push(v);
  g.pos[v] = p || null;
}

export function removeVertex(g, v) {
  g.vertices = g.vertices.filter((x) => x !== v);
  g.edges = g.edges.filter((e) => e.u !== v && e.v !== v);
  delete g.pos[v];
}

export function hasEdge(g, u, v) {
  return g.edges.some((e) => (e.u === u && e.v === v) || (!g.directed && e.u === v && e.v === u));
}

export function addEdge(g, u, v, w = 1) {
  if (!g.vertices.includes(u) || !g.vertices.includes(v)) throw new Error('Both endpoints must exist');
  if (hasEdge(g, u, v)) throw new Error(`Edge ${u}${g.directed ? '→' : '–'}${v} already exists`);
  g.edges.push({ u, v, w: g.weighted ? Number(w) : 1 });
}

export function removeEdge(g, u, v) {
  g.edges = g.edges.filter((e) => !((e.u === u && e.v === v) || (!g.directed && e.u === v && e.v === u)));
}

export function weight(g, u, v) {
  const e = g.edges.find((e) => (e.u === u && e.v === v) || (!g.directed && e.u === v && e.v === u));
  return e ? e.w : null;
}

/** Neighbour list of v. order 'alpha' (ascending labels, numeric aware) or 'insertion'. */
export function neighbors(g, v, order = 'alpha') {
  const out = [];
  for (const e of g.edges) {
    if (e.u === v && !out.includes(e.v)) out.push(e.v);
    else if (!g.directed && e.v === v && !out.includes(e.u)) out.push(e.u);
  }
  return order === 'alpha' ? out.sort(cmpLabel) : out;
}

export function cmpLabel(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

export function sortedVertices(g, order = 'alpha') {
  return order === 'alpha' ? [...g.vertices].sort(cmpLabel) : [...g.vertices];
}

/** Adjacency matrix in vertex order. Unweighted: 1/0. Weighted: weight, 0 on the diagonal, Infinity for "no edge" (as in Lec 13 p.6). */
export function matrix(g, order = 'alpha') {
  const vs = sortedVertices(g, order);
  return {
    labels: vs,
    m: vs.map((u) =>
      vs.map((v) => {
        const w = weight(g, u, v);
        if (g.weighted) {
          if (w != null) return w;
          return u === v ? 0 : Infinity;
        }
        return w != null ? 1 : 0;
      }),
    ),
  };
}

export function adjList(g, order = 'alpha') {
  const vs = sortedVertices(g, order);
  return Object.fromEntries(vs.map((v) => [v, neighbors(g, v, order)]));
}

export function fromMatrix(labels, m, { directed = false, weighted = false } = {}) {
  const g = createGraph({ directed, weighted });
  labels.forEach((l) => addVertex(g, l));
  labels.forEach((u, i) =>
    labels.forEach((v, j) => {
      const x = m[i][j];
      const present = weighted ? x !== Infinity && x !== 0 && x != null : x === 1;
      if (!present) return;
      if (!directed && j < i) return; // undirected: use the upper triangle (incl. diagonal)
      if (!hasEdge(g, u, v)) addEdge(g, u, v, weighted ? x : 1);
    }),
  );
  return g;
}

export function fromEdgeList(labels, edges, opts = {}) {
  const g = createGraph(opts);
  labels.forEach((l) => addVertex(g, l));
  for (const e of edges) addEdge(g, e[0], e[1], e[2] ?? 1);
  return g;
}

export function isSymmetric(m) {
  return m.every((row, i) => row.every((x, j) => x === m[j][i]));
}

export function degree(g, v) {
  // undirected: a self-loop adds 2 to the degree
  if (g.directed) return outDegree(g, v) + inDegree(g, v);
  let d = 0;
  for (const e of g.edges) {
    if (e.u === v) d++;
    if (e.v === v) d++;
  }
  return d;
}
export function outDegree(g, v) {
  return g.edges.filter((e) => e.u === v).length;
}
export function inDegree(g, v) {
  return g.edges.filter((e) => e.v === v).length;
}

// ---------------------------------------------------------------- traversal (no trace)
export function bfsOrder(g, s, order = 'alpha') {
  const seen = new Set([s]);
  const q = [s];
  const out = [];
  while (q.length) {
    const v = q.shift();
    out.push(v);
    for (const u of neighbors(g, v, order)) if (!seen.has(u)) {
      seen.add(u);
      q.push(u);
    }
  }
  return out;
}

export function dfsOrder(g, s, order = 'alpha', seen = new Set(), out = []) {
  seen.add(s);
  out.push(s);
  for (const u of neighbors(g, s, order)) if (!seen.has(u)) dfsOrder(g, u, order, seen, out);
  return out;
}

/** Visit every vertex: restart from the next unvisited vertex in `order`. */
export function fullTraversal(g, kind = 'bfs', order = 'alpha') {
  const seen = new Set();
  const comps = [];
  for (const s of sortedVertices(g, order)) {
    if (seen.has(s)) continue;
    let part;
    if (kind === 'bfs') {
      part = bfsOrder(g, s, order).filter((x) => !seen.has(x));
    } else part = dfsOrder(g, s, order, new Set(seen), []).filter((x) => !seen.has(x));
    part.forEach((x) => seen.add(x));
    comps.push(part);
  }
  return { order: comps.flat(), components: comps };
}

export function reachable(g, s) {
  return bfsOrder(g, s);
}

/** BFS hop distance and parent tree. */
export function bfsTree(g, s, order = 'alpha') {
  const dist = { [s]: 0 };
  const parent = { [s]: null };
  const q = [s];
  while (q.length) {
    const v = q.shift();
    for (const u of neighbors(g, v, order)) if (!(u in dist)) {
      dist[u] = dist[v] + 1;
      parent[u] = v;
      q.push(u);
    }
  }
  return { dist, parent };
}

export function pathTo(parent, t) {
  if (!(t in parent)) return null;
  const p = [];
  for (let x = t; x != null; x = parent[x]) p.unshift(x);
  return p;
}

export function pathWeight(g, path) {
  let s = 0;
  for (let i = 1; i < path.length; i++) s += weight(g, path[i - 1], path[i]);
  return s;
}

/** Dijkstra (supplementary) — used only to contrast with BFS on weighted graphs. */
export function lightestPath(g, s, t) {
  const dist = Object.fromEntries(g.vertices.map((v) => [v, Infinity]));
  const parent = {};
  dist[s] = 0;
  parent[s] = null;
  const done = new Set();
  while (done.size < g.vertices.length) {
    let v = null;
    for (const x of g.vertices) if (!done.has(x) && (v === null || dist[x] < dist[v])) v = x;
    if (v === null || dist[v] === Infinity) break;
    done.add(v);
    for (const u of neighbors(g, v)) {
      const nd = dist[v] + weight(g, v, u);
      if (nd < dist[u]) {
        dist[u] = nd;
        parent[u] = v;
      }
    }
  }
  return { dist: dist[t], path: pathTo(parent, t) };
}

// ---------------------------------------------------------------- traced BFS / DFS
export const GRAPH_CODE = {
  bfs: {
    title: 'BFS(s)  — queue',
    ref: 'Lec 14 p.3–4',
    lines: ['mark s discovered;  enqueue(Q, s);', 'while (!isEmpty(Q)) {', '    v = dequeue(Q);  output(v);', '    for each neighbour u of v (in the stated order) {', '        if (u is not discovered) {', '            mark u discovered;  enqueue(Q, u);', '        }', '    }', '    mark v processed;', '}'],
  },
  dfs: {
    title: 'DFS(v)  — recursion (call stack)',
    ref: 'Lec 14 p.2–4',
    lines: ['void DFS(v) {', '    mark v discovered;  output(v);', '    for each neighbour u of v (in the stated order) {', '        if (u is not discovered)', '            DFS(u);           // go deeper', '    }', '    mark v processed;     // backtrack', '}'],
  },
  full: {
    title: 'traverse the WHOLE graph',
    ref: 'Supplementary (disconnected graphs)',
    lines: ['for each vertex s (in order) {', '    if (s is not discovered)', '        BFS(s)  or  DFS(s);   // one call per component', '}'],
  },
};

function gstate(g, kind, opts) {
  return {
    type: 'graph',
    graph: clone(g),
    kind,
    order: opts.order || 'alpha',
    rep: opts.rep || 'list',
    discovered: [],
    processed: [],
    frontier: [],
    output: [],
    current: null,
    checking: null,
    treeEdges: [],
    components: [],
    starts: [],
  };
}

function scan(t, g, v, rep, order) {
  // Returns neighbours in order and counts the work of finding them.
  if (rep === 'matrix') {
    const vs = sortedVertices(g, order);
    t.count('neighborChecks', vs.length);
    return vs.filter((u) => hasEdge(g, v, u));
  }
  const ns = neighbors(g, v, order);
  t.count('neighborChecks', ns.length);
  return ns;
}

/** opts: {order:'alpha'|'insertion', rep:'list'|'matrix', all:boolean} */
export function traceBFS(g, s, opts = {}) {
  const st = gstate(g, 'bfs', opts);
  const t = new Tracer(st, opts.all ? { ...GRAPH_CODE.bfs, title: 'BFS over the whole graph', lines: GRAPH_CODE.bfs.lines } : GRAPH_CODE.bfs);
  const S = t.state;
  const starts = opts.all ? sortedVertices(g, S.order) : [s];
  for (const src of starts) {
    if (S.discovered.includes(src)) continue;
    if (opts.all) {
      S.starts.push(src);
      S.components.push([]);
    } else S.components.push([]);
    S.discovered.push(src);
    S.frontier.push(src);
    t.step(0, 'discover', `${opts.all && S.starts.length > 1 ? `Vertex ${src} was not reached by the earlier search — start a NEW BFS from it (new component). ` : ''}Discover ${src} and enqueue it. Queue (front→rear): [${S.frontier.join(', ')}].`, { vertex: src });
    while (S.frontier.length) {
      t.count('comparisons');
      const v = S.frontier.shift();
      S.current = v;
      S.output.push(v);
      t.output.push(v);
      S.components[S.components.length - 1].push(v);
      t.count('visits');
      t.step(2, 'output', `Dequeue ${v} and output it. Queue: [${S.frontier.join(', ')}].`, { vertex: v, visit: v });
      const ns = scan(t, S.graph, v, S.rep, S.order);
      for (const u of ns) {
        S.checking = u;
        t.count('comparisons');
        if (!S.discovered.includes(u)) {
          S.discovered.push(u);
          S.frontier.push(u);
          S.treeEdges.push([v, u]);
          t.step(5, 'discover', `Neighbour ${u} is new → discover and enqueue. Queue: [${S.frontier.join(', ')}].`, { vertex: u, edge: [v, u] });
        } else {
          t.step(4, 'check', `Neighbour ${u} ${u === v ? 'is v itself (self-loop)' : 'was already discovered'} → skip.`, { vertex: u, edge: [v, u] });
        }
      }
      S.checking = null;
      S.processed.push(v);
      t.step(8, 'process', `All neighbours of ${v} examined → ${v} is processed.`, { vertex: v });
    }
    S.current = null;
  }
  const unreached = S.graph.vertices.filter((x) => !S.discovered.includes(x));
  const msg = unreached.length ? ` Not reachable from ${s}: ${unreached.join(', ')} (a single BFS explores only one component).` : '';
  return t.finish(`BFS output: ${S.output.join(' ')}.${msg}`, S.output);
}

export function traceDFS(g, s, opts = {}) {
  const st = gstate(g, 'dfs', opts);
  const t = new Tracer(st, GRAPH_CODE.dfs);
  const S = t.state;
  function rec(v, from) {
    t.count('calls');
    S.frontier.push(v);
    S.discovered.push(v);
    S.current = v;
    S.output.push(v);
    t.output.push(v);
    S.components[S.components.length - 1].push(v);
    t.count('visits');
    if (from != null) S.treeEdges.push([from, v]);
    t.step(1, 'discover', `DFS(${v}): discover and output ${v}. Stack (bottom→top): [${S.frontier.join(', ')}].`, { vertex: v, visit: v, edge: from != null ? [from, v] : null });
    const ns = scan(t, S.graph, v, S.rep, S.order);
    for (const u of ns) {
      S.checking = u;
      t.count('comparisons');
      S.current = v;
      if (!S.discovered.includes(u)) {
        t.step(4, 'recurse', `${v}: neighbour ${u} is not discovered → go deeper with DFS(${u}).`, { vertex: u, edge: [v, u] });
        S.checking = null;
        rec(u, v);
        S.current = v;
        t.step(2, 'return', `Back in DFS(${v}) after finishing ${u} (backtracking). Stack: [${S.frontier.join(', ')}].`, { vertex: v });
      } else {
        t.step(3, 'check', `${v}: neighbour ${u} ${u === v ? 'is v itself (self-loop)' : 'already discovered'} → skip.`, { vertex: u, edge: [v, u] });
      }
    }
    S.checking = null;
    S.frontier.pop();
    S.processed.push(v);
    t.step(6, 'process', `${v} has no undiscovered neighbours left → processed; pop it. Stack: [${S.frontier.join(', ')}].`, { vertex: v });
  }
  const starts = opts.all ? sortedVertices(g, S.order) : [s];
  for (const src of starts) {
    if (S.discovered.includes(src)) continue;
    S.components.push([]);
    S.starts.push(src);
    if (opts.all && S.starts.length > 1) t.step(-1, 'info', `${src} was not reached → start a new DFS from ${src} (new component).`, { vertex: src });
    rec(src, null);
  }
  S.current = null;
  const unreached = S.graph.vertices.filter((x) => !S.discovered.includes(x));
  const msg = unreached.length ? ` Not reachable from ${s}: ${unreached.join(', ')}.` : '';
  return t.finish(`DFS output: ${S.output.join(' ')}.${msg}`, S.output);
}

// ---------------------------------------------------------------- lecture graphs
export function lec14Graph() {
  const g = fromEdgeList(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], [
    ['a', 'b'], ['a', 'e'], ['a', 'f'], ['b', 'c'], ['b', 'd'], ['b', 'e'], ['c', 'g'], ['d', 'g'], ['e', 'g'], ['e', 'f'], ['e', 'i'], ['f', 'i'], ['g', 'h'], ['h', 'i'],
  ]);
  g.pos = { a: [0.45, 0.06], b: [0.28, 0.3], c: [0.08, 0.55], d: [0.3, 0.55], e: [0.55, 0.52], f: [0.8, 0.3], g: [0.3, 0.86], h: [0.58, 0.86], i: [0.85, 0.72] };
  g.ref = 'Lec 14 p.4';
  return g;
}

export function lec13Directed() {
  const g = fromEdgeList(['1', '2', '3', '4', '5'], [['1', '2'], ['1', '3'], ['1', '5'], ['2', '3'], ['2', '4'], ['2', '5'], ['3', '4'], ['5', '3'], ['5', '4']], { directed: true });
  g.pos = { 1: [0.5, 0.08], 2: [0.12, 0.42], 3: [0.88, 0.42], 4: [0.28, 0.9], 5: [0.72, 0.9] };
  g.ref = 'Lec 13 p.6 (edges read from the handwritten drawing)';
  return g;
}

export function lec13Weighted() {
  const g = fromEdgeList(['A', 'B', 'C', 'D', 'E', 'F', 'G'], [
    ['A', 'B', 3], ['A', 'C', 6], ['B', 'C', 2], ['B', 'D', 4], ['C', 'D', 1], ['C', 'E', 4], ['C', 'F', 2], ['D', 'E', 2], ['D', 'G', 4], ['E', 'G', 1], ['E', 'F', 2], ['F', 'G', 1],
  ], { weighted: true });
  g.pos = { A: [0.04, 0.55], B: [0.24, 0.1], C: [0.3, 0.55], D: [0.6, 0.1], E: [0.6, 0.52], F: [0.6, 0.92], G: [0.92, 0.5] };
  g.ref = 'Lec 13 p.6';
  return g;
}

export function lec13SelfLoop() {
  // the 3x3 matrix on Lec 13 p.6: 1→1,1→2,1→3, 2→3, 3→2
  const g = fromMatrix(['1', '2', '3'], [[1, 1, 1], [0, 0, 1], [0, 1, 0]], { directed: true });
  g.pos = { 1: [0.2, 0.25], 2: [0.75, 0.2], 3: [0.55, 0.8] };
  g.ref = 'Lec 13 p.6';
  return g;
}

/** Random graph for practice. */
export function randomGraph(rng, { n = 6, density = 0.35, directed = false, weighted = false, selfLoop = false, isolated = false, labels } = {}) {
  const lab = labels || 'ABCDEFGHIJ'.split('').slice(0, n);
  const g = createGraph({ directed, weighted });
  lab.forEach((v) => addVertex(g, v));
  const pool = isolated ? lab.slice(0, -1) : lab;
  // spanning-ish chain so most vertices are connected
  const shuffled = rng.shuffle([...pool]);
  for (let i = 1; i < shuffled.length; i++) {
    const u = shuffled[rng.int(0, i - 1)];
    const v = shuffled[i];
    if (directed && rng.bool()) addEdge(g, v, u, rng.int(1, 9));
    else addEdge(g, u, v, rng.int(1, 9));
  }
  for (const u of pool)
    for (const v of pool) {
      if (u === v) continue;
      if (!directed && cmpLabel(u, v) > 0) continue;
      if (!hasEdge(g, u, v) && rng.next() < density / 2) addEdge(g, u, v, rng.int(1, 9));
    }
  if (selfLoop) {
    const v = rng.pick(pool);
    if (!hasEdge(g, v, v)) addEdge(g, v, v, rng.int(1, 9));
  }
  circleLayout(g);
  return g;
}

export function circleLayout(g) {
  const n = g.vertices.length;
  g.vertices.forEach((v, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    g.pos[v] = [0.5 + 0.4 * Math.cos(a), 0.5 + 0.4 * Math.sin(a)];
  });
  return g;
}

export function ensureLayout(g) {
  if (g.vertices.some((v) => !g.pos[v])) {
    const missing = g.vertices.filter((v) => !g.pos[v]);
    missing.forEach((v, i) => {
      const a = (2 * Math.PI * (i + 0.5)) / Math.max(1, missing.length);
      g.pos[v] = [0.5 + 0.3 * Math.cos(a), 0.5 + 0.3 * Math.sin(a)];
    });
  }
  return g;
}
