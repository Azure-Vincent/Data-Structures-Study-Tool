// Pseudocode drills: spaced-repetition practice that is only about writing
// pseudocode. Every card is a Pseudocode Lab exercise; a review opens it in
// the Lab's drill mode (editor, diagram, step-by-step run, automatic check)
// and the check decides when the card comes back (see progress/drills.js).
import { h, clear, pill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { labView } from './lab.js';
import { DRILL_DECK, DRILL_BY_ID, DRILL_TOPICS, DRILL_INTERVALS, dueCards, newCards, newLeftToday, sessionCards, aheadCards, forecast, cardStatus, whenText, REMEMBERED_BOX } from '../progress/drills.js';
import { STRUCTURES, buildInitial, describeSetup } from '../lab/structures.js';
import { renderLabDiagram, renderCollections } from '../ui/render/labState.js';
import { runAll } from '../lab/run.js';

const STATUS_LABEL = { new: 'New', due: 'Due now', learning: 'Learning', remembered: 'Remembered' };
const RESULT_LABEL = { good: 'good', hard: 'hard', again: 'again' };

export function drillsView(ctx, id) {
  if (id && DRILL_BY_ID[id]) return cardView(ctx, id);
  return overview(ctx);
}

/** Start a session: every card gets a fresh, empty draft (it is written from memory). */
export function startDrills(ctx, ids) {
  const { store } = ctx;
  for (const id of ids) clearDraft(store, id);
  store.setDrillSession(ids);
  ctx.go(`#/drills/${ids[0]}`);
}

function clearDraft(store, id) {
  delete store.labData().drafts[`drill:${id}`];
}

// ---------------------------------------------------------------- one card (the Lab in drill mode)
function cardView(ctx, id) {
  const { store } = ctx;
  const d = store.drillData();
  let s = d.session;
  if (!s || s.finished || s.ids[s.index] !== id) {
    const at = s && !s.finished ? s.ids.indexOf(id, s.index) : -1;
    if (at >= 0) s.index = at;
    else {
      // a card opened on its own: a session of one card
      clearDraft(store, id);
      store.setDrillSession([id]);
      s = d.session;
    }
  }
  const next = () => {
    s.index++;
    if (s.index >= s.ids.length) {
      s.finished = true;
      store.save();
      ctx.go('#/drills');
      return;
    }
    clearDraft(store, s.ids[s.index]);
    store.save();
    ctx.go(`#/drills/${s.ids[s.index]}`);
  };
  return labView(ctx, id, null, {
    drill: {
      id,
      pos: s.index,
      get total() {
        return s.ids.length;
      },
      card: d.cards[id] || null,
      review: (outcome) => store.reviewDrill(id, outcome),
      next,
      end: () => {
        s.finished = true;
        store.save();
        ctx.go('#/drills');
      },
      when: (due) => whenText(due, store.now()),
    },
  });
}

// ---------------------------------------------------------------- overview
function overview(ctx) {
  const { store } = ctx;
  const root = h('div', { class: 'drills' });
  draw();
  return root;

  function draw() {
    const d = store.drillData();
    const now = store.now();
    const due = dueCards(d, now);
    const fresh = newCards(d);
    const left = Math.min(newLeftToday(d, now), fresh.length);
    const startIds = sessionCards(d, now);
    const s = d.session;
    const resumable = s && !s.finished && s.index < s.ids.length;
    const inTopic = DRILL_DECK.filter((c) => d.topics.includes(c.topic));
    const learning = inTopic.filter((c) => d.cards[c.id] && d.cards[c.id].box < REMEMBERED_BOX).length;
    const remembered = inTopic.filter((c) => d.cards[c.id] && d.cards[c.id].box >= REMEMBERED_BOX).length;
    const upcoming = inTopic.filter((c) => d.cards[c.id] && d.cards[c.id].due > now).sort((a, b) => d.cards[a.id].due - d.cards[b.id].due)[0];

    const actions = h('div', { class: 'row drill-actions' });
    if (resumable) actions.append(h('button', { class: 'btn primary', onclick: () => ctx.go(`#/drills/${s.ids[s.index]}`) }, `Resume the session (card ${s.index + 1} of ${s.ids.length})`));
    if (startIds.length) actions.append(h('button', { class: `btn ${resumable ? '' : 'primary'}`, onclick: () => startDrills(ctx, startIds) }, `${resumable ? 'Start a new session' : 'Start a session'} · ${startIds.length} card${startIds.length === 1 ? '' : 's'}`));
    else {
      const ahead = aheadCards(d, now);
      actions.append(
        h('span', { class: 'muted' }, inTopic.length ? `Nothing is due${upcoming ? ` — the next card comes back ${whenText(d.cards[upcoming.id].due, now)}` : ''}.` : 'Choose at least one topic.'),
        ahead.length ? h('button', { class: 'btn', onclick: () => startDrills(ctx, ahead) }, `Practise ahead · ${ahead.length} card${ahead.length === 1 ? '' : 's'}`) : null,
      );
    }

    const last = s && s.finished && s.results && Object.keys(s.results).length ? s.results : null;
    const counts = last ? Object.values(last).reduce((m, r) => ((m[r] = (m[r] || 0) + 1), m), {}) : null;

    clear(root).append(
      h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Practice'), h('h1', {}, 'Pseudocode drills'), h('div', { class: 'subtitle' }, 'Write the operations from memory in pseudocode and watch them run on the diagram. Each card comes back just before you would forget it — sooner when it was hard, later when it was easy.'))),
      h(
        'div',
        { class: 'stats drill-stats' },
        tile('Due now', due.length),
        tile('New today', left, `of ${d.newPerDay} a day`),
        tile('Learning', learning),
        tile('Remembered', remembered, `of ${inTopic.length}`),
      ),
      counts ? h('div', { class: 'feedback ok small' }, h('b', { class: 'verdict' }, 'Session finished.'), ` ${Object.keys(last).length} card${Object.keys(last).length === 1 ? '' : 's'} reviewed: ${['good', 'hard', 'again'].filter((k) => counts[k]).map((k) => `${counts[k]} ${RESULT_LABEL[k]}`).join(', ')}.`) : null,
      actions,
      h(
        'div',
        { class: 'row drill-topics', role: 'group', 'aria-label': 'Topics to drill' },
        h('span', { class: 'small muted' }, 'Topics'),
        DRILL_TOPICS.map((t) =>
          h(
            'button',
            {
              class: 'btn small',
              'aria-pressed': String(d.topics.includes(t.id)),
              onclick: () => {
                const on = d.topics.includes(t.id);
                store.setDrillTopics(on ? d.topics.filter((x) => x !== t.id) : [...d.topics, t.id]);
                draw();
              },
            },
            t.label,
            h('span', { class: 'muted' }, ` ${DRILL_DECK.filter((c) => c.topic === t.id).length}`),
          ),
        ),
      ),
      forecastStrip(forecast(d, now), now),
      DRILL_TOPICS.filter((t) => d.topics.includes(t.id)).map((t) =>
        h('section', { class: 'drill-topic', 'aria-label': t.label }, h('h2', {}, t.label), h('div', { class: 'drill-cards' }, DRILL_DECK.filter((c) => c.topic === t.id).map((c) => cardTile(ctx, c, d.cards[c.id], now)))),
      ),
      h(
        'details',
        { class: 'panel drill-how' },
        h('summary', {}, 'How the schedule works'),
        h(
          'ul',
          { class: 'small' },
          h('li', {}, h('b', {}, 'Good'), ' — the code passes every test case on the first check, without hints: the card moves up a box and comes back later (', DRILL_INTERVALS.slice(1).map((n) => `${n} d`).join(' → '), ').'),
          h('li', {}, h('b', {}, 'Hard'), ' — it passes after a failed check or with hints: the card stays in its box and comes back after half the interval.'),
          h('li', {}, h('b', {}, 'Again'), ' — the solution was shown or the card was skipped: back to box 1, due in 10 minutes and once more at the end of the session.'),
          h('li', {}, `A session holds every due card plus up to ${d.newPerDay} new cards a day, in lecture order. A syntax error does not count as a failed check. Each review starts from the exercise’s starting code, not from your last answer.`),
        ),
      ),
    );
  }

  function tile(label, value, sub) {
    return h('div', { class: 'stat' }, h('div', { class: 'k' }, label), h('div', { class: 'v' }, String(value), sub ? h('small', {}, ` ${sub}`) : null));
  }
}

function forecastStrip(counts, now) {
  const max = Math.max(1, ...counts);
  const day = (i) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(now + i * 864e5).toLocaleDateString(undefined, { weekday: 'short' }));
  return h(
    'div',
    { class: 'panel drill-forecast', 'aria-label': 'Reviews due in the next 7 days' },
    h('div', { class: 'panel-title' }, h('h3', {}, 'Coming up'), h('span', { class: 'small muted' }, counts.some(Boolean) ? 'reviews due each day' : 'nothing scheduled yet — reviewed cards appear here on the day they come back')),
    h(
      'div',
      { class: 'drill-forecast-bars' },
      counts.map((n, i) => h('div', { class: 'drill-day', title: `${day(i)}: ${n} review${n === 1 ? '' : 's'}` }, h('span', { class: 'n' }, n ? String(n) : ''), h('span', { class: 'bar', style: { height: `${(n / max) * 100}%` } }), h('span', { class: 'small muted' }, day(i)))),
    ),
  );
}

