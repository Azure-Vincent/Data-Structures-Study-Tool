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
        pseudo: `p ← allocate space for 100 integers
use p
release p
p ← NULL`,
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
        body: `| Operation | Array | Singly linked list |
|---|---|---|
| Read element *k* | Θ(1): base + k·size | Θ(k): follow k − 1 links |
| Insert at the front | Θ(n): shift everything right | Θ(1): two pointer writes |
| Delete at a known spot | Θ(n): shift left | Θ(1) once the previous node is known |
| Memory per element | just the value | value + one pointer |
| Size | fixed when declared | grows and shrinks at run time |

Linked lists also make searching slower (no jumping to the middle), as the notes say on p.3.`,
      },
      {
        type: 'note',
        variant: 'correction',
        title: '“Deleting from an array is not possible” — what it really means',
        ref: 'Lec 07 p.2 (c), p.4 ⑥',
        body: `You **can** delete an element from an array: shift every later element one slot left and decrease a separate count of used slots. What a plain array cannot do is **shrink (or grow) its allocated size** — the capacity stays fixed. Deletion is possible; *resizing* is not.`,
      },
      { type: 'exercise', title: 'Count the shifts', templateId: 'l07-shifts', guidance: 'full' },
      { type: 'exercise', title: 'Spot the memory bug', templateId: 'l07-membug', guidance: 'full' },
      { type: 'exercise', title: 'Variation: choose a structure', templateId: 'l07-choose', guidance: 'less' },
      { type: 'exercise', title: 'Variation: linear or non-linear?', templateId: 'l07-classify', guidance: 'less' },
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

Keep two numbers apart: a node’s **value** (e.g. 10) and its **address** (e.g. 100). Pointers only ever hold addresses.`,
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
        pseudo: `getnode(value):
    n ← allocate a node
    n.data ← value
    n.next ← NULL
    return n`,
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
        body: `The steps on p.2 (c-1, c-2) describe adding each new node at the **front** (newnode->next = start; start = newnode). The code on p.3 adds at the **end** (walk temp to the last node; temp->next = newnode). Both build a list, but in opposite orders: entering 10, 20, 30 gives 30 → 20 → 10 with the p.2 steps and 10 → 20 → 30 with the p.3 code. The appending version also walks the whole list for every node: Θ(n²) moves in total — keeping a pointer to the last node makes it Θ(n).`,
      },
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
          { label: 'Buggy', lines: ['newnode = getnode();', 'prev->next = newnode;', 'newnode->next = prev->next;'], setup: { values: [10, 20, 30], vars: { prev: 1 } }, newValue: 15 },
          { label: 'Fixed (save temp)', lines: ['newnode = getnode();', 'temp = prev->next;', 'prev->next = newnode;', 'newnode->next = temp;'], setup: { values: [10, 20, 30], vars: { prev: 1 } }, newValue: 15 },
          { label: 'Fixed (reorder)', lines: ['newnode = getnode();', 'newnode->next = prev->next;', 'prev->next = newnode;'], setup: { values: [10, 20, 30], vars: { prev: 1 } }, newValue: 15 },
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
      { type: 'exercise', title: 'Variation: arrange the steps', templateId: 'l08-order-insert', guidance: 'less' },
      { type: 'exercise', title: 'Variation: complete the code', templateId: 'l08-fill', guidance: 'less' },
      { type: 'exercise', title: 'Find the bug', templateId: 'l08-bug', guidance: 'less' },
      {
        type: 'read',
        title: 'Cost: finding the position vs changing links',
        ref: 'Supplementary (applies Lec 08 p.4–7)',
        concepts: ['cx.list-costs'],
        body: `Every insertion has two parts:
1. **Finding the position** — walking temp/prev. Cost depends on where: 0 moves at the front, *n − 1* at the end, *pos − 1* in the middle.
2. **Changing links** — always a constant number of pointer writes (2 for a singly linked list).

