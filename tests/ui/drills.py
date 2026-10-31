# Browser UI check (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
#            (or set CHROMIUM=/path/to/chrome to use an installed Chromium)
#
# Pseudocode drills: the overview shows every card with its starting structure,
# a session runs card by card in the Lab's drill mode, and the automatic grade
# (good / hard / again) sets when each card comes back.
import os, sys
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173/'
results = []
def check(name, ok, detail=''):
    results.append(ok)
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    pg = b.new_page(viewport={'width': 1300, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('dialog', lambda d: d.accept())
    pg.goto(BASE + '#/drills'); pg.wait_for_timeout(600)
    deck = pg.evaluate("import('./js/progress/drills.js').then(m => m.DRILL_DECK.length)")
    check('overview lists every card', pg.locator('.drill-card').count() == deck, f'{deck} cards')
    kinds = pg.evaluate("""() => { const o = {}; for (const c of document.querySelectorAll('.drill-card')) { const t = c.querySelector('.pill').textContent; const svg = c.querySelector('.drill-thumb svg, .drill-thumb .lab-colls'); o[t] = (o[t] || 0) + (svg ? 1 : 0); } return o; }""")
    for k in ['Singly linked list', 'Doubly linked list', 'Circular linked list', 'Stack (linked)', 'Queue (linked)', 'Graph', 'Binary tree']:
        check(f'cards for “{k}” show their starting structure', kinds.get(k, 0) > 0, str(kinds.get(k)))
    check('the menu has a Pseudocode drills entry', pg.locator('.nav a[href="#/drills"]').count() == 1)

    start = pg.locator('.drill-actions .btn').first
    check('a new learner can start a session of new cards', 'Start a session' in start.inner_text(), start.inner_text())
    start.click(); pg.wait_for_timeout(700)
    first = pg.url.split('/')[-1]
    check('the session opens the first card in the Lab', '#/drills/' in pg.url and pg.locator('.lab-editor, textarea.ce-input').count() > 0 and 'card 1 of' in pg.locator('.eyebrow').first.inner_text().lower())
    check('drill mode hides the exercise picker', pg.locator('select[aria-label="Choose an exercise"]').count() == 0)
    solution = lambda: pg.evaluate("(id) => import('./js/lab/exercises.js').then(m => m.EXERCISE_BY_ID[id].solution)", pg.url.split('/')[-1])
    starter = lambda: pg.evaluate("(id) => import('./js/lab/exercises.js').then(m => m.EXERCISE_BY_ID[id].starter)", pg.url.split('/')[-1])
    check('each card starts from the exercise’s starting code', pg.locator('textarea.ce-input').input_value() == starter())

    pg.locator('textarea.ce-input').fill(solution()); pg.wait_for_timeout(300)
    pg.click('button:has-text("Check my solution")'); pg.wait_for_timeout(300)
    v = pg.locator('.drill-verdict').inner_text()
    check('passing on the first check grades the card “good”', v.startswith('Good.') and 'tomorrow' in v, v[:80])
    pg.click('.drill-verdict button'); pg.wait_for_timeout(600)
    second = pg.url.split('/')[-1]
    check('“Next card” opens the next card', second != first and 'card 2 of' in pg.locator('.eyebrow').first.inner_text().lower())

    pg.locator('textarea.ce-input').fill('x = 1\n'); pg.wait_for_timeout(300)
    pg.click('button:has-text("Check my solution")'); pg.wait_for_timeout(300)
    check('a failed check does not grade the card yet', pg.locator('.drill-verdict').count() == 0)
    pg.locator('textarea.ce-input').fill(solution()); pg.wait_for_timeout(300)
    pg.click('button:has-text("Check my solution")'); pg.wait_for_timeout(300)
    check('passing after a failed check grades it “hard”', pg.locator('.drill-verdict').inner_text().startswith('Hard.'))
    pg.click('.drill-verdict button'); pg.wait_for_timeout(600)

    for _ in range(4):
        hb = pg.locator('.lab-check button:has-text("Hint")')
        if hb.count(): hb.first.click(); pg.wait_for_timeout(100)
    pg.click('button:has-text("Show solution")'); pg.wait_for_timeout(300)
    check('showing the solution grades it “again” (10 minutes)', pg.locator('.drill-verdict').inner_text().startswith('Again.') and 'in 10 min' in pg.locator('.drill-verdict').inner_text())
    total = pg.evaluate("JSON.parse(localStorage.getItem('dslab.progress.v1')).drills.session.ids.length")
    check('the forgotten card is added to the end of the session', total == 6, f'{total} cards')

    pg.click('button:has-text("End session")'); pg.wait_for_timeout(600)
    check('ending the session returns to the overview with a summary', pg.url.endswith('#/drills') and '1 good, 1 hard, 1 again' in pg.locator('.feedback.ok').first.inner_text())
    st = pg.evaluate("JSON.parse(localStorage.getItem('dslab.progress.v1')).drills.cards")
    check('the schedule is saved per card', st[first]['box'] == 1 and st[second]['box'] == 1 and len(st) == 3, str({k: v['lastResult'] for k, v in st.items()}))
    check('the forecast shows the reviews coming up', pg.locator('.drill-day .n').all_inner_texts()[:2] != ['', ''])

    # next day: the reviewed cards are due, the menu shows how many
    pg.evaluate("""() => { const d = JSON.parse(localStorage.getItem('dslab.progress.v1')); for (const c of Object.values(d.drills.cards)) { c.due -= 2 * 864e5; c.firstAt -= 2 * 864e5; } localStorage.setItem('dslab.progress.v1', JSON.stringify(d)); }""")
    pg.reload(); pg.wait_for_timeout(600)
    badge = pg.locator('.nav a[href="#/drills"] .nav-badge')
    check('due cards show as a badge in the menu', badge.count() == 1 and badge.inner_text() == '3', badge.inner_text() if badge.count() else 'none')
    check('the next session starts with the due cards', '8 cards' in pg.locator('.drill-actions .btn').first.inner_text(), pg.locator('.drill-actions .btn').first.inner_text())

    pg.goto(BASE + '#/'); pg.wait_for_timeout(400)
    check('the dashboard links to the drills', pg.locator('.quick-card:has-text("Pseudocode drills")').count() == 1)
    check('no page errors', not errs, '; '.join(errs[:3]))
    b.close()
print(f'\n{sum(results)}/{len(results)} checks passed')
sys.exit(0 if all(results) else 1)
