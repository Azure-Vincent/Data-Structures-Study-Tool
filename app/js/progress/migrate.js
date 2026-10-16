// Migrations for saved progress (localStorage / exported JSON).
//
// Content version 2 (this file's CONTENT_VERSION):
// - Lesson steps are remembered by a stable key instead of their position, so
//   lessons can grow without scrambling what was done. OLD_LESSON_KEYS lists the
//   sections of every lesson in their version-1 order; a saved index i maps to
//   OLD_LESSON_KEYS[lesson][i]. Keys of sections that were removed are dropped.
// - Time-complexity material was removed: its exercises, its topics, the
//   Complexity lab's questions and their mistakes, attempts and statistics are
//   taken out, and their effect on retained topics is subtracted.
import { CONCEPT_BY_ID } from '../content/concepts.js';
import { LESSONS } from '../content/lessons.js';

export const CONTENT_VERSION = 2;

/** Lesson sections in the order content version 1 stored them (by index). */
export const OLD_LESSON_KEYS = {
  l07: [
    'r:the-map-of-data-structures',
    'r:contiguous-vs-non-contiguous-memory',
    'e:try-it-compute-an-address',
    'c:pointers-malloc-and-free',
    'n:storage-location-is-not-the-same-as-structure-ty',
    'e:where-does-the-memory-live',
    'r:trade-offs-between-arrays-and-linked-lists',
    'n:deleting-from-an-array-is-not-possible-what-it-r',
    'e:count-the-shifts',
    'e:spot-the-memory-bug',
    'e:variation-choose-a-structure',
    'e:variation-linear-or-non-linear',
  ],
  l08: [
    'r:anatomy-of-a-singly-linked-list',
    'n:lecture-terms-standard-terms',
    'c:declaring-a-node-and-getnode',
    'e:value-or-address',
    's:worked-example-creatlist-builds-10-20-30',
    'n:prose-vs-code-on-creation',
    's:insert-at-the-beginning',
    'e:your-turn-insert-at-the-beginning',
    's:insert-at-the-end',
    'e:required-example-10-20-30-insert-15-after-10-whi',
    's:predict-the-intermediate-states-insert-15-at-pos',
    'e:now-do-it-insert-15-after-10',
    'c:the-lost-access-bug-and-how-saving-a-reference-p',
    'n:two-details-in-insert-at-mid',
    'e:variation-arrange-the-steps',
    'e:variation-complete-the-code',
    'e:find-the-bug',
    'r:cost-finding-the-position-vs-changing-links',
    'e:count-the-pointer-moves',
    'e:predict-the-final-list',
    'p:write-your-own-pseudocode-insert-at-the-end',
  ],
  l09: [
    'r:deleting-safely-save-relink-free',
    's:delete-at-beg',
    'e:your-turn-delete-the-first-node',
    's:delete-at-last',
    'n:one-node-list-delete-at-last-leaves-start-dangli',
    's:the-notes-version-on-a-one-node-list',
    'e:fix-the-one-node-case',
    'e:required-example-now-delete-20-from-10-15-20-30-',
    's:delete-at-mid-pos-3',
    'e:now-do-it-delete-20',
    'c:freeing-too-early',
    's:traverse',
    'e:variation-delete-anywhere',
    'e:arrange-the-deletion-steps',
    'e:find-the-deletion-bug',
    'e:which-positions-are-valid',
    'r:head-only-vs-head-tail',
    's:deleting-the-tail-even-though-tail-is-known',
    'e:count-the-work',
    'e:predict-traverse-after-deletions',
    'p:write-your-own-pseudocode-delete-the-node-at-pos',
  ],
  l10: [
    'r:two-links-per-node',
    'c:the-node-and-getnode',
    's:insert-at-the-beginning-3-steps',
    'e:your-turn-both-directions',
    's:insert-at-an-intermediate-position-4-links',
    'e:insert-in-the-middle',
    'e:which-orders-are-valid',
    's:delete-at-an-intermediate-position',
    'n:one-node-lists-in-delete-at-beg-delete-at-end',
    's:the-crash-simulated',
    'e:delete-both-directions',
    's:verify-forward',
    's:and-backward',
    'e:required-forward-looks-right-backward-is-broken-',
    'e:predict-a-traversal',
    's:recursive-countnode',
    'e:recursion-questions',
    'e:complete-the-code',
    'r:what-the-extra-link-buys',
    'p:write-your-own-pseudocode-delete-node-t-from-a-d',
  ],
  l11: [
    'r:the-last-node-points-back-to-the-first',
    's:required-demo-why-waiting-for-null-fails',
    'n:the-creation-loop-in-the-notes',
    's:the-right-way-do-while-exactly-one-lap',
    'e:click-exactly-one-lap',
    'e:complete-the-stopping-condition',
    's:insert-at-the-beginning-the-last-node-must-chang',
    's:insert-into-an-empty-circle',
    'e:your-turn-insert',
    's:delete-at-the-beginning',
    'n:missing-free-and-the-one-node-case',
    'e:required-delete-the-only-node-correctly',
    'e:variation-delete-from-a-longer-circle',
    'e:order-the-delete-at-beginning-steps',
    'r:cost-of-the-circle',
    'e:count-the-moves',
    'e:what-happens-with-the-null-loop',
  ],
  l12: [
    'r:restricted-lists-lifo-and-fifo',
    'e:required-same-input-stack-vs-queue',
    'n:exactly-what-top-f-and-r-mean',
    'c:array-stack-notes-in-c-and-c',
    's:array-stack-pushes-until-overflow-then-pops-unti',
    'e:track-top',
    's:linked-stack-notes-style-push-pop-at-the-end',
    's:linked-stack-at-the-head',
    'e:which-end-is-cheaper',
    'e:push-pop-by-rewiring',
    's:linear-array-queue-wasted-slots',
    'n:circular-array-queue',
    'e:track-f-and-r',
    'e:which-operations-fail',
    's:linked-queue-removing-the-final-item',
    'e:enqueue-dequeue-by-rewiring',
    'e:variation',
    'e:what-exactly-does-it-mean',
    'e:stack-or-queue',
  ],
  l13: [
    'r:trees-hierarchy-with-one-parent-per-node',
    'e:select-relationships',
    'r:level-height-depth',
    'n:height-and-depth-conventions',
    'e:measure-the-tree',
    'd:node-count-formulas-visually',
    'n:n-1-edges-holds-for-every-tree',
    'e:use-the-formulas',
    'r:strictly-binary-full-complete',
    'n:full-and-perfect-are-named-differently-in-differ',
    'e:classify-trees',
    'd:array-positions-vs-linked-child-pointers',
    'e:array-index-arithmetic',
    'e:build-a-tree-from-its-array',
    'd:build-your-own-binary-tree',
    'r:graphs-and-their-representations',
    'd:graph-editor-watch-the-matrix-and-list-update',
    'e:drawing-matrix',
    'e:matrix-list',
    'e:list-drawing',
  ],
  l14: [
    'r:three-depth-first-orders-for-binary-trees',
    's:preorder-on-the-lecture-tree-entered-vs-output',
    'e:required-click-the-preorder',
    's:inorder',
    'e:required-click-the-inorder',
    's:postorder',
    'e:required-click-the-postorder',
    's:inorder-with-an-explicit-stack-the-notes-stack-p',
    'e:stack-contents',
    'e:entered-vs-output-on-a-new-tree',
    'd:now-create-another-tree-and-traverse-it',
    'e:variation-a-random-tree',
    'r:dfs-and-bfs-on-graphs',
    's:dfs-from-a-lec-14-p-4-graph',
    'e:click-the-dfs-order',
    's:bfs-from-a',
    'e:click-the-bfs-order',
    'n:edge-labels-on-p-3-are-discovery-order-not-dista',
    'e:what-is-in-the-frontier',
    's:cycles-a-self-loop-and-a-disconnected-part',
    's:traversing-the-whole-graph',
    'e:component-or-whole-graph',
    'n:bfs-minimises-edges-not-total-weight',
    'e:bfs-on-a-weighted-graph',
    'r:cost-of-traversals',
    'e:list-vs-matrix',
    'e:variation-bfs-on-a-new-graph',
    'e:variation-dfs-on-a-new-graph',
  ],
};

