import { h } from '../ui/dom.js';
import { LECTURES, CONCEPTS, MISTAKE_LABELS, CONCEPT_BY_ID } from '../content/concepts.js';
import { TYPE_LABELS } from '../exercises/registry.js';
import { levelBadge } from './dashboard.js';

export function progressView(ctx) {
  const { store } = ctx;
  const d = store.data;
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('h1', {}, 'Progress'), h('a', { href: '#/settings' }, 'Export, import or reset')),
    h('p', { class: 'muted small' }, 'Mastery = at least 3 independent correct answers (no hints, no revealed solution, not fully guided) on at least 2 different exercise templates, with the latest attempt correct. Watching simulations or revealing solutions never counts.'),
    LECTURES.map((L) =>
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h3', {}, `${String(L.n).padStart(2, '0')} · ${L.title}`), h('a', { href: `#/practice/new/lecture/${L.n}`, class: 'small' }, 'Practise')),
        h(
          'table',
          { class: 'lec-table small' },
          h('tr', {}, ['Topic', 'Level', 'Attempts', 'Correct', 'Independent', 'Hints used', 'Solutions revealed', 'Next review'].map((t) => h('th', { style: { textAlign: 'left', color: 'var(--ink-3)', fontWeight: 500 } }, t))),
          CONCEPTS.filter((c) => c.lecture === L.n).map((c) => {
            const r = d.concepts[c.id];
            return h(
              'tr',
              {},
              h('td', {}, h('a', { href: `#/practice/new/concept/${c.id}` }, c.name)),
              h('td', {}, levelBadge(store, c.id)),
              h('td', {}, r ? String(r.attempts) : '0'),
              h('td', {}, r ? pct(r.correct, r.attempts) : '—'),
              h('td', {}, r ? String(r.independent) : '0'),
              h('td', {}, r ? String(r.hints) : '0'),
              h('td', {}, r ? String(r.revealed) : '0'),
              h('td', {}, r && r.introduced ? (r.due <= Date.now() ? 'due now' : new Date(r.due).toLocaleDateString()) : '—'),
            );
          }),
        ),
      ),
    ),
    h(
      'div',
      { class: 'grid-2', style: { marginTop: '12px' } },
      h(
        'section',
        { class: 'panel' },
        h('h3', {}, 'By exercise type'),
        h('table', { class: 'vars-table' }, h('tr', {}, h('td', {}, 'type'), h('td', {}, 'attempts · correct · independent · hints')), Object.entries(d.types).map(([t, r]) => h('tr', {}, h('td', {}, TYPE_LABELS[t] || t), h('td', {}, `${r.attempts} · ${pct(r.correct, r.attempts)} · ${r.independent} · ${r.hints}`)))),
      ),
      h(
        'section',
        { class: 'panel' },
        h('h3', {}, 'Recurring mistakes'),
        store.recurringMistakes(10).length ? h('ul', {}, store.recurringMistakes(10).map((m) => h('li', {}, `${MISTAKE_LABELS[m.tag] || m.tag} — ${m.count} times`))) : h('p', { class: 'small muted' }, 'None yet (a mistake type is “recurring” after it happens twice).'),
        h('h3', { style: { marginTop: '10px' } }, 'Latest mistakes'),
        store.recentMistakes(8).map((m) => h('div', { class: 'mistake' }, h('b', {}, CONCEPT_BY_ID[m.concept]?.name || m.concept), h('div', {}, m.message))),
      ),
    ),
  );
}
