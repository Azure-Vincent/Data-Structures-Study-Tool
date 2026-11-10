import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore, memoryStorage, STORAGE_KEY } from '../app/js/progress/store.js';
import { buildSession, followUpItem, nextActivity, conceptTemplates } from '../app/js/progress/scheduler.js';
import { CONCEPTS } from '../app/js/content/concepts.js';
import { generateExercise, TEMPLATE_BY_ID } from '../app/js/exercises/registry.js';
import { LESSONS, LESSON_BY_ID } from '../app/js/content/lessons.js';
import { migrateProgress, OLD_LESSON_KEYS, V2_LESSON_KEYS, KEY_RENAMES, REMOVED_TEMPLATES, REMOVED_CONCEPTS, CONTENT_VERSION } from '../app/js/progress/migrate.js';

const ALL_KEYS = new Set(LESSONS.flatMap((l) => l.sections.map((s) => s.key)));
const renamed = (k) => KEY_RENAMES[k] || k;
const moduleOfKey = (k) => LESSONS.find((l) => l.sections.some((s) => s.key === k))?.id;

function clock(start = 1_700_000_000_000) {
  let t = start;
  const f = () => t;
  f.advance = (ms) => (t += ms);
  return f;
}

const attempt = (over = {}) => ({ templateId: 'l08-rewire-insert', seed: 1, concept: 'l08.insert-mid', type: 'rewire', module: 'sll', correct: true, hints: 0, revealed: false, guidance: 'less', ...over });

