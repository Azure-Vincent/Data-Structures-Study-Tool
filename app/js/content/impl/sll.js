// "Build it in code": singly linked lists (Lectures 08 and 09).
// Format: see ./format.js. Each program exists in pseudocode (runs in the Lab),
// C++ and Python; labels tie equivalent statements together.

// ---------------------------------------------------------------- shared parts
export const SLL_CPP_HEAD = `#include <iostream>
#include <initializer_list>
using namespace std;

// One node: the value and the ADDRESS of the next node.
struct Node {
    int data;
    Node* next;            // nullptr = there is no next node
};

Node* start = nullptr;     // address of the first node (nullptr = empty list)`;

export const SLL_CPP_SETUP = `// Setup (not part of the lesson's operation): builds the starting list shown in the diagram.
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{v, nullptr};
@setup|        if (last == nullptr) start = n; else last->next = n;
@setup|        last = n;
@setup|    }
@setup|}

// Clean-up: C++ never frees memory by itself, so give every node back at the end.
@setup|void destroyList() {
@setup|    while (start != nullptr) {
@setup|        Node* rest = start->next;
@setup|        delete start;
@setup|        start = rest;
@setup|    }
@setup|}`;

export const SLL_PY_HEAD = `class Node:
    def __init__(self, data):
        self.data = data     # the value
        self.next = None     # reference to the next node (None = there is no next node)

start = None                 # the first node (None = empty list)`;

export const SLL_PY_SETUP = `# Setup (not part of the lesson's operation): builds the starting list shown in the diagram.
@setup|def build(values):
@setup|    global start
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        if last is None:
@setup|            start = n
@setup|        else:
@setup|            last.next = n
@setup|        last = n`;

const PSEUDO_HEAD = `# Nodes have two fields: data and next (next = NULL means "no next node").
# Starting list: {{start}}`;

export const DISPLAY = {
  pseudo: `@fd|function display()
@d1|    temp = start
@d2|    while temp != NULL do
@d3|        print temp.data
@d4|        temp = temp.next
    end while
@fd_end|end function`,
  cpp: `@fd|void display() {
@d1|    Node* temp = start;
@d2|    while (temp != nullptr) {
@d3|        cout << temp->data << "\\n";
@d4|        temp = temp->next;
    }
@fd_end|}`,
  py: `@fd,fd_end|def display():
@d1|    temp = start
@d2|    while temp is not None:
@d3|        print(temp.data)
@d4|        temp = temp.next`,
};

const COUNT = {
  pseudo: `@fc|function countnode(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.next
    end while
@c5|    return n
end function`,
  cpp: `@fc|int countnode(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->next;
    }
@c5|    return n;
}`,
  py: `@fc|def countnode(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.next
@c5|    return n`,
};

const DISPLAY_NOTES = {
  d1: 'The walking pointer **temp** starts at the first node. temp is a copy of the address in start, so moving temp never changes the list.',
  d2: 'Keep going while temp still points at a node. In C++ the end of the list is `nullptr`, in Python `None`, in the pseudocode `NULL`.',
  d3: 'Print the value stored in the node temp points at: `temp->data` (C++ follows the pointer with `->`), `temp.data` (Python and the pseudocode use `.`).',
  d4: '**Traversal**: temp moves to the next node. Only the variable changes — no node and no link is modified.',
};

