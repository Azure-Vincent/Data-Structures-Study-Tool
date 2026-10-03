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
