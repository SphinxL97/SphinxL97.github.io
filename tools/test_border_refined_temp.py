import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8000/detail.html'


def wait_source(page, expected_page):
    page.wait_for_function(
        "p => window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__ && window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__.page === p",
        expected_page,
        timeout=20000,
    )
    return page.evaluate('window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))

    # 001 page 6: exact border_* fields must drive the overlay.
    page.goto(f'{BASE}?id=001#reader', wait_until='networkidle')
    page.select_option('#pageSelect', '5')
    source = wait_source(page, 6)
    assert source['mode'] == 'model_aligned_border_refined', source
    records = page.evaluate("""async () => await (await fetch('data/glyph_boxes/model_aligned_border_refined/001/page_0006.json', {cache:'no-store'})).json()""")
    first = records[0]
    expected_first = {k: float(first[f'border_{k}']) for k in ('x','y','w','h')}
    for key, value in expected_first.items():
        assert abs(float(source['firstRect'][key]) - value) < 0.01, (key, source, expected_first)

    img_scale = page.evaluate("parseFloat(document.querySelector('#pageImage').style.width) / document.querySelector('#pageImage').naturalWidth")
    assert img_scale > 0
    for order in (24, 25):
        rec = next(r for r in records if int(r.get('order_in_page', 0)) == order)
        gid = rec['glyph_id']
        style = page.locator(f'.glyph-box[data-glyph-id="{gid}"]').evaluate("el => ({left:parseFloat(el.style.left),top:parseFloat(el.style.top),width:parseFloat(el.style.width),height:parseFloat(el.style.height)})")
        expected = {
            'left': float(rec['border_x']) * img_scale,
            'top': float(rec['border_y']) * img_scale,
            'width': float(rec['border_w']) * img_scale,
            'height': float(rec['border_h']) * img_scale,
        }
        for key in expected:
            assert abs(style[key] - expected[key]) < 1.1, (order, key, style, expected)
        # The QA image is border-refined; at least one selected record must differ from display_*.
    rec25 = next(r for r in records if int(r.get('order_in_page', 0)) == 25)
    assert any(float(rec25[f'border_{k}']) != float(rec25[f'display_{k}']) for k in ('x','y','w','h')), rec25

    # Existing interaction rules must remain intact.
    page.locator('.reader-char').filter(has_text=rec25['char']).nth(1).click(force=True)
    assert page.locator(f'.glyph-box[data-glyph-id="{rec25["glyph_id"]}"]').evaluate("el => el.classList.contains('selected')")

    page.select_option('#pageSelect', '5')
    wait_source(page, 6)
    page.locator('.jump-next').dblclick(position={'x': 20, 'y': 100})
    after = wait_source(page, 7)
    assert after['page'] == 7, after

    page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(1200)
    assert page.evaluate('window.scrollY') < 10, page.evaluate('window.scrollY')

    # IIIF exceptions stay unchanged.
    for work_id, page_index, expected_page in [('014-01', '7', 8), ('031-01', '4', 5)]:
        page.goto(f'{BASE}?id={work_id}#reader', wait_until='networkidle')
        page.select_option('#pageSelect', page_index)
        src = wait_source(page, expected_page)
        assert src['mode'] == 'iiif', (work_id, src)
        for selector in ('#reader', '#transcriptSection', '#damage-ai-reading', '#crowdsource-reading'):
            assert page.locator(selector).count() == 1, (work_id, selector)

    assert not errors, errors
    browser.close()

print(json.dumps({'ok': True, 'checked': ['001-border-24-25', 'dblclick', 'scroll-top', '014-IIIF', '031-IIIF']}, ensure_ascii=False))
