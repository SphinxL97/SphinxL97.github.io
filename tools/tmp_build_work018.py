from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = "018"
TITLE = "中岳嵩高灵庙碑并额"
FULL_WORK_ID = f"{WORK}_{TITLE}"
PAGE_COUNT = 55
VERSION = "20260724_songgao_v1"
TEXT_PATH = ROOT / "data/work018_full_text.txt"
CASES_PATH = ROOT / "data/work018_damage_cases.json"
REPORT_PATH = ROOT / "data/work018_coordinate_report.json"
OUT_DIR = ROOT / "data/glyph_boxes/iiif/018"


def dump(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def content_char(ch: str) -> bool:
    return ch == "□" or ch.isalnum() or "\u3400" <= ch <= "\u9fff"


def normalized_with_map(text: str):
    chars, positions = [], []
    for index, ch in enumerate(text):
        if content_char(ch):
            chars.append(ch)
            positions.append(index)
    return chars, positions


def as_int(value, default=0):
    try:
        return int(float(value))
    except Exception:
        return default


def rect(row):
    box = row.get("bbox")
    if isinstance(box, list) and len(box) >= 4:
        return [float(box[0]), float(box[1]), float(box[2]), float(box[3])]
    return [
        float(row.get("x", row.get("bbox_x", 0)) or 0),
        float(row.get("y", row.get("bbox_y", 0)) or 0),
        float(row.get("w", row.get("bbox_w", 0)) or 0),
        float(row.get("h", row.get("bbox_h", 0)) or 0),
    ]


def collect_rows(obj, rows):
    if isinstance(obj, dict):
        work_id = str(obj.get("work_id", ""))
        if work_id.startswith(WORK) and obj.get("glyph_id") and (obj.get("canvas_index") or obj.get("page")):
            rows.append(obj)
        for value in obj.values():
            collect_rows(value, rows)
    elif isinstance(obj, list):
        for value in obj:
            collect_rows(value, rows)


def find_model_rows():
    command = [
        "grep", "-rl", "--include=*.json", FULL_WORK_ID, "data"
    ]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, check=False)
    paths = []
    for line in result.stdout.splitlines():
        path = ROOT / line.strip()
        if not path.exists():
            continue
        posix = path.as_posix()
        if "/glyph_boxes/iiif/018/" in posix or path.name.startswith("work018_"):
            continue
        paths.append(path)
    rows = []
    sources = []
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        before = len(rows)
        collect_rows(data, rows)
        if len(rows) > before:
            sources.append(str(path.relative_to(ROOT)))
    unique = {}
    for row in rows:
        unique[str(row.get("glyph_id"))] = row
    rows = list(unique.values())
    rows.sort(key=lambda row: (
        as_int(row.get("canvas_index") or row.get("page")),
        as_int(row.get("order_in_page") or row.get("annotation_index")),
    ))
    return rows, sources


def normalize_row(row, index):
    page = as_int(row.get("canvas_index") or row.get("page"))
    order = as_int(row.get("order_in_page") or row.get("annotation_index"), index + 1)
    box = rect(row)
    ch = str(row.get("char") or row.get("text") or "")[:1]
    return {
        **row,
        "work_id": WORK,
        "canvas_index": page,
        "page": page,
        "glyph_id": str(row.get("glyph_id") or f"018_p{page:04d}_c{order:03d}"),
        "char": ch,
        "text": ch,
        "order_in_page": order,
        "annotation_index": as_int(row.get("annotation_index"), order),
        "canvas_width": as_int(row.get("canvas_width"), 1488),
        "canvas_height": as_int(row.get("canvas_height"), 2243),
        "bbox_x": box[0],
        "bbox_y": box[1],
        "bbox_w": box[2],
        "bbox_h": box[3],
        "bbox": box,
        "source": row.get("source") or "existing-model-row",
    }


def context_score(text_chars, text_index, model_chars, model_index):
    score = 0.0
    for step in range(1, 9):
        ti = text_index - step
        mi = model_index - step
        if ti >= 0 and mi >= 0 and text_chars[ti] == model_chars[mi]:
            score += 1.4 / step
        ti = text_index + step
        mi = model_index + step
        if ti < len(text_chars) and mi < len(model_chars) and text_chars[ti] == model_chars[mi]:
            score += 1.4 / step
    expected = text_index / max(1, len(text_chars) - 1)
    actual = model_index / max(1, len(model_chars) - 1)
    score -= abs(expected - actual) * 2.0
    return score


