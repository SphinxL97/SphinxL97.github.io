from __future__ import annotations

import difflib
import json
import re
import traceback
from pathlib import Path

MODEL = Path("data/model_boxes/glyph_model_border_011_015.json")
TEXT = Path("data/work014_02_full_text.txt")
CASES = Path("data/work014_02_damage_cases.json")
REPORT = Path("data/work014_02_coordinate_report.json")
OUT = Path("data/glyph_boxes/iiif/014-02")
PAGE_INDEX = Path("data/page_images_index.json")
CATALOG = Path("data/beitie_catalog.json")
ROUTER = Path("js/damage_ai_reading.js")
DETAIL_PATCH = Path("js/detail_info_patch.js")
DETAIL = Path("detail.html")
PAGE_COUNT = 72
IMAGE_ROOT = "assets/page_images/014_颜真卿李玄靖碑/images/02_顏真卿李玄靖碑册二"
VERSION = "20260723_lihanjing_014_02_v1"
COLOPHON = "紹興丁巳五月十有四日，大風折顔碑，雲溪沈作舟扶起之。"

VARIANTS = {
    "扵": "於", "於": "於", "亐": "于", "于": "于", "㠯": "以", "以": "以",
    "朙": "明", "明": "明", "亰": "京", "京": "京", "顔": "颜", "顏": "颜", "颜": "颜",
    "羣": "群", "群": "群", "黄": "黄", "黃": "黄", "呉": "吴", "吳": "吴", "吴": "吴",
    "辝": "辞", "辭": "辞", "辞": "辞", "髙": "高", "高": "高", "秊": "年", "年": "年",
    "乹": "乾", "乾": "乾", "曆": "历", "歷": "历", "历": "历", "氣": "气", "气": "气",
    "啓": "启", "啟": "启", "启": "启", "弥": "弥", "彌": "弥",
}
IGNORED = set(" \t\r\n\u3000，。；：、！？,.!?;:“”‘’'\"（）()《》〈〉【】〔〕［］—–…·")


def canon(ch: str) -> str:
    if not ch or ch in IGNORED:
        return ""
    return VARIANTS.get(ch, ch)


def rect(row: dict) -> dict[str, float]:
    bbox = row.get("bbox") or row.get("bbox_xywh") or []
    return {
        "x": float(row.get("x", row.get("bbox_x", bbox[0] if len(bbox) > 0 else 0)) or 0),
        "y": float(row.get("y", row.get("bbox_y", bbox[1] if len(bbox) > 1 else 0)) or 0),
        "w": float(row.get("w", row.get("bbox_w", bbox[2] if len(bbox) > 2 else 0)) or 0),
        "h": float(row.get("h", row.get("bbox_h", bbox[3] if len(bbox) > 3 else 0)) or 0),
    }


def unwrap_rows(data: object) -> list[dict]:
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if isinstance(data, dict):
        for key in ("rows", "items", "data", "glyphs", "annotations"):
            rows = data.get(key)
            if isinstance(rows, list):
                return [row for row in rows if isinstance(row, dict)]
    return []


def plain_corrected(value: object) -> str:
    return str(value).replace("〔", "").replace("〕", "")


def chinese_page_label(page: int) -> str:
    digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
    if page < 10:
        return digits[page]
    if page < 20:
        return "十" + ("" if page == 10 else digits[page % 10])
    tens, ones = divmod(page, 10)
    return digits[tens] + "十" + (digits[ones] if ones else "")


def image_path(page: int) -> str:
    return f"{IMAGE_ROOT}/{page:04d}_{chinese_page_label(page)}.jpg"


def expected_target_index(source_text: str, filled_text: str, case: dict) -> int | None:
    start = source_text.find(str(case.get("original", "")))
    if start < 0:
        return None
    target = start + str(case.get("original", "")).find("□")
    if target < start:
        return None
    return sum(1 for ch in filled_text[:target] if canon(ch))


