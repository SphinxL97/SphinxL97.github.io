from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "020"
TITLE = "化度寺邕禅师舍利塔铭"
PAGE_COUNT = 49
VERSION = "20260724_huadusi_v1"
MODEL_PATH = ROOT / "data/model_boxes/glyph_model_border_016_020.json"
TEXT_PATH = ROOT / "data/work020_full_text.txt"
CASE_PATH = ROOT / "data/work020_damage_cases.json"
OUT_DIR = ROOT / "data/glyph_boxes/iiif/020"
REPORT_PATH = ROOT / "data/work020_coordinate_report.json"

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def walk_rows(value):
    if isinstance(value, list):
        for item in value:
            yield from walk_rows(item)
        return
    if not isinstance(value, dict):
        return
    keys = set(value)
    looks_like_row = (
        ("char" in keys or "text" in keys)
        and ("canvas_index" in keys or "page" in keys)
        and (
            {"bbox_x", "bbox_y", "bbox_w", "bbox_h"} <= keys
            or "bbox" in keys
            or "bbox_xywh" in keys
        )
    )
    if looks_like_row:
        yield value
        return
    for item in value.values():
        yield from walk_rows(item)

def numeric(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)

def normalize_row(row, index):
    raw_id = str(row.get("work_id") or "").strip()
    raw_title = str(row.get("work_title") or row.get("title") or "")
    raw_index = str(row.get("work_index") or "").strip()
    if raw_id != WORK_ID and raw_index not in {"20", "020"} and "化度寺" not in raw_title:
        return None

    page = int(numeric(row.get("canvas_index") or row.get("page"), 0))
    if page < 1 or page > PAGE_COUNT:
        return None

    bbox = row.get("bbox") or row.get("bbox_xywh") or []
    if isinstance(bbox, dict):
        x = numeric(bbox.get("x"))
        y = numeric(bbox.get("y"))
        w = numeric(bbox.get("w") or bbox.get("width"))
        h = numeric(bbox.get("h") or bbox.get("height"))
    else:
        x = numeric(row.get("bbox_x") if row.get("bbox_x") is not None else (bbox[0] if len(bbox) > 0 else 0))
        y = numeric(row.get("bbox_y") if row.get("bbox_y") is not None else (bbox[1] if len(bbox) > 1 else 0))
        w = numeric(row.get("bbox_w") if row.get("bbox_w") is not None else (bbox[2] if len(bbox) > 2 else 0))
        h = numeric(row.get("bbox_h") if row.get("bbox_h") is not None else (bbox[3] if len(bbox) > 3 else 0))
    if w <= 0 or h <= 0:
        return None

    char = str(row.get("char") or row.get("text") or "")[:1]
    order = int(numeric(row.get("order_in_page") or row.get("annotation_index"), index + 1))
    canvas_w = int(numeric(row.get("canvas_width"), 0))
    canvas_h = int(numeric(row.get("canvas_height"), 0))
    normalized = dict(row)
    normalized.update({
        "glyph_id": str(row.get("glyph_id") or f"{WORK_ID}_{TITLE}_p{page:04d}_c{order:03d}"),
        "char": char,
        "text": char,
        "work_id": WORK_ID,
        "work_title": TITLE,
        "canvas_index": page,
        "order_in_page": order,
        "annotation_index": int(numeric(row.get("annotation_index"), order)),
        "canvas_width": canvas_w,
        "canvas_height": canvas_h,
        "bbox_x": x,
        "bbox_y": y,
        "bbox_w": w,
        "bbox_h": h,
        "bbox": [x, y, w, h],
        "bbox_xywh": [x, y, w, h],
        "bbox_source": str(row.get("bbox_source") or "model_border_refined"),
    })
    return normalized

def comparable(char):
    return char == "□" or "\u3400" <= char <= "\u9fff" or char.isdigit()

SIMPLE_MAP = str.maketrans({
    "为":"為","于":"於","众":"衆","体":"體","灵":"靈","禅":"禪","师":"師",
    "开":"開","显":"顯","国":"國","号":"號","尽":"盡","净":"淨","从":"從",
    "书":"書","气":"氣","观":"觀","应":"應","识":"識","圣":"聖","风":"風",
    "发":"發","后":"後","归":"歸","边":"邊","声":"聲","门":"門","尔":"爾",
    "无":"無","与":"與","处":"處","学":"學","礼":"禮","云":"雲","异":"異",
    "绝":"絕","听":"聽","广":"廣","济":"濟","属":"屬","画":"畫","谦":"謙",
})

def canon(char):
    return char.translate(SIMPLE_MAP)

def normalized_chars(text):
    return [canon(ch) for ch in text if comparable(ch)]