**Assumption** for all counts here: one unit per \`temp = temp->next\` (pointer move); the list has *n* nodes and only a start pointer. So insert at the front is Θ(1), insert at the end is Θ(n), and building a list by repeated appends (creatlist) is Θ(n²). With a tail pointer, insert at the end becomes Θ(1).

Big-O gives an upper bound (O), Θ a tight bound (both upper and lower), Ω a lower bound: insert-at-end is Ω(n) here because it *must* walk past every node.`,
      },
      { type: 'exercise', title: 'Count the pointer moves', templateId: 'l08-cost', guidance: 'less' },
      { type: 'exercise', title: 'Predict the final list', templateId: 'l08-predict-state', guidance: 'none' },
      {
        type: 'pseudo',
        title: 'Write your own pseudocode: insert at the end',
        concepts: ['l08.insert-end'],
        prompt: 'In your own words (pseudocode, not C), write insert_at_end(value) including the empty-list case.',
        model: `insert_at_end(value):
    new ← getnode(value)            // new.next = NULL
    if start = NULL:
        start ← new
    else:
        t ← start
        while t.next ≠ NULL:
            t ← t.next              // stop ON the last node
        t.next ← new`,
      },
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

If the list is empty, report it and do nothing (underflow).`,
      },
      { type: 'sim', title: 'delete_at_beg()', ref: 'Lec 09 p.1', struct: 'sll', setup: { values: [10, 20, 30] }, op: 'deleteBeg', predict: ['var', 'free'], body: 'Allocation, relinking and deallocation each get their own step.' },
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
      {
        type: 'codesim',
        title: 'Freeing too early',
        ref: 'Lec 09 p.4',
        body: 'Same goal — remove node 2 (prev is on node 1, temp on node 2). The buggy version frees temp before reading temp->next.',
        variants: [
          { label: 'Buggy', lines: ['free(temp);', 'prev->next = temp->next;'], setup: { values: [10, 20, 30], vars: { prev: 1, temp: 2 } } },
          { label: 'Correct', lines: ['prev->next = temp->next;', 'free(temp);'], setup: { values: [10, 20, 30], vars: { prev: 1, temp: 2 } } },
        ],
      },
      { type: 'sim', title: 'traverse()', ref: 'Lec 09 p.5', concepts: ['l09.traverse'], struct: 'sll', setup: { values: [10, 15, 30] }, op: 'traverse', predict: ['output'], body: 'temp, not start, moves — so the list is still intact afterwards.' },
      { type: 'exercise', title: 'Variation: delete anywhere', templateId: 'l09-rewire-delete', guidance: 'less' },
      { type: 'exercise', title: 'Arrange the deletion steps', templateId: 'l09-order-delete', guidance: 'less' },
      { type: 'exercise', title: 'Find the deletion bug', templateId: 'l09-bug', guidance: 'less' },
      { type: 'exercise', title: 'Which positions are valid?', templateId: 'l09-valid-pos', guidance: 'less' },
      {
        type: 'read',
        title: 'Head only vs head + tail',
        ref: 'Supplementary (complexity)',
        concepts: ['cx.tail-pointer'],
        body: `Counting model: one unit per pointer move; *n* nodes.

| Operation | start only | start + tail |
|---|---|---|
| insert at front | Θ(1) | Θ(1) |
| insert at end | Θ(n) | **Θ(1)** |
| delete at front | Θ(1) | Θ(1) |
| delete at end | Θ(n) | **still Θ(n)** |

