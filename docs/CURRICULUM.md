# Curriculum

DS Study Lab is organized as seven learning modules. The modules build on each
other and are intended to be studied in order; every module combines
explanations, visualizations, step-by-step algorithm execution, pseudocode,
C++ implementation and exercises, and ends with the progression
*predict the output → complete the code → write the pseudocode*.

| # | Module | Steps | Parts |
|---|---|---|---|
| 1 | Memory Management and Pointer Fundamentals | 23 | — |
| 2 | Singly Linked Lists | 79 | Nodes, creation and insertion · Deletion and traversal · Circular singly linked lists |
| 3 | Doubly Linked Lists | 33 | — |
| 4 | Stack Data Structures | 16 | — |
| 5 | Queue Data Structures | 17 | — |
| 6 | Tree Data Structures | 39 | Terminology and representation · Tree traversals |
| 7 | Graph Data Structures | 30 | Graph representation · Graph traversal |

The module definitions are in `app/js/content/concepts.js` (`MODULES`), the
module content in `app/js/content/lessons.js`.

## Supporting sections

Every step of a module is labeled with the kind of work it asks for:

| Section | Steps of this kind |
|---|---|
| Conceptual Foundations | explanations; classification exercises |
| Data Structure Representation | array and linked representations, matrix and list conversions, tree and graph editors |
| Memory Visualization | where memory lives, pointers and dynamic allocation |
| Algorithm Execution | simulations that pause for predictions; rearranging pointers by hand |
| Algorithm Tracing | stepping through code; predicting states and traversal orders |
| Pseudocode Interpretation | predicting everything a complete program outputs |
| Pseudocode Construction | arranging steps, completing code, writing the operation in pseudocode |
| C++ Implementation | complete programs in C++ (with equivalent Python and pseudocode) |
| Error Identification and Debugging | finding the error in a given implementation |
| Application and Problem Solving | selecting a suitable data structure |
| Technical Note, Terminology, Prerequisite, Extension, Common Errors and Edge Cases | callouts |

Two further sections work across all modules: **Knowledge Assessment**
(exercises from one module or from all modules, without hints or worked steps)
and **Cumulative Review** (spaced review of every pseudocode operation).

## Content of each module

### 1. Memory Management and Pointer Fundamentals
Primitive and non-primitive data types; linear and nonlinear structures;
contiguous and non-contiguous memory and address calculation; pointers,
`malloc`/`free`, `new`/`delete` and garbage collection; storage locations;
memory leaks and dangling pointers; arrays and linked lists compared; arrays
with insertion and deletion by shifting.
Programs: `array-shift`. Pseudocode exercises: `array-insert`, `array-delete`.

### 2. Singly Linked Lists
Nodes with data and next fields, the head pointer, `create_node()` and
`create_list()`; insertion at the beginning, at the end and at a position
(validating the position before allocating, the lost-access error);
deletion at the beginning, at the end and at a position (save, relink,
release; the single-node case); traversal. Circular singly linked lists:
one-pass traversal with do-while, insertion and deletion including the empty
and single-node cases.
Programs: `sll-create`, `sll-insert-beg`, `sll-insert-end`, `sll-insert-pos`,
`sll-delete-beg`, `sll-delete-end`, `sll-delete-pos`, `csll-create`,
`csll-insert-beg`, `csll-insert-end`, `csll-delete-beg`, `csll-delete-end`.

### 3. Doubly Linked Lists
Nodes with prev, data and next; the invariant `A->next == B` and
`B->prev == A`; insertion (three or four pointer assignments) and deletion in
both directions, including single-node lists; forward and backward traversal;
recursive `count_nodes()` and the call stack.
Programs: `dll-create`, `dll-insert-beg`, `dll-insert-end`, `dll-insert-pos`,
`dll-delete-beg`, `dll-delete-end`, `dll-delete-pos`, `dll-countnode`.

### 4. Stack Data Structures
LIFO access; push, pop and peek; overflow and underflow; array stacks under
the count convention (top = number of items) and the index convention
(top = index of the top item); linked stacks with the top at the head or at
the tail.
Programs: `stack-array`, `stack-linked`, `stack-linked-end`.

### 5. Queue Data Structures
FIFO access; enqueue, dequeue and front; linear array queues (front and rear
indices, unusable positions), circular array queues (extension) and linked
queues (rear becomes NULL with the final dequeue).
Programs: `queue-array`, `queue-linked`.

### 6. Tree Data Structures
Root, parent, child, leaf, path, siblings, ancestors and descendants; level,
depth and height (counted in edges); node-count formulas; full, perfect and
complete binary trees; array and linked representations. Traversals:
preorder, inorder and postorder (recursive), and inorder with an explicit
stack.
Programs: `tree-create`, `tree-array`, `tree-traversals`, `tree-inorder-stack`.

### 7. Graph Data Structures
Vertices, edges, directed, undirected and weighted graphs, degree, paths and
cycles; adjacency matrix and adjacency list. Traversal: depth-first search
(recursion) and breadth-first search (queue), discovered/processed vertices
and the frontier, connected components and traversal of the whole graph, and
why BFS minimizes the number of edges rather than the total weight.
Programs: `graph-matrix`, `graph-adjlist`, `graph-dfs`, `graph-bfs`.

## Technical notes

Where a common simplification or a frequent implementation error needs
attention, the modules contain a **Technical Note**. They cover: storage
location versus structure type; deletion versus resizing of arrays; building a
list at the front or at the end; validating a position before allocating and
the valid range for insertion; the single-node case of deletion at the end
(singly, doubly and circular lists) and at the beginning (doubly linked
lists); the loop condition for appending to a circular list; releasing the
node in circular deletion; depth and height conventions; the edge count of a
tree; alternative names for tree shapes; discovery order versus distance in a
traversal tree; and BFS versus minimum-weight paths.

## Conventions

The pseudocode conventions (assignment and comparison, NULL, explicit block
ends, four-space indentation, functions and parameters) are described in
`docs/PSEUDOCODE.md` and in Module 1, section “Code conventions”. Identifiers
are the same in every language: `head`, `temp`, `prev`, `new_node`,
`create_node()`, `node_count`, `count_nodes()`, `insert_at_beginning`,
`insert_at_position`, `insert_at_end`, `delete_at_beginning`,
`delete_at_position`, `delete_at_end`, `top`, `front`, `rear`, `root`.

## Progress from earlier versions

Saved progress is migrated automatically (`app/js/progress/migrate.js`,
content version 3): every completed step keeps its stable key and is counted
in the module that now contains it, practice sessions and records refer to
modules, review topics become the matching modules, and saved pseudocode
drafts for lists use `head`. Links of the form `#/lesson/<n>/<step>` open the
same step in its module.
