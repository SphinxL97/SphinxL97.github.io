#!/usr/bin/env python3
"""Generate 010 per-page glyph shards and persist static damage-case locations."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data/model_boxes/glyph_model_border_006_010.json"
TEXT = ROOT / "data/work010_full_text.txt"
CASES = ROOT / "data/work010_damage_cases.json"
OUT_DIR = ROOT / "data/glyph_boxes/iiif/010"
REPORT = ROOT / "data/work010_coordinate_report.json"
PAGE_COUNT = 82

VARIANTS = {
    "扵": "於", "於": "於", "乗": "乘", "乘": "乘", "髙": "高", "高": "高",
    "圡": "土", "土": "土", "邱": "丘", "丘": "丘", "无": "無", "無": "無",
    "祕": "秘", "秘": "秘", "峯": "峰", "峰": "峰", "羣": "群", "群": "群",
    "衆": "眾", "眾": "眾", "爲": "為", "為": "為", "裏": "裡", "裡": "裡",
    "来": "來", "來": "來", "随": "隨", "隨": "隨", "台": "臺", "臺": "臺",
}
IGNORED = set(" \t\r\n\u3000，。；：、！？,.!?;:“”‘’'\"（）()《》〈〉【】〔〕［］—–…·")


def canonical(value: Any) -> str:
    text = str(value or "")
    if not text:
        return ""
    ch = text[0]
    if ch in IGNORED:
        return ""
    return VARIANTS.get(ch, ch)


def work_code(row: dict[str, Any]) -> str:
    raw = str(row.get("work_id") or row.get("virtual_id") or row.get("work_index") or "")
    match = re.search(r"\d{1,3}", raw)
    return match.group(0).zfill(3) if match else ""


def positive_box(row: dict[str, Any]) -> tuple[float, float, float, float] | None:
    bbox = row.get("bbox") if isinstance(row.get("bbox"), list) else [None] * 4
    x = float(row.get("x", row.get("bbox_x", bbox[0] or 0)) or 0)
    y = float(row.get("y", row.get("bbox_y", bbox[1] or 0)) or 0)
    w = float(row.get("w", row.get("bbox_w", bbox[2] or 0)) or 0)
    h = float(row.get("h", row.get("bbox_h", bbox[3] or 0)) or 0)
    if w <= 0 or h <= 0:
        return None
    return x, y, w, h


def normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        if work_code(row) != "010":
            continue
        box = positive_box(row)
        page = int(row.get("canvas_index") or row.get("page") or 0)
        if not box or page <= 0:
            continue
        x, y, w, h = box
        item = dict(row)
        item["work_id"] = "010"
        item["canvas_index"] = page
        item["order_in_page"] = int(row.get("order_in_page") or row.get("annotation_index") or index + 1)
        item["glyph_id"] = str(row.get("glyph_id") or f"010_赵清献公碑_p{page:04d}_c{item['order_in_page']:03d}")
        item["char"] = str(row.get("char") or row.get("text") or "")[:1]
        item["x"], item["y"], item["w"], item["h"] = x, y, w, h
        item["bbox_x"], item["bbox_y"], item["bbox_w"], item["bbox_h"] = x, y, w, h
        item["bbox"] = [x, y, w, h]
        filtered.append(item)
    filtered.sort(key=lambda row: (int(row["canvas_index"]), int(row["order_in_page"])))
    return filtered


def compact_text(value: str) -> list[str]:
    return [key for ch in value for key in [canonical(ch)] if key]


def align_text_to_rows(text_chars: list[str], row_chars: list[str]) -> list[int | None]:
    """Semi-global alignment: all text is aligned, row prefix/suffix are free."""
    n, m = len(text_chars), len(row_chars)
    stride = m + 1
    directions = bytearray((n + 1) * stride)
    gap = -2
    previous = [0] * (m + 1)

    for i in range(1, n + 1):
        current = [0] * (m + 1)
        current[0] = i * gap
        t = text_chars[i - 1]
        base = i * stride
        for j in range(1, m + 1):
            r = row_chars[j - 1]
            if t == r:
                match = 4
            elif t == "□":
                match = 2 if r == "□" else 1
            else:
                match = -3
            diag = previous[j - 1] + match
            up = previous[j] + gap
            left = current[j - 1] + gap
            if diag >= up and diag >= left:
                current[j] = diag
                directions[base + j] = 1
            elif up >= left:
                current[j] = up
                directions[base + j] = 2
            else:
                current[j] = left
                directions[base + j] = 3
        previous = current

    j = max(range(m + 1), key=previous.__getitem__)
    i = n
    mapping: list[int | None] = [None] * n
    while i > 0:
        direction = directions[i * stride + j] if j >= 0 else 2
        if direction == 1 and j > 0:
            mapping[i - 1] = j - 1
            i -= 1
            j -= 1
        elif direction == 3 and j > 0:
            j -= 1
        else:
            i -= 1
    return mapping


def repair_square_mapping(
    text_chars: list[str], mapping: list[int | None], row_chars: list[str]
) -> list[int | None]:
    squares = [index for index, ch in enumerate(text_chars) if ch == "□"]
    result: list[int | None] = []
    for text_index in squares:
        row_index = mapping[text_index]
        if row_index is not None:
            result.append(row_index)
            continue
        before = next((mapping[i] for i in range(text_index - 1, -1, -1) if mapping[i] is not None), None)
        after = next((mapping[i] for i in range(text_index + 1, len(mapping)) if mapping[i] is not None), None)
        low = 0 if before is None else before + 1
        high = len(row_chars) if after is None else after
        candidates = list(range(max(0, low), min(len(row_chars), high)))
        square_candidates = [i for i in candidates if row_chars[i] == "□"]
        if square_candidates:
            result.append(square_candidates[0])
        elif len(candidates) == 1:
            result.append(candidates[0])
        else:
            result.append(None)
    return result


def first_restored(corrected: str) -> str:
    match = re.search(r"〔([^〕]+)〕", corrected)
    return match.group(1) if match else ""


def main() -> None:
    model_rows = json.loads(MODEL.read_text(encoding="utf-8"))
    if not isinstance(model_rows, list):
        raise SystemExit("model shard is not a JSON array")
    rows = normalize_rows(model_rows)
    if not rows:
        raise SystemExit("no coordinate rows found for work 010")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages: dict[int, list[dict[str, Any]]] = {page: [] for page in range(1, PAGE_COUNT + 1)}
    for row in rows:
        page = int(row["canvas_index"])
        if 1 <= page <= PAGE_COUNT:
            pages[page].append(row)
    for page, page_rows in pages.items():
        page_rows.sort(key=lambda row: int(row["order_in_page"]))
        path = OUT_DIR / f"page_{page:04d}.json"
        path.write_text(json.dumps(page_rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    full_text = TEXT.read_text(encoding="utf-8")
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    if full_text.count("□") != 36:
        raise SystemExit(f"expected 36 text squares, got {full_text.count('□')}")
    case_square_count = sum(str(case.get("original") or case.get("o") or "").count("□") for case in cases)
    if case_square_count != 36:
        raise SystemExit(f"expected 36 case squares, got {case_square_count}")

    text_chars = compact_text(full_text)
    align_rows: list[dict[str, Any]] = []
    row_chars: list[str] = []
    for row in rows:
        key = canonical(row.get("char") or row.get("text"))
        if not key:
            continue
        align_rows.append(row)
        row_chars.append(key)

    mapping = align_text_to_rows(text_chars, row_chars)
    square_row_indexes = repair_square_mapping(text_chars, mapping, row_chars)
    direct_square_glyphs = sum(1 for key in row_chars if key == "□")

    cumulative = 0
    located = 0
    unmapped: list[str] = []
    used_rows: list[int] = []
    for case in cases:
        original = str(case.get("original") or case.get("o") or "")
        target_index = cumulative
        cumulative += original.count("□")
        aligned_index = square_row_indexes[target_index] if target_index < len(square_row_indexes) else None
        if aligned_index is None or aligned_index >= len(align_rows):
            case["locations"] = []
            case["page"] = "—"
            unmapped.append(str(case.get("id")))
            continue
        row = align_rows[aligned_index]
        box = positive_box(row)
        if not box:
            case["locations"] = []
            case["page"] = "—"
            unmapped.append(str(case.get("id")))
            continue
        x, y, w, h = box
        page = int(row["canvas_index"])
        restored = first_restored(str(case.get("corrected") or case.get("c") or ""))
        method = "offline-square-alignment" if canonical(row.get("char")) == "□" else "offline-sequence-alignment"
        location = {
            "page": page,
            "glyph_id": str(row.get("glyph_id") or ""),
            "canvas": {
                "w": int(float(row.get("canvas_width") or 2943)),
                "h": int(float(row.get("canvas_height") or 4429)),
            },
            "bbox": {"x": x, "y": y, "w": w, "h": h},
            "match_method": method,
            "target_square_ordinal": 1,
            "target_kind": "unresolved" if case.get("mode") == "unresolved" else "restored",
            "restored_text": restored,
        }
        case["locations"] = [location]
        case["page"] = page
        located += 1
        used_rows.append(aligned_index)

    CASES.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")
    monotonic = all(a < b for a, b in zip(used_rows, used_rows[1:]))
    report = {
        "work_id": "010",
        "title": "赵清献公碑",
        "source_model": str(MODEL.relative_to(ROOT)),
        "coordinate_rows": len(rows),
        "pages_with_rows": sum(1 for page_rows in pages.values() if page_rows),
        "page_files_written": PAGE_COUNT,
        "direct_square_glyphs": direct_square_glyphs,
        "text_squares": full_text.count("□"),
        "case_squares": case_square_count,
        "cases": len(cases),
        "located_cases": located,
        "unmapped_case_ids": unmapped,
        "location_order_monotonic": monotonic,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if located < 25:
        raise SystemExit(f"only {located} of {len(cases)} cases were located")
    if not monotonic:
        raise SystemExit("case locations are not monotonic")


if __name__ == "__main__":
    main()
