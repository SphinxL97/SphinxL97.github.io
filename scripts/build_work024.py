#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the dedicated 024《张从申书李玄靖碑》 four-section data.

The supplied transcription is the sole base text.  External public-domain
transcriptions are used only to propose characters at the 23 existing □
positions; no non-square character in the supplied base text is rewritten.
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "024"
TITLE = "张从申书李玄靖碑"
FOLDER = "024_张从申书李玄靖碑"
VERSION = "20260724_xuanjing_v1"
IMAGE_ROOT = f"assets/page_images/{FOLDER}/images"
SOURCE_URL = "https://zh.wikisource.org/zh-hant/茅山紫陽觀元靜先生碑"

FULL_TEXT = """唐茅山紫陽觀玄静先生碑并序。祕書郎河東栁識撰，大理司直吴郡張從申書。常陽□□□。

道门華陽，亦儒門洙泗，盖玄化振扵此也。白日登昇，有西漢茅氏兄弟；隱景遁化，有東晉許氏一門。襲眀冲用，以闡道風，有梁貞白先生、唐玄静先生。

開元中，玄宗禮請尊師而問理化。對曰：道徳经，君王師也。昔漢文帝行其言，仁夀天下。次問金鼎。對曰：道徳公也，輕舉公中私也，時現其私。聖人存教若求生，侚欲則似繫風。上悅，因加玄静之稱。無何，固以疾辞，東還句曲。

先生諱含光，夲姓弘，則大諱弘□為李氏。考孝威，州里号貞隱先生，家夲醇儒，晉陵人也。夫性與道妙，則真有運無。古之學者，離有淂有，不外□馳景，而内觀馳心；不逺望化金，而近思化欲。今之學者，多見及是。若乃行扵真理，窅然觀妙，先示正性，□眀宗元，則玄静其人也。

年十三，辞家奉道。端視淸受，慈向蠢類，闇室之中，如對君親。時人見之，情性皆斂。幼工篆□，或稱過父，一聞此議，终身不書。所撰仙學傳記，□遺俻載。又論三玄異同，着真經及夲草音義，而皆精詳祛感，窮理扵學，如鍾蕴聲。

其浚師事華盖峰司馬君，雲篆寳書，傾囊傳授。既而目之曰：真玉清之客。抱虚无而行功者，与道不窮；託幽阜而㓕□者，扵徳□淺。承之自逺，冝且枚人。扵是引浚學昇堂，禀玄訓也。

先生元氣不散，瑶圖虚暎，逹靈已久，晦曜為常。動非用開，静非默閇。當吹萬之會，若淂一之初。應跡可名，常道不可名也。羣蒙求我，□勞言說。孕育至化，虗融物心。心一變至扵學，學一變至扵道，同□氣自来，得之不見。所以摳衣而進，無有逺迩，仰範元和，茂姿全性者，若秋芳之依層巘，夏潦之會通川也。

先生忘情扵身，而慈扵人，禎祥屢應，視同衆象。士庶諮詢，色□其意。常令章壇閇院，醮火□薪，精微誠敬，率皆此類。曩者天書继至，務□尊崇，及公卿祈請，信無虚月。年使玄門之中，轉見真檏；持慈俭之寳，歸義皇之風，至矣哉，我師敎也。

大□四年冬十一月，頋謂入室弟子道土□景昭、孟湛然曰：吾將順化。神氣恬然，若□忘長□，時年八十七。靈雲降宝，□蕳如生。㩀真經，斯迺秉化自由、仙階深妙者也。門人等以為：醴泉之味，飲者始知；我師之道，學久方見。□叙真宗，以示扵浚。忝曾逰道，敢述玄風。

文曰：古有强名，元精希夷。黃帝遺之，先生得之。繼心而注，与一相随。真性所容，太无同規。日行仙路，不語到時。人言萬靈，我見常姿。玄宗仰止，徴就亰師。紫極□貴，白雲不知。遐方浚學，来注怡怡。空有多门，真精自持。□順而去，人焉能窺。玄科祕訣，夲有冥期。
"""

