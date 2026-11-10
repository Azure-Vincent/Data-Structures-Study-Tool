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
//   C++     struct Node with nullptr; create_node(value) = new Node{...}; delete
//   Python  class Node with None; Node(value); no free — an unreachable node is
//           reclaimed automatically, so `del temp` only drops the last name
//   Pseudo  the Pseudocode Lab language (docs/PSEUDOCODE.md): new Node(value),
//           p.next, NULL, delete p, print … — it parses in the Lab.

export const TRANSLATIONS = {
  // ------------------------------------------------------------ singly linked list (Lec 08–09)
  'sll.insertBeg': {
    cpp: ['Node* new_node = create_node(value);  // new Node, next = nullptr', 'if (head == nullptr)', '    head = new_node;', 'else {', '    new_node->next = head;    // (1) new node -> old first node', '    head = new_node;          // (2) head -> new node', '}'],
    py: ['new_node = Node(value)          # data = value, next = None', 'if head is None:', '    head = new_node', 'else:', '    new_node.next = head       # (1) new node -> old first node', '    head = new_node            # (2) head -> new node', null],
    pseudo: ['new_node = new Node(value)      # next = NULL', 'if head == NULL then', '    head = new_node', 'else', '    new_node.next = head       # (1) new node -> old first node', '    head = new_node            # (2) head -> new node', 'end if'],
  },
  'sll.insertEnd': {
    cpp: ['Node* new_node = create_node(value);', 'if (head == nullptr)', '    head = new_node;', 'else {', '    Node* temp = head;', '    while (temp->next != nullptr)', '        temp = temp->next;', '    temp->next = new_node;', '}'],
    py: ['new_node = Node(value)', 'if head is None:', '    head = new_node', 'else:', '    temp = head', '    while temp.next is not None:', '        temp = temp.next', '    temp.next = new_node', null],
    pseudo: ['new_node = new Node(value)', 'if head == NULL then', '    head = new_node', 'else', '    temp = head', '    while temp.next != NULL do', ['        temp = temp.next', '    end while'], '    temp.next = new_node', 'end if'],
  },
  'sll.insertMid': {
    cpp: ['int node_count = count_nodes(head);', 'if (pos > 1 && pos <= node_count) {   // corrected: notes use pos < node_count', '    Node* new_node = create_node(value);  // corrected: allocate only after validating', '    Node *temp = head, *prev = head;  int i = 1;', '    while (i < pos) {', '        prev = temp;', '        temp = temp->next;', '        i++;', '    }', '    prev->next = new_node;          // (1)', '    new_node->next = temp;          // (2) safe: temp saved the rest', '} else', '    cout << "position " << pos << " is not a middle position\\n";'],
    py: ['node_count = count_nodes(head)', 'if pos > 1 and pos <= node_count:      # corrected: notes use pos < node_count', '    new_node = Node(value)            # corrected: allocate only after validating', '    temp = prev = head; i = 1', '    while i < pos:', '        prev = temp', '        temp = temp.next', '        i += 1', null, '    prev.next = new_node              # (1)', '    new_node.next = temp              # (2) safe: temp saved the rest', 'else:', '    print("position", pos, "is not a middle position")'],
    pseudo: ['node_count = count_nodes(head)', 'if pos > 1 and pos <= node_count then  # corrected: notes use pos < node_count', '    new_node = new Node(value)        # corrected: allocate only after validating', '    temp = head; prev = head; i = 1', '    while i < pos do', '        prev = temp', '        temp = temp.next', '        i = i + 1', '    end while', '    prev.next = new_node              # (1)', '    new_node.next = temp              # (2) safe: temp saved the rest', 'else', ['    print "position", pos, "is not a middle position"', 'end if']],
  },
  'sll.deleteBeg': {
    cpp: ['if (head == nullptr) {', '    cout << "No nodes exist\\n"; return;', '}', 'Node* temp = head;', 'head = temp->next;', 'delete temp;'],
    py: ['if head is None:', '    print("No nodes exist"); return', null, 'temp = head', 'head = temp.next', 'del temp        # the node is unreachable now: Python frees it'],
    pseudo: ['if head == NULL then', '    print "No nodes exist"; return', 'end if', 'temp = head', 'head = temp.next', 'delete temp'],
  },
  'sll.deleteEnd': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = head, *prev = head;', 'while (temp->next != nullptr) {', '    prev = temp;', '    temp = temp->next;', '}', 'if (temp == head)              // correction: only one node', '    head = nullptr;', 'else', '    prev->next = nullptr;', 'delete temp;'],
    py: ['if head is None: print("Empty list"); return', 'temp = prev = head', 'while temp.next is not None:', '    prev = temp', '    temp = temp.next', null, 'if temp is head:               # correction: only one node', '    head = None', 'else:', '    prev.next = None', 'del temp'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head; prev = head', 'while temp.next != NULL do', '    prev = temp', '    temp = temp.next', 'end while', 'if temp == head then           # correction: only one node', '    head = NULL', 'else', ['    prev.next = NULL', 'end if'], 'delete temp'],
  },
  'sll.deleteEndNotes': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = head, *prev = head;', 'while (temp->next != nullptr) {', '    prev = temp;', '    temp = temp->next;', '}', 'prev->next = nullptr;', 'delete temp;                    // head still holds this address!'],
    py: ['if head is None: print("Empty list"); return', 'temp = prev = head', 'while temp.next is not None:', '    prev = temp', '    temp = temp.next', null, 'prev.next = None', 'del temp        # head still refers to the node, so it is NOT removed'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head; prev = head', 'while temp.next != NULL do', '    prev = temp', '    temp = temp.next', 'end while', 'prev.next = NULL', 'delete temp                     # head still holds this address!'],
  },
  'sll.deleteMid': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'int node_count = count_nodes(head);', 'if (pos > 1 && pos < node_count) {', '    Node *temp = head, *prev = head;  int i = 1;', '    while (i < pos) {', '        prev = temp;', '        temp = temp->next;', '        i++;', '    }', '    prev->next = temp->next;     // bypass the node', '    delete temp;                 // then release it', '} else', '    cout << "Invalid position\\n";'],
    py: ['if head is None: print("Empty list"); return', 'node_count = count_nodes(head)', 'if pos > 1 and pos < node_count:', '    temp = prev = head; i = 1', '    while i < pos:', '        prev = temp', '        temp = temp.next', '        i += 1', null, '    prev.next = temp.next        # bypass the node', '    del temp                     # nothing refers to it now', 'else:', '    print("Invalid position")'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'node_count = count_nodes(head)', 'if pos > 1 and pos < node_count then', '    temp = head; prev = head; i = 1', '    while i < pos do', '        prev = temp', '        temp = temp.next', '        i = i + 1', '    end while', '    prev.next = temp.next        # bypass the node', '    delete temp                  # then release it', 'else', ['    print "Invalid position"', 'end if']],
  },
  'sll.traverse': {
    cpp: ['Node* temp = head;', 'if (head == nullptr) cout << "Empty list";', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->next;', '}'],
    py: ['temp = head', 'if head is None: print("Empty list")', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.next', null],
    pseudo: ['temp = head', 'if head == NULL then; print "Empty list"; end if', 'while temp != NULL do', '    print temp.data', '    temp = temp.next', 'end while'],
  },
  'sll.createList': {
    cpp: ['for (int i = 0; i < n; i++) {', '    Node* new_node = create_node(values[i]);', '    if (head == nullptr)', '        head = new_node;', '    else {', '        Node* temp = head;', '        while (temp->next != nullptr)', '            temp = temp->next;', '        temp->next = new_node;', '    }', '}'],
    py: ['for i in range(n):', '    new_node = Node(values[i])', '    if head is None:', '        head = new_node', '    else:', '        temp = head', '        while temp.next is not None:', '            temp = temp.next', '        temp.next = new_node', null, null],
    pseudo: ['for i = 0 to n - 1 do', '    new_node = new Node(values[i])', '    if head == NULL then', '        head = new_node', '    else', '        temp = head', '        while temp.next != NULL do', ['            temp = temp.next', '        end while'], '        temp.next = new_node', '    end if', 'end for'],
  },

  // ------------------------------------------------------------ doubly linked list (Lec 10)
  'dll.insertBeg': {
    cpp: ['Node* new_node = create_node(value);  // prev = next = nullptr', 'if (head == nullptr)', '    head = new_node;', 'else {', '    new_node->next = head;     // (1)', '    head->prev = new_node;      // (2)', '    head = new_node;            // (3)', '}'],
    py: ['new_node = Node(value)          # prev = next = None', 'if head is None:', '    head = new_node', 'else:', '    new_node.next = head      # (1)', '    head.prev = new_node       # (2)', '    head = new_node            # (3)', null],
    pseudo: ['new_node = new Node(value)      # prev = next = NULL', 'if head == NULL then', '    head = new_node', 'else', '    new_node.next = head      # (1)', '    head.prev = new_node       # (2)', '    head = new_node            # (3)', 'end if'],
  },
  'dll.insertEnd': {
    cpp: ['Node* new_node = create_node(value);', 'if (head == nullptr)', '    head = new_node;', 'else {', '    Node* temp = head;', '    while (temp->next != nullptr)', '        temp = temp->next;', '    temp->next = new_node;      // (1)', '    new_node->prev = temp;       // (2)', '}'],
    py: ['new_node = Node(value)', 'if head is None:', '    head = new_node', 'else:', '    temp = head', '    while temp.next is not None:', '        temp = temp.next', '    temp.next = new_node       # (1)', '    new_node.prev = temp        # (2)', null],
    pseudo: ['new_node = new Node(value)', 'if head == NULL then', '    head = new_node', 'else', '    temp = head', '    while temp.next != NULL do', ['        temp = temp.next', '    end while'], '    temp.next = new_node       # (1)', '    new_node.prev = temp        # (2)', 'end if'],
  },
  'dll.insertMid': {
    cpp: ['int node_count = count_nodes(head);', 'if (pos > 1 && pos <= node_count) {', '    Node* new_node = create_node(value);', '    Node *temp = head, *prev = head;  int i = 1;', '    while (i < pos) {', '        prev = temp;', '        temp = temp->next;', '        i++;', '    }', '    new_node->prev = prev;       // (1)', '    new_node->next = temp;      // (2)', '    prev->next = new_node;      // (3)', '    temp->prev = new_node;       // (4)', '} else', '    cout << "position " << pos << " is not a middle position\\n";'],
    py: ['node_count = count_nodes(head)', 'if pos > 1 and pos <= node_count:', '    new_node = Node(value)', '    temp = prev = head; i = 1', '    while i < pos:', '        prev = temp', '        temp = temp.next', '        i += 1', null, '    new_node.prev = prev        # (1)', '    new_node.next = temp       # (2)', '    prev.next = new_node       # (3)', '    temp.prev = new_node        # (4)', 'else:', '    print("position", pos, "is not a middle position")'],
    pseudo: ['node_count = count_nodes(head)', 'if pos > 1 and pos <= node_count then', '    new_node = new Node(value)', '    temp = head; prev = head; i = 1', '    while i < pos do', '        prev = temp', '        temp = temp.next', '        i = i + 1', '    end while', '    new_node.prev = prev        # (1)', '    new_node.next = temp       # (2)', '    prev.next = new_node       # (3)', '    temp.prev = new_node        # (4)', 'else', ['    print "position", pos, "is not a middle position"', 'end if']],
  },
  'dll.deleteBeg': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = head;             // (1)', 'head = temp->next;            // (2)', 'if (head != nullptr)           // correction: list may now be empty', '    head->prev = nullptr;      // (3)', 'delete temp;                    // (4)'],
    py: ['if head is None: print("Empty list"); return', 'temp = head                   # (1)', 'head = temp.next             # (2)', 'if head is not None:          # correction: list may now be empty', '    head.prev = None          # (3)', 'del temp                       # (4) Python frees it'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head                   # (1)', 'head = temp.next             # (2)', 'if head != NULL then          # correction: list may now be empty', ['    head.prev = NULL          # (3)', 'end if'], 'delete temp                    # (4)'],
  },
  'dll.deleteBegNotes': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = head;             // (1)', 'head = temp->next;            // (2)', 'head->prev = nullptr;          // (3) crashes if head is now nullptr', 'delete temp;                    // (4)'],
    py: ['if head is None: print("Empty list"); return', 'temp = head                   # (1)', 'head = temp.next             # (2)', 'head.prev = None              # (3) AttributeError if head is None', 'del temp                       # (4)'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head                   # (1)', 'head = temp.next             # (2)', 'head.prev = NULL              # (3) runtime error if head is NULL', 'delete temp                    # (4)'],
  },
  'dll.deleteEnd': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = head;', 'while (temp->next != nullptr)', '    temp = temp->next;', 'if (temp->prev == nullptr)      // correction: only one node', '    head = nullptr;', 'else', '    temp->prev->next = nullptr;', 'delete temp;'],
    py: ['if head is None: print("Empty list"); return', 'temp = head', 'while temp.next is not None:', '    temp = temp.next', 'if temp.prev is None:          # correction: only one node', '    head = None', 'else:', '    temp.prev.next = None', 'del temp'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head', 'while temp.next != NULL do', ['    temp = temp.next', 'end while'], 'if temp.prev == NULL then      # correction: only one node', '    head = NULL', 'else', ['    temp.prev.next = NULL', 'end if'], 'delete temp'],
  },
  'dll.deleteMid': {
    cpp: ['int node_count = count_nodes(head);', 'if (pos > 1 && pos < node_count) {', '    Node* temp = head;  int i = 1;', '    while (i < pos) {', '        temp = temp->next;', '        i++;', '    }', '    temp->next->prev = temp->prev;   // (1)', '    temp->prev->next = temp->next;  // (2)', '    delete temp;', '} else', '    cout << "Invalid position\\n";'],
    py: ['node_count = count_nodes(head)', 'if pos > 1 and pos < node_count:', '    temp = head; i = 1', '    while i < pos:', '        temp = temp.next', '        i += 1', null, '    temp.next.prev = temp.prev       # (1)', '    temp.prev.next = temp.next      # (2)', '    del temp', 'else:', '    print("Invalid position")'],
    pseudo: ['node_count = count_nodes(head)', 'if pos > 1 and pos < node_count then', '    temp = head; i = 1', '    while i < pos do', '        temp = temp.next', '        i = i + 1', '    end while', '    temp.next.prev = temp.prev       # (1)', '    temp.prev.next = temp.next      # (2)', '    delete temp', 'else', ['    print "Invalid position"', 'end if']],
  },
  'dll.traverseFwd': {
    cpp: ['Node* temp = head;', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->next;', '}'],
    py: ['temp = head', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.next', null],
    pseudo: ['temp = head', 'while temp != NULL do', '    print temp.data', '    temp = temp.next', 'end while'],
  },
  'dll.traverseBwd': {
    cpp: ['Node* temp = head;', 'if (temp == nullptr) return;', 'while (temp->next != nullptr)    // first go to the last node', '    temp = temp->next;', 'while (temp != nullptr) {', '    cout << temp->data << " ";', '    temp = temp->prev;', '}'],
    py: ['temp = head', 'if temp is None: return', 'while temp.next is not None:    # first go to the last node', '    temp = temp.next', 'while temp is not None:', '    print(temp.data, end=" ")', '    temp = temp.prev', null],
    pseudo: ['temp = head', 'if temp == NULL then; return; end if', 'while temp.next != NULL do      # first go to the last node', ['    temp = temp.next', 'end while'], 'while temp != NULL do', '    print temp.data', '    temp = temp.prev', 'end while'],
  },
  'dll.count_nodes': {
    cpp: ['int count_nodes(Node* head) {', '    if (head == nullptr)', '        return 0;', '    else', '        return 1 + count_nodes(head->next);', '}'],
    py: ['def count_nodes(head):', '    if head is None:', '        return 0', '    else:', '        return 1 + count_nodes(head.next)', null],
    pseudo: ['function count_nodes(head)', '    if head == NULL then', '        return 0', '    else', ['        return 1 + count_nodes(head.next)', '    end if'], 'end function'],
  },

  // ------------------------------------------------------------ circular singly linked list (Lec 11)
  'csll.insertBeg': {
    cpp: ['Node* new_node = create_node(value);', 'if (head == nullptr) {', '    head = new_node;', '    new_node->next = head;      // a single node points to itself', '} else {', '    Node* last = head;', '    while (last->next != head)', '        last = last->next;', '    new_node->next = head;      // (1)', '    head = new_node;            // (2)', '    last->next = head;         // (3) close the circle again', '}'],
    py: ['new_node = Node(value)', 'if head is None:', '    head = new_node', '    new_node.next = head       # a single node points to itself', 'else:', '    last = head', '    while last.next is not head:', '        last = last.next', '    new_node.next = head       # (1)', '    head = new_node            # (2)', '    last.next = head          # (3) close the circle again', null],
    pseudo: ['new_node = new Node(value)', 'if head == NULL then', '    head = new_node', '    new_node.next = head       # a single node points to itself', 'else', '    last = head', '    while last.next != head do', ['        last = last.next', '    end while'], '    new_node.next = head       # (1)', '    head = new_node            # (2)', '    last.next = head          # (3) close the circle again', 'end if'],
  },
  'csll.insertEnd': {
    cpp: ['Node* new_node = create_node(value);', 'if (head == nullptr) {', '    head = new_node;', '    new_node->next = head;', '} else {', '    Node* temp = head;', '    while (temp->next != head)', '        temp = temp->next;', '    temp->next = new_node;       // (1)', '    new_node->next = head;      // (2)', '}'],
    py: ['new_node = Node(value)', 'if head is None:', '    head = new_node', '    new_node.next = head', 'else:', '    temp = head', '    while temp.next is not head:', '        temp = temp.next', '    temp.next = new_node        # (1)', '    new_node.next = head       # (2)', null],
    pseudo: ['new_node = new Node(value)', 'if head == NULL then', '    head = new_node', '    new_node.next = head', 'else', '    temp = head', '    while temp.next != head do', ['        temp = temp.next', '    end while'], '    temp.next = new_node        # (1)', '    new_node.next = head       # (2)', 'end if'],
  },
  'csll.deleteBeg': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'if (head->next == head) {    // only one node', '    delete head;', '    head = nullptr;  return;', '}', 'Node *last = head, *temp = head;', 'while (last->next != head)', '    last = last->next;', 'head = temp->next;             // (1)', 'last->next = head;             // (2)', 'delete temp;                    // the notes cross temp out; free it explicitly'],
    py: ['if head is None: print("Empty list"); return', 'if head.next is head:        # only one node', '    pass                       # (nothing to free by hand in Python)', '    head = None; return', null, 'last = temp = head', 'while last.next is not head:', '    last = last.next', 'head = temp.next              # (1)', 'last.next = head              # (2)', 'del temp                       # unreachable now: Python frees it'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'if head.next == head then    # only one node', '    delete head', '    head = NULL; return', 'end if', 'last = head; temp = head', 'while last.next != head do', ['    last = last.next', 'end while'], 'head = temp.next              # (1)', 'last.next = head              # (2)', 'delete temp                    # the notes cross temp out; free it explicitly'],
  },
  'csll.deleteEnd': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node *temp = head, *prev = head;', 'while (temp->next != head) {', '    prev = temp;', '    temp = temp->next;', '}', 'if (temp == head)              // only one node', '    head = nullptr;', 'else', '    prev->next = head;         // (1)', 'delete temp;'],
    py: ['if head is None: print("Empty list"); return', 'temp = prev = head', 'while temp.next is not head:', '    prev = temp', '    temp = temp.next', null, 'if temp is head:              # only one node', '    head = None', 'else:', '    prev.next = head          # (1)', 'del temp'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head; prev = head', 'while temp.next != head do', '    prev = temp', '    temp = temp.next', 'end while', 'if temp == head then          # only one node', '    head = NULL', 'else', ['    prev.next = head          # (1)', 'end if'], 'delete temp'],
  },
  'csll.traverse': {
    cpp: ['if (head == nullptr) { cout << "Empty list\\n"; return; }', 'Node* temp = head;', 'do {', '    cout << temp->data << " ";', '    temp = temp->next;', '} while (temp != head);'],
    py: ['if head is None: print("Empty list"); return', 'temp = head', 'while True:                    # Python has no do-while', '    print(temp.data, end=" ")', '    temp = temp.next', '    if temp is head: break'],
    pseudo: ['if head == NULL then; print "Empty list"; return; end if', 'temp = head', 'do', '    print temp.data', '    temp = temp.next', 'while temp != head'],
  },
  'csll.traverseNullBug': {
    cpp: ['Node* temp = head;', 'while (temp != nullptr) {       // never false in a circle!', '    cout << temp->data << " ";', '    temp = temp->next;', '}'],
    py: ['temp = head', 'while temp is not None:        # never false in a circle!', '    print(temp.data, end=" ")', '    temp = temp.next', null],
    pseudo: ['temp = head', 'while temp != NULL do          # never false in a circle!', '    print temp.data', '    temp = temp.next', 'end while'],
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
    cpp: ['Node* new_node = create_node(x);', 'new_node->next = top;', 'top = new_node;'],
    py: ['new_node = Node(x)', 'new_node.next = top', 'top = new_node'],
    pseudo: ['new_node = new Node(x)', 'new_node.next = top', 'top = new_node'],
  },
  'sq.linked.popHead': {
    cpp: ['if (top == nullptr) { cout << "underflow\\n"; return; }', 'Node* temp = top;', 'top = top->next;', 'x = temp->data;  delete temp;'],
    py: ['if top is None: print("underflow"); return', 'temp = top', 'top = top.next', 'x = temp.data; del temp'],
    pseudo: ['if top == NULL then; print "underflow"; return; end if', 'temp = top', 'top = top.next', 'x = temp.data; delete temp'],
  },
  'sq.linked.pushTail': {
    cpp: ['Node* new_node = create_node(x);', 'if (head == nullptr)', '    head = top = new_node;', 'else {', '    top->next = new_node;', '    top = new_node;', '}'],
    py: ['new_node = Node(x)', 'if head is None:', '    head = top = new_node', 'else:', '    top.next = new_node', '    top = new_node', null],
    pseudo: ['new_node = new Node(x)', 'if head == NULL then', '    head = new_node; top = new_node', 'else', '    top.next = new_node', '    top = new_node', 'end if'],
  },
  'sq.linked.popTail': {
    cpp: ['if (top == nullptr) { cout << "underflow\\n"; return; }', 'if (head == top) {            // last item', '    x = top->data;  delete top;', '    head = top = nullptr;  return;', '}', 'Node* temp = head;', 'while (temp->next != top)     // must find the node BELOW top', '    temp = temp->next;', 'x = top->data;  delete top;', 'top = temp;', 'top->next = nullptr;'],
    py: ['if top is None: print("underflow"); return', 'if head is top:               # last item', '    x = top.data', '    head = top = None; return', null, 'temp = head', 'while temp.next is not top:    # must find the node BELOW top', '    temp = temp.next', 'x = top.data', 'top = temp', 'top.next = None                # the old top is unreachable: freed'],
    pseudo: ['if top == NULL then; print "underflow"; return; end if', 'if head == top then           # last item', '    x = top.data; delete top', '    head = NULL; top = NULL; return', 'end if', 'temp = head', 'while temp.next != top do      # must find the node BELOW top', ['    temp = temp.next', 'end while'], 'x = top.data; delete top', 'top = temp', 'top.next = NULL'],
  },
  'sq.linked.enqueue': {
    cpp: ['Node* new_node = create_node(x);', 'if (rear == nullptr)           // empty queue', '    front = rear = new_node;', 'else {', '    rear->next = new_node;', '    rear = new_node;', '}'],
    py: ['new_node = Node(x)', 'if rear is None:               # empty queue', '    front = rear = new_node', 'else:', '    rear.next = new_node', '    rear = new_node', null],
    pseudo: ['new_node = new Node(x)', 'if rear == NULL then           # empty queue', '    front = new_node; rear = new_node', 'else', '    rear.next = new_node', '    rear = new_node', 'end if'],
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
