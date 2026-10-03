// Generates many variations of EVERY exercise template and checks that
// (1) the model answer is accepted, (2) an obviously wrong answer is rejected,
// (3) generation is deterministic for a seed, (4) hints and solutions exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, generateExercise } from '../app/js/exercises/registry.js';
import { modelResponse } from './_model.js';

function wrongResponse(ex) {
  switch (ex.kind) {
    case 'mcq':
      return ex.options.find((o) => o.id !== ex.answer)?.id;
    case 'multi':
      return ex.options.filter((o) => !ex.answer.includes(o.id)).map((o) => o.id);
    case 'numeric':
      return String((ex.answer ?? 0) + 1);
    case 'text':
      return ex.answer.length ? [...ex.answer].reverse().concat(['999']).join(' ') : '999';
    case 'sequence':
      return [...ex.answer].reverse().concat(['zz']);
    case 'nodepick':
      return ex.answer.length ? [] : ['zz'];
    case 'rewire':
      return [];
    case 'fill':
      return 'start = NULL';
    case 'fields':
      return Object.fromEntries(Object.keys(ex.answer).map((k) => [k, typeof ex.answer[k] === "number" ? String(ex.answer[k] + 1) : "zz " + ex.answer[k]]));
    default:
      return null;
  }
}

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);

test('there are at least five templates per lecture module', () => {
  for (const lec of [7, 8, 9, 10, 11, 12, 13, 14]) {
    const n = TEMPLATES.filter((t) => t.lecture === lec).length;
    assert.ok(n >= 5, `lecture ${lec} has ${n} templates`);
  }
});

test('every lecture has at least one edge-case template variation', () => {
  for (const lec of [7, 8, 9, 10, 11, 12, 13, 14]) {
    let edge = false;
    for (const t of TEMPLATES.filter((t) => t.lecture === lec)) for (const s of SEEDS) if (generateExercise(t.id, s).edge) edge = true;
    assert.ok(edge, `lecture ${lec} produced no edge cases`);
  }
});

for (const t of TEMPLATES) {
  test(`template ${t.id}: model answers accepted, wrong answers rejected`, () => {
    const seen = new Set();
    for (const s of SEEDS) {
      const ex = generateExercise(t.id, s);
      const ex2 = generateExercise(t.id, s);
      assert.equal(JSON.stringify(ex.prompt), JSON.stringify(ex2.prompt), 'deterministic prompt');
      assert.ok(ex.prompt && ex.prompt.length > 10, 'has prompt');
      assert.equal(ex.hints.length, 3, 'three hints');
      assert.ok(ex.solutionText !== undefined || ex.kind === 'rewire', 'solution text');
      const good = ex.check(modelResponse(ex));
      assert.equal(good.correct, true, `${t.id} seed ${s}: model answer rejected: ${good.message}\nPROMPT: ${ex.prompt}`);
      const bad = wrongResponse(ex);
      if (bad !== null && bad !== undefined) {
        const r = ex.check(bad);
        assert.equal(r.correct, false, `${t.id} seed ${s}: wrong answer accepted (${JSON.stringify(bad)})`);
        assert.ok(r.message && r.message.length > 5, 'wrong answer gets feedback');
      }
      seen.add(JSON.stringify({ p: ex.prompt, v: ex.visual, a: ex.answer, o: ex.options, i: ex.items, t: ex.template, c: ex.canvas }));
    }
    assert.ok(seen.size >= Math.min(5, SEEDS.length / 8), `${t.id}: only ${seen.size} distinct variations`);
  });
}