def case_square_position(full_text, original):
    start = full_text.find(original)
    if start < 0:
        raise ValueError(f"案例原文未在释文中找到：{original}")
    raw_pos = start + original.index("□")
    count = 0
    for i, ch in enumerate(full_text):
        if i == raw_pos:
            return count
        if comparable(ch):
            count += 1
    raise ValueError(original)

def context_score(text_chars, model_chars, text_pos, model_pos, window=12):
    tb = [c for c in text_chars[max(0, text_pos-window):text_pos] if c != "□"]
    ta = [c for c in text_chars[text_pos+1:text_pos+1+window] if c != "□"]
    mb = [c for c in model_chars[max(0, model_pos-window):model_pos] if c != "□"]
    ma = [c for c in model_chars[model_pos+1:model_pos+1+window] if c != "□"]

    def suffix_exact(a, b):
        n = 0
        for x, y in zip(reversed(a), reversed(b)):
            if x != y:
                break
            n += 1
        return n / max(1, min(len(a), len(b), window))

    def prefix_exact(a, b):
        n = 0
        for x, y in zip(a, b):
            if x != y:
                break
            n += 1
        return n / max(1, min(len(a), len(b), window))

    exact = (suffix_exact(tb, mb) + prefix_exact(ta, ma)) / 2
    ratios = (
        SequenceMatcher(None, "".join(tb), "".join(mb), autojunk=False).ratio()
        + SequenceMatcher(None, "".join(ta), "".join(ma), autojunk=False).ratio()
    ) / 2
    rel_text = text_pos / max(1, len(text_chars) - 1)
    rel_model = model_pos / max(1, len(model_chars) - 1)
    relative = max(0.0, 1.0 - abs(rel_text - rel_model) * 3.0)
    return 0.52 * exact + 0.38 * ratios + 0.10 * relative

model_data = load_json(MODEL_PATH)
rows = []
for index, row in enumerate(walk_rows(model_data)):
    item = normalize_row(row, index)
    if item:
        rows.append(item)
rows.sort(key=lambda item: (item["canvas_index"], item["order_in_page"], item["bbox_y"], -item["bbox_x"]))

deduped = []
seen = set()
for row in rows:
    key = (
        row["canvas_index"], row["order_in_page"], row["char"],
        round(row["bbox_x"], 2), round(row["bbox_y"], 2),
        round(row["bbox_w"], 2), round(row["bbox_h"], 2),
    )
    if key in seen:
        continue
    seen.add(key)
    deduped.append(row)
rows = deduped

OUT_DIR.mkdir(parents=True, exist_ok=True)
page_rows = {}
for page in range(1, PAGE_COUNT + 1):
    current = [row for row in rows if row["canvas_index"] == page]
    page_rows[page] = current
    write_json(OUT_DIR / f"page_{page:04d}.json", current)

full_text = TEXT_PATH.read_text(encoding="utf-8")
cases = load_json(CASE_PATH)
text_chars = normalized_chars(full_text)
model_chars = [canon(str(row.get("char") or "")[:1]) for row in rows]
square_indices = [i for i, ch in enumerate(model_chars) if ch == "□"]

previous_model_index = -1
locations = []
unlocated = []
for case in cases:
    text_pos = case_square_position(full_text, str(case["original"]))
    ranked = []
    for model_pos in square_indices:
        if model_pos <= previous_model_index:
            continue
        score = context_score(text_chars, model_chars, text_pos, model_pos)
        ranked.append((score, model_pos))
    ranked.sort(reverse=True)
    chosen = None
    if ranked:
        score, model_pos = ranked[0]
        margin = score - (ranked[1][0] if len(ranked) > 1 else 0)
        if score >= 0.42 or (score >= 0.30 and margin >= 0.075):
            chosen = (score, model_pos, margin)
    if chosen is None:
        case["page"] = None
        case["locations"] = []
        case["coordinate_status"] = "not-reliably-located"
        case["coordinate_note"] = "现有模型字序未能为本例第一个问题字提供唯一可靠位置。"
        unlocated.append({
            "id": case["id"],
            "reason": "no-unique-model-square",
            "top_candidates": [
                {"page": rows[pos]["canvas_index"], "glyph_id": rows[pos]["glyph_id"], "score": round(score, 4)}
                for score, pos in ranked[:5]
            ],
        })
        continue

    score, model_pos, margin = chosen
    row = rows[model_pos]
    previous_model_index = model_pos
    page = int(row["canvas_index"])
    location = {
        "page": page,
        "glyph_id": row["glyph_id"],
        "canvas": {"w": int(row.get("canvas_width") or 0), "h": int(row.get("canvas_height") or 0)},
        "bbox": {
            "x": row["bbox_x"], "y": row["bbox_y"],
            "w": row["bbox_w"], "h": row["bbox_h"],
        },
        "bbox_source": "existing-model-square",
        "match_method": "context-sequence",
        "alignment_score": round(score, 4),
        "uniqueness_margin": round(margin, 4),
    }
    case["page"] = page
    case["locations"] = [location]
    case.pop("coordinate_status", None)
    case.pop("coordinate_note", None)
    locations.append({"id": case["id"], **location})

