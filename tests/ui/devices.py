# Phone + desktop input checks (optional). Start the app first:  node server.js 5173
# (or point BASE at the published site). Requires: pip install playwright && python -m playwright install chromium
# Touch is driven through Chrome's DevTools protocol, so the page receives real touch/pointer events.
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:5173/')
ROUTES = ['#/', '#/lesson/8/0', '#/lesson/8/10', '#/lesson/8/11', '#/lesson/13/3', '#/practice', '#/practice/new/mixed', '#/try/l08-order-insert/3', '#/explore', '#/explore/dll', '#/explore/aqueue', '#/explore/tree', '#/explore/graph', '#/repair', '#/complexity', '#/progress', '#/settings', '#/lab/sll-insert-after', '#/lab/graph-bfs', '#/lab/free/tree']
fails = []

def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

def touch(client, kind, x=None, y=None):
    pts = [] if x is None else [{'x': x, 'y': y}]
    client.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})

def touch_drag(client, x0, y0, x1, y1, steps=10):
    touch(client, 'touchStart', x0, y0)
    for i in range(1, steps + 1):
        touch(client, 'touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps)
    touch(client, 'touchEnd')

def centre(loc):
    b = loc.bounding_box()
    return b['x'] + b['width'] / 2, b['y'] + b['height'] / 2

def sort_by_drags(pg, drag):
    want = pg.evaluate('window.__dslabExercise.answer')
    for k, id_ in enumerate(want):
        ids = pg.eval_on_selector_all('.order-item', 'els => els.map(e => e.dataset.id)')
        if ids.index(id_) == k: continue
        drag(pg.locator(f'.order-item[data-id="{id_}"]'), pg.locator('.order-item').nth(k))
    return pg.eval_on_selector_all('.order-item', 'els => els.map(e => e.dataset.id)') == want

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    errs = []

    # ------------------------------------------------------------------ phones
    for dev in ['Pixel 7', 'iPhone 13', 'Galaxy S9+']:
        d = p.devices[dev]
        W = d['viewport']['width']
        ctx = b.new_context(**d)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda x: x.accept())
        client = ctx.new_cdp_session(pg)
        wide = []
        for r in ROUTES:
            pg.goto(BASE + r); pg.wait_for_timeout(300)
            sw = pg.evaluate('document.documentElement.scrollWidth')
            if sw > W: wide.append(f'{r} ({sw}px)')
        ok(not wide, f'{dev}: all {len(ROUTES)} pages fit {W}px' + (f' — too wide: {wide}' if wide else ''))
        if dev == 'Galaxy S9+':
            ctx.close(); continue

        # menu drawer
        pg.goto(BASE + '#/'); pg.wait_for_timeout(300)
        pg.locator('button[aria-label="Open menu"]').tap(); pg.wait_for_timeout(450)
        pg.locator('nav.side a:has-text("Pseudocode Lab")').tap(); pg.wait_for_timeout(450)
        ok('#/lab' in pg.url, f'{dev}: menu opens and navigates by tap')

        # rewiring by taps: field, then node — the page must not jump away
        pg.goto(BASE + '#/lesson/8/11'); pg.wait_for_timeout(500)
        pg.locator('button:has-text("getnode(15)")').tap(); pg.wait_for_timeout(200)
        def tap_svg(sel):
            loc = pg.locator(sel); loc.scroll_into_view_if_needed()
            x, y = centre(loc); touch(client, 'touchStart', x, y); touch(client, 'touchEnd'); pg.wait_for_timeout(150)
        tap_svg('g[data-addr="400"] rect.field-hit[data-field="next"]')
        y0 = pg.evaluate('scrollY')
        active = pg.evaluate('document.activeElement && document.activeElement.dataset.role')
        ok(pg.locator('.field-hit.armed').count() == 1 and active != 'target', f'{dev}: tapping a pointer field arms it without moving focus')
        tap_svg('g[data-addr="200"] rect.box')
        ok(abs(pg.evaluate('scrollY') - y0) < 2, f'{dev}: page did not scroll between the two taps')
        tap_svg('g[data-addr="100"] rect.field-hit[data-field="next"]')
        tap_svg('g[data-addr="400"] rect.box')
        pg.locator('button:has-text("Check")').tap(); pg.wait_for_timeout(300)
        ok('Correct' in pg.locator('.feedback').last.inner_text(), f'{dev}: pointer exercise solved with taps only')

        # reordering by dragging the handle with a finger
        pg.goto(BASE + '#/try/l08-order-insert/3'); pg.wait_for_timeout(500)
        ok(pg.locator('.order-item .grip').first.is_visible(), f'{dev}: drag handle shown on touch screens')
        def finger(src, dst):
            src.locator('.grip').scroll_into_view_if_needed()
            x0, y0_ = centre(src.locator('.grip'))
            db = dst.bounding_box()
            touch_drag(client, x0, y0_, x0, db['y'] + 4)
            pg.wait_for_timeout(150)
        ok(sort_by_drags(pg, finger), f'{dev}: statements reordered by touch drag')
        before = pg.evaluate('scrollY')
        pg.locator('button:has-text("Check")').tap(); pg.wait_for_timeout(300)
        ok('Correct' in pg.locator('.feedback').last.inner_text(), f'{dev}: reordered answer accepted')

        # complexity lab: the experiment picker fits and works
        pg.goto(BASE + '#/complexity'); pg.wait_for_timeout(400)
        sel = pg.locator('select[aria-label="experiment"]')
        ok(sel.bounding_box()['x'] + sel.bounding_box()['width'] <= W, f'{dev}: experiment picker fits the screen')
        sel.select_option(index=3); pg.wait_for_timeout(200)
        ok(pg.locator('svg[aria-label*="counts"]').count() == 1, f'{dev}: changing the experiment redraws the chart')

        # pseudocode lab on the phone
        pg.goto(BASE + '#/lab/sll-traverse'); pg.wait_for_timeout(500)
        pg.locator('textarea.ce-input').tap()
        pg.keyboard.press('Control+a'); pg.keyboard.insert_text('cur = start\nwhile cur != NULL do\n  print cur.data\n  cur = cur.next\nend\n')
        pg.wait_for_timeout(450)
        for _ in range(3): pg.locator('button:has-text("Step ▶")').tap()
        ok(pg.locator('.ce-line.cur').count() == 1, f'{dev}: lab steps by tap')
        pg.locator('button:has-text("Check my solution")').tap(); pg.wait_for_timeout(300)
        ok('All 3' in pg.locator('.lab-check .feedback').inner_text(), f'{dev}: lab check passes')
        ctx.close()

    # ------------------------------------------------------------------ desktop: keyboard and mouse unchanged
    ctx = b.new_context(viewport={'width': 1400, 'height': 900})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '#/lesson/8/11'); pg.wait_for_timeout(500)
    pg.locator('button:has-text("getnode(15)")').click()
    pg.locator('g[data-addr="400"] rect.field-hit[data-field="next"]').focus(); pg.keyboard.press('Enter')
    ok(pg.evaluate('document.activeElement.dataset.role') == 'target', 'desktop: Enter on a pointer field moves focus to the target list')
    pg.select_option('select[data-role=target]', '200'); pg.locator('.edit-panel button:has-text("Apply")').click()
    y0 = pg.evaluate('scrollY')
    pg.locator('g[data-addr="100"] rect.field-hit[data-field="next"]').click(force=True)
    ok(pg.evaluate('document.activeElement.dataset.role') == 'target' and pg.evaluate('scrollY') == y0, 'desktop: mouse click arms the field, focuses the list, page stays put')
    pg.locator('g[data-addr="400"] rect.box').click(force=True)
    pg.locator('button:has-text("Check")').click(); pg.wait_for_timeout(300)
    ok('Correct' in pg.locator('.feedback').last.inner_text(), 'desktop: keyboard + mouse rewiring still solves the exercise')

    pg.goto(BASE + '#/try/l08-order-insert/3'); pg.wait_for_timeout(500)
    ok(not pg.locator('.order-item .grip').first.is_visible(), 'desktop (mouse only): no drag handle shown')
    ok('Drag the statements, or use' in pg.locator('.task').inner_text(), 'desktop: original instructions kept')
    ok(sort_by_drags(pg, lambda src, dst: src.drag_to(dst)), 'desktop: mouse drag-and-drop still reorders')
    pg.locator('button:has-text("Check")').click(); pg.wait_for_timeout(300)
    ok('Correct' in pg.locator('.feedback').last.inner_text(), 'desktop: reordered answer accepted')
    pg.goto(BASE + '#/try/l08-order-insert/4'); pg.wait_for_timeout(400)
    first = pg.locator('.order-item').first.get_attribute('data-id')
    pg.locator('.order-item').first.locator('button:has-text("↓")').focus(); pg.keyboard.press('Enter')
    ok(pg.locator('.order-item').nth(1).get_attribute('data-id') == first, 'desktop: keyboard ↓ button still moves a statement')

    m = pg.request.get(BASE + 'manifest.webmanifest')
    ok(m.ok and m.json()['short_name'] == 'DS Study Lab', 'web manifest is served and valid')
    for icon in ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']:
        ok(pg.request.get(BASE + icon).ok, f'{icon} is served')
    print('ERRORS:', errs or 'none')
    b.close()
    raise SystemExit(1 if fails else 0)
