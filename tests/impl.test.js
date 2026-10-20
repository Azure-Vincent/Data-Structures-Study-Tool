// The "Build it in code" programs: every case runs in the Lab without errors,
// the three languages carry the same labels, every executed pseudocode line can
// be shown in C++ and Python, and the outputs match the lecture's answers.
// (tests/langs/verify.mjs additionally compiles and runs the C++ and Python.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMPLEMENTATIONS, IMPL_BY_ID } from '../app/js/content/impl/index.js';
import { compileExample, linesWithLabels, parseMarked, buildCall } from '../app/js/content/impl/format.js';
import { runAll } from '../app/js/lab/run.js';
import { STRUCTURES } from '../app/js/lab/structures.js';
import { MISTAKE_LABELS } from '../app/js/content/concepts.js';

const LANGS = ['pseudo', 'cpp', 'py'];
const labelSet = (prog) => new Set(prog.labels.flat().filter((l) => l !== 'setup'));
const run = (id, caseIndex = 0) => {
  const p = compileExample(IMPL_BY_ID[id], caseIndex);
  return runAll(p.pseudo.text, p.setup, { limit: 20000 });
};

test('program ids are unique and every program names a Lab structure and a lecture', () => {
  const ids = IMPLEMENTATIONS.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const ex of IMPLEMENTATIONS) {
    assert.ok(STRUCTURES[ex.structure], `${ex.id}: unknown structure ${ex.structure}`);
    assert.ok(ex.lecture >= 7 && ex.lecture <= 14, ex.id);
    assert.ok(ex.title && ex.ref && ex.intro, ex.id);
    assert.ok(Array.isArray(ex.cases) && ex.cases.length, ex.id);
    for (const lang of LANGS) assert.equal(typeof ex[lang], 'string', `${ex.id}: ${lang}`);
  }
});

test('every lecture 07–14 has at least one program', () => {
  for (let l = 7; l <= 14; l++) assert.ok(IMPLEMENTATIONS.some((x) => x.lecture === l), `lecture ${l}`);
});

test('every case runs to the end in the Lab without errors', () => {
  for (const ex of IMPLEMENTATIONS) {
    ex.cases.forEach((c, ci) => {
      const p = compileExample(ex, ci);
      const r = runAll(p.pseudo.text, p.setup, { limit: 20000 });
      assert.equal(r.syntax, null, `${ex.id} [${c.label}]: ${r.syntax && r.syntax.message}`);
      assert.equal(r.error, null, `${ex.id} [${c.label}]: ${r.error && r.error.message}`);
      assert.ok(r.done, `${ex.id} [${c.label}] did not finish`);
      assert.ok(!/\{\{\w+\}\}/.test(p.pseudo.text + p.cpp.text + p.py.text), `${ex.id}: unfilled placeholder`);
    });
  }
});

test('the three languages carry the same labels', () => {
  for (const ex of IMPLEMENTATIONS) {
    const p = compileExample(ex, 0);
    const [ps, cs, ys] = LANGS.map((l) => labelSet(p[l]));
    for (const l of ps) {
      assert.ok(cs.has(l), `${ex.id}: label ${l} is missing in C++`);
      assert.ok(ys.has(l), `${ex.id}: label ${l} is missing in Python`);
    }
    for (const l of [...cs, ...ys]) assert.ok(ps.has(l), `${ex.id}: label ${l} is missing in the pseudocode`);
    assert.ok(!p.pseudo.labels.flat().includes('setup'), `${ex.id}: setup lines belong to C++/Python only`);
  }
});

test('every executed pseudocode line (and every call site) is highlighted in C++ and Python', () => {
  for (const ex of IMPLEMENTATIONS) {
    ex.cases.forEach((c, ci) => {
      const p = compileExample(ex, ci);
      const r = runAll(p.pseudo.text, p.setup, { limit: 20000 });
      for (const st of r.steps) {
        const lines = [st.line];
        if (st.change && st.change.type === 'call') lines.push(st.change.from);
        if (st.change && st.change.type === 'frame-pop') lines.push(st.change.to);
        for (const ln of lines.filter(Boolean)) {
          const ls = p.pseudo.labels[ln - 1] || [];
          assert.ok(ls.length, `${ex.id} [${c.label}]: pseudocode line ${ln} "${p.pseudo.lines[ln - 1].trim()}" has no label`);
          for (const lang of ['cpp', 'py']) assert.ok(linesWithLabels(p[lang], ls).length, `${ex.id}: ${lang} has no line for ${ls}`);
        }
      }
    });
  }
});

test('notes and fill-in blanks refer to existing labels; each blank is exactly one line in every language', () => {
  for (const ex of IMPLEMENTATIONS) {
    const p = compileExample(ex, 0);
    const ps = labelSet(p.pseudo);
    for (const k of Object.keys(ex.notes || {})) assert.ok(ps.has(k), `${ex.id}: note for unknown label ${k}`);
    for (const b of ex.blanks || []) {
      for (const lang of LANGS) assert.equal(linesWithLabels(p[lang], [b.label]).length, 1, `${ex.id}: blank ${b.label} in ${lang}`);
      assert.ok(b.why && b.wrong.length, `${ex.id}: blank ${b.label}`);
      for (const w of b.wrong) {
        for (const lang of LANGS) assert.equal(typeof w[lang], 'string', `${ex.id}: blank ${b.label} wrong option in ${lang}`);
        for (const lang of LANGS) assert.ok(!w[lang].includes('\n'), `${ex.id}: wrong options are single lines`);
        assert.ok(MISTAKE_LABELS[w.tag], `${ex.id}: unknown mistake tag ${w.tag}`);
      }
    }
  }
});

test('the programs reproduce the lecture answers', () => {
  const out = (id, ci) => run(id, ci).state.output.map(String).join(' ');
  assert.equal(out('tree-traversals', 0), 'A B D E C F G');
  assert.equal(out('tree-traversals', 1), 'D B E A F C G');
  assert.equal(out('tree-traversals', 2), 'D E B F G C A');
  assert.equal(out('tree-traversals', 3), '');
  assert.equal(out('tree-inorder-stack', 0), 'D B E A F C G');
  assert.equal(out('graph-bfs', 0), 'a b e f c d g i h');
  assert.equal(out('graph-dfs', 0), 'a b c g d e f i h');
  assert.equal(out('stack-array', 0), 'stack overflow 33 22 11 stack underflow -1');
  assert.equal(out('queue-array', 0), '11 queue full 22 33 44 queue empty -1');
  assert.equal(out('sll-insert-beg', 1), '5');
  assert.equal(out('sll-delete-beg', 2), 'No nodes exist');
});

test('linked queue: rear becomes NULL when the final item leaves', () => {
  const r = run('queue-linked', 1);
  assert.equal(r.state.frames[0].vars.front, null);
  assert.equal(r.state.frames[0].vars.rear, null);
});

test('format helpers', () => {
  const m = parseMarked('@a|x = 1\n  plain\n@b,c|y = 2\n');
  assert.deepEqual(m.lines, ['x = 1', '  plain', 'y = 2']);
  assert.deepEqual(m.labels, [['a'], [], ['b', 'c']]);
  assert.deepEqual(linesWithLabels(m, ['c']), [2]);
  assert.equal(buildCall('cpp', [1, 2]), 'build({1, 2});');
  assert.equal(buildCall('py', ['A', null]), "build(['A', '-'])");
  assert.equal(buildCall('cpp', []), 'build({});');
});