Why doesn’t tail help delete-at-end? After removing the last node, the node **before** it must get next = NULL and become the new tail. A singly linked node has no backward link, so that node can only be found by walking from start. (A doubly linked list with a tail pointer can do it in Θ(1).)`,
      },
      { type: 'sim', title: 'Deleting the tail even though tail is known', ref: 'Supplementary', struct: 'sll', setup: { values: [10, 20, 30, 40, 50] }, op: 'deleteEndTail' },
      { type: 'exercise', title: 'Count the work', templateId: 'l09-tail-cost', guidance: 'less' },
      { type: 'exercise', title: 'Predict traverse() after deletions', templateId: 'l09-traverse-predict', guidance: 'none' },
      {
        type: 'pseudo',
        title: 'Write your own pseudocode: delete the node at position pos',
        prompt: 'Handle: empty list, pos = 1, last position, invalid positions. Free the removed node.',
        model: `delete_at(pos):
    if start = NULL: report "empty"; return
    if pos = 1:
        t ← start; start ← start.next; free(t); return
    p ← start; i ← 1
    while i < pos − 1 and p.next ≠ NULL:
        p ← p.next; i ← i + 1
    if p.next = NULL: report "invalid position"; return
    t ← p.next              // node to remove
    p.next ← t.next         // relink first …
    free(t)                 // … then free`,
      },
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

