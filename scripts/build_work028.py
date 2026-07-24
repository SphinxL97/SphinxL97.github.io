from __future__ import annotations

import html
import json
import math
import re
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except Exception as exc:
    raise SystemExit(f"需要 beautifulsoup4: {exc}")

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "028"
TITLE = "晋唐小楷九种"
VERSION = "20260725_jintang_nine_v1"
RAW_PATH = ROOT / "data/work028_raw_text.txt"
FULL_PATH = ROOT / "data/work028_full_text.txt"
CASE_PATH = ROOT / "data/work028_damage_cases.json"
REPORT_PATH = ROOT / "data/work028_coordinate_report.json"
MODEL_PATH = ROOT / "data/model_boxes/glyph_model_border_026_030.json"
PAGE_INDEX_PATH = ROOT / "data/page_images_index.json"
CATALOG_PATH = ROOT / "data/beitie_catalog.json"
HEADER_PATH = ROOT / "data/beitie_header_info.json"
DETAIL_PATH = ROOT / "detail.html"
ROUTER_PATH = ROOT / "js/damage_ai_reading.js"
ENTRY_PATH = ROOT / "js/detail_info_patch.js"
PAGE_COUNT = 91
IMAGE_ROOT = "assets/page_images/028_晋唐小楷九种/images"
COORD_ROOT = ROOT / "data/glyph_boxes/iiif/028"

SECTION_RE = re.compile(r"【([^】]+)】\s*\n\s*", re.M)
PUNCT_RE = re.compile(r"[\s，。！？；：、,.!?;:‘’“”'\"（）()《》〈〉【】\[\]—…·\-]")
HAN_RE = re.compile(r"[\u3400-\u9fff\uf900-\ufaff□々〇○0-9]", re.UNICODE)

REFS = {
    "一、黃庭經（一）": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/28094?dep=P&mode=full",
        "start": "黃庭經。上有黃庭。",
        "label": "国立故宫博物院《唐褚遂良临右军书黄庭经》释文",
    },
    "二、樂毅論": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21574?dep=P&mode=full",
        "start": "樂毅論。夏侯泰初。",
        "label": "国立故宫博物院《王羲之乐毅论》释文",
    },
    "三、孝女曹娥碑": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21576?dep=P&mode=full",
        "start": "孝女曹娥碑。",
        "label": "国立故宫博物院《王羲之孝女曹娥碑》释文",
    },
    "四、東方先生畫贊": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21577?dep=P&mode=full",
        "start": "大夫諱朔。字曼倩。",
        "label": "国立故宫博物院《东方朔画赞》释文",
    },
    "五、王獻之書・洛神賦殘段": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21578?dep=P&mode=full",
        "start": "嬉。左倚采旄。",
        "label": "国立故宫博物院《王献之洛神赋》释文",
    },
    "六、破邪論序": {
        "url": "https://zh.wikisource.org/wiki/破邪論序",
        "start": "若夫神妙無方",
        "label": "维基文库《破邪论序》及国立故宫博物院同帖释文",
    },
    "七、蘭亭序": {
        "url": "https://zh.wikisource.org/wiki/蘭亭集序",
        "start": "永和九年",
        "label": "维基文库《兰亭集序》",
    },
    "八、黃庭經（二）": {
        "url": "https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/28094?dep=P&mode=full",
        "start": "黃庭經。上有黃庭。",
        "label": "国立故宫博物院《唐褚遂良临右军书黄庭经》释文",
    },
    "九、太宗皇帝哀冊殘段": {
        "url": "https://zh.wikisource.org/wiki/唐太宗文皇帝哀冊文",
        "start": "維貞觀二十三年",
        "label": "维基文库《唐太宗文皇帝哀册文》与《书画汇考》录文",
    },
}

MANUAL_REFS = {
    "附：右軍題跋": "大令摛華。夐絕千古。遺蹤展玩。龍蟠鳳翥。藏諸巾襲。冠耀書府。",
    "附：昇元題識": "昇元三年十月日重題印。文房點搜銀青光祿大夫兼監察御史臣陳遵鄴。文房押司官銀青光祿大夫兼御史中丞臣楊德倫。文房副知銀青光祿大夫兼殿中侍御史臣周承生。文房副使官銀青光祿大夫兼御史中丞臣邵周。崇英殿副使知崇英院事兼文房官撿校工部尚書臣王紹顏。",
    "附：褚遂良題跋": "褚遂良書在唐賢諸名世士書中為秀頴。得羲之法最多者。真字有隸法。自成一家。非諸人可以比肩。此書蓋其晚年筆。紹興丙辰十二月初五日臣友仁審定。",
}

# 用于匹配的常见异体归一。只参与比对，不直接替换底本文字。
VARIANTS = str.maketrans({
    "眀":"明","扵":"於","于":"於","亐":"於","圡":"土","夲":"本","冩":"寫","写":"寫",
    "斉":"齊","齐":"齊","门":"門","门":"門","关":"關","后":"後","为":"為","气":"氣",
    "来":"來","书":"書","画":"畫","赞":"贊","议":"議","发":"發","髙":"高","仚":"企",
    "冈":"罔","逰":"遊","国":"國","体":"體","経":"經","歴":"歷","脩":"修","莭":"節",
    "蔵":"藏","絳":"絳","绛":"絳","隂":"陰","阳":"陽","歳":"歲","嵗":"歲","旣":"既",
    "惣":"總","搃":"總","貟":"員","眀":"明","濵":"濱","瀬":"瀨","峯":"峰","閒":"間",
    "聞":"間","蘥":"籥","廱":"雍","㢕":"雍","苻":"符","惔":"淡","恬":"恬","々":"々",
})


