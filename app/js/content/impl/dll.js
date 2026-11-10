// "Build it in code": doubly linked lists (Lecture 10). See ./format.js.
// The notes call the links prev (previous) and next (next).

const CPP_HEAD = `#include <iostream>
#include <initializer_list>
using namespace std;

// prev | data | next — two addresses per node.
struct Node {
    Node* prev;            // the previous node (nullptr = none)
    int data;
    Node* next;           // the next node (nullptr = none)
};

Node* head = nullptr;`;

const CPP_SETUP = `// Setup: builds the starting list shown in the diagram (both directions linked).
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{last, v, nullptr};
@setup|        if (last == nullptr) head = n; else last->next = n;
@setup|        last = n;
@setup|    }
@setup|}

// Clean-up: give every node back before the program ends.
@setup|void destroyList() {
@setup|    while (head != nullptr) {
@setup|        Node* rest = head->next;
@setup|        delete head;
@setup|        head = rest;
@setup|    }
@setup|}`;

const PY_HEAD = `class Node:
    def __init__(self, data):
        self.prev = None      # the previous node
        self.data = data
        self.next = None     # the next node

head = None`;

const PY_SETUP = `# Setup: builds the starting list shown in the diagram (both directions linked).
@setup|def build(values):
@setup|    global head
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        n.prev = last
@setup|        if last is None:
@setup|            head = n
@setup|        else:
@setup|            last.next = n
@setup|        last = n`;

const PSEUDO_HEAD = `# Nodes have three fields: prev, data, next (prev = previous, next = next).
# Starting list: {{start}}`;

// forward and backward display
const SHOW = {
  pseudo: `@ff|function show_forward()
@f1|    temp = head
@f2|    while temp != NULL do
@f3|        print temp.data
@f4|        temp = temp.next
    end while
@ff_end|end function

@fb|function show_backward()
@b1|    if head == NULL then
@b2|        return
    end if
@b3|    temp = head
@b4|    while temp.next != NULL do
@b5|        temp = temp.next        # first go to the last node
    end while
@b6|    while temp != NULL do
@b7|        print temp.data
@b8|        temp = temp.prev         # then follow the prev links back
    end while
@fb_end|end function`,
  cpp: `@ff|void show_forward() {
@f1|    Node* temp = head;
@f2|    while (temp != nullptr) {
@f3|        cout << temp->data << "\\n";
@f4|        temp = temp->next;
    }
@ff_end|}

@fb|void show_backward() {
@b1|    if (head == nullptr)
@b2|        return;
@b3|    Node* temp = head;
@b4|    while (temp->next != nullptr)
@b5|        temp = temp->next;      // first go to the last node
@b6|    while (temp != nullptr) {
@b7|        cout << temp->data << "\\n";
@b8|        temp = temp->prev;       // then follow the prev links back
    }
@fb_end|}`,
  py: `@ff,ff_end|def show_forward():
@f1|    temp = head
@f2|    while temp is not None:
@f3|        print(temp.data)
@f4|        temp = temp.next

@fb,fb_end|def show_backward():
@b1|    if head is None:
@b2|        return
@b3|    temp = head
@b4|    while temp.next is not None:
@b5|        temp = temp.next        # first go to the last node
@b6|    while temp is not None:
@b7|        print(temp.data)
@b8|        temp = temp.prev         # then follow the prev links back`,
};

const SHOW_NOTES = {
  f1: 'Forward traversal follows the next links, exactly like a singly linked list.',
  f4: 'temp moves to the next node.',
  b4: 'To go backwards we first need the last node.',
  b8: 'Backward traversal follows the LEFT links. If any prev link were wrong, the backward output would differ from the reversed forward output — a quick way to test a doubly linked list.',
};

const MAIN_SHOW = { pseudo: `@m8|show_forward()\n@m9|show_backward()`, cpp: `@m8|    show_forward();\n@m9|    show_backward();`, py: `@m8|show_forward()\n@m9|show_backward()` };

