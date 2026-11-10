// Learning modules. Every module is a sequence of sections; progress is
// saved by each section's stable `key`, so sections can be reordered or retitled.
// Section types:
//   read      — explanation (mini-markdown)
//   note      — callout: variant 'technical' | 'terms' | 'extension' | 'prereq' | 'pitfalls'
//   code      — C++, Python and pseudocode tabs
//   sim       — worked example in the workspace, pausing for predictions
//   codesim   — run statements line by line (often an incorrect and a correct version)
//   walk      — a complete program in pseudocode, C++ and Python, stepped on the diagram
//   exercise  — an exercise template at a guidance level
//   demo      — custom interactive (formulas, representations, editors)
// A section with `part` starts a new part of the module (shown in the outline).
import { MODULES } from './concepts.js';

export const LESSONS = [
  // ===================================================================== memory
  {
    id: 'memory',
    sections: [
      {
        type: 'read',
        key: 'r:the-map-of-data-structures',
        title: 'The map of data structures',
        concepts: ['l07.linear-nonlinear'],
        body: `**Primitive** structures are single values the language gives you: integers, floats, chars and **pointers**.

**Non-primitive** structures are built from them: arrays, lists and files. The notes split lists into:
- **linear lists** — stacks and queues: elements form one sequence;
- **non-linear lists** — trees and graphs: an element can lead to several others.

Standard terminology: an array and a linked list are also *linear*. “Linear” describes the **logical order** (each element has at most one successor), not how memory is laid out.`,
      },
      {
        type: 'read',
        key: 'r:how-to-read-the-code',
        title: 'How to read the code: C++, Python and pseudocode',
        body: `The notes are written in **C**. The app shows every program in **C++**, **Python** and **pseudocode** as well, and they always do exactly the same thing — pick a language on any code panel (or in Settings) and every panel follows. The notes’ original C stays available as “C (notes)”.

| | C++ | Python | Pseudocode (the Lab) |
|---|---|---|---|
| a block | \`{ … }\` | indentation after \`:\` | \`then\` / \`do\` … \`end if\` / \`end while\` |
| “no address” | \`nullptr\` (C: \`NULL\`) | \`None\` | \`NULL\` |
| field of a node | \`p->data\` (through a pointer) | \`p.data\` | \`p.data\` |
| a new node | \`new Node{…}\` | \`Node(…)\` | \`new Node(value)\` |
| give a node back | \`delete p;\` | automatic (garbage collection) | \`delete p\` |
| print one value per line | \`cout << x << "\\n";\` | \`print(x)\` | \`print x\` |
| integer division | \`7 / 2\` → 3 (ints) | \`7 // 2\` → 3 | \`7 div 2\` → 3 |

The **pseudocode is runnable**: it is exactly the syntax of the Pseudocode Lab, so every pseudocode example can be opened in the Lab and run step by step.`,
      },
      {
        type: 'code',
        key: 'c:one-small-program-in-every-language',
        title: 'One small program in every language',
        check: true,
        body: 'A variable, an array, a loop, a function and output. Switch the language tabs: the statements correspond line by line, and all versions print 10, 20, 30 and then 60.',
        c: `#include <stdio.h>

int sum(int a[], int n) {         /* the array and how many values it holds */
    int total = 0;
    for (int i = 0; i < n; i++)
        total = total + a[i];
    return total;
}

int main(void) {
    int a[3] = {10, 20, 30};
    for (int i = 0; i < 3; i++)
        printf("%d\\n", a[i]);
    printf("%d\\n", sum(a, 3));
    return 0;
}`,
        cpp: `#include <iostream>
using namespace std;

int sum(int a[], int n) {         // the array and how many values it holds
    int total = 0;
    for (int i = 0; i < n; i++)
        total = total + a[i];
    return total;
}

int main() {
    int a[3] = {10, 20, 30};
    for (int i = 0; i < 3; i++)
        cout << a[i] << "\\n";
    cout << sum(a, 3) << "\\n";
}`,
        py: `def sum_of(a, n):                 # the list and how many values it holds
    total = 0
    for i in range(n):
        total = total + a[i]
    return total

a = [10, 20, 30]
for i in range(3):
    print(a[i])
print(sum_of(a, 3))`,
        pseudo: `function sum(a, n)                # the array and how many values it holds
    total = 0
    for i = 0 to n - 1 do
        total = total + a[i]
    end for
    return total
end function

a = new Array(3)
a[0] = 10
a[1] = 20
a[2] = 30
for i = 0 to 2 do
    print a[i]
end for
print sum(a, 3)`,
      },
      {
        type: 'read',
        key: 'r:contiguous-vs-non-contiguous-memory',
        title: 'Contiguous vs non-contiguous memory',
        concepts: ['l07.memory-layout'],
        body: `An **array** occupies one contiguous block: element *i* sits at \`base + i × size\`, so any element is one calculation away.

A **linked list** is non-contiguous: every node is a separate block somewhere on the heap, and each node stores the **address** of the next one. To reach node *k* you must follow *k − 1* links.`,
        visual: { type: 'compareMemory', values: [10, 20, 30, 40] },
      },
      { type: 'exercise', key: 'e:try-it-compute-an-address', title: 'Try it: compute an address', templateId: 'l07-address', guidance: 'full' },
      {
        type: 'code',
        key: 'c:pointers-malloc-and-free',
        title: 'Pointers, malloc() and free()',
        concepts: ['l07.pointers-alloc'],
        body: `\`malloc(n)\` asks the heap for **n bytes** and returns the address of the new block (or NULL if it fails). \`free(p)\` gives that block back. The cast \`(int *)\` converts malloc’s \`void *\` result; it is optional in C but required in C++. **C-style allocation in the notes:** \`(node *) malloc(sizeof(node))\` reserves one node; C++ code would normally write \`new Node{...}\` and \`delete\`.`,
        c: `char *cp;
cp = (char *) malloc(100);               /* 100 bytes */

int *ip;
ip = (int *) malloc(100 * sizeof(int));  /* 100 ints  */
/* ... use ip[0] .. ip[99] ... */
free(ip);                                /* give it back */
ip = NULL;                               /* avoid a dangling pointer */`,
        cpp: `#include <cstdlib>   // only needed for malloc/free

int main() {
    int* ip = new int[100];   // C++: allocate 100 ints on the heap
    ip[0] = 42;
    delete[] ip;              // C++: release an array allocated with new[]
    ip = nullptr;

    // Never mix them: memory from malloc -> free, from new -> delete.
}`,
        py: `ip = [0] * 100        # a list of 100 ints: Python finds the memory itself
ip[0] = 42
ip = None             # no free(): once nothing refers to the list,
                      # Python's garbage collector gives the memory back`,
        pseudo: `ip = new Array(100)   # 100 slots (Lab arrays hold up to 100)
ip[0] = 42
ip = NULL             # arrays are reclaimed automatically; NODES are given back with delete`,
      },
      {
        type: 'read',
        key: 'r:memory-in-three-languages',
        title: 'Memory in C++, Python and the pseudocode',
        concepts: ['l07.pointers-alloc'],
        body: `**C++ — pointers, you manage the memory.** A pointer variable (\`Node* p\`) holds an **address**. \`new Node{…}\` reserves a node on the heap and returns its address; \`delete p\` gives it back. \`p->data\` follows the pointer to the node’s field. Two classic bugs follow from manual management:
- a **memory leak**: the last pointer to a node is overwritten or goes out of scope without \`delete\` — the node can never be freed;
- a **dangling pointer**: the node was deleted but a pointer still holds its old address — using it is undefined behaviour.

**Python — references, automatic memory.** Every variable *refers* to an object; \`p = Node(10)\` makes p refer to a new object and \`q = p\` makes q refer to the **same** object. There are no addresses to compute and no \`delete\` for objects: when nothing refers to an object any more, Python’s **garbage collector** frees it. \`del p\` only removes the name p. Consequences: no dangling references — but you can still **lose** a list by overwriting the only reference to it, exactly as in C++.

**Pseudocode (the Lab) — language-independent.** \`new Node(v)\` returns an address the Lab shows as @100, @200, …; variables hold those addresses; \`delete p\` frees a node and the Lab marks it. The Lab reports leaks, dangling pointers and NULL dereferences the moment they happen, so it behaves like a careful C++ — without crashing.`,
      },
      {
        type: 'code',
        key: 'c:two-names-for-one-node',
        title: 'Two names for one node',
        check: true,
        body: 'p and q refer to the same node, so a change made through q is seen through p. Every version prints 99. Then the node is given back: explicitly in C, C++ and the pseudocode, automatically in Python.',
        c: `#include <stdio.h>
#include <stdlib.h>

typedef struct node { int data; struct node *next; } node;

int main(void) {
    node *p = (node *) malloc(sizeof(node));   /* p holds the node's address */
    p->data = 10;
    p->next = NULL;
    node *q = p;                /* q holds the SAME address */
    q->data = 99;               /* change the node through q ... */
    printf("%d\\n", p->data);   /* ... p sees 99 */
    free(p);                    /* give the node back (once!) */
    p = NULL;                   /* q still holds the old address: dangling */
    q = NULL;
    return 0;
}`,
        cpp: `#include <iostream>
using namespace std;

struct Node { int data; Node* next; };

int main() {
    Node* p = new Node{10, nullptr};   // p holds the node's address
    Node* q = p;                       // q holds the SAME address
    q->data = 99;                      // change the node through q ...
    cout << p->data << "\\n";          // ... p sees 99
    delete p;                          // give the node back (once!)
    p = nullptr;                       // q still holds the old address: dangling
    q = nullptr;
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

p = Node(10)          # p refers to a new object
q = p                 # q refers to the SAME object
q.data = 99           # change the object through q ...
print(p.data)         # ... p sees 99
p = None              # no delete: when no name refers to the object any more,
q = None              # Python frees it automatically`,
        pseudo: `p = new Node(10)      # p holds the node's address, e.g. @100
q = p                 # q holds the SAME address
q.data = 99           # change the node through q ...
print p.data          # ... p sees 99
delete p              # give the node back; q now dangles
p = NULL
q = NULL`,
      },
      {
        type: 'note',
        key: 'n:storage-location-is-not-the-same-as-structure-ty',
        variant: 'correction',
        title: 'Storage location is not the same as structure type',
        body: `The table says “array: memory from the stack — linked list: memory from the heap”. That is only true for a *local* array. A global array lives in the static data area, and \`malloc(n * sizeof(int))\` creates an array **on the heap**. Likewise the pointer \`head\` is a normal variable (stack or static) even though the nodes it reaches are on the heap. Where memory lives depends on **how it was obtained**, not on whether it is an array or a list.`,
      },
      { type: 'exercise', key: 'e:where-does-the-memory-live', title: 'Where does the memory live?', templateId: 'l07-storage', guidance: 'full' },
      {
        type: 'read',
        key: 'r:trade-offs-between-arrays-and-linked-lists',
        title: 'Trade-offs between arrays and linked lists',
        concepts: ['l07.arrays-vs-lists', 'l07.tradeoffs'],
        body: `| What you want to do | Array | Singly linked list |
|---|---|---|
| Read element *k* | compute its address: base + k·size | follow the links from head, node by node, until node *k* |
| Insert at the front | move every element one slot right, then store the value | create a node and change two links |
| Delete at a known spot | move every later element one slot left | redirect the link that points into the node, then free it |
| Memory per element | just the value | the value + one pointer |
| Size | fixed when it is declared | grows and shrinks while the program runs |

Searching a linked list means visiting the nodes one by one from head, because there is no address formula that jumps to the middle (Lec 07 p.3).`,
      },
      {
        type: 'note',
        key: 'n:deleting-from-an-array-is-not-possible-what-it-r',
        variant: 'correction',
        title: '“Deleting from an array is not possible” — what it really means',
        body: `You **can** delete an element from an array: shift every later element one slot left and decrease a separate count of used slots. What a plain array cannot do is **shrink (or grow) its allocated size** — the capacity stays fixed. Deletion is possible; *resizing* is not.`,
      },
      {
        type: 'read',
        key: 'r:arrays-purpose-and-terms',
        title: 'Arrays: purpose, organisation and terms',
        concepts: ['l07.arrays-vs-lists'],
        body: `**Organisation.** An array is ONE block of equally sized **elements** side by side. Each element is identified by its **index**: 0 for the first, 1 for the next, … (C, C++, Python and the pseudocode all count from 0).

**Two different sizes.** The **capacity** (MAX) is fixed when the array is created. How many slots currently hold real values is a separate number the program keeps itself — here **n**. Valid values are in slots 0 … n − 1.

**Operations.**
- *read / write element i*: one address calculation, no matter how large the array is;
- *insert at index pos*: move elements pos … n − 1 one slot to the RIGHT (head from the end), store the value, n = n + 1 — impossible when n == MAX;
- *delete at index pos*: move elements pos + 1 … n − 1 one slot to the LEFT, n = n − 1.

**Use an array when** the maximum number of elements is known and you mostly read or replace elements by position (tables, matrices, the array stack and queue of Lec 12, the tree array of Lec 13). **Prefer a linked list when** elements are frequently inserted or deleted at the front or in the middle, or when the number of elements is unknown.`,
        visual: { type: 'array', n: 6, filled: 4, values: [10, 20, 30, 40], highlight: [] },
      },
      { type: 'walk', key: 'w:array-shift', title: 'Build it in code: an array with insertion and deletion', impl: 'array-shift' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:array-pitfalls',
        title: 'Arrays: common mistakes and edge cases',
        body: `- **Shifting in the wrong direction.** For an insertion, copy from the END backwards (\`a[i] = a[i − 1]\`); copying forwards overwrites values before they have moved. For a deletion, copy forwards (\`a[i] = a[i + 1]\`).
- **Forgetting n.** After an insertion n must grow by 1, after a deletion shrink by 1 — the array itself does not know how many slots are in use.
- **Full array.** Inserting when n == MAX has no free slot: check first and report it.
- **Empty array.** Deleting when n == 0 has nothing to delete.
- **Invalid positions.** Insertion accepts 0 ≤ pos ≤ n (pos = n appends), deletion 0 ≤ pos ≤ n − 1. C++ does **not** check indices: writing outside the array silently corrupts other memory. Python raises an \`IndexError\`; the Lab stops with an error naming the line.
- **Mixing allocation styles.** Memory from \`malloc\` goes back with \`free\`, from \`new[]\` with \`delete[]\`; and never use a block after it has been given back.`,
      },
      { type: 'exercise', key: 'e:count-the-shifts', title: 'Shift the elements', templateId: 'l07-shifts', guidance: 'full' },
      { type: 'exercise', key: 'e:spot-the-memory-bug', title: 'Spot the memory bug', templateId: 'l07-membug', guidance: 'full' },
      { type: 'exercise', key: 'e:variation-choose-a-structure', title: 'Variation: choose a structure', templateId: 'l07-choose', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-linear-or-non-linear', title: 'Variation: linear or non-linear?', templateId: 'l07-classify', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-the-array-program', title: 'Predict what the array program prints', templateId: 'l07-predict-output', params: { impl: 'array-shift' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-shift', title: 'Complete the shifting loop', templateId: 'l07-complete-code', params: { impl: 'array-shift' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-insert', title: 'Write it yourself: insert into an array', templateId: 'l07-write-code', params: { lab: 'array-insert' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-delete', title: 'Write it yourself: delete from an array', templateId: 'l07-write-code', params: { lab: 'array-delete' }, guidance: 'none' },
    ],
  },
  // ===================================================================== sll
  {
    id: 'sll',
    sections: [
      {
        part: 'Nodes, creation and insertion',
        type: 'read',
        key: 'r:anatomy-of-a-singly-linked-list',
        title: 'Anatomy of a singly linked list',
        concepts: ['l08.node-anatomy', 'l08.traversal-pointer'],
        body: `Each **node** has two fields: \`data\` (the value) and \`next\` (the **address** of the next node). The last node’s next is **NULL** — drawn as **X** in the notes.

\`head\` is a pointer variable holding the address of the first node (many books call it **head**). An empty list is simply \`head = NULL\`.

Keep two numbers apart: a node’s **value** (e.g. 10) and its **address** (e.g. 100). Pointers only ever hold addresses.

**Purpose.** A linked list keeps a sequence whose length changes while the program runs: nodes are created one at a time, wherever memory is free, and the links put them in order. Inserting or deleting only changes a few links — nothing is shifted. The price: to reach the k-th node you must follow the links from head, and every node stores one extra pointer.

**Use it when** the number of items is not known in advance or items are often inserted and removed at the front or in the middle (and later: to build stacks, queues and the adjacency lists of graphs). **Prefer an array** when you mostly access items by their position.`,
        visual: { type: 'list', values: [10, 20, 30, 40] },
      },
      {
        type: 'note',
        key: 'n:lecture-terms-standard-terms',
        variant: 'terms',
        title: 'Lecture terms ↔ standard terms',
        body: `- **head** = head pointer
- **X** in a diagram = NULL (C) / nullptr (C++)
- **create_node()** = allocate + initialise a node (malloc, read data, next = NULL)
- **temp, prev** = temporary traversal pointers (local variables)
- **position** = 1-based index of a node (the first node is position 1)`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-nodes',
        title: 'Before you start: node types, NULL and functions that change head',
        body: `- **A node type** groups fields. C uses \`struct\`; C++ \`struct Node { int data; Node* next; };\`; Python a \`class Node\` whose \`__init__\` sets \`self.data\` and \`self.next\`; the Lab’s nodes simply have the fields data and next.
- **“No node”** is \`NULL\` in C and the pseudocode, \`nullptr\` in C++, \`None\` in Python. An empty list is head == NULL.
- **Reaching a field.** C/C++ follow a pointer with \`->\` (\`temp->next\`); Python and the pseudocode write \`temp.next\`.
- **Comparing with “no node”.** C++ \`p == nullptr\`, Python \`p is None\` (\`is\` asks “the same object?”), pseudocode \`p == NULL\`.
- **Changing head inside a function.** In the C/C++ programs head is a global variable, so a function may assign it. In Python, a function that ASSIGNS a global must say \`global head\` first — without it, \`head = new_node\` creates a new local variable and the list never changes. Pseudocode functions (Lab) can assign globals directly, like C.`,
      },
      {
        type: 'code',
        key: 'c:declaring-a-node-and-getnode',
        title: 'Declaring a node and create_node()',
        body: 'The notes read data with scanf inside create_node(). Here the value is passed in, which is easier to test.',
        c: `struct slinklist {
    int data;
    struct slinklist *next;
};
typedef struct slinklist node;
node *head = NULL;               /* empty list */

node *create_node(int value) {
    node *new_node = (node *) malloc(sizeof(node));
    new_node->data = value;
    new_node->next = NULL;
    return new_node;
}`,
        cpp: `struct Node {
    int data;
    Node* next;
};
Node* head = nullptr;

Node* create_node(int value) {
    return new Node{value, nullptr};   // allocate + initialise
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data          # the value
        self.next = None          # the next node (None = none)

head = None                      # empty list

def create_node(value):
    return Node(value)            # create + initialise`,
        pseudo: `# Lab nodes have the fields data and next; new Node(v) sets next = NULL.
head = NULL                      # empty list

function create_node(value)
    new_node = new Node(value)     # create + initialise
    return new_node
end function`,
      },
      { type: 'exercise', key: 'e:value-or-address', title: 'Value or address?', templateId: 'l08-predict-temp', guidance: 'full' },
      {
        type: 'sim',
        key: 's:worked-example-creatlist-builds-10-20-30',
        title: 'Worked example: create_list() builds 10 → 20 → 30',
        struct: 'sll',
        setup: { values: [] },
        op: 'createList',
        args: [[10, 20, 30]],
        body: 'Watch temp walk to the end before every append. Use Step Forward / Back; each allocation and link is its own step.',
      },
      {
        type: 'note',
        key: 'n:prose-vs-code-on-creation',
        variant: 'correction',
        title: 'Prose vs code on creation',
        body: `The steps on p.2 (c-1, c-2) describe adding each new node at the **front** (new_node->next = head; head = new_node). The code on p.3 adds at the **end** (walk temp to the last node; temp->next = new_node). Both build a list, but in opposite orders: entering 10, 20, 30 gives 30 → 20 → 10 with the p.2 steps and 10 → 20 → 30 with the p.3 code. The p.3 version walks temp from head to the last node before every append.`,
      },
      { type: 'walk', key: 'w:sll-create', title: 'Build it in code: create a list from scratch', impl: 'sll-create', body: 'The whole list built from nothing: the node type, create_node(), an append that follows create_list() on p.3, and a display. Step through it in your language and watch every allocation and every link appear.' },
      {
        type: 'sim',
        key: 's:insert-at-the-beginning',
        title: 'Insert at the beginning',
        concepts: ['l08.insert-beg'],
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertBeg',
        args: [5],
        predict: ['link', 'var'],
        body: 'Order matters: (1) new_node->next = head, then (2) head = new_node. Predict each change before it happens.',
      },
      { type: 'walk', key: 'w:sll-insert-beg', title: 'Build it in code: insert at the beginning', impl: 'sll-insert-beg' },
      { type: 'exercise', key: 'e:your-turn-insert-at-the-beginning', title: 'Your turn: insert at the beginning', templateId: 'l08-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      {
        type: 'sim',
        key: 's:insert-at-the-end',
        title: 'Insert at the end',
        concepts: ['l08.insert-end'],
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertEnd',
        args: [50],
        predict: ['var', 'link'],
        body: 'temp walks while temp->next != NULL, so it stops ON the last node, whose next is then changed from NULL to the new node.',
      },
      { type: 'walk', key: 'w:sll-insert-end', title: 'Build it in code: insert at the end', impl: 'sll-insert-end' },
      {
        type: 'exercise',
        key: 'e:required-example-10-20-30-insert-15-after-10-whi',
        title: 'Required example: 10 → 20 → 30, insert 15 after 10 — which links change?',
        concepts: ['l08.insert-mid'],
        templateId: 'l08-which-links',
        params: { op: 'ins', kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 },
        guidance: 'full',
      },
      {
        type: 'sim',
        key: 's:predict-the-intermediate-states-insert-15-at-pos',
        title: 'Predict the intermediate states: insert 15 at position 2',
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertMid',
        args: [15, 2],
        predict: ['var', 'link'],
        body: 'prev follows one node behind temp. When i reaches pos, prev is on 10 and temp is on 20.',
      },
      { type: 'exercise', key: 'e:now-do-it-insert-15-after-10', title: 'Now do it: insert 15 after 10', templateId: 'l08-rewire-insert', params: { kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 }, guidance: 'full' },
      {
        type: 'codesim',
        key: 'c:the-lost-access-bug-and-how-saving-a-reference-p',
        title: 'The lost-access bug — and how saving a reference prevents it',
        concepts: ['l09.preserve-access'],
        body: 'Both versions insert 15 after 10 with prev on node 10. The buggy one overwrites prev->next while it holds the ONLY address of 20 → 30. The fixed one first saves that address in temp (as the notes do).',
        variants: [
          {
            label: 'Buggy',
            lines: ['new_node = create_node();', 'prev->next = new_node;', 'new_node->next = prev->next;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'prev->next = new_node;', 'new_node->next = prev->next;'], py: ['new_node = Node(15)', 'prev.next = new_node', 'new_node.next = prev.next'], pseudo: ['new_node = new Node(15)', 'prev.next = new_node', 'new_node.next = prev.next'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Fixed (save temp)',
            lines: ['new_node = create_node();', 'temp = prev->next;', 'prev->next = new_node;', 'new_node->next = temp;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'Node* temp = prev->next;', 'prev->next = new_node;', 'new_node->next = temp;'], py: ['new_node = Node(15)', 'temp = prev.next', 'prev.next = new_node', 'new_node.next = temp'], pseudo: ['new_node = new Node(15)', 'temp = prev.next', 'prev.next = new_node', 'new_node.next = temp'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Fixed (reorder)',
            lines: ['new_node = create_node();', 'new_node->next = prev->next;', 'prev->next = new_node;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'new_node->next = prev->next;', 'prev->next = new_node;'], py: ['new_node = Node(15)', 'new_node.next = prev.next', 'prev.next = new_node'], pseudo: ['new_node = new Node(15)', 'new_node.next = prev.next', 'prev.next = new_node'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
        ],
      },
      {
        type: 'note',
        key: 'n:two-details-in-insert-at-mid',
        variant: 'correction',
        title: 'Two details in insert_at_position',
        body: `1. **Allocate after validating.** The notes call create_node() before checking pos; on an invalid position the new node is never linked or freed — a memory leak. Check first, allocate second.
2. **The range.** The notes accept \`pos > 1 && pos < node_count\` (the same test used for deletion). For *insertion*, pos = node_count is still a middle position (the new node goes just before the last node), so the correct test is \`pos > 1 && pos <= node_count\`. The simulator uses the corrected test.`,
      },
      { type: 'walk', key: 'w:sll-insert-pos', title: 'Build it in code: insert at any position', impl: 'sll-insert-pos', body: 'One function for every position, with both corrections: the position is checked BEFORE a node is allocated, and position n + 1 (after the last node) is accepted. Try every starting situation, including the invalid position.' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-insert-pitfalls',
        title: 'Insertion: common mistakes and edge cases',
        body: `- **Wrong order of link changes → lost access.** Always link the new node to the rest of the list FIRST (\`new_node->next = …\`), then redirect the link that should point at it.
- **Walking one node too far.** \`while (temp != NULL)\` stops AFTER the last node (temp is NULL and \`temp->next = new_node\` crashes); \`while (temp->next != NULL)\` stops ON it.
- **Empty list.** Insert at the end has no last node when head == NULL: the new node becomes head.
- **Position 1.** Inserting at position 1 must change head itself — no prev node exists.
- **Invalid positions** (0, negative, larger than n + 1): reject them before allocating, or the new node leaks.
- **Python: forgetting \`global head\`.** The assignment then creates a local head: the global list does not change (or Python raises \`UnboundLocalError\`).
- **C++: passing head by value.** \`void insert(Node* head, …)\` changes only a copy; use the global, a reference (\`Node*& head\`) or return the new head.`,
      },
      { type: 'exercise', key: 'e:variation-arrange-the-steps', title: 'Variation: arrange the steps', templateId: 'l08-order-insert', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-complete-the-code', title: 'Variation: complete the code', templateId: 'l08-fill', guidance: 'less' },
      { type: 'exercise', key: 'e:find-the-bug', title: 'Find the bug', templateId: 'l08-bug', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-the-final-list', title: 'Predict the final list', templateId: 'l08-predict-state', guidance: 'none' },
      { type: 'exercise', key: 'e:predict-the-list-program', title: 'Predict what a list program prints', templateId: 'l08-predict-output', params: { impl: 'sll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-insert-at-beginning', title: 'Complete the missing statement', templateId: 'l08-complete-code', params: { impl: 'sll-insert-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-the-end', title: 'Write it yourself: insert at the end', templateId: 'l08-write-code', params: { lab: 'sll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-a-position', title: 'Write it yourself: insert at any position', templateId: 'l08-write-code', params: { lab: 'sll-insert-pos' }, guidance: 'none' },
      {
        part: 'Deletion and traversal',
        type: 'read',
        key: 'r:deleting-safely-save-relink-free',
        title: 'Deleting safely: save → relink → free',
        concepts: ['l09.delete-beg', 'l09.preserve-access'],
        body: `Three rules for every deletion:
1. Keep a pointer (temp) to the node you remove — you need its address to free it.
2. Redirect the link that points INTO it, so the list skips it.
3. Only then \`free(temp)\`. Freeing first would leave the list pointing at released memory.

If the list is empty, report it and do nothing (underflow).

**Giving the node back in each language.** C: \`free(temp)\` (memory from malloc). C++: \`delete temp;\` (memory from new). Python: nothing to call — once no variable refers to the removed node, the garbage collector reclaims it (\`del temp\` just removes the last name). Pseudocode: \`delete temp\`; the Lab marks the node as freed and reports any pointer that still leads to it. Whatever the language, steps 1 and 2 are the same: keep access to the node, then make the list skip it.`,
      },
      { type: 'sim', key: 's:delete-at-beg', title: 'delete_at_beginning()', struct: 'sll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'free'], body: 'Allocation, relinking and deallocation each get their own step.' },
      { type: 'walk', key: 'w:sll-delete-beg', title: 'Build it in code: delete at the beginning', impl: 'sll-delete-beg', body: 'Three starting situations: a normal list, a list with ONE node (head becomes NULL) and an empty list (nothing to delete).' },
      { type: 'exercise', key: 'e:your-turn-delete-the-first-node', title: 'Your turn: delete the first node', templateId: 'l09-rewire-delete', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'sim', key: 's:delete-at-last', title: 'delete_at_end()', concepts: ['l09.delete-end'], struct: 'sll', setup: { values: [10, 20, 30, 40] }, op: 'deleteEnd', predict: ['var', 'link'], body: 'prev trails temp so that when temp reaches the last node, prev is on the new last node.' },
      {
        type: 'note',
        key: 'n:one-node-list-delete-at-last-leaves-start-dangli',
        variant: 'correction',
        title: 'One-node list: delete_at_end leaves head dangling',
        body: `With a single node, temp, prev and head all hold the same address. The loop never runs; \`prev->next = NULL\` just modifies the node being deleted; \`free(temp)\` releases it — and **head still holds the freed address**. Add: \`if (temp == head) head = NULL; else prev->next = NULL;\`. Run the next simulation to see it.`,
      },
      { type: 'sim', key: 's:the-notes-version-on-a-one-node-list', title: 'The notes’ version on a one-node list', struct: 'sll', setup: { values: [42] }, op: 'deleteEndNotes', body: 'Look at head after free(temp): it points at a block marked “freed”.' },
      { type: 'exercise', key: 'e:fix-the-one-node-case', title: 'Fix the one-node case', templateId: 'l09-singleton', guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-end', title: 'Build it in code: delete at the end (with the one-node fix)', impl: 'sll-delete-end' },
      {
        type: 'exercise',
        key: 'e:required-example-now-delete-20-from-10-15-20-30-',
        title: 'Required example: now delete 20 from 10 → 15 → 20 → 30 — which pointers change?',
        concepts: ['l09.delete-mid'],
        templateId: 'l08-which-links',
        params: { op: 'del', kind: 'mid', values: [10, 15, 20, 30], pos: 3 },
        guidance: 'full',
      },
      { type: 'sim', key: 's:delete-at-mid-pos-3', title: 'delete_at_position(pos = 3)', struct: 'sll', setup: { values: [10, 15, 20, 30] }, op: 'deleteMid', args: [3], predict: ['var', 'link', 'free'] },
      { type: 'exercise', key: 'e:now-do-it-delete-20', title: 'Now do it: delete 20', templateId: 'l09-rewire-delete', params: { kind: 'mid', values: [10, 15, 20, 30], deleteValue: 20 }, guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-pos', title: 'Build it in code: delete at any position', impl: 'sll-delete-pos', body: 'prev stops on the node BEFORE the one to delete, temp on the node itself. Try position 1, the last position and an invalid position too.' },
      {
        type: 'codesim',
        key: 'c:freeing-too-early',
        title: 'Freeing too early',
        body: 'Same goal — remove node 2 (prev is on node 1, temp on node 2). The buggy version frees temp before reading temp->next.',
        variants: [
          {
            label: 'Buggy',
            lines: ['free(temp);', 'prev->next = temp->next;'],
            langs: { cpp: ['delete temp;', 'prev->next = temp->next;   // reads a deleted node!'], py: ['del temp                   # Python only removes the NAME temp ...', 'prev.next = temp.next      # ... so this line fails: temp no longer exists'], pseudo: ['delete temp', 'prev.next = temp.next'] },
            setup: { values: [10, 20, 30], vars: { prev: 1, temp: 2 } },
          },
          {
            label: 'Correct',
            lines: ['prev->next = temp->next;', 'free(temp);'],
            langs: { cpp: ['prev->next = temp->next;', 'delete temp;'], py: ['prev.next = temp.next', 'del temp                   # the node is reclaimed automatically'], pseudo: ['prev.next = temp.next', 'delete temp'] },
            setup: { values: [10, 20, 30], vars: { prev: 1, temp: 2 } },
          },
        ],
      },
      { type: 'sim', key: 's:traverse', title: 'traverse()', concepts: ['l09.traverse'], struct: 'sll', setup: { values: [10, 15, 30] }, op: 'traverse', predict: ['output'], body: 'temp, not head, moves — so the list is still intact afterwards.' },
      { type: 'exercise', key: 'e:variation-delete-anywhere', title: 'Variation: delete anywhere', templateId: 'l09-rewire-delete', guidance: 'less' },
      { type: 'exercise', key: 'e:arrange-the-deletion-steps', title: 'Arrange the deletion steps', templateId: 'l09-order-delete', guidance: 'less' },
      { type: 'exercise', key: 'e:find-the-deletion-bug', title: 'Find the deletion bug', templateId: 'l09-bug', guidance: 'less' },
      { type: 'exercise', key: 'e:which-positions-are-valid', title: 'Which positions are valid?', templateId: 'l09-valid-pos', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-traverse-after-deletions', title: 'Predict traverse() after deletions', templateId: 'l09-traverse-predict', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-delete-pitfalls',
        title: 'Deletion: common mistakes and edge cases',
        body: `- **Freeing too early.** \`free(temp)\` / \`delete temp\` before the list skips the node leaves a link into released memory (a dangling pointer).
- **Forgetting to free.** Unlinking without \`free\`/\`delete\` leaks the node in C and C++ (Python reclaims it automatically).
- **Empty list.** delete_at_beginning / delete_at_end must check head == NULL first (underflow).
- **One node.** Deleting the only node must leave head == NULL; delete_at_end in the notes leaves head dangling.
- **Position 1** changes head; there is no prev node.
- **Invalid positions.** Valid positions are 1 … n. With pos larger than n, a loop that walks prev forward runs off the end — count the nodes (or stop at NULL) before relinking.
- **Moving head instead of temp while traversing.** Walking with head loses the list; always walk with a separate pointer.`,
      },
      { type: 'exercise', key: 'e:predict-a-deletion-program', title: 'Predict what a deletion program prints', templateId: 'l09-predict-output', params: { impl: 'sll-delete-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-deletion', title: 'Complete the missing statement', templateId: 'l09-complete-code', params: { impl: 'sll-delete-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-the-last-node', title: 'Write it yourself: delete the last node', templateId: 'l09-write-code', params: { lab: 'sll-delete-last' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-at-a-position', title: 'Write it yourself: delete at any position', templateId: 'l09-write-code', params: { lab: 'sll-delete-pos' }, guidance: 'none' },
      {
        part: 'Circular singly linked lists',
        type: 'read',
        key: 'r:the-last-node-points-back-to-the-first',
        title: 'The last node points back to the first',
        concepts: ['l11.circular-links'],
        body: `In a circular singly linked list the last node’s next holds the address of the **first** node. A one-node circle points to **itself**. An empty list is still \`head = NULL\`.

Consequence: in a non-empty circle **no next field is NULL**, so every loop that waits for NULL runs forever.

**Purpose and uses.** From any node you can reach every other node by going forward, and after the last node you are back at the first one. That suits data that is processed in rounds — taking turns, repeating a cycle of steps — where “after the last comes the first again”. The node type is exactly the singly linked node; only the last link differs.`,
        visual: { type: 'list', kind: 'csll', values: [10, 20, 30, 40] },
      },
      { type: 'sim', key: 's:required-demo-why-waiting-for-null-fails', title: 'Required demo: why waiting for NULL fails', concepts: ['l11.csll-traverse'], struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverseNullBug', body: 'The simulator stops the loop after the second lap — a real program never would.' },
      {
        type: 'note',
        key: 'n:the-creation-loop-in-the-notes',
        variant: 'correction',
        title: 'The creation loop in the notes',
        body: `The creation steps walk with \`while (temp->next != NULL)\` and then add \`new_node->next = head\`. After the first node is closed into a circle, no next is NULL any more, so on the next iteration that loop never ends. A circular append must walk with \`while (temp->next != head)\`, exactly as the insert-at-end code on p.2 does.`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-do-while',
        title: 'Before you start: loops that test at the bottom',
        body: `A **do … while** loop runs its body FIRST and tests afterwards, so the body runs at least once. That is exactly what one lap round a circle needs: at the start temp == head, so a test at the top would stop immediately.
- C / C++: \`do { … } while (temp != head);\`
- Python has no do-while: write \`while True:\` and end the body with \`if temp is head: break\`.
- Pseudocode: \`do\` … \`while temp != head\` (the Lab also accepts \`repeat … until temp == head\`).
An empty circle (head == NULL) must be checked BEFORE the loop — the body would follow NULL.`,
      },
      { type: 'sim', key: 's:the-right-way-do-while-exactly-one-lap', title: 'The right way: do-while, exactly one lap', struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverse', predict: ['output'] },
      { type: 'walk', key: 'w:csll-create', title: 'Build it in code: create a circular list', impl: 'csll-create', body: 'Appending walks to the node whose next is head (the corrected loop), links the new node there and closes the circle again. display() makes exactly one lap.' },
      { type: 'exercise', key: 'e:click-exactly-one-lap', title: 'Click exactly one lap', templateId: 'l11-one-lap', guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-stopping-condition', title: 'Complete the stopping condition', templateId: 'l11-fill-dowhile', guidance: 'less' },
      { type: 'sim', key: 's:insert-at-the-beginning-the-last-node-must-chang', title: 'Insert at the beginning: the last node must change too', concepts: ['l11.csll-insert'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [5], predict: ['link', 'var'] },
      { type: 'sim', key: 's:insert-into-an-empty-circle', title: 'Insert into an EMPTY circle', concepts: ['l11.csll-edge'], struct: 'csll', setup: { values: [] }, op: 'insertBeg', args: [7], predict: ['link'] },
      { type: 'walk', key: 'w:csll-insert-beg', title: 'Build it in code: insert at the beginning', impl: 'csll-insert-beg', body: 'Run both starting situations: the last node’s link must change too, and an empty list becomes a node that points to itself.' },
      { type: 'walk', key: 'w:csll-insert-end', title: 'Build it in code: insert at the end', impl: 'csll-insert-end' },
      { type: 'exercise', key: 'e:your-turn-insert', title: 'Your turn: insert', templateId: 'l11-rewire-insert', guidance: 'full' },
      { type: 'sim', key: 's:delete-at-the-beginning', title: 'Delete at the beginning', concepts: ['l11.csll-delete'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'link', 'free'] },
      {
        type: 'note',
        key: 'n:missing-free-and-the-one-node-case',
        variant: 'correction',
        title: 'Missing free and the one-node case',
        body: `- delete_at_beginning crosses temp out in the picture but never calls \`free(temp)\`; without it the node leaks.
- “if the list is empty, head = NULL” really means: when the **only** node is removed (head->next == head), free it and set head = NULL.
- delete_at_end has the same one-node problem as Lec 09: temp == prev == head, so \`prev->next = head\` and \`free(temp)\` leave head dangling. Check \`if (temp == head) head = NULL;\`.`,
      },
      { type: 'walk', key: 'w:csll-delete-beg', title: 'Build it in code: delete at the beginning (corrected)', impl: 'csll-delete-beg' },
      { type: 'walk', key: 'w:csll-delete-end', title: 'Build it in code: delete at the end (corrected)', impl: 'csll-delete-end' },
      { type: 'exercise', key: 'e:required-delete-the-only-node-correctly', title: 'Required: delete the only node correctly', templateId: 'l11-rewire-delete', params: { single: true, kind: 'end' }, guidance: 'full' },
      { type: 'exercise', key: 'e:variation-delete-from-a-longer-circle', title: 'Variation: delete from a longer circle', templateId: 'l11-rewire-delete', params: { single: false }, guidance: 'less' },
      { type: 'exercise', key: 'e:order-the-delete-at-beginning-steps', title: 'Order the delete-at-beginning steps', templateId: 'l11-order-delbeg', guidance: 'less' },
      { type: 'exercise', key: 'e:what-happens-with-the-null-loop', title: 'What happens with the NULL loop?', templateId: 'l11-null-loop', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:csll-pitfalls',
        title: 'Circular lists: common mistakes and edge cases',
        body: `- **Waiting for NULL.** In a non-empty circle no next is NULL: loops must stop when they are back at head.
- **Testing at the top.** \`while (temp != head)\` with temp = head never runs; use a do-while for one lap.
- **Leaving the circle open.** After inserting at the end the new node must point back to head; after inserting at the beginning the LAST node must point to the new head.
- **Empty list.** head == NULL: there is no lap to make; a first node must point to itself.
- **One node.** Its next is itself; deleting it must leave head == NULL (the notes leave head dangling).
- **Forgetting to free** the removed node (the notes’ delete at the beginning never calls free).`,
      },
      { type: 'exercise', key: 'e:predict-a-circular-program', title: 'Predict what a circular-list program prints', templateId: 'l11-predict-output', params: { impl: 'csll-insert-beg' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-circle', title: 'Complete the missing statement', templateId: 'l11-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-insert-front', title: 'Write it yourself: insert at the beginning', templateId: 'l11-write-code', params: { lab: 'csll-insert-front' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-delete-first', title: 'Write it yourself: delete the first node', templateId: 'l11-write-code', params: { lab: 'csll-delete-first' }, guidance: 'none' },
    ],
  },
  // ===================================================================== dll
  {
    id: 'dll',
    sections: [
      {
        type: 'read',
        key: 'r:two-links-per-node',
        title: 'Two links per node',
        concepts: ['l10.dll-links'],
        body: `Each node has **prev** (address of the previous node), **data**, and **next** (address of the next node). Standard names: **prev** and **next**.

The invariant: for every pair of neighbours A, B: \`A->next == B\` **and** \`B->prev == A\`. The first node’s prev and the last node’s next are NULL. Every operation must keep both directions true.

**Purpose and uses.** The extra link lets you walk the list in BOTH directions and remove a node you already point at without searching for its predecessor. Use it when a program needs to move backwards (for example, “previous / next” navigation) or deletes nodes it already has a pointer to; a singly linked list is simpler and smaller when one direction is enough.`,
        visual: { type: 'list', kind: 'dll', values: [10, 20, 30] },
      },
      {
        type: 'code',
        key: 'c:the-node-and-getnode',
        title: 'The node and create_node()',
        c: `struct dlinklist {
    struct dlinklist *prev;
    int data;
    struct dlinklist *next;
};
typedef struct dlinklist node;
node *head = NULL;

node *create_node(int value) {
    node *new_node = (node *) malloc(sizeof(node));
    new_node->data = value;
    new_node->prev = NULL;
    new_node->next = NULL;
    return new_node;
}`,
        cpp: `struct Node {
    Node* prev;     // previous
    int data;
    Node* next;    // next
};
Node* create_node(int v) { return new Node{nullptr, v, nullptr}; }`,
        py: `class Node:
    def __init__(self, data):
        self.prev = None      # previous node
        self.data = data
        self.next = None     # next node

def create_node(v):
    return Node(v)`,
        pseudo: `# Lab nodes of a doubly linked list have the fields prev, data and next
# (prev and next are accepted as other names); new Node(v) sets both links to NULL.
function create_node(v)
    new_node = new Node(v)
    return new_node
end function`,
      },
      { type: 'walk', key: 'w:dll-create', title: 'Build it in code: create a doubly linked list', impl: 'dll-create', body: 'Every append sets TWO links. The program then prints the list forwards and backwards — the backward output is the forward output reversed exactly when every prev link is next.' },
      { type: 'sim', key: 's:insert-at-the-beginning-3-steps', title: 'Insert at the beginning: 3 steps', concepts: ['l10.dll-insert'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [40], predict: ['link', 'var'] },
      { type: 'walk', key: 'w:dll-insert-beg', title: 'Build it in code: insert at the beginning', impl: 'dll-insert-beg' },
      { type: 'exercise', key: 'e:your-turn-both-directions', title: 'Your turn (both directions!)', templateId: 'l10-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'walk', key: 'w:dll-insert-end', title: 'Build it in code: insert at the end', impl: 'dll-insert-end' },
      { type: 'sim', key: 's:insert-at-an-intermediate-position-4-links', title: 'Insert at an intermediate position: 4 links', struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertMid', args: [40, 2], predict: ['link'] },
      { type: 'walk', key: 'w:dll-insert-pos', title: 'Build it in code: insert at a middle position', impl: 'dll-insert-pos' },
      { type: 'exercise', key: 'e:insert-in-the-middle', title: 'Insert in the middle', templateId: 'l10-rewire-insert', params: { kind: 'mid' }, guidance: 'full' },
      { type: 'exercise', key: 'e:which-orders-are-valid', title: 'Which orders are valid?', templateId: 'l10-order', guidance: 'less' },
      { type: 'sim', key: 's:delete-at-an-intermediate-position', title: 'Delete at an intermediate position', concepts: ['l10.dll-delete'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'deleteMid', args: [2], predict: ['link', 'free'] },
      { type: 'walk', key: 'w:dll-delete-pos', title: 'Build it in code: delete at a middle position', impl: 'dll-delete-pos' },
      {
        type: 'note',
        key: 'n:one-node-lists-in-delete-at-beg-delete-at-end',
        variant: 'correction',
        title: 'One-node lists in delete_at_beginning / delete_at_end',
        body: `**delete_at_beginning:** after \`head = temp->next\`, head is NULL when the only node was removed, so \`head->prev = NULL\` dereferences NULL and crashes. Guard it: \`if (head != NULL) head->prev = NULL;\`.

**delete_at_end:** \`temp->prev->next = NULL\` crashes when temp is the only node (temp->prev is NULL). Check \`if (temp->prev == NULL) head = NULL;\` first.`,
      },
      { type: 'sim', key: 's:the-crash-simulated', title: 'The crash, simulated', struct: 'dll', setup: { values: [7] }, op: 'deleteBegNotes' },
      { type: 'walk', key: 'w:dll-delete-beg', title: 'Build it in code: delete at the beginning (corrected)', impl: 'dll-delete-beg', body: 'The corrected version: head.prev = NULL only when a node is left. Run the “one node” case — no crash.' },
      { type: 'walk', key: 'w:dll-delete-end', title: 'Build it in code: delete at the end (corrected)', impl: 'dll-delete-end' },
      { type: 'exercise', key: 'e:delete-both-directions', title: 'Delete, both directions', templateId: 'l10-rewire-delete', guidance: 'full' },
      { type: 'sim', key: 's:verify-forward', title: 'Verify forward…', concepts: ['l10.dll-traverse'], struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseFwd', predict: ['output'] },
      { type: 'sim', key: 's:and-backward', title: '…and backward', extension: true, struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseBwd', predict: ['output'] },
      { type: 'exercise', key: 'e:required-forward-looks-right-backward-is-broken-', title: 'Required: forward looks next, backward is broken — repair it', templateId: 'l10-repair-back', guidance: 'full' },
      { type: 'exercise', key: 'e:predict-a-traversal', title: 'Predict a traversal', templateId: 'l10-traverse-both', guidance: 'less' },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-recursion',
        title: 'Before you start: recursion',
        body: `A **recursive** function calls itself on a smaller part of the problem. Two parts are always needed:
- a **base case** that is answered directly (an empty list: \`p == NULL\` → 0 nodes);
- a **recursive case** that reduces the problem (1 for this node + the count of the rest: \`count_nodes(p->next)\`).

Every call gets its own **frame** with its own copy of the parameters, pushed on the **call stack**; when a call returns, its frame is removed and the caller continues where it stopped. Without a reachable base case the calls never stop (in C++ the stack overflows; Python raises \`RecursionError\`; the Lab stops at its step limit). The same idea drives the tree traversals and DFS in Lec 14.`,
      },
      { type: 'sim', key: 's:recursive-countnode', title: 'Recursive count_nodes()', concepts: ['l10.countnode'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'count_nodes', body: 'Watch the call stack grow to n + 1 frames and the returns add 1 on the way back.' },
      { type: 'walk', key: 'w:dll-countnode', title: 'Build it in code: recursive count_nodes()', impl: 'dll-countnode', body: 'The Variables panel shows one frame per running call — each with its own p.' },
      { type: 'exercise', key: 'e:recursion-questions', title: 'Recursion questions', templateId: 'l10-countnode', guidance: 'less' },
      { type: 'exercise', key: 'e:complete-the-code', title: 'Complete the code', templateId: 'l10-fill', guidance: 'less' },
      {
        type: 'read',
        key: 'r:what-the-extra-link-buys',
        title: 'What the extra link makes possible',
        body: `- **Delete a node you already point at** without searching for the node before it: its prev neighbour is \`temp->prev\`.
- **Walk backwards** from the last node to the first by following prev links.
- **The price:** every node stores one more pointer, and every insertion or deletion has to update twice as many links — forgetting one of them leaves the list broken in one direction (see the backward-traversal repair exercise).`,
      },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:dll-pitfalls',
        title: 'Doubly linked lists: common mistakes and edge cases',
        body: `- **Updating only one direction.** Every insertion and deletion changes links in BOTH directions; forgetting a prev link leaves forward traversal correct and backward traversal wrong.
- **Following a NULL neighbour.** The first node has no prev neighbour and the last no next neighbour: \`temp->prev->next\` crashes when temp is the first node, \`temp->next->prev\` when it is the last.
- **One-node lists** in delete at the beginning / end (the notes’ versions crash — see the correction above).
- **Empty list** for insertion: there is no old first node whose prev must change.
- **Order of updates.** Use the old neighbour’s links before overwriting them; save a pointer if necessary.
- **Recursion without a base case** (count_nodes): every call must eventually reach \`p == NULL\`.`,
      },
      { type: 'exercise', key: 'e:predict-a-doubly-linked-program', title: 'Predict what a doubly linked program prints', templateId: 'l10-predict-output', params: { impl: 'dll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-back-link', title: 'Complete the missing link', templateId: 'l10-complete-code', params: { impl: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-insert-end', title: 'Write it yourself: insert at the end', templateId: 'l10-write-code', params: { lab: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-delete-first', title: 'Write it yourself: delete the first node', templateId: 'l10-write-code', params: { lab: 'dll-delete-first' }, guidance: 'none' },
    ],
  },
  // ===================================================================== stack
  {
    id: 'stack',
    sections: [
      {
        type: 'read',
        key: 'r:restricted-lists-lifo-and-fifo',
        title: 'Restricted lists: LIFO and FIFO',
        concepts: ['l12.lifo-fifo'],
        body: `A **stack** inserts and deletes at ONE end, the **top**: Last In, First Out (LIFO). Operations: **push**, **pop**, and **peek** (read the top without removing — supplementary).

A **queue** inserts at the **rear** and deletes at the **front**: First In, First Out (FIFO). Operations: **enqueue** (enqueue), **dequeue** (dequeue), and **front** (read the front item).

**Organisation.** Both are ordinary lists with a restriction on where items may enter and leave, so both can be stored in an **array** (with index variables) or as **linked nodes** (with pointer variables). Terms: **overflow** = pushing / enqueuing when no space is left; **underflow** = popping / dequeuing when there is nothing to remove.

**Uses.** A stack fits work that must be finished in reverse order: undoing the most recent action first, the call stack of a running program (Lec 10’s recursion), the explicit stack of the inorder traversal and DFS (Lec 14). A queue fits work served in arrival order: jobs waiting for a printer, and the vertices waiting in BFS (Lec 14).`,
      },
      { type: 'exercise', key: 'e:required-same-input-stack-vs-queue', title: 'Required: same input, stack vs queue', templateId: 'l12-removal-order', guidance: 'full' },
      {
        type: 'note',
        key: 'n:exactly-what-top-f-and-r-mean',
        variant: 'terms',
        title: 'Exactly what top, F and R mean',
        body: `| Implementation | Variable | Meaning | Empty | Full |
|---|---|---|---|---|
| Array stack (notes) | top | index of the next FREE slot = number of items (starts 0) | top == 0 | top == MAX |
| Array stack (index style) | top | index of the TOP item (starts −1) | top == −1 | top == MAX−1 |
| Linked stack at the head | top | pointer to the first node | top == NULL | only if malloc fails |
| Linked stack at the tail (notes p.4) | top | pointer to the LAST node; head is the bottom | top == NULL | only if malloc fails |
| Linear array queue (notes) | F, R | F = index of front item, R = index of next free slot | F == R | R == MAX |
| Linked queue (notes p.6) | front, rear | pointers to the first and LAST node | front == NULL | only if malloc fails |`,
      },
      {
        type: 'code',
        key: 'c:array-stack-notes-in-c-and-c',
        title: 'Array stack (notes) in every language',
        concepts: ['l12.array-stack'],
        body: 'The notes’ convention: top is the number of items, which is also the index of the next free slot. pop returns −1 when the stack is empty (this program’s way of saying “no value”).',
        c: `#define MAX 6
int stack[MAX];
int top = 0;                  /* next free slot */

void push(int data) {
    if (top == MAX) { printf("stack overflow"); return; }
    stack[top] = data;
    ++top;
}
int pop(void) {
    if (top == 0) { printf("stack underflow"); return -1; }
    return stack[--top];      /* decrement first, then read */
}`,
        cpp: `const int MAX = 6;
int stack[MAX];
int top = 0;                  // next free slot = number of items

void push(int data) {
    if (top == MAX) { cout << "stack overflow\\n"; return; }
    stack[top] = data;
    top = top + 1;            // ++top
}
int pop() {
    if (top == 0) { cout << "stack underflow\\n"; return -1; }
    top = top - 1;            // decrement first, then read
    return stack[top];
}`,
        py: `MAX = 6
stack = [None] * MAX
top = 0                       # next free slot = number of items

def push(data):
    global top
    if top == MAX:
        print("stack overflow")
        return
    stack[top] = data
    top = top + 1

def pop():
    global top
    if top == 0:
        print("stack underflow")
        return -1
    top = top - 1             # decrement first, then read
    return stack[top]`,
        pseudo: `MAX = 6
stack = new Array(MAX)
top = 0                       # next free slot = number of items

function push(data)
    if top == MAX then
        print "stack overflow"
        return
    end if
    stack[top] = data
    top = top + 1
end function

function pop()
    if top == 0 then
        print "stack underflow"
        return -1
    end if
    top = top - 1             # decrement first, then read
    return stack[top]
end function`,
      },
      { type: 'sim', key: 's:array-stack-pushes-until-overflow-then-pops-unti', title: 'Array stack: pushes until overflow, then pops until underflow', struct: 'astack', setup: { MAX: 3 }, ops: [{ op: 'push', x: 11 }, { op: 'push', x: 22 }, { op: 'push', x: 33 }, { op: 'push', x: 44 }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }], predict: ['write', 'read'] },
      { type: 'walk', key: 'w:stack-array', title: 'Build it in code: an array stack', impl: 'stack-array', body: 'Pushes until overflow, then pops until underflow. Watch top and the array cells: a popped value stays in its slot but is no longer part of the stack.' },
      { type: 'exercise', key: 'e:track-top', title: 'Track top', templateId: 'l12-astack-top', guidance: 'full' },
      { type: 'sim', key: 's:linked-stack-notes-style-push-pop-at-the-end', title: 'Linked stack, notes style: push/pop at the END', concepts: ['l12.linked-stack'], struct: 'lstack-tail', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Watch the pop: temp has to walk from head to the node BELOW top, because a node only knows the node after it.' },
      { type: 'walk', key: 'w:stack-linked-end', title: 'Build it in code: the notes’ linked stack', impl: 'stack-linked-end' },
      { type: 'sim', key: 's:linked-stack-at-the-head', title: 'Linked stack at the HEAD', extension: true, struct: 'lstack-head', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Same pushes and pop with the top at the head: push and pop only touch the first node, so nothing walks.' },
      { type: 'walk', key: 'w:stack-linked', title: 'Build it in code: a linked stack with the top at the first node', impl: 'stack-linked', body: 'push = insert at the beginning and pop = delete at the beginning from Lec 08/09. Compare it with the notes’ version: the same output, but no walking.' },
      { type: 'exercise', key: 'e:push-pop-by-rewiring', title: 'Push/pop by rewiring', templateId: 'l12-rewire-stack', guidance: 'full' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:stack-pitfalls',
        title: 'Stacks: common errors and edge cases',
        body: `- **Mixing the conventions for top.** When top counts the items, push writes and THEN increments, and pop decrements and THEN reads. When top is the index of the top item (starting at −1) the order is reversed. Mixing the two is an off-by-one error.
- **Missing overflow and underflow checks.** Pushing onto a full array writes past its end; popping an empty stack reads an invalid index.
- **Empty linked stack.** Pushing onto an empty linked stack sets top to the new node, whose next pointer is NULL.
- **Freeing before reading.** Copy the value out of the node before the node is deleted.`,
      },
      { type: 'exercise', key: 'e:predict-a-stack-or-queue-program', title: 'Predict the output of a stack program', templateId: 'l12-predict-output', params: { module: 'stack', impl: 'stack-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-push-or-dequeue', title: 'Complete a stack operation', templateId: 'l12-complete-code', params: { module: 'stack' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-stack', title: 'Write it yourself: push and pop for an array stack', templateId: 'l12-write-code', params: { lab: 'astack-push-pop' }, guidance: 'less' },
    ],
  },
  // ===================================================================== queue
  {
    id: 'queue',
    sections: [
      { type: 'sim', key: 's:linear-array-queue-wasted-slots', title: 'Linear array queue: wasted slots', concepts: ['l12.array-queue'], struct: 'aqueue', setup: { MAX: 4 }, ops: [{ op: 'enqueue', x: 11 }, { op: 'enqueue', x: 22 }, { op: 'dequeue' }, { op: 'enqueue', x: 33 }, { op: 'enqueue', x: 44 }, { op: 'enqueue', x: 55 }] , predict: ['write', 'read'], body: 'The last enqueue fails although slot 0 is free: F and R only move forward.' },
      { type: 'walk', key: 'w:queue-array', title: 'Build it in code: a linear array queue', impl: 'queue-array' },
      { type: 'note', key: 'n:circular-array-queue', variant: 'supplementary', title: 'Circular array queue', extension: true, body: 'Advance indices with `R = (R + 1) % MAX` and `F = (F + 1) % MAX`, and keep a `count` (or leave one slot unused) to tell full from empty. Freed slots are then reused. Try mode “circular” in Explore.' },
      { type: 'exercise', key: 'e:track-f-and-r', title: 'Track F and R', templateId: 'l12-aqueue-fr', guidance: 'less' },
      { type: 'exercise', key: 'e:which-operations-fail', title: 'Which operations fail?', templateId: 'l12-fails', guidance: 'less' },
      { type: 'sim', key: 's:linked-queue-removing-the-final-item', title: 'Linked queue: removing the final item', concepts: ['l12.linked-queue'], struct: 'lqueue', ops: [{ op: 'enqueue', x: 10 }, { op: 'enqueue', x: 20 }, { op: 'dequeue' }, { op: 'dequeue' }] , predict: ['var'], body: 'When the last item leaves, rear must also become NULL.' },
      { type: 'walk', key: 'w:queue-linked', title: 'Build it in code: a linked queue', impl: 'queue-linked', body: 'Run both starting situations. In each run the final dequeue empties the queue: watch rear become NULL together with front.' },
      { type: 'exercise', key: 'e:enqueue-dequeue-by-rewiring', title: 'Enqueue / dequeue by rewiring', templateId: 'l12-rewire-queue', params: { op: 'dequeue', n: 1 }, guidance: 'full' },
      { type: 'exercise', key: 'e:variation', title: 'Variation', templateId: 'l12-rewire-queue', guidance: 'less' },
      { type: 'exercise', key: 'e:what-exactly-does-it-mean', title: 'What exactly does it mean?', templateId: 'l12-meaning', guidance: 'less' },
      { type: 'exercise', key: 'e:stack-or-queue', title: 'Stack or queue?', templateId: 'l12-choose', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:stack-queue-pitfalls',
        title: 'Queues: common errors and edge cases',
        body: `- **A linear queue reports “full” while slots are free.** rear == MAX is reported as full even after dequeue operations, because the slots before front are never reused. A circular array queue removes this limitation.
- **Linked queue: forgetting rear.** When the final item is dequeued, rear must also become NULL; otherwise the next enqueue links a new node to deleted memory.
- **Empty linked queue.** Enqueuing into an empty linked queue sets BOTH front and rear.
- **Missing underflow check.** Dequeuing from an empty queue must be detected before any value is read.
- **Freeing before reading.** Copy the value out of the node before the node is deleted.`,
      },
      { type: 'exercise', key: 'e:predict-a-queue-program', title: 'Predict the output of a queue program', templateId: 'l12-predict-output', params: { module: 'queue', impl: 'queue-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-queue-operation', title: 'Complete a queue operation', templateId: 'l12-complete-code', params: { module: 'queue' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-queue', title: 'Write it yourself: enqueue and dequeue for an array queue', templateId: 'l12-write-code', params: { lab: 'aqueue-enqueue-dequeue' }, guidance: 'none' },
    ],
  },
  // ===================================================================== tree
  {
    id: 'tree',
    sections: [
      {
        part: 'Terminology and representation',
        type: 'read',
        key: 'r:trees-hierarchy-with-one-parent-per-node',
        title: 'Trees: hierarchy with one parent per node',
        concepts: ['l13.tree-terms'],
        body: `A **tree** has one **root**; every other node has **exactly one** incoming link (its **parent**). Links leaving a node go to its **children**; nodes without children are **leaves**, the others are **internal**.

- **path**: n₁, n₂, …, nₖ where each nᵢ is the parent of nᵢ₊₁
- **siblings**: children of the same parent
- **ancestor / descendant**: A is an ancestor of B if there is a path from A down to B
- **subtree**: a node together with all its descendants

In a **binary** tree each node has at most 2 children, called **left** and **right** (the order matters).

**Purpose and uses.** Lists are linear — each item has one successor. A tree represents a **hierarchy**: one item can lead to several others (Lec 13 p.1), such as folders inside folders, or the chapters, sections and subsections of a document. In code a binary tree node is a list node with TWO links: \`left\` and \`right\`; the whole tree is reached through the pointer \`root\` (NULL for an empty tree).`,
      },
      {
        type: 'code',
        key: 'c:a-binary-tree-node',
        title: 'A binary tree node in every language',
        body: 'Three fields: the value and the addresses of the two children. A new node has no children (both links NULL) — it is a leaf until children are attached.',
        c: `struct tnode {
    char data;
    struct tnode *left, *right;
};
typedef struct tnode tnode;
tnode *root = NULL;                    /* empty tree */

tnode *create_node(char value) {
    tnode *n = (tnode *) malloc(sizeof(tnode));
    n->data = value;
    n->left = n->right = NULL;
    return n;
}`,
        cpp: `struct Node {
    char data;
    Node* left;     // nullptr = no left child
    Node* right;    // nullptr = no right child
};
Node* root = nullptr;                  // empty tree

Node* create_node(char value) {
    return new Node{value, nullptr, nullptr};
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data
        self.left = None      # no left child
        self.right = None     # no right child

root = None                   # empty tree

def create_node(value):
    return Node(value)`,
        pseudo: `# Lab tree nodes have the fields data, left and right; new Node(v) sets both links to NULL.
root = NULL                   # empty tree

function create_node(value)
    new_node = new Node(value)
    return new_node
end function`,
      },
      { type: 'walk', key: 'w:tree-create', title: 'Build it in code: create a binary tree', impl: 'tree-create' },
      { type: 'exercise', key: 'e:select-relationships', title: 'Select relationships', templateId: 'l13-relations', guidance: 'full' },
      {
        type: 'read',
        key: 'r:level-height-depth',
        title: 'Level, height, depth',
        concepts: ['l13.tree-measures'],
        body: `- **level** of a node = its distance (edges) from the root; the root is level 0.
- **height** of the tree = the maximum level. One node → height 0.`,
      },
      {
        type: 'note',
        key: 'n:height-and-depth-conventions',
        variant: 'correction',
        title: 'Height and depth conventions',
        body: `The notes define **depth** as the number of **nodes** on the root→node path, so depth = level + 1 (root depth 1). Most textbooks define depth in **edges** (depth = level, root depth 0). Similarly, some books measure height in nodes (one more than here) and give the empty tree height −1 or 0. The formulas below assume the notes’ **edge-based** height. Always check the convention before answering.`,
      },
      { type: 'exercise', key: 'e:measure-the-tree', title: 'Measure the tree', templateId: 'l13-measures', guidance: 'full' },
      { type: 'demo', key: 'd:node-count-formulas-visually', title: 'Node-count formulas, visually', kind: 'formulas', body: 'Move the slider: the fullest tree of height h has 2^l nodes on level l, 2^h leaves and 2^(h+1) − 1 nodes. Any tree with n nodes has n − 1 edges.' },
      { type: 'note', key: 'n:n-1-edges-holds-for-every-tree', variant: 'correction', title: 'n − 1 edges holds for every tree', body: 'The notes state it for full binary trees, but every tree with n ≥ 1 nodes has exactly n − 1 edges, because every node except the root has exactly one incoming edge.' },
      { type: 'exercise', key: 'e:use-the-formulas', title: 'Use the formulas', templateId: 'l13-formulas', guidance: 'less' },
      {
        type: 'read',
        key: 'r:strictly-binary-full-complete',
        title: 'Strictly binary, “full”, complete',
        concepts: ['l13.tree-classify'],
        body: `- **Strictly binary** (notes): every non-leaf has exactly two children.
- **Full** (notes): all leaves on level h and every internal node has 2 children.
- **Complete**: the n nodes occupy positions 1..n of the level-order numbering (every level full except possibly the last, filled from the left).`,
      },
      {
        type: 'note',
        key: 'n:full-and-perfect-are-named-differently-in-differ',
        variant: 'terms',
        title: '“Full” and “perfect” are named differently in different books',
        body: `| Shape | Notes call it | Most textbooks call it |
|---|---|---|
| every node has 0 or 2 children | strictly binary | **full** (or proper) |
| 0 or 2 children AND all leaves on the last level | full | **perfect** |
| filled level by level, left to right | complete | complete |

So “full binary tree” in an exam may mean either — read the definition given.`,
      },
      { type: 'exercise', key: 'e:classify-trees', title: 'Classify trees', templateId: 'l13-classify', guidance: 'full' },
      { type: 'demo', key: 'd:array-positions-vs-linked-child-pointers', title: 'Array positions vs linked child pointers', kind: 'treeRepr', concepts: ['l13.tree-repr'], body: 'Click a node: see its array index (0- and 1-based) next to its linked node with left/right addresses. Gaps in an incomplete tree waste array slots.' },
      { type: 'exercise', key: 'e:array-index-arithmetic', title: 'Array index arithmetic', templateId: 'l13-array-index', guidance: 'full' },
      { type: 'walk', key: 'w:tree-array', title: 'Build it in code: a tree stored in an array', impl: 'tree-array', body: 'No pointers at all: the position of a value in the array says where it is in the tree. Try the root (no parent) and a leaf (no children) as well.' },
      { type: 'exercise', key: 'e:build-a-tree-from-its-array', title: 'Build a tree from its array', templateId: 'l13-build-tree', guidance: 'less' },
      { type: 'demo', key: 'd:build-your-own-binary-tree', title: 'Build your own binary tree', kind: 'treeBuilder', body: 'Add and remove nodes; height, levels, classification and both representations update live. The BST mode is clearly marked supplementary: Lec 13 covers general binary trees, in which values are NOT ordered.' },
      { type: 'exercise', key: 'e:predict-a-tree-or-graph-program', title: 'Predict the output of a tree program', templateId: 'l13-predict-output', params: { module: 'tree', impl: 'tree-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-tree-or-graph-code', title: 'Complete a tree operation', templateId: 'l13-complete-code', params: { module: 'tree' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-build-a-tree', title: 'Write it yourself: build part of a tree', templateId: 'l13-write-code', params: { lab: 'tree-build' }, guidance: 'less' },
      {
        part: 'Tree traversals',
        type: 'read',
        key: 'r:three-depth-first-orders-for-binary-trees',
        title: 'Three depth-first orders for binary trees',
        concepts: ['l14.tree-traversal'],
        body: `- **Preorder**: Root, Left, Right
- **Inorder**: Left, Root, Right
- **Postorder**: Left, Right, Root

All three ENTER the nodes in the same order — they only differ in **when** a node is OUTPUT. The stars (*) the notes draw above letters mark the root of each subtree at the moment it is output.`,
      },
      { type: 'sim', key: 's:preorder-on-the-lecture-tree-entered-vs-output', title: 'Preorder on the lecture tree (entered vs output)', struct: 'tree', tree: 'example', op: 'preorder', predict: ['output'] },
      { type: 'exercise', key: 'e:required-click-the-preorder', title: 'Required: click the preorder', templateId: 'l14-tree-order', params: { order: 'preorder', exampleTree: true }, guidance: 'full' },
      { type: 'sim', key: 's:inorder', title: 'Inorder', struct: 'tree', tree: 'example', op: 'inorder', predict: ['output'] },
      { type: 'exercise', key: 'e:required-click-the-inorder', title: 'Required: click the inorder', templateId: 'l14-tree-order', params: { order: 'inorder', exampleTree: true }, guidance: 'full' },
      { type: 'sim', key: 's:postorder', title: 'Postorder', struct: 'tree', tree: 'example', op: 'postorder', predict: ['output'] },
      { type: 'exercise', key: 'e:required-click-the-postorder', title: 'Required: click the postorder', templateId: 'l14-tree-order', params: { order: 'postorder', exampleTree: true }, guidance: 'full' },
      { type: 'walk', key: 'w:tree-traversals', title: 'Build it in code: the three recursive traversals', impl: 'tree-traversals', body: 'Pick an order: only the position of the print differs. The Variables panel shows one frame per running call, so you can see how deep the recursion is at every moment. The “Empty tree” case shows the base case on its own.' },
      { type: 'sim', key: 's:inorder-with-an-explicit-stack-the-notes-stack-p', title: 'Inorder with an explicit stack (the notes’ stack pictures)', struct: 'tree', tree: 'example', op: 'inorderStack', predict: ['push', 'pop'] },
      { type: 'walk', key: 'w:tree-inorder-stack', title: 'Build it in code: inorder with an explicit stack', impl: 'tree-inorder-stack', body: 'The stack is the array stack of Lec 12, holding node addresses. Compare the stack contents with the notes’ pictures.' },
      { type: 'exercise', key: 'e:stack-contents', title: 'Stack contents', templateId: 'l14-inorder-stack', params: { exampleTree: true }, guidance: 'less' },
      { type: 'exercise', key: 'e:entered-vs-output-on-a-new-tree', title: 'Entered vs output on a new tree', templateId: 'l14-entered-output', guidance: 'less' },
      { type: 'demo', key: 'd:now-create-another-tree-and-traverse-it', title: 'Now create another tree and traverse it', kind: 'treeBuilder', traverse: true, body: 'Build any binary tree, then run preorder, inorder or postorder on it in the workspace.' },
      { type: 'exercise', key: 'e:variation-a-random-tree', title: 'Variation: a random tree', templateId: 'l14-tree-order', guidance: 'less' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:tree-pitfalls',
        title: 'Trees: common errors and edge cases',
        body: `- **0-based and 1-based positions.** With the root at index 0, the children of i are 2i + 1 and 2i + 2 and the parent is (i − 1) / 2; with the root at index 1 they are 2i, 2i + 1 and i / 2. Mixing the two selects the wrong node.
- **Integer division.** The parent formula rounds DOWN: C++ integer division and the pseudocode \`div\` operator do; Python requires \`//\` (\`/\` produces a fraction).
- **Positions outside the array and empty positions.** A leaf on the last level has child positions beyond the array, and an incomplete tree has empty slots. Check both before reading a child.
- **Empty tree.** When root == NULL there is no root.left to assign; create the root first.
- **Losing a subtree.** Assigning a new node to a child pointer that already holds a subtree loses that subtree.
- **Missing base case.** A recursive traversal must return on an empty subtree (NULL); otherwise it dereferences NULL.
- **Output in the wrong place.** Preorder outputs a node before both recursive calls, inorder between them, and postorder after both.
- **Iterative traversal of an empty tree.** The traversal outputs nothing and must not pop from an empty stack.`,
      },
      { type: 'exercise', key: 'e:predict-a-traversal-program', title: 'Predict what a traversal program prints', templateId: 'l14-predict-output', params: { impl: 'tree-traversals' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-tree-traversal', title: 'Complete a tree traversal', templateId: 'l14-complete-code', params: { module: 'tree' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-inorder', title: 'Write it yourself: inorder traversal', templateId: 'l14-write-code', params: { lab: 'tree-inorder' }, guidance: 'less' },
    ],
  },
  // ===================================================================== graph
  {
    id: 'graph',
    sections: [
      {
        part: 'Graph representation',
        type: 'read',
        key: 'r:graphs-and-their-representations',
        title: 'Graphs and their representations',
        concepts: ['l13.graph-repr'],
        body: `A graph allows **more than one incoming link** and cycles. Edges may be **directed** (arrows) or **undirected**, and may carry **weights**.

- **Adjacency matrix**: V×V table; [u][v] = 1 (or the weight) if there is an edge u→v. Undirected graphs give a symmetric matrix. In the notes’ weighted matrix, “no edge” is ∞ and the diagonal is 0. A **self-loop** is a 1 on the diagonal. The matrix has a cell for every pair of vertices, whether the edge exists or not.
- **Adjacency list**: for each vertex a linked list of its neighbours (Lec 13 p.6 bottom). It stores only the edges that exist.

**Terms.** The items are **vertices**, the links **edges**. Two vertices joined by an edge are **adjacent** (neighbours); the **degree** of a vertex is its number of edges (in a directed graph: out-degree / in-degree). A **path** follows edges from vertex to vertex; a **cycle** is a path that returns to its head.

**Uses.** Graphs model networks where anything may connect to anything: road maps (vertices = places, weighted edges = distances), computer networks, “must be done before” relations between tasks. Choose the **matrix** when you often ask “is there an edge u–v?” and the graph is dense; choose **adjacency lists** when most vertices have few neighbours and you mostly visit the neighbours of a vertex.`,
      },
      { type: 'demo', key: 'd:graph-editor-watch-the-matrix-and-list-update', title: 'Graph editor: watch the matrix and list update', kind: 'graphEditor', body: 'Add vertices and edges (directed or not, weighted or not, self-loops allowed). Start from the notes’ examples.' },
      { type: 'walk', key: 'w:graph-matrix', title: 'Build it in code: an adjacency matrix', impl: 'graph-matrix', body: 'A 2-D array: an array of rows, each row an array. The diagram shows the matrix filling in as the edges are added.' },
      { type: 'walk', key: 'w:graph-adjlist', title: 'Build it in code: adjacency lists of nodes', impl: 'graph-adjlist', body: 'One linked list per vertex, built with the insert-at-the-end of Lec 08. The diagram draws every list head with its chain of nodes.' },
      { type: 'exercise', key: 'e:drawing-matrix', title: 'Drawing → matrix', templateId: 'l13-matrix', guidance: 'full' },
      { type: 'exercise', key: 'e:matrix-list', title: 'Matrix → list', templateId: 'l13-adjlist', guidance: 'less' },
      { type: 'exercise', key: 'e:list-drawing', title: 'List → drawing', templateId: 'l13-draw', guidance: 'less' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:tree-graph-pitfalls',
        title: 'Graph representation: common errors and edge cases',
        body: `- **Matrix direction.** For a directed edge u → v only M[u][v] is set; for an undirected edge set both M[u][v] and M[v][u].
- **Vertices numbered from 1.** Arrays are indexed from 0: vertex v uses row v − 1 (or the matrix is made one larger and row 0 is left unused).
- **Adjacency list order.** The order of the nodes in each adjacency list determines the order in which a traversal examines neighbors.`,
      },
      { type: 'exercise', key: 'e:predict-a-graph-program', title: 'Predict the output of a graph program', templateId: 'l13-predict-output', params: { module: 'graph', impl: 'graph-matrix' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-graph-code', title: 'Complete a graph operation', templateId: 'l13-complete-code', params: { module: 'graph' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-an-adjacency-matrix', title: 'Write it yourself: an adjacency matrix', templateId: 'l13-write-code', params: { lab: 'graph-matrix-build' }, guidance: 'none' },
      {
        part: 'Graph traversal',
        type: 'read',
        key: 'r:dfs-and-bfs-on-graphs',
        title: 'DFS and BFS on graphs',
        concepts: ['l14.dfs', 'l14.bfs'],
        body: `**Depth-first search** goes as deep as possible, then **backtracks** (the curved arrows on p.2). It uses a **stack** — usually the recursion call stack.

**Breadth-first search** visits all neighbours of a vertex before going further, ring by ring. It uses a **queue**.

Both mark vertices as **visited (discovered)** so cycles do not cause infinite loops. The order depends on the **neighbour order**: here it is always ascending (alphabetical / numeric), which reproduces the notes’ answers on p.4: DFS a b c g d e f i h and BFS a b e f c d g i h.

Four separate things to track: **discovered** (seen), **processed** (all neighbours examined), the **frontier** (stack or queue), and the **output** order.

**In code.** “Discovered” is a set of vertices (the Lab’s \`Set\`) or one true/false entry per vertex (\`bool visited[N]\` in C++, \`[False] * N\` in Python). BFS keeps its frontier in a **queue** — the array queue of Lec 12 is enough, because every vertex enters it at most once. DFS uses **recursion**: the call stack holds the vertices whose neighbours are still being examined, and returning from a call is the backtracking.`,
      },
      { type: 'sim', key: 's:dfs-from-a-lec-14-p-4-graph', title: 'DFS from a (Lec 14 p.4 graph)', struct: 'graph', graph: 'example', op: 'dfs', start: 'a', predict: ['discover'] },
      { type: 'walk', key: 'w:graph-dfs', title: 'Build it in code: DFS with recursion', impl: 'graph-dfs', body: 'The pseudocode uses the Lab’s graph G; the C++ and Python versions build the same graph as an adjacency matrix and keep a visited array. All three print a b c g d e f i h from a.' },
      { type: 'exercise', key: 'e:click-the-dfs-order', title: 'Click the DFS order', templateId: 'l14-dfs-click', params: { example: true, start: 'a' }, guidance: 'full' },
      { type: 'sim', key: 's:bfs-from-a', title: 'BFS from a', struct: 'graph', graph: 'example', op: 'bfs', start: 'a', predict: ['output'] },
      { type: 'walk', key: 'w:graph-bfs', title: 'Build it in code: BFS with a queue', impl: 'graph-bfs', body: 'C++ and Python write the queue out as an array with F and R (Lec 12). All three versions print a b e f c d g i h from a.' },
      { type: 'exercise', key: 'e:click-the-bfs-order', title: 'Click the BFS order', templateId: 'l14-bfs-click', params: { example: true, start: 'a' }, guidance: 'full' },
      {
        type: 'note',
        key: 'n:edge-labels-on-p-3-are-discovery-order-not-dista',
        variant: 'correction',
        title: 'Edge labels on p.3 are discovery order, not distances',
        body: `The numbers 1–8 on the DFS and BFS trees of p.3 number the edges in the order they were used. The BFS **distance** of e from a is 1 edge (a–e is a direct edge), not 2; h is 3 edges away (a–e–g–h). BFS finds, for every reachable vertex, a path with the **fewest edges**.`,
      },
      { type: 'exercise', key: 'e:what-is-in-the-frontier', title: 'What is in the frontier?', templateId: 'l14-frontier', guidance: 'less' },
      { type: 'sim', key: 's:cycles-a-self-loop-and-a-disconnected-part', title: 'Cycles, a self-loop and a disconnected part', extension: true, concepts: ['l14.components'], struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', body: 'One BFS from A never reaches D, E, F or G.' },
      { type: 'sim', key: 's:traversing-the-whole-graph', title: 'Traversing the WHOLE graph', extension: true, struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', all: true, body: 'Restart from the next undiscovered vertex until every vertex is visited: one BFS per component.' },
      { type: 'exercise', key: 'e:component-or-whole-graph', title: 'Component or whole graph?', templateId: 'l14-components', guidance: 'less' },
      { type: 'note', key: 'n:bfs-minimises-edges-not-total-weight', variant: 'correction', title: 'BFS minimises edges, not total weight', body: 'On the weighted graph from Lec 13, BFS from A reaches D via A–B–D (2 edges, weight 3 + 4 = 7), but A–B–C–D weighs 3 + 2 + 1 = 6. BFS ignores weights; minimum-weight paths need Dijkstra’s algorithm (not covered in these lectures).' },
      { type: 'exercise', key: 'e:bfs-on-a-weighted-graph', title: 'BFS on a weighted graph', templateId: 'l14-bfs-weight', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-bfs-on-a-new-graph', title: 'Variation: BFS on a new graph', templateId: 'l14-bfs-click', guidance: 'none' },
      { type: 'exercise', key: 'e:variation-dfs-on-a-new-graph', title: 'Variation: DFS on a new graph', templateId: 'l14-dfs-click', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:traversal-pitfalls',
        title: 'Graph traversal: common errors and edge cases',
        body: `- **Not marking vertices.** Without “discovered” marks, a cycle makes breadth-first search enqueue vertices indefinitely and depth-first search recurse indefinitely.
- **Marking too late in breadth-first search.** Mark a vertex when it is enqueued, not when it is output; otherwise it can be enqueued twice.
- **Using a stack instead of a queue (or the reverse).** Taking the most recently discovered vertex produces a depth-first order; breadth-first search takes the oldest (FIFO).
- **Neighbor order.** Different neighbor orders produce different, equally valid, traversal orders; the examples in this module examine neighbors in alphabetical order.
- **Unreachable vertices.** One traversal visits only the component of the start vertex; restart from every undiscovered vertex to visit the whole graph.`,
      },
      { type: 'exercise', key: 'e:complete-a-traversal', title: 'Complete a graph traversal', templateId: 'l14-complete-code', params: { module: 'graph' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-bfs', title: 'Write it yourself: breadth-first search', templateId: 'l14-write-code', params: { lab: 'graph-bfs' }, guidance: 'none' },
    ],
  },
];

for (const l of LESSONS) {
  const m = MODULES.find((x) => x.id === l.id);
  l.n = m.n;
  l.title = m.title;
}

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
