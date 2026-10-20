# Pseudocode Lab — language and feedback reference

The Pseudocode Lab (sidebar → **Tools → Pseudocode Lab**, route `#/lab`) runs pseudocode you write on a
simulated heap and shows every step: the current line, the structure diagram, all variables and the
call stack, collections, output and the full execution history.

The program is parsed by a real parser (`app/js/lab/lang.js`) and executed by a small interpreter
(`app/js/lab/machine.js`). Nothing you type is ever evaluated as JavaScript. Every run stops after
an instruction limit, so an endless loop cannot freeze the app.

---

## 1. Program shape

- One statement per line. A `;` can also separate statements.
- Blocks open with `then` / `do` at the **end** of a line and close with `end` on its own line.
  `end if`, `end while`, `end for`, `end function`, `endif`, `endwhile` … are accepted too, and
  are checked against the block they close.
- Comments start with `#` or `//`.
- Keywords are not case-sensitive (`IF`, `While`, `NULL`, `null`, `nil`); variable names are.
- Indentation is for people, not for the parser. **Tidy indentation** re-indents by block structure.

## 2. Values

| Value | Written as |
|---|---|
| numbers | `0`, `15`, `-3`, `2.5` — `/` on two whole numbers gives a whole number (`7 / 2` is `3`), and so does `div` (`7 div 2` is `3`); `mod` or `%` is the remainder |
| text | `"a"` or `'a'` — graph vertex labels, tree letters, messages. `+` joins text with text or numbers: `"row " + 1` is `"row 1"` |
| booleans | `true`, `false` |
| the empty pointer | `NULL` (also `null`, `nil`) |
| a pointer to a node | what `new Node(…)` returns, or what `p.next` holds |
| collections | `new Queue()`, `new Stack()`, `new Set()`, `new Array(n)`, `[1, 2, 3]` |

## 3. Statements

