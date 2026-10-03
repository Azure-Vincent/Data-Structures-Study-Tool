# Browser UI check (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
import os; os.makedirs('shots', exist_ok=True)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':900})
    errs=[]; pg.on('pageerror', lambda e: errs.append((pg.url,str(e)))); pg.on('console', lambda m: errs.append((pg.url,m.text)) if m.type=='error' else None)
    pg.goto('http://localhost:5173/'); pg.wait_for_timeout(300)
    counts = pg.evaluate("import('./js/content/lessons.js').then(m=>m.LESSONS.map(l=>[l.lecture,l.sections.length]))")
    total=0
    for lec,n in counts:
        for i in range(n):
            pg.goto(f'http://localhost:5173/#/lesson/{lec}/{i}'); pg.wait_for_timeout(120)
            if pg.locator('.section-card').count()!=1: errs.append((lec,i,'no section'))
            # click continue to mark done
            pg.locator('button:has-text("Continue"), button:has-text("Finish lesson")').first.click()
            total+=1
    pg.goto('http://localhost:5173/#/'); pg.wait_for_timeout(300)
    print(total,'sections opened; dashboard next:', pg.locator('.next-card p').inner_text())
    print(errs or 'no errors')
    b.close()
