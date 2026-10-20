// Guided lessons, one per lecture. Every section cites the lecture page it
// comes from; material not in the notes is labelled "Supplementary".
// Section types:
//   read      — explanation (mini-markdown)
//   note      — callout: variant 'correction' | 'terms' | 'supplementary'
//   code      — C (notes style), C++ and pseudocode tabs
//   sim       — worked example in the workspace, pausing for predictions
//   codesim   — run statements line by line (often a buggy vs fixed pair)
//   exercise  — perform / variation (template + guidance level)
//   demo      — custom interactive (formulas, representations, editors)
//   pseudo    — write your own pseudocode (ungraded, compare with a model)

export const LESSONS = [
  // ===================================================================== L07
  {
    lecture: 7,
    id: 'l07',
    title: 'Introduction: arrays, linked lists and memory',
    sections: [
      {
        type: 'read',
        title: 'The map of data structures',
        ref: 'Lec 07 p.1',
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
        ref: 'Supplementary (prerequisite)',
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
        ref: 'Supplementary (prerequisite)',
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
        title: 'Contiguous vs non-contiguous memory',
        ref: 'Lec 07 p.1 (bottom), p.2',
        concepts: ['l07.memory-layout'],
        body: `An **array** occupies one contiguous block: element *i* sits at \`base + i × size\`, so any element is one calculation away.

A **linked list** is non-contiguous: every node is a separate block somewhere on the heap, and each node stores the **address** of the next one. To reach node *k* you must follow *k − 1* links.`,
        visual: { type: 'compareMemory', values: [10, 20, 30, 40] },
      },
      { type: 'exercise', title: 'Try it: compute an address', templateId: 'l07-address', guidance: 'full' },
      {
        type: 'code',
        title: 'Pointers, malloc() and free()',
        ref: 'Lec 07 p.2',
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
        ref: 'Lec 07 p.2 + Supplementary',
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
        ref: 'Lec 07 p.2 + Supplementary',
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
        variant: 'correction',
        title: 'Storage location is not the same as structure type',
        ref: 'Lec 07 p.4 ②',
        body: `The table says “array: memory from the stack — linked list: memory from the heap”. That is only true for a *local* array. A global array lives in the static data area, and \`malloc(n * sizeof(int))\` creates an array **on the heap**. Likewise the pointer \`start\` is a normal variable (stack or static) even though the nodes it reaches are on the heap. Where memory lives depends on **how it was obtained**, not on whether it is an array or a list.`,
      },
      { type: 'exercise', title: 'Where does the memory live?', templateId: 'l07-storage', guidance: 'full' },
      {
        type: 'read',
        title: 'Trade-offs between arrays and linked lists',
        ref: 'Lec 07 p.2–4',
        concepts: ['l07.arrays-vs-lists', 'l07.tradeoffs'],
        body: `| What you want to do | Array | Singly linked list |
|---|---|---|
| Read element *k* | compute its address: base + k·size | follow the links from start, node by node, until node *k* |
| Insert at the front | move every element one slot right, then store the value | create a node and change two links |
| Delete at a known spot | move every later element one slot left | redirect the link that points into the node, then free it |
| Memory per element | just the value | the value + one pointer |
| Size | fixed when it is declared | grows and shrinks while the program runs |

Searching a linked list means visiting the nodes one by one from start, because there is no address formula that jumps to the middle (Lec 07 p.3).`,
      },
      {
        type: 'note',
        variant: 'correction',
        title: '“Deleting from an array is not possible” — what it really means',
        ref: 'Lec 07 p.2 (c), p.4 ⑥',
        body: `You **can** delete an element from an array: shift every later element one slot left and decrease a separate count of used slots. What a plain array cannot do is **shrink (or grow) its allocated size** — the capacity stays fixed. Deletion is possible; *resizing* is not.`,
      },
      {
        type: 'read',
        key: 'r:arrays-purpose-and-terms',
        title: 'Arrays: purpose, organisation and terms',
        ref: 'Lec 07 p.1–4',
        concepts: ['l07.arrays-vs-lists'],
        body: `**Organisation.** An array is ONE block of equally sized **elements** side by side. Each element is identified by its **index**: 0 for the first, 1 for the next, … (C, C++, Python and the pseudocode all count from 0).

**Two different sizes.** The **capacity** (MAX) is fixed when the array is created. How many slots currently hold real values is a separate number the program keeps itself — here **n**. Valid values are in slots 0 … n − 1.

**Operations.**
- *read / write element i*: one address calculation, no matter how large the array is;
- *insert at index pos*: move elements pos … n − 1 one slot to the RIGHT (start from the end), store the value, n = n + 1 — impossible when n == MAX;
- *delete at index pos*: move elements pos + 1 … n − 1 one slot to the LEFT, n = n − 1.

**Use an array when** the maximum number of elements is known and you mostly read or replace elements by position (tables, matrices, the array stack and queue of Lec 12, the tree array of Lec 13). **Prefer a linked list when** elements are frequently inserted or deleted at the front or in the middle, or when the number of elements is unknown.`,
        visual: { type: 'array', n: 6, filled: 4, values: [10, 20, 30, 40], highlight: [] },
      },
      { type: 'walk', key: 'w:array-shift', title: 'Build it in code: an array with insertion and deletion', ref: 'Lec 07 p.2–4', impl: 'array-shift' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:array-pitfalls',
        title: 'Arrays: common mistakes and edge cases',
        ref: 'Lec 07 p.2–4',
        body: `- **Shifting in the wrong direction.** For an insertion, copy from the END backwards (\`a[i] = a[i − 1]\`); copying forwards overwrites values before they have moved. For a deletion, copy forwards (\`a[i] = a[i + 1]\`).
- **Forgetting n.** After an insertion n must grow by 1, after a deletion shrink by 1 — the array itself does not know how many slots are in use.
- **Full array.** Inserting when n == MAX has no free slot: check first and report it.
- **Empty array.** Deleting when n == 0 has nothing to delete.
- **Invalid positions.** Insertion accepts 0 ≤ pos ≤ n (pos = n appends), deletion 0 ≤ pos ≤ n − 1. C++ does **not** check indices: writing outside the array silently corrupts other memory. Python raises an \`IndexError\`; the Lab stops with an error naming the line.
- **Mixing allocation styles.** Memory from \`malloc\` goes back with \`free\`, from \`new[]\` with \`delete[]\`; and never use a block after it has been given back.`,
      },
      { type: 'exercise', key: 'e:count-the-shifts', title: 'Shift the elements', templateId: 'l07-shifts', guidance: 'full' },
      { type: 'exercise', title: 'Spot the memory bug', templateId: 'l07-membug', guidance: 'full' },
      { type: 'exercise', title: 'Variation: choose a structure', templateId: 'l07-choose', guidance: 'less' },
      { type: 'exercise', title: 'Variation: linear or non-linear?', templateId: 'l07-classify', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-the-array-program', title: 'Predict what the array program prints', templateId: 'l07-predict-output', params: { impl: 'array-shift' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-shift', title: 'Complete the shifting loop', templateId: 'l07-complete-code', params: { impl: 'array-shift' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-insert', title: 'Write it yourself: insert into an array', templateId: 'l07-write-code', params: { lab: 'array-insert' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-delete', title: 'Write it yourself: delete from an array', templateId: 'l07-write-code', params: { lab: 'array-delete' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L08
  {
    lecture: 8,
    id: 'l08',
    title: 'Singly linked lists 1: nodes, start, creation, insertion',
    sections: [
      {
        type: 'read',
        title: 'Anatomy of a singly linked list',
        ref: 'Lec 08 p.1',
        concepts: ['l08.node-anatomy', 'l08.traversal-pointer'],
        body: `Each **node** has two fields: \`data\` (the value) and \`next\` (the **address** of the next node). The last node’s next is **NULL** — drawn as **X** in the notes.

\`start\` is a pointer variable holding the address of the first node (many books call it **head**). An empty list is simply \`start = NULL\`.

Keep two numbers apart: a node’s **value** (e.g. 10) and its **address** (e.g. 100). Pointers only ever hold addresses.

**Purpose.** A linked list keeps a sequence whose length changes while the program runs: nodes are created one at a time, wherever memory is free, and the links put them in order. Inserting or deleting only changes a few links — nothing is shifted. The price: to reach the k-th node you must follow the links from start, and every node stores one extra pointer.

**Use it when** the number of items is not known in advance or items are often inserted and removed at the front or in the middle (and later: to build stacks, queues and the adjacency lists of graphs). **Prefer an array** when you mostly access items by their position.`,
        visual: { type: 'list', values: [10, 20, 30, 40] },
      },
      {
        type: 'note',
        variant: 'terms',
        title: 'Lecture terms ↔ standard terms',
        ref: 'Lec 08',
        body: `- **start** = head pointer
- **X** in a diagram = NULL (C) / nullptr (C++)
- **getnode()** = allocate + initialise a node (malloc, read data, next = NULL)
- **temp, prev** = temporary traversal pointers (local variables)
- **position** = 1-based index of a node (the first node is position 1)`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-nodes',
        title: 'Before you start: node types, NULL and functions that change start',
        ref: 'Lec 08 p.1–2 + Supplementary',
        body: `- **A node type** groups fields. C uses \`struct\`; C++ \`struct Node { int data; Node* next; };\`; Python a \`class Node\` whose \`__init__\` sets \`self.data\` and \`self.next\`; the Lab’s nodes simply have the fields data and next.
- **“No node”** is \`NULL\` in C and the pseudocode, \`nullptr\` in C++, \`None\` in Python. An empty list is start == NULL.
- **Reaching a field.** C/C++ follow a pointer with \`->\` (\`temp->next\`); Python and the pseudocode write \`temp.next\`.
- **Comparing with “no node”.** C++ \`p == nullptr\`, Python \`p is None\` (\`is\` asks “the same object?”), pseudocode \`p == NULL\`.
- **Changing start inside a function.** In the C/C++ programs start is a global variable, so a function may assign it. In Python, a function that ASSIGNS a global must say \`global start\` first — without it, \`start = newnode\` creates a new local variable and the list never changes. Pseudocode functions (Lab) can assign globals directly, like C.`,
      },
      {
        type: 'code',
        title: 'Declaring a node and getnode()',
        ref: 'Lec 08 p.1–2',
        body: 'The notes read data with scanf inside getnode(). Here the value is passed in, which is easier to test.',
        c: `struct slinklist {
    int data;
    struct slinklist *next;
};
typedef struct slinklist node;
node *start = NULL;               /* empty list */

node *getnode(int value) {
    node *newnode = (node *) malloc(sizeof(node));
    newnode->data = value;
    newnode->next = NULL;
    return newnode;
}`,
        cpp: `struct Node {
    int data;
    Node* next;
};
Node* start = nullptr;

Node* getnode(int value) {
    return new Node{value, nullptr};   // allocate + initialise
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data          # the value
        self.next = None          # the next node (None = none)

start = None                      # empty list

def getnode(value):
    return Node(value)            # create + initialise`,
        pseudo: `# Lab nodes have the fields data and next; new Node(v) sets next = NULL.
start = NULL                      # empty list

function getnode(value)
    newnode = new Node(value)     # create + initialise
    return newnode
end function`,
      },
      { type: 'exercise', title: 'Value or address?', templateId: 'l08-predict-temp', guidance: 'full' },
      {
        type: 'sim',
        title: 'Worked example: creatlist() builds 10 → 20 → 30',
        ref: 'Lec 08 p.3',
        struct: 'sll',
        setup: { values: [] },
        op: 'createList',
        args: [[10, 20, 30]],
        body: 'Watch temp walk to the end before every append. Use Step Forward / Back; each allocation and link is its own step.',
      },
      {
        type: 'note',
        variant: 'correction',
        title: 'Prose vs code on creation',
        ref: 'Lec 08 p.2 vs p.3',
        body: `The steps on p.2 (c-1, c-2) describe adding each new node at the **front** (newnode->next = start; start = newnode). The code on p.3 adds at the **end** (walk temp to the last node; temp->next = newnode). Both build a list, but in opposite orders: entering 10, 20, 30 gives 30 → 20 → 10 with the p.2 steps and 10 → 20 → 30 with the p.3 code. The p.3 version walks temp from start to the last node before every append.`,
      },
      { type: 'walk', key: 'w:sll-create', title: 'Build it in code: create a list from scratch', ref: 'Lec 08 p.1–3', impl: 'sll-create', body: 'The whole list built from nothing: the node type, getnode(), an append that follows creatlist() on p.3, and a display. Step through it in your language and watch every allocation and every link appear.' },
      {
        type: 'sim',
        title: 'Insert at the beginning',
        ref: 'Lec 08 p.4',
        concepts: ['l08.insert-beg'],
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertBeg',
        args: [5],
        predict: ['link', 'var'],
        body: 'Order matters: (1) newnode->next = start, then (2) start = newnode. Predict each change before it happens.',
      },
      { type: 'walk', key: 'w:sll-insert-beg', title: 'Build it in code: insert at the beginning', ref: 'Lec 08 p.4', impl: 'sll-insert-beg' },
      { type: 'exercise', title: 'Your turn: insert at the beginning', templateId: 'l08-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      {
        type: 'sim',
        title: 'Insert at the end',
        ref: 'Lec 08 p.5',
        concepts: ['l08.insert-end'],
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertEnd',
        args: [50],
        predict: ['var', 'link'],
        body: 'temp walks while temp->next != NULL, so it stops ON the last node, whose next is then changed from NULL to the new node.',
      },
      { type: 'walk', key: 'w:sll-insert-end', title: 'Build it in code: insert at the end', ref: 'Lec 08 p.5', impl: 'sll-insert-end' },
      {
        type: 'exercise',
        title: 'Required example: 10 → 20 → 30, insert 15 after 10 — which links change?',
        ref: 'Lec 08 p.6–7',
        concepts: ['l08.insert-mid'],
        templateId: 'l08-which-links',
        params: { op: 'ins', kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 },
        guidance: 'full',
      },
      {
        type: 'sim',
        title: 'Predict the intermediate states: insert 15 at position 2',
        ref: 'Lec 08 p.6–7',
        struct: 'sll',
        setup: { values: [10, 20, 30] },
        op: 'insertMid',
        args: [15, 2],
        predict: ['var', 'link'],
        body: 'prev follows one node behind temp. When ctr reaches pos, prev is on 10 and temp is on 20.',
      },
      { type: 'exercise', title: 'Now do it: insert 15 after 10', templateId: 'l08-rewire-insert', params: { kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 }, guidance: 'full' },
      {
        type: 'codesim',
        title: 'The lost-access bug — and how saving a reference prevents it',
        ref: 'Lec 08 p.6–7',
        concepts: ['l09.preserve-access'],
        body: 'Both versions insert 15 after 10 with prev on node 10. The buggy one overwrites prev->next while it holds the ONLY address of 20 → 30. The fixed one first saves that address in temp (as the notes do).',
        variants: [
          {
            label: 'Buggy',
            lines: ['newnode = getnode();', 'prev->next = newnode;', 'newnode->next = prev->next;'],
            langs: { cpp: ['Node* newnode = new Node{15, nullptr};', 'prev->next = newnode;', 'newnode->next = prev->next;'], py: ['newnode = Node(15)', 'prev.next = newnode', 'newnode.next = prev.next'], pseudo: ['newnode = new Node(15)', 'prev.next = newnode', 'newnode.next = prev.next'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Fixed (save temp)',
            lines: ['newnode = getnode();', 'temp = prev->next;', 'prev->next = newnode;', 'newnode->next = temp;'],
            langs: { cpp: ['Node* newnode = new Node{15, nullptr};', 'Node* temp = prev->next;', 'prev->next = newnode;', 'newnode->next = temp;'], py: ['newnode = Node(15)', 'temp = prev.next', 'prev.next = newnode', 'newnode.next = temp'], pseudo: ['newnode = new Node(15)', 'temp = prev.next', 'prev.next = newnode', 'newnode.next = temp'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Fixed (reorder)',
            lines: ['newnode = getnode();', 'newnode->next = prev->next;', 'prev->next = newnode;'],
            langs: { cpp: ['Node* newnode = new Node{15, nullptr};', 'newnode->next = prev->next;', 'prev->next = newnode;'], py: ['newnode = Node(15)', 'newnode.next = prev.next', 'prev.next = newnode'], pseudo: ['newnode = new Node(15)', 'newnode.next = prev.next', 'prev.next = newnode'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
        ],
      },
      {
        type: 'note',
        variant: 'correction',
        title: 'Two details in insert_at_mid',
        ref: 'Lec 08 p.7',
        body: `1. **Allocate after validating.** The notes call getnode() before checking pos; on an invalid position the new node is never linked or freed — a memory leak. Check first, allocate second.
2. **The range.** The notes accept \`pos > 1 && pos < nodectr\` (the same test used for deletion). For *insertion*, pos = nodectr is still a middle position (the new node goes just before the last node), so the correct test is \`pos > 1 && pos <= nodectr\`. The simulator uses the corrected test.`,
      },
      { type: 'walk', key: 'w:sll-insert-pos', title: 'Build it in code: insert at any position', ref: 'Lec 08 p.6–7', impl: 'sll-insert-pos', body: 'One function for every position, with both corrections: the position is checked BEFORE a node is allocated, and position n + 1 (after the last node) is accepted. Try every starting situation, including the invalid position.' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-insert-pitfalls',
        title: 'Insertion: common mistakes and edge cases',
        ref: 'Lec 08 p.4–7',
        body: `- **Wrong order of link changes → lost access.** Always link the new node to the rest of the list FIRST (\`newnode->next = …\`), then redirect the link that should point at it.
- **Walking one node too far.** \`while (temp != NULL)\` stops AFTER the last node (temp is NULL and \`temp->next = newnode\` crashes); \`while (temp->next != NULL)\` stops ON it.
- **Empty list.** Insert at the end has no last node when start == NULL: the new node becomes start.
- **Position 1.** Inserting at position 1 must change start itself — no prev node exists.
- **Invalid positions** (0, negative, larger than n + 1): reject them before allocating, or the new node leaks.
- **Python: forgetting \`global start\`.** The assignment then creates a local start: the global list does not change (or Python raises \`UnboundLocalError\`).
- **C++: passing start by value.** \`void insert(Node* start, …)\` changes only a copy; use the global, a reference (\`Node*& start\`) or return the new start.`,
      },
      { type: 'exercise', title: 'Variation: arrange the steps', templateId: 'l08-order-insert', guidance: 'less' },
      { type: 'exercise', title: 'Variation: complete the code', templateId: 'l08-fill', guidance: 'less' },
      { type: 'exercise', title: 'Find the bug', templateId: 'l08-bug', guidance: 'less' },
      { type: 'exercise', title: 'Predict the final list', templateId: 'l08-predict-state', guidance: 'none' },
      { type: 'exercise', key: 'e:predict-the-list-program', title: 'Predict what a list program prints', templateId: 'l08-predict-output', params: { impl: 'sll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-insert-at-beginning', title: 'Complete the missing statement', templateId: 'l08-complete-code', params: { impl: 'sll-insert-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-the-end', title: 'Write it yourself: insert at the end', templateId: 'l08-write-code', params: { lab: 'sll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-a-position', title: 'Write it yourself: insert at any position', templateId: 'l08-write-code', params: { lab: 'sll-insert-pos' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L09
  {
    lecture: 9,
    id: 'l09',
    title: 'Singly linked lists 2: deletion, traversal, free()',
    sections: [
      {
        type: 'read',
        title: 'Deleting safely: save → relink → free',
        ref: 'Lec 09 p.1',
        concepts: ['l09.delete-beg', 'l09.preserve-access'],
        body: `Three rules for every deletion:
1. Keep a pointer (temp) to the node you remove — you need its address to free it.
2. Redirect the link that points INTO it, so the list skips it.
3. Only then \`free(temp)\`. Freeing first would leave the list pointing at released memory.

If the list is empty, report it and do nothing (underflow).

**Giving the node back in each language.** C: \`free(temp)\` (memory from malloc). C++: \`delete temp;\` (memory from new). Python: nothing to call — once no variable refers to the removed node, the garbage collector reclaims it (\`del temp\` just removes the last name). Pseudocode: \`delete temp\`; the Lab marks the node as freed and reports any pointer that still leads to it. Whatever the language, steps 1 and 2 are the same: keep access to the node, then make the list skip it.`,
      },
      { type: 'sim', title: 'delete_at_beg()', ref: 'Lec 09 p.1', struct: 'sll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'free'], body: 'Allocation, relinking and deallocation each get their own step.' },
      { type: 'walk', key: 'w:sll-delete-beg', title: 'Build it in code: delete at the beginning', ref: 'Lec 09 p.1', impl: 'sll-delete-beg', body: 'Three starting situations: a normal list, a list with ONE node (start becomes NULL) and an empty list (nothing to delete).' },
      { type: 'exercise', title: 'Your turn: delete the first node', templateId: 'l09-rewire-delete', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'sim', title: 'delete_at_last()', ref: 'Lec 09 p.2', concepts: ['l09.delete-end'], struct: 'sll', setup: { values: [10, 20, 30, 40] }, op: 'deleteEnd', predict: ['var', 'link'], body: 'prev trails temp so that when temp reaches the last node, prev is on the new last node.' },
      {
        type: 'note',
        variant: 'correction',
        title: 'One-node list: delete_at_last leaves start dangling',
        ref: 'Lec 09 p.2',
        body: `With a single node, temp, prev and start all hold the same address. The loop never runs; \`prev->next = NULL\` just modifies the node being deleted; \`free(temp)\` releases it — and **start still holds the freed address**. Add: \`if (temp == start) start = NULL; else prev->next = NULL;\`. Run the next simulation to see it.`,
      },
      { type: 'sim', title: 'The notes’ version on a one-node list', ref: 'Lec 09 p.2', struct: 'sll', setup: { values: [42] }, op: 'deleteEndNotes', body: 'Look at start after free(temp): it points at a block marked “freed”.' },
      { type: 'exercise', title: 'Fix the one-node case', templateId: 'l09-singleton', guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-end', title: 'Build it in code: delete at the end (with the one-node fix)', ref: 'Lec 09 p.2', impl: 'sll-delete-end' },
      {
        type: 'exercise',
        title: 'Required example: now delete 20 from 10 → 15 → 20 → 30 — which pointers change?',
        ref: 'Lec 09 p.3',
        concepts: ['l09.delete-mid'],
        templateId: 'l08-which-links',
        params: { op: 'del', kind: 'mid', values: [10, 15, 20, 30], pos: 3 },
        guidance: 'full',
      },
      { type: 'sim', title: 'delete_at_mid(pos = 3)', ref: 'Lec 09 p.3–4', struct: 'sll', setup: { values: [10, 15, 20, 30] }, op: 'deleteMid', args: [3], predict: ['var', 'link', 'free'] },
      { type: 'exercise', title: 'Now do it: delete 20', templateId: 'l09-rewire-delete', params: { kind: 'mid', values: [10, 15, 20, 30], deleteValue: 20 }, guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-pos', title: 'Build it in code: delete at any position', ref: 'Lec 09 p.3–4', impl: 'sll-delete-pos', body: 'prev stops on the node BEFORE the one to delete, temp on the node itself. Try position 1, the last position and an invalid position too.' },
      {
        type: 'codesim',
        title: 'Freeing too early',
        ref: 'Lec 09 p.4',
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
      { type: 'sim', title: 'traverse()', ref: 'Lec 09 p.5', concepts: ['l09.traverse'], struct: 'sll', setup: { values: [10, 15, 30] }, op: 'traverse', predict: ['output'], body: 'temp, not start, moves — so the list is still intact afterwards.' },
      { type: 'exercise', title: 'Variation: delete anywhere', templateId: 'l09-rewire-delete', guidance: 'less' },
      { type: 'exercise', title: 'Arrange the deletion steps', templateId: 'l09-order-delete', guidance: 'less' },
      { type: 'exercise', title: 'Find the deletion bug', templateId: 'l09-bug', guidance: 'less' },
      { type: 'exercise', title: 'Which positions are valid?', templateId: 'l09-valid-pos', guidance: 'less' },
      { type: 'exercise', title: 'Predict traverse() after deletions', templateId: 'l09-traverse-predict', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-delete-pitfalls',
        title: 'Deletion: common mistakes and edge cases',
        ref: 'Lec 09 p.1–5',
        body: `- **Freeing too early.** \`free(temp)\` / \`delete temp\` before the list skips the node leaves a link into released memory (a dangling pointer).
- **Forgetting to free.** Unlinking without \`free\`/\`delete\` leaks the node in C and C++ (Python reclaims it automatically).
- **Empty list.** delete_at_beg / delete_at_end must check start == NULL first (underflow).
- **One node.** Deleting the only node must leave start == NULL; delete_at_last in the notes leaves start dangling.
- **Position 1** changes start; there is no prev node.
- **Invalid positions.** Valid positions are 1 … n. With pos larger than n, a loop that walks prev forward runs off the end — count the nodes (or stop at NULL) before relinking.
- **Moving start instead of temp while traversing.** Walking with start loses the list; always walk with a separate pointer.`,
      },
      { type: 'exercise', key: 'e:predict-a-deletion-program', title: 'Predict what a deletion program prints', templateId: 'l09-predict-output', params: { impl: 'sll-delete-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-deletion', title: 'Complete the missing statement', templateId: 'l09-complete-code', params: { impl: 'sll-delete-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-the-last-node', title: 'Write it yourself: delete the last node', templateId: 'l09-write-code', params: { lab: 'sll-delete-last' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-at-a-position', title: 'Write it yourself: delete at any position', templateId: 'l09-write-code', params: { lab: 'sll-delete-pos' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L10
  {
    lecture: 10,
    id: 'l10',
    title: 'Doubly linked lists',
    sections: [
      {
        type: 'read',
        title: 'Two links per node',
        ref: 'Lec 10 p.1',
        concepts: ['l10.dll-links'],
        body: `Each node has **left** (address of the previous node), **data**, and **right** (address of the next node). Standard names: **prev** and **next**.

The invariant: for every pair of neighbours A, B: \`A->right == B\` **and** \`B->left == A\`. The first node’s left and the last node’s right are NULL. Every operation must keep both directions true.

**Purpose and uses.** The extra link lets you walk the list in BOTH directions and remove a node you already point at without searching for its predecessor. Use it when a program needs to move backwards (for example, “previous / next” navigation) or deletes nodes it already has a pointer to; a singly linked list is simpler and smaller when one direction is enough.`,
        visual: { type: 'list', kind: 'dll', values: [10, 20, 30] },
      },
      {
        type: 'code',
        title: 'The node and getnode()',
        ref: 'Lec 10 p.1',
        c: `struct dlinklist {
    struct dlinklist *left;
    int data;
    struct dlinklist *right;
};
typedef struct dlinklist node;
node *start = NULL;

node *getnode(int value) {
    node *newnode = (node *) malloc(sizeof(node));
    newnode->data = value;
    newnode->left = NULL;
    newnode->right = NULL;
    return newnode;
}`,
        cpp: `struct Node {
    Node* left;     // previous
    int data;
    Node* right;    // next
};
Node* getnode(int v) { return new Node{nullptr, v, nullptr}; }`,
        py: `class Node:
    def __init__(self, data):
        self.left = None      # previous node
        self.data = data
        self.right = None     # next node

def getnode(v):
    return Node(v)`,
        pseudo: `# Lab nodes of a doubly linked list have the fields left, data and right
# (prev and next are accepted as other names); new Node(v) sets both links to NULL.
function getnode(v)
    newnode = new Node(v)
    return newnode
end function`,
      },
      { type: 'walk', key: 'w:dll-create', title: 'Build it in code: create a doubly linked list', ref: 'Lec 10 p.1–2', impl: 'dll-create', body: 'Every append sets TWO links. The program then prints the list forwards and backwards — the backward output is the forward output reversed exactly when every left link is right.' },
      { type: 'sim', title: 'Insert at the beginning: 3 steps', ref: 'Lec 10 p.3', concepts: ['l10.dll-insert'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [40], predict: ['link', 'var'] },
      { type: 'walk', key: 'w:dll-insert-beg', title: 'Build it in code: insert at the beginning', ref: 'Lec 10 p.3', impl: 'dll-insert-beg' },
      { type: 'exercise', title: 'Your turn (both directions!)', templateId: 'l10-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'walk', key: 'w:dll-insert-end', title: 'Build it in code: insert at the end', ref: 'Lec 10 p.3', impl: 'dll-insert-end' },
      { type: 'sim', title: 'Insert at an intermediate position: 4 links', ref: 'Lec 10 p.4', struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertMid', args: [40, 2], predict: ['link'] },
      { type: 'walk', key: 'w:dll-insert-pos', title: 'Build it in code: insert at a middle position', ref: 'Lec 10 p.4', impl: 'dll-insert-pos' },
      { type: 'exercise', title: 'Insert in the middle', templateId: 'l10-rewire-insert', params: { kind: 'mid' }, guidance: 'full' },
      { type: 'exercise', title: 'Which orders are valid?', templateId: 'l10-order', guidance: 'less' },
      { type: 'sim', title: 'Delete at an intermediate position', ref: 'Lec 10 p.6', concepts: ['l10.dll-delete'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'deleteMid', args: [2], predict: ['link', 'free'] },
      { type: 'walk', key: 'w:dll-delete-pos', title: 'Build it in code: delete at a middle position', ref: 'Lec 10 p.6', impl: 'dll-delete-pos' },
      {
        type: 'note',
        variant: 'correction',
        title: 'One-node lists in delete_at_beg / delete_at_end',
        ref: 'Lec 10 p.5',
        body: `**delete_at_beg:** after \`start = temp->right\`, start is NULL when the only node was removed, so \`start->left = NULL\` dereferences NULL and crashes. Guard it: \`if (start != NULL) start->left = NULL;\`.

**delete_at_end:** \`temp->left->right = NULL\` crashes when temp is the only node (temp->left is NULL). Check \`if (temp->left == NULL) start = NULL;\` first.`,
      },
      { type: 'sim', title: 'The crash, simulated', ref: 'Lec 10 p.5', struct: 'dll', setup: { values: [7] }, op: 'deleteBegNotes' },
      { type: 'walk', key: 'w:dll-delete-beg', title: 'Build it in code: delete at the beginning (corrected)', ref: 'Lec 10 p.5', impl: 'dll-delete-beg', body: 'The corrected version: start.left = NULL only when a node is left. Run the “one node” case — no crash.' },
      { type: 'walk', key: 'w:dll-delete-end', title: 'Build it in code: delete at the end (corrected)', ref: 'Lec 10 p.5', impl: 'dll-delete-end' },
      { type: 'exercise', title: 'Delete, both directions', templateId: 'l10-rewire-delete', guidance: 'full' },
      { type: 'sim', title: 'Verify forward…', ref: 'Lec 10 p.7', concepts: ['l10.dll-traverse'], struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseFwd', predict: ['output'] },
      { type: 'sim', title: '…and backward', ref: 'Supplementary (uses left links)', struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseBwd', predict: ['output'] },
      { type: 'exercise', title: 'Required: forward looks right, backward is broken — repair it', templateId: 'l10-repair-back', guidance: 'full' },
      { type: 'exercise', title: 'Predict a traversal', templateId: 'l10-traverse-both', guidance: 'less' },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-recursion',
        title: 'Before you start: recursion',
        ref: 'Lec 10 p.7 + Supplementary',
        body: `A **recursive** function calls itself on a smaller part of the problem. Two parts are always needed:
- a **base case** that is answered directly (an empty list: \`p == NULL\` → 0 nodes);
- a **recursive case** that reduces the problem (1 for this node + the count of the rest: \`countnode(p->right)\`).

Every call gets its own **frame** with its own copy of the parameters, pushed on the **call stack**; when a call returns, its frame is removed and the caller continues where it stopped. Without a reachable base case the calls never stop (in C++ the stack overflows; Python raises \`RecursionError\`; the Lab stops at its step limit). The same idea drives the tree traversals and DFS in Lec 14.`,
      },
      { type: 'sim', title: 'Recursive countnode()', ref: 'Lec 10 p.7', concepts: ['l10.countnode'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'countnode', body: 'Watch the call stack grow to n + 1 frames and the returns add 1 on the way back.' },
      { type: 'walk', key: 'w:dll-countnode', title: 'Build it in code: recursive countnode()', ref: 'Lec 10 p.7', impl: 'dll-countnode', body: 'The Variables panel shows one frame per running call — each with its own p.' },
      { type: 'exercise', title: 'Recursion questions', templateId: 'l10-countnode', guidance: 'less' },
      { type: 'exercise', title: 'Complete the code', templateId: 'l10-fill', guidance: 'less' },
      {
        type: 'read',
        key: 'r:what-the-extra-link-buys',
        title: 'What the extra link makes possible',
        ref: 'Lec 10 p.1–7',
        body: `- **Delete a node you already point at** without searching for the node before it: its left neighbour is \`temp->left\`.
- **Walk backwards** from the last node to the first by following left links.
- **The price:** every node stores one more pointer, and every insertion or deletion has to update twice as many links — forgetting one of them leaves the list broken in one direction (see the backward-traversal repair exercise).`,
      },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:dll-pitfalls',
        title: 'Doubly linked lists: common mistakes and edge cases',
        ref: 'Lec 10 p.3–7',
        body: `- **Updating only one direction.** Every insertion and deletion changes links in BOTH directions; forgetting a left link leaves forward traversal correct and backward traversal wrong.
- **Following a NULL neighbour.** The first node has no left neighbour and the last no right neighbour: \`temp->left->right\` crashes when temp is the first node, \`temp->right->left\` when it is the last.
- **One-node lists** in delete at the beginning / end (the notes’ versions crash — see the correction above).
- **Empty list** for insertion: there is no old first node whose left must change.
- **Order of updates.** Use the old neighbour’s links before overwriting them; save a pointer if necessary.
- **Recursion without a base case** (countnode): every call must eventually reach \`p == NULL\`.`,
      },
      { type: 'exercise', key: 'e:predict-a-doubly-linked-program', title: 'Predict what a doubly linked program prints', templateId: 'l10-predict-output', params: { impl: 'dll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-back-link', title: 'Complete the missing link', templateId: 'l10-complete-code', params: { impl: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-insert-end', title: 'Write it yourself: insert at the end', templateId: 'l10-write-code', params: { lab: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-delete-first', title: 'Write it yourself: delete the first node', templateId: 'l10-write-code', params: { lab: 'dll-delete-first' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L11
  {
    lecture: 11,
    id: 'l11',
    title: 'Circular singly linked lists',
    sections: [
      {
        type: 'read',
        title: 'The last node points back to the first',
        ref: 'Lec 11 p.1',
        concepts: ['l11.circular-links'],
        body: `In a circular singly linked list the last node’s next holds the address of the **first** node. A one-node circle points to **itself**. An empty list is still \`start = NULL\`.

Consequence: in a non-empty circle **no next field is NULL**, so every loop that waits for NULL runs forever.

**Purpose and uses.** From any node you can reach every other node by going forward, and after the last node you are back at the first one. That suits data that is processed in rounds — taking turns, repeating a cycle of steps — where “after the last comes the first again”. The node type is exactly the singly linked node; only the last link differs.`,
        visual: { type: 'list', kind: 'csll', values: [10, 20, 30, 40] },
      },
      { type: 'sim', title: 'Required demo: why waiting for NULL fails', ref: 'Lec 09 p.5 loop on a Lec 11 circle', concepts: ['l11.csll-traverse'], struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverseNullBug', body: 'The simulator stops the loop after the second lap — a real program never would.' },
      {
        type: 'note',
        variant: 'correction',
        title: 'The creation loop in the notes',
        ref: 'Lec 11 p.1',
        body: `The creation steps walk with \`while (temp->next != NULL)\` and then add \`newnode->next = start\`. After the first node is closed into a circle, no next is NULL any more, so on the next iteration that loop never ends. A circular append must walk with \`while (temp->next != start)\`, exactly as the insert-at-end code on p.2 does.`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-do-while',
        title: 'Before you start: loops that test at the bottom',
        ref: 'Lec 11 p.4 + Supplementary',
        body: `A **do … while** loop runs its body FIRST and tests afterwards, so the body runs at least once. That is exactly what one lap round a circle needs: at the start temp == start, so a test at the top would stop immediately.
- C / C++: \`do { … } while (temp != start);\`
- Python has no do-while: write \`while True:\` and end the body with \`if temp is start: break\`.
- Pseudocode: \`do\` … \`while temp != start\` (the Lab also accepts \`repeat … until temp == start\`).
An empty circle (start == NULL) must be checked BEFORE the loop — the body would follow NULL.`,
      },
      { type: 'sim', title: 'The right way: do-while, exactly one lap', ref: 'Lec 11 p.4', struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverse', predict: ['output'] },
      { type: 'walk', key: 'w:csll-create', title: 'Build it in code: create a circular list', ref: 'Lec 11 p.1, p.4', impl: 'csll-create', body: 'Appending walks to the node whose next is start (the corrected loop), links the new node there and closes the circle again. display() makes exactly one lap.' },
      { type: 'exercise', title: 'Click exactly one lap', templateId: 'l11-one-lap', guidance: 'full' },
      { type: 'exercise', title: 'Complete the stopping condition', templateId: 'l11-fill-dowhile', guidance: 'less' },
      { type: 'sim', title: 'Insert at the beginning: the last node must change too', ref: 'Lec 11 p.2', concepts: ['l11.csll-insert'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [5], predict: ['link', 'var'] },
      { type: 'sim', title: 'Insert into an EMPTY circle', ref: 'Lec 11 p.2', concepts: ['l11.csll-edge'], struct: 'csll', setup: { values: [] }, op: 'insertBeg', args: [7], predict: ['link'] },
      { type: 'walk', key: 'w:csll-insert-beg', title: 'Build it in code: insert at the beginning', ref: 'Lec 11 p.2', impl: 'csll-insert-beg', body: 'Run both starting situations: the last node’s link must change too, and an empty list becomes a node that points to itself.' },
      { type: 'walk', key: 'w:csll-insert-end', title: 'Build it in code: insert at the end', ref: 'Lec 11 p.2', impl: 'csll-insert-end' },
      { type: 'exercise', title: 'Your turn: insert', templateId: 'l11-rewire-insert', guidance: 'full' },
      { type: 'sim', title: 'Delete at the beginning', ref: 'Lec 11 p.3', concepts: ['l11.csll-delete'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'link', 'free'] },
      {
        type: 'note',
        variant: 'correction',
        title: 'Missing free and the one-node case',
        ref: 'Lec 11 p.3',
        body: `- delete_at_beg crosses temp out in the picture but never calls \`free(temp)\`; without it the node leaks.
- “if the list is empty, start = NULL” really means: when the **only** node is removed (start->next == start), free it and set start = NULL.
- delete_at_end has the same one-node problem as Lec 09: temp == prev == start, so \`prev->next = start\` and \`free(temp)\` leave start dangling. Check \`if (temp == start) start = NULL;\`.`,
      },
      { type: 'walk', key: 'w:csll-delete-beg', title: 'Build it in code: delete at the beginning (corrected)', ref: 'Lec 11 p.3', impl: 'csll-delete-beg' },
      { type: 'walk', key: 'w:csll-delete-end', title: 'Build it in code: delete at the end (corrected)', ref: 'Lec 11 p.3', impl: 'csll-delete-end' },
      { type: 'exercise', title: 'Required: delete the only node correctly', templateId: 'l11-rewire-delete', params: { single: true, kind: 'end' }, guidance: 'full' },
      { type: 'exercise', title: 'Variation: delete from a longer circle', templateId: 'l11-rewire-delete', params: { single: false }, guidance: 'less' },
      { type: 'exercise', title: 'Order the delete-at-beginning steps', templateId: 'l11-order-delbeg', guidance: 'less' },
      { type: 'exercise', title: 'What happens with the NULL loop?', templateId: 'l11-null-loop', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:csll-pitfalls',
        title: 'Circular lists: common mistakes and edge cases',
        ref: 'Lec 11 p.1–4',
        body: `- **Waiting for NULL.** In a non-empty circle no next is NULL: loops must stop when they are back at start.
- **Testing at the top.** \`while (temp != start)\` with temp = start never runs; use a do-while for one lap.
- **Leaving the circle open.** After inserting at the end the new node must point back to start; after inserting at the beginning the LAST node must point to the new start.
- **Empty list.** start == NULL: there is no lap to make; a first node must point to itself.
- **One node.** Its next is itself; deleting it must leave start == NULL (the notes leave start dangling).
- **Forgetting to free** the removed node (the notes’ delete at the beginning never calls free).`,
      },
      { type: 'exercise', key: 'e:predict-a-circular-program', title: 'Predict what a circular-list program prints', templateId: 'l11-predict-output', params: { impl: 'csll-insert-beg' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-circle', title: 'Complete the missing statement', templateId: 'l11-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-insert-front', title: 'Write it yourself: insert at the beginning', templateId: 'l11-write-code', params: { lab: 'csll-insert-front' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-delete-first', title: 'Write it yourself: delete the first node', templateId: 'l11-write-code', params: { lab: 'csll-delete-first' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L12
  {
    lecture: 12,
    id: 'l12',
    title: 'Stacks and queues',
    sections: [
      {
        type: 'read',
        title: 'Restricted lists: LIFO and FIFO',
        ref: 'Lec 12 p.1, p.5',
        concepts: ['l12.lifo-fifo'],
        body: `A **stack** inserts and deletes at ONE end, the **top**: Last In, First Out (LIFO). Operations: **push**, **pop**, and **peek** (read the top without removing — supplementary).

A **queue** inserts at the **rear** and deletes at the **front**: First In, First Out (FIFO). Operations: **enqueue** (InsertQ), **dequeue** (DeletQ), and **front** (read the front item).

**Organisation.** Both are ordinary lists with a restriction on where items may enter and leave, so both can be stored in an **array** (with index variables) or as **linked nodes** (with pointer variables). Terms: **overflow** = pushing / enqueuing when no space is left; **underflow** = popping / dequeuing when there is nothing to remove.

**Uses.** A stack fits work that must be finished in reverse order: undoing the most recent action first, the call stack of a running program (Lec 10’s recursion), the explicit stack of the inorder traversal and DFS (Lec 14). A queue fits work served in arrival order: jobs waiting for a printer, and the vertices waiting in BFS (Lec 14).`,
      },
      { type: 'exercise', title: 'Required: same input, stack vs queue', templateId: 'l12-removal-order', guidance: 'full' },
      {
        type: 'note',
        variant: 'terms',
        title: 'Exactly what top, F and R mean',
        ref: 'Lec 12 p.2–6',
        body: `| Implementation | Variable | Meaning | Empty | Full |
|---|---|---|---|---|
| Array stack (notes) | top | index of the next FREE slot = number of items (starts 0) | top == 0 | top == MAX |
| Array stack (index style) | top | index of the TOP item (starts −1) | top == −1 | top == MAX−1 |
| Linked stack at the head | top | pointer to the first node | top == NULL | only if malloc fails |
| Linked stack at the tail (notes p.4) | top | pointer to the LAST node; start is the bottom | top == NULL | only if malloc fails |
| Linear array queue (notes) | F, R | F = index of front item, R = index of next free slot | F == R | R == MAX |
| Linked queue (notes p.6) | front, rear | pointers to the first and LAST node | front == NULL | only if malloc fails |`,
      },
      {
        type: 'code',
        key: 'c:array-stack-notes-in-c-and-c',
        title: 'Array stack (notes) in every language',
        ref: 'Lec 12 p.2–4',
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
      { type: 'sim', title: 'Array stack: pushes until overflow, then pops until underflow', ref: 'Lec 12 p.1–3', struct: 'astack', setup: { MAX: 3 }, ops: [{ op: 'push', x: 11 }, { op: 'push', x: 22 }, { op: 'push', x: 33 }, { op: 'push', x: 44 }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }], predict: ['write', 'read'] },
      { type: 'walk', key: 'w:stack-array', title: 'Build it in code: an array stack', ref: 'Lec 12 p.2–3', impl: 'stack-array', body: 'Pushes until overflow, then pops until underflow. Watch top and the array cells: a popped value stays in its slot but is no longer part of the stack.' },
      { type: 'exercise', title: 'Track top', templateId: 'l12-astack-top', guidance: 'full' },
      { type: 'sim', title: 'Linked stack, notes style: push/pop at the END', ref: 'Lec 12 p.4', concepts: ['l12.linked-stack'], struct: 'lstack-tail', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Watch the pop: temp has to walk from start to the node BELOW top, because a node only knows the node after it.' },
      { type: 'walk', key: 'w:stack-linked-end', title: 'Build it in code: the notes’ linked stack', ref: 'Lec 12 p.4', impl: 'stack-linked-end' },
      { type: 'sim', title: 'Linked stack at the HEAD', ref: 'Supplementary', struct: 'lstack-head', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Same pushes and pop with the top at the head: push and pop only touch the first node, so nothing walks.' },
      { type: 'walk', key: 'w:stack-linked', title: 'Build it in code: a linked stack with the top at the first node', ref: 'Lec 12 p.4 (simplified)', impl: 'stack-linked', body: 'push = insert at the beginning and pop = delete at the beginning from Lec 08/09. Compare it with the notes’ version: the same output, but no walking.' },
      { type: 'exercise', title: 'Push/pop by rewiring', templateId: 'l12-rewire-stack', guidance: 'full' },
      { type: 'sim', title: 'Linear array queue: wasted slots', ref: 'Lec 12 p.5', concepts: ['l12.array-queue'], struct: 'aqueue', setup: { MAX: 4 }, ops: [{ op: 'enqueue', x: 11 }, { op: 'enqueue', x: 22 }, { op: 'dequeue' }, { op: 'enqueue', x: 33 }, { op: 'enqueue', x: 44 }, { op: 'enqueue', x: 55 }] , predict: ['write', 'read'], body: 'The last enqueue fails although slot 0 is free: F and R only move forward.' },
      { type: 'walk', key: 'w:queue-array', title: 'Build it in code: a linear array queue', ref: 'Lec 12 p.5', impl: 'queue-array' },
      { type: 'note', variant: 'supplementary', title: 'Circular array queue', ref: 'Supplementary (fixes Lec 12 p.5)', body: 'Advance indices with `R = (R + 1) % MAX` and `F = (F + 1) % MAX`, and keep a `count` (or leave one slot unused) to tell full from empty. Freed slots are then reused. Try mode “circular” in Explore.' },
      { type: 'exercise', title: 'Track F and R', templateId: 'l12-aqueue-fr', guidance: 'less' },
      { type: 'exercise', title: 'Which operations fail?', templateId: 'l12-fails', guidance: 'less' },
      { type: 'sim', title: 'Linked queue: removing the final item', ref: 'Lec 12 p.6', concepts: ['l12.linked-queue'], struct: 'lqueue', ops: [{ op: 'enqueue', x: 10 }, { op: 'enqueue', x: 20 }, { op: 'dequeue' }, { op: 'dequeue' }] , predict: ['var'], body: 'When the last item leaves, rear must also become NULL.' },
      { type: 'walk', key: 'w:queue-linked', title: 'Build it in code: a linked queue', ref: 'Lec 12 p.6', impl: 'queue-linked', body: 'Run both starting situations. In each run the final dequeue empties the queue: watch rear become NULL together with front.' },
      { type: 'exercise', title: 'Enqueue / dequeue by rewiring', templateId: 'l12-rewire-queue', params: { op: 'dequeue', n: 1 }, guidance: 'full' },
      { type: 'exercise', title: 'Variation', templateId: 'l12-rewire-queue', guidance: 'less' },
      { type: 'exercise', title: 'What exactly does it mean?', templateId: 'l12-meaning', guidance: 'less' },
      { type: 'exercise', title: 'Stack or queue?', templateId: 'l12-choose', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:stack-queue-pitfalls',
        title: 'Stacks and queues: common mistakes and edge cases',
        ref: 'Lec 12 p.2–6',
        body: `- **Mixing the conventions for top.** In the notes top = number of items (push writes, THEN increments; pop decrements, THEN reads). With top = index of the top item (starting at −1) the order is reversed. Mixing them is off by one.
- **No overflow / underflow check.** Pushing onto a full array writes past its end; popping an empty stack reads garbage (C++) or a wrong index.
- **Linear queue “full” with free slots.** R == MAX is reported as full even after dequeues (slots before F are never reused) — the circular queue fixes this (supplementary).
- **Linked queue: forgetting rear.** When the final item is dequeued, rear must become NULL too, or the next enqueue links to a freed node.
- **Empty structures.** Enqueue into an empty linked queue sets BOTH front and rear; push onto an empty linked stack sets top (next = NULL).
- **Freeing before reading.** Copy the value out of the node before it is freed.`,
      },
      { type: 'exercise', key: 'e:predict-a-stack-or-queue-program', title: 'Predict what a stack or queue program prints', templateId: 'l12-predict-output', params: { impl: 'queue-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-push-or-dequeue', title: 'Complete the missing statement', templateId: 'l12-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-stack', title: 'Write it yourself: push and pop for an array stack', templateId: 'l12-write-code', params: { lab: 'astack-push-pop' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-queue', title: 'Write it yourself: enqueue and dequeue for an array queue', templateId: 'l12-write-code', params: { lab: 'aqueue-enqueue-dequeue' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L13
  {
    lecture: 13,
    id: 'l13',
    title: 'Trees and graphs',
    sections: [
      {
        type: 'read',
        title: 'Trees: hierarchy with one parent per node',
        ref: 'Lec 13 p.1–2',
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
        ref: 'Lec 13 p.5 (linked representation)',
        body: 'Three fields: the value and the addresses of the two children. A new node has no children (both links NULL) — it is a leaf until children are attached.',
        c: `struct tnode {
    char data;
    struct tnode *left, *right;
};
typedef struct tnode tnode;
tnode *root = NULL;                    /* empty tree */

tnode *getnode(char value) {
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

Node* getnode(char value) {
    return new Node{value, nullptr, nullptr};
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data
        self.left = None      # no left child
        self.right = None     # no right child

root = None                   # empty tree

def getnode(value):
    return Node(value)`,
        pseudo: `# Lab tree nodes have the fields data, left and right; new Node(v) sets both links to NULL.
root = NULL                   # empty tree

function getnode(value)
    newnode = new Node(value)
    return newnode
end function`,
      },
      { type: 'walk', key: 'w:tree-create', title: 'Build it in code: create a binary tree', ref: 'Lec 13 p.2, p.5', impl: 'tree-create' },
      { type: 'exercise', title: 'Select relationships', templateId: 'l13-relations', guidance: 'full' },
      {
        type: 'read',
        title: 'Level, height, depth',
        ref: 'Lec 13 p.3',
        concepts: ['l13.tree-measures'],
        body: `- **level** of a node = its distance (edges) from the root; the root is level 0.
- **height** of the tree = the maximum level. One node → height 0.`,
      },
      {
        type: 'note',
        variant: 'correction',
        title: 'Height and depth conventions',
        ref: 'Lec 13 p.3',
        body: `The notes define **depth** as the number of **nodes** on the root→node path, so depth = level + 1 (root depth 1). Most textbooks define depth in **edges** (depth = level, root depth 0). Similarly, some books measure height in nodes (one more than here) and give the empty tree height −1 or 0. The formulas below assume the notes’ **edge-based** height. Always check the convention before answering.`,
      },
      { type: 'exercise', title: 'Measure the tree', templateId: 'l13-measures', guidance: 'full' },
      { type: 'demo', title: 'Node-count formulas, visually', ref: 'Lec 13 p.3', kind: 'formulas', body: 'Move the slider: the fullest tree of height h has 2^l nodes on level l, 2^h leaves and 2^(h+1) − 1 nodes. Any tree with n nodes has n − 1 edges.' },
      { type: 'note', variant: 'correction', title: 'n − 1 edges holds for every tree', ref: 'Lec 13 p.3 ④', body: 'The notes state it for full binary trees, but every tree with n ≥ 1 nodes has exactly n − 1 edges, because every node except the root has exactly one incoming edge.' },
      { type: 'exercise', title: 'Use the formulas', templateId: 'l13-formulas', guidance: 'less' },
      {
        type: 'read',
        title: 'Strictly binary, “full”, complete',
        ref: 'Lec 13 p.4',
        concepts: ['l13.tree-classify'],
        body: `- **Strictly binary** (notes): every non-leaf has exactly two children.
- **Full** (notes): all leaves on level h and every internal node has 2 children.
- **Complete**: the n nodes occupy positions 1..n of the level-order numbering (every level full except possibly the last, filled from the left).`,
      },
      {
        type: 'note',
        variant: 'terms',
        title: '“Full” and “perfect” are named differently in different books',
        ref: 'Lec 13 p.4',
        body: `| Shape | Notes call it | Most textbooks call it |
|---|---|---|
| every node has 0 or 2 children | strictly binary | **full** (or proper) |
| 0 or 2 children AND all leaves on the last level | full | **perfect** |
| filled level by level, left to right | complete | complete |

So “full binary tree” in an exam may mean either — read the definition given.`,
      },
      { type: 'exercise', title: 'Classify trees', templateId: 'l13-classify', guidance: 'full' },
      { type: 'demo', title: 'Array positions vs linked child pointers', ref: 'Lec 13 p.5', kind: 'treeRepr', concepts: ['l13.tree-repr'], body: 'Click a node: see its array index (0- and 1-based) next to its linked node with left/right addresses. Gaps in an incomplete tree waste array slots.' },
      { type: 'exercise', title: 'Array index arithmetic', templateId: 'l13-array-index', guidance: 'full' },
      { type: 'walk', key: 'w:tree-array', title: 'Build it in code: a tree stored in an array', ref: 'Lec 13 p.5', impl: 'tree-array', body: 'No pointers at all: the position of a value in the array says where it is in the tree. Try the root (no parent) and a leaf (no children) as well.' },
      { type: 'exercise', title: 'Build a tree from its array', templateId: 'l13-build-tree', guidance: 'less' },
      { type: 'demo', title: 'Build your own binary tree', ref: 'Lec 13 p.2–5', kind: 'treeBuilder', body: 'Add and remove nodes; height, levels, classification and both representations update live. The BST mode is clearly marked supplementary: Lec 13 covers general binary trees, in which values are NOT ordered.' },
      {
        type: 'read',
        title: 'Graphs and their representations',
        ref: 'Lec 13 p.6',
        concepts: ['l13.graph-repr'],
        body: `A graph allows **more than one incoming link** and cycles. Edges may be **directed** (arrows) or **undirected**, and may carry **weights**.

- **Adjacency matrix**: V×V table; [u][v] = 1 (or the weight) if there is an edge u→v. Undirected graphs give a symmetric matrix. In the notes’ weighted matrix, “no edge” is ∞ and the diagonal is 0. A **self-loop** is a 1 on the diagonal. The matrix has a cell for every pair of vertices, whether the edge exists or not.
- **Adjacency list**: for each vertex a linked list of its neighbours (Lec 13 p.6 bottom). It stores only the edges that exist.

**Terms.** The items are **vertices**, the links **edges**. Two vertices joined by an edge are **adjacent** (neighbours); the **degree** of a vertex is its number of edges (in a directed graph: out-degree / in-degree). A **path** follows edges from vertex to vertex; a **cycle** is a path that returns to its start.

**Uses.** Graphs model networks where anything may connect to anything: road maps (vertices = places, weighted edges = distances), computer networks, “must be done before” relations between tasks. Choose the **matrix** when you often ask “is there an edge u–v?” and the graph is dense; choose **adjacency lists** when most vertices have few neighbours and you mostly visit the neighbours of a vertex.`,
      },
      { type: 'demo', title: 'Graph editor: watch the matrix and list update', ref: 'Lec 13 p.6', kind: 'graphEditor', body: 'Add vertices and edges (directed or not, weighted or not, self-loops allowed). Start from the notes’ examples.' },
      { type: 'walk', key: 'w:graph-matrix', title: 'Build it in code: an adjacency matrix', ref: 'Lec 13 p.6', impl: 'graph-matrix', body: 'A 2-D array: an array of rows, each row an array. The diagram shows the matrix filling in as the edges are added.' },
      { type: 'walk', key: 'w:graph-adjlist', title: 'Build it in code: adjacency lists of nodes', ref: 'Lec 13 p.6', impl: 'graph-adjlist', body: 'One linked list per vertex, built with the insert-at-the-end of Lec 08. The diagram draws every list head with its chain of nodes.' },
      { type: 'exercise', title: 'Drawing → matrix', templateId: 'l13-matrix', guidance: 'full' },
      { type: 'exercise', title: 'Matrix → list', templateId: 'l13-adjlist', guidance: 'less' },
      { type: 'exercise', title: 'List → drawing', templateId: 'l13-draw', guidance: 'less' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:tree-graph-pitfalls',
        title: 'Trees and graph representations: common mistakes and edge cases',
        ref: 'Lec 13 p.2–6',
        body: `- **0-based vs 1-based positions.** With the root at 0, the children of i are 2i + 1 and 2i + 2 and the parent is (i − 1) / 2; with the root at 1 they are 2i, 2i + 1 and i / 2. Mixing the two picks the wrong node.
- **Integer division.** The parent formula rounds DOWN: C/C++ int division and the pseudocode \`div\` do; in Python use \`//\` (\`/\` gives a fraction).
- **Positions outside the array / empty positions.** A leaf on the last level has child positions beyond the array; an incomplete tree has empty slots. Check both before reading a child.
- **Empty tree.** root == NULL: there is no root.left to assign — create the root first.
- **Losing a subtree.** Assigning a new node to a child field that already holds a subtree loses that subtree.
- **Matrix direction.** For a directed edge u → v only M[u][v] is set; for an undirected edge set M[u][v] AND M[v][u].
- **Vertices numbered from 1.** Arrays start at 0: vertex v uses row v − 1 (or make the matrix one larger and leave row 0 unused).`,
      },
      { type: 'exercise', key: 'e:predict-a-tree-or-graph-program', title: 'Predict what a tree or graph program prints', templateId: 'l13-predict-output', params: { impl: 'tree-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-tree-or-graph-code', title: 'Complete the missing statement', templateId: 'l13-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-build-a-tree', title: 'Write it yourself: build part of a tree', templateId: 'l13-write-code', params: { lab: 'tree-build' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-an-adjacency-matrix', title: 'Write it yourself: an adjacency matrix', templateId: 'l13-write-code', params: { lab: 'graph-matrix-build' }, guidance: 'none' },
    ],
  },

  // ===================================================================== L14
  {
    lecture: 14,
    id: 'l14',
    title: 'Traversing trees and graphs',
    sections: [
      {
        type: 'read',
        title: 'Three depth-first orders for binary trees',
        ref: 'Lec 14 p.1–2',
        concepts: ['l14.tree-traversal'],
        body: `- **Preorder**: Root, Left, Right
- **Inorder**: Left, Root, Right
- **Postorder**: Left, Right, Root

All three ENTER the nodes in the same order — they only differ in **when** a node is OUTPUT. The stars (*) the notes draw above letters mark the root of each subtree at the moment it is output.`,
      },
      { type: 'sim', title: 'Preorder on the lecture tree (entered vs output)', ref: 'Lec 14 p.1', struct: 'tree', tree: 'lecture', op: 'preorder', predict: ['output'] },
      { type: 'exercise', title: 'Required: click the preorder', templateId: 'l14-tree-order', params: { order: 'preorder', lectureTree: true }, guidance: 'full' },
      { type: 'sim', title: 'Inorder', ref: 'Lec 14 p.1', struct: 'tree', tree: 'lecture', op: 'inorder', predict: ['output'] },
      { type: 'exercise', title: 'Required: click the inorder', templateId: 'l14-tree-order', params: { order: 'inorder', lectureTree: true }, guidance: 'full' },
      { type: 'sim', title: 'Postorder', ref: 'Lec 14 p.2', struct: 'tree', tree: 'lecture', op: 'postorder', predict: ['output'] },
      { type: 'exercise', title: 'Required: click the postorder', templateId: 'l14-tree-order', params: { order: 'postorder', lectureTree: true }, guidance: 'full' },
      { type: 'walk', key: 'w:tree-traversals', title: 'Build it in code: the three recursive traversals', ref: 'Lec 14 p.1–2', impl: 'tree-traversals', body: 'Pick an order: only the position of the print differs. The Variables panel shows one frame per running call, so you can see how deep the recursion is at every moment. The “Empty tree” case shows the base case on its own.' },
      { type: 'sim', title: 'Inorder with an explicit stack (the notes’ stack pictures)', ref: 'Lec 14 p.1', struct: 'tree', tree: 'lecture', op: 'inorderStack', predict: ['push', 'pop'] },
      { type: 'walk', key: 'w:tree-inorder-stack', title: 'Build it in code: inorder with an explicit stack', ref: 'Lec 14 p.1', impl: 'tree-inorder-stack', body: 'The stack is the array stack of Lec 12, holding node addresses. Compare the stack contents with the notes’ pictures.' },
      { type: 'exercise', title: 'Stack contents', templateId: 'l14-inorder-stack', params: { lectureTree: true }, guidance: 'less' },
      { type: 'exercise', title: 'Entered vs output on a new tree', templateId: 'l14-entered-output', guidance: 'less' },
      { type: 'demo', title: 'Now create another tree and traverse it', ref: 'Lec 14', kind: 'treeBuilder', traverse: true, body: 'Build any binary tree, then run preorder, inorder or postorder on it in the workspace.' },
      { type: 'exercise', title: 'Variation: a random tree', templateId: 'l14-tree-order', guidance: 'less' },
      {
        type: 'read',
        title: 'DFS and BFS on graphs',
        ref: 'Lec 14 p.2–4',
        concepts: ['l14.dfs', 'l14.bfs'],
        body: `**Depth-first search** goes as deep as possible, then **backtracks** (the curved arrows on p.2). It uses a **stack** — usually the recursion call stack.

**Breadth-first search** visits all neighbours of a vertex before going further, ring by ring. It uses a **queue**.

Both mark vertices as **visited (discovered)** so cycles do not cause infinite loops. The order depends on the **neighbour order**: here it is always ascending (alphabetical / numeric), which reproduces the notes’ answers on p.4: DFS a b c g d e f i h and BFS a b e f c d g i h.

Four separate things to track: **discovered** (seen), **processed** (all neighbours examined), the **frontier** (stack or queue), and the **output** order.

**In code.** “Discovered” is a set of vertices (the Lab’s \`Set\`) or one true/false entry per vertex (\`bool visited[N]\` in C++, \`[False] * N\` in Python). BFS keeps its frontier in a **queue** — the array queue of Lec 12 is enough, because every vertex enters it at most once. DFS uses **recursion**: the call stack holds the vertices whose neighbours are still being examined, and returning from a call is the backtracking.`,
      },
      { type: 'sim', title: 'DFS from a (Lec 14 p.4 graph)', ref: 'Lec 14 p.4', struct: 'graph', graph: 'lec14', op: 'dfs', start: 'a', predict: ['discover'] },
      { type: 'walk', key: 'w:graph-dfs', title: 'Build it in code: DFS with recursion', ref: 'Lec 14 p.2–4', impl: 'graph-dfs', body: 'The pseudocode uses the Lab’s graph G; the C++ and Python versions build the same graph as an adjacency matrix and keep a visited array. All three print a b c g d e f i h from a.' },
      { type: 'exercise', title: 'Click the DFS order', templateId: 'l14-dfs-click', params: { lecture: true, start: 'a' }, guidance: 'full' },
      { type: 'sim', title: 'BFS from a', ref: 'Lec 14 p.3–4', struct: 'graph', graph: 'lec14', op: 'bfs', start: 'a', predict: ['output'] },
      { type: 'walk', key: 'w:graph-bfs', title: 'Build it in code: BFS with a queue', ref: 'Lec 14 p.3–4', impl: 'graph-bfs', body: 'C++ and Python write the queue out as an array with F and R (Lec 12). All three versions print a b e f c d g i h from a.' },
      { type: 'exercise', title: 'Click the BFS order', templateId: 'l14-bfs-click', params: { lecture: true, start: 'a' }, guidance: 'full' },
      {
        type: 'note',
        variant: 'correction',
        title: 'Edge labels on p.3 are discovery order, not distances',
        ref: 'Lec 14 p.3',
        body: `The numbers 1–8 on the DFS and BFS trees of p.3 number the edges in the order they were used. The BFS **distance** of e from a is 1 edge (a–e is a direct edge), not 2; h is 3 edges away (a–e–g–h). BFS finds, for every reachable vertex, a path with the **fewest edges**.`,
      },
      { type: 'exercise', title: 'What is in the frontier?', templateId: 'l14-frontier', guidance: 'less' },
      { type: 'sim', title: 'Cycles, a self-loop and a disconnected part', ref: 'Supplementary', concepts: ['l14.components'], struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', body: 'One BFS from A never reaches D, E, F or G.' },
      { type: 'sim', title: 'Traversing the WHOLE graph', ref: 'Supplementary', struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', all: true, body: 'Restart from the next undiscovered vertex until every vertex is visited: one BFS per component.' },
      { type: 'exercise', title: 'Component or whole graph?', templateId: 'l14-components', guidance: 'less' },
      { type: 'note', variant: 'correction', title: 'BFS minimises edges, not total weight', ref: 'Lec 13 p.6 graph, Lec 14', body: 'On the weighted graph from Lec 13, BFS from A reaches D via A–B–D (2 edges, weight 3 + 4 = 7), but A–B–C–D weighs 3 + 2 + 1 = 6. BFS ignores weights; minimum-weight paths need Dijkstra’s algorithm (not covered in these lectures).' },
      { type: 'exercise', title: 'BFS on a weighted graph', templateId: 'l14-bfs-weight', guidance: 'less' },
      { type: 'exercise', title: 'Variation: BFS on a new graph', templateId: 'l14-bfs-click', guidance: 'none' },
      { type: 'exercise', title: 'Variation: DFS on a new graph', templateId: 'l14-dfs-click', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:traversal-pitfalls',
        title: 'Traversals: common mistakes and edge cases',
        ref: 'Lec 14 p.1–4',
        body: `- **No base case.** A recursive traversal must return on an empty subtree (NULL) — otherwise it follows NULL and crashes.
- **Print in the wrong place.** Preorder prints before both calls, inorder between them, postorder after both.
- **Empty tree.** Every traversal prints nothing; an iterative version must not pop from an empty stack.
- **Not marking vertices.** Without “discovered” marks, a cycle makes BFS queue vertices forever and DFS recurse forever.
- **Marking too late in BFS.** Mark a vertex when it is QUEUED, not when it is printed, or it can be queued twice.
- **Stack instead of queue (or the reverse).** Taking the most recently found vertex gives a depth-first order; BFS needs the oldest (FIFO).
- **Neighbour order.** Different neighbour orders give different (equally valid) orders; the lecture answers use alphabetical order.
- **Unreachable vertices.** One BFS/DFS only visits the start vertex’s component; restart from every undiscovered vertex to visit the whole graph.`,
      },
      { type: 'exercise', key: 'e:predict-a-traversal-program', title: 'Predict what a traversal program prints', templateId: 'l14-predict-output', params: { impl: 'tree-traversals' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-traversal', title: 'Complete the missing statement', templateId: 'l14-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-inorder', title: 'Write it yourself: inorder traversal', templateId: 'l14-write-code', params: { lab: 'tree-inorder' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-bfs', title: 'Write it yourself: breadth-first search', templateId: 'l14-write-code', params: { lab: 'graph-bfs' }, guidance: 'none' },
    ],
  },
];

// Every section has a stable key (progress is saved by key, not by position).
const slug = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
for (const l of LESSONS) for (const sec of l.sections) sec.key ||= `${sec.type[0]}:${slug(sec.title)}`;

export const LESSON_BY_LECTURE = Object.fromEntries(LESSONS.map((l) => [l.lecture, l]));
