// "Build it in code" walkthrough: one program shown in C++, Python or
// pseudocode, executed step by step. The pseudocode is what runs (the
// Pseudocode Lab interpreter); the C++ and Python lines carrying the same label
// are highlighted, so each statement is tied to the change it makes in the
// diagram, the variables and the output — in every language.
import { h, clear, md, steadyLabel } from './dom.js';
import { steadyPanel } from './steady.js';
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
// a trailing comment (after 2+ spaces) wraps as one unit instead of splitting at the comment sign
const TRAILING = { cpp: /^(.*?\S)\s{2,}(\/\/.*)$/, py: /^(.*?\S)\s{2,}(#.*)$/, pseudo: /^(.*?\S)\s{2,}(#.*)$/ };
function codeWithComment(text, lang) {
  const m = TRAILING[lang] && TRAILING[lang].exec(text);
  if (!m) return text || ' ';
  return [m[1], ' ', h('span', { class: 'cmt' }, m[2])];
}
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
  let showSetup = false;
  let ended = false;

  const caseTabs = (ex.cases || []).length > 1 ? h('div', { class: 'tabs walk-cases', role: 'tablist', 'aria-label': 'Starting situation' }) : null;
  const bReset = h('button', { class: 'btn', title: 'Reset (Home)', onclick: () => { pause(); exe.reset(); draw(); } }, '↺ Reset');
  const bBack = h('button', { class: 'btn', title: 'Step back (←)', onclick: () => { pause(); exe.back(); draw(); } }, '◀ Back');
  const bPlay = h('button', { class: 'btn', title: 'Play / pause (Space)', onclick: () => (timer ? pause() : play()) });
  const playLabel = steadyLabel(bPlay, ['▶ Play', '❚❚ Pause']);
  const bStep = h('button', { class: 'btn primary', title: 'Step forward (→)', onclick: () => { pause(); forward(); } }, 'Step ▶');
  const bEnd = h('button', { class: 'btn', onclick: () => { pause(); exe.runToEnd(); draw(); } }, 'Run to end');
  const speedSel = h('select', { 'aria-label': 'Playback speed', onchange: (e) => { speed = e.target.value; if (timer) { pause(); play(); } } }, SPEEDS.map(([k, l]) => h('option', { value: k, selected: k === speed }, l)));
  const counter = h('span', { class: 'stepnum', 'aria-live': 'off' });
  const controls = h('div', { class: 'panel controls ws-controls', role: 'toolbar', 'aria-label': 'Step controls' }, bReset, h('span', { class: 'divider' }), bBack, bPlay, bStep, bEnd, h('span', { class: 'divider' }), h('label', { class: 'inline small' }, 'Speed', speedSel), counter);

  const tabs = langTabs(LANGS);
  const codeTitle = h('h3', {});
  const codeOl = h('ol');
  const codeP = h('div', { class: 'panel code-panel walk-code' }, h('div', { class: 'panel-title' }, codeTitle, ex.ref ? h('span', { class: 'pill' }, ex.ref) : null), tabs, codeOl);
  const explainP = h('div', { class: 'panel ws-explain walk-explain', 'aria-live': 'polite' });
  const diagram = h('div', { class: 'diagram-box walk-diagram' });
  const varsP = h('div', { class: 'panel walk-vars' });
  const outP = h('div', { class: 'panel walk-out' });
  const histP = h('div', { class: 'panel' });
  const labBtn = opts.onOpenLab ? h('button', { class: 'btn small', onclick: () => opts.onOpenLab(prog.pseudo.text, prog.setup) }, 'Open this pseudocode in the Lab') : null;

  el.append(
    ex.intro && opts.intro !== false ? md(ex.intro, 'walk-intro') : null,
    caseTabs,
    controls,
    h('div', { class: 'walk-grid' }, diagram, explainP, varsP, outP, codeP),
    histP,
    labBtn ? h('div', { class: 'row', style: { marginTop: '8px' } }, labBtn, h('span', { class: 'small muted' }, 'Experiment with it: change values, break it on purpose, see what the Lab reports.')) : null,
  );

  function load(i) {
    pause();
    caseIdx = i;
    prog = compileExample(ex, i);
    exe = new Execution(prog.pseudo.text, prog.setup, { limit: 20000 });
    // the programs are short: run them to the end once so every step is known, then rewind
    exe.runToEnd();
    exe.reset();
    ended = false;
    if (caseTabs) {
      clear(caseTabs).append(
        ex.cases.map((c, k) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === i), onclick: () => load(k) }, c.label)),
      );
    }
    counter.style.minWidth = `min(${`Step ${exe.steps.length - 1} of ${exe.steps.length - 1}`.length}ch, 100%)`;
    draw();
    measureAll();
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
    playLabel('❚❚ Pause');
    forward();
  }
  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
    playLabel('▶ Play');
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

  // ---- what each panel shows at step i (used to draw it, and to measure it so it never resizes)
  function explainContent(i, lang) {
    const step = exe.steps[i];
    const { at } = stepLabels(step);
    // what the interpreter did + why, in the chosen language
    const note = at.map((l) => ex.notes && ex.notes[l]).find(Boolean);
    const issues = step.issues ? step.issues.filter((x) => x.severity !== 'note') : [];
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, step.kind === 'start' ? 'Start' : step.kind === 'end' ? 'Finished' : `What just happened · ${KIND_LABEL[step.kind] || step.kind}`)),
      h('div', { class: `explain${step.kind === 'error' ? ' error' : ''}` }, relabel(step.text, lang)),
      note ? md(note, 'small walk-note') : null,
      issues.length ? h('div', { class: 'feedback bad small' }, issues.map((x) => x.message).join(' ')) : null,
    ];
  }
  // (programs on the 'arrays' structure get their array cells as the diagram)
  function diagramContent(i) {
    return renderLabDiagram(exe.steps[i].state, exe.graph, exe.steps[i].hl);
  }
  function varsContent(i) {
    const prev = exe.steps[i - 1];
    return [h('div', { class: 'panel-title' }, h('h3', {}, 'Variables')), renderVariables(exe.steps[i].state, prev && prev.state, { lines: false })];
  }
  function outContent(i) {
    const st = exe.steps[i].state;
    const colls = ex.structure === 'arrays' ? null : renderCollections(st);
    const out = st.output;
    return [
      colls ? h('div', { class: 'panel-title' }, h('h3', {}, 'Collections')) : null,
      colls,
      h('div', { class: 'panel-title', style: colls ? { marginTop: '10px' } : null }, h('h3', {}, 'Output')),
      out.length ? h('pre', { class: 'lab-output' }, out.join('\n')) : h('p', { class: 'small muted', style: { margin: 0 } }, 'Nothing printed yet.'),
    ];
  }
  // history: the latest steps only, with "Show all"
  function historyContent(i, lang, all = allHistory) {
    const first = all ? 0 : Math.max(0, i + 1 - RECENT);
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, 'Execution history')),
      i + 1 > RECENT ? h('div', { class: 'history-more small muted' }, first > 0 ? `… ${first} earlier step${first === 1 ? '' : 's'}` : `All ${i + 1} steps`, h('button', { class: 'btn ghost small', 'aria-pressed': String(all), onclick: () => { allHistory = !allHistory; draw(); } }, all ? 'Show recent only' : 'Show all')) : null,
      h(
        'ol',
        { class: 'history log' },
        exe.steps.slice(first, i + 1).map((s2, j) => {
          const k = first + j;
          const t = relabel(s2.text, lang);
          return h('li', { class: [k === i ? 'cur' : '', s2.kind === 'error' ? 'bad' : ''].join(' '), title: t, onclick: () => { pause(); exe.goto(k); draw(); } }, h('span', { class: 'k' }, KIND_LABEL[s2.kind] || s2.kind), t);
        }),
      ),
    ];
  }

  // ---- every panel keeps the largest size any step of this run needs, so nothing below it moves
  const steady = { explain: steadyPanel(explainP), diagram: steadyPanel(diagram), vars: steadyPanel(varsP), out: steadyPanel(outP), history: steadyPanel(histP) };
  function measureAll() {
    if (!el.isConnected) return;
    const lang = pickLang(LANGS);
    const n = exe.steps.length;
    steady.explain.measure(n, (i) => explainContent(i, lang));
    steady.diagram.measure(n, diagramContent);
    steady.vars.measure(n, varsContent);
    steady.out.measure(n, outContent);
    steady.history.measure(n, (i) => historyContent(i, lang, false));
  }

  function draw() {
    const lang = pickLang(LANGS);
    const step = exe.current;
    const { at, site } = stepLabels(step);
    const target = prog[lang];
    const curLines = new Set(linesWithLabels(target, at));
    const siteLines = new Set(linesWithLabels(target, site));
    codeTitle.textContent = `${ex.title} — ${LANG_LABEL[lang]}`;
    // setup helpers (build / clean-up) are folded to one line unless opened
    const isSetup = (i) => target.labels[i].includes('setup');
    const folded = (i) => !showSetup && isSetup(i) && (i > 0 && isSetup(i - 1));
    clear(codeOl).append(
      target.lines.map((text, i) => {
        if (folded(i)) return null;
        if (!showSetup && isSetup(i) && i + 1 < target.lines.length && isSetup(i + 1) && !curLines.has(i)) {
          let n = 1;
          while (i + n < target.lines.length && isSetup(i + n)) n++;
          return h('li', { class: 'fold', 'data-ln': i + 1 }, h('span', { class: 'cl' }, `${text.trim().replace(/\s*\{$/, '').replace(/:$/, '')} … `, h('button', { class: 'linkish', onclick: () => { showSetup = true; draw(); } }, `show ${n} setup lines`)));
        }
        const cls = curLines.has(i) ? (step.kind === 'error' ? 'cur err' : 'cur') : siteLines.has(i) ? 'site' : isSetup(i) ? 'setup' : '';
        return h('li', { class: cls, 'data-ln': i + 1, 'aria-current': curLines.has(i) ? 'step' : null, title: cls === 'setup' ? 'Setup: builds the starting structure the diagram shows at step 0 (the Lab does this before the program starts).' : null }, h('span', { class: 'cl', style: { paddingLeft: `${text.length - text.trimStart().length + 2}ch`, textIndent: '-2ch' } }, codeWithComment(text.trimStart(), lang)));
      }),
    );
    clear(explainP).append(...explainContent(exe.index, lang).filter(Boolean));
    clear(diagram).append(diagramContent(exe.index));
    clear(varsP).append(...varsContent(exe.index));
    clear(outP).append(...outContent(exe.index).filter(Boolean));
    clear(histP).append(...historyContent(exe.index, lang).filter(Boolean));
    const i = exe.index;
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
  const off = onCodeLang(() => {
    if (!el.isConnected && Date.now() - born > 1000) return off();
    draw();
    measureAll();
  });
  load(0);
  // the first measurement needs the walkthrough to be in the page
  requestAnimationFrame(() => (el.isConnected ? measureAll() : setTimeout(measureAll, 50)));
  return {
    el,
    destroy() {
      pause();
      off();
      Object.values(steady).forEach((x) => x.destroy());
    },
  };
}
