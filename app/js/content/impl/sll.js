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

Node* head = nullptr;     // address of the first node (nullptr = empty list)`;

export const SLL_CPP_SETUP = `// Setup (not part of the lesson's operation): builds the starting list shown in the diagram.
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{v, nullptr};
@setup|        if (last == nullptr) head = n; else last->next = n;
@setup|        last = n;
@setup|    }
@setup|}

// Clean-up: C++ never frees memory by itself, so give every node back at the end.
@setup|void destroyList() {
@setup|    while (head != nullptr) {
@setup|        Node* rest = head->next;
@setup|        delete head;
@setup|        head = rest;
@setup|    }
@setup|}`;

export const SLL_PY_HEAD = `class Node:
    def __init__(self, data):
        self.data = data     # the value
        self.next = None     # reference to the next node (None = there is no next node)

head = None                 # the first node (None = empty list)`;

export const SLL_PY_SETUP = `# Setup (not part of the lesson's operation): builds the starting list shown in the diagram.
@setup|def build(values):
@setup|    global head
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        if last is None:
@setup|            head = n
@setup|        else:
@setup|            last.next = n
@setup|        last = n`;

const PSEUDO_HEAD = `# Nodes have two fields: data and next (next = NULL means "no next node").
# Starting list: {{start}}`;

export const DISPLAY = {
  pseudo: `@fd|function display()
@d1|    temp = head
@d2|    while temp != NULL do
@d3|        print temp.data
@d4|        temp = temp.next
    end while
@fd_end|end function`,
  cpp: `@fd|void display() {
@d1|    Node* temp = head;
@d2|    while (temp != nullptr) {
@d3|        cout << temp->data << "\\n";
@d4|        temp = temp->next;
    }
@fd_end|}`,
  py: `@fd,fd_end|def display():
@d1|    temp = head
@d2|    while temp is not None:
@d3|        print(temp.data)
@d4|        temp = temp.next`,
};

const COUNT = {
  pseudo: `@fc|function count_nodes(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.next
    end while
@c5|    return n
end function`,
  cpp: `@fc|int count_nodes(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->next;
    }
@c5|    return n;
}`,
  py: `@fc|def count_nodes(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.next
@c5|    return n`,
};

const DISPLAY_NOTES = {
  d1: 'The walking pointer **temp** starts at the first node. temp is a copy of the address in head, so moving temp never changes the list.',
  d2: 'Keep going while temp still points at a node. In C++ the end of the list is `nullptr`, in Python `None`, in the pseudocode `NULL`.',
  d3: 'Print the value stored in the node temp points at: `temp->data` (C++ follows the pointer with `->`), `temp.data` (Python and the pseudocode use `.`).',
  d4: '**Traversal**: temp moves to the next node. Only the variable changes — no node and no link is modified.',
};

