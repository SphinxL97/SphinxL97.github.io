#!/usr/bin/env python3
"""Generate 011 per-page glyph shards and persist static damage-case locations."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data/model_boxes/glyph_model_border_011_015.json"
TEXT = ROOT / "data/work011_full_text.txt"
CASES = ROOT / "data/work011_damage_cases.json"
OUT_DIR = ROOT / "data/glyph_boxes/iiif/011"
REPORT = ROOT / "data/work011_coordinate_report.json"
PAGE_COUNT = 54
WORK_ID = "011"
TITLE = "皇甫诞碑"

VARIANTS = {
    "鋒":"锋", "變":"变", "輕":"轻", "於":"于", "題":"题", "壘":"垒", "軒":"轩",
    "詔":"诏", "為":"为", "兩":"两", "賜":"赐", "絹":"绢", "礱":"礲", "砻":"礲",
    "達":"达", "飾":"饰", "與":"与", "鴻":"鸿", "練":"练", "萬":"万", "氣":"气",
    "隨":"随", "國":"国", "華":"华", "實":"实", "謂":"谓", "義":"义", "將":"将",
    "書":"书", "臺":"台", "獨":"独", "遠":"远", "來":"来", "聽":"听", "禮":"礼",
    "閣":"阁", "門":"门", "風":"风", "後":"后", "時":"时", "見":"见", "長":"长",
    "東":"东", "車":"车", "勳":"勋", "鐘":"钟", "備":"备", "騎":"骑", "軍":"军",
    "儀":"仪", "處":"处", "廣":"广", "總":"总", "轉":"转", "彈":"弹", "權":"权",
    "貪":"贪", "獄":"狱", "條":"条", "復":"复", "舊":"旧", "雖":"虽", "預":"预",
    "聲":"声", "節":"节", "觀":"观", "榮":"荣", "並":"并", "臨":"临", "晉":"晋",
    "屬":"属", "楊":"杨", "贈":"赠", "謚":"谥", "喪":"丧", "須":"须", "溫":"温",
    "潤":"润", "龍":"龙", "尋":"寻", "踐":"践", "識":"识", "進":"进", "賢":"贤",
    "黃":"黄", "諾":"诺", "齊":"齐", "寵":"宠", "謀":"谋", "鍾":"钟", "墳":"坟",
    "樹":"树", "飛":"飞", "隴":"陇", "銘":"铭", "積":"积", "偉":"伟", "寶":"宝",
    "慚":"惭", "雲":"云", "輔":"辅", "贊":"赞", "筆":"笔", "蘭":"兰", "開":"开",
    "務":"务", "職":"职", "聞":"闻", "亂":"乱", "階":"阶", "災":"灾", "難":"难",
    "興":"兴", "盡":"尽", "鳳":"凤", "圖":"图", "鎖":"锁", "喬":"乔", "銀":"银",
    "歐":"欧", "陽":"阳", "詢":"询", "□":"□"
}
IGNORED = re.compile(r"[\s\u3000，。；：、！？,.!?;:“”‘’'\"（）()《》〈〉【】〔〕［］—–…·]")


def canonical_char(value: Any) -> str:
    ch = str(value or "")[:1]
    if not ch or IGNORED.fullmatch(ch):
        return ""
    return VARIANTS.get(ch, ch)


def compact(value: Any) -> list[str]:
    return [key for ch in str(value or "") if (key := canonical_char(ch))]


def load_model() -> list[dict[str, Any]]:
    data = json.loads(MODEL.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        for key in ("rows", "items", "glyphs", "data"):
            if isinstance(data.get(key), list):
                data = data[key]
                break
    if not isinstance(data, list):
        raise RuntimeError("坐标汇总文件不是数组结构")
    return [row for row in data if str(row.get("work_id", "")).zfill(3) == WORK_ID]


def num(row: dict[str, Any], *keys: str, default: float = 0.0) -> float:
    for key in keys:
        value = row.get(key)
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                pass
    bbox = row.get("bbox")
    if isinstance(bbox, list) and len(bbox) >= 4:
        mapping = {"x":0, "bbox_x":0, "y":1, "bbox_y":1, "w":2, "bbox_w":2, "h":3, "bbox_h":3}
        for key in keys:
            if key in mapping:
                try:
                    return float(bbox[mapping[key]])
                except (TypeError, ValueError):
                    pass
    return default


def normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    page_counts: dict[int, int] = {}
    for source in rows:
        page = int(source.get("canvas_index") or source.get("page") or 0)
        if not 1 <= page <= PAGE_COUNT:
            continue
        x, y = num(source, "x", "bbox_x"), num(source, "y", "bbox_y")
        w, h = num(source, "w", "bbox_w"), num(source, "h", "bbox_h")
        if w <= 0 or h <= 0:
            continue
        page_counts[page] = page_counts.get(page, 0) + 1
        order = int(source.get("order_in_page") or source.get("annotation_index") or page_counts[page])
        char = str(source.get("char") or source.get("text") or "")[:1]
        row = dict(source)
        row.update({
            "glyph_id": str(source.get("glyph_id") or f"011_{TITLE}_p{page:04d}_c{page_counts[page]:03d}"),
            "char": char, "work_id": WORK_ID, "canvas_index": page,
            "canvas_label": str(source.get("canvas_label") or page),
            "canvas_width": int(float(source.get("canvas_width") or 2935)),
            "canvas_height": int(float(source.get("canvas_height") or 4424)),
            "order_in_page": order,
            "x": x, "y": y, "w": w, "h": h,
            "bbox_x": x, "bbox_y": y, "bbox_w": w, "bbox_h": h,
            "bbox": [x, y, w, h],
        })
        normalized.append(row)
    normalized.sort(key=lambda row: (int(row["canvas_index"]), int(row["order_in_page"])))
    return normalized


def context_score(pattern: list[str], square_index: int, stream: list[dict[str, Any]], pos: int) -> tuple[int, int, float]:
    left = [ch for ch in pattern[:square_index] if ch != "□"][-18:]
    right = [ch for ch in pattern[square_index + 1:] if ch != "□"][:18]
    matched = 0
    compared = 0
    for offset, expected in enumerate(reversed(left), start=1):
        index = pos - offset
        if index < 0:
            break
        actual = stream[index]["key"]
        if not actual:
            continue
        compared += 1
        if actual == expected:
            matched += 1
    for offset, expected in enumerate(right, start=1):
        index = pos + offset
        if index >= len(stream):
            break
        actual = stream[index]["key"]
        if not actual:
            continue
        compared += 1
        if actual == expected:
            matched += 1
    ratio = matched / compared if compared else 0.0
    return matched, compared, ratio


def locate_cases(cases: list[dict[str, Any]], rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    stream = [{"row": row, "key": canonical_char(row.get("char"))} for row in rows if canonical_char(row.get("char"))]
    square_positions = [index for index, item in enumerate(stream) if item["key"] == "□"]
    previous = -1
    audit: list[dict[str, Any]] = []

    for case in cases:
        pattern = compact(case.get("original") or case.get("o"))
        try:
            square_index = pattern.index("□")
        except ValueError:
            audit.append({"id": case.get("id"), "located": False, "reason": "case_without_square"})
            continue

        candidates: list[tuple[int, int, int, float, bool]] = []
        for pos in square_positions:
            if pos <= previous:
                continue
            matched, compared, ratio = context_score(pattern, square_index, stream, pos)
            candidates.append((pos, matched, compared, ratio, True))

        best_direct = max(candidates, key=lambda item: (item[1], item[3], -item[0]), default=None)
        if best_direct is None or best_direct[1] < 5 or best_direct[3] < 0.45:
            for pos in range(previous + 1, len(stream)):
                matched, compared, ratio = context_score(pattern, square_index, stream, pos)
                if matched >= 7 and ratio >= 0.65:
                    candidates.append((pos, matched, compared, ratio, False))

        candidates.sort(key=lambda item: (item[1], item[3], item[4], -item[0]), reverse=True)
        best = candidates[0] if candidates else None
        runner = candidates[1] if len(candidates) > 1 else None
        located = bool(best and best[1] >= 5 and best[3] >= 0.45)
        if located and runner and best[1] == runner[1] and abs(best[3] - runner[3]) < 0.03:
            located = False

        entry: dict[str, Any] = {"id": case.get("id"), "located": located, "candidate_count": len(candidates), "top_candidates": []}
        for candidate in candidates[:5]:
            pos, matched, compared, ratio, direct_square = candidate
            row = stream[pos]["row"]
            entry["top_candidates"].append({
                "page": int(row["canvas_index"]), "order_in_page": int(row["order_in_page"]),
                "char": row.get("char", ""), "matched": matched, "compared": compared,
                "ratio": round(ratio, 4), "direct_square": direct_square,
            })

        if located and best:
            pos = best[0]
            row = stream[pos]["row"]
            previous = pos
            corrected = str(case.get("corrected") or case.get("c") or "")
            restored_match = re.search(r"〔([^〕]*)〕", corrected)
            restored = restored_match.group(1) if restored_match else ""
            location = {
                "page": int(row["canvas_index"]), "glyph_id": str(row.get("glyph_id") or ""),
                "canvas": {"w": int(row.get("canvas_width") or 2935), "h": int(row.get("canvas_height") or 4424)},
                "bbox": {"x": float(row["x"]), "y": float(row["y"]), "w": float(row["w"]), "h": float(row["h"])},
                "match_method": "offline-context-alignment", "target_square_ordinal": 1,
                "target_kind": "restored" if restored else "first-missing", "restored_text": restored,
            }
            case["locations"] = [location]
            case["page"] = location["page"]
            entry.update({"page": location["page"], "glyph_id": location["glyph_id"], "match_method": location["match_method"]})
        audit.append(entry)
    return cases, audit


def main() -> None:
    rows = normalize_rows(load_model())
    if not rows:
        raise RuntimeError("011坐标汇总中没有有效字框")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages: dict[int, list[dict[str, Any]]] = {page: [] for page in range(1, PAGE_COUNT + 1)}
    for row in rows:
        pages[int(row["canvas_index"])].append(row)
    for page in range(1, PAGE_COUNT + 1):
        (OUT_DIR / f"page_{page:04d}.json").write_text(json.dumps(pages[page], ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    cases = json.loads(CASES.read_text(encoding="utf-8"))
    cases, audit = locate_cases(cases, rows)
    CASES.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")

    located = [item for item in audit if item.get("located")]
    locations = [case.get("locations", [{}])[0] for case in cases if case.get("locations")]
    report = {
        "work_id": WORK_ID, "title": TITLE, "source_model": str(MODEL.relative_to(ROOT)),
        "coordinate_rows": len(rows), "pages_with_rows": sum(bool(value) for value in pages.values()),
        "page_files_written": PAGE_COUNT,
        "direct_square_glyphs": sum(canonical_char(row.get("char")) == "□" for row in rows),
        "text_squares": TEXT.read_text(encoding="utf-8").count("□"),
        "case_squares": sum(str(case.get("original") or case.get("o") or "").count("□") for case in cases),
        "cases": len(cases), "located_cases": len(located),
        "unmapped_case_ids": [str(item.get("id")) for item in audit if not item.get("located")],
        "location_order_monotonic": all((locations[i]["page"], locations[i].get("glyph_id", "")) <= (locations[i + 1]["page"], locations[i + 1].get("glyph_id", "")) for i in range(len(locations) - 1)),
        "case_audit": audit,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in report if key != "case_audit"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
