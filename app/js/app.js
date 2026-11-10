// Application shell: navigation, routing, theme/motion settings.
import { h, clear, stickyWhenFits } from './ui/dom.js';
import { ProgressStore } from './progress/store.js';
import { MODULES } from './content/concepts.js';
import { LESSON_BY_ID } from './content/lessons.js';
import { dashboardView } from './views/dashboard.js';
import { lessonView, modulesView, moduleLinkForOldLesson } from './views/lesson.js';
import { assessmentView } from './views/assessment.js';
import { implementationView } from './views/implementation.js';
import { practiceView } from './views/practice.js';
import { exploreView } from './views/explore.js';
import { repairView } from './views/repair.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';
import { labView } from './views/lab.js';
import { drillsView } from './views/drills.js';
import { dueCards } from './progress/drills.js';
import { generateExercise } from './exercises/registry.js';
import { renderExercise } from './ui/exercise.js';
import { icon } from './ui/icons.js';
import { mountUpdateBanner } from './ui/updates.js';
import { initCodeLang } from './ui/langs.js';

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

function modulePct(M) {
  const lesson = LESSON_BY_ID[M.id];
  const rec = store.data.lessons[M.id];
  if (!lesson || !rec) return 0;
  return Math.round((store.lessonDoneCount(M.id, lesson.sections.map((x) => x.key)) / lesson.sections.length) * 100);
}

function navLink(href, label, extra, ico, cls) {
  const cur = location.hash === href || (href !== '#/' && location.hash.startsWith(href + '/')) || (href === '#/' && (location.hash === '' || location.hash === '#'));
  return h('a', { href, class: cls || null, 'aria-current': cur ? 'page' : null, onclick: () => setMenu(false) }, ico ? icon(ico) : null, label, extra);
}

function brand() {
  return h('a', { class: 'brand', href: '#/' }, icon('brand', 'brand-mark'), h('span', {}, h('b', {}, 'DS Study Lab'), h('span', { class: 'brand-sub' }, 'Data Structures and Algorithms')));
}

function setMenu(open) {
  side.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) side.querySelector('a[aria-current="page"], a')?.focus();
}

// exercises due in the Cumulative Review (shown next to the menu entry)
function reviewBadge() {
  const n = dueCards(store.drillData(), store.now()).length;
  return n ? h('span', { class: 'nav-badge', title: `${n} review exercise${n === 1 ? '' : 's'} due` }, String(n)) : null;
}

function drawNav() {
  clear(side).append(
    brand(),
    h('div', { class: 'nav' }, navLink('#/', 'Learning Dashboard', null, 'home'), navLink('#/modules', 'Learning Modules', null, 'book')),
    h(
      'div',
      { class: 'nav nav-sub', role: 'group', 'aria-label': 'Learning modules' },
      MODULES.map((M) => {
        const p = modulePct(M);
        return navLink(`#/module/${M.id}`, [h('span', { class: 'lec-n', style: `--p:${p}`, title: `${p}% of the module completed` }, String(M.n)), h('span', { class: 'lec-t' }, M.title)], h('span', { class: 'pct' }, p ? (p === 100 ? '✓' : `${p}%`) : ''));
      }),
    ),
    h('div', { class: 'nav-group' }, 'Practice and Application'),
    h(
      'div',
      { class: 'nav' },
      navLink('#/explore', 'Interactive Visualizations', null, 'explore'),
      navLink('#/practice', 'Practice Exercises', null, 'practice'),
      navLink('#/lab', 'Pseudocode Development', null, 'code'),
      navLink('#/review', 'Cumulative Review', reviewBadge(), 'cards', 'nav-child'),
      navLink('#/implementation', 'C++ Implementation', null, 'braces'),
      navLink('#/repair', 'Algorithm Debugging', null, 'repair'),
      navLink('#/assessment', 'Knowledge Assessment', null, 'assess'),
    ),
    h('div', { class: 'nav-group' }, 'Records'),
    h('div', { class: 'nav' }, navLink('#/progress', 'Learning Progress', null, 'progress'), navLink('#/settings', 'Settings and Data', null, 'settings')),
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
      case 'modules':
        view = modulesView(ctx);
        break;
      case 'module':
        view = lessonView(ctx, parts[1] || MODULES[0].id, parts[2] != null ? Number(parts[2]) : null);
        break;
      case 'lesson':
        // links from before the learning modules (#/lesson/<number>/<step>) open the same step in its module
        view = h('p', { class: 'muted' }, 'Opening the learning module…');
        moduleLinkForOldLesson(Number(parts[1]), parts[2] != null ? Number(parts[2]) : 0).then((to) => {
          history.replaceState(null, '', to);
          route();
        });
        break;
      case 'practice':
        view = practiceView(ctx, parts[1] || null, parts[2] || null);
        break;
      case 'explore':
        if (parts[1] === 'code') {
          // the program explorer moved to its own page
          history.replaceState(null, '', '#/implementation');
          view = implementationView(ctx, null);
        } else view = exploreView(ctx, parts[1] || null);
        break;
      case 'implementation':
        view = implementationView(ctx, parts[1] || null);
        break;
      case 'assessment':
        view = assessmentView(ctx, parts[1] || null, parts[2] || null);
        break;
      case 'repair':
        view = repairView(ctx, parts[1] || null);
        break;
      case 'lab':
        view = labView(ctx, parts[1] || null, parts[2] || null);
        break;
      case 'review':
        view = drillsView(ctx, parts[1] || null);
        break;
      case 'drills':
        // the Cumulative Review was first called "Pseudocode drills"
        history.replaceState(null, '', `#/review${parts[1] ? `/${parts[1]}` : ''}`);
        view = drillsView(ctx, parts[1] || null);
        break;
      case 'complexity':
        // the Complexity lab was removed with the time-complexity material; old links land on the dashboard
        history.replaceState(null, '', '#/');
        view = dashboardView(ctx);
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
        view = h('div', {}, h('div', { class: 'page-head' }, h('h1', {}, 'Exercise')), renderExercise(ex, { onResult: (r) => store.recordAttempt({ templateId: ex.templateId, seed: ex.seed, concept: ex.concept, type: ex.type, module: ex.module, correct: r.correct, hints: r.hints, revealed: r.revealed, guidance: ex.guidance, tag: r.tag, message: r.message }) }));
        break;
      }
      default:
        view = h('p', {}, 'This page does not exist. ', h('a', { href: '#/' }, 'Return to the Learning Dashboard'));
    }
  } catch (e) {
    console.error(e);
    view = h('div', { class: 'feedback bad' }, h('b', {}, 'This page could not be opened. '), String(e.message || e));
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
stickyWhenFits(side);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && side.classList.contains('open')) {
    setMenu(false);
    menuBtn.focus();
  }
});
initCodeLang(store.data.settings.codeLang, (id) => store.setSetting('codeLang', id));
applySettings();
window.addEventListener('hashchange', route);
store.onChange(() => drawNav());
route();
mountUpdateBanner();
