// Progress persistence and mastery model. Pure logic + a storage adapter
// (localStorage in the browser, an in-memory map in tests).
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts.js';
import { migrateProgress, CONTENT_VERSION } from './migrate.js';

export const STORAGE_KEY = 'dslab.progress.v1';
export const SCHEMA_VERSION = 1;
const DAY = 24 * 60 * 60 * 1000;
export const BOX_INTERVALS = [0, 20 * 60 * 1000, DAY, 2 * DAY, 4 * DAY, 8 * DAY, 16 * DAY];

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

export function blankProgress(now = Date.now()) {
  return {
    version: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    createdAt: now,
    updatedAt: now,
    concepts: {},
    types: {},
    templates: {},
    attempts: [],
    mistakes: [],
    lessons: {},
    session: null,
    lab: { drafts: {}, solved: {}, last: null },
    settings: { motion: 'system', speed: 1, timer: false, timerMinutes: 8, theme: 'system', predictMode: true, codeLang: 'cpp' },
  };
}

function conceptRec() {
  return { attempts: 0, correct: 0, independent: 0, hints: 0, revealed: 0, box: 0, due: 0, lastSeen: 0, recent: [], templatesWon: [], introduced: false };
}

export function validate(obj) {
  const errs = [];
  if (!obj || typeof obj !== 'object') return ['not an object'];
  if (obj.version !== SCHEMA_VERSION) errs.push(`unsupported version ${obj.version}`);
  for (const k of ['concepts', 'types', 'lessons', 'settings']) if (typeof obj[k] !== 'object' || obj[k] === null) errs.push(`missing ${k}`);
  for (const k of ['attempts', 'mistakes']) if (!Array.isArray(obj[k])) errs.push(`missing ${k}`);
  return errs;
}

