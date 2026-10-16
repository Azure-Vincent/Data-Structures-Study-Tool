// "Build it in code": doubly linked lists (Lecture 10). See ./format.js.
// The notes call the links left (previous) and right (next).

const CPP_HEAD = `#include <iostream>
#include <initializer_list>
using namespace std;

// left | data | right — two addresses per node.
struct Node {
    Node* left;            // the previous node (nullptr = none)
    int data;
    Node* right;           // the next node (nullptr = none)
};

Node* start = nullptr;`;

const CPP_SETUP = `// Setup: builds the starting list shown in the diagram (both directions linked).
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{last, v, nullptr};
@setup|        if (last == nullptr) start = n; else last->right = n;
@setup|        last = n;
@setup|    }
@setup|}

// Clean-up: give every node back before the program ends.
@setup|void destroyList() {
@setup|    while (start != nullptr) {
@setup|        Node* rest = start->right;
@setup|        delete start;
@setup|        start = rest;
@setup|    }
@setup|}`;

const PY_HEAD = `class Node:
    def __init__(self, data):
        self.left = None      # the previous node
        self.data = data
        self.right = None     # the next node

start = None`;

const PY_SETUP = `# Setup: builds the starting list shown in the diagram (both directions linked).
@setup|def build(values):
@setup|    global start
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        n.left = last
@setup|        if last is None:
@setup|            start = n
@setup|        else:
@setup|            last.right = n
@setup|        last = n`;

const PSEUDO_HEAD = `# Nodes have three fields: left, data, right (left = previous, right = next).
# Starting list: {{start}}`;

// forward and backward display
const SHOW = {
  pseudo: `@ff|function show_forward()
@f1|    temp = start
@f2|    while temp != NULL do
@f3|        print temp.data
@f4|        temp = temp.right
    end while
@ff_end|end function

@fb|function show_backward()
@b1|    if start == NULL then
@b2|        return
    end if
@b3|    temp = start
@b4|    while temp.right != NULL do
@b5|        temp = temp.right        # first go to the last node
    end while
@b6|    while temp != NULL do
@b7|        print temp.data
@b8|        temp = temp.left         # then follow the left links back
    end while
@fb_end|end function`,
  cpp: `@ff|void show_forward() {
@f1|    Node* temp = start;
@f2|    while (temp != nullptr) {
@f3|        cout << temp->data << "\\n";
@f4|        temp = temp->right;
    }
@ff_end|}

@fb|void show_backward() {
@b1|    if (start == nullptr)
@b2|        return;
@b3|    Node* temp = start;
@b4|    while (temp->right != nullptr)
@b5|        temp = temp->right;      // first go to the last node
@b6|    while (temp != nullptr) {
@b7|        cout << temp->data << "\\n";
@b8|        temp = temp->left;       // then follow the left links back
    }
@fb_end|}`,
  py: `@ff,ff_end|def show_forward():
@f1|    temp = start
@f2|    while temp is not None:
@f3|        print(temp.data)
@f4|        temp = temp.right

@fb,fb_end|def show_backward():
@b1|    if start is None:
@b2|        return
@b3|    temp = start
@b4|    while temp.right is not None:
@b5|        temp = temp.right        # first go to the last node
@b6|    while temp is not None:
@b7|        print(temp.data)
@b8|        temp = temp.left         # then follow the left links back`,
};

const SHOW_NOTES = {
  f1: 'Forward traversal follows the right links, exactly like a singly linked list.',
  f4: 'temp moves to the next node.',
  b4: 'To go backwards we first need the last node.',
  b8: 'Backward traversal follows the LEFT links. If any left link were wrong, the backward output would differ from the reversed forward output — a quick way to test a doubly linked list.',
};

const MAIN_SHOW = { pseudo: `@m8|show_forward()\n@m9|show_backward()`, cpp: `@m8|    show_forward();\n@m9|    show_backward();`, py: `@m8|show_forward()\n@m9|show_backward()` };