/** Exercise templates that only asked about running time or counted work. */
export const REMOVED_TEMPLATES = ['l07-reach', 'l08-cost', 'l09-tail-cost', 'l11-count', 'l12-ends-cost', 'l14-cost'];
/** Topics that were entirely about running time. */
export const REMOVED_CONCEPTS = ['cx.list-costs', 'cx.tail-pointer', 'cx.circular-costs', 'cx.stack-ends', 'l14.traversal-cost'];
/** Mistake tags that only came from counting work. */
const REMOVED_TAGS = ['list-vs-matrix', 'shift-count'];
/** Templates kept but no longer of type "complexity" (Count the work): node-count formulas are a tree property. */
const RETYPED = { 'l13-formulas': 'predict' };

// The Complexity lab recorded its questions as templateId `lab-<experiment>` with type 'complexity';
// l07-shifts used to count shifts (type 'complexity') and now asks for the shifted array instead.
const isRemovedAttempt = (a) => REMOVED_TEMPLATES.includes(a.templateId) || REMOVED_CONCEPTS.includes(a.concept) || (a.type === 'complexity' && !RETYPED[a.templateId]);

/** Lesson section keys in their current order. */
export function lessonKeys(lesson) {
  return lesson.sections.map((s) => s.key);
}

/**
 * Bring a saved progress object up to CONTENT_VERSION. Pure: returns a new
 * object and never throws on odd data (unknown fields are kept).
 */
