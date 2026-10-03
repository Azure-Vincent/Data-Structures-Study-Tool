// Step recorder shared by every simulated algorithm.
// An algorithm mutates `t.state` and calls `t.step(...)` after every
// meaningful action. Each step stores a full snapshot, so the player can
// step back without having to "undo" anything.

export const COUNTER_LABELS = {
  comparisons: 'comparisons (conditions tested)',
  moves: 'pointer moves (p = p->next)',
  linkWrites: 'link writes (x->next = ...)',
  varWrites: 'pointer variable writes',
  allocs: 'allocations (malloc)',
  frees: 'deallocations (free)',
  visits: 'nodes visited',
  arrayReads: 'array reads',
  arrayWrites: 'array writes',
  shifts: 'element shifts',
  calls: 'function calls',
  neighborChecks: 'neighbour checks',
};

export class Tracer {
  /**
   * @param {object} state  initial state (will be cloned)
   * @param {object} code   {title, lines:[string], cpp?:string, notesRef?:string}
   */
  constructor(state, code) {
    this.state = JSON.parse(JSON.stringify(state));
    this.code = code;
    this.steps = [];
    this.counters = {};
    this.output = [];
    this.result = undefined;
    this.error = null;
    this._predict = null;
    this.step(-1, 'start', 'Initial state, before the first line runs.');
  }

  count(name, by = 1) {
    this.counters[name] = (this.counters[name] || 0) + by;
  }

  /** Attach a prediction question to the NEXT recorded step (asked before it is shown). */
  predict(q) {
    this._predict = q;
  }

  step(line, kind, explain, hl = {}) {
    const s = {
      line,
      kind,
      explain,
      hl,
      state: JSON.parse(JSON.stringify(this.state)),
      counters: { ...this.counters },
      output: [...this.output],
    };
    if (this._predict) {
      s.predict = this._predict;
      this._predict = null;
    }
    this.steps.push(s);
    return s;
  }

  fail(line, message) {
    this.error = message;
    this.step(line, 'error', message, { error: true });
  }

  finish(explain = 'Operation finished.', result) {
    if (result !== undefined) this.result = result;
    this.step(-1, 'end', explain);
    return this.toTrace();
  }

  toTrace() {
    return {
      code: this.code,
      steps: this.steps,
      result: this.result,
      error: this.error,
      final: this.steps[this.steps.length - 1].state,
      counters: { ...this.counters },
      output: [...this.output],
    };
  }
}

/** Replays a trace one step at a time; UI-agnostic. */
export class Player {
  constructor(trace, onChange) {
    this.trace = trace;
    this.index = 0;
    this.playing = false;
    this.speed = 1; // steps per second multiplier
    this.onChange = onChange || (() => {});
    this.timer = null;
    this.gate = null; // function(step) -> true if we must stop before showing it (prediction)
  }
  get step() {
    return this.trace.steps[this.index];
  }
  get atEnd() {
    return this.index >= this.trace.steps.length - 1;
  }
  get atStart() {
    return this.index === 0;
  }
  setTrace(trace) {
    this.pause();
    this.trace = trace;
    this.index = 0;
    this.onChange(this);
  }
  /** Returns false when blocked by a prediction gate. */
  forward() {
    if (this.atEnd) {
      this.pause();
      return false;
    }
    const next = this.trace.steps[this.index + 1];
    if (this.gate && this.gate(next, this.index + 1)) {
      this.pause();
      return false;
    }
    this.index++;
    this.onChange(this);
    if (this.atEnd) this.pause();
    return true;
  }
  back() {
    if (this.index > 0) {
      this.index--;
      this.onChange(this);
    }
  }
  reset() {
    this.pause();
    this.index = 0;
    this.onChange(this);
  }
  goto(i) {
    this.index = Math.max(0, Math.min(i, this.trace.steps.length - 1));
    this.onChange(this);
  }
  delay() {
    return Math.max(120, 1100 / this.speed);
  }
  play() {
    if (this.atEnd) this.index = 0;
    this.playing = true;
    this.onChange(this);
    const tick = () => {
      if (!this.playing) return;
      const moved = this.forward();
      if (moved && this.playing) this.timer = setTimeout(tick, this.delay());
    };
    this.timer = setTimeout(tick, this.delay());
  }
  pause() {
    const was = this.playing;
    this.playing = false;
    clearTimeout(this.timer);
    if (was) this.onChange(this);
  }
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }
}
