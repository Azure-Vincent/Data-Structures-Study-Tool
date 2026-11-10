// implementation: graphs (representations, BFS, DFS). See ./format.js.
//
// The representations run on the Lab's 'arrays' structure: the program builds
// its own adjacency matrix / adjacency lists. The traversals run on the Lab's
// graph G (the example graph a–i); the C++ and Python versions build the
// same graph as an adjacency matrix (setup lines) and use an explicit array
// queue and a visited array, so no library container hides the mechanics.

const DIRECTED_EDGES = [[1, 2], [1, 3], [1, 5], [2, 3], [2, 4], [2, 5], [3, 4], [5, 3], [5, 4]];

const edgeCalls = (indent, end) => DIRECTED_EDGES.map(([u, v], k) => `@e${k + 1}|${indent}add_edge(${u}, ${v})${end}`).join('\n');

const EXAMPLE_CPP_HEAD = `#include <iostream>
using namespace std;

// The example graph. Vertices a … i are numbered 0 … 8; adj is its adjacency matrix.
const int N = 9;
int adj[N][N];                 // adj[u][v] == 1: there is an edge u – v
char name(int v) { return char('a' + v); }   // 0 -> 'a', 1 -> 'b', …
int number(char c) { return c - 'a'; }       // 'a' -> 0, 'b' -> 1, …

// Setup: the edges of the example graph (undirected, so both cells). The Lab already has this graph as G.
@setup|void build() {
@setup|    const char* edges[] = {"ab", "ae", "af", "bc", "bd", "be", "cg", "dg", "eg", "ef", "ei", "fi", "gh", "hi"};
@setup|    for (const char* e : edges) {
@setup|        adj[number(e[0])][number(e[1])] = 1;
@setup|        adj[number(e[1])][number(e[0])] = 1;
@setup|    }
@setup|}`;

const EXAMPLE_PY_HEAD = `# The example graph. Vertices a … i are numbered 0 … 8; adj is its adjacency matrix.
N = 9
adj = [[0] * N for _ in range(N)]   # adj[u][v] == 1: there is an edge u – v

def name(v):                        # 0 -> 'a', 1 -> 'b', …
    return chr(ord('a') + v)

def number(c):                      # 'a' -> 0, 'b' -> 1, …
    return ord(c) - ord('a')

# Setup: the edges of the example graph (undirected, so both cells). The Lab already has this graph as G.
@setup|def build():
@setup|    for e in ["ab", "ae", "af", "bc", "bd", "be", "cg", "dg", "eg", "ef", "ei", "fi", "gh", "hi"]:
@setup|        adj[number(e[0])][number(e[1])] = 1
@setup|        adj[number(e[1])][number(e[0])] = 1`;

const PSEUDO_G = `# G is the example graph and s the start vertex: {{start}}.
# neighbors(G, v) lists the neighbors of v in alphabetical order.`;

const EXAMPLE_CASES = [
  { label: 'From a', setup: { graph: 'example', vars: { s: 'a' } }, params: { s: 'a' } },
  { label: 'From e', setup: { graph: 'example', vars: { s: 'e' } }, params: { s: 'e' } },
];

