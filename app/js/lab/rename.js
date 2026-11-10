// Saved Pseudocode Lab drafts written before the identifiers were standardized
// used `start` for the pointer to the first node of a list. The Lab now names
// that pointer `head`, so a draft for a list structure is upgraded when saved
// progress is loaded (progress/migrate.js, content version 3). Other names in a
// draft are the learner's own and keep working unchanged; the doubly linked
// list fields left/right are still accepted as aliases of prev/next.
import { EXERCISE_BY_ID } from './exercises.js';

const LIST_STRUCTURES = ['sll', 'dll', 'csll'];

/** The structure a draft belongs to, from its storage key (`free:sll`, `ex:<id>`, `drill:<id>`). */
export function draftStructure(key) {
  const [kind, id] = String(key || '').split(':');
  if (kind === 'free') return id || null;
  const ex = EXERCISE_BY_ID[id];
  return ex ? ex.structure : null;
}

/** Rename the list head pointer `start` to `head` in a draft for a list structure. */
export function upgradePseudocode(code, key) {
  if (typeof code !== 'string' || !LIST_STRUCTURES.includes(draftStructure(key))) return code;
  return code.replace(/\bstart\b/g, 'head');
}
