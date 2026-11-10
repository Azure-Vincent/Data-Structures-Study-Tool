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
        body: `**Primitive** data types are single values provided by the language: integers, floating-point numbers, characters and **pointers**.

**Non-primitive** data structures are built from primitive types: arrays, lists and files. Lists are commonly divided into:
- **linear data structures**: the elements form one sequence (arrays, linked lists, stacks, queues);
- **nonlinear data structures**: an element can lead to several others (trees, graphs).

“Linear” describes the **logical order** (each element has at most one successor), not how the elements are stored in memory: an array is stored contiguously, a linked list is not, and both are linear.`,
      },
      {
        type: 'read',
        key: 'r:how-to-read-the-code',
        title: 'Code conventions: C++, Python and pseudocode',
        body: `Every program is presented in **C++**, with equivalent **Python** and **pseudocode** versions; C is shown where manual memory management (\`malloc\`/\`free\`) is the subject. All versions perform exactly the same steps. Selecting a language on any code panel (or in Settings) changes every panel.

| | C++ | Python | Pseudocode |
|---|---|---|---|
| block | \`{ … }\` | indentation after \`:\` | \`then\` / \`do\` … \`end if\` / \`end while\` / \`end for\` |
| no node (empty pointer) | \`nullptr\` (C: \`NULL\`) | \`None\` | \`NULL\` |
| field of a node | \`p->data\` (dereference the pointer) | \`p.data\` | \`p.data\` |
| new node | \`new Node{…}\` | \`Node(…)\` | \`new Node(value)\` |
| release a node | \`delete p;\` | automatic (garbage collection) | \`delete p\` |
| output one value per line | \`cout << x << "\\n";\` | \`print(x)\` | \`print x\` |
| integer division | \`7 / 2\` → 3 (integers) | \`7 // 2\` → 3 | \`7 div 2\` → 3 |

**Pseudocode conventions.** The pseudocode is designed to translate line by line into C++:
- \`=\` is **assignment** and \`==\` is **comparison**; \`!=\` means “not equal”.
- **NULL** is the value of a pointer that refers to no node. It is written \`NULL\` throughout (\`nil\` is accepted as a synonym); it corresponds to \`nullptr\` in C++ and \`None\` in Python. A **pointer assignment** such as \`p.next = q\` changes a link; \`p = p.next\` moves a pointer variable and changes no node.
- Every block is closed explicitly: \`if … then … end if\`, \`while … do … end while\`, \`for … do … end for\`, \`function name(parameters) … end function\`. A loop that tests its condition after the body is written \`do … while condition\`.
- Each nested block is indented by four spaces.
- Functions declare their parameters in parentheses and return a value with \`return\`. Parameters are passed by value, as in C++ without references.
- Identifiers are descriptive: \`head\` (first node of a list), \`new_node\`, \`temp\` (a traversal pointer), \`prev\`, \`node_count\`, \`front\`/\`rear\`, \`top\`, \`root\`.

The pseudocode is executable: every pseudocode example can be opened in Pseudocode Development and run step by step.`,
      },
      {
        type: 'code',
        key: 'c:one-small-program-in-every-language',
        title: 'One small program in every language',
        check: true,
        body: 'A variable, an array, a loop, a function and output. The statements correspond line by line in every language, and all versions print 10, 20, 30 and then 60.',
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
        title: 'Contiguous and non-contiguous memory',
        concepts: ['l07.memory-layout'],
        body: `An **array** occupies one contiguous block of memory: element *i* is stored at address \`base + i × size\`, so any element can be located with one calculation.

A **linked list** is non-contiguous: every node is a separate block on the heap, and each node stores the **address** of the next node. Reaching node *k* requires following *k − 1* links.`,
        visual: { type: 'compareMemory', values: [10, 20, 30, 40] },
      },
      { type: 'exercise', key: 'e:compute-an-element-address', title: 'Compute an element address', templateId: 'l07-address', guidance: 'full' },
      {
        type: 'code',
        key: 'c:pointers-malloc-and-free',
        title: 'Pointers and dynamic memory allocation',
        concepts: ['l07.pointers-alloc'],
        body: `In C, \`malloc(n)\` requests **n bytes** from the heap and returns the address of the new block (or NULL if the request fails); \`free(p)\` releases that block. The cast \`(int *)\` converts the \`void *\` result of malloc; it is optional in C and required in C++. One node is allocated in C with \`(node *) malloc(sizeof(node))\`. C++ code uses \`new Node{...}\` and \`delete\` instead.`,
        c: `char *cp;
cp = (char *) malloc(100);               /* 100 bytes */

int *ip;
ip = (int *) malloc(100 * sizeof(int));  /* 100 ints  */
/* ... use ip[0] .. ip[99] ... */
free(ip);                                /* release the block */
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
ip = NULL             # arrays are reclaimed automatically; nodes are released with delete`,
      },
      {
        type: 'read',
        key: 'r:memory-in-three-languages',
        title: 'Memory management in C++, Python and pseudocode',
        concepts: ['l07.pointers-alloc'],
        body: `**C++: pointers and manual memory management.** A pointer variable (\`Node* p\`) holds an **address**. \`new Node{…}\` allocates a node on the heap and returns its address; \`delete p\` releases it. \`p->data\` **dereferences** the pointer to reach a field of the node. Manual management leads to two common errors:
- a **memory leak**: the last pointer to a node is overwritten or goes out of scope without \`delete\`, so the node can never be released;
- a **dangling pointer**: the node was deleted but a pointer still holds its address; using that pointer is undefined behavior.

**Python: references and automatic memory management.** Every variable *refers* to an object; \`p = Node(10)\` makes p refer to a new object and \`q = p\` makes q refer to the **same** object. There are no addresses to compute and no \`delete\` for objects: when no reference to an object remains, the **garbage collector** reclaims it. \`del p\` only removes the name p. As a result there are no dangling references, but a list can still be **lost** by overwriting the only reference to it, exactly as in C++.

**Pseudocode: language-independent.** \`new Node(v)\` returns an address, displayed as @100, @200, …; variables hold those addresses; \`delete p\` releases a node, which is then marked as deleted. Memory leaks, dangling pointers and NULL dereferences are reported at the step where they occur, so the pseudocode behaves like carefully checked C++.`,
      },
      {
        type: 'code',
        key: 'c:two-names-for-one-node',
        title: 'Two names for one node',
        check: true,
        body: 'p and q refer to the same node, so a change made through q is visible through p. Every version prints 99. The node is then released: explicitly in C, C++ and pseudocode, automatically in Python.',
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
    free(p);                    /* release the node exactly once */
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
    delete p;                          // release the node exactly once
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
delete p              # release the node; q now dangles
p = NULL
q = NULL`,
      },
      {
        type: 'note',
        key: 'n:storage-location-is-not-the-same-as-structure-ty',
        variant: 'technical',
        title: 'Storage location is not the same as structure type',
        body: `A common simplification states that arrays use stack memory and linked lists use heap memory. That is true only for a *local* array. A global array lives in the static data area, and \`malloc(n * sizeof(int))\` creates an array **on the heap**. Likewise the pointer \`head\` is a normal variable (stack or static) even though the nodes it reaches are on the heap. Where memory lives depends on **how it was obtained**, not on whether it is an array or a list.`,
      },
      { type: 'exercise', key: 'e:where-does-the-memory-live', title: 'Where does the memory live?', templateId: 'l07-storage', guidance: 'full' },
      {
        type: 'read',
        key: 'r:trade-offs-between-arrays-and-linked-lists',
        title: 'Arrays and linked lists compared',
        concepts: ['l07.arrays-vs-lists', 'l07.tradeoffs'],
        body: `| Operation | Array | Singly linked list |
|---|---|---|
| Access element *k* | compute its address: base + k · size | follow the links from head, node by node, to node *k* |
| Insert at the front | shift every element one position right, then store the value | create a node and change two links |
| Delete at a known position | shift every later element one position left | redirect the link that points to the node, then release it |
| Memory per element | the value only | the value and one pointer |
| Size | fixed when the array is declared | grows and shrinks during execution |

Searching a linked list requires visiting the nodes one by one from head, because no address formula leads directly to the middle of the list.`,
      },
      {
        type: 'note',
        key: 'n:deleting-from-an-array-is-not-possible-what-it-r',
        variant: 'technical',
        title: 'Deletion from an array and resizing an array',
        body: `An element **can** be deleted from an array: every later element is shifted one position left and a separate count of used positions is decreased. What a plain array cannot do is **shrink or grow its allocated size**: the capacity is fixed. Deletion is possible; *resizing* is not.`,
      },
      {
        type: 'read',
        key: 'r:arrays-purpose-and-terms',
        title: 'Arrays: purpose, organization and terminology',
        concepts: ['l07.arrays-vs-lists'],
        body: `**Organization.** An array is ONE block of equally sized **elements** stored side by side. Each element is identified by its **index**: 0 for the first, 1 for the next, and so on (C, C++, Python and the pseudocode all index from 0).

**Two different sizes.** The **capacity** (MAX) is fixed when the array is created. The number of positions that currently hold values is a separate count maintained by the program, here **n**. Valid values occupy positions 0 … n − 1.

**Operations.**
- *read or write element i*: one address calculation, regardless of the size of the array;
- *insert at index pos*: shift elements pos … n − 1 one position to the RIGHT (starting from the end), store the value, n = n + 1; not possible when n == MAX;
- *delete at index pos*: shift elements pos + 1 … n − 1 one position to the LEFT, n = n − 1.

**Use an array when** the maximum number of elements is known and elements are mostly read or replaced by position (tables, matrices, array-based stacks and queues, binary trees stored in arrays). **Use a linked list when** elements are frequently inserted or deleted at the front or in the middle, or when the number of elements is not known in advance.`,
        visual: { type: 'array', n: 6, filled: 4, values: [10, 20, 30, 40], highlight: [] },
      },
      { type: 'walk', key: 'w:array-shift', title: 'Implementation: an array with insertion and deletion', impl: 'array-shift' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:array-pitfalls',
        title: 'Arrays: common errors and edge cases',
        body: `- **Shifting in the wrong direction.** For an insertion, copy from the END backward (\`a[i] = a[i − 1]\`); copying forward overwrites values before they have been moved. For a deletion, copy forward (\`a[i] = a[i + 1]\`).
- **Not updating n.** After an insertion n increases by 1 and after a deletion it decreases by 1; the array itself does not record how many positions are in use.
- **Full array.** Inserting when n == MAX has no free position: test for this condition first and report it.
- **Empty array.** Deleting when n == 0 has nothing to delete.
- **Invalid positions.** Insertion accepts 0 ≤ pos ≤ n (pos = n appends); deletion accepts 0 ≤ pos ≤ n − 1. C++ does **not** check indices: writing outside the array silently corrupts other memory. Python raises an \`IndexError\`; the pseudocode stops with an error that names the line.
- **Mixing allocation styles.** Memory obtained with \`malloc\` is released with \`free\`, memory obtained with \`new[]\` with \`delete[]\`; a block is never used after it has been released.`,
      },
      { type: 'exercise', key: 'e:count-the-shifts', title: 'Shift the elements', templateId: 'l07-shifts', guidance: 'full' },
      { type: 'exercise', key: 'e:spot-the-memory-bug', title: 'Identify the memory error', templateId: 'l07-membug', guidance: 'full' },
      { type: 'exercise', key: 'e:variation-choose-a-structure', title: 'Select a data structure', templateId: 'l07-choose', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-linear-or-non-linear', title: 'Linear or nonlinear?', templateId: 'l07-classify', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-the-array-program', title: 'Predict the output of the array program', templateId: 'l07-predict-output', params: { impl: 'array-shift' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-shift', title: 'Complete the shifting loop', templateId: 'l07-complete-code', params: { impl: 'array-shift' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-insert', title: 'Write the pseudocode: insert into an array', templateId: 'l07-write-code', params: { lab: 'array-insert' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-array-delete', title: 'Write the pseudocode: delete from an array', templateId: 'l07-write-code', params: { lab: 'array-delete' }, guidance: 'none' },
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
        body: `Each **node** has two fields: \`data\` (the value) and \`next\` (the **address** of the next node). The \`next\` field of the last node is **NULL**, drawn as **X** in the diagrams.

\`head\` is a pointer variable that holds the address of the first node. An empty list is \`head == NULL\`.

Two numbers must be kept distinct: the **value** of a node (for example 10) and its **address** (for example 100). Pointers hold addresses only.

**Purpose.** A linked list stores a sequence whose length changes during execution: nodes are created one at a time, wherever memory is available, and the links determine their order. Insertion and deletion change only a few links; no element is shifted. The cost: reaching the k-th node requires following the links from head, and every node stores one additional pointer.

**Use a linked list when** the number of items is not known in advance or items are frequently inserted and removed at the front or in the middle; linked lists are also the basis of linked stacks, linked queues and the adjacency lists of graphs. **Use an array** when items are mostly accessed by position.`,
        visual: { type: 'list', values: [10, 20, 30, 40] },
      },
      {
        type: 'note',
        key: 'n:sll-terminology',
        variant: 'terms',
        title: 'Terminology',
        body: `- **head**: the head pointer, which holds the address of the first node
- **X** in a diagram: NULL (C and pseudocode), nullptr (C++), None (Python)
- **create_node()**: allocates and initializes a node (data = value, next = NULL)
- **temp, prev**: traversal pointers (local variables)
- **position**: the 1-based index of a node (the first node is at position 1)`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-nodes',
        title: 'Prerequisites: node types, NULL and functions that change head',
        body: `- **A node type** groups fields. C uses \`struct\`; C++ uses \`struct Node { int data; Node* next; };\`; Python uses a \`class Node\` whose \`__init__\` sets \`self.data\` and \`self.next\`; pseudocode nodes have the fields data and next.
- **No node** is \`NULL\` in C and pseudocode, \`nullptr\` in C++ and \`None\` in Python. An empty list is head == NULL.
- **Dereferencing.** C and C++ follow a pointer to a field with \`->\` (\`temp->next\`); Python and the pseudocode write \`temp.next\`.
- **Comparing with NULL.** C++ \`p == nullptr\`, Python \`p is None\` (\`is\` tests whether two references denote the same object), pseudocode \`p == NULL\`.
- **Changing head inside a function.** In the C and C++ programs head is a global variable, so a function may assign it. In Python, a function that ASSIGNS a global variable must first declare \`global head\`; without it, \`head = new_node\` creates a new local variable and the list does not change. Pseudocode functions can assign global variables directly, as in C.`,
      },
      {
        type: 'code',
        key: 'c:declaring-a-node-and-create-node',
        title: 'Declaring a node and create_node()',
        body: 'create_node() receives the value as a parameter, allocates a node, stores the value and sets next to NULL. Passing the value in (rather than reading it inside the function) keeps the function easy to test.',
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
    return new Node{value, nullptr};   // allocate and initialize
}`,
        py: `class Node:
    def __init__(self, data):
        self.data = data          # the value
        self.next = None          # the next node (None = none)

head = None                      # empty list

def create_node(value):
    return Node(value)            # create and initialize`,
        pseudo: `# Nodes have the fields data and next; new Node(v) sets next = NULL.
head = NULL                      # empty list

function create_node(value)
    new_node = new Node(value)     # create and initialize
    return new_node
end function`,
      },
      { type: 'exercise', key: 'e:value-or-address', title: 'Value or address?', templateId: 'l08-predict-temp', guidance: 'full' },
      {
        type: 'sim',
        key: 's:worked-example-create-list-10-20-30',
        title: 'Worked example: create_list() builds 10 → 20 → 30',
        struct: 'sll',
        setup: { values: [] },
        op: 'createList',
        args: [[10, 20, 30]],
        body: 'temp traverses to the last node before every append. Each allocation and each pointer assignment is a separate step.',
      },
      {
        type: 'note',
        key: 'n:prose-vs-code-on-creation',
        variant: 'technical',
        title: 'Building a list at the front or at the end',
        body: `A list can be built by adding each new node at the **front** (new_node->next = head; head = new_node) or at the **end** (traverse temp to the last node; temp->next = new_node). Both methods build a valid list, but in opposite orders: entering 10, 20, 30 produces 30 → 20 → 10 when inserting at the front and 10 → 20 → 30 when appending at the end. create_list() appends at the end, so temp traverses from head to the last node before every append.`,
      },
      { type: 'walk', key: 'w:sll-create', title: 'Implementation: create a list', impl: 'sll-create', body: 'The complete program: the node type, create_node(), an append operation in the style of create_list(), and display(). Each allocation and each link appears as a separate step.' },
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
        body: 'The order of the pointer assignments matters: (1) new_node->next = head, then (2) head = new_node. Predict each change before it is executed.',
      },
      { type: 'walk', key: 'w:sll-insert-beg', title: 'Implementation: insert at the beginning', impl: 'sll-insert-beg' },
      { type: 'exercise', key: 'e:insert-at-the-beginning-by-pointer-assignment', title: 'Insert at the beginning by pointer assignment', templateId: 'l08-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
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
        body: 'temp advances while temp->next != NULL, so it stops ON the last node, whose next pointer is then changed from NULL to the new node.',
      },
      { type: 'walk', key: 'w:sll-insert-end', title: 'Implementation: insert at the end', impl: 'sll-insert-end' },
      {
        type: 'exercise',
        key: 'e:insert-15-after-10-which-links-change',
        title: 'Insert 15 after 10 in 10 → 20 → 30: which links change?',
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
        body: 'prev trails one node behind temp. When i reaches pos, prev refers to 10 and temp refers to 20.',
      },
      { type: 'exercise', key: 'e:insert-15-after-10', title: 'Insert 15 after 10', templateId: 'l08-rewire-insert', params: { kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 }, guidance: 'full' },
      {
        type: 'codesim',
        key: 'c:the-lost-access-bug-and-how-saving-a-reference-p',
        title: 'Lost access: how an extra pointer prevents it',
        concepts: ['l09.preserve-access'],
        body: 'Each version inserts 15 after 10 with prev on node 10. The incorrect version overwrites prev->next while it holds the ONLY address of 20 → 30. The correct versions either save that address in temp first or link the new node before redirecting prev->next.',
        variants: [
          {
            label: 'Incorrect',
            lines: ['new_node = create_node();', 'prev->next = new_node;', 'new_node->next = prev->next;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'prev->next = new_node;', 'new_node->next = prev->next;'], py: ['new_node = Node(15)', 'prev.next = new_node', 'new_node.next = prev.next'], pseudo: ['new_node = new Node(15)', 'prev.next = new_node', 'new_node.next = prev.next'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Correct (save in temp)',
            lines: ['new_node = create_node();', 'temp = prev->next;', 'prev->next = new_node;', 'new_node->next = temp;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'Node* temp = prev->next;', 'prev->next = new_node;', 'new_node->next = temp;'], py: ['new_node = Node(15)', 'temp = prev.next', 'prev.next = new_node', 'new_node.next = temp'], pseudo: ['new_node = new Node(15)', 'temp = prev.next', 'prev.next = new_node', 'new_node.next = temp'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
          {
            label: 'Correct (reordered)',
            lines: ['new_node = create_node();', 'new_node->next = prev->next;', 'prev->next = new_node;'],
            langs: { cpp: ['Node* new_node = new Node{15, nullptr};', 'new_node->next = prev->next;', 'prev->next = new_node;'], py: ['new_node = Node(15)', 'new_node.next = prev.next', 'prev.next = new_node'], pseudo: ['new_node = new Node(15)', 'new_node.next = prev.next', 'prev.next = new_node'] },
            setup: { values: [10, 20, 30], vars: { prev: 1 } },
            newValue: 15,
          },
        ],
      },
      {
        type: 'note',
        key: 'n:two-details-in-insert-at-position',
        variant: 'technical',
        title: 'Two details in insert_at_position',
        body: `1. **Validate before allocating.** If create_node() is called before pos is checked, an invalid position leaves the new node neither linked nor released: a memory leak. Check the position first, then allocate.
2. **The valid range.** A frequent error reuses the deletion test \`pos > 1 && pos < node_count\`. For *insertion*, pos = node_count is still a middle position (the new node is placed just before the last node), so the correct test is \`pos > 1 && pos <= node_count\`. The simulation uses the correct test.`,
      },
      { type: 'walk', key: 'w:sll-insert-pos', title: 'Implementation: insert at any position', impl: 'sll-insert-pos', body: 'One function for every position: the position is validated BEFORE a node is allocated, and position n + 1 (after the last node) is accepted. Each starting situation can be selected, including an invalid position.' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-insert-pitfalls',
        title: 'Insertion: common errors and edge cases',
        body: `- **Incorrect order of pointer assignments (lost access).** Link the new node to the rest of the list FIRST (\`new_node->next = …\`), then redirect the link that should point to it.
- **Traversing one node too far.** \`while (temp != NULL)\` stops AFTER the last node (temp is NULL and \`temp->next = new_node\` dereferences NULL); \`while (temp->next != NULL)\` stops ON the last node.
- **Empty list.** Insertion at the end has no last node when head == NULL: the new node becomes head.
- **Position 1.** Inserting at position 1 must change head itself, because no previous node exists.
- **Invalid positions** (0, negative, greater than n + 1): reject them before allocating; otherwise the new node is leaked.
- **Python: omitting \`global head\`.** The assignment then creates a local variable: the global list does not change (or Python raises \`UnboundLocalError\`).
- **C++: passing head by value.** \`void insert(Node* head, …)\` changes only a copy; use the global variable, a reference (\`Node*& head\`) or return the new head.`,
      },
      { type: 'exercise', key: 'e:variation-arrange-the-steps', title: 'Arrange the insertion steps', templateId: 'l08-order-insert', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-complete-the-code', title: 'Complete the insertion code', templateId: 'l08-fill', guidance: 'less' },
      { type: 'exercise', key: 'e:find-the-bug', title: 'Identify the error', templateId: 'l08-bug', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-the-final-list', title: 'Predict the final list', templateId: 'l08-predict-state', guidance: 'none' },
      { type: 'exercise', key: 'e:predict-the-list-program', title: 'Predict the output of a list program', templateId: 'l08-predict-output', params: { impl: 'sll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-insert-at-beginning', title: 'Complete the missing statement', templateId: 'l08-complete-code', params: { impl: 'sll-insert-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-the-end', title: 'Write the pseudocode: insert at the end', templateId: 'l08-write-code', params: { lab: 'sll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-insert-at-a-position', title: 'Write the pseudocode: insert at any position', templateId: 'l08-write-code', params: { lab: 'sll-insert-pos' }, guidance: 'none' },
      {
        part: 'Deletion and traversal',
        type: 'read',
        key: 'r:deleting-safely-save-relink-free',
        title: 'Safe deletion: save, relink, release',
        concepts: ['l09.delete-beg', 'l09.preserve-access'],
        body: `Every deletion follows three rules:
1. Keep a pointer (temp) to the node being removed; its address is needed to release it.
2. Redirect the link that points TO the node, so that the list bypasses it.
3. Only then release the node. Releasing it first would leave the list pointing to deallocated memory.

If the list is empty, the deletion reports underflow and changes nothing.

**Releasing the node in each language.** C: \`free(temp)\` (memory from malloc). C++: \`delete temp;\` (memory from new). Python: no call is needed; once no variable refers to the removed node, the garbage collector reclaims it (\`del temp\` only removes the last name). Pseudocode: \`delete temp\`; the node is marked as deleted and any pointer that still refers to it is reported. In every language steps 1 and 2 are the same: keep access to the node, then make the list bypass it.`,
      },
      { type: 'sim', key: 's:delete-at-beginning', title: 'delete_at_beginning()', struct: 'sll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'free'], body: 'Saving the node, relinking and deallocation are separate steps.' },
      { type: 'walk', key: 'w:sll-delete-beg', title: 'Implementation: delete at the beginning', impl: 'sll-delete-beg', body: 'Three starting situations: a list of several nodes, a list with ONE node (head becomes NULL) and an empty list (nothing to delete).' },
      { type: 'exercise', key: 'e:delete-the-first-node-by-pointer-assignment', title: 'Delete the first node by pointer assignment', templateId: 'l09-rewire-delete', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'sim', key: 's:delete-at-end', title: 'delete_at_end()', concepts: ['l09.delete-end'], struct: 'sll', setup: { values: [10, 20, 30, 40] }, op: 'deleteEnd', predict: ['var', 'link'], body: 'prev trails temp, so when temp reaches the last node, prev refers to the node that becomes the new last node.' },
      {
        type: 'note',
        key: 'n:single-node-delete-at-end-leaves-head-dangling',
        variant: 'technical',
        title: 'Single-node list: an incomplete delete_at_end leaves head dangling',
        body: `With a single node, temp, prev and head all hold the same address. The loop never executes; \`prev->next = NULL\` only modifies the node being deleted; \`free(temp)\` releases it, and **head still holds the deallocated address**. The correct version adds \`if (temp == head) head = NULL; else prev->next = NULL;\`. The next simulation shows the incomplete version.`,
      },
      { type: 'sim', key: 's:incomplete-delete-at-end-on-a-single-node', title: 'The incomplete version on a single-node list', struct: 'sll', setup: { values: [42] }, op: 'deleteEndIncorrect', body: 'After free(temp), head still points to a block marked as deleted.' },
      { type: 'exercise', key: 'e:fix-the-one-node-case', title: 'Correct the single-node case', templateId: 'l09-singleton', guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-end', title: 'Implementation: delete at the end', impl: 'sll-delete-end' },
      {
        type: 'exercise',
        key: 'e:delete-20-which-pointers-change',
        title: 'Delete 20 from 10 → 15 → 20 → 30: which pointers change?',
        concepts: ['l09.delete-mid'],
        templateId: 'l08-which-links',
        params: { op: 'del', kind: 'mid', values: [10, 15, 20, 30], pos: 3 },
        guidance: 'full',
      },
      { type: 'sim', key: 's:delete-at-position-3', title: 'delete_at_position(pos = 3)', struct: 'sll', setup: { values: [10, 15, 20, 30] }, op: 'deleteMid', args: [3], predict: ['var', 'link', 'free'] },
      { type: 'exercise', key: 'e:delete-20', title: 'Delete 20', templateId: 'l09-rewire-delete', params: { kind: 'mid', values: [10, 15, 20, 30], deleteValue: 20 }, guidance: 'full' },
      { type: 'walk', key: 'w:sll-delete-pos', title: 'Implementation: delete at any position', impl: 'sll-delete-pos', body: 'prev stops on the node BEFORE the node to delete, and temp on the node itself. The starting situations include position 1, the last position and an invalid position.' },
      {
        type: 'codesim',
        key: 'c:freeing-too-early',
        title: 'Releasing a node too early',
        body: 'Both versions remove node 2 (prev refers to node 1, temp to node 2). The incorrect version releases temp before reading temp->next.',
        variants: [
          {
            label: 'Incorrect',
            lines: ['free(temp);', 'prev->next = temp->next;'],
            langs: { cpp: ['delete temp;', 'prev->next = temp->next;   // reads a deleted node'], py: ['del temp                   # Python only removes the NAME temp ...', 'prev.next = temp.next      # ... so this line fails: temp no longer exists'], pseudo: ['delete temp', 'prev.next = temp.next'] },
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
      { type: 'sim', key: 's:traverse', title: 'traverse()', concepts: ['l09.traverse'], struct: 'sll', setup: { values: [10, 15, 30] }, op: 'traverse', predict: ['output'], body: 'temp moves, not head, so the list is unchanged afterward.' },
      { type: 'exercise', key: 'e:variation-delete-anywhere', title: 'Delete at any position', templateId: 'l09-rewire-delete', guidance: 'less' },
      { type: 'exercise', key: 'e:arrange-the-deletion-steps', title: 'Arrange the deletion steps', templateId: 'l09-order-delete', guidance: 'less' },
      { type: 'exercise', key: 'e:find-the-deletion-bug', title: 'Identify the deletion error', templateId: 'l09-bug', guidance: 'less' },
      { type: 'exercise', key: 'e:which-positions-are-valid', title: 'Which positions are valid?', templateId: 'l09-valid-pos', guidance: 'less' },
      { type: 'exercise', key: 'e:predict-traverse-after-deletions', title: 'Predict traverse() after deletions', templateId: 'l09-traverse-predict', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:sll-delete-pitfalls',
        title: 'Deletion: common errors and edge cases',
        body: `- **Releasing too early.** \`free(temp)\` or \`delete temp\` before the list bypasses the node leaves a link to deallocated memory (a dangling pointer).
- **Not releasing.** Unlinking without \`free\` or \`delete\` leaks the node in C and C++ (Python reclaims it automatically).
- **Empty list.** delete_at_beginning and delete_at_end must test head == NULL first (underflow).
- **Single node.** Deleting the only node must leave head == NULL; a delete_at_end that only sets prev->next = NULL leaves head dangling.
- **Position 1** changes head; there is no previous node.
- **Invalid positions.** Valid positions are 1 … n. With pos greater than n, a loop that advances prev runs past the end: count the nodes (or stop at NULL) before relinking.
- **Moving head instead of temp during traversal.** Traversing with head loses the list; always traverse with a separate pointer.`,
      },
      { type: 'exercise', key: 'e:predict-a-deletion-program', title: 'Predict the output of a deletion program', templateId: 'l09-predict-output', params: { impl: 'sll-delete-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-deletion', title: 'Complete the missing statement', templateId: 'l09-complete-code', params: { impl: 'sll-delete-beg' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-the-last-node', title: 'Write the pseudocode: delete the last node', templateId: 'l09-write-code', params: { lab: 'sll-delete-last' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-delete-at-a-position', title: 'Write the pseudocode: delete at any position', templateId: 'l09-write-code', params: { lab: 'sll-delete-pos' }, guidance: 'none' },
      {
        part: 'Circular singly linked lists',
        type: 'read',
        key: 'r:the-last-node-points-back-to-the-first',
        title: 'The last node points back to the first',
        concepts: ['l11.circular-links'],
        body: `In a circular singly linked list the next field of the last node holds the address of the **first** node. A single-node circular list points to **itself**. An empty list is still \`head == NULL\`.

Consequence: in a non-empty circular list **no next field is NULL**, so a loop that tests for NULL never terminates.

**Purpose and uses.** Every node can be reached from any other node by moving forward, and the node after the last node is the first node again. This suits data processed in rounds, such as taking turns or repeating a cycle of steps. The node type is the singly linked node; only the last link differs.`,
        visual: { type: 'list', kind: 'csll', values: [10, 20, 30, 40] },
      },
      { type: 'sim', key: 's:why-testing-for-null-fails', title: 'Why testing for NULL fails in a circular list', concepts: ['l11.csll-traverse'], struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverseNullBug', body: 'The simulation stops the loop after the second pass through the list; a compiled program would never stop.' },
      {
        type: 'note',
        key: 'n:circular-append-loop-condition',
        variant: 'technical',
        title: 'The loop condition for appending to a circular list',
        body: `An append loop copied from the singly linked list, \`while (temp->next != NULL)\`, fails for a circular list: after the first node is closed into a circle no next field is NULL, so the loop never terminates on the next append. A circular append must advance with \`while (temp->next != head)\`, as insert_at_end does.`,
      },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-do-while',
        title: 'Prerequisites: loops that test after the body',
        body: `A **do … while** loop executes its body FIRST and tests the condition afterward, so the body executes at least once. One complete pass through a circular list requires exactly this: initially temp == head, so a test before the body would stop immediately.
- C and C++: \`do { … } while (temp != head);\`
- Python has no do-while statement: write \`while True:\` and end the body with \`if temp is head: break\`.
- Pseudocode: \`do\` … \`while temp != head\`.
An empty circular list (head == NULL) must be tested BEFORE the loop; otherwise the body dereferences NULL.`,
      },
      { type: 'sim', key: 's:the-right-way-do-while-exactly-one-lap', title: 'The correct traversal: do-while, exactly one pass', struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverse', predict: ['output'] },
      { type: 'walk', key: 'w:csll-create', title: 'Implementation: create a circular list', impl: 'csll-create', body: 'The append operation advances to the node whose next is head, links the new node there and closes the circle again. display() makes exactly one pass.' },
      { type: 'exercise', key: 'e:click-exactly-one-lap', title: 'Select the nodes of exactly one pass', templateId: 'l11-one-lap', guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-stopping-condition', title: 'Complete the stopping condition', templateId: 'l11-fill-dowhile', guidance: 'less' },
      { type: 'sim', key: 's:insert-at-the-beginning-the-last-node-must-chang', title: 'Insert at the beginning: the last node must change too', concepts: ['l11.csll-insert'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [5], predict: ['link', 'var'] },
      { type: 'sim', key: 's:insert-into-an-empty-circle', title: 'Insert into an empty circular list', concepts: ['l11.csll-edge'], struct: 'csll', setup: { values: [] }, op: 'insertBeg', args: [7], predict: ['link'] },
      { type: 'walk', key: 'w:csll-insert-beg', title: 'Implementation: insert at the beginning', impl: 'csll-insert-beg', body: 'Two starting situations: the link of the last node must change as well, and an empty list becomes a single node that points to itself.' },
      { type: 'walk', key: 'w:csll-insert-end', title: 'Implementation: insert at the end', impl: 'csll-insert-end' },
      { type: 'exercise', key: 'e:insert-into-a-circular-list', title: 'Insert into a circular list', templateId: 'l11-rewire-insert', guidance: 'full' },
      { type: 'sim', key: 's:delete-at-the-beginning', title: 'Delete at the beginning', concepts: ['l11.csll-delete'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'link', 'free'] },
      {
        type: 'note',
        key: 'n:missing-free-and-the-one-node-case',
        variant: 'technical',
        title: 'Releasing the node and the single-node case',
        body: `- delete_at_beginning must call \`free(temp)\` (or \`delete temp\`) after unlinking the first node; otherwise the node leaks.
- When the **only** node is removed (head->next == head), the node is released and head becomes NULL: the list is then empty.
- delete_at_end has the same single-node problem as in a singly linked list: temp == prev == head, so \`prev->next = head\` followed by \`free(temp)\` leaves head dangling. The correct version tests \`if (temp == head) head = NULL;\`.`,
      },
      { type: 'walk', key: 'w:csll-delete-beg', title: 'Implementation: delete at the beginning', impl: 'csll-delete-beg' },
      { type: 'walk', key: 'w:csll-delete-end', title: 'Implementation: delete at the end', impl: 'csll-delete-end' },
      { type: 'exercise', key: 'e:delete-the-only-node', title: 'Delete the only node', templateId: 'l11-rewire-delete', params: { single: true, kind: 'end' }, guidance: 'full' },
      { type: 'exercise', key: 'e:variation-delete-from-a-longer-circle', title: 'Delete from a longer circular list', templateId: 'l11-rewire-delete', params: { single: false }, guidance: 'less' },
      { type: 'exercise', key: 'e:order-the-delete-at-beginning-steps', title: 'Arrange the delete-at-beginning steps', templateId: 'l11-order-delbeg', guidance: 'less' },
      { type: 'exercise', key: 'e:what-happens-with-the-null-loop', title: 'What happens with a loop that tests for NULL?', templateId: 'l11-null-loop', guidance: 'none' },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:csll-pitfalls',
        title: 'Circular lists: common errors and edge cases',
        body: `- **Testing for NULL.** In a non-empty circular list no next field is NULL: loops must stop when they return to head.
- **Testing before the body.** \`while (temp != head)\` with temp = head never executes; use a do-while loop for one complete pass.
- **Leaving the circle open.** After insertion at the end, the new node must point back to head; after insertion at the beginning, the LAST node must point to the new head.
- **Empty list.** When head == NULL there is nothing to traverse; the first inserted node must point to itself.
- **Single node.** Its next field refers to itself; deleting it must leave head == NULL.
- **Not releasing** the removed node in C and C++, which leaks memory.`,
      },
      { type: 'exercise', key: 'e:predict-a-circular-program', title: 'Predict the output of a circular list program', templateId: 'l11-predict-output', params: { impl: 'csll-insert-beg' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-the-circle', title: 'Complete the missing statement', templateId: 'l11-complete-code', guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-insert-front', title: 'Write the pseudocode: insert at the beginning', templateId: 'l11-write-code', params: { lab: 'csll-insert-front' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-csll-delete-first', title: 'Write the pseudocode: delete the first node', templateId: 'l11-write-code', params: { lab: 'csll-delete-first' }, guidance: 'none' },
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
        body: `Each node has three fields: **prev** (the address of the previous node), **data**, and **next** (the address of the next node).

The invariant: for every pair of adjacent nodes A and B, \`A->next == B\` **and** \`B->prev == A\`. The prev field of the first node and the next field of the last node are NULL. Every operation must preserve both directions.

**Purpose and uses.** The additional link allows traversal in BOTH directions and the removal of a node that is already referenced without searching for its predecessor. A doubly linked list suits programs that move backward (for example, previous/next navigation) or that delete nodes they already hold a pointer to; a singly linked list is simpler and smaller when one direction is sufficient.`,
        visual: { type: 'list', kind: 'dll', values: [10, 20, 30] },
      },
      {
        type: 'code',
        key: 'c:dll-node-and-create-node',
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
    Node* prev;     // previous node
    int data;
    Node* next;     // next node
};
Node* create_node(int v) { return new Node{nullptr, v, nullptr}; }`,
        py: `class Node:
    def __init__(self, data):
        self.prev = None      # previous node
        self.data = data
        self.next = None      # next node

def create_node(v):
    return Node(v)`,
        pseudo: `# Nodes of a doubly linked list have the fields prev, data and next;
# new Node(v) sets both links to NULL.
function create_node(v)
    new_node = new Node(v)
    return new_node
end function`,
      },
      { type: 'walk', key: 'w:dll-create', title: 'Implementation: create a doubly linked list', impl: 'dll-create', body: 'Every append sets TWO links. The program then outputs the list forward and backward; the backward output is the reverse of the forward output exactly when every prev pointer is correct.' },
      { type: 'sim', key: 's:insert-at-the-beginning-3-steps', title: 'Insert at the beginning: three pointer assignments', concepts: ['l10.dll-insert'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [40], predict: ['link', 'var'] },
      { type: 'walk', key: 'w:dll-insert-beg', title: 'Implementation: insert at the beginning', impl: 'dll-insert-beg' },
      { type: 'exercise', key: 'e:dll-insert-both-directions', title: 'Insert at the beginning, updating both directions', templateId: 'l10-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'walk', key: 'w:dll-insert-end', title: 'Implementation: insert at the end', impl: 'dll-insert-end' },
      { type: 'sim', key: 's:insert-at-an-intermediate-position-4-links', title: 'Insert at an intermediate position: four links', struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertMid', args: [40, 2], predict: ['link'] },
      { type: 'walk', key: 'w:dll-insert-pos', title: 'Implementation: insert at an intermediate position', impl: 'dll-insert-pos' },
      { type: 'exercise', key: 'e:insert-in-the-middle', title: 'Insert at an intermediate position', templateId: 'l10-rewire-insert', params: { kind: 'mid' }, guidance: 'full' },
      { type: 'exercise', key: 'e:which-orders-are-valid', title: 'Which orders are valid?', templateId: 'l10-order', guidance: 'less' },
      { type: 'sim', key: 's:delete-at-an-intermediate-position', title: 'Delete at an intermediate position', concepts: ['l10.dll-delete'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'deleteMid', args: [2], predict: ['link', 'free'] },
      { type: 'walk', key: 'w:dll-delete-pos', title: 'Implementation: delete at an intermediate position', impl: 'dll-delete-pos' },
      {
        type: 'note',
        key: 'n:dll-single-node-deletion',
        variant: 'technical',
        title: 'Single-node lists in delete_at_beginning and delete_at_end',
        body: `**delete_at_beginning:** after \`head = temp->next\`, head is NULL when the only node was removed, so an unconditional \`head->prev = NULL\` dereferences NULL. The correct version tests first: \`if (head != NULL) head->prev = NULL;\`.

**delete_at_end:** \`temp->prev->next = NULL\` dereferences NULL when temp is the only node (temp->prev is NULL). The correct version tests \`if (temp->prev == NULL) head = NULL;\` first.`,
      },
      { type: 'sim', key: 's:the-crash-simulated', title: 'The NULL dereference, simulated', struct: 'dll', setup: { values: [7] }, op: 'deleteBegIncorrect', body: 'The version without the test, applied to a single-node list.' },
      { type: 'walk', key: 'w:dll-delete-beg', title: 'Implementation: delete at the beginning', impl: 'dll-delete-beg', body: 'head.prev = NULL is executed only when a node remains. The single-node case completes without a NULL dereference.' },
      { type: 'walk', key: 'w:dll-delete-end', title: 'Implementation: delete at the end', impl: 'dll-delete-end' },
      { type: 'exercise', key: 'e:delete-both-directions', title: 'Delete, updating both directions', templateId: 'l10-rewire-delete', guidance: 'full' },
      { type: 'sim', key: 's:verify-forward', title: 'Verify the forward direction', concepts: ['l10.dll-traverse'], struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseFwd', predict: ['output'] },
      { type: 'sim', key: 's:and-backward', title: 'Verify the backward direction', extension: true, struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseBwd', predict: ['output'] },
      { type: 'exercise', key: 'e:repair-the-backward-links', title: 'Forward traversal is correct, backward traversal is not: repair the links', templateId: 'l10-repair-back', guidance: 'full' },
      { type: 'exercise', key: 'e:predict-a-traversal', title: 'Predict a traversal', templateId: 'l10-traverse-both', guidance: 'less' },
      {
        type: 'note',
        variant: 'prereq',
        key: 'n:before-you-start-recursion',
        title: 'Prerequisites: recursion',
        body: `A **recursive** function calls itself on a smaller part of the problem. Two parts are always needed:
- a **base case** that is answered directly (an empty list: \`p == NULL\` gives 0 nodes);
- a **recursive case** that reduces the problem (1 for this node plus the count of the rest: \`count_nodes(p->next)\`).

Every call receives its own **frame** with its own copy of the parameters, pushed onto the **call stack**; when a call returns, its frame is removed and the caller continues where it stopped. Without a reachable base case the calls never stop (in C++ the stack overflows; Python raises \`RecursionError\`; the pseudocode stops at its step limit). Recursion is also the basis of the tree traversals and of depth-first search in later modules.`,
      },
      { type: 'sim', key: 's:recursive-count-nodes', title: 'Recursive count_nodes()', concepts: ['l10.countnode'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'count_nodes', body: 'The call stack grows to n + 1 frames, and each return adds 1 as the calls complete.' },
      { type: 'walk', key: 'w:dll-countnode', title: 'Implementation: recursive count_nodes()', impl: 'dll-countnode', body: 'The Variables panel shows one frame per active call, each with its own p.' },
      { type: 'exercise', key: 'e:recursion-questions', title: 'Recursion questions', templateId: 'l10-countnode', guidance: 'less' },
      { type: 'exercise', key: 'e:complete-the-code', title: 'Complete the recursive function', templateId: 'l10-fill', guidance: 'less' },
      {
        type: 'read',
        key: 'r:what-the-extra-link-buys',
        title: 'What the extra link makes possible',
        body: `- **Delete a node that is already referenced** without searching for its predecessor: the previous node is \`temp->prev\`.
- **Traverse backward** from the last node to the first by following prev pointers.
- **The cost:** every node stores one more pointer, and every insertion or deletion updates twice as many links; omitting one of them leaves the list broken in one direction (see the backward-traversal repair exercise).`,
      },
      {
        type: 'note',
        variant: 'pitfalls',
        key: 'n:dll-pitfalls',
        title: 'Doubly linked lists: common errors and edge cases',
        body: `- **Updating only one direction.** Every insertion and deletion changes links in BOTH directions; omitting a prev update leaves forward traversal correct and backward traversal incorrect.
- **Dereferencing a NULL neighbor.** The first node has no previous node and the last node has no next node: \`temp->prev->next\` dereferences NULL when temp is the first node, and \`temp->next->prev\` when it is the last.
- **Single-node lists** in delete at the beginning and delete at the end (see the technical note above).
- **Empty list** for insertion: there is no former first node whose prev pointer must change.
- **Order of updates.** Read the links of the old neighbor before overwriting them; save a pointer if necessary.
- **Recursion without a base case** (count_nodes): every call must eventually reach \`p == NULL\`.`,
      },
      { type: 'exercise', key: 'e:predict-a-doubly-linked-program', title: 'Predict the output of a doubly linked list program', templateId: 'l10-predict-output', params: { impl: 'dll-insert-pos' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-back-link', title: 'Complete the missing link', templateId: 'l10-complete-code', params: { impl: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-insert-end', title: 'Write the pseudocode: insert at the end', templateId: 'l10-write-code', params: { lab: 'dll-insert-end' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-dll-delete-first', title: 'Write the pseudocode: delete the first node', templateId: 'l10-write-code', params: { lab: 'dll-delete-first' }, guidance: 'none' },
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
        body: `A **stack** inserts and deletes at ONE end, the **top**: last in, first out (LIFO). Its operations are **push**, **pop** and **peek** (read the top item without removing it).

A **queue** inserts at the **rear** and deletes at the **front**: first in, first out (FIFO). Its operations are **enqueue**, **dequeue** and **front** (read the front item without removing it). Queues are the subject of the next module.

**Organization.** Both are lists with a restriction on where items may enter and leave, so both can be stored in an **array** (with index variables) or as **linked nodes** (with pointer variables). **Overflow** is an attempt to push or enqueue when no space is left; **underflow** is an attempt to pop or dequeue when there is nothing to remove.

**Uses.** A stack suits work that must be completed in reverse order: undoing the most recent action first, the call stack of a running program (recursion), and the explicit stack of an iterative inorder traversal or depth-first search. A queue suits work served in order of arrival, such as print jobs and the vertices waiting in breadth-first search.`,
      },
      { type: 'exercise', key: 'e:same-input-stack-and-queue', title: 'The same input in a stack and in a queue', templateId: 'l12-removal-order', guidance: 'full' },
      {
        type: 'note',
        key: 'n:exactly-what-top-f-and-r-mean',
        variant: 'terms',
        title: 'The meaning of top in each stack implementation',
        body: `| Implementation | Variable | Meaning | Empty | Full |
|---|---|---|---|---|
| Array stack, count convention | top | index of the next FREE position = number of items (starts at 0) | top == 0 | top == MAX |
| Array stack, index convention | top | index of the TOP item (starts at −1) | top == −1 | top == MAX − 1 |
| Linked stack, top at the head | top | pointer to the first node | top == NULL | only if allocation fails |
| Linked stack, top at the tail | top | pointer to the LAST node; head is the bottom | top == NULL | only if allocation fails |`,
      },
      {
        type: 'code',
        key: 'c:array-stack-in-every-language',
        title: 'An array stack in every language',
        concepts: ['l12.array-stack'],
        body: 'This implementation uses the count convention: top is the number of items, which is also the index of the next free position. pop returns −1 when the stack is empty (the program’s representation of “no value”).',
        c: `#define MAX 6
int stack[MAX];
int top = 0;                  /* next free position */

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
int top = 0;                  // next free position = number of items

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
top = 0                       # next free position = number of items

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
top = 0                       # next free position = number of items

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
      { type: 'walk', key: 'w:stack-array', title: 'Implementation: an array stack', impl: 'stack-array', body: 'Pushes until overflow, then pops until underflow. A popped value remains in its array position but is no longer part of the stack.' },
      { type: 'exercise', key: 'e:track-top', title: 'Track top', templateId: 'l12-astack-top', guidance: 'full' },
      { type: 'sim', key: 's:linked-stack-top-at-the-tail', title: 'Linked stack with the top at the tail', concepts: ['l12.linked-stack'], struct: 'lstack-tail', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'During pop, temp must traverse from head to the node BELOW top, because a node only refers to the node after it.' },
      { type: 'walk', key: 'w:stack-linked-end', title: 'Implementation: a linked stack with the top at the tail', impl: 'stack-linked-end' },
      { type: 'sim', key: 's:linked-stack-at-the-head', title: 'Linked stack with the top at the head', struct: 'lstack-head', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'The same operations with the top at the head: push and pop change only the first node, so no traversal is needed.' },
      { type: 'walk', key: 'w:stack-linked', title: 'Implementation: a linked stack with the top at the head', impl: 'stack-linked', body: 'push is insertion at the beginning and pop is deletion at the beginning of a singly linked list. The output equals that of the tail version, without any traversal.' },
      { type: 'exercise', key: 'e:push-pop-by-rewiring', title: 'Push and pop by pointer assignment', templateId: 'l12-rewire-stack', guidance: 'full' },
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
      { type: 'exercise', key: 'e:write-array-stack', title: 'Write the pseudocode: push and pop for an array stack', templateId: 'l12-write-code', params: { lab: 'astack-push-pop' }, guidance: 'less' },
    ],
  },
  // ===================================================================== queue
  {
    id: 'queue',
    sections: [
      {
        type: 'read',
        key: 'r:queues-first-in-first-out',
        title: 'Queues: first in, first out',
        concepts: ['l12.lifo-fifo'],
        body: `A **queue** inserts items at one end, the **rear**, and removes them at the other end, the **front**: the first item inserted is the first item removed (FIFO). Its operations are **enqueue** (insert at the rear), **dequeue** (remove at the front) and **front** (read the front item without removing it).

**Organization.** Like a stack, a queue can be stored in an **array**, with two index variables, or as **linked nodes**, with two pointer variables. **Overflow** is an attempt to enqueue when no space is left; **underflow** is an attempt to dequeue from an empty queue.

**Uses.** A queue suits work served in order of arrival: print jobs, requests waiting for a server, and the vertices waiting to be processed in breadth-first search.`,
      },
      {
        type: 'note',
        key: 'n:what-front-and-rear-mean',
        variant: 'terms',
        title: 'The meaning of front and rear in each queue implementation',
        body: `| Implementation | Variables | Meaning | Empty | Full |
|---|---|---|---|---|
| Linear array queue | front, rear | front = index of the front item, rear = index of the next free position | front == rear | rear == MAX |
| Circular array queue | front, rear, count | indices advance modulo MAX; count = number of items | count == 0 | count == MAX |
| Linked queue | front, rear | pointers to the first and the LAST node | front == NULL | only if allocation fails |`,
      },
      { type: 'sim', key: 's:linear-array-queue-wasted-slots', title: 'Linear array queue: unusable positions', concepts: ['l12.array-queue'], struct: 'aqueue', setup: { MAX: 4 }, ops: [{ op: 'enqueue', x: 11 }, { op: 'enqueue', x: 22 }, { op: 'dequeue' }, { op: 'enqueue', x: 33 }, { op: 'enqueue', x: 44 }, { op: 'enqueue', x: 55 }] , predict: ['write', 'read'], body: 'The last enqueue fails although position 0 is free: front and rear only move forward.' },
      { type: 'walk', key: 'w:queue-array', title: 'Implementation: a linear array queue', impl: 'queue-array' },
      { type: 'note', key: 'n:circular-array-queue', variant: 'extension', title: 'Circular array queue', extension: true, body: 'Advance the indices with `rear = (rear + 1) % MAX` and `front = (front + 1) % MAX`, and keep a `count` of the items (or leave one position unused) to distinguish a full queue from an empty one. Positions released by dequeue are then reused. The circular mode can be selected for the array queue in Interactive Visualizations.' },
      { type: 'exercise', key: 'e:track-f-and-r', title: 'Track front and rear', templateId: 'l12-aqueue-fr', guidance: 'less' },
      { type: 'exercise', key: 'e:which-operations-fail', title: 'Which operations fail?', templateId: 'l12-fails', guidance: 'less' },
      { type: 'sim', key: 's:linked-queue-removing-the-final-item', title: 'Linked queue: removing the final item', concepts: ['l12.linked-queue'], struct: 'lqueue', ops: [{ op: 'enqueue', x: 10 }, { op: 'enqueue', x: 20 }, { op: 'dequeue' }, { op: 'dequeue' }] , predict: ['var'], body: 'When the last item is removed, rear must also become NULL.' },
      { type: 'walk', key: 'w:queue-linked', title: 'Implementation: a linked queue', impl: 'queue-linked', body: 'Two starting situations. In each one the final dequeue empties the queue, and rear becomes NULL together with front.' },
      { type: 'exercise', key: 'e:enqueue-dequeue-by-rewiring', title: 'Enqueue and dequeue by pointer assignment', templateId: 'l12-rewire-queue', params: { op: 'dequeue', n: 1 }, guidance: 'full' },
      { type: 'exercise', key: 'e:variation', title: 'Enqueue and dequeue on a new queue', templateId: 'l12-rewire-queue', guidance: 'less' },
      { type: 'exercise', key: 'e:what-exactly-does-it-mean', title: 'Interpret top, front and rear', templateId: 'l12-meaning', guidance: 'less' },
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
      { type: 'exercise', key: 'e:write-array-queue', title: 'Write the pseudocode: enqueue and dequeue for an array queue', templateId: 'l12-write-code', params: { lab: 'aqueue-enqueue-dequeue' }, guidance: 'none' },
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
        body: `A **tree** has one **root**; every other node has **exactly one** incoming link, from its **parent**. Links leaving a node lead to its **children**; nodes without children are **leaves** and the others are **internal nodes**.

- **path**: n₁, n₂, …, nₖ where each nᵢ is the parent of nᵢ₊₁
- **siblings**: children of the same parent
- **ancestor and descendant**: A is an ancestor of B (and B a descendant of A) if there is a path from A down to B
- **subtree**: a node together with all its descendants

In a **binary tree** each node has at most two children, called the **left** and the **right** child (the order matters).

**Purpose and uses.** Lists are linear: each item has one successor. A tree represents a **hierarchy**, in which one item can lead to several others, such as folders inside folders, or the chapters, sections and subsections of a document. In code, a binary tree node is a list node with TWO links, \`left\` and \`right\`; the whole tree is reached through the pointer \`root\` (NULL for an empty tree).`,
      },
      {
        type: 'code',
        key: 'c:a-binary-tree-node',
        title: 'A binary tree node in every language',
        body: 'Three fields: the value and the addresses of the two children. A new node has no children (both links are NULL); it is a leaf until children are attached.',
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
        pseudo: `# Tree nodes have the fields data, left and right; new Node(v) sets both links to NULL.
root = NULL                   # empty tree

function create_node(value)
    new_node = new Node(value)
    return new_node
end function`,
      },
      { type: 'walk', key: 'w:tree-create', title: 'Implementation: create a binary tree', impl: 'tree-create' },
      { type: 'exercise', key: 'e:select-relationships', title: 'Identify tree relationships', templateId: 'l13-relations', guidance: 'full' },
      {
        type: 'read',
        key: 'r:level-height-depth',
        title: 'Level, height and depth',
        concepts: ['l13.tree-measures'],
        body: `- **level** of a node: its distance in edges from the root; the root is at level 0.
- **depth** of a node: the number of edges on the path from the root to the node, equal to its level; the root has depth 0.
- **height** of the tree: the maximum level. A single node has height 0.`,
      },
      {
        type: 'note',
        key: 'n:height-and-depth-conventions',
        variant: 'technical',
        title: 'Height and depth conventions',
        body: `This module counts **edges**: depth = level, the root has depth 0, and the height of a single node is 0. Some references count **nodes** on the path instead, which gives values one greater (the root then has depth 1), and define the height of an empty tree as −1 or 0. The formulas below use the edge-based height. Always confirm which convention a problem uses before answering.`,
      },
      { type: 'exercise', key: 'e:measure-the-tree', title: 'Measure the tree', templateId: 'l13-measures', guidance: 'full' },
      { type: 'demo', key: 'd:node-count-formulas-visually', title: 'Node-count formulas, visually', kind: 'formulas', body: 'Adjust the height h: the perfect binary tree of height h has 2^l nodes on level l, 2^h leaves and 2^(h+1) − 1 nodes. Any tree with n nodes has n − 1 edges.' },
      { type: 'note', key: 'n:n-1-edges-holds-for-every-tree', variant: 'technical', title: 'Every tree with n nodes has n − 1 edges', body: 'The edge count n − 1 is often stated for complete or perfect binary trees, but it holds for every tree with n ≥ 1 nodes: every node except the root has exactly one incoming edge.' },
      { type: 'exercise', key: 'e:use-the-formulas', title: 'Apply the node-count formulas', templateId: 'l13-formulas', guidance: 'less' },
      {
        type: 'read',
        key: 'r:strictly-binary-full-complete',
        title: 'Full, perfect and complete binary trees',
        concepts: ['l13.tree-classify'],
        body: `- **Full binary tree** (also called strictly binary or proper): every node has either 0 or 2 children.
- **Perfect binary tree**: every internal node has 2 children and all leaves are on the same level h.
- **Complete binary tree**: the n nodes occupy positions 1 … n of the level-order numbering; every level is filled except possibly the last, which is filled from the left.

Every perfect tree is both full and complete; a complete tree need not be full.`,
      },
      {
        type: 'note',
        key: 'n:full-and-perfect-are-named-differently-in-differ',
        variant: 'terms',
        title: 'Alternative names for tree shapes',
        body: `| Shape | Name used here | Other names in use |
|---|---|---|
| every node has 0 or 2 children | **full** | strictly binary, proper |
| 0 or 2 children AND all leaves on the last level | **perfect** | full (in some references) |
| filled level by level, left to right | **complete** | almost complete |

Because some references use “full” for the perfect shape, always read the definition a problem states.`,
      },
      { type: 'exercise', key: 'e:classify-trees', title: 'Classify trees', templateId: 'l13-classify', guidance: 'full' },
      { type: 'demo', key: 'd:array-positions-vs-linked-child-pointers', title: 'Array positions and linked child pointers', kind: 'treeRepr', concepts: ['l13.tree-repr'], body: 'Select a node to see its array index (0-based and 1-based) next to its linked node with left and right addresses. Gaps in an incomplete tree leave array positions unused.' },
      { type: 'exercise', key: 'e:array-index-arithmetic', title: 'Array index arithmetic', templateId: 'l13-array-index', guidance: 'full' },
      { type: 'walk', key: 'w:tree-array', title: 'Implementation: a binary tree stored in an array', impl: 'tree-array', body: 'No pointers are used: the position of a value in the array determines its position in the tree. The starting situations include the root (no parent) and a leaf (no children).' },
      { type: 'exercise', key: 'e:build-a-tree-from-its-array', title: 'Build a tree from its array', templateId: 'l13-build-tree', guidance: 'less' },
      { type: 'demo', key: 'd:build-your-own-binary-tree', title: 'Build a binary tree', kind: 'treeBuilder', body: 'Add and remove nodes; the height, levels, classification and both representations update immediately. The binary search tree mode is an extension: this module covers general binary trees, in which values are NOT ordered.' },
      { type: 'exercise', key: 'e:predict-a-tree-or-graph-program', title: 'Predict the output of a tree program', templateId: 'l13-predict-output', params: { module: 'tree', impl: 'tree-array' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-tree-or-graph-code', title: 'Complete a tree operation', templateId: 'l13-complete-code', params: { module: 'tree' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-build-a-tree', title: 'Write the pseudocode: build part of a tree', templateId: 'l13-write-code', params: { lab: 'tree-build' }, guidance: 'less' },
      {
        part: 'Tree traversals',
        type: 'read',
        key: 'r:three-depth-first-orders-for-binary-trees',
        title: 'Three depth-first orders for binary trees',
        concepts: ['l14.tree-traversal'],
        body: `- **Preorder**: Root, Left, Right
- **Inorder**: Left, Root, Right
- **Postorder**: Left, Right, Root

All three traversals ENTER the nodes in the same order; they differ only in **when** a node is OUTPUT. In the traversal diagrams, an asterisk (*) above a letter marks the root of each subtree at the moment it is output.`,
      },
      { type: 'sim', key: 's:preorder-on-the-example-tree', title: 'Preorder on the example tree: entered and output', struct: 'tree', tree: 'example', op: 'preorder', predict: ['output'] },
      { type: 'exercise', key: 'e:select-the-preorder-sequence', title: 'Select the preorder sequence', templateId: 'l14-tree-order', params: { order: 'preorder', exampleTree: true }, guidance: 'full' },
      { type: 'sim', key: 's:inorder', title: 'Inorder', struct: 'tree', tree: 'example', op: 'inorder', predict: ['output'] },
      { type: 'exercise', key: 'e:select-the-inorder-sequence', title: 'Select the inorder sequence', templateId: 'l14-tree-order', params: { order: 'inorder', exampleTree: true }, guidance: 'full' },
      { type: 'sim', key: 's:postorder', title: 'Postorder', struct: 'tree', tree: 'example', op: 'postorder', predict: ['output'] },
      { type: 'exercise', key: 'e:select-the-postorder-sequence', title: 'Select the postorder sequence', templateId: 'l14-tree-order', params: { order: 'postorder', exampleTree: true }, guidance: 'full' },
      { type: 'walk', key: 'w:tree-traversals', title: 'Implementation: the three recursive traversals', impl: 'tree-traversals', body: 'Select an order: only the position of the output statement differs. The Variables panel shows one frame per active call, so the depth of the recursion is visible at every step. The “Empty tree” case shows the base case alone.' },
      { type: 'sim', key: 's:inorder-with-an-explicit-stack', title: 'Inorder traversal with an explicit stack', struct: 'tree', tree: 'example', op: 'inorderStack', predict: ['push', 'pop'] },
      { type: 'walk', key: 'w:tree-inorder-stack', title: 'Implementation: inorder traversal with an explicit stack', impl: 'tree-inorder-stack', body: 'The stack is an array stack that holds node addresses. Follow the stack contents at each step: a node is pushed when it is entered and output when it is popped.' },
      { type: 'exercise', key: 'e:stack-contents', title: 'Stack contents', templateId: 'l14-inorder-stack', params: { exampleTree: true }, guidance: 'less' },
      { type: 'exercise', key: 'e:entered-vs-output-on-a-new-tree', title: 'Entered and output order on a new tree', templateId: 'l14-entered-output', guidance: 'less' },
      { type: 'demo', key: 'd:now-create-another-tree-and-traverse-it', title: 'Create a tree and traverse it', kind: 'treeBuilder', traverse: true, body: 'Build any binary tree, then execute a preorder, inorder or postorder traversal on it step by step.' },
      { type: 'exercise', key: 'e:variation-a-random-tree', title: 'Traverse a randomly generated tree', templateId: 'l14-tree-order', guidance: 'less' },
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
      { type: 'exercise', key: 'e:predict-a-traversal-program', title: 'Predict the output of a traversal program', templateId: 'l14-predict-output', params: { impl: 'tree-traversals' }, guidance: 'full' },
      { type: 'exercise', key: 'e:complete-a-tree-traversal', title: 'Complete a tree traversal', templateId: 'l14-complete-code', params: { module: 'tree' }, guidance: 'less' },
      { type: 'exercise', key: 'e:write-inorder', title: 'Write the pseudocode: inorder traversal', templateId: 'l14-write-code', params: { lab: 'tree-inorder' }, guidance: 'less' },
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
        body: `A **graph** allows **more than one incoming link** and cycles. Edges may be **directed** (drawn as arrows) or **undirected**, and may carry **weights**.

- **Adjacency matrix**: a V × V table in which entry [u][v] is 1 (or the weight) if there is an edge u → v. An undirected graph has a symmetric matrix. In a weighted matrix, “no edge” is often written ∞ and the diagonal is 0. A **self-loop** is a 1 on the diagonal. The matrix has an entry for every pair of vertices, whether the edge exists or not.
- **Adjacency list**: for each vertex, a linked list of its neighbors. It stores only the edges that exist.

**Terminology.** The items are **vertices** and the links are **edges**. Two vertices joined by an edge are **adjacent** (neighbors); the **degree** of a vertex is its number of edges (in a directed graph, the out-degree and the in-degree). A **path** follows edges from vertex to vertex; a **cycle** is a path that returns to its starting vertex.

**Uses.** Graphs model networks in which any item may be connected to any other: road maps (vertices are places, weighted edges are distances), computer networks, and precedence relations between tasks. Choose the **adjacency matrix** when the graph is dense and the question “is there an edge u–v?” is frequent; choose **adjacency lists** when most vertices have few neighbors and algorithms mostly visit the neighbors of a vertex.`,
      },
      { type: 'demo', key: 'd:graph-editor-watch-the-matrix-and-list-update', title: 'Graph editor: adjacency matrix and adjacency list', kind: 'graphEditor', body: 'Add vertices and edges (directed or undirected, weighted or unweighted, self-loops allowed); the matrix and the lists update immediately. Several example graphs can be loaded as a starting point.' },
      { type: 'walk', key: 'w:graph-matrix', title: 'Implementation: an adjacency matrix', impl: 'graph-matrix', body: 'A two-dimensional array: an array of rows, each row an array. The diagram shows the matrix entries being set as the edges are added.' },
      { type: 'walk', key: 'w:graph-adjlist', title: 'Implementation: adjacency lists of linked nodes', impl: 'graph-adjlist', body: 'One linked list per vertex, built with insertion at the end of a singly linked list. The diagram draws every list head with its chain of nodes.' },
      { type: 'exercise', key: 'e:drawing-matrix', title: 'Drawing to adjacency matrix', templateId: 'l13-matrix', guidance: 'full' },
      { type: 'exercise', key: 'e:matrix-list', title: 'Adjacency matrix to adjacency list', templateId: 'l13-adjlist', guidance: 'less' },
      { type: 'exercise', key: 'e:list-drawing', title: 'Adjacency list to drawing', templateId: 'l13-draw', guidance: 'less' },
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
      { type: 'exercise', key: 'e:write-an-adjacency-matrix', title: 'Write the pseudocode: an adjacency matrix', templateId: 'l13-write-code', params: { lab: 'graph-matrix-build' }, guidance: 'none' },
      {
        part: 'Graph traversal',
        type: 'read',
        key: 'r:dfs-and-bfs-on-graphs',
        title: 'Depth-first and breadth-first search',
        concepts: ['l14.dfs', 'l14.bfs'],
        body: `**Depth-first search (DFS)** proceeds as deep as possible along each path, then **backtracks**. It uses a **stack**, usually the call stack of a recursive function.

**Breadth-first search (BFS)** visits all neighbors of a vertex before proceeding further, one distance level at a time. It uses a **queue**.

Both mark vertices as **visited (discovered)** so that cycles do not cause infinite loops. The traversal order depends on the **neighbor order**; in this module neighbors are always examined in ascending (alphabetical or numeric) order, which gives, from vertex a of the example graph, DFS a b c g d e f i h and BFS a b e f c d g i h.

Four quantities are tracked separately: the **discovered** vertices (seen), the **processed** vertices (all neighbors examined), the **frontier** (stack or queue), and the **output** order.

**In code.** “Discovered” is a set of vertices (\`Set\` in the pseudocode) or one true/false entry per vertex (\`bool visited[N]\` in C++, \`[False] * N\` in Python). BFS keeps its frontier in a **queue**; an array queue is sufficient, because every vertex enters it at most once. DFS uses **recursion**: the call stack holds the vertices whose neighbors are still being examined, and returning from a call is the backtracking step.`,
      },
      { type: 'sim', key: 's:dfs-from-a', title: 'DFS from vertex a of the example graph', struct: 'graph', graph: 'example', op: 'dfs', start: 'a', predict: ['discover'] },
      { type: 'walk', key: 'w:graph-dfs', title: 'Implementation: DFS with recursion', impl: 'graph-dfs', body: 'The pseudocode uses the built-in graph G; the C++ and Python versions build the same graph as an adjacency matrix and keep a visited array. All three versions output a b c g d e f i h from a.' },
      { type: 'exercise', key: 'e:click-the-dfs-order', title: 'Select the DFS order', templateId: 'l14-dfs-click', params: { example: true, start: 'a' }, guidance: 'full' },
      { type: 'sim', key: 's:bfs-from-a', title: 'BFS from vertex a', struct: 'graph', graph: 'example', op: 'bfs', start: 'a', predict: ['output'] },
      { type: 'walk', key: 'w:graph-bfs', title: 'Implementation: BFS with a queue', impl: 'graph-bfs', body: 'C++ and Python implement the queue as an array with front and rear indices. All three versions output a b e f c d g i h from a.' },
      { type: 'exercise', key: 'e:click-the-bfs-order', title: 'Select the BFS order', templateId: 'l14-bfs-click', params: { example: true, start: 'a' }, guidance: 'full' },
      {
        type: 'note',
        key: 'n:edge-numbers-are-discovery-order',
        variant: 'technical',
        title: 'Edge numbers in a traversal tree show discovery order, not distance',
        body: `When the edges of a DFS or BFS tree are numbered 1, 2, 3, …, the numbers give the order in which the edges were used. They are not distances: the BFS **distance** of e from a is 1 edge (a–e is a direct edge), and h is 3 edges away (a–e–g–h). BFS finds, for every reachable vertex, a path with the **fewest edges**.`,
      },
      { type: 'exercise', key: 'e:what-is-in-the-frontier', title: 'What is in the frontier?', templateId: 'l14-frontier', guidance: 'less' },
      { type: 'sim', key: 's:cycles-a-self-loop-and-a-disconnected-part', title: 'Cycles, a self-loop and a disconnected part', extension: true, concepts: ['l14.components'], struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', body: 'One BFS from A never reaches D, E, F or G.' },
      { type: 'sim', key: 's:traversing-the-whole-graph', title: 'Traversing the whole graph', extension: true, struct: 'graph', graph: 'disconnected', op: 'bfs', start: 'A', all: true, body: 'Restart from the next undiscovered vertex until every vertex is visited: one BFS per component.' },
      { type: 'exercise', key: 'e:component-or-whole-graph', title: 'Component or whole graph?', templateId: 'l14-components', guidance: 'less' },
      { type: 'note', key: 'n:bfs-minimises-edges-not-total-weight', variant: 'technical', title: 'BFS minimizes the number of edges, not the total weight', body: 'On the weighted example graph, BFS from A reaches D via A–B–D (2 edges, weight 3 + 4 = 7), but A–B–C–D has weight 3 + 2 + 1 = 6. BFS ignores weights; minimum-weight paths require Dijkstra’s algorithm, which is beyond the scope of this module.' },
      { type: 'exercise', key: 'e:bfs-on-a-weighted-graph', title: 'BFS on a weighted graph', templateId: 'l14-bfs-weight', guidance: 'less' },
      { type: 'exercise', key: 'e:variation-bfs-on-a-new-graph', title: 'BFS on a new graph', templateId: 'l14-bfs-click', guidance: 'none' },
      { type: 'exercise', key: 'e:variation-dfs-on-a-new-graph', title: 'DFS on a new graph', templateId: 'l14-dfs-click', guidance: 'none' },
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
      { type: 'exercise', key: 'e:write-bfs', title: 'Write the pseudocode: breadth-first search', templateId: 'l14-write-code', params: { lab: 'graph-bfs' }, guidance: 'none' },
    ],
  },
];

for (const l of LESSONS) {
  const m = MODULES.find((x) => x.id === l.id);
  l.n = m.n;
  l.title = m.title;
}

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