export const DLL_EXAMPLES = [
  {
    id: 'dll-create',
    lecture: 10,
    structure: 'dll',
    title: 'Create a doubly linked list from scratch',
    ref: 'Lec 10 p.1–3',
    intro: 'Each node has two links. Appending a node changes TWO links — the old last node’s right and the new node’s left — so that both directions stay consistent.',
    params: { a: 10, b: 20, c: 30 },
    cases: [{ label: 'Build 10 ⇄ 20 ⇄ 30', setup: { values: [] } }],
    pseudo: `${PSEUDO_HEAD}

@fa|function append(value)
@a1|    newnode = new Node(value)    # left = right = NULL
@a2|    if start == NULL then
@a3|        start = newnode
    else
@a4|        temp = start
@a5|        while temp.right != NULL do
@a6|            temp = temp.right
        end while
@a7|        temp.right = newnode     # (1) last node -> new node
@a8|        newnode.left = temp      # (2) new node -> last node
    end if
@fa_end|end function

${SHOW.pseudo}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fa|void append(int value) {
@a1|    Node* newnode = new Node{nullptr, value, nullptr};
@a2|    if (start == nullptr)
@a3|        start = newnode;
    else {
@a4|        Node* temp = start;
@a5|        while (temp->right != nullptr)
@a6|            temp = temp->right;
@a7|        temp->right = newnode;   // (1) last node -> new node
@a8|        newnode->left = temp;    // (2) new node -> last node
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
    global start
@a1|    newnode = Node(value)        # left = right = None
@a2|    if start is None:
@a3|        start = newnode
    else:
@a4|        temp = start
@a5|        while temp.right is not None:
@a6|            temp = temp.right
@a7|        temp.right = newnode     # (1) last node -> new node
@a8|        newnode.left = temp      # (2) new node -> last node

${SHOW.py}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
${MAIN_SHOW.py}`,
    notes: {
      a1: 'A new node with BOTH links empty: C++ `new Node{nullptr, value, nullptr}`, Python `Node(value)` (its __init__ sets left and right to None), pseudocode `new Node(value)`.',
      a5: 'Walk to the last node along the right links.',
      a7: '**Link change (1)**: the forward link.',
      a8: '**Link change (2)**: the backward link. Forgetting this one leaves forward traversal working while backward traversal stops early.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'a8',
        why: 'The new node’s left must point back to the old last node.',
        wrong: [
          { cpp: 'newnode->right = temp;', py: 'newnode.right = temp', pseudo: 'newnode.right = temp', why: 'That points the new node forward to the old last node — a two-node cycle.', tag: 'back-link' },
          { cpp: 'temp->left = newnode;', py: 'temp.left = newnode', pseudo: 'temp.left = newnode', why: 'That breaks the old last node’s own backward link.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-beg',
    lecture: 10,
    structure: 'dll',
    title: 'Insert at the beginning (3 steps)',
    ref: 'Lec 10 p.3',
    intro: '(1) new node → old first node, (2) old first node ← new node, (3) start → new node. Step (2) needs the old first node, so it must happen before start moves — and it must be skipped when the list is empty.',
    params: { x: 5 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_beg(value)
@i1|    newnode = new Node(value)
@i2|    if start == NULL then
@i3|        start = newnode
    else
@i4|        newnode.right = start    # (1)
@i5|        start.left = newnode     # (2)
@i6|        start = newnode          # (3)
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_beg({{x}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_beg(int value) {
@i1|    Node* newnode = new Node{nullptr, value, nullptr};
@i2|    if (start == nullptr)
@i3|        start = newnode;
    else {
@i4|        newnode->right = start;  // (1)
@i5|        start->left = newnode;   // (2)
@i6|        start = newnode;         // (3)
    }
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_beg({{x}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fi,fi_end|def insert_at_beg(value):
    global start
@i1|    newnode = Node(value)
@i2|    if start is None:
@i3|        start = newnode
    else:
@i4|        newnode.right = start    # (1)
@i5|        start.left = newnode     # (2)
@i6|        start = newnode          # (3)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_beg({{x}})
${MAIN_SHOW.py}`,
    notes: {
      i4: '**(1)** The new node’s right link takes the old first node.',
      i5: '**(2)** The old first node’s left link points back to the new node. On an empty list there is no old first node — `start->left` would follow NULL — which is why the empty list is a separate case.',
      i6: '**(3)** start moves to the new node.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i5',
        why: 'The old first node must point back to the new node.',
        wrong: [
          { cpp: 'newnode->left = start;', py: 'newnode.left = start', pseudo: 'newnode.left = start', why: 'The first node’s left must stay NULL; this points it at the second node.', tag: 'back-link' },
          { cpp: 'start->right = newnode;', py: 'start.right = newnode', pseudo: 'start.right = newnode', why: 'That cuts the old first node off from the rest of the list.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-end',
    lecture: 10,
    structure: 'dll',
    title: 'Insert at the end (2 links)',
    ref: 'Lec 10 p.3',
    intro: 'Walk temp to the last node, then (1) last node → new node and (2) new node ← last node. The new node’s right link is already NULL. An empty list has no last node, so it is a separate case.',
    params: { x: 40 },
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [10] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fi|function insert_at_end(value)
@i1|    newnode = new Node(value)
@i2|    if start == NULL then
@i3|        start = newnode
    else
@i4|        temp = start
@i5|        while temp.right != NULL do
@i6|            temp = temp.right    # walk to the LAST node
        end while
@i7|        temp.right = newnode     # (1)
@i8|        newnode.left = temp      # (2)
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_end({{x}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_end(int value) {
@i1|    Node* newnode = new Node{nullptr, value, nullptr};
@i2|    if (start == nullptr)
@i3|        start = newnode;
    else {
@i4|        Node* temp = start;
@i5|        while (temp->right != nullptr)
@i6|            temp = temp->right;  // walk to the LAST node
@i7|        temp->right = newnode;   // (1)
@i8|        newnode->left = temp;    // (2)
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
    global start
@i1|    newnode = Node(value)
@i2|    if start is None:
@i3|        start = newnode
    else:
@i4|        temp = start
@i5|        while temp.right is not None:
@i6|            temp = temp.right    # walk to the LAST node
@i7|        temp.right = newnode     # (1)
@i8|        newnode.left = temp      # (2)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_end({{x}})
${MAIN_SHOW.py}`,
    notes: {
      i1: 'A new node with left = right = NULL / nullptr / None.',
      i2: 'Edge case: the empty list. The new node becomes the only node; both of its links stay NULL.',
      i5: 'Stop ON the last node: the one whose right link is NULL. (Edge case: with one node the loop does not run at all.)',
      i7: '**(1)** The old last node’s right link points to the new node.',
      i8: '**(2)** The new node’s left link points back to the old last node. Forgetting this leaves forward traversal correct but breaks backward traversal — show_backward() would stop early.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i8',
        why: 'The new node must point back to the old last node.',
        wrong: [
          { cpp: 'temp->left = newnode;', py: 'temp.left = newnode', pseudo: 'temp.left = newnode', why: 'That overwrites the old last node’s own back link: the list is broken backwards.', tag: 'back-link' },
          { cpp: 'newnode->right = temp;', py: 'newnode.right = temp', pseudo: 'newnode.right = temp', why: 'That makes a cycle between the last two nodes.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-insert-pos',
    lecture: 10,
    structure: 'dll',
    title: 'Insert at a middle position (4 links)',
    ref: 'Lec 10 p.4',
    intro: 'The new node goes between prev and temp. Four links change: the new node’s two links first (they don’t disturb the list), then the neighbours’ links to it.',
    params: { x: 40 },
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30] }, params: { pos: 2 } },
      { label: 'pos = 3', setup: { values: [10, 20, 30] }, params: { pos: 3 } },
      { label: 'pos = 5 (invalid)', setup: { values: [10, 20, 30] }, params: { pos: 5 } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function countnode(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.right
    end while
@c5|    return n
end function

@fi|function insert_at_mid(value, pos)
@i1|    nodectr = countnode(start)
@i2|    if pos > 1 and pos <= nodectr then
@i3|        newnode = new Node(value)
@i4|        temp = start; prev = start; ctr = 1
@i5|        while ctr < pos do
@i6|            prev = temp
@i7|            temp = temp.right
@i8|            ctr = ctr + 1
        end while
@i9|        newnode.left = prev      # (1)
@i10|        newnode.right = temp     # (2)
@i11|        prev.right = newnode     # (3)
@i12|        temp.left = newnode      # (4)
    else
@i13|        print "position", pos, "is not a middle position"
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_mid({{x}}, {{pos}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fc|int countnode(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->right;
    }
@c5|    return n;
}

@fi|void insert_at_mid(int value, int pos) {
@i1|    int nodectr = countnode(start);
@i2|    if (pos > 1 && pos <= nodectr) {
@i3|        Node* newnode = new Node{nullptr, value, nullptr};
@i4|        Node *temp = start, *prev = start;  int ctr = 1;
@i5|        while (ctr < pos) {
@i6|            prev = temp;
@i7|            temp = temp->right;
@i8|            ctr = ctr + 1;
        }
@i9|        newnode->left = prev;    // (1)
@i10|        newnode->right = temp;   // (2)
@i11|        prev->right = newnode;   // (3)
@i12|        temp->left = newnode;    // (4)
    } else
@i13|        cout << "position " << pos << " is not a middle position\\n";
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_mid({{x}}, {{pos}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def countnode(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.right
@c5|    return n

@fi,fi_end|def insert_at_mid(value, pos):
@i1|    nodectr = countnode(start)
@i2|    if pos > 1 and pos <= nodectr:
@i3|        newnode = Node(value)
@i4|        temp = prev = start; ctr = 1
@i5|        while ctr < pos:
@i6|            prev = temp
@i7|            temp = temp.right
@i8|            ctr = ctr + 1
@i9|        newnode.left = prev      # (1)
@i10|        newnode.right = temp     # (2)
@i11|        prev.right = newnode     # (3)
@i12|        temp.left = newnode      # (4)
    else:
@i13|        print("position", pos, "is not a middle position")

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_mid({{x}}, {{pos}})
${MAIN_SHOW.py}`,
    notes: {
      i2: 'Middle positions are 2 … nodectr; the check comes before allocating (no leak on a bad position).',
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
          { cpp: 'temp->left = prev;', py: 'temp.left = prev', pseudo: 'temp.left = prev', why: 'That is the old backward link: backward traversal would skip the new node.', tag: 'back-link' },
          { cpp: 'prev->left = newnode;', py: 'prev.left = newnode', pseudo: 'prev.left = newnode', why: 'That breaks prev’s own backward link.', tag: 'back-link' },
        ],
      },
    ],
  },
  {
    id: 'dll-delete-beg',
    lecture: 10,
    structure: 'dll',
    title: 'Delete at the beginning (with the one-node correction)',
    ref: 'Lec 10 p.5',
    intro: 'temp = start; start = temp.right; then the new first node’s left becomes NULL — but only if there IS a new first node. The notes write `start->left = NULL` unconditionally, which follows NULL when the only node is deleted.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [7] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_beg()
@x1|    if start == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = start                 # (1)
@x5|    start = temp.right           # (2)
@x6|    if start != NULL then        # correction: the list may now be empty
@x7|        start.left = NULL        # (3)
    end if
@x8|    delete temp                  # (4)
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_beg()
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_beg() {
@x1|    if (start == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node* temp = start;          // (1)
@x5|    start = temp->right;         // (2)
@x6|    if (start != nullptr)        // correction: the list may now be empty
@x7|        start->left = nullptr;   // (3)
@x8|    delete temp;                 // (4)
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_beg();
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fx,fx_end|def delete_at_beg():
    global start
@x1|    if start is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = start                 # (1)
@x5|    start = temp.right           # (2)
@x6|    if start is not None:        # correction: the list may now be empty
@x7|        start.left = None        # (3)
@x8|    del temp                     # (4)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_beg()
${MAIN_SHOW.py}`,
    notes: {
      x5: 'start moves to the second node (NULL if there was only one).',
      x6: '**Correction.** Only a non-empty list has a new first node whose left link must be cleared.',
      x7: 'The new first node no longer has a node before it.',
      x8: 'Free the removed node (Python: the last reference disappears and the object is reclaimed).',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-delete-end',
    lecture: 10,
    structure: 'dll',
    title: 'Delete at the end (with the one-node correction)',
    ref: 'Lec 10 p.5',
    intro: 'No prev pointer is needed: the node before the last one is `temp.left`. The correction: with one node, `temp.left` is NULL, so start must become NULL instead.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'One node', setup: { values: [7] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fx|function delete_at_end()
@x1|    if start == NULL then
@x2|        print "Empty list"
@x3|        return
    end if
@x4|    temp = start
@x5|    while temp.right != NULL do
@x6|        temp = temp.right
    end while
@x7|    if temp.left == NULL then    # correction: the only node
@x8|        start = NULL
    else
@x9|        temp.left.right = NULL   # the previous node becomes the last
    end if
@x10|    delete temp
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_end()
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_end() {
@x1|    if (start == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node* temp = start;
@x5|    while (temp->right != nullptr)
@x6|        temp = temp->right;
@x7|    if (temp->left == nullptr)   // correction: the only node
@x8|        start = nullptr;
    else
@x9|        temp->left->right = nullptr;   // the previous node becomes the last
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
    global start
@x1|    if start is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = start
@x5|    while temp.right is not None:
@x6|        temp = temp.right
@x7|    if temp.left is None:        # correction: the only node
@x8|        start = None
    else:
@x9|        temp.left.right = None   # the previous node becomes the last
@x10|    del temp

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_end()
${MAIN_SHOW.py}`,
    notes: {
      x7: '**Correction.** The notes write `temp->left->right = NULL` directly; with one node temp.left is NULL and that line follows NULL (a crash in C++, an AttributeError in Python, a runtime error in the Lab).',
      x9: '`temp.left` is the node before the last one: two hops in one expression — first to the previous node, then its right field.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-delete-pos',
    lecture: 10,
    structure: 'dll',
    title: 'Delete at a middle position',
    ref: 'Lec 10 p.6',
    intro: 'For a middle node both neighbours exist, so two links change: the next node’s left skips back over temp, and the previous node’s right skips forward over it.',
    params: {},
    cases: [
      { label: 'pos = 2', setup: { values: [10, 20, 30, 40] }, params: { pos: 2 } },
      { label: 'pos = 1 (not a middle position)', setup: { values: [10, 20, 30, 40] }, params: { pos: 1 } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function countnode(p)
@c1|    n = 0
@c2|    while p != NULL do
@c3|        n = n + 1
@c4|        p = p.right
    end while
@c5|    return n
end function

@fx|function delete_at_mid(pos)
@x1|    nodectr = countnode(start)
@x2|    if pos > 1 and pos < nodectr then
@x3|        temp = start; i = 1
@x4|        while i < pos do
@x5|            temp = temp.right
@x6|            i = i + 1
        end while
@x7|        temp.right.left = temp.left      # (1)
@x8|        temp.left.right = temp.right     # (2)
@x9|        delete temp
    else
@x10|        print "Invalid position"
    end if
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_mid({{pos}})
${MAIN_SHOW.pseudo}`,
    cpp: `${CPP_HEAD}

@fc|int countnode(Node* p) {
@c1|    int n = 0;
@c2|    while (p != nullptr) {
@c3|        n = n + 1;
@c4|        p = p->right;
    }
@c5|    return n;
}

@fx|void delete_at_mid(int pos) {
@x1|    int nodectr = countnode(start);
@x2|    if (pos > 1 && pos < nodectr) {
@x3|        Node* temp = start;  int i = 1;
@x4|        while (i < pos) {
@x5|            temp = temp->right;
@x6|            i = i + 1;
        }
@x7|        temp->right->left = temp->left;      // (1)
@x8|        temp->left->right = temp->right;     // (2)
@x9|        delete temp;
    } else
@x10|        cout << "Invalid position\\n";
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_mid({{pos}});
${MAIN_SHOW.cpp}
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def countnode(p):
@c1|    n = 0
@c2|    while p is not None:
@c3|        n = n + 1
@c4|        p = p.right
@c5|    return n

@fx,fx_end|def delete_at_mid(pos):
@x1|    nodectr = countnode(start)
@x2|    if pos > 1 and pos < nodectr:
@x3|        temp = start; i = 1
@x4|        while i < pos:
@x5|            temp = temp.right
@x6|            i = i + 1
@x7|        temp.right.left = temp.left      # (1)
@x8|        temp.left.right = temp.right     # (2)
@x9|        del temp
    else:
@x10|        print("Invalid position")

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_mid({{pos}})
${MAIN_SHOW.py}`,
    notes: {
      x3: 'One walking pointer is enough: the node before temp is temp.left.',
      x7: '**(1)** The node after temp points back to the node before temp.',
      x8: '**(2)** The node before temp points forward to the node after temp. temp is now skipped in both directions.',
      x9: 'Free it only after both links skip it.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'dll-countnode',
    lecture: 10,
    structure: 'dll',
    title: 'Recursive countnode()',
    ref: 'Lec 10 p.7',
    intro: 'countnode(p) = 0 for an empty list, otherwise 1 + countnode(the rest). Watch the call stack in the Variables panel: one frame per node plus one for NULL, and the additions happen on the way back out.',
    params: {},
    cases: [
      { label: 'Three nodes', setup: { values: [10, 20, 30] } },
      { label: 'Empty list', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fc|function countnode(p)
@c1|    if p == NULL then
@c2|        return 0                 # base case: an empty list
    else
@c3|        return 1 + countnode(p.right)
    end if
end function

@m1|total = countnode(start)
@m2|print total`,
    cpp: `${CPP_HEAD}

@fc|int countnode(Node* p) {
@c1|    if (p == nullptr)
@c2|        return 0;                // base case: an empty list
    else
@c3|        return 1 + countnode(p->right);
}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    int total = countnode(start);
@m2|    cout << total << "\\n";
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fc|def countnode(p):
@c1|    if p is None:
@c2|        return 0                 # base case: an empty list
    else:
@c3|        return 1 + countnode(p.right)

${PY_SETUP}

@setup|{{build}}
@m1|total = countnode(start)
@m2|print(total)`,
    notes: {
      fc: 'A new call starts: it gets its own copy of p (a new frame on the call stack).',
      c1: 'Base case first: without it the recursion would never stop.',
      c2: 'The deepest call returns 0…',
      c3: '…and every call on the way back adds 1 to what the call below it returned.',
    },
  },
];
