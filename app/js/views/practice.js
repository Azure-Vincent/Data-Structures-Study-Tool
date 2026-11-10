import { h, clear } from '../ui/dom.js';
import { generateExercise, TYPE_LABELS } from '../exercises/registry.js';
import { buildSession, followUpItem } from '../progress/scheduler.js';
import { renderExercise } from '../ui/exercise.js';
import { MODULES, MODULE_BY_ID, CONCEPT_BY_ID, MISTAKE_LABELS } from '../content/concepts.js';
import { icon } from '../ui/icons.js';

export const MODE_NAMES = { mixed: 'Mixed Practice', review: 'Targeted Review', module: 'Module Practice', concept: 'Focused Practice', assessment: 'Knowledge Assessment' };

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The heading of a running session. */
export function sessionTitle(s) {
  if (s.mode === 'concept') return `${MODE_NAMES.concept}: ${CONCEPT_BY_ID[s.concept]?.name || s.concept}`;
  if (s.mode === 'module') return `${MODE_NAMES.module}: ${MODULE_BY_ID[s.module]?.title || ''}`;
  if (s.mode === 'assessment') return `${MODE_NAMES.assessment}: ${s.module ? MODULE_BY_ID[s.module]?.title : 'All Modules'}`;
  return MODE_NAMES[s.mode] || 'Practice Exercises';
}

export function practiceView(ctx, action, arg) {
  const { store } = ctx;
  if (action === 'new') {
    const [mode, extra] = (arg || 'mixed').split(':');
    const hashParts = location.hash.split('/');
    const opts = { mode, timed: !!store.data.settings.timer };
    if (mode === 'module') opts.module = MODULE_BY_ID[hashParts[4] || extra] ? hashParts[4] || extra : 'sll';
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
  const modSel = h('select', { 'aria-label': 'Learning module' }, MODULES.map((M) => h('option', { value: M.id }, `${M.n}. ${M.title}`)));
  const timer = h('input', { type: 'checkbox', checked: !!store.data.settings.timer, onchange: (e) => store.setSetting('timer', e.target.checked) });
  return h(
    'div',
    {},
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Practice Exercises'), h('div', { class: 'subtitle' }, 'Short sessions of exercises, one at a time, with new values in every session.'))),
    s && !s.finished && s.items.some((x) => x.status === 'pending')
      ? h('div', { class: 'next-card', style: { marginBottom: '18px' } }, h('div', { class: 'next-text' }, h('div', { class: 'eyebrow' }, 'Unfinished session'), h('p', {}, `An unfinished ${MODE_NAMES[s.mode] || 'practice'} session: ${s.items.filter((x) => x.status !== 'pending').length} of ${s.items.length} exercises completed.`)), h('button', { class: 'btn primary', onclick: () => ctx.go(s.mode === 'assessment' ? '#/assessment/resume' : '#/practice/resume') }, 'Resume'), h('button', { class: 'btn ghost', onclick: () => { store.clearSession(); ctx.go('#/practice'); } }, 'Discard it'))
      : null,
    h(
      'div',
      { class: 'mode-cards' },
      h('section', { class: 'panel mode-card featured' }, icon('shuffle'), h('h2', {}, 'Mixed Practice'), h('p', {}, 'Eight exercises (about 5–10 minutes) from every module you have started; concepts that need review come first.'), h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => ctx.go('#/practice/new/mixed') }, 'Start mixed practice'))),
      h('section', { class: 'panel mode-card' }, icon('target'), h('h2', {}, 'Targeted Review'), h('p', {}, 'Six exercises on concepts answered incorrectly recently or due for review.'), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => ctx.go('#/practice/new/review') }, 'Start review'))),
      h('section', { class: 'panel mode-card' }, icon('book'), h('h2', {}, 'Module Practice'), h('p', {}, 'Eight exercises from a single learning module.'), h('div', { class: 'row' }, modSel, h('button', { class: 'btn', onclick: () => ctx.go(`#/practice/new/module/${modSel.value}`) }, 'Start'))),
    ),
    h('section', { class: 'panel', style: { marginTop: '16px' } }, h('div', { class: 'setting-row' }, h('span', { class: 'lbl' }, `Show a ${store.data.settings.timerMinutes}-minute timer during sessions`, h('small', {}, 'Optional; it never stops you.')), h('label', { class: 'inline' }, timer, 'Timer on'))),
  );
}

