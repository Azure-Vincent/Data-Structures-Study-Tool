// Exercises built from the "Build it in code" programs (content/impl) and the
// guided Pseudocode Lab exercises. For every lecture they form a progression:
//   1. predict  — read a complete program (C++, Python or pseudocode) and
//                 predict exactly what it prints;
//   2. complete — one statement of an operation is missing: pick the right one
//                 (shown in the language the learner has chosen);
//   3. write    — write the operation yourself in pseudocode; it is run and
//                 graded on several starting structures (incl. empty / one node).
// The program output comes from actually running the pseudocode in the Lab
// interpreter; tests/langs/verify.mjs proves C++ and Python print the same.
import { IMPLEMENTATIONS, IMPL_BY_ID } from '../content/impl/index.js';
import { compileExample, linesWithLabels } from '../content/impl/format.js';
import { runAll } from '../lab/run.js';
import { checkExercise } from '../lab/check.js';
import { EXERCISES as LAB_EXERCISES, EXERCISE_BY_ID as LAB_BY_ID } from '../lab/exercises.js';
import { MISTAKE_LABELS } from '../content/concepts.js';
import { describeSetup } from '../lab/structures.js';

/** The topic each program practises. */
export const IMPL_CONCEPT = {
  'array-shift': 'l07.arrays-vs-lists',
  'sll-create': 'l08.node-anatomy',
  'sll-insert-beg': 'l08.insert-beg',
  'sll-insert-end': 'l08.insert-end',
  'sll-insert-pos': 'l08.insert-mid',
  'sll-delete-beg': 'l09.delete-beg',
  'sll-delete-end': 'l09.delete-end',
  'sll-delete-pos': 'l09.delete-mid',
  'dll-create': 'l10.dll-links',
  'dll-insert-beg': 'l10.dll-insert',
  'dll-insert-end': 'l10.dll-insert',
  'dll-insert-pos': 'l10.dll-insert',
  'dll-delete-beg': 'l10.dll-delete',
  'dll-delete-end': 'l10.dll-delete',
  'dll-delete-pos': 'l10.dll-delete',
  'dll-countnode': 'l10.countnode',
  'csll-create': 'l11.circular-links',
  'csll-insert-beg': 'l11.csll-insert',
  'csll-insert-end': 'l11.csll-insert',
  'csll-delete-beg': 'l11.csll-delete',
  'csll-delete-end': 'l11.csll-delete',
  'stack-array': 'l12.array-stack',
  'stack-linked': 'l12.linked-stack',
  'stack-linked-end': 'l12.linked-stack',
  'queue-array': 'l12.array-queue',
  'queue-linked': 'l12.linked-queue',
  'tree-create': 'l13.tree-terms',
  'tree-array': 'l13.tree-repr',
  'graph-matrix': 'l13.graph-repr',
  'graph-adjlist': 'l13.graph-repr',
  'tree-traversals': 'l14.tree-traversal',
  'tree-inorder-stack': 'l14.tree-traversal',
  'graph-bfs': 'l14.bfs',
  'graph-dfs': 'l14.dfs',
};

const LANGS = ['cpp', 'py', 'pseudo'];

// ---------------------------------------------------------------- program text helpers