// ---------------------------------------------------------------- the programs
export const SLL_EXAMPLES = [
  {
    id: 'sll-create',
    lecture: 8,
    structure: 'sll',
    title: 'Create a singly linked list from scratch',
    ref: 'Lec 08 p.1–3',
    intro: 'The node type, `getnode()` and an `append()` that builds the list in input order, exactly like `creatlist()` in the notes (p.3): every new node is linked after the current last node. `display()` then walks the list once.',
    params: { a: 10, b: 20, c: 30 },
    cases: [{ label: 'Build 10 → 20 → 30', setup: { values: [] } }],
    pseudo: `${PSEUDO_HEAD}

@fg|function getnode(value)
@g1|    newnode = new Node(value)    # data = value, next = NULL
@g2|    return newnode
end function

@fa|function append(value)
@a1|    newnode = getnode(value)
@a2|    if start == NULL then
@a3|        start = newnode          # the very first node
    else
@a4|        temp = start
@a5|        while temp.next != NULL do
@a6|            temp = temp.next     # walk to the LAST node
        end while
@a7|        temp.next = newnode      # link the new node after it
    end if
@fa_end|end function

${DISPLAY.pseudo}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    cpp: `${SLL_CPP_HEAD}

@fg|Node* getnode(int value) {
@g1|    Node* newnode = new Node{value, nullptr};   // on the heap: data = value, next = nullptr
@g2|    return newnode;
}

@fa|void append(int value) {
@a1|    Node* newnode = getnode(value);
@a2|    if (start == nullptr)
@a3|        start = newnode;             // the very first node
    else {
@a4|        Node* temp = start;
@a5|        while (temp->next != nullptr)
@a6|            temp = temp->next;       // walk to the LAST node
@a7|        temp->next = newnode;        // link the new node after it
    }
@fa_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@m1|    append({{a}});
@m2|    append({{b}});
@m3|    append({{c}});
@m4|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fg|def getnode(value):
@g1|    newnode = Node(value)        # a new object: data = value, next = None
@g2|    return newnode

@fa,fa_end|def append(value):
    global start                 # append may change the global variable start
@a1|    newnode = getnode(value)
@a2|    if start is None:
@a3|        start = newnode          # the very first node
    else:
@a4|        temp = start
@a5|        while temp.next is not None:
@a6|            temp = temp.next     # walk to the LAST node
@a7|        temp.next = newnode      # link the new node after it

${DISPLAY.py}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    notes: {
      fg: '`getnode()` packages the two jobs of creating a node: reserve memory for it and initialise its fields (Lec 08 p.2).',
      g1: '**Allocation.** C++ `new Node{...}` reserves a node on the heap and returns its ADDRESS; Python `Node(value)` creates an object and returns a REFERENCE to it; the pseudocode `new Node(value)` does the same in the Lab, which numbers nodes @100, @200, … A new, unlinked box appears in the diagram.',
      g2: 'getnode hands the address (C++) / reference (Python) back to its caller. The local variable newnode disappears, but the node itself stays alive: it lives on the heap, not in the function.',
      a2: 'Empty list? `start == nullptr` / `start is None` / `start == NULL`.',
      a3: 'The first node: start now holds its address. In Python, `global start` is what makes this assignment change the program-wide start instead of creating a local variable.',
      a4: 'temp starts at the first node…',
      a5: '…and stops ON the last node: the loop runs while temp has a next node.',
      a6: 'temp moves one node forward. Only temp changes.',
      a7: '**Link change.** The old last node’s next field now holds the new node’s address — the arrow appears in the diagram.',
      ...DISPLAY_NOTES,
      m4: 'Print the list from the first node to the last.',
    },
  },
  {
    id: 'sll-insert-beg',
    lecture: 8,
    structure: 'sll',
    title: 'Insert at the beginning',
    ref: 'Lec 08 p.4',
    intro: 'Two link changes, in this order: (1) the new node points to the old first node, (2) start points to the new node. Swapping them would make start point at the new node while the rest of the list is no longer referenced by anything.',
    params: { x: 5 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_beg(value)
@i1|    newnode = new Node(value)
@i2|    newnode.next = start         # (1) new node -> old first node (NULL if the list was empty)
@i3|    start = newnode              # (2) start -> new node
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_beg({{x}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fi|void insert_at_beg(int value) {
@i1|    Node* newnode = new Node{value, nullptr};
@i2|    newnode->next = start;       // (1) new node -> old first node (nullptr if the list was empty)
@i3|    start = newnode;             // (2) start -> new node
@fi_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_beg({{x}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fi,fi_end|def insert_at_beg(value):
    global start
@i1|    newnode = Node(value)
@i2|    newnode.next = start         # (1) new node -> old first node (None if the list was empty)
@i3|    start = newnode              # (2) start -> new node

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|insert_at_beg({{x}})
@m2|display()`,
    notes: {
      i1: 'A new node with next = NULL / nullptr / None. Nothing points to it yet except newnode.',
      i2: '**Link change (1).** The new node’s next takes the address that is in start — the old first node. On an empty list start is NULL, so next stays NULL: the same two lines handle the empty list, which is why the notes’ separate empty-list case is not needed.',
      i3: '**Link change (2).** start now holds the new node’s address. The order matters: doing (2) first would overwrite the only reference to the old first node.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'i2',
        why: 'The new node must first take over the reference to the rest of the list.',
        wrong: [
          { cpp: 'start->next = newnode;', py: 'start.next = newnode', pseudo: 'start.next = newnode', why: 'That links the new node AFTER the first node and fails on an empty list (start is NULL).', tag: 'pointer-walk' },
          { cpp: 'newnode = start;', py: 'newnode = start', pseudo: 'newnode = start', why: 'That makes newnode point at the old first node and loses the new node.', tag: 'value-vs-address' },
          { cpp: 'newnode->next = nullptr;', py: 'newnode.next = None', pseudo: 'newnode.next = NULL', why: 'next is already NULL; after the next line the old list would be unreachable.', tag: 'lost-access' },
        ],
      },
      {
        label: 'i3',
        why: 'start must end up on the new first node.',
        wrong: [
          { cpp: 'start->next = newnode;', py: 'start.next = newnode', pseudo: 'start.next = newnode', why: 'With newnode.next = start already done, this makes a cycle between the first two nodes.', tag: 'pointer-walk' },
          { cpp: 'newnode = start;', py: 'newnode = start', pseudo: 'newnode = start', why: 'start never moves, so the new node is not in the list.', tag: 'wrong-result' },
        ],
      },
    ],
  },
  {
    id: 'sll-insert-end',
    lecture: 8,
    structure: 'sll',
    title: 'Insert at the end',
    ref: 'Lec 08 p.5',
    intro: 'Walk temp to the LAST node (the one whose next is NULL) and link the new node after it. An empty list has no last node, so it is a separate case.',
    params: { x: 40 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_end(value)
@i1|    newnode = new Node(value)
@i2|    if start == NULL then
@i3|        start = newnode
    else
@i4|        temp = start
@i5|        while temp.next != NULL do
@i6|            temp = temp.next
        end while
@i7|        temp.next = newnode
    end if
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_end({{x}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fi|void insert_at_end(int value) {
@i1|    Node* newnode = new Node{value, nullptr};
@i2|    if (start == nullptr)
@i3|        start = newnode;
    else {
@i4|        Node* temp = start;
@i5|        while (temp->next != nullptr)
@i6|            temp = temp->next;
@i7|        temp->next = newnode;
    }
@fi_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_end({{x}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fi,fi_end|def insert_at_end(value):
    global start
@i1|    newnode = Node(value)
@i2|    if start is None:
@i3|        start = newnode
    else:
@i4|        temp = start
@i5|        while temp.next is not None:
@i6|            temp = temp.next
@i7|        temp.next = newnode

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|insert_at_end({{x}})
@m2|display()`,
    notes: {
      i2: 'An empty list has no last node to link after.',
      i3: 'So the new node simply becomes the first node.',
      i4: 'Otherwise temp starts at the first node…',
      i5: '…and the loop asks whether temp has a NEXT node. It stops with temp ON the last node. (Testing `temp != NULL` instead would walk off the end and leave temp NULL.)',
      i6: 'temp moves forward one node.',
      i7: '**Link change.** The last node’s next changes from NULL to the new node’s address.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'i5',
        why: 'The loop must stop ON the last node, so it tests temp’s next field.',
        wrong: [
          { cpp: 'while (temp != nullptr)', py: 'while temp is not None:', pseudo: 'while temp != NULL do', why: 'That walks past the last node: temp ends as NULL and the next line follows NULL.', tag: 'null-deref' },
          { cpp: 'while (temp->next->next != nullptr)', py: 'while temp.next.next is not None:', pseudo: 'while temp.next.next != NULL do', why: 'That stops one node too early (and crashes on a one-node list).', tag: 'off-by-one' },
        ],
      },
      {
        label: 'i7',
        why: 'The last node gets the new node’s address.',
        wrong: [
          { cpp: 'temp = newnode;', py: 'temp = newnode', pseudo: 'temp = newnode', why: 'That only moves the local variable temp; no link changes.', tag: 'value-vs-address' },
          { cpp: 'newnode->next = temp;', py: 'newnode.next = temp', pseudo: 'newnode.next = temp', why: 'That points the new node backwards and leaves it outside the list.', tag: 'pointer-walk' },
        ],
      },
    ],
  },
  {
    id: 'sll-insert-pos',
    lecture: 8,
    structure: 'sll',
    title: 'Insert at a middle position',
    ref: 'Lec 08 p.6–7',
    intro: '`insert_at_mid(value, pos)` with the two corrections to the notes: the position is checked BEFORE a node is allocated (no leak on a bad position), and pos = nodectr is accepted (the new node goes just before the last node). prev follows one node behind temp; the new node goes between them.',
    params: { x: 15 },
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30] }, params: { pos: 2 } },
      { label: 'pos = 3 (just before the last node)', setup: { values: [10, 20, 30] }, params: { pos: 3 } },
      { label: 'pos = 1 (not a middle position)', setup: { values: [10, 20, 30] }, params: { pos: 1 } },
      { label: 'pos = 4 (too large)', setup: { values: [10, 20, 30] }, params: { pos: 4 } },
    ],
    pseudo: `${PSEUDO_HEAD}

${COUNT.pseudo}

@fi|function insert_at_mid(value, pos)
@i1|    nodectr = countnode(start)
@i2|    if pos > 1 and pos <= nodectr then   # corrected: the notes use pos < nodectr
@i3|        newnode = new Node(value)        # corrected: allocate only after checking
@i4|        temp = start; prev = start; ctr = 1
@i5|        while ctr < pos do
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            ctr = ctr + 1
        end while
@i9|        prev.next = newnode              # (1) the node before -> new node
@i10|        newnode.next = temp              # (2) new node -> the node that was at pos
    else
@i11|        print "position", pos, "is not a middle position"
    end if
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_mid({{x}}, {{pos}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

${COUNT.cpp}

@fi|void insert_at_mid(int value, int pos) {
@i1|    int nodectr = countnode(start);
@i2|    if (pos > 1 && pos <= nodectr) {    // corrected: the notes use pos < nodectr
@i3|        Node* newnode = new Node{value, nullptr};   // corrected: allocate only after checking
@i4|        Node *temp = start, *prev = start;  int ctr = 1;
@i5|        while (ctr < pos) {
@i6|            prev = temp;
@i7|            temp = temp->next;
@i8|            ctr = ctr + 1;
        }
@i9|        prev->next = newnode;           // (1) the node before -> new node
@i10|        newnode->next = temp;           // (2) new node -> the node that was at pos
    } else
@i11|        cout << "position " << pos << " is not a middle position\\n";
@fi_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_mid({{x}}, {{pos}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

${COUNT.py}

@fi,fi_end|def insert_at_mid(value, pos):
@i1|    nodectr = countnode(start)
@i2|    if pos > 1 and pos <= nodectr:      # corrected: the notes use pos < nodectr
@i3|        newnode = Node(value)           # corrected: allocate only after checking
@i4|        temp = prev = start; ctr = 1
@i5|        while ctr < pos:
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            ctr = ctr + 1
@i9|        prev.next = newnode             # (1) the node before -> new node
@i10|        newnode.next = temp             # (2) new node -> the node that was at pos
    else:
@i11|        print("position", pos, "is not a middle position")

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|insert_at_mid({{x}}, {{pos}})
@m2|display()`,
    notes: {
      fc: '`countnode(p)` walks a COPY of the pointer it is given (parameters are copies in C++, Python and the pseudocode), so counting never moves start.',
      i1: 'How many nodes are there? The valid middle positions are 2 … nodectr.',
      i2: '**Validate first.** Position 1 is “insert at the beginning” and nodectr + 1 is “insert at the end” — they have their own functions. Correction: the notes test `pos < nodectr`, which wrongly rejects inserting just before the last node.',
      i3: 'Only now is the node created. The notes call getnode() before the check, so an invalid position would leak a node that is never linked or freed.',
      i4: 'Both walking pointers start at the first node; ctr counts the position temp is on.',
      i5: 'Walk until temp is ON position pos.',
      i6: 'prev catches up to temp…',
      i7: '…and temp moves one node ahead, so prev is always one node behind.',
      i8: 'Position counter.',
      i9: '**Link change (1).** The node before the gap now points to the new node. Nothing is lost: temp still holds the rest of the list.',
      i10: '**Link change (2).** The new node points to the node that used to be at pos.',
      i11: 'Invalid position: nothing is allocated, so nothing can leak.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'i2',
        why: 'Middle positions are 2 … nodectr (pos = nodectr puts the new node just before the last one).',
        wrong: [
          { cpp: 'if (pos > 1 && pos < nodectr) {', py: 'if pos > 1 and pos < nodectr:', pseudo: 'if pos > 1 and pos < nodectr then', why: 'That is the notes’ test: it wrongly rejects inserting just before the last node (pos = nodectr).', tag: 'position-range' },
          { cpp: 'if (pos >= 1 && pos <= nodectr) {', py: 'if pos >= 1 and pos <= nodectr:', pseudo: 'if pos >= 1 and pos <= nodectr then', why: 'pos = 1 has no node before it: prev would stay on the first node and the new node would land at position 2.', tag: 'position-range' },
        ],
      },
      {
        label: 'i10',
        why: 'The new node continues with the node that was at pos, which temp still holds.',
        wrong: [
          { cpp: 'newnode->next = prev->next;', py: 'newnode.next = prev.next', pseudo: 'newnode.next = prev.next', why: 'prev.next was just changed to newnode, so this makes the new node point to itself.', tag: 'pointer-walk' },
          { cpp: 'temp->next = newnode;', py: 'temp.next = newnode', pseudo: 'temp.next = newnode', why: 'That links the new node in a second place and cuts off everything after temp.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-beg',
    lecture: 9,
    structure: 'sll',
    title: 'Delete at the beginning',
    ref: 'Lec 09 p.1',
    intro: 'Save → relink → free: keep the first node in temp, move start to the second node, then give the old first node back.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [42] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_beg()
@x1|    if start == NULL then
@x2|        print "No nodes exist"
@x3|        return
    end if
@x4|    temp = start                 # save the node to remove
@x5|    start = temp.next            # relink: start skips it
@x6|    delete temp                  # free it last
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_beg()
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fx|void delete_at_beg() {
@x1|    if (start == nullptr) {
@x2|        cout << "No nodes exist\\n";
@x3|        return;
    }
@x4|    Node* temp = start;          // save the node to remove
@x5|    start = temp->next;          // relink: start skips it
@x6|    delete temp;                 // free it last
@fx_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_beg();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fx,fx_end|def delete_at_beg():
    global start
@x1|    if start is None:
@x2|        print("No nodes exist")
@x3|        return
@x4|    temp = start                 # save the node to remove
@x5|    start = temp.next            # relink: start skips it
@x6|    del temp                     # last reference gone: Python frees the node

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_beg()
@m2|display()`,
    notes: {
      x1: 'Underflow check: an empty list has nothing to delete.',
      x4: '**Save.** temp keeps the address of the node we are removing — we will need it to free the node.',
      x5: '**Relink.** start moves to the second node (or NULL if the list had one node). The old first node is now outside the list but temp still points at it.',
      x6: '**Free.** C++ `delete` gives the node’s memory back. Python has no delete for objects: once no variable refers to the node it is reclaimed automatically (`del temp` just removes that last reference). In the Lab the node is marked freed.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'x5',
        why: 'start must move to the second node before the first one is freed.',
        wrong: [
          { cpp: 'start = nullptr;', py: 'start = None', pseudo: 'start = NULL', why: 'That throws away the whole list, not just the first node.', tag: 'lost-access' },
          { cpp: 'temp = temp->next;', py: 'temp = temp.next', pseudo: 'temp = temp.next', why: 'That moves temp; start still points at the node that is about to be freed (a dangling pointer).', tag: 'dangling' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-end',
    lecture: 9,
    structure: 'sll',
    title: 'Delete at the end (with the one-node correction)',
    ref: 'Lec 09 p.2',
    intro: 'prev trails temp so that when temp reaches the last node, prev is on the node that becomes the new last node. The correction to the notes: with only one node there is no node before it, so start itself must become NULL.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [42] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_last()
@x1|    if start == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = start; prev = start
@x5|    while temp.next != NULL do
@x6|        prev = temp
@x7|        temp = temp.next
    end while
@x8|    if temp == start then        # correction: the only node
@x9|        start = NULL
    else
@x10|        prev.next = NULL         # prev becomes the last node
    end if
@x11|    delete temp
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_last()
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fx|void delete_at_last() {
@x1|    if (start == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node *temp = start, *prev = start;
@x5|    while (temp->next != nullptr) {
@x6|        prev = temp;
@x7|        temp = temp->next;
    }
@x8|    if (temp == start)           // correction: the only node
@x9|        start = nullptr;
    else
@x10|        prev->next = nullptr;    // prev becomes the last node
@x11|    delete temp;
@fx_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_last();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fx,fx_end|def delete_at_last():
    global start
@x1|    if start is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = prev = start
@x5|    while temp.next is not None:
@x6|        prev = temp
@x7|        temp = temp.next
@x8|    if temp is start:            # correction: the only node
@x9|        start = None
    else:
@x10|        prev.next = None         # prev becomes the last node
@x11|    del temp

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_last()
@m2|display()`,
    notes: {
      x4: 'Two walking pointers on the first node.',
      x5: 'Stop when temp is ON the last node.',
      x6: 'prev catches up…',
      x7: '…temp moves ahead: prev stays one node behind.',
      x8: '**Edge case.** If temp is still start, the list has only one node and there is no node before it. Comparing pointers compares ADDRESSES (C++ `==`, Python `is`): is it the same node?',
      x9: 'The list becomes empty. The notes omit this: they set prev->next = NULL (which changes the node being deleted) and free it, leaving start holding a freed address — a dangling pointer.',
      x10: '**Link change.** The node before the last one becomes the new last node.',
      x11: 'Free the old last node. In Python, the last reference disappears and the object is reclaimed automatically.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'x9',
        why: 'With one node there is no previous node: start itself must become empty.',
        wrong: [
          { cpp: 'prev->next = nullptr;', py: 'prev.next = None', pseudo: 'prev.next = NULL', why: 'prev IS the node being deleted here; start would be left pointing at freed memory.', tag: 'dangling' },
          { cpp: 'start = start->next->next;', py: 'start = start.next.next', pseudo: 'start = start.next.next', why: 'start.next is NULL on a one-node list, so this follows NULL.', tag: 'null-deref' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-pos',
    lecture: 9,
    structure: 'sll',
    title: 'Delete at a middle position',
    ref: 'Lec 09 p.3–4',
    intro: 'Only positions 2 … nodectr − 1 are middle positions for deletion (the first and last nodes have their own functions). Relink around the node, then free it.',
    params: {},
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30, 40] }, params: { pos: 2 } },
      { label: 'pos = 3', setup: { values: [10, 20, 30, 40] }, params: { pos: 3 } },
      { label: 'pos = 4 (the last node — not a middle position)', setup: { values: [10, 20, 30, 40] }, params: { pos: 4 } },
    ],
    pseudo: `${PSEUDO_HEAD}

${COUNT.pseudo}

@fx|function delete_at_mid(pos)
@x1|    nodectr = countnode(start)
@x2|    if pos > 1 and pos < nodectr then
@x3|        temp = start; prev = start; ctr = 1
@x4|        while ctr < pos do
@x5|            prev = temp
@x6|            temp = temp.next
@x7|            ctr = ctr + 1
        end while
@x8|        prev.next = temp.next    # bypass the node
@x9|        delete temp              # then free it
    else
@x10|        print "Invalid position"
    end if
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_mid({{pos}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

${COUNT.cpp}

@fx|void delete_at_mid(int pos) {
@x1|    int nodectr = countnode(start);
@x2|    if (pos > 1 && pos < nodectr) {
@x3|        Node *temp = start, *prev = start;  int ctr = 1;
@x4|        while (ctr < pos) {
@x5|            prev = temp;
@x6|            temp = temp->next;
@x7|            ctr = ctr + 1;
        }
@x8|        prev->next = temp->next;     // bypass the node
@x9|        delete temp;                 // then free it
    } else
@x10|        cout << "Invalid position\\n";
@fx_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_mid({{pos}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

${COUNT.py}

@fx,fx_end|def delete_at_mid(pos):
@x1|    nodectr = countnode(start)
@x2|    if pos > 1 and pos < nodectr:
@x3|        temp = prev = start; ctr = 1
@x4|        while ctr < pos:
@x5|            prev = temp
@x6|            temp = temp.next
@x7|            ctr = ctr + 1
@x8|        prev.next = temp.next        # bypass the node
@x9|        del temp                     # then let it go
    else:
@x10|        print("Invalid position")

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_mid({{pos}})
@m2|display()`,
    notes: {
      x2: 'Middle positions for deletion are 2 … nodectr − 1.',
      x3: 'Walk with prev one node behind temp, as for insertion.',
      x8: '**Link change.** The node before temp now points to the node after temp: the list skips temp. temp still points at the removed node, so it can be freed.',
      x9: '**Free after relinking.** Freeing first would make `temp->next` a read from freed memory (see “Freeing too early”).',
      x10: 'Positions 1 and nodectr belong to delete_at_beg / delete_at_last.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'x8',
        why: 'The node before temp must skip over temp.',
        wrong: [
          { cpp: 'prev->next = temp;', py: 'prev.next = temp', pseudo: 'prev.next = temp', why: 'That is the link that already exists; nothing is removed.', tag: 'wrong-result' },
          { cpp: 'temp->next = prev->next;', py: 'temp.next = prev.next', pseudo: 'temp.next = prev.next', why: 'That points temp at itself and leaves it in the list.', tag: 'pointer-walk' },
          { cpp: 'prev = temp->next;', py: 'prev = temp.next', pseudo: 'prev = temp.next', why: 'That only moves the variable prev; no link changes.', tag: 'value-vs-address' },
        ],
      },
      {
        label: 'x9',
        why: 'After relinking, the removed node is freed.',
        wrong: [
          { cpp: 'delete prev;', py: 'del prev', pseudo: 'delete prev', why: 'prev is still in the list: freeing it leaves a link into freed memory.', tag: 'free-before-unlink' },
        ],
      },
    ],
  },
];