test('progress survives a reload (same storage)', () => {
  const storage = memoryStorage();
  const now = clock();
  const a = new ProgressStore(storage, { now });
  a.recordAttempt(attempt());
  const keys = LESSON_BY_ID.sll.sections.map((x) => x.key);
  a.markLessonStep('sll', keys[0], keys);
  a.setSession({ id: 's1', items: [{ templateId: 'l08-fill', seed: 3, status: 'pending' }], index: 0, mode: 'mixed', finished: false });
  const b = new ProgressStore(storage, { now });
  assert.equal(b.data.concepts['l08.insert-mid'].attempts, 1);
  assert.deepEqual(b.data.lessons.sll.done, [keys[0]]);
  assert.equal(b.data.lessons.sll.at, keys[1]);
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
  s.recordAttempt(attempt({ concept: 'l07.tradeoffs', templateId: 'l07-choose', type: 'choose', module: 'memory' }));
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
  s.recordAttempt(attempt({ concept: 'l12.lifo-fifo', templateId: 'l12-choose', type: 'choose', module: 'stack', correct: false, tag: 'lifo-fifo' }));
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

// ---------------------------------------------------------------- content version 2 migration
function version1Save() {
  const t = 1_700_000_000_000;
  return {
    version: 1,
    createdAt: t,
    updatedAt: t,
    concepts: {
      'l07.arrays-vs-lists': { attempts: 3, correct: 3, independent: 2, hints: 1, revealed: 0, box: 2, due: t, lastSeen: t, recent: ['I', 'I', 'c'], templatesWon: ['l07-reach', 'l07-shifts'], introduced: true },
      'cx.list-costs': { attempts: 2, correct: 1, independent: 1, hints: 0, revealed: 0, box: 1, due: t, lastSeen: t, recent: ['I', 'x'], templatesWon: ['l08-cost'], introduced: true },
      'l13.tree-measures': { attempts: 1, correct: 1, independent: 1, hints: 0, revealed: 0, box: 1, due: t, lastSeen: t, recent: ['I'], templatesWon: ['l13-formulas'], introduced: true },
      'l08.insert-mid': { attempts: 1, correct: 1, independent: 1, hints: 0, revealed: 0, box: 1, due: t, lastSeen: t, recent: ['I'], templatesWon: ['l08-rewire-insert'], introduced: true },
    },
    types: { complexity: { attempts: 6, correct: 5, independent: 4, hints: 1 }, rewire: { attempts: 1, correct: 1, independent: 1, hints: 0 } },
    templates: { 'l07-reach': { attempts: 2, correct: 2 }, 'l08-cost': { attempts: 2, correct: 1 }, 'l08-rewire-insert': { attempts: 1, correct: 1 } },
    attempts: [
      { t, templateId: 'l07-reach', seed: 1, concept: 'l07.arrays-vs-lists', type: 'complexity', lecture: 7, correct: true, independent: true, hints: 0, revealed: false, tag: null },
      { t, templateId: 'l07-shifts', seed: 2, concept: 'l07.arrays-vs-lists', type: 'complexity', lecture: 7, correct: true, independent: true, hints: 1, revealed: false, tag: null },
      { t, templateId: 'lab-array-front', seed: 3, concept: 'l07.arrays-vs-lists', type: 'complexity', lecture: 7, correct: true, independent: false, hints: 0, revealed: false, tag: null },
      { t, templateId: 'l08-cost', seed: 4, concept: 'cx.list-costs', type: 'complexity', lecture: 8, correct: true, independent: true, hints: 0, revealed: false, tag: null },
      { t, templateId: 'l08-cost', seed: 5, concept: 'cx.list-costs', type: 'complexity', lecture: 8, correct: false, independent: false, hints: 0, revealed: false, tag: 'off-by-one' },
      { t, templateId: 'l13-formulas', seed: 6, concept: 'l13.tree-measures', type: 'complexity', lecture: 13, correct: true, independent: true, hints: 0, revealed: false, tag: null },
      { t, templateId: 'l08-rewire-insert', seed: 7, concept: 'l08.insert-mid', type: 'rewire', lecture: 8, correct: true, independent: true, hints: 0, revealed: false, tag: null },
    ],
    mistakes: [
      { t, templateId: 'l08-cost', seed: 5, concept: 'cx.list-costs', lecture: 8, type: 'complexity', tag: 'off-by-one', message: 'moves' },
      { t, templateId: 'l14-cost', seed: 5, concept: 'l14.traversal-cost', lecture: 14, type: 'complexity', tag: 'list-vs-matrix', message: 'matrix' },
      { t, templateId: 'l08-rewire-insert', seed: 9, concept: 'l08.insert-mid', lecture: 8, type: 'rewire', tag: 'lost-access', message: 'kept' },
    ],
    lessons: {
      l08: { at: 18, done: [0, 1, 2, 17, 18, 20], completed: false },
      l12: { at: 18, done: Array.from({ length: 19 }, (_, i) => i), completed: true },
    },
    session: { id: 's9', mode: 'mixed', index: 0, items: [{ templateId: 'l08-cost', seed: 1, concept: 'cx.list-costs', status: 'pending' }, { templateId: 'l08-fill', seed: 2, concept: 'l08.insert-end', status: 'pending' }], finished: false },
    lab: { drafts: { 'ex:sll-traverse': 'cur = start' }, solved: { 'sll-traverse': t }, last: '#/lab/sll-traverse' },
    settings: { motion: 'system', speed: 2, timer: false, timerMinutes: 8, theme: 'dark', predictMode: true },
  };
}

test('every lesson section has a unique stable key, and retained version-1 keys still exist', () => {
  for (const l of LESSONS) {
    const keys = l.sections.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length, `${l.id}: duplicate keys`);
    assert.ok(keys.every((k) => typeof k === 'string' && k.length > 2), `${l.id}: missing keys`);
  }
  const removed = ['r:cost-finding-the-position-vs-changing-links', 'e:count-the-pointer-moves', 'r:head-only-vs-head-tail', 's:deleting-the-tail-even-though-tail-is-known', 'e:count-the-work', 'r:cost-of-the-circle', 'e:count-the-moves', 'e:which-end-is-cheaper', 'r:cost-of-traversals', 'e:list-vs-matrix', 'p:write-your-own-pseudocode-insert-at-the-end', 'p:write-your-own-pseudocode-delete-the-node-at-pos', 'p:write-your-own-pseudocode-delete-node-t-from-a-d'];
  for (const [id, old] of Object.entries(OLD_LESSON_KEYS)) for (const k of old) if (!removed.includes(k)) assert.ok(ALL_KEYS.has(renamed(k)), `${id}: retained section ${k} lost its key`);
  // every version-2 section still exists in one of the modules
  for (const [id, keys] of Object.entries(V2_LESSON_KEYS)) for (const k of keys) assert.ok(ALL_KEYS.has(renamed(k)), `${id}: section ${k} lost its key`);
  // renamed keys are new names, never reused
  for (const [a, b] of Object.entries(KEY_RENAMES)) assert.ok(!ALL_KEYS.has(a) && ALL_KEYS.has(b), `${a} → ${b}`);
});

test('version-1 progress migrates: lesson steps by key, time-complexity data removed, the rest kept', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(version1Save()));
  const s = new ProgressStore(storage, { now: clock() });
  const d = s.data;
  assert.equal(d.contentVersion, CONTENT_VERSION);
  // lessons: indices became keys, removed sections are dropped, and the steps moved to their modules
  const k8 = OLD_LESSON_KEYS.l08;
  assert.deepEqual(d.lessons.sll.done, [0, 1, 2, 17, 18, 20].map((i) => renamed(k8[i])).filter((k) => ALL_KEYS.has(k)));
  assert.ok(!d.lessons.sll.done.includes(k8[17]) && !d.lessons.sll.done.includes(k8[18]), 'the two cost sections are gone');
  assert.equal(d.lessons.sll.at, renamed(k8[19]), 'old step 18 (a cost exercise) is gone, so it reopens at the next retained step');
  assert.equal(d.lessons.stack.done.length + d.lessons.queue.done.length, 18, 'l12: the cost exercise was dropped; the rest is split between stacks and queues');
  assert.ok(d.lessons.stack.done.every((k) => moduleOfKey(k) === 'stack') && d.lessons.queue.done.every((k) => moduleOfKey(k) === 'queue'));
  assert.equal(d.lessons.l08, undefined);
  assert.equal(d.lessons.l12, undefined);
  // topics
  assert.equal(d.concepts['cx.list-costs'], undefined);
  const arr = d.concepts['l07.arrays-vs-lists'];
  assert.equal(arr.attempts, 0, 'all three arrays-vs-lists attempts were cost questions');
  assert.equal(arr.independent, 0);
  assert.deepEqual(arr.templatesWon, []);
  assert.equal(d.concepts['l13.tree-measures'].attempts, 1, 'node-count formulas are kept');
  assert.deepEqual(d.concepts['l13.tree-measures'].templatesWon, ['l13-formulas']);
  assert.equal(d.concepts['l08.insert-mid'].attempts, 1);
  // logs and statistics
  assert.deepEqual(d.attempts.map((a) => a.templateId), ['l13-formulas', 'l08-rewire-insert']);
  assert.equal(d.attempts[0].type, 'predict');
  assert.deepEqual(d.mistakes.map((m) => m.message), ['kept']);
  assert.equal(d.types.complexity, undefined);
  assert.equal(d.types.predict.attempts, 1);
  assert.deepEqual(Object.keys(d.templates), ['l08-rewire-insert']);
  // session keeps only retained exercises
  assert.deepEqual(d.session.items.map((x) => x.templateId), ['l08-fill']);
  // untouched parts
  assert.equal(d.lab.drafts['ex:sll-traverse'], 'cur = head', 'the list head pointer is now called head');
  assert.ok(d.attempts.every((a) => a.module && !('lecture' in a)));
  assert.equal(d.attempts[0].module, 'tree');
  assert.equal(d.settings.theme, 'dark');
  // every remaining reference resolves
  for (const a of d.attempts) assert.ok(!REMOVED_TEMPLATES.includes(a.templateId));
  for (const id of Object.keys(d.concepts)) assert.ok(!REMOVED_CONCEPTS.includes(id));
  for (const it of d.session.items) assert.ok(TEMPLATE_BY_ID[it.templateId]);
  // migrating twice changes nothing
  assert.deepEqual(migrateProgress(d), d);
});

