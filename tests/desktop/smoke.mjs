// Desktop smoke test: launches the real DS Study Lab app (an installed copy, a
// portable .exe, an AppImage, a .app bundle or `electron .` from source) and
// drives its core features. Used by CI on Windows, macOS and Linux.
//
//   node tests/desktop/smoke.mjs --exe <path to the app executable> [options]
//     --mode <m>      expected update mode: installed | portable | appimage | package | mac | dev
//     --label <name>  name used for the output files (default: the platform)
//     --out <dir>     where to write the screenshot and JSON report (default: smoke-out)
//     --cdp           start the exe as a plain process and attach over the DevTools
//                     protocol (for the Windows portable .exe, whose launcher does
//                     not pass the app's console through)
//     --arg <a>       extra command-line argument for the app (repeatable)
//     --source        run `electron .` from this checkout instead of --exe
//     --launch-timeout <s>  how long the app may take to start (default 120; the
//                     first start of an Intel build under Rosetta translates
//                     the whole binary and needs longer)
//
// Exit code 0 = every check passed. A JSON report lists each check.
import { _electron, chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const opt = { extra: [], launchTimeout: 120 };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--exe') opt.exe = argv[++i];
  else if (a === '--mode') opt.mode = argv[++i];
  else if (a === '--label') opt.label = argv[++i];
  else if (a === '--out') opt.out = argv[++i];
  else if (a === '--arg') opt.extra.push(argv[++i]);
  else if (a === '--cdp') opt.cdp = true;
  else if (a === '--source') opt.source = true;
  else if (a === '--launch-timeout') opt.launchTimeout = Number(argv[++i]);
  else throw new Error(`unknown option ${a}`);
}
if (opt.source) opt.exe = createRequire(import.meta.url)('electron'); // path to the electron binary
if (!opt.exe) throw new Error('--exe is required (or --source)');
const label = opt.label || `${process.platform}-${process.arch}`;
const out = resolve(opt.out || 'smoke-out');
mkdirSync(out, { recursive: true });

const results = [];
const pageErrors = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Same folder? Resolves symlinks (macOS: /var -> /private/var) and Windows short names and case.
function samePath(a, b) {
  const real = (p) => {
    try {
      return realpathSync.native(p);
    } catch {
      return resolve(p);
    }
  };
  const [x, y] = [real(a), real(b)];
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
}

// A fresh profile per run; automatic update checks off so CI never depends on GitHub.
const profile = mkdtempSync(join(tmpdir(), 'dslab-smoke-'));
writeFileSync(join(profile, 'update-prefs.json'), JSON.stringify({ auto: false }));
const appArgs = [...(opt.source ? [ROOT] : []), `--user-data-dir=${profile}`, ...opt.extra];

// ---------------------------------------------------------------- launching
async function launchElectron() {
  const app = await _electron.launch({ executablePath: opt.exe, args: appArgs, timeout: opt.launchTimeout * 1000, env: { ...process.env } });
  const page = await app.firstWindow({ timeout: opt.launchTimeout * 1000 });
  return { app, page, close: () => app.close() };
}

async function launchCdp() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const child = spawn(opt.exe, [`--remote-debugging-port=${port}`, ...appArgs], { stdio: 'ignore', detached: process.platform !== 'win32' });
  let browser = null;
  for (let t = 0; t < 120 && !browser; t++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    } catch {
      await sleep(1000);
    }
  }
  if (!browser) throw new Error(`the app did not open a DevTools port within 120 s (pid ${child.pid})`);
  let page = null;
  for (let t = 0; t < 60 && !page; t++) {
    page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().startsWith('app://')) || null;
    if (!page) await sleep(500);
  }
  if (!page) throw new Error('no app:// window appeared');
  const close = async () => {
    await page.evaluate(() => window.close()).catch(() => {});
    for (let t = 0; t < 30 && child.exitCode === null; t++) await sleep(500);
    if (child.exitCode === null) {
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      else process.kill(-child.pid, 'SIGKILL');
    }
    await browser.close().catch(() => {});
  };
  return { app: null, page, close, child };
}

const launch = () => (opt.cdp ? launchCdp() : launchElectron());

// ---------------------------------------------------------------- feature checks
async function go(page, hash) {
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(400);
}

