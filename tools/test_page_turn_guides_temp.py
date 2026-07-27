import json
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000/detail.html'


def wait_page(page, expected):
    page.wait_for_function(
        "p => window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__ && window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__.page === p",
        arg=expected,
        timeout=20000,
    )
    return page.evaluate('window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))

    page.goto(f'{BASE}?id=001#reader', wait_until='networkidle')
    page.select_option('#pageSelect', '5')
    source_before = wait_page(page, 6)
    assert source_before['mode'] == 'model_aligned_border_refined', source_before

    prev = page.locator('.page-jump-zone.jump-prev')
    nxt = page.locator('.page-jump-zone.jump-next')
    assert prev.count() == 1 and nxt.count() == 1

    prev_style = prev.evaluate("el => {const s=getComputedStyle(el);return {bg:s.backgroundImage,size:s.backgroundSize,pos:s.backgroundPosition,width:s.width,border:s.borderStyle,opacity:s.opacity}}")
    next_style = nxt.evaluate("el => {const s=getComputedStyle(el);return {bg:s.backgroundImage,size:s.backgroundSize,pos:s.backgroundPosition,width:s.width,border:s.borderStyle,opacity:s.opacity}}")
    assert 'page-turn-prev.svg' in prev_style['bg'], prev_style
    assert 'page-turn-next.svg' in next_style['bg'], next_style
    assert prev_style['width'] == '130px' and next_style['width'] == '130px', (prev_style, next_style)
    assert prev_style['size'] == '56px 100%' and next_style['size'] == '56px 100%', (prev_style, next_style)
    assert prev_style['pos'].startswith('0%') and next_style['pos'].startswith('100%'), (prev_style, next_style)
    assert prev_style['border'] == 'none' and next_style['border'] == 'none', (prev_style, next_style)

    # The generated SVGs are served and contain the exact vertical wording.
    prev_svg = page.evaluate("""async () => await (await fetch('assets/ui/page-turn-prev.svg',{cache:'no-store'})).text()""")
    next_svg = page.evaluate("""async () => await (await fetch('assets/ui/page-turn-next.svg',{cache:'no-store'})).text()""")
    for char in ('双','击','向','前','翻','页'):
        assert f'>{char}<' in prev_svg, char
    for char in ('双','击','向','后','翻','页'):
        assert f'>{char}<' in next_svg, char
    assert 'font-weight="700"' in prev_svg and '>前<' in prev_svg
    assert 'font-weight="700"' in next_svg and '>后<' in next_svg

    # Existing navigation remains one page per double click.
    nxt.dblclick(position={'x': 30, 'y': 300})
    after_next = wait_page(page, 7)
    assert after_next['page'] == 7, after_next
    prev.dblclick(position={'x': 30, 'y': 300})
    after_prev = wait_page(page, 6)
    assert after_prev['page'] == 6, after_prev

    # Coordinate behavior and sections 2-4 remain intact.
    source_after = page.evaluate('window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__')
    assert source_after['mode'] == source_before['mode'], (source_before, source_after)
    body_text = page.locator('body').inner_text()
    for heading in ('二、碑文释文', '三、碑文残损与AI释读', '四、众智释读'):
        assert heading in body_text, heading
    assert not errors, errors

    page.screenshot(path='page-turn-guides-001.png', full_page=False)
    browser.close()

print(json.dumps({'ok': True, 'checked': ['vertical-svg-guides','narrow-outer-position','single-page-dblclick','coordinate-mode-unchanged','sections-2-4']}, ensure_ascii=False))