function cardTile(ctx, c, rec, now) {
  const st = cardStatus(rec, now);
  const ex = c.ex;
  return h(
    'article',
    { class: `drill-card ${st}` },
    thumb(ex),
    h('div', { class: 'drill-card-body' }, h('div', { class: 'row small' }, pill(STRUCTURES[ex.structure].render === 'none' ? 'Array' : STRUCTURES[ex.structure].label, 'type'), pill(`Lec ${String(ex.lecture).padStart(2, '0')}`)), h('h3', {}, ex.title), h('div', { class: 'row small' }, h('span', { class: `drill-status ${st}` }, STATUS_LABEL[st]), rec ? h('span', { class: 'muted' }, st === 'due' ? `box ${rec.box}` : `next ${whenText(rec.due, now)} · box ${rec.box}`) : null)),
    h(
      'button',
      {
        class: 'btn small',
        'aria-label': `Practise “${ex.title}” now`,
        onclick: () => {
          const s = ctx.store.drillData().session;
          if (s && !s.finished && s.index < s.ids.length && s.ids[s.index] !== c.id && !window.confirm(`This ends the session you started (card ${s.index + 1} of ${s.ids.length}). Practise this card instead?`)) return;
          startDrills(ctx, [c.id]);
        },
      },
      icon('code'),
      'Practise',
    ),
  );
}

// the starting structure of the card's first test case, drawn small
const thumbs = new Map();
function thumb(ex) {
  const setup = { structure: ex.structure, ...ex.tests[0].setup };
  const box = h('div', { class: 'drill-thumb diagram-box', title: describeSetup(setup), 'aria-hidden': 'true' });
  try {
    if (STRUCTURES[ex.structure].render === 'none') {
      // programs on arrays build their own: show the arrays the starting code creates
      if (!thumbs.has(ex.id)) thumbs.set(ex.id, runAll(ex.starter, setup, { limit: 400 }).state);
      box.append(renderCollections(thumbs.get(ex.id)) || h('code', { class: 'small' }, 'new Array(n)'));
    } else {
      const { state, graph } = buildInitial(setup);
      box.append(renderLabDiagram(state, graph, {}));
    }
  } catch {
    box.append(h('span', { class: 'small muted' }, describeSetup(setup)));
  }
  return box;
}
