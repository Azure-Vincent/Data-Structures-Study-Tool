// Pseudocode Lab: parser, interpreter, analysis, execution history and exercises.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, syntaxCheck, reindent, nextIndent, highlightLine, LabError } from '../app/js/lab/lang.js';
import { Execution, runAll } from '../app/js/lab/run.js';
import { buildInitial, parseValues, describeSetup } from '../app/js/lab/structures.js';
import { listValues, levelOrder, lostAddrs, structureText } from '../app/js/lab/analysis.js';
import { EXERCISES, EXAMPLES } from '../app/js/lab/exercises.js';
import { checkExercise } from '../app/js/lab/check.js';
import { ProgressStore, memoryStorage } from '../app/js/progress/store.js';

const SLL = { structure: 'sll', values: [10, 20, 30] };
const run = (code, setup = SLL, opts) => runAll(code, setup, opts);
const vals = (x) => listValues(x.state).values;
const kinds = (x) => x.steps.map((s) => s.kind);
const issues = (x, title) => x.issues.filter((i) => !title || i.title === title);

// ---------------------------------------------------------------- language
test('parser accepts the documented syntax', () => {
  const src = [
    '# comment',
    'x = 1',
    'y := 2',
    'z ← 3',
    'x += 4',
    'p = new Node(15)',
    'p->next = start',
    'p.data = 7',
    'if x > 1 and not (y == 2) then',
    '  print x, y',
    'else if x == 0 then',
    '  print "zero"',
    'elif x < 0 then',
    '  print "neg"',
    'else',
    '  print "other"',
    'end if',
    'while p != NULL do',
    '  p = p.next',
    'end while',
    'for i = 1 to 5 step 2 do',
    '  continue',
    'end',
    'for each w in [1, 2, 3] do',
    '  break',
    'end for',
    'repeat',
    '  x = x - 1',
    'until x <= 0',
    'do',
    '  x = x + 1',
    'while x < 3',
    'delete p',
    'free(q)',
    'function f(a, b)',
    '  return a mod b',
    'end function',
    'print(f(7, 3), 2)',
  ].join('\n');
  const ast = parse(src);
  assert.deepEqual(Object.keys(ast.funcs), ['f']);
  assert.equal(ast.body.filter((s) => s.t === 'assign').length, 7);
  assert.ok(ast.body.some((s) => s.t === 'repeat' && s.stopWhen === false), 'do … while parsed');
});

test('syntax errors name the line and explain the fix', () => {
  const cases = [
    ['if x = 5 then\nend', 1, /==/],
    ['x = 1\nwhile x < 3\n  x = x + 1\nend', 2, /missing “do”/],
    ['if a then\n  b = 1\n', 3, /line 1 is never closed/],
    ['end', 1, /doesn’t belong/],
    ['int x = 5', 1, /don’t need a type/],
    ['p.next = q {', 1, /Braces/],
    ['print "oops', 1, /closing quote/],
    ['x = 3 +', 1, /ends too early/],
    ['cur.next', 1, /does nothing/],
    ['x++', 1, /not supported/],
    ['while x do\n  if y then\n    z = 1\nend', 4, /never closed/],
    ['if a then\n  b = 1\nend while', 3, /closes the if/],
    ['return 5', 1, /inside a function/],
    ['break', 1, /inside a loop/],
    ['x = 1 < 2 < 3', 1, /chained/],
    ['p = malloc(8)', 1, /new Node/],
  ];
  for (const [src, line, re] of cases) {
    const e = syntaxCheck(src);
    assert.ok(e instanceof LabError, `expected a syntax error for ${JSON.stringify(src)}`);
    assert.equal(e.kind, 'syntax');
    assert.equal(e.line, line, `${JSON.stringify(src)} → line ${e.line}: ${e.message}`);
    assert.match(e.message + ' ' + e.hint, re, `${JSON.stringify(src)} → ${e.message} ${e.hint}`);
  }
});

