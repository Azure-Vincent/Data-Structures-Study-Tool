// "Build it in code" walkthrough: one program shown in C++, Python or
// pseudocode, executed step by step. The pseudocode is what runs (the
// Pseudocode Lab interpreter); the C++ and Python lines carrying the same label
// are highlighted, so each statement is tied to the change it makes in the
// diagram, the variables and the output — in every language.
import { h, clear, md } from './dom.js';
import { Execution } from '../lab/run.js';
import { renderLabDiagram, renderVariables, renderCollections } from './render/labState.js';
import { compileExample, linesWithLabels } from '../content/impl/format.js';
import { langTabs, pickLang, onCodeLang, LANG_LABEL } from './langs.js';

const LANGS = ['cpp', 'py', 'pseudo'];
const SPEEDS = [
  ['slow', 'Slow', 1400],
  ['normal', 'Normal', 800],
  ['fast', 'Fast', 350],
];
const RECENT = 6;
const KIND_LABEL = { start: 'Start', alloc: 'New node', link: 'Pointer change', move: 'Pointer moves', data: 'Value change', assign: 'Assign', free: 'Delete', cond: 'Check', call: 'Call', return: 'Return', print: 'Output', op: 'Collection', error: 'Error', end: 'Finished' };

/**
 * createWalkthrough(example, { onEnd, onOpenLab(code, setup) })
 * Returns { el, destroy }.
 */
