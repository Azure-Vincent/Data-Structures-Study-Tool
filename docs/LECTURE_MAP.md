# Lecture map: what the app takes from each PDF page

Every lesson section shows its source (for example “Lec 08 p.6–7”). Material that is not in the notes is labelled **Supplementary** in the app.

## Lecture 07 — Introduction (4 pages)
| Page | Content in the notes | Where it is in the app |
|---|---|---|
| p.1 | Primitive vs non-primitive structures; linear (stacks, queues) vs non-linear (graphs, trees); contiguous vs non-contiguous | Lesson 07 §1–2, template `l07-classify`, `l07-address` |
| p.2 | Array disadvantages; `malloc`, `free`, `(int *) malloc(100 * sizeof(int))` | Lesson 07 code section (C, C++, pseudocode), `l07-malloc`, `l07-membug` |
| p.3 | Advantages / disadvantages of linked lists | Lesson 07 trade-off table, `l07-choose`, `l07-reach` |
| p.4 | Array vs linked list table | Trade-off table, `l07-shifts`, `l07-storage` |

**Clarifications:** “deleting from an array is not possible” → deleting is possible by shifting; *resizing* is not. “Array: stack / list: heap” → storage location depends on how memory is obtained (local, global, malloc), not on the structure type.

## Lecture 08 — Singly linked lists 1 (7 pages)
| Page | Content | App |
|---|---|---|
| p.1 | Applications; node = data + next; `start`; NULL drawn as X; `struct slinklist`; empty list | Anatomy section, terminology note |
| p.2 | `getnode()`; creation steps | Code section; creation note |
| p.3 | `creatlist(n)` (appends by walking) | Worked example; `l08-cost` (creatlist moves = (n−1)(n−2)/2) |
| p.4 | Insert at beginning (1) newnode→next = start, (2) start = newnode | Simulation with predictions; rewire exercise |
| p.5 | Insert at end | Simulation; `l08-fill` |
| p.6–7 | Insert in the middle with `temp`/`prev`, `pos`, `nodectr` | Required example 10→20→30 insert 15; lost-access bug demo |

**Clarifications:** the prose on p.2 prepends while the code on p.3 appends; `insert_at_mid` allocates before validating (leak on bad `pos`) and uses `pos < nodectr`, which wrongly rejects inserting just before the last node (`pos <= nodectr` is correct for insertion).

## Lecture 09 — Singly linked lists 2 (5 pages)
| Page | Content | App |
|---|---|---|
| p.1 | Delete at beginning: temp = start; start = start→next; free(temp) | Simulation; rewire exercise |
| p.2 | Delete at end with temp/prev | Simulation; notes-exact version on a one-node list |
| p.3–4 | Delete at intermediate position, `pos > 1 && pos < nodectr` | Required “delete 20”; `l09-valid-pos` |
| p.5 | Traversal | Simulation; `l09-traverse-predict` |

**Clarification:** `delete_at_last` on a one-node list frees the node but leaves `start` dangling — add `start = NULL`.

## Lecture 10 — Doubly linked lists (7 pages)
p.1 node `left | data | right` (left = prev, right = next) · p.2 creation · p.3 insert at beginning (3 steps) and end · p.4 insert in the middle (4 links) · p.5 delete at beginning / end · p.6 delete in the middle · p.7 traversal and recursive `countnode`.

**Clarifications:** delete-at-beginning and delete-at-end crash on a one-node list (`start->left` / `temp->left->right` dereference NULL). Backward traversal is supplementary but uses only the lecture’s left links.

## Lecture 11 — Circular singly linked lists (4 pages)
p.1 circle, creation · p.2 insert at beginning (find `last`) and end · p.3 delete at beginning and end · p.4 do-while traversal.

**Clarifications:** the creation loop `while (temp->next != NULL)` never ends once the circle is closed; delete-at-beginning never calls `free(temp)`; delete-at-end leaves `start` dangling for a one-node list.

## Lecture 12 — Stacks and queues (6 pages)
p.1 LIFO, push/pop, Top pictures · p.2–4 array stack code (`top = 0`, `stack[top] = data; ++top`, `stack[--top]`), menu/main, linked stack pushing/popping at the END · p.5 queue, FIFO, F and R pictures · p.6 InsertQ/DeletQ, linked queue with front and rear.

**Exact meanings used by the app:** notes’ array `top` = next free index = number of items; index-style `top` = index of the top item (supplementary); linked `top` = pointer to the top node; array `R` = next free slot; linked `rear` = pointer to the last node.

## Lecture 13 — Trees and graphs (6 pages)
p.1 linear vs non-linear; tree definition · p.2 binary tree, leaf/internal, path, siblings, ancestor/descendant, subtree · p.3 level, height, depth, properties ①–④ · p.4 strictly binary, full, complete (numbering) · p.5 array (0-based picture) and linked representation · p.6 directed graph + matrix, weighted undirected graph + matrix with ∞, self-loop, matrix → adjacency list.

**Clarifications:** notes’ depth counts nodes (= level + 1; most books count edges); notes’ “full” = most books’ “perfect”, notes’ “strictly binary” = most books’ “full/proper”; n − 1 edges holds for every tree. The directed graph’s edges were read from the handwritten drawing (1→2, 1→3, 1→5, 2→3, 2→4, 2→5, 3→4, 5→3, 5→4); row 1 of its matrix matches the notes exactly.

## Lecture 14 — Traversals (4 pages)
p.1 preorder (A B D E C F G), inorder (D B E A F C G) with stack pictures · p.2 postorder (D E B F G C A), DFS with backtracking arrows · p.3 BFS; DFS and BFS trees · p.4 graph a–i: DFS a b c g d e f i h, BFS a b e f c d g i h.

**Clarifications:** both orders on p.4 are reproduced with ascending neighbour order, which the app always states before grading; the numbers on the p.3 trees are edge-discovery order, not distances (e is 1 edge from a).