| Statement | Meaning |
|---|---|
| `x = expr` | Assign (also `x := expr`, `x ← expr`). A variable exists from its first assignment; there are no types or declarations. `x += e` and `x -= e` work too. |
| `p.next = q` | **Pointer change** — the `next` field of the node `p` points to now holds `q`'s address. `p->next` is the same. |
| `p.data = 7` | **Value change** — the node keeps its address and links. |
| `p = p.next` | **Traversal** — only the variable `p` moves; no node changes. |
| `p = new Node(15)` | **Node creation** — a node with data 15 and every link `NULL`, at the next free simulated address. |
| `delete p` / `free(p)` | **Deletion** — the node is freed. Every pointer still holding its address is now dangling. |
| `print a, b` | Appends one line of output. `print(a, b)` also works. |
| `if c then … else if c2 then … else … end` | `elif` / `elseif` also work. `then` is required. |
| `while c do … end` | Loop while `c` is true. `do` is required. |
| `for i = 1 to n do … end` | Inclusive count; `step k` changes the step (it may be negative). |
| `for each x in coll do … end` | Loop over an array, queue, stack or set (a copy of its items when the loop starts). |
| `repeat … until c` | Body first; stops when `c` is true. |
| `do … while c` | Body first; repeats while `c` is true (C's `do { } while`). The closing `while c` has **no** `do`. |
| `break`, `continue` | Leave the loop / start its next round. |
| `function f(a, b) … end` | Define a function (top level only). `return expr` or plain `return`. |
| `f(x)` | Call a function on its own line. |

Conditions use `== != < <= > >=`, `and`, `or`, `not` (also `&&`, `||`, `!`). `and` and `or` stop
early, so `p != NULL and p.data == 5` never follows a NULL pointer. In conditions, `NULL` and `0`
are false and any node is true. Comparisons can't be chained (`a < b < c`).

### Comparing pointers

`p == q` asks *is it the same node?* — it compares addresses, never data. Comparing a node with a
value (`p == 10`) is reported as an error, because that confusion is one of the commonest bugs;
write `p.data == 10`.

## 4. Nodes and structures

Each structure fixes the fields its nodes have and the variables that hold it:

| Structure | Node fields | Pointer variables |
|---|---|---|
| Singly linked list | `data`, `next` | `start` |
| Doubly linked list | `data`, `left`, `right` (`prev` = left, `next` = right) | `start` |
| Circular linked list | `data`, `next` (last node → start) | `start` |
| Stack (linked) | `data`, `next` (first node is the top) | `top` |
| Queue (linked) | `data`, `next` | `front`, `rear` |
| Binary tree | `data`, `left`, `right` | `root` |
| Graph | — | `G` (the graph, read-only), `s` (start vertex) |
| Arrays only | `data`, `next` (if the program creates nodes) | none — the program creates its own arrays with `new Array(n)` |

**Arrays.** `new Array(n)` makes `n` slots (numbered from 0) holding `NULL`. A slot can hold a
number, text, a node's address or another array, so a 2-D array (a matrix) is an array of rows:
`M[i] = new Array(N)`, then `M[i][j] = 0`. The diagram draws an array of arrays as a table and an
array whose slots hold first nodes (adjacency lists) as chains of nodes. The **Arrays only**
structure is for programs that start with no nodes at all: the array, the array stack and queue,
the tree stored in an array and the adjacency matrix. A test or setup can give such a program its
input variables (for example `pos` and `x`).

**Addresses.** Nodes are numbered `@100`, `@200`, … in creation order and an address is never
reused, even after `delete`. That way a node's identity is stable, and a value change looks
different from a pointer change.

## 5. Functions and scope

- Parameters are **copies** (like C). Changing a parameter inside a function does not change the
  caller's variable. To change the caller's pointer, return the new value:
  `start = insertFront(start, 5)`.
- Inside a function, reading a name looks at the function's own variables first, then the global
  (top-level) ones. Assigning to a name that already exists globally updates the global (like a
  C global such as `start`). Any other assignment creates a local variable.
- Recursion is allowed up to 100 nested calls.
- Your own function may use the name of a built-in helper (for example your own `push(value)` for
  an array stack); inside the program your function is the one that runs.

## 6. Built-in helpers

| Call | Works on | Result |
|---|---|---|
| `enqueue(q, x)`, `dequeue(q)` | Queue | first in, first out |
| `push(s, x)`, `pop(s)` | Stack | last in, first out |
| `peek(c)` | Stack / Queue | top / front without removing |
| `add(set, x)`, `contains(c, x)`, `remove(set, x)` | Set (contains also works on any collection) | |
| `append(a, x)`, `a[i]`, `a[i] = x` | Array (0-based) | |
| `isEmpty(c)`, `size(c)` (`length(c)`) | any collection | |
| `neighbors(G, v)` | Graph | the neighbours of `v` in ascending order (as an array) |
| `vertices(G)`, `degree(G, v)`, `hasEdge(G, u, v)` | Graph | |
| `abs(x)`, `min(a, b)`, `max(a, b)` | numbers | |

The built-in Queue, Stack and Set are helpers for graph and tree traversals. The **linked** stack
and queue structures are made of nodes, and you change them with pointer assignments.

## 7. Feedback

Problems are shown in three categories:

| Category | Stops the run? | Examples |
|---|---|---|
| **Syntax error** | can't start | missing `then`/`do`/`end`, `=` used in a condition, braces, a type like `int x`, `x++`, an unclosed string, a stray `end` |
| **Runtime error** | yes, on that line | following `NULL` (`cur.next` when `cur` is NULL); using a deleted node; using a variable before assigning it (with a "did you mean" suggestion); deleting a node twice; storing a number in a link; comparing a node with a value; arithmetic on pointers; an unknown field (e.g. `prev` in a singly linked list); underflow of a built-in queue/stack; an endless loop hitting the instruction limit; runaway recursion |
| **Logic warning** | no | a node becomes **unreachable** (named, with exactly which reference changed); at the end: an unintended cycle, a broken link into deleted memory, a broken back link in a doubly linked list, a circle that is not closed, `rear` not on the last node, a structure pointer left dangling, leaked nodes |

Temporary states are allowed. A new node held only by `newnode`, or a node held only by `temp`
while you rewire, is not a problem. Deleting a node that is still linked, or creating a
temporary cycle, produces only a **note**. It becomes a warning if it is still there when the
program ends. Only a node that nothing can reach any more is flagged right away: it can never be
recovered.

Every problem links to the step where it happened. You can **Go to this step**, **Undo this
step** (step back to just before it), or open **Show before / after** to see the two diagrams side
by side. Editing the code resets the run, so the picture always matches the code.

### Guided exercises vs free experiments

- **Guided exercises** state a goal and are checked against several test cases, including empty
  and single-node structures. Each test starts from a fresh copy of its structure. The check
  compares the real final state — the list or tree, the output, named variables, which nodes were
  deleted — and adds any structural problems. Three progressive hints come before the reference
  solution can be revealed, and revealing it means the attempt doesn't count as independent.
  Results are saved to your progress like other exercises (type "Pseudocode Lab").
- In **free experiment** mode you choose or build the starting structure (values, a level-order
  tree with `-` for gaps, or one of the lecture graphs). The lab still reports errors and
  structural problems. Without a goal it can't know whether the result is the one you meant, and
  it says so.

Code drafts are saved automatically per exercise and per free-mode structure.

## 8. Controls

**Run / Pause**, **Step ▶**, **◀ Back**, **Run to end**, **↺ Reset**, **■ Stop**, a speed setting
(slow → very fast), and an instruction limit (500, 2,000 or 10,000 steps).

- **Stop** ends the program for good. **Pause** can be resumed.
- Keyboard, outside the editor: `→` step, `←` back, `Space` run/pause, `Home` reset.
- In the editor: `Tab` / `Shift+Tab` indent, `Enter` auto-indents (a line starting with `end` or
  `else` snaps to the right level), `Ctrl+Enter` runs, and `Esc` then `Tab` moves focus out of the
  editor.

## 9. Not supported

- Types, `struct` declarations, `malloc`, `sizeof` — use `new Node(value)`.
- The pointer operators `*` and `&`, pointer arithmetic, and pointers to pointers. Return the new
  pointer instead.
- Your own node fields: nodes have exactly `data` plus the links of the chosen structure.
- Braces `{ }` and one-line `if`/`while` bodies.
- Changing the graph (adding or removing vertices or edges).
- Reading input, string functions, `switch`, `goto`, nested functions, closures, and `global`/`local`
  declarations.
- `++` / `--` (write `x = x + 1`). The name `__proto__` is reserved.
