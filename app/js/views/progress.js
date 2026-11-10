import { h } from '../ui/dom.js';
import { MODULES, CONCEPTS, MISTAKE_LABELS, CONCEPT_BY_ID } from '../content/concepts.js';
import { TYPE_LABELS } from '../exercises/registry.js';
import { levelBadge } from './dashboard.js';

export function progressView(ctx) {
  const { store } = ctx;
  const d = store.data;
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Learning Progress'), h('div', { class: 'subtitle' }, 'Every concept, the number of attempts, the mastery level and the date of the next scheduled review.')), h('a', { href: '#/settings', class: 'btn small' }, 'Export, import or reset')),
    h(
      'div',
      { class: 'stats' },
      ['new', 'learning', 'practicing', 'mastered'].map((l) => {
        const n = CONCEPTS.filter((c) => store.level(c.id) === l).length;
        return h('div', { class: 'stat' }, h('div', { class: 'k' }, h('span', { class: `lvl ${l}` }, l)), h('div', { class: 'v' }, String(n), h('small', {}, `/ ${CONCEPTS.length}`)));
      }),
    ),
    h('p', { class: 'muted small', style: { marginTop: 0 } }, 'A concept is mastered after at least three independent correct answers (no hints, no revealed solution, not fully guided) on at least two different exercise templates, with the most recent attempt correct. Viewing simulations or revealed solutions does not count toward mastery.'),
    MODULES.map((M) =>
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'section-title' }, h('h2', {}, `${M.n}. ${M.title}`), h('span', { class: 'small muted' }, store.assessmentData()[M.id] ? `Latest assessment: ${store.assessmentData()[M.id].last.pct}%` : ''), h('a', { href: `#/practice/new/module/${M.id}`, class: 'btn small' }, 'Practice')),
        h(
          'div',
          { class: 'table-wrap' },
          h(
          'table',
          { class: 'lec-table small' },
          h('thead', {}, h('tr', {}, ['Concept', 'Level', 'Attempts', 'Correct', 'Independent', 'Hints used', 'Solutions revealed', 'Next review'].map((t, k) => h('th', { class: k >= 2 && k <= 6 ? 'n' : null }, t)))),
          h('tbody', {}, CONCEPTS.filter((c) => c.module === M.id).map((c) => {
            const r = d.concepts[c.id];
            return h(
              'tr',
              {},
              h('td', {}, h('a', { href: `#/practice/new/concept/${c.id}` }, c.name)),
              h('td', {}, levelBadge(store, c.id)),
              h('td', { class: 'n' }, r ? String(r.attempts) : '0'),
              h('td', { class: 'n' }, r ? pct(r.correct, r.attempts) : '—'),
              h('td', { class: 'n' }, r ? String(r.independent) : '0'),
              h('td', { class: 'n' }, r ? String(r.hints) : '0'),
              h('td', { class: 'n' }, r ? String(r.revealed) : '0'),
              h('td', {}, r && r.introduced ? (r.due <= Date.now() ? h('span', { class: 'pill edge' }, 'Due now') : new Date(r.due).toLocaleDateString()) : h('span', { class: 'muted' }, '—')),
            );
          })),
        ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'grid-2', style: { marginTop: '16px' } },
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h3', {}, 'Results by exercise type')),
        h('table', { class: 'vars-table' }, h('tr', {}, h('td', {}, 'Type'), h('td', {}, 'Attempts · correct · independent · hints')), Object.entries(d.types).map(([t, r]) => h('tr', {}, h('td', {}, TYPE_LABELS[t] || t), h('td', {}, `${r.attempts} · ${pct(r.correct, r.attempts)} · ${r.independent} · ${r.hints}`)))),
      ),
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h3', {}, 'Recurring errors')),
        store.recurringMistakes(10).length ? h('ul', {}, store.recurringMistakes(10).map((m) => h('li', {}, `${MISTAKE_LABELS[m.tag] || m.tag}: ${m.count} occurrences`))) : h('p', { class: 'small muted' }, 'None recorded. An error type is listed as recurring after it occurs twice.'),
        h('div', { class: 'panel-title', style: { marginTop: '14px' } }, h('h3', {}, 'Recent errors')),
        store.recentMistakes(8).map((m) => h('div', { class: 'mistake' }, h('b', {}, CONCEPT_BY_ID[m.concept]?.name || m.concept), h('div', {}, m.message))),
      ),
    ),
  );
}
