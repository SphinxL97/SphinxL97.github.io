from __future__ import annotations

import difflib
import json
import math
import re
from collections import defaultdict
from pathlib import Path

WORK_ID = "023"
TITLE = "圭峰定慧禅师碑"
PAGE_COUNT = 91
VERSION = "20260724_guifeng_v1"
IMAGE_ROOT = "assets/page_images/023_圭峰定慧禅师碑/images"
MODEL_PATH = Path("data/model_boxes/glyph_model_border_021_025.json")


def chinese_number(n: int) -> str:
    digits = "零一二三四五六七八九"
    if n < 10:
        return digits[n]
    if n == 10:
        return "十"
    if n < 20:
        return "十" + digits[n % 10]
    if n < 100:
        return digits[n // 10] + "十" + (digits[n % 10] if n % 10 else "")
    return str(n)


def image_path(page: int) -> str:
    return f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg"


def walk(value):
    if isinstance(value, list):
        for item in value:
            yield from walk(item)
    elif isinstance(value, dict):
        yield value
        for item in value.values():
            if isinstance(item, (list, dict)):
                yield from walk(item)


def num(*values, default=0.0):
    for value in values:
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            pass
    return float(default)


def work_match(row: dict) -> bool:
    work_id = str(row.get("work_id", ""))
    title = str(row.get("work_title", row.get("title", "")))
    index = row.get("work_index")
    return work_id.startswith("023") or str(index) == "23" or "圭峰" in title or "圭峯" in title


def looks_like_row(row: dict) -> bool:
    page = row.get("canvas_index", row.get("page"))
    has_box = any(key in row for key in ("bbox", "bbox_xywh", "x", "bbox_x"))
    has_char = any(key in row for key in ("char", "text", "label"))
    return page is not None and has_box and has_char


def normalize_row(row: dict, fallback_index: int) -> dict | None:
    page = int(num(row.get("canvas_index"), row.get("page"), default=0))
    if not 1 <= page <= PAGE_COUNT:
        return None
    bbox = row.get("bbox") or row.get("bbox_xywh") or []
    x = num(row.get("x"), row.get("bbox_x"), bbox[0] if len(bbox) > 0 else None)
    y = num(row.get("y"), row.get("bbox_y"), bbox[1] if len(bbox) > 1 else None)
    w = num(row.get("w"), row.get("bbox_w"), bbox[2] if len(bbox) > 2 else None)
    h = num(row.get("h"), row.get("bbox_h"), bbox[3] if len(bbox) > 3 else None)
    if w <= 0 or h <= 0:
        return None
    char = str(row.get("char", row.get("text", row.get("label", ""))))[:1]
    order = int(num(row.get("order_in_page"), row.get("annotation_index"), fallback_index, default=fallback_index))
    canvas_w = int(num(row.get("canvas_width"), row.get("image_width"), default=2943))
    canvas_h = int(num(row.get("canvas_height"), row.get("image_height"), default=4429))
    glyph_id = str(row.get("glyph_id") or f"023_圭峰定慧禅师碑_p{page:04d}_c{order:03d}")
    source = str(row.get("bbox_source") or row.get("source") or "existing-model-row")
    result = dict(row)
    result.update({
        "glyph_id": glyph_id,
        "char": char,
        "text": char,
        "work_id": WORK_ID,
        "work_index": 23,
        "work_title": TITLE,
        "canvas_index": page,
        "canvas_label": chinese_number(page),
        "canvas_width": canvas_w,
        "canvas_height": canvas_h,
        "order_in_page": order,
        "annotation_index": order,
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "bbox_x": x,
        "bbox_y": y,
        "bbox_w": w,
        "bbox_h": h,
        "bbox": [x, y, w, h],
        "bbox_xywh": [x, y, w, h],
        "bbox_source": source,
        "local_image": image_path(page),
    })
    return result


def compact(value: str) -> str:
    return "".join(ch for ch in str(value) if ch == "□" or ch.isalnum() or "\u3400" <= ch <= "\u9fff" or "\uf900" <= ch <= "\ufaff")


def context_score(anchor: str, chars: str, index: int, square_ordinal: int = 1) -> float:
    query = compact(anchor)
    squares = [m.start() for m in re.finditer("□", query)]
    if not squares:
        return 0.0
    q = squares[min(max(square_ordinal, 1), len(squares)) - 1]
    before = query[max(0, q - 16):q]
    after = query[q + 1:q + 17]
    model_before = chars[max(0, index - len(before)):index]
    model_after = chars[index + 1:index + 1 + len(after)]
    left = difflib.SequenceMatcher(None, before, model_before, autojunk=False).ratio() if before else 0.0
    right = difflib.SequenceMatcher(None, after, model_after, autojunk=False).ratio() if after else 0.0
    exact_left = 0
    for a, b in zip(reversed(before), reversed(model_before)):
        if a != b:
            break
        exact_left += 1
    exact_right = 0
    for a, b in zip(after, model_after):
        if a != b:
            break
        exact_right += 1
    bonus = min(0.24, exact_left * 0.02 + exact_right * 0.02)
    return min(1.0, 0.55 * left + 0.45 * right + bonus)


def locate_cases(cases: list[dict], rows: list[dict]) -> tuple[list[dict], list[dict]]:
    chars = "".join(row.get("char", "") for row in rows)
    square_indices = [i for i, row in enumerate(rows) if row.get("char") == "□"]
    previous = -1
    audit = []
    for case in cases:
        ordinal = 2 if case["id"] == "13" else 1
        scored = []
        for idx in square_indices:
            if idx <= previous:
                continue
            score = context_score(case.get("locate_anchor", case["original"]), chars, idx, ordinal)
            scored.append((score, idx))
        scored.sort(reverse=True)
        best = scored[0] if scored else (0.0, -1)
        margin = best[0] - (scored[1][0] if len(scored) > 1 else 0.0)
        location = None
        # A conservative threshold prevents a distant square from being used only to make every case appear located.
        if best[1] >= 0 and best[0] >= 0.46:
            row = rows[best[1]]
            previous = best[1]
            location = {
                "page": int(row["canvas_index"]),
                "glyph_id": row["glyph_id"],
                "canvas": {"w": int(row["canvas_width"]), "h": int(row["canvas_height"])},
                "bbox": {"x": row["x"], "y": row["y"], "w": row["w"], "h": row["h"]},
                "image": row["local_image"],
                "bbox_source": row.get("bbox_source", "existing-model-row"),
                "match_method": "ordered-context-square-match",
                "alignment_score": round(best[0], 4),
                "uniqueness_margin": round(margin, 4),
                "target_char_in_model": row.get("char", ""),
            }
            case["locations"] = [location]
            case["page"] = location["page"]
        else:
            case["locations"] = []
            case["page"] = "—"
        audit.append({
            "id": case["id"],
            "located": bool(location),
            "page": location["page"] if location else None,
            "glyph_id": location["glyph_id"] if location else None,
            "score": round(best[0], 4),
            "margin": round(margin, 4),
            "top_candidates": [
                {"score": round(score, 4), "page": rows[idx]["canvas_index"], "glyph_id": rows[idx]["glyph_id"]}
                for score, idx in scored[:3]
            ],
        })
    return cases, audit


def update_json_files(grouped: dict[int, list[dict]]) -> None:
    catalog_path = Path("data/beitie_catalog.json")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    for item in catalog:
        if str(item.get("id")) == WORK_ID:
            item.update({
                "title": TITLE,
                "dynasty": "唐大中九年（855）",
                "year": "855",
                "creator": "裴休撰并书，柳公权篆额",
                "status": "完整样板",
                "subtitle": "完整释文、91页逐页真实坐标与14例残损释读已接入。",
                "canvas_count": PAGE_COUNT,
            })
            break
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    header_path = Path("data/beitie_header_info.json")
    header = json.loads(header_path.read_text(encoding="utf-8"))
    header[WORK_ID] = {
        "source_file": "圭峰定慧禅师碑.txt",
        "title": TITLE,
        "basic": {
            "首题": "唐故圭峯定慧禪師傳法碑并序",
            "其他题名": "圭峯定慧禪師碑；圭峰宗密禅师碑；定慧禅师碑",
            "责任者": "裴休撰并书，柳公权篆额，邵建初刻字",
            "书体": "楷书；篆额",
            "版本": "明代淡墨精拓本",
            "数量": "43开",
            "尺寸": "册高26厘米，宽12.5厘米；帖芯高22.1厘米，宽11厘米",
            "刻立年代": "唐大中九年（855）",
            "刻立地点": "陕西户县草堂寺",
            "馆藏": "上海图书馆",
            "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第五辑，上海图书馆，上海古籍出版社，2017年",
            "版本说明": "本册为明代淡墨精拓本。数字化图像共91页，装裱数量为43开，二者属于不同计数口径。",
            "镌刻特征": "碑文由裴休撰并书，柳公权篆额，叙圭峰宗密禅师法系、生平、著述、教化与圆寂，并附铭辞及碑末建碑题记。",
        },
    }
    header_path.write_text(json.dumps(header, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    index_path = Path("data/page_images_index.json")
    page_index = json.loads(index_path.read_text(encoding="utf-8"))
    work = page_index["works"][WORK_ID]
    work["title"] = TITLE
    work["cover"] = image_path(1)
    pages_by_no = {int(page["page"]): page for page in work.get("pages", [])}
    pages = []
    for page_no in range(1, PAGE_COUNT + 1):
        rows = grouped.get(page_no, [])
        text = "".join(row.get("char", "") for row in rows)
        page = pages_by_no.get(page_no, {"page": page_no, "label": chinese_number(page_no), "image": image_path(page_no)})
        page.update({
            "page": page_no,
            "label": chinese_number(page_no),
            "image": image_path(page_no),
            "text_clean": text,
            "text_raw": "\n".join(text),
            "char_count": len(text),
            "has_char_boxes": bool(rows),
        })
        pages.append(page)
    work["pages"] = pages
    index_path.write_text(json.dumps(page_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_scripts() -> None:
    source = Path("js/work-022.js").read_text(encoding="utf-8")
    work_js = source.replace("022《王居士砖塔铭》", "023《圭峰定慧禅师碑》")
    work_js = work_js.replace("王居士砖塔铭", TITLE)
    work_js = work_js.replace("20260724_wangjushi_v1", VERSION)
    work_js = work_js.replace("work022", "work023").replace("WORK_022", "WORK_023").replace("work-022", "work-023")
    work_js = work_js.replace(
        "本栏目对两篇合装塔铭中的九处残损位置逐例释读。原始识别保留方框，文献对校或AI暂拟结果为每一处给出候选字；低置信度表示仍需人工复核。",
        "本栏目对碑文与碑末建碑题记中的十四组残损逐例释读。文献可确认者给出候选字，部分恢复与暂未恢复位置继续保留方框。",
    )
    work_js = work_js.replace("assets/page_images/022_圭峰定慧禅师碑/images", IMAGE_ROOT)
    work_js = work_js.replace(
        "const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);",
        "const patterns=items.flatMap(item=>Array.isArray(item.highlight_patterns)&&item.highlight_patterns.length?item.highlight_patterns:[item.original]).filter(Boolean).sort((a,b)=>b.length-a.length);",
    )
    work_js = work_js.replace(
        "/^(（一）|（二）|碑额|碑阳|碑阴)/.test(part)",
        "/^(銘曰|碑末建碑題記|碑额|碑阳|碑阴)/.test(part)",
    )
    Path("js/work-023.js").write_text(work_js, encoding="utf-8")

    adapter = Path("js/work-022-coordinate-adapter.js").read_text(encoding="utf-8")
    adapter = adapter.replace("022《王居士砖塔铭》", "023《圭峰定慧禅师碑》")
    adapter = adapter.replace("20260724_wangjushi_v1", VERSION)
    adapter = adapter.replace("data/glyph_boxes/iiif/022", "data/glyph_boxes/iiif/023")
    adapter = adapter.replace("work-022", "work-023").replace("WORK_022", "WORK_023").replace('"022"', '"023"').replace("022_", "023_")
    Path("js/work-023-coordinate-adapter.js").write_text(adapter, encoding="utf-8")


def update_routes() -> None:
    router_path = Path("js/damage_ai_reading.js")
    router = router_path.read_text(encoding="utf-8")
    router = router.replace("ROUTER_V60", "ROUTER_V61")
    route_block = '''    "022":[
      {src:"js/work-022-coordinate-adapter.js?v=20260724_wangjushi_v1",key:"w022c",ready:()=>Boolean(window.__WORK_022_COORDINATE_ADAPTER__)},
      {src:"js/work-022.js?v=20260724_wangjushi_v1",key:"w022",ready:()=>Boolean(window.__WORK_022_STABLE_READY__)}
    ]'''
    replacement = route_block + ''',
    "023":[
      {src:"js/work-023-coordinate-adapter.js?v=20260724_guifeng_v1",key:"w023c",ready:()=>Boolean(window.__WORK_023_COORDINATE_ADAPTER__)},
      {src:"js/work-023.js?v=20260724_guifeng_v1",key:"w023",ready:()=>Boolean(window.__WORK_023_STABLE_READY__)}
    ]'''
    if route_block not in router:
        raise RuntimeError("022 router block not found")
    router = router.replace(route_block, replacement, 1)
    router = router.replace('"022":"王居士砖塔铭"', '"022":"王居士砖塔铭","023":"圭峰定慧禅师碑"', 1)
    router = router.replace('"018","020","022"].includes(id)', '"018","020","022","023"].includes(id)')
    router_path.write_text(router, encoding="utf-8")

    detail_path = Path("js/detail_info_patch.js")
    detail = detail_path.read_text(encoding="utf-8")
    detail = detail.replace("__DETAIL_INFO_STABLE_ENTRY_V18__", "__DETAIL_INFO_STABLE_ENTRY_V19__", 1)
    detail = detail.replace("window.__DETAIL_INFO_STABLE_ENTRY_V18__=true;", "window.__DETAIL_INFO_STABLE_ENTRY_V19__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V18__=true;", 1)
    detail = detail.replace("data/beitie_header_info.json?v=20260724_wangjushi_v1", f"data/beitie_header_info.json?v={VERSION}")
    detail = detail.replace('"018","020","022"].includes(workId)', '"018","020","022","023"].includes(workId)')
    detail = detail.replace("window.__DAMAGE_AI_READING_ROUTER_V59__=true;", "window.__DAMAGE_AI_READING_ROUTER_V59__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V60__=true;")
    detail = detail.replace("js/damage_ai_reading.js?v=20260724_wangjushi_v1", f"js/damage_ai_reading.js?v={VERSION}")
    detail_path.write_text(detail, encoding="utf-8")

    html_path = Path("detail.html")
    html = html_path.read_text(encoding="utf-8")
    html = html.replace("js/detail_info_patch.js?v=20260724_uniform_font_header_v1", f"js/detail_info_patch.js?v={VERSION}")
    html = html.replace("js/damage_ai_reading.js?v=20260724_wangjushi_v1", f"js/damage_ai_reading.js?v={VERSION}")
    html_path.write_text(html, encoding="utf-8")


def main() -> None:
    raw = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    candidates = [row for row in walk(raw) if looks_like_row(row) and work_match(row)]
    normalized = []
    seen = set()
    for index, row in enumerate(candidates, 1):
        item = normalize_row(row, index)
        if not item:
            continue
        key = (item["glyph_id"], item["canvas_index"], item["order_in_page"], tuple(item["bbox"]))
        if key in seen:
            continue
        seen.add(key)
        normalized.append(item)
    normalized.sort(key=lambda row: (row["canvas_index"], row["order_in_page"], row["y"], -row["x"]))
    grouped = defaultdict(list)
    for row in normalized:
        grouped[int(row["canvas_index"])].append(row)
    for page_no in range(1, PAGE_COUNT + 1):
        rows = grouped.get(page_no, [])
        for order, row in enumerate(rows, 1):
            row["order_in_page"] = order
            row["annotation_index"] = order
        out = Path(f"data/glyph_boxes/iiif/023/page_{page_no:04d}.json")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    cases = json.loads(Path("data/work023_damage_cases_seed.json").read_text(encoding="utf-8"))
    cases, case_audit = locate_cases(cases, normalized)
    Path("data/work023_damage_cases.json").write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    transcript = Path("data/work023_full_text.txt").read_text(encoding="utf-8")
    text_sequence = compact(transcript)
    model_sequence = "".join(row.get("char", "") for row in normalized)
    coordinate_pages = sorted(grouped)
    image_only_pages = [page for page in range(1, PAGE_COUNT + 1) if page not in grouped]
    located = [item["id"] for item in case_audit if item["located"]]
    unlocated = [item["id"] for item in case_audit if not item["located"]]
    report = {
        "work_id": WORK_ID,
        "title": TITLE,
        "page_count": PAGE_COUNT,
        "status": "confirmed-audit-built-v1",
        "source_files": [str(MODEL_PATH)],
        "model_rows": len(normalized),
        "model_square_count": sum(row.get("char") == "□" for row in normalized),
        "text_comparable_characters": len(text_sequence),
        "text_square_count": transcript.count("□"),
        "covered_square_count": sum(int(case["square_count"]) for case in cases),
        "candidate_count": sum(int(case["candidate_count"]) for case in cases),
        "remaining_square_count": sum(int(case["remaining_square_count"]) for case in cases),
        "case_count": len(cases),
        "located_cases": len(located),
        "located_case_ids": located,
        "unlocated_cases": unlocated,
        "sequence_similarity": round(difflib.SequenceMatcher(None, text_sequence, model_sequence, autojunk=False).ratio(), 4),
        "coordinate_pages": coordinate_pages,
        "image_only_pages": image_only_pages,
        "coordinate_range": [min(coordinate_pages), max(coordinate_pages)] if coordinate_pages else [],
        "classification_summary": {
            mode: [case["id"] for case in cases if case["mode"] == mode]
            for mode in ("documentary", "mixed", "ai_provisional", "unresolved")
        },
        "case_locations": case_audit,
        "special_review": [
            "案例05可能是OCR误增方框或错位方框；低分时不应使用相邻完整字代替。",
            "案例08、09及碑末大段连续方框只定位第一个真实问题字，其余方框不分别截图。",
            "案例10按审核稿部分恢复，保留一处未定方框。",
        ],
    }
    Path("data/work023_coordinate_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_json_files(grouped)
    build_scripts()
    update_routes()

    assert transcript.count("□") == 93
    assert sum(case["square_count"] for case in cases) == 93
    assert sum(case["candidate_count"] for case in cases) == 25
    assert sum(case["remaining_square_count"] for case in cases) == 68
    print(json.dumps({"rows": len(normalized), "pages": coordinate_pages, "located": located, "unlocated": unlocated}, ensure_ascii=False))


if __name__ == "__main__":
    main()
