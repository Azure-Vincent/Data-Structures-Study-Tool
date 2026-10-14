// Pseudocode Lab: write pseudocode, run it step by step on a simulated heap and
// watch the structure change. Guided exercises are graded on test cases; free
// mode lets you pick or build any starting structure.
import { h, clear, md, pill } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { createCodeEditor } from '../ui/codeEditor.js';
import { renderLabDiagram, renderVariables, renderCollections } from '../ui/render/labState.js';
import { Execution, DEFAULT_LIMIT, LIMITS } from '../lab/run.js';
import { checkExercise } from '../lab/check.js';
import { EXERCISES, EXERCISE_BY_ID, EXAMPLES, FREE_DEFAULTS } from '../lab/exercises.js';
import { STRUCTURES, STRUCTURE_ORDER, GRAPH_EXAMPLES, parseValues, describeSetup } from '../lab/structures.js';
import { REFERENCE, UNSUPPORTED, LIMITS_TEXT } from '../lab/reference.js';
import { highlightLine, reindent } from '../lab/lang.js';

const SPEEDS = [
  ['slow', 'Slow', 1300],
  ['normal', 'Normal', 650],
  ['fast', 'Fast', 260],
  ['turbo', 'Very fast', 60],
];
const KIND_LABEL = { start: 'Start', alloc: 'New node', link: 'Pointer change', move: 'Pointer moves', data: 'Value change', assign: 'Assign', free: 'Delete', cond: 'Check', call: 'Call', return: 'Return', print: 'Output', op: 'Collection', error: 'Error', end: 'Finished', stopped: 'Stopped' };
const SEVERITY = {
  syntax: ['bad', 'Syntax error'],
  runtime: ['bad', 'Runtime error'],
  warning: ['warn', 'Logic warning'],
  note: ['note', 'Note'],
};

/** A read-only highlighted code block. */
export function codeBlock(text) {
  const pre = h('pre', { class: 'code lab-code-block' });
  for (const line of String(text).replace(/\n$/, '').split('\n')) {
    const row = h('span', { class: 'ce-line' });
    for (const s of highlightLine(line)) row.append(s.cls ? h('span', { class: s.cls }, s.text) : s.text);
    if (!line) row.append(' ');
    pre.append(row);
  }
  return pre;
}

function referencePanel(onTry) {
  return h(
    'section',
    { class: 'panel lab-ref', 'aria-label': 'Syntax reference' },
    h('div', { class: 'panel-title' }, h('h3', {}, 'Syntax reference')),
    h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Statements go one per line. Blocks open with then/do at the end of a line and close with end. Keywords are not case-sensitive; variable names are.'),
    REFERENCE.map((sec) => h('details', { class: 'lab-ref-sec', open: sec.title === 'Nodes and pointers' }, h('summary', {}, sec.title), h('table', { class: 'lab-ref-table' }, sec.rows.map(([ex, text]) => h('tr', {}, h('td', {}, codeBlock(ex)), h('td', {}, text)))))),
    h('details', { class: 'lab-ref-sec' }, h('summary', {}, 'Safety and limits'), h('ul', { class: 'small' }, LIMITS_TEXT.map((t) => h('li', {}, t)))),
    h('details', { class: 'lab-ref-sec' }, h('summary', {}, 'Not supported'), h('ul', { class: 'small' }, UNSUPPORTED.map((t) => h('li', {}, t)))),
    h(
      'details',
      { class: 'lab-ref-sec' },
      h('summary', {}, 'Runnable examples'),
      h('p', { class: 'small muted' }, 'Opens the example in free mode on a matching structure.'),
      h(
        'div',
        { class: 'lab-ref-examples' },
        STRUCTURE_ORDER.map((sid) => h('div', {}, h('b', { class: 'small' }, STRUCTURES[sid].label), h('ul', { class: 'small' }, EXAMPLES[sid].map((x, i) => h('li', {}, h('button', { class: 'linkish', onclick: () => onTry(sid, i) }, x.title)))))),
      ),
    ),
  );
}

