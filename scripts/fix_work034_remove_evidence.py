from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, got {count}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# 034专属模板：删除整个“依据/分析依据”可见区块，而不是只匹配旧类名。
replace_once(
    "js/work-034.js",
    'const VERSION="20260726_zhangjilao_034_v2";',
    'const VERSION="20260726_zhangjilao_034_v3";'
)
replace_once(
    "js/work-034.js",
    'const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current],analysis=(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("");',
    'const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];'
)
replace_once(
    "js/work-034.js",
    '<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div>',
    ''
)
replace_once(
    "js/work-034.js",
    'else if(button.dataset.action==="expand")expanded=!expanded;',
    ''
)

# 刷新共享路由和详情入口，确保浏览器加载真正删除区块后的脚本。
replace_once(
    "js/damage_ai_reading.js",
    'if(window.__DAMAGE_AI_READING_ROUTER_V74__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V74__=true;',
    'if(window.__DAMAGE_AI_READING_ROUTER_V75__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V75__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V74__=true;'
)
replace_once(
    "js/damage_ai_reading.js",
    'js/work-034.js?v=20260726_zhangjilao_034_v2',
    'js/work-034.js?v=20260726_zhangjilao_034_v3'
)
replace_once(
    "js/detail_info_patch.js",
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V34__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V34__=true;',
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V35__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V35__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V34__=true;'
)
replace_once(
    "js/detail_info_patch.js",
    'const recoveryVersion="20260726_zhangjilao_034_v2_no_basis";',
    'const recoveryVersion="20260726_zhangjilao_034_v3_no_evidence";'
)
replace_once(
    "detail.html",
    'js/detail_info_patch.js?v=20260726_zhangjilao_034_v2',
    'js/detail_info_patch.js?v=20260726_zhangjilao_034_v3'
)
replace_once(
    "detail.html",
    'js/damage_ai_reading.js?v=20260726_zhangjilao_034_v2',
    'js/damage_ai_reading.js?v=20260726_zhangjilao_034_v3'
)

# 静态断言。
work = Path("js/work-034.js").read_text(encoding="utf-8")
assert 'const VERSION="20260726_zhangjilao_034_v3";' in work
assert 'damage-evidence-block' not in work
assert '>AI分析依据<' not in work
assert '<span class="damage-label">恢复依据</span>' not in work
assert '>恢复后的上下文<' in work
assert 'data-action="expand"' not in work

router = Path("js/damage_ai_reading.js").read_text(encoding="utf-8")
entry = Path("js/detail_info_patch.js").read_text(encoding="utf-8")
detail = Path("detail.html").read_text(encoding="utf-8")
assert 'window.__DAMAGE_AI_READING_ROUTER_V75__=true;' in router
assert 'js/work-034.js?v=20260726_zhangjilao_034_v3' in router
assert 'window.__DETAIL_INFO_STABLE_ENTRY_V35__=true;' in entry
assert '20260726_zhangjilao_034_v3_no_evidence' in entry
assert 'js/detail_info_patch.js?v=20260726_zhangjilao_034_v3' in detail
assert 'js/damage_ai_reading.js?v=20260726_zhangjilao_034_v3' in detail

print("work034 visible evidence block removed")
