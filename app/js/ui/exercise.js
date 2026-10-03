// Renders one exercise (any kind) with hints, checking, solution replay,
// feedback and follow-up actions.
import { h, clear, md, pill } from './dom.js';
import { renderVisual } from './render/visual.js';
import { renderList } from './render/list.js';
import { renderTree, renderGraph } from './render/treegraph.js';
import { createRewireEditor } from './rewire.js';
import { createWorkspace } from './workspace.js';
import { TYPE_LABELS } from '../exercises/registry.js';
import { CONCEPT_BY_ID } from '../content/concepts.js';
import { solveRewire } from '../exercises/solver.js';
import { buildTrace, solutionSpec, graphFrom } from '../sim/specs.js';
import { walk, forwardField, clone } from '../core/pointerWorld.js';
import { applyAction, describeAction } from '../core/invariants.js';
import * as T from '../core/tree.js';

/**
 * renderExercise(ex, { onResult(res), onNext, onSimilar, nextLabel, settings })
 * onResult fires ONCE per exercise: on the first check, or when the solution
 * is revealed before any check.
 */
export function renderExercise(ex, cb = {}) {
  const root = h('article', { class: 'task', 'aria-label': ex.title });
  let hintsUsed = 0;
  let revealed = false;
  let reported = false;
  let solved = false;
  let checks = 0;
  const concept = CONCEPT_BY_ID[ex.concept];

  const head = h(
    'div',
    { class: 'task-head' },
    h('div', {}, h('h2', {}, ex.title), h('div', { class: 'row small' }, pill(`Lecture ${String(ex.lecture).padStart(2, '0')}`), pill(TYPE_LABELS[ex.type] || ex.type), concept ? h('span', { class: 'muted' }, concept.name) : null, ex.edge ? pill('edge case', 'edge') : null, ex.guidance === 'full' ? pill('guided') : ex.guidance === 'none' ? pill('independent') : null)),
  );
  const prompt = md(ex.prompt, 'task-prompt');
  const visualHost = h('div', { style: { margin: '8px 0' } });
  const input = h('div');
  const hintsBox = h('div', { 'aria-live': 'polite' });
  const feedback = h('div', { 'aria-live': 'polite' });
  const solutionBox = h('div');
  const actions = h('div', { class: 'task-actions' });
  root.append(head, prompt, visualHost, input, hintsBox, feedback, actions, solutionBox);

  // ------------------------------------------------------------------ visual + input
  let getResponse = () => null;
  let hintHighlight = null;
  let redrawVisual = () => {
    clear(visualHost);
    const v = renderVisual(ex.visual, visualOpts());
    if (v) visualHost.append(v);
  };
  const visualOpts = () => {
    if (!hintHighlight || !ex.visual) return {};
    if (ex.visual.type === 'list') {
      const w = ex.visual.world;
      const head2 = (w.globals && w.globals[0]) || w.varOrder[0];
      const as = walk(w, w.vars[head2], forwardField(w.kind)).addrs;
      const nodes = (hintHighlight.pos || []).map((p) => as[p - 1]).filter(Boolean);
      return { hl: { nodes, vars: hintHighlight.vars || [] } };
    }
    if (ex.visual.type === 'tree' || ex.visual.type === 'graph') return { hl: { nodes: hintHighlight.nodes || [], vertex: (hintHighlight.nodes || [])[0] } };
    return {};
  };

  switch (ex.kind) {
    case 'mcq':
    case 'multi': {
      redrawVisual();
      const multi = ex.kind === 'multi';
      const name = 'q' + Math.random().toString(36).slice(2);
      const list = h('div', { class: 'choice-list', role: multi ? 'group' : 'radiogroup', 'aria-label': 'answer options' });
      for (const o of ex.options) {
        const inp = h('input', { type: multi ? 'checkbox' : 'radio', name, value: o.id });
        const lab = h('label', { class: 'choice' }, inp, h('span', {}, o.text.includes('\n') || /^(Line|\d+\.)/.test(o.text) ? h('code', {}, o.text) : o.text));
        inp.addEventListener('change', () => list.querySelectorAll('.choice').forEach((c) => c.classList.toggle('sel', c.querySelector('input').checked)));
        list.append(lab);
      }
      input.append(list, multi ? h('p', { class: 'small muted' }, 'Select all that apply (or none, if none apply).') : null);
      getResponse = () => (multi ? [...list.querySelectorAll('input:checked')].map((i) => i.value) : list.querySelector('input:checked')?.value);
      break;
    }
    case 'numeric':
    case 'text': {
      redrawVisual();
      const inp = h('input', { type: 'text', inputmode: ex.kind === 'numeric' ? 'numeric' : 'text', 'aria-label': 'your answer', placeholder: ex.kind === 'numeric' ? (ex.answer === null ? 'number or NULL' : 'number') : ex.placeholder || 'values separated by spaces', style: { minWidth: '260px' }, onkeydown: (e) => e.key === 'Enter' && check() });
      input.append(h('label', { class: 'row' }, h('span', {}, 'Answer:'), inp, ex.unit ? h('span', {}, ex.unit) : null));
      getResponse = () => inp.value;
      break;
    }
    case 'fields': {
      redrawVisual();
      const ins = {};
      const row = h('div', { class: 'row' });
      for (const f of ex.fields) {
        ins[f.id] = h('input', { type: 'text', 'aria-label': f.label, style: { width: f.seq ? '260px' : '90px' }, placeholder: f.seq ? 'e.g. 3 1 2' : '', onkeydown: (e) => e.key === 'Enter' && check() });
        row.append(h('label', { class: 'inline' }, f.label, ins[f.id]));
      }
      input.append(row);
      getResponse = () => Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, v.value]));
      break;
    }
    case 'order': {
      redrawVisual();
      let items = [...ex.items];
      const ol = h('ol', { class: 'order-list', 'aria-label': 'statements in your order' });
      let dragId = null;
      const draw = () => {
        clear(ol);
        items.forEach((it, i) => {
          const li = h(
            'li',
            { class: 'order-item', draggable: 'true', 'data-id': it.id },
            h('span', { class: 'num' }, String(i + 1)),
            h('pre', {}, it.text),
            h('button', { class: 'btn small', 'aria-label': `move “${it.text.split('\n')[0]}” up`, disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
            h('button', { class: 'btn small', 'aria-label': `move “${it.text.split('\n')[0]}” down`, disabled: i === items.length - 1, onclick: () => move(i, 1) }, '↓'),
          );
          li.addEventListener('dragstart', () => {
            dragId = it.id;
            li.classList.add('dragging');
          });
          li.addEventListener('dragend', () => li.classList.remove('dragging'));
          li.addEventListener('dragover', (e) => e.preventDefault());
          li.addEventListener('drop', (e) => {
            e.preventDefault();
            const from = items.findIndex((x) => x.id === dragId);
            const to = items.findIndex((x) => x.id === it.id);
            if (from < 0 || to < 0 || from === to) return;
            const [m] = items.splice(from, 1);
            items.splice(to, 0, m);
            draw();
          });
          ol.append(li);
        });
      };
      const move = (i, d) => {
        const j = i + d;
        [items[i], items[j]] = [items[j], items[i]];
        draw();
        ol.querySelectorAll('.order-item')[j]?.querySelectorAll('button')[d < 0 ? 0 : 1]?.focus();
      };
      draw();
      input.append(h('p', { class: 'small muted' }, 'Drag the statements, or use the ↑ ↓ buttons. Any order that works is accepted.'), ol);
      getResponse = () => items.map((x) => x.id);
      break;
    }
    case 'fill': {
      redrawVisual();
      const [before, after] = ex.template.split('____');
      const inp = h('input', { type: 'text', 'aria-label': 'missing code', placeholder: ex.placeholder || '', spellcheck: 'false', autocomplete: 'off', onkeydown: (e) => e.key === 'Enter' && check() });
      input.append(h('div', { class: 'fill-code' }, before, inp, after), h('p', { class: 'small muted' }, 'Your code is run on several test lists; any version that behaves correctly is accepted.'));
      getResponse = () => inp.value;
      break;
    }
    case 'sequence':
    case 'nodepick': {
      const isSeq = ex.kind === 'sequence';
      let picked = [];
      const chipsBox = h('div', { class: 'seq-chips', 'aria-live': 'polite' });
      const frontierBox = h('div');
      const onNode = (idv) => {
        const id = String(idv);
        if (solved) return;
        if (isSeq) picked.push(id);
        else picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
        draw();
      };
      const draw = () => {
        clear(visualHost);
        const v = ex.visual;
        const hl = visualOpts().hl;
        let svg;
        if (v.type === 'tree') svg = renderTree(v.tree, { onNode, picked: isSeq ? [] : picked, mark: v.mark, hl, orderBadges: isSeq ? Object.fromEntries(picked.map((x, i) => [x, i + 1])) : null });
        else if (v.type === 'graph') svg = renderGraph(graphFrom(v.graph), { onNode, picked: isSeq ? [] : picked, mark: v.mark, hl, state: isSeq ? { output: picked } : {} });
        else svg = renderList(v.world, { clickable: { onNode, picked: picked.map(Number) }, hl });
        visualHost.append(h('div', { class: 'diagram-box' }, svg));
        clear(chipsBox).append(h('span', { class: 'small muted' }, isSeq ? 'Your order:' : 'Selected:'), picked.length ? picked.map((x, i) => h('span', { class: 'chip' }, isSeq ? `${i + 1}. ${label(x)}` : label(x))) : h('span', { class: 'muted small' }, isSeq ? 'click nodes in order' : ex.allowNone ? 'nothing selected (= “none”)' : 'nothing yet'));
        clear(frontierBox);
        if (isSeq && ex.frontierAt && ex.guidance !== 'none') {
          let k = 0;
          while (k < picked.length && picked[k] === ex.answer[k]) k++;
          const f = ex.frontierAt(k);
          if (f) frontierBox.append(h('div', { class: 'frontier' }, h('span', { class: 'lbl' }, `${f.label} after your ${k} correct click${k === 1 ? '' : 's'}`), f.items.length ? f.items.map((x) => h('span', { class: 'cell' }, x)) : h('span', { class: 'muted small' }, 'empty')));
        }
      };
      const label = (x) => {
        if (ex.visual.type === 'list') {
          const n = ex.visual.world.nodes[x];
          return n ? `${n.data} @${x}` : x;
        }
        return x;
      };
      redrawVisual = draw;
      draw();
      input.append(chipsBox, frontierBox, h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => { picked = isSeq ? picked.slice(0, -1) : []; draw(); } }, isSeq ? '↶ Undo last' : 'Clear'), isSeq ? h('button', { class: 'btn small ghost', onclick: () => { picked = []; draw(); } }, 'Clear') : null, h('span', { class: 'kbd-help' }, 'Tip: nodes are focusable — Tab to one and press Enter.')));
      getResponse = () => picked;
      break;
    }
    case 'rewire': {
      const ed = createRewireEditor({ world: ex.world, newValue: ex.newValue, head: ex.opts.head, initialActions: ex.initialActions || [], allowValueInput: ex.allowValueInput });
      input.append(ed.el);
      getResponse = () => ed.getActions();
      ex._editor = ed;
      redrawVisual = () => {
        const hl = hintHighlight;
        if (!hl) return;
        const w = ex.world;
        const as = walk(w, w.vars[ex.opts.head || 'start'], forwardField(w.kind)).addrs;
        ed.setHighlight((hl.pos || []).map((p) => as[p - 1]).filter(Boolean));
      };
      break;
    }
    case 'matrix': {
      redrawVisual();
      const n = ex.labels.length;
      const m = Array.from({ length: n }, () => Array(n).fill(0));
      const t = h('table', { class: 'matrix', 'aria-label': 'adjacency matrix to fill' });
      t.append(h('tr', {}, h('th', {}, 'from \\ to'), ex.labels.map((l) => h('th', { scope: 'col' }, l))));
      ex.labels.forEach((r, i) => {
        const tr = h('tr', {}, h('th', { scope: 'row' }, r));
        ex.labels.forEach((c, j) => {
          const b = h('button', { 'aria-label': `row ${r} column ${c}: 0`, onclick: () => { m[i][j] = 1 - m[i][j]; b.textContent = String(m[i][j]); b.classList.toggle('on', !!m[i][j]); b.setAttribute('aria-label', `row ${r} column ${c}: ${m[i][j]}`); } }, '0');
          tr.append(h('td', {}, b));
        });
        t.append(tr);
      });
      input.append(t);
      getResponse = () => m.map((r) => [...r]);
      break;
    }
    case 'adjlist': {
      redrawVisual();
      const ins = {};
      const box = h('div', { style: { display: 'grid', gap: '6px', maxWidth: '420px' } });
      for (const l of ex.labels) {
        ins[l] = h('input', { type: 'text', 'aria-label': `neighbours of ${l}`, placeholder: 'neighbours, e.g. B C', style: { flex: '1' } });
        box.append(h('label', { class: 'row' }, h('span', { class: 'chip', style: { minWidth: '36px', textAlign: 'center' } }, l), '→', ins[l]));
      }
      input.append(box);
      getResponse = () => Object.fromEntries(Object.entries(ins).map(([k, v]) => [k, v.value]));
      break;
    }
    case 'graphdraw': {
      redrawVisual();
      let edges = [];
      let first = null;
      const canvas = h('div', { class: 'diagram-box', style: { marginTop: '8px' } });
      const status = h('p', { class: 'small', 'aria-live': 'polite' });
      const draw = () => {
        const g = clone(ex.canvas);
        g.edges = edges.map(([u, v]) => ({ u, v, w: 1 }));
        clear(canvas).append(renderGraph(g, { onNode: pick, picked: first ? [first] : [] }));
        status.textContent = first ? `From ${first}: now click the end vertex (the same vertex again makes a self-loop).` : `${edges.length} edge(s) drawn. Click a start vertex.`;
      };
      const pick = (v) => {
        if (!first) first = v;
        else {
          const k = edges.findIndex(([a, b]) => (a === first && b === v) || (!ex.directed && a === v && b === first));
          if (k >= 0) edges.splice(k, 1);
          else edges.push([first, v]);
          first = null;
        }
        draw();
      };
      draw();
      input.append(canvas, status, h('button', { class: 'btn small', onclick: () => { edges = []; first = null; draw(); } }, 'Clear edges'));
      getResponse = () => edges;
      break;
    }
    case 'treebuild': {
      redrawVisual();
      let t = T.emptyTree();
      const canvas = h('div', { class: 'diagram-box', style: { marginTop: '8px' } });
      const sel = h('select', { 'aria-label': 'label for the next node' });
      const draw = () => {
        const used = new Set(T.ids(t));
        clear(sel).append(ex.labels.filter((l) => !used.has(l)).map((l) => h('option', { value: l }, l)));
        clear(canvas).append(renderTree(t, { addButtons: { onAdd: (p, side) => add(p, side) }, onNode: (id) => { if (window.confirm(`Remove ${id} and its subtree?`)) { T.removeSubtree(t, id); draw(); } } }));
      };
      const add = (p, side) => {
        if (!sel.value) return;
        T.addChild(t, p, side, sel.value);
        draw();
      };
      draw();
      input.append(h('div', { class: 'row' }, h('label', { class: 'inline' }, 'Next label', sel), h('button', { class: 'btn small', onclick: () => { if (!t.root && sel.value) { T.addChild(t, null, null, sel.value); draw(); } } }, 'Add as root'), h('button', { class: 'btn small ghost', onclick: () => { t = T.emptyTree(); draw(); } }, 'Clear'), h('span', { class: 'kbd-help' }, 'Choose a label, then click a dashed + spot. Click a node to remove it.')), canvas);
      getResponse = () => t;
      break;
    }
    default:
      input.append(h('p', {}, `Unsupported exercise kind ${ex.kind}`));
  }

  // ------------------------------------------------------------------ reflection
  if (ex.reflection) {
    const ta = h('textarea', { 'aria-label': 'reflection (not graded)', placeholder: 'Write a sentence or two…' });
    root.insertBefore(h('div', { class: 'reflection' }, h('label', {}, 'Explain your choice — ungraded reflection'), h('p', { class: 'small muted', style: { margin: '0 0 4px' } }, `${ex.reflection.prompt} This box is NOT checked by the app; compare it with the explanation after you answer.`), ta), hintsBox);
  }

  // ------------------------------------------------------------------ actions
  const bHint = h('button', { class: 'btn', onclick: () => showHint() }, 'Hint 1 of 3');
  const bCheck = h('button', { class: 'btn primary', onclick: () => check() }, 'Check');
  const bReveal = h('button', { class: 'btn ghost', onclick: () => reveal() }, 'Reveal solution');
  actions.append(bCheck, bHint, bReveal, h('span', { class: 'spacer' }));

  function showHint() {
    if (hintsUsed >= ex.hints.length) return;
    const hn = ex.hints[hintsUsed++];
    const text = typeof hn === 'string' ? hn : hn.text;
    const labels = ['Concept', 'Look at the diagram', 'Next concrete step'];
    hintsBox.append(h('div', { class: 'hint' }, h('b', {}, `Hint ${hintsUsed} — ${labels[hintsUsed - 1]}`), text));
    if (hn && hn.hl) {
      hintHighlight = hn.hl;
      redrawVisual();
    }
    bHint.textContent = hintsUsed < ex.hints.length ? `Hint ${hintsUsed + 1} of 3` : 'No more hints';
    bHint.disabled = hintsUsed >= ex.hints.length;
  }

  function report(res) {
    if (reported) return;
    reported = true;
    cb.onResult && cb.onResult({ correct: res.correct, hints: hintsUsed, revealed, tag: res.tag, message: res.message });
  }

  function check() {
    if (solved) return;
    const resp = getResponse();
    const res = ex.check(resp);
    checks++;
    report(res);
    clear(feedback);
    if (res.correct) {
      solved = true;
      feedback.append(h('div', { class: 'feedback ok' }, h('b', { class: 'verdict' }, checks === 1 && !hintsUsed ? 'Correct.' : 'Correct now.'), res.message || ''));
      bCheck.disabled = true;
      endButtons(false);
    } else {
      feedback.append(h('div', { class: 'feedback bad' }, h('b', { class: 'verdict' }, 'Not yet.'), res.message || 'Look again.'));
      if (ex.kind === 'rewire' && ex._editor) ex._editor.markBad(res.firstBad ?? null, res.nodes || []);
      endButtons(true);
    }
  }

  function endButtons(afterMistake) {
    actions.querySelectorAll('[data-end]').forEach((b) => b.remove());
    if (afterMistake && cb.onSimilar) actions.append(h('button', { class: 'btn', 'data-end': 1, onclick: () => cb.onSimilar() }, 'Try a similar one'));
    if (cb.onNext && (solved || revealed || afterMistake)) actions.append(h('button', { class: `btn ${solved || revealed ? 'primary' : ''}`, 'data-end': 1, onclick: () => cb.onNext() }, cb.nextLabel || 'Next'));
  }

  function reveal() {
    revealed = true;
    report({ correct: false, tag: null, message: 'revealed' });
    bReveal.disabled = true;
    bCheck.disabled = true;
    solved = true;
    clear(solutionBox).append(h('h3', { style: { marginTop: '14px' } }, 'Solution'));
    if (ex.kind === 'rewire') {
      const sol = solveRewire(ex);
      solutionBox.append(h('p', { class: 'small' }, 'Replay the reasoning one action at a time:'));
      solutionBox.append(createWorkspace(rewireTrace(ex, sol)).el);
      if (ex.solutionText) solutionBox.append(h('p', { class: 'small muted' }, ex.solutionText));
    } else {
      solutionBox.append(h('pre', { class: 'code', style: { whiteSpace: 'pre-wrap' } }, ex.solutionText || ''));
      const spec = solutionSpec(ex.solutionTrace);
      if (spec) {
        try {
          solutionBox.append(h('p', { class: 'small' }, 'Replay the algorithm step by step:'), createWorkspace(buildTrace(spec)).el);
        } catch (e) {
          console.warn(e);
        }
      }
    }
    feedback.append(h('div', { class: 'feedback info small' }, 'Revealing the solution does not count toward mastery. A fresh variation will come back in later practice.'));
    endButtons(false);
  }

  return root;
}