export function runner(ctx) {
  const { store } = ctx;
  const s = store.data.session;
  const root = h('div');
  const head = h('div', { class: 'page-head' });
  const progress = h('div', { class: 'session-dots', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': s.items.length });
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
    clear(progress).append(s.items.map((x, k) => h('span', { class: x.status !== 'pending' ? x.status : k === current() ? 'cur' : '', title: `Exercise ${k + 1}: ${x.status}` })));
    progress.setAttribute('aria-valuemax', s.items.length);
    progress.setAttribute('aria-valuenow', done);
    if (i < 0) return summary();
    s.index = i;
    const it = s.items[i];
    const title = sessionTitle(s);
    head.append(h('h1', {}, title), h('div', { class: 'row' }, h('span', { class: 'muted small' }, `Exercise ${i + 1} of ${s.items.length}${it.followUp ? ' · a similar exercise to apply the correction' : ''}`), timerEl, h('button', { class: 'btn small ghost', onclick: () => { store.setSession(s); ctx.go('#/'); } }, 'Pause session')));
    progress.setAttribute('aria-valuetext', `Exercise ${i + 1} of ${s.items.length}`);
    const ex = generateExercise(it.templateId, it.seed, { guidance: it.guidance, params: it.params || {} });
    const el = renderExercise(ex, {
      onResult: (r) => {
        it.status = r.revealed ? 'revealed' : r.correct ? 'correct' : 'wrong';
        it.hints = r.hints;
        it.tag = r.tag;
        it.independent = r.correct && !r.hints && !r.revealed && it.guidance !== 'full';
        store.recordAttempt({ templateId: it.templateId, seed: it.seed, concept: ex.concept, type: ex.type, module: ex.module, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: it.guidance, tag: r.tag, message: r.message });
        if (ex.kind === 'lab' && r.correct && !r.revealed) store.markLabSolved(ex.labId);
        if (!r.correct && !it.followUp && !it.followUpQueued && s.mode !== 'assessment') {
          it.followUpQueued = true;
          s.items.splice(Math.min(s.items.length, i + 3), 0, followUpItem(it));
        }
        store.setSession(s);
      },
      onOpenLab: (id, code) => {
        store.setLabDraft(`ex:${id}`, code);
        store.setSession(s);
        ctx.go(`#/lab/${id}`);
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
      nextLabel: i === s.items.length - 1 ? 'Finish' : 'Next exercise',
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
    if (s.mode === 'assessment') store.recordAssessment(s.module || 'all', { correct: ok, total: counted.length, independent: ind });
    clear(head).append(h('h1', {}, s.mode === 'assessment' ? 'Assessment complete' : 'Session complete'));
    clear(body).append(
      h(
        'section',
        { class: 'section-card' },
        h('div', { class: 'row', style: { gap: '16px', marginBottom: '12px' } }, h('span', { class: 'score' }, `${ok}/${counted.length}`), h('span', { class: 'muted' }, 'correct on the first attempt')),
        h('p', { class: 'prose' }, `${ok} of ${counted.length} exercises were answered correctly on the first attempt${ind ? ` (${ind} without hints)` : ''}${s.timed ? `; time: ${fmt(s.elapsedMs)}` : ''}.`),
        wrong.length ? h('div', {}, h('h3', {}, 'Concepts to review'), h('ul', {}, weak.map((c) => h('li', {}, h('a', { href: `#/practice/new/concept/${c}` }, CONCEPT_BY_ID[c]?.name || c), ' — ', wrong.filter((x) => x.concept === c).map((x) => MISTAKE_LABELS[x.tag] || TYPE_LABELS[x.type] || '').filter(Boolean).join(', '))))) : h('p', {}, 'All exercises were answered correctly.'),
        h('div', { class: 'row', style: { marginTop: '10px' } }, s.mode === 'assessment' ? h('button', { class: 'btn primary', onclick: () => { store.clearSession(); ctx.go('#/assessment'); } }, 'Back to Knowledge Assessment') : h('button', { class: 'btn primary', onclick: () => { store.clearSession(); ctx.go('#/practice/new/mixed'); } }, 'Start another mixed session'), wrong.length ? h('button', { class: 'btn', onclick: () => { store.clearSession(); ctx.go('#/practice/new/review'); } }, 'Review these concepts') : null, h('button', { class: 'btn ghost', onclick: () => { store.clearSession(); ctx.go('#/'); } }, 'Return to the Learning Dashboard')),
      ),
    );
  }

  show();
  return root;
}