test('re-indenting, Enter indentation and highlighting', () => {
  assert.equal(reindent('if a then\nwhile b do\nx = 1\nend\nelse\ny = 2\nend'), 'if a then\n  while b do\n    x = 1\n  end\nelse\n  y = 2\nend');
  assert.equal(reindent('repeat\nx = 1\nuntil x\ndo\ny = 1\nwhile y'), 'repeat\n  x = 1\nuntil x\ndo\n  y = 1\nwhile y');
  assert.equal(nextIndent('  while p != NULL do'), '    ');
  assert.equal(nextIndent('  x = 1'), '  ');
  assert.equal(nextIndent('else'), '  ');
  const spans = highlightLine('p.next = new Node(15) # c');
  assert.deepEqual(spans.filter((s) => s.cls).map((s) => [s.cls, s.text]), [['tk-op', '.'], ['tk-field', 'next'], ['tk-op', '='], ['tk-kw', 'new'], ['tk-type', 'Node'], ['tk-op', '('], ['tk-num', '15'], ['tk-op', ')'], ['tk-com', '# c']]);
});

// ---------------------------------------------------------------- interpreter
test('setups build stable addresses for every structure', () => {
  const { state } = buildInitial({ structure: 'dll', values: [1, 2, 3] });
  assert.deepEqual(Object.keys(state.nodes), ['100', '200', '300']);
  assert.equal(state.nodes[200].left, 100);
  assert.equal(state.nodes[200].right, 300);
  const q = buildInitial({ structure: 'queue', values: [1, 2] }).state;
  assert.deepEqual(q.frames[0].vars.rear, { ref: 200 });
  const c = buildInitial({ structure: 'csll', values: [1, 2] }).state;
  assert.equal(c.nodes[200].next, 100);
  const t = buildInitial({ structure: 'tree', values: ['A', 'B', null, 'C', 'X'] }).state;
  assert.deepEqual(levelOrder(t, t.frames[0].vars.root).values, ['A', 'B', null, 'C', 'X']);
  assert.deepEqual(parseValues('10, 20 - x'), [10, 20, null, 'x']);
  assert.equal(describeSetup({ structure: 'queue', values: [] }), 'empty queue (front = rear = NULL)');
});

test('correct insert-after: distinct alloc, move and link steps with stable identities', () => {
  const x = run('newnode = new Node(15)\nnewnode.next = start.next\nstart.next = newnode');
  assert.deepEqual(kinds(x), ['start', 'alloc', 'move', 'link', 'link', 'end']);
  assert.deepEqual(vals(x), [10, 15, 20, 30]);
  assert.equal(x.steps[1].hl.nodes[0], 400, 'new node gets the next free address');
  assert.deepEqual(x.steps[4].change, { type: 'field', addr: 100, field: 'next', from: 200, to: 400, text: 'start.next' });
  assert.equal(issues(x).length, 0);
});

test('value change vs pointer change vs traversal are different step kinds', () => {
  const x = run('p = start.next\np.data = 99\np = p.next\nstart.next = p');
  assert.deepEqual(kinds(x).slice(1, 5), ['move', 'data', 'move', 'link']);
  assert.match(x.steps[2].text, /Value change.*No pointer moved/);
  assert.match(x.steps[3].text, /moves along p\.next/);
  assert.equal(x.state.nodes[200].data, 99);
  assert.equal(x.state.nodes[200].next, 300, 'changing data kept the link');
});

test('conditions, loops, functions, recursion and collections run for real', () => {
  const x = run('function len(p)\n  if p == NULL then\n    return 0\n  end\n  return 1 + len(p.next)\nend\nn = len(start)\ntotal = 0\nfor i = 1 to n do\n  total = total + i\nend\nprint n, total, 7 / 2, 7 mod 2');
  assert.deepEqual(x.state.output, ['3 6 3 1']);
  assert.ok(kinds(x).includes('call') && kinds(x).includes('return'));
  const y = run('s = new Stack()\npush(s, 1)\npush(s, 2)\nq = new Queue()\nenqueue(q, pop(s))\nenqueue(q, pop(s))\nwhile not isEmpty(q) do\n  print dequeue(q)\nend\na = [5, 6]\na[1] = 9\nappend(a, 3)\nprint a, size(a)');
  assert.deepEqual(y.state.output, ['2', '1', '[5, 9, 3] 3']);
  const z = run('i = 0\nrepeat\n  i = i + 1\nuntil i == 3\ndo\n  i = i + 1\nwhile i < 5\nprint i');
  assert.deepEqual(z.state.output, ['5']);
  const g = run('for each w in neighbors(G, s) do\n  print w\nend\nprint degree(G, "e"), hasEdge(G, "a", "b")', { structure: 'graph', graph: 'lec14' });
  assert.deepEqual(g.state.output, ['b', 'e', 'f', '5 true']);
});

