// Building blocks for exercise templates: option shuffling and deterministic
// checkers. Every checker returns
//   { correct, message, tag?, detail?, expected? }
// where `tag` names a recurring mistake for the progress tracker.
import { run, parse, InterpError, show } from '../core/interp.js';
import { compareToGoal, diagnoseHistory, applyAction } from '../core/invariants.js';
import { clone, walk, forwardField, fmtPtr, lostNodes } from '../core/pointerWorld.js';

export function opts(rng, list) {
  // list: [{text, correct?, why?, tag?}]
  const shuffled = rng.shuffle(list.map((o, i) => ({ ...o, id: 'o' + i })));
  return shuffled;
}

export function mcq(options, { explain = '' } = {}) {
  const right = options.find((o) => o.correct);
  return {
    kind: 'mcq',
    options: options.map(({ id, text }) => ({ id, text })),
    answer: right.id,
    check(resp) {
      const o = options.find((x) => x.id === resp);
      if (!o) return { correct: false, message: 'Choose one option.' };
      if (o.correct) return { correct: true, message: [o.why, explain].filter(Boolean).join(' ') };
      return { correct: false, message: `${o.why || 'Not this one.'} ${explain}`.trim(), tag: o.tag, expected: right.text };
    },
    solutionText: `Answer: ${right.text}. ${right.why || ''} ${explain}`.trim(),
  };
}

export function multi(options, { explain = '' } = {}) {
  const want = options.filter((o) => o.correct).map((o) => o.id);
  return {
    kind: 'multi',
    options: options.map(({ id, text }) => ({ id, text })),
    answer: want,
    check(resp) {
      const got = new Set(resp || []);
      const missing = options.filter((o) => o.correct && !got.has(o.id));
      const extra = options.filter((o) => !o.correct && got.has(o.id));
      if (!missing.length && !extra.length) return { correct: true, message: explain };
      const parts = [];
      if (missing.length) parts.push(`Missing: ${missing.map((o) => `“${o.text}”${o.why ? ` — ${o.why}` : ''}`).join('; ')}.`);
      if (extra.length) parts.push(`Should not be selected: ${extra.map((o) => `“${o.text}”${o.why ? ` — ${o.why}` : ''}`).join('; ')}.`);
      const tag = (extra[0] || missing[0]).tag;
      return { correct: false, message: parts.join(' ') + (explain ? ' ' + explain : ''), tag };
    },
    solutionText: `Correct choices: ${options.filter((o) => o.correct).map((o) => o.text).join(', ') || 'none'}. ${explain}`,
  };
}

export function numeric(answer, { explain = '', wrong = {}, unit = '', accept = [] } = {}) {
  return {
    kind: 'numeric',
    answer,
    unit,
    check(resp) {
      const s = String(resp ?? '').trim();
      if (/^null$/i.test(s) && (answer === null || accept.includes(null))) return { correct: true, message: explain };
      const x = Number(s);
      if (s === '' || Number.isNaN(x)) return { correct: false, message: answer === null ? 'Type a number, or NULL.' : 'Type a number.' };
      if (x === answer || accept.includes(x)) return { correct: true, message: explain };
      const w = wrong[x];
      return { correct: false, message: `${w ? w.msg : `Not ${x}.`} ${explain}`.trim(), tag: w && w.tag, expected: String(answer) };
    },
    solutionText: `Answer: ${answer === null ? 'NULL' : answer}${unit ? ' ' + unit : ''}. ${explain}`,
  };
}

