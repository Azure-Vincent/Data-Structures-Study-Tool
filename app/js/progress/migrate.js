// Migrations for saved progress (localStorage / exported JSON).
//
// Content version 2:
// - Lesson steps are remembered by a stable key instead of their position, so
//   lessons can grow without scrambling what was done. OLD_LESSON_KEYS lists the
//   sections of every lesson in their version-1 order; a saved index i maps to
//   OLD_LESSON_KEYS[lesson][i]. Keys of sections that were removed are dropped.
// - Time-complexity material was removed: its exercises, its topics, its
//   questions and their mistakes, attempts and statistics are taken out, and
//   their effect on retained topics is subtracted.
//
// Content version 3 (this file's CONTENT_VERSION):
// - The eight numbered lessons became seven learning modules. A section keeps
//   its key, so a completed step stays completed in whichever module now holds
//   it. V2_LESSON_KEYS lists the version-2 lessons (ids l07–l14).
// - Practice sessions and attempts refer to a module instead of a lesson number.
// - Saved pseudocode drafts use the standardized identifiers (head, create_node, …).
import { CONCEPT_BY_ID } from '../content/concepts.js';
import { LESSONS } from '../content/lessons.js';
import { upgradePseudocode } from '../lab/rename.js';
import { OLD_DRILL_TOPICS } from './drills.js';

export const CONTENT_VERSION = 3;

/** Old lesson number → the module its first sections moved to. */
export const LESSON_MODULE = { 7: 'memory', 8: 'sll', 9: 'sll', 10: 'dll', 11: 'sll', 12: 'stack', 13: 'tree', 14: 'tree' };

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