async function coreChecks(page) {
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));
  await page.waitForSelector('h1', { timeout: 60000 });
  check('window opens on the dashboard', (await page.locator('h1').first().textContent()).includes('Your study desk'));
  check('window title', (await page.title()).includes('DS Study Lab'), await page.title());

  const routes = ['#/', '#/lesson/8', '#/practice', '#/explore', '#/repair', '#/progress', '#/settings', '#/lab'];
  const blank = [];
  for (const r of routes) {
    await go(page, r);
    const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || '';
    if (!h1.trim()) blank.push(r);
  }
  check(`all ${routes.length} main pages render`, !blank.length, blank.join(' '));

  // lesson steps are addressed by their stable key (positions change when lessons grow)
  const lessonRoute = (key) => page.evaluate((k) => import('./js/content/lessons.js').then((m) => { for (const l of m.LESSONS) { const i = l.sections.findIndex((s) => s.key === k); if (i >= 0) return `#/lesson/${l.lecture}/${i}`; } return null; }), key);

  // a lesson simulation steps forward (answering any prediction question)
  await go(page, await lessonRoute('s:predict-the-intermediate-states-insert-15-at-pos'));
  const step = page.locator('button:has-text("Step ▶")').first();
  const before = await page.locator('.stepnum').first().textContent();
  for (let k = 0; k < 4; k++) {
    if (await page.locator('.predict-box').count()) {
      await page.locator('.predict-box .row button').first().click();
      await page.locator('text=Show the step').click();
    } else await step.click();
    await page.waitForTimeout(150);
  }
  const after = await page.locator('.stepnum').first().textContent();
  check('lesson simulation steps forward', before !== after, `${before} → ${after}`);

  // a "Build it in code" walkthrough: the same statement is highlighted in C++ and in Python
  await go(page, await lessonRoute('w:sll-insert-beg'));
  const walk = page.locator('.walk');
  for (let k = 0; k < 3; k++) await walk.locator('button:has-text("Step ▶")').click();
  await walk.locator('.lang-tabs button[data-lang="cpp"]').click();
  const cppLine = ((await walk.locator('.walk-code li.cur').first().textContent().catch(() => '')) || '').trim();
  await walk.locator('.lang-tabs button[data-lang="py"]').click();
  const pyLine = ((await walk.locator('.walk-code li.cur').first().textContent().catch(() => '')) || '').trim();
  check('walkthrough highlights the statement in C++ and Python', /newnode/.test(cppLine) && /newnode/.test(pyLine) && cppLine !== pyLine, `C++: ${cppLine} | Python: ${pyLine}`);

  // a graded exercise: put the statements in a correct order with the ↑ buttons, then Check
  await go(page, '#/try/l08-order-insert/3');
  const want = await page.evaluate(() => window.__dslabExercise.answer);
  for (let k = 0; k < want.length; k++) {
    for (let guard = 0; guard < want.length; guard++) {
      const ids = await page.$$eval('.order-item', (els) => els.map((e) => e.dataset.id));
      const j = ids.indexOf(want[k]);
      if (j <= k) break;
      await page.locator(`.order-item[data-id="${want[k]}"] button:has-text("↑")`).click();
    }
  }
  await page.locator('.task-actions button:has-text("Check")').click();
  await page.waitForTimeout(300);
  check('exercise is graded correct', (await page.locator('.feedback').last().textContent()).includes('Correct'));

  // Pseudocode Lab: run a solution to the end, then check it against the goal
  await go(page, '#/lab/sll-insert-after');
  await page.locator('textarea.ce-input').evaluate((t) => {
    t.value = 'newnode = new Node(15)\nnewnode.next = start.next\nstart.next = newnode\n';
    t.dispatchEvent(new Event('input'));
  });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Run to end")').click();
  await page.waitForTimeout(200);
  check('Pseudocode Lab runs a program', (await page.locator('.lab-explain').textContent()).includes('start → 10 → 15 → 20 → 30'));
  await page.locator('button:has-text("Check my solution")').click();
  await page.waitForTimeout(300);
  check('Pseudocode Lab grades the solution', (await page.locator('.lab-check .feedback').textContent()).includes('All 3 test cases pass'));
  await page.screenshot({ path: join(out, `${label}-lab.png`) });

  // Explore: run an operation step by step
  await go(page, '#/explore');
  await page.locator('button:has-text("Run step by step")').click();
  await page.waitForTimeout(300);
  const ws = page.locator('.ws-wrap');
  const s0 = await ws.locator('.stepnum').textContent();
  for (let k = 0; k < 3; k++) {
    if (await ws.locator('.predict-box').count()) {
      await ws.locator('.predict-box .row button').first().click();
      await ws.locator('text=Show the step').click();
    } else await ws.locator('button:has-text("Step ▶")').click();
    await page.waitForTimeout(150);
  }
  check('Explore runs an operation step by step', (await ws.count()) === 1 && (await ws.locator('.stepnum').textContent()) !== s0);

  // desktop-only Settings panel (needs the preload bridge)
  await go(page, '#/settings');
  const info = await page.evaluate(() => (window.dslabDesktop ? window.dslabDesktop.getUpdateInfo() : null));
  check('desktop bridge and Updates panel', !!info && (await page.locator('section.panel:has(h2:text("Updates"))').count()) === 1, info && `version ${info.version}, mode ${info.mode}`);
  if (opt.mode) check(`update mode is "${opt.mode}"`, info && info.mode === opt.mode, info && info.mode);

  const saved = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('dslab.progress.v1') || '{}');
    return { attempts: (d.attempts || []).length, draft: !!(d.lab && d.lab.drafts && d.lab.drafts['ex:sll-insert-after']) };
  });
  check('progress is recorded', saved.attempts >= 2 && saved.draft, JSON.stringify(saved));
  return saved;
}

