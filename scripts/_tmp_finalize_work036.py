import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260726_yiheming_036_v1"
WORK_ID = "036"
TITLE = "瘗鹤铭"
FULL_TEXT = """未遂□。山之下，仙家相此胎禽。浮□袁留，唯髣事髴，亦□□土惟寜。浚蕩洪流，前固重□塏，勢掩華亭，□集真侣□。

上皇嵗得扵華，午嵗化□。未□未遂□也，廼□□黄之幣，蔵乎山之下。仙家□石，事□銘不朽，詞□。相此胎禽，浮□袁留。唯髣髴，事亦□土惟寜。浚蕩洪流，前固重□塏，勢掩華亭，□集真侣。□□山徴君，丹楊外仙尉，□隂真□。
"""

case_defs = json.loads((ROOT / "data/_tmp_work036_case_seed.json").read_text(encoding="utf-8"))
model = json.loads((ROOT / "data/model_boxes/glyph_model_border_036_040.json").read_text(encoding="utf-8"))
rows = [r for r in model if str(r.get("work_id", "")).zfill(3) == WORK_ID]
rows.sort(key=lambda r: (int(r.get("canvas_index", 0)), int(r.get("order_in_page", 0))))
assert len(rows) == 138, len(rows)
pages = defaultdict(list)
for row in rows:
    pages[int(row["canvas_index"])].append(row)
boxes = [r for page in sorted(pages) for r in pages[page] if str(r.get("char", "")) == "□"]
assert len(boxes) == 31, len(boxes)
box_by_global = {i + 1: row for i, row in enumerate(boxes)}

coord_root = ROOT / "data/glyph_boxes/iiif/036"
coord_root.mkdir(parents=True, exist_ok=True)
for old in coord_root.glob("page_*.json"):
    old.unlink()