/** Turn solver actions into a replayable trace for the workspace. */
export function rewireTrace(ex, sol) {
  let w = clone(ex.world);
  const lines = sol.actions.map((a) => describeAction(w, a));
  const steps = [{ line: -1, kind: 'start', explain: 'Starting state.', hl: {}, state: clone(w), counters: {}, output: [] }];
  const counters = {};
  sol.actions.forEach((a, i) => {
    applyAction(w, a);
    const kind = a.type === 'alloc' ? 'alloc' : a.type === 'free' ? 'free' : a.type === 'setVar' ? 'var' : 'link';
    counters[kind === 'alloc' ? 'allocs' : kind === 'free' ? 'frees' : kind === 'var' ? 'varWrites' : 'linkWrites'] = (counters[kind === 'alloc' ? 'allocs' : kind === 'free' ? 'frees' : kind === 'var' ? 'varWrites' : 'linkWrites'] || 0) + 1;
    const hl = a.type === 'setField' ? { links: [{ from: a.addr, field: a.field }], nodes: [a.addr], anim: 'link' } : a.type === 'setVar' ? { vars: [a.name] } : a.type === 'free' ? { nodes: [a.addr], anim: 'free' } : { nodes: Object.keys(w.nodes).map(Number).filter((x) => !ex.world.nodes[x]), anim: 'alloc' };
    steps.push({ line: i, kind, explain: sol.why[i], hl, state: clone(w), counters: { ...counters }, output: [] });
  });
  steps.push({ line: -1, kind: 'end', explain: 'Goal reached.', hl: {}, state: clone(w), counters: { ...counters }, output: [] });
  return { code: { title: 'Solution actions', lines }, steps, final: w, counters, output: [] };
}
