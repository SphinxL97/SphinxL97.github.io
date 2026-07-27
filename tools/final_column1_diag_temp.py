from pathlib import Path
import json
import traceback
from playwright.sync_api import sync_playwright

checks = [
    ('001', 6, 'model_aligned_border_refined'),
    ('010', 10, 'model_aligned_border_refined'),
    ('023', 8, 'model_aligned_border_refined'),
    ('039-01', 3, 'model_border_refined'),
    ('044', 8, 'model_aligned_border_refined'),
    ('014-01', 8, 'iiif'),
    ('031-01', 5, 'iiif'),
]

out = Path('/tmp/final-column1-diag')
out.mkdir(parents=True, exist_ok=True)
results = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    for work_id, page_no, expected_mode in checks:
        record = {'work_id': work_id, 'page': page_no, 'expected_mode': expected_mode}
        page = browser.new_page(viewport={'width': 1500, 'height': 1000})
        js_errors = []
        page.on('pageerror', lambda exc, js_errors=js_errors: js_errors.append(str(exc)))
        try:
            page.goto(f'http://127.0.0.1:8000/detail.html?id={work_id}', wait_until='domcontentloaded', timeout=120000)
            page.wait_for_function('() => document.querySelectorAll("#pageSelect option").length > 0', timeout=120000)
            page.select_option('#pageSelect', str(page_no - 1))
            page.wait_for_function('(n) => window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__?.page === n', page_no, timeout=120000)
            page.wait_for_timeout(500)
            state = page.evaluate('window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__')
            record['state'] = state
            record['container_counts'] = {
                'reader': page.locator('#reader').count(),
                'calligraphy': page.locator('#calligraphy').count(),
                'people': page.locator('#people').count(),
                'places': page.locator('#places').count(),
            }
            record['image_error'] = '图片无法打开' in page.locator('body').inner_text()
            boxes = page.locator('#imageWrap .glyph-box')
            record['box_count'] = boxes.count()
            if boxes.count():
                first = boxes.first
                record['default_class'] = first.get_attribute('class')
                record['default_border'] = first.evaluate('(el) => getComputedStyle(el).borderTopColor')
                first.dispatch_event('mouseenter')
                record['hover_class'] = first.get_attribute('class')
                first.dispatch_event('click')
                record['selected_class'] = first.get_attribute('class')
            record['js_errors'] = js_errors
            record['ok'] = (
                state.get('mode') == expected_mode
                and state.get('recordCount', 0) > 0
                and record['container_counts'] == {'reader': 1, 'calligraphy': 1, 'people': 1, 'places': 1}
                and not record['image_error']
                and record['box_count'] > 0
                and not js_errors
            )
            if expected_mode == 'model_aligned_border_refined':
                record['ok'] = record['ok'] and state.get('sources') == ['model_aligned_border_refined']
            elif expected_mode == 'model_border_refined':
                record['ok'] = record['ok'] and state.get('sources') == ['model_border_refined']
        except Exception as exc:
            record['ok'] = False
            record['exception'] = repr(exc)
            record['traceback'] = traceback.format_exc()
            record['js_errors'] = js_errors
        try:
            page.screenshot(path=str(out / f'{work_id}.png'), full_page=True)
        except Exception:
            pass
        results.append(record)
        page.close()
    browser.close()

(out / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print((out / 'results.json').read_text(encoding='utf-8'))
