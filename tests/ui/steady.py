# Browser UI check (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
#            (or set CHROMIUM=/path/to/chrome to use an installed Chromium)
#
# Panels keep their size while you step: in simulations, walkthroughs and
# Explore no panel changes size or moves at any step; in the Pseudocode Lab
# no panel shrinks again when stepping back. Checked at three window sizes.
import os, sys
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173/'
SIZES = [(1400, 900), (1024, 768), (760, 900)]
WS = {
    'diagram': '.ws-wrap .ws-diagram', 'controls': '.ws-wrap .ws-controls', 'explanation': '.ws-wrap .ws-explain',
    'code': '.ws-wrap .code-panel', 'variables': '.ws-wrap .ws-side > :nth-child(3)', 'history': '.ws-wrap .ws-bottom > .panel',
}
WALK = {
    'diagram': '.walk .walk-diagram', 'controls': '.walk .ws-controls', 'explanation': '.walk .walk-explain',
    'variables': '.walk .walk-vars', 'output': '.walk .walk-out', 'code': '.walk .walk-code', 'history': '.walk > .panel:not(.controls)',
}
LAB = {
    'diagram': '.lab-diagram', 'controls': '.lab-controls', 'explanation': '.lab-explain', 'variables': '.lab-panels > :nth-child(1)',
    'output': '.lab-panels > :nth-child(2)', 'problems': '.lab-problems', 'history': '.lab-history',
}
MEASURE = """(sel) => { const o = {}; for (const [k, s] of Object.entries(sel)) { const e = document.querySelector(s); if (!e) continue; const r = e.getBoundingClientRect(); o[k] = [Math.round(r.width), Math.round(r.height), Math.round(r.top + scrollY)]; } return o; }"""
LESSON_AT = "k => import('./js/content/lessons.js').then(m => { for (const l of m.LESSONS) { const i = l.sections.findIndex(s => s.key === k); if (i >= 0) return '#/lesson/' + l.lecture + '/' + i; } return null; })"

results = []
def check(name, ok, detail=''):
    results.append(ok)
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))

def answer_prediction(pg):
    if pg.locator('.predicting').count():
        pg.locator('.predict-options button').first.click()
        pg.locator('text=Show the step').click()

def record(pg, sel, button, steps, before=None):
    rows = [pg.evaluate(MEASURE, sel)]
    for _ in range(steps):
        if before: before(pg)
        b = pg.locator(button).first
        if b.is_disabled(): break
        b.click()
        pg.wait_for_timeout(30)
        rows.append(pg.evaluate(MEASURE, sel))
    return rows

def unsteady(rows, shrink_only=False):
    bad = []
    for k in rows[0]:
        vals = [r[k] for r in rows if k in r]
        if shrink_only:
            if any(b[1] < a[1] for a, b in zip(vals, vals[1:])): bad.append(f'{k} shrinks')
        elif len({(w, h, t) for w, h, t in vals}) > 1:
            bad.append(f"{k} {min(v[1] for v in vals)}–{max(v[1] for v in vals)}px")
    return bad

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    for (w, hh) in SIZES:
        pg = b.new_page(viewport={'width': w, 'height': hh})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE); pg.wait_for_timeout(300)
        def go(route):
            pg.goto(BASE + route); pg.wait_for_timeout(700)  # let the panels be measured
        for key, label, predict in [('s:predict-the-intermediate-states-insert-15-at-pos', 'L08 simulation with predictions', True), ('s:bfs-from-a', 'L14 BFS simulation', False)]:
            go(pg.evaluate(LESSON_AT, key))
            if not predict and pg.locator('.ws-wrap button:has-text("Ask me to predict")[aria-pressed="true"]').count():
                pg.click('.ws-wrap button:has-text("Ask me to predict")'); pg.wait_for_timeout(300)
            bad = unsteady(record(pg, WS, '.ws-wrap button:has-text("Step ▶")', 60, answer_prediction))
            check(f'{w}x{hh} {label}: no panel changes size or moves', not bad, ', '.join(bad))
        for key in ['w:sll-insert-pos', 'w:tree-traversals', 'w:graph-bfs', 'w:stack-array']:
            go(pg.evaluate(LESSON_AT, key))
            bad = unsteady(record(pg, WALK, '.walk button:has-text("Step ▶")', 70))
            check(f'{w}x{hh} walkthrough {key[2:]}: no panel changes size or moves', not bad, ', '.join(bad))
        go('#/explore/dll'); pg.click('button:has-text("Run step by step")'); pg.wait_for_timeout(500)
        if pg.locator('.ws-wrap button:has-text("Ask me to predict")[aria-pressed="true"]').count():
            pg.click('.ws-wrap button:has-text("Ask me to predict")'); pg.wait_for_timeout(300)
        bad = unsteady(record(pg, WS, '.ws-wrap button:has-text("Step ▶")', 30))
        check(f'{w}x{hh} Explore operation: no panel changes size or moves', not bad, ', '.join(bad))
        go('#/lab/free/tree')
        fwd = record(pg, LAB, '.lab-controls button:has-text("Step ▶")', 40)
        back = record(pg, LAB, '.lab-controls button:has-text("◀ Back")', 40)
        bad = unsteady(fwd + back, shrink_only=True)
        check(f'{w}x{hh} Pseudocode Lab: no panel shrinks while stepping forward and back', not bad, ', '.join(bad))
        check(f'{w}x{hh} no page errors', not errs, '; '.join(errs[:3]))
        pg.close()
    b.close()
print(f'\n{sum(results)}/{len(results)} checks passed')
sys.exit(0 if all(results) else 1)