/** Lesson sections in the order content version 2 stored them (one lesson per old id). */
export const V2_LESSON_KEYS = {
  'l07': [
    'r:the-map-of-data-structures',
    'r:how-to-read-the-code',
    'c:one-small-program-in-every-language',
    'r:contiguous-vs-non-contiguous-memory',
    'e:try-it-compute-an-address',
    'c:pointers-malloc-and-free',
    'r:memory-in-three-languages',
    'c:two-names-for-one-node',
    'n:storage-location-is-not-the-same-as-structure-ty',
    'e:where-does-the-memory-live',
    'r:trade-offs-between-arrays-and-linked-lists',
    'n:deleting-from-an-array-is-not-possible-what-it-r',
    'r:arrays-purpose-and-terms',
    'w:array-shift',
    'n:array-pitfalls',
    'e:count-the-shifts',
    'e:spot-the-memory-bug',
    'e:variation-choose-a-structure',
    'e:variation-linear-or-non-linear',
    'e:predict-the-array-program',
    'e:complete-the-shift',
    'e:write-array-insert',
    'e:write-array-delete'
  ],
  'l08': [
    'r:anatomy-of-a-singly-linked-list',
    'n:lecture-terms-standard-terms',
    'n:before-you-start-nodes',
    'c:declaring-a-node-and-getnode',
    'e:value-or-address',
    's:worked-example-creatlist-builds-10-20-30',
    'n:prose-vs-code-on-creation',
    'w:sll-create',
    's:insert-at-the-beginning',
    'w:sll-insert-beg',
    'e:your-turn-insert-at-the-beginning',
    's:insert-at-the-end',
    'w:sll-insert-end',
    'e:required-example-10-20-30-insert-15-after-10-whi',
    's:predict-the-intermediate-states-insert-15-at-pos',
    'e:now-do-it-insert-15-after-10',
    'c:the-lost-access-bug-and-how-saving-a-reference-p',
    'n:two-details-in-insert-at-mid',
    'w:sll-insert-pos',
    'n:sll-insert-pitfalls',
    'e:variation-arrange-the-steps',
    'e:variation-complete-the-code',
    'e:find-the-bug',
    'e:predict-the-final-list',
    'e:predict-the-list-program',
    'e:complete-insert-at-beginning',
    'e:write-insert-at-the-end',
    'e:write-insert-at-a-position'
  ],
  'l09': [
    'r:deleting-safely-save-relink-free',
    's:delete-at-beg',
    'w:sll-delete-beg',
    'e:your-turn-delete-the-first-node',
    's:delete-at-last',
    'n:one-node-list-delete-at-last-leaves-start-dangli',
    's:the-notes-version-on-a-one-node-list',
    'e:fix-the-one-node-case',
    'w:sll-delete-end',
    'e:required-example-now-delete-20-from-10-15-20-30-',
    's:delete-at-mid-pos-3',
    'e:now-do-it-delete-20',
    'w:sll-delete-pos',
    'c:freeing-too-early',
    's:traverse',
    'e:variation-delete-anywhere',
    'e:arrange-the-deletion-steps',
    'e:find-the-deletion-bug',
    'e:which-positions-are-valid',
    'e:predict-traverse-after-deletions',
    'n:sll-delete-pitfalls',
    'e:predict-a-deletion-program',
    'e:complete-the-deletion',
    'e:write-delete-the-last-node',
    'e:write-delete-at-a-position'
  ],
  'l10': [
    'r:two-links-per-node',
    'c:the-node-and-getnode',
    'w:dll-create',
    's:insert-at-the-beginning-3-steps',
    'w:dll-insert-beg',
    'e:your-turn-both-directions',
    'w:dll-insert-end',
    's:insert-at-an-intermediate-position-4-links',
    'w:dll-insert-pos',
    'e:insert-in-the-middle',
    'e:which-orders-are-valid',
    's:delete-at-an-intermediate-position',
    'w:dll-delete-pos',
    'n:one-node-lists-in-delete-at-beg-delete-at-end',
    's:the-crash-simulated',
    'w:dll-delete-beg',
    'w:dll-delete-end',
    'e:delete-both-directions',
    's:verify-forward',
    's:and-backward',
    'e:required-forward-looks-right-backward-is-broken-',
    'e:predict-a-traversal',
    'n:before-you-start-recursion',
    's:recursive-countnode',
    'w:dll-countnode',
    'e:recursion-questions',
    'e:complete-the-code',
    'r:what-the-extra-link-buys',
    'n:dll-pitfalls',
    'e:predict-a-doubly-linked-program',
    'e:complete-a-back-link',
    'e:write-dll-insert-end',
    'e:write-dll-delete-first'
  ],
  'l11': [
    'r:the-last-node-points-back-to-the-first',
    's:required-demo-why-waiting-for-null-fails',
    'n:the-creation-loop-in-the-notes',
    'n:before-you-start-do-while',
    's:the-right-way-do-while-exactly-one-lap',
    'w:csll-create',
    'e:click-exactly-one-lap',
    'e:complete-the-stopping-condition',
    's:insert-at-the-beginning-the-last-node-must-chang',
    's:insert-into-an-empty-circle',
    'w:csll-insert-beg',
    'w:csll-insert-end',
    'e:your-turn-insert',
    's:delete-at-the-beginning',
    'n:missing-free-and-the-one-node-case',
    'w:csll-delete-beg',
    'w:csll-delete-end',
    'e:required-delete-the-only-node-correctly',
    'e:variation-delete-from-a-longer-circle',
    'e:order-the-delete-at-beginning-steps',
    'e:what-happens-with-the-null-loop',
    'n:csll-pitfalls',
    'e:predict-a-circular-program',
    'e:complete-the-circle',
    'e:write-csll-insert-front',
    'e:write-csll-delete-first'
  ],
  'l12': [
    'r:restricted-lists-lifo-and-fifo',
    'e:required-same-input-stack-vs-queue',
    'n:exactly-what-top-f-and-r-mean',
    'c:array-stack-notes-in-c-and-c',
    's:array-stack-pushes-until-overflow-then-pops-unti',
    'w:stack-array',
    'e:track-top',
    's:linked-stack-notes-style-push-pop-at-the-end',
    'w:stack-linked-end',
    's:linked-stack-at-the-head',
    'w:stack-linked',
    'e:push-pop-by-rewiring',
    's:linear-array-queue-wasted-slots',
    'w:queue-array',
    'n:circular-array-queue',
    'e:track-f-and-r',
    'e:which-operations-fail',
    's:linked-queue-removing-the-final-item',
    'w:queue-linked',
    'e:enqueue-dequeue-by-rewiring',
    'e:variation',
    'e:what-exactly-does-it-mean',
    'e:stack-or-queue',
    'n:stack-queue-pitfalls',
    'e:predict-a-stack-or-queue-program',
    'e:complete-push-or-dequeue',
    'e:write-array-stack',
    'e:write-array-queue'
  ],
  'l13': [
    'r:trees-hierarchy-with-one-parent-per-node',
    'c:a-binary-tree-node',
    'w:tree-create',
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
    'w:tree-array',
    'e:build-a-tree-from-its-array',
    'd:build-your-own-binary-tree',
    'r:graphs-and-their-representations',
    'd:graph-editor-watch-the-matrix-and-list-update',
    'w:graph-matrix',
    'w:graph-adjlist',
    'e:drawing-matrix',
    'e:matrix-list',
    'e:list-drawing',
    'n:tree-graph-pitfalls',
    'e:predict-a-tree-or-graph-program',
    'e:complete-tree-or-graph-code',
    'e:write-build-a-tree',
    'e:write-an-adjacency-matrix'
  ],
  'l14': [
    'r:three-depth-first-orders-for-binary-trees',
    's:preorder-on-the-lecture-tree-entered-vs-output',
    'e:required-click-the-preorder',
    's:inorder',
    'e:required-click-the-inorder',
    's:postorder',
    'e:required-click-the-postorder',
    'w:tree-traversals',
    's:inorder-with-an-explicit-stack-the-notes-stack-p',
    'w:tree-inorder-stack',
    'e:stack-contents',
    'e:entered-vs-output-on-a-new-tree',
    'd:now-create-another-tree-and-traverse-it',
    'e:variation-a-random-tree',
    'r:dfs-and-bfs-on-graphs',
    's:dfs-from-a-lec-14-p-4-graph',
    'w:graph-dfs',
    'e:click-the-dfs-order',
    's:bfs-from-a',
    'w:graph-bfs',
    'e:click-the-bfs-order',
    'n:edge-labels-on-p-3-are-discovery-order-not-dista',
    'e:what-is-in-the-frontier',
    's:cycles-a-self-loop-and-a-disconnected-part',
    's:traversing-the-whole-graph',
    'e:component-or-whole-graph',
    'n:bfs-minimises-edges-not-total-weight',
    'e:bfs-on-a-weighted-graph',
    'e:variation-bfs-on-a-new-graph',
    'e:variation-dfs-on-a-new-graph',
    'n:traversal-pitfalls',
    'e:predict-a-traversal-program',
    'e:complete-a-traversal',
    'e:write-inorder',
    'e:write-bfs'
  ]
};

