// Knowledge Assessment: exercises from one module (or from every module) with
// no guidance and no follow-up exercises, so the score reflects what the
// learner can do unassisted. The session runner is shared with Practice
// Exercises; the latest and best result per assessment are kept in the store.
import { h } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { MODULES, MODULE_BY_ID, CONCEPTS } from '../content/concepts.js';
import { buildSession } from '../progress/scheduler.js';
import { runner } from './practice.js';

export const MODULE_ASSESSMENT_SIZE = 8;
export const COMPREHENSIVE_ASSESSMENT_SIZE = 14;

export function assessmentView(ctx, action, arg) {
  const { store } = ctx;
  if (action === 'start') {
    const module = MODULE_BY_ID[arg] ? arg : null;
    const s = buildSession(store, { mode: 'assessment', module, size: module ? MODULE_ASSESSMENT_SIZE : COMPREHENSIVE_ASSESSMENT_SIZE, timed: !!store.data.settings.timer });
    store.setSession(s);
    history.replaceState(null, '', '#/assessment/resume');
    return runner(ctx);
  }
  const s = store.data.session;
  if (action === 'resume' && s && !s.finished && s.mode === 'assessment') return runner(ctx);
  return overview(ctx);
}

function when(t) {
  return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function resultText(rec) {
  if (!rec) return h('span', { class: 'muted' }, 'Not yet taken');
  return h('span', {}, h('b', {}, `${rec.last.pct}%`), ` (${rec.last.correct} of ${rec.last.total}) on ${when(rec.last.at)}`, rec.count > 1 ? h('span', { class: 'muted' }, ` · best ${rec.best.pct}%`) : null);
}

function overview(ctx) {
  const { store } = ctx;
  const results = store.assessmentData();
  const s = store.data.session;
  const unfinished = s && !s.finished && s.mode === 'assessment' && s.items.some((x) => x.status === 'pending');
  const start = (key) => ctx.go(`#/assessment/start/${key}`);
  return h(
    'div',
    { class: 'assessment' },
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Assessment'), h('h1', {}, 'Knowledge Assessment'), h('div', { class: 'subtitle' }, 'Measure what you can do without support. An assessment draws exercises from every concept of a module, provides no worked steps, and does not insert follow-up exercises after an incorrect answer. Each answer also counts toward concept mastery.'))),
    unfinished
      ? h('div', { class: 'next-card', style: { marginBottom: '18px' } }, h('div', { class: 'next-text' }, h('div', { class: 'eyebrow' }, 'Assessment in progress'), h('p', {}, `${s.items.filter((x) => x.status !== 'pending').length} of ${s.items.length} exercises completed.`)), h('button', { class: 'btn primary', onclick: () => ctx.go('#/assessment/resume') }, 'Resume assessment'))
      : null,
    h(
      'section',
      { class: 'panel mode-card featured', 'aria-label': 'Comprehensive assessment' },
      icon('target'),
      h('h2', {}, 'Comprehensive Assessment'),
      h('p', {}, `${COMPREHENSIVE_ASSESSMENT_SIZE} exercises drawn from all seven learning modules.`),
      h('p', { class: 'small' }, 'Latest result: ', resultText(results.all)),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => start('all') }, 'Start the comprehensive assessment')),
    ),
    h('h2', { class: 'section-title', style: { marginTop: '22px' } }, 'Module Assessments'),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'lec-table small assessment-table' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Module'), h('th', { scope: 'col' }, 'Concepts'), h('th', { scope: 'col' }, 'Latest result'), h('th', { scope: 'col' }, h('span', { class: 'sr-only' }, 'Action')))),
        h(
          'tbody',
          {},
          MODULES.map((M) =>
            h(
              'tr',
              {},
              h('th', { scope: 'row' }, `${M.n}. ${M.title}`),
              h('td', {}, String(CONCEPTS.filter((c) => c.module === M.id).length)),
              h('td', {}, resultText(results[M.id])),
              h('td', {}, h('button', { class: 'btn small', 'aria-label': `Start the ${M.title} assessment`, onclick: () => start(M.id) }, `Start · ${MODULE_ASSESSMENT_SIZE} exercises`)),
            ),
          ),
        ),
      ),
    ),
  );
}
