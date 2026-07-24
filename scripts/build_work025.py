#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build 025《集王羲之书三藏圣教序》 from the confirmed audit稿.

Rules:
- data/work025_full_text.txt is the only base transcription.
- The single '?' is the only problem position handled by columns 3 and 4.
- Existing model rows are only split and audited; no bbox is invented.
"""
from __future__ import annotations

import difflib
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "025"
TITLE = "集王羲之书三藏圣教序"
FOLDER = "025_集王羲之书三藏圣教序"
VERSION = "20260724_shengjiaoxu_v1"
IMAGE_ROOT = f"assets/page_images/{FOLDER}/images"
MODEL_PATH = ROOT / "data/model_boxes/glyph_model_border_021_025.json"
TEXT_PATH = ROOT / "data/work025_full_text.txt"

PUNCT = set(" \t\r\n，。；：！？、,.!;:（）()【】[]《》〈〉“”‘’『』「」—－…·")
CANON = str.maketrans({
    "羲":"羲", "晉":"晋", "經":"经", "聖":"圣", "敎":"教", "躅":"躅",
    "軌":"轨", "眾":"众", "諸":"诸", "玄":"玄", "總":"总", "將":"将",
    "譯":"译", "於":"于", "爲":"为", "為":"为", "無":"无", "與":"与",
    "長":"长", "門":"门", "觀":"观", "實":"实", "體":"体", "廣":"广",
    "顯":"显", "極":"极", "奧":"奥", "義":"义", "華":"华", "國":"国",
})


def dump(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


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


def clean_char(ch: str) -> str:
    return str(ch or "")[:1].translate(CANON)


def normalize_text(text: str, keep_question: bool = False) -> str:
    lines = []
    for line in str(text or "").splitlines():
        if re.fullmatch(r"\s*【[^】]+】\s*", line):
            continue
        lines.append(line)
    out = []
    for ch in "\n".join(lines):
        if ch == "?" and keep_question:
            out.append(ch)
        elif ch not in PUNCT and ch != "?":
            out.append(clean_char(ch))
    return "".join(out)


def extract_records(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "rows", "items", "data", "glyphs"):
            if isinstance(data.get(key), list):
                return data[key]
        values = [value for value in data.values() if isinstance(value, list)]
        if values:
            return max(values, key=len)
    raise RuntimeError("Unrecognized model shard structure")


def num(row: dict, *keys, default=0.0):
    for key in keys:
        value = row.get(key)
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            pass
    return float(default)


def belongs(row: dict) -> bool:
    if str(row.get("work_id") or "").zfill(3) == WORK_ID:
        return True
    if int(num(row, "work_index", default=-1)) == 25:
        return True
    return any("025" in str(row.get(key) or "") for key in ("virtual_id", "work", "folder", "work_folder", "source_folder", "work_title"))


def row_char(row: dict) -> str:
    return str(row.get("char") or row.get("text") or row.get("recognized_char") or row.get("label") or "")[:1]


def normalize_rows(raw_rows, pages):
    groups = defaultdict(list)
    image_by_page = {int(page.get("page") or page.get("canvas_index") or index + 1): page.get("image", "") for index, page in enumerate(pages)}
    label_by_page = {int(page.get("page") or page.get("canvas_index") or index + 1): page.get("label", chinese_number(index + 1)) for index, page in enumerate(pages)}
    for raw in raw_rows:
        if not isinstance(raw, dict) or not belongs(raw):
            continue
        page = int(num(raw, "canvas_index", "page", "page_no", "page_number", default=0))
        if page <= 0:
            continue
        bbox = raw.get("bbox") if isinstance(raw.get("bbox"), (list, tuple)) else []
        x = num(raw, "x", "bbox_x", default=bbox[0] if len(bbox) > 0 else 0)
        y = num(raw, "y", "bbox_y", default=bbox[1] if len(bbox) > 1 else 0)
        w = num(raw, "w", "bbox_w", default=bbox[2] if len(bbox) > 2 else 0)
        h = num(raw, "h", "bbox_h", default=bbox[3] if len(bbox) > 3 else 0)
        if w <= 0 or h <= 0:
            continue
        order = int(num(raw, "order_in_page", "annotation_index", "order", default=len(groups[page]) + 1))
        char = row_char(raw)
        row = dict(raw)
        row.update({
            "glyph_id": str(raw.get("glyph_id") or f"{FOLDER}_p{page:04d}_c{order:03d}"),
            "char": char,
            "text": char,
            "work_id": WORK_ID,
            "work_index": 25,
            "work_title": TITLE,
            "canvas_index": page,
            "canvas_label": label_by_page.get(page, chinese_number(page)),
            "order_in_page": order,
            "annotation_index": order,
            "x": x, "y": y, "w": w, "h": h,
            "bbox_x": x, "bbox_y": y, "bbox_w": w, "bbox_h": h,
            "bbox": [x, y, w, h],
            "bbox_xywh": [x, y, w, h],
            "bbox_source": str(raw.get("bbox_source") or raw.get("source") or "model_border_refined"),
            "source": str(raw.get("source") or raw.get("bbox_source") or "model_border_refined"),
            "local_image": image_by_page.get(page, f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg"),
        })
        groups[page].append(row)
    for page, rows in groups.items():
        rows.sort(key=lambda row: (int(row.get("order_in_page", 0)), float(row.get("x", 0)), float(row.get("y", 0))))
        for index, row in enumerate(rows, 1):
            row["order_in_page"] = index
            row["annotation_index"] = index
    return groups


def find_problem_row(flat_rows, full_text):
    model_seq = "".join(clean_char(row_char(row)) for row in flat_rows)
    prefix = normalize_text("盖真如圣教者，诸法之玄宗，众经之轨")
    suffix = normalize_text("也。综括宏远，奥旨遐深")
    direct = model_seq.find(prefix)
    method = "anchor-exact"
    score = 1.0
    if direct >= 0:
        target = direct + len(prefix)
        if model_seq[target + 1:target + 1 + len(suffix)] != suffix:
            direct = -1
    if direct < 0:
        method = "anchor-fuzzy"
        expected = prefix + "躅" + suffix
        window_len = len(expected)
        best = (-1.0, None)
        for start in range(max(0, len(model_seq) - window_len + 1)):
            window = model_seq[start:start + window_len]
            ratio = difflib.SequenceMatcher(None, expected, window, autojunk=False).ratio()
            if ratio > best[0]:
                best = (ratio, start)
        score, direct = best
        if direct is None or score < 0.72:
            return None, method, float(score or 0), model_seq
        target = direct + len(prefix)
    if target < 0 or target >= len(flat_rows):
        return None, method, score, model_seq
    return flat_rows[target], method, score, model_seq


def build_case(location_row, method, score):
    location = None
    if location_row:
        page = int(location_row["canvas_index"])
        location = {
            "page": page,
            "glyph_id": location_row["glyph_id"],
            "canvas": {
                "w": int(num(location_row, "canvas_width", default=1474)),
                "h": int(num(location_row, "canvas_height", default=2226)),
            },
            "bbox": {
                "x": location_row["x"], "y": location_row["y"],
                "w": location_row["w"], "h": location_row["h"],
            },
            "image": location_row.get("local_image") or f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg",
            "bbox_source": location_row.get("bbox_source", "model_border_refined"),
            "match_method": method,
            "match_score": round(float(score), 6),
            "target_char_in_model": row_char(location_row),
        }
    original = "盖真如圣教者，诸法之玄宗，众经之轨?也。"
    corrected = "盖真如圣教者，诸法之玄宗，众经之轨〔躅〕也。"
    return {
        "id": "01",
        "n": "残损碑文恢复",
        "t": "众经之轨躅也",
        "o": original,
        "c": corrected,
        "page": location["page"] if location else "—",
        "category": "残损碑文恢复",
        "title": "众经之轨躅也",
        "original": original,
        "corrected": corrected,
        "candidate": "躅",
        "mode": "documentary",
        "confidence": "高",
        "analysis": [
            "“轨躅”是固定词语，表示可遵循的行迹、法度或准则。",
            "本句先称真如圣教为“诸法之玄宗”，再称其为“众经之轨躅”，两部分结构与语义相承。",
            "《述三藏圣记》的可靠录文在对应位置保存“众经之轨躅也”，一个“躅”正好对应底稿中的一个问号疑难位置。",
        ],
        "reference": "《述三藏圣记》相关可靠录文",
        "problem_count": 1,
        "candidate_count": 1,
        "remaining_problem_count": 0,
        "highlight_patterns": [original],
        "locations": [location] if location else [],
    }


def write_page_files(groups, page_count):
    root = ROOT / "data/glyph_boxes/iiif/025"
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True, exist_ok=True)
    for page in range(1, page_count + 1):
        dump(root / f"page_{page:04d}.json", groups.get(page, []))


def update_page_index(groups):
    path = ROOT / "data/page_images_index.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    work = data["works"][WORK_ID]
    work["title"] = TITLE
    for index, page in enumerate(work.get("pages", []), 1):
        page_no = int(page.get("page") or page.get("canvas_index") or index)
        chars = [row_char(row) for row in groups.get(page_no, [])]
        page["text_clean"] = "".join(chars)
        page["text_raw"] = "\n".join(chars)
        page["char_count"] = len(chars)
        page["has_char_boxes"] = bool(chars)
    dump(path, data)
    return work


def update_catalog():
    path = ROOT / "data/beitie_catalog.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    item = next(item for item in data if str(item.get("id")) == WORK_ID)
    item.update({
        "dynasty": "唐咸亨三年十二月八日（672）",
        "creator": "李世民制序，李治述记，怀仁集王羲之书",
        "status": "完整样板",
        "subtitle": "完整释文、47页逐页真实坐标与1例疑难字释读已接入。",
        "year": "672",
    })
    dump(path, data)


def update_header():
    path = ROOT / "data/beitie_header_info.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data[WORK_ID] = {
        "source_file": "集王羲之书三藏圣教序.txt",
        "title": TITLE,
        "basic": {
            "首题": "大唐三藏圣教序",
            "其他题名": "怀仁集王羲之书圣教序；集王圣教序；七佛圣教序；唐集右军圣教序并记",
            "责任者": "李世民制序，李治述记，弘福寺沙门怀仁集王羲之书；于志宁、来济、许敬宗、薛元超、李义府奉敕润色；诸葛神力勒石，朱静藏镌字",
            "书体": "行书",
            "版本": "北宋后期拓本",
            "数量": "21开",
            "尺寸": "册高38.3厘米，宽25.1厘米；碑文十八开，帖芯高27.4厘米，宽15厘米",
            "铭文行款": "三十行，行八十余字不等",
            "刻立年代": "唐咸亨三年十二月八日（672）",
            "刻立地点": "长安修德坊弘福寺",
            "馆藏": "上海图书馆",
            "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年",
            "版本说明": "本册为北宋后期拓本，装裱二十一开，其中碑文十八开；数字化图像共四十七页，数字化页数与装裱开数属于不同计数口径。",
            "镌刻特征": "碑文由怀仁从王羲之传世书迹中集字而成，正文包括唐太宗《大唐三藏圣教序》、敕答谢启、唐高宗《述三藏圣记》及答书、玄奘译《般若波罗蜜多心经》和碑末建立、勒石、镌字题记。",
        },
    }
    dump(path, data)


def write_scripts():
    source = (ROOT / "js/work-024.js").read_text(encoding="utf-8")
    replacements = [
        ("024《张从申书李玄靖碑》", "025《集王羲之书三藏圣教序》"),
        ('workId !== "024"', 'workId !== "025"'),
        ("__WORK_024_XUANJING__", "__WORK_025_SHENGJIAOXU__"),
        ('const TITLE = "张从申书李玄靖碑";', 'const TITLE = "集王羲之书三藏圣教序";'),
        ('const VERSION = "20260724_xuanjing_v2";', f'const VERSION = "{VERSION}";'),
        ("work024_full_text.txt", "work025_full_text.txt"),
        ("work024_damage_cases.json", "work025_damage_cases.json"),
        ("024_张从申书李玄靖碑", FOLDER),
        ("本栏目只处理用户底稿中原有的二十三个方框。候选字依据可核验录文逐例对校，方框外文字保持底稿原样；栏目三与栏目四读取同一份十九例案例数据。", "本栏目只处理用户底稿中明确标出的一个问号疑难字。候选字依据固定词语与可靠录文对校，问号之外的底稿文字保持原样；栏目三与栏目四读取同一份一例案例数据。"),
        ("work-024-cases-ready", "work-025-cases-ready"),
        ("work024-part-title", "work025-part-title"),
        ("dataset.work024Dedicated", "dataset.work025Dedicated"),
        ("work024-xuanjing-style", "work025-shengjiaoxu-style"),
        ("__WORK_024_CROWDSOURCE_READY__", "__WORK_025_CROWDSOURCE_READY__"),
        ("work-024-crowdsource-ready", "work-025-crowdsource-ready"),
        ("__WORK_024_CONTENT_READY__", "__WORK_025_CONTENT_READY__"),
        ("__WORK_024_STABLE_READY__", "__WORK_025_STABLE_READY__"),
        ("work-024-content-ready", "work-025-content-ready"),
        ("work-024-stable-ready", "work-025-stable-ready"),
        ("024案例数据为空", "025案例数据为空"),
        ("[work-024]", "[work-025]"),
        ("024碑文数据读取失败", "025碑文数据读取失败"),
        ("024案例数据读取失败", "025案例数据读取失败"),
    ]
    for old, new in replacements:
        source = source.replace(old, new)
    source = source.replace(
        '.map((part) => /^文曰[:：]?/.test(part)',
        '.map((part) => /^【[^】]+】$/.test(part)'
    )
    source = source.replace('.work025-part-title{', '.work025-part-title{')
    (ROOT / "js/work-025.js").write_text(source, encoding="utf-8")

    adapter = (ROOT / "js/work-024-coordinate-adapter.js").read_text(encoding="utf-8")
    for old, new in [
        ("024《张从申书李玄靖碑》", "025《集王羲之书三藏圣教序》"),
        ('workId!=="024"', 'workId!=="025"'),
        ("__WORK_024_COORDINATE_ADAPTER__", "__WORK_025_COORDINATE_ADAPTER__"),
        ('CACHE_TAG="20260724_xuanjing_v1"', f'CACHE_TAG="{VERSION}"'),
        ('ROOT="data/glyph_boxes/iiif/024"', 'ROOT="data/glyph_boxes/iiif/025"'),
        ('work_id:"024"', 'work_id:"025"'),
        ('`024_${pageNo}_${index+1}`', '`025_${pageNo}_${index+1}`'),
        ('new Error("024坐标读取失败")', 'new Error("025坐标读取失败")'),
        ('[work-024-coordinate-adapter]', '[work-025-coordinate-adapter]'),
        ('normalized!=="024"', 'normalized!=="025"'),
        ('window.WORK_024_COORDINATES', 'window.WORK_025_COORDINATES'),
        ('work-024-coordinate-adapter-ready', 'work-025-coordinate-adapter-ready'),
    ]:
        adapter = adapter.replace(old, new)
    (ROOT / "js/work-025-coordinate-adapter.js").write_text(adapter, encoding="utf-8")


def patch_routes():
    path = ROOT / "js/damage_ai_reading.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("__DAMAGE_AI_READING_ROUTER_V63__", "__DAMAGE_AI_READING_ROUTER_V64__", 1)
    text = text.replace(
        "window.__DAMAGE_AI_READING_ROUTER_V64__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V62__=true;",
        "window.__DAMAGE_AI_READING_ROUTER_V64__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V63__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V62__=true;",
        1,
    )
    marker = '''    "024":[\n      {src:"js/work-024-coordinate-adapter.js?v=20260724_xuanjing_v1",key:"w024c",ready:()=>Boolean(window.__WORK_024_COORDINATE_ADAPTER__)},\n      {src:"js/work-024.js?v=20260724_xuanjing_v1",key:"w024",ready:()=>Boolean(window.__WORK_024_STABLE_READY__&&window.__WORK_024_CROWDSOURCE_READY__)}\n    ]\n'''
    addition = marker[:-1] + f''',\n    "025":[\n      {{src:"js/work-025-coordinate-adapter.js?v={VERSION}",key:"w025c",ready:()=>Boolean(window.__WORK_025_COORDINATE_ADAPTER__)}},\n      {{src:"js/work-025.js?v={VERSION}",key:"w025",ready:()=>Boolean(window.__WORK_025_STABLE_READY__&&window.__WORK_025_CROWDSOURCE_READY__)}}\n    ]\n'''
    if '"025":[' not in text:
        if marker not in text:
            raise RuntimeError("024 route block not found")
        text = text.replace(marker, addition, 1)
    text = text.replace('"024":"张从申书李玄靖碑"};', '"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序"};')
    for old in [
        '["007","010","011","013","014","015","016","017","018","020","022","023","024"]',
        '["003","004","005","006","007","010","011","013","014","015","016","017","018","020","022","023","024"]',
    ]:
        text = text.replace(old, old[:-1] + ',"025"]')
    path.write_text(text, encoding="utf-8")

    path = ROOT / "js/detail_info_patch.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("__DETAIL_INFO_STABLE_ENTRY_V22__", "__DETAIL_INFO_STABLE_ENTRY_V23__", 1)
    text = text.replace(
        "window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V21__=true;",
        "window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V22__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V21__=true;",
        1,
    )
    text = re.sub(r'const dataUrl="data/beitie_header_info\.json\?v=[^"]+";', f'const dataUrl="data/beitie_header_info.json?v={VERSION}";', text)
    old_menu = '''  function applyImmediateWorkMenu(){\n    if(workId!=="024")return;\n    const apply=()=>{\n      const side=document.querySelector(".side");\n      if(!side)return;\n      const workName=side.querySelector(".work-name");\n      const links=side.querySelectorAll("a");\n      if(workName)workName.textContent="张从申书李玄靖碑";\n      const labels=["一、碑帖浏览","二、碑文释文","三、碑文残损与AI释读","四、众智释读"];\n      links.forEach((link,index)=>{if(labels[index])link.textContent=labels[index];});\n      document.title="张从申书李玄靖碑 · 碑帖智能读析平台";\n    };\n    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});\n    else apply();\n  }'''
    new_menu = '''  function applyImmediateWorkMenu(){\n    const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序"};\n    const name=names[workId];if(!name)return;\n    const apply=()=>{\n      const side=document.querySelector(".side");\n      if(!side)return;\n      const workName=side.querySelector(".work-name");\n      const links=side.querySelectorAll("a");\n      if(workName)workName.textContent=name;\n      const labels=["一、碑帖浏览","二、碑文释文","三、碑文残损与AI释读","四、众智释读"];\n      links.forEach((link,index)=>{if(labels[index])link.textContent=labels[index];});\n      document.title=`${name} · 碑帖智能读析平台`;\n    };\n    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});\n    else apply();\n  }'''
    if old_menu not in text:
        raise RuntimeError("immediate menu block not found")
    text = text.replace(old_menu, new_menu, 1)
    text = text.replace('["007","010","011","013","014","015","016","017","018","020","022","023","024"]', '["007","010","011","013","014","015","016","017","018","020","022","023","024","025"]')
    text = text.replace("window.__DAMAGE_AI_READING_ROUTER_V62__=true;", "window.__DAMAGE_AI_READING_ROUTER_V62__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V63__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V64__=true;", 1)
    text = re.sub(r'script\.src="js/damage_ai_reading\.js\?v=[^"]+";', f'script.src="js/damage_ai_reading.js?v={VERSION}";', text)
    path.write_text(text, encoding="utf-8")

    path = ROOT / "detail.html"
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'js/detail_info_patch\.js\?v=[^"<]+', f'js/detail_info_patch.js?v={VERSION}', text)
    text = re.sub(r'js/damage_ai_reading\.js\?v=[^"<]+', f'js/damage_ai_reading.js?v={VERSION}', text)
    path.write_text(text, encoding="utf-8")


def main():
    full_text = TEXT_PATH.read_text(encoding="utf-8")
    if full_text.count("?") != 1 or full_text.count("□") != 0:
        raise RuntimeError("Confirmed work025 problem count changed")
    page_index = json.loads((ROOT / "data/page_images_index.json").read_text(encoding="utf-8"))
    pages = page_index["works"][WORK_ID]["pages"]
    records = extract_records(json.loads(MODEL_PATH.read_text(encoding="utf-8")))
    groups = normalize_rows(records, pages)
    flat_rows = [row for page in sorted(groups) for row in groups[page]]
    problem_row, method, score, model_seq = find_problem_row(flat_rows, full_text)
    case = build_case(problem_row, method, score)

    write_page_files(groups, len(pages))
    update_page_index(groups)
    update_catalog()
    update_header()
    dump(ROOT / "data/work025_damage_cases.json", [case])
    write_scripts()
    patch_routes()

    user_seq = normalize_text(full_text).replace("?", "躅")
    ratio = difflib.SequenceMatcher(None, user_seq, model_seq, autojunk=False).ratio() if model_seq else 0.0
    coordinate_pages = sorted(page for page, rows in groups.items() if rows)
    only_image_pages = [page for page in range(1, len(pages) + 1) if page not in coordinate_pages]
    report = {
        "work_id": WORK_ID,
        "title": TITLE,
        "digital_pages": len(pages),
        "binding_openings": 21,
        "model_rows": len(flat_rows),
        "model_square_count": sum(1 for row in flat_rows if row_char(row) == "□"),
        "base_text_square_count": full_text.count("□"),
        "base_text_question_count": full_text.count("?"),
        "comparable_text_length": len(user_seq),
        "model_sequence_length": len(model_seq),
        "sequence_similarity": round(ratio, 6),
        "pages_with_coordinates": coordinate_pages,
        "coordinate_page_range": [min(coordinate_pages), max(coordinate_pages)] if coordinate_pages else [],
        "only_original_image_pages": only_image_pages,
        "case_count": 1,
        "candidate_count": 1,
        "remaining_problem_count": 0,
        "located_case_count": 1 if problem_row else 0,
        "unlocated_cases": [] if problem_row else ["01"],
        "case_locations": [{
            "id": "01",
            "page": case["page"],
            "locations": case["locations"],
            "match_method": method,
            "match_score": round(float(score), 6),
        }],
        "column_four": {
            "uses_same_cases_as_column_three": True,
            "case_count": 1,
            "standard_fields_present": all(key in case for key in ("n", "t", "o", "c", "category", "title", "original", "corrected", "analysis", "locations")),
        },
        "base_text_policy": "Only the confirmed '?' problem position receives a candidate; all other supplied characters remain unchanged.",
    }
    dump(ROOT / "data/work025_coordinate_report.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
