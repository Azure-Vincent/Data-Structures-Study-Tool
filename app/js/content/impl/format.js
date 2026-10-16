// The format of the "Build it in code" programs (content/impl/*.js).
//
// Every example is one program written three times — pseudocode, C++ and
// Python — that does exactly the same thing. The pseudocode is what actually
// runs (in the Pseudocode Lab interpreter); the C++ and Python lines are tied to
// it by LABELS so the walkthrough can highlight the same statement in all three:
//
//   @a3|        start = newnode          ← this line carries label a3
//   @a3,a4|     ...                      ← several labels
//   @setup|     ...                      ← C++/Python only: builds the starting
//                                          structure the Lab sets up before step 1
//                                          (shown dimmed, never highlighted)
//
// A line without "@…|" is structure (braces, `else`, `end`, declarations,
// comments). Placeholders:
//   {{build}}  the call that builds the starting structure of the chosen case
//              (C++ `build({10, 20, 30});`, Python `build([10, 20, 30])`)
//   {{start}}  a description of the starting structure (pseudocode comment)
//   {{name}}   any value from the example's params
//
// The cross-language test (tests/impl.test.js and tests/langs/verify.mjs) runs
// the pseudocode in the Lab and compiles/runs the C++ and Python, and requires
// identical output for every case.
import { describeSetup } from '../../lab/structures.js';

/** Replace {{name}} placeholders. */
export function fill(src, values) {
  return String(src).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

/** Split a marked program into plain lines and their labels. */
export function parseMarked(src) {
  const raw = String(src).replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const lines = [];
  const labels = [];
  for (const r of raw) {
    const m = /^@([\w,-]+)\|(.*)$/.exec(r);
    lines.push(m ? m[2] : r);
    labels.push(m ? m[1].split(',') : []);
  }
  return { lines, labels, text: lines.join('\n') + '\n' };
}

/** The literal that builds a case's starting structure in each language. */
export function buildCall(lang, values) {
  // numbers stay numbers; text values (tree letters) become C++ chars / Python strings; an empty tree slot is '-'
  const vals = (values || []).map((v) => (v === null ? `'-'` : typeof v === 'string' ? `'${v}'` : v));
  if (lang === 'cpp') return `build({${vals.join(', ')}});`;
  if (lang === 'py') return `build([${vals.join(', ')}])`;
  return '';
}

/**
 * A ready-to-use program for one case of an example:
 * { setup, pseudo, cpp, py } where each language is { lines, labels, text }.
 */
export function compileExample(ex, caseIndex = 0, params = {}) {
  const c = (ex.cases || [{ label: 'Example', setup: {} }])[caseIndex] || ex.cases[0];
  const p = { ...(ex.params || {}), ...(c.params || {}), ...params };
  const setup = { structure: ex.structure, ...(c.setup || {}) };
  const out = { setup, params: p, case: c };
  for (const lang of ['pseudo', 'cpp', 'py']) {
    const src = fill(ex[lang], { ...p, start: describeSetup(setup), build: buildCall(lang, c.setup && c.setup.values) });
    out[lang] = parseMarked(src);
  }
  return out;
}

/** Lines (0-based) of `prog` that carry any of `labels`. */
export function linesWithLabels(prog, labels) {
  const want = new Set(labels || []);
  const out = [];
  prog.labels.forEach((ls, i) => {
    if (ls.some((l) => want.has(l))) out.push(i);
  });
  return out;
}
