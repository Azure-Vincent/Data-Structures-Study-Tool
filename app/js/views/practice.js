import { h, clear } from '../ui/dom.js';
import { generateExercise, TYPE_LABELS } from '../exercises/registry.js';
import { buildSession, followUpItem } from '../progress/scheduler.js';
import { renderExercise } from '../ui/exercise.js';
import { LECTURES, CONCEPT_BY_ID, MISTAKE_LABELS } from '../content/concepts.js';

const MODE_NAMES = { mixed: 'Mixed practice', review: 'Review of missed concepts', lecture: 'Lecture practice', concept: 'Focused practice' };

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function practiceView(ctx, action, arg) {
  const { store } = ctx;
  if (action === 'new') {
    const [mode, extra] = (arg || 'mixed').split(':');
    const hashParts = location.hash.split('/');
    const opts = { mode, timed: !!store.data.settings.timer };
    if (mode === 'lecture') opts.lecture = Number(hashParts[4] || extra || 8);
    if (mode === 'concept') {
      opts.concept = decodeURIComponent(hashParts[4] || extra);
      opts.size = 4;
    }
    if (mode === 'review') opts.size = 6;
    const s = buildSession(store, opts);
    store.setSession(s);
    history.replaceState(null, '', '#/practice/resume');
    return runner(ctx);
  }
  const s = store.data.session;
  if (action === 'resume' && s && !s.finished) return runner(ctx);
  return chooser(ctx);
}

function chooser(ctx) {
  const { store } = ctx;
  const s = store.data.session;
  const lecSel = h('select', { 'aria-label': 'lecture' }, LECTURES.map((L) => h('option', { value: L.n }, `${String(L.n).padStart(2, '0')} ${L.title}`)));
  const timer = h('input', { type: 'checkbox', checked: !!store.data.settings.timer, onchange: (e) => store.setSetting('timer', e.target.checked) });
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('h1', {}, 'Practice')),
    s && !s.finished && s.items.some((x) => x.status === 'pending')
      ? h('div', { class: 'next-card', style: { marginBottom: '14px' } }, h('p', {}, `You have an unfinished ${MODE_NAMES[s.mode].toLowerCase()} session (${s.items.filter((x) => x.status !== 'pending').length} of ${s.items.length} tasks done).`), h('button', { class: 'btn primary', onclick: () => ctx.go('#/practice/resume') }, 'Resume'), h('button', { class: 'btn ghost', onclick: () => { store.clearSession(); ctx.go('#/practice'); } }, 'Discard it'))
      : null,
    h(
      'div',
      { class: 'grid-2' },
      h('section', { class: 'panel' }, h('h2', {}, 'Mixed practice'), h('p', {}, 'Eight short tasks (about 5–10 minutes) mixing everything you have started, with weak and due topics first. One task at a time.'), h('button', { class: 'btn primary', onclick: () => ctx.go('#/practice/new/mixed') }, 'Start mixed practice')),
      h('section', { class: 'panel' }, h('h2', {}, 'Review missed concepts'), h('p', {}, 'Six tasks on the topics you recently got wrong or that are due for review.'), h('button', { class: 'btn', onclick: () => ctx.go('#/practice/new/review') }, 'Start review')),
      h('section', { class: 'panel' }, h('h2', {}, 'One lecture'), h('p', {}, 'Eight tasks from a single lecture module.'), h('div', { class: 'row' }, lecSel, h('button', { class: 'btn', onclick: () => ctx.go(`#/practice/new/lecture/${lecSel.value}`) }, 'Start'))),
      h('section', { class: 'panel' }, h('h2', {}, 'Timing'), h('label', { class: 'inline' }, timer, `Show a ${store.data.settings.timerMinutes}-minute timer during sessions (optional; it never stops you)`)),
    ),
  );
}