/** Several numeric fields at once, e.g. F and R. fields: [{id,label,answer}] */
export function fields(list, { explain = '', why = () => '' } = {}) {
  const show = (a) => (Array.isArray(a) ? a.join(' ') || '(nothing)' : String(a));
  const ok = (f, raw) => {
    const s = String(raw ?? '').trim();
    if (Array.isArray(f.answer)) {
      const got = tokens(s).filter((x) => !/^(none|nothing|empty)$/i.test(x));
      return got.length === f.answer.length && got.every((x, i) => x.toUpperCase() === String(f.answer[i]).toUpperCase());
    }
    return s !== '' && Number(s) === f.answer;
  };
  return {
    kind: 'fields',
    fields: list.map(({ id, label, answer }) => ({ id, label, seq: Array.isArray(answer) })),
    answer: Object.fromEntries(list.map((f) => [f.id, Array.isArray(f.answer) ? f.answer.join(' ') : f.answer])),
    check(resp) {
      const bad = list.filter((f) => !ok(f, resp?.[f.id]));
      if (!bad.length) return { correct: true, message: explain };
      return { correct: false, message: `${bad.map((f) => `${f.label} should be ${show(f.answer)}${f.why ? ` (${f.why})` : ''}`).join('; ')}. ${why(resp)} ${explain}`.trim(), tag: (bad.find((f) => f.tag) || {}).tag };
    },
    solutionText: list.map((f) => `${f.label} = ${show(f.answer)}`).join(', ') + '. ' + explain,
  };
}