write_json(CASE_PATH, cases)

coordinate_pages = [page for page, current in page_rows.items() if current]
image_only_pages = [page for page in range(1, PAGE_COUNT + 1) if not page_rows[page]]
sequence_ratio = SequenceMatcher(None, "".join(text_chars), "".join(model_chars), autojunk=False).ratio()
report = {
    "work_id": WORK_ID,
    "title": TITLE,
    "page_count": PAGE_COUNT,
    "status": "completed" if not unlocated else "completed-with-unlocated-cases",
    "source_files": [str(MODEL_PATH.relative_to(ROOT))],
    "model_rows": len(rows),
    "model_square_count": len(square_indices),
    "text_square_count": full_text.count("□"),
    "covered_square_count": sum(str(case["original"]).count("□") for case in cases),
    "candidate_count": sum(str(case["corrected"]).count("〔") for case in cases),
    "remaining_square_count": sum(str(case["corrected"]).count("□") for case in cases),
    "case_count": len(cases),
    "located_cases": len(locations),
    "unlocated_cases": unlocated,
    "sequence_ratio": round(sequence_ratio, 4),
    "coordinate_pages": coordinate_pages,
    "image_only_pages": image_only_pages,
    "coordinate_range": [min(coordinate_pages), max(coordinate_pages)] if coordinate_pages else [],
    "case_locations": locations,
    "restoration_policy": "all_positions_have_ai_candidates",
    "coordinate_policy": "只使用现有模型真实方框；未达到唯一阈值的案例不伪造bbox。",
}
write_json(REPORT_PATH, report)

index_path = ROOT / "data/page_images_index.json"
index = load_json(index_path)
work = index.get("works", {}).get(WORK_ID)
if work:
    for page in work.get("pages", []):
        page_no = int(page.get("page") or 0)
        current = page_rows.get(page_no, [])
        page["text_clean"] = "".join(str(row.get("char") or "") for row in current)
        page["text_raw"] = page["text_clean"]
        page["char_count"] = len(current)
        page["has_char_boxes"] = bool(current)
write_json(index_path, index)

catalog_path = ROOT / "data/beitie_catalog.json"
catalog = load_json(catalog_path)
for item in catalog:
    if str(item.get("id")) == WORK_ID:
        item["dynasty"] = "唐贞观五年（631）"
        item["year"] = "631"
        item["creator"] = "李百药撰文，欧阳询楷书"
        item["subtitle"] = "碑文释文、逐页真实坐标与AI残损释读已接入。"
        item["status"] = "封面入口"
        break
write_json(catalog_path, catalog)

header_path = ROOT / "data/beitie_header_info.json"
header = load_json(header_path)
record = header.setdefault(WORK_ID, {"source_file": "化度寺邕禅师舍利塔铭.txt", "title": TITLE, "basic": {}})
basic = record.setdefault("basic", {})
basic.update({
    "首题": TITLE,
    "责任者": "李百药撰文，欧阳询楷书",
    "书体": "楷书",
    "刻立年代": "唐贞观五年（631）",
    "其他题名": "化度寺碑；邕禅师塔铭；青鸾白鹤帖",
    "版本说明": "唐原石北宋拓本。原石宋代已经毁佚，本册为上海图书馆藏四欧堂本。",
    "镌刻特征": "塔铭记述僧邕禅师家世、入道、山居苦行、追随信行禅师及其圆寂建塔事迹。",
    "铭文行款": "正书三十五行，每行三十三字。",
})
write_json(header_path, header)

template = (ROOT / "js/work-018.js").read_text(encoding="utf-8")
module = template
module = module.replace("018《中岳嵩高灵庙碑并额》", "020《化度寺邕禅师舍利塔铭》")
module = module.replace('"018"', '"020"')
module = module.replace("018_", "020_")
module = module.replace("work-018", "work-020")
module = module.replace("work018", "work020")
module = module.replace("WORK_018", "WORK_020")
module = module.replace("SONGGAO", "HUADUSI")
module = module.replace("songgao", "huadusi")
module = module.replace("中岳嵩高灵庙碑并额", TITLE)
module = module.replace("20260724_songgao_v1", VERSION)
module = module.replace(
    "北魏道教语汇、山岳祭祀、礼制术语和铭辞结构",
    "初唐佛教语汇、三阶教传记、禅修术语和铭辞结构",
)
(ROOT / "js/work-020.js").write_text(module, encoding="utf-8")