export const DLL_EXAMPLES = [
  {
    id: 'dll-create',
    module: 'dll',
    structure: 'dll',
    title: 'Create a doubly linked list from scratch',
    intro: 'Each node has two links. Appending a node changes TWO links — the old last node’s next and the new node’s prev — so that both directions stay consistent.',
    params: { a: 10, b: 20, c: 30 },
    cases: [{ label: 'Build 10 ⇄ 20 ⇄ 30', setup: { values: [] } }],
    pseudo: `${PSEUDO_HEAD}

@fa|function append(value)
@a1|    new_node = new Node(value)    # prev = next = NULL
@a2|    if head == NULL then
@a3|        head = new_node
    else
@a4|        temp = head
@a5|        while temp.next != NULL do
@a6|            temp = temp.next
        end while
@a7|        temp.next = new_node     # (1) last node -> new node
@a8|        new_node.prev = temp      # (2) new node -> last node
    end if
@fa_end|end function

${SHOW.pseudo}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fa|void append(int value) {
@a1|    Node* new_node = new Node{nullptr, value, nullptr};
@a2|    if (head == nullptr)
@a3|        head = new_node;
    else {
@a4|        Node* temp = head;
@a5|        while (temp->next != nullptr)
@a6|            temp = temp->next;
@a7|        temp->next = new_node;   // (1) last node -> new node
@a8|        new_node->prev = temp;    // (2) new node -> last node
    }
@fa_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@m1|    append({{a}});
@m2|    append({{b}});
@m3|    append({{c}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fa,fa_end|def append(value):
    global head
@a1|    new_node = Node(value)        # prev = next = None
@a2|    if head is None:
@a3|        head = new_node
    else:
@a4|        temp = head
@a5|        while temp.next is not None:
@a6|            temp = temp.next
@a7|        temp.next = new_node     # (1) last node -> new node
@a8|        new_node.prev = temp      # (2) new node -> last node

${SHOW.py}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
${MAIN_SHOW.py}`,
    notes: {
      a1: 'A new node with BOTH links empty: C++ `new Node{nullptr, value, nullptr}`, Python `Node(value)` (its __init__ sets prev and next to None), pseudocode `new Node(value)`.',
      a5: 'Walk to the last node along the next links.',
      a7: '**Link change (1)**: the forward link.',
      a8: '**Link change (2)**: the backward link. Forgetting this one leaves forward traversal working while backward traversal stops early.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'a8',
        why: 'The new node’s prev must point back to the old last node.',
        wrong: [
          { cpp: 'new_node->next = temp;', py: 'new_node.next = temp', pseudo: 'new_node.next = temp', why: 'That points the new node forward to the old last node — a two-node cycle.', tag: 'back-link' },
          { cpp: 'temp->prev = new_node;', py: 'temp.prev = new_node', pseudo: 'temp.prev = new_node', why: 'That breaks the old last node’s own backward link.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-beg',
    module: 'dll',
    structure: 'dll',
    title: 'Insert at the beginning (3 steps)',
    intro: '(1) new node → old first node, (2) old first node ← new node, (3) head → new node. Step (2) needs the old first node, so it must happen before head moves — and it must be skipped when the list is empty.',
    params: { x: 5 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_beginning(value)
@i1|    new_node = new Node(value)
@i2|    if head == NULL then
@i3|        head = new_node
    else
@i4|        new_node.next = head    # (1)
@i5|        head.prev = new_node     # (2)
@i6|        head = new_node          # (3)
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_beginning({{x}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_beginning(int value) {
@i1|    Node* new_node = new Node{nullptr, value, nullptr};
@i2|    if (head == nullptr)
@i3|        head = new_node;
    else {
@i4|        new_node->next = head;  // (1)
@i5|        head->prev = new_node;   // (2)
@i6|        head = new_node;         // (3)
    }
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_beginning({{x}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fi,fi_end|def insert_at_beginning(value):
    global head
@i1|    new_node = Node(value)
@i2|    if head is None:
@i3|        head = new_node
    else:
@i4|        new_node.next = head    # (1)
@i5|        head.prev = new_node     # (2)
@i6|        head = new_node          # (3)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_beginning({{x}})
${MAIN_SHOW.py}`,
    notes: {
      i4: '**(1)** The new node’s next link takes the old first node.',
      i5: '**(2)** The old first node’s prev link points back to the new node. On an empty list there is no old first node — `head->prev` would follow NULL — which is why the empty list is a separate case.',
      i6: '**(3)** head moves to the new node.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i5',
        why: 'The old first node must point back to the new node.',
        wrong: [
          { cpp: 'new_node->prev = head;', py: 'new_node.prev = head', pseudo: 'new_node.prev = head', why: 'The first node’s prev must stay NULL; this points it at the second node.', tag: 'back-link' },
          { cpp: 'head->next = new_node;', py: 'head.next = new_node', pseudo: 'head.next = new_node', why: 'That cuts the old first node off from the rest of the list.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-end',
    module: 'dll',
    structure: 'dll',
    title: 'Insert at the end (2 links)',
    intro: 'Walk temp to the last node, then (1) last node → new node and (2) new node ← last node. The new node’s next link is already NULL. An empty list has no last node, so it is a separate case.',
    params: { x: 40 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [10] } },
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
@i6|            temp = temp.next    # walk to the LAST node
        end while
@i7|        temp.next = new_node     # (1)
@i8|        new_node.prev = temp      # (2)
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_end({{x}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_end(int value) {
@i1|    Node* new_node = new Node{nullptr, value, nullptr};
@i2|    if (head == nullptr)
@i3|        head = new_node;
    else {
@i4|        Node* temp = head;
@i5|        while (temp->next != nullptr)
@i6|            temp = temp->next;  // walk to the LAST node
@i7|        temp->next = new_node;   // (1)
@i8|        new_node->prev = temp;    // (2)
    }
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_end({{x}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fi,fi_end|def insert_at_end(value):
    global head
@i1|    new_node = Node(value)
@i2|    if head is None:
@i3|        head = new_node
    else:
@i4|        temp = head
@i5|        while temp.next is not None:
@i6|            temp = temp.next    # walk to the LAST node
@i7|        temp.next = new_node     # (1)
@i8|        new_node.prev = temp      # (2)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_end({{x}})
${MAIN_SHOW.py}`,
    notes: {
      i1: 'A new node with prev = next = NULL / nullptr / None.',
      i2: 'Edge case: the empty list. The new node becomes the only node; both of its links stay NULL.',
      i5: 'Stop ON the last node: the one whose next link is NULL. (Edge case: with one node the loop does not run at all.)',
      i7: '**(1)** The old last node’s next link points to the new node.',
      i8: '**(2)** The new node’s prev link points back to the old last node. Forgetting this leaves forward traversal correct but breaks backward traversal — show_backward() would stop early.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i8',
        why: 'The new node must point back to the old last node.',
        wrong: [
          { cpp: 'temp->prev = new_node;', py: 'temp.prev = new_node', pseudo: 'temp.prev = new_node', why: 'That overwrites the old last node’s own back link: the list is broken backwards.', tag: 'back-link' },
          { cpp: 'new_node->next = temp;', py: 'new_node.next = temp', pseudo: 'new_node.next = temp', why: 'That makes a cycle between the last two nodes.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-pos',
    module: 'dll',
    structure: 'dll',
    title: 'Insert at a middle position (4 links)',
    intro: 'The new node goes between prev and temp. Four links change: the new node’s two links first (they don’t disturb the list), then the neighbours’ links to it.',
    params: { x: 40 },
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30] }, params: { pos: 2 } },
      { label: 'pos = 3', setup: { values: [10, 20, 30] }, params: { pos: 3 } },
      { label: 'pos = 5 (invalid)', setup: { values: [10, 20, 30] }, params: { pos: 5 } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function count_nodes(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.next
    end while
@c5|    return n
end function

@fi|function insert_at_position(value, pos)
@i1|    node_count = count_nodes(head)
@i2|    if pos > 1 and pos <= node_count then
@i3|        new_node = new Node(value)
@i4|        temp = head; prev = head; i = 1
@i5|        while i < pos do
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            i = i + 1
        end while
@i9|        new_node.prev = prev      # (1)
@i10|        new_node.next = temp     # (2)
@i11|        prev.next = new_node     # (3)
@i12|        temp.prev = new_node      # (4)
    else
@i13|        print "position", pos, "is not a middle position"
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_position({{x}}, {{pos}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fc|int count_nodes(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->next;
    }
@c5|    return n;
}

@fi|void insert_at_position(int value, int pos) {
@i1|    int node_count = count_nodes(head);
@i2|    if (pos > 1 && pos <= node_count) {
@i3|        Node* new_node = new Node{nullptr, value, nullptr};
@i4|        Node *temp = head, *prev = head;  int i = 1;
@i5|        while (i < pos) {
@i6|            prev = temp;
@i7|            temp = temp->next;
@i8|            i = i + 1;
        }
@i9|        new_node->prev = prev;    // (1)
@i10|        new_node->next = temp;   // (2)
@i11|        prev->next = new_node;   // (3)
@i12|        temp->prev = new_node;    // (4)
    } else
@i13|        cout << "position " << pos << " is not a middle position\\n";
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_position({{x}}, {{pos}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def count_nodes(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.next
@c5|    return n

@fi,fi_end|def insert_at_position(value, pos):
@i1|    node_count = count_nodes(head)
@i2|    if pos > 1 and pos <= node_count:
@i3|        new_node = Node(value)
@i4|        temp = prev = head; i = 1
@i5|        while i < pos:
@i6|            prev = temp
@i7|            temp = temp.next
@i8|            i = i + 1
@i9|        new_node.prev = prev      # (1)
@i10|        new_node.next = temp     # (2)
@i11|        prev.next = new_node     # (3)
@i12|        temp.prev = new_node      # (4)
    else:
@i13|        print("position", pos, "is not a middle position")

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_position({{x}}, {{pos}})
${MAIN_SHOW.py}`,
    notes: {
      i2: 'Middle positions are 2 … node_count; the check comes before allocating (no leak on a bad position).',
      i9: '**(1)** new node ← prev. The list itself is unchanged so far.',
      i10: '**(2)** new node → temp.',
      i11: '**(3)** prev → new node: the forward chain now goes through the new node.',
      i12: '**(4)** temp ← new node: the backward chain too. Any order works as long as (1)/(2) are not written after the neighbours have lost track of each other — try the “Which orders are valid?” exercise.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i12',
        why: 'The node at pos must point back to the new node.',
        wrong: [
          { cpp: 'temp->prev = prev;', py: 'temp.prev = prev', pseudo: 'temp.prev = prev', why: 'That is the old backward link: backward traversal would skip the new node.', tag: 'back-link' },
          { cpp: 'prev->prev = new_node;', py: 'prev.prev = new_node', pseudo: 'prev.prev = new_node', why: 'That breaks prev’s own backward link.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-delete-beg',
    module: 'dll',
    structure: 'dll',
    title: 'Delete at the beginning (with the one-node correction)',
    intro: 'temp = head; head = temp.next; then the new first node’s prev becomes NULL — but only if there IS a new first node. The notes write `head->prev = NULL` unconditionally, which follows NULL when the only node is deleted.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [7] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_beginning()
@x1|    if head == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = head                 # (1)
@x5|    head = temp.next           # (2)
@x6|    if head != NULL then        # correction: the list may now be empty
@x7|        head.prev = NULL        # (3)
    end if
@x8|    delete temp                  # (4)
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_beginning()
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_beginning() {
@x1|    if (head == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node* temp = head;          // (1)
@x5|    head = temp->next;         // (2)
@x6|    if (head != nullptr)        // correction: the list may now be empty
@x7|        head->prev = nullptr;   // (3)
@x8|    delete temp;                 // (4)
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_beginning();
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fx,fx_end|def delete_at_beginning():
    global head
@x1|    if head is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = head                 # (1)
@x5|    head = temp.next           # (2)
@x6|    if head is not None:        # correction: the list may now be empty
@x7|        head.prev = None        # (3)
@x8|    del temp                     # (4)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_beginning()
${MAIN_SHOW.py}`,
    notes: {
      x5: 'head moves to the second node (NULL if there was only one).',
      x6: '**Correction.** Only a non-empty list has a new first node whose prev link must be cleared.',
      x7: 'The new first node no longer has a node before it.',
      x8: 'Free the removed node (Python: the last reference disappears and the object is reclaimed).',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-delete-end',
    module: 'dll',
    structure: 'dll',
    title: 'Delete at the end (with the one-node correction)',
    intro: 'No prev pointer is needed: the node before the last one is `temp.prev`. The correction: with one node, `temp.prev` is NULL, so head must become NULL instead.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [7] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_end()
@x1|    if head == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = head
@x5|    while temp.next != NULL do
@x6|        temp = temp.next
    end while
@x7|    if temp.prev == NULL then    # correction: the only node
@x8|        head = NULL
    else
@x9|        temp.prev.next = NULL   # the previous node becomes the last
    end if
@x10|    delete temp
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_end()
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_end() {
@x1|    if (head == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node* temp = head;
@x5|    while (temp->next != nullptr)
@x6|        temp = temp->next;
@x7|    if (temp->prev == nullptr)   // correction: the only node
@x8|        head = nullptr;
    else
@x9|        temp->prev->next = nullptr;   // the previous node becomes the last
@x10|    delete temp;
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_end();
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fx,fx_end|def delete_at_end():
    global head
@x1|    if head is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = head
@x5|    while temp.next is not None:
@x6|        temp = temp.next
@x7|    if temp.prev is None:        # correction: the only node
@x8|        head = None
    else:
@x9|        temp.prev.next = None   # the previous node becomes the last
@x10|    del temp

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_end()
${MAIN_SHOW.py}`,
    notes: {
      x7: '**Correction.** The notes write `temp->prev->next = NULL` directly; with one node temp.prev is NULL and that line follows NULL (a crash in C++, an AttributeError in Python, a runtime error in the Lab).',
      x9: '`temp.prev` is the node before the last one: two hops in one expression — first to the previous node, then its next field.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-delete-pos',
    module: 'dll',
    structure: 'dll',
    title: 'Delete at a middle position',
    intro: 'For a middle node both neighbours exist, so two links change: the next node’s prev skips back over temp, and the previous node’s next skips forward over it.',
    params: {},
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30, 40] }, params: { pos: 2 } },
      { label: 'pos = 1 (not a middle position)', setup: { values: [10, 20, 30, 40] }, params: { pos: 1 } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function count_nodes(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.next
    end while
@c5|    return n
end function

@fx|function delete_at_position(pos)
@x1|    node_count = count_nodes(head)
@x2|    if pos > 1 and pos < node_count then
@x3|        temp = head; i = 1
@x4|        while i < pos do
@x5|            temp = temp.next
@x6|            i = i + 1
        end while
@x7|        temp.next.prev = temp.prev      # (1)
@x8|        temp.prev.next = temp.next     # (2)
@x9|        delete temp
    else
@x10|        print "Invalid position"
    end if
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_position({{pos}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fc|int count_nodes(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->next;
    }
@c5|    return n;
}

@fx|void delete_at_position(int pos) {
@x1|    int node_count = count_nodes(head);
@x2|    if (pos > 1 && pos < node_count) {
@x3|        Node* temp = head;  int i = 1;
@x4|        while (i < pos) {
@x5|            temp = temp->next;
@x6|            i = i + 1;
        }
@x7|        temp->next->prev = temp->prev;      // (1)
@x8|        temp->prev->next = temp->next;     // (2)
@x9|        delete temp;
    } else
@x10|        cout << "Invalid position\\n";
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_position({{pos}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def count_nodes(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.next
@c5|    return n

@fx,fx_end|def delete_at_position(pos):
@x1|    node_count = count_nodes(head)
@x2|    if pos > 1 and pos < node_count:
@x3|        temp = head; i = 1
@x4|        while i < pos:
@x5|            temp = temp.next
@x6|            i = i + 1
@x7|        temp.next.prev = temp.prev      # (1)
@x8|        temp.prev.next = temp.next     # (2)
@x9|        del temp
    else:
@x10|        print("Invalid position")

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_position({{pos}})
${MAIN_SHOW.py}`,
    notes: {
      x3: 'One walking pointer is enough: the node before temp is temp.prev.',
      x7: '**(1)** The node after temp points back to the node before temp.',
      x8: '**(2)** The node before temp points forward to the node after temp. temp is now skipped in both directions.',
      x9: 'Free it only after both links skip it.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-countnode',
    module: 'dll',
    structure: 'dll',
    title: 'Recursive count_nodes()',
    intro: 'count_nodes(p) = 0 for an empty list, otherwise 1 + count_nodes(the rest). Watch the call stack in the Variables panel: one frame per node plus one for NULL, and the additions happen on the way back out.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function count_nodes(p)
@c1|    if p == NULL then
@c2|        return 0                 # base case: an empty list
    else
@c3|        return 1 + count_nodes(p.next)
    end if
end function

@m1|total = count_nodes(head)
@m2|print total`,
    cpp: `${CPP_HEAD}

@fc|int count_nodes(Node* p) {
@c1|    if (p == nullptr)
@c2|        return 0;                // base case: an empty list
    else
@c3|        return 1 + count_nodes(p->next);
}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    int total = count_nodes(head);
@m2|    cout << total << "\\n";
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def count_nodes(p):
@c1|    if p is None:
@c2|        return 0                 # base case: an empty list
    else:
@c3|        return 1 + count_nodes(p.next)

${PY_SETUP}

@setup|{{build}}
@m1|total = count_nodes(head)
@m2|print(total)`,
    notes: {
      fc: 'A new call starts: it gets its own copy of p (a new frame on the call stack).',
      c1: 'Base case first: without it the recursion would never stop.',
      c2: 'The deepest call returns 0…',
      c3: '…and every call on the way back adds 1 to what the call below it returned.',
    },
  },
];