def locate_cases(text, cases, rows):
    text_chars, text_positions = normalized_with_map(text)
    model_chars = [str(row.get("char") or "")[:1] for row in rows]
    matcher = SequenceMatcher(None, text_chars, model_chars, autojunk=False)
    direct_map = {}
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            direct_map[block.a + offset] = block.b + offset

    model_squares = [index for index, ch in enumerate(model_chars) if ch == "□"]
    text_square_positions = [index for index, ch in enumerate(text_chars) if ch == "□"]
    square_ordinal = {pos: i for i, pos in enumerate(text_square_positions)}

    located, unlocated = [], []
    cursor = 0
    for case in cases:
        original = case["original"]
        raw_at = text.find(original, cursor)
        if raw_at < 0:
            raw_at = text.find(original)
        if raw_at < 0:
            unlocated.append({"id": case["id"], "reason": "original-not-found"})
            case["page"] = None
            case["locations"] = []
            continue
        cursor = raw_at + len(original)
        first_raw_square = text.find("□", raw_at, raw_at + len(original))
        if first_raw_square < 0:
            unlocated.append({"id": case["id"], "reason": "square-not-found"})
            case["page"] = None
            case["locations"] = []
            continue
        try:
            text_index = text_positions.index(first_raw_square)
        except ValueError:
            unlocated.append({"id": case["id"], "reason": "normalized-square-not-found"})
            case["page"] = None
            case["locations"] = []
            continue

        model_index = None
        method = ""
        score = None
        ordinal = square_ordinal.get(text_index)
        if len(model_squares) == len(text_square_positions) and ordinal is not None:
            model_index = model_squares[ordinal]
            method = "square-ordinal-exact"
            score = 1.0
        elif direct_map.get(text_index) is not None and model_chars[direct_map[text_index]] == "□":
            model_index = direct_map[text_index]
            method = "sequence-exact"
            score = 1.0
        elif model_squares:
            ranked = sorted(
                ((context_score(text_chars, text_index, model_chars, candidate), candidate) for candidate in model_squares),
                reverse=True,
            )
            if ranked:
                score, model_index = ranked[0]
                method = "square-context-alignment"
                if len(ranked) > 1 and score - ranked[1][0] < 0.08:
                    model_index = None

        if model_index is None:
            unlocated.append({"id": case["id"], "reason": "ambiguous-model-square"})
            case["page"] = None
            case["locations"] = []
            continue
        row = rows[model_index]
        box = rect(row)
        page = as_int(row.get("canvas_index") or row.get("page"))
        location = {
            "page": page,
            "glyph_id": row["glyph_id"],
            "canvas": {
                "w": as_int(row.get("canvas_width"), 1488),
                "h": as_int(row.get("canvas_height"), 2243),
            },
            "bbox": {"x": box[0], "y": box[1], "w": box[2], "h": box[3]},
            "bbox_source": "existing-model-square" if row.get("char") == "□" else "existing-model-row",
            "match_method": method,
            "alignment_score": round(float(score or 0), 4),
        }
        case["page"] = page
        case["locations"] = [location]
        case["n"] = case["category"]
        case["t"] = case["title"]
        case["o"] = case["original"]
        case["c"] = case["corrected"]
        located.append({"id": case["id"], **location})
    return matcher.ratio(), located, unlocated


def update_page_index(page_rows):
    path = ROOT / "data/page_images_index.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    work = data.get("works", {}).get(WORK)
    if not work:
        raise RuntimeError("page_images_index missing work 018")
    for page in work.get("pages", []):
        page_no = as_int(page.get("page") or page.get("canvas_index"))
        rows = page_rows.get(page_no, [])
        text = "".join(str(row.get("char") or "") for row in rows)
        page["text_clean"] = text
        page["text_raw"] = text
        page["char_count"] = len(rows)
        page["has_char_boxes"] = bool(rows)
    dump(path, data)