adapter_template = (ROOT / "js/work-018-coordinate-adapter.js").read_text(encoding="utf-8")
adapter = adapter_template
adapter = adapter.replace("018《中岳嵩高灵庙碑并额》", "020《化度寺邕禅师舍利塔铭》")
adapter = adapter.replace('"018"', '"020"')
adapter = adapter.replace("018_", "020_")
adapter = adapter.replace("work-018", "work-020")
adapter = adapter.replace("WORK_018", "WORK_020")
adapter = adapter.replace("中岳嵩高灵庙碑并额", TITLE)
adapter = adapter.replace("20260724_songgao_v1", VERSION)
(ROOT / "js/work-020-coordinate-adapter.js").write_text(adapter, encoding="utf-8")

router_path = ROOT / "js/damage_ai_reading.js"
router = router_path.read_text(encoding="utf-8")
router = router.replace("ROUTER_V57", "ROUTER_V58")
router = router.replace("006、007、010、011、013、014-01、014-02、015、016、017、018", "006、007、010、011、013、014-01、014-02、015、016、017、018、020")
if '"020":[' not in router:
    route = f'''    "020":[
      {{src:"js/work-020-coordinate-adapter.js?v={VERSION}",key:"w020c",ready:()=>Boolean(window.__WORK_020_COORDINATE_ADAPTER__)}},
      {{src:"js/work-020.js?v={VERSION}",key:"w020",ready:()=>Boolean(window.__WORK_020_STABLE_READY__)}}
    ]'''
    match = re.search(r'(\n    "018":\[\n.*?\n    \])\n  \};', router, flags=re.S)
    if not match:
        raise RuntimeError("未找到018路由尾部")
    router = router[:match.end(1)] + ",\n" + route + router[match.end(1):]
router = router.replace(
    '"018":"中岳嵩高灵庙碑并额"};',
    '"018":"中岳嵩高灵庙碑并额","020":"化度寺邕禅师舍利塔铭"};'
)
router = router.replace('"017","018"].includes', '"017","018","020"].includes')
router_path.write_text(router, encoding="utf-8")

detail_patch_path = ROOT / "js/detail_info_patch.js"
detail_patch = detail_patch_path.read_text(encoding="utf-8")
detail_patch = detail_patch.replace("__DETAIL_INFO_STABLE_ENTRY_V11__", "__DETAIL_INFO_STABLE_ENTRY_V12__", 2)
if "window.__DETAIL_INFO_STABLE_ENTRY_V11__=true;" not in detail_patch:
    detail_patch = detail_patch.replace(
        "window.__DETAIL_INFO_STABLE_ENTRY_V12__=true;",
        "window.__DETAIL_INFO_STABLE_ENTRY_V12__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V11__=true;",
        1,
    )
detail_patch = detail_patch.replace('"017","018"].includes', '"017","018","020"].includes')
detail_patch = re.sub(r'data/beitie_header_info\.json\?v=[^"]+', f'data/beitie_header_info.json?v={VERSION}', detail_patch)
detail_patch = re.sub(r'js/damage_ai_reading\.js\?v=[^"]+', f'js/damage_ai_reading.js?v={VERSION}', detail_patch)
if "window.__DAMAGE_AI_READING_ROUTER_V58__=true;" not in detail_patch:
    detail_patch = detail_patch.replace(
        "window.__DAMAGE_AI_READING_ROUTER_V56__=true;",
        "window.__DAMAGE_AI_READING_ROUTER_V56__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V57__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V58__=true;",
    )
detail_patch_path.write_text(detail_patch, encoding="utf-8")

detail_html_path = ROOT / "detail.html"
detail_html = detail_html_path.read_text(encoding="utf-8")
detail_html = re.sub(r'(js/detail_info_patch\.js\?v=)[^"\']+', rf'\g<1>{VERSION}', detail_html)
detail_html = re.sub(r'(js/damage_ai_reading\.js\?v=)[^"\']+', rf'\g<1>{VERSION}', detail_html)
detail_html_path.write_text(detail_html, encoding="utf-8")

print(json.dumps({
    "model_rows": len(rows),
    "model_squares": len(square_indices),
    "text_squares": full_text.count("□"),
    "cases": len(cases),
    "located": len(locations),
    "unlocated": len(unlocated),
    "coordinate_pages": coordinate_pages,
}, ensure_ascii=False, indent=2))
