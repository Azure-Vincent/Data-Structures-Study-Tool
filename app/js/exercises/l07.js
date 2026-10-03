// Lecture 07 — Introduction: arrays vs linked lists, memory, pointers.
import { opts, mcq, multi, numeric, reflect } from './kit.js';

const SCENARIOS = [
  { s: 'You store 12 monthly temperatures and often read “the value for month k”.', a: 'array', why: 'The size is fixed and known, and an array reaches element k directly with one address calculation.' },
  { s: 'A music queue where songs are constantly inserted at the FRONT, and the number of songs is unknown when the program starts.', a: 'list', why: 'Inserting at the front of an array shifts every element; a linked list only changes two pointers, and it grows as needed.' },
  { s: 'You must read exam score number k instantly, for any k, thousands of times per second.', a: 'array', why: 'Random access: array element k is at base + k·size. A linked list needs k−1 pointer moves.' },
  { s: 'An editor keeps an undo history that grows and shrinks unpredictably while the program runs.', a: 'list', why: 'Linked lists are dynamic: nodes are allocated when needed and freed when no longer needed.' },
  { s: 'A small embedded device stores exactly 1000 sensor readings (4-byte ints) and memory is very tight.', a: 'array', why: 'Each linked node also stores a pointer, so for small items a list can use roughly double the memory.' },
  { s: 'While walking through a long collection you frequently remove the element you are standing on.', a: 'list', why: 'Removing from a linked list only relinks the neighbour; an array must shift all later elements left.' },
  { s: 'You need to binary-search a sorted collection of 1,000,000 items.', a: 'array', why: 'Binary search jumps to the middle repeatedly — that needs constant-time access by index, which only the array gives.' },
];

