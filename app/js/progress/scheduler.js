// Builds practice sessions (one task at a time, ~5–10 minutes) from the
// learner's progress: due and weak concepts first, interleaved across modules.
import { TEMPLATES, generateExercise } from '../exercises/registry.js';
import { CONCEPTS, CONCEPT_BY_ID, MODULES, moduleOrder } from '../content/concepts.js';
import { makeRng, randomSeed } from '../core/rng.js';

let conceptIndex = null;

/** concept -> [{templateId, params}] discovered by sampling generators once. */
export function conceptTemplates() {
  if (conceptIndex) return conceptIndex;
  conceptIndex = {};
  for (const t of TEMPLATES) {
    const found = new Set([t.concept]);
    if (t.variants) Object.keys(t.variants).forEach((c) => found.add(c));
    if (t.conceptBy) {
      for (let s = 1; s <= 12; s++) {
        try {
          found.add(generateExercise(t.id, s * 104729).concept);
        } catch {
          /* ignore */
        }
      }
    }
    for (const c of found) (conceptIndex[c] ||= []).push({ templateId: t.id, params: t.variants?.[c] || null });
  }
  return conceptIndex;
}

/** Generate an exercise that targets `concept` (retries seeds when a template can produce several concepts). */
export function pickForConcept(concept, rng, { avoidTypes = [], guidance = 'less' } = {}) {
  const opts = conceptTemplates()[concept] || [];
  if (!opts.length) return null;
  const preferred = opts.filter((o) => !avoidTypes.includes(TEMPLATES.find((t) => t.id === o.templateId).type));
  const pool = preferred.length ? preferred : opts;
  const choice = rng.pick(pool);
  for (let i = 0; i < 25; i++) {
    const seed = rng.int(1, 2 ** 30);
    const ex = generateExercise(choice.templateId, seed, { guidance, params: choice.params || {} });
    if (ex.concept === concept) return { templateId: choice.templateId, seed, guidance, params: choice.params || {}, concept };
  }
  const seed = rng.int(1, 2 ** 30);
  return { templateId: choice.templateId, seed, guidance, params: choice.params || {}, concept: generateExercise(choice.templateId, seed).concept };
}

/**
 * mode: 'mixed' | 'review' | 'module' | 'concept' | 'assessment'
 * An assessment draws from one module (or every module when module is null)
 * and gives no guidance: the learner works without hints or worked steps.
 * Returns a session object (serialisable).
 */
export function buildSession(store, { mode = 'mixed', module = null, concept = null, size = 8, seed = randomSeed(), timed = false } = {}) {
  const rng = makeRng(seed);
  const introduced = store.introducedConcepts();
  let pool;
  if (mode === 'concept' && concept) pool = [concept];
  else if (mode === 'module' && module) pool = CONCEPTS.filter((c) => c.module === module).map((c) => c.id);
  else if (mode === 'assessment') pool = CONCEPTS.filter((c) => !module || c.module === module).map((c) => c.id);
  else if (mode === 'review') {
    const missed = [...new Set(store.data.mistakes.slice(-40).map((m) => m.concept))];
    pool = [...new Set([...store.weakConcepts(), ...missed, ...store.dueConcepts()])];
    if (!pool.length) pool = introduced;
  } else {
    pool = introduced.length ? introduced : CONCEPTS.filter((c) => moduleOrder(c.module) <= 2).map((c) => c.id);
  }
  pool = pool.filter((c) => (conceptTemplates()[c] || []).length);
  if (!pool.length) pool = CONCEPTS.map((c) => c.id).filter((c) => (conceptTemplates()[c] || []).length);

  const score = (id) => {
    const c = store.data.concepts[id];
    let s = rng.next();
    if (!c || !c.attempts) s += 2; // new material
    if (store.isWeak(id)) s += 4;
    if (c && c.introduced && c.due <= store.now()) s += 3;
    if (store.level(id) === 'mastered') s -= 1.5;
    return s;
  };
  const ranked = [...pool].sort((a, b) => score(b) - score(a));
  // choose concepts: allow repeats only if the pool is small; interleave modules
  const chosen = [];
  const modulesInPool = new Set(ranked.map((c) => CONCEPT_BY_ID[c]?.module));
  for (let i = 0, guard = 0; chosen.length < size && ranked.length && guard < 400; i++, guard++) {
    const c = ranked[i % ranked.length];
    const prev = chosen[chosen.length - 1];
    const sameConcept = prev === c && ranked.length > 1;
    const sameModule = prev && CONCEPT_BY_ID[prev]?.module === CONCEPT_BY_ID[c]?.module && modulesInPool.size > 1;
    if ((sameConcept || (sameModule && rng.bool(0.6))) && guard < 300) continue;
    chosen.push(c);
  }
  const typesUsed = {};
  let writing = 0; // "write the code" tasks take longest: at most one per session
  const items = chosen.map((c) => {
    const lvl = store.level(c);
    const guidance = mode === 'assessment' ? 'none' : lvl === 'new' || lvl === 'learning' ? (mode === 'concept' ? 'full' : 'less') : lvl === 'mastered' ? 'none' : 'less';
    const it = pickForConcept(c, rng, { avoidTypes: [...(typesUsed[c] || []), ...(writing ? ['lab'] : [])], guidance });
    const t = TEMPLATES.find((x) => x.id === it.templateId);
    if (t.type === 'lab') writing++;
    (typesUsed[c] ||= []).push(t.type);
    return { ...it, status: 'pending', hints: 0, revealed: false, followUp: false };
  });
  return { id: 's' + seed, mode, module, concept, startedAt: store.now(), index: 0, items, timed, elapsedMs: 0, finished: false };
}

/** After a mistake: a similar exercise (same template, new values) inserted right after. */
export function followUpItem(item, rng = makeRng(randomSeed())) {
  return { templateId: item.templateId, seed: rng.int(1, 2 ** 30), guidance: item.guidance === 'none' ? 'less' : item.guidance, params: item.params || {}, concept: item.concept, status: 'pending', hints: 0, revealed: false, followUp: true };
}

/** One useful next activity for the dashboard. */
export function nextActivity(store, lessonsTotal) {
  const s = store.data.session;
  if (s && !s.finished && s.items.some((x) => x.status === 'pending')) return { kind: 'resume', assessment: s.mode === 'assessment', label: `Resume the unfinished ${s.mode === 'assessment' ? 'assessment' : 'practice session'} (${s.items.filter((x) => x.status !== 'pending').length} of ${s.items.length} exercises completed)` };
  const weak = store.weakConcepts();
  if (weak.length) return { kind: 'review', label: `Review ${weak.length} concept${weak.length > 1 ? 's' : ''} that need${weak.length > 1 ? '' : 's'} attention: ${CONCEPT_BY_ID[weak[0]].name}${weak.length > 1 ? ', …' : ''}` };
  for (const M of MODULES) {
    const l = store.data.lessons[M.id];
    if (!l || !l.completed) return { kind: 'lesson', module: M.id, label: `${l && l.done.length ? 'Continue' : 'Begin'} Learning Module ${M.n}: ${M.title}` };
  }
  const due = store.dueConcepts();
  if (due.length) return { kind: 'mixed', label: `Mixed Practice: ${due.length} concept${due.length > 1 ? 's are' : ' is'} due for review` };
  void lessonsTotal;
  return { kind: 'mixed', label: 'Mixed Practice across all modules' };
}