CASE_SPECS = [
    dict(title="常阳子篆额", original="常陽□□□。", corrected="常陽〔子〕〔篆〕〔額〕。", candidate="子、篆、額", analysis=["题署处原有三个连续缺字。", "作品责任信息明确记载李阳冰篆额；‘常阳子’为李阳冰题署中使用的称号，补作‘常阳子篆额’与题署结构相合。"]),
    dict(title="避讳改姓", original="先生諱含光，夲姓弘，則大諱弘□為李氏。", corrected="先生諱含光，夲姓弘，則大諱弘〔改〕為李氏。", candidate="改", analysis=["此句说明李含光本姓弘，因避讳而改姓李。", "《全唐文》系统录文对应作‘则天讳宏，改为李氏’，方框位置可据此补‘改’。"]),
    dict(title="不外观驰景", original="不外□馳景，而内觀馳心", corrected="不外〔觀〕馳景，而内觀馳心", candidate="觀", analysis=["上下句以‘外观’与‘内观’相对。", "可靠录文作‘不外观驰景，而内观驰心’，故补‘观’。"]),
    dict(title="发明宗元", original="先示正性，□眀宗元", corrected="先示正性，〔發〕眀宗元", candidate="發", analysis=["‘发明’在古文中有阐发、显明之义。", "可靠录文作‘先示正性，发明宗元’，方框应为‘发’。"]),
    dict(title="幼工篆隶", original="幼工篆□，或稱過父", corrected="幼工篆〔隸〕，或稱過父", candidate="隸", analysis=["‘篆隶’为并举书体。", "可靠录文作‘幼工篆隶，或称过父’，故补‘隶’。"]),
    dict(title="阙遗备载", original="所撰仙學傳記，□遺俻載。", corrected="所撰仙學傳記，〔闕〕遺俻載。", candidate="闕", analysis=["‘阙遗备载’意为将缺佚材料尽量收载。", "可靠录文作‘所撰仙学传记，阙遗备载’，故补‘阙’。"]),
    dict(title="灭迹与亦浅", original="託幽阜而㓕□者，扵徳□淺。", corrected="託幽阜而㓕〔跡〕者，扵徳〔亦〕淺。", candidate="跡、亦", analysis=["‘灭迹’指隐居遁世，和前句‘行功’形成不同修道取向。", "可靠录文作‘托幽阜而灭迹者，于德亦浅’，两处分别补‘迹’、‘亦’。"]),
    dict(title="岂劳言说", original="羣蒙求我，□勞言說。", corrected="羣蒙求我，〔豈〕勞言說。", candidate="豈", analysis=["本句是反问语气。", "可靠录文作‘群蒙求我，岂劳言说’，故补‘岂’。"]),
    dict(title="同淑气自来", original="同□氣自来，得之不見。", corrected="同〔淑〕氣自来，得之不見。", candidate="淑", analysis=["‘淑气’指和善清淑之气。", "可靠录文作‘同淑气自来，得之不见’，故补‘淑’。"]),
    dict(title="色授其意", original="士庶諮詢，色□其意。", corrected="士庶諮詢，色〔授〕其意。", candidate="授", analysis=["‘色授’表示以神色传达意旨。", "可靠录文作‘士庶咨询，色授其意’，故补‘授’。"]),
    dict(title="醮火择薪", original="醮火□薪，精微誠敬", corrected="醮火〔擇〕薪，精微誠敬", candidate="擇", analysis=["斋醮用火与选薪均属仪式细节。", "可靠录文作‘醮火择薪，精微诚敬’，故补‘择’。"]),
    dict(title="务欲尊崇", original="曩者天書继至，務□尊崇", corrected="曩者天書继至，務〔欲〕尊崇", candidate="欲", analysis=["‘务欲’为连用，表示力求、务求。", "可靠录文对应作‘曩者天书继至，务欲尊崇’，故补‘欲’。"]),
    dict(title="大历四年", original="大□四年冬十一月", corrected="大〔曆〕四年冬十一月", candidate="曆", analysis=["李含光卒于唐代宗大历四年。", "可靠录文明确作‘大历四年冬十一月’，故补‘历’。"]),
    dict(title="弟子韦景昭", original="入室弟子道土□景昭、孟湛然", corrected="入室弟子道土〔韋〕景昭、孟湛然", candidate="韋", analysis=["此处为入室弟子姓名。", "可靠录文作‘入室弟子韦景昭、孟湛然’，故补‘韦’。"]),
    dict(title="坐忘长往", original="神氣恬然，若□忘長□，時年八十七。", corrected="神氣恬然，若〔坐〕忘長〔往〕，時年八十七。", candidate="坐、往", analysis=["‘坐忘’是道家修炼语汇，‘长往’用于委婉表示逝世。", "可靠录文作‘神气恬然，若坐忘长往’，两处分别补‘坐’、‘往’。"]),
    dict(title="执简如生", original="靈雲降宝，□蕳如生。", corrected="靈雲降宝，〔執〕蕳如生。", candidate="執", analysis=["‘执简如生’描写逝后形貌如生。", "可靠录文作‘灵云降室，执简如生’；本任务只补原方框，保留底稿方框外的‘宝’与‘蕳’。"]),
    dict(title="愿叙真宗", original="□叙真宗，以示扵浚。", corrected="〔願〕叙真宗，以示扵浚。", candidate="願", analysis=["门人请求撰述师道，句首宜为愿请语气。", "可靠录文作‘愿叙真宗，以示于后’，本任务只补方框为‘愿’，不改写方框外底文。"]),
    dict(title="紫极徒贵", original="紫極□貴，白雲不知。", corrected="紫極〔徒〕貴，白雲不知。", candidate="徒", analysis=["‘徒贵’表示仅有尊贵名位而非真正可贵。", "可靠录文作‘紫极徒贵，白云不知’，故补‘徒’。"]),
    dict(title="委顺而去", original="□順而去，人焉能窺。", corrected="〔委〕順而去，人焉能窺。", candidate="委", analysis=["‘委顺’指顺应自然变化。", "可靠录文作‘委顺而去，人焉能窥’，故补‘委’。"]),
]

