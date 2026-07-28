#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audit inscription/transcription data for the 33 visible works.

This script is intentionally conservative. It inventories text-bearing JSON/JS/HTML/TXT
files, extracts page transcription candidates, identifies correction-like records, and
packages only relevant small/medium files for later local review. It does not invent or
silently fill uncertain characters.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable

VISIBLE_IDS = [
    "001","002","003","004","005","006","007","010","011","013",
    "014","015","016","017","018","020","022","023","024","025",
    "026","027","028","029","030","031","032","033","034","035",
    "036","043","044",
]
VISIBLE_SET = set(VISIBLE_IDS)

TEXT_EXTS = {".json", ".jsonl", ".js", ".html", ".txt", ".md", ".csv"}
SKIP_PARTS = {
    ".git", "node_modules", "assets/page_images", "data/glyph_boxes",
    "data/model_boxes", "data/glyph_model", "data/glyph_model_border",
}
TEXT_KEYS = {
    "text_clean", "text_raw", "text", "transcript", "transcription", "page_text",
    "full_text", "content", "reading_text", "clean_text", "final_text",
    "corrected_text", "repaired_text", "restored_text", "replacement",
}
CORRECTION_KEYS = {
    "original", "original_text", "ocr", "ocr_text", "before", "source_text",
    "corrected", "corrected_text", "after", "replacement", "final_text",
    "restored", "restored_text", "repaired", "repaired_text", "suggestion",
    "ai_result", "ai_text", "target", "target_text", "answer",
}
ID_KEYS = {"id", "work_id", "parent_id", "virtual_id", "work_index", "beitie_id"}
PAGE_KEYS = {"page", "page_no", "page_index", "canvas_index", "canvas_no", "order", "index"}
PLACEHOLDER_RE = re.compile(r"[□�？?]|\[缺\]|〔缺〕|待考|未详|缺字|漫漶|残缺")
RELEVANT_RE = re.compile(
    r"text_clean|text_raw|transcript|transcription|corrected|repaired|restored|replacement|"
    r"original_text|ocr_text|ai_result|ai_text|残损|修复|释文|缺字|补字",
    re.I,
)
WORK_ID_RE = re.compile(r"(?<!\d)(\d{3})(?:-\d{2})?(?!\d)")

ROOT = Path.cwd()
OUT = ROOT / "output_inscription_audit"
FILES_OUT = OUT / "relevant_files"


def should_skip(path: Path) -> bool:
    s = path.as_posix()
    return any(part in s for part in SKIP_PARTS)


def normalize_work_id(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, int):
        value = f"{value:03d}"
    s = str(value).strip()
    m = re.match(r"^(\d{1,3})(?:-\d{1,2})?$", s)
    if m:
        return m.group(1).zfill(3)
    m = WORK_ID_RE.search(s)
    if m:
        return m.group(1)
    return None


def iter_text_files() -> Iterable[Path]:
    roots = [ROOT / "data", ROOT / "js"]
    for root_file in ROOT.glob("*.html"):
        yield root_file
    for base in roots:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_EXTS and not should_skip(path):
                yield path


def read_text(path: Path) -> str | None:
    try:
        if path.stat().st_size > 35 * 1024 * 1024:
            return None
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="utf-8-sig")
        except Exception:
            return None
    except Exception:
        return None


def object_work_id(obj: dict[str, Any], inherited: str | None = None) -> str | None:
    for key in ID_KEYS:
        if key in obj:
            wid = normalize_work_id(obj.get(key))
            if wid:
                return wid
    return inherited


def page_number(obj: dict[str, Any], fallback: int) -> int:
    for key in PAGE_KEYS:
        value = obj.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    return fallback


def best_text_from_dict(obj: dict[str, Any]) -> tuple[str | None, str | None]:
    priority = [
        "final_text", "corrected_text", "repaired_text", "restored_text", "text_clean",
        "reading_text", "clean_text", "transcription", "transcript", "page_text",
        "full_text", "text", "content", "text_raw",
    ]
    for key in priority:
        value = obj.get(key)
        if isinstance(value, str) and value.strip():
            return key, value.strip()
    return None, None


def walk_json(
    node: Any,
    file_path: str,
    inherited_work: str | None,
    pointer: str,
    pages: dict[str, list[dict[str, Any]]],
    corrections: dict[str, list[dict[str, Any]]],
    key_counter: Counter,
) -> None:
    if isinstance(node, dict):
        key_counter.update(node.keys())
        work = object_work_id(node, inherited_work)
        key, text = best_text_from_dict(node)
        if work in VISIBLE_SET and text:
            page_like = bool(set(node).intersection(PAGE_KEYS)) or key in {
                "text_clean", "text_raw", "page_text", "transcript", "transcription"
            }
            if page_like:
                pages[work].append({
                    "file": file_path,
                    "pointer": pointer,
                    "page": page_number(node, len(pages[work]) + 1),
                    "field": key,
                    "text": text,
                    "placeholder_count": len(PLACEHOLDER_RE.findall(text)),
                })

        present_correction_keys = set(node).intersection(CORRECTION_KEYS)
        if work in VISIBLE_SET and len(present_correction_keys) >= 2:
            small = {}
            for k in sorted(present_correction_keys | set(ID_KEYS) | set(PAGE_KEYS)):
                v = node.get(k)
                if isinstance(v, (str, int, float, bool)) or v is None:
                    small[k] = v
            corrections[work].append({"file": file_path, "pointer": pointer, "record": small})

        for key_name, value in node.items():
            walk_json(value, file_path, work, f"{pointer}/{key_name}", pages, corrections, key_counter)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            walk_json(value, file_path, inherited_work, f"{pointer}/{i}", pages, corrections, key_counter)


