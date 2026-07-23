from __future__ import annotations

import json
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "020"
TITLE = "化度寺邕禅师舍利塔铭"
PAGE_COUNT = 49
TEXT_PATH = ROOT / "data/work020_full_text.txt"
CASE_PATH = ROOT / "data/work020_damage_cases.json"
OUT_DIR = ROOT / "data/glyph_boxes/iiif/020"
REPORT_PATH = ROOT / "data/work020_coordinate_report.json"
REFINED_DIR = ROOT / "data/glyph_boxes/model_aligned_border_refined/020"
ALIGNED_DIR = ROOT / "data/glyph_boxes/model_aligned/020"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def number(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def comparable(char: str) -> bool:
    return char == "□" or "\u3400" <= char <= "\u9fff" or char.isdigit()


SIMPLE_MAP = str.maketrans({
    "为":"為","于":"於","众":"衆","体":"體","灵":"靈","禅":"禪","师":"師",
    "开":"開","显":"顯","国":"國","号":"號","尽":"盡","净":"淨","从":"從",
    "书":"書","气":"氣","观":"觀","应":"應","识":"識","圣":"聖","风":"風",
    "发":"發","后":"後","归":"歸","边":"邊","声":"聲","门":"門","尔":"爾",
    "无":"無","与":"與","处":"處","学":"學","礼":"禮","云":"雲","异":"異",
    "绝":"絕","听":"聽","广":"廣","济":"濟","属":"屬","画":"畫","谦":"謙",
    "获":"獲","尝":"嘗","聪":"聰","类":"類","胜":"勝","劳":"勞","报":"報",
    "变":"變","释":"釋","满":"滿","违":"違","随":"隨","异":"異","读":"讀",
    "丛":"叢","终":"終","赠":"贈","舍":"捨","离":"離","累":"纍","图":"圖",
})


def canon(char: str) -> str:
    return char.translate(SIMPLE_MAP)


def normalized_chars(text: str):
    return [canon(ch) for ch in text if comparable(ch)]


def normalize_row(row: dict, page: int, index: int):
    bbox = row.get("bbox") or row.get("bbox_xywh") or []
    if isinstance(bbox, dict):
        x = number(bbox.get("x"))
        y = number(bbox.get("y"))
        w = number(bbox.get("w") or bbox.get("width"))
        h = number(bbox.get("h") or bbox.get("height"))
    else:
        x = number(row.get("bbox_x") if row.get("bbox_x") is not None else (bbox[0] if len(bbox) > 0 else 0))
        y = number(row.get("bbox_y") if row.get("bbox_y") is not None else (bbox[1] if len(bbox) > 1 else 0))
        w = number(row.get("bbox_w") if row.get("bbox_w") is not None else (bbox[2] if len(bbox) > 2 else 0))
        h = number(row.get("bbox_h") if row.get("bbox_h") is not None else (bbox[3] if len(bbox) > 3 else 0))
    if w <= 0 or h <= 0:
        return None
    page_no = int(number(row.get("canvas_index") or row.get("page"), page))
    if page_no < 1 or page_no > PAGE_COUNT:
        return None
    order = int(number(row.get("order_in_page") or row.get("annotation_index"), index + 1))
    char = str(row.get("char") or row.get("text") or "")[:1]
    item = dict(row)
    item.update({
        "glyph_id": str(row.get("glyph_id") or f"020_{TITLE}_p{page_no:04d}_c{order:03d}"),
        "char": char,
        "text": char,
        "work_id": WORK_ID,
        "work_title": TITLE,
        "work_index": 20,
        "canvas_index": page_no,
        "order_in_page": order,
        "annotation_index": int(number(row.get("annotation_index"), order)),
        "canvas_width": int(number(row.get("canvas_width"), 0)),
        "canvas_height": int(number(row.get("canvas_height"), 0)),
        "bbox_x": x,
        "bbox_y": y,
        "bbox_w": w,
        "bbox_h": h,
        "bbox": [x, y, w, h],
        "bbox_xywh": [x, y, w, h],
        "bbox_source": "model_aligned_border_refined" if REFINED_DIR in Path(row.get("_source_path", "")).parents else "model_aligned",
    })
    item.pop("_source_path", None)
    return item


def load_page_source(page: int):
    candidates = [
        REFINED_DIR / f"page_{page:04d}.json",
        ALIGNED_DIR / f"page_{page:04d}.json",
    ]
    for path in candidates:
        if not path.exists():
            continue
        value = load_json(path)
        rows = value if isinstance(value, list) else value.get("rows", []) if isinstance(value, dict) else []
        result = []
        for index, row in enumerate(rows):
            if not isinstance(row, dict):
                continue
            row = dict(row)
            row["_source_path"] = str(path)
            item = normalize_row(row, page, index)
            if item:
                result.append(item)
        result.sort(key=lambda item: (item["order_in_page"], item["bbox_y"], -item["bbox_x"]))
        return result, path
    return [], None


def case_square_position(full_text: str, original: str):
    start = full_text.find(original)
    if start < 0:
        raise ValueError(f"案例原文未在释文中找到：{original}")
    raw_pos = start + original.index("□")
    count = 0
    for index, char in enumerate(full_text):
        if index == raw_pos:
            return count
        if comparable(char):
            count += 1
    raise ValueError(original)


def context_score(text_chars, model_chars, text_pos, model_pos, window=14):
    tb = [ch for ch in text_chars[max(0, text_pos-window):text_pos] if ch != "□"]
    ta = [ch for ch in text_chars[text_pos+1:text_pos+1+window] if ch != "□"]
    mb = [ch for ch in model_chars[max(0, model_pos-window):model_pos] if ch != "□"]
    ma = [ch for ch in model_chars[model_pos+1:model_pos+1+window] if ch != "□"]

    def exact_suffix(left, right):
        count = 0
        for a, b in zip(reversed(left), reversed(right)):
            if a != b:
                break
            count += 1
        return count / max(1, min(len(left), len(right), window))

    def exact_prefix(left, right):
        count = 0
        for a, b in zip(left, right):
            if a != b:
                break
            count += 1
        return count / max(1, min(len(left), len(right), window))

    exact = (exact_suffix(tb, mb) + exact_prefix(ta, ma)) / 2
    fuzzy = (
        SequenceMatcher(None, "".join(tb), "".join(mb), autojunk=False).ratio()
        + SequenceMatcher(None, "".join(ta), "".join(ma), autojunk=False).ratio()
    ) / 2
    relative = max(0.0, 1.0 - abs(text_pos / max(1, len(text_chars)-1) - model_pos / max(1, len(model_chars)-1)) * 2.5)
    return 0.58 * exact + 0.34 * fuzzy + 0.08 * relative


rows = []
page_rows = {}
source_files = []
for page in range(1, PAGE_COUNT + 1):
    current, source = load_page_source(page)
    page_rows[page] = current
    rows.extend(current)
    if source:
        source_files.append(str(source.relative_to(ROOT)))

OUT_DIR.mkdir(parents=True, exist_ok=True)
for page in range(1, PAGE_COUNT + 1):
    write_json(OUT_DIR / f"page_{page:04d}.json", page_rows[page])

full_text = TEXT_PATH.read_text(encoding="utf-8")
cases = load_json(CASE_PATH)
text_chars = normalized_chars(full_text)
model_chars = [canon(str(row.get("char") or "")[:1]) for row in rows]
square_indices = [index for index, char in enumerate(model_chars) if char == "□"]

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
        second = ranked[1][0] if len(ranked) > 1 else 0.0
        margin = score - second
        if score >= 0.46 or (score >= 0.32 and margin >= 0.065):
            chosen = score, model_pos, margin
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
        "bbox": {"x": row["bbox_x"], "y": row["bbox_y"], "w": row["bbox_w"], "h": row["bbox_h"]},
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
report = {
    "work_id": WORK_ID,
    "title": TITLE,
    "page_count": PAGE_COUNT,
    "status": "completed" if not unlocated else "completed-with-unlocated-cases",
    "source_files": source_files,
    "model_rows": len(rows),
    "model_square_count": len(square_indices),
    "text_square_count": full_text.count("□"),
    "covered_square_count": sum(str(case["original"]).count("□") for case in cases),
    "candidate_count": sum(str(case["corrected"]).count("〔") for case in cases),
    "remaining_square_count": sum(str(case["corrected"]).count("□") for case in cases),
    "case_count": len(cases),
    "located_cases": len(locations),
    "unlocated_cases": unlocated,
    "sequence_ratio": round(SequenceMatcher(None, "".join(text_chars), "".join(model_chars), autojunk=False).ratio(), 4),
    "coordinate_pages": coordinate_pages,
    "image_only_pages": image_only_pages,
    "coordinate_range": [min(coordinate_pages), max(coordinate_pages)] if coordinate_pages else [],
    "case_locations": locations,
    "restoration_policy": "all_positions_have_ai_candidates",
    "coordinate_policy": "只使用现有逐页模型真实方框；未达到唯一阈值的案例不伪造bbox。",
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

print(json.dumps({
    "model_rows": len(rows),
    "model_squares": len(square_indices),
    "text_squares": full_text.count("□"),
    "cases": len(cases),
    "located": len(locations),
    "unlocated": len(unlocated),
    "coordinate_pages": coordinate_pages,
}, ensure_ascii=False, indent=2))
