// Helpers shared by the traced linked-list algorithms.
import { malloc, addVar, dropVar, fieldsOf, free, sweepFreed, fmtPtr } from './pointerWorld.js';

/** getnode(): malloc, then data, then every link = NULL. detail=false → one step. */
export function getnodeSteps(t, line, value, { detail = true, varName = 'newnode' } = {}) {
  const w = t.state;
  const a = malloc(w);
  addVar(w, varName, a);
  t.count('allocs');
  t.count('varWrites');
  if (detail) {
    t.step(line, 'alloc', `malloc(sizeof(node)) reserves a new block on the heap at address ${a}. ${varName} now holds that address. The fields still contain garbage (?).`, { nodes: [a], vars: [varName], anim: 'alloc' });
  }
  w.nodes[a].data = value;
  if (detail) t.step(line, 'data', `${varName}->data = ${value}. The VALUE ${value} is stored inside the block whose ADDRESS is ${a}.`, { nodes: [a], fields: [{ addr: a, field: 'data' }] });
  for (const f of fieldsOf(w.kind)) {
    w.nodes[a][f] = null;
    t.count('linkWrites');
  }
  const fl = fieldsOf(w.kind).map((f) => `${varName}->${f}`).join(' and ');
  if (detail) t.step(line, 'link', `${fl} = NULL. The new node is initialised but not connected to the list yet.`, { links: fieldsOf(w.kind).map((f) => ({ from: a, field: f })) });
  else t.step(line, 'alloc', `getnode(): malloc a block at ${a}, store data ${value}, set ${fl} = NULL. ${varName} = ${a}.`, { nodes: [a], vars: [varName], anim: 'alloc' });
  return a;
}

export function setVar(t, line, name, value, explain, extra = {}) {
  const w = t.state;
  if (!(name in w.vars)) addVar(w, name, value);
  else w.vars[name] = value;
  t.count('varWrites');
  t.step(line, 'var', explain || `${name} = ${fmtPtr(value)}.`, { vars: [name], nodes: typeof value === 'number' ? [value] : [], ...extra });
}

export function setLink(t, line, from, field, value, explain, extra = {}) {
  const w = t.state;
  w.nodes[from][field] = value;
  t.count('linkWrites');
  t.step(line, 'link', explain, { links: [{ from, field }], nodes: [from], ...extra, anim: 'link' });
}

export function freeStep(t, line, varName, explain) {
  const w = t.state;
  const a = w.vars[varName];
  free(w, a);
  t.count('frees');
  t.step(line, 'free', explain || `free(${varName}) releases the block at ${a}. ${varName} still holds ${a}, but that memory no longer belongs to us (dangling if used).`, { nodes: [a], vars: [varName], anim: 'free' });
}

export function cond(t, line, value, explain, hl = {}) {
  t.count('comparisons');
  t.step(line, 'check', `${explain} → ${value ? 'true' : 'false'}.`, hl);
  return value;
}

/** Function returns: local pointer variables disappear, freed blocks are removed. */
export function endScope(t, locals, explain) {
  const w = t.state;
  const present = locals.filter((v) => v in w.vars);
  for (const v of present) dropVar(w, v);
  sweepFreed(w);
  return t.finish(explain || (present.length ? `Function returns. Local pointers ${present.join(', ')} go out of scope; only global pointers remain.` : 'Function returns.'));
}

export function d(w, a) {
  return w.nodes[a] ? w.nodes[a].data : '?';
}
