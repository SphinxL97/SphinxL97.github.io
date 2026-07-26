from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1500, 'height': 1000})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.goto('http://127.0.0.1:8000/detail.html?id=043', wait_until='networkidle')
    page.wait_for_function('() => Boolean(window.__WORK_043_STABLE_READY__ && window.__WORK_043_CROWDSOURCE_READY__)')
    page.wait_for_selector('#people .work043-manual-box', state='visible')

    img = page.locator('#people .work043-image-stage img').bounding_box()
    box = page.locator('#people .work043-manual-box').bounding_box()
    assert img and box, (img, box)
    assert img['width'] > 100 and img['height'] > 100

    ratios = {
        'left': (box['x'] - img['x']) / img['width'],
        'top': (box['y'] - img['y']) / img['height'],
        'width': box['width'] / img['width'],
        'height': box['height'] / img['height'],
    }
    expected = {
        'left': 385 / 1177,
        'top': 870 / 1800,
        'width': 120 / 1177,
        'height': 120 / 1800,
    }
    for key in expected:
        assert abs(ratios[key] - expected[key]) < 0.025, (key, ratios, expected)

    damage_text = page.locator('#people').inner_text()
    assert '红框标示“𡜱”字' in damage_text
    assert '人工核验校准' in damage_text
    assert '恢复依据' not in damage_text
    assert '资料查证结果' not in damage_text
    assert page.locator('#people .work043-manual-box').count() == 1

    page.wait_for_function("() => document.querySelector('#places [data-panel=\"missingText\"] .crowd-simple-head strong')?.textContent.includes('AI 补字意见')")
    card_text = page.locator('#places [data-panel="missingText"] .crowd-simple-card').inner_text()
    assert '原始残损文本' in card_text
    assert '网站当前 AI 恢复内容' in card_text
    assert not errors, errors

    page.locator('#people').screenshot(path='/tmp/work043-manual-red-box.png')
    browser.close()
