// C++ Implementation: every complete program of the learning modules, chosen
// freely and stepped on the diagram. Each program exists in C++, Python and
// pseudocode; the pseudocode is executed and the matching C++ (or Python)
// statement is highlighted at every step.
import { h, clear } from '../ui/dom.js';
import { createWalkthrough } from '../ui/walkthrough.js';
import { IMPLEMENTATIONS, IMPL_BY_ID } from '../content/impl/index.js';
import { MODULES } from '../content/concepts.js';

export function implementationView(ctx, which) {
  const { store } = ctx;
  const last = store.data.settings.exploreProgram;
  let id = IMPL_BY_ID[which] ? which : IMPL_BY_ID[last] ? last : IMPLEMENTATIONS[0].id;
  let wt = null;
  ctx.setCleanup(() => wt && wt.destroy());
  const host = h('div');
  const sel = h(
    'select',
    {
      'aria-label': 'Program',
      onchange: (e) => {
        id = e.target.value;
        store.setSetting('exploreProgram', id);
        history.replaceState(null, '', `#/implementation/${id}`);
        draw();
      },
    },
    MODULES.map((M) => {
      const list = IMPLEMENTATIONS.filter((x) => x.module === M.id);
      return list.length ? h('optgroup', { label: `${M.n}. ${M.title}` }, list.map((ex) => h('option', { value: ex.id, selected: ex.id === id }, ex.title))) : null;
    }),
  );
  const draw = () => {
    if (wt) wt.destroy();
    wt = createWalkthrough(IMPL_BY_ID[id], {
      onOpenLab: (code, setup) => {
        store.setLabDraft(`free:${setup.structure}`, code);
        const lab = store.labData();
        lab.freeValues ||= {};
        lab.freeValues[setup.structure] = setup.graph ? { graph: setup.graph, s: setup.vars?.s } : { values: setup.values || [] };
        store.save();
        ctx.go(`#/lab/free/${setup.structure}`);
      },
    });
    clear(host).append(wt.el);
  };
  draw();
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'C++ Implementation'), h('div', { class: 'subtitle' }, 'Complete programs for every module in C++, with equivalent Python and pseudocode. Step through a program to see each statement change the data structure.'))),
    h('div', { class: 'panel' }, h('div', { class: 'row' }, h('label', { class: 'inline' }, 'Program', sel), h('span', { class: 'small muted' }, `${IMPLEMENTATIONS.length} programs. The highlighted statement is the same in every language; select a language on the code panel.`))),
    host,
  );
}