PUNCT = set(" \t\r\n，。；：！？、,.!?;:（）()【】[]《》〈〉“”‘’『』「」—－…·")
CANON_MAP = str.maketrans({
    "扵":"于", "於":"于", "眀":"明", "夲":"本", "栁":"柳", "從":"从", "張":"张", "觀":"观",
    "靜":"静", "玄":"玄", "閇":"闭", "淂":"得", "逺":"远", "氣":"气", "来":"来", "來":"来",
    "徳":"德", "㓕":"灭", "跡":"迹", "隸":"隶", "闕":"阙", "豈":"岂", "擇":"择", "曆":"历",
    "韋":"韦", "執":"执", "願":"愿", "額":"额", "篆":"篆", "發":"发", "蕳":"简", "俻":"备",
    "羣":"群", "門":"门", "學":"学", "書":"书", "經":"经", "稱":"称", "終":"终", "為":"为",
    "與":"与", "無":"无", "虗":"虚", "體":"体", "衆":"众", "寶":"宝", "寳":"宝", "斂":"敛",
    "敎":"教", "儉":"俭", "檏":"朴", "轉":"转", "靈":"灵", "階":"阶", "簡":"简", "叙":"叙",
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


def normalize_seq(text: str) -> str:
    return "".join(ch.translate(CANON_MAP) for ch in text if ch not in PUNCT)


def row_char(row: dict) -> str:
    return str(row.get("char") or row.get("text") or row.get("recognized_char") or row.get("label") or "")[:1]


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


def extract_records(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "rows", "items", "data", "glyphs"):
            if isinstance(data.get(key), list):
                return data[key]
        lists = [v for v in data.values() if isinstance(v, list)]
        if lists:
            return max(lists, key=len)
    raise RuntimeError("Unrecognized model shard structure")


def belongs(row: dict) -> bool:
    if int(num(row, "work_index", default=-1)) == 24:
        return True
    fields = [row.get(k) for k in ("work_id", "virtual_id", "work", "folder", "work_folder", "source_folder", "work_title")]
    return any(str(value or "").startswith("024") or "024_" in str(value or "") for value in fields)


def normalize_model_rows(raw_rows, page_index):
    groups = defaultdict(list)
    image_by_page = {int(p.get("page") or p.get("canvas_index") or i + 1): p.get("image", "") for i, p in enumerate(page_index)}
    label_by_page = {int(p.get("page") or p.get("canvas_index") or i + 1): p.get("label", chinese_number(i + 1)) for i, p in enumerate(page_index)}
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
            "work_index": 24,
            "work_title": TITLE,
            "canvas_index": page,
            "canvas_label": label_by_page.get(page, chinese_number(page)),
            "order_in_page": order,
            "annotation_index": order,
            "x": x, "y": y, "w": w, "h": h,
            "bbox_x": x, "bbox_y": y, "bbox_w": w, "bbox_h": h,
            "bbox": [x, y, w, h], "bbox_xywh": [x, y, w, h],
            "bbox_source": str(raw.get("bbox_source") or raw.get("source") or "model_border_refined"),
            "source": str(raw.get("source") or raw.get("bbox_source") or "model_border_refined"),
            "local_image": image_by_page.get(page, f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg"),
        })
        groups[page].append(row)
    for page, rows in groups.items():
        rows.sort(key=lambda r: (int(r.get("order_in_page", 0)), float(r.get("x", 0)), float(r.get("y", 0))))
        for index, row in enumerate(rows, 1):
            row["order_in_page"] = index
            row["annotation_index"] = index
            if not row.get("glyph_id"):
                row["glyph_id"] = f"{FOLDER}_p{page:04d}_c{index:03d}"
    return groups


def context_score(user_seq: str, model_seq: str, uidx: int, midx: int, radius=7) -> float:
    score = 0.0
    total = 0
    for delta in range(-radius, radius + 1):
        if delta == 0:
            continue
        ui = uidx + delta
        mi = midx + delta
        if ui < 0 or mi < 0 or ui >= len(user_seq) or mi >= len(model_seq):
            continue
        u, m = user_seq[ui], model_seq[mi]
        if u == "□" or m == "□":
            continue
        total += 1
        if u == m:
            score += 1
    return score / total if total else 0.0


def semiglobal_map(user_seq: str, model_seq: str):
    n, m = len(user_seq), len(model_seq)
    gap = -2
    prev = [0] * (m + 1)
    trace = [bytearray(m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        curr = [0] * (m + 1)
        curr[0] = i * gap
        trace[i][0] = 1
        u = user_seq[i - 1]
        for j in range(1, m + 1):
            v = model_seq[j - 1]
            if u == v:
                match = 6
            elif u == "□" and v == "□":
                match = 7
            elif u == "□":
                match = 1
            elif v == "□":
                match = 0
            else:
                match = -3
            diag = prev[j - 1] + match
            up = prev[j] + gap
            left = curr[j - 1] + gap
            best = max(diag, up, left)
            curr[j] = best
            trace[i][j] = 0 if best == diag else (1 if best == up else 2)
        prev = curr
    j = max(range(m + 1), key=lambda k: prev[k])
    i = n
    mapping = {}
    while i > 0 and j >= 0:
        move = trace[i][j]
        if move == 0 and j > 0:
            mapping[i - 1] = j - 1
            i -= 1
            j -= 1
        elif move == 1 or j == 0:
            i -= 1
        else:
            j -= 1
    return mapping


def locate_cases(cases, rows):
    user_seq = normalize_seq(FULL_TEXT)
    model_seq = "".join(normalize_seq(row_char(row)) for row in rows)
    user_square_positions = [i for i, ch in enumerate(user_seq) if ch == "□"]
    model_square_positions = [i for i, ch in enumerate(model_seq) if ch == "□"]
    target_ordinals = []
    cursor = 0
    for case in cases:
        anchor = normalize_seq(case["original"])
        at = user_seq.find(anchor, cursor)
        if at < 0:
            at = user_seq.find(anchor)
        if at < 0:
            raise RuntimeError(f"Cannot find case anchor: {case['original']}")
        first_box = anchor.find("□")
        target = at + first_box
        ordinal = sum(1 for pos in user_square_positions if pos < target)
        target_ordinals.append((target, ordinal))
        cursor = at + max(1, len(anchor))

    mapping_method = "semiglobal-alignment"
    target_model_indices = {}
    if len(model_square_positions) == len(user_square_positions):
        mapping_method = "exact-square-order"
        for target, ordinal in target_ordinals:
            target_model_indices[target] = model_square_positions[ordinal]
    elif len(model_square_positions) >= len(user_square_positions):
        best_offset, best_score = 0, -1.0
        for offset in range(len(model_square_positions) - len(user_square_positions) + 1):
            scores = []
            for upos, mpos in zip(user_square_positions, model_square_positions[offset:offset + len(user_square_positions)]):
                scores.append(context_score(user_seq, model_seq, upos, mpos))
            score = sum(scores) / len(scores) if scores else 0
            if score > best_score:
                best_offset, best_score = offset, score
        if best_score >= 0.35:
            mapping_method = f"square-order-window(offset={best_offset},score={best_score:.4f})"
            chosen = model_square_positions[best_offset:best_offset + len(user_square_positions)]
            for target, ordinal in target_ordinals:
                target_model_indices[target] = chosen[ordinal]
    if not target_model_indices:
        alignment = semiglobal_map(user_seq, model_seq)
        for target, _ordinal in target_ordinals:
            midx = alignment.get(target)
            if midx is not None:
                target_model_indices[target] = midx

    located = 0
    for case, (target, ordinal) in zip(cases, target_ordinals):
        midx = target_model_indices.get(target)
        location = None
        if midx is not None and 0 <= midx < len(rows):
            row = rows[midx]
            location = {
                "page": int(row["canvas_index"]),
                "glyph_id": row["glyph_id"],
                "canvas": {"w": int(num(row, "canvas_width", default=1474)), "h": int(num(row, "canvas_height", default=2226))},
                "bbox": {"x": row["x"], "y": row["y"], "w": row["w"], "h": row["h"]},
                "image": row.get("local_image") or f"{IMAGE_ROOT}/{int(row['canvas_index']):04d}_{chinese_number(int(row['canvas_index']))}.jpg",
                "bbox_source": row.get("bbox_source", "model_border_refined"),
                "match_method": mapping_method,
                "target_square_ordinal": ordinal + 1,
                "target_char_in_model": row_char(row),
            }
        case["locations"] = [location] if location else []
        case["page"] = location["page"] if location else "—"
        case["match_method"] = mapping_method
        if location:
            located += 1
    return {
        "user_sequence_length": len(user_seq),
        "model_sequence_length": len(model_seq),
        "user_square_count": len(user_square_positions),
        "model_square_count": len(model_square_positions),
        "mapping_method": mapping_method,
        "located_cases": located,
    }


def build_cases(groups):
    cases = []
    for i, spec in enumerate(CASE_SPECS, 1):
        square_count = spec["original"].count("□")
        candidate_count = len(re.findall(r"〔([^〕]+)〕", spec["corrected"]))
        cases.append({
            "id": f"{i:02d}",
            "category": "文献对校",
            "title": spec["title"],
            "original": spec["original"],
            "corrected": spec["corrected"],
            "candidate": spec["candidate"],
            "mode": "documentary",
            "confidence": "高",
            "analysis": spec["analysis"],
            "reference": SOURCE_URL,
            "square_count": square_count,
            "candidate_count": candidate_count,
            "remaining_square_count": 0,
            "highlight_patterns": [spec["original"]],
            "locate_anchor": spec["original"],
            "n": "文献对校",
            "t": spec["title"],
            "o": spec["original"],
            "c": spec["corrected"],
            "restoration_policy": "all_existing_square_positions_filled",
        })
    flat_rows = [row for page in sorted(groups) for row in groups[page]]
    mapping = locate_cases(cases, flat_rows)
    return cases, mapping


def update_catalog():
    path = ROOT / "data/beitie_catalog.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    item = next(x for x in data if str(x.get("id")) == WORK_ID)
    item.update({
        "title": TITLE,
        "dynasty": "唐大历七年（772）",
        "script": "楷书",
        "creator": "柳识撰，张从申书，李阳冰篆额",
        "status": "完整样板",
        "subtitle": "完整释文、37页逐页真实坐标与19例残损释读已接入。",
        "year": "772",
    })
    dump(path, data)


def update_header():
    path = ROOT / "data/beitie_header_info.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data[WORK_ID] = {
        "source_file": "张从申书李玄靖碑.txt",
        "title": TITLE,
        "basic": {
            "首题": "唐茅山紫陽觀玄静先生碑并序",
            "其他题名": "茅山紫阳观玄静先生碑；李玄静碑；玄静先生碑",
            "责任者": "柳识撰，张从申书，李阳冰篆额",
            "书体": "楷书；篆额",
            "版本": "宋拓本",
            "数量": "共十六开半",
            "尺寸": "册高38.7厘米，宽24.8厘米；帖芯高27厘米，宽15.6厘米",
            "刻立年代": "唐大历七年（772）",
            "刻立地点": "江苏句容玉晨观",
            "馆藏": "上海图书馆",
            "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第一辑，上海图书馆，上海古籍出版社，2006年",
            "版本说明": "本册为宋拓本，共十六开半；数字化图像共37页，装裱数量与数字化页数属于不同计数口径。",
            "镌刻特征": "柳识撰文、张从申书、李阳冰篆额，后世并称‘三绝’。碑文叙玄静先生李含光的家世、受玄宗礼请、师承司马承祯、著述教化及大历四年顺化等事。",
        },
    }
    dump(path, data)


def update_page_index(groups):
    path = ROOT / "data/page_images_index.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    work = data["works"][WORK_ID]
    work["title"] = TITLE
    for i, page in enumerate(work.get("pages", []), 1):
        page_no = int(page.get("page") or page.get("canvas_index") or i)
        rows = groups.get(page_no, [])
        chars = [row_char(row) for row in rows]
        page["text_clean"] = "".join(chars)
        page["text_raw"] = "\n".join(chars)
        page["char_count"] = len(chars)
        page["has_char_boxes"] = bool(chars)
    dump(path, data)


def write_coordinate_files(groups, page_count=37):
    root = ROOT / "data/glyph_boxes/iiif/024"
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True, exist_ok=True)
    for page in range(1, page_count + 1):
        dump(root / f"page_{page:04d}.json", groups.get(page, []))


def write_coordinate_adapter():
    content = f'''/* 024《{TITLE}》栏目一逐页真实坐标适配。 */
(function(){{
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="024"||window.__WORK_024_COORDINATE_ADAPTER__)return;
  const CACHE_TAG="{VERSION}";
  const ROOT="data/glyph_boxes/iiif/024";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function rect(row){{return {{x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)}};}}
  function normalizeRow(row,page,index){{
    const box=rect(row);if(box.w<=0||box.h<=0)return null;
    const pageNo=Number(row.canvas_index||row.page||page||0);if(!pageNo)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {{...row,work_id:"024",canvas_index:pageNo,glyph_id:String(row.glyph_id||`024_${{pageNo}}_${{index+1}}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]}};
  }}
  async function fetchRows(page){{
    const pageNo=Number(page||0);if(!pageNo)return [];
    if(pagePromises.has(pageNo))return pagePromises.get(pageNo);
    const promise=(async()=>{{
      const url=`${{ROOT}}/page_${{String(pageNo).padStart(4,"0")}}.json?v=${{CACHE_TAG}}`;
      let lastError=null;
      for(let attempt=1;attempt<=3;attempt+=1){{try{{const response=await fetch(url,{{cache:attempt===1?"force-cache":"reload"}});if(response.status===404)return [];if(!response.ok)throw new Error(`${{response.status}} ${{response.statusText}}`);const rows=await response.json();return (Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);}}catch(error){{lastError=error;if(attempt<3)await sleep(350*attempt);}}}}
      throw lastError||new Error("024坐标读取失败");
    }})().catch(error=>{{pagePromises.delete(pageNo);console.warn("[work-024-coordinate-adapter]",pageNo,error);return [];}});
    pagePromises.set(pageNo,promise);return promise;
  }}
  window.loadPageGlyphBoxes=async function(id,pageObj){{
    const normalized=String(id||"").match(/^(\\d{{3}})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="024")return original?original(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(await fetchRows(page)).map(row=>({{...row,local_image:pageObj?.image||row.local_image||""}}));
    if(rows.length)return rows;return original?original(id,pageObj):[];
  }};
  window.WORK_024_COORDINATES={{loadPageRows:fetchRows}};
  window.__WORK_024_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-024-coordinate-adapter-ready"));
}})();
'''
    (ROOT / "js/work-024-coordinate-adapter.js").write_text(content, encoding="utf-8")


def write_work_script():
    # Dedicated renderer plus an integrated column-four readiness gate.
    content = f'''/* 024《{TITLE}》栏目二、三、四专属模块。 */
(function(){{
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="024"||window.__WORK_024_XUANJING__)return;
  window.__WORK_024_XUANJING__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;
  const TITLE={json.dumps(TITLE,ensure_ascii=False)};
  const VERSION="{VERSION}";
  const TEXT_URL=`data/work024_full_text.txt?v=${{VERSION}}`;
  const CASE_URL=`data/work024_damage_cases.json?v=${{VERSION}}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目只处理用户底稿中原有的二十三个方框。候选字依据可核验录文逐例对校，方框外文字保持底稿原样；栏目三与栏目四读取同一份十九例案例数据。";
  const IMAGE_ROOT="{IMAGE_ROOT}";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function chineseNumber(n){{const d=["零","一","二","三","四","五","六","七","八","九"];if(n<10)return d[n];if(n===10)return"十";if(n<20)return`十${{d[n%10]}}`;if(n<100)return`${{d[Math.floor(n/10)]}}十${{n%10?d[n%10]:""}}`;return String(n);}}
  function directImage(page){{const n=Number(page||0);return n?`${{IMAGE_ROOT}}/${{String(n).padStart(4,"0")}}_${{chineseNumber(n)}}.jpg`:"";}}
  async function fetchText(url){{let lastError=null;for(let attempt=1;attempt<=3;attempt+=1){{try{{const response=await fetch(url,{{cache:attempt===1?"no-store":"reload"}});if(!response.ok)throw new Error(`${{url}} ${{response.status}}`);return await response.text();}}catch(error){{lastError=error;if(attempt<3)await sleep(300*attempt);}}}}throw lastError;}}
  async function fetchJSON(url){{let lastError=null;for(let attempt=1;attempt<=3;attempt+=1){{try{{const response=await fetch(url,{{cache:attempt===1?"no-store":"reload"}});if(!response.ok)throw new Error(`${{url}} ${{response.status}}`);return await response.json();}}catch(error){{lastError=error;if(attempt<3)await sleep(300*attempt);}}}}throw lastError;}}
  function setMenuTitle(index,title){{const link=document.querySelector(`.side a:nth-of-type(${{index}})`);if(link)link.textContent=title;}}
  function normalizeCase(row,index){{const id=String(row?.id||index+1).padStart(2,"0"),category=String(row?.category||row?.n||"残损碑文恢复"),title=String(row?.title||row?.t||`第${{id}}处缺字`),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),locations=Array.isArray(row?.locations)?row.locations:[];return{{...row,id,n:category,t:title,o:original,c:corrected,category,title,original,corrected,mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"高"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:row?.page||locations[0]?.page||"—"}};}}
  function publishCases(items,forCrowd=false){{window.DAMAGE_AI_CASES=items.map(item=>({{...clone(item),id:item.id,n:forCrowd?"残损碑文恢复":item.category,t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category,category:item.category,title:item.title,original:item.original,corrected:item.corrected,analysis:[...(item.analysis||[])],locations:clone(item.locations||[]),page:item.page||"—"}}));window.dispatchEvent(new CustomEvent("work-024-cases-ready",{{detail:{{count:items.length,forCrowd}}}}));}}
  function paragraphHTML(text){{return String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>/^文曰[:：]?/.test(part)?`<h4 class="work024-part-title">${{esc(part)}}</h4>`:`<p>${{esc(part)}}</p>`).join("");}}
  function boldProblemSentences(root,items){{const patterns=items.flatMap(item=>Array.isArray(item.highlight_patterns)&&item.highlight_patterns.length?item.highlight_patterns:[item.original]).filter(Boolean).sort((a,b)=>b.length-a.length);root.querySelectorAll("p").forEach(paragraph=>{{const value=paragraph.textContent||"",found=[];patterns.forEach(pattern=>{{const at=value.indexOf(pattern);if(at>=0)found.push({{start:at,end:at+pattern.length}});}});if(!found.length)return;found.sort((a,b)=>a.start-b.start||b.end-a.end);const fragment=document.createDocumentFragment();let offset=0;found.forEach(item=>{{if(item.start<offset)return;if(item.start>offset)fragment.appendChild(document.createTextNode(value.slice(offset,item.start)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(item.start,item.end);fragment.appendChild(strong);offset=item.end;}});if(offset<value.length)fragment.appendChild(document.createTextNode(value.slice(offset)));paragraph.replaceChildren(fragment);}});}}
  async function renderTranscript(items){{const section=document.getElementById("calligraphy");if(!section)return;setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${{NOTE}}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${{TITLE}}》碑文释文……</div></div>`;const card=section.querySelector(".full-transcript-card");try{{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${{TITLE}}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${{paragraphHTML(text)}}</div>`;boldProblemSentences(card,items);}}catch(error){{console.error("[work-024] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}}}}
  function makeLocation(item){{const source=Array.isArray(item.locations)?item.locations[0]:null,bbox=source?.bbox,page=Number(source?.page||item.page||0);if(!bbox||!page)return null;const canvas={{w:Number(source?.canvas?.w||source?.canvas_width||1474),h:Number(source?.canvas?.h||source?.canvas_height||2226)}},target={{x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)}};if(target.w<=0||target.h<=0)return null;const cropW=Math.min(canvas.w,Math.max(900,target.w+620)),cropH=Math.min(canvas.h,Math.max(1250,target.h+940)),crop={{x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH}};return{{page,image:String(source?.image||directImage(page)),canvas,target,crop}};}}
  function imageHTML(item){{const location=makeLocation(item);if(location&&location.image)return`<div class="damage-viewport" data-image="${{esc(location.image)}}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${{location.crop.x}} ${{location.crop.y}} ${{location.crop.w}} ${{location.crop.h}}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${{esc(item.title)}}对应拓片局部"><image href="${{esc(location.image)}}" x="0" y="0" width="${{location.canvas.w}}" height="${{location.canvas.h}}" preserveAspectRatio="none"></image><rect class="damage-box" x="${{location.target.x}}" y="${{location.target.y}}" width="${{location.target.w}}" height="${{location.target.h}}"></rect></svg></div><p class="damage-caption">《${{TITLE}}》第${{location.page}}页，本句第一个问题字局部</p>`;return'<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用第二个问题字或相邻无关字形代替。</p></div>';}}
  function markedHTML(value){{const text=String(value||"");let html="",offset=0,match;const pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){{html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${{esc(match[1])}}〕</span>`;offset=match.index+match[0].length;}}return html+esc(text.slice(offset));}}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  let cases=[],current=0,expanded=false,listScrollTop=0;
  function caseTabs(){{return cases.map((item,index)=>`<button class="damage-tab${{index===current?" active":""}}" data-case-index="${{index}}" type="button" aria-pressed="${{index===current}}"><b>${{esc(item.id)}}</b><span class="name">${{esc(item.category)}}</span></button>`).join("");}}
  function damagePanel(item){{const analysis=(item.analysis||[]).map(line=>`<li>${{esc(line)}}</li>`).join("");return`<div class="damage-toolbar"><span class="damage-count">案例 ${{current+1}} / ${{cases.length}}</span><div class="damage-heading">${{esc(item.category)}}——“${{esc(item.title)}}” <span class="damage-heading-confidence">（${{esc(item.confidence)}}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${{current===0?"disabled":""}}>‹ 上一个</button><span class="damage-page">${{current+1}} / ${{cases.length}}</span><button data-action="next" type="button" ${{current===cases.length-1?"disabled":""}}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${{caseTabs()}}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${{imageHTML(item)}}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${{esc(item.original)}}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">文献对校结果</span><div class="damage-text damage-new">${{markedHTML(item.corrected)}}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${{esc(plainRestored(item.corrected))}}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${{expanded?" open":""}}"><ol>${{analysis}}</ol><p><strong>建议置信度：</strong>${{esc(item.confidence)}}</p></div><button class="damage-expand" data-action="expand" type="button">${{expanded?"收起内容⌃":"展开更多⌄"}}</button></div></div></section></div></div>`;}}
  function renderDamage(){{const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];setMenuTitle(3,"三、碑文残损与AI释读");publishCases(cases,false);section.className="content-card damage-ai";section.dataset.work024Dedicated="true";section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${{INTRO}}</p><div class="damage-shell">${{damagePanel(item)}}</div>`;const list=section.querySelector(".damage-list");if(list){{list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{{listScrollTop=list.scrollTop;}},{{passive:true}});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({{block:"nearest"}}));}}section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}}));section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{{const action=button.dataset.action;if(action==="prev"&&current>0)current-=1;else if(action==="next"&&current<cases.length-1)current+=1;else if(action==="expand")expanded=!expanded;renderDamage();}}));section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",event=>{{if(typeof window.openZoom==="function")window.openZoom(event.currentTarget.dataset.image);}});}}
  function ensureStyle(){{if(document.getElementById("work024-xuanjing-style"))return;const style=document.createElement("style");style.id="work024-xuanjing-style";style.textContent=".work024-part-title{{margin:22px 0 10px;color:#8b2e24;font-family:'SimSun',serif;font-size:21px}}.damage-heading-confidence{{font-size:.78em;color:#675b4e;white-space:nowrap}}.damage-text.damage-new{{color:#2e251e!important;font-weight:400!important}}.damage-added{{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}}.damage-location-missing{{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}}";document.head.appendChild(style);}}
  function ensureCrowdStyle(){{if(Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith("assets/css/crowdsource-v9.css")))return;const link=document.createElement("link");link.rel="stylesheet";link.href=`assets/css/crowdsource-v9.css?v=${{VERSION}}`;document.head.appendChild(link);}}
  async function installCrowdsource(){{publishCases(cases,true);ensureCrowdStyle();if(window.__CROWDSOURCE_MISSING_V10__){{window.__WORK_024_CROWDSOURCE_READY__=true;return true;}}const path="assets/js/crowdsource-v9.js";let script=Array.from(document.scripts).find(node=>(node.getAttribute("src")||"").split("?")[0].endsWith(path));if(!script){{script=document.createElement("script");script.src=`${{path}}?v=${{VERSION}}`;script.async=false;document.head.appendChild(script);}}for(let i=0;i<200;i+=1){{if(window.__CROWDSOURCE_MISSING_V10__){{window.__WORK_024_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-024-crowdsource-ready",{{detail:{{count:cases.length}}}}));return true;}}await sleep(50);}}throw new Error("024栏目四案例切换模块未就绪");}}
  async function init(){{ensureStyle();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${{TITLE}}》释读案例……</div></div>`;try{{const rows=await fetchJSON(CASE_URL);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);publishCases(cases,false);await renderTranscript(cases);renderDamage();window.__WORK_024_CONTENT_READY__=true;await installCrowdsource();window.__WORK_024_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-024-content-ready",{{detail:{{count:cases.length}}}}));window.dispatchEvent(new CustomEvent("work-024-stable-ready",{{detail:{{cases:cases.length,crowdsource:true}}}}));}}catch(error){{console.error("[work-024]",error);window.__WORK_024_CONTENT_READY__=true;if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${{TITLE}}》专属内容暂时无法读取，请刷新页面后重试。</div></div>`;}}}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{{once:true}});else init();
}})();
'''
    (ROOT / "js/work-024.js").write_text(content, encoding="utf-8")


def patch_shared_routes():
    path = ROOT / "js/damage_ai_reading.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("__DAMAGE_AI_READING_ROUTER_V62__", "__DAMAGE_AI_READING_ROUTER_V63__", 1)
    text = text.replace('window.__DAMAGE_AI_READING_ROUTER_V62__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V61__=true;', 'window.__DAMAGE_AI_READING_ROUTER_V63__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V62__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V61__=true;', 1)
    marker = '''    "023":[\n      {src:"js/work-023-coordinate-adapter.js?v=20260724_guifeng_v2",key:"w023c",ready:()=>Boolean(window.__WORK_023_COORDINATE_ADAPTER__)},\n      {src:"js/work-023.js?v=20260724_guifeng_v2",key:"w023",ready:()=>Boolean(window.__WORK_023_STABLE_READY__)},\n      {src:"js/work-023-crowdsource-adapter.js?v=20260724_guifeng_crowd_v1",key:"w023crowd",ready:()=>Boolean(window.__WORK_023_CROWDSOURCE_ADAPTER__)}\n    ]\n'''
    addition = marker[:-1] + ''',\n    "024":[\n      {src:"js/work-024-coordinate-adapter.js?v=20260724_xuanjing_v1",key:"w024c",ready:()=>Boolean(window.__WORK_024_COORDINATE_ADAPTER__)},\n      {src:"js/work-024.js?v=20260724_xuanjing_v1",key:"w024",ready:()=>Boolean(window.__WORK_024_STABLE_READY__&&window.__WORK_024_CROWDSOURCE_READY__)}\n    ]\n'''
    if '"024":[' not in text:
        if marker not in text:
            raise RuntimeError("Cannot locate 023 route block")
        text = text.replace(marker, addition, 1)
    text = text.replace('"023":"圭峰定慧禅师碑"};', '"023":"圭峰定慧禅师碑","024":"张从申书李玄靖碑"};')
    for old in [
        '["007","010","011","013","014","015","016","017","018","020","022","023"]',
        '["003","004","005","006","007","010","011","013","014","015","016","017","018","020","022","023"]',
    ]:
        text = text.replace(old, old[:-1] + ',"024"]')
    path.write_text(text, encoding="utf-8")

    path = ROOT / "js/detail_info_patch.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace('["007","010","011","013","014","015","016","017","018","020","022","023"]', '["007","010","011","013","014","015","016","017","018","020","022","023","024"]')
    if 'window.__DAMAGE_AI_READING_ROUTER_V62__=true;' not in text:
        text = text.replace('window.__DAMAGE_AI_READING_ROUTER_V60__=true;', 'window.__DAMAGE_AI_READING_ROUTER_V60__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V61__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V62__=true;')
    text = re.sub(r'script\.src="js/damage_ai_reading\.js\?v=[^"]+";', 'script.src="js/damage_ai_reading.js?v=20260724_xuanjing_v1";', text)
    text = re.sub(r'const dataUrl="data/beitie_header_info\.json\?v=[^"]+";', 'const dataUrl="data/beitie_header_info.json?v=20260724_xuanjing_v1";', text)
    path.write_text(text, encoding="utf-8")

    path = ROOT / "detail.html"
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'js/detail_info_patch\.js\?v=[^"<]+', 'js/detail_info_patch.js?v=20260724_xuanjing_v1', text)
    text = re.sub(r'js/damage_ai_reading\.js\?v=[^"<]+', 'js/damage_ai_reading.js?v=20260724_xuanjing_v1', text)
    path.write_text(text, encoding="utf-8")


