// "Build it in code": stacks and queues (Lecture 12). See ./format.js.
// The array versions use the Lab's 'arrays' structure (no nodes at the start);
// the linked versions start from a stack (top) or a queue (front, rear).

// ---------------------------------------------------------------- shared parts
const NODE_CPP = `// One node: the value and the ADDRESS of the node below / behind it.
struct Node {
    int data;
    Node* next;            // nullptr = there is no next node
};`;

const NODE_PY = `class Node:
    def __init__(self, data):
        self.data = data     # the value
        self.next = None     # reference to the next node (None = there is no next node)`;

const STACK_CPP_SETUP = `// Setup (not part of the lesson's operation): builds the starting stack, top item first.
@setup|void build(initializer_list<int> values) {
@setup|    Node* last = nullptr;
@setup|    for (int v : values) {
@setup|        Node* n = new Node{v, nullptr};
@setup|        if (last == nullptr) top = n; else last->next = n;
@setup|        last = n;
@setup|    }
@setup|}

// Clean-up: C++ never frees memory by itself, so give every node back at the end.
@setup|void destroyStack() {
@setup|    while (top != nullptr) {
@setup|        Node* rest = top->next;
@setup|        delete top;
@setup|        top = rest;
@setup|    }
@setup|}`;

const STACK_PY_SETUP = `# Setup (not part of the lesson's operation): builds the starting stack, top item first.
@setup|def build(values):
@setup|    global top
@setup|    last = None
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        if last is None:
@setup|            top = n
@setup|        else:
@setup|            last.next = n
@setup|        last = n`;

const QUEUE_CPP_SETUP = `// Setup (not part of the lesson's operation): builds the starting queue, front item first.
@setup|void build(initializer_list<int> values) {
@setup|    for (int v : values) {
@setup|        Node* n = new Node{v, nullptr};
@setup|        if (rear == nullptr) front = n; else rear->next = n;
@setup|        rear = n;
@setup|    }
@setup|}

// Clean-up: C++ never frees memory by itself, so give every node back at the end.
@setup|void destroyQueue() {
@setup|    while (front != nullptr) {
@setup|        Node* rest = front->next;
@setup|        delete front;
@setup|        front = rest;
@setup|    }
@setup|    rear = nullptr;
@setup|}`;

const QUEUE_PY_SETUP = `# Setup (not part of the lesson's operation): builds the starting queue, front item first.
@setup|def build(values):
@setup|    global front, rear
@setup|    for v in values:
@setup|        n = Node(v)
@setup|        if rear is None:
@setup|            front = n
@setup|        else:
@setup|            rear.next = n
@setup|        rear = n`;

const SLL_CPP_SETUP_END = `// Clean-up: C++ never frees memory by itself, so give every node back at the end.
@setup|void destroyList() {
@setup|    while (start != nullptr) {
@setup|        Node* rest = start->next;
@setup|        delete start;
@setup|        start = rest;
@setup|    }
@setup|    top = nullptr;
@setup|}`;

const POP_LOOP_NOTE = 'Pop until the stack is empty. The values come out in the REVERSE of the order they were pushed: last in, first out (LIFO).';

