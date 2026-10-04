// Application shell: navigation, routing, theme/motion settings.
import { h, clear } from './ui/dom.js';
import { ProgressStore } from './progress/store.js';
import { LECTURES } from './content/concepts.js';
import { LESSON_BY_LECTURE } from './content/lessons.js';
import { dashboardView } from './views/dashboard.js';
import { lessonView } from './views/lesson.js';
import { practiceView } from './views/practice.js';
import { exploreView } from './views/explore.js';
import { repairView } from './views/repair.js';
import { complexityView } from './views/complexity.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';
import { generateExercise } from './exercises/registry.js';
import { renderExercise } from './ui/exercise.js';
import { icon } from './ui/icons.js';
import { mountUpdateBanner } from './ui/updates.js';

function safeStorage() {
  try {
    const k = '__dslab_test';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  }
}

const store = new ProgressStore(safeStorage());
const main = h('main', { id: 'main', tabindex: '-1' });
const side = h('nav', { class: 'side', id: 'side-nav', 'aria-label': 'Main' });
const scrim = h('div', { class: 'scrim', onclick: () => setMenu(false) });
const menuBtn = h('button', { class: 'btn ghost icon-btn', 'aria-label': 'Open menu', 'aria-controls': 'side-nav', 'aria-expanded': 'false', onclick: () => setMenu(!side.classList.contains('open')) }, icon('menu'));
let cleanup = null;

function applySettings() {
  const st = store.data.settings;
  const root = document.documentElement;
  if (st.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', st.theme);
  if (st.motion === 'system') root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', st.motion);
}

export const ctx = {
  store,
  go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  },
  refreshNav: () => drawNav(),
  applySettings,
  setCleanup(f) {
    cleanup = f;
  },
};

function lessonPct(L) {
  const lesson = LESSON_BY_LECTURE[L.n];
  const rec = store.data.lessons[L.id];
  if (!lesson || !rec) return 0;
  return Math.round((rec.done.length / lesson.sections.length) * 100);
}

function navLink(href, label, extra, ico) {
  const cur = location.hash === href || (href !== '#/' && location.hash.startsWith(href + '/')) || (href === '#/' && (location.hash === '' || location.hash === '#'));
  return h('a', { href, 'aria-current': cur ? 'page' : null, onclick: () => setMenu(false) }, ico ? icon(ico) : null, label, extra);
}

function brand() {
  return h('a', { class: 'brand', href: '#/' }, icon('brand', 'brand-mark'), h('span', {}, h('b', {}, 'DS Study Lab'), h('span', { class: 'brand-sub' }, 'Lectures 07–14 · C/C++')));
}

function setMenu(open) {
  side.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) side.querySelector('a[aria-current="page"], a')?.focus();
}

function drawNav() {
  clear(side).append(
    brand(),
    h('div', { class: 'nav' }, navLink('#/', 'Dashboard', null, 'home'), navLink('#/practice', 'Practice', null, 'practice'), navLink('#/progress', 'Progress', null, 'progress')),
    h('div', { class: 'nav-group' }, 'Lectures'),
    h(
      'div',
      { class: 'nav' },
      LECTURES.map((L) => {
        const p = lessonPct(L);
        return navLink(`#/lesson/${L.n}`, [h('span', { class: 'lec-n', style: `--p:${p}`, title: `${p}% of the lesson done` }, String(L.n).padStart(2, '0')), h('span', { class: 'lec-t' }, L.short)], h('span', { class: 'pct' }, p ? (p === 100 ? '✓' : `${p}%`) : ''));
      }),
    ),
    h('div', { class: 'nav-group' }, 'Tools'),
    h('div', { class: 'nav' }, navLink('#/explore', 'Explore workspace', null, 'explore'), navLink('#/repair', 'Repair mode', null, 'repair'), navLink('#/complexity', 'Complexity lab', null, 'complexity')),
    h('div', { class: 'nav-group' }, 'App'),
    h('div', { class: 'nav' }, navLink('#/settings', 'Settings & data', null, 'settings')),
  );
}

function route() {
  if (cleanup) {
    try {
      cleanup();
    } catch {
      /* ignore */
    }
    cleanup = null;
  }
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');
  clear(main);
  setMenu(false);
  const page = h('div', { class: 'page' });
  main.append(page);
  let view;
  try {
    switch (parts[0]) {
      case '':
        view = dashboardView(ctx);
        break;
      case 'lesson':
        view = lessonView(ctx, Number(parts[1] || 7), parts[2] != null ? Number(parts[2]) : null);
        break;
      case 'practice':
        view = practiceView(ctx, parts[1] || null, parts[2] || null);
        break;
      case 'explore':
        view = exploreView(ctx, parts[1] || null);
        break;
      case 'repair':
        view = repairView(ctx, parts[1] || null);
        break;
      case 'complexity':
        view = complexityView(ctx);
        break;
      case 'progress':
        view = progressView(ctx);
        break;
      case 'settings':
        view = settingsView(ctx);
        break;
      case 'try': {
        // Open one generated exercise directly: #/try/<templateId>/<seed>
        const ex = generateExercise(parts[1], Number(parts[2] || 1), { guidance: parts[3] || 'less' });
        window.__dslabExercise = ex;
        view = h('div', {}, h('div', { class: 'page-head' }, h('h1', {}, 'Single exercise')), renderExercise(ex, { onResult: (r) => store.recordAttempt({ templateId: ex.templateId, seed: ex.seed, concept: ex.concept, type: ex.type, lecture: ex.lecture, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: ex.guidance, tag: r.tag, message: r.message }) }));
        break;
      }
      default:
        view = h('p', {}, 'Page not found. ', h('a', { href: '#/' }, 'Go to the dashboard'));
    }
  } catch (e) {
    console.error(e);
    view = h('div', { class: 'feedback bad' }, h('b', {}, 'Something went wrong while opening this page. '), String(e.message || e));
  }
  page.append(view);
  drawNav();
  window.scrollTo(0, 0);
  const h1 = main.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
}

document.body.append(h('a', { href: '#main', class: 'sr-only' }, 'Skip to content'), h('div', { class: 'shell' }, side, scrim, h('div', { style: { minWidth: 0 } }, h('header', { class: 'topbar' }, menuBtn, brand()), main)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && side.classList.contains('open')) {
    setMenu(false);
    menuBtn.focus();
  }
});
applySettings();
window.addEventListener('hashchange', route);
store.onChange(() => drawNav());
route();
mountUpdateBanner();
