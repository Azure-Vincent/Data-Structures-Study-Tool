import { h } from '../ui/dom.js';
import { LECTURES, CONCEPTS, CONCEPT_BY_ID, MISTAKE_LABELS } from '../content/concepts.js';
import { LESSON_BY_LECTURE } from '../content/lessons.js';
import { nextActivity } from '../progress/scheduler.js';
import { icon } from '../ui/icons.js';

export function levelBadge(store, id) {
  const l = store.level(id);
  return h('span', { class: `lvl ${l}`, title: CONCEPT_BY_ID[id]?.name }, l);
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const hh = Math.round(m / 60);
  if (hh < 24) return `${hh} h ago`;
  return `${Math.round(hh / 24)} d ago`;
}

const EYEBROW = { resume: 'Pick up where you left off', review: 'Worth a review', lesson: 'Up next', mixed: 'Keep it fresh' };

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
    if (next.kind === 'resume') ctx.go('#/practice/resume');
    else if (next.kind === 'review') ctx.go('#/practice/new/review');
    else if (next.kind === 'lesson') ctx.go(`#/lesson/${next.lecture}`);
    else ctx.go('#/practice/new/mixed');
  };
  const due = store.dueConcepts();
  const mistakes = store.recentMistakes(4);
  const recurring = store.recurringMistakes(4);
  const mastered = CONCEPTS.filter((c) => store.level(c.id) === 'mastered').length;
  let stepsDone = 0;
  let stepsTotal = 0;
  let lessonsDone = 0;
  for (const L of LECTURES) {
    const lesson = LESSON_BY_LECTURE[L.n];
    const rec = store.data.lessons[L.id];
    stepsTotal += lesson.sections.length;
    stepsDone += rec ? rec.done.length : 0;
    if (rec && rec.completed) lessonsDone++;
  }
  const attempts = Object.values(store.data.concepts).reduce((a, c) => a + (c.attempts || 0), 0);

  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Your study desk'), h('div', { class: 'subtitle' }, 'Linked lists, stacks, queues, trees and graphs — step by step.')), h('span', { class: 'muted small' }, `${mastered} of ${CONCEPTS.length} topics mastered · progress is saved on this computer`)),
    h('section', { class: 'next-card', 'aria-label': 'Suggested next activity' }, h('div', { class: 'next-text' }, h('div', { class: 'eyebrow' }, EYEBROW[next.kind] || 'Up next'), h('p', {}, next.label)), h('button', { class: 'btn primary', onclick: go }, next.kind === 'resume' ? 'Resume' : next.kind === 'lesson' ? 'Open lesson' : 'Start', ' →')),
    h(
      'div',
      { class: 'quick' },
      quick('shuffle', 'Mixed practice', 'Eight short tasks, weakest topics first', () => ctx.go('#/practice/new/mixed')),
      quick('target', 'Review missed concepts', due.length ? `${due.length} topic${due.length > 1 ? 's' : ''} due now` : 'Revisit what you got wrong', () => ctx.go('#/practice/new/review')),
      quick('explore', 'Free exploration', 'Build structures and run operations', () => ctx.go('#/explore')),
    ),
    h('div', { class: 'stats' }, stat('Topics mastered', mastered, CONCEPTS.length, (mastered / CONCEPTS.length) * 100), stat('Lesson steps done', stepsDone, stepsTotal, stepsTotal ? (stepsDone / stepsTotal) * 100 : 0), stat('Lessons finished', lessonsDone, LECTURES.length), stat('Answers checked', attempts)),
    h(
      'div',
      { class: 'dash-grid' },
      h(
        'section',
        { 'aria-label': 'Lectures' },
        h('div', { class: 'section-title' }, h('h2', {}, 'Lectures'), h('a', { href: '#/progress', class: 'small' }, 'Detailed progress →')),
        h(
          'div',
          { class: 'lec-cards' },
          LECTURES.map((L) => {
            const lesson = LESSON_BY_LECTURE[L.n];
            const rec = store.data.lessons[L.id];
            const nDone = rec ? rec.done.length : 0;
            const pct = Math.round((nDone / lesson.sections.length) * 100);
            const cs = CONCEPTS.filter((c) => c.lecture === L.n);
            const m = cs.filter((c) => store.level(c.id) === 'mastered').length;
            return h(
              'article',
              { class: ['lec-card', rec && rec.completed ? 'done' : nDone ? 'started' : ''] },
              h('div', { class: 'lec-top' }, h('span', { class: 'num' }, String(L.n).padStart(2, '0')), h('div', {}, h('a', { class: 'title', href: `#/lesson/${L.n}` }, L.title))),
              h('div', {}, h('div', { class: 'meta' }, h('span', {}, `Lesson ${nDone}/${lesson.sections.length} steps`), h('span', {}, `${pct}%`)), h('div', { class: 'bar', role: 'img', 'aria-label': `lesson ${pct}% complete` }, h('span', { style: { width: pct + '%' } }))),
              h('div', { class: 'foot' }, h('div', { class: 'dots', 'aria-label': 'topics' }, cs.map((c) => h('a', { class: `dot ${store.level(c.id)}`, href: `#/practice/new/concept/${c.id}`, title: `${c.name} — ${store.level(c.id)} (click to practise)`, 'aria-label': `Practise ${c.name} (${store.level(c.id)})` }))), h('span', { class: 'small muted' }, `${m}/${cs.length} mastered`)),
            );
          }),
        ),
        h('div', { class: 'legend' }, h('span', {}, 'Each dot is one topic:'), ['new', 'learning', 'practicing', 'mastered'].map((l) => h('span', {}, h('span', { class: `dot ${l}` }), l === 'practicing' ? 'practising' : l)), h('span', {}, 'Click a dot to practise that topic.')),
      ),
      h(
        'aside',
        {},
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Due for review'), due.length ? h('button', { class: 'btn small', onclick: () => ctx.go('#/practice/new/review') }, 'Review now') : null),
          due.length ? h('ul', { class: 'list-plain' }, due.slice(0, 8).map((id) => h('li', {}, h('a', { href: `#/practice/new/concept/${id}` }, CONCEPT_BY_ID[id].name), levelBadge(store, id)))) : h('div', { class: 'empty' }, h('span', { class: 'big', 'aria-hidden': 'true' }, '✓'), 'Nothing is due. Topics come back here after a mistake and at growing intervals after correct answers.'),
        ),
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Recent mistakes')),
          mistakes.length
            ? mistakes.map((m) => h('div', { class: 'mistake' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('b', {}, CONCEPT_BY_ID[m.concept]?.name || m.concept), h('span', { class: 'when' }, ago(m.t))), h('div', {}, m.message), h('a', { href: `#/practice/new/concept/${m.concept}`, class: 'small' }, 'Practise this again →')))
            : h('div', { class: 'empty' }, 'No mistakes recorded yet.'),
          recurring.length ? h('div', { class: 'row', style: { marginTop: '10px' } }, h('b', { class: 'small' }, 'Recurring:'), recurring.map((r) => h('span', { class: 'pill edge' }, `${MISTAKE_LABELS[r.tag] || r.tag} ×${r.count}`))) : null,
        ),
      ),
    ),
  );
}