// ---------------------------------------------------------------- the programs
export const GRAPH_EXAMPLES = [
  {
    id: 'graph-matrix',
    module: 'graph',
    structure: 'arrays',
    title: 'Adjacency matrix of a directed graph',
    intro: 'An N × N table of 0s and 1s: `M[u][v] = 1` means there is an edge u → v. A 2-D array is an array of rows; each row is an array. The vertices are 1 … 5, so vertex v uses row / column v − 1.',
    params: {},
    cases: [{ label: 'Directed graph (1–5)' }],
    pseudo: `# A directed graph with vertices 1 … 5.
@s1|N = 5
@s2|M = new Array(N)                 # N rows…
@s3|for i = 0 to N - 1 do
@s4|    M[i] = new Array(N)          # …each one an array of N cells
@s5|    for j = 0 to N - 1 do
@s6|        M[i][j] = 0              # no edges yet
    end for
end for

@fa|function add_edge(u, v)
@a1|    M[u - 1][v - 1] = 1          # directed: only the cell u -> v
@fa_end|end function

${edgeCalls('', '')}

@p1|for u = 0 to N - 1 do
@p2|    line = (u + 1) + ":"
@p3|    for v = 0 to N - 1 do
@p4|        line = line + " " + M[u][v]
    end for
@p5|    print line
end for`,
    cpp: `#include <iostream>
#include <string>
using namespace std;

// A directed graph with vertices 1 … 5.
@s1|const int N = 5;
@s2|int M[N][N];                     // N rows of N cells, one block of memory

@fa|void add_edge(int u, int v) {
@a1|    M[u - 1][v - 1] = 1;         // directed: only the cell u -> v
@fa_end|}

int main() {
@s3|    for (int i = 0; i < N; i++)
@s4|        // (C++ reserved all rows at once above)
@s5|        for (int j = 0; j < N; j++)
@s6|            M[i][j] = 0;         // no edges yet
${edgeCalls('    ', ';')}
@p1|    for (int u = 0; u < N; u++) {
@p2|        string line = to_string(u + 1) + ":";
@p3|        for (int v = 0; v < N; v++)
@p4|            line = line + " " + to_string(M[u][v]);
@p5|        cout << line << "\\n";
    }
}`,
    py: `# A directed graph with vertices 1 … 5.
@s1|N = 5
@s2|M = [None] * N                   # N rows…
@s3|for i in range(N):
@s4|    M[i] = [None] * N            # …each one a list of N cells
@s5|    for j in range(N):
@s6|        M[i][j] = 0              # no edges yet

@fa,fa_end|def add_edge(u, v):
@a1|    M[u - 1][v - 1] = 1          # directed: only the cell u -> v

${edgeCalls('', '')}

@p1|for u in range(N):
@p2|    line = str(u + 1) + ":"
@p3|    for v in range(N):
@p4|        line = line + " " + str(M[u][v])
@p5|    print(line)`,
    notes: {
      s2: '**A 2-D array.** C++ `int M[N][N]` is one block of N × N ints, row after row. Python and the pseudocode build a list/array of rows, each row its own list/array — `M[i][j]` first picks row i, then cell j in it.',
      s6: 'Every cell starts at 0: no edges. A matrix has a cell for every PAIR of vertices, whether the edge exists or not.',
      a1: '**Directed edge.** Only row u, column v changes. For an UNDIRECTED graph also set `M[v - 1][u - 1] = 1`: the matrix is then symmetric.',
      e1: 'Edge 1 → 2: row 1 (index 0), column 2 (index 1).',
      p2: 'Build one output line per row. Each language turns the number into text differently: C++ `to_string`, Python `str`, the pseudocode converts automatically.',
      p4: 'Row u lists the edges that LEAVE vertex u + 1 (its out-neighbors); column v would list the edges that ENTER vertex v + 1.',
    },
    blanks: [
      {
        label: 'a1',
        why: 'The edge u → v sets row u, column v (shifted by one, because the vertices start at 1).',
        wrong: [
          { cpp: 'M[v - 1][u - 1] = 1;', py: 'M[v - 1][u - 1] = 1', pseudo: 'M[v - 1][u - 1] = 1', why: 'That stores the edge in the opposite direction, v → u.', tag: 'matrix-direction' },
          { cpp: 'M[u][v] = 1;', py: 'M[u][v] = 1', pseudo: 'M[u][v] = 1', why: 'Rows and columns are numbered from 0: vertex 5 would need index 5, which is outside the array.', tag: 'array-base' },
        ],
      },
    ],
  },
  {
    id: 'graph-adjlist',
    module: 'graph',
    structure: 'arrays',
    title: 'Adjacency lists built from linked nodes',
    intro: 'One linked list per vertex. `head[i]` holds the first node of vertex i + 1’s list; each node stores one neighbor. Adding an edge u → v is an insertion at the end of u’s list, exactly as in a singly linked list. Only the edges that exist take memory.',
    params: {},
    cases: [{ label: 'Directed graph (1–5)' }],
    pseudo: `# A directed graph with vertices 1 … 5. Nodes have the fields data and next.
@s1|N = 5
@s2|head = new Array(N)              # head[i]: first node of vertex i+1's list (NULL = no neighbors)
@s3|for i = 0 to N - 1 do
@s4|    head[i] = NULL
end for

@fa|function add_edge(u, v)
@a1|    new_node = new Node(v)        # one node per edge: it stores the neighbor v
@a2|    if head[u - 1] == NULL then
@a3|        head[u - 1] = new_node    # u's first neighbor
    else
@a4|        p = head[u - 1]
@a5|        while p.next != NULL do
@a6|            p = p.next           # walk to the last node of u's list
        end while
@a7|        p.next = new_node         # insertion at the end of u's list
    end if
@fa_end|end function

${edgeCalls('', '')}

@p1|for u = 0 to N - 1 do
@p2|    line = "" + (u + 1)          # the vertex number as text
@p3|    p = head[u]
@p4|    while p != NULL do
@p5|        line = line + " -> " + p.data
@p6|        p = p.next
    end while
@p7|    print line + " -> NULL"
end for`,
    cpp: `#include <iostream>
#include <string>
using namespace std;

struct Node {
    int data;                    // the neighbor
    Node* next;
};

// A directed graph with vertices 1 … 5.
@s1|const int N = 5;
@s2|Node* head[N];                   // head[i]: first node of vertex i+1's list (nullptr = no neighbors)

@fa|void add_edge(int u, int v) {
@a1|    Node* new_node = new Node{v, nullptr};   // one node per edge: it stores the neighbor v
@a2|    if (head[u - 1] == nullptr)
@a3|        head[u - 1] = new_node;   // u's first neighbor
    else {
@a4|        Node* p = head[u - 1];
@a5|        while (p->next != nullptr)
@a6|            p = p->next;         // walk to the last node of u's list
@a7|        p->next = new_node;       // insertion at the end of u's list
    }
@fa_end|}

// Clean-up: every list's nodes go back to the system.
@setup|void destroyLists() {
@setup|    for (int i = 0; i < N; i++)
@setup|        while (head[i] != nullptr) {
@setup|            Node* rest = head[i]->next;
@setup|            delete head[i];
@setup|            head[i] = rest;
@setup|        }
@setup|}

int main() {
@s3|    for (int i = 0; i < N; i++)
@s4|        head[i] = nullptr;
${edgeCalls('    ', ';')}
@p1|    for (int u = 0; u < N; u++) {
@p2|        string line = to_string(u + 1);   // the vertex number as text
@p3|        Node* p = head[u];
@p4|        while (p != nullptr) {
@p5|            line = line + " -> " + to_string(p->data);
@p6|            p = p->next;
        }
@p7|        cout << line << " -> NULL\\n";
    }
@setup|    destroyLists();
}`,
    py: `class Node:
    def __init__(self, data):
        self.data = data         # the neighbor
        self.next = None

# A directed graph with vertices 1 … 5.
@s1|N = 5
@s2|head = [None] * N                # head[i]: first node of vertex i+1's list (None = no neighbors)
@s3|for i in range(N):
@s4|    head[i] = None

@fa,fa_end|def add_edge(u, v):
@a1|    new_node = Node(v)            # one node per edge: it stores the neighbor v
@a2|    if head[u - 1] is None:
@a3|        head[u - 1] = new_node    # u's first neighbor
    else:
@a4|        p = head[u - 1]
@a5|        while p.next is not None:
@a6|            p = p.next           # walk to the last node of u's list
@a7|        p.next = new_node         # insertion at the end of u's list

${edgeCalls('', '')}

@p1|for u in range(N):
@p2|    line = str(u + 1)            # the vertex number as text
@p3|    p = head[u]
@p4|    while p is not None:
@p5|        line = line + " -> " + str(p.data)
@p6|        p = p.next
@p7|    print(line + " -> NULL")`,
    notes: {
      s2: '**An array of list heads.** Each slot plays the role of `start` for one vertex’s linked list. The diagram draws every slot with its chain of nodes.',
      a1: '**Allocation.** One node per edge, holding the neighbor’s number.',
      a2: 'Edge case: the vertex has no neighbors yet (empty list).',
      a5: 'Walk to the last node, as in insert at the end of a singly linked list.',
      a7: '**Link change.** The new neighbor is appended, so each list keeps the order in which the edges were added (ascending here).',
      p3: 'Traverse vertex u + 1’s list: these are exactly the edges that leave it.',
      p7: 'Vertex 4 has no outgoing edges: its list is empty (head[3] stays NULL).',
    },
    blanks: [
      {
        label: 'a7',
        why: 'The new node goes after the last node of u’s list.',
        wrong: [
          { cpp: 'p = new_node;', py: 'p = new_node', pseudo: 'p = new_node', why: 'That only moves the local variable p; the list does not change and the node is lost.', tag: 'value-vs-address' },
          { cpp: 'head[u - 1] = new_node;', py: 'head[u - 1] = new_node', pseudo: 'head[u - 1] = new_node', why: 'That replaces the whole list with the new node — the other neighbors are lost.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'graph-bfs',
    module: 'graph',
    structure: 'graph',
    title: 'Breadth-first search with a queue',
    intro: 'BFS visits the start vertex, then all of its neighbors, then THEIR undiscovered neighbors, and so on — ring by ring. A queue holds the discovered vertices that still have to be processed, and a vertex is marked as discovered when it ENTERS the queue, so it can never be queued twice.',
    params: { s: 'a' },
    cases: EXAMPLE_CASES,
    pseudo: `${PSEUDO_G}
@v1|visited = new Set()              # the discovered vertices
@v2|q = new Queue()

@fb|function bfs(s)
@b1|    add(visited, s)              # mark s discovered…
@b2|    enqueue(q, s)                # …and queue it
@b3|    while not isEmpty(q) do
@b4|        v = dequeue(q)           # the oldest discovered vertex
@b5|        print v
@b6|        for each u in neighbors(G, v) do
@b7|            if not contains(visited, u) then
@b8|                add(visited, u)
@b9|                enqueue(q, u)
            end if
        end for
    end while
@fb_end|end function

@m1|bfs(s)`,
    cpp: `${EXAMPLE_CPP_HEAD}

@v1|bool visited[N];               // visited[v]: v has been discovered (all false at the start)
@v2|int Q[N];                      // the queue: an array with the indices front and rear;
@v2|int front = 0, rear = 0;       // every vertex enters at most once, so N slots are enough

@fb|void bfs(int s) {
@b1|    visited[s] = true;                  // mark s discovered…
@b2|    Q[rear] = s; rear = rear + 1;       // …and queue it
@b3|    while (front != rear) {             // the queue is not empty
@b4|        int v = Q[front]; front = front + 1;   // dequeue the oldest discovered vertex
@b5|        cout << name(v) << "\\n";
@b6|        for (int u = 0; u < N; u++) {   // neighbors in alphabetical order:
@b6|            if (adj[v][u] == 0) continue;   // u is not a neighbor of v
@b7|            if (!visited[u]) {
@b8|                visited[u] = true;
@b9|                Q[rear] = u; rear = rear + 1;   // enqueue(u)
            }
        }
    }
@fb_end|}

int main() {
@setup|    build();
@m1|    bfs(number('{{s}}'));
}`,
    py: `${EXAMPLE_PY_HEAD}

@v1|visited = [False] * N           # visited[v]: v has been discovered
@v2|Q = [0] * N                     # the queue: a fixed list with the indices front and rear;
@v2|front = 0                       # every vertex enters at most once, so N slots are enough
@v2|rear = 0

@fb,fb_end|def bfs(s):
    global front, rear
@b1|    visited[s] = True           # mark s discovered…
@b2|    Q[rear] = s                 # …and queue it
@b2|    rear = rear + 1
@b3|    while front != rear:        # the queue is not empty
@b4|        v = Q[front]            # dequeue the oldest discovered vertex
@b4|        front = front + 1
@b5|        print(name(v))
@b6|        for u in range(N):      # neighbors in alphabetical order:
@b6|            if adj[v][u] == 0:  # u is not a neighbor of v
@b6|                continue
@b7|            if not visited[u]:
@b8|                visited[u] = True
@b9|                Q[rear] = u     # enqueue(u)
@b9|                rear = rear + 1

@setup|build()
@m1|bfs(number('{{s}}'))`,
    notes: {
      v1: '**Discovered vertices.** The pseudocode uses the Lab’s Set; C++ and Python use one true/false entry per vertex number — the same information.',
      v2: '**The queue.** The pseudocode uses the Lab’s Queue; C++ and Python write out an array queue in full (front = index of the front item, rear = next free slot).',
      b1: 'Mark the start vertex as discovered BEFORE it waits in the queue.',
      b3: 'Repeat until no discovered vertex is waiting.',
      b4: 'Take the vertex at the FRONT: the one discovered earliest. This is what makes BFS go ring by ring.',
      b5: 'Output order = the order in which vertices leave the queue.',
      b6: 'Look at v’s neighbors in alphabetical order (when several vertices could come next, this order decides which comes first; the worked examples use it). C++ and Python scan row v of the adjacency matrix.',
      b7: 'Already discovered (in the queue or already printed)? Then skip it. Without this check, cycles would queue vertices again and again.',
      b8: 'Mark u at the moment it is discovered — not when it is printed — so it cannot be queued twice.',
      b9: 'u waits behind the vertices discovered before it.',
    },
    blanks: [
      {
        label: 'b8',
        why: 'A vertex is marked as soon as it is discovered, before it is queued.',
        wrong: [
          { cpp: 'visited[v] = true;', py: 'visited[v] = True', pseudo: 'add(visited, v)', why: 'v is already marked; u stays unmarked and can be queued again by another neighbor.', tag: 'bfs-dfs-confusion' },
        ],
      },
      {
        label: 'b7',
        why: 'Only undiscovered neighbors join the queue.',
        wrong: [
          { cpp: 'if (visited[u]) {', py: 'if visited[u]:', pseudo: 'if contains(visited, u) then', why: 'That queues only vertices that were already discovered — the search never spreads beyond s.', tag: 'wrong-result' },
        ],
      },
    ],
  },
  {
    id: 'graph-dfs',
    module: 'graph',
    structure: 'graph',
    title: 'Depth-first search with recursion',
    intro: 'DFS goes as deep as possible along the first undiscovered neighbor, and BACKTRACKS when a vertex has no undiscovered neighbors left. The recursion’s call stack is the DFS stack: each running call is a vertex whose neighbors are still being examined.',
    params: { s: 'a' },
    cases: EXAMPLE_CASES,
    pseudo: `${PSEUDO_G}
@v1|visited = new Set()              # the discovered vertices

@fd|function dfs(v)
@d1|    add(visited, v)              # discovered
@d2|    print v
@d3|    for each u in neighbors(G, v) do
@d4|        if not contains(visited, u) then
@d5|            dfs(u)               # go deeper; continue here when it returns
        end if
    end for
@fd_end|end function                     # all neighbors done: backtrack

@m1|dfs(s)`,
    cpp: `${EXAMPLE_CPP_HEAD}

@v1|bool visited[N];               // visited[v]: v has been discovered (all false at the start)

@fd|void dfs(int v) {
@d1|    visited[v] = true;                  // discovered
@d2|    cout << name(v) << "\\n";
@d3|    for (int u = 0; u < N; u++) {       // neighbors in alphabetical order:
@d3|        if (adj[v][u] == 0) continue;   // u is not a neighbor of v
@d4|        if (!visited[u])
@d5|            dfs(u);                     // go deeper; continue here when it returns
    }
@fd_end|}                                       // all neighbors done: backtrack

int main() {
@setup|    build();
@m1|    dfs(number('{{s}}'));
}`,
    py: `${EXAMPLE_PY_HEAD}

@v1|visited = [False] * N           # visited[v]: v has been discovered

@fd,fd_end|def dfs(v):
@d1|    visited[v] = True           # discovered
@d2|    print(name(v))
@d3|    for u in range(N):          # neighbors in alphabetical order:
@d3|        if adj[v][u] == 0:      # u is not a neighbor of v
@d3|            continue
@d4|        if not visited[u]:
@d5|            dfs(u)              # go deeper; continue here when it returns

@setup|build()
@m1|dfs(number('{{s}}'))`,
    notes: {
      v1: '**Discovered vertices.** The Lab’s Set in the pseudocode; a true/false array in C++ and Python.',
      d1: 'Mark v as discovered as soon as the call starts…',
      d2: '…and output it: DFS prints a vertex when it is first reached.',
      d3: 'Examine v’s neighbors in alphabetical order (C++/Python: scan row v of the adjacency matrix).',
      d4: 'Skip neighbors that are already discovered — this is what stops DFS from running around a cycle forever.',
      d5: '**Go deeper.** A new call starts for u (a new frame on the call stack). When it returns, this loop continues with v’s next neighbor.',
      fd_end: '**Backtrack.** v has no undiscovered neighbors left: v is processed, its frame is removed, and the caller continues.',
    },
    blanks: [
      {
        label: 'd4',
        why: 'Only undiscovered neighbors are visited.',
        wrong: [
          { cpp: 'if (visited[u])', py: 'if visited[u]:', pseudo: 'if contains(visited, u) then', why: 'That only revisits vertices already seen — on a cycle it recurses forever.', tag: 'infinite-loop' },
        ],
      },
      {
        label: 'd1',
        why: 'The vertex is marked when the call starts.',
        wrong: [
          { cpp: 'visited[u] = true;', py: 'visited[u] = True', pseudo: 'add(visited, u)', why: 'u is not defined yet here; v must be marked or a cycle leads back to it.', tag: 'infinite-loop' },
        ],
      },
    ],
  },
];
