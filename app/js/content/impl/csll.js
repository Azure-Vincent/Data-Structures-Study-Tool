// "Build it in code": circular singly linked lists (Lecture 11). See ./format.js.

const CPP_HEAD = `#include <iostream>
#include <initializer_list>
using namespace std;

struct Node {
    int data;
    Node* next;            // in a circle the last node's next is the FIRST node
};

Node* start = nullptr;`;

const CPP_SETUP = `// Setup: builds the starting circle shown in the diagram.
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{v, nullptr};
@setup|        if (last == nullptr) start = n; else last->next = n;
@setup|        last = n;
@setup|    }
@setup|    if (last != nullptr) last->next = start;   // close the circle
@setup|}

// Clean-up: open the circle, then free the nodes one by one.
@setup|void destroyList() {
@setup|    if (start == nullptr) return;
@setup|    Node* p = start->next;
@setup|    start->next = nullptr;
@setup|    while (p != nullptr) {
@setup|        Node* rest = p->next;
@setup|        delete p;
@setup|        p = rest;
@setup|    }
@setup|    start = nullptr;
@setup|}`;

const PY_HEAD = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None      # in a circle the last node's next is the FIRST node

start = None`;

const PY_SETUP = `# Setup: builds the starting circle shown in the diagram.
@setup|def build(values):
@setup|    global start
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        if last is None:
@setup|            start = n
@setup|        else:
@setup|            last.next = n
@setup|        last = n
@setup|    if last is not None:
@setup|        last.next = start     # close the circle`;

const PSEUDO_HEAD = `# Nodes have data and next; the last node's next is start (one node: itself).
# Starting circle: {{start}}`;

// one lap with a do-while (Lec 11 p.4)
const SHOW = {
  pseudo: `@fd|function display()
@d1|    if start == NULL then
@d2|        print "Empty list"
@d3|        return
    end if
@d4|    temp = start
    do
@d5|        print temp.data
@d6|        temp = temp.next
@d7|    while temp != start      # stop when we are back at start
@fd_end|end function`,
  cpp: `@fd|void display() {
@d1|    if (start == nullptr) {
@d2|        cout << "Empty list\\n";
@d3|        return;
    }
@d4|    Node* temp = start;
    do {
@d5|        cout << temp->data << "\\n";
@d6|        temp = temp->next;
@d7|    } while (temp != start);     // stop when we are back at start
@fd_end|}`,
  py: `@fd,fd_end|def display():
@d1|    if start is None:
@d2|        print("Empty list")
@d3|        return
@d4|    temp = start
    while True:                  # Python has no do-while: test at the bottom
@d5|        print(temp.data)
@d6|        temp = temp.next
@d7|        if temp is start: break  # stop when we are back at start`,
};

const SHOW_NOTES = {
  d4: 'No next field is NULL in a circle, so a loop that waits for NULL never ends.',
  d5: 'The body runs FIRST (a do-while): at the start temp == start, so a test at the top would stop before printing anything.',
  d7: 'One lap: stop as soon as temp is back on the first node. Python has no do-while, so the loop is `while True` with the test at the end of the body.',
};

