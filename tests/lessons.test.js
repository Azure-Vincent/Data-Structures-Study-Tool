import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../app/js/content/lessons.js';
import { LECTURES, CONCEPT_BY_ID } from '../app/js/content/concepts.js';
import { buildTrace } from '../app/js/sim/specs.js';
import { generateExercise, TEMPLATE_BY_ID } from '../app/js/exercises/registry.js';
import { makeQuestion, wantsPrediction } from '../app/js/sim/predict.js';
import { modelResponse } from './_model.js';

test('one lesson per lecture, every section cites a page or is supplementary', () => {
  assert.deepEqual(LESSONS.map((l) => l.lecture), LECTURES.map((l) => l.n));
  for (const l of LESSONS) for (const s of l.sections) {
    if (['read', 'note', 'code', 'sim', 'demo'].includes(s.type)) assert.ok(s.ref, `${l.id} "${s.title}" has no ref`);
    for (const c of s.concepts || []) assert.ok(CONCEPT_BY_ID[c], `unknown concept ${c}`);
  }
});

test('every lesson simulation builds a trace; predictions are answerable', () => {
  for (const l of LESSONS) for (const s of l.sections) {
    if (s.type === 'sim') {
      const tr = buildTrace(s);
      assert.ok(tr.steps.length >= 2, `${l.id} ${s.title}`);
      for (let i = 1; i < tr.steps.length; i++) {
        if (wantsPrediction(tr, i, s.predict || [])) {
          const q = makeQuestion(tr, i);
          assert.ok(q.options.includes(q.answer), `${s.title} step ${i}: answer not among options`);
          assert.equal(new Set(q.options).size, q.options.length);
        }
      }
    }
    if (s.type === 'codesim') for (const v of s.variants) {
      const tr = buildTrace({ struct: 'code', lines: v.lines, setup: v.setup, newValue: v.newValue });
      assert.ok(tr.steps.length >= 2);
    }
  }
});

test('lesson exercises generate with their params and accept the model answer', () => {
  for (const l of LESSONS) for (const s of l.sections) {
    if (s.type !== 'exercise') continue;
    assert.ok(TEMPLATE_BY_ID[s.templateId], `missing template ${s.templateId}`);
    for (const seed of [1, 2, 3]) {
      const ex = generateExercise(s.templateId, seed, { guidance: s.guidance, params: s.params || {} });
      assert.equal(ex.check(modelResponse(ex)).correct, true, `${l.id} ${s.title}`);
    }
  }
});

test('required examples use the specified data', () => {
  const ex = generateExercise('l08-rewire-insert', 5, { params: { kind: 'mid', values: [10, 20, 30], value: 15, pos: 2 } });
  assert.match(ex.prompt, /10 → 15 → 20 → 30/);
  const del = generateExercise('l09-rewire-delete', 5, { params: { kind: 'mid', values: [10, 15, 20, 30], deleteValue: 20 } });
  assert.match(del.prompt, /Delete \*\*20\*\*/);
  assert.match(del.prompt, /10 → 15 → 30/);
  const pre = generateExercise('l14-tree-order', 1, { params: { order: 'preorder', lectureTree: true } });
  assert.deepEqual(pre.answer, ['A', 'B', 'D', 'E', 'C', 'F', 'G']);
});

test('code sections: the pseudocode is valid Pseudocode Lab syntax, and complete programs run', async () => {
  const { syntaxCheck } = await import('../app/js/lab/lang.js');
  const { runAll } = await import('../app/js/lab/run.js');
  for (const l of LESSONS) for (const s of l.sections) {
    if (s.type !== 'code' || !s.pseudo) continue;
    const err = syntaxCheck(s.pseudo);
    assert.equal(err, null, `${l.id} "${s.title}": ${err && err.message} (line ${err && err.line})`);
    if (s.check) {
      const r = runAll(s.pseudo, { structure: s.labStructure || 'sll', values: [] }, { limit: 20000 });
      assert.equal(r.error, null, `${l.id} "${s.title}": ${r.error && r.error.message}`);
      for (const lang of ['c', 'cpp', 'py']) assert.ok(s[lang], `${l.id} "${s.title}" is checked, so it needs ${lang}`);
    }
  }
});

test('every "Build it in code" program is taught in a lesson, and every walkthrough names a program', async () => {
  const { IMPLEMENTATIONS, IMPL_BY_ID } = await import('../app/js/content/impl/index.js');
  const used = new Set();
  for (const l of LESSONS) for (const s of l.sections) {
    if (s.type !== 'walk') continue;
    assert.ok(IMPL_BY_ID[s.impl], `${l.id} "${s.title}": unknown program ${s.impl}`);
    assert.equal(IMPL_BY_ID[s.impl].lecture, l.lecture, `${s.impl} belongs to lecture ${IMPL_BY_ID[s.impl].lecture}`);
    used.add(s.impl);
  }
  for (const ex of IMPLEMENTATIONS) assert.ok(used.has(ex.id), `program ${ex.id} is not in any lesson`);
});

test('every lesson ends its new material with the predict → complete → write progression', () => {
  for (const l of LESSONS) {
    const ids = l.sections.filter((s) => s.type === 'exercise').map((s) => s.templateId);
    const pad = String(l.lecture).padStart(2, '0');
    assert.ok(ids.includes(`l${pad}-predict-output`), `${l.id}: predict`);
    assert.ok(ids.includes(`l${pad}-complete-code`), `${l.id}: complete`);
    assert.ok(ids.includes(`l${pad}-write-code`), `${l.id}: write`);
    const at = (t) => l.sections.findIndex((s) => s.templateId === t);
    assert.ok(at(`l${pad}-predict-output`) < at(`l${pad}-complete-code`) && at(`l${pad}-complete-code`) < at(`l${pad}-write-code`), `${l.id}: order`);
  }
});

test('no time-complexity material is left in lessons, exercises or programs', async () => {
  const { TEMPLATES, generateExercise } = await import('../app/js/exercises/registry.js');
  const { IMPLEMENTATIONS } = await import('../app/js/content/impl/index.js');
  const { CONCEPTS } = await import('../app/js/content/concepts.js');
  const banned = /\b(big[- ]?o|o\(\s*(1|n|log|n\^?2|n²)|Θ|Ω|θ\(|omega|theta|T\(n\)|time complexity|running time|asymptotic|growth rate)/i;
  const texts = [];
  for (const l of LESSONS) texts.push(JSON.stringify(l));
  for (const ex of IMPLEMENTATIONS) texts.push(JSON.stringify(ex));
  for (const c of CONCEPTS) texts.push(JSON.stringify(c));
  for (const t of TEMPLATES) {
    assert.notEqual(t.type, 'complexity', t.id);
    for (const seed of [1, 2, 3]) {
      const ex = generateExercise(t.id, seed);
      texts.push(JSON.stringify({ p: ex.prompt, h: ex.hints, s: ex.solutionText, o: ex.options, t: ex.title }));
    }
  }
  for (const t of texts) assert.ok(!banned.test(t), `complexity wording found: ${(t.match(banned) || [])[0]} in ${t.slice(0, 120)}`);
});