export function labView(ctx, a, b) {
  const { store } = ctx;
  const lab = store.labData();
  // ---------------------------------------------------------------- route
  let mode;
  let ex = null;
  let structure;
  if (a === 'free') {
    mode = 'free';
    structure = STRUCTURES[b] ? b : 'sll';
  } else if (a && EXERCISE_BY_ID[a]) {
    mode = 'guided';
    ex = EXERCISE_BY_ID[a];
    structure = ex.structure;
  } else {
    const last = lab.last && /^#\/lab\/(free\/\w+|[\w-]+)$/.test(lab.last) ? lab.last : `#/lab/${EXERCISES[0].id}`;
    const m = /^#\/lab\/(.+)$/.exec(last)[1].split('/');
    history.replaceState(null, '', last);
    return labView(ctx, m[0], m[1]);
  }
  if (mode === 'guided') lab.lastExercise = ex.id;
  else lab.lastFree = structure;
  store.setLabLast(location.hash);
  const S = STRUCTURES[structure];
  const draftKey = mode === 'guided' ? `ex:${ex.id}` : `free:${structure}`;
  const freeVals = () => (lab.freeValues && lab.freeValues[structure]) || null;

  let testIdx = 0;
  let setup = mode === 'guided' ? { structure, ...ex.tests[0].setup } : freeSetup();
  let code = store.labDraft(draftKey) ?? (mode === 'guided' ? ex.starter : EXAMPLES[structure][0].code);
  let speed = store.data.settings.labSpeed || 'normal';
  let limit = store.data.settings.labLimit || DEFAULT_LIMIT;
  let exe = null;
  let playing = false;
  let timer = null;
  let rebuildTimer = null;
  let saveTimer = null;
  let notice = '';
  let hintsShown = 0;
  let revealed = false;
  let lastCheckedCode = null;
  let savedMine = null;
  let openIssue = null;

  function freeSetup() {
    const saved = freeVals();
    if (S.render === 'graph') return { structure, graph: saved?.graph || 'lec14', vars: { s: saved?.s ?? GRAPH_EXAMPLES[saved?.graph || 'lec14'].start } };
    return { structure, values: saved?.values ?? FREE_DEFAULTS[structure] };
  }

  // ---------------------------------------------------------------- skeleton
  const root = h('div', { class: 'lab' });
  const refBtn = h('button', { class: 'btn', 'aria-expanded': 'false', onclick: () => toggleRef() }, icon('book'), 'Syntax reference');
  const refHost = h('div');
  root.append(
    h('div', { class: 'page-head' }, h('div', {}, h('div', { class: 'eyebrow' }, 'Tools'), h('h1', {}, 'Pseudocode Lab'), h('div', { class: 'subtitle' }, 'Write pseudocode, run it line by line, and watch every node, pointer and variable change.')), refBtn),
    h(
      'div',
      { class: 'seg lab-modes', role: 'group', 'aria-label': 'Lab mode' },
      h('button', { class: 'btn', 'aria-pressed': String(mode === 'guided'), onclick: () => ctx.go(`#/lab/${(lab.lastExercise && EXERCISE_BY_ID[lab.lastExercise] ? lab.lastExercise : EXERCISES[0].id)}`) }, 'Guided exercises'),
      h('button', { class: 'btn', 'aria-pressed': String(mode === 'free'), onclick: () => ctx.go(`#/lab/free/${lab.lastFree || structure}`) }, 'Free experiment'),
    ),
    refHost,
  );
  function toggleRef(force) {
    const open = force ?? !refHost.firstChild;
    clear(refHost);
    if (open) refHost.append(referencePanel((sid, i) => {
      store.setLabDraft(`free:${sid}`, EXAMPLES[sid][i].code);
      if (EXAMPLES[sid][i].values) {
        lab.freeValues ||= {};
        lab.freeValues[sid] = { values: EXAMPLES[sid][i].values };
      }
      ctx.go(`#/lab/free/${sid}`);
    }));
    refBtn.setAttribute('aria-expanded', String(open));
  }

  // ---------------------------------------------------------------- context: goal or free setup
  const ctxPanel = h('section', { class: 'panel lab-context' });
  root.append(ctxPanel);

  function drawContext() {
    clear(ctxPanel);
    if (mode === 'guided') {
      const i = EXERCISES.indexOf(ex);
      const sel = h(
        'select',
        { 'aria-label': 'Choose an exercise', onchange: (e) => ctx.go(`#/lab/${e.target.value}`) },
        STRUCTURE_ORDER.map((sid) =>
          h(
            'optgroup',
            { label: STRUCTURES[sid].label },
            EXERCISES.filter((x) => x.structure === sid).map((x) => h('option', { value: x.id, selected: x === ex }, `${lab.solved[x.id] ? '✓ ' : ''}${x.title}`)),
          ),
        ),
      );
      ctxPanel.append(
        h('div', { class: 'row lab-picker' }, h('label', { class: 'inline small' }, h('b', {}, 'Exercise'), sel), h('button', { class: 'btn small', disabled: i === 0, onclick: () => ctx.go(`#/lab/${EXERCISES[i - 1].id}`), 'aria-label': 'Previous exercise' }, '←'), h('button', { class: 'btn small', disabled: i === EXERCISES.length - 1, onclick: () => ctx.go(`#/lab/${EXERCISES[i + 1].id}`), 'aria-label': 'Next exercise' }, '→'), h('span', { class: 'small muted' }, `${i + 1} of ${EXERCISES.length} · ${Object.keys(lab.solved).length} solved`)),
        h('div', { class: 'lab-goal' }, h('div', { class: 'row', style: { marginBottom: '6px' } }, pill(S.label, 'type'), pill(`Lecture ${String(ex.lecture).padStart(2, '0')}`), ex.supplementary ? pill('Supplementary', 'supp') : null, lab.solved[ex.id] ? h('span', { class: 'lvl mastered' }, 'solved') : null), h('h2', {}, ex.title), md(`**Goal.** ${ex.goal}`, 'prose lab-goal-text')),
        h(
          'div',
          { class: 'lab-tests' },
          h('span', { class: 'small muted' }, 'Show the run on:'),
          h(
            'div',
            { class: 'seg' },
            ex.tests.map((t, k) =>
              h(
                'button',
                {
                  class: 'btn small',
                  'aria-pressed': String(k === testIdx),
                  title: describeSetup({ structure, ...t.setup }),
                  onclick: () => {
                    testIdx = k;
                    setup = { structure, ...t.setup };
                    drawContext();
                    rebuild('Showing a different test case.');
                  },
                },
                `${t.name}`,
              ),
            ),
          ),
          h('span', { class: 'small muted' }, describeSetup(setup)),
        ),
      );
      return;
    }
    const sSel = h('select', { 'aria-label': 'Structure', onchange: (e) => ctx.go(`#/lab/free/${e.target.value}`) }, STRUCTURE_ORDER.map((sid) => h('option', { value: sid, selected: sid === structure }, STRUCTURES[sid].label)));
    let input;
    if (S.render === 'graph') {
      const gSel = h('select', { 'aria-label': 'Graph' }, Object.entries(GRAPH_EXAMPLES).map(([k, g]) => h('option', { value: k, selected: k === setup.graph }, g.label)));
      const sIn = h('input', { type: 'text', value: setup.vars.s, 'aria-label': 'start vertex s', style: { width: '64px' } });
      gSel.addEventListener('change', () => (sIn.value = GRAPH_EXAMPLES[gSel.value].start));
      input = [h('label', { class: 'inline' }, 'Graph', gSel), h('label', { class: 'inline' }, 's =', sIn), h('button', { class: 'btn primary', onclick: () => build({ structure, graph: gSel.value, vars: { s: sIn.value.trim() || GRAPH_EXAMPLES[gSel.value].start } }) }, 'Use this graph')];
    } else {
      const vIn = h('input', { type: 'text', value: (setup.values || []).map((v) => (v === null ? '-' : v)).join(' '), 'aria-label': 'initial values', placeholder: 'empty', style: { minWidth: '220px' }, onkeydown: (e) => e.key === 'Enter' && build({ structure, values: parseValues(vIn.value) }) });
      input = [h('label', { class: 'inline' }, S.render === 'tree' ? 'Level order' : 'Values', vIn), h('button', { class: 'btn primary', onclick: () => build({ structure, values: parseValues(vIn.value) }) }, 'Build'), h('button', { class: 'btn ghost', onclick: () => build({ structure, values: [] }) }, 'Start empty')];
    }
    const exSel = h('select', { 'aria-label': 'Load an example' }, h('option', { value: '' }, 'Load an example…'), EXAMPLES[structure].map((x, i) => h('option', { value: i }, x.title)));
    exSel.addEventListener('change', () => {
      if (exSel.value === '') return;
      const x = EXAMPLES[structure][Number(exSel.value)];
      if (editor.getValue().trim() && editor.getValue() !== x.code && !window.confirm('Replace the code in the editor with this example?')) {
        exSel.value = '';
        return;
      }
      editor.replaceAll(x.code);
      exSel.value = '';
      if (x.values) build({ structure, values: x.values });
    });
    ctxPanel.append(
      h('div', { class: 'row' }, h('label', { class: 'inline' }, h('b', {}, 'Structure'), sSel), input, h('span', { class: 'spacer' }), exSel),
      h('p', { class: 'small muted', style: { margin: '8px 0 0' } }, S.valuesHelp, ' Pointer variables: ', S.roots.length ? S.roots.join(', ') : 'G (graph), s (start vertex)', '.'),
      h('div', { class: 'callout', style: { marginBottom: 0 } }, h('span', { class: 'tag' }, 'Free experiment'), h('div', { class: 'small' }, 'There is no goal here, so the lab can catch errors (NULL, deleted nodes, undefined variables, endless loops) and structural problems (lost nodes, cycles, broken links) — but it can’t know whether the final result is the one you intended. Compare it with what you expected, or pick a guided exercise to be checked against test cases.')),
    );
  }

  function build(newSetup) {
    setup = newSetup;
    lab.freeValues ||= {};
    lab.freeValues[structure] = S.render === 'graph' ? { graph: setup.graph, s: setup.vars.s } : { values: setup.values };
    store.saveQuiet();
    drawContext();
    rebuild('New starting structure.');
  }

  // ---------------------------------------------------------------- editor column
  const status = h('div', { class: 'lab-status', 'aria-live': 'polite' });
  const editor = createCodeEditor({
    value: code,
    label: 'Pseudocode editor',
    onRun: () => (playing ? pause() : play()),
    onChange: (v) => {
      code = v;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.setLabDraft(draftKey, code), 400);
      const hadProgress = exe && (exe.index > 0 || playing);
      if (playing) pause(true);
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => rebuild(hadProgress ? 'You edited the code, so the run restarted from the beginning — the picture always matches the code in the editor.' : ''), 250);
    },
  });
  const starterCode = mode === 'guided' ? ex.starter : EXAMPLES[structure][0].code;
  const codeCol = h(
    'section',
    { class: 'panel lab-code', 'aria-label': 'Code' },
    h(
      'div',
      { class: 'panel-title' },
      h('h3', {}, 'Your pseudocode'),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn small ghost', title: 'Re-indent by block structure', onclick: () => editor.replaceAll(reindent(editor.getValue())) }, 'Tidy indentation'),
        h('button', { class: 'btn small ghost', onclick: () => {
          if (editor.getValue() !== starterCode && !window.confirm(mode === 'guided' ? 'Replace your code with the starter code?' : 'Replace your code with the first example?')) return;
          editor.replaceAll(starterCode);
        } }, mode === 'guided' ? 'Reset to starter' : 'Reset to example'),
      ),
    ),
    editor.el,
    status,
    h('p', { class: 'kbd-help', style: { margin: '6px 0 0' } }, h('kbd', {}, 'Tab'), ' indents · ', h('kbd', {}, 'Shift'), '+', h('kbd', {}, 'Tab'), ' outdents · ', h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter'), ' runs · ', h('kbd', {}, 'Esc'), ' then ', h('kbd', {}, 'Tab'), ' leaves the editor. Drafts are saved automatically.'),
  );

  // ---------------------------------------------------------------- run column
  const bRun = h('button', { class: 'btn primary', onclick: () => (playing ? pause() : play()), title: 'Run / pause (Space)' });
  const bBack = h('button', { class: 'btn', onclick: () => stepBack(), title: 'Step back (←)' }, '◀ Back');
  const bStep = h('button', { class: 'btn', onclick: () => stepForward(), title: 'Step forward (→)' }, 'Step ▶');
  const bEnd = h('button', { class: 'btn', onclick: () => runToEnd(), title: 'Run every remaining step at once' }, 'Run to end');
  const bReset = h('button', { class: 'btn', onclick: () => rebuild(''), title: 'Reset (Home)' }, '↺ Reset');
  const bStop = h('button', { class: 'btn danger', onclick: () => stop(), title: 'Stop the program for good' }, '■ Stop');
  const speedSel = h('select', { 'aria-label': 'Execution speed', onchange: (e) => { speed = e.target.value; store.setSetting('labSpeed', speed); } }, SPEEDS.map(([k, l]) => h('option', { value: k, selected: k === speed }, l)));
  const limitSel = h('select', { 'aria-label': 'Instruction limit', onchange: (e) => { limit = Number(e.target.value); store.setSetting('labLimit', limit); rebuild(''); } }, LIMITS.map((n) => h('option', { value: n, selected: n === limit }, `${n.toLocaleString()} steps`)));
  const counter = h('span', { class: 'stepnum', 'aria-live': 'off' });
  const controls = h('div', { class: 'panel controls lab-controls', role: 'toolbar', 'aria-label': 'Execution controls' }, bRun, h('span', { class: 'divider' }), bBack, bStep, bEnd, h('span', { class: 'divider' }), bReset, bStop, h('span', { class: 'spacer' }), h('label', { class: 'inline small' }, 'Speed', speedSel), h('label', { class: 'inline small' }, 'Limit', limitSel), counter);
  const explain = h('div', { class: 'panel ws-explain lab-explain', 'aria-live': 'polite' });
  const diagram = h('div', { class: 'diagram-box lab-diagram' });
  const varsP = h('div', { class: 'panel' });
  const outP = h('div', { class: 'panel' });
  const runCol = h('section', { class: 'lab-run', 'aria-label': 'Execution' }, controls, explain, diagram, h('div', { class: 'lab-panels' }, varsP, outP));
  const problemsP = h('section', { class: 'panel lab-problems', 'aria-label': 'Problems' });
  const historyP = h('section', { class: 'panel lab-history', 'aria-label': 'Execution history' });
  root.append(h('div', { class: 'lab-grid' }, codeCol, runCol), h('div', { class: 'lab-bottom' }, problemsP, historyP));

  // ---------------------------------------------------------------- guided: check, hints, solution
  const checkP = h('section', { class: 'panel lab-check', 'aria-label': 'Check your solution' });
  if (mode === 'guided') root.append(checkP);

  function drawCheck(result) {
    if (mode !== 'guided') return;
    clear(checkP);
    const hintBtn = hintsShown < ex.hints.length ? h('button', { class: 'btn', onclick: () => { hintsShown++; drawCheck(result); } }, `Hint ${hintsShown + 1} of ${ex.hints.length}`) : null;
    const solBtn = !revealed
      ? h('button', { class: 'btn ghost', disabled: hintsShown < ex.hints.length, title: hintsShown < ex.hints.length ? 'Use the hints first' : '', onclick: () => {
          if (!window.confirm('Show a corrected solution? Revealing it means this attempt won’t count as solved on your own.')) return;
          revealed = true;
          drawCheck(result);
        } }, 'Show solution')
      : null;
    checkP.append(
      h('div', { class: 'panel-title' }, h('h3', {}, 'Check against the goal')),
      h('p', { class: 'small muted', style: { marginTop: 0 } }, `Runs your code on all ${ex.tests.length} test cases — each with a fresh copy of its starting structure — and compares the real final result with the goal.`),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => runCheck() }, 'Check my solution'), hintBtn, solBtn),
      hintsShown ? h('ol', { class: 'lab-hints' }, ex.hints.slice(0, hintsShown).map((t) => h('li', { class: 'hint' }, t))) : null,
    );
    if (result) {
      if (result.syntax) checkP.append(h('div', { class: 'feedback bad' }, h('b', { class: 'verdict' }, `Syntax error on line ${result.syntax.line}.`), result.syntax.message, ' ', result.syntax.hint));
      else {
        const n = result.tests.filter((t) => t.pass).length;
        checkP.append(h('div', { class: `feedback ${result.passed ? 'ok' : 'bad'}` }, h('b', { class: 'verdict' }, result.passed ? `All ${n} test cases pass.` : `${n} of ${result.tests.length} test cases pass.`), result.passed ? (revealed ? 'Well done — next time try it before revealing the solution so it counts as independent.' : 'Solved on your own — this counts towards mastery of the topic.') : 'Open a failing test to see why. You can show that test in the visualiser and step through it.'));
        checkP.append(
          h(
            'ul',
            { class: 'lab-results' },
            result.tests.map((t, k) =>
              h(
                'li',
                { class: t.pass ? 'pass' : 'fail' },
                h('div', { class: 'row' }, h('b', {}, `${t.pass ? '✓' : '✗'} ${t.name}`), h('span', { class: 'small muted' }, t.setupText), h('span', { class: 'spacer' }), h('button', { class: 'btn small', onclick: () => { testIdx = k; setup = t.setup; drawContext(); rebuild(`Showing test “${t.name}”.`); diagram.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 'Show this test')),
                t.pass ? h('div', { class: 'small muted' }, `Result: ${t.got}${t.output.length ? ` · output: ${t.output.join(' ')}` : ''}`) : h('ul', { class: 'small' }, t.problems.map((p) => h('li', {}, p.text)), t.why ? h('li', {}, h('b', {}, 'Why: '), t.why) : null),
              ),
            ),
          ),
        );
      }
    }
    if (revealed) {
      checkP.append(
        h('div', { class: 'lab-solution' }, h('div', { class: 'row' }, h('b', {}, 'A correct solution'), h('span', { class: 'spacer' }), savedMine == null ? h('button', { class: 'btn small', onclick: () => { savedMine = editor.getValue(); editor.replaceAll(ex.solution); drawCheck(result); } }, 'Load into the editor') : h('button', { class: 'btn small', onclick: () => { editor.replaceAll(savedMine); savedMine = null; drawCheck(result); } }, 'Restore my code')), codeBlock(ex.solution)),
      );
    }
  }

  function runCheck() {
    const src = editor.getValue();
    const result = checkExercise(ex, src);
    if (!result.syntax && src !== lastCheckedCode) {
      lastCheckedCode = src;
      const failed = result.tests.find((t) => !t.pass);
      store.recordAttempt({ templateId: `lab-${ex.id}`, seed: 0, concept: ex.concept, type: 'lab', lecture: ex.lecture, correct: result.passed, hints: hintsShown, revealed, guidance: 'none', tag: result.tag, message: failed ? `Pseudocode Lab “${ex.title}”: ${failed.problems[0].text}` : '' });
      if (result.passed && !revealed) store.markLabSolved(ex.id);
    }
    drawCheck(result);
    drawContext();
  }

  // ---------------------------------------------------------------- execution
  function rebuild(msg) {
    pause(true);
    exe = new Execution(code, setup, { limit });
    notice = msg || '';
    openIssue = null;
    draw();
  }
  function play() {
    if (!exe || exe.syntax) return;
    if (exe.atEnd) exe.reset();
    playing = true;
    tick();
  }
  function tick() {
    if (!playing) return;
    const moved = exe.forward();
    draw();
    if (!moved || exe.atEnd) return pause();
    timer = setTimeout(tick, SPEEDS.find((x) => x[0] === speed)[2]);
  }
  function pause(silent) {
    playing = false;
    clearTimeout(timer);
    if (!silent) draw();
  }
  function stepForward() {
    pause(true);
    exe.forward();
    draw();
  }
  function stepBack() {
    pause(true);
    exe.back();
    draw();
  }
  function runToEnd() {
    pause(true);
    exe.runToEnd();
    draw();
  }
  function stop() {
    pause(true);
    exe.stop();
    notice = 'Program stopped. Step back to look at earlier states, or Reset to run again.';
    draw();
  }
  function gotoStep(i) {
    pause(true);
    exe.goto(i);
    draw();
  }

  function draw() {
    const step = exe.current;
    const prev = exe.steps[exe.index - 1];
    // controls
    bRun.textContent = playing ? '❚❚ Pause' : exe.atEnd ? '▶ Run again' : exe.index > 0 ? '▶ Continue' : '▶ Run';
    bRun.disabled = !!exe.syntax;
    bBack.disabled = exe.atStart;
    bStep.disabled = !!exe.syntax || exe.atEnd;
    bEnd.disabled = !!exe.syntax || exe.atEnd;
    bStop.disabled = exe.done;
    bReset.disabled = exe.atStart && !exe.done && exe.steps.length === 1;
    counter.textContent = `Step ${exe.index} of ${exe.steps.length - 1}${exe.done ? '' : '+'} · ${exe.executed.toLocaleString()}/${limit.toLocaleString()} instructions`;
    // explanation
    clear(explain).append(
      h('div', { class: 'row', style: { marginBottom: '4px' } }, h('span', { class: `kind-badge k-${step.kind}` }, KIND_LABEL[step.kind] || step.kind), step.line ? h('span', { class: 'small muted' }, `line ${step.line}`) : null),
      h('div', { class: `explain${step.kind === 'error' ? ' error' : ''}` }, exe.syntax && exe.index === 0 ? `Syntax error on line ${exe.syntax.line}: ${exe.syntax.message}` : step.text),
      step.hint || (exe.syntax && exe.index === 0 && exe.syntax.hint) ? h('div', { class: 'hint' }, h('b', {}, 'How to fix it'), step.hint || exe.syntax.hint) : null,
      notice ? h('p', { class: 'small muted', style: { margin: '6px 0 0' } }, notice) : null,
    );
    // diagram + panels
    clear(diagram).append(renderLabDiagram(step.state, exe.graph, step.hl));
    clear(varsP).append(h('div', { class: 'panel-title' }, h('h3', {}, 'Variables & call stack')), renderVariables(step.state, prev && prev.state));
    const colls = renderCollections(step.state);
    clear(outP).append(colls ? [h('div', { class: 'panel-title' }, h('h3', {}, 'Queues, stacks, sets, arrays')), colls] : null, h('div', { class: 'panel-title', style: colls ? { marginTop: '12px' } : null }, h('h3', {}, 'Output')), step.state.output.length ? h('pre', { class: 'lab-output' }, step.state.output.join('\n')) : h('p', { class: 'small muted', style: { margin: 0 } }, 'Nothing printed yet.'));
    drawProblems();
    drawHistory();
    // editor marks
    const shown = exe.issuesUpTo();
    const errLine = exe.syntax ? exe.syntax.line : step.kind === 'error' ? step.line : null;
    editor.setMarks({ active: ['start', 'end'].includes(step.kind) ? null : step.line, activeKind: step.kind, error: errLine, warn: shown.filter((x) => x.severity === 'warning' && x.line).map((x) => x.line) });
    editor.revealLine(errLine || step.line);
    // status line under the editor
    clear(status);
    if (exe.syntax) status.append(h('span', { class: 'lab-status-bad' }, `✕ Syntax error on line ${exe.syntax.line}${exe.syntax.col ? `, column ${exe.syntax.col}` : ''}: ${exe.syntax.message}`), exe.syntax.hint ? h('span', { class: 'muted' }, ` ${exe.syntax.hint}`) : null);
    else status.append(h('span', { class: 'lab-status-ok' }, '✓ No syntax errors'), h('span', { class: 'muted' }, exe.index === 0 ? ' — press Run or Step to execute it.' : ''));
  }

  function issueEl(is) {
    const [cls, label] = is.category === 'syntax' ? SEVERITY.syntax : is.category === 'runtime' ? SEVERITY.runtime : SEVERITY[is.severity] || SEVERITY.note;
    const st = exe.steps[is.step];
    const canCompare = is.step > 0 && exe.steps[is.step - 1]?.state && st?.state && is.category !== 'syntax';
    const key = `${is.step}:${is.title}`;
    const open = openIssue === key;
    const item = h(
      'li',
      { class: `issue ${cls}` },
      h('div', { class: 'row' }, h('span', { class: `issue-chip ${cls}` }, label), h('b', {}, is.title), is.line ? h('span', { class: 'small muted' }, `line ${is.line}`) : null, is.step && st ? h('span', { class: 'small muted' }, `step ${is.step}`) : null),
      h('div', { class: 'small' }, is.message),
      is.hint ? h('div', { class: 'small muted' }, is.hint) : null,
      h(
        'div',
        { class: 'row', style: { marginTop: '6px' } },
        is.step > 0 ? h('button', { class: 'btn small', onclick: () => gotoStep(is.step) }, 'Go to this step') : null,
        is.step > 0 && is.category !== 'syntax' ? h('button', { class: 'btn small', onclick: () => { gotoStep(is.step - 1); editor.focus(); } }, 'Undo this step') : null,
        canCompare ? h('button', { class: 'btn small ghost', 'aria-expanded': String(open), onclick: () => { openIssue = open ? null : key; drawProblems(); } }, open ? 'Hide before / after' : 'Show before / after') : null,
      ),
    );
    if (open && canCompare) {
      const before = exe.steps[is.step - 1];
      item.append(
        h(
          'div',
          { class: 'lab-ba' },
          h('figure', {}, h('figcaption', { class: 'small' }, h('b', {}, 'Before'), ` line ${st.line ?? ''}`), h('div', { class: 'diagram-box' }, renderLabDiagram(before.state, exe.graph, {}))),
          h('figure', {}, h('figcaption', { class: 'small' }, h('b', {}, st.kind === 'error' ? 'When the error happened' : 'After'), ` line ${st.line ?? ''}: ${st.kind === 'error' ? 'the instruction could not run, so nothing changed' : st.text}`), h('div', { class: 'diagram-box' }, renderLabDiagram(st.state, exe.graph, st.hl))),
        ),
      );
    }
    return item;
  }

  function drawProblems() {
    const list = exe.issuesUpTo();
    const order = { error: 0, warning: 1, note: 2 };
    const sorted = [...list].sort((x, y) => (order[x.severity] - order[y.severity]) || x.step - y.step);
    clear(problemsP).append(h('div', { class: 'panel-title' }, h('h3', {}, `Problems${list.length ? ` (${list.length})` : ''}`), h('span', { class: 'small muted' }, 'syntax · runtime · logic')));
    if (sorted.length) problemsP.append(h('ul', { class: 'issues' }, sorted.map(issueEl)));
    if (exe.atEnd && !exe.error && !exe.stopped) {
      const warnings = list.filter((x) => x.severity !== 'note').length;
      if (mode === 'free') problemsP.append(h('div', { class: 'feedback info small' }, warnings ? 'The run finished with the problems above.' : 'The run finished with no errors and no structural problems.', ' Without a stated goal the lab can’t tell whether this is the result you meant — compare it with what you expected.'));
      else problemsP.append(h('div', { class: 'feedback info small' }, 'The run finished on this test case. Use “Check my solution” to test every case against the goal.'));
    } else if (!sorted.length) problemsP.append(h('p', { class: 'small muted', style: { margin: 0 } }, exe.index === 0 ? 'Problems appear here as the program runs: syntax and runtime errors stop it; logic warnings (lost nodes, cycles, broken links) and notes about temporary states don’t.' : 'No problems so far.'));
  }

  function drawHistory() {
    const from = Math.max(0, exe.index - 120);
    const to = Math.min(exe.steps.length, exe.index + 40);
    const ol = h('ol', { class: 'history', start: from });
    for (let k = from; k < to; k++) {
      const s2 = exe.steps[k];
      ol.append(h('li', { class: [k === exe.index ? 'cur' : '', s2.kind === 'error' ? 'bad' : '', s2.issues.some((x) => x.severity !== 'note') ? 'warn' : ''].join(' '), onclick: () => gotoStep(k) }, h('span', { class: 'k' }, `${k}${s2.line ? ` · L${s2.line}` : ''}`), h('span', { class: `kind-badge k-${s2.kind}` }, KIND_LABEL[s2.kind] || s2.kind), ' ', s2.text.length > 120 ? s2.text.slice(0, 118) + '…' : s2.text));
    }
    clear(historyP).append(h('div', { class: 'panel-title' }, h('h3', {}, 'Execution history'), h('span', { class: 'small muted' }, 'click a step to jump to it')), from > 0 ? h('p', { class: 'small muted', style: { margin: '0 0 4px' } }, `… ${from} earlier steps`) : null, ol);
    // scroll only the list (scrollIntoView would also scroll the page on every step)
    const cur = ol.querySelector('li.cur');
    if (cur) {
      const top = cur.offsetTop - ol.offsetTop;
      if (top < ol.scrollTop || top + cur.offsetHeight > ol.scrollTop + ol.clientHeight) ol.scrollTop = Math.max(0, top - ol.clientHeight / 2);
    }
  }

  // keyboard: arrows/space/home when focus is not in a text field
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('textarea, input, select')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepForward();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBack();
    } else if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      playing ? pause() : play();
    } else if (e.key === 'Home') {
      e.preventDefault();
      rebuild('');
    }
  });

  ctx.setCleanup(() => {
    pause(true);
    clearTimeout(rebuildTimer);
    if (saveTimer) {
      clearTimeout(saveTimer);
      store.setLabDraft(draftKey, editor.getValue());
    }
  });

  drawContext();
  drawCheck(null);
  rebuild('');
  return root;
}
