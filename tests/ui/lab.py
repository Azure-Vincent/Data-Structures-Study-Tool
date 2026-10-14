# Browser check of the Pseudocode Lab (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
import os; os.makedirs('shots', exist_ok=True)
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:5173/'
WRONG = 'newnode = new Node(15)\nstart.next = newnode\nnewnode.next = start.next'

def set_code(pg, code):
    pg.evaluate("c => { const t = document.querySelector('textarea.ce-input'); t.value = c; t.dispatchEvent(new Event('input')); }", code)
    pg.wait_for_timeout(400)

def counter(pg):
    return pg.locator('.lab-controls .stepnum').inner_text()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    pg = b.new_context(viewport={'width': 1400, 'height': 1000}).new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('dialog', lambda d: d.accept())
    ok = lambda cond, msg: print(('PASS ' if cond else 'FAIL ') + msg)

    # 1. guided exercise: wrong order → lost reference with before/after
    pg.goto(BASE + '#/lab/sll-insert-after'); pg.wait_for_timeout(500)
    ok(pg.locator('.lab-goal h2').inner_text() == 'Insert 15 after the first node', 'opens the example exercise')
    set_code(pg, WRONG)
    step = pg.locator('button:has-text("Step ▶")')
    for _ in range(3): step.click()
    ok(pg.locator('.ce-line.cur').inner_text().strip() == 'start.next = newnode', 'current line is highlighted in the editor')
    ok('Lost reference' in pg.locator('.lab-problems').inner_text(), 'lost reference reported at the step it happens')
    ok(pg.locator('[data-addr="200"].lost, [data-addr="200"] .tag').count() > 0, 'unreachable node marked in the diagram')
    pg.locator('button:has-text("Show before / after")').first.click()
    ok(pg.locator('.lab-ba figure').count() == 2, 'before / after diagrams shown')
    pg.locator('button:has-text("◀ Back")').click()
    ok(counter(pg).startswith('Step 2'), 'step back: ' + counter(pg))
    pg.locator('button:has-text("Run to end")').click()
    ok('Finished' in pg.locator('.lab-explain').inner_text(), 'run to end')
    pg.locator('button:has-text("Check my solution")').click(); pg.wait_for_timeout(300)
    ok('0 of 3' in pg.locator('.lab-check .feedback').inner_text(), 'check fails the wrong order')
    ok('changed from @200 to @400' in pg.locator('.lab-results').inner_text(), 'check explains why')
    pg.screenshot(path='shots/lab1_wrong.png', full_page=True)

    # 2. hints, solution, check passes; progress recorded
    for _ in range(3): pg.locator('button:has-text("Hint")').first.click()
    ok(pg.locator('.lab-hints li').count() == 3, 'three progressive hints')
    pg.locator('button:has-text("Show solution")').click()
    pg.locator('button:has-text("Load into the editor")').click(); pg.wait_for_timeout(400)
    pg.locator('button:has-text("Check my solution")').click(); pg.wait_for_timeout(300)
    ok('All 3 test cases pass' in pg.locator('.lab-check .feedback').inner_text(), 'solution passes all tests')
    attempts = pg.evaluate("JSON.parse(localStorage.getItem('dslab.progress.v1')).attempts.filter(a => a.templateId === 'lab-sll-insert-after').length")
    ok(attempts == 2, f'attempts recorded in progress ({attempts})')

    # 3. run / pause / stop / reset and editing resets the run
    pg.goto(BASE + '#/lab/csll-traverse'); pg.wait_for_timeout(500)
    set_code(pg, 'p = start\nwhile p != NULL do\n  print p.data\n  p = p.next\nend')
    pg.select_option('select[aria-label="Execution speed"]', 'turbo')
    pg.locator('button:has-text("▶ Run")').click(); pg.wait_for_timeout(700)
    pg.locator('button:has-text("Pause")').click()
    n1 = counter(pg); pg.wait_for_timeout(400)
    ok(n1 == counter(pg) and not n1.startswith('Step 0'), 'pause holds the position: ' + n1)
    pg.locator('button:has-text("Stop")').click()
    ok('Stopped' in pg.locator('.lab-explain').inner_text() and pg.locator('button:has-text("Step ▶")').is_disabled(), 'stop ends the program')
    pg.locator('button:has-text("↺ Reset")').click()
    ok(counter(pg).startswith('Step 0'), 'reset')
    pg.select_option('select[aria-label="Instruction limit"]', '500')
    pg.locator('button:has-text("Run to end")').click()
    ok('instruction limit' in pg.locator('.lab-explain').inner_text(), 'endless loop stopped by the limit')
    step = pg.locator('button:has-text("Step ▶")')
    pg.locator('button:has-text("↺ Reset")').click(); step.click(); step.click()
    set_code(pg, 'p = start')
    ok(counter(pg).startswith('Step 0') and 'restarted' in pg.locator('.lab-explain').inner_text(), 'editing the code resets the run')

    # 4. syntax error is shown on its line; draft survives a reload
    set_code(pg, 'p = start\nif p == NULL\n  print 1\nend')
    ok('Syntax error on line 2' in pg.locator('.lab-status').inner_text(), 'syntax error in the status line')
    ok(pg.locator('.ce-line.err').count() == 1, 'syntax error line marked')
    pg.reload(); pg.wait_for_timeout(600)
    ok('if p == NULL' in pg.locator('textarea.ce-input').input_value(), 'draft restored after reload')

    # 5. free mode: build a structure, load an example, run it
    pg.goto(BASE + '#/lab/free/tree'); pg.wait_for_timeout(500)
    pg.fill('input[aria-label="initial values"]', '50 30 70 - 40')
    pg.locator('button:has-text("Build")').click()
    pg.select_option('select[aria-label="Load an example"]', label='Inorder (recursive)'); pg.wait_for_timeout(400)
    pg.locator('button:has-text("Run to end")').click()
    ok(pg.locator('.lab-output').inner_text().split() == ['30', '40', '50', '70'], 'free-mode tree inorder output')
    ok('can’t tell whether this is the result you meant' in pg.locator('.lab-problems').inner_text(), 'free mode explains it cannot judge correctness')
    pg.goto(BASE + '#/lab/free/graph'); pg.wait_for_timeout(500)
    pg.locator('button:has-text("Run to end")').click()
    ok(len(pg.locator('.lab-output').inner_text().split()) == 9, 'graph BFS example visits all 9 vertices')
    pg.screenshot(path='shots/lab2_graph.png', full_page=True)
    print('ERRORS:', errs or 'none')
    b.close()
