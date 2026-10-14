// The in-app syntax reference for the Pseudocode Lab (mirrors docs/PSEUDOCODE.md).
// Each row: [example, meaning]. Examples are shown with syntax highlighting.

export const REFERENCE = [
  {
    title: 'Basics',
    rows: [
      ['x = 5', 'Assign. A variable exists from its first assignment; no types. Also accepted: x := 5, x ← 5.'],
      ['count = count + 1', 'Arithmetic: + - * / mod (or %). / on two whole numbers gives a whole number. x += 1 and x -= 1 also work.'],
      ['# a comment', 'Comments start with # or // and run to the end of the line.'],
      ['print cur.data', 'Adds a line to the output. print a, b prints both separated by a space.'],
      ['NULL', 'The empty pointer (also null, nil). true and false are the booleans.'],
      ['"a"', 'Text in double or single quotes — used for graph vertex labels.'],
    ],
  },
  {
    title: 'Nodes and pointers',
    rows: [
      ['p = new Node(15)', 'Creates a node with data 15 and every link NULL, at the next free simulated address (@100, @200, …). Addresses are never reused.'],
      ['p.next = q', 'Pointer change: the next field of the node p points to now holds q’s address. p->next works too.'],
      ['p.data = 7', 'Value change: the node keeps its address and links; only its data changes.'],
      ['p = p.next', 'Moves the variable p to the next node (traversal). No node changes.'],
      ['delete p', 'Frees the node p points to (free(p) also works). p and anything else holding that address are now dangling.'],
      ['p == q   p != NULL', 'Compares addresses (is it the same node?), never data. Use p.data == q.data to compare values.'],
    ],
  },
  {
    title: 'Fields of each structure',
    rows: [
      ['data, next', 'Singly linked list (start), circular list (start), linked stack (top), linked queue (front, rear).'],
      ['data, left, right', 'Doubly linked list (start) — prev means left and next means right. Binary tree (root).'],
      ['G, s', 'Graph: G is the graph (read-only), s the start vertex. Use the graph functions below.'],
    ],
  },
  {
    title: 'Conditions and loops',
    rows: [
      ['if p == NULL then\n  …\nelse if p.next == NULL then\n  …\nelse\n  …\nend', 'Branches. then is required; close with end (or end if). elif / elseif also work.'],
      ['while cur != NULL do\n  …\nend', 'Repeat while the condition is true. do is required.'],
      ['for i = 1 to 5 do\n  …\nend', 'Count from 1 to 5 inclusive. Add step 2 for other steps.'],
      ['for each w in neighbors(G, v) do\n  …\nend', 'Loop over the items of an array, queue, stack or set.'],
      ['repeat\n  …\nuntil p == start', 'Body first, then test; stops when the condition is true. Same as C’s do { … } while (p != start).'],
      ['do\n  …\nwhile p != start', 'Body first, then repeat while the condition is true (C’s do-while).'],
      ['a and b   a or b   not a', 'Logic (&&, ||, ! also work). and/or stop early: p != NULL and p.data > 3 is safe.'],
      ['break   continue', 'Leave the loop / skip to its next round.'],
    ],
  },
  {
    title: 'Functions',
    rows: [
      ['function count(p)\n  if p == NULL then\n    return 0\n  end\n  return 1 + count(p.next)\nend', 'Defined at the top level, anywhere in the program. Recursion is allowed (up to 100 nested calls).'],
      ['n = count(start)', 'Call a function and use its result. A call on its own line ignores the result.'],
      ['start = insertFront(start, 5)', 'Parameters are copies (like C). To change the caller’s pointer, return the new value and assign it. A function may also assign directly to a global variable such as start.'],
    ],
  },
  {
    title: 'Helpers for traversals',
    rows: [
      ['q = new Queue()   enqueue(q, x)   x = dequeue(q)', 'First in, first out.'],
      ['st = new Stack()   push(st, x)   x = pop(st)', 'Last in, first out.'],
      ['seen = new Set()   add(seen, v)   contains(seen, v)', 'A set of values. remove(seen, v) takes one out.'],
      ['a = new Array(5)   a[0] = 3   a = [1, 2, 3]', 'Arrays are numbered from 0. append(a, x) adds at the end.'],
      ['isEmpty(c)   size(c)   peek(c)', 'Work on queues, stacks, sets and arrays (peek: stack top / queue front).'],
      ['neighbors(G, v)   vertices(G)   degree(G, v)   hasEdge(G, u, v)', 'Graph functions. neighbors returns the neighbours in ascending order.'],
      ['abs(x)   min(a, b)   max(a, b)', 'Number helpers.'],
    ],
  },
];

export const LIMITS_TEXT = [
  'Every run stops after the instruction limit (2,000 steps by default; 500 or 10,000 can be chosen) and recursion stops after 100 nested calls — an endless loop can never freeze the app.',
  'Code runs only inside the lab’s own interpreter on a simulated heap. Nothing you type is executed as JavaScript.',
];

export const UNSUPPORTED = [
  'Types, struct declarations, malloc and sizeof — create nodes with new Node(value).',
  'Pointer operators * and &, pointer arithmetic, pointers to pointers (**). Return the new pointer instead.',
  'Extra node fields of your own: nodes have exactly data plus the links of the chosen structure.',
  'Braces { } and one-line if/while bodies — every block ends with end.',
  'Changing the graph (adding/removing edges) — G is read-only.',
  'Reading input, string functions, floating-point formatting, switch, goto, nested function definitions, global/local declarations.',
  'Increment operators ++ and -- (write x = x + 1).',
];