// ---------------------------------------------------------------- the programs
export const STACK_QUEUE_EXAMPLES = [
  {
    id: 'stack-array',
    lecture: 12,
    structure: 'arrays',
    title: 'A stack in an array (the notes’ convention)',
    ref: 'Lec 12 p.2–3',
    intro: 'The stack lives in an array of MAX slots. `top` counts the items, so it is also the index of the next FREE slot: push writes at `stack[top]` and then increases top; pop first decreases top and then reads `stack[top]`. top == 0 means empty, top == MAX means full.',
    params: { max: 3 },
    cases: [
      { label: 'MAX = 3 (overflow)', params: { max: 3 } },
      { label: 'MAX = 5', params: { max: 5 } },
    ],
    pseudo: `# The stack is an array with room for MAX values.
# top = number of items = index of the next free slot (0 = empty).
@s1|MAX = {{max}}
@s2|stack = new Array(MAX)
@s3|top = 0

@fp|function push(value)
@p1|    if top == MAX then
@p2|        print "stack overflow"
@p3|        return
    end if
@p4|    stack[top] = value           # write into the free slot…
@p5|    top = top + 1                # …then top moves up
@fp_end|end function

@fo|function pop()
@o1|    if top == 0 then
@o2|        print "stack underflow"
@o3|        return -1                # -1 = "no value" in this program
    end if
@o4|    top = top - 1                # top moves down FIRST…
@o5|    return stack[top]            # …then read the top item
@fo_end|end function

@m1|push(11)
@m2|push(22)
@m3|push(33)
@m4|push(44)                     # with MAX = 3 there is no room left
@m5|while top > 0 do
@m6|    print pop()
end while
@m7|print pop()                  # the stack is empty now`,
    cpp: `#include <iostream>
using std::cout;         // only cout: the std library also has a type named "stack"

@s1|const int MAX = {{max}};
@s2|int stack[MAX];          // MAX ints side by side; the size never changes
@s3|int top = 0;             // number of items = index of the next free slot

@fp|void push(int value) {
@p1|    if (top == MAX) {
@p2|        cout << "stack overflow\\n";
@p3|        return;
    }
@p4|    stack[top] = value;          // write into the free slot…
@p5|    top = top + 1;               // …then top moves up
@fp_end|}

@fo|int pop() {
@o1|    if (top == 0) {
@o2|        cout << "stack underflow\\n";
@o3|        return -1;               // -1 = "no value" in this program
    }
@o4|    top = top - 1;               // top moves down FIRST… (the notes write stack[--top])
@o5|    return stack[top];           // …then read the top item
@fo_end|}

int main() {
@m1|    push(11);
@m2|    push(22);
@m3|    push(33);
@m4|    push(44);                    // with MAX = 3 there is no room left
@m5|    while (top > 0)
@m6|        cout << pop() << "\\n";
@m7|    cout << pop() << "\\n";       // the stack is empty now
}`,
    py: `@s1|MAX = {{max}}
@s2|stack = [None] * MAX     # a block of MAX slots; we never let the list grow or shrink
@s3|top = 0                  # number of items = index of the next free slot

@fp,fp_end|def push(value):
    global top
@p1|    if top == MAX:
@p2|        print("stack overflow")
@p3|        return
@p4|    stack[top] = value       # write into the free slot…
@p5|    top = top + 1            # …then top moves up

@fo,fo_end|def pop():
    global top
@o1|    if top == 0:
@o2|        print("stack underflow")
@o3|        return -1            # -1 = "no value" in this program
@o4|    top = top - 1            # top moves down FIRST…
@o5|    return stack[top]        # …then read the top item

@m1|push(11)
@m2|push(22)
@m3|push(33)
@m4|push(44)                     # with MAX = 3 there is no room left
@m5|while top > 0:
@m6|    print(pop())
@m7|print(pop())                 # the stack is empty now`,
    notes: {
      s2: '**The storage.** C++ `int stack[MAX]` is a fixed block of MAX ints. Python uses a list of MAX slots and never appends to it, so it behaves like the array. The pseudocode `new Array(MAX)` is the Lab’s array.',
      s3: 'top = 0: the stack is empty and slot 0 is the next free slot. (Many textbooks instead keep top = index of the top item and start at −1; the notes use the count.)',
      p1: '**Overflow check.** top == MAX means every slot is in use; an array cannot grow.',
      p2: 'Edge case: pushing onto a full stack is refused and nothing changes.',
      p4: 'The value goes into slot top — the first free slot.',
      p5: 'top now counts one more item and names the next free slot.',
      o1: '**Underflow check.** top == 0: there is nothing to pop.',
      o3: 'pop has to return something, so this program uses −1 to mean “no value”. (A real program would report the error differently, e.g. with an exception; that is outside this course.)',
      o4: 'Decrease FIRST: top was the next free slot, so the top item is one below it.',
      o5: 'Read the top item. Its value stays in the array, but it is outside slots 0 … top − 1, so it no longer belongs to the stack and will be overwritten by the next push.',
      m5: POP_LOOP_NOTE,
      m7: 'Edge case: popping an empty stack reports underflow and returns −1.',
    },
    blanks: [
      {
        label: 'p5',
        why: 'After writing, top must move to the next free slot.',
        wrong: [
          { cpp: 'top = top - 1;', py: 'top = top - 1', pseudo: 'top = top - 1', why: 'top must count one MORE item after a push.', tag: 'off-by-one' },
          { cpp: 'stack[top] = top + 1;', py: 'stack[top] = top + 1', pseudo: 'stack[top] = top + 1', why: 'That overwrites the pushed value and leaves top unchanged.', tag: 'value-vs-address' },
        ],
      },
      {
        label: 'o4',
        why: 'top is the next FREE slot, so the top item is at top − 1: decrease first, then read.',
        wrong: [
          { cpp: 'top = top + 1;', py: 'top = top + 1', pseudo: 'top = top + 1', why: 'That moves past the end of the stack.', tag: 'off-by-one' },
          { cpp: 'stack[top] = 0;', py: 'stack[top] = 0', pseudo: 'stack[top] = 0', why: 'top would never decrease, and stack[top] reads the free slot, not the top item.', tag: 'off-by-one' },
        ],
      },
    ],
  },
  {
    id: 'stack-linked',
    lecture: 12,
    structure: 'stack',
    title: 'A linked stack: push and pop at the first node',
    ref: 'Lec 12 p.4 (simplified)',
    intro: 'Each item is a node; `top` holds the address of the TOP node and every node’s next points to the node below it. Push = insert at the beginning, pop = delete at the beginning (Lec 08/09), so neither has to walk the list. The notes push at the END instead — compare the next program.',
    params: { x: 40 },
    cases: [
      { label: 'Three items', setup: { values: [30, 20, 10] } },
      { label: 'Empty stack', setup: { values: [] } },
    ],
    pseudo: `# Nodes have two fields: data and next. top -> top node -> … -> bottom node -> NULL.
# Starting stack: {{start}}

@fp|function push(value)
@p1|    newnode = new Node(value)
@p2|    newnode.next = top           # the new node sits on the old top
@p3|    top = newnode                # and becomes the top
@fp_end|end function

@fo|function pop()
@o1|    if top == NULL then
@o2|        print "stack underflow"
@o3|        return -1
    end if
@o4|    temp = top                   # save the top node
@o5|    top = top.next               # the node below becomes the top
@o6|    x = temp.data
@o7|    delete temp                  # free the old top
@o8|    return x
@fo_end|end function

@m1|push({{x}})
@m2|while top != NULL do
@m3|    print pop()
end while
@m4|print pop()`,
    cpp: `#include <iostream>
#include <initializer_list>
using namespace std;

${NODE_CPP}

Node* top = nullptr;       // address of the top node (nullptr = empty stack)

@fp|void push(int value) {
@p1|    Node* newnode = new Node{value, nullptr};
@p2|    newnode->next = top;         // the new node sits on the old top
@p3|    top = newnode;               // and becomes the top
@fp_end|}

@fo|int pop() {
@o1|    if (top == nullptr) {
@o2|        cout << "stack underflow\\n";
@o3|        return -1;
    }
@o4|    Node* temp = top;            // save the top node
@o5|    top = top->next;             // the node below becomes the top
@o6|    int x = temp->data;
@o7|    delete temp;                 // free the old top
@o8|    return x;
@fo_end|}

${STACK_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    push({{x}});
@m2|    while (top != nullptr)
@m3|        cout << pop() << "\\n";
@m4|    cout << pop() << "\\n";
@setup|    destroyStack();
}`,
    py: `${NODE_PY}

top = None                   # the top node (None = empty stack)

@fp,fp_end|def push(value):
    global top
@p1|    newnode = Node(value)
@p2|    newnode.next = top       # the new node sits on the old top
@p3|    top = newnode            # and becomes the top

@fo,fo_end|def pop():
    global top
@o1|    if top is None:
@o2|        print("stack underflow")
@o3|        return -1
@o4|    temp = top               # save the top node
@o5|    top = top.next           # the node below becomes the top
@o6|    x = temp.data
@o7|    del temp                 # last reference gone: Python frees the node
@o8|    return x

${STACK_PY_SETUP}

@setup|{{build}}
@m1|push({{x}})
@m2|while top is not None:
@m3|    print(pop())
@m4|print(pop())`,
    notes: {
      p1: 'A new node, not linked to anything yet. A linked stack has no MAX: it is only limited by available memory, so there is no overflow check.',
      p2: '**Link change (1).** The new node’s next takes the old top’s address (NULL on an empty stack — the same line handles that edge case).',
      p3: '**Link change (2).** top now holds the new node’s address. Same order as insert at the beginning: (1) before (2), or the old stack is lost.',
      o1: '**Underflow check.** An empty stack has top == NULL.',
      o4: '**Save.** temp remembers the node we are about to remove.',
      o5: '**Relink.** top moves to the node below. If that was the last item, top becomes NULL — the empty stack.',
      o6: 'Copy the value out BEFORE freeing: after the delete, temp’s node no longer exists.',
      o7: '**Free.** C++ `delete` returns the node’s memory; in Python the node is reclaimed once nothing refers to it (`del temp` removes the last reference).',
      m2: POP_LOOP_NOTE,
      m4: 'Edge case: popping an empty stack reports underflow.',
    },
    blanks: [
      {
        label: 'p2',
        why: 'The new node must point at the old top before top moves.',
        wrong: [
          { cpp: 'top->next = newnode;', py: 'top.next = newnode', pseudo: 'top.next = newnode', why: 'That links the new node BELOW the top, and fails on an empty stack.', tag: 'pointer-walk' },
          { cpp: 'newnode = top;', py: 'newnode = top', pseudo: 'newnode = top', why: 'That loses the new node.', tag: 'value-vs-address' },
        ],
      },
      {
        label: 'o5',
        why: 'top must move to the node below before the old top is freed.',
        wrong: [
          { cpp: 'top = nullptr;', py: 'top = None', pseudo: 'top = NULL', why: 'That throws away the whole stack, not just the top item.', tag: 'lost-access' },
          { cpp: 'temp = temp->next;', py: 'temp = temp.next', pseudo: 'temp = temp.next', why: 'top would still point at the node that is about to be freed (dangling pointer).', tag: 'dangling' },
        ],
      },
    ],
  },
  {
    id: 'stack-linked-end',
    lecture: 12,
    structure: 'sll',
    title: 'A linked stack as in the notes: push and pop at the END',
    ref: 'Lec 12 p.4',
    intro: 'The notes keep the list in `start` and the TOP item at the end, in `top`. Push links the new node after top. Pop must find the node BELOW top, and a node only knows the node after it, so temp has to walk from start every time. Same behaviour as the previous program, more work per pop.',
    params: {},
    cases: [{ label: 'Push 10, 20, 30', setup: { values: [] } }],
    pseudo: `# Nodes have two fields: data and next. start -> bottom … top -> NULL.
@s1|top = NULL

@fp|function push(value)
@p1|    newnode = new Node(value)
@p2|    if start == NULL then
@p3|        start = newnode          # the first item is both bottom and top
@p4|        top = newnode
    else
@p5|        top.next = newnode       # link after the old top
@p6|        top = newnode
    end if
@fp_end|end function

@fo|function pop()
@o1|    if top == NULL then
@o2|        print "stack underflow"
@o3|        return -1
    end if
@o4|    x = top.data
@o5|    if start == top then         # only one item left
@o6|        delete top
@o7|        start = NULL
@o8|        top = NULL
    else
@o9|        temp = start
@o10|        while temp.next != top do
@o11|            temp = temp.next     # stop on the node BELOW top
        end while
@o12|        delete top
@o13|        top = temp
@o14|        top.next = NULL          # the new top is the last node
    end if
@o15|    return x
@fo_end|end function

@m1|push(10)
@m2|push(20)
@m3|push(30)
@m4|while top != NULL do
@m5|    print pop()
end while
@m6|print pop()`,
    cpp: `#include <iostream>
using namespace std;

${NODE_CPP}

Node* start = nullptr;     // the bottom node (first in the list)
@s1|Node* top = nullptr;       // the top node (last in the list)

@fp|void push(int value) {
@p1|    Node* newnode = new Node{value, nullptr};
@p2|    if (start == nullptr) {
@p3|        start = newnode;         // the first item is both bottom and top
@p4|        top = newnode;
    } else {
@p5|        top->next = newnode;     // link after the old top
@p6|        top = newnode;
    }
@fp_end|}

@fo|int pop() {
@o1|    if (top == nullptr) {
@o2|        cout << "stack underflow\\n";
@o3|        return -1;
    }
@o4|    int x = top->data;
@o5|    if (start == top) {          // only one item left
@o6|        delete top;
@o7|        start = nullptr;
@o8|        top = nullptr;
    } else {
@o9|        Node* temp = start;
@o10|        while (temp->next != top)
@o11|            temp = temp->next;   // stop on the node BELOW top
@o12|        delete top;
@o13|        top = temp;
@o14|        top->next = nullptr;     // the new top is the last node
    }
@o15|    return x;
@fo_end|}

${SLL_CPP_SETUP_END}

int main() {
@m1|    push(10);
@m2|    push(20);
@m3|    push(30);
@m4|    while (top != nullptr)
@m5|        cout << pop() << "\\n";
@m6|    cout << pop() << "\\n";
@setup|    destroyList();
}`,
    py: `${NODE_PY}

start = None                 # the bottom node (first in the list)
@s1|top = None                   # the top node (last in the list)

@fp,fp_end|def push(value):
    global start, top
@p1|    newnode = Node(value)
@p2|    if start is None:
@p3|        start = newnode          # the first item is both bottom and top
@p4|        top = newnode
    else:
@p5|        top.next = newnode       # link after the old top
@p6|        top = newnode

@fo,fo_end|def pop():
    global start, top
@o1|    if top is None:
@o2|        print("stack underflow")
@o3|        return -1
@o4|    x = top.data
@o5|    if start is top:             # only one item left
@o6|        # (nothing to free: the node is reclaimed once no variable refers to it)
@o7|        start = None
@o8|        top = None
    else:
@o9|        temp = start
@o10|        while temp.next is not top:
@o11|            temp = temp.next     # stop on the node BELOW top
@o12|        # (nothing to free: see above)
@o13|        top = temp
@o14|        top.next = None          # the new top is the last node
@o15|    return x

@m1|push(10)
@m2|push(20)
@m3|push(30)
@m4|while top is not None:
@m5|    print(pop())
@m6|print(pop())`,
    notes: {
      s1: 'Two pointers: start (the bottom, first node of the list) and top (the last node). The Lab already provides start = NULL.',
      p2: 'Empty stack: the new node is the whole list.',
      p5: '**Link change.** The old top’s next now points to the new node; no walking is needed because top already points at the last node.',
      p6: 'top moves to the new last node.',
      o4: 'Copy the value before the node is freed.',
      o5: 'Edge case: one item. Removing it empties the stack, so BOTH start and top must become NULL.',
      o6: '**Free.** C++ `delete top` frees the node; top still holds the old address (a dangling pointer) until the next lines overwrite it. Python has nothing to free.',
      o9: 'More than one item: find the node BELOW top. A node only stores the address of the node after it, so the only way is to walk from start.',
      o10: 'Stop when temp’s next node is top — temp is then directly below it.',
      o11: '**Traversal.** temp moves one node forward. This walk is what makes the notes’ version slower than pushing and popping at the first node.',
      o12: 'Free the old top. temp->next still holds its address for a moment…',
      o13: 'The node below is the new top…',
      o14: '…and its next is cleared, so the list no longer refers to the freed node.',
      m4: POP_LOOP_NOTE,
      m6: 'Edge case: popping an empty stack reports underflow.',
    },
    blanks: [
      {
        label: 'o10',
        why: 'temp must stop on the node directly below top.',
        wrong: [
          { cpp: 'while (temp != top)', py: 'while temp is not top:', pseudo: 'while temp != top do', why: 'temp would stop ON top, so the node below it is never found.', tag: 'off-by-one' },
          { cpp: 'while (temp->next != nullptr)', py: 'while temp.next is not None:', pseudo: 'while temp.next != NULL do', why: 'That also stops on the last node (top itself).', tag: 'off-by-one' },
        ],
      },
      {
        label: 'o14',
        why: 'The new top is now the last node, so its next must be NULL.',
        wrong: [
          { cpp: 'top = nullptr;', py: 'top = None', pseudo: 'top = NULL', why: 'That loses the remaining items although the stack is not empty.', tag: 'lost-access' },
        ],
      },
    ],
  },
  {
    id: 'queue-array',
    lecture: 12,
    structure: 'arrays',
    title: 'A queue in an array (linear, as in the notes)',
    ref: 'Lec 12 p.5',
    intro: 'Items enter at the REAR and leave from the FRONT. F is the index of the front item, R the index of the next free slot; F == R means empty. Both only move forward, so once R reaches MAX the queue reports “full” even if slots at the beginning were freed by dequeues.',
    params: { max: 4 },
    cases: [
      { label: 'MAX = 4 (full with a free slot)', params: { max: 4 } },
      { label: 'MAX = 6', params: { max: 6 } },
    ],
    pseudo: `# The queue is an array with room for MAX values.
# F = index of the front item, R = index of the next free slot; F == R means empty.
@s1|MAX = {{max}}
@s2|queue = new Array(MAX)
@s3|F = 0
@s4|R = 0

@fe|function enqueue(value)
@e1|    if R == MAX then
@e2|        print "queue full"
@e3|        return
    end if
@e4|    queue[R] = value             # join at the rear…
@e5|    R = R + 1
@fe_end|end function

@fd|function dequeue()
@d1|    if F == R then
@d2|        print "queue empty"
@d3|        return -1
    end if
@d4|    x = queue[F]                 # leave from the front…
@d5|    F = F + 1
@d6|    return x
@fd_end|end function

@m1|enqueue(11)
@m2|enqueue(22)
@m3|print dequeue()
@m4|enqueue(33)
@m5|enqueue(44)
@m6|enqueue(55)
@m7|while F != R do
@m8|    print dequeue()
end while
@m9|print dequeue()`,
    cpp: `#include <iostream>
using std::cout;         // only cout: the std library also has a type named "queue"

@s1|const int MAX = {{max}};
@s2|int queue[MAX];
@s3|int F = 0;               // index of the front item
@s4|int R = 0;               // index of the next free slot

@fe|void enqueue(int value) {
@e1|    if (R == MAX) {
@e2|        cout << "queue full\\n";
@e3|        return;
    }
@e4|    queue[R] = value;            // join at the rear…
@e5|    R = R + 1;
@fe_end|}

@fd|int dequeue() {
@d1|    if (F == R) {
@d2|        cout << "queue empty\\n";
@d3|        return -1;
    }
@d4|    int x = queue[F];            // leave from the front…
@d5|    F = F + 1;
@d6|    return x;
@fd_end|}

int main() {
@m1|    enqueue(11);
@m2|    enqueue(22);
@m3|    cout << dequeue() << "\\n";
@m4|    enqueue(33);
@m5|    enqueue(44);
@m6|    enqueue(55);
@m7|    while (F != R)
@m8|        cout << dequeue() << "\\n";
@m9|    cout << dequeue() << "\\n";
}`,
    py: `@s1|MAX = {{max}}
@s2|queue = [None] * MAX     # a block of MAX slots; we never let the list grow or shrink
@s3|F = 0                    # index of the front item
@s4|R = 0                    # index of the next free slot

@fe,fe_end|def enqueue(value):
    global R
@e1|    if R == MAX:
@e2|        print("queue full")
@e3|        return
@e4|    queue[R] = value         # join at the rear…
@e5|    R = R + 1

@fd,fd_end|def dequeue():
    global F
@d1|    if F == R:
@d2|        print("queue empty")
@d3|        return -1
@d4|    x = queue[F]             # leave from the front…
@d5|    F = F + 1
@d6|    return x

@m1|enqueue(11)
@m2|enqueue(22)
@m3|print(dequeue())
@m4|enqueue(33)
@m5|enqueue(44)
@m6|enqueue(55)
@m7|while F != R:
@m8|    print(dequeue())
@m9|print(dequeue())`,
    notes: {
      s3: 'F = R = 0: the queue is empty.',
      e1: '**Full check (notes).** R == MAX: there is no free slot AFTER the rear. The check ignores slots before F that dequeues have emptied.',
      e2: 'Edge case: with MAX = 4 this happens on enqueue(55) although slot 0 is unused — the weakness of the linear queue. The circular queue (supplementary) reuses those slots.',
      e4: 'The value goes into the next free slot at the rear.',
      e5: 'R moves to the next free slot.',
      d1: '**Empty check.** F == R: no item between front and rear.',
      d4: 'Read the front item. Nothing is shifted: the value stays in its slot, but F moves past it.',
      d5: 'F moves to the next item. The slot before F is never used again in a linear queue.',
      m3: 'FIFO: the first value in (11) is the first value out.',
      m7: 'Dequeue until empty: the values leave in the order they arrived.',
      m9: 'Edge case: dequeuing an empty queue reports it and returns −1.',
    },
    blanks: [
      {
        label: 'd5',
        why: 'After reading the front item, F moves to the next one.',
        wrong: [
          { cpp: 'R = R - 1;', py: 'R = R - 1', pseudo: 'R = R - 1', why: 'That removes the item at the REAR — stack behaviour, not a queue.', tag: 'lifo-fifo' },
          { cpp: 'F = F - 1;', py: 'F = F - 1', pseudo: 'F = F - 1', why: 'F only moves forward; this would read the same slot again and run below 0.', tag: 'off-by-one' },
        ],
      },
      {
        label: 'e1',
        why: 'The linear queue is full when R has reached MAX.',
        wrong: [
          { cpp: 'if (F == R) {', py: 'if F == R:', pseudo: 'if F == R then', why: 'F == R is the EMPTY test.', tag: 'wrong-result' },
        ],
      },
    ],
  },
  {
    id: 'queue-linked',
    lecture: 12,
    structure: 'queue',
    title: 'A linked queue: enqueue at the rear, dequeue at the front',
    ref: 'Lec 12 p.6',
    intro: 'Two pointers: `front` (the node that leaves next) and `rear` (the last node). Enqueue links a new node after rear; dequeue removes the front node. The edge cases are the empty queue and removing the final item — then rear must become NULL too.',
    params: { x: 30 },
    cases: [
      { label: 'Two items', setup: { values: [10, 20] } },
      { label: 'Empty queue', setup: { values: [] } },
    ],
    pseudo: `# Nodes have two fields: data and next. front -> … -> rear -> NULL.
# Starting queue: {{start}}

@fe|function enqueue(value)
@e1|    newnode = new Node(value)
@e2|    if rear == NULL then
@e3|        front = newnode          # empty queue: the new node is front AND rear
@e4|        rear = newnode
    else
@e5|        rear.next = newnode      # link after the old rear
@e6|        rear = newnode
    end if
@fe_end|end function

@fd|function dequeue()
@d1|    if front == NULL then
@d2|        print "queue empty"
@d3|        return -1
    end if
@d4|    temp = front                 # save the front node
@d5|    front = front.next
@d6|    if front == NULL then
@d7|        rear = NULL              # the final item left
    end if
@d8|    x = temp.data
@d9|    delete temp
@d10|    return x
@fd_end|end function

@m1|enqueue({{x}})
@m2|while front != NULL do
@m3|    print dequeue()
end while
@m4|print dequeue()`,
    cpp: `#include <iostream>
#include <initializer_list>
using namespace std;

${NODE_CPP}

Node* front = nullptr;     // the node that leaves next
Node* rear = nullptr;      // the last node (nullptr when the queue is empty)

@fe|void enqueue(int value) {
@e1|    Node* newnode = new Node{value, nullptr};
@e2|    if (rear == nullptr) {
@e3|        front = newnode;         // empty queue: the new node is front AND rear
@e4|        rear = newnode;
    } else {
@e5|        rear->next = newnode;    // link after the old rear
@e6|        rear = newnode;
    }
@fe_end|}

@fd|int dequeue() {
@d1|    if (front == nullptr) {
@d2|        cout << "queue empty\\n";
@d3|        return -1;
    }
@d4|    Node* temp = front;          // save the front node
@d5|    front = front->next;
@d6|    if (front == nullptr)
@d7|        rear = nullptr;          // the final item left
@d8|    int x = temp->data;
@d9|    delete temp;
@d10|    return x;
@fd_end|}

${QUEUE_CPP_SETUP}

int main() {
@setup|    {{build}}
@m1|    enqueue({{x}});
@m2|    while (front != nullptr)
@m3|        cout << dequeue() << "\\n";
@m4|    cout << dequeue() << "\\n";
@setup|    destroyQueue();
}`,
    py: `${NODE_PY}

front = None                 # the node that leaves next
rear = None                  # the last node (None when the queue is empty)

@fe,fe_end|def enqueue(value):
    global front, rear
@e1|    newnode = Node(value)
@e2|    if rear is None:
@e3|        front = newnode          # empty queue: the new node is front AND rear
@e4|        rear = newnode
    else:
@e5|        rear.next = newnode      # link after the old rear
@e6|        rear = newnode

@fd,fd_end|def dequeue():
    global front, rear
@d1|    if front is None:
@d2|        print("queue empty")
@d3|        return -1
@d4|    temp = front             # save the front node
@d5|    front = front.next
@d6|    if front is None:
@d7|        rear = None          # the final item left
@d8|    x = temp.data
@d9|    del temp                 # last reference gone: Python frees the node
@d10|    return x

${QUEUE_PY_SETUP}

@setup|{{build}}
@m1|enqueue({{x}})
@m2|while front is not None:
@m3|    print(dequeue())
@m4|print(dequeue())`,
    notes: {
      e1: 'A new node with next = NULL: it will be the last node.',
      e2: 'Edge case: the empty queue has rear == NULL (and front == NULL).',
      e3: 'One item: front and rear both point at it.',
      e5: '**Link change.** The old rear’s next points to the new node. No walking: rear already points at the last node.',
      e6: 'rear moves to the new last node.',
      d1: '**Empty check.** front == NULL.',
      d4: '**Save.** temp keeps the front node so it can be freed.',
      d5: '**Relink.** front moves to the second node.',
      d6: 'Did the final item just leave?',
      d7: 'Edge case: then rear still points at the node that is about to be freed. Setting rear = NULL keeps “rear == NULL” meaning “empty” — forgetting it makes the next enqueue write into freed memory.',
      d8: 'Copy the value before freeing the node.',
      d9: '**Free.** C++ `delete`; in Python the node is reclaimed automatically once nothing refers to it.',
      m2: 'FIFO: the values leave in the order they were enqueued.',
      m4: 'Edge case: dequeuing an empty queue.',
    },
    blanks: [
      {
        label: 'd7',
        why: 'When the final item leaves, rear must not keep pointing at it.',
        wrong: [
          { cpp: 'front = rear;', py: 'front = rear', pseudo: 'front = rear', why: 'front would point at the node that is about to be freed.', tag: 'dangling' },
          { cpp: 'rear = front->next;', py: 'rear = front.next', pseudo: 'rear = front.next', why: 'front is NULL here: following it crashes.', tag: 'null-deref' },
        ],
      },
      {
        label: 'e5',
        why: 'The new node joins after the current rear.',
        wrong: [
          { cpp: 'newnode->next = front;', py: 'newnode.next = front', pseudo: 'newnode.next = front', why: 'That puts the new node in FRONT of the queue (stack behaviour).', tag: 'lifo-fifo' },
          { cpp: 'rear = newnode->next;', py: 'rear = newnode.next', pseudo: 'rear = newnode.next', why: 'newnode.next is NULL: rear is lost and the new node is never linked.', tag: 'lost-access' },
        ],
      },
    ],
  },
];
