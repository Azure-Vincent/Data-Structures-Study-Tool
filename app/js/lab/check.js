// Grades a guided exercise by running the user's code on every test case
// (fresh initial structure each time) and comparing the real final state with
// the stated goal. No DOM.
import { runAll } from './run.js';
import { describeSetup, STRUCTURES } from './structures.js';
import { listValues, levelOrder, structureText, globalVal } from './analysis.js';
import { fmt, dataText, isRef } from './machine.js';

export const CHECK_LIMIT = 5000;

const show = (v) => (v === null ? '–' : dataText(v));

function expectedList(S, vals) {
  const root = S.roots[0];
  if (!vals.length) return `${root} = NULL (empty)`;
  return `${root} → ${vals.map(show).join(' → ')}${S.circular ? ' → (back to start)' : ' → NULL'}`;
}

/**
 * Returns { syntax, passed, tests: [{ name, setupText, pass, problems: [{text, tag}], got, output, why }], tag }
 */
export function checkExercise(ex, code, { limit = CHECK_LIMIT } = {}) {
  const S = STRUCTURES[ex.structure];
  const tests = [];
  for (const [i, t] of ex.tests.entries()) {
    const setup = { structure: ex.structure, ...t.setup };
    const x = runAll(code, setup, { limit });
    if (x.syntax) return { syntax: x.syntax, passed: false, tests: [], tag: 'syntax' };
    const st = x.state;
    const problems = [];
    const add = (text, tag = 'wrong-result') => problems.push({ text, tag });
    const e = t.expect || {};
    if (x.error) add(`Line ${x.error.line}: ${x.error.message}${x.error.hint ? ` ${x.error.hint}` : ''}`, x.error.tag || 'runtime');
    else {
      if (e.list) {
        const got = listValues(st);
        const same = got.values.length === e.list.length && got.values.every((v, k) => v === e.list[k]);
        const shapeOk = S.circular ? got.end === 'cycle' || (!got.values.length && got.end === 'null') : got.end === 'null';
        if (!same || !shapeOk) add(`Expected ${expectedList(S, e.list)}, but it is ${structureText(st)}.`, got.end === 'cycle' && !S.circular ? 'pointer-walk' : 'wrong-result');
      }
      if (e.tree) {
        const got = levelOrder(st, globalVal(st, 'root'));
        const same = got.values.length === e.tree.length && got.values.every((v, k) => v === e.tree[k]);
        if (!same) add(`Expected the tree (level order) ${e.tree.map(show).join(' ') || 'empty'}, but it is ${got.values.map(show).join(' ') || 'empty'}${got.problem ? ` (${got.problem})` : ''}.`);
      }
      if (e.output) {
        const got = st.output;
        if (got.length !== e.output.length || got.some((v, k) => v !== String(e.output[k]))) add(`Expected the output “${e.output.join(' ') || '(nothing)'}”, but it printed “${got.join(' ') || '(nothing)'}”.`, got.length > e.output.length ? 'circular-lap' : 'wrong-result');
      }
      for (const [k, want] of Object.entries(e.vars || {})) {
        const got = globalVal(st, k);
        if (got === undefined) add(`${k} was never set (expected ${fmt(st, want)}).`);
        else if (isRef(got) || got !== want) add(`Expected ${k} = ${fmt(st, want)}, but ${k} is ${fmt(st, got)}.`, isRef(got) ? 'value-vs-address' : 'wrong-result');
      }
      if (e.freed) {
        const got = Object.values(st.nodes)
          .filter((n) => n.freed)
          .map((n) => n.data);
        const want = [...e.freed];
        const missing = want.filter((v) => {
          const k = got.indexOf(v);
          if (k < 0) return true;
          got.splice(k, 1);
          return false;
        });
        for (const v of missing) add(`The node with ${show(v)} should be deleted (freed) but it wasn’t.`, 'lost-access');
        for (const v of got) add(`The node with ${show(v)} was deleted, but it should stay.`, 'free-before-unlink');
      }
      // structural problems with the final state (broken links, leaks, dangling roots…)
      for (const is of x.issues.filter((is) => is.step === x.steps.length - 1 && is.severity === 'warning')) {
        if (is.title === 'Memory leak' && e.freed) continue; // already reported as "should be deleted"
        if (problems.some((p) => p.text.includes(is.message))) continue;
        add(`${is.title}: ${is.message}`, is.tag);
      }
    }
    const lostIssue = x.issues.find((is) => is.title === 'Lost reference');
    tests.push({
      name: t.name || `Test ${i + 1}`,
      setupText: describeSetup(setup),
      setup,
      pass: !problems.length,
      problems,
      got: structureText(st),
      output: st.output,
      why: lostIssue && !problems.every((p) => p.tag === 'runtime') ? `Line ${lostIssue.line}: ${lostIssue.message}` : null,
    });
  }
  const failed = tests.find((t) => !t.pass);
  // a lost reference is the root cause of most symptoms that follow it
  return { syntax: null, passed: !failed, tests, tag: failed ? (failed.why ? 'lost-access' : failed.problems[0].tag) : null };
}
