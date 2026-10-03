import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore, memoryStorage, STORAGE_KEY } from '../app/js/progress/store.js';
import { buildSession, followUpItem, nextActivity, conceptTemplates } from '../app/js/progress/scheduler.js';
import { CONCEPTS } from '../app/js/content/concepts.js';
import { generateExercise } from '../app/js/exercises/registry.js';

function clock(start = 1_700_000_000_000) {
  let t = start;
  const f = () => t;
  f.advance = (ms) => (t += ms);
  return f;
}

const attempt = (over = {}) => ({ templateId: 'l08-rewire-insert', seed: 1, concept: 'l08.insert-mid', type: 'rewire', lecture: 8, correct: true, hints: 0, revealed: false, guidance: 'less', ...over });

test('progress survives a reload (same storage)', () => {
  const storage = memoryStorage();
  const now = clock();
  const a = new ProgressStore(storage, { now });
  a.recordAttempt(attempt());
  a.markLessonStep('l08', 0, 5);
  a.setSession({ id: 's1', items: [{ templateId: 'l08-cost', seed: 3, status: 'pending' }], index: 0, mode: 'mixed', finished: false });
  const b = new ProgressStore(storage, { now });
  assert.equal(b.data.concepts['l08.insert-mid'].attempts, 1);
  assert.deepEqual(b.data.lessons.l08.done, [0]);
  assert.equal(b.data.session.id, 's1');
});

test('mastery needs repeated INDEPENDENT success on varied templates', () => {
  const s = new ProgressStore(memoryStorage(), { now: clock() });
  const c = 'l08.insert-mid';
  s.recordAttempt(attempt({ hints: 1 }));
  s.recordAttempt(attempt({ revealed: true, correct: false }));
  s.recordAttempt(attempt({ guidance: 'full' }));
  assert.equal(s.level(c), 'learning');
  for (let i = 0; i < 4; i++) s.recordAttempt(attempt());
  assert.notEqual(s.level(c), 'mastered', 'one template only');
  s.recordAttempt(attempt({ templateId: 'l08-order-insert', type: 'order' }));
  assert.equal(s.level(c), 'mastered');
  s.recordAttempt(attempt({ correct: false, tag: 'lost-access', message: 'x' }));
  assert.notEqual(s.level(c), 'mastered');
  assert.equal(s.isWeak(c), true);
});

test('mistakes, recurring tags, due and weak concepts', () => {
  const now = clock();
  const s = new ProgressStore(memoryStorage(), { now });
  s.recordAttempt(attempt({ correct: false, tag: 'lost-access', message: 'lost' }));
  s.recordAttempt(attempt({ correct: false, tag: 'lost-access', message: 'lost again', concept: 'l08.insert-beg' }));
  assert.equal(s.recentMistakes()[0].message, 'lost again');
  assert.deepEqual(s.recurringMistakes()[0], { tag: 'lost-access', count: 2 });
  assert.ok(s.dueConcepts().includes('l08.insert-mid'));
  assert.ok(s.weakConcepts().includes('l08.insert-beg'));
  s.recordAttempt(attempt({ concept: 'l07.tradeoffs', templateId: 'l07-choose', type: 'choose', lecture: 7 }));
  assert.ok(!s.dueConcepts().includes('l07.tradeoffs'));
  now.advance(3 * 24 * 3600 * 1000);
  assert.ok(s.dueConcepts().includes('l07.tradeoffs'));
});

test('export / import round trip and rejection of bad files; reset', () => {
  const s = new ProgressStore(memoryStorage(), { now: clock() });
  s.recordAttempt(attempt());
  const json = s.exportJSON();
  const t = new ProgressStore(memoryStorage(), { now: clock() });
  assert.equal(t.importJSON(json).ok, true);
  assert.equal(t.data.concepts['l08.insert-mid'].attempts, 1);
  assert.equal(t.importJSON('{"hello":1}').ok, false);
  assert.equal(t.importJSON('not json').ok, false);
  assert.equal(t.data.concepts['l08.insert-mid'].attempts, 1, 'failed import keeps data');
  t.setSetting('timer', true);
  t.reset();
  assert.deepEqual(t.data.concepts, {});
  assert.equal(t.data.settings.timer, true, 'reset keeps settings');
});

test('corrupted storage falls back to a blank profile', () => {
  const st = memoryStorage();
  st.setItem(STORAGE_KEY, '{broken');
  const s = new ProgressStore(st);
  assert.deepEqual(s.data.concepts, {});
});

test('every concept has at least one exercise template', () => {
  const idx = conceptTemplates();
  for (const c of CONCEPTS) assert.ok(idx[c.id] && idx[c.id].length, `no template for ${c.id}`);
});

test('sessions: size, regeneration from seeds, weak concepts first, follow-ups', () => {
  const s = new ProgressStore(memoryStorage(), { now: clock() });
  s.introduce(['l08.insert-beg', 'l09.delete-mid', 'l12.lifo-fifo', 'l14.bfs', 'l13.tree-terms']);
  const sess = buildSession(s, { mode: 'mixed', size: 8, seed: 42 });
  assert.equal(sess.items.length, 8);
  for (const it of sess.items) {
    const ex = generateExercise(it.templateId, it.seed, { guidance: it.guidance, params: it.params });
    assert.equal(ex.concept, it.concept);
  }
  // serialisable
  assert.deepEqual(JSON.parse(JSON.stringify(sess)), sess);
  // weak concept shows up in a review session
  s.recordAttempt(attempt({ concept: 'l12.lifo-fifo', templateId: 'l12-choose', type: 'choose', lecture: 12, correct: false, tag: 'lifo-fifo' }));
  const rev = buildSession(s, { mode: 'review', size: 4, seed: 7 });
  assert.ok(rev.items.some((x) => x.concept === 'l12.lifo-fifo'));
  const f = followUpItem(sess.items[0]);
  assert.equal(f.templateId, sess.items[0].templateId);
  assert.notEqual(f.seed, sess.items[0].seed);
  assert.equal(f.followUp, true);
  // concept session
  const cs = buildSession(s, { mode: 'concept', concept: 'l10.dll-links', size: 3, seed: 5 });
  assert.ok(cs.items.every((x) => x.concept === 'l10.dll-links'));
});

test('next activity recommendation', () => {
  const s = new ProgressStore(memoryStorage(), { now: clock() });
  assert.equal(nextActivity(s).kind, 'lesson');
  s.setSession({ id: 'x', mode: 'mixed', items: [{ status: 'pending' }], finished: false });
  assert.equal(nextActivity(s).kind, 'resume');
  s.clearSession();
  s.recordAttempt(attempt({ correct: false, tag: 'lost-access' }));
  assert.equal(nextActivity(s).kind, 'review');
});