/** A program without the setup machinery (build/destroy helpers), for reading. */
export function readableProgram(prog, lang, setupText) {
  const out = [];
  const { lines, labels } = prog;
  for (let i = 0; i < lines.length; i++) {
    if (labels[i].includes('setup')) {
      // keep one comment instead of the setup call inside main
      if (/\{\{build\}\}|build\(/.test(lines[i]) && setupText) out.push(`${lines[i].match(/^\s*/)[0]}${lang === 'cpp' ? '//' : '#'} (setup: ${setupText})`);
      continue;
    }
    // drop the comment block that introduces a setup helper
    if (/^\s*(\/\/|#)/.test(lines[i])) {
      let j = i;
      while (j < lines.length && /^\s*(\/\/|#)/.test(lines[j]) && !labels[j].length) j++;
      if (j < lines.length && labels[j].includes('setup') && !/build\(/.test(lines[j])) {
        i = j - 1;
        continue;
      }
    }
    out.push(lines[i]);
  }
  // collapse runs of blank lines
  return out.filter((l, k) => !(l.trim() === '' && (k === 0 || out[k - 1].trim() === ''))).join('\n').replace(/\n+$/, '');
}

/** Lines [from, to] of the function that contains line `at` (or null when `at` is in the main part). */
function functionAround(prog, lang, at) {
  const { lines, labels } = prog;
  for (let i = at; i >= 0; i--) {
    const head = labels[i].find((l) => /^f[a-z]*$/.test(l));
    if (!head) continue;
    let end = -1;
    if (lang === 'py') {
      const ind = lines[i].match(/^\s*/)[0].length;
      end = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue;
        if (lines[j].match(/^\s*/)[0].length <= ind) break;
        end = j;
      }
    } else {
      for (let j = i + 1; j < lines.length; j++) if (labels[j].includes(`${head}_end`)) { end = j; break; }
    }
    return end >= at ? [i, end] : null;
  }
  return null;
}

/** The function holding `label`, with that statement replaced by a gap. */
export function gapCode(prog, lang, label) {
  const at = linesWithLabels(prog, [label])[0];
  const range = functionAround(prog, lang, at);
  const [from, to] = range || [0, prog.lines.length - 1];
  const out = [];
  for (let i = from; i <= to; i++) {
    if (prog.labels[i].includes('setup')) continue;
    out.push(i === at ? `${prog.lines[i].match(/^\s*/)[0]}____  ${lang === 'py' || lang === 'pseudo' ? '#' : '//'} the missing statement` : prog.lines[i]);
  }
  return out.join('\n');
}

/** The statement carrying `label` in one language (trimmed). */
export function statementOf(prog, label) {
  return prog.lines[linesWithLabels(prog, [label])[0]].trim().replace(/\s+(\/\/|#)\s.*$/, '');
}

const outputTokens = (lines) => lines.map(String).join(' ').split(/\s+/).filter(Boolean);
const norm = (s) => String(s).trim().toLowerCase();

// ---------------------------------------------------------------- 1. predict the output

function predictExercise(rng, implId) {
  const ex = IMPL_BY_ID[implId];
  // a case that prints something; numeric parameters vary for fresh variations
  const cases = ex.cases.map((c, i) => i).filter((i) => {
    const p = compileExample(ex, i);
    const r = runAll(p.pseudo.text, p.setup, { limit: 20000 });
    return r.state.output.length > 0;
  });
  const ci = rng.pick(cases);
  const c = ex.cases[ci];
  const params = {};
  const vary = ex.vary || (typeof ex.params?.x === 'number' ? ['x'] : []);
  const used = new Set((c.setup?.values || []).map(Number));
  for (const k of vary) {
    if (c.params && k in c.params) continue;
    let v;
    do v = rng.int(1, 99);
    while (used.has(v));
    used.add(v);
    params[k] = v;
  }
  const prog = compileExample(ex, ci, params);
  const run = runAll(prog.pseudo.text, prog.setup, { limit: 20000 });
  const out = run.state.output.map(String);
  const start = describeSetup(prog.setup);
  const variants = Object.fromEntries(LANGS.map((l) => [l, readableProgram(prog[l], l, ex.structure === 'arrays' || ex.structure === 'graph' ? '' : start)]));
  const answer = outputTokens(out);
  return {
    kind: 'text',
    concept: IMPL_CONCEPT[implId],
    title: `Predict the output: ${ex.title.charAt(0).toLowerCase()}${ex.title.slice(1)}`,
    prompt: `Read the program (switch between C++, Python and pseudocode — they print exactly the same) and write down **everything it prints**, in order, separated by spaces.${ex.structure === 'arrays' ? '' : `\n\nStarting structure: **${start}**.`}`,
    placeholder: 'the printed values, separated by spaces',
    visual: { type: 'langcode', variants },
    answer,
    params: { impl: implId, case: ci, ...params },
    edge: /empty|one|single|leaf|root|overflow|full/i.test(c.label || ''),
    check(resp) {
      const got = String(resp || '').split(/\s+/).filter(Boolean).map(norm);
      const want = answer.map(norm);
      if (got.length === want.length && got.every((t, k) => t === want[k])) return { correct: true, message: `It prints:\n${out.join('\n')}` };
      const k = got.findIndex((t, i) => t !== want[i]);
      const first = k < 0 ? Math.min(got.length, want.length) : k;
      return {
        correct: false,
        tag: 'wrong-result',
        message: `The first ${first} value${first === 1 ? '' : 's'} match${first === 1 ? 'es' : ''}; then it goes wrong. ${got.length < want.length ? 'The program prints more than that. ' : got.length > want.length ? 'The program prints less than that. ' : ''}Step through the walkthrough to watch each print happen.`,
      };
    },
    hints: [
      ex.intro.replace(/`/g, ''),
      `Follow the main part from the top: it calls ${(prog.pseudo.lines.filter((l, i) => prog.pseudo.labels[i].some((x) => /^m\d+$/.test(x))).map((l) => l.trim().replace(/\s+#.*$/, '')).slice(0, 3).join('; '))}${prog.pseudo.labels.filter((ls) => ls.some((x) => /^m\d+$/.test(x))).length > 3 ? '; …' : ''}.`,
      `The output starts with: ${out.slice(0, Math.max(1, Math.ceil(out.length / 3))).join(' ')} …`,
    ],
    solutionText: `Output:\n${out.join('\n')}\n\nOpen the "Build it in code" walkthrough of this program to see every step.`,
  };
}

// ---------------------------------------------------------------- 2. complete the missing statement

function completeExercise(rng, implId, blankLabel) {
  const ex = IMPL_BY_ID[implId];
  const blank = blankLabel ? ex.blanks.find((b) => b.label === blankLabel) : rng.pick(ex.blanks);
  const prog = compileExample(ex, 0);
  const variants = Object.fromEntries(LANGS.map((l) => [l, gapCode(prog[l], l, blank.label)]));
  const right = Object.fromEntries(LANGS.map((l) => [l, statementOf(prog[l], blank.label)]));
  const opts = [{ id: 'ok', langs: right, text: right.pseudo }, ...blank.wrong.map((w, k) => ({ id: `w${k}`, langs: { cpp: w.cpp, py: w.py, pseudo: w.pseudo }, text: w.pseudo, why: w.why, tag: w.tag }))];
  const options = rng.shuffle(opts).map(({ id, langs, text }) => ({ id, langs, text }));
  const start = ex.structure === 'arrays' || ex.structure === 'graph' ? '' : `\n\nFor example, starting from **${describeSetup(prog.setup)}**.`;
  return {
    kind: 'mcq',
    concept: IMPL_CONCEPT[implId],
    title: `Complete the code: ${ex.title.charAt(0).toLowerCase()}${ex.title.slice(1)}`,
    prompt: `One statement is missing (____). Which one completes the code? The options are shown in the language you have chosen for code.${start}`,
    visual: { type: 'langcode', variants },
    options,
    answer: 'ok',
    params: { impl: implId, blank: blank.label },
    edge: false,
    check(resp) {
      if (resp === 'ok') return { correct: true, message: blank.why };
      const w = opts.find((o) => o.id === resp);
      if (!w) return { correct: false, tag: null, message: 'Pick one of the statements.' };
      return { correct: false, tag: w.tag, message: `${w.why}${MISTAKE_LABELS[w.tag] ? ` (${MISTAKE_LABELS[w.tag]})` : ''}` };
    },
    hints: [ex.intro.replace(/`/g, ''), `What has to be true right after the gap? ${blank.why.split('.')[0]}.`, ex.notes?.[blank.label] ? ex.notes[blank.label].replace(/\*\*/g, '').replace(/`/g, '') : blank.why],
    solutionText: `The missing statement:\n  C++:        ${right.cpp}\n  Python:     ${right.py}\n  Pseudocode: ${right.pseudo}\n\n${blank.why}`,
  };
}

// ---------------------------------------------------------------- 3. write it yourself

function writeExercise(labId) {
  const lab = LAB_BY_ID[labId];
  const impl = lab.impl && IMPL_BY_ID[lab.impl];
  return {
    kind: 'lab',
    concept: lab.concept,
    title: `Write it yourself: ${lab.title.charAt(0).toLowerCase()}${lab.title.slice(1)}`,
    prompt: `${lab.goal}\n\nWrite it in **pseudocode** (the Pseudocode Lab’s syntax). **Check** runs your code on ${lab.tests.length} different starting structures — ${lab.tests.map((t) => t.name.toLowerCase()).join(', ')} — and compares the real result with the goal.`,
    labId,
    structure: lab.structure,
    starter: lab.starter,
    answer: lab.solution,
    implId: impl ? impl.id : null,
    params: { lab: labId },
    edge: lab.tests.some((t) => /empty|single|one/i.test(t.name)),
    check(code) {
      const r = checkExercise(lab, code || '');
      if (r.syntax) return { correct: false, tag: 'syntax', message: `Syntax error on line ${r.syntax.line}: ${r.syntax.message}${r.syntax.hint ? ` ${r.syntax.hint}` : ''}` };
      const n = r.tests.filter((t) => t.pass).length;
      const details = r.tests.map((t) => `${t.pass ? '✓' : '✗'} ${t.name} (${t.setupText})${t.pass ? '' : `: ${t.problems.map((p) => p.text).join(' ')}${t.why ? ` Why: ${t.why}` : ''}`}`);
      if (r.passed) return { correct: true, message: `All ${n} test cases pass.`, details };
      return { correct: false, tag: r.tag, message: `${n} of ${r.tests.length} test cases pass.`, details };
    },
    hints: lab.hints.slice(0, 3),
    solutionText: lab.solution,
  };
}

// ---------------------------------------------------------------- templates, one set per lecture

function byLecture(n) {
  const impls = IMPLEMENTATIONS.filter((x) => x.lecture === n);
  const withBlanks = impls.filter((x) => (x.blanks || []).length);
  const labs = LAB_EXERCISES.filter((x) => x.lecture === n && !x.supplementary);
  const pad = String(n).padStart(2, '0');
  const variantsOf = (list, key) => {
    const v = {};
    for (const x of list) {
      const c = key === 'lab' ? x.concept : IMPL_CONCEPT[x.id];
      if (c && !v[c]) v[c] = { [key]: x.id };
    }
    return v;
  };
  const pickBy = (list, p, key, rng) => (p[key] && list.find((x) => x.id === p[key])) || rng.pick(list);
  const out = [];
  if (impls.length) {
    out.push({
      id: `l${pad}-predict-output`,
      lecture: n,
      concept: IMPL_CONCEPT[impls[0].id],
      conceptBy: (p) => IMPL_CONCEPT[p.impl],
      variants: variantsOf(impls, 'impl'),
      type: 'predict',
      title: 'Predict the output of a program',
      generate(rng, { params = {} } = {}) {
        return predictExercise(rng, pickBy(impls, params, 'impl', rng).id);
      },
    });
  }
  if (withBlanks.length) {
    out.push({
      id: `l${pad}-complete-code`,
      lecture: n,
      concept: IMPL_CONCEPT[withBlanks[0].id],
      conceptBy: (p) => IMPL_CONCEPT[p.impl],
      variants: variantsOf(withBlanks, 'impl'),
      type: 'fill',
      title: 'Complete the missing statement',
      generate(rng, { params = {} } = {}) {
        return completeExercise(rng, pickBy(withBlanks, params, 'impl', rng).id, params.blank);
      },
    });
  }
  if (labs.length) {
    out.push({
      id: `l${pad}-write-code`,
      lecture: n,
      concept: labs[0].concept,
      conceptBy: (p) => LAB_BY_ID[p.lab].concept,
      variants: variantsOf(labs, 'lab'),
      type: 'lab',
      title: 'Write the operation yourself',
      generate(rng, { params = {} } = {}) {
        return writeExercise(pickBy(labs, params, 'lab', rng).id);
      },
    });
  }
  return out;
}

export const IMPL_TEMPLATES = [7, 8, 9, 10, 11, 12, 13, 14].flatMap(byLecture);
