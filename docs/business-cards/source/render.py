"""Render the Zamaro business cards.

preview/  trimmed 3.5 x 2 in JPGs at 300 dpi, for review
print/    VistaPrint upload files: 3.61 x 2.11 in with bleed, as vector PDF and 300 dpi JPG

Usage: python -I docs/business-cards/source/render.py
"""
import io
import pathlib

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SRC = (HERE / 'card.html').as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch()
    for bleed, (w, h) in [(False, (1050, 600)), (True, (1083, 633))]:
        page = browser.new_page(viewport={'width': w, 'height': h})
        for theme in ['light', 'dark']:
            for side in ['front', 'back']:
                page.goto(f'{SRC}?side={side}&theme={theme}' + ('&bleed=1' if bleed else ''))
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(300)
                name = f'quinntyne-brown-{theme}-{side}'
                if bleed:
                    png = page.screenshot(type='png')
                    Image.open(io.BytesIO(png)).convert('RGB').save(
                        OUT / 'print' / f'{name}.jpg', quality=100, subsampling=0, dpi=(300, 300))
                    # 300 CSS px per inch in the layout; 0.32 scales to 96 px per inch for PDF.
                    page.pdf(path=OUT / 'print' / f'{name}.pdf', width='3.61in', height='2.11in',
                             scale=0.32, print_background=True, page_ranges='1',
                             margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
                else:
                    page.screenshot(path=OUT / 'preview' / f'{name}.jpg', type='jpeg', quality=95)
        page.close()
    browser.close()