export class ProgressStore {
  constructor(storage, { key = STORAGE_KEY, now = () => Date.now() } = {}) {
    this.storage = storage;
    this.key = key;
    this.now = now;
    this.listeners = new Set();
    this.data = this.load();
  }
  load() {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return blankProgress(this.now());
      const obj = migrateProgress(JSON.parse(raw));
      if (validate(obj).length) return blankProgress(this.now());
      const base = blankProgress(this.now());
      return { ...base, ...obj, settings: { ...base.settings, ...obj.settings } };
    } catch {
      return blankProgress(this.now());
    }
  }
  save() {
    this.data.updatedAt = this.now();
    try {
      this.storage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save progress', e);
    }
    this.listeners.forEach((f) => f(this.data));
  }
  onChange(f) {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  concept(id) {
    if (!this.data.concepts[id]) this.data.concepts[id] = conceptRec();
    return this.data.concepts[id];
  }

  introduce(conceptIds) {
    for (const id of conceptIds) {
      const c = this.concept(id);
      if (!c.introduced) {
        c.introduced = true;
        c.due = c.due || this.now();
      }
    }
    this.save();
  }

  /**
   * Record one graded attempt.
   * a = {templateId, seed, concept, type, lecture, correct, hints, revealed, guidance, tag, message}
   * Independent success = correct, no hints, no revealed solution, guidance not 'full'.
   */
  recordAttempt(a) {
    const now = this.now();
    const c = this.concept(a.concept);
    const independent = !!a.correct && !a.hints && !a.revealed && a.guidance !== 'full';
    c.introduced = true;
    c.attempts++;
    c.hints += a.hints || 0;
    if (a.revealed) c.revealed++;
    if (a.correct) c.correct++;
    if (independent) {
      c.independent++;
      if (!c.templatesWon.includes(a.templateId)) c.templatesWon.push(a.templateId);
    }
    c.recent = [...c.recent, a.revealed ? 'r' : a.correct ? (independent ? 'I' : 'c') : 'x'].slice(-8);
    c.lastSeen = now;
    // Leitner scheduling
    if (independent) {
      c.box = Math.min(6, c.box + 1);
      c.due = now + BOX_INTERVALS[c.box];
    } else if (!a.correct || a.revealed) {
      c.box = 1;
      c.due = now; // revisit soon
    } else {
      c.box = Math.max(1, c.box);
      c.due = now + DAY / 2;
    }
    const t = (this.data.types[a.type] ||= { attempts: 0, correct: 0, independent: 0, hints: 0 });
    t.attempts++;
    if (a.correct) t.correct++;
    if (independent) t.independent++;
    t.hints += a.hints || 0;
    const tp = (this.data.templates[a.templateId] ||= { attempts: 0, correct: 0 });
    tp.attempts++;
    if (a.correct) tp.correct++;
    this.data.attempts.push({ t: now, templateId: a.templateId, seed: a.seed, concept: a.concept, type: a.type, lecture: a.lecture, correct: !!a.correct, independent, hints: a.hints || 0, revealed: !!a.revealed, tag: a.tag || null });
    if (this.data.attempts.length > 600) this.data.attempts = this.data.attempts.slice(-600);
    if (!a.correct && !a.revealed) {
      this.data.mistakes.push({ t: now, templateId: a.templateId, seed: a.seed, concept: a.concept, lecture: a.lecture, type: a.type, tag: a.tag || 'wrong-result', message: String(a.message || '').slice(0, 400) });
      if (this.data.mistakes.length > 200) this.data.mistakes = this.data.mistakes.slice(-200);
    }
    this.save();
    return { independent, level: this.level(a.concept) };
  }

  /** 'new' | 'learning' | 'practicing' | 'mastered' */
  level(id) {
    const c = this.data.concepts[id];
    if (!c || c.attempts === 0) return c && c.introduced ? 'learning' : 'new';
    const last = c.recent[c.recent.length - 1];
    if (c.independent >= 3 && c.templatesWon.length >= 2 && last === 'I' && this.accuracy(id) >= 0.6) return 'mastered';
    if (c.independent >= 1) return 'practicing';
    return 'learning';
  }

  accuracy(id) {
    const c = this.data.concepts[id];
    if (!c || !c.recent.length) return null;
    const r = c.recent.slice(-6);
    return r.filter((x) => x === 'I' || x === 'c').length / r.length;
  }

  isWeak(id) {
    const c = this.data.concepts[id];
    if (!c || c.attempts === 0) return false;
    const acc = this.accuracy(id);
    const recentMiss = c.recent.slice(-3).some((x) => x === 'x' || x === 'r');
    return acc < 0.6 || recentMiss;
  }

  dueConcepts() {
    const now = this.now();
    return CONCEPTS.filter((k) => {
      const c = this.data.concepts[k.id];
      return c && c.introduced && c.due <= now;
    }).map((k) => k.id);
  }

  weakConcepts() {
    return CONCEPTS.filter((k) => this.isWeak(k.id)).map((k) => k.id);
  }

  introducedConcepts() {
    return CONCEPTS.filter((k) => this.data.concepts[k.id]?.introduced).map((k) => k.id);
  }

  recentMistakes(n = 6) {
    return [...this.data.mistakes].reverse().slice(0, n);
  }

  recurringMistakes(n = 5) {
    const counts = {};
    for (const m of this.data.mistakes) counts[m.tag] = (counts[m.tag] || 0) + 1;
    return Object.entries(counts)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([tag, count]) => ({ tag, count }));
  }

  // ---- lessons (steps are remembered by their stable section key)
  lesson(id) {
    return (this.data.lessons[id] ||= { at: null, done: [], completed: false });
  }
  /** keys: every section key of the lesson, in order. */
  markLessonStep(id, key, keys) {
    const l = this.lesson(id);
    if (!l.done.includes(key)) l.done.push(key);
    const i = keys.indexOf(key);
    const next = keys[Math.min(i + 1, keys.length - 1)];
    if (l.at == null || keys.indexOf(next) > keys.indexOf(l.at)) l.at = next;
    l.completed = keys.every((k) => l.done.includes(k));
    this.save();
  }
  /** How many of the given section keys are done. */
  lessonDoneCount(id, keys) {
    const l = this.data.lessons[id];
    return l ? keys.filter((k) => l.done.includes(k)).length : 0;
  }

  // ---- pseudocode lab
  labData() {
    const l = (this.data.lab ||= {});
    l.drafts ||= {};
    l.solved ||= {};
    return l;
  }
  labDraft(key) {
    return this.labData().drafts[key];
  }
  setLabDraft(key, code) {
    this.labData().drafts[key] = String(code).slice(0, 20000);
    this.saveQuiet();
  }
  setLabLast(route) {
    this.labData().last = route;
    this.saveQuiet();
  }
  markLabSolved(id) {
    this.labData().solved[id] = this.now();
    this.save();
  }
  /** Persist without notifying listeners (for frequent writes like drafts). */
  saveQuiet() {
    this.data.updatedAt = this.now();
    try {
      this.storage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save progress', e);
    }
  }

  // ---- sessions
  setSession(s) {
    this.data.session = s;
    this.save();
  }
  clearSession() {
    this.data.session = null;
    this.save();
  }

  // ---- settings
  setSetting(k, v) {
    this.data.settings[k] = v;
    this.save();
  }

  // ---- import / export / reset
  exportJSON() {
    return JSON.stringify({ app: 'ds-study-lab', exportedAt: new Date(this.now()).toISOString(), ...this.data }, null, 2);
  }
  importJSON(text) {
    let obj;
    try {
      obj = JSON.parse(text);
    } catch {
      return { ok: false, error: 'The file is not valid JSON.' };
    }
    delete obj.app;
    delete obj.exportedAt;
    obj = migrateProgress(obj);
    const errs = validate(obj);
    if (errs.length) return { ok: false, error: 'This does not look like a DS Study Lab progress file: ' + errs.join(', ') };
    for (const id of Object.keys(obj.concepts)) if (!CONCEPT_BY_ID[id]) delete obj.concepts[id];
    this.data = { ...blankProgress(this.now()), ...obj, settings: { ...blankProgress().settings, ...obj.settings } };
    this.save();
    return { ok: true };
  }
  reset() {
    const settings = this.data.settings;
    this.data = blankProgress(this.now());
    this.data.settings = settings;
    this.save();
  }
}