test('functions copy parameters but can assign globals (C-like scoping)', () => {
  const x = run('function bad(head)\n  head = NULL\nend\nfunction good()\n  start = start.next\nend\nbad(start)\ngood()');
  assert.deepEqual(vals(x), [20, 30], 'bad() changed only its copy; good() moved the global');
  assert.equal(issues(x, 'Lost reference').length, 1, 'node 10 is lost when good() moves start');
});

test('short-circuit and/or protects against NULL', () => {
  const x = run('p = NULL\nif p != NULL and p.data == 5 then\n  print "x"\nend\nprint p == NULL or p.data == 1');
  assert.equal(x.error, null);
  assert.deepEqual(x.state.output, ['true']);
});

// ---------------------------------------------------------------- runtime errors
test('runtime errors are precise and stop execution', () => {
  const cases = [
    ['cur = start\nwhile cur.next != NULL do\n  cur = cur.next\nend\nprint cur.next.data', 'null-deref', /cur\.next is NULL, so cur\.next\.data does not exist/],
    ['temp = start\ndelete temp\nprint temp.data', 'dangling', /deleted on line 2/],
    ['print curr.data', 'undefined-var', /curr has no value/],
    ['delete start\ndelete start', 'dangling', /already deleted/],
    ['start.next = 15', 'value-vs-address', /must point to a node or be NULL/],
    ['if start == 10 then\n  print 1\nend', 'value-vs-address', /compares a node.*with the value 10/],
    ['x = start + 1', 'value-vs-address', /arithmetic on pointers/],
    ['p = start.prev', 'value-vs-address', /no field “prev”/],
    ['x = start.data\nprint x.next', 'value-vs-address', /not a node/],
    ['q = new Queue()\nprint dequeue(q)', 'overflow', /empty queue/],
    ['n = new Node(1)\nfoo(n)', undefined, /no function called foo/],
    ['function f(n)\n  return f(n + 1)\nend\nx = f(1)', 'infinite-loop', /nested calls/],
    ['x = 1 / 0', undefined, /Division by zero/],
  ];
  for (const [code, tag, re] of cases) {
    const x = run(code);
    assert.ok(x.error, `expected a runtime error for ${JSON.stringify(code)}`);
    assert.equal(x.error.kind, 'runtime');
    assert.match(x.error.message, re, code);
    if (tag) assert.equal(x.error.tag, tag, code);
    assert.equal(x.steps[x.steps.length - 1].kind, 'error');
    assert.ok(x.error.line >= 1);
  }
  const typo = run('Start = NULL\nprint strat');
  assert.match(typo.error.hint, /Did you mean start\?/);
});

test('the instruction limit stops endless loops without hanging', () => {
  const t0 = Date.now();
  const x = run('p = start\nwhile p != NULL do\n  print p.data\nend', SLL, { limit: 500 });
  assert.equal(x.error.tag, 'infinite-loop');
  assert.match(x.error.message, /500 steps/);
  assert.equal(x.executed, 500);
  assert.ok(Date.now() - t0 < 3000);
  const circ = run('p = start\nwhile p != NULL do\n  p = p.next\nend', { structure: 'csll', values: [1, 2, 3] });
  assert.equal(circ.error.tag, 'infinite-loop');
});

test('code never reaches the host: names are only lab variables or functions', () => {
  for (const code of ['window.alert(1)', 'x = globalThis', 'process.exit(1)', 'eval("1")', 'x = constructor', 'toString()']) {
    const x = run(code);
    assert.ok(x.syntax || x.error, code);
    assert.ok(!x.syntax || x.syntax.kind === 'syntax');
  }
  assert.equal(syntaxCheck('__proto__ = 1').kind, 'syntax');
});