def candidate_score(item: dict[str, Any]) -> tuple[int, int, int]:
    field_rank = {
        "final_text": 100, "corrected_text": 95, "repaired_text": 94,
        "restored_text": 93, "text_clean": 90, "reading_text": 88,
        "clean_text": 87, "transcription": 85, "transcript": 84,
        "page_text": 82, "full_text": 80, "text": 50, "content": 40, "text_raw": 10,
    }
    return (
        field_rank.get(item.get("field"), 0),
        -int(item.get("placeholder_count", 0)),
        len(item.get("text", "")),
    )


def choose_pages(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Deduplicate candidates per page. Prefer cleaned/final fields and fewer placeholders.
    by_page: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        by_page[int(item.get("page", 0))].append(item)
    chosen = []
    for page in sorted(by_page):
        candidates = sorted(by_page[page], key=candidate_score, reverse=True)
        chosen.append(candidates[0])
    return chosen


def copy_relevant(path: Path, text: str) -> None:
    rel = path.relative_to(ROOT)
    destination = FILES_OUT / rel
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(text, encoding="utf-8")


def main() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    FILES_OUT.mkdir(parents=True, exist_ok=True)

    inventory = []
    pages: dict[str, list[dict[str, Any]]] = defaultdict(list)
    corrections: dict[str, list[dict[str, Any]]] = defaultdict(list)
    key_counter: Counter = Counter()
    copied = []

    for path in sorted(set(iter_text_files())):
        text = read_text(path)
        if text is None:
            inventory.append({"path": path.relative_to(ROOT).as_posix(), "skipped": True, "size": path.stat().st_size})
            continue
        rel = path.relative_to(ROOT).as_posix()
        ids = sorted({m.group(1) for m in WORK_ID_RE.finditer(text)} & VISIBLE_SET)
        relevant = bool(RELEVANT_RE.search(text))
        inventory.append({
            "path": rel,
            "size": len(text.encode("utf-8")),
            "visible_ids": ids,
            "relevant": relevant,
        })
        if relevant and len(text.encode("utf-8")) <= 20 * 1024 * 1024:
            copy_relevant(path, text)
            copied.append(rel)
        if path.suffix.lower() in {".json", ".jsonl"}:
            if path.suffix.lower() == ".jsonl":
                for line_no, line in enumerate(text.splitlines(), 1):
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    walk_json(data, rel, None, f"line:{line_no}", pages, corrections, key_counter)
            else:
                try:
                    data = json.loads(text)
                except json.JSONDecodeError:
                    continue
                walk_json(data, rel, None, "", pages, corrections, key_counter)

    selected = {}
    summary = {}
    for wid in VISIBLE_IDS:
        chosen = choose_pages(pages.get(wid, []))
        selected[wid] = chosen
        all_text = "\n".join(item["text"] for item in chosen)
        summary[wid] = {
            "candidate_records": len(pages.get(wid, [])),
            "selected_pages": len(chosen),
            "selected_chars": len(all_text),
            "placeholder_count": len(PLACEHOLDER_RE.findall(all_text)),
            "correction_records": len(corrections.get(wid, [])),
            "source_files": sorted({item["file"] for item in chosen}),
            "correction_files": sorted({item["file"] for item in corrections.get(wid, [])}),
        }

    (OUT / "inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "key_frequency.json").write_text(json.dumps(key_counter.most_common(), ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "page_candidates.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "selected_pages.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "correction_candidates.json").write_text(json.dumps(corrections, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "copied_files.txt").write_text("\n".join(copied), encoding="utf-8")

    lines = ["33件碑帖释文数据审计", "=" * 40]
    for wid in VISIBLE_IDS:
        s = summary[wid]
        lines.append(
            f"{wid}: 选中{s['selected_pages']}页，{s['selected_chars']}字，"
            f"空缺/待考标记{s['placeholder_count']}处，修复候选{s['correction_records']}条"
        )
        if s["source_files"]:
            lines.append("  释文来源：" + ", ".join(s["source_files"]))
        if s["correction_files"]:
            lines.append("  修复来源：" + ", ".join(s["correction_files"]))
    (OUT / "summary.txt").write_text("\n".join(lines), encoding="utf-8")

    shutil.make_archive("inscription_audit_bundle", "zip", OUT)
    print("\n".join(lines))
    print(f"\nCreated: {ROOT / 'inscription_audit_bundle.zip'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