function runner(ctx) {
  const { store } = ctx;
  const s = store.data.session;
  const root = h('div');
  const head = h('div', { class: 'page-head' });
  const progress = h('div', { class: 'bar', style: { margin: '6px 0 14px' }, role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': s.items.length });
  const body = h('div');
  root.append(head, progress, body);
  let timerEl = null;
  let tick = null;
  let lastTick = Date.now();
  if (s.timed) {
    timerEl = h('span', { class: 'timer', 'aria-live': 'off' });
    tick = setInterval(() => {
      const now = Date.now();
      s.elapsedMs += now - lastTick;
      lastTick = now;
      const limit = store.data.settings.timerMinutes * 60000;
      timerEl.textContent = `⏱ ${fmt(s.elapsedMs)} / ${fmt(limit)}${s.elapsedMs > limit ? ' — time is up; finish this task when ready' : ''}`;
      if (Math.floor(s.elapsedMs / 1000) % 10 === 0) store.setSession(s);
    }, 1000);
  }
  ctx.setCleanup(() => {
    if (tick) clearInterval(tick);
    store.setSession(s);
  });

  function current() {
    return s.items.findIndex((x) => x.status === 'pending');
  }

  function show() {
    const i = current();
    clear(head);
    const done = s.items.filter((x) => x.status !== 'pending').length;
    clear(progress).append(h('span', { style: { width: `${(done / s.items.length) * 100}%` } }));
    progress.setAttribute('aria-valuenow', done);
    if (i < 0) return summary();
    s.index = i;
    const it = s.items[i];
    const title = s.mode === 'concept' ? `${MODE_NAMES.concept}: ${CONCEPT_BY_ID[s.concept]?.name}` : s.mode === 'lecture' ? `${MODE_NAMES.lecture}: Lecture ${String(s.lecture).padStart(2, '0')}` : MODE_NAMES[s.mode];
    head.append(h('h1', {}, title), h('div', { class: 'row' }, h('span', { class: 'muted' }, `Task ${i + 1} of ${s.items.length}${it.followUp ? ' · similar exercise to apply a correction' : ''}`), timerEl, h('button', { class: 'btn small ghost', onclick: () => { store.setSession(s); ctx.go('#/'); } }, 'Pause and leave')));
    const ex = generateExercise(it.templateId, it.seed, { guidance: it.guidance, params: it.params || {} });
    const el = renderExercise(ex, {
      onResult: (r) => {
        it.status = r.revealed ? 'revealed' : r.correct ? 'correct' : 'wrong';
        it.hints = r.hints;
        it.tag = r.tag;
        it.independent = r.correct && !r.hints && !r.revealed && it.guidance !== 'full';
        store.recordAttempt({ templateId: it.templateId, seed: it.seed, concept: ex.concept, type: ex.type, lecture: ex.lecture, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: it.guidance, tag: r.tag, message: r.message });
        if (!r.correct && !it.followUp && !it.followUpQueued) {
          it.followUpQueued = true;
          s.items.splice(Math.min(s.items.length, i + 3), 0, followUpItem(it));
        }
        store.setSession(s);
      },
      onSimilar: () => {
        // move the queued follow-up (or a new one) to right after this task
        const k = s.items.findIndex((x, j) => j > i && x.followUp && x.templateId === it.templateId && x.status === 'pending');
        const f = k >= 0 ? s.items.splice(k, 1)[0] : followUpItem(it);
        if (it.status === 'pending') it.status = 'skipped';
        s.items.splice(i + 1, 0, f);
        store.setSession(s);
        show();
      },
      onNext: () => {
        if (it.status === 'pending') it.status = 'skipped';
        store.setSession(s);
        show();
      },
      nextLabel: i === s.items.length - 1 ? 'Finish' : 'Next task',
    });
    clear(body).append(el);
  }

  function summary() {
    s.finished = true;
    store.setSession(s);
    if (tick) clearInterval(tick);
    const counted = s.items.filter((x) => x.status !== 'skipped');
    const ok = counted.filter((x) => x.status === 'correct').length;
    const ind = counted.filter((x) => x.independent).length;
    const wrong = counted.filter((x) => x.status === 'wrong');
    const weak = [...new Set(wrong.map((x) => x.concept))];
    clear(head).append(h('h1', {}, 'Session complete'));
    clear(body).append(
      h(
        'section',
        { class: 'panel' },
        h('p', { class: 'prose' }, `You answered ${ok} of ${counted.length} tasks correctly on the first check${ind ? `, ${ind} of them without hints` : ''}${s.timed ? ` in ${fmt(s.elapsedMs)}` : ''}.`),
        wrong.length ? h('div', {}, h('h3', {}, 'Worth another look'), h('ul', {}, weak.map((c) => h('li', {}, h('a', { href: `#/practice/new/concept/${c}` }, CONCEPT_BY_ID[c]?.name || c), ' — ', wrong.filter((x) => x.concept === c).map((x) => MISTAKE_LABELS[x.tag] || TYPE_LABELS[x.type] || '').filter(Boolean).join(', '))))) : h('p', {}, 'No mistakes this time.'),
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: () => { store.clearSession(); ctx.go('#/practice/new/mixed'); } }, 'Another mixed session'), wrong.length ? h('button', { class: 'btn', onclick: () => { store.clearSession(); ctx.go('#/practice/new/review'); } }, 'Review these now') : null, h('button', { class: 'btn ghost', onclick: () => { store.clearSession(); ctx.go('#/'); } }, 'Back to the dashboard')),
      ),
    );
  }

  show();
  return root;
}