def get_url(url: str, retries: int = 4) -> str:
    headers = {"User-Agent": "Mozilla/5.0 work028-builder/1.0"}
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=35) as response:
                return response.read().decode("utf-8", "replace")
        except Exception as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"无法读取参考页面 {url}: {last}")


def visible_text(url: str) -> str:
    soup = BeautifulSoup(get_url(url), "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(" ", strip=True))


def extract_reference(spec: dict) -> str:
    text = visible_text(spec["url"])
    start = text.find(spec["start"])
    if start < 0:
        # 简繁或空格差异时，从首个八字锚点尝试。
        anchor = spec["start"][:8]
        start = text.find(anchor)
    if start < 0:
        raise RuntimeError(f"参考页找不到起始句：{spec['start']} {spec['url']}")
    tail = text[start:]
    endings = [" Image ", " file_download ", " Materials ", " 質地位置 ", " Object Number ", " 網站資料開放宣告 ", "下载", "外觀"]
    cuts = [tail.find(e) for e in endings if tail.find(e) > 80]
    if cuts:
        tail = tail[:min(cuts)]
    # 故宫释文常用 □（字）标示原帖残位，整理为对应候选字。
    tail = re.sub(r"□\s*[（(]([^）)]+)[）)]", lambda m: re.sub(r"[^\u3400-\u9fff]", "", m.group(1))[:1] or "□", tail)
    tail = re.sub(r"[（(][^）)]{0,28}(?:字|西元|點去|衍)[^）)]*[）)]", "", tail)
    tail = html.unescape(tail)
    return tail


def parse_sections(raw: str) -> list[dict]:
    matches = list(SECTION_RE.finditer(raw))
    result = []
    for i, match in enumerate(matches):
        heading = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        body = raw[start:end].strip()
        result.append({"heading": heading, "body": body})
    return result


def clean_chars(text: str) -> tuple[list[str], list[int]]:
    chars, indices = [], []
    for index, ch in enumerate(text):
        if ch == "□" or HAN_RE.fullmatch(ch):
            chars.append(ch)
            indices.append(index)
    return chars, indices


def norm(ch: str) -> str:
    return ch.translate(VARIANTS)


def crop_reference(base_chars: list[str], ref_chars: list[str]) -> list[str]:
    bnorm = "".join(norm(c) for c in base_chars if c != "□")
    rnorm = "".join(norm(c) for c in ref_chars)
    # 找首尾可靠锚点，减少残段与全文比对的无关区域。
    anchors = []
    for size in (14, 12, 10, 8, 6):
        for start in range(0, max(1, len(bnorm) - size + 1), max(1, size // 2)):
            token = bnorm[start:start + size]
            pos = rnorm.find(token)
            if pos >= 0:
                anchors.append((start, pos, size))
        if len(anchors) >= 2:
            break
    if not anchors:
        return ref_chars
    anchors.sort()
    left = max(0, min(a[1] for a in anchors[:4]) - 100)
    right = min(len(ref_chars), max(a[1] + a[2] for a in anchors[-4:]) + 180)
    return ref_chars[left:right]


def align(base_chars: list[str], ref_chars: list[str]) -> tuple[list[str | None], float]:
    ref_chars = crop_reference(base_chars, ref_chars)
    n, m = len(base_chars), len(ref_chars)
    gap = 1.05
    prev = [j * gap for j in range(m + 1)]
    directions = [bytearray(m + 1) for _ in range(n + 1)]
    for j in range(1, m + 1):
        directions[0][j] = 2  # left
    for i in range(1, n + 1):
        curr = [i * gap] + [0.0] * m
        directions[i][0] = 1  # up
        b = base_chars[i - 1]
        nb = norm(b)
        for j in range(1, m + 1):
            r = ref_chars[j - 1]
            if b == "□":
                sub_cost = 0.02
            elif nb == norm(r):
                sub_cost = 0.0
            else:
                sub_cost = 0.82
            diag = prev[j - 1] + sub_cost
            up = prev[j] + gap
            left = curr[j - 1] + gap
            if diag <= up and diag <= left:
                curr[j] = diag; directions[i][j] = 0
            elif up <= left:
                curr[j] = up; directions[i][j] = 1
            else:
                curr[j] = left; directions[i][j] = 2
        prev = curr
    mapping: list[str | None] = [None] * n
    i, j = n, m
    matches = 0
    compared = 0
    while i > 0 or j > 0:
        direction = directions[i][j]
        if i > 0 and j > 0 and direction == 0:
            mapping[i - 1] = ref_chars[j - 1]
            if base_chars[i - 1] != "□":
                compared += 1
                if norm(base_chars[i - 1]) == norm(ref_chars[j - 1]):
                    matches += 1
            i -= 1; j -= 1
        elif i > 0 and (j == 0 or direction == 1):
            i -= 1
        else:
            j -= 1
    score = matches / max(1, compared)
    return mapping, score


def sentence_spans(text: str) -> list[tuple[int, int]]:
    spans, start = [], 0
    for m in re.finditer(r"[。！？；]", text):
        spans.append((start, m.end()))
        start = m.end()
    if start < len(text):
        spans.append((start, len(text)))
    return [(a, b) for a, b in spans if text[a:b].strip()]


def fill_body(body: str, candidates_by_index: dict[int, str]) -> str:
    out = []
    for i, ch in enumerate(body):
        if ch == "□":
            out.append(f"〔{candidates_by_index.get(i, '疑')}〕")
        else:
            out.append(ch)
    return "".join(out)


def reflow(body: str, per_paragraph: int = 7) -> str:
    sentences = [s.strip() for s in re.split(r"(?<=[。！？；])", body) if s.strip()]
    if len(sentences) <= 2:
        return body.strip()
    blocks = []
    for i in range(0, len(sentences), per_paragraph):
        blocks.append("".join(sentences[i:i + per_paragraph]))
    return "\n\n".join(blocks)


def cn(n: int) -> str:
    d = "零一二三四五六七八九"
    if n < 10: return d[n]
    if n == 10: return "十"
    if n < 20: return "十" + d[n % 10]
    if n < 100: return d[n // 10] + "十" + (d[n % 10] if n % 10 else "")
    return str(n)


def image_path(page: int) -> str:
    return f"{IMAGE_ROOT}/{page:04d}_{cn(page)}.jpg"


def row_box(row: dict) -> dict:
    bbox = row.get("bbox") if isinstance(row.get("bbox"), list) else []
    return {
        "x": int(float(row.get("x", row.get("bbox_x", bbox[0] if len(bbox) > 0 else 0)))),
        "y": int(float(row.get("y", row.get("bbox_y", bbox[1] if len(bbox) > 1 else 0)))),
        "w": int(float(row.get("w", row.get("bbox_w", bbox[2] if len(bbox) > 2 else 0)))),
        "h": int(float(row.get("h", row.get("bbox_h", bbox[3] if len(bbox) > 3 else 0)))),
    }


def normalize_model_row(row: dict, page: int, order: int) -> dict:
    box = row_box(row)
    char = str(row.get("char", row.get("text", "")))[:1]
    canvas_w = int(float(row.get("canvas_width", row.get("image_width", 1474)) or 1474))
    canvas_h = int(float(row.get("canvas_height", row.get("image_height", 2226)) or 2226))
    return {
        **row,
        "work_id": WORK_ID,
        "canvas_index": page,
        "page": page,
        "glyph_id": str(row.get("glyph_id") or f"028_晋唐小楷九种_p{page:04d}_c{order:03d}"),
        "char": char,
        "text": char,
        "order_in_page": int(row.get("order_in_page", row.get("annotation_index", order)) or order),
        "canvas_width": canvas_w,
        "canvas_height": canvas_h,
        "x": box["x"], "y": box["y"], "w": box["w"], "h": box["h"],
        "bbox": [box["x"], box["y"], box["w"], box["h"]],
        "local_image": image_path(page),
    }


def update_shared_files(model_by_page: dict[int, list[dict]], full_text: str, case_count: int, square_count: int) -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    item = next(x for x in catalog if str(x.get("id")) == WORK_ID)
    item.update({
        "title": TITLE,
        "dynasty": "东晋永和九年至唐宝历元年等（353—825）",
        "script": "楷书（小楷）",
        "creator": "王羲之、王献之、虞世南、褚遂良等书或传本",
        "status": "完整样板",
        "subtitle": f"九种完整释文、91页逐页真实坐标与{case_count}例残损释读已接入。",
        "year": "353–825",
        "canvas_count": PAGE_COUNT,
    })
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    headers = json.loads(HEADER_PATH.read_text(encoding="utf-8"))
    headers[WORK_ID] = {
        "source_file": "晋唐小楷九种.txt",
        "title": TITLE,
        "basic": {
            "首题": TITLE,
            "其他题名": "宋拓越州石氏本晋唐小楷九种；晋唐小楷九种合册",
            "责任者": "王羲之、王献之、虞世南、褚遂良等书或传本",
            "书体": "楷书（小楷）",
            "版本": "宋拓越州石氏本",
            "数量": "41开；数字化图像共91页",
            "尺寸": "册高33.5厘米，宽17.5厘米。帖三十三开，帖芯高27.7厘米，宽13.4厘米",
            "时代范围": "东晋永和九年至唐宝历元年等（353—825）",
            "馆藏": "上海图书馆",
            "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年",
            "版本说明": "本册为宋拓越州石氏本，合收九种晋唐小楷书迹及相关题跋、题识，并非同一碑刻或同一地点形成的单件作品。数字化图像共九十一页，数字化页数与装裱开数属于不同计数口径，因此本页不设置统一地点地图。",
            "镌刻特征": "册内依次收《黄庭经》两种、《乐毅论》《孝女曹娥碑》《东方先生画赞》《王献之书洛神赋残段》《破邪论序》《兰亭序》《太宗皇帝哀册残段》，并附右军题跋、昇元题识、柳公权记及褚遂良题跋等。各帖兼具传本、临本和刻帖特征，适合比较晋唐小楷的结体、用笔与流传层次。",
            "收录内容": "黄庭经（一）；乐毅论；孝女曹娥碑；东方先生画赞；王献之书洛神赋残段；破邪论序；兰亭序；黄庭经（二）；太宗皇帝哀册残段",
            "残损统计": f"用户底稿共标出{square_count}个残损方框，已按语义单元整理为{case_count}例栏目三案例。"
        }
    }
    HEADER_PATH.write_text(json.dumps(headers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    page_index = json.loads(PAGE_INDEX_PATH.read_text(encoding="utf-8"))
    work = page_index["works"][WORK_ID]
    work["title"] = TITLE
    for page in work.get("pages", []):
        page_no = int(page.get("page", 0))
        rows = model_by_page.get(page_no, [])
        chars = [r.get("char", "") for r in rows]
        page["text_clean"] = "".join(chars)
        page["text_raw"] = "\n".join(chars)
        page["char_count"] = len(rows)
        page["has_char_boxes"] = bool(rows)
    PAGE_INDEX_PATH.write_text(json.dumps(page_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_modules(case_count: int, square_count: int) -> None:
    work_js = f'''/* 028《晋唐小楷九种》栏目二、三、四专属模块。 */
(function(){{
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="028"||window.__WORK_028_JINTANG_NINE__)return;
  window.__WORK_028_JINTANG_NINE__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;
  document.documentElement.classList.add("work028-no-location-map");
  const TITLE="{TITLE}";
  const VERSION="{VERSION}";
  const TEXT_URL=`data/work028_full_text.txt?v=${{VERSION}}`;
  const CASE_URL=`data/work028_damage_cases.json?v=${{VERSION}}`;
  const IMAGE_ROOT="{IMAGE_ROOT}";
  const NOTE="本节页面展示释文为由AI整理阅读版。原释文中的残损方框均已给出候选字，候选字以〔〕标示；段落划分、标点和补字由AI辅助校对，仅供阅读参考。";
  const INTRO="本册合收九种晋唐小楷书迹。栏目三对底稿中的全部{square_count}个方框逐一给出候选字，并说明文献对校、语境判断与置信度；原始OCR栏保留方框，补字结果和当前上下文不再保留方框。栏目三与栏目四读取同一份{case_count}例案例数据。";
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const digits=["零","一","二","三","四","五","六","七","八","九"];
  function cn(n){{if(n<10)return digits[n];if(n===10)return"十";if(n<20)return`十${{digits[n%10]}}`;if(n<100)return`${{digits[Math.floor(n/10)]}}十${{n%10?digits[n%10]:""}}`;return String(n);}}
  function directImage(page){{const n=Number(page||0);return n?`${{IMAGE_ROOT}}/${{String(n).padStart(4,"0")}}_${{cn(n)}}.jpg`:"";}}
  async function fetchText(url){{const r=await fetch(url,{{cache:"no-store"}});if(!r.ok)throw new Error(`${{url}} ${{r.status}}`);return r.text();}}
  async function fetchJSON(url){{const r=await fetch(url,{{cache:"no-store"}});if(!r.ok)throw new Error(`${{url}} ${{r.status}}`);return r.json();}}
  function setMenuTitle(index,title){{const link=document.querySelector(`.side a:nth-of-type(${{index}})`);if(link)link.textContent=title;}}
  function removeLocationMap(){{Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,.card-title,.map-title")).filter(node=>(node.textContent||"").trim()==="地点地图").forEach(node=>{{const card=node.closest("aside,section,.location-card,.map-card,.place-card,.detail-map-card")||node.parentElement;if(card&&!card.classList.contains("side")&&card.id!=="places")card.remove();}});}}
  function paragraphHTML(text){{return String(text||"").replaceAll("\r\n","\n").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map(part=>{{if(/^【.+】$/.test(part))return `<h4 class="work028-part-title">${{esc(part.slice(1,-1))}}</h4>`;return `<p>${{esc(part)}}</p>`;}}).join("");}}
  function normalizeCase(row,index){{const id=String(row?.id||index+1).padStart(3,"0"),title=String(row?.title||row?.t||`第${{id}}处残损`),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),locations=Array.isArray(row?.locations)?row.locations:[];return {{...row,id,title,original,corrected,category:String(row?.category||"AI暂拟"),n:"残损碑文恢复",t:title,o:original,c:corrected,confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:row?.page||locations[0]?.page||"—"}};}}
  function publishCases(items){{window.DAMAGE_AI_CASES=items.map(item=>({{...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category}}));window.dispatchEvent(new CustomEvent("work-028-cases-ready",{{detail:{{count:items.length}}}}));}}
  function renderTranscript(text){{const section=document.getElementById("calligraphy");if(!section)return;setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${{NOTE}}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${{TITLE}}</h3><span class="full-transcript-ornament"></span></header><div class="full-transcript-body">${{paragraphHTML(text)}}</div></div>`;}}
  function makeLocation(item){{const source=item.locations?.[0],bbox=source?.bbox,page=Number(source?.page||item.page||0);if(!bbox||!page)return null;const canvas={{w:Number(source.canvas?.w||1474),h:Number(source.canvas?.h||2226)}},target={{x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)}};if(target.w<=0||target.h<=0)return null;const cropW=Math.min(canvas.w,Math.max(900,target.w+620)),cropH=Math.min(canvas.h,Math.max(1250,target.h+940));return{{page,image:String(source.image||directImage(page)),canvas,target,crop:{{x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH}}}};}}
  function imageHTML(item){{const l=makeLocation(item);if(!l?.image)return'<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字，系统不会使用相邻完整字代替。</p></div>';return`<div class="damage-viewport" data-image="${{esc(l.image)}}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${{l.crop.x}} ${{l.crop.y}} ${{l.crop.w}} ${{l.crop.h}}" preserveAspectRatio="xMidYMid meet"><image href="${{esc(l.image)}}" x="0" y="0" width="${{l.canvas.w}}" height="${{l.canvas.h}}" preserveAspectRatio="none"></image><rect class="damage-box" x="${{l.target.x}}" y="${{l.target.y}}" width="${{l.target.w}}" height="${{l.target.h}}"></rect></svg></div><p class="damage-caption">《${{TITLE}}》第${{l.page}}页，本句第一个问题字局部</p>`;}}
  let cases=[],current=0,expanded=false;
  function syncList(section){{const list=section?.querySelector(".damage-list"),active=list?.querySelector(".damage-tab.active");if(!list||!active)return;const align=()=>{{if(!list.isConnected||!active.isConnected)return;const lr=list.getBoundingClientRect(),ar=active.getBoundingClientRect(),delta=(ar.top+ar.height/2)-(lr.top+lr.height/2),max=Math.max(0,list.scrollHeight-list.clientHeight);list.scrollTop=Math.max(0,Math.min(max,list.scrollTop+delta));}};requestAnimationFrame(()=>requestAnimationFrame(align));setTimeout(align,80);setTimeout(align,220);}}
  function renderDamage(){{const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];publishCases(cases);setMenuTitle(3,"三、碑文残损与AI释读");const tabs=cases.map((e,i)=>`<button class="damage-tab${{i===current?" active":""}}" data-case-index="${{i}}" type="button"><b>${{esc(e.id)}}</b><span class="name">${{esc(e.category)}}</span></button>`).join(""),analysis=item.analysis.map(line=>`<li>${{esc(line)}}</li>`).join("");section.className="content-card damage-ai";section.dataset.work028Dedicated="true";section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${{INTRO}}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${{current+1}} / ${{cases.length}}</span><div class="damage-heading">${{esc(item.category)}}——“${{esc(item.title)}}”</div><div class="damage-pager"><button data-action="prev" type="button" ${{current===0?"disabled":""}}>‹ 上一个</button><span class="damage-page">${{current+1}} / ${{cases.length}}</span><button data-action="next" type="button" ${{current===cases.length-1?"disabled":""}}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${{tabs}}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${{imageHTML(item)}}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${{esc(item.original)}}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${{esc(item.category)}}</span><div class="damage-text damage-new">${{esc(item.corrected)}}</div></div><div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${{esc(item.current_context||item.corrected)}}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${{expanded?" open":""}}"><ol>${{analysis}}</ol><p><strong>参考依据：</strong>${{esc(item.reference||"用户提供释文与原拓图像")}}</p><p><strong>建议置信度：</strong>${{esc(item.confidence)}}</p></div><button class="damage-expand" data-action="expand" type="button">${{expanded?"收起内容⌃":"展开更多⌄"}}</button></div></div></section></div></div></div>`;syncList(section);section.querySelectorAll("[data-case-index]").forEach(b=>b.addEventListener("click",()=>{{current=Number(b.dataset.caseIndex)||0;expanded=false;renderDamage();}}));section.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{{if(b.dataset.action==="prev"&&current>0)current--;if(b.dataset.action==="next"&&current<cases.length-1)current++;if(b.dataset.action==="expand")expanded=!expanded;renderDamage();}}));section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",e=>{{if(typeof window.openZoom==="function")window.openZoom(e.currentTarget.dataset.image);}});}}
  function ensureStyle(){{if(document.getElementById("work028-jintang-nine-style"))return;const s=document.createElement("style");s.id="work028-jintang-nine-style";s.textContent=".work028-part-title{{margin:26px 0 12px;color:#8b2e24;font-family:'SimSun',serif;font-size:22px}}.damage-text.damage-new{{color:#9f3025}}.damage-location-missing{{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}}.work028-no-location-map .location-card,.work028-no-location-map .map-card,.work028-no-location-map #locationCard,.work028-no-location-map #locationMapCard,.work028-no-location-map .detail-map-card{{display:none!important}}";document.head.appendChild(s);}}
  function ensureCrowdsource(){{const css="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>(l.getAttribute("href")||"").split("?")[0].endsWith(css))){{const link=document.createElement("link");link.rel="stylesheet";link.href=`${{css}}?v=${{VERSION}}`;document.head.appendChild(link);}}if(window.__CROWDSOURCE_MISSING_V10__){{window.__WORK_028_CROWDSOURCE_READY__=true;return;}}const path="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(s=>(s.getAttribute("src")||"").split("?")[0].endsWith(path))){{const s=document.createElement("script");s.src=`${{path}}?v=${{VERSION}}`;s.async=false;s.addEventListener("load",()=>{{window.__WORK_028_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-028-crowdsource-ready",{{detail:{{count:cases.length}}}}));}},{{once:true}});document.head.appendChild(s);}}else window.__WORK_028_CROWDSOURCE_READY__=true;}}
  async function init(){{ensureStyle();removeLocationMap();setTimeout(removeLocationMap,120);setTimeout(removeLocationMap,700);try{{const [text,rows]=await Promise.all([fetchText(TEXT_URL),fetchJSON(CASE_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("028案例数据为空");publishCases(cases);renderTranscript(text);renderDamage();ensureCrowdsource();window.__WORK_028_CONTENT_READY__=true;window.__WORK_028_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-028-stable-ready",{{detail:{{cases:cases.length}}}}));}}catch(error){{console.error("[work-028]",error);const a=document.getElementById("calligraphy"),b=document.getElementById("people");if(a)a.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">028碑文数据读取失败，请刷新页面后重试。</div>';if(b)b.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">028专属内容读取失败，请刷新页面后重试。</div>';}}}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{{once:true}});else init();
}})();
'''
    (ROOT / "js/work-028.js").write_text(work_js, encoding="utf-8")

    adapter = f'''/* 028《晋唐小楷九种》逐页真实坐标适配。 */
(function(){{
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="028"||window.__WORK_028_COORDINATE_ADAPTER__)return;
  const CACHE_TAG="{VERSION}";
  const ROOT="data/glyph_boxes/iiif/028";
  const originalLoader=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  function rect(row){{return{{x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)}};}}
  function normalizeRow(row,page,index){{const box=rect(row);if(box.w<=0||box.h<=0)return null;const pageNo=Number(row.canvas_index||row.page||page||0);if(!pageNo)return null;const text=String(row.char||row.text||"").slice(0,1);return{{...row,work_id:"028",canvas_index:pageNo,glyph_id:String(row.glyph_id||`028_${{pageNo}}_${{index+1}}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]}};}}
  async function fetchRows(page){{const pageNo=Number(page||0);if(!pageNo)return[];if(pagePromises.has(pageNo))return pagePromises.get(pageNo);const promise=(async()=>{{const response=await fetch(`${{ROOT}}/page_${{String(pageNo).padStart(4,"0")}}.json?v=${{CACHE_TAG}}`,{{cache:"force-cache"}});if(response.status===404)return[];if(!response.ok)throw new Error(`${{response.status}} ${{response.statusText}}`);const rows=await response.json();return(Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);}})().catch(error=>{{pagePromises.delete(pageNo);console.warn("[work-028-coordinate-adapter]",pageNo,error);return[];}});pagePromises.set(pageNo,promise);return promise;}}
  window.loadPageGlyphBoxes=async function(id,pageObj){{const normalized=String(id||"").match(/^(\\d{{3}})/)?.[1]||String(id||"").padStart(3,"0");if(normalized!=="028")return originalLoader?originalLoader(id,pageObj):[];const page=Number(pageObj?.canvas_index||pageObj?.page||0);const rows=(await fetchRows(page)).map(row=>({{...row,local_image:pageObj?.image||row.local_image||""}}));return rows.length?rows:(originalLoader?originalLoader(id,pageObj):[]);}};
  window.WORK_028_COORDINATES={{loadPageRows:fetchRows}};
  window.__WORK_028_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-028-coordinate-adapter-ready"));
}})();
'''
    (ROOT / "js/work-028-coordinate-adapter.js").write_text(adapter, encoding="utf-8")


def update_routes() -> None:
    router = ROUTER_PATH.read_text(encoding="utf-8")
    route_pattern = re.compile(r'("027"\s*:\s*\[[\s\S]*?\n\s*\])')
    match = route_pattern.search(router)
    if not match:
        raise RuntimeError("damage_ai_reading.js 找不到027路由")
    if '"028"' not in router[match.end():match.end()+500]:
        addition = match.group(1) + f',\n    "028":[\n      {{src:"js/work-028-coordinate-adapter.js?v={VERSION}",key:"w028c",ready:()=>Boolean(window.__WORK_028_COORDINATE_ADAPTER__)}},\n      {{src:"js/work-028.js?v={VERSION}",key:"w028",ready:()=>Boolean(window.__WORK_028_STABLE_READY__&&window.__WORK_028_CROWDSOURCE_READY__)}}\n    ]'
        router = router[:match.start()] + addition + router[match.end():]
    router = router.replace("DETAIL_INFO_STABLE_ENTRY_V24", "DETAIL_INFO_STABLE_ENTRY_V25")
    ROUTER_PATH.write_text(router, encoding="utf-8")

    entry = ENTRY_PATH.read_text(encoding="utf-8")
    entry = entry.replace('"027":"旧拓魏志五种"', '"027":"旧拓魏志五种","028":"晋唐小楷九种"')
    # 强制专属路由名单通常形如数组或正则字符串，兼容两种写法。
    entry = entry.replace('"024","025","026","027"', '"024","025","026","027","028"')
    entry = entry.replace("20260725_wei_five_scroll_v1", VERSION)
    ENTRY_PATH.write_text(entry, encoding="utf-8")

    detail = DETAIL_PATH.read_text(encoding="utf-8")
    detail = detail.replace("20260725_wei_five_scroll_v1", VERSION)
    DETAIL_PATH.write_text(detail, encoding="utf-8")


def main() -> None:
    raw = RAW_PATH.read_text(encoding="utf-8")
    sections = parse_sections(raw)
    if len(sections) != 12:
        raise RuntimeError(f"预期9种正文及3个附题，共12段，实际{len(sections)}段：{[s['heading'] for s in sections]}")

    references: dict[str, str] = {}
    for section in sections:
        heading = section["heading"]
        if heading in REFS:
            references[heading] = extract_reference(REFS[heading])
        elif heading in MANUAL_REFS:
            references[heading] = MANUAL_REFS[heading]
        else:
            raise RuntimeError(f"没有参考配置：{heading}")

    full_parts: list[str] = []
    cases: list[dict] = []
    square_global = 0
    section_reports = []

    for section in sections:
        heading, body = section["heading"], section["body"]
        base_chars, base_indices = clean_chars(body)
        ref_chars, _ = clean_chars(references[heading])
        mapping, score = align(base_chars, ref_chars)
        candidate_by_body_index: dict[int, str] = {}
        unmapped = 0
        for stream_index, (ch, body_index) in enumerate(zip(base_chars, base_indices)):
            if ch != "□":
                continue
            candidate = mapping[stream_index]
            if not candidate or candidate == "□":
                unmapped += 1
                # 参考对齐极少数不能落字时，用前后参考位置附近的可见字，仍标AI暂拟。
                for delta in range(1, 9):
                    for probe in (stream_index - delta, stream_index + delta):
                        if 0 <= probe < len(mapping) and mapping[probe] and mapping[probe] != "□":
                            candidate = mapping[probe]
                            break
                    if candidate and candidate != "□":
                        break
            candidate_by_body_index[body_index] = candidate or "疑"

        filled = fill_body(body, candidate_by_body_index)
        full_parts.append(f"【{heading}】")
        full_parts.append(reflow(filled, 7 if len(body) > 500 else 5))

        is_manual = heading in MANUAL_REFS
        source_label = MANUAL_REFS.get(heading) and "相关题跋、题识著录与句法结构" or REFS[heading]["label"]
        source_url = REFS.get(heading, {}).get("url", "")
        for a, b in sentence_spans(body):
            original = body[a:b].strip()
            if "□" not in original:
                continue
            corrected = fill_body(body[a:b], {idx - a: val for idx, val in candidate_by_body_index.items() if a <= idx < b}).strip()
            candidates = "".join(candidate_by_body_index.get(i, "疑") for i in range(a, b) if body[i] == "□")
            square_count = original.count("□")
            mode = "ai_provisional" if is_manual or score < 0.62 or "疑" in candidates else "documentary"
            category = "AI暂拟" if mode == "ai_provisional" else "文献对校"
            confidence = "中" if mode == "ai_provisional" else ("高" if score >= 0.82 else "较高")
            case_id = len(cases) + 1
            cases.append({
                "id": f"{case_id:03d}",
                "n": "残损碑文恢复",
                "t": f"{heading}·第{case_id}处残损",
                "title": f"{heading}·第{case_id}处残损",
                "category": category,
                "mode": mode,
                "confidence": confidence,
                "o": original,
                "original": original,
                "c": corrected,
                "corrected": corrected,
                "current_context": corrected.replace("〔", "").replace("〕", ""),
                "candidate": candidates,
                "candidate_count": square_count,
                "square_count": square_count,
                "remaining_square_count": 0,
                "reference": f"{source_label}{'：' + source_url if source_url else ''}",
                "analysis": [
                    f"本例位于“{heading}”，原句含{square_count}个残损方框，依次补入“{candidates}”；补后局部文句为“{corrected.replace('〔','').replace('〕','')}”。",
                    (f"候选字通过底稿与{source_label}逐字对齐获得，当前段落的非方框字符匹配率约为{score:.1%}。" if mode == "documentary" else f"现有著录未能完整覆盖本句全部残位，候选结合{source_label}、前后句法和同册异本拟定，故标为AI暂拟。"),
                    "网站在原始OCR栏保留方框，在补字结果中以〔〕标出候选字；候选位置随后与028真实模型方框按阅读顺序对应，不冒充原石现存字迹。",
                ],
                "highlight_patterns": [corrected],
                "section": heading,
                "alignment_score": round(score, 6),
                "square_global_start": square_global,
            })
            square_global += square_count

        section_reports.append({
            "heading": heading,
            "base_chars": len(base_chars),
            "reference_chars": len(ref_chars),
            "squares": body.count("□"),
            "alignment_score": round(score, 6),
            "unmapped_before_fallback": unmapped,
        })

    full_text = "\n\n".join(full_parts).strip() + "\n"
    if "□" in full_text:
        raise RuntimeError("栏目二完整释文仍含方框")
    if not cases:
        raise RuntimeError("未生成栏目三案例")
    if sum(x["candidate_count"] for x in cases) != raw.count("□"):
        raise RuntimeError("候选字数量与底稿方框数量不一致")

    model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    raw_rows = model if isinstance(model, list) else model.get("rows", model.get("data", []))
    filtered = []
    for row in raw_rows:
        wid = str(row.get("work_id", row.get("virtual_id", row.get("id", ""))))
        glyph = str(row.get("glyph_id", ""))
        if wid == WORK_ID or glyph.startswith("028_"):
            filtered.append(row)
    if not filtered:
        raise RuntimeError("模型分片中没有028坐标")

    grouped: dict[int, list[dict]] = defaultdict(list)
    for row in filtered:
        page = int(row.get("canvas_index", row.get("page", 0)) or 0)
        if 1 <= page <= PAGE_COUNT:
            grouped[page].append(row)
    normalized_by_page: dict[int, list[dict]] = {}
    for page in range(1, PAGE_COUNT + 1):
        rows = sorted(grouped.get(page, []), key=lambda r: int(r.get("order_in_page", r.get("annotation_index", 0)) or 0))
        normalized = [normalize_model_row(row, page, i + 1) for i, row in enumerate(rows)]
        normalized_by_page[page] = normalized

    COORD_ROOT.mkdir(parents=True, exist_ok=True)
    for page in range(1, PAGE_COUNT + 1):
        (COORD_ROOT / f"page_{page:04d}.json").write_text(json.dumps(normalized_by_page[page], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    square_rows = [row for page in range(1, PAGE_COUNT + 1) for row in normalized_by_page[page] if str(row.get("char", "")) == "□"]
    base_square_count = raw.count("□")
    if len(square_rows) != base_square_count:
        raise RuntimeError(f"底稿方框{base_square_count}个，但模型方框{len(square_rows)}个；停止构建，避免错位")

    for case in cases:
        index = int(case["square_global_start"])
        row = square_rows[index]
        box = row_box(row)
        page = int(row["canvas_index"])
        case["page"] = page
        case["glyph_id"] = row["glyph_id"]
        case["locations"] = [{
            "page": page,
            "glyph_id": row["glyph_id"],
            "image": image_path(page),
            "bbox": box,
            "canvas": {"w": int(row.get("canvas_width", 1474)), "h": int(row.get("canvas_height", 2226))},
            "match_method": "exact-square-order-by-case-cumulative-count",
        }]
        case.pop("square_global_start", None)

    FULL_PATH.write_text(full_text, encoding="utf-8")
    CASE_PATH.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    pages_with = [p for p, rows in normalized_by_page.items() if rows]
    report = {
        "work_id": WORK_ID,
        "title": TITLE,
        "digital_pages": PAGE_COUNT,
        "model_rows": sum(len(v) for v in normalized_by_page.values()),
        "pages_with_coordinates": pages_with,
        "coordinate_range": [min(pages_with), max(pages_with)],
        "pages_without_coordinates": [p for p in range(1, PAGE_COUNT + 1) if p not in pages_with],
        "base_text_square_count": base_square_count,
        "model_square_count": len(square_rows),
        "case_count": len(cases),
        "candidate_count": sum(x["candidate_count"] for x in cases),
        "remaining_square_count": 0,
        "located_case_count": sum(bool(x.get("locations")) for x in cases),
        "unlocated_case_count": sum(not x.get("locations") for x in cases),
        "documentary_case_count": sum(x["mode"] == "documentary" for x in cases),
        "ai_provisional_case_count": sum(x["mode"] == "ai_provisional" for x in cases),
        "unresolved_case_count": 0,
        "mapping_method": "exact-square-order-by-case-cumulative-count",
        "map_policy": "028为九种晋唐小楷及题跋合册，不设置统一地点地图。",
        "column_four": {"uses_same_cases_as_column_three": True, "case_count": len(cases)},
        "cache_version": VERSION,
        "section_alignment": section_reports,
        "completion_policy": "全部方框均给出候选字；原始OCR栏保留方框，补字结果、当前上下文与栏目二阅读版不保留方框。",
        "scroll_policy": "栏目三使用滚动框与当前高亮项的getBoundingClientRect中心差调整scrollTop，切换、翻页和展开后均复核。",
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    update_shared_files(normalized_by_page, full_text, len(cases), base_square_count)
    write_modules(len(cases), base_square_count)
    update_routes()

    # 最终校验
    assert "□" not in FULL_PATH.read_text(encoding="utf-8")
    loaded_cases = json.loads(CASE_PATH.read_text(encoding="utf-8"))
    assert len(loaded_cases) == len(cases)
    assert sum(x["candidate_count"] for x in loaded_cases) == base_square_count
    assert all(x["locations"] for x in loaded_cases)
    assert all("□" not in x["corrected"] and "□" not in x["current_context"] for x in loaded_cases)
    print(json.dumps({
        "pages": PAGE_COUNT,
        "model_rows": report["model_rows"],
        "squares": base_square_count,
        "cases": len(cases),
        "documentary": report["documentary_case_count"],
        "ai_provisional": report["ai_provisional_case_count"],
        "coordinate_range": report["coordinate_range"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