export function createWalkthrough(ex, opts = {}) {
  const el = h('section', { class: 'walk', 'aria-label': `Walkthrough: ${ex.title}`, tabindex: '-1' });
  let caseIdx = 0;
  let prog = null;
  let exe = null;
  let timer = null;
  let speed = 'normal';
  let allHistory = false;
  let ended = false;

  const caseTabs = (ex.cases || []).length > 1 ? h('div', { class: 'tabs walk-cases', role: 'tablist', 'aria-label': 'Starting situation' }) : null;
  const bReset = h('button', { class: 'btn', title: 'Reset (Home)', onclick: () => { pause(); exe.reset(); draw(); } }, '↺ Reset');
  const bBack = h('button', { class: 'btn', title: 'Step back (←)', onclick: () => { pause(); exe.back(); draw(); } }, '◀ Back');
  const bPlay = h('button', { class: 'btn', title: 'Play / pause (Space)', onclick: () => (timer ? pause() : play()) }, '▶ Play');
  const bStep = h('button', { class: 'btn primary', title: 'Step forward (→)', onclick: () => { pause(); forward(); } }, 'Step ▶');
  const bEnd = h('button', { class: 'btn', onclick: () => { pause(); exe.runToEnd(); draw(); } }, 'Run to end');
  const speedSel = h('select', { 'aria-label': 'Playback speed', onchange: (e) => { speed = e.target.value; if (timer) { pause(); play(); } } }, SPEEDS.map(([k, l]) => h('option', { value: k, selected: k === speed }, l)));
  const counter = h('span', { class: 'stepnum', 'aria-live': 'off' });
  const controls = h('div', { class: 'panel controls ws-controls', role: 'toolbar', 'aria-label': 'Step controls' }, bReset, h('span', { class: 'divider' }), bBack, bPlay, bStep, bEnd, h('span', { class: 'divider' }), h('label', { class: 'inline small' }, 'Speed', speedSel), counter);

  const tabs = langTabs(LANGS);
  const codeTitle = h('h3', {});
  const codeOl = h('ol');
  const codeP = h('div', { class: 'panel code-panel walk-code' }, h('div', { class: 'panel-title' }, codeTitle, ex.ref ? h('span', { class: 'pill' }, ex.ref) : null), tabs, codeOl);
  const explainP = h('div', { class: 'panel ws-explain', 'aria-live': 'polite' });
  const diagram = h('div', { class: 'diagram-box walk-diagram' });
  const varsP = h('div', { class: 'panel' });
  const outP = h('div', { class: 'panel' });
  const histP = h('div', { class: 'panel' });
  const labBtn = opts.onOpenLab ? h('button', { class: 'btn small', onclick: () => opts.onOpenLab(prog.pseudo.text, prog.setup) }, 'Open this pseudocode in the Lab') : null;

  el.append(
    caseTabs,
    controls,
    h('div', { class: 'walk-grid' }, diagram, codeP, h('div', { class: 'walk-side' }, explainP, varsP, outP)),
    histP,
    labBtn ? h('div', { class: 'row', style: { marginTop: '8px' } }, labBtn, h('span', { class: 'small muted' }, 'Experiment with it: change values, break it on purpose, see what the Lab reports.')) : null,
  );

  function load(i) {
    pause();
    caseIdx = i;
    prog = compileExample(ex, i);
    exe = new Execution(prog.pseudo.text, prog.setup, { limit: 20000 });
    ended = false;
    if (caseTabs) {
      clear(caseTabs).append(
        ex.cases.map((c, k) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === i), onclick: () => load(k) }, c.label)),
      );
    }
    draw();
  }

  function forward() {
    exe.forward();
    draw();
  }
  function play() {
    if (exe.atEnd) exe.reset();
    const ms = SPEEDS.find((s) => s[0] === speed)[2];
    timer = setInterval(() => {
      if (exe.atEnd) return pause();
      forward();
    }, ms);
    bPlay.textContent = '❚❚ Pause';
    forward();
  }
  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
    bPlay.textContent = '▶ Play';
  }

  // the pseudocode labels of the current step: the statement, and the call site of a call/return
  function stepLabels(step) {
    const at = step.line ? prog.pseudo.labels[step.line - 1] || [] : [];
    const site = step.change && (step.change.type === 'call' ? step.change.from : step.change.type === 'frame-pop' ? step.change.to : null);
    return { at, site: site ? prog.pseudo.labels[site - 1] || [] : [] };
  }
  // "line 7" in the interpreter's messages means pseudocode line 7: show the matching line in the chosen language
  function relabel(text, lang) {
    if (lang === 'pseudo') return text;
    return String(text).replace(/\bline (\d+)\b/g, (m, n) => {
      const ls = prog.pseudo.labels[Number(n) - 1] || [];
      const hit = linesWithLabels(prog[lang], ls)[0];
      return hit == null ? m : `line ${hit + 1}`;
    });
  }

  function draw() {
    const lang = pickLang(LANGS);
    const step = exe.current;
    const prev = exe.steps[exe.index - 1];
    const { at, site } = stepLabels(step);
    const target = prog[lang];
    const curLines = new Set(linesWithLabels(target, at));
    const siteLines = new Set(linesWithLabels(target, site));
    codeTitle.textContent = `${ex.title} — ${LANG_LABEL[lang]}`;
    clear(codeOl).append(
      target.lines.map((text, i) => {
        const cls = curLines.has(i) ? (step.kind === 'error' ? 'cur err' : 'cur') : siteLines.has(i) ? 'site' : target.labels[i].includes('setup') ? 'setup' : '';
        return h('li', { class: cls, 'aria-current': curLines.has(i) ? 'step' : null, title: cls === 'setup' ? 'Setup: builds the starting structure the diagram shows at step 0 (the Lab does this before the program starts).' : null }, h('span', { class: 'cl', style: { paddingLeft: `${text.length - text.trimStart().length + 2}ch`, textIndent: '-2ch' } }, text.trimStart() || ' '));
      }),
    );
    // explanation: what the interpreter did + why, in the chosen language
    const note = at.map((l) => ex.notes && ex.notes[l]).find(Boolean);
    clear(explainP).append(
      h('div', { class: 'panel-title' }, h('h3', {}, step.kind === 'start' ? 'Start' : step.kind === 'end' ? 'Finished' : `What just happened · ${KIND_LABEL[step.kind] || step.kind}`)),
      h('div', { class: `explain${step.kind === 'error' ? ' error' : ''}` }, relabel(step.text, lang)),
      note ? md(note, 'small walk-note') : null,
      step.kind === 'start' && ex.intro ? md(ex.intro, 'small walk-note') : null,
      step.issues && step.issues.filter((x) => x.severity !== 'note').length ? h('div', { class: 'feedback bad small' }, step.issues.filter((x) => x.severity !== 'note').map((x) => x.message).join(' ')) : null,
    );
    // (programs on the 'arrays' structure get their array cells as the diagram)
    clear(diagram).append(renderLabDiagram(step.state, exe.graph, step.hl));
    clear(varsP).append(h('div', { class: 'panel-title' }, h('h3', {}, 'Variables')), renderVariables(step.state, prev && prev.state, { lines: false }));
    const colls = ex.structure === 'arrays' ? null : renderCollections(step.state);
    const out = step.state.output;
    clear(outP).append(colls ? [h('div', { class: 'panel-title' }, h('h3', {}, 'Collections')), colls] : null, h('div', { class: 'panel-title', style: colls ? { marginTop: '10px' } : null }, h('h3', {}, 'Output')), out.length ? h('pre', { class: 'lab-output' }, out.join('\n')) : h('p', { class: 'small muted', style: { margin: 0 } }, 'Nothing printed yet.'));
    // history: the latest steps only, with "Show all"
    const i = exe.index;
    const first = allHistory ? 0 : Math.max(0, i + 1 - RECENT);
    clear(histP).append(
      h('div', { class: 'panel-title' }, h('h3', {}, 'Execution history')),
      i + 1 > RECENT ? h('div', { class: 'history-more small muted' }, first > 0 ? `… ${first} earlier step${first === 1 ? '' : 's'}` : `All ${i + 1} steps`, h('button', { class: 'btn ghost small', 'aria-pressed': String(allHistory), onclick: () => { allHistory = !allHistory; draw(); } }, allHistory ? 'Show recent only' : 'Show all')) : null,
      h(
        'ol',
        { class: 'history' },
        exe.steps.slice(first, i + 1).map((s2, j) => {
          const k = first + j;
          const t = relabel(s2.text, lang);
          return h('li', { class: [k === i ? 'cur' : '', s2.kind === 'error' ? 'bad' : ''].join(' '), onclick: () => { pause(); exe.goto(k); draw(); } }, h('span', { class: 'k' }, KIND_LABEL[s2.kind] || s2.kind), t.length > 110 ? t.slice(0, 108) + '…' : t);
        }),
      ),
    );
    counter.textContent = `Step ${i} of ${exe.steps.length - 1}${exe.done ? '' : '+'}`;
    bBack.disabled = exe.atStart;
    bStep.disabled = exe.atEnd;
    bEnd.disabled = exe.atEnd;
    if (exe.atEnd && !ended) {
      ended = true;
      if (opts.onEnd) opts.onEnd();
    }
  }

  el.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      pause();
      forward();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pause();
      exe.back();
      draw();
    } else if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      timer ? pause() : play();
    } else if (e.key === 'Home') {
      e.preventDefault();
      pause();
      exe.reset();
      draw();
    }
  });

  const born = Date.now();
  const off = onCodeLang(() => (!el.isConnected && Date.now() - born > 1000 ? off() : draw()));
  load(0);
  return {
    el,
    destroy() {
      pause();
      off();
    },
  };
}
