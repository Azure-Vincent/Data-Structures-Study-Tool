import { h, clear } from '../ui/dom.js';
import { REPAIRS, makeRepair } from '../exercises/repair.js';
import { renderExercise } from '../ui/exercise.js';
import { randomSeed } from '../core/rng.js';

export function repairView(ctx, which) {
  const { store } = ctx;
  let id = REPAIRS.find((r) => r.id === which) ? which : REPAIRS[0].id;
  const root = h('div');
  const list = h('div', { class: 'row', role: 'toolbar', 'aria-label': 'Repair scenarios' });
  const host = h('div', { style: { marginTop: '12px' } });
  root.append(
    h('div', { class: 'page-head' }, h('h1', {}, 'Repair mode'), h('span', { class: 'muted small' }, 'Observe a broken structure, find the first bad action, undo, fix.')),
    list,
    host,
  );
  const load = (seed = randomSeed()) => {
    clear(list).append(REPAIRS.map((r) => h('button', { class: 'btn small', 'aria-pressed': String(r.id === id), onclick: () => { id = r.id; history.replaceState(null, '', `#/repair/${r.id}`); load(); } }, r.title)));
    const ex = makeRepair(id, seed);
    clear(host).append(
      renderExercise(ex, {
        onResult: (r) => store.recordAttempt({ templateId: ex.templateId, seed, concept: ex.concept, type: 'bug', lecture: ex.lecture, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: 'less', tag: r.tag, message: r.message }),
        onSimilar: () => load(),
        onNext: () => {
          const i = REPAIRS.findIndex((r) => r.id === id);
          id = REPAIRS[(i + 1) % REPAIRS.length].id;
          load();
        },
        nextLabel: 'Next scenario',
      }),
    );
  };
  load();
  return root;
}