export function migrateProgress(input) {
  if (!input || typeof input !== 'object') return input;
  const d = JSON.parse(JSON.stringify(input));
  if ((d.contentVersion || 1) >= CONTENT_VERSION) return d;

  // ---- attempts that are removed: subtract them from retained topics first
  const attempts = Array.isArray(d.attempts) ? d.attempts : [];
  const concepts = d.concepts && typeof d.concepts === 'object' ? d.concepts : {};
  for (const a of attempts) {
    if (!isRemovedAttempt(a)) continue;
    const c = concepts[a.concept];
    if (!c || REMOVED_CONCEPTS.includes(a.concept)) continue;
    c.attempts = Math.max(0, (c.attempts || 0) - 1);
    if (a.correct) c.correct = Math.max(0, (c.correct || 0) - 1);
    if (a.independent) c.independent = Math.max(0, (c.independent || 0) - 1);
    c.hints = Math.max(0, (c.hints || 0) - (a.hints || 0));
    if (a.revealed) c.revealed = Math.max(0, (c.revealed || 0) - 1);
  }
  const removed = attempts.filter(isRemovedAttempt);
  const kept = attempts.filter((a) => !isRemovedAttempt(a));
  const touched = new Set(removed.map((a) => a.templateId));
  const keptWins = new Set(kept.filter((a) => a.independent).map((a) => a.templateId));
  for (const [id, c] of Object.entries(concepts)) {
    if (REMOVED_CONCEPTS.includes(id) || !CONCEPT_BY_ID[id]) {
      delete concepts[id];
      continue;
    }
    // a template stays "won" only if a retained attempt won it
    if (Array.isArray(c.templatesWon)) c.templatesWon = c.templatesWon.filter((t) => !REMOVED_TEMPLATES.includes(t) && (!touched.has(t) || keptWins.has(t)));
  }
  d.concepts = concepts;
  d.attempts = kept.map((a) => (RETYPED[a.templateId] && a.type === 'complexity' ? { ...a, type: RETYPED[a.templateId] } : a));

  if (Array.isArray(d.mistakes)) d.mistakes = d.mistakes.filter((m) => !isRemovedAttempt(m) && !REMOVED_TAGS.includes(m.tag));

  // ---- statistics by exercise type and template
  if (d.types && typeof d.types === 'object') {
    delete d.types.complexity;
    for (const a of kept) {
      if (!(RETYPED[a.templateId] && a.type === 'complexity')) continue;
      const t = (d.types[RETYPED[a.templateId]] ||= { attempts: 0, correct: 0, independent: 0, hints: 0 });
      t.attempts++;
      if (a.correct) t.correct++;
      if (a.independent) t.independent++;
      t.hints += a.hints || 0;
    }
  }
  if (d.templates && typeof d.templates === 'object') {
    for (const id of Object.keys(d.templates)) if (REMOVED_TEMPLATES.includes(id) || (touched.has(id) && !kept.some((a) => a.templateId === id))) delete d.templates[id];
  }

  // ---- an unfinished practice session may contain removed exercises
  if (d.session && Array.isArray(d.session.items)) {
    d.session.items = d.session.items.filter((it) => !REMOVED_TEMPLATES.includes(it.templateId) && !REMOVED_CONCEPTS.includes(it.concept));
    if (!d.session.items.some((it) => it.status === 'pending')) d.session = null;
  }

  // ---- lesson steps: index -> key
  if (d.lessons && typeof d.lessons === 'object') {
    for (const lesson of LESSONS) {
      const rec = d.lessons[lesson.id];
      if (!rec) continue;
      d.lessons[lesson.id] = migrateLesson(rec, OLD_LESSON_KEYS[lesson.id] || [], lessonKeys(lesson));
    }
  }
  d.contentVersion = CONTENT_VERSION;
  return d;
}

function migrateLesson(rec, oldKeys, keys) {
  const valid = new Set(keys);
  const done = [];
  for (const x of Array.isArray(rec.done) ? rec.done : []) {
    const k = typeof x === 'number' ? oldKeys[x] : x;
    if (k && valid.has(k) && !done.includes(k)) done.push(k);
  }
  // where to reopen the lesson: the old position if it still exists, else the next retained step
  let at = keys[0];
  if (typeof rec.at === 'number') {
    for (let i = rec.at; i < oldKeys.length; i++) {
      if (valid.has(oldKeys[i])) {
        at = oldKeys[i];
        break;
      }
    }
  } else if (valid.has(rec.at)) at = rec.at;
  return { at, done, completed: keys.every((k) => done.includes(k)) };
}