def validate(cases, mapping, groups):
    assert FULL_TEXT.count("□") == 23
    assert len(cases) == 19
    assert sum(case["square_count"] for case in cases) == 23
    assert sum(case["candidate_count"] for case in cases) == 23
    assert all("□" not in case["corrected"] for case in cases)
    assert mapping["located_cases"] == len(cases), mapping
    assert len(groups) > 0
    assert sum(len(v) for v in groups.values()) > 0


def main():
    page_path = ROOT / "data/page_images_index.json"
    page_data = json.loads(page_path.read_text(encoding="utf-8"))
    pages = page_data["works"][WORK_ID]["pages"]
    shard_path = ROOT / "data/model_boxes/glyph_model_border_021_025.json"
    records = extract_records(json.loads(shard_path.read_text(encoding="utf-8")))
    groups = normalize_model_rows(records, pages)
    cases, mapping = build_cases(groups)
    validate(cases, mapping, groups)

    (ROOT / "data/work024_full_text.txt").write_text(FULL_TEXT, encoding="utf-8")
    dump(ROOT / "data/work024_damage_cases.json", cases)
    write_coordinate_files(groups, page_count=len(pages))
    update_page_index(groups)
    update_catalog()
    update_header()
    write_coordinate_adapter()
    write_work_script()
    patch_shared_routes()

    report = {
        "work_id": WORK_ID,
        "title": TITLE,
        "base_text_policy": "保留用户底稿方框外全部文字，只在栏目三和栏目四为原有□提供候选字。",
        "digital_pages": len(pages),
        "model_rows": sum(len(v) for v in groups.values()),
        "pages_with_coordinates": sorted(page for page, rows in groups.items() if rows),
        "model_square_count": mapping["model_square_count"],
        "base_text_square_count": FULL_TEXT.count("□"),
        "case_count": len(cases),
        "candidate_count": sum(case["candidate_count"] for case in cases),
        "remaining_square_count_in_corrected": sum(case["corrected"].count("□") for case in cases),
        "located_case_count": mapping["located_cases"],
        "mapping_method": mapping["mapping_method"],
        "source_for_square_candidates": SOURCE_URL,
        "column_four": {
            "uses_same_cases_as_column_three": True,
            "case_count": len(cases),
            "readiness_gate": "__WORK_024_STABLE_READY__ waits for __WORK_024_CROWDSOURCE_READY__",
        },
    }
    dump(ROOT / "data/work024_coordinate_report.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
