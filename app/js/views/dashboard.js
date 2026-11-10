import { h } from '../ui/dom.js';
import { MODULES, CONCEPTS, CONCEPT_BY_ID, MISTAKE_LABELS } from '../content/concepts.js';
import { LESSON_BY_ID } from '../content/lessons.js';
import { nextActivity } from '../progress/scheduler.js';
import { icon } from '../ui/icons.js';
import { dueCards } from '../progress/drills.js';

export function levelBadge(store, id) {
  const l = store.level(id);
  return h('span', { class: `lvl ${l}`, title: CONCEPT_BY_ID[id]?.name }, l);
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'less than a minute ago';
  if (m < 60) return `${m} min ago`;
  const hh = Math.round(m / 60);
  if (hh < 24) return `${hh} h ago`;
  const d = Math.round(hh / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

const EYEBROW = { resume: 'Unfinished session', review: 'Recommended review', lesson: 'Recommended next module', mixed: 'Recommended practice' };

function stat(label, value, total, barPct) {
  return h('div', { class: 'stat' }, h('div', { class: 'k' }, label), h('div', { class: 'v' }, String(value), total != null ? h('small', {}, `/ ${total}`) : null), barPct != null ? h('div', { class: 'bar', role: 'img', 'aria-label': `${Math.round(barPct)}%` }, h('span', { style: { width: barPct + '%' } })) : null);
}

function quick(ico, title, text, onclick) {
  return h('button', { class: 'quick-card', onclick }, icon(ico), h('div', {}, h('b', {}, title), h('span', {}, text)));
}

export function dashboardView(ctx) {
  const { store } = ctx;
  const next = nextActivity(store);
  const go = () => {
    if (next.kind === 'resume') ctx.go(next.assessment ? '#/assessment/resume' : '#/practice/resume');
    else if (next.kind === 'review') ctx.go('#/practice/new/review');
    else if (next.kind === 'lesson') ctx.go(`#/module/${next.module}`);
    else ctx.go('#/practice/new/mixed');
  };
  const due = store.dueConcepts();
  const drillsDue = dueCards(store.drillData(), store.now()).length;
  const mistakes = store.recentMistakes(4);
  const recurring = store.recurringMistakes(4);
  const mastered = CONCEPTS.filter((c) => store.level(c.id) === 'mastered').length;
  let stepsDone = 0;
  let stepsTotal = 0;
  let lessonsDone = 0;
  for (const M of MODULES) {
    const lesson = LESSON_BY_ID[M.id];
    const rec = store.data.lessons[M.id];
    stepsTotal += lesson.sections.length;
    stepsDone += store.lessonDoneCount(M.id, lesson.sections.map((s) => s.key));
    if (rec && rec.completed) lessonsDone++;
  }
  const attempts = Object.values(store.data.concepts).reduce((a, c) => a + (c.attempts || 0), 0);

  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Data Structures and Algorithms'), h('h1', {}, 'Learning Dashboard'), h('div', { class: 'subtitle' }, 'Memory management, linked lists, stacks, queues, trees and graphs: concepts, visualizations, pseudocode and C++ implementation.')), h('span', { class: 'muted small' }, `${mastered} of ${CONCEPTS.length} concepts mastered · progress is stored on this device`)),
    h('section', { class: 'next-card', 'aria-label': 'Suggested next activity' }, h('div', { class: 'next-text' }, h('div', { class: 'eyebrow' }, EYEBROW[next.kind] || 'Up next'), h('p', {}, next.label)), h('button', { class: 'btn primary', onclick: go }, next.kind === 'resume' ? 'Resume' : next.kind === 'lesson' ? 'Open module' : 'Start', ' →')),
    h(
      'div',
      { class: 'quick' },
      quick('shuffle', 'Practice Exercises', 'Eight exercises, concepts that need review first', () => ctx.go('#/practice/new/mixed')),
      quick('target', 'Targeted Review', due.length ? `${due.length} concept${due.length > 1 ? 's' : ''} due for review` : 'Concepts answered incorrectly recently', () => ctx.go('#/practice/new/review')),
      quick('cards', 'Cumulative Review', drillsDue ? `${drillsDue} pseudocode exercise${drillsDue > 1 ? 's' : ''} due for review` : 'Spaced review of pseudocode from every module', () => ctx.go('#/review')),
      quick('code', 'Pseudocode Development', 'Write pseudocode and execute it step by step', () => ctx.go('#/lab')),
      quick('explore', 'Interactive Visualizations', 'Build structures and run operations', () => ctx.go('#/explore')),
      quick('check', 'Knowledge Assessment', 'Assess each module without hints', () => ctx.go('#/assessment')),
    ),
    h('div', { class: 'stats' }, stat('Concepts mastered', mastered, CONCEPTS.length, (mastered / CONCEPTS.length) * 100), stat('Module steps completed', stepsDone, stepsTotal, stepsTotal ? (stepsDone / stepsTotal) * 100 : 0), stat('Modules completed', lessonsDone, MODULES.length), stat('Answers submitted', attempts)),
    h(
      'div',
      { class: 'dash-grid' },
      h(
        'section',
        { 'aria-label': 'Learning Modules' },
        h('div', { class: 'section-title' }, h('h2', {}, 'Learning Modules'), h('a', { href: '#/progress', class: 'small' }, 'Learning Progress →')),
        h(
          'div',
          { class: 'lec-cards' },
          MODULES.map((M) => {
            const lesson = LESSON_BY_ID[M.id];
            const rec = store.data.lessons[M.id];
            const nDone = store.lessonDoneCount(M.id, lesson.sections.map((s) => s.key));
            const pct = Math.round((nDone / lesson.sections.length) * 100);
            const cs = CONCEPTS.filter((c) => c.module === M.id);
            const m = cs.filter((c) => store.level(c.id) === 'mastered').length;
            return h(
              'article',
              { class: ['lec-card', rec && rec.completed ? 'done' : nDone ? 'started' : ''] },
              h('div', { class: 'lec-top' }, h('span', { class: 'num' }, String(M.n)), h('div', {}, h('a', { class: 'title', href: `#/module/${M.id}` }, M.title))),
              h('div', {}, h('div', { class: 'meta' }, h('span', {}, `${nDone} of ${lesson.sections.length} steps`), h('span', {}, `${pct}%`)), h('div', { class: 'bar', role: 'img', 'aria-label': `module ${pct}% complete` }, h('span', { style: { width: pct + '%' } }))),
              h('div', { class: 'foot' }, h('div', { class: 'dots', 'aria-label': 'concepts' }, cs.map((c) => h('a', { class: `dot ${store.level(c.id)}`, href: `#/practice/new/concept/${c.id}`, title: `${c.name} — ${store.level(c.id)} (click to practise)`, 'aria-label': `Practise ${c.name} (${store.level(c.id)})` }))), h('span', { class: 'small muted' }, `${m}/${cs.length} mastered`)),
            );
          }),
        ),
        h('div', { class: 'legend' }, h('span', {}, 'Each dot is one concept:'), ['new', 'learning', 'practicing', 'mastered'].map((l) => h('span', {}, h('span', { class: `dot ${l}` }), l)), h('span', {}, 'Select a dot to practice that concept.')),
      ),
      h(
        'aside',
        {},
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Due for review'), due.length ? h('button', { class: 'btn small', onclick: () => ctx.go('#/practice/new/review') }, 'Review now') : null),
          due.length ? h('ul', { class: 'list-plain' }, due.slice(0, 8).map((id) => h('li', {}, h('a', { href: `#/practice/new/concept/${id}` }, CONCEPT_BY_ID[id].name), levelBadge(store, id)))) : h('div', { class: 'empty' }, h('span', { class: 'big', 'aria-hidden': 'true' }, '✓'), 'No concepts are due. A concept is scheduled for review after an incorrect answer and at increasing intervals after correct answers.'),
        ),
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Recent errors')),
          mistakes.length
            ? mistakes.map((m) => h('div', { class: 'mistake' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('b', {}, CONCEPT_BY_ID[m.concept]?.name || m.concept), h('span', { class: 'when' }, ago(m.t))), h('div', {}, m.message), h('a', { href: `#/practice/new/concept/${m.concept}`, class: 'small' }, 'Practise this again →')))
            : h('div', { class: 'empty' }, 'No errors recorded.'),
          recurring.length ? h('div', { class: 'row', style: { marginTop: '10px' } }, h('b', { class: 'small' }, 'Recurring errors:'), recurring.map((r) => h('span', { class: 'pill edge' }, `${MISTAKE_LABELS[r.tag] || r.tag} (${r.count})`))) : null,
        ),
      ),
    ),
  );
}
