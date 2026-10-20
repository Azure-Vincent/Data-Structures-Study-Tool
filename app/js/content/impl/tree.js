// "Build it in code": binary trees (Lectures 13 and 14). See ./format.js.
// Node values are the letters of the lecture tree: C++ char, Python str,
// pseudocode text ("A").

const LECTURE_VALUES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// ---------------------------------------------------------------- shared parts
const TREE_CPP_HEAD = `#include <iostream>
#include <initializer_list>
using namespace std;

// One node: the value and the ADDRESSES of the two children.
struct Node {
    char data;
    Node* left;            // nullptr = no left child
    Node* right;           // nullptr = no right child
};

Node* root = nullptr;      // address of the root (nullptr = empty tree)`;

const TREE_CPP_SETUP = `// Setup (not part of the lesson's operation): builds the starting tree from its
// level order ('-' = no node in that position): the children of position i are 2i+1 and 2i+2.
@setup|void build(initializer_list<char> values) {
@setup|    Node* made[31] = {};
@setup|    int n = 0;
@setup|    for (char v : values)
@setup|        made[n++] = (v == '-') ? nullptr : new Node{v, nullptr, nullptr};
@setup|    for (int i = 0; i < n; i++) {
@setup|        if (made[i] == nullptr) continue;
@setup|        if (2 * i + 1 < n) made[i]->left = made[2 * i + 1];
@setup|        if (2 * i + 2 < n) made[i]->right = made[2 * i + 2];
@setup|    }
@setup|    root = (n > 0) ? made[0] : nullptr;
@setup|}`;

const TREE_CPP_DESTROY = `// Clean-up: free every node — both subtrees first, then the node itself (a postorder walk).
@setup|void destroyTree(Node* node) {
@setup|    if (node == nullptr) return;
@setup|    destroyTree(node->left);
@setup|    destroyTree(node->right);
@setup|    delete node;
@setup|}`;

const TREE_PY_HEAD = `class Node:
    def __init__(self, data):
        self.data = data     # the value
        self.left = None     # reference to the left child (None = no left child)
        self.right = None    # reference to the right child (None = no right child)

root = None                  # the root (None = empty tree)`;

const TREE_PY_SETUP = `# Setup (not part of the lesson's operation): builds the starting tree from its
# level order ('-' = no node in that position): the children of position i are 2i+1 and 2i+2.
@setup|def build(values):
@setup|    global root
@setup|    made = [None if v == '-' else Node(v) for v in values]
@setup|    for i, node in enumerate(made):
@setup|        if node is not None:
@setup|            if 2 * i + 1 < len(made):
@setup|                node.left = made[2 * i + 1]
@setup|            if 2 * i + 2 < len(made):
@setup|                node.right = made[2 * i + 2]
@setup|    root = made[0] if made else None`;

const PSEUDO_HEAD = `# Nodes have three fields: data, left and right (NULL = no child).
# Starting tree: {{start}}`;

