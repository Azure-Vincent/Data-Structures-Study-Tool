// Line-for-line translations of every traced operation's code.
//
// The simulations execute the notes' C code (core/*.js); the code panel can
// show the same operation in C++, Python or pseudocode instead. Entry i of a
// translation corresponds to C line i, so the line the simulation highlights
// is highlighted in every language:
//   - a string   → one line,
//   - an array   → several lines (all highlighted together),
//   - null       → nothing in this language (e.g. a closing brace in Python).
//
// Conventions shared by all three languages (they match the lessons'
// "Build it in code" programs):
//   C++     struct Node with nullptr; getnode(value) = new Node{...}; delete
//   Python  class Node with None; Node(value); no free — an unreachable node is
//           reclaimed automatically, so `del temp` only drops the last name
//   Pseudo  the Pseudocode Lab language (docs/PSEUDOCODE.md): new Node(value),
//           p.next, NULL, delete p, print … — it parses in the Lab.

export const TRANSLATIONS = {
  // ------------------------------------------------------------ singly linked list (Lec 08–09)
  'sll.insertBeg': {
    cpp: ['Node* newnode = getnode(value);  // new Node, next = nullptr', 'if (start == nullptr)', '    start = newnode;', 'else {', '    newnode->next = start;    // (1) new node -> old first node', '    start = newnode;          // (2) start -> new node', '}'],
    py: ['newnode = Node(value)          # data = value, next = None', 'if start is None:', '    start = newnode', 'else:', '    newnode.next = start       # (1) new node -> old first node', '    start = newnode            # (2) start -> new node', null],
    pseudo: ['newnode = new Node(value)      # next = NULL', 'if start == NULL then', '    start = newnode', 'else', '    newnode.next = start       # (1) new node -> old first node', '    start = newnode            # (2) start -> new node', 'end if'],
  },
  'sll.insertEnd': {
    cpp: ['Node* newnode = getnode(value);', 'if (start == nullptr)', '    start = newnode;', 'else {', '    Node* temp = start;', '    while (temp->next != nullptr)', '        temp = temp->next;', '    temp->next = newnode;', '}'],
    py: ['newnode = Node(value)', 'if start is None:', '    start = newnode', 'else:', '    temp = start', '    while temp.next is not None:', '        temp = temp.next', '    temp.next = newnode', null],
    pseudo: ['newnode = new Node(value)', 'if start == NULL then', '    start = newnode', 'else', '    temp = start', '    while temp.next != NULL do', ['        temp = temp.next', '    end while'], '    temp.next = newnode', 'end if'],
  },
  'sll.insertMid': {
    cpp: ['int nodectr = countnode(start);', 'if (pos > 1 && pos <= nodectr) {   // corrected: notes use pos < nodectr', '    Node* newnode = getnode(value);  // corrected: allocate only after validating', '    Node *temp = start, *prev = start;  int ctr = 1;', '    while (ctr < pos) {', '        prev = temp;', '        temp = temp->next;', '        ctr++;', '    }', '    prev->next = newnode;          // (1)', '    newnode->next = temp;          // (2) safe: temp saved the rest', '} else', '    cout << "position " << pos << " is not a middle position\\n";'],
    py: ['nodectr = countnode(start)', 'if pos > 1 and pos <= nodectr:      # corrected: notes use pos < nodectr', '    newnode = Node(value)            # corrected: allocate only after validating', '    temp = prev = start; ctr = 1', '    while ctr < pos:', '        prev = temp', '        temp = temp.next', '        ctr += 1', null, '    prev.next = newnode              # (1)', '    newnode.next = temp              # (2) safe: temp saved the rest', 'else:', '    print("position", pos, "is not a middle position")'],
    pseudo: ['nodectr = countnode(start)', 'if pos > 1 and pos <= nodectr then  # corrected: notes use pos < nodectr', '    newnode = new Node(value)        # corrected: allocate only after validating', '    temp = start; prev = start; ctr = 1', '    while ctr < pos do', '        prev = temp', '        temp = temp.next', '        ctr = ctr + 1', '    end while', '    prev.next = newnode              # (1)', '    newnode.next = temp              # (2) safe: temp saved the rest', 'else', ['    print "position", pos, "is not a middle position"', 'end if']],
  },
  'sll.deleteBeg': {
    cpp: ['if (start == nullptr) {', '    cout << "No nodes exist\\n"; return;', '}', 'Node* temp = start;', 'start = temp->next;', 'delete temp;'],
    py: ['if start is None:', '    print("No nodes exist"); return', null, 'temp = start', 'start = temp.next', 'del temp        # the node is unreachable now: Python frees it'],
    pseudo: ['if start == NULL then', '    print "No nodes exist"; return', 'end if', 'temp = start', 'start = temp.next', 'delete temp'],
  },
  'sll.deleteEnd': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = start, *prev = start;', 'while (temp->next != nullptr) {', '    prev = temp;', '    temp = temp->next;', '}', 'if (temp == start)              // correction: only one node', '    start = nullptr;', 'else', '    prev->next = nullptr;', 'delete temp;'],
    py: ['if start is None: print("Empty list"); return', 'temp = prev = start', 'while temp.next is not None:', '    prev = temp', '    temp = temp.next', null, 'if temp is start:               # correction: only one node', '    start = None', 'else:', '    prev.next = None', 'del temp'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start; prev = start', 'while temp.next != NULL do', '    prev = temp', '    temp = temp.next', 'end while', 'if temp == start then           # correction: only one node', '    start = NULL', 'else', ['    prev.next = NULL', 'end if'], 'delete temp'],
  },
  'sll.deleteEndNotes': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = start, *prev = start;', 'while (temp->next != nullptr) {', '    prev = temp;', '    temp = temp->next;', '}', 'prev->next = nullptr;', 'delete temp;                    // start still holds this address!'],
    py: ['if start is None: print("Empty list"); return', 'temp = prev = start', 'while temp.next is not None:', '    prev = temp', '    temp = temp.next', null, 'prev.next = None', 'del temp        # start still refers to the node, so it is NOT removed'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start; prev = start', 'while temp.next != NULL do', '    prev = temp', '    temp = temp.next', 'end while', 'prev.next = NULL', 'delete temp                     # start still holds this address!'],
  },
  'sll.deleteMid': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'int nodectr = countnode(start);', 'if (pos > 1 && pos < nodectr) {', '    Node *temp = start, *prev = start;  int ctr = 1;', '    while (ctr < pos) {', '        prev = temp;', '        temp = temp->next;', '        ctr++;', '    }', '    prev->next = temp->next;     // bypass the node', '    delete temp;                 // then release it', '} else', '    cout << "Invalid position\\n";'],
    py: ['if start is None: print("Empty list"); return', 'nodectr = countnode(start)', 'if pos > 1 and pos < nodectr:', '    temp = prev = start; ctr = 1', '    while ctr < pos:', '        prev = temp', '        temp = temp.next', '        ctr += 1', null, '    prev.next = temp.next        # bypass the node', '    del temp                     # nothing refers to it now', 'else:', '    print("Invalid position")'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'nodectr = countnode(start)', 'if pos > 1 and pos < nodectr then', '    temp = start; prev = start; ctr = 1', '    while ctr < pos do', '        prev = temp', '        temp = temp.next', '        ctr = ctr + 1', '    end while', '    prev.next = temp.next        # bypass the node', '    delete temp                  # then release it', 'else', ['    print "Invalid position"', 'end if']],
  },
  'sll.traverse': {
    cpp: ['Node* temp = start;', 'if (start == nullptr) cout << "Empty list";', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->next;', '}'],
    py: ['temp = start', 'if start is None: print("Empty list")', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.next', null],
    pseudo: ['temp = start', 'if start == NULL then; print "Empty list"; end if', 'while temp != NULL do', '    print temp.data', '    temp = temp.next', 'end while'],
  },
  'sll.createList': {
    cpp: ['for (int i = 0; i < n; i++) {', '    Node* newnode = getnode(values[i]);', '    if (start == nullptr)', '        start = newnode;', '    else {', '        Node* temp = start;', '        while (temp->next != nullptr)', '            temp = temp->next;', '        temp->next = newnode;', '    }', '}'],
    py: ['for i in range(n):', '    newnode = Node(values[i])', '    if start is None:', '        start = newnode', '    else:', '        temp = start', '        while temp.next is not None:', '            temp = temp.next', '        temp.next = newnode', null, null],
    pseudo: ['for i = 0 to n - 1 do', '    newnode = new Node(values[i])', '    if start == NULL then', '        start = newnode', '    else', '        temp = start', '        while temp.next != NULL do', ['            temp = temp.next', '        end while'], '        temp.next = newnode', '    end if', 'end for'],
  },

  // ------------------------------------------------------------ doubly linked list (Lec 10)
  'dll.insertBeg': {
    cpp: ['Node* newnode = getnode(value);  // left = right = nullptr', 'if (start == nullptr)', '    start = newnode;', 'else {', '    newnode->right = start;     // (1)', '    start->left = newnode;      // (2)', '    start = newnode;            // (3)', '}'],
    py: ['newnode = Node(value)          # left = right = None', 'if start is None:', '    start = newnode', 'else:', '    newnode.right = start      # (1)', '    start.left = newnode       # (2)', '    start = newnode            # (3)', null],
    pseudo: ['newnode = new Node(value)      # left = right = NULL', 'if start == NULL then', '    start = newnode', 'else', '    newnode.right = start      # (1)', '    start.left = newnode       # (2)', '    start = newnode            # (3)', 'end if'],
  },
  'dll.insertEnd': {
    cpp: ['Node* newnode = getnode(value);', 'if (start == nullptr)', '    start = newnode;', 'else {', '    Node* temp = start;', '    while (temp->right != nullptr)', '        temp = temp->right;', '    temp->right = newnode;      // (1)', '    newnode->left = temp;       // (2)', '}'],
    py: ['newnode = Node(value)', 'if start is None:', '    start = newnode', 'else:', '    temp = start', '    while temp.right is not None:', '        temp = temp.right', '    temp.right = newnode       # (1)', '    newnode.left = temp        # (2)', null],
    pseudo: ['newnode = new Node(value)', 'if start == NULL then', '    start = newnode', 'else', '    temp = start', '    while temp.right != NULL do', ['        temp = temp.right', '    end while'], '    temp.right = newnode       # (1)', '    newnode.left = temp        # (2)', 'end if'],
  },
  'dll.insertMid': {
    cpp: ['int nodectr = countnode(start);', 'if (pos > 1 && pos <= nodectr) {', '    Node* newnode = getnode(value);', '    Node *temp = start, *prev = start;  int ctr = 1;', '    while (ctr < pos) {', '        prev = temp;', '        temp = temp->right;', '        ctr++;', '    }', '    newnode->left = prev;       // (1)', '    newnode->right = temp;      // (2)', '    prev->right = newnode;      // (3)', '    temp->left = newnode;       // (4)', '} else', '    cout << "position " << pos << " is not a middle position\\n";'],
    py: ['nodectr = countnode(start)', 'if pos > 1 and pos <= nodectr:', '    newnode = Node(value)', '    temp = prev = start; ctr = 1', '    while ctr < pos:', '        prev = temp', '        temp = temp.right', '        ctr += 1', null, '    newnode.left = prev        # (1)', '    newnode.right = temp       # (2)', '    prev.right = newnode       # (3)', '    temp.left = newnode        # (4)', 'else:', '    print("position", pos, "is not a middle position")'],
    pseudo: ['nodectr = countnode(start)', 'if pos > 1 and pos <= nodectr then', '    newnode = new Node(value)', '    temp = start; prev = start; ctr = 1', '    while ctr < pos do', '        prev = temp', '        temp = temp.right', '        ctr = ctr + 1', '    end while', '    newnode.left = prev        # (1)', '    newnode.right = temp       # (2)', '    prev.right = newnode       # (3)', '    temp.left = newnode        # (4)', 'else', ['    print "position", pos, "is not a middle position"', 'end if']],
  },
  'dll.deleteBeg': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = start;             // (1)', 'start = temp->right;            // (2)', 'if (start != nullptr)           // correction: list may now be empty', '    start->left = nullptr;      // (3)', 'delete temp;                    // (4)'],
    py: ['if start is None: print("Empty list"); return', 'temp = start                   # (1)', 'start = temp.right             # (2)', 'if start is not None:          # correction: list may now be empty', '    start.left = None          # (3)', 'del temp                       # (4) Python frees it'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start                   # (1)', 'start = temp.right             # (2)', 'if start != NULL then          # correction: list may now be empty', ['    start.left = NULL          # (3)', 'end if'], 'delete temp                    # (4)'],
  },
  'dll.deleteBegNotes': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = start;             // (1)', 'start = temp->right;            // (2)', 'start->left = nullptr;          // (3) crashes if start is now nullptr', 'delete temp;                    // (4)'],
    py: ['if start is None: print("Empty list"); return', 'temp = start                   # (1)', 'start = temp.right             # (2)', 'start.left = None              # (3) AttributeError if start is None', 'del temp                       # (4)'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start                   # (1)', 'start = temp.right             # (2)', 'start.left = NULL              # (3) runtime error if start is NULL', 'delete temp                    # (4)'],
  },
  'dll.deleteEnd': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = start;', 'while (temp->right != nullptr)', '    temp = temp->right;', 'if (temp->left == nullptr)      // correction: only one node', '    start = nullptr;', 'else', '    temp->left->right = nullptr;', 'delete temp;'],
    py: ['if start is None: print("Empty list"); return', 'temp = start', 'while temp.right is not None:', '    temp = temp.right', 'if temp.left is None:          # correction: only one node', '    start = None', 'else:', '    temp.left.right = None', 'del temp'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start', 'while temp.right != NULL do', ['    temp = temp.right', 'end while'], 'if temp.left == NULL then      # correction: only one node', '    start = NULL', 'else', ['    temp.left.right = NULL', 'end if'], 'delete temp'],
  },
  'dll.deleteMid': {
    cpp: ['int nodectr = countnode(start);', 'if (pos > 1 && pos < nodectr) {', '    Node* temp = start;  int i = 1;', '    while (i < pos) {', '        temp = temp->right;', '        i++;', '    }', '    temp->right->left = temp->left;   // (1)', '    temp->left->right = temp->right;  // (2)', '    delete temp;', '} else', '    cout << "Invalid position\\n";'],
    py: ['nodectr = countnode(start)', 'if pos > 1 and pos < nodectr:', '    temp = start; i = 1', '    while i < pos:', '        temp = temp.right', '        i += 1', null, '    temp.right.left = temp.left       # (1)', '    temp.left.right = temp.right      # (2)', '    del temp', 'else:', '    print("Invalid position")'],
    pseudo: ['nodectr = countnode(start)', 'if pos > 1 and pos < nodectr then', '    temp = start; i = 1', '    while i < pos do', '        temp = temp.right', '        i = i + 1', '    end while', '    temp.right.left = temp.left       # (1)', '    temp.left.right = temp.right      # (2)', '    delete temp', 'else', ['    print "Invalid position"', 'end if']],
  },
  'dll.traverseFwd': {
    cpp: ['Node* temp = start;', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->right;', '}'],
    py: ['temp = start', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.right', null],
    pseudo: ['temp = start', 'while temp != NULL do', '    print temp.data', '    temp = temp.right', 'end while'],
  },
  'dll.traverseBwd': {
    cpp: ['Node* temp = start;', 'if (temp == nullptr) return;', 'while (temp->right != nullptr)    // first go to the last node', '    temp = temp->right;', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->left;', '}'],
    py: ['temp = start', 'if temp is None: return', 'while temp.right is not None:    # first go to the last node', '    temp = temp.right', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.left', null],
    pseudo: ['temp = start', 'if temp == NULL then; return; end if', 'while temp.right != NULL do      # first go to the last node', ['    temp = temp.right', 'end while'], 'while temp != NULL do', '    print temp.data', '    temp = temp.left', 'end while'],
  },
  'dll.countnode': {
    cpp: ['int countnode(Node* start) {', '    if (start == nullptr)', '        return 0;', '    else', '        return 1 + countnode(start->right);', '}'],
    py: ['def countnode(start):', '    if start is None:', '        return 0', '    else:', '        return 1 + countnode(start.right)', null],
    pseudo: ['function countnode(start)', '    if start == NULL then', '        return 0', '    else', ['        return 1 + countnode(start.right)', '    end if'], 'end function'],
  },

  // ------------------------------------------------------------ circular singly linked list (Lec 11)
  'csll.insertBeg': {
    cpp: ['Node* newnode = getnode(value);', 'if (start == nullptr) {', '    start = newnode;', '    newnode->next = start;      // a single node points to itself', '} else {', '    Node* last = start;', '    while (last->next != start)', '        last = last->next;', '    newnode->next = start;      // (1)', '    start = newnode;            // (2)', '    last->next = start;         // (3) close the circle again', '}'],
    py: ['newnode = Node(value)', 'if start is None:', '    start = newnode', '    newnode.next = start       # a single node points to itself', 'else:', '    last = start', '    while last.next is not start:', '        last = last.next', '    newnode.next = start       # (1)', '    start = newnode            # (2)', '    last.next = start          # (3) close the circle again', null],
    pseudo: ['newnode = new Node(value)', 'if start == NULL then', '    start = newnode', '    newnode.next = start       # a single node points to itself', 'else', '    last = start', '    while last.next != start do', ['        last = last.next', '    end while'], '    newnode.next = start       # (1)', '    start = newnode            # (2)', '    last.next = start          # (3) close the circle again', 'end if'],
  },
  'csll.insertEnd': {
    cpp: ['Node* newnode = getnode(value);', 'if (start == nullptr) {', '    start = newnode;', '    newnode->next = start;', '} else {', '    Node* temp = start;', '    while (temp->next != start)', '        temp = temp->next;', '    temp->next = newnode;       // (1)', '    newnode->next = start;      // (2)', '}'],
    py: ['newnode = Node(value)', 'if start is None:', '    start = newnode', '    newnode.next = start', 'else:', '    temp = start', '    while temp.next is not start:', '        temp = temp.next', '    temp.next = newnode        # (1)', '    newnode.next = start       # (2)', null],
    pseudo: ['newnode = new Node(value)', 'if start == NULL then', '    start = newnode', '    newnode.next = start', 'else', '    temp = start', '    while temp.next != start do', ['        temp = temp.next', '    end while'], '    temp.next = newnode        # (1)', '    newnode.next = start       # (2)', 'end if'],
  },
  'csll.deleteBeg': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'if (start->next == start) {    // only one node', '    delete start;', '    start = nullptr;  return;', '}', 'Node *last = start, *temp = start;', 'while (last->next != start)', '    last = last->next;', 'start = temp->next;             // (1)', 'last->next = start;             // (2)', 'delete temp;                    // the notes cross temp out; free it explicitly'],
    py: ['if start is None: print("Empty list"); return', 'if start.next is start:        # only one node', '    pass                       # (nothing to free by hand in Python)', '    start = None; return', null, 'last = temp = start', 'while last.next is not start:', '    last = last.next', 'start = temp.next              # (1)', 'last.next = start              # (2)', 'del temp                       # unreachable now: Python frees it'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'if start.next == start then    # only one node', '    delete start', '    start = NULL; return', 'end if', 'last = start; temp = start', 'while last.next != start do', ['    last = last.next', 'end while'], 'start = temp.next              # (1)', 'last.next = start              # (2)', 'delete temp                    # the notes cross temp out; free it explicitly'],
  },
  'csll.deleteEnd': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = start, *prev = start;', 'while (temp->next != start) {', '    prev = temp;', '    temp = temp->next;', '}', 'if (temp == start)              // only one node', '    start = nullptr;', 'else', '    prev->next = start;         // (1)', 'delete temp;'],
    py: ['if start is None: print("Empty list"); return', 'temp = prev = start', 'while temp.next is not start:', '    prev = temp', '    temp = temp.next', null, 'if temp is start:              # only one node', '    start = None', 'else:', '    prev.next = start          # (1)', 'del temp'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start; prev = start', 'while temp.next != start do', '    prev = temp', '    temp = temp.next', 'end while', 'if temp == start then          # only one node', '    start = NULL', 'else', ['    prev.next = start          # (1)', 'end if'], 'delete temp'],
  },
  'csll.traverse': {
    cpp: ['if (start == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = start;', 'do {', '    cout << temp->data << " ";', '    temp = temp->next;', '} while (temp != start);'],
    py: ['if start is None: print("Empty list"); return', 'temp = start', 'while True:                    # Python has no do-while', '    print(temp.data, end=" ")', '    temp = temp.next', '    if temp is start: break'],
    pseudo: ['if start == NULL then; print "Empty list"; return; end if', 'temp = start', 'do', '    print temp.data', '    temp = temp.next', 'while temp != start'],
  },
  'csll.traverseNullBug': {
    cpp: ['Node* temp = start;', 'while (temp != nullptr) {       // never false in a circle!', '    cout << temp->data << " ";', '    temp = temp->next;', '}'],
    py: ['temp = start', 'while temp is not None:        # never false in a circle!', '    print(temp.data, end=" ")', '    temp = temp.next', null],
    pseudo: ['temp = start', 'while temp != NULL do          # never false in a circle!', '    print temp.data', '    temp = temp.next', 'end while'],
  },

  // ------------------------------------------------------------ array queue (Lec 12)
  'sq.aqueue.linear.enqueue': {
    cpp: ['if (R == MAX) { cout << "queue full\\n"; return; }', 'queue[R] = x;', 'R = R + 1;'],
    py: ['if R == MAX: print("queue full"); return', 'queue[R] = x', 'R = R + 1'],
    pseudo: ['if R == MAX then; print "queue full"; return; end if', 'queue[R] = x', 'R = R + 1'],
  },
  'sq.aqueue.linear.dequeue': {
    cpp: ['if (F == R) { cout << "queue empty\\n"; return; }', 'x = queue[F];', 'F = F + 1;'],
    py: ['if F == R: print("queue empty"); return', 'x = queue[F]', 'F = F + 1'],
    pseudo: ['if F == R then; print "queue empty"; return; end if', 'x = queue[F]', 'F = F + 1'],
  },
  'sq.aqueue.circular.enqueue': {
    cpp: ['if (count == MAX) { cout << "queue full\\n"; return; }', 'queue[R] = x;', 'R = (R + 1) % MAX;', 'count++;'],
    py: ['if count == MAX: print("queue full"); return', 'queue[R] = x', 'R = (R + 1) % MAX', 'count += 1'],
    pseudo: ['if count == MAX then; print "queue full"; return; end if', 'queue[R] = x', 'R = (R + 1) mod MAX', 'count = count + 1'],
  },
  'sq.aqueue.circular.dequeue': {
    cpp: ['if (count == 0) { cout << "queue empty\\n"; return; }', 'x = queue[F];', 'F = (F + 1) % MAX;', 'count--;'],
    py: ['if count == 0: print("queue empty"); return', 'x = queue[F]', 'F = (F + 1) % MAX', 'count -= 1'],
    pseudo: ['if count == 0 then; print "queue empty"; return; end if', 'x = queue[F]', 'F = (F + 1) mod MAX', 'count = count - 1'],
  },

  // ------------------------------------------------------------ array stack (Lec 12)
  'sq.astack.notes.push': {
    cpp: ['if (top == MAX) {', '    cout << "stack overflow\\n"; return;', '}', 'stack[top] = data;', '++top;              // top = top + 1'],
    py: ['if top == MAX:', '    print("stack overflow"); return', null, 'stack[top] = data', 'top += 1            # top = top + 1'],
    pseudo: ['if top == MAX then', '    print "stack overflow"; return', 'end if', 'stack[top] = data', 'top = top + 1'],
  },
  'sq.astack.notes.pop': {
    cpp: ['if (top == 0) {', '    cout << "stack underflow\\n"; return;', '}', 'x = stack[--top];   // decrement FIRST, then read'],
    py: ['if top == 0:', '    print("stack underflow"); return', null, 'top -= 1; x = stack[top]   # decrement FIRST, then read'],
    pseudo: ['if top == 0 then', '    print "stack underflow"; return', 'end if', 'top = top - 1; x = stack[top]   # decrement FIRST, then read'],
  },
  'sq.astack.notes.peek': {
    cpp: ['if (top == 0) { cout << "empty\\n"; return; }', 'return stack[top - 1];'],
    py: ['if top == 0: print("empty"); return', 'return stack[top - 1]'],
    pseudo: ['if top == 0 then; print "empty"; return; end if', 'return stack[top - 1]'],
  },
  'sq.astack.index.push': {
    cpp: ['if (top == MAX - 1) {', '    cout << "stack overflow\\n"; return;', '}', 'top = top + 1;', 'stack[top] = data;'],
    py: ['if top == MAX - 1:', '    print("stack overflow"); return', null, 'top = top + 1', 'stack[top] = data'],
    pseudo: ['if top == MAX - 1 then', '    print "stack overflow"; return', 'end if', 'top = top + 1', 'stack[top] = data'],
  },
  'sq.astack.index.pop': {
    cpp: ['if (top == -1) {', '    cout << "stack underflow\\n"; return;', '}', 'x = stack[top--];   // read, THEN decrement'],
    py: ['if top == -1:', '    print("stack underflow"); return', null, 'x = stack[top]; top -= 1   # read, THEN decrement'],
    pseudo: ['if top == -1 then', '    print "stack underflow"; return', 'end if', 'x = stack[top]; top = top - 1   # read, THEN decrement'],
  },
  'sq.astack.index.peek': {
    cpp: ['if (top == -1) { cout << "empty\\n"; return; }', 'return stack[top];'],
    py: ['if top == -1: print("empty"); return', 'return stack[top]'],
    pseudo: ['if top == -1 then; print "empty"; return; end if', 'return stack[top]'],
  },

  // ------------------------------------------------------------ linked stack and queue (Lec 12)
  'sq.linked.pushHead': {
    cpp: ['Node* newnode = getnode(x);', 'newnode->next = top;', 'top = newnode;'],
    py: ['newnode = Node(x)', 'newnode.next = top', 'top = newnode'],
    pseudo: ['newnode = new Node(x)', 'newnode.next = top', 'top = newnode'],
  },
  'sq.linked.popHead': {
    cpp: ['if (top == nullptr) { cout << "underflow\\n"; return; }', 'Node* temp = top;', 'top = top->next;', 'x = temp->data;  delete temp;'],
    py: ['if top is None: print("underflow"); return', 'temp = top', 'top = top.next', 'x = temp.data; del temp'],
    pseudo: ['if top == NULL then; print "underflow"; return; end if', 'temp = top', 'top = top.next', 'x = temp.data; delete temp'],
  },
  'sq.linked.pushTail': {
    cpp: ['Node* newnode = getnode(x);', 'if (start == nullptr)', '    start = top = newnode;', 'else {', '    top->next = newnode;', '    top = newnode;', '}'],
    py: ['newnode = Node(x)', 'if start is None:', '    start = top = newnode', 'else:', '    top.next = newnode', '    top = newnode', null],
    pseudo: ['newnode = new Node(x)', 'if start == NULL then', '    start = newnode; top = newnode', 'else', '    top.next = newnode', '    top = newnode', 'end if'],
  },
  'sq.linked.popTail': {
    cpp: ['if (top == nullptr) { cout << "underflow\\n"; return; }', 'if (start == top) {            // last item', '    x = top->data;  delete top;', '    start = top = nullptr;  return;', '}', 'Node* temp = start;', 'while (temp->next != top)     // must find the node BELOW top', '    temp = temp->next;', 'x = top->data;  delete top;', 'top = temp;', 'top->next = nullptr;'],
    py: ['if top is None: print("underflow"); return', 'if start is top:               # last item', '    x = top.data', '    start = top = None; return', null, 'temp = start', 'while temp.next is not top:    # must find the node BELOW top', '    temp = temp.next', 'x = top.data', 'top = temp', 'top.next = None                # the old top is unreachable: freed'],
    pseudo: ['if top == NULL then; print "underflow"; return; end if', 'if start == top then           # last item', '    x = top.data; delete top', '    start = NULL; top = NULL; return', 'end if', 'temp = start', 'while temp.next != top do      # must find the node BELOW top', ['    temp = temp.next', 'end while'], 'x = top.data; delete top', 'top = temp', 'top.next = NULL'],
  },
  'sq.linked.enqueue': {
    cpp: ['Node* newnode = getnode(x);', 'if (rear == nullptr)           // empty queue', '    front = rear = newnode;', 'else {', '    rear->next = newnode;', '    rear = newnode;', '}'],
    py: ['newnode = Node(x)', 'if rear is None:               # empty queue', '    front = rear = newnode', 'else:', '    rear.next = newnode', '    rear = newnode', null],
    pseudo: ['newnode = new Node(x)', 'if rear == NULL then           # empty queue', '    front = newnode; rear = newnode', 'else', '    rear.next = newnode', '    rear = newnode', 'end if'],
  },
  'sq.linked.dequeue': {
    cpp: ['if (front == nullptr) { cout << "underflow\\n"; return; }', 'Node* temp = front;', 'front = front->next;', 'if (front == nullptr)          // removed the final item', '    rear = nullptr;', 'x = temp->data;  delete temp;'],
    py: ['if front is None: print("underflow"); return', 'temp = front', 'front = front.next', 'if front is None:              # removed the final item', '    rear = None', 'x = temp.data; del temp'],
    pseudo: ['if front == NULL then; print "underflow"; return; end if', 'temp = front', 'front = front.next', 'if front == NULL then          # removed the final item', ['    rear = NULL', 'end if'], 'x = temp.data; delete temp'],
  },

  // ------------------------------------------------------------ tree traversals (Lec 14)
  'tree.preorder': {
    cpp: ['void preorder(Node* root) {', '    if (root == nullptr) return;', '    cout << root->data << " ";   // visit: output FIRST', '    preorder(root->left);', '    preorder(root->right);', '}'],
    py: ['def preorder(root):', '    if root is None: return', '    print(root.data, end=" ")     # visit: output FIRST', '    preorder(root.left)', '    preorder(root.right)', null],
    pseudo: ['function preorder(root)', '    if root == NULL then; return; end if', '    print root.data              # visit: output FIRST', '    preorder(root.left)', '    preorder(root.right)', 'end function'],
  },
  'tree.inorder': {
    cpp: ['void inorder(Node* root) {', '    if (root == nullptr) return;', '    inorder(root->left);', '    cout << root->data << " ";   // visit: output BETWEEN the subtrees', '    inorder(root->right);', '}'],
    py: ['def inorder(root):', '    if root is None: return', '    inorder(root.left)', '    print(root.data, end=" ")     # visit: output BETWEEN the subtrees', '    inorder(root.right)', null],
    pseudo: ['function inorder(root)', '    if root == NULL then; return; end if', '    inorder(root.left)', '    print root.data              # visit: output BETWEEN the subtrees', '    inorder(root.right)', 'end function'],
  },
  'tree.postorder': {
    cpp: ['void postorder(Node* root) {', '    if (root == nullptr) return;', '    postorder(root->left);', '    postorder(root->right);', '    cout << root->data << " ";   // visit: output LAST', '}'],
    py: ['def postorder(root):', '    if root is None: return', '    postorder(root.left)', '    postorder(root.right)', '    print(root.data, end=" ")     # visit: output LAST', null],
    pseudo: ['function postorder(root)', '    if root == NULL then; return; end if', '    postorder(root.left)', '    postorder(root.right)', '    print root.data              # visit: output LAST', 'end function'],
  },
  'tree.inorderStack': {
    cpp: ['Node* cur = root;', 'while (cur != nullptr || !isEmpty(S)) {', '    while (cur != nullptr) {     // go as far left as possible', '        push(S, cur);', '        cur = cur->left;', '    }', '    cur = pop(S);', '    cout << cur->data << " ";   // visit', '    cur = cur->right;', '}'],
    py: ['cur = root', 'while cur is not None or not is_empty(S):', '    while cur is not None:       # go as far left as possible', '        push(S, cur)', '        cur = cur.left', null, '    cur = pop(S)', '    print(cur.data, end=" ")    # visit', '    cur = cur.right', null],
    pseudo: ['cur = root', 'while cur != NULL or not isEmpty(S) do', '    while cur != NULL do         # go as far left as possible', '        push(S, cur)', '        cur = cur.left', '    end while', '    cur = pop(S)', '    print cur.data              # visit', '    cur = cur.right', 'end while'],
  },

  // ------------------------------------------------------------ graph traversals (Lec 14)
  // C++ and Python use the adjacency list of Lec 13 (each vertex's neighbours in
  // ascending order) and the queue / recursion of Lec 12; the Lab's built-in
  // neighbors(G, v) returns the same ascending list.
  'graph.bfs': {
    cpp: ['discovered[s] = true;  enqueue(Q, s);', 'while (!isEmpty(Q)) {', '    int v = dequeue(Q);  cout << name[v] << " ";', '    for (Edge* e = adj[v]; e != nullptr; e = e->next) {   // neighbours, ascending', '        int u = e->vertex;  if (!discovered[u]) {', '            discovered[u] = true;  enqueue(Q, u);', '        }', '    }', '    processed[v] = true;', '}'],
    py: ['discovered[s] = True; enqueue(Q, s)', 'while not is_empty(Q):', '    v = dequeue(Q); print(v, end=" ")', '    for u in adj[v]:                 # neighbours, ascending', '        if not discovered[u]:', '            discovered[u] = True; enqueue(Q, u)', null, null, '    processed[v] = True', null],
    pseudo: ['add(discovered, s); enqueue(Q, s)', 'while not isEmpty(Q) do', '    v = dequeue(Q); print v', '    for each u in neighbors(G, v) do   # neighbours, ascending', '        if not contains(discovered, u) then', '            add(discovered, u); enqueue(Q, u)', '        end if', '    end for', '    add(processed, v)', 'end while'],
  },
  'graph.dfs': {
    cpp: ['void DFS(int v) {', '    discovered[v] = true;  cout << name[v] << " ";', '    for (Edge* e = adj[v]; e != nullptr; e = e->next) {   // neighbours, ascending', '        if (!discovered[e->vertex])', '            DFS(e->vertex);          // go deeper', '    }', '    processed[v] = true;         // backtrack', '}'],
    py: ['def DFS(v):', '    discovered[v] = True; print(v, end=" ")', '    for u in adj[v]:                 # neighbours, ascending', '        if not discovered[u]:', '            DFS(u)                   # go deeper', null, '    processed[v] = True          # backtrack', null],
    pseudo: ['function DFS(v)', '    add(discovered, v); print v', '    for each u in neighbors(G, v) do   # neighbours, ascending', '        if not contains(discovered, u) then', ['            DFS(u)                   # go deeper', '        end if'], '    end for', '    add(processed, v)            # backtrack', 'end function'],
  },
  'graph.full': {
    cpp: ['for (int s = 0; s < V; s++) {', '    if (!discovered[s])', '        BFS(s);   // or DFS(s): one call per component', '}'],
    py: ['for s in vertices:', '    if not discovered[s]:', '        BFS(s)    # or DFS(s): one call per component', null],
    pseudo: ['for each s in vertices(G) do', '    if not contains(discovered, s) then', ['        BFS(s)    # or DFS(s): one call per component', '    end if'], 'end for'],
  },
};
