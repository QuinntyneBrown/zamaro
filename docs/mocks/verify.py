"""Browser audit and preview capture; run after build.py and gallery.py.

Uses an isolated browser, local files and mock controls only. Writes artifacts
under .cache, except the intentional gallery preview images in assets/previews.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from build import ROOT, CONCEPTS, STATES

def main():
    failures=[]
    results=[]
    cache=ROOT/'.cache'
    cache.mkdir(exist_ok=True)
    (ROOT/'assets'/'previews').mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch()
        context=browser.new_context(reduced_motion='reduce')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        for concept,*_ in CONCEPTS:
            for screen in ['discover','artist']:
                for state in STATES:
                    file=ROOT/concept/'pages'/screen/f'{state}.html'
                    for width,height in [(360,800),(768,1024),(1280,800)]:
                        for theme in ['light','dark']:
                            label=f'{concept}/{screen}/{state}/{width}/{theme}'
                            page.set_viewport_size({'width':width,'height':height})
                            page.goto(file.as_uri()+f'?theme={theme}&chrome=0')
                            page.wait_for_load_state('load')
                            facts=page.evaluate('''() => ({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),theme:document.documentElement.dataset.theme})''')
                            if facts['overflow'] or facts['broken'] or facts['theme']!=theme:
                                failures.append({'view':label,**facts})
                            results.append(label)
                            if screen=='discover' and state=='default' and width==1280 and theme=='light':
                                page.screenshot(path=str(ROOT/'assets'/'previews'/f'{concept}.jpg'),type='jpeg',quality=85)
            # Validate shared controls in every direction, at mobile width.
            page.set_viewport_size({'width':360,'height':800})
            file=ROOT/concept/'pages'/'discover'/'default.html'
            page.goto(file.as_uri()+'?chrome=0')
            page.get_by_role('button',name='Under $800',exact=True).click()
            assert page.locator('[data-artist]:visible').count()==3, concept+' budget filter'
            assert set(page.locator('[data-artist]:visible').evaluate_all('(cards)=>cards.map(card=>card.dataset.artist)'))=={'Abigail Mensah','Elijah Park','Daniel & Ruth'}, concept+' budget membership'
            page.get_by_role('button',name='Spanish',exact=True).click()
            assert page.locator('[data-artist]:visible').count()==1, concept+' Spanish filter'
            page.get_by_role('button',name='All voices',exact=True).click()
            page.locator('#radius').select_option('50')
            page.locator('#location').fill('Burlington')
            page.get_by_role('button',name='Find your artist').click()
            assert page.locator('[data-artist]:visible').count()==5, concept+' radius filter'
            assert 'Burlington' in page.locator('#result-count').inner_text()
            page.locator('#event-date').fill('2026-11-15')
            page.get_by_role('button',name='Find your artist').click()
            assert page.locator('#live-empty').is_visible(), concept+' no availability'
            page.locator('[data-reset]').click()
            assert page.locator('[data-artist]:visible').count()==6
            save=page.locator('[data-save="Abigail Mensah"]')
            before=save.get_attribute('aria-pressed')
            save.click()
            assert save.get_attribute('aria-pressed')!=before
            page.locator('[data-panel="saved-panel"]').click()
            assert page.locator('#saved-panel').is_visible()
            page.locator('[data-slide="1"]').click()
            assert page.locator('[data-hero-name]').inner_text()=='Hosanna Collective'
            assert page.locator('[data-hero-image]').evaluate('(img)=>img.complete&&img.naturalWidth>0')
            # Enter the one fully mocked profile via its actual link.
            page.locator('.card-image[href]').click()
            assert page.locator('h1').inner_text().replace('\n',' ')=='Abigail Mensah.'
            page.locator('#booking-date').fill('2026-11-15')
            page.get_by_role('button',name='Request to book').click()
            assert page.locator('#booking-date').get_attribute('aria-invalid')=='true'
            page.locator('#booking-date').fill('2026-11-21')
            page.get_by_role('button',name='Request to book').click()
            assert 'Nothing was sent' in page.locator('#booking-feedback').inner_text()
            page.locator('[data-preview]').click()
            assert page.locator('#preview-details').is_visible()
            # Keyboard: skip link receives first focus; theme shortcut respects fields.
            page.goto(file.as_uri())
            page.keyboard.press('Tab')
            assert page.locator('.skip-link').evaluate('(el)=>el===document.activeElement')
            page.keyboard.press('Enter')
            page.keyboard.press('t')
            assert page.locator('html').get_attribute('data-theme')=='dark'
            page.locator('#location').focus()
            page.keyboard.press('t')
            assert page.locator('html').get_attribute('data-theme')=='dark'
            print(f'{concept}: responsive/theme audit and interactions passed',flush=True)
        # Explicit unavailable-GPU fallback through an isolated browser context.
        fallback=browser.new_context()
        fallback.add_init_script("Object.defineProperty(navigator,'gpu',{value:undefined})")
        fp=fallback.new_page()
        for slug in ['halo','constellation']:
            fp.goto((ROOT/slug/'pages'/'discover'/'default.html').as_uri())
            assert fp.locator('canvas').get_attribute('data-renderer')=='static'
            assert fp.locator('[data-hero-image]').is_visible()
            assert fp.locator('[data-motion]').is_hidden()
        fallback.close()
        browser.close()
    report={'views_checked':len(results),'failures':failures,'javascript_errors':errors,'interaction_concepts':len(CONCEPTS)}
    (cache/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
    assert not failures and not errors, 'See .cache/audit.json'

if __name__=='__main__':
    main()
