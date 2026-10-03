// Dispatches a "visual" description or a simulation state to a renderer.
import { h } from '../dom.js';
import { renderList } from './list.js';
import { renderTree, renderGraph } from './treegraph.js';
import { renderArrayStack, renderArrayQueue, renderArray, renderMatrixRO, renderAdjList, renderCompareMemory, renderArrayTree, renderCode } from './arrays.js';
import { worldFromSetup, treeFrom, graphFrom } from '../../sim/specs.js';

export function box(el, cls = '') {
  return h('div', { class: `diagram-box ${cls}` }, el);
}

/** Render a simulation state (any structure) with highlights. */
export function renderState(state, hl = {}, opts = {}) {
  if (!state) return h('div');
  if (state.nodes && state.vars) return renderList(state, { hl, head: opts.head, ...opts });
  if (state.type === 'tree') return renderTree(state.tree, { hl, state, ...opts });
  if (state.type === 'graph') return renderGraph(state.graph, { hl, state, ...opts });
  if (state.type === 'astack') return renderArrayStack(state, { hl });
  if (state.type === 'aqueue') return renderArrayQueue(state, { hl });
  return h('div', {}, 'Nothing to draw.');
}

/** Render an exercise/lesson visual description. */
export function renderVisual(v, opts = {}) {
  if (!v) return null;
  switch (v.type) {
    case 'list': {
      const w = v.world || worldFromSetup(v.kind || 'sll', { values: v.values || [] });
      const head = opts.head || (w.globals && w.globals[0]) || w.varOrder[0];
      const el = box(renderList(w, { head, mark: v.mark, ...opts }));
      if (v.code) return h('div', { class: 'grid-2' }, el, renderCode({ lines: v.code }));
      return el;
    }
    case 'tree':
      return box(renderTree(v.tree, { mark: v.mark, numbering: v.numbering, showArray: v.showArray, levels: v.levels, ...opts }));
    case 'graph':
      return box(renderGraph(graphFrom(v.graph), { mark: v.mark, ...opts }));
    case 'astack':
      return box(renderArrayStack(v.state));
    case 'aqueue':
      return box(renderArrayQueue(v.state));
    case 'array':
      return box(renderArray(v));
    case 'matrix':
      return renderMatrixRO(v);
    case 'adjlist':
      return renderAdjList(v);
    case 'compareMemory':
      return box(renderCompareMemory(v));
    case 'arrayTree':
      return box(renderArrayTree(v));
    case 'code':
      return renderCode(v);
    default:
      return null;
  }
}

export { treeFrom };
