// The synchronized workspace: diagram, highlighted code, variables,
// explanation and history — all driven by ONE Player over a trace.
import { h, clear, steadyLabel } from './dom.js';
import { Player } from '../core/trace.js';
import { renderState } from './render/visual.js';
import { wantsPrediction, makeQuestion } from '../sim/predict.js';
import { fmtPtr, GARBAGE } from '../core/pointerWorld.js';
import { langTabs, traceLangs, traceLines, pickLang, onCodeLang } from './langs.js';
import { steadyPanel } from './steady.js';

const SPEEDS = [0.5, 1, 2, 4];
const RECENT_ROWS = 6; // history rows shown until "Show all" is pressed

/**
 * createWorkspace(trace, { predictKinds, predictOn, settings, onPredict(correct), title, onEnd })
 * Returns { el, player, setTrace(trace), destroy() }.
 */
export function createWorkspace(trace, opts = {}) {
  const el = h('section', { class: 'ws-wrap', 'aria-label': 'Simulation workspace', tabindex: '-1' });
  const grid = h('div', { class: 'ws' });
  const diag = h('div', { class: 'ws-diagram diagram-box' });
  const controls = h('div', { class: 'ws-controls panel controls' });
  const codeP = h('div', { class: 'panel code-panel' });
  const varsP = h('div', { class: 'panel' });
  const explainP = h('div', { class: 'panel ws-explain', 'aria-live': 'polite' });
  const histP = h('div', { class: 'panel' });
  grid.append(diag, controls, h('div', { class: 'ws-side' }, explainP, codeP, varsP), h('div', { class: 'ws-bottom' }, histP));
  el.append(grid);

  let predictOn = opts.predictKinds ? opts.predictOn !== false : false;
  const answered = new Set();
  let pending = null; // {idx, q, picked}
  let allHistory = false;

  const player = new Player(trace, () => draw());
  // one language tab row for the whole run; every panel follows the app-wide choice
  const langs = traceLangs(trace.code);
  const tabs = langs.length > 1 ? langTabs(langs) : null;
  const born = Date.now();
  const offLang = onCodeLang(() => {
    if (!el.isConnected && Date.now() - born > 1000) return offLang();
    draw();
    steady.code.remeasure();
  });
  player.speed = opts.settings?.speed || 1;
  player.gate = (step, idx) => predictOn && !answered.has(idx) && wantsPrediction(player.trace, idx, opts.predictKinds) && (pending = { idx, q: makeQuestion(player.trace, idx), picked: null }) && true;

  // ---- controls
  const bReset = h('button', { class: 'btn', onclick: () => { pending = null; player.reset(); }, title: 'Reset (Home)' }, '↺ Reset');
  const bBack = h('button', { class: 'btn', onclick: () => { pending = null; player.back(); }, title: 'Step back (←)' }, '◀ Back');
  const bPlay = h('button', { class: 'btn', onclick: () => player.toggle(), title: 'Play / pause (Space)' });
  const playLabel = steadyLabel(bPlay, ['▶ Play', '❚❚ Pause']);
  const bFwd = h('button', { class: 'btn primary', onclick: () => tryForward(), title: 'Step forward (→)' }, 'Step ▶');
  const speedSel = h('select', { 'aria-label': 'Playback speed', onchange: (e) => (player.speed = Number(e.target.value)) }, SPEEDS.map((x) => h('option', { value: x, selected: x === player.speed }, `${x}×`)));
  const stepNum = h('span', { class: 'stepnum', 'aria-live': 'off' });
  const predBtn = opts.predictKinds
    ? h('button', { class: 'btn small', 'aria-pressed': String(predictOn), onclick: () => { predictOn = !predictOn; predBtn.setAttribute('aria-pressed', String(predictOn)); if (!predictOn) pending = null; draw(); measureExplain(); } }, 'Ask me to predict')
    : null;
  controls.append(bReset, h('span', { class: 'divider' }), bBack, bPlay, bFwd, h('span', { class: 'divider' }), h('label', { class: 'inline small' }, 'Speed', speedSel), stepNum, h('span', { class: 'spacer' }), predBtn);

  function tryForward() {
    if (pending) return; // must answer first
    const moved = player.forward();
    if (!moved) draw();
  }

  el.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tryForward();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pending = null;
      player.back();
    } else if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      player.toggle();
    } else if (e.key === 'Home') {
      e.preventDefault();
      player.reset();
    }
  });

  // ---- what each panel shows at step i (used to draw it, and to measure it so it never resizes)
  function diagramContent(i) {
    const st = player.trace.steps[i];
    return [renderState(st.state, st.hl, { head: opts.head }), st.state.type === 'graph' ? frontierStrip(st.state) : null, st.state.type === 'tree' && (st.state.stack || st.state.callStack) ? treeStrip(st.state) : null];
  }
  function codeContent(i, measuring = false) {
    const tr = player.trace;
    const st = tr.steps[i];
    const code = st.code || tr.code;
    const lang = pickLang(traceLangs(code));
    const cur = (x) => x.lead && x.src === st.line;
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, code.title || 'Code'), code.ref ? h('span', { class: 'pill' }, code.ref) : null),
      measuring && tabs ? tabs.cloneNode(true) : tabs,
      st.opLabel ? h('div', { class: 'small muted' }, `Operation: ${st.opLabel}`) : null,
      h('ol', { 'aria-label': `code (${lang === 'c' ? 'C, as in the notes' : lang === 'py' ? 'Python' : lang === 'cpp' ? 'C++' : 'pseudocode'})` }, traceLines(code, lang).map((x) => h('li', { class: cur(x) ? (st.kind === 'error' ? 'cur err' : 'cur') : '', 'aria-current': cur(x) ? 'step' : null }, codeLine(x.text)))),
    ];
  }
  function varsContent(i) {
    const steps = player.trace.steps;
    return [h('div', { class: 'panel-title' }, h('h3', {}, 'Variables and pointers')), varsView(steps[i].state, steps[i - 1] && steps[i - 1].state)];
  }
  function explainContent(i) {
    const tr = player.trace;
    const st = tr.steps[i];
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, i === 0 ? 'Start' : `What just happened (${st.kind})`)),
      h('div', { class: `explain${st.kind === 'error' ? ' error' : ''}` }, st.explain),
      i === tr.steps.length - 1 && tr.output && tr.output.length ? h('p', { class: 'small' }, h('b', {}, 'Output: '), tr.output.join(' ')) : null,
    ];
  }
  // the latest steps only (no scroll box inside the page); "Show all" lists every step
  function historyContent(i, all = allHistory) {
    const tr = player.trace;
    const first = all ? 0 : Math.max(0, i + 1 - RECENT_ROWS);
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, 'Operation history')),
      i + 1 > RECENT_ROWS
        ? h('div', { class: 'history-more small muted' }, first > 0 ? `… ${first} earlier step${first === 1 ? '' : 's'}` : `All ${i + 1} steps`, h('button', { class: 'btn ghost small', 'aria-pressed': String(all), onclick: () => { allHistory = !allHistory; draw(); } }, all ? 'Show recent only' : 'Show all'))
        : null,
      h(
        'ol',
        { class: 'history log' },
        tr.steps.slice(first, i + 1).map((s2, j) => {
          const k = first + j;
          return h('li', { class: [k === i ? 'cur' : '', s2.kind === 'error' ? 'bad' : ''].join(' '), title: s2.explain, onclick: () => { pending = null; player.goto(k); } }, h('span', { class: 'k' }, s2.kind), s2.explain);
        }),
      ),
    ];
  }

  // ---- panels keep the largest size any step of this run needs
  const steady = { diagram: steadyPanel(diag), code: steadyPanel(codeP), vars: steadyPanel(varsP), explain: steadyPanel(explainP), history: steadyPanel(histP) };
  function measureAll() {
    const tr = player.trace;
    const n = tr.steps.length;
    steady.diagram.measure(n, diagramContent);
    steady.code.measure(n, (i) => codeContent(i, true));
    steady.vars.measure(n, varsContent);
    measureExplain();
    steady.history.measure(n, (i) => historyContent(i, false));
  }
  // the explanation panel also has to fit every prediction question (answered, with its feedback)
  function measureExplain() {
    const tr = player.trace;
    const n = tr.steps.length;
    steady.explain.measure(n * 2, (k) => {
      if (k < n) return explainContent(k);
      const idx = k - n;
      if (!predictOn || idx === 0 || !wantsPrediction(tr, idx, opts.predictKinds)) return null;
      const q = makeQuestion(tr, idx);
      return predictBox({ idx, q, picked: q.options.find((o) => o !== q.answer) ?? q.answer });
    });
  }

  function draw() {
    const tr = player.trace;
    const i = player.index;
    clear(diag).append(...diagramContent(i).filter(Boolean));
    clear(codeP).append(...codeContent(i).filter(Boolean));
    clear(varsP).append(...varsContent(i));
    explainP.classList.toggle('predicting', !!(pending && pending.q));
    clear(explainP).append(...(pending && pending.q ? predictBox(pending) : explainContent(i).filter(Boolean)));
    clear(histP).append(...historyContent(i).filter(Boolean));
    stepNum.textContent = `Step ${i} / ${tr.steps.length - 1}`;
    stepNum.style.minWidth = `${`Step ${tr.steps.length - 1} / ${tr.steps.length - 1}`.length}ch`;
    bBack.disabled = player.atStart;
    bFwd.disabled = player.atEnd || !!pending;
    playLabel(player.playing ? '❚❚ Pause' : '▶ Play');
    if (player.atEnd && opts.onEnd) opts.onEnd();
  }

  // a prediction question takes the explanation panel's place (the panel turns blue)
  function predictBox(p) {
    const skip = () => {
      answered.add(p.idx);
      pending = null;
      player.forward();
    };
    const choices = h(
      'div',
      { class: 'row predict-options' },
      p.q.options.map((o) =>
        h(
          'button',
          {
            class: 'btn',
            disabled: p.picked != null,
            'aria-pressed': p.picked === o ? 'true' : null,
            onclick: () => {
              p.picked = o;
              if (opts.onPredict) opts.onPredict(o === p.q.answer);
              draw();
            },
          },
          o,
        ),
      ),
      p.picked == null ? h('button', { class: 'btn ghost small', onclick: skip }, 'Skip') : null,
    );
    const ok = p.picked === p.q.answer;
    return [
      h('div', { class: 'panel-title' }, h('h3', {}, 'Predict before you look')),
      h('p', { class: 'predict-q' }, p.q.q.replace(/`/g, '')),
      choices,
      p.picked != null
        ? h('div', { class: `feedback ${ok ? 'ok' : 'bad'} predict-feedback` }, h('div', {}, h('b', { class: 'verdict' }, ok ? 'Correct.' : `Not quite — it will be ${p.q.answer}.`), ' ', p.q.explain), h('button', { class: 'btn primary', onclick: skip }, 'Show the step'))
        : null,
    ].filter(Boolean);
  }

  draw();
  // measured once the workspace is in the page (it needs the real widths)
  requestAnimationFrame(() => (el.isConnected ? measureAll() : setTimeout(() => el.isConnected && measureAll(), 50)));
  return {
    el,
    player,
    setTrace(t) {
      answered.clear();
      pending = null;
      player.setTrace(t);
      measureAll();
    },
    destroy() {
      player.pause();
      offLang();
      Object.values(steady).forEach((x) => x.destroy());
    },
  };
}

// One line of code that wraps instead of scrolling sideways: the indentation is kept,
// and continuation rows hang two characters further in so they read as one statement.
function codeLine(text) {
  const rest = text.trimStart();
  const indent = text.length - rest.length;
  return h('span', { class: 'cl', style: { paddingLeft: `${indent + 2}ch`, textIndent: '-2ch' } }, rest);
}

function chips(list, empty = 'none') {
  return list && list.length ? h('span', { class: 'frontier' }, list.map((x) => h('span', { class: 'cell' }, String(x)))) : h('span', { class: 'muted small' }, empty);
}

function frontierStrip(st) {
  return h(
    'div',
    { style: { padding: '8px 12px', borderTop: '1px solid var(--rule)', background: 'var(--panel)' } },
    h('div', { class: 'frontier' }, h('span', { class: 'lbl' }, st.kind === 'bfs' ? 'Queue (front → rear)' : 'Stack (bottom → top)'), chips(st.frontier, 'empty')),
  );
}

function treeStrip(st) {
  const items = st.stack || st.callStack;
  return h(
    'div',
    { style: { padding: '8px 12px', borderTop: '1px solid var(--rule)', background: 'var(--panel)' } },
    h('div', { class: 'frontier' }, h('span', { class: 'lbl' }, st.stack ? 'Stack (bottom → top)' : 'Call stack (bottom → top)'), chips(items, 'empty')),
    h('div', { class: 'frontier', style: { marginTop: '4px' } }, h('span', { class: 'lbl' }, 'Output'), chips(st.output, 'nothing yet')),
  );
}

function varsView(st, prev) {
  const rows = [];
  const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  if (st.nodes && st.vars) {
    for (const v of st.varOrder) {
      if (!(v in st.vars)) continue;
      const val = st.vars[v];
      const node = typeof val === 'number' ? st.nodes[val] : null;
      const was = prev && prev.vars ? prev.vars[v] : undefined;
      rows.push(
        h(
          'tr',
          { class: prev && changed(was, val) ? 'changed' : '' },
          h('td', {}, v, (st.globals || []).includes(v) ? '' : h('span', { class: 'muted small' }, ' (local)')),
          h('td', {}, h('span', { class: 'addr' }, val === null ? 'NULL' : val === GARBAGE ? '? garbage' : String(val)), node ? h('span', { class: 'val' }, node.freed ? '  → freed block!' : `  → node with data ${node.data}`) : null),
        ),
      );
    }
    for (const [k, v] of Object.entries(st.locals || {})) rows.push(h('tr', { class: prev && prev.locals && prev.locals[k] !== v ? 'changed' : '' }, h('td', {}, k), h('td', {}, String(v))));
    const frames = st.callStack || [];
    const t = h('table', { class: 'vars-table' }, rows);
    const wrap = h('div', {}, t);
    if (frames.length) wrap.append(h('p', { class: 'small', style: { margin: '8px 0 2px' } }, h('b', {}, 'Call stack (top first)')), h('table', { class: 'vars-table' }, [...frames].reverse().map((f, k) => h('tr', {}, h('td', {}, `#${frames.length - 1 - k} ${f.fn}`), h('td', {}, `start = ${fmtPtr(f.arg)}${f.ret != null ? `  returns ${f.ret}` : ''}`)))));
    wrap.append(h('p', { class: 'small muted', style: { margin: '6px 0 0' } }, 'Pointer values are ADDRESSES; the data they lead to is shown after →.'));
    return wrap;
  }
  if (st.type === 'graph') {
    return h(
      'table',
      { class: 'vars-table' },
      h('tr', {}, h('td', {}, 'neighbour order'), h('td', {}, st.order === 'alpha' ? 'ascending' : 'insertion')),
      h('tr', {}, h('td', {}, 'current'), h('td', {}, st.current ?? '—')),
      h('tr', {}, h('td', {}, 'discovered'), h('td', {}, chips(st.discovered))),
      h('tr', {}, h('td', {}, st.kind === 'bfs' ? 'queue' : 'stack'), h('td', {}, chips(st.frontier, 'empty'))),
      h('tr', {}, h('td', {}, 'processed'), h('td', {}, chips(st.processed))),
      h('tr', {}, h('td', {}, 'output'), h('td', {}, chips(st.output))),
      st.components && st.components.length > 1 ? h('tr', {}, h('td', {}, 'components'), h('td', {}, st.components.map((c) => '{' + c.join(',') + '}').join(' '))) : null,
    );
  }
  if (st.type === 'tree') {
    return h(
      'table',
      { class: 'vars-table' },
      st.callStack ? h('tr', {}, h('td', {}, 'call stack'), h('td', {}, chips(st.callStack, 'empty'))) : null,
      st.stack ? h('tr', {}, h('td', {}, 'stack'), h('td', {}, chips(st.stack, 'empty'))) : null,
      'cur' in st ? h('tr', {}, h('td', {}, 'cur'), h('td', {}, st.cur ?? 'NULL')) : null,
      st.entered ? h('tr', {}, h('td', {}, 'entered'), h('td', {}, chips(st.entered))) : null,
      h('tr', {}, h('td', {}, 'output'), h('td', {}, chips(st.output))),
    );
  }
  if (st.type === 'astack') {
    return h('table', { class: 'vars-table' }, h('tr', { class: prev && prev.top !== st.top ? 'changed' : '' }, h('td', {}, 'top'), h('td', {}, String(st.top))), h('tr', {}, h('td', {}, 'MAX'), h('td', {}, String(st.MAX))), h('tr', {}, h('td', {}, 'meaning of top'), h('td', {}, st.conv === 'notes' ? 'next free index = number of items' : 'index of the top item')));
  }
  if (st.type === 'aqueue') {
    return h('table', { class: 'vars-table' }, h('tr', { class: prev && prev.F !== st.F ? 'changed' : '' }, h('td', {}, 'F'), h('td', {}, `${st.F} (front item)`)), h('tr', { class: prev && prev.R !== st.R ? 'changed' : '' }, h('td', {}, 'R'), h('td', {}, `${st.R} (next free slot)`)), h('tr', {}, h('td', {}, 'items'), h('td', {}, String(st.mode === 'linear' ? st.R - st.F : st.count))), h('tr', {}, h('td', {}, 'MAX'), h('td', {}, String(st.MAX))));
  }
  return h('div');
}
