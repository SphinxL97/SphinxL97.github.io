from pathlib import Path
import json
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8000/detail.html?id="

with open("data/glyph_boxes/model_aligned_border_refined/001/page_0006.json", "r", encoding="utf-8") as f:
    records = json.load(f)
first = next(r for r in records if r.get("bbox_method") != "fallback_text_cell" and all(r.get(k) is not None for k in ("display_x", "display_y", "display_w", "display_h")))
expected = {
    "x": float(first["display_x"]),
    "y": float(first["display_y"]),
    "w": float(first["display_w"]),
    "h": float(first["display_h"]),
}

def wait_page(page, page_no):
    page.wait_for_function(
        "n => window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__ && window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__.page === n",
        arg=page_no,
        timeout=30000,
    )
    page.wait_for_selector(".glyph-box", timeout=30000)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1600, "height": 1100})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.goto(BASE + "001", wait_until="networkidle")
    page.select_option("#pageSelect", value="5")
    wait_page(page, 6)

    state = page.evaluate("window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__")
    assert state["loader"] == "columnOnePolicy", state
    assert state["mode"] == "model_aligned_display", state
    assert state["sources"] == ["model_aligned_display"], state
    assert state["firstRect"] == expected, (state["firstRect"], expected)

    body_text = page.locator("body").inner_text()
    for heading in ("二、碑文释文", "三、碑文残损与AI释读", "四、众智释读"):
        assert heading in body_text, heading

    first_box = page.locator(".glyph-box").first
    first_box.hover()
    assert "hover" in (first_box.get_attribute("class") or "")
    first_box.click()
    assert "selected" in (first_box.get_attribute("class") or "")

    page.locator(".jump-next").dblclick()
    wait_page(page, 7)
    assert page.locator("#pageSelect").input_value() == "6"

    page.locator(".jump-prev").dblclick()
    wait_page(page, 6)
    assert page.locator("#pageSelect").input_value() == "5"

    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    assert page.evaluate("window.scrollY") > 100
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(500)
    assert page.evaluate("window.scrollY") <= 2, page.evaluate("window.scrollY")

    page.goto(BASE + "014-01", wait_until="networkidle")
    page.select_option("#pageSelect", value="7")
    wait_page(page, 8)
    state_014 = page.evaluate("window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__")
    assert state_014["mode"] == "iiif", state_014

    page.goto(BASE + "031-01", wait_until="networkidle")
    page.select_option("#pageSelect", value="4")
    wait_page(page, 5)
    state_031 = page.evaluate("window.__COLUMN1_ACTIVE_COORDINATE_SOURCE__")
    assert state_031["mode"] == "iiif", state_031

    assert not errors, errors
    print(json.dumps({
        "001_page6": state,
        "014_page8": state_014,
        "031_page5": state_031,
        "double_click": "one page per double click",
        "scroll": "reset to top",
        "page_errors": errors,
    }, ensure_ascii=False, indent=2))
    browser.close()
