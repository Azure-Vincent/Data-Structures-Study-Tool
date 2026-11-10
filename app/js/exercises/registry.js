// All exercise templates and a deterministic generator.
import { makeRng } from '../core/rng.js';
import { l07 } from './l07.js';
import { l08 } from './l08.js';
import { l09 } from './l09.js';
import { l10 } from './l10.js';
import { l11 } from './l11.js';
import { l12 } from './l12.js';
import { l13 } from './l13.js';
import { l14 } from './l14.js';
import { IMPL_TEMPLATES } from './impl.js';
import { CONCEPT_BY_ID } from '../content/concepts.js';

export const TEMPLATES = [...l07, ...l08, ...l09, ...l10, ...l11, ...l12, ...l13, ...l14, ...IMPL_TEMPLATES];
// every template belongs to the module of its main concept; `modules` lists every
// module whose concepts it can practise (through its variants)
const moduleOf = (c) => (CONCEPT_BY_ID[c] ? CONCEPT_BY_ID[c].module : null);
for (const t of TEMPLATES) {
  t.module = moduleOf(t.concept);
  t.modules = [...new Set([t.concept, ...(t.concepts || []), ...Object.keys(t.variants || {})].map(moduleOf).filter(Boolean))];
}
export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const TYPE_LABELS = {
  predict: 'Predict',
  rewire: 'Rewire pointers',
  order: 'Arrange steps',
  fill: 'Complete the code',
  bug: 'Find & fix the bug',
  traverse: 'Click the traversal',
  convert: 'Convert representations',
  choose: 'Choose a structure',
  classify: 'Classify',
  build: 'Build',
  lab: 'Write the code',
};

/**
 * generateExercise(templateId, seed, {guidance:'full'|'less'|'none', params})
 * Returns a complete exercise object (functions included — not serialisable;
 * persist {templateId, seed, guidance, params} and regenerate).
 */
export function generateExercise(templateId, seed, { guidance = 'less', params = {} } = {}) {
  const t = TEMPLATE_BY_ID[templateId];
  if (!t) throw new Error('Unknown template ' + templateId);
  const rng = makeRng(seed);
  const ex = t.generate(rng, { guidance, params });
  const p = { ...(ex.params || {}), ...params };
  const concept = ex.concept || (t.conceptBy ? t.conceptBy(p) : t.concept);
  return {
    ...ex,
    templateId,
    seed,
    guidance,
    concept,
    module: CONCEPT_BY_ID[concept] ? CONCEPT_BY_ID[concept].module : t.module,
    type: t.type,
    title: ex.title || t.title,
    edge: !!ex.edge,
    hints: ex.hints || [],
  };
}

export function templatesFor({ module, concept, type } = {}) {
  return TEMPLATES.filter((t) => (module == null || t.modules.includes(module)) && (type == null || t.type === type) && (concept == null || t.concept === concept || (t.concepts || []).includes(concept) || (t.conceptBy && t.conceptBy({ kind: concept.split('-').pop() }) === concept)));
}
