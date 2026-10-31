// Pseudocode drills: the spaced-repetition schedule and how the store keeps it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRILL_DECK, DRILL_BY_ID, DRILL_TOPICS, DRILL_INTERVALS, AGAIN_DELAY, applyReview, dueCards, newCards, newLeftToday, sessionCards, aheadCards, forecast, cardStatus, whenText, blankDrills, topicOf } from '../app/js/progress/drills.js';
import { EXERCISES } from '../app/js/lab/exercises.js';
import { ProgressStore, memoryStorage, STORAGE_KEY, blankProgress } from '../app/js/progress/store.js';

const DAY = 864e5;
const T0 = new Date(2026, 9, 5, 9, 0).getTime(); // a Monday morning, local time

function clock(start = T0) {
  let t = start;
  const f = () => t;
  f.advance = (ms) => (t += ms);
  return f;
}

test('the deck: every graded main-course Lab exercise is a card, in lecture order, with a topic', () => {
  const main = EXERCISES.filter((e) => !e.supplementary);
  assert.equal(DRILL_DECK.length, main.length);
  assert.ok(DRILL_DECK.every((c, i) => i === 0 || DRILL_DECK[i - 1].ex.lecture <= c.ex.lecture));
  assert.ok(!DRILL_BY_ID['bst-insert'] && !DRILL_BY_ID['sll-reverse'], 'supplementary exercises are not cards');
  const topics = new Set(DRILL_TOPICS.map((t) => t.id));
  for (const c of DRILL_DECK) assert.ok(topics.has(c.topic), c.id);
  // linked lists, stacks and queues, and graphs are all covered
  assert.equal(topicOf(DRILL_BY_ID['sll-insert-end'].ex), 'lists');
  assert.equal(topicOf(DRILL_BY_ID['csll-delete-first'].ex), 'lists');
  assert.equal(topicOf(DRILL_BY_ID['stack-pop'].ex), 'stacks-queues');
  assert.equal(topicOf(DRILL_BY_ID['astack-push-pop'].ex), 'stacks-queues');
  assert.equal(topicOf(DRILL_BY_ID['queue-dequeue'].ex), 'stacks-queues');
  assert.equal(topicOf(DRILL_BY_ID['graph-bfs'].ex), 'graphs');
  assert.equal(topicOf(DRILL_BY_ID['graph-matrix-build'].ex), 'graphs');
  for (const t of ['lists', 'stacks-queues', 'graphs', 'trees', 'arrays']) assert.ok(DRILL_DECK.some((c) => c.topic === t), t);
});

test('good moves a card up a box and the interval grows; hard keeps the box; again resets it', () => {
  let r = applyReview(null, 'good', T0);
  assert.equal(r.box, 1);
  assert.equal(r.due, T0 + DRILL_INTERVALS[1] * DAY);
  assert.equal(r.firstAt, T0);
  r = applyReview(r, 'good', T0 + DAY);
  assert.equal(r.box, 2);
  assert.equal(r.due, T0 + DAY + DRILL_INTERVALS[2] * DAY);
  r = applyReview(r, 'hard', T0 + 4 * DAY);
  assert.equal(r.box, 2, 'hard keeps the box');
  assert.equal(r.due, T0 + 4 * DAY + (DRILL_INTERVALS[2] / 2) * DAY, 'hard waits half the interval');
  r = applyReview(r, 'again', T0 + 6 * DAY);
  assert.equal(r.box, 1);
  assert.equal(r.lapses, 1);
  assert.equal(r.due, T0 + 6 * DAY + AGAIN_DELAY);
  assert.equal(r.reps, 4);
  assert.deepEqual(r.history.map((x) => x.r), ['good', 'good', 'hard', 'again']);
  // the box never exceeds the last one
  let top = null;
  for (let i = 0; i < 12; i++) top = applyReview(top, 'good', T0);
  assert.equal(top.box, DRILL_INTERVALS.length - 1);
  // a hard first review still waits at least a day
  assert.equal(applyReview(null, 'hard', T0).due, T0 + DAY);
});