for page, page_rows in pages.items():
    (coord_root / f"page_{page:04d}.json").write_text(
        json.dumps(page_rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

cases = []
for item in case_defs:
    row = box_by_global[item["first_global_box"]]
    page = int(row["canvas_index"])
    location = {
        "page": page,
        "glyph_id": row["glyph_id"],
        "char": row.get("char", "□"),
        "bbox": {"x": row["x"], "y": row["y"], "w": row["w"], "h": row["h"]},
        "canvas_width": row["canvas_width"],
        "canvas_height": row["canvas_height"],
        "order_in_page": row.get("order_in_page"),
        "source": row.get("source", "model_border_refined"),
        "match_method": "confirmed-user-slot-to-model-marker",
        "match_confidence": "high" if item["confidence"] == "高" else "contextual",
    }
    case = {k: v for k, v in item.items() if k not in {"first_global_box", "slot_global_boxes"}}
    case.update({
        "n": "残损碑文恢复", "t": item["title"], "o": item["original"], "c": item["corrected"],
        "page": page, "locations": [location], "slot_global_boxes": item["slot_global_boxes"],
    })
    cases.append(case)

assert FULL_TEXT.count("□") == 23
assert len(cases) == 13
assert sum(len(c["slot_global_boxes"]) for c in cases) == 23
(ROOT / "data/work036_full_text.txt").write_text(FULL_TEXT, encoding="utf-8")
(ROOT / "data/work036_damage_cases.json").write_text(
    json.dumps(cases, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)

mapped = sorted({n for item in case_defs for n in item["slot_global_boxes"]})
unmatched = [i for i in range(1, 32) if i not in mapped]
report = {
    "work_id": WORK_ID, "title": TITLE, "version": VERSION, "digital_page_count": 78,
    "model_glyph_count": 138, "model_page_count": len(pages), "model_pages": sorted(pages),
    "model_box_count": 31, "user_transcript_box_count": 23, "case_count": 13,
    "located_case_count": 13, "mapped_user_slots": mapped,
    "unmatched_model_box_orders": unmatched, "unmatched_model_box_count": len(unmatched),
    "unmatched_explanation": "模型比用户底稿多8个残损框，来自被底稿压缩或省略的后续缺损；这些框不被强行映射到不存在的用户槽位。",
    "special_pages": {
        "no_model_before_text": list(range(1, 6)), "gap_between_versions": list(range(27, 32)),
        "after_model_text": list(range(75, 79)),
        "policy": "无真实模型字框的页面保留原图浏览，不生成推测性坐标。",
    },
    "case_locations": [
        {"id": c["id"], "title": c["title"], "page": c["page"],
         "glyph_id": c["locations"][0]["glyph_id"], "bbox": c["locations"][0]["bbox"],
         "slot_global_boxes": c["slot_global_boxes"]} for c in cases
    ],
}
(ROOT / "data/work036_coordinate_report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
)

page_index_path = ROOT / "data/page_images_index.json"
page_index = json.loads(page_index_path.read_text(encoding="utf-8"))
work = page_index["works"][WORK_ID]
assert len(work["pages"]) == 78
for page_obj in work["pages"]:
    page_rows = pages.get(int(page_obj["page"]), [])
    sequence = "".join(str(r.get("char", "")) for r in page_rows)
    page_obj.update({
        "text_clean": sequence,
        "text_raw": "\n".join(str(r.get("char", "")) for r in page_rows),
        "char_count": len(page_rows), "has_char_boxes": bool(page_rows),
    })
page_index_path.write_text(json.dumps(page_index, ensure_ascii=False, indent=2), encoding="utf-8")

catalog_path = ROOT / "data/beitie_catalog.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
entry = next(x for x in catalog if str(x.get("id")) == WORK_ID)
entry.update({
    "dynasty": "南朝梁（传天监十三年，514）", "script": "正书",
    "creator": "华阳真逸撰、上皇山樵书（石刻署名）", "status": "专属内容已接入",
    "subtitle": "78页图像、用户确认底稿、13例释读与138个真实模型字框已接入。", "year": "514",
})
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

header_path = ROOT / "data/beitie_header_info.json"
header = json.loads(header_path.read_text(encoding="utf-8"))
header[WORK_ID] = {
    "source_file": "瘗鹤铭.txt", "title": TITLE,
    "basic": {
        "首题": TITLE, "责任者": "华阳真逸撰、上皇山樵书（石刻署名；具体作者、书者存争议）",
        "书体": "正书", "版本": "水前小扑小纸拓本，附水后本", "数量": "13开；数字化图像78页",
        "尺寸": "册高34厘米，宽18.2厘米。碑文10开，帖芯高27.4厘米，宽15.2厘米。",
        "刻立年代": "南朝梁（传天监十三年，514）", "刻立地点": "江苏镇江焦山西麓崖壁",
        "馆藏": "上海图书馆", "馆藏号": "19A353",
        "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第一辑，上海图书馆，上海古籍出版社，2006年。",
        "版本说明": "本册收水前小扑小纸拓本并附水后本，装裱13开；网站78页为数字化图像数，二者不是同一计数口径。",
        "残损统计": "用户底稿共23个方框，整理13组栏目三案例；23个均给出候选。模型汇总含138个真实字框、31个模型残损框，13例均绑定用户槽位对应的第一个真实模型字框。",
    },
}
header_path.write_text(json.dumps(header, ensure_ascii=False, indent=2), encoding="utf-8")

coord_template = (ROOT / "js/work-035-coordinate-adapter.js").read_text(encoding="utf-8")
coord_js = coord_template.replace("035", "036").replace("武氏祠画像题字", "瘗鹤铭").replace("wushici", "yiheming")
coord_js = re.sub(r'const CACHE_TAG="[^"]+";', f'const CACHE_TAG="{VERSION}";', coord_js)
(ROOT / "js/work-036-coordinate-adapter.js").write_text(coord_js, encoding="utf-8")

work_template = (ROOT / "js/work-035.js").read_text(encoding="utf-8")
work_js = work_template.replace("035", "036").replace("武氏祠画像题字", "瘗鹤铭").replace("wushici", "yiheming").replace("WUSHICI", "YIHEMING")
work_js = re.sub(r'const VERSION="[^"]+";', f'const VERSION="{VERSION}";', work_js)
work_js = re.sub(
    r'const INTRO="[^"]*";',
    'const INTRO="本栏目整理13组《瘗鹤铭》残文校读，覆盖用户底稿中的23个原始方框。公开录文能够确认时采用文献对校；方框数量少于原石缺损范围时，严格按用户底稿槽位给出候选，并在“AI分析依据”中说明压缩或省略情况。栏目三图片只使用真实模型坐标。";',
    work_js,
)
start = work_js.index("  function applySupplementalInfo(){")
end = work_js.index("  function ensureCrowdsource(){", start)
supplemental = '''  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="南朝摩崖刻石名品，原刻于江苏镇江焦山西麓，内容记述葬鹤之事。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本构成"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("水前小扑小纸拓本并附水后本，数字图像78页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("石刻署名"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("石刻署“华阳真逸撰、上皇山樵书”，具体作者与书者历来存争议。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">原刻地点</div><div class="modal-desc">江苏镇江焦山西麓崖壁。</div><div class="modal-term">版本形态</div><div class="modal-desc">本册收水前小扑小纸拓本并附水后本，装裱13开；网站收录数字化图像78页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>葬鹤与摩崖残文</h3><p>《瘗鹤铭》以残存文字记述葬鹤之事，原石长期受江水冲刷，形成水前本与出水后拓本并存的版本面貌。</p><p>栏目二保留用户确认底稿中的原始方框；栏目三把文献对校、混合判断和AI暂拟分别标明，并逐例说明推理过程。</p>';
  }
'''
work_js = work_js[:start] + supplemental + work_js[end:]
assert "清代题记校读说明" not in work_js
assert "真实模型字框" not in work_js
assert 'title="${esc(loc.glyph_id' not in work_js
(ROOT / "js/work-036.js").write_text(work_js, encoding="utf-8")

router_path = ROOT / "js/damage_ai_reading.js"
router = router_path.read_text(encoding="utf-8")
router = router.replace(
    "if(window.__DAMAGE_AI_READING_ROUTER_V79__)return;",
    "if(window.__DAMAGE_AI_READING_ROUTER_V80__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V80__=true;",
)
anchor = '"035":[{src:"js/work-035-coordinate-adapter.js?v=20260726_wushici_035_v4",key:"w035c",ready:()=>Boolean(window.__WORK_035_COORDINATE_ADAPTER__)},{src:"js/work-035.js?v=20260726_wushici_035_v4",key:"w035",ready:()=>Boolean(window.__WORK_035_STABLE_READY__&&window.__WORK_035_CROWDSOURCE_READY__)}]'
route_036 = '"036":[{src:"js/work-036-coordinate-adapter.js?v='+VERSION+'",key:"w036c",ready:()=>Boolean(window.__WORK_036_COORDINATE_ADAPTER__)},{src:"js/work-036.js?v='+VERSION+'",key:"w036",ready:()=>Boolean(window.__WORK_036_STABLE_READY__&&window.__WORK_036_CROWDSOURCE_READY__)}]'
router = router.replace(anchor, anchor + ",\n    " + route_036)
router = router.replace('"035":"武氏祠画像题字"};', '"035":"武氏祠画像题字","036":"瘗鹤铭"};')
router = router.replace('"033","034","035"].includes(id)', '"033","034","035","036"].includes(id)')
assert "__DAMAGE_AI_READING_ROUTER_V80__" in router and route_036 in router
router_path.write_text(router, encoding="utf-8")

patch_path = ROOT / "js/detail_info_patch.js"
patch = patch_path.read_text(encoding="utf-8")
patch = patch.replace(
    "if(window.__DETAIL_INFO_STABLE_ENTRY_V39__)return;",
    "if(window.__DETAIL_INFO_STABLE_ENTRY_V40__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V40__=true;",
)
patch = patch.replace("data/beitie_header_info.json?v=20260726_wushici_035_v4", "data/beitie_header_info.json?v=" + VERSION)
patch = patch.replace('const recoveryVersion="20260726_wushici_035_v4";', 'const recoveryVersion="'+VERSION+'";')
patch = patch.replace('"033","034","035"]);', '"033","034","035","036"]);')
patch = patch.replace('"035":"武氏祠画像题字"};', '"035":"武氏祠画像题字","036":"瘗鹤铭"};')
assert "__DETAIL_INFO_STABLE_ENTRY_V40__" in patch and '"036"' in patch
patch_path.write_text(patch, encoding="utf-8")

html_path = ROOT / "detail.html"
html = html_path.read_text(encoding="utf-8")
html = html.replace("js/detail_info_patch.js?v=20260726_wushici_035_v4", "js/detail_info_patch.js?v=" + VERSION)
html = html.replace("js/damage_ai_reading.js?v=20260726_wushici_035_v4", "js/damage_ai_reading.js?v=" + VERSION)
assert VERSION in html
html_path.write_text(html, encoding="utf-8")

assert "（一）" not in FULL_TEXT and "水前本" not in FULL_TEXT and "水后本" not in FULL_TEXT
print(json.dumps({
    "work": "036", "pages": 78, "model_glyphs": 138, "model_boxes": 31,
    "user_boxes": 23, "cases": 13, "located_cases": 13, "unmatched_model_boxes": unmatched,
}, ensure_ascii=False, indent=2))