/** Section keys renamed in content version 3 (old key → new key); every other key is unchanged. */
export const KEY_RENAMES = {
  'e:try-it-compute-an-address': 'e:compute-an-element-address',
  'n:lecture-terms-standard-terms': 'n:sll-terminology',
  'c:declaring-a-node-and-getnode': 'c:declaring-a-node-and-create-node',
  's:worked-example-creatlist-builds-10-20-30': 's:worked-example-create-list-10-20-30',
  'e:your-turn-insert-at-the-beginning': 'e:insert-at-the-beginning-by-pointer-assignment',
  'e:required-example-10-20-30-insert-15-after-10-whi': 'e:insert-15-after-10-which-links-change',
  'e:now-do-it-insert-15-after-10': 'e:insert-15-after-10',
  'n:two-details-in-insert-at-mid': 'n:two-details-in-insert-at-position',
  's:delete-at-beg': 's:delete-at-beginning',
  'e:your-turn-delete-the-first-node': 'e:delete-the-first-node-by-pointer-assignment',
  's:delete-at-last': 's:delete-at-end',
  'n:one-node-list-delete-at-last-leaves-start-dangli': 'n:single-node-delete-at-end-leaves-head-dangling',
  's:the-notes-version-on-a-one-node-list': 's:incomplete-delete-at-end-on-a-single-node',
  'e:required-example-now-delete-20-from-10-15-20-30-': 'e:delete-20-which-pointers-change',
  's:delete-at-mid-pos-3': 's:delete-at-position-3',
  'e:now-do-it-delete-20': 'e:delete-20',
  's:required-demo-why-waiting-for-null-fails': 's:why-testing-for-null-fails',
  'n:the-creation-loop-in-the-notes': 'n:circular-append-loop-condition',
  'e:your-turn-insert': 'e:insert-into-a-circular-list',
  'e:required-delete-the-only-node-correctly': 'e:delete-the-only-node',
  'c:the-node-and-getnode': 'c:dll-node-and-create-node',
  'e:your-turn-both-directions': 'e:dll-insert-both-directions',
  'n:one-node-lists-in-delete-at-beg-delete-at-end': 'n:dll-single-node-deletion',
  'e:required-forward-looks-right-backward-is-broken-': 'e:repair-the-backward-links',
  's:recursive-countnode': 's:recursive-count-nodes',
  'e:required-same-input-stack-vs-queue': 'e:same-input-stack-and-queue',
  'c:array-stack-notes-in-c-and-c': 'c:array-stack-in-every-language',
  's:linked-stack-notes-style-push-pop-at-the-end': 's:linked-stack-top-at-the-tail',
  's:preorder-on-the-lecture-tree-entered-vs-output': 's:preorder-on-the-example-tree',
  'e:required-click-the-preorder': 'e:select-the-preorder-sequence',
  'e:required-click-the-inorder': 'e:select-the-inorder-sequence',
  'e:required-click-the-postorder': 'e:select-the-postorder-sequence',
  's:inorder-with-an-explicit-stack-the-notes-stack-p': 's:inorder-with-an-explicit-stack',
  's:dfs-from-a-lec-14-p-4-graph': 's:dfs-from-a',
  'n:edge-labels-on-p-3-are-discovery-order-not-dista': 'n:edge-numbers-are-discovery-order',
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

const MODULE_OF_KEY = () => Object.fromEntries(LESSONS.flatMap((l) => l.sections.map((s) => [s.key, l.id])));

/**
 * Bring a saved progress object up to CONTENT_VERSION. Pure: returns a new
 * object and never throws on odd data (unknown fields are kept).
 */
export function migrateProgress(input) {
  if (!input || typeof input !== 'object') return input;
  const d = JSON.parse(JSON.stringify(input));
  const from = d.contentVersion || 1;
  if (from >= CONTENT_VERSION) return d;
  if (from < 2) toVersion2(d);
  if (from < 3) toVersion3(d);
  d.contentVersion = CONTENT_VERSION;
  return d;
}

function toVersion2(d) {

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
    for (const id of Object.keys(V2_LESSON_KEYS)) {
      const rec = d.lessons[id];
      if (!rec) continue;
      d.lessons[id] = migrateLesson(rec, OLD_LESSON_KEYS[id] || [], V2_LESSON_KEYS[id]);
    }
  }
}