export const CSLL_EXAMPLES = [
  {
    id: 'csll-create',
    lecture: 11,
    structure: 'csll',
    title: 'Create a circular list from scratch',
    ref: 'Lec 11 p.1–2',
    intro: 'Like appending to a singly linked list, except that the new last node must point back to start. Correction to the notes’ creation loop: it walks with `temp->next != NULL`, which never stops once the circle is closed; it must stop at `temp->next == start`.',
    params: { a: 10, b: 20, c: 30 },
    cases: [{ label: 'Build 10 → 20 → 30 → (back to 10)', setup: { values: [] } }],
    pseudo: `${PSEUDO_HEAD}

@fa|function append(value)
@a1|    newnode = new Node(value)
@a2|    if start == NULL then
@a3|        start = newnode
@a4|        newnode.next = start         # one node points to itself
    else
@a5|        temp = start
@a6|        while temp.next != start do  # corrected: the notes wait for NULL
@a7|            temp = temp.next
        end while
@a8|        temp.next = newnode          # (1)
@a9|        newnode.next = start         # (2) close the circle again
    end if
@fa_end|end function

${SHOW.pseudo}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    cpp: `${CPP_HEAD}

@fa|void append(int value) {
@a1|    Node* newnode = new Node{value, nullptr};
@a2|    if (start == nullptr) {
@a3|        start = newnode;
@a4|        newnode->next = start;       // one node points to itself
    } else {
@a5|        Node* temp = start;
@a6|        while (temp->next != start)  // corrected: the notes wait for NULL
@a7|            temp = temp->next;
@a8|        temp->next = newnode;        // (1)
@a9|        newnode->next = start;       // (2) close the circle again
    }
@fa_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@m1|    append({{a}});
@m2|    append({{b}});
@m3|    append({{c}});
@m4|    display();
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fa,fa_end|def append(value):
    global start
@a1|    newnode = Node(value)
@a2|    if start is None:
@a3|        start = newnode
@a4|        newnode.next = start         # one node points to itself
    else:
@a5|        temp = start
@a6|        while temp.next is not start:   # corrected: the notes wait for None
@a7|            temp = temp.next
@a8|        temp.next = newnode          # (1)
@a9|        newnode.next = start         # (2) close the circle again

${SHOW.py}

@m1|append({{a}})
@m2|append({{b}})
@m3|append({{c}})
@m4|display()`,
    notes: {
      a4: 'A one-node circle: the node’s next holds its OWN address.',
      a6: '**Correction.** The last node is the one whose next is start. Python compares identities with `is not`.',
      a8: '**(1)** The old last node links to the new node…',
      a9: '**(2)** …and the new node links back to start, so the list is a circle again.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'a6',
        why: 'In a circle the last node is the one whose next is start.',
        wrong: [
          { cpp: 'while (temp->next != nullptr)', py: 'while temp.next is not None:', pseudo: 'while temp.next != NULL do', why: 'That is the notes’ loop: no next is NULL in a circle, so it never ends.', tag: 'circular-null' },
          { cpp: 'while (temp != start)', py: 'while temp is not start:', pseudo: 'while temp != start do', why: 'temp starts AT start, so this loop never runs: the new node would be linked after the first node.', tag: 'loop-condition' },
        ],
      },
      {
        label: 'a9',
        why: 'The new last node must point back to the first node.',
        wrong: [
          { cpp: 'newnode->next = nullptr;', py: 'newnode.next = None', pseudo: 'newnode.next = NULL', why: 'That leaves the list open: it is no longer a circle.', tag: 'circle-not-closed' },
          { cpp: 'newnode->next = temp;', py: 'newnode.next = temp', pseudo: 'newnode.next = temp', why: 'That makes a two-node loop at the end and cuts the rest of the circle off.', tag: 'circle-not-closed' },
        ],
      },
    ],
  },
  {
    id: 'csll-insert-beg',
    lecture: 11,
    structure: 'csll',
    title: 'Insert at the beginning: the last node changes too',
    ref: 'Lec 11 p.2',
    intro: 'The new first node must be reachable from the LAST node, so the last node is found first; then (1) new node → old first, (2) start → new node, (3) last node → new start.',
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
@i4|        newnode.next = start
    else
@i5|        last = start
@i6|        while last.next != start do
@i7|            last = last.next
        end while
@i8|        newnode.next = start         # (1)
@i9|        start = newnode              # (2)
@i10|        last.next = start            # (3) close the circle again
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_beg({{x}})
@m2|display()`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_beg(int value) {
@i1|    Node* newnode = new Node{value, nullptr};
@i2|    if (start == nullptr) {
@i3|        start = newnode;
@i4|        newnode->next = start;
    } else {
@i5|        Node* last = start;
@i6|        while (last->next != start)
@i7|            last = last->next;
@i8|        newnode->next = start;       // (1)
@i9|        start = newnode;             // (2)
@i10|        last->next = start;          // (3) close the circle again
    }
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_beg({{x}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fi,fi_end|def insert_at_beg(value):
    global start
@i1|    newnode = Node(value)
@i2|    if start is None:
@i3|        start = newnode
@i4|        newnode.next = start
    else:
@i5|        last = start
@i6|        while last.next is not start:
@i7|            last = last.next
@i8|        newnode.next = start         # (1)
@i9|        start = newnode              # (2)
@i10|        last.next = start            # (3) close the circle again

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_beg({{x}})
@m2|display()`,
    notes: {
      i5: 'The last node’s next points at the first node — after the insertion that must be the NEW first node, so we need the last node.',
      i8: '**(1)** new node → old first node.',
      i9: '**(2)** start → new node.',
      i10: '**(3)** last node → new first node. Without this the old first node would still be where the circle “starts”, and the new node would be outside the circle.',
      ...SHOW_NOTES,
    },
    blanks: [
      {
        label: 'i10',
        why: 'The last node must point at the new first node.',
        wrong: [
          { cpp: 'last->next = newnode->next;', py: 'last.next = newnode.next', pseudo: 'last.next = newnode.next', why: 'newnode.next is the OLD first node: the circle would skip the new node.', tag: 'circle-not-closed' },
          { cpp: 'newnode->next = last;', py: 'newnode.next = last', pseudo: 'newnode.next = last', why: 'That undoes step (1) and breaks the circle.', tag: 'circle-not-closed' },
        ],
      },
    ],
  },
  {
    id: 'csll-insert-end',
    lecture: 11,
    structure: 'csll',
    title: 'Insert at the end',
    ref: 'Lec 11 p.2',
    intro: 'Find the last node (its next is start), link it to the new node, and point the new node back at start. start itself does not change.',
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
@i4|        newnode.next = start
    else
@i5|        temp = start
@i6|        while temp.next != start do
@i7|            temp = temp.next
        end while
@i8|        temp.next = newnode          # (1)
@i9|        newnode.next = start         # (2)
    end if
@fi_end|end function

${SHOW.pseudo}

@m1|insert_at_end({{x}})
@m2|display()`,
    cpp: `${CPP_HEAD}

@fi|void insert_at_end(int value) {
@i1|    Node* newnode = new Node{value, nullptr};
@i2|    if (start == nullptr) {
@i3|        start = newnode;
@i4|        newnode->next = start;
    } else {
@i5|        Node* temp = start;
@i6|        while (temp->next != start)
@i7|            temp = temp->next;
@i8|        temp->next = newnode;        // (1)
@i9|        newnode->next = start;       // (2)
    }
@fi_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    insert_at_end({{x}});
@m2|    display();
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fi,fi_end|def insert_at_end(value):
    global start
@i1|    newnode = Node(value)
@i2|    if start is None:
@i3|        start = newnode
@i4|        newnode.next = start
    else:
@i5|        temp = start
@i6|        while temp.next is not start:
@i7|            temp = temp.next
@i8|        temp.next = newnode          # (1)
@i9|        newnode.next = start         # (2)

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|insert_at_end({{x}})
@m2|display()`,
    notes: {
      i6: 'Stop ON the last node: the one whose next is start.',
      i8: '**(1)** The old last node now leads to the new node.',
      i9: '**(2)** The new node closes the circle.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'csll-delete-beg',
    lecture: 11,
    structure: 'csll',
    title: 'Delete at the beginning (free and one-node case made explicit)',
    ref: 'Lec 11 p.3',
    intro: 'Corrections to the notes: the removed node is never freed there, and the one-node case (a node pointing to itself) must empty the list.',
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
@x4|    if start.next == start then      # the only node
@x5|        delete start
@x6|        start = NULL
@x7|        return
    end if
@x8|    last = start; temp = start
@x9|    while last.next != start do
@x10|        last = last.next
    end while
@x11|    start = temp.next                # (1)
@x12|    last.next = start                # (2)
@x13|    delete temp                      # correction: the notes never free it
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_beg()
@m2|display()`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_beg() {
@x1|    if (start == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    if (start->next == start) {      // the only node
@x5|        delete start;
@x6|        start = nullptr;
@x7|        return;
    }
@x8|    Node *last = start, *temp = start;
@x9|    while (last->next != start)
@x10|        last = last->next;
@x11|    start = temp->next;              // (1)
@x12|    last->next = start;              // (2)
@x13|    delete temp;                     // correction: the notes never free it
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_beg();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fx,fx_end|def delete_at_beg():
    global start
@x1|    if start is None:
@x2|        print("Empty list")
@x3|        return
@x4|    if start.next is start:          # the only node
@x5|        start.next = None            # break its self-link …
@x6|        start = None                 # … and drop the reference: Python frees it
@x7|        return
@x8|    last = temp = start
@x9|    while last.next is not start:
@x10|        last = last.next
@x11|    start = temp.next                # (1)
@x12|    last.next = start                # (2)
@x13|    del temp                         # correction: the notes never free it

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_beg()
@m2|display()`,
    notes: {
      x4: 'One node: it points to itself.',
      x5: 'Free the node. In Python a node that refers to itself is still reclaimed once nothing else refers to it (Python’s collector also handles such cycles); clearing the self-link just makes that obvious.',
      x6: 'The list is empty now. Without this line start would keep a freed address (dangling).',
      x8: 'temp remembers the node to remove; last will walk to the last node.',
      x11: '**(1)** start moves to the second node.',
      x12: '**(2)** The last node must point at the NEW first node to keep the circle closed.',
      x13: '**Correction.** The notes cross temp out in the picture but never call free(temp): that leaks the node.',
      ...SHOW_NOTES,
    },
  },
  {
    id: 'csll-delete-end',
    lecture: 11,
    structure: 'csll',
    title: 'Delete at the end (with the one-node correction)',
    ref: 'Lec 11 p.3',
    intro: 'prev trails temp to the last node; prev then points back to start. With one node, temp == start and start must become NULL.',
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
@x4|    temp = start; prev = start
@x5|    while temp.next != start do
@x6|        prev = temp
@x7|        temp = temp.next
    end while
@x8|    if temp == start then            # the only node
@x9|        start = NULL
    else
@x10|        prev.next = start            # (1) the new last node closes the circle
    end if
@x11|    delete temp
@fx_end|end function

${SHOW.pseudo}

@m1|delete_at_end()
@m2|display()`,
    cpp: `${CPP_HEAD}

@fx|void delete_at_end() {
@x1|    if (start == nullptr) {
@x2|        cout << "Empty list\\n";
@x3|        return;
    }
@x4|    Node *temp = start, *prev = start;
@x5|    while (temp->next != start) {
@x6|        prev = temp;
@x7|        temp = temp->next;
    }
@x8|    if (temp == start)               // the only node
@x9|        start = nullptr;
    else
@x10|        prev->next = start;          // (1) the new last node closes the circle
@x11|    delete temp;
@fx_end|}

${SHOW.cpp}

${CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    delete_at_end();
@m2|    display();
@setup|    destroyList();
}`,
    py: `${PY_HEAD}

@fx,fx_end|def delete_at_end():
    global start
@x1|    if start is None:
@x2|        print("Empty list")
@x3|        return
@x4|    temp = prev = start
@x5|    while temp.next is not start:
@x6|        prev = temp
@x7|        temp = temp.next
@x8|    if temp is start:                # the only node
@x9|        start = None
    else:
@x10|        prev.next = start            # (1) the new last node closes the circle
@x11|    del temp

${SHOW.py}

${PY_SETUP}

@setup|{{build}}
@m1|delete_at_end()
@m2|display()`,
    notes: {
      x5: 'Walk until temp is the last node (its next is start).',
      x8: '**Correction.** One node: temp == prev == start. The notes set `prev->next = start` (the node points to itself again) and free it — start is left dangling.',
      x10: '**(1)** The node before the last one closes the circle.',
      ...SHOW_NOTES,
    },
  },
];