// ---------------------------------------------------------------- analysis
test('lost reference: names exactly which pointer changed and which nodes became unreachable', () => {
  const x = run('newnode = new Node(15)\nstart.next = newnode\nnewnode.next = start.next');
  const lost = issues(x, 'Lost reference');
  assert.equal(lost.length, 1);
  assert.equal(lost[0].line, 2);
  assert.deepEqual(lost[0].addrs, [200, 300]);
  assert.match(lost[0].message, /start\.next \(the next field of @100\) changed from @200 to @400, and it was the last reference to @200/);
  assert.match(lost[0].hint, /Order matters/);
  // the self-loop is first a note (temporary), then a final warning
  assert.ok(issues(x, 'Temporary cycle').some((i) => i.severity === 'note'));
  assert.ok(issues(x, 'Unintended cycle').some((i) => i.severity === 'warning'));
  assert.deepEqual(lostAddrs(x.state), [200, 300]);
  assert.match(structureText(x.state), /loops back to @400/);
});

test('temporary disconnections during valid updates are not errors', () => {
  // a new node held only by a variable, a node held only by temp, and deleting before setting NULL
  const ok = [
    'newnode = new Node(5)\nnewnode.next = start\nstart = newnode',
    'temp = start\nstart = start.next\ndelete temp',
    'prev = start\nwhile prev.next.next != NULL do\n  prev = prev.next\nend\ndelete prev.next\nprev.next = NULL',
    'n = new Node(1)\nstart.next.next.next = n',
  ];
  for (const code of ok) {
    const x = run(code);
    assert.equal(x.error, null, code);
    assert.deepEqual(issues(x).filter((i) => i.severity !== 'note'), [], code);
  }
  const del = run(ok[2]);
  assert.ok(issues(del, 'Deleted node still linked').every((i) => i.severity === 'note'));
});

test('returning from a function can lose nodes held only by its locals', () => {
  const x = run('function make()\n  n = new Node(9)\nend\nmake()');
  const lost = issues(x, 'Lost reference');
  assert.equal(lost.length, 1);
  assert.match(lost[0].message, /When make returned, its local variables \(n\) disappeared/);
});

test('final checks: dangling roots, broken back links, open circles, wrong rear', () => {
  assert.ok(issues(run('delete start'), 'Dangling pointer').length);
  const dll = run('n = new Node(5)\nn.right = start\nstart = n', { structure: 'dll', values: [10, 20] });
  assert.match(issues(dll, 'Broken back link')[0].message, /@100 \(10\)\.left should point back to @300/);
  const circ = run('n = new Node(4)\np = start\nwhile p.next != start do\n  p = p.next\nend\np.next = n', { structure: 'csll', values: [1, 2] });
  assert.ok(issues(circ, 'Circle not closed').length);
  const q = run('front = front.next\ndelete start', { structure: 'queue', values: [1] });
  assert.ok(q.error, 'start is undefined in a queue');
  const q2 = run('temp = front\nfront = front.next\ndelete temp', { structure: 'queue', values: [1] });
  assert.ok(issues(q2, 'Dangling pointer').some((i) => /rear/.test(i.message)));
  const tree = run('root.left.left = root', { structure: 'tree', values: ['A', 'B'] });
  assert.ok(issues(tree, 'Cycle in the tree').length);
});

// ---------------------------------------------------------------- history controls
test('execution history: lazy forward, back, goto, stop and reset use real snapshots', () => {
  const x = new Execution('cur = start\nwhile cur != NULL do\n  cur = cur.next\nend', SLL);
  assert.equal(x.steps.length, 1);
  assert.ok(x.forward() && x.forward() && x.forward());
  assert.equal(x.index, 3);
  assert.equal(x.steps.length, 4, 'steps are computed only when needed');
  const at3 = JSON.stringify(x.current.state);
  assert.ok(x.back());
  assert.equal(x.index, 2);
  assert.ok(x.forward());
  assert.equal(JSON.stringify(x.current.state), at3, 'stepping forward again replays the same snapshot');
  assert.equal(x.steps.length, 4, 'no re-execution when replaying history');
  x.goto(1);
  assert.deepEqual(x.current.state.frames[0].vars.cur, { ref: 100 });
  x.runToEnd();
  assert.ok(x.atEnd && x.done);
  assert.equal(x.current.kind, 'end');
  assert.equal(x.steps[1].state.frames[0].vars.cur.ref, 100, 'earlier snapshots are not mutated later');
  x.reset();
  assert.equal(x.index, 0);
  assert.ok(!x.back());

  const y = new Execution('p = start\nwhile p != NULL do\n  print 1\nend', SLL);
  y.forward();
  y.forward();
  y.stop();
  assert.ok(y.done && y.stopped);
  assert.equal(y.current.kind, 'stopped');
  assert.ok(!y.forward(), 'a stopped program cannot continue');
  assert.ok(y.back());

  const s = new Execution('x = (1', SLL);
  assert.ok(s.syntax);
  assert.equal(s.issues[0].category, 'syntax');
  assert.ok(!s.forward());
});

