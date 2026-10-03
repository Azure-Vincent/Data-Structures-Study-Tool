// Generic "predict the next step" questions, computed from the simulation:
// before showing step i we ask what will change, with the answer taken from
// the step's recorded state.
import { fieldsOf, fmtPtr } from '../core/pointerWorld.js';
import { makeRng } from '../core/rng.js';

const DEFAULT_KINDS = ['link', 'var', 'free', 'output', 'discover', 'push', 'pop', 'write', 'read'];

/** Should the player stop before step i to ask? kinds: which step kinds. */
export function wantsPrediction(trace, i, kinds = DEFAULT_KINDS) {
  const s = trace.steps[i];
  if (!s || i === 0) return false;
  if (!kinds.includes(s.kind)) return false;
  return !!makeQuestion(trace, i);
}

export function makeQuestion(trace, i) {
  const s = trace.steps[i];
  const p = trace.steps[i - 1];
  if (!s || !p) return null;
  const rng = makeRng(i * 7919 + 13);
  const code = (s.code || trace.code).lines?.[s.line]?.trim() || '';
  const st = s.state;
  const ps = p.state;
  // pointer worlds
  if (st.nodes && st.vars) {
    if (s.kind === 'link' && s.hl.links && s.hl.links[0]) {
      const { from, field } = s.hl.links[0];
      const before = ps.nodes[from] ? ps.nodes[from][field] : null;
      const after = st.nodes[from][field];
      if (before === after) return null;
      const cand = new Set([fmtPtr(after), fmtPtr(before), 'NULL', ...Object.keys(st.nodes).map(String)]);
      const options = rng.shuffle([...cand].filter((x) => x !== '? (garbage)')).slice(0, 4);
      if (!options.includes(fmtPtr(after))) options[0] = fmtPtr(after);
      return {
        q: `Next line: \`${code}\`. What will node ${from}'s ${field} hold afterwards?`,
        options: rng.shuffle(options),
        answer: fmtPtr(after),
        explain: s.explain,
      };
    }
    if (s.kind === 'var' && s.hl.vars && s.hl.vars.length === 1) {
      const v = s.hl.vars[0];
      const before = ps.vars[v];
      const after = st.vars[v];
      if (before === after || after === undefined) return null;
      const cand = new Set([fmtPtr(after), fmtPtr(before ?? null), 'NULL', ...Object.keys(st.nodes).filter((a) => !st.nodes[a].freed).map(String)]);
      let options = rng.shuffle([...cand]).slice(0, 4);
      if (!options.includes(fmtPtr(after))) options[0] = fmtPtr(after);
      return { q: `Next line: \`${code}\`. What will ${v} hold afterwards?`, options: rng.shuffle(options), answer: fmtPtr(after), explain: s.explain };
    }
    if (s.kind === 'output') {
      const val = s.output[s.output.length - 1];
      const vals = [...new Set(Object.values(st.nodes).map((n) => String(n.data)))];
      let options = rng.shuffle(vals).slice(0, 4);
      if (!options.includes(String(val))) options[0] = String(val);
      return { q: `Next line: \`${code}\`. What gets printed?`, options: rng.shuffle(options), answer: String(val), explain: s.explain };
    }
    if (s.kind === 'free') {
      const freed = Object.values(st.nodes).find((n) => n.freed && !(ps.nodes[n.addr] && ps.nodes[n.addr].freed));
      if (!freed) return null;
      const options = rng.shuffle(Object.keys(ps.nodes).filter((a) => !ps.nodes[a].freed)).slice(0, 4);
      if (!options.includes(String(freed.addr))) options[0] = String(freed.addr);
      return { q: `Next line: \`${code}\`. Which block (address) is released?`, options: rng.shuffle(options), answer: String(freed.addr), explain: s.explain };
    }
    return null;
  }
  // trees
  if (st.type === 'tree') {
    if (s.kind === 'output' || s.kind === 'push' || s.kind === 'pop') {
      const x = s.hl.node;
      const ids = Object.keys(st.tree.nodes);
      let options = rng.shuffle(ids).slice(0, 4);
      if (!options.includes(x)) options[0] = x;
      const verb = s.kind === 'output' ? 'is OUTPUT next' : s.kind === 'push' ? 'is pushed next' : 'is popped next';
      return { q: `Which node ${verb}?`, options: rng.shuffle(options), answer: x, explain: s.explain };
    }
    return null;
  }
  // graphs
  if (st.type === 'graph') {
    if (s.kind === 'discover' || s.kind === 'output') {
      const x = s.hl.vertex;
      let options = rng.shuffle(st.graph.vertices).slice(0, 4);
      if (!options.includes(x)) options[0] = x;
      return { q: s.kind === 'discover' ? 'Which vertex is discovered next?' : 'Which vertex is dequeued and output next?', options: rng.shuffle(options), answer: x, explain: s.explain };
    }
    return null;
  }
  // array stack / queue
  if (st.type === 'astack' || st.type === 'aqueue') {
    if (s.kind === 'write' || s.kind === 'read') {
      const cell = s.hl.cells && s.hl.cells[0];
      if (cell == null) return null;
      const options = rng.shuffle(Array.from({ length: st.MAX }, (_, k) => String(k))).slice(0, 4);
      if (!options.includes(String(cell))) options[0] = String(cell);
      return { q: `Next line: \`${code}\`. Which array index is ${s.kind === 'write' ? 'written' : 'read'}?`, options: rng.shuffle(options), answer: String(cell), explain: s.explain };
    }
  }
  void fieldsOf;
  return null;
}