export function tokens(s) {
  return String(s ?? '')
    .split(/[^A-Za-z0-9\-]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** A typed sequence like "10 20 30" or "A, B, C". */
export function sequenceText(answer, { explain = '', diagnose } = {}) {
  const want = answer.map(String);
  return {
    kind: 'text',
    answer: want,
    placeholder: 'e.g. ' + (want.slice(0, 3).join(' ') || '(empty)'),
    check(resp) {
      const got = tokens(resp).map((x) => (/^empty$|^none$/i.test(x) ? null : x)).filter((x) => x !== null);
      if (got.length === want.length && got.every((x, i) => x.toUpperCase() === want[i].toUpperCase())) return { correct: true, message: explain };
      const d = diagnose ? diagnose(got) : null;
      let i = 0;
      while (i < got.length && i < want.length && got[i].toUpperCase() === want[i].toUpperCase()) i++;
      const where = i < want.length ? `The first ${i} item(s) are right; position ${i + 1} should be ${want[i]}${got[i] ? `, not ${got[i]}` : ''}.` : `You listed extra items after ${want.join(' ')}.`;
      return { correct: false, message: `${d ? d.msg + ' ' : ''}${where} ${explain}`.trim(), tag: d && d.tag, expected: want.join(' ') || '(empty)' };
    },
    solutionText: `Answer: ${want.join(' ') || '(empty)'}. ${explain}`,
  };
}

/** Click nodes in order on a visual. */
export function sequenceClick(answer, { explain = '', diagnose, frontierAt } = {}) {
  const want = answer.map(String);
  return {
    kind: 'sequence',
    answer: want,
    frontierAt, // (prefixLength) -> {label, items} shown while clicking (guidance)
    check(resp) {
      const got = (resp || []).map(String);
      if (got.length === want.length && got.every((x, i) => x === want[i])) return { correct: true, message: explain };
      let i = 0;
      while (i < got.length && got[i] === want[i]) i++;
      const d = diagnose ? diagnose(got, i) : null;
      const where = i < want.length ? `Your first ${i} click(s) were right; next should be ${want[i]}${got[i] ? `, not ${got[i]}` : ''}.` : 'You clicked more nodes than the traversal visits.';
      return { correct: false, message: `${d ? d.msg + ' ' : ''}${where} ${explain}`.trim(), tag: d && d.tag, expected: want.join(' ') };
    },
    solutionText: `Order: ${want.join(' → ')}. ${explain}`,
  };
}

/** Select a set of nodes on a visual. allowNone: show a "none" button. */
export function nodePick(answer, { explain = '', allowNone = true, why = () => '' } = {}) {
  const want = new Set(answer.map(String));
  return {
    kind: 'nodepick',
    answer: [...want],
    allowNone,
    check(resp) {
      const got = new Set((resp || []).map(String));
      const missing = [...want].filter((x) => !got.has(x));
      const extra = [...got].filter((x) => !want.has(x));
      if (!missing.length && !extra.length) return { correct: true, message: explain };
      return {
        correct: false,
        message: `${missing.length ? `Missing: ${missing.join(', ')}. ` : ''}${extra.length ? `Not part of the answer: ${extra.join(', ')}. ` : ''}${why(missing, extra)} ${explain}`.trim(),
        tag: 'relation',
        expected: [...want].join(', ') || 'none',
      };
    },
    solutionText: `Answer: ${[...want].join(', ') || 'none'}. ${explain}`,
  };
}

// ------------------------------------------------------------------ code-based checkers

/**
 * Order pseudocode lines. items: [{id, code}] (code is runnable statement text).
 * cases: [{world, goal, opts:{head,lastVar,locals,newAddrs}, newValue, expectOutput?}]
 * reference: correct id order (for the solution).
 */
export function orderCode(items, cases, reference, { explain = '' } = {}) {
  return {
    kind: 'order',
    items: items.map(({ id, code, label }) => ({ id, text: label || code })),
    answer: reference,
    check(resp) {
      const ids = resp && resp.length ? resp : items.map((i) => i.id);
      const src = ids.map((id) => items.find((i) => i.id === id).code).join('\n');
      for (const c of cases) {
        const verdict = runAgainst(src, c);
        if (!verdict.correct) {
          return { ...verdict, message: `${verdict.message}${cases.length > 1 && c.label ? ` (test: ${c.label})` : ''}` };
        }
      }
      const same = ids.join() === reference.join();
      return { correct: true, message: `${same ? '' : 'Your order differs from the lecture order but it is equally valid — the simulator verified it on every test list. '}${explain}`.trim() };
    },
    solutionText: `${reference.map((id) => items.find((i) => i.id === id).label || items.find((i) => i.id === id).code).join('\n')}\n${explain}`,
  };
}

/** Run a program text on a test case and compare with the expected goal world. */
export function runAgainst(src, c) {
  let r;
  try {
    r = run(c.world, src, { newValue: c.newValue, maxSteps: c.maxSteps });
  } catch (e) {
    if (e instanceof InterpError) return { correct: false, message: `Could not read that: ${e.message}. Write C-style statements such as temp->next = newnode;`, tag: 'syntax' };
    throw e;
  }
  if (r.error) {
    return { correct: false, message: `Running it on ${describeCase(c)}: ${r.error.message}`, tag: r.error.kind === 'loop' ? 'infinite-loop' : 'null-deref' };
  }
  if (r.lost.length) {
    const l = r.lost[0];
    const names = l.addrs.map((a) => `${a} (data ${r.world.nodes[a]?.data})`).join(', ');
    // ok only if the goal ALSO drops these nodes and frees them later — lost nodes can never be freed, so always an error
    return { correct: false, message: `Running it on ${describeCase(c)}: after "${stmtText(l.stmt)}" nothing points to ${names} any more — access lost (and those nodes can never be freed). Save the address first, or change the order.`, tag: 'lost-access' };
  }
  if (c.expectOutput) {
    const got = r.output.join(' ');
    const want = c.expectOutput.join(' ');
    if (got !== want) return { correct: false, message: `On ${describeCase(c)} it prints "${got}" but should print "${want}".`, tag: 'traversal-output' };
  }
  if (c.goal) {
    const cmp = compareToGoal(r.world, c.goal, { ...(c.opts || {}), newAddrs: c.opts?.newAddrs || [] });
    if (!cmp.correct) {
      const msg = [...cmp.problems.map((p) => p.message), ...cmp.issues][0];
      const tag = cmp.problems[0]?.code === 'back-link' || cmp.problems[0]?.code === 'back-first' ? 'back-link' : cmp.problems[0]?.code === 'broken-circle' ? 'circle-not-closed' : cmp.problems[0]?.code === 'lost' ? 'leak' : 'wrong-result';
      return { correct: false, message: `On ${describeCase(c)}: ${msg}`, tag };
    }
  }
  return { correct: true, message: '', output: r.output };
}

function describeCase(c) {
  if (c.label) return c.label;
  const head = c.opts?.head || 'start';
  const vals = walk(c.world, c.world.vars[head], forwardField(c.world.kind)).values;
  return vals.length ? `the list ${vals.join(' → ')}` : 'an empty list';
}

function stmtText(s) {
  if (s.t === 'assign') return `${s.targets.map(show).join(' = ')} = ${show(s.rhs)}`;
  if (s.t === 'free') return `free(${show(s.e)})`;
  return s.t;
}

/**
 * Fill a blank in a code template. template contains ____ once.
 * kind: 'stmt' or 'cond'. cases as in runAgainst. accept: quick-accept strings (normalised).
 */
export function fillCode(template, cases, model, { explain = '', placeholder = '' } = {}) {
  return {
    kind: 'fill',
    template,
    answer: model,
    placeholder,
    check(resp) {
      const ans = String(resp ?? '').trim().replace(/;\s*$/, '');
      if (!ans) return { correct: false, message: 'Type the missing code.' };
      const src = template.replace('____', ans);
      try {
        parse(src);
      } catch (e) {
        return { correct: false, message: `Could not read “${ans}”: ${e.message}. Use C syntax, e.g. ${model}.`, tag: 'syntax' };
      }
      for (const c of cases) {
        const v = runAgainst(src, c);
        if (!v.correct) return v;
      }
      return { correct: true, message: `${ans.replace(/\s+/g, '') === model.replace(/\s+/g, '') ? '' : `Accepted — it behaves the same as the model answer “${model}” on every test case. `}${explain}`.trim() };
    },
    solutionText: `${model}\n${explain}`,
  };
}

/**
 * Rewire exercise: the learner edits pointers directly.
 * spec: { world, goal, opts:{head,lastVar,locals}, newValue?, vars:[...], newAddr }
 */
export function rewire(spec, { explain = '' } = {}) {
  return {
    kind: 'rewire',
    world: spec.world,
    goal: spec.goal,
    newValue: spec.newValue,
    opts: spec.opts || {},
    vars: spec.vars,
    answer: spec.reference || null,
    check(actions) {
      const acts = actions || [];
      const dg = diagnoseHistory(spec.world, acts, { ...(spec.opts || {}), locals: spec.opts?.locals || [] });
      if (dg && !dg.final) return { correct: false, message: dg.message, tag: tagFor(dg.code), firstBad: dg.index, nodes: dg.nodes };
      const w = clone(spec.world);
      for (const a of acts) {
        const r = applyAction(w, a);
        if (!r.ok) return { correct: false, message: r.error, tag: 'invalid' };
      }
      const cmp = compareToGoal(w, spec.goal, { ...(spec.opts || {}), newAddrs: newAddrsOf(spec.world, w) });
      if (cmp.correct) {
        const ff = forwardField(w.kind);
        const fwd = walk(w, w.vars[spec.opts?.head || 'start'], ff).values;
        let check = `Check: forward ${fwd.join(' → ') || '(empty)'}`;
        if (w.kind === 'dll' && fwd.length) {
          const r = walk(w, w.vars[spec.opts?.head || 'start'], 'right');
          check += `; backward ${walk(w, r.addrs[r.addrs.length - 1], 'left').values.join(' → ')}`;
        }
        return { correct: true, message: `${check}. ${explain}`.trim() };
      }
      const first = cmp.problems[0];
      const msg = dg ? dg.message : first ? first.message : cmp.issues[0];
      return { correct: false, message: msg, tag: tagFor(dg?.code || first?.code || 'wrong-result'), firstBad: dg?.index, nodes: dg?.nodes || first?.nodes };
    },
    solutionText: explain,
  };
}

function newAddrsOf(before, after) {
  return Object.keys(after.nodes).map(Number).filter((a) => !before.nodes[a]);
}

export function tagFor(code) {
  return (
    {
      lost: 'lost-access',
      'use-lost': 'lost-access',
      'free-linked': 'free-before-unlink',
      'dangling-var': 'dangling',
      'dangling-link': 'dangling',
      cycle: 'cycle',
      'back-link': 'back-link',
      'back-first': 'back-link',
      'broken-circle': 'circle-not-closed',
      'bad-cycle': 'circle-not-closed',
      'last-var': 'tail-rear',
      garbage: 'uninitialised',
    }[code] || 'wrong-result'
  );
}

export const reflect = (prompt) => ({ prompt, ungraded: true });

export { clone, walk, fmtPtr, lostNodes };

/** Assign option ids without shuffling (for naturally ordered lists). */
export function keep(list) {
  return list.map((o, i) => ({ ...o, id: 'o' + i }));
}