function toVersion3(d) {
  // ---- lessons l07–l14 -> modules: every completed key moves to the module that now holds it
  if (d.lessons && typeof d.lessons === 'object') {
    const where = MODULE_OF_KEY();
    const rk = (k) => KEY_RENAMES[k] || k;
    const old = Object.keys(V2_LESSON_KEYS).filter((id) => d.lessons[id]);
    const out = {};
    for (const lesson of LESSONS) {
      const keys = lessonKeys(lesson);
      const done = [];
      let at = null;
      for (const id of old) {
        const rec = d.lessons[id];
        for (const k of (Array.isArray(rec.done) ? rec.done : []).map(rk)) if (where[k] === lesson.id && !done.includes(k)) done.push(k);
        if (at == null && typeof rec.at === 'string' && where[rk(rec.at)] === lesson.id && !rec.completed) at = rk(rec.at);
      }
      if (!done.length && at == null) continue;
      out[lesson.id] = { at: at ?? keys.find((k) => !done.includes(k)) ?? keys[0], done, completed: keys.every((k) => done.includes(k)) };
    }
    for (const id of Object.keys(V2_LESSON_KEYS)) delete d.lessons[id];
    Object.assign(d.lessons, out);
  }
  // ---- practice sessions and records name a module instead of a lesson number
  const moduleOf = (r) => (CONCEPT_BY_ID[r.concept] ? CONCEPT_BY_ID[r.concept].module : LESSON_MODULE[r.lecture] || null);
  for (const list of [d.attempts, d.mistakes]) {
    if (!Array.isArray(list)) continue;
    for (const r of list) {
      if (!r || typeof r !== 'object' || !('lecture' in r)) continue;
      r.module = moduleOf(r);
      delete r.lecture;
    }
  }
  if (Array.isArray(d.mistakes)) for (const m of d.mistakes) if (m && m.tag === 'uninitialised') m.tag = 'uninitialized';
  if (d.session && typeof d.session === 'object') {
    if (d.session.mode === 'lecture') {
      d.session.mode = 'module';
      d.session.module = LESSON_MODULE[d.session.lecture] || null;
    }
    delete d.session.lecture;
  }
  // ---- review topics are the modules
  if (d.drills && Array.isArray(d.drills.topics)) d.drills.topics = [...new Set(d.drills.topics.flatMap((t) => OLD_DRILL_TOPICS[t] || [t]))];
  // ---- the example graph of the Lab's free mode was called 'lec14'
  const fv = d.lab && d.lab.freeValues;
  if (fv && fv.graph && fv.graph.graph === 'lec14') fv.graph.graph = 'example';
  // ---- saved pseudocode drafts use the standardized identifiers
  if (d.lab && d.lab.drafts && typeof d.lab.drafts === 'object') {
    for (const [k, code] of Object.entries(d.lab.drafts)) if (typeof code === 'string') d.lab.drafts[k] = upgradePseudocode(code, k);
  }
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
