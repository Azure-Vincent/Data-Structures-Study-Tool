// Pseudocode drills: spaced repetition for writing pseudocode from memory.
//
// Every graded Pseudocode Lab exercise is a card. Reviewing a card means
// writing the operation in pseudocode and checking it on all of its test
// cases. The result is graded automatically and decides when the card comes
// back (Leitner boxes with growing intervals):
//   good  — passed on the first check, no hints  → next box (interval grows)
//   hard  — passed after a failed check or hints → same box, half the interval
//   again — the solution was revealed or the card skipped → box 1, back in
//           10 minutes (and once more at the end of the current session)
// Pure functions over the progress data; the store applies them.
import { EXERCISES } from '../lab/exercises.js';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
/** Days until the next review for a card in box 1…6 (box 0 = never reviewed). */
export const DRILL_INTERVALS = [0, 1, 3, 7, 16, 35, 90];
export const AGAIN_DELAY = 10 * MIN;
export const MAX_BOX = DRILL_INTERVALS.length - 1;
export const NEW_PER_DAY = 5;
/** A card counts as remembered from this box on (its interval is a week or more). */
export const REMEMBERED_BOX = 3;

export const DRILL_TOPICS = [
  { id: 'lists', label: 'Linked lists', structures: ['sll', 'dll', 'csll'] },
  { id: 'stacks-queues', label: 'Stacks & queues', structures: ['stack', 'queue'], extra: ['astack-push-pop', 'aqueue-enqueue-dequeue'] },
  { id: 'trees', label: 'Trees', structures: ['tree'] },
  { id: 'graphs', label: 'Graphs', structures: ['graph'], extra: ['graph-matrix-build'] },
  { id: 'arrays', label: 'Arrays', structures: [], extra: ['array-insert', 'array-delete'] },
];

export function topicOf(ex) {
  const t = DRILL_TOPICS.find((x) => (x.extra || []).includes(ex.id)) || DRILL_TOPICS.find((x) => x.structures.includes(ex.structure));
  return t ? t.id : 'arrays';
}

/** The cards, in lecture order: every graded Lab exercise of the main course. */
export const DRILL_DECK = EXERCISES.filter((ex) => !ex.supplementary)
  .map((ex, i) => ({ id: ex.id, ex, topic: topicOf(ex), order: i }))
  .sort((a, b) => a.ex.lecture - b.ex.lecture || a.order - b.order);
export const DRILL_BY_ID = Object.fromEntries(DRILL_DECK.map((c) => [c.id, c]));

export function blankDrills() {
  return { cards: {}, topics: DRILL_TOPICS.map((t) => t.id), newPerDay: NEW_PER_DAY, session: null };
}

/** The local calendar day of a timestamp, e.g. "2026-10-31". */
export function dayOf(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A card's record after one review. */
export function applyReview(rec, outcome, now) {
  const r = rec ? { ...rec, history: [...(rec.history || [])] } : { box: 0, due: now, reps: 0, lapses: 0, firstAt: now, history: [] };
  if (outcome === 'again') {
    r.box = 1;
    r.lapses++;
    r.due = now + AGAIN_DELAY;
  } else if (outcome === 'hard') {
    r.box = Math.max(1, r.box);
    r.due = now + Math.max(1, DRILL_INTERVALS[r.box] / 2) * DAY;
  } else {
    r.box = Math.min(MAX_BOX, r.box + 1);
    r.due = now + DRILL_INTERVALS[r.box] * DAY;
  }
  r.reps++;
  r.last = now;
  r.lastResult = outcome;
  r.history.push({ t: now, r: outcome });
  if (r.history.length > 30) r.history = r.history.slice(-30);
  return r;
}

const inTopics = (drills, c) => !drills.topics || !drills.topics.length || drills.topics.includes(c.topic);

/** Cards reviewed before and due now, earliest first. */
export function dueCards(drills, now) {
  return DRILL_DECK.filter((c) => inTopics(drills, c) && drills.cards[c.id] && drills.cards[c.id].due <= now).sort((a, b) => drills.cards[a.id].due - drills.cards[b.id].due);
}

/** How many new cards may still be started today. */
export function newLeftToday(drills, now) {
  const today = dayOf(now);
  const started = Object.values(drills.cards).filter((r) => r.firstAt && dayOf(r.firstAt) === today).length;
  return Math.max(0, (drills.newPerDay ?? NEW_PER_DAY) - started);
}

/** Never-reviewed cards in lecture order. */
export function newCards(drills) {
  return DRILL_DECK.filter((c) => inTopics(drills, c) && !drills.cards[c.id]);
}

/** The cards of a new session: everything due, then today's new cards. */
export function sessionCards(drills, now) {
  return [...dueCards(drills, now), ...newCards(drills).slice(0, newLeftToday(drills, now))].map((c) => c.id);
}

/** Practise ahead: the cards that come back soonest (when nothing is due). */
export function aheadCards(drills, now, n = 5) {
  return DRILL_DECK.filter((c) => inTopics(drills, c) && drills.cards[c.id] && drills.cards[c.id].due > now)
    .sort((a, b) => drills.cards[a.id].due - drills.cards[b.id].due)
    .slice(0, n)
    .map((c) => c.id);
}

/** Reviews due on each of the next `days` days (index 0 = today, including overdue). */
export function forecast(drills, now, days = 7) {
  const out = Array(days).fill(0);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (const c of DRILL_DECK) {
    const r = drills.cards[c.id];
    if (!r || !inTopics(drills, c)) continue;
    const d = Math.max(0, Math.floor((r.due - start.getTime()) / DAY));
    if (d < days) out[d]++;
  }
  return out;
}

/** 'new' | 'due' | 'learning' | 'remembered' */
export function cardStatus(rec, now) {
  if (!rec) return 'new';
  if (rec.due <= now) return 'due';
  return rec.box >= REMEMBERED_BOX ? 'remembered' : 'learning';
}

/** "now", "in 10 min", "in 3 h", "tomorrow", "in 5 days" */
export function whenText(due, now) {
  const d = due - now;
  if (d <= 0) return 'now';
  if (d < 60 * MIN) return `in ${Math.max(1, Math.round(d / MIN))} min`;
  if (d < DAY && dayOf(due) === dayOf(now)) return `in ${Math.round(d / (60 * MIN))} h`;
  const days = Math.round((new Date(dayOf(due)) - new Date(dayOf(now))) / DAY);
  return days <= 1 ? 'tomorrow' : `in ${days} days`;
}
