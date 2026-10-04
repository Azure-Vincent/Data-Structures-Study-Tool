import { h, toast, download } from '../ui/dom.js';
import { updatesPanel } from '../ui/updates.js';

export function settingsView(ctx) {
  const { store } = ctx;
  const st = store.data.settings;
  const set = (k, v) => {
    store.setSetting(k, v);
    ctx.applySettings();
  };
  const sel = (k, opts, label) => h('label', { class: 'setting-row' }, h('span', { class: 'lbl' }, label), h('select', { onchange: (e) => set(k, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) }, opts.map(([v, l]) => h('option', { value: v, selected: String(st[k]) === String(v) }, l))));
  const file = h('input', {
    type: 'file',
    class: 'sr-only',
    tabindex: '-1',
    accept: '.json,application/json',
    'aria-label': 'progress file to import',
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const text = await f.text();
      if (!window.confirm('Importing replaces your current progress on this computer. Continue?')) return;
      const r = store.importJSON(text);
      toast(r.ok ? 'Progress imported.' : r.error, 4000);
      if (r.ok) ctx.go('#/');
    },
  });
  const upd = updatesPanel();
  if (upd) ctx.setCleanup(upd.cleanup);
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Settings & data'), h('div', { class: 'subtitle' }, 'Display preferences and your locally stored progress.'))),
    h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Display'),
      sel('theme', [['system', 'Follow the system'], ['light', 'Light'], ['dark', 'Dark']], 'Theme'),
      sel('motion', [['system', 'Follow the system'], ['reduce', 'Reduce motion'], ['full', 'Full animation']], 'Animation'),
      sel('speed', [[0.5, '0.5×'], [1, '1×'], [2, '2×'], [4, '4×']], 'Default playback speed'),
      h('label', { class: 'setting-row' }, h('span', { class: 'lbl' }, 'Ask for predictions in lessons', h('small', {}, 'Simulations pause before key steps so you can guess first.')), h('input', { type: 'checkbox', checked: !!st.predictMode, onchange: (e) => set('predictMode', e.target.checked) })),
      h('div', { class: 'setting-row' }, h('span', { class: 'lbl' }, 'Practice timer', h('small', {}, 'Optional; it never stops you.')), h('span', { class: 'row' }, h('input', { type: 'checkbox', 'aria-label': 'practice timer', checked: !!st.timer, onchange: (e) => set('timer', e.target.checked) }), h('input', { type: 'number', min: 3, max: 30, value: st.timerMinutes, style: { width: '70px' }, 'aria-label': 'timer minutes', onchange: (e) => set('timerMinutes', Math.max(3, Math.min(30, Number(e.target.value) || 8))) }), 'minutes')),
    ),
    h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Your progress data'),
      h('p', { class: 'small muted' }, 'Progress is stored only on this computer (browser storage; in the desktop app, its own profile folder). No account, no server, no internet needed.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => download(`ds-study-lab-progress-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON()) }, 'Export progress (.json)'), h('button', { class: 'btn', onclick: () => file.click() }, 'Import progress…'), file),
      h('hr'),
      h('h3', {}, 'Reset all progress'),
      h('p', { class: 'small' }, 'Deletes every attempt, mistake, lesson checkmark and the current practice session. Display settings are kept. This cannot be undone — export first if unsure.'),
      h('button', { class: 'btn danger', onclick: () => { if (window.confirm('Delete ALL progress on this computer? This cannot be undone.')) { store.reset(); toast('All progress was reset.'); ctx.go('#/'); } } }, 'Reset all progress'),
    ),
    upd,
    h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'About'),
      h('p', { class: 'prose', style: { fontSize: '15px' } }, 'DS Study Lab follows the handwritten notes of Lectures 07–14. Material that is not in the notes is labelled “Supplementary”; places where the notes are incomplete or use non-standard names have “Correction / clarification” callouts. All grading is deterministic: answers are computed by the same simulator you watch. Free-text reflections and pseudocode are never graded.'),
    ),
  );
}
