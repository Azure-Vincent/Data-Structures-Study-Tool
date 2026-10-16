// The programming language code is shown in. There is ONE choice for the whole
// app: picking C++, Python or Pseudocode in any code panel (or in Settings)
// switches every panel, so the same example can be compared language by
// language. The notes' original C is offered where it exists.
import { h, clear } from './dom.js';
import { TRANSLATIONS } from '../content/translations.js';

export const CODE_LANGS = [
  { id: 'cpp', label: 'C++' },
  { id: 'py', label: 'Python' },
  { id: 'pseudo', label: 'Pseudocode' },
  { id: 'c', label: 'C (notes)' },
];
export const LANG_LABEL = Object.fromEntries(CODE_LANGS.map((l) => [l.id, l.label]));
const ORDER = CODE_LANGS.map((l) => l.id);

let current = 'cpp';
let persist = null;
const subs = new Set();

export const codeLang = () => current;

/** Called once at start-up with the saved choice and a function that saves a new one. */
export function initCodeLang(id, save) {
  if (LANG_LABEL[id]) current = id;
  persist = save || null;
}

export function setCodeLang(id) {
  if (!LANG_LABEL[id] || id === current) return;
  current = id;
  if (persist) persist(id);
  for (const f of [...subs]) f(id);
}

/** Subscribe to changes; returns an unsubscribe function. */
export function onCodeLang(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/** The language to show when only `available` languages exist: the app-wide choice if possible. */
export function pickLang(available) {
  if (available.includes(current)) return current;
  return ORDER.find((l) => available.includes(l)) || available[0];
}

/**
 * Language tabs for the languages in `available`. Clicking one changes the
 * app-wide choice; every tab row (and every panel that listens) follows.
 */
export function langTabs(available, { label = 'Code language' } = {}) {
  const langs = ORDER.filter((l) => available.includes(l));
  const el = h('div', { class: 'tabs lang-tabs', role: 'tablist', 'aria-label': label });
  const buttons = langs.map((id) => h('button', { type: 'button', role: 'tab', 'data-lang': id, onclick: () => setCodeLang(id) }, LANG_LABEL[id]));
  el.append(buttons);
  const mark = () => {
    const active = pickLang(langs);
    buttons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lang === active)));
  };
  mark();
  // tab rows are rebuilt freely: once one has left the page it stops listening
  const born = Date.now();
  const off = onCodeLang(() => {
    if (!el.isConnected && Date.now() - born > 1000) return off();
    mark();
  });
  return el;
}

/**
 * A code block offered in several languages, e.g. { c, cpp, py, pseudo } as
 * strings. Shows the app-wide choice and follows it when it changes.
 */
export function langCode(variants, { extra } = {}) {
  const avail = ORDER.filter((l) => variants[l]);
  const wrap = h('div', { class: 'lang-code' });
  const pane = h('div', { role: 'tabpanel' });
  const draw = () => {
    const l = pickLang(avail);
    clear(pane).append(h('pre', { class: 'code', 'aria-label': `code in ${LANG_LABEL[l]}` }, variants[l]), extra ? extra(l) : null);
  };
  draw();
  const born = Date.now();
  const off = onCodeLang(() => (!wrap.isConnected && Date.now() - born > 1000 ? off() : draw()));
  wrap.append(avail.length > 1 ? langTabs(avail) : null, pane);
  return wrap;
}

/** Inline text offered in several languages ({ cpp, py, pseudo }); follows the app-wide choice. */
export function langText(variants, tag = 'code') {
  const avail = ORDER.filter((l) => variants[l] != null);
  const el = h(tag, {});
  const draw = () => {
    el.textContent = variants[pickLang(avail)];
  };
  draw();
  const born = Date.now();
  const off = onCodeLang(() => (!el.isConnected && Date.now() - born > 1000 ? off() : draw()));
  return el;
}

// ---------------------------------------------------------------- traced code in other languages

/** Languages a traced code block can be shown in. */
export function traceLangs(code) {
  const t = (code && code.langs) || (code && TRANSLATIONS[code.key]);
  return t ? ['c', ...['cpp', 'py', 'pseudo'].filter((l) => t[l])] : ['c'];
}

/**
 * The lines of a traced code block in `lang`, each tagged with the C line it
 * belongs to: [{ text, src, lead }]. src is the index the simulation
 * highlights; lead marks the statement itself (extra lines of an entry, such as
 * a closing `end while`, belong to it but are not highlighted).
 */
export function traceLines(code, lang) {
  const t = (code && code.langs) || (code && TRANSLATIONS[code.key]);
  if (lang === 'c' || !t || !t[lang]) return code.lines.map((text, src) => ({ text, src, lead: true }));
  const out = [];
  t[lang].forEach((x, src) => {
    if (x == null) return;
    (Array.isArray(x) ? x : [x]).forEach((text, k) => out.push({ text, src, lead: k === 0 }));
  });
  return out;
}