test('importing a version-1 export migrates it too', () => {
  const s = new ProgressStore(memoryStorage(), { now: clock() });
  const r = s.importJSON(JSON.stringify({ app: 'ds-study-lab', exportedAt: 'x', ...version1Save() }));
  assert.equal(r.ok, true);
  assert.equal(s.data.contentVersion, CONTENT_VERSION);
  assert.equal(s.data.concepts['cx.list-costs'], undefined);
  assert.ok(s.data.lessons.sll.done.every((k) => typeof k === 'string'));
});

// ---------------------------------------------------------------- content version 3 migration (lessons → modules)
test('version-2 progress migrates to the learning modules', () => {
  const t = 1_700_000_000_000;
  const v2 = {
    version: 1,
    contentVersion: 2,
    createdAt: t,
    updatedAt: t,
    concepts: {},
    types: {},
    templates: {},
    attempts: [{ t, templateId: 'l12-choose', seed: 1, concept: 'l12.array-queue', type: 'choose', lecture: 12, correct: true, independent: true, hints: 0, revealed: false, tag: null }],
    mistakes: [],
    lessons: {
      l07: { at: V2_LESSON_KEYS.l07[0], done: [...V2_LESSON_KEYS.l07], completed: true },
      l08: { at: V2_LESSON_KEYS.l08[3], done: V2_LESSON_KEYS.l08.slice(0, 3), completed: false },
      l11: { at: V2_LESSON_KEYS.l11[1], done: [V2_LESSON_KEYS.l11[0]], completed: false },
      l12: { at: V2_LESSON_KEYS.l12[14], done: V2_LESSON_KEYS.l12.slice(0, 14), completed: false },
    },
    session: { id: 's1', mode: 'lecture', lecture: 12, index: 0, items: [{ templateId: 'l12-choose', seed: 3, concept: 'l12.lifo-fifo', status: 'pending' }], finished: false },
    lab: { drafts: { 'free:dll': 'p = start', 'free:graph': 'start = s', 'drill:aqueue-enqueue-dequeue': 'F = 0' }, solved: {}, last: null, freeValues: { graph: { graph: 'lec14', s: 'a' } } },
    drills: { cards: {}, topics: ['stacks-queues', 'arrays'], newPerDay: 5, session: null },
    settings: { theme: 'dark' },
  };
  const d = migrateProgress(v2);
  assert.equal(d.contentVersion, CONTENT_VERSION);
  // Module 1 holds exactly the old first lesson, so it stays completed
  assert.equal(d.lessons.memory.completed, true);
  // three old lessons form the singly linked list module; the earliest unfinished one decides where it reopens
  assert.deepEqual(d.lessons.sll.done, [...V2_LESSON_KEYS.l08.slice(0, 3), V2_LESSON_KEYS.l11[0]].map(renamed));
  assert.equal(d.lessons.sll.at, renamed(V2_LESSON_KEYS.l08[3]));
  assert.equal(d.lessons.sll.completed, false);
  // the stack and queue lesson is split
  assert.ok(d.lessons.stack.done.length > 0 && d.lessons.queue.done.length > 0);
  assert.equal(d.lessons.stack.done.length + d.lessons.queue.done.length, 14);
  for (const id of ['l07', 'l08', 'l11', 'l12']) assert.equal(d.lessons[id], undefined);
  // sessions, attempts, review topics, drafts and the saved example graph
  assert.equal(d.session.mode, 'module');
  assert.equal(d.session.module, 'stack');
  assert.equal(d.attempts[0].module, 'queue');
  assert.deepEqual(d.drills.topics, ['stack', 'queue', 'memory']);
  assert.equal(d.lab.drafts['free:dll'], 'p = head');
  assert.equal(d.lab.drafts['free:graph'], 'start = s', 'only list structures had a start pointer');
  assert.equal(d.lab.drafts['drill:aqueue-enqueue-dequeue'], 'F = 0');
  assert.equal(d.lab.freeValues.graph.graph, 'example');
  // the store loads it, and migrating again changes nothing
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(v2));
  assert.equal(new ProgressStore(storage, { now: clock() }).data.lessons.sll.at, renamed(V2_LESSON_KEYS.l08[3]));
  assert.deepEqual(migrateProgress(d), d);
});