test('sessions: every due card first (earliest first), then at most the daily number of new cards', () => {
  const d = blankDrills();
  assert.equal(dueCards(d, T0).length, 0);
  assert.equal(newLeftToday(d, T0), d.newPerDay);
  const first = sessionCards(d, T0);
  assert.deepEqual(first, DRILL_DECK.slice(0, d.newPerDay).map((c) => c.id), 'new cards come in lecture order');
  // review the first three today: they count against today's new cards
  for (const id of first.slice(0, 3)) d.cards[id] = applyReview(null, 'good', T0);
  assert.equal(newLeftToday(d, T0), d.newPerDay - 3);
  assert.equal(newCards(d).length, DRILL_DECK.length - 3);
  // next day: the three are due, and five new cards are allowed again
  const t1 = T0 + DAY + 60000;
  assert.deepEqual(dueCards(d, t1).map((c) => c.id).sort(), first.slice(0, 3).sort());
  const s = sessionCards(d, t1);
  assert.equal(s.length, 3 + d.newPerDay);
  assert.deepEqual(s.slice(0, 3).sort(), first.slice(0, 3).sort());
  // topic filter
  d.topics = ['graphs'];
  assert.ok(sessionCards(d, t1).every((id) => DRILL_BY_ID[id].topic === 'graphs'));
  d.topics = [];
  assert.ok(sessionCards(d, t1).length > 0, 'no topic chosen means every topic');
});

test('practise ahead, forecast, status and "when" text', () => {
  const d = blankDrills();
  const ids = DRILL_DECK.slice(0, 3).map((c) => c.id);
  d.cards[ids[0]] = applyReview(null, 'good', T0); // due tomorrow
  d.cards[ids[1]] = applyReview(applyReview(applyReview(null, 'good', T0), 'good', T0), 'good', T0); // box 3: a week
  d.cards[ids[2]] = applyReview(null, 'again', T0); // 10 minutes
  assert.deepEqual(aheadCards(d, T0, 2), [ids[2], ids[0]]);
  const f = forecast(d, T0);
  assert.equal(f[0], 1, 'today: the forgotten card');
  assert.equal(f[1], 1, 'tomorrow');
  assert.equal(f.reduce((a, b) => a + b, 0), 2, 'the week-long card is beyond the 7 days shown');
  assert.equal(cardStatus(null, T0), 'new');
  assert.equal(cardStatus(d.cards[ids[0]], T0), 'learning');
  assert.equal(cardStatus(d.cards[ids[1]], T0), 'remembered');
  assert.equal(cardStatus(d.cards[ids[0]], T0 + 2 * DAY), 'due');
  assert.equal(whenText(T0 - 1, T0), 'now');
  assert.equal(whenText(T0 + AGAIN_DELAY, T0), 'in 10 min');
  assert.equal(whenText(T0 + 3 * 3600e3, T0), 'in 3 h');
  assert.equal(whenText(T0 + DAY, T0), 'tomorrow');
  assert.equal(whenText(T0 + 7 * DAY, T0), 'in 7 days');
});

test('the store: reviews are saved, a forgotten card returns once at the end of the session', () => {
  const storage = memoryStorage();
  const now = clock();
  const s = new ProgressStore(storage, { now });
  const ids = sessionCards(s.drillData(), now());
  s.setDrillSession(ids);
  assert.equal(s.reviewDrill(ids[0], 'good').box, 1);
  s.drillData().session.index = 1;
  s.reviewDrill(ids[1], 'again');
  assert.deepEqual(s.drillData().session.ids, [...ids, ids[1]], 'requeued at the end');
  s.reviewDrill(ids[1], 'again');
  assert.equal(s.drillData().session.ids.length, ids.length + 1, 'only once per session');
  assert.deepEqual(s.drillData().session.results, { [ids[0]]: 'good', [ids[1]]: 'again' });
  assert.equal(s.reviewDrill('no-such-card', 'good'), null);
  // survives a reload
  const again = new ProgressStore(storage, { now });
  assert.equal(again.drillData().cards[ids[0]].box, 1);
  assert.equal(again.drillData().cards[ids[1]].lapses, 2);
  s.setDrillTopics(['lists']);
  assert.deepEqual(new ProgressStore(storage, { now }).drillData().topics, ['lists']);
});

test('older saves and exports without drills still load, with an empty deck', () => {
  const storage = memoryStorage();
  const old = blankProgress(T0);
  delete old.drills;
  storage.setItem(STORAGE_KEY, JSON.stringify(old));
  const s = new ProgressStore(storage, { now: clock() });
  assert.deepEqual(s.drillData().cards, {});
  assert.equal(s.drillData().topics.length, DRILL_TOPICS.length);
  const exported = JSON.parse(s.exportJSON());
  delete exported.drills;
  const s2 = new ProgressStore(memoryStorage(), { now: clock() });
  assert.equal(s2.importJSON(JSON.stringify(exported)).ok, true);
  assert.deepEqual(s2.drillData().cards, {});
  // and a save with drills keeps them through export/import
  s.reviewDrill(DRILL_DECK[0].id, 'good');
  const s3 = new ProgressStore(memoryStorage(), { now: clock() });
  assert.equal(s3.importJSON(s.exportJSON()).ok, true);
  assert.equal(s3.drillData().cards[DRILL_DECK[0].id].box, 1);
});
