import { h, clear, md, refPill } from '../ui/dom.js';
import { LESSON_BY_LECTURE } from '../content/lessons.js';
import { LECTURES } from '../content/concepts.js';
import { renderVisual } from '../ui/render/visual.js';
import { createWorkspace } from '../ui/workspace.js';
import { buildTrace } from '../sim/specs.js';
import { renderExercise } from '../ui/exercise.js';
import { generateExercise } from '../exercises/registry.js';
import { randomSeed } from '../core/rng.js';
import { formulasDemo, treeReprDemo } from './demos.js';
import { treeBuilder, graphEditor } from './explore.js';

const TYPE_NAMES = { read: 'Read', note: 'Note', code: 'Code', sim: 'Worked example', codesim: 'Run the code', exercise: 'Your turn', demo: 'Interactive', pseudo: 'Write pseudocode' };

export function lessonView(ctx, n, at) {
  const { store } = ctx;
  const lesson = LESSON_BY_LECTURE[n];
  const L = LECTURES.find((x) => x.n === n);
  if (!lesson) return h('p', {}, 'No such lecture.');
  const rec = store.lesson(lesson.id);
  let idx = at != null && !Number.isNaN(at) ? Math.max(0, Math.min(at, lesson.sections.length - 1)) : rec.at || 0;
  const root = h('div');
  const outline = h('ol', { class: 'history', style: { maxHeight: 'none' }, 'aria-label': 'Lesson outline' });
  const progBar = h('span');
  const progTxt = h('span');
  const body = h('div', { style: { minWidth: 0 } });
  let cleanupWs = [];
  ctx.setCleanup(() => cleanupWs.forEach((f) => f()));

  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, `Lecture ${String(n).padStart(2, '0')}`), h('h1', {}, lesson.title), h('div', { class: 'subtitle' }, `Source: ${L.file} (${L.pages} pages)`)), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => ctx.go(`#/practice/new/lecture/${n}`) }, 'Practise this lecture'))),
    h('div', { class: 'lesson-progress' }, h('div', { class: 'bar' }, progBar), progTxt),
    h('div', { class: 'lesson-grid' }, h('details', { class: 'panel outline', open: window.innerWidth >= 1240 }, h('summary', {}, `Lesson outline · ${lesson.sections.length} steps`), outline), body),
  );

  function done(i) {
    store.markLessonStep(lesson.id, i, lesson.sections.length);
    const s = lesson.sections[i];
    const concepts = [...(s.concepts || [])];
    if (s.type === 'exercise') {
      const ex = generateExercise(s.templateId, 1, { guidance: s.guidance, params: s.params || {} });
      concepts.push(ex.concept);
    }
    if (concepts.length) store.introduce(concepts);
    drawOutline();
  }

  function drawOutline() {
    const r = store.lesson(lesson.id);
    const pct = Math.round((r.done.length / lesson.sections.length) * 100);
    progBar.style.width = pct + '%';
    progTxt.textContent = `${r.done.length} of ${lesson.sections.length} steps done`;
    clear(outline).append(
      lesson.sections.map((s, i) =>
        h(
          'li',
          { class: [i === idx ? 'cur' : '', r.done.includes(i) ? 'done' : ''], onclick: () => go(i), 'aria-current': i === idx ? 'step' : null },
          h('span', { class: 'step-dot', 'aria-hidden': 'true' }, r.done.includes(i) ? '✓' : String(i + 1)),
          h('span', { class: 'k' }, TYPE_NAMES[s.type]),
          h('span', {}, s.title),
          h('span', { class: 'sr-only' }, r.done.includes(i) ? '(done)' : ''),
        ),
      ),
    );
    outline.querySelector('li.cur')?.scrollIntoView({ block: 'nearest' });
  }

  function go(i) {
    idx = i;
    history.replaceState(null, '', `#/lesson/${n}/${i}`);
    draw();
    body.querySelector('h2')?.focus();
  }

  function draw() {
    cleanupWs.forEach((f) => f());
    cleanupWs = [];
    drawOutline();
    const s = lesson.sections[idx];
    const card = h('section', { class: 'section-card' });
    card.append(
      h('div', { class: 'section-head' }, h('span', { class: 'step' }, `Step ${idx + 1} of ${lesson.sections.length}`), h('span', { class: 'pill type' }, TYPE_NAMES[s.type] || s.type), refPill(s.ref), s.variant === 'supplementary' ? h('span', { class: 'pill supp' }, 'Supplementary') : null, h('h2', { tabindex: '-1' }, s.title)),
    );
    const nav = h(
      'div',
      { class: 'section-nav' },
      h('button', { class: 'btn', disabled: idx === 0, onclick: () => go(idx - 1) }, '← Previous'),
      h('span', { class: 'spacer' }),
    );
    const nextBtn = h('button', { class: 'btn primary', onclick: () => { done(idx); if (idx < lesson.sections.length - 1) go(idx + 1); else finish(); } }, idx < lesson.sections.length - 1 ? 'Continue →' : 'Finish lesson');
    switch (s.type) {
      case 'read':
        card.append(md(s.body));
        if (s.visual) card.append(renderVisual(s.visual));
        break;
      case 'note':
        card.append(h('div', { class: `callout ${s.variant}` }, h('span', { class: 'tag' }, s.variant === 'correction' ? 'Correction / clarification' : s.variant === 'terms' ? 'Terminology' : 'Supplementary'), md(s.body)));
        break;
      case 'code':
        if (s.body) card.append(md(s.body));
        card.append(codeTabs(s));
        break;
      case 'sim': {
        if (s.body) card.append(md(s.body));
        const tr = buildTrace(s);
        let finished = false;
        const ws = createWorkspace(tr, {
          predictKinds: s.predict,
          predictOn: store.data.settings.predictMode,
          settings: store.data.settings,
          onEnd: () => {
            if (!finished) {
              finished = true;
              done(idx);
            }
          },
        });
        cleanupWs.push(() => ws.destroy());
        card.append(h('p', { class: 'small muted' }, s.predict ? 'The simulation will pause before key steps and ask you to predict them. ' : '', 'Keys: ', h('kbd', {}, '→'), ' step, ', h('kbd', {}, '←'), ' back, ', h('kbd', {}, 'Space'), ' play/pause.'), ws.el);
        break;
      }
      case 'codesim': {
        if (s.body) card.append(md(s.body));
        const host = h('div');
        const tabs = h('div', { class: 'tabs', role: 'tablist' });
        s.variants.forEach((v, k) => {
          const b = h('button', { role: 'tab', 'aria-selected': k === 0 ? 'true' : 'false', onclick: () => pick(k) }, v.label);
          tabs.append(b);
        });
        const pick = (k) => {
          tabs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', j === k ? 'true' : 'false'));
          const v = s.variants[k];
          const ws = createWorkspace(buildTrace({ struct: 'code', lines: v.lines, setup: v.setup, newValue: v.newValue, title: `${v.label} version`, ref: s.ref }), { settings: store.data.settings });
          cleanupWs.push(() => ws.destroy());
          clear(host).append(ws.el);
        };
        card.append(tabs, host);
        pick(0);
        break;
      }
      case 'exercise': {
        if (s.body) card.append(md(s.body));
        const host = h('div');
        const make = (seed) => {
          const ex = generateExercise(s.templateId, seed, { guidance: s.guidance, params: s.params || {} });
          clear(host).append(
            renderExercise(ex, {
              onResult: (r) => {
                store.recordAttempt({ templateId: ex.templateId, seed, concept: ex.concept, type: ex.type, lecture: ex.lecture, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: s.guidance, tag: r.tag, message: r.message });
                done(idx);
              },
              onSimilar: () => make(randomSeed()),
              onNext: () => (idx < lesson.sections.length - 1 ? go(idx + 1) : finish()),
              nextLabel: 'Continue the lesson',
            }),
          );
        };
        make(n * 1000 + idx * 17 + (store.lesson(lesson.id).done.includes(idx) ? randomSeed() : 0));
        card.append(host, h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn small ghost', onclick: () => make(randomSeed()) }, 'New variation')));
        break;
      }
      case 'demo':
        if (s.body) card.append(md(s.body));
        if (s.kind === 'formulas') card.append(formulasDemo());
        else if (s.kind === 'treeRepr') card.append(treeReprDemo());
        else if (s.kind === 'treeBuilder') {
          const tb = treeBuilder(store, { traverse: s.traverse });
          cleanupWs.push(tb.destroy);
          card.append(tb.el);
        } else if (s.kind === 'graphEditor') {
          const ge = graphEditor(store);
          cleanupWs.push(ge.destroy);
          card.append(ge.el);
        }
        break;
      case 'pseudo': {
        const ta = h('textarea', { 'aria-label': 'your pseudocode', rows: 9, placeholder: 'Write your pseudocode here…' });
        const model = h('div');
        card.append(
          h('p', { class: 'prose' }, s.prompt),
          h('p', { class: 'small muted' }, 'Ungraded: the app does not check free-text pseudocode. Write yours first, then compare it line by line with the model.'),
          ta,
          h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn', onclick: () => { clear(model).append(h('h3', { style: { marginTop: '10px' } }, 'Model pseudocode'), h('pre', { class: 'code' }, s.model), h('p', { class: 'small' }, 'Check: does yours handle the empty list? Does it avoid losing access? Does it free removed nodes?')); done(idx); } }, 'Compare with the model')),
          model,
        );
        break;
      }
      default:
        card.append(h('p', {}, 'Unknown section.'));
    }
    nav.append(nextBtn);
    card.append(nav);
    clear(body).append(card);
  }

  function finish() {
    store.markLessonStep(lesson.id, lesson.sections.length - 1, lesson.sections.length);
    drawOutline();
    clear(body).append(
      h(
        'section',
        { class: 'section-card finish-card' },
        h('div', { class: 'badge', 'aria-hidden': 'true' }, '✓'),
        h('h2', {}, `Lecture ${String(n).padStart(2, '0')} lesson complete`),
        h('p', { class: 'prose' }, 'These topics will now come back in mixed practice, with fresh values and less guidance. Mastery needs several independent correct answers across different exercise types.'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => ctx.go(`#/practice/new/lecture/${n}`) }, `Practise Lecture ${String(n).padStart(2, '0')}`), n < 14 ? h('button', { class: 'btn', onclick: () => ctx.go(`#/lesson/${n + 1}/0`) }, `Next: Lecture ${String(n + 1).padStart(2, '0')}`) : null, h('button', { class: 'btn ghost', onclick: () => go(0) }, 'Restart this lesson')),
      ),
    );
  }

  draw();
  return root;
}

function codeTabs(s) {
  const wrap = h('div');
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const pane = h('div', { role: 'tabpanel' });
  const variants = [
    ['C (as in the notes)', s.c],
    ['C++', s.cpp],
    ['Pseudocode', s.pseudo],
  ].filter(([, t]) => t);
  variants.forEach(([label, text], k) => {
    tabs.append(
      h(
        'button',
        {
          role: 'tab',
          'aria-selected': k === 0 ? 'true' : 'false',
          onclick: (e) => {
            tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
            e.target.setAttribute('aria-selected', 'true');
            clear(pane).append(h('pre', { class: 'code' }, text));
          },
        },
        label,
      ),
    );
  });
  pane.append(h('pre', { class: 'code' }, variants[0][1]));
  wrap.append(tabs, pane);
  return wrap;
}