The invariant: for every pair of neighbours A, B: \`A->right == B\` **and** \`B->left == A\`. The first node’s left and the last node’s right are NULL. Every operation must keep both directions true.`,
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
        pseudo: `getnode(v): n ← new node; n.left ← NULL; n.data ← v; n.right ← NULL; return n`,
      },
      { type: 'sim', title: 'Insert at the beginning: 3 steps', ref: 'Lec 10 p.3', concepts: ['l10.dll-insert'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [40], predict: ['link', 'var'] },
      { type: 'exercise', title: 'Your turn (both directions!)', templateId: 'l10-rewire-insert', params: { kind: 'beg' }, guidance: 'full' },
      { type: 'sim', title: 'Insert at an intermediate position: 4 links', ref: 'Lec 10 p.4', struct: 'dll', setup: { values: [10, 20, 30] }, op: 'insertMid', args: [40, 2], predict: ['link'] },
      { type: 'exercise', title: 'Insert in the middle', templateId: 'l10-rewire-insert', params: { kind: 'mid' }, guidance: 'full' },
      { type: 'exercise', title: 'Which orders are valid?', templateId: 'l10-order', guidance: 'less' },
      { type: 'sim', title: 'Delete at an intermediate position', ref: 'Lec 10 p.6', concepts: ['l10.dll-delete'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'deleteMid', args: [2], predict: ['link', 'free'] },
      {
        type: 'note',
        variant: 'correction',
        title: 'One-node lists in delete_at_beg / delete_at_end',
        ref: 'Lec 10 p.5',
        body: `**delete_at_beg:** after \`start = temp->right\`, start is NULL when the only node was removed, so \`start->left = NULL\` dereferences NULL and crashes. Guard it: \`if (start != NULL) start->left = NULL;\`.

**delete_at_end:** \`temp->left->right = NULL\` crashes when temp is the only node (temp->left is NULL). Check \`if (temp->left == NULL) start = NULL;\` first.`,
      },
      { type: 'sim', title: 'The crash, simulated', ref: 'Lec 10 p.5', struct: 'dll', setup: { values: [7] }, op: 'deleteBegNotes' },
      { type: 'exercise', title: 'Delete, both directions', templateId: 'l10-rewire-delete', guidance: 'full' },
      { type: 'sim', title: 'Verify forward…', ref: 'Lec 10 p.7', concepts: ['l10.dll-traverse'], struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseFwd', predict: ['output'] },
      { type: 'sim', title: '…and backward', ref: 'Supplementary (uses left links)', struct: 'dll', setup: { values: [10, 40, 20, 30] }, op: 'traverseBwd', predict: ['output'] },
      { type: 'exercise', title: 'Required: forward looks right, backward is broken — repair it', templateId: 'l10-repair-back', guidance: 'full' },
      { type: 'exercise', title: 'Predict a traversal', templateId: 'l10-traverse-both', guidance: 'less' },
      { type: 'sim', title: 'Recursive countnode()', ref: 'Lec 10 p.7', concepts: ['l10.countnode'], struct: 'dll', setup: { values: [10, 20, 30] }, op: 'countnode', body: 'Watch the call stack grow to n + 1 frames and the returns add 1 on the way back.' },
      { type: 'exercise', title: 'Recursion questions', templateId: 'l10-countnode', guidance: 'less' },
      { type: 'exercise', title: 'Complete the code', templateId: 'l10-fill', guidance: 'less' },
      {
        type: 'read',
        title: 'What the extra link buys',
        ref: 'Supplementary (complexity)',
        body: `- Deleting a node you already point at: Θ(1) — its left neighbour is \`temp->left\`, no search for prev.
- Backward traversal: Θ(n) without needing a stack.
- Cost: one more pointer per node (more memory) and twice as many link writes per insert/delete.
- With a tail pointer, delete-at-end is Θ(1) (tail->left is the new tail) — unlike the singly linked list.
- Recursive countnode is Θ(n) time and Θ(n) call-stack space; a loop would use Θ(1) extra space.`,
      },
      {
        type: 'pseudo',
        title: 'Write your own pseudocode: delete node t from a doubly linked list',
        prompt: 'Cover: t is the first node, the last node, the only node, or in the middle.',
        model: `delete(t):
    if t.left ≠ NULL: t.left.right ← t.right   else: start ← t.right
    if t.right ≠ NULL: t.right.left ← t.left
    free(t)`,
      },
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

Consequence: in a non-empty circle **no next field is NULL**, so every loop that waits for NULL runs forever.`,
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
      { type: 'sim', title: 'The right way: do-while, exactly one lap', ref: 'Lec 11 p.4', struct: 'csll', setup: { values: [10, 20, 30, 40] }, op: 'traverse', predict: ['output'] },
      { type: 'exercise', title: 'Click exactly one lap', templateId: 'l11-one-lap', guidance: 'full' },
      { type: 'exercise', title: 'Complete the stopping condition', templateId: 'l11-fill-dowhile', guidance: 'less' },
      { type: 'sim', title: 'Insert at the beginning: the last node must change too', ref: 'Lec 11 p.2', concepts: ['l11.csll-insert'], struct: 'csll', setup: { values: [10, 20, 30] }, op: 'insertBeg', args: [5], predict: ['link', 'var'] },
      { type: 'sim', title: 'Insert into an EMPTY circle', ref: 'Lec 11 p.2', concepts: ['l11.csll-edge'], struct: 'csll', setup: { values: [] }, op: 'insertBeg', args: [7], predict: ['link'] },
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
      { type: 'exercise', title: 'Required: delete the only node correctly', templateId: 'l11-rewire-delete', params: { single: true, kind: 'end' }, guidance: 'full' },
      { type: 'exercise', title: 'Variation: delete from a longer circle', templateId: 'l11-rewire-delete', params: { single: false }, guidance: 'less' },
      { type: 'exercise', title: 'Order the delete-at-beginning steps', templateId: 'l11-order-delbeg', guidance: 'less' },
      {
        type: 'read',
        title: 'Cost of the circle',
        ref: 'Supplementary (complexity)',
        concepts: ['cx.circular-costs'],
        body: `With only start, inserting or deleting at the FRONT of a circular list costs Θ(n): the last node’s next must be updated, and finding the last node means walking the whole circle. A common improvement keeps a pointer to the **last** node instead: then the first node is \`last->next\`, and both front and end insertion are Θ(1).`,
      },
      { type: 'exercise', title: 'Count the moves', templateId: 'l11-count', guidance: 'less' },
      { type: 'exercise', title: 'What happens with the NULL loop?', templateId: 'l11-null-loop', guidance: 'none' },
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

A **queue** inserts at the **rear** and deletes at the **front**: First In, First Out (FIFO). Operations: **enqueue** (InsertQ), **dequeue** (DeletQ), and **front** (read the front item).`,
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
        title: 'Array stack (notes) in C and C++',
        ref: 'Lec 12 p.2–4',
        concepts: ['l12.array-stack'],
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
        cpp: `#include <stdexcept>
class Stack {
    static const int MAX = 6;
    int a[MAX];
    int top = 0;              // number of items
public:
    void push(int x) { if (top == MAX) throw std::overflow_error("full"); a[top++] = x; }
    int pop()        { if (top == 0) throw std::underflow_error("empty"); return a[--top]; }
    int peek() const { if (top == 0) throw std::underflow_error("empty"); return a[top - 1]; }
    bool empty() const { return top == 0; }
};`,
        pseudo: `push(x): if top = MAX: overflow; else a[top] ← x; top ← top + 1
pop():   if top = 0: underflow; else top ← top − 1; return a[top]`,
      },
      { type: 'sim', title: 'Array stack: pushes until overflow, then pops until underflow', ref: 'Lec 12 p.1–3', struct: 'astack', setup: { MAX: 3 }, ops: [{ op: 'push', x: 11 }, { op: 'push', x: 22 }, { op: 'push', x: 33 }, { op: 'push', x: 44 }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }, { op: 'pop' }], predict: ['write', 'read'] },
      { type: 'exercise', title: 'Track top', templateId: 'l12-astack-top', guidance: 'full' },
      { type: 'sim', title: 'Linked stack, notes style: push/pop at the END', ref: 'Lec 12 p.4', concepts: ['l12.linked-stack'], struct: 'lstack-tail', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Count the moves in the pop: it must find the node below top.' },
      { type: 'sim', title: 'Linked stack at the HEAD', ref: 'Supplementary', struct: 'lstack-head', ops: [{ op: 'push', x: 10 }, { op: 'push', x: 20 }, { op: 'push', x: 30 }, { op: 'pop' }] , body: 'Same pushes and pop — no walking at all.' },
      { type: 'exercise', title: 'Which end is cheaper?', templateId: 'l12-ends-cost', guidance: 'full' },
      { type: 'exercise', title: 'Push/pop by rewiring', templateId: 'l12-rewire-stack', guidance: 'full' },
      { type: 'sim', title: 'Linear array queue: wasted slots', ref: 'Lec 12 p.5', concepts: ['l12.array-queue'], struct: 'aqueue', setup: { MAX: 4 }, ops: [{ op: 'enqueue', x: 11 }, { op: 'enqueue', x: 22 }, { op: 'dequeue' }, { op: 'enqueue', x: 33 }, { op: 'enqueue', x: 44 }, { op: 'enqueue', x: 55 }] , predict: ['write', 'read'], body: 'The last enqueue fails although slot 0 is free: F and R only move forward.' },
      { type: 'note', variant: 'supplementary', title: 'Circular array queue', ref: 'Supplementary (fixes Lec 12 p.5)', body: 'Advance indices with `R = (R + 1) % MAX` and `F = (F + 1) % MAX`, and keep a `count` (or leave one slot unused) to tell full from empty. Freed slots are then reused. Try mode “circular” in Explore.' },
      { type: 'exercise', title: 'Track F and R', templateId: 'l12-aqueue-fr', guidance: 'less' },
      { type: 'exercise', title: 'Which operations fail?', templateId: 'l12-fails', guidance: 'less' },
      { type: 'sim', title: 'Linked queue: removing the final item', ref: 'Lec 12 p.6', concepts: ['l12.linked-queue'], struct: 'lqueue', ops: [{ op: 'enqueue', x: 10 }, { op: 'enqueue', x: 20 }, { op: 'dequeue' }, { op: 'dequeue' }] , predict: ['var'], body: 'When the last item leaves, rear must also become NULL.' },
      { type: 'exercise', title: 'Enqueue / dequeue by rewiring', templateId: 'l12-rewire-queue', params: { op: 'dequeue', n: 1 }, guidance: 'full' },
      { type: 'exercise', title: 'Variation', templateId: 'l12-rewire-queue', guidance: 'less' },
      { type: 'exercise', title: 'What exactly does it mean?', templateId: 'l12-meaning', guidance: 'less' },
      { type: 'exercise', title: 'Stack or queue?', templateId: 'l12-choose', guidance: 'none' },
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

In a **binary** tree each node has at most 2 children, called **left** and **right** (the order matters).`,
      },
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
      { type: 'exercise', title: 'Build a tree from its array', templateId: 'l13-build-tree', guidance: 'less' },
      { type: 'demo', title: 'Build your own binary tree', ref: 'Lec 13 p.2–5', kind: 'treeBuilder', body: 'Add and remove nodes; height, levels, classification and both representations update live. The BST mode is clearly marked supplementary: Lec 13 covers general binary trees, in which values are NOT ordered.' },
      {
        type: 'read',
        title: 'Graphs and their representations',
        ref: 'Lec 13 p.6',
        concepts: ['l13.graph-repr'],
        body: `A graph allows **more than one incoming link** and cycles. Edges may be **directed** (arrows) or **undirected**, and may carry **weights**.

- **Adjacency matrix**: V×V table; [u][v] = 1 (or the weight) if there is an edge u→v. Undirected graphs give a symmetric matrix. In the notes’ weighted matrix, “no edge” is ∞ and the diagonal is 0. A **self-loop** is a 1 on the diagonal. Space Θ(V²).
- **Adjacency list**: for each vertex a linked list of its neighbours (Lec 13 p.6 bottom). Space Θ(V + E).`,
      },
      { type: 'demo', title: 'Graph editor: watch the matrix and list update', ref: 'Lec 13 p.6', kind: 'graphEditor', body: 'Add vertices and edges (directed or not, weighted or not, self-loops allowed). Start from the notes’ examples.' },
      { type: 'exercise', title: 'Drawing → matrix', templateId: 'l13-matrix', guidance: 'full' },
      { type: 'exercise', title: 'Matrix → list', templateId: 'l13-adjlist', guidance: 'less' },
      { type: 'exercise', title: 'List → drawing', templateId: 'l13-draw', guidance: 'less' },
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
      { type: 'sim', title: 'Inorder with an explicit stack (the notes’ stack pictures)', ref: 'Lec 14 p.1', struct: 'tree', tree: 'lecture', op: 'inorderStack', predict: ['push', 'pop'] },
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

Four separate things to track: **discovered** (seen), **processed** (all neighbours examined), the **frontier** (stack or queue), and the **output** order.`,
      },
      { type: 'sim', title: 'DFS from a (Lec 14 p.4 graph)', ref: 'Lec 14 p.4', struct: 'graph', graph: 'lec14', op: 'dfs', start: 'a', predict: ['discover'] },
      { type: 'exercise', title: 'Click the DFS order', templateId: 'l14-dfs-click', params: { lecture: true, start: 'a' }, guidance: 'full' },
      { type: 'sim', title: 'BFS from a', ref: 'Lec 14 p.3–4', struct: 'graph', graph: 'lec14', op: 'bfs', start: 'a', predict: ['output'] },
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
      {
        type: 'read',
        title: 'Cost of traversals',
        ref: 'Supplementary (complexity)',
        concepts: ['l14.traversal-cost'],
        body: `Counting model: one unit per neighbour entry examined; every vertex processed once.

- **Adjacency list**: each vertex scans only its own list → total Θ(V + E) time.
- **Adjacency matrix**: each vertex scans a whole row of V entries → Θ(V²), even for sparse graphs.
- **Auxiliary space**: visited marks Θ(V); the queue (BFS) or the stack/recursion (DFS) can hold up to Θ(V) vertices.
- **Tree traversals**: Θ(n) time; recursion depth = height + 1, so Θ(h) extra space (Θ(n) for a skewed tree, Θ(log n) for a balanced one).`,
      },
      { type: 'exercise', title: 'List vs matrix', templateId: 'l14-cost', guidance: 'less' },
      { type: 'exercise', title: 'Variation: BFS on a new graph', templateId: 'l14-bfs-click', guidance: 'none' },
      { type: 'exercise', title: 'Variation: DFS on a new graph', templateId: 'l14-dfs-click', guidance: 'none' },
    ],
  },
];

export const LESSON_BY_LECTURE = Object.fromEntries(LESSONS.map((l) => [l.lecture, l]));
