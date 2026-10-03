import { h } from '../ui/dom.js';
import { LECTURES, CONCEPTS, CONCEPT_BY_ID, MISTAKE_LABELS } from '../content/concepts.js';
import { LESSON_BY_LECTURE } from '../content/lessons.js';
import { nextActivity } from '../progress/scheduler.js';

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
  const mistakes = store.recentMistakes(5);
  const recurring = store.recurringMistakes(4);
  const mastered = CONCEPTS.filter((c) => store.level(c.id) === 'mastered').length;

  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('h1', {}, 'Your study desk'), h('span', { class: 'muted small' }, `${mastered} of ${CONCEPTS.length} topics mastered · progress is saved on this computer`)),
    h('section', { class: 'next-card', 'aria-label': 'Suggested next activity' }, h('p', {}, next.label), h('button', { class: 'btn primary', onclick: go }, next.kind === 'resume' ? 'Resume' : next.kind === 'lesson' ? 'Open lesson' : 'Start')),
    h(
      'div',
      { class: 'row', style: { margin: '12px 0 18px' } },
      h('button', { class: 'btn', onclick: () => ctx.go('#/practice/new/mixed') }, 'Mixed practice (8 tasks)'),
      h('button', { class: 'btn', onclick: () => ctx.go('#/practice/new/review') }, 'Review missed concepts'),
      h('button', { class: 'btn', onclick: () => ctx.go('#/explore') }, 'Free exploration'),
    ),
    h(
      'div',
      { class: 'grid-2' },
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h3', {}, 'Lectures')),
        h(
          'table',
          { class: 'lec-table' },
          LECTURES.map((L) => {
            const lesson = LESSON_BY_LECTURE[L.n];
            const rec = store.data.lessons[L.id];
            const pct = rec ? Math.round((rec.done.length / lesson.sections.length) * 100) : 0;
            return h(
              'tr',
              {},
              h('td', { style: { width: '42%' } }, h('a', { href: `#/lesson/${L.n}` }, `${String(L.n).padStart(2, '0')} ${L.title}`), h('div', { class: 'bar', style: { marginTop: '6px' }, role: 'img', 'aria-label': `lesson ${pct}% complete` }, h('span', { style: { width: pct + '%' } }))),
              h('td', {}, h('div', { class: 'concept-list' }, CONCEPTS.filter((c) => c.lecture === L.n).map((c) => h('a', { href: `#/practice/new/concept/${c.id}`, title: `Practise: ${c.name}`, style: { textDecoration: 'none' } }, levelBadge(store, c.id))))),
            );
          }),
        ),
        h('p', { class: 'small muted' }, 'Each badge is one topic: ○ new · ◔ learning · ◑ practising · ● mastered (three independent correct answers on at least two different exercise types). Click a badge to practise it.'),
      ),
      h(
        'div',
        {},
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Due for review'), due.length ? h('button', { class: 'btn small', onclick: () => ctx.go('#/practice/new/review') }, 'Review now') : null),
          due.length ? h('ul', { class: 'small', style: { margin: 0, paddingLeft: '18px' } }, due.slice(0, 8).map((id) => h('li', {}, h('a', { href: `#/practice/new/concept/${id}` }, CONCEPT_BY_ID[id].name), ' ', levelBadge(store, id)))) : h('p', { class: 'small muted' }, 'Nothing is due. Topics come back here after a mistake and at growing intervals after correct answers.'),
        ),
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'panel-title' }, h('h3', {}, 'Recent mistakes')),
          mistakes.length
            ? mistakes.map((m) => h('div', { class: 'mistake' }, h('b', {}, CONCEPT_BY_ID[m.concept]?.name || m.concept), h('span', { class: 'muted' }, ` · ${ago(m.t)}`), h('div', {}, m.message), h('a', { href: `#/practice/new/concept/${m.concept}`, class: 'small' }, 'Practise this again')))
            : h('p', { class: 'small muted' }, 'No mistakes recorded yet.'),
          recurring.length ? h('div', { style: { marginTop: '8px' } }, h('b', { class: 'small' }, 'Recurring: '), recurring.map((r) => h('span', { class: 'pill', style: { marginRight: '4px' } }, `${MISTAKE_LABELS[r.tag] || r.tag} ×${r.count}`))) : null,
        ),
      ),
    ),
  );
}
