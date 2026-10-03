# Browser UI check (optional). Start the app first:  node server.js 5173
# Requires:  pip install playwright && python -m playwright install chromium
import os; os.makedirs('shots', exist_ok=True)
# Answer every template through the real UI using the model answer and expect "Correct".
import json, sys
from playwright.sync_api import sync_playwright
BASE='http://localhost:5173/'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1400,'height':1000})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
    pg.goto(BASE); pg.wait_for_timeout(300)
    ids = pg.evaluate("import('./js/exercises/registry.js').then(m=>m.TEMPLATES.map(t=>t.id))")
    bad=[]
    for tid in ids:
      for seed in (3,11):
        pg.goto(f'{BASE}#/try/{tid}/{seed}'); pg.wait_for_timeout(150)
        info = pg.evaluate("""() => { const e = window.__dslabExercise; return {kind:e.kind, answer: e.kind==='rewire'? null : e.answer, labels: e.labels||null, vtype: e.visual && e.visual.type, directed: e.directed} }""")
        k=info['kind']; a=info['answer']
        task=pg.locator('.task')
        try:
          if k=='mcq': task.locator(f'input[value="{a}"]').check()
          elif k=='multi':
            for x in a: task.locator(f'input[value="{x}"]').check()
          elif k in ('numeric',): task.locator('input[type=text]').fill('NULL' if a is None else str(a))
          elif k=='text': task.locator('input[type=text]').fill(' '.join(a) if a else 'empty')
          elif k=='fields':
            for fid,v in a.items(): task.locator('input[type=text]').nth(list(a.keys()).index(fid)).fill(str(v) if str(v) else 'none')
          elif k=='fill': task.locator('.fill-code input').fill(a)
          elif k=='order':
            # reorder via up buttons until it matches answer
            for target_i, idv in enumerate(a):
              cur=[el.get_attribute('data-id') for el in task.locator('.order-item').all()]
              j=cur.index(idv)
              while j>target_i:
                task.locator('.order-item').nth(j).locator('button').first.click(); j-=1
          elif k in ('sequence','nodepick'):
            if info['vtype']=='list':
              for x in a: task.locator(f'g[data-addr="{x}"] rect.box').first.click(force=True)
            else:
              for x in a: task.locator(f'g[data-node="{x}"]').first.click()
          elif k=='rewire':
            sol = pg.evaluate("import('./js/exercises/solver.js').then(m=>m.solveRewire(window.__dslabExercise).actions)")
            for act in sol:
              if act['type']=='alloc': task.locator('button:has-text("getnode")').click()
              elif act['type']=='free':
                sel=task.locator('select[aria-label="pointer to free"]')
                opts=sel.locator('option').all()
                val=[o.get_attribute('value') for o in opts if o.inner_text().strip().endswith(str(act['addr']))][0]
                sel.select_option(val); task.locator('button:has-text("Free")').click()
              else:
                key = f"v:{act['name']}" if act['type']=='setVar' else f"f:{act['addr']}:{act['field']}"
                task.locator('select[data-role=source]').select_option(key)
                task.locator('select[data-role=target]').select_option('null' if act['value'] is None else str(act['value']))
                task.locator('.edit-panel button:has-text("Apply")').click()
          elif k=='matrix':
            for i,row in enumerate(a):
              for j,v in enumerate(row):
                if v==1: task.locator('table.matrix tr').nth(i+1).locator('button').nth(j).click()
          elif k=='adjlist':
            for lab,v in a.items(): task.locator(f'input[aria-label="neighbours of {lab}"]').fill(v)
          elif k=='graphdraw':
            for u,v in a:
              task.locator(f'.diagram-box g[data-node="{u}"]').last.click(); task.locator(f'.diagram-box g[data-node="{v}"]').last.click()
          elif k=='treebuild':
            t=a
            def add(pid, side, idv):
              task.locator('select[aria-label="label for the next node"]').select_option(idv)
              if pid is None: task.locator('button:has-text("Add as root")').click()
              else: task.locator(f'[aria-label="add {side} child of {pid}"]').click()
            order=[t['root']]; add(None,None,t['root'])
            q=[t['root']]
            while q:
              x=q.pop(0); n=t['nodes'][x]
              for side in ('left','right'):
                if n[side]: add(x,side,n[side]); q.append(n[side])
          task.locator('button:has-text("Check")').click()
          fb=task.locator('.feedback').first.inner_text()
          if not fb.startswith('Correct'): bad.append((tid,seed,k,fb[:200]))
        except Exception as e:
          bad.append((tid,seed,k,'EXC '+str(e)[:200]))
    print(len(ids),'templates checked through UI')
    for x in bad: print('FAIL',x)
    print('errors', errs or 'none')
    b.close()