// ---------------------------------------------------------------- the programs
export const SLL_EXAMPLES = [
  {
    id: 'sll-create',
    module: 'sll',
    structure: 'sll',
    title: 'Create a singly linked list from scratch',
    intro: 'The node type, `create_node()` and an `append()` that builds the list in input order, exactly like `create_list()` in the notes (p.3): every new node is linked after the current last node. `display()` then walks the list once.',
    params: { a: 10, b: 20, c: 30 },
    cases: [{ label: 'Build 10 → 20 → 30', setup: { values: [] } }],
    pseudo: `${PSEUDO_HEAD}

@fg|function create_node(value)
@g1|    new_node = new Node(value)    # data = value, next = NULL
@g2|    return new_node
end function

@fa|function append(value)
@a1|    new_node = create_node(value)
@a2|    if head == NULL then
@a3|        head = new_node          # the very first node
    else
@a4|        temp = head
@a5|        while temp.next != NULL do
@a6|            temp = temp.next     # walk to the LAST node
        end while
@a7|        temp.next = new_node      # link the new node after it
    end if
@fa_end|end function

${DISPLAY.pseudo}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    cpp: `${SLL_CPP_HEAD}

@fg|Node* create_node(int value) {
@g1|    Node* new_node = new Node{value, nullptr};   // on the heap: data = value, next = nullptr
@g2|    return new_node;
}

@fa|void append(int value) {
@a1|    Node* new_node = create_node(value);
@a2|    if (head == nullptr)
@a3|        head = new_node;             // the very first node
    else {
@a4|        Node* temp = head;
@a5|        while (temp->next != nullptr)
@a6|            temp = temp->next;       // walk to the LAST node
@a7|        temp->next = new_node;        // link the new node after it
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

@fg|def create_node(value):
@g1|    new_node = Node(value)        # a new object: data = value, next = None
@g2|    return new_node

@fa,fa_end|def append(value):
    global head                 # append may change the global variable head
@a1|    new_node = create_node(value)
@a2|    if head is None:
@a3|        head = new_node          # the very first node
    else:
@a4|        temp = head
@a5|        while temp.next is not None:
@a6|            temp = temp.next     # walk to the LAST node
@a7|        temp.next = new_node      # link the new node after it

${DISPLAY.py}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    notes: {
      fg: '`create_node()` packages the two jobs of creating a node: reserve memory for it and initialise its fields (Lec 08 p.2).',
      g1: '**Allocation.** C++ `new Node{...}` reserves a node on the heap and returns its ADDRESS; Python `Node(value)` creates an object and returns a REFERENCE to it; the pseudocode `new Node(value)` does the same in the Lab, which numbers nodes @100, @200, … A new, unlinked box appears in the diagram.',
      g2: 'create_node hands the address (C++) / reference (Python) back to its caller. The local variable new_node disappears, but the node itself stays alive: it lives on the heap, not in the function.',
      a2: 'Empty list? `head == nullptr` / `head is None` / `head == NULL`.',
      a3: 'The first node: head now holds its address. In Python, `global head` is what makes this assignment change the program-wide head instead of creating a local variable.',
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
    module: 'sll',
    structure: 'sll',
    title: 'Insert at the beginning',
    intro: 'Two link changes, in this order: (1) the new node points to the old first node, (2) head points to the new node. Swapping them would make head point at the new node while the rest of the list is no longer referenced by anything.',
    params: { x: 5 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_beginning(value)
@i1|    new_node = new Node(value)
@i2|    new_node.next = head         # (1) new node -> old first node (NULL if the list was empty)
@i3|    head = new_node              # (2) head -> new node
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_beginning({{x}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fi|void insert_at_beginning(int value) {
@i1|    Node* new_node = new Node{value, nullptr};
@i2|    new_node->next = head;       // (1) new node -> old first node (nullptr if the list was empty)
@i3|    head = new_node;             // (2) head -> new node
@fi_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_beginning({{x}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fi,fi_end|def insert_at_beginning(value):
    global head
@i1|    new_node = Node(value)
@i2|    new_node.next = head         # (1) new node -> old first node (None if the list was empty)
@i3|    head = new_node              # (2) head -> new node

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|insert_at_beginning({{x}})
@m2|display()`,
    notes: {
      i1: 'A new node with next = NULL / nullptr / None. Nothing points to it yet except new_node.',
      i2: '**Link change (1).** The new node’s next takes the address that is in head — the old first node. On an empty list head is NULL, so next stays NULL: the same two lines handle the empty list, which is why the notes’ separate empty-list case is not needed.',
      i3: '**Link change (2).** head now holds the new node’s address. The order matters: doing (2) first would overwrite the only reference to the old first node.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'i2',
        why: 'The new node must first take over the reference to the rest of the list.',
        wrong: [
          { cpp: 'head->next = new_node;', py: 'head.next = new_node', pseudo: 'head.next = new_node', why: 'That links the new node AFTER the first node and fails on an empty list (head is NULL).', tag: 'pointer-walk' },
          { cpp: 'new_node = head;', py: 'new_node = head', pseudo: 'new_node = head', why: 'That makes new_node point at the old first node and loses the new node.', tag: 'value-vs-address' },
          { cpp: 'new_node->next = nullptr;', py: 'new_node.next = None', pseudo: 'new_node.next = NULL', why: 'next is already NULL; after the next line the old list would be unreachable.', tag: 'lost-access' },
        ],
      },
      {
        label: 'i3',
        why: 'head must end up on the new first node.',
        wrong: [
          { cpp: 'head->next = new_node;', py: 'head.next = new_node', pseudo: 'head.next = new_node', why: 'With new_node.next = head already done, this makes a cycle between the first two nodes.', tag: 'pointer-walk' },
          { cpp: 'new_node = head;', py: 'new_node = head', pseudo: 'new_node = head', why: 'head never moves, so the new node is not in the list.', tag: 'wrong-result' },
        ],
      },
    ],
  },
  {
    id: 'sll-insert-end',
    module: 'sll',
    structure: 'sll',
    title: 'Insert at the end',
    intro: 'Walk temp to the LAST node (the one whose next is NULL) and link the new node after it. An empty list has no last node, so it is a separate case.',
    params: { x: 40 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_end(value)
@i1|    new_node = new Node(value)
@i2|    if head == NULL then
@i3|        head = new_node
    else
@i4|        temp = head
@i5|        while temp.next != NULL do
@i6|            temp = temp.next
        end while
@i7|        temp.next = new_node
    end if
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_end({{x}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fi|void insert_at_end(int value) {
@i1|    Node* new_node = new Node{value, nullptr};
@i2|    if (head == nullptr)
@i3|        head = new_node;
    else {
@i4|        Node* temp = head;
@i5|        while (temp->next != nullptr)
@i6|            temp = temp->next;
@i7|        temp->next = new_node;
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
    global head
@i1|    new_node = Node(value)
@i2|    if head is None:
@i3|        head = new_node
    else:
@i4|        temp = head
@i5|        while temp.next is not None:
@i6|            temp = temp.next
@i7|        temp.next = new_node

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
          { cpp: 'temp = new_node;', py: 'temp = new_node', pseudo: 'temp = new_node', why: 'That only moves the local variable temp; no link changes.', tag: 'value-vs-address' },
          { cpp: 'new_node->next = temp;', py: 'new_node.next = temp', pseudo: 'new_node.next = temp', why: 'That points the new node backwards and leaves it outside the list.', tag: 'pointer-walk' },
        ],
      },
    ],
  },
  {
    id: 'sll-insert-pos',
    module: 'sll',
    structure: 'sll',
    title: 'Insert at a middle position',
    intro: '`insert_at_position(value, pos)` with the two corrections to the notes: the position is checked BEFORE a node is allocated (no leak on a bad position), and pos = node_count is accepted (the new node goes just before the last node). prev follows one node behind temp; the new node goes between them.',
    params: { x: 15 },
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30] }, params: { pos: 2 } },
      { label: 'pos = 3 (just before the last node)', setup: { values: [10, 20, 30] }, params: { pos: 3 } },
      { label: 'pos = 1 (not a middle position)', setup: { values: [10, 20, 30] }, params: { pos: 1 } },
      { label: 'pos = 4 (too large)', setup: { values: [10, 20, 30] }, params: { pos: 4 } },
    ],
    pseudo: `${PSEUDO_HEAD}

${COUNT.pseudo}

@fi|function insert_at_position(value, pos)
@i1|    node_count = count_nodes(head)
@i2|    if pos > 1 and pos <= node_count then   # corrected: the notes use pos < node_count
@i3|        new_node = new Node(value)        # corrected: allocate only after checking
@i4|        temp = head; prev = head; i = 1
@i5|        while i < pos do
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            i = i + 1
        end while
@i9|        prev.next = new_node              # (1) the node before -> new node
@i10|        new_node.next = temp              # (2) new node -> the node that was at pos
    else
@i11|        print "position", pos, "is not a middle position"
    end if
@fi_end|end function

${DISPLAY.pseudo}

@m1|insert_at_position({{x}}, {{pos}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

${COUNT.cpp}

@fi|void insert_at_position(int value, int pos) {
@i1|    int node_count = count_nodes(head);
@i2|    if (pos > 1 && pos <= node_count) {    // corrected: the notes use pos < node_count
@i3|        Node* new_node = new Node{value, nullptr};   // corrected: allocate only after checking
@i4|        Node *temp = head, *prev = head;  int i = 1;
@i5|        while (i < pos) {
@i6|            prev = temp;
@i7|            temp = temp->next;
@i8|            i = i + 1;
        }
@i9|        prev->next = new_node;           // (1) the node before -> new node
@i10|        new_node->next = temp;           // (2) new node -> the node that was at pos
    } else
@i11|        cout << "position " << pos << " is not a middle position\\n";
@fi_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_position({{x}}, {{pos}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

${COUNT.py}

@fi,fi_end|def insert_at_position(value, pos):
@i1|    node_count = count_nodes(head)
@i2|    if pos > 1 and pos <= node_count:      # corrected: the notes use pos < node_count
@i3|        new_node = Node(value)           # corrected: allocate only after checking
@i4|        temp = prev = head; i = 1
@i5|        while i < pos:
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            i = i + 1
@i9|        prev.next = new_node             # (1) the node before -> new node
@i10|        new_node.next = temp             # (2) new node -> the node that was at pos
    else:
@i11|        print("position", pos, "is not a middle position")

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|insert_at_position({{x}}, {{pos}})
@m2|display()`,
    notes: {
      fc: '`count_nodes(p)` walks a COPY of the pointer it is given (parameters are copies in C++, Python and the pseudocode), so counting never moves head.',
      i1: 'How many nodes are there? The valid middle positions are 2 … node_count.',
      i2: '**Validate first.** Position 1 is “insert at the beginning” and node_count + 1 is “insert at the end” — they have their own functions. Correction: the notes test `pos < node_count`, which wrongly rejects inserting just before the last node.',
      i3: 'Only now is the node created. The notes call create_node() before the check, so an invalid position would leak a node that is never linked or freed.',
      i4: 'Both walking pointers head at the first node; i counts the position temp is on.',
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
        why: 'Middle positions are 2 … node_count (pos = node_count puts the new node just before the last one).',
        wrong: [
          { cpp: 'if (pos > 1 && pos < node_count) {', py: 'if pos > 1 and pos < node_count:', pseudo: 'if pos > 1 and pos < node_count then', why: 'That is the notes’ test: it wrongly rejects inserting just before the last node (pos = node_count).', tag: 'position-range' },
          { cpp: 'if (pos >= 1 && pos <= node_count) {', py: 'if pos >= 1 and pos <= node_count:', pseudo: 'if pos >= 1 and pos <= node_count then', why: 'pos = 1 has no node before it: prev would stay on the first node and the new node would land at position 2.', tag: 'position-range' },
        ],
      },
      {
        label: 'i10',
        why: 'The new node continues with the node that was at pos, which temp still holds.',
        wrong: [
          { cpp: 'new_node->next = prev->next;', py: 'new_node.next = prev.next', pseudo: 'new_node.next = prev.next', why: 'prev.next was just changed to new_node, so this makes the new node point to itself.', tag: 'pointer-walk' },
          { cpp: 'temp->next = new_node;', py: 'temp.next = new_node', pseudo: 'temp.next = new_node', why: 'That links the new node in a second place and cuts off everything after temp.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-beg',
    module: 'sll',
    structure: 'sll',
    title: 'Delete at the beginning',
    intro: 'Save → relink → free: keep the first node in temp, move head to the second node, then give the old first node back.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [42] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_beginning()
@x1|    if head == NULL then
@x2|        print "No nodes exist"
@x3|        return
    end if
@x4|    temp = head                 # save the node to remove
@x5|    head = temp.next            # relink: head skips it
@x6|    delete temp                  # free it last
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_beginning()
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fx|void delete_at_beginning() {
@x1|    if (head == nullptr) {
@x2|        cout << "No nodes exist\\n";
@x3|        return;
    }
@x4|    Node* temp = head;          // save the node to remove
@x5|    head = temp->next;          // relink: head skips it
@x6|    delete temp;                 // free it last
@fx_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_beginning();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fx,fx_end|def delete_at_beginning():
    global head
@x1|    if head is None:
@x2|        print("No nodes exist")
@x3|        return
@x4|    temp = head                 # save the node to remove
@x5|    head = temp.next            # relink: head skips it
@x6|    del temp                     # last reference gone: Python frees the node

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_beginning()
@m2|display()`,
    notes: {
      x1: 'Underflow check: an empty list has nothing to delete.',
      x4: '**Save.** temp keeps the address of the node we are removing — we will need it to free the node.',
      x5: '**Relink.** head moves to the second node (or NULL if the list had one node). The old first node is now outside the list but temp still points at it.',
      x6: '**Free.** C++ `delete` gives the node’s memory back. Python has no delete for objects: once no variable refers to the node it is reclaimed automatically (`del temp` just removes that last reference). In the Lab the node is marked freed.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'x5',
        why: 'head must move to the second node before the first one is freed.',
        wrong: [
          { cpp: 'head = nullptr;', py: 'head = None', pseudo: 'head = NULL', why: 'That throws away the whole list, not just the first node.', tag: 'lost-access' },
          { cpp: 'temp = temp->next;', py: 'temp = temp.next', pseudo: 'temp = temp.next', why: 'That moves temp; head still points at the node that is about to be freed (a dangling pointer).', tag: 'dangling' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-end',
    module: 'sll',
    structure: 'sll',
    title: 'Delete at the end (with the one-node correction)',
    intro: 'prev trails temp so that when temp reaches the last node, prev is on the node that becomes the new last node. The correction to the notes: with only one node there is no node before it, so head itself must become NULL.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [42] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_end()
@x1|    if head == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = head; prev = head
@x5|    while temp.next != NULL do
@x6|        prev = temp
@x7|        temp = temp.next
    end while
@x8|    if temp == head then        # correction: the only node
@x9|        head = NULL
    else
@x10|        prev.next = NULL         # prev becomes the last node
    end if
@x11|    delete temp
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_end()
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

@fx|void delete_at_end() {
@x1|    if (head == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node *temp = head, *prev = head;
@x5|    while (temp->next != nullptr) {
@x6|        prev = temp;
@x7|        temp = temp->next;
    }
@x8|    if (temp == head)           // correction: the only node
@x9|        head = nullptr;
    else
@x10|        prev->next = nullptr;    // prev becomes the last node
@x11|    delete temp;
@fx_end|}

${DISPLAY.cpp}

${SLL_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_end();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

@fx,fx_end|def delete_at_end():
    global head
@x1|    if head is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = prev = head
@x5|    while temp.next is not None:
@x6|        prev = temp
@x7|        temp = temp.next
@x8|    if temp is head:            # correction: the only node
@x9|        head = None
    else:
@x10|        prev.next = None         # prev becomes the last node
@x11|    del temp

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_end()
@m2|display()`,
    notes: {
      x4: 'Two walking pointers on the first node.',
      x5: 'Stop when temp is ON the last node.',
      x6: 'prev catches up…',
      x7: '…temp moves ahead: prev stays one node behind.',
      x8: '**Edge case.** If temp is still head, the list has only one node and there is no node before it. Comparing pointers compares ADDRESSES (C++ `==`, Python `is`): is it the same node?',
      x9: 'The list becomes empty. The notes omit this: they set prev->next = NULL (which changes the node being deleted) and free it, leaving head holding a freed address — a dangling pointer.',
      x10: '**Link change.** The node before the last one becomes the new last node.',
      x11: 'Free the old last node. In Python, the last reference disappears and the object is reclaimed automatically.',
      ...DISPLAY_NOTES,
    },
    blanks: [
      {
        label: 'x9',
        why: 'With one node there is no previous node: head itself must become empty.',
        wrong: [
          { cpp: 'prev->next = nullptr;', py: 'prev.next = None', pseudo: 'prev.next = NULL', why: 'prev IS the node being deleted here; head would be left pointing at freed memory.', tag: 'dangling' },
          { cpp: 'head = head->next->next;', py: 'head = head.next.next', pseudo: 'head = head.next.next', why: 'head.next is NULL on a one-node list, so this follows NULL.', tag: 'null-deref' },
        ],
      },
    ],
  },
  {
    id: 'sll-delete-pos',
    module: 'sll',
    structure: 'sll',
    title: 'Delete at a middle position',
    intro: 'Only positions 2 … node_count − 1 are middle positions for deletion (the first and last nodes have their own functions). Relink around the node, then free it.',
    params: {},
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30, 40] }, params: { pos: 2 } },
      { label: 'pos = 3', setup: { values: [10, 20, 30, 40] }, params: { pos: 3 } },
      { label: 'pos = 4 (the last node — not a middle position)', setup: { values: [10, 20, 30, 40] }, params: { pos: 4 } },
    ],
    pseudo: `${PSEUDO_HEAD}

${COUNT.pseudo}

@fx|function delete_at_position(pos)
@x1|    node_count = count_nodes(head)
@x2|    if pos > 1 and pos < node_count then
@x3|        temp = head; prev = head; i = 1
@x4|        while i < pos do
@x5|            prev = temp
@x6|            temp = temp.next
@x7|            i = i + 1
        end while
@x8|        prev.next = temp.next    # bypass the node
@x9|        delete temp              # then free it
    else
@x10|        print "Invalid position"
    end if
@fx_end|end function

${DISPLAY.pseudo}

@m1|delete_at_position({{pos}})
@m2|display()`,
    cpp: `${SLL_CPP_HEAD}

${COUNT.cpp}

@fx|void delete_at_position(int pos) {
@x1|    int node_count = count_nodes(head);
@x2|    if (pos > 1 && pos < node_count) {
@x3|        Node *temp = head, *prev = head;  int i = 1;
@x4|        while (i < pos) {
@x5|            prev = temp;
@x6|            temp = temp->next;
@x7|            i = i + 1;
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
@m1|    delete_at_position({{pos}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${SLL_PY_HEAD}

${COUNT.py}

@fx,fx_end|def delete_at_position(pos):
@x1|    node_count = count_nodes(head)
@x2|    if pos > 1 and pos < node_count:
@x3|        temp = prev = head; i = 1
@x4|        while i < pos:
@x5|            prev = temp
@x6|            temp = temp.next
@x7|            i = i + 1
@x8|        prev.next = temp.next        # bypass the node
@x9|        del temp                     # then let it go
    else:
@x10|        print("Invalid position")

${DISPLAY.py}

${SLL_PY_SETUP}

@setup|{{build}}
@m1|delete_at_position({{pos}})
@m2|display()`,
    notes: {
      x2: 'Middle positions for deletion are 2 … node_count − 1.',
      x3: 'Walk with prev one node behind temp, as for insertion.',
      x8: '**Link change.** The node before temp now points to the node after temp: the list skips temp. temp still points at the removed node, so it can be freed.',
      x9: '**Free after relinking.** Freeing first would make `temp->next` a read from freed memory (see “Freeing too early”).',
      x10: 'Positions 1 and node_count belong to delete_at_beginning / delete_at_end.',
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