// ---------------------------------------------------------------- exercises
test('every exercise: solution passes, starter fails, common mistakes get the right diagnosis', () => {
  const structures = new Set(EXERCISES.map((e) => e.structure));
  for (const s of ['sll', 'dll', 'csll', 'stack', 'queue', 'tree', 'graph']) assert.ok(structures.has(s), `exercise for ${s}`);
  for (const ex of EXERCISES) {
    assert.ok(ex.hints.length >= 3 && ex.goal && ex.tests.length >= 2, ex.id);
    const sol = checkExercise(ex, ex.solution);
    assert.ok(sol.passed, `${ex.id} solution: ${JSON.stringify(sol.tests.filter((t) => !t.pass))}`);
    assert.ok(!checkExercise(ex, ex.starter).passed, `${ex.id} starter should not already pass`);
    for (const m of ex.mistakes || []) {
      const r = checkExercise(ex, m.code);
      assert.ok(!r.passed, `${ex.id} mistake passed: ${m.code}`);
      const tags = r.tests.flatMap((t) => t.problems.map((p) => p.tag));
      assert.ok(tags.includes(m.tag), `${ex.id}: expected ${m.tag}, got ${tags.join(', ')}`);
    }
  }
});

test('the headline exercise explains a wrong pointer order on every failing test', () => {
  const ex = EXERCISES.find((e) => e.id === 'sll-insert-after');
  const r = checkExercise(ex, 'newnode = new Node(15)\nstart.next = newnode\nnewnode.next = start.next');
  assert.equal(r.tag, 'lost-access');
  const t0 = r.tests[0];
  assert.match(t0.problems[0].text, /Expected start → 10 → 15 → 20 → 30 → NULL/);
  assert.match(t0.why, /Line 2: .*changed from @200 to @400/);
  // empty and single-node cases are covered and graded
  assert.ok(ex.tests.some((t) => t.setup.values.length === 1));
  const syntax = checkExercise(ex, 'newnode = new Node(15');
  assert.equal(syntax.syntax.kind, 'syntax');
});

test('free-mode examples run without errors', () => {
  for (const [s, list] of Object.entries(EXAMPLES)) {
    for (const ex of list) {
      if (/^Wrong/.test(ex.title)) continue;
      const setup = s === 'graph' ? { structure: s, graph: 'lec14' } : { structure: s, values: ex.values || (s === 'tree' ? ['A', 'B', 'C', 'D', 'E', 'F', 'G'] : s === 'stack' ? [30, 20, 10] : [10, 20, 30]) };
      const x = run(ex.code, setup);
      assert.equal(x.error, null, `${s} / ${ex.title}: ${x.error && x.error.message}`);
      assert.equal(x.syntax, null, `${s} / ${ex.title}`);
    }
  }
});

test('progress store keeps lab drafts and solved exercises (and old saves still load)', () => {
  const storage = memoryStorage();
  const a = new ProgressStore(storage);
  let notified = 0;
  a.onChange(() => notified++);
  a.setLabDraft('ex:sll-traverse', 'cur = start');
  assert.equal(notified, 0, 'drafts save quietly');
  a.markLabSolved('sll-traverse');
  const b = new ProgressStore(storage);
  assert.equal(b.labDraft('ex:sll-traverse'), 'cur = start');
  assert.ok(b.labData().solved['sll-traverse']);
  const legacy = JSON.parse(storage.getItem('dslab.progress.v1'));
  delete legacy.lab;
  storage.setItem('dslab.progress.v1', JSON.stringify(legacy));
  const c = new ProgressStore(storage);
  assert.equal(c.labDraft('anything'), undefined);
  c.setLabDraft('free:sll', 'x = 1');
  assert.equal(c.labDraft('free:sll'), 'x = 1');
});
