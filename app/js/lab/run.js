// Drives one run of a program: steps the interpreter lazily, keeps a snapshot
// of the real interpreter state after every step (for Step back / history),
// enforces the instruction limit and collects issues. No DOM.
import { parse, LabError } from './lang.js';
import { Machine } from './machine.js';
import { buildInitial, describeSetup } from './structures.js';
import { stepIssues, finalIssues, lostAddrs, structureText } from './analysis.js';

export const DEFAULT_LIMIT = 2000;
export const LIMITS = [500, 2000, 10000];

const snap = (st) => JSON.parse(JSON.stringify(st));

export class Execution {
  /**
   * opts: { limit, record } — record:false skips snapshots (used for grading).
   */
  constructor(code, setup, { limit = DEFAULT_LIMIT, record = true } = {}) {
    this.code = code;
    this.setup = setup;
    this.limit = limit;
    this.record = record;
    this.steps = [];
    this.issues = []; // {step, ...issue}
    this.index = 0;
    this.done = false;
    this.error = null;
    this.syntax = null;
    this.stopped = false;
    this.count = 0;
    const { state, graph } = buildInitial(setup);
    this.graph = graph;
    this.state = state;
    try {
      this.program = parse(code);
    } catch (e) {
      if (!(e instanceof LabError)) throw e;
      this.syntax = e;
      this.done = true;
    }
    this.steps.push({ kind: 'start', line: null, text: `Start: ${describeSetup(setup)}. ${this.syntax ? 'Fix the syntax error to run the program.' : 'Press Step to run the first line.'}`, hl: {}, state: snap(state), issues: [] });
    if (this.syntax) this.addIssue(0, { severity: 'error', category: 'syntax', title: 'Syntax error', message: this.syntax.message, hint: this.syntax.hint, line: this.syntax.line, col: this.syntax.col, tag: 'syntax' });
    if (!this.syntax) {
      this.machine = new Machine(this.program, state, { graph });
      this.gen = this.machine.run();
      this.lost = lostAddrs(state);
      this.prevSnap = record ? null : snap(state);
    }
  }

  addIssue(step, issue) {
    const full = { step, ...issue };
    this.issues.push(full);
    if (this.steps[step]) this.steps[step].issues.push(full);
    return full;
  }

  get current() {
    return this.steps[this.index];
  }
  get atStart() {
    return this.index === 0;
  }
  get atEnd() {
    return this.done && this.index === this.steps.length - 1;
  }
  /** Number of executed instructions (events) so far. */
  get executed() {
    return this.count;
  }

  /** Compute one more step of the program. Returns false when finished. */
  advance() {
    if (this.done) return false;
    if (this.executed >= this.limit) {
      this.fail(new LabError('runtime', `Stopped after ${this.limit.toLocaleString()} steps — the instruction limit.`, { line: this.steps[this.steps.length - 1].line, hint: 'This usually means a loop never ends. Check that the loop condition eventually becomes false (for example that cur moves with cur = cur.next inside the loop). In a circular list, stop when you get back to start instead of waiting for NULL.', tag: 'infinite-loop' }));
      return true;
    }
    const prev = this.record ? this.steps[this.steps.length - 1].state : this.prevSnap;
    let r;
    try {
      r = this.gen.next();
    } catch (e) {
      if (e instanceof LabError) {
        this.fail(e);
        return true;
      }
      if (e instanceof RangeError) {
        this.fail(new LabError('runtime', 'The program nested too deeply to continue.', { line: this.machine.line, hint: 'Check that recursive calls reach a base case.', tag: 'infinite-loop' }));
        return true;
      }
      // never let an interpreter bug take the page down: report it like a runtime error
      if (typeof console !== 'undefined') console.error(e);
      this.fail(new LabError('runtime', `The lab could not run this line (internal error: ${e && e.message}).`, { line: this.machine.line, hint: 'Try writing the line differently; please report this case.', tag: 'runtime' }));
      return true;
    }
    if (r.done) {
      this.finish();
      return true;
    }
    const ev = r.value;
    this.count++;
    const now = snap(this.state);
    const step = { ...ev, state: this.record ? now : null, issues: [] };
    this.steps.push(step);
    const idx = this.steps.length - 1;
    const { issues, lost } = stepIssues(prev, now, ev, this.lost);
    this.lost = lost;
    for (const is of issues) this.addIssue(idx, is);
    if (!this.record) this.prevSnap = now;
    return true;
  }

  fail(err) {
    this.error = err;
    this.done = true;
    this.steps.push({ kind: 'error', line: err.line, text: err.message, hint: err.hint, hl: {}, state: this.record ? snap(this.state) : null, issues: [] });
    this.addIssue(this.steps.length - 1, { severity: 'error', category: 'runtime', title: err.tag === 'infinite-loop' ? 'Execution limit' : 'Runtime error', message: err.message, hint: err.hint, line: err.line, col: err.col, tag: err.tag || 'runtime' });
    this.finalState = this.state;
  }

  finish() {
    this.done = true;
    this.finalState = this.state;
    const issues = finalIssues(this.state);
    this.steps.push({ kind: 'end', line: null, text: `Program finished after ${this.executed} step${this.executed === 1 ? '' : 's'}. Result: ${structureText(this.state)}.`, hl: {}, state: this.record ? snap(this.state) : null, issues: [] });
    for (const is of issues) this.addIssue(this.steps.length - 1, is);
  }

  /** Stop the program for good (unlike pause). */
  stop() {
    if (this.done) return;
    this.done = true;
    this.stopped = true;
    this.finalState = this.state;
    this.steps.push({ kind: 'stopped', line: this.steps[this.steps.length - 1].line, text: `Stopped by you after ${this.executed} step${this.executed === 1 ? '' : 's'}. Reset to run again.`, hl: {}, state: this.record ? snap(this.state) : null, issues: [] });
    this.index = this.steps.length - 1;
  }

  forward() {
    if (this.index < this.steps.length - 1) {
      this.index++;
      return true;
    }
    if (this.done) return false;
    this.advance();
    if (this.index < this.steps.length - 1) this.index++;
    return true;
  }
  back() {
    if (this.index === 0) return false;
    this.index--;
    return true;
  }
  goto(i) {
    this.index = Math.max(0, Math.min(i, this.steps.length - 1));
  }
  reset() {
    this.index = 0;
  }
  runToEnd() {
    while (!this.done) this.advance();
    this.index = this.steps.length - 1;
    return this;
  }

  /** Issues found at or before the current step. */
  issuesUpTo(i = this.index) {
    return this.issues.filter((x) => x.step <= i);
  }
}

/** Convenience: run headless to the end. */
export function runAll(code, setup, opts = {}) {
  return new Execution(code, setup, { record: false, ...opts }).runToEnd();
}