def update_catalog_and_header():
    catalog_path = ROOT / "data/beitie_catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for item in catalog:
        if str(item.get("id")) == WORK:
            item["dynasty"] = "北魏太安二年（456，另有太延年间说）"
            item["creator"] = "寇谦之撰文，书者不详"
            item["subtitle"] = "碑额、碑阳释文、逐页真实坐标与AI残损释读已接入。"
            item["year"] = "456"
            break
    dump(catalog_path, catalog)

    header_path = ROOT / "data/beitie_header_info.json"
    header = json.loads(header_path.read_text(encoding="utf-8"))
    record = header.setdefault(WORK, {"source_file": "中岳嵩高灵庙碑并额.txt", "title": TITLE, "basic": {}})
    record["title"] = TITLE
    basic = record.setdefault("basic", {})
    basic.update({
        "首题": TITLE,
        "其他题名": "中岳嵩高灵庙碑；嵩高灵庙碑",
        "责任者": "寇谦之撰文，书者不详",
        "刻立年代": "修庙始于北魏太延元年（435）；立碑年代有太安二年（456）及太延年间等不同著录",
        "版本说明": "本册收碑额与碑阳正文；原碑另有碑阴及碑侧题刻，本次栏目二不作补录。",
        "镌刻特征": "碑额篆书阳文八字；碑阳正文叙述中岳祭祀、寇谦之与重修岳庙之事。",
        "铭文行款": "碑阳正文二十三行，每行五十字；原碑另有碑阴及碑侧文字。",
    })
    dump(header_path, header)


def build_modules():
    source = (ROOT / "js/work-017.js").read_text(encoding="utf-8")
    source = source.replace("张猛龙碑并阴", TITLE)
    source = source.replace("20260723_zhangmenglong_v2", VERSION)
    source = source.replace("017", "018")
    old_intro = "本栏目为原释文中的每一个问题字提供候选结果。文献能够确认者标为文献对校；缺乏直接录文者，则结合北魏语汇、铭辞对偶、官职和姓名结构给出AI推测，并以置信度区分可靠程度。恢复结果与恢复后的上下文不再保留“□”。"
    new_intro = "本栏目为原释文中的每一个问题字提供候选结果。文献能够确认者标为文献对校；缺乏直接录文者，则结合北魏道教语汇、山岳祭祀、礼制术语和铭辞结构给出AI推测，并以置信度区分可靠程度。恢复结果与恢复后的上下文不再保留“□”。"
    source = source.replace(old_intro, new_intro)
    source = source.replace("/^(碑阳|碑阴)　/", "/^(碑额|碑阳|碑阴)　/")
    (ROOT / "js/work-018.js").write_text(source, encoding="utf-8")

    adapter = (ROOT / "js/work-017-coordinate-adapter.js").read_text(encoding="utf-8")
    adapter = adapter.replace("张猛龙碑并阴", TITLE)
    adapter = adapter.replace("20260723_zhangmenglong_v1", VERSION)
    adapter = adapter.replace("017", "018")
    (ROOT / "js/work-018-coordinate-adapter.js").write_text(adapter, encoding="utf-8")


