// The synchronized workspace: diagram, highlighted code, variables,
// explanation, history and counters — all driven by ONE Player over a trace.
import { h, clear } from './dom.js';
import { Player, COUNTER_LABELS } from '../core/trace.js';
import { renderState } from './render/visual.js';
import { wantsPrediction, makeQuestion } from '../sim/predict.js';
import { fmtPtr, GARBAGE } from '../core/pointerWorld.js';

const SPEEDS = [0.5, 1, 2, 4];

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
  const cntP = h('div', { class: 'panel' });
  grid.append(diag, controls, h('div', { class: 'ws-side' }, explainP, codeP, varsP), h('div', { class: 'ws-bottom' }, histP, cntP));
  el.append(grid);

  let predictOn = opts.predictKinds ? opts.predictOn !== false : false;
  const answered = new Set();
  let pending = null; // {idx, q, picked}

  const player = new Player(trace, () => draw());
  player.speed = opts.settings?.speed || 1;
  player.gate = (step, idx) => predictOn && !answered.has(idx) && wantsPrediction(player.trace, idx, opts.predictKinds) && (pending = { idx, q: makeQuestion(player.trace, idx), picked: null }) && true;

  // ---- controls
  const bReset = h('button', { class: 'btn', onclick: () => { pending = null; player.reset(); }, title: 'Reset (Home)' }, '↺ Reset');
  const bBack = h('button', { class: 'btn', onclick: () => { pending = null; player.back(); }, title: 'Step back (←)' }, '◀ Back');
  const bPlay = h('button', { class: 'btn', onclick: () => player.toggle(), title: 'Play / pause (Space)' }, '▶ Play');
  const bFwd = h('button', { class: 'btn primary', onclick: () => tryForward(), title: 'Step forward (→)' }, 'Step ▶');
  const speedSel = h('select', { 'aria-label': 'Playback speed', onchange: (e) => (player.speed = Number(e.target.value)) }, SPEEDS.map((x) => h('option', { value: x, selected: x === player.speed }, `${x}×`)));
  const stepNum = h('span', { class: 'stepnum', 'aria-live': 'off' });
  const predBtn = opts.predictKinds
    ? h('button', { class: 'btn small', 'aria-pressed': String(predictOn), onclick: () => { predictOn = !predictOn; predBtn.setAttribute('aria-pressed', String(predictOn)); if (!predictOn) pending = null; draw(); } }, 'Ask me to predict')
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

  function draw() {
    const tr = player.trace;
    const i = player.index;
    const st = tr.steps[i];
    const prev = tr.steps[i - 1];
    // diagram
    clear(diag).append(renderState(st.state, st.hl, { head: opts.head }));
    if (st.state.type === 'graph') diag.append(frontierStrip(st.state));
    if (st.state.type === 'tree' && (st.state.stack || st.state.callStack)) diag.append(treeStrip(st.state));
    // code
    const code = st.code || tr.code;
    clear(codeP).append(
      h('div', { class: 'panel-title' }, h('h3', {}, code.title || 'Code'), code.ref ? h('span', { class: 'pill' }, code.ref) : null),
      st.opLabel ? h('div', { class: 'small muted' }, `Operation: ${st.opLabel}`) : null,
      h('ol', { 'aria-label': 'code' }, code.lines.map((l, k) => h('li', { class: k === st.line ? (st.kind === 'error' ? 'cur err' : 'cur') : '', 'aria-current': k === st.line ? 'step' : null }, l))),
    );
    // variables
    clear(varsP).append(h('div', { class: 'panel-title' }, h('h3', {}, 'Variables and pointers')), varsView(st.state, prev && prev.state));
    // explanation / prediction
    clear(explainP);
    if (pending && pending.q) {
      explainP.append(predictBox());
    } else {
      explainP.append(
        h('div', { class: 'panel-title' }, h('h3', {}, i === 0 ? 'Start' : `What just happened (${st.kind})`)),
        h('div', { class: `explain${st.kind === 'error' ? ' error' : ''}` }, st.explain),
        st.predict ? null : null,
      );
      if (player.atEnd && tr.output && tr.output.length) explainP.append(h('p', { class: 'small' }, h('b', {}, 'Output: '), tr.output.join(' ')));
    }
    // history
    clear(histP).append(
      h('div', { class: 'panel-title' }, h('h3', {}, 'Operation history')),
      h(
        'ol',
        { class: 'history' },
        tr.steps.slice(0, i + 1).map((s2, k) => h('li', { class: [k === i ? 'cur' : '', s2.kind === 'error' ? 'bad' : ''].join(' '), onclick: () => { pending = null; player.goto(k); } }, h('span', { class: 'k' }, s2.kind), s2.explain.length > 110 ? s2.explain.slice(0, 108) + '…' : s2.explain)),
      ),
    );
    const hl = histP.querySelector('li.cur');
    if (hl) hl.scrollIntoView({ block: 'nearest' });
    // counters
    const cnt = st.counters || {};
    clear(cntP).append(
      h('div', { class: 'panel-title' }, h('h3', {}, 'Operation counts so far')),
      Object.keys(cnt).length ? h('div', { class: 'counters' }, Object.entries(cnt).map(([k, v]) => [h('span', {}, COUNTER_LABELS[k] || k), h('b', {}, String(v))])) : h('p', { class: 'small muted' }, 'Nothing counted yet.'),
      h('p', { class: 'small muted' }, 'Counting model: each listed action costs 1 unit.'),
    );
    stepNum.textContent = `Step ${i} / ${tr.steps.length - 1}`;
    bBack.disabled = player.atStart;
    bFwd.disabled = player.atEnd || !!pending;
    bPlay.textContent = player.playing ? '❚❚ Pause' : '▶ Play';
    if (player.atEnd && opts.onEnd) opts.onEnd();
  }

  function predictBox() {
    const p = pending;
    const box = h('div', { class: 'predict-box' });
    box.append(h('h3', {}, 'Predict before you look'), h('p', {}, p.q.q.replace(/`/g, '')));
    const opts2 = h('div', { class: 'row' });
    for (const o of p.q.options) {
      opts2.append(
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
      );
    }
    box.append(opts2);
    if (p.picked != null) {
      const ok = p.picked === p.q.answer;
      box.append(
        h('div', { class: `feedback ${ok ? 'ok' : 'bad'}` }, h('b', { class: 'verdict' }, ok ? 'Correct.' : `Not quite — it will be ${p.q.answer}.`), p.q.explain),
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn primary', onclick: () => { answered.add(p.idx); pending = null; player.forward(); } }, 'Show the step')),
      );
    } else {
      box.append(h('button', { class: 'btn ghost small', onclick: () => { answered.add(p.idx); pending = null; player.forward(); } }, 'Skip this prediction'));
    }
    return box;
  }

  draw();
  return {
    el,
    player,
    setTrace(t) {
      answered.clear();
      pending = null;
      player.setTrace(t);
    },
    destroy() {
      player.pause();
    },
  };
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
