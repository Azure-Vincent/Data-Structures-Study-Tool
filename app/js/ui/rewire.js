// Interactive pointer editor: click a pointer field then a node (or drag),
// or use the keyboard panel. Every change is an action that can be undone.
import { h, clear } from './dom.js';
import { renderList } from './render/list.js';
import { clone, fieldsOf, liveNodes, fmtPtr } from '../core/pointerWorld.js';
import { applyAction, describeAction } from '../core/invariants.js';

export function createRewireEditor({ world, newValue = null, initialActions = [], onChange = () => {}, head, allowValueInput = false, hlNodes = [] }) {
  const initial = clone(world);
  let actions = [...initialActions];
  let w = replay();
  let armed = null; // {type:'field', addr, field} | {type:'var', name}
  let badIndex = null;
  let highlight = hlNodes;
  const el = h('div', { class: 'rewire' });
  const diagram = h('div', { class: 'diagram-box', style: { marginTop: '8px' } });
  const tools = h('div', { class: 'row', style: { marginTop: '8px' } });
  const panel = h('div', { class: 'edit-panel', style: { marginTop: '8px' } });
  const hist = h('div', { style: { marginTop: '8px' } });
  const status = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  el.append(tools, diagram, panel, hist, status);

  function replay() {
    const x = clone(initial);
    for (const a of actions) applyAction(x, a);
    return x;
  }
  function push(a) {
    const t = clone(w);
    const r = applyAction(t, a);
    if (!r.ok) {
      say(r.error);
      draw(r.error);
      return;
    }
    actions.push(a);
    w = t;
    armed = null;
    badIndex = null;
    say(`Done: ${describeAction(w, a)}`);
    draw();
    onChange(actions);
  }
  function say(m) {
    status.textContent = m;
  }

  function onField(addr, field) {
    armed = armed && armed.type === 'field' && armed.addr === addr && armed.field === field ? null : { type: 'field', addr, field };
    draw();
    if (armed) panel.querySelector('select[data-role=target]')?.focus();
  }
  function onVar(name) {
    armed = armed && armed.type === 'var' && armed.name === name ? null : { type: 'var', name };
    draw();
    if (armed) panel.querySelector('select[data-role=target]')?.focus();
  }
  function onNode(addr) {
    if (!armed) {
      say(`Node ${addr}: first choose which pointer to change (click a next/left/right field or a variable).`);
      draw(`Choose a pointer first: click a field (next/left/right) or a variable box, then click the node it should point to.`);
      return;
    }
    connect(armed, addr);
  }
  function connect(src, target) {
    if (src.type === 'field') push({ type: 'setField', addr: src.addr, field: src.field, value: target });
    else push({ type: 'setVar', name: src.name, value: target });
  }

  function draw(msg) {
    clear(diagram).append(
      renderList(w, {
        head,
        interactive: { onField, onVar, onNode, armed, onConnect: (src, target) => connect(src, target) },
        hl: { nodes: highlight },
      }),
    );
    // toolbar
    clear(tools);
    const hasNewVar = 'newnode' in w.vars;
    const valIn = allowValueInput ? h('input', { type: 'number', value: newValue ?? 0, 'aria-label': 'value for the new node', style: { width: '80px' } }) : null;
    tools.append(
      h(
        'button',
        {
          class: 'btn',
          disabled: !allowValueInput && newValue == null,
          onclick: () => push({ type: 'alloc', data: allowValueInput ? Number(valIn.value) : newValue, var: hasNewVar ? 'newnode' : null }),
          title: 'Allocate and initialise a node (all links NULL)',
        },
        `${hasNewVar ? 'newnode = ' : ''}getnode(${allowValueInput ? '' : newValue ?? ''})`,
      ),
      valIn,
    );
    const freeable = w.varOrder.filter((v) => typeof w.vars[v] === 'number' && w.nodes[w.vars[v]] && !w.nodes[w.vars[v]].freed);
    const freeSel = h('select', { 'aria-label': 'pointer to free' }, freeable.map((v) => h('option', { value: v }, `free(${v})  — block ${w.vars[v]}`)));
    tools.append(freeSel, h('button', { class: 'btn', disabled: !freeable.length, onclick: () => push({ type: 'free', addr: w.vars[freeSel.value] }) }, 'Free'));
    tools.append(
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', disabled: !actions.length, onclick: () => undo() }, '↶ Undo'),
      h('button', { class: 'btn ghost', disabled: !actions.length, onclick: () => resetAll() }, 'Start over'),
    );
    // keyboard / precise panel
    clear(panel);
    const sources = [];
    for (const v of w.varOrder) if (v in w.vars) sources.push({ key: 'v:' + v, label: `${v}  (now ${fmtPtr(w.vars[v])})`, src: { type: 'var', name: v } });
    for (const n of liveNodes(w)) for (const f of fieldsOf(w.kind)) sources.push({ key: `f:${n.addr}:${f}`, label: `${n.addr}->${f}  (node ${n.data}, now ${fmtPtr(n[f])})`, src: { type: 'field', addr: n.addr, field: f } });
    const armedKey = armed ? (armed.type === 'var' ? 'v:' + armed.name : `f:${armed.addr}:${armed.field}`) : '';
    const srcSel = h('select', { 'aria-label': 'pointer to change', 'data-role': 'source', onchange: () => { const s2 = sources.find((x) => x.key === srcSel.value); armed = s2 ? s2.src : null; draw(); } }, h('option', { value: '' }, '— choose a pointer —'), sources.map((x) => h('option', { value: x.key, selected: x.key === armedKey }, x.label)));
    const tgtSel = h('select', { 'aria-label': 'new target', 'data-role': 'target' }, h('option', { value: 'null' }, 'NULL'), Object.values(w.nodes).map((n) => h('option', { value: n.addr }, `${n.addr}  (node ${n.data}${n.freed ? ', FREED' : ''})`)));
    panel.append(
      h('div', { class: 'row' }, h('b', { class: 'small' }, armed ? `Changing ${armed.type === 'var' ? armed.name : `${armed.addr}->${armed.field}`}:` : 'Set a pointer:'), srcSel, h('span', {}, '='), tgtSel, h('button', { class: 'btn primary small', disabled: !armed, onclick: () => armed && connect(armed, tgtSel.value === 'null' ? null : Number(tgtSel.value)) }, 'Apply'), armed ? h('button', { class: 'btn small', 'data-null-drop': '1', onclick: () => connect(armed, null) }, 'Set to NULL') : null, armed ? h('button', { class: 'btn ghost small', onclick: () => { armed = null; draw(); } }, 'Cancel') : null),
      h('p', { class: 'kbd-help', style: { margin: '6px 0 0' } }, 'Mouse: click a pointer field (next/left/right) or a variable box, then click the node it should point to — or drag from the field onto the node. Keyboard: Tab to a field and press Enter, then pick the target here and press Apply.'),
      msg ? h('div', { class: 'feedback info small' }, msg) : null,
    );
    // history
    clear(hist).append(
      h('b', { class: 'small' }, `Your actions (${actions.length})`),
      actions.length
        ? h('ol', { class: 'history' }, actions.map((a, i) => h('li', { class: i === badIndex ? 'bad' : '', onclick: () => undoTo(i) , title: 'Undo back to before this action' }, h('span', { class: 'k' }, `#${i + 1}`), describeAction(w, a), i === badIndex ? '  ← first problem' : '')))
        : h('p', { class: 'small muted' }, 'No changes yet.'),
    );
  }

  function undo() {
    actions.pop();
    w = replay();
    armed = null;
    badIndex = null;
    draw();
    onChange(actions);
  }
  function undoTo(i) {
    if (!confirmUndo(i)) return;
    actions = actions.slice(0, i);
    w = replay();
    badIndex = null;
    draw();
    onChange(actions);
  }
  function confirmUndo(i) {
    return typeof window === 'undefined' || window.confirm(`Undo action #${i + 1} and everything after it?`);
  }
  function resetAll() {
    actions = [...initialActions];
    w = replay();
    armed = null;
    badIndex = null;
    draw();
    onChange(actions);
  }

  draw();
  return {
    el,
    getActions: () => [...actions],
    world: () => w,
    markBad(i, nodes) {
      badIndex = i ?? null;
      highlight = nodes || [];
      draw();
    },
    setHighlight(nodes) {
      highlight = nodes || [];
      draw();
    },
    replaceActions(list) {
      actions = [...list];
      w = replay();
      draw();
      onChange(actions);
    },
    reset: resetAll,
  };
}
