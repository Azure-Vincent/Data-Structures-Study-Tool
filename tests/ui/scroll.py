# Browser check (optional): stepping or playing a simulation must not scroll the page.
# The Operation history panel may scroll inside itself; the page must stay put so the
# diagram and the playback controls remain visible.
# Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
import os
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173/'
SIZES = [(1400, 900), (1024, 768), (800, 700)]
results = []


def press(loc):
    # dispatch the click directly: Playwright's .click() first scrolls the button into view,
    # which would hide whether the app itself moved the page
    loc.dispatch_event('click')


def check(name, ok, detail=''):
    results.append(ok)
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))


def prepare(pg, route=None):
    if route:
        pg.goto(BASE + route)
    pg.wait_for_selector('.ws-wrap .stepnum')
    pg.wait_for_timeout(300)
    # scroll so the workspace controls sit near the top of the window, as a student would
    pg.evaluate("() => { const c = document.querySelector('.ws-wrap .ws-controls'); window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 16); }")
    pg.wait_for_timeout(100)
    return pg.evaluate('() => window.scrollY')


def visible(pg, sel):
    return pg.evaluate("""(sel) => { const r = document.querySelector(sel).getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight; }""", sel)


def hist_state(pg):
    return pg.evaluate("""() => { const ol = document.querySelector('.ws-wrap .history'); const cur = ol.querySelector('li.cur');
      const o = ol.getBoundingClientRect(), c = cur.getBoundingClientRect();
      return { scrollTop: ol.scrollTop, overflows: ol.scrollHeight > ol.clientHeight, curInside: c.top >= o.top - 1 && c.bottom <= o.bottom + 1 }; }""")


def step_through(pg, ws, n):
    for _ in range(n):
        if ws.locator('.predict-box').count():
            press(ws.locator('.predict-box .row button').first)
            press(ws.locator('text=Show the step'))
        else:
            btn = ws.locator('button:has-text("Step ▶")')
            if btn.is_disabled():
                break
            press(btn)
        pg.wait_for_timeout(60)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    for (w, hgt) in SIZES:
        ctx = b.new_context(viewport={'width': w, 'height': hgt})
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))

        # 1. "Predict the intermediate states" (Lecture 8): Step, answering every prediction
        y0 = prepare(pg, '#/lesson/8/10')
        ws = pg.locator('.ws-wrap')
        title = pg.get_by_text('Predict the intermediate states').count()
        step_through(pg, ws, 40)
        y1 = pg.evaluate('() => window.scrollY')
        hs = hist_state(pg)
        check(f'{w}x{hgt} predict sim: Step keeps the page still', abs(y1 - y0) <= 1 and title > 0, f'scrollY {y0} → {y1}')
        check(f'{w}x{hgt} predict sim: diagram and controls stay visible', visible(pg, '.ws-wrap .ws-controls') and visible(pg, '.ws-wrap .ws-diagram'))
        check(f'{w}x{hgt} predict sim: history scrolled inside its own panel', hs['curInside'] and (hs['scrollTop'] > 0 or not hs['overflows']), str(hs))

        # 2. Play (predictions off) from the start
        press(ws.locator('button:has-text("↺ Reset")'))
        pred = ws.locator('button:has-text("Ask me to predict")')
        if pred.get_attribute('aria-pressed') == 'true':
            press(pred)
        ws.locator('select[aria-label="Playback speed"]').select_option('4')
        y0 = pg.evaluate('() => window.scrollY')
        press(ws.locator('button:has-text("▶ Play")'))
        pg.wait_for_function("() => /Step (\\d+) \\/ \\1$/.test(document.querySelector('.ws-wrap .stepnum').textContent)", timeout=30000)
        y1 = pg.evaluate('() => window.scrollY')
        check(f'{w}x{hgt} predict sim: Play keeps the page still', abs(y1 - y0) <= 1, f'scrollY {y0} → {y1}')

        # 3. keyboard stepping (→) and Back (←) in Explore
        pg.goto(BASE + '#/explore')
        pg.locator('button:has-text("Run step by step")').click()
        y0 = prepare(pg)
        ws = pg.locator('.ws-wrap')
        pred = ws.locator('button:has-text("Ask me to predict")')
        if pred.count() and pred.get_attribute('aria-pressed') == 'true':
            press(pred)
        pg.evaluate("() => document.querySelector('.ws-wrap').focus({ preventScroll: true })")
        for _ in range(20):
            pg.keyboard.press('ArrowRight')
        for _ in range(5):
            pg.keyboard.press('ArrowLeft')
        y1 = pg.evaluate('() => window.scrollY')
        check(f'{w}x{hgt} explore: arrow keys keep the page still', abs(y1 - y0) <= 1, f'scrollY {y0} → {y1}')

        # 4. clicking a history row still jumps to that step
        press(ws.locator('.history li').first)
        pg.wait_for_timeout(100)
        check(f'{w}x{hgt} explore: clicking a history row goes to that step', ws.locator('.stepnum').text_content().startswith('Step 0 /'))
        check(f'{w}x{hgt} no page errors', not errs, ' | '.join(errs[:3]))
        ctx.close()
    b.close()

print(f'\n{sum(results)}/{len(results)} checks passed')
raise SystemExit(0 if all(results) else 1)