// ---------------------------------------------------------------- the programs
export const TREE_EXAMPLES = [
  {
    id: 'tree-create',
    lecture: 13,
    structure: 'tree',
    title: 'Create a binary tree from scratch',
    ref: 'Lec 13 p.2, p.5',
    intro: 'A binary tree node is a list node with TWO links: left and right. `getnode()` creates an unlinked node; the tree is built by storing each new node’s address in a child field of its parent. The result is the lecture tree A (B (D, E), C (F, G)).',
    params: {},
    cases: [{ label: 'Build the lecture tree', setup: { values: [] } }],
    pseudo: `# Nodes have three fields: data, left and right (NULL = no child).

@fg|function getnode(value)
@g1|    newnode = new Node(value)    # data = value, left = right = NULL
@g2|    return newnode
end function

@m1|root = getnode("A")
@m2|root.left = getnode("B")
@m3|root.right = getnode("C")
@m4|root.left.left = getnode("D")
@m5|root.left.right = getnode("E")
@m6|root.right.left = getnode("F")
@m7|root.right.right = getnode("G")
@m8|print root.data                                  # level 0
@m9|print root.left.data, root.right.data            # level 1
@m10|print root.left.left.data, root.left.right.data, root.right.left.data, root.right.right.data`,
    cpp: `${TREE_CPP_HEAD}

@fg|Node* getnode(char value) {
@g1|    Node* newnode = new Node{value, nullptr, nullptr};   // on the heap: no children yet
@g2|    return newnode;
}

${TREE_CPP_DESTROY}

int main() {
@m1|    root = getnode('A');
@m2|    root->left = getnode('B');
@m3|    root->right = getnode('C');
@m4|    root->left->left = getnode('D');
@m5|    root->left->right = getnode('E');
@m6|    root->right->left = getnode('F');
@m7|    root->right->right = getnode('G');
@m8|    cout << root->data << "\\n";                                   // level 0
@m9|    cout << root->left->data << " " << root->right->data << "\\n";  // level 1
@m10|    cout << root->left->left->data << " " << root->left->right->data << " "
@m10|         << root->right->left->data << " " << root->right->right->data << "\\n";
@setup|    destroyTree(root);
}`,
    py: `${TREE_PY_HEAD}

@fg|def getnode(value):
@g1|    newnode = Node(value)        # a new object: no children yet
@g2|    return newnode

@m1|root = getnode('A')
@m2|root.left = getnode('B')
@m3|root.right = getnode('C')
@m4|root.left.left = getnode('D')
@m5|root.left.right = getnode('E')
@m6|root.right.left = getnode('F')
@m7|root.right.right = getnode('G')
@m8|print(root.data)                                 # level 0
@m9|print(root.left.data, root.right.data)           # level 1
@m10|print(root.left.left.data, root.left.right.data, root.right.left.data, root.right.right.data)`,
    notes: {
      g1: '**Allocation.** A node with no children: left = right = NULL / nullptr / None. A node with no children is a **leaf** (Lec 13 p.2).',
      g2: 'The caller receives the node’s address (C++) / a reference to it (Python).',
      m1: 'The first node is the **root**: the only node without a parent. root holds its address.',
      m2: '**Link change.** The root’s left field now holds B’s address: B is the root’s left child and A is B’s parent.',
      m3: 'C becomes the right child: A now has two children, which are **siblings**.',
      m4: '`root.left.left` follows two links: from A to B, then sets B’s left field. In C++ every `->` follows one pointer.',
      m7: 'Seven nodes, six links: every node except the root has exactly one incoming link, so a tree with n nodes has n − 1 edges.',
      m8: 'Reading values back by following links, level by level. (Lec 14 shows the systematic ways to visit every node: traversals.)',
    },
    blanks: [
      {
        label: 'm2',
        why: 'The new node’s address must be stored in a child field of its parent.',
        wrong: [
          { cpp: 'root = getnode(\'B\');', py: "root = getnode('B')", pseudo: 'root = getnode("B")', why: 'That replaces the root — A is no longer reachable.', tag: 'lost-access' },
          { cpp: 'getnode(\'B\');', py: "getnode('B')", pseudo: 'getnode("B")', why: 'The node is created but nothing refers to it: it is not in the tree (and in C++ it leaks).', tag: 'memory-bug' },
        ],
      },
    ],
  },
  {
    id: 'tree-array',
    lecture: 13,
    structure: 'arrays',
    title: 'A binary tree stored in an array',
    ref: 'Lec 13 p.5',
    intro: 'The nodes are stored level by level. With positions numbered from 0, the children of position i are at 2i + 1 and 2i + 2, and its parent is at (i − 1) / 2 rounded down. Here B has no left child, so position 3 holds the marker "-" — an unused slot.',
    params: { i: 1 },
    cases: [
      { label: 'B (i = 1)', params: { i: 1 } },
      { label: 'A, the root (i = 0)', params: { i: 0 } },
      { label: 'F, a leaf (i = 5)', params: { i: 5 } },
    ],
    pseudo: `# The tree A (B (–, E), C (F, G)) stored level by level; "-" marks an empty position.
@s1|N = 7
@s2|tree = new Array(N)
@s3|tree[0] = "A"
@s4|tree[1] = "B"
@s5|tree[2] = "C"
@s6|tree[3] = "-"                # B has no left child
@s7|tree[4] = "E"
@s8|tree[5] = "F"
@s9|tree[6] = "G"

@fs|function show(i)
@q1|    print "node " + tree[i]
@q2|    if i == 0 then
@q3|        print "parent: none (root)"
    else
@q4|        print "parent: " + tree[(i - 1) div 2]    # div = whole-number division
    end if
@q5|    l = 2 * i + 1
@q6|    if l < N and tree[l] != "-" then
@q7|        print "left: " + tree[l]
    else
@q8|        print "left: none"
    end if
@q9|    r = 2 * i + 2
@q10|    if r < N and tree[r] != "-" then
@q11|        print "right: " + tree[r]
    else
@q12|        print "right: none"
    end if
@fs_end|end function

@m1|show({{i}})`,
    cpp: `#include <iostream>
using namespace std;

// The tree A (B (-, E), C (F, G)) stored level by level; '-' marks an empty position.
@s1|const int N = 7;
@s2|char tree[N];
@fs|void show(int i) {
@q1|    cout << "node " << tree[i] << "\\n";
@q2|    if (i == 0)
@q3|        cout << "parent: none (root)\\n";
    else
@q4|        cout << "parent: " << tree[(i - 1) / 2] << "\\n";   // int / int = whole-number division
@q5|    int l = 2 * i + 1;
@q6|    if (l < N && tree[l] != '-')
@q7|        cout << "left: " << tree[l] << "\\n";
    else
@q8|        cout << "left: none\\n";
@q9|    int r = 2 * i + 2;
@q10|    if (r < N && tree[r] != '-')
@q11|        cout << "right: " << tree[r] << "\\n";
    else
@q12|        cout << "right: none\\n";
@fs_end|}

int main() {
@s3|    tree[0] = 'A';
@s4|    tree[1] = 'B';
@s5|    tree[2] = 'C';
@s6|    tree[3] = '-';               // B has no left child
@s7|    tree[4] = 'E';
@s8|    tree[5] = 'F';
@s9|    tree[6] = 'G';
@m1|    show({{i}});
}`,
    py: `# The tree A (B (-, E), C (F, G)) stored level by level; '-' marks an empty position.
@s1|N = 7
@s2|tree = [None] * N
@s3|tree[0] = 'A'
@s4|tree[1] = 'B'
@s5|tree[2] = 'C'
@s6|tree[3] = '-'                # B has no left child
@s7|tree[4] = 'E'
@s8|tree[5] = 'F'
@s9|tree[6] = 'G'

@fs,fs_end|def show(i):
@q1|    print("node " + tree[i])
@q2|    if i == 0:
@q3|        print("parent: none (root)")
    else:
@q4|        print("parent: " + tree[(i - 1) // 2])   # // = whole-number division (/ would give 0.5)
@q5|    l = 2 * i + 1
@q6|    if l < N and tree[l] != '-':
@q7|        print("left: " + tree[l])
    else:
@q8|        print("left: none")
@q9|    r = 2 * i + 2
@q10|    if r < N and tree[r] != '-':
@q11|        print("right: " + tree[r])
    else:
@q12|        print("right: none")

@m1|show({{i}})`,
    notes: {
      s2: 'One slot per position of a complete tree with 3 levels: 1 + 2 + 4 = 7 slots.',
      s3: 'Position 0 is the root. (Some books number from 1: then the children are 2i and 2i + 1 and the parent is i / 2. Lec 13 p.5 shows both.)',
      s6: '**Gap.** B has no left child, but its slot still exists: an incomplete tree wastes array slots. No pointers are stored — the positions alone define the links.',
      q2: 'Edge case: the root (position 0) has no parent.',
      q4: 'Parent of i: (i − 1) / 2 rounded DOWN. C++ int division and the pseudocode `div` round down for non-negative numbers; in Python use `//` — `/` would give a fraction.',
      q5: 'Left child of i: 2i + 1.',
      q6: 'Two edge cases: the position can be past the end of the array (a leaf in the last level), or inside it but empty ("-"). The test `l < N` comes first so that `tree[l]` is never read outside the array — `and` / `&&` stop at the first false part.',
      q9: 'Right child of i: 2i + 2.',
    },
    blanks: [
      {
        label: 'q5',
        why: 'With 0-based positions the left child of i is at 2i + 1.',
        wrong: [
          { cpp: 'int l = 2 * i;', py: 'l = 2 * i', pseudo: 'l = 2 * i', why: 'That is the 1-based formula; with positions from 0 it points at the wrong node (and at the root itself for i = 0).', tag: 'array-base' },
          { cpp: 'int l = i + 1;', py: 'l = i + 1', pseudo: 'l = i + 1', why: 'The next position is a sibling or a node of the next level, not the child.', tag: 'array-base' },
        ],
      },
      {
        label: 'q4',
        why: 'The parent of i is at (i − 1) / 2 rounded down.',
        wrong: [
          { cpp: 'cout << "parent: " << tree[i / 2] << "\\n";', py: 'print("parent: " + tree[i // 2])', pseudo: 'print "parent: " + tree[i div 2]', why: 'That is the 1-based formula: for i = 2 it gives position 1 (B) instead of 0 (A).', tag: 'array-base' },
        ],
      },
    ],
  },
  {
    id: 'tree-traversals',
    lecture: 14,
    structure: 'tree',
    title: 'Preorder, inorder and postorder (recursive)',
    ref: 'Lec 14 p.1–2',
    intro: 'Each traversal is a function that calls itself for the left and the right subtree. The three differ ONLY in where the print is: before both calls (preorder), between them (inorder) or after both (postorder). A call with NULL returns immediately — the base case that stops the recursion.',
    params: { call: 'preorder' },
    cases: [
      { label: 'Preorder', setup: { values: LECTURE_VALUES }, params: { call: 'preorder' } },
      { label: 'Inorder', setup: { values: LECTURE_VALUES }, params: { call: 'inorder' } },
      { label: 'Postorder', setup: { values: LECTURE_VALUES }, params: { call: 'postorder' } },
      { label: 'Empty tree', setup: { values: [] }, params: { call: 'preorder' } },
    ],
    pseudo: `${PSEUDO_HEAD}

@fpre|function preorder(node)        # Root, Left, Right
@a1|    if node == NULL then
@a2|        return                   # empty subtree: nothing to do
    end if
@a3|    print node.data              # output FIRST
@a4|    preorder(node.left)
@a5|    preorder(node.right)
@fpre_end|end function

@fin|function inorder(node)         # Left, Root, Right
@b1|    if node == NULL then
@b2|        return
    end if
@b3|    inorder(node.left)
@b4|    print node.data              # output BETWEEN the subtrees
@b5|    inorder(node.right)
@fin_end|end function

@fpost|function postorder(node)      # Left, Right, Root
@c1|    if node == NULL then
@c2|        return
    end if
@c3|    postorder(node.left)
@c4|    postorder(node.right)
@c5|    print node.data              # output LAST
@fpost_end|end function

@m1|{{call}}(root)`,
    cpp: `${TREE_CPP_HEAD}

@fpre|void preorder(Node* node) {       // Root, Left, Right
@a1|    if (node == nullptr)
@a2|        return;                      // empty subtree: nothing to do
@a3|    cout << node->data << "\\n";      // output FIRST
@a4|    preorder(node->left);
@a5|    preorder(node->right);
@fpre_end|}

@fin|void inorder(Node* node) {        // Left, Root, Right
@b1|    if (node == nullptr)
@b2|        return;
@b3|    inorder(node->left);
@b4|    cout << node->data << "\\n";      // output BETWEEN the subtrees
@b5|    inorder(node->right);
@fin_end|}

@fpost|void postorder(Node* node) {     // Left, Right, Root
@c1|    if (node == nullptr)
@c2|        return;
@c3|    postorder(node->left);
@c4|    postorder(node->right);
@c5|    cout << node->data << "\\n";      // output LAST
@fpost_end|}

${TREE_CPP_SETUP}

${TREE_CPP_DESTROY}

int main() {
@setup|    {{build}}
@m1|    {{call}}(root);
@setup|    destroyTree(root);
}`,
    py: `${TREE_PY_HEAD}

@fpre,fpre_end|def preorder(node):           # Root, Left, Right
@a1|    if node is None:
@a2|        return                   # empty subtree: nothing to do
@a3|    print(node.data)             # output FIRST
@a4|    preorder(node.left)
@a5|    preorder(node.right)

@fin,fin_end|def inorder(node):            # Left, Root, Right
@b1|    if node is None:
@b2|        return
@b3|    inorder(node.left)
@b4|    print(node.data)             # output BETWEEN the subtrees
@b5|    inorder(node.right)

@fpost,fpost_end|def postorder(node):          # Left, Right, Root
@c1|    if node is None:
@c2|        return
@c3|    postorder(node.left)
@c4|    postorder(node.right)
@c5|    print(node.data)             # output LAST

${TREE_PY_SETUP}

@setup|{{build}}
@m1|{{call}}(root)`,
    notes: {
      a1: '**Base case.** A NULL subtree is empty: return at once. Every leaf causes two such calls (its missing left and right children).',
      a2: 'Edge case: on an empty tree the very first call returns here and nothing is printed.',
      a3: 'Preorder prints the node as soon as it is entered…',
      a4: '…then the whole left subtree is finished (a new call, a new frame on the call stack)…',
      a5: '…and then the right subtree. When this call returns, the caller continues where it left off.',
      b3: 'Inorder first finishes the whole left subtree…',
      b4: '…prints the node…',
      b5: '…then does the right subtree.',
      c3: 'Postorder finishes both subtrees first…',
      c5: '…and prints the node last: a node is printed only after all its descendants. (That is also the safe order for freeing a tree — see destroyTree in the C++ version.)',
      fpre: '**Recursion.** Each call has its own `node` variable (its own frame). The Variables panel shows the frames of the calls that are still running.',
      fin: '**Recursion.** Each call has its own `node` variable (its own frame).',
      fpost: '**Recursion.** Each call has its own `node` variable (its own frame).',
    },
    blanks: [
      {
        label: 'a1',
        why: 'The recursion must stop on an empty subtree.',
        wrong: [
          { cpp: 'if (node->left == nullptr)', py: 'if node.left is None:', pseudo: 'if node.left == NULL then', why: 'Then a node without a left child is never printed, and a NULL node is dereferenced.', tag: 'recursion-base' },
          { cpp: 'if (node != nullptr)', py: 'if node is not None:', pseudo: 'if node != NULL then', why: 'That returns for every REAL node and continues with NULL — the opposite test, and a crash.', tag: 'null-deref' },
        ],
      },
      {
        label: 'b4',
        why: 'Inorder prints the node between its two subtrees.',
        wrong: [
          { cpp: 'cout << node->left->data << "\\n";', py: 'print(node.left.data)', pseudo: 'print node.left.data', why: 'That prints the child, not the node — and crashes on a node without a left child.', tag: 'null-deref' },
        ],
      },
    ],
  },
  {
    id: 'tree-inorder-stack',
    lecture: 14,
    structure: 'tree',
    title: 'Inorder with an explicit stack (no recursion)',
    ref: 'Lec 14 p.1 (stack pictures)',
    intro: 'The stack pictures in the notes show what the recursion keeps track of. Here that stack is an ARRAY of node addresses with a `top` count, exactly like the array stack of Lec 12: go left as far as possible pushing every node, pop one, print it, then continue with its right subtree.',
    params: {},
    cases: [
      { label: 'Lecture tree', setup: { values: LECTURE_VALUES } },
      { label: 'Empty tree', setup: { values: [] } },
    ],
    pseudo: `${PSEUDO_HEAD}
# S is a stack of nodes (an array with a count top, as in Lec 12).
@s1|S = new Array(10)
@s2|top = 0

@fi|function inorder_stack()
@i1|    cur = root
@i2|    while cur != NULL or top > 0 do
@i3|        while cur != NULL do     # go as far left as possible…
@i4|            S[top] = cur         # …pushing every node on the way
@i5|            top = top + 1
@i6|            cur = cur.left
        end while
@i7|        top = top - 1            # pop the most recent node
@i8|        cur = S[top]
@i9|        print cur.data           # visit it
@i10|        cur = cur.right          # then its right subtree
    end while
@fi_end|end function

@m1|inorder_stack()`,
    cpp: `${TREE_CPP_HEAD}

// S is a stack of node addresses (an array with a count top, as in Lec 12).
@s1|Node* S[10];
@s2|int top = 0;

@fi|void inorder_stack() {
@i1|    Node* cur = root;
@i2|    while (cur != nullptr || top > 0) {
@i3|        while (cur != nullptr) {     // go as far left as possible…
@i4|            S[top] = cur;            // …pushing every node on the way
@i5|            top = top + 1;
@i6|            cur = cur->left;
        }
@i7|        top = top - 1;               // pop the most recent node
@i8|        cur = S[top];
@i9|        cout << cur->data << "\\n";   // visit it
@i10|        cur = cur->right;            // then its right subtree
    }
@fi_end|}

${TREE_CPP_SETUP}

${TREE_CPP_DESTROY}

int main() {
@setup|    {{build}}
@m1|    inorder_stack();
@setup|    destroyTree(root);
}`,
    py: `${TREE_PY_HEAD}

# S is a stack of nodes (a fixed list of slots with a count top, as in Lec 12).
@s1|S = [None] * 10
@s2|top = 0

@fi,fi_end|def inorder_stack():
    global top
@i1|    cur = root
@i2|    while cur is not None or top > 0:
@i3|        while cur is not None:   # go as far left as possible…
@i4|            S[top] = cur         # …pushing every node on the way
@i5|            top = top + 1
@i6|            cur = cur.left
@i7|        top = top - 1            # pop the most recent node
@i8|        cur = S[top]
@i9|        print(cur.data)          # visit it
@i10|        cur = cur.right          # then its right subtree

${TREE_PY_SETUP}

@setup|{{build}}
@m1|inorder_stack()`,
    notes: {
      s1: 'Room for 10 addresses: enough for any tree whose height is below 10, because the stack only holds the nodes on one path from the root.',
      i2: 'Continue while there is still a subtree to explore (cur) or a node waiting on the stack. Edge case: an empty tree fails both tests at once — nothing is printed.',
      i4: '**Push.** The node is remembered: it will be printed after its whole left subtree.',
      i6: 'Move to the left child. When it is NULL, the leftmost node of this subtree is on top of the stack.',
      i7: '**Pop.** top moves down first (top counts the items), then the node is read — the same order as pop() in Lec 12.',
      i9: 'Visit: the left subtree of this node is finished.',
      i10: 'Continue with the right subtree (NULL for a leaf: then the next pop happens).',
    },
    blanks: [
      {
        label: 'i6',
        why: 'After pushing, keep going LEFT.',
        wrong: [
          { cpp: 'cur = cur->right;', py: 'cur = cur.right', pseudo: 'cur = cur.right', why: 'Going right first prints the nodes in a different order (not inorder).', tag: 'order-confusion' },
        ],
      },
      {
        label: 'i10',
        why: 'After visiting a node, its right subtree comes next.',
        wrong: [
          { cpp: 'cur = nullptr;', py: 'cur = None', pseudo: 'cur = NULL', why: 'Then right subtrees are never visited (F, G and E would be missing).', tag: 'order-confusion' },
          { cpp: 'cur = cur->left;', py: 'cur = cur.left', pseudo: 'cur = cur.left', why: 'The left subtree was already done: nodes would be printed twice.', tag: 'order-confusion' },
        ],
      },
    ],
  },
];