// ---------------------------------------------------------------- run
let exitCode = 0;
try {
  const t0 = Date.now();
  const first = await launch();
  check('app launches', true, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (first.app) {
    const main = await first.app.evaluate(({ app, Menu }) => {
      const menu = Menu.getApplicationMenu();
      const items = menu ? menu.items : [];
      const roles = (it) => [it.role, ...(it.submenu ? it.submenu.items.flatMap(roles) : [])].filter(Boolean).map((r) => String(r).toLowerCase());
      return { platform: process.platform, arch: process.arch, packaged: app.isPackaged, userData: app.getPath('userData'), electron: process.versions.electron, menuRoles: items.flatMap(roles) };
    });
    check('runs on this platform', true, `${main.platform}/${main.arch}, Electron ${main.electron}, packaged ${main.packaged}`);
    check('uses the given profile folder', samePath(main.userData, profile), main.userData);
    check('Edit menu provides copy/paste/undo/select all', ['copy', 'paste', 'undo', 'selectall'].every((r) => main.menuRoles.includes(r)));
    if (main.platform === 'darwin') check('macOS app menu present', main.menuRoles.includes('appmenu'));
  }
  const saved = await coreChecks(first.page);

  // a second launch with the same profile must hand over to the running window and exit
  if (!opt.cdp) {
    const second = spawn(opt.exe, appArgs, { stdio: 'ignore' });
    let code = null;
    for (let t = 0; t < 40 && code === null; t++) {
      await sleep(500);
      code = second.exitCode;
    }
    if (code === null) second.kill();
    check('a second launch exits and keeps one window', code !== null && (await first.page.evaluate(() => document.title)).includes('DS Study Lab'), code === null ? 'second instance still running after 20 s' : `exit code ${code}`);
  }
  await first.close();
  await sleep(1500);

  // relaunch: progress and drafts must survive a restart
  const again = await launch();
  await again.page.waitForSelector('h1', { timeout: 60000 });
  const kept = await again.page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('dslab.progress.v1') || '{}');
    return { attempts: (d.attempts || []).length, draft: !!(d.lab && d.lab.drafts && d.lab.drafts['ex:sll-insert-after']) };
  });
  check('progress and drafts survive a restart', kept.attempts === saved.attempts && kept.draft, JSON.stringify(kept));
  await again.close();
  check('no page errors', !pageErrors.length, pageErrors.slice(0, 5).join(' | '));
} catch (e) {
  check('smoke test ran to completion', false, e && e.stack ? e.stack.split('\n').slice(0, 4).join(' / ') : e);
}
if (results.some((r) => !r.ok)) exitCode = 1;
writeFileSync(join(out, `${label}.json`), JSON.stringify({ label, exe: opt.exe, platform: process.platform, arch: process.arch, results }, null, 2));
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* Windows may still hold a file for a moment */
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed (${label})`);
process.exit(exitCode);