def score_candidate(expected: list[str], model_chars: list[str], eidx: int, midx: int, previous: int, stream: list[dict], body_min: int, body_max: int) -> float:
    if midx <= previous:
        return -999.0
    left_len = 18
    right_len = 18
    exp_left = "".join(expected[max(0, eidx - left_len):eidx])
    exp_right = "".join(expected[eidx + 1:min(len(expected), eidx + 1 + right_len)])
    mod_left = "".join(model_chars[max(0, midx - len(exp_left)):midx])
    mod_right = "".join(model_chars[midx + 1:midx + 1 + len(exp_right)])
    left_ratio = difflib.SequenceMatcher(None, exp_left, mod_left, autojunk=False).ratio() if exp_left else 0
    right_ratio = difflib.SequenceMatcher(None, exp_right, mod_right, autojunk=False).ratio() if exp_right else 0
    target = model_chars[midx]
    desired = expected[eidx]
    target_bonus = 0.75 if target == desired else (0.52 if target == "□" else 0)
    neighbor_bonus = 0.0
    for offset in (-3, -2, -1, 1, 2, 3):
        if 0 <= eidx + offset < len(expected) and 0 <= midx + offset < len(model_chars):
            if expected[eidx + offset] == model_chars[midx + offset]:
                neighbor_bonus += 0.08
    page = int(stream[midx]["canvas_index"])
    page_bonus = 0.15 if body_min <= page <= body_max else -0.35
    return left_ratio + right_ratio + target_bonus + neighbor_bonus + page_bonus


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    report: dict = {
        "work_id": "014-02",
        "page_count": PAGE_COUNT,
        "status": "started",
        "colophon_text": COLOPHON,
    }
    try:
        raw_rows = unwrap_rows(json.loads(MODEL.read_text("utf-8")))
        selected: list[dict] = []
        for source_index, row in enumerate(raw_rows):
            virtual_id = str(row.get("virtual_id", ""))
            work_id = str(row.get("work_id", ""))
            if virtual_id != "014-02" and work_id != "014-02":
                continue
            page = int(row.get("canvas_index", row.get("page", 0)) or 0)
            box = rect(row)
            if not page or not (1 <= page <= PAGE_COUNT) or box["w"] <= 0 or box["h"] <= 0:
                continue
            item = dict(row)
            text = str(row.get("char", row.get("text", "")))[:1]
            order = int(row.get("order_in_page", row.get("annotation_index", source_index + 1)) or source_index + 1)
            item.update({
                "work_id": "014",
                "virtual_id": "014-02",
                "canvas_index": page,
                "glyph_id": str(row.get("glyph_id") or f"014-02_{page}_{order}"),
                "char": text,
                "text": text,
                "order_in_page": order,
                "bbox_x": box["x"],
                "bbox_y": box["y"],
                "bbox_w": box["w"],
                "bbox_h": box["h"],
                "bbox": [box["x"], box["y"], box["w"], box["h"]],
                "local_image": image_path(page),
            })
            selected.append(item)

        selected.sort(key=lambda row: (int(row["canvas_index"]), int(row["order_in_page"])))
        groups = {page: [] for page in range(1, PAGE_COUNT + 1)}
        for row in selected:
            groups[int(row["canvas_index"])].append(row)

        source_text = TEXT.read_text("utf-8")
        cases = json.loads(CASES.read_text("utf-8"))
        filled_text = source_text
        for case in cases:
            original = str(case.get("original", ""))
            corrected = plain_corrected(case.get("corrected", original))
            if original in filled_text:
                filled_text = filled_text.replace(original, corrected, 1)

        expected = [canon(ch) for ch in filled_text if canon(ch)]
        stream: list[dict] = []
        model_chars: list[str] = []
        for row in selected:
            key = canon(str(row.get("char") or row.get("text") or ""))
            if not key:
                continue
            stream.append(row)
            model_chars.append(key)

        matcher = difflib.SequenceMatcher(None, expected, model_chars, autojunk=False)
        blocks = matcher.get_matching_blocks()
        exact_map: dict[int, int] = {}
        useful_blocks: list[dict] = []
        for block in blocks:
            if block.size >= 3:
                useful_blocks.append({"a": block.a, "b": block.b, "size": block.size})
            for offset in range(block.size):
                exact_map[block.a + offset] = block.b + offset

        block_pages: list[int] = []
        for block in blocks:
            if block.size < 4:
                continue
            for idx in (block.b, block.b + block.size - 1):
                if 0 <= idx < len(stream):
                    block_pages.append(int(stream[idx]["canvas_index"]))
        body_start = min(block_pages) if block_pages else 1
        body_end = max(block_pages) if block_pages else PAGE_COUNT

        def estimate(eidx: int) -> int:
            left = [(a, b) for a, b in exact_map.items() if a < eidx]
            right = [(a, b) for a, b in exact_map.items() if a > eidx]
            if left and right:
                la, lb = max(left)
                ra, rb = min(right)
                if ra != la:
                    return int(round(lb + (eidx - la) * (rb - lb) / (ra - la)))
            if left:
                la, lb = max(left)
                return lb + (eidx - la)
            if right:
                ra, rb = min(right)
                return rb - (ra - eidx)
            return len(model_chars) // 2

        previous = -1
        located = 0
        audits: list[dict] = []
        for case in cases:
            eidx = expected_target_index(source_text, filled_text, case)
            candidates: list[tuple[float, int, str]] = []
            if eidx is not None and 0 <= eidx < len(expected):
                if eidx in exact_map and exact_map[eidx] > previous:
                    candidates.append((9.0, exact_map[eidx], "sequence-exact"))
                center = estimate(eidx)
                lo = max(previous + 1, center - 160, 0)
                hi = min(len(model_chars), center + 161)
                for midx in range(lo, hi):
                    candidates.append((
                        score_candidate(expected, model_chars, eidx, midx, previous, stream, body_start, body_end),
                        midx,
                        "context-alignment",
                    ))
            candidates.sort(key=lambda item: item[0], reverse=True)
            best = candidates[0] if candidates else None
            second = candidates[1] if len(candidates) > 1 else None
            accepted = False
            if best:
                margin = best[0] - (second[0] if second else -9)
                accepted = best[2] == "sequence-exact" or (best[0] >= 1.30 and margin >= 0.07)

            audit = {
                "id": case.get("id"),
                "expected_index": eidx,
                "accepted": accepted,
                "top_candidates": [],
            }
            for score, midx, method in candidates[:4]:
                row = stream[midx]
                audit["top_candidates"].append({
                    "score": round(score, 4),
                    "method": method,
                    "page": int(row["canvas_index"]),
                    "order_in_page": int(row["order_in_page"]),
                    "char": row.get("char", ""),
                    "glyph_id": row.get("glyph_id", ""),
                })

            if accepted and best:
                score, midx, method = best
                row = stream[midx]
                box = rect(row)
                page = int(row["canvas_index"])
                location = {
                    "page": page,
                    "image": image_path(page),
                    "glyph_id": str(row.get("glyph_id", "")),
                    "canvas": {
                        "w": int(row.get("canvas_width", 2943) or 2943),
                        "h": int(row.get("canvas_height", 4429) or 4429),
                    },
                    "bbox": {"x": box["x"], "y": box["y"], "w": box["w"], "h": box["h"]},
                    "match_method": method,
                    "alignment_score": round(score, 4),
                    "bbox_source": "existing-model-row",
                }
                case["locations"] = [location]
                case["page"] = page
                case["n"] = case.get("category", "残损碑文恢复")
                case["t"] = case.get("title", "")
                case["o"] = case.get("original", "")
                case["c"] = case.get("corrected", "")
                previous = midx
                located += 1
                audit["location"] = location
            else:
                case["locations"] = []
                case["page"] = "—"
            audits.append(audit)

        forced_locations = {
            "03": (25, 7, "manual-verified-page-sequence"),
            "08": (64, 112, "manual-misaligned-square"),
        }
        case_map = {str(case.get("id")): case for case in cases}
        audit_map = {str(audit.get("id")): audit for audit in audits}
        for case_id, (page, order, method) in forced_locations.items():
            row = next((candidate for candidate in groups.get(page, []) if int(candidate.get("order_in_page", 0)) == order), None)
            if row is None:
                continue
            box = rect(row)
            location = {
                "page": page,
                "image": image_path(page),
                "glyph_id": str(row.get("glyph_id", "")),
                "canvas": {
                    "w": int(row.get("canvas_width", 2943) or 2943),
                    "h": int(row.get("canvas_height", 4429) or 4429),
                },
                "bbox": {"x": box["x"], "y": box["y"], "w": box["w"], "h": box["h"]},
                "match_method": method,
                "alignment_score": None,
                "bbox_source": "existing-model-row",
            }
            case = case_map[case_id]
            case["locations"] = [location]
            case["page"] = page
            case["n"] = case.get("category", "残损碑文恢复")
            case["t"] = case.get("title", "")
            case["o"] = case.get("original", "")
            case["c"] = case.get("corrected", "")
            audit = audit_map[case_id]
            audit["accepted"] = True
            audit["location"] = location
            audit["manual_review"] = "页面字序直接核验：案例03为第25页第7字；案例08为第64页第112字，属于方框位置错移，仍显示实际残损槽位。"
        located = sum(1 for audit in audits if audit.get("accepted"))

        accepted_pages = [audit["location"]["page"] for audit in audits if audit.get("location")]
        if accepted_pages:
            body_start = min(body_start, min(accepted_pages))
            body_end = max(body_end, max(accepted_pages))

        coordinate_pages: list[int] = []
        image_only_pages: list[int] = []
        colophon_pages: list[int] = []
        for page in range(1, PAGE_COUNT + 1):
            rows = groups.get(page, []) if body_start <= page <= body_end else []
            if rows:
                coordinate_pages.append(page)
            else:
                image_only_pages.append(page)
                if page > body_end and groups.get(page):
                    colophon_pages.append(page)
            (OUT / f"page_{page:04d}.json").write_text(
                json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )

        CASES.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")

        page_index = json.loads(PAGE_INDEX.read_text("utf-8"))
        works = page_index.setdefault("works", {})
        pages = []
        for page in range(1, PAGE_COUNT + 1):
            rows = groups.get(page, [])
            first = rows[0] if rows else {}
            pages.append({
                "page": page,
                "label": chinese_page_label(page),
                "image": image_path(page),
                "text_clean": "",
                "text_raw": "",
                "char_count": len(rows),
                "has_char_boxes": bool(rows and body_start <= page <= body_end),
                "canvas_width": int(first.get("canvas_width", 2943) or 2943),
                "canvas_height": int(first.get("canvas_height", 4429) or 4429),
            })
        works["014-02"] = {
            "id": "014-02",
            "parent_id": "014",
            "volume_no": 2,
            "title": "颜真卿李玄靖碑册二",
            "cover": image_path(1),
            "page_count": PAGE_COUNT,
            "pages": pages,
        }
        parent = works.get("014") if isinstance(works.get("014"), dict) else {}
        parent.update({
            "id": "014",
            "title": "颜真卿李玄靖碑",
            "cover": "assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
            "has_volumes": True,
            "volumes": [
                {"id": "014-01", "title": "颜真卿李玄靖碑册一", "page_count": 76},
                {"id": "014-02", "title": "颜真卿李玄靖碑册二", "page_count": 72},
            ],
        })
        works["014"] = parent
        PAGE_INDEX.write_text(json.dumps(page_index, ensure_ascii=False, indent=2), encoding="utf-8")

        catalog = json.loads(CATALOG.read_text("utf-8"))
        record = {
            "id": "014",
            "title": "颜真卿李玄靖碑",
            "cover": "assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
            "dynasty": "唐大历十二年（777）",
            "script": "楷书",
            "creator": "吴崇休（镌），颜真卿（撰并书）",
            "shelf_mark": "22BT013",
            "active": True,
            "detail_url": "detail.html?id=014-01",
            "status": "封面入口",
            "subtitle": "共二册，图像、逐页释文与单字定位已接入。",
            "year": "777",
            "brief_source": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第六辑",
            "canvas_count": 148,
            "has_volumes": True,
        }
        replaced = False
        for index, item in enumerate(catalog):
            if str(item.get("id", "")).zfill(3) == "014":
                catalog[index] = record
                replaced = True
                break
        if not replaced:
            catalog.append(record)
            catalog.sort(key=lambda item: str(item.get("id", "")).split("-")[0].zfill(3))
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

        router = ROUTER.read_text("utf-8")
        router = router.replace(
            '    "014-01":[\n      {src:"js/work-014-coordinate-adapter.js?v=20260723_lihanjing_014_01_v2",key:"w01401c",ready:()=>Boolean(window.__WORK_014_01_COORDINATE_ADAPTER__)},\n      {src:"js/work-014.js?v=20260723_lihanjing_014_01_v3",key:"w01401",ready:()=>Boolean(window.__WORK_014_01_STABLE_READY__)}\n    ]',
            '    "014-01":[\n      {src:"js/work-014-coordinate-adapter.js?v=20260723_lihanjing_014_01_v2",key:"w01401c",ready:()=>Boolean(window.__WORK_014_01_COORDINATE_ADAPTER__)},\n      {src:"js/work-014.js?v=20260723_lihanjing_014_01_v3",key:"w01401",ready:()=>Boolean(window.__WORK_014_01_STABLE_READY__)}\n    ],\n    "014-02":[\n      {src:"js/work-014-02-coordinate-adapter.js?v=20260723_lihanjing_014_02_v1",key:"w01402c",ready:()=>Boolean(window.__WORK_014_02_COORDINATE_ADAPTER__)},\n      {src:"js/work-014-02.js?v=20260723_lihanjing_014_02_v1",key:"w01402",ready:()=>Boolean(window.__WORK_014_02_STABLE_READY__)}\n    ]',
        )
        router = router.replace(
            '"014-01":"颜真卿李玄靖碑册一"',
            '"014-01":"颜真卿李玄靖碑册一","014-02":"颜真卿李玄靖碑册二"',
        )
        router = router.replace('    if(raw==="014-02")return;\n', "")
        ROUTER.write_text(router, encoding="utf-8")

        patch = DETAIL_PATCH.read_text("utf-8")
        patch = re.sub(
            r'js/damage_ai_reading\.js\?v=[^"\']+',
            f'js/damage_ai_reading.js?v={VERSION}',
            patch,
            count=1,
        )
        DETAIL_PATCH.write_text(patch, encoding="utf-8")

        detail = DETAIL.read_text("utf-8")
        detail = re.sub(
            r'js/detail_info_patch\.js\?v=[^"\']+',
            f'js/detail_info_patch.js?v={VERSION}',
            detail,
            count=1,
        )
        detail = re.sub(
            r'js/damage_ai_reading\.js\?v=[^"\']+',
            f'js/damage_ai_reading.js?v={VERSION}',
            detail,
            count=1,
        )
        DETAIL.write_text(detail, encoding="utf-8")

        report.update({
            "status": "completed",
            "model_rows": len(selected),
            "model_stream_chars": len(model_chars),
            "expected_chars": len(expected),
            "sequence_ratio": round(matcher.ratio(), 4),
            "body_page_range": [body_start, body_end],
            "coordinate_pages": coordinate_pages,
            "image_only_pages": image_only_pages,
            "colophon_or_appendix_pages": colophon_pages,
            "case_count": len(cases),
            "located_cases": located,
            "unlocated_cases": [audit["id"] for audit in audits if not audit["accepted"]],
            "matching_blocks": useful_blocks[:100],
            "cases": audits,
        })
    except Exception as error:
        report.update({
            "status": "error",
            "error": repr(error),
            "traceback": traceback.format_exc(),
        })
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        key: report.get(key)
        for key in (
            "status", "model_rows", "sequence_ratio", "body_page_range",
            "case_count", "located_cases", "unlocated_cases",
            "colophon_or_appendix_pages", "error",
        )
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