export const l07 = [
  {
    id: 'l07-choose',
    lecture: 7,
    concept: 'l07.tradeoffs',
    type: 'choose',
    title: 'Array or linked list?',
    generate(rng) {
      const sc = rng.pick(SCENARIOS);
      const o = opts(rng, [
        { text: 'Array', correct: sc.a === 'array', why: sc.a === 'array' ? sc.why : `An array would work, but ${sc.why.charAt(0).toLowerCase() + sc.why.slice(1)}`, tag: 'tradeoff' },
        { text: 'Linked list', correct: sc.a === 'list', why: sc.a === 'list' ? sc.why : `A list would work, but ${sc.why.charAt(0).toLowerCase() + sc.why.slice(1)}`, tag: 'tradeoff' },
      ]);
      return {
        prompt: `**Scenario.** ${sc.s}\n\nWhich structure fits better?`,
        ...mcq(o),
        reflection: reflect('In one or two sentences, name the operation that decided it and what it would cost in the other structure.'),
        hints: [
          'Ask: which operation happens most often — reading by position, or inserting/removing?',
          { text: 'Lec 07 p.4 lists the six differences side by side.' },
          'Arrays win at “read element k”; linked lists win at “insert/remove where I already am”.',
        ],
      };
    },
  },
  {
    id: 'l07-address',
    lecture: 7,
    concept: 'l07.memory-layout',
    type: 'predict',
    title: 'Contiguous memory: compute an address',
    generate(rng) {
      const t = rng.pick([
        { name: 'int', size: 4 },
        { name: 'char', size: 1 },
        { name: 'double', size: 8 },
        { name: 'float', size: 4 },
      ]);
      const base = rng.int(10, 90) * 100;
      const n = rng.int(5, 10);
      const edge = rng.bool(0.25);
      const i = edge ? 0 : rng.int(1, n - 1);
      const ans = base + i * t.size;
      return {
        prompt: `\`${t.name} a[${n}];\` starts at address **${base}**. A ${t.name} takes **${t.size}** byte(s).\n\nAt what address is \`a[${i}]\` stored?`,
        visual: { type: 'array', n, base, size: t.size, highlight: i, label: t.name },
        edge,
        ...numeric(ans, {
          explain: `Arrays are contiguous: address of a[i] = base + i × size = ${base} + ${i} × ${t.size} = ${ans}. Linked-list nodes are NOT contiguous, so no formula can find node i — you must follow i pointers.`,
          wrong: {
            [base + (i + 1) * t.size]: { msg: 'That is one element too far: a[0] is AT the base address, so a[i] is i steps past it.', tag: 'off-by-one' },
            [base + i]: { msg: 'Each step moves by the element size, not by 1 byte.', tag: 'element-size' },
          },
        }),
        hints: ['Contiguous means the elements sit side by side with no gaps.', { text: 'a[0] is at the base; each next element is one element-size further.' }, `Multiply the index by ${t.size} and add it to ${base}.`],
      };
    },
  },
  {
    id: 'l07-shifts',
    lecture: 7,
    concept: 'l07.arrays-vs-lists',
    type: 'complexity',
    title: 'Counting shifts in an array',
    generate(rng) {
      const n = rng.int(0, 9);
      const MAX = n + rng.int(1, 3);
      const kind = n === 0 ? 'insertFront' : rng.pick(['insertFront', 'insertAt', 'deleteAt', 'deleteLast', 'deleteFirst']);
      let k = 0;
      let ans;
      let what;
      if (kind === 'insertFront') {
        ans = n;
        what = 'insert a new value at index 0 (the front)';
      } else if (kind === 'insertAt') {
        k = rng.int(0, n);
        ans = n - k;
        what = `insert a new value at index ${k}`;
      } else if (kind === 'deleteAt') {
        k = rng.int(0, n - 1);
        ans = n - 1 - k;
        what = `delete the value at index ${k}`;
      } else if (kind === 'deleteLast') {
        k = n - 1;
        ans = 0;
        what = `delete the LAST value (index ${n - 1})`;
      } else {
        ans = n - 1;
        what = 'delete the value at index 0';
      }
      const edge = n <= 1 || ans === 0;
      return {
        prompt: `An array has capacity ${MAX} and currently holds **${n}** value(s) in indices 0..${Math.max(0, n - 1)} (a separate counter stores ${n}).\n\nYou ${what}. Counting one “shift” for every element that must move one slot, how many shifts happen?`,
        visual: { type: 'array', n: MAX, filled: n, highlight: kind.startsWith('insert') || kind === 'deleteFirst' ? (kind === 'deleteFirst' ? 0 : k) : k },
        edge,
        ...numeric(ans, {
          explain: `Every element to the ${kind.startsWith('insert') ? 'right of the insertion point moves right' : 'right of the deleted slot moves left'} by one: ${ans} shift(s); then the counter is ${kind.startsWith('insert') ? 'increased' : 'decreased'}. Worst case (front) is n shifts → Θ(n). A linked list does the same insert/delete with a constant number of pointer writes once it is at the right place. Correction to Lec 07 p.2(c): deleting FROM an array is possible (shift + counter); what an array cannot do is shrink or grow its allocated size.`,
          wrong: { [n]: { msg: 'Not every element moves — only the ones after the position.', tag: 'shift-count' }, [ans + 1]: { msg: 'Count only elements that actually move.', tag: 'off-by-one' } },
        }),
        hints: ['Only elements on one side of the position have to move.', { text: 'Count the filled cells to the right of the position.' }, `Indices after the position: from ${kind.startsWith('insert') ? k : k + 1} to ${n - 1}.`],
      };
    },
  },
  {
    id: 'l07-classify',
    lecture: 7,
    concept: 'l07.linear-nonlinear',
    type: 'classify',
    title: 'Linear or non-linear?',
    generate(rng) {
      const which = rng.pick(['linear', 'nonlinear', 'primitive']);
      if (which === 'primitive') {
        const items = [
          { text: 'Integer', p: true },
          { text: 'Float', p: true },
          { text: 'Char', p: true },
          { text: 'Pointer', p: true },
          { text: 'Array', p: false },
          { text: 'Linked list', p: false },
          { text: 'File', p: false },
          { text: 'Tree', p: false },
        ];
        const pick = rng.sample(items, 6);
        return {
          prompt: 'Select every **primitive** data structure (Lec 07 p.1).',
          ...multi(opts(rng, pick.map((x) => ({ text: x.text, correct: x.p, why: x.p ? 'a single built-in value' : 'built from other values (non-primitive)', tag: 'taxonomy' })))),
          hints: ['Primitive = a single value the language provides directly.', { text: 'Lec 07 p.1: the left branch of the chart.' }, 'Integers, floats, chars and pointers are primitive.'],
        };
      }
      const all = [
        { text: 'Array', lin: true },
        { text: 'Stack', lin: true },
        { text: 'Queue', lin: true },
        { text: 'Linked list', lin: true },
        { text: 'Tree', lin: false },
        { text: 'Graph', lin: false },
      ];
      const want = which === 'linear';
      return {
        prompt: `Select every **${which === 'linear' ? 'linear' : 'non-linear'}** structure.`,
        ...multi(opts(rng, all.map((x) => ({ text: x.text, correct: x.lin === want, why: x.lin ? 'elements form one sequence (each has at most one successor)' : 'elements form a hierarchy/network (a node can have several successors)', tag: 'taxonomy' }))), {
          explain: 'Note: “linear” is about the logical order, not memory. A linked list is linear even though its nodes are scattered (non-contiguous) in memory.',
        }),
        hints: ['Linear: you can line all elements up so each has one next element.', { text: 'Lec 13 p.1 gives the definition.' }, 'Trees and graphs let one element lead to several others.'],
      };
    },
  },
  {
    id: 'l07-malloc',
    lecture: 7,
    concept: 'l07.pointers-alloc',
    type: 'fill',
    title: 'Complete the malloc call',
    generate(rng) {
      const t = rng.pick(['int', 'float', 'char', 'double', 'node']);
      const n = rng.int(2, 100);
      const v = t === 'node' ? 'p' : t[0] + 'p';
      const model = `sizeof(${t})`;
      return {
        prompt: `Allocate space for **${n}** values of type \`${t}\` on the heap. Fill the blank.`,
        kind: 'fill',
        template: `${t} *${v};\n${v} = (${t} *) malloc(${n} * ____);`,
        placeholder: 'e.g. sizeof(...)',
        answer: model,
        check(resp) {
          const s = String(resp ?? '').replace(/\s+/g, '').replace(/;$/, '');
          if (s === `sizeof(${t})` || s === `sizeof(*${v})` || s === `sizeof${t}` || s === `sizeof*${v}`) return { correct: true, message: `malloc counts BYTES, so multiply the count by the size of one ${t}. In C++ you would write \`${t} *${v} = new ${t}[${n}];\` and later \`delete[] ${v};\` instead of free(${v}).` };
          if (/^\d+$/.test(s)) return { correct: false, message: `A hard-coded number assumes a size for ${t} that depends on the machine; use sizeof(${t}).`, tag: 'sizeof' };
          if (s === `sizeof(${v})`) return { correct: false, message: `sizeof(${v}) is the size of the POINTER (e.g. 8 bytes), not of one ${t}.`, tag: 'sizeof' };
          return { correct: false, message: `malloc needs the number of bytes for one ${t}: sizeof(${t}).`, tag: 'sizeof' };
        },
        solutionText: `${model}  →  ${v} = (${t} *) malloc(${n} * sizeof(${t}));  …  free(${v});`,
        hints: ['malloc’s argument is a number of BYTES.', { text: 'Lec 07 p.2: ip = (int *) malloc(100 * sizeof(int)).' }, `Use the sizeof operator on ${t}.`],
      };
    },
  },
  {
    id: 'l07-membug',
    lecture: 7,
    concept: 'l07.pointers-alloc',
    type: 'bug',
    title: 'Spot the memory bug',
    generate(rng) {
      const v = rng.pick(['p', 'q', 'ptr', 'cp']);
      const cases = [
        { code: [`${v} = (int *) malloc(sizeof(int));`, `*${v} = 5;`, `${v} = (int *) malloc(sizeof(int));`, `free(${v});`], a: 'leak', why: `The second malloc overwrote the only copy of the first block's address, so that block can never be freed.` },
        { code: [`${v} = (int *) malloc(sizeof(int));`, `free(${v});`, `*${v} = 7;`], a: 'dangling', why: `After free(${v}), ${v} still holds the old address but the memory is no longer ours. Writing through it is undefined behaviour (dangling pointer). Set ${v} = NULL after freeing.` },
        { code: [`${v} = (int *) malloc(sizeof(int));`, `free(${v});`, `free(${v});`], a: 'double', why: 'The same block is released twice — undefined behaviour that can corrupt the heap.' },
        { code: [`${v} = (int *) malloc(sizeof(int));`, `*${v} = 3;`, `free(${v});`, `${v} = NULL;`], a: 'ok', why: 'Allocate, use, free once, then clear the pointer. Nothing is leaked and nothing dangles.' },
      ];
      const c = rng.pick(cases);
      const o = opts(rng, [
        { text: 'Memory leak (a block can no longer be freed)', correct: c.a === 'leak', why: c.a === 'leak' ? c.why : 'Is any block left with no pointer to it?', tag: 'memory-bug' },
        { text: 'Dangling pointer / use after free', correct: c.a === 'dangling', why: c.a === 'dangling' ? c.why : 'Is freed memory used again?', tag: 'memory-bug' },
        { text: 'Double free', correct: c.a === 'double', why: c.a === 'double' ? c.why : 'Is the same block freed twice?', tag: 'memory-bug' },
        { text: 'No problem', correct: c.a === 'ok', why: c.a === 'ok' ? c.why : 'Look again: ' + c.why, tag: 'memory-bug' },
      ]);
      return {
        prompt: 'What is wrong with this code?',
        visual: { type: 'code', lines: c.code },
        ...mcq(o),
        hints: ['Track each block: who points to it, and has it been freed?', { text: 'free() is the opposite of malloc() (Lec 07 p.2).' }, 'Draw the pointer after every line.'],
      };
    },
  },
  {
    id: 'l07-reach',
    lecture: 7,
    concept: 'l07.arrays-vs-lists',
    type: 'complexity',
    title: 'Reaching element k',
    generate(rng) {
      const n = rng.int(3, 12);
      const edge = rng.bool(0.25);
      const k = edge ? rng.pick([1, n]) : rng.int(2, n - 1);
      return {
        prompt: `A singly linked list has ${n} nodes and you only have \`start\`. Starting from \`temp = start\` (temp is at node 1), how many \`temp = temp->next\` moves are needed to stand on node **${k}**?`,
        edge,
        ...numeric(k - 1, {
          explain: `Node 1 needs 0 moves, node k needs k−1 = ${k - 1}. In an array, element k is one address calculation away regardless of k: that is why “searching/locating” in a list is Θ(n) in the worst case (Lec 07 p.3 disadvantage ②).`,
          wrong: { [k]: { msg: 'temp already stands on node 1 before any move.', tag: 'off-by-one' } },
        }),
        hints: ['Each move advances temp by exactly one node.', { text: 'temp starts AT node 1.' }, 'Count the arrows between node 1 and node k.'],
      };
    },
  },
  {
    id: 'l07-storage',
    lecture: 7,
    concept: 'l07.memory-layout',
    type: 'choose',
    title: 'Where does the memory live?',
    generate(rng) {
      const cases = [
        { code: 'void f() {\n    int a[5];\n}', q: 'the array a', a: 'stack', why: 'A local array is an automatic variable: it lives in f’s stack frame and disappears when f returns.' },
        { code: 'void f() {\n    int *a = (int *) malloc(5 * sizeof(int));\n}', q: 'the 5 ints that a points to', a: 'heap', why: 'malloc always allocates on the heap. So an ARRAY can live on the heap too — “array” describes the layout (contiguous), not the storage location.' },
        { code: 'void f() {\n    int *a = (int *) malloc(5 * sizeof(int));\n}', q: 'the pointer variable a itself', a: 'stack', why: 'a is a local variable (stack); only the block it points to is on the heap.' },
        { code: 'node *start = NULL;   /* global */\n...\nnewnode = getnode();', q: 'the node returned by getnode()', a: 'heap', why: 'getnode() calls malloc, so nodes are on the heap.' },
        { code: 'node *start = NULL;   /* global, outside any function */', q: 'the pointer variable start', a: 'static', why: 'Global variables live in the static/global data area for the whole program, not on the stack or the heap.' },
        { code: 'int a[5];   /* global */', q: 'the array a', a: 'static', why: 'A global array lives in the static area. So “array = stack” (Lec 07 p.4 ②) is a simplification: it is true only for local arrays.' },
      ];
      const c = rng.pick(cases);
      const o = opts(rng, [
        { text: 'Stack (automatic, function frame)', correct: c.a === 'stack', why: c.a === 'stack' ? c.why : c.why, tag: 'storage-location' },
        { text: 'Heap (malloc / new)', correct: c.a === 'heap', why: c.why, tag: 'storage-location' },
        { text: 'Static / global data area', correct: c.a === 'static', why: c.why, tag: 'storage-location' },
      ]);
      return {
        prompt: `Where is **${c.q}** stored?`,
        visual: { type: 'code', lines: c.code.split('\n') },
        ...mcq(o, { explain: 'Correction to Lec 07 p.4 ②: the storage location depends on HOW memory is obtained (local variable, global, malloc), not on whether the structure is an array or a list.' }),
        hints: ['Ask: is it a local variable, a global variable, or created by malloc/new?', { text: 'Lec 08 p.1 draws start on the stack and nodes on the heap.' }, 'malloc → heap; local → stack; global → static area.'],
      };
    },
  },
];