def update_router_and_cache():
    route_path = ROOT / "js/damage_ai_reading.js"
    route = route_path.read_text(encoding="utf-8")
    route = route.replace("V56", "V57")
    route = route.replace("006、007、010、011、013、014-01、014-02、015、016、017使用", "006、007、010、011、013、014-01、014-02、015、016、017、018使用")
    block = '''    "017":[
      {src:"js/work-017-coordinate-adapter.js?v=20260723_zhangmenglong_v1",key:"w017c",ready:()=>Boolean(window.__WORK_017_COORDINATE_ADAPTER__)},
      {src:"js/work-017.js?v=20260723_zhangmenglong_v2",key:"w017",ready:()=>Boolean(window.__WORK_017_STABLE_READY__)}
    ]'''
    if '"018":[' not in route:
        replacement = block + ''',
    "018":[
      {src:"js/work-018-coordinate-adapter.js?v=20260724_songgao_v1",key:"w018c",ready:()=>Boolean(window.__WORK_018_COORDINATE_ADAPTER__)},
      {src:"js/work-018.js?v=20260724_songgao_v1",key:"w018",ready:()=>Boolean(window.__WORK_018_STABLE_READY__)}
    ]'''
        if block not in route:
            raise RuntimeError("017 route anchor not found")
        route = route.replace(block, replacement, 1)
    route = route.replace('"017":"张猛龙碑并阴"};', '"017":"张猛龙碑并阴","018":"中岳嵩高灵庙碑并额"};')
    route = route.replace('"016","017"]', '"016","017","018"]')
    route_path.write_text(route, encoding="utf-8")

    detail_path = ROOT / "js/detail_info_patch.js"
    detail = detail_path.read_text(encoding="utf-8")
    detail = detail.replace("__DETAIL_INFO_STABLE_ENTRY_V10__", "__DETAIL_INFO_STABLE_ENTRY_V11__", 2)
    marker = "window.__DETAIL_INFO_STABLE_ENTRY_V11__=true;"
    if "window.__DETAIL_INFO_STABLE_ENTRY_V10__=true;" not in detail and marker in detail:
        detail = detail.replace(marker, marker + "\n  window.__DETAIL_INFO_STABLE_ENTRY_V10__=true;", 1)
    detail = re.sub(r'data/beitie_header_info\.json\?v=[^"\']+', f'data/beitie_header_info.json?v={VERSION}', detail)
    detail = detail.replace('"016","017"]', '"016","017","018"]')
    if "window.__DAMAGE_AI_READING_ROUTER_V56__=true;" not in detail:
        detail = detail.replace("window.__DAMAGE_AI_READING_ROUTER_V55__=true;", "window.__DAMAGE_AI_READING_ROUTER_V55__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V56__=true;")
    detail = re.sub(r'js/damage_ai_reading\.js\?v=[^"\']+', f'js/damage_ai_reading.js?v={VERSION}', detail)
    detail_path.write_text(detail, encoding="utf-8")

    html_path = ROOT / "detail.html"
    html = html_path.read_text(encoding="utf-8")
    html = re.sub(r'js/detail_info_patch\.js\?v=[^"\']+', f'js/detail_info_patch.js?v={VERSION}', html)
    html = re.sub(r'js/damage_ai_reading\.js\?v=[^"\']+', f'js/damage_ai_reading.js?v={VERSION}', html)
    html_path.write_text(html, encoding="utf-8")


def main():
    text = TEXT_PATH.read_text(encoding="utf-8")
    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    text_square_count = text.count("□")
    candidate_count = sum(len(re.findall(r"〔[^〕]+〕", case.get("corrected", ""))) for case in cases)
    corrected_remaining = sum(case.get("corrected", "").count("□") for case in cases)
    if text_square_count != 18 or candidate_count != 18 or corrected_remaining != 0:
        raise RuntimeError(f"case count mismatch: text={text_square_count}, candidates={candidate_count}, remaining={corrected_remaining}")

    raw_rows, sources = find_model_rows()
    if not raw_rows:
        raise RuntimeError("No 018 model rows found")
    rows = [normalize_row(row, index) for index, row in enumerate(raw_rows)]
    rows = [row for row in rows if 1 <= row["canvas_index"] <= PAGE_COUNT and row["bbox_w"] > 0 and row["bbox_h"] > 0]
    rows.sort(key=lambda row: (row["canvas_index"], row["order_in_page"]))

    page_rows = defaultdict(list)
    for row in rows:
        page_rows[row["canvas_index"]].append(row)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for page in range(1, PAGE_COUNT + 1):
        dump(OUT_DIR / f"page_{page:04d}.json", page_rows.get(page, []))

    ratio, located, unlocated = locate_cases(text, cases, rows)
    dump(CASES_PATH, cases)
    update_page_index(page_rows)
    update_catalog_and_header()
    build_modules()
    update_router_and_cache()

    coordinate_pages = sorted(page for page, values in page_rows.items() if values)
    image_only_pages = [page for page in range(1, PAGE_COUNT + 1) if page not in coordinate_pages]
    report = {
        "work_id": WORK,
        "title": TITLE,
        "page_count": PAGE_COUNT,
        "status": "completed" if not unlocated else "needs-review",
        "source_files": sources,
        "model_rows": len(rows),
        "model_square_count": sum(1 for row in rows if row.get("char") == "□"),
        "text_square_count": text_square_count,
        "covered_square_count": text_square_count,
        "candidate_count": candidate_count,
        "remaining_square_count": corrected_remaining,
        "case_count": len(cases),
        "located_cases": len(located),
        "unlocated_cases": unlocated,
        "sequence_ratio": round(ratio, 4),
        "coordinate_pages": coordinate_pages,
        "image_only_pages": image_only_pages,
        "coordinate_range": [min(coordinate_pages), max(coordinate_pages)] if coordinate_pages else [],
        "case_locations": located,
        "restoration_policy": "all_positions_have_ai_candidates",
    }
    dump(REPORT_PATH, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
