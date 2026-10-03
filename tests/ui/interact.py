# Browser UI check (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
import os; os.makedirs('shots', exist_ok=True)
from playwright.sync_api import sync_playwright, expect
BASE='http://localhost:5173/'
def shot(pg,name): pg.screenshot(path=f'shots/{name}.png', full_page=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1400, 'height': 1000})
    pg = ctx.new_page()
    errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('dialog', lambda d: d.accept())
    # 1. lesson 8 predict sim (section index 10)
    pg.goto(BASE+'#/lesson/8/10'); pg.wait_for_timeout(400)
    asked=0
    for i in range(80):
        pb = pg.locator('.predict-box')
        if pb.count():
            asked+=1
            pb.locator('.row button').first.click()
            pg.locator('text=Show the step').click()
            continue
        fwd = pg.locator('button:has-text("Step ▶")')
        if fwd.is_disabled(): break
        fwd.click()
    print('predictions asked:', asked, '| final explain:', pg.locator('.explain').inner_text()[:90])
    shot(pg,'i1_sim')
    # 2. rewire exercise (section 11): insert 15 after 10
    pg.goto(BASE+'#/lesson/8/11'); pg.wait_for_timeout(400)
    pg.locator('button:has-text("getnode(15)")').click()
    def field(addr, f='next'): return pg.locator(f'g[data-addr="{addr}"] rect.field-hit[data-field="{f}"]')
    def node(addr): return pg.locator(f'g[data-addr="{addr}"] rect.box')
    # wrong order first: 100->next = 400 loses access
    field(100).click(); node(400).click(force=True)
    pg.locator('button:has-text("Check")').click()
    print('wrong-order feedback:', pg.locator('.feedback').first.inner_text()[:160].replace('\n',' '))
    shot(pg,'i2_wrong')
    pg.locator('button:has-text("Undo")').click()
    # correct via keyboard panel for one link, mouse for the other
    field(400).click(); node(200).click(force=True)
    field(100).focus(); pg.keyboard.press('Enter')
    pg.locator('select[data-role=target]').select_option('400')
    pg.locator('.edit-panel button:has-text("Apply")').click()
    # Check button is disabled after first check? first check recorded; still can check again
    pg.locator('button:has-text("Check")').click()
    print('after fix:', pg.locator('.feedback').last.inner_text()[:160].replace('\n',' '))
    shot(pg,'i3_fixed')
    # 3. practice session + resume after reload
    pg.goto(BASE+'#/practice/new/mixed'); pg.wait_for_timeout(500)
    t1 = pg.locator('.task h2').inner_text()
    print('practice task 1:', t1, '|', pg.locator('.page-head .muted').first.inner_text())
    pg.locator('button:has-text("Reveal solution")').click()
    pg.locator('button:has-text("Next task")').click(); pg.wait_for_timeout(300)
    t2 = pg.locator('.task h2').inner_text()
    pg.reload(); pg.wait_for_timeout(600)
    pg.goto(BASE+'#/'); pg.wait_for_timeout(300)
    print('dashboard next:', pg.locator('.next-card p').inner_text())
    pg.locator('.next-card button').click(); pg.wait_for_timeout(400)
    print('resumed task:', pg.locator('.task h2').inner_text(), '(expected', t2, ')', pg.locator('.page-head .muted').first.inner_text())
    shot(pg,'i4_practice')
    # 4. explore: run insertMid
    pg.goto(BASE+'#/explore/sll'); pg.wait_for_timeout(300)
    pg.select_option('select[aria-label=operation]', 'insertMid')
    pg.locator('label:has-text("ask me to predict") input').uncheck()
    pg.locator('button:has-text("Run step by step")').click()
    for i in range(6): pg.locator('button:has-text("Step ▶")').click()
    print('explore step:', pg.locator('.stepnum').inner_text(), '| code line:', pg.locator('.code-panel li.cur').inner_text().strip()[:50])
    pg.locator('button:has-text("Play")').click(); pg.wait_for_timeout(200); pg.locator('button:has-text("Pause")').click()
    pg.keyboard.press('ArrowLeft')
    shot(pg,'i5_explore')
    # 5. repair lost access
    pg.goto(BASE+'#/repair/lost-access'); pg.wait_for_timeout(300)
    pg.locator('button:has-text("Check")').click()
    print('repair diag:', pg.locator('.feedback').first.inner_text()[:200].replace('\n',' '))
    shot(pg,'i6_repair')
    # 6. graph BFS
    pg.goto(BASE+'#/explore/graph'); pg.wait_for_timeout(300)
    pg.locator('button:has-text("Run BFS")').click()
    for i in range(40):
        fwd = pg.locator('button:has-text("Step ▶")')
        if fwd.is_disabled(): break
        fwd.click()
    print('BFS end:', pg.locator('.explain').inner_text()[:120])
    shot(pg,'i7_bfs')
    # 7. tree lesson click traversal
    pg.goto(BASE+'#/lesson/14/2'); pg.wait_for_timeout(300)
    for v in 'ABDECFG': pg.locator(f'.task g[data-node="{v}"]').click()
    pg.locator('button:has-text("Check")').click()
    print('preorder:', pg.locator('.feedback').first.inner_text()[:80].replace('\n',' '))
    shot(pg,'i8_tree')
    print('ERRORS:', errs or 'none')
    b.close()
