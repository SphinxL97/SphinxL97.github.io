from pathlib import Path

replacements = {
    "js/work-035.js": [
        ('const VERSION="20260726_wushici_035_v3";', 'const VERSION="20260726_wushici_035_v4";'),
        ('<span class="work035-real-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" title="${esc(loc.glyph_id||"")}"></span>', '<span class="work035-real-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-hidden="true"></span>'),
    ],
    "js/work-035-coordinate-adapter.js": [
        ('const CACHE_TAG="20260726_wushici_035_v3";', 'const CACHE_TAG="20260726_wushici_035_v4";'),
    ],
    "js/damage_ai_reading.js": [
        ('if(window.__DAMAGE_AI_READING_ROUTER_V78__)return;', 'if(window.__DAMAGE_AI_READING_ROUTER_V79__)return;'),
        ('window.__DAMAGE_AI_READING_ROUTER_V78__=true;', 'window.__DAMAGE_AI_READING_ROUTER_V79__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V78__=true;'),
        ('20260726_wushici_035_v3', '20260726_wushici_035_v4'),
    ],
    "js/detail_info_patch.js": [
        ('if(window.__DETAIL_INFO_STABLE_ENTRY_V38__)return;', 'if(window.__DETAIL_INFO_STABLE_ENTRY_V39__)return;'),
        ('window.__DETAIL_INFO_STABLE_ENTRY_V38__=true;', 'window.__DETAIL_INFO_STABLE_ENTRY_V39__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V38__=true;'),
        ('20260726_wushici_035_v3', '20260726_wushici_035_v4'),
    ],
    "detail.html": [
        ('20260726_wushici_035_v3', '20260726_wushici_035_v4'),
    ],
}

for filename, changes in replacements.items():
    path = Path(filename)
    text = path.read_text(encoding="utf-8")
    for old, new in changes:
        if old not in text:
            raise SystemExit(f"missing expected text in {filename}: {old}")
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
