#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "026"
TITLE = "麻姑山仙坛记"
FOLDER = "026_麻姑山仙坛记"
VERSION = "20260724_magushan_v1"
IMAGE_ROOT = f"assets/page_images/{FOLDER}/images"
PAGE_COUNT = 65

PUNCT = set(" \t\r\n，。；：！？、,.!?;:（）()【】[]《》〈〉“”‘’『』「」—－…·\"'")
CANON = str.maketrans({
    "暦": "历", "於": "于", "顏": "颜", "卿": "卿", "經": "经", "傳": "传", "遠": "远",
    "來": "来", "見": "见", "東": "东", "國": "国", "萬": "万", "後": "后", "時": "时",
    "爲": "为", "為": "为", "與": "与", "無": "无", "餘": "余", "髮": "发", "觀": "观",
    "顯": "显", "應": "应", "靈": "灵", "龍": "龙", "雲": "云", "書": "书", "縣": "县",
    "壇": "坛", "記": "记", "撰": "撰", "並": "并", "從": "从", "門": "门", "聲": "声",
    "華": "华", "實": "实", "則": "则", "夢": "梦", "絕": "绝", "續": "续", "圖": "图",
    "禮": "礼", "義": "义", "節": "节", "壽": "寿", "邊": "边", "嶺": "岭", "餚": "肴"
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


def normalize_text(text: str) -> str:
    return "".join(ch.translate(CANON) for ch in str(text) if ch not in PUNCT)


def extract_records(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "rows", "items", "data", "glyphs"):
            if isinstance(data.get(key), list):
                return data[key]
        candidates = [value for value in data.values() if isinstance(value, list)]
        if candidates:
            return max(candidates, key=len)
    raise RuntimeError("无法识别026—030汇总坐标结构")


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


def row_char(row: dict) -> str:
    return str(row.get("char") or row.get("text") or row.get("recognized_char") or row.get("label") or "")[:1]


def belongs(row: dict) -> bool:
    values = [row.get(key) for key in ("work_id", "virtual_id", "work", "work_title", "folder", "work_folder")]
    return any(str(value or "").startswith("026") or "026_" in str(value or "") for value in values)


def normalize_rows(raw_rows: list, page_index: list[dict]) -> dict[int, list[dict]]:
    groups: dict[int, list[dict]] = defaultdict(list)
    images = {int(item.get("page") or item.get("canvas_index") or index + 1): item.get("image", "") for index, item in enumerate(page_index)}
    labels = {int(item.get("page") or item.get("canvas_index") or index + 1): item.get("label", chinese_number(index + 1)) for index, item in enumerate(page_index)}

    for raw in raw_rows:
        if not isinstance(raw, dict) or not belongs(raw):
            continue
        page = int(num(raw, "canvas_index", "page", "page_no", "page_number", default=0))
        if page < 1 or page > PAGE_COUNT:
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
            "work_title": TITLE,
            "canvas_index": page,
            "canvas_label": labels.get(page, chinese_number(page)),
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
            "bbox_source": str(raw.get("bbox_source") or raw.get("source") or "model_border_refined"),
            "source": str(raw.get("source") or raw.get("bbox_source") or "model_border_refined"),
            "local_image": images.get(page, f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg")
        })
        groups[page].append(row)

    for page, rows in groups.items():
        rows.sort(key=lambda item: (int(item.get("order_in_page", 0)), float(item.get("x", 0)), float(item.get("y", 0))))
        for index, row in enumerate(rows, 1):
            row["order_in_page"] = index
            row["annotation_index"] = index
            row["glyph_id"] = str(row.get("glyph_id") or f"{FOLDER}_p{page:04d}_c{index:03d}")
    return groups


def update_catalog() -> None:
    path = ROOT / "data/beitie_catalog.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    item = next(record for record in data if str(record.get("id")) == WORK_ID)
    item.update({
        "title": TITLE,
        "dynasty": "唐大历六年四月（771）",
        "script": "楷书",
        "creator": "颜真卿撰并书",
        "status": "完整样板",
        "subtitle": "完整释文、65页逐页真实坐标已接入；本篇无残损补字案例。",
        "year": "771"
    })
    dump(path, data)


def update_header() -> None:
    path = ROOT / "data/beitie_header_info.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data[WORK_ID] = {
        "source_file": "麻姑山仙坛记.txt",
        "title": TITLE,
        "basic": {
            "首题": "有唐抚州南城县麻姑山仙坛记",
            "其他题名": "麻姑仙坛记；大字麻姑仙坛记",
            "责任者": "颜真卿撰并书",
            "书体": "楷书",
            "版本": "宋拓“宋精刻大字本”",
            "数量": "30开",
            "尺寸": "册高37.6厘米，宽23.1厘米；碑文二十六开，帖芯高26.7厘米，宽16.1厘米",
            "刻立年代": "唐大历六年四月（771）",
            "刻立地点": "唐抚州南城县麻姑山仙坛",
            "馆藏": "上海图书馆",
            "来源": "《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第三辑，上海图书馆，上海古籍出版社，2012年",
            "版本说明": "本册为宋拓“宋精刻大字本”，装裱三十开，其中碑文二十六开；数字化图像共六十五页，数字化页数与装裱开数属于不同计数口径。",
            "镌刻特征": "碑文字径约五厘米，世称“大字麻姑仙坛记”，以区别字径较小的“小字麻姑仙坛记”。全文由颜真卿撰并书，前半引葛洪《神仙传》叙王方平、蔡经与麻姑故事，后半记麻姑山形胜、邓紫阳事迹及颜真卿刻石缘起。"
        }
    }
    dump(path, data)


def update_page_index(groups: dict[int, list[dict]]) -> list[dict]:
    path = ROOT / "data/page_images_index.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    work = data["works"][WORK_ID]
    work["title"] = TITLE
    pages = work.get("pages", [])
    if len(pages) != PAGE_COUNT:
        raise RuntimeError(f"026图像索引页数异常：{len(pages)}")
    for index, page in enumerate(pages, 1):
        page_no = int(page.get("page") or page.get("canvas_index") or index)
        rows = groups.get(page_no, [])
        chars = [row_char(row) for row in rows]
        page["text_clean"] = "".join(chars)
        page["text_raw"] = "\n".join(chars)
        page["char_count"] = len(chars)
        page["has_char_boxes"] = bool(chars)
    dump(path, data)
    return pages


def write_coordinates(groups: dict[int, list[dict]]) -> None:
    target = ROOT / "data/glyph_boxes/iiif/026"
    target.mkdir(parents=True, exist_ok=True)
    for page in range(1, PAGE_COUNT + 1):
        dump(target / f"page_{page:04d}.json", groups.get(page, []))


def write_coordinate_adapter() -> None:
    content = r'''/* 026《麻姑山仙坛记》栏目一逐页真实坐标适配。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="026"||window.__WORK_026_COORDINATE_ADAPTER__)return;
  const CACHE_TAG="__VERSION__";
  const ROOT="data/glyph_boxes/iiif/026";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function rect(row){return {x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)};}
  function normalizeRow(row,page,index){
    const box=rect(row);if(box.w<=0||box.h<=0)return null;
    const pageNo=Number(row.canvas_index||row.page||page||0);if(!pageNo)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {...row,work_id:"026",canvas_index:pageNo,glyph_id:String(row.glyph_id||`026_${pageNo}_${index+1}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]};
  }
  async function fetchRows(page){
    const pageNo=Number(page||0);if(!pageNo)return [];
    if(pagePromises.has(pageNo))return pagePromises.get(pageNo);
    const promise=(async()=>{
      const url=`${ROOT}/page_${String(pageNo).padStart(4,"0")}.json?v=${CACHE_TAG}`;
      let lastError=null;
      for(let attempt=1;attempt<=3;attempt+=1){
        try{
          const response=await fetch(url,{cache:attempt===1?"force-cache":"reload"});
          if(response.status===404)return [];
          if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
          const rows=await response.json();
          return (Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);
        }catch(error){lastError=error;if(attempt<3)await sleep(350*attempt);}
      }
      throw lastError||new Error("026坐标读取失败");
    })().catch(error=>{pagePromises.delete(pageNo);console.warn("[work-026-coordinate-adapter]",pageNo,error);return [];});
    pagePromises.set(pageNo,promise);return promise;
  }
  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="026")return original?original(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(await fetchRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };
  window.WORK_026_COORDINATES={loadPageRows:fetchRows};
  window.__WORK_026_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-026-coordinate-adapter-ready"));
})();
'''.replace("__VERSION__", VERSION)
    (ROOT / "js/work-026-coordinate-adapter.js").write_text(content, encoding="utf-8")


def write_work_script() -> None:
    content = r'''/* 026《麻姑山仙坛记》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="026"||window.__WORK_026_MAGUSHAN__)return;
  window.__WORK_026_MAGUSHAN__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="麻姑山仙坛记";
  const VERSION="__VERSION__";
  const TEXT_URL=`data/work026_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work026_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const EMPTY_TEXT="本篇用户底稿未标出可进入释读的残损方框或疑难字，暂不建立AI补字案例。";
  const escapeHTML=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");

  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  function paragraphHTML(text){
    const normalized=String(text||"").replaceAll("\r\n","\n").replaceAll("\r","\n");
    return normalized.split("\n\n").map(part=>part.trim()).filter(Boolean).map(part=>`<p>${escapeHTML(part)}</p>`).join("");
  }
  function renderTranscript(text){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div></div>`;
  }
  function renderDamageEmpty(){
    const section=document.getElementById("people");if(!section)return;
    setMenuTitle(3,"三、碑文残损与AI释读");
    section.className="content-card damage-ai work026-empty-damage";
    section.dataset.work026Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">本栏目仅处理用户底稿中明确出现的残损方框或疑难字。</p><div class="damage-shell"><div class="work026-empty-card"><b>本篇暂无残损补字案例</b><p>${EMPTY_TEXT}</p></div></div>`;
  }
  function renderCrowdsourceEmpty(){
    const panel=document.querySelector('#places [data-panel="missingText"]');
    if(!panel)return false;
    panel.dataset.work026Empty="true";
    panel.innerHTML=`<div class="work026-crowd-empty"><b>本篇暂无AI补字案例</b><p>栏目三没有残损补字案例。您仍可使用“释文校订”和“标点校订”两个页签提交意见。</p></div>`;
    return true;
  }
  function ensureStyle(){
    if(document.getElementById("work026-magushan-style"))return;
    const style=document.createElement("style");
    style.id="work026-magushan-style";
    style.textContent=".work026-empty-card,.work026-crowd-empty{margin:18px;padding:34px;border:1px dashed #d8c69f;border-radius:16px;background:#fffaf0;text-align:center;color:#756755}.work026-empty-card b,.work026-crowd-empty b{display:block;margin-bottom:10px;color:#8b2e24;font-size:18px}.work026-empty-card p,.work026-crowd-empty p{margin:0;line-height:1.9}.work026-empty-damage .damage-shell{padding:1px}";
    document.head.appendChild(style);
  }
  function publishEmptyCases(){
    window.DAMAGE_AI_CASES=[];
    window.dispatchEvent(new CustomEvent("work-026-cases-ready",{detail:{count:0}}));
  }
  function finishCrowdsource(){
    renderCrowdsourceEmpty();
    window.__WORK_026_CROWDSOURCE_READY__=true;
    window.dispatchEvent(new CustomEvent("work-026-crowdsource-ready",{detail:{count:0}}));
  }
  function ensureCrowdsource(){
    return new Promise(resolve=>{
      const stylePath="assets/css/crowdsource-v9.css";
      if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){
        const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);
      }
      const done=()=>{finishCrowdsource();resolve(true);};
      if(window.__CROWDSOURCE_MISSING_V10__){done();return;}
      const scriptPath="assets/js/crowdsource-v9.js";
      const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath));
      if(existing){existing.addEventListener("load",done,{once:true});requestAnimationFrame(done);return;}
      const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",done,{once:true});script.addEventListener("error",done,{once:true});document.head.appendChild(script);
    });
  }
  async function init(){
    ensureStyle();
    publishEmptyCases();
    try{
      const [text,rows]=await Promise.all([fetchText(TEXT_URL),fetchJSON(CASE_URL)]);
      if(!Array.isArray(rows)||rows.length!==0)throw new Error("026案例文件应为空数组");
      renderTranscript(text);
      renderDamageEmpty();
      await ensureCrowdsource();
      window.__WORK_026_CONTENT_READY__=true;
      window.__WORK_026_STABLE_READY__=true;
      window.dispatchEvent(new CustomEvent("work-026-content-ready",{detail:{count:0}}));
      window.dispatchEvent(new CustomEvent("work-026-stable-ready",{detail:{cases:0}}));
    }catch(error){
      console.error("[work-026]",error);
      const transcript=document.getElementById("calligraphy"),damage=document.getElementById("people");
      if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">026碑文数据读取失败，请刷新页面后重试。</div>';
      if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">026专属内容读取失败，请刷新页面后重试。</div>';
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
'''.replace("__VERSION__", VERSION)
    (ROOT / "js/work-026.js").write_text(content, encoding="utf-8")


def patch_routes() -> None:
    path = ROOT / "js/damage_ai_reading.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("if(window.__DAMAGE_AI_READING_ROUTER_V64__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V64__=true;", "if(window.__DAMAGE_AI_READING_ROUTER_V65__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V65__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V64__=true;", 1)
    old = '''    "025":[\n      {src:"js/work-025-coordinate-adapter.js?v=20260724_shengjiaoxu_v1",key:"w025c",ready:()=>Boolean(window.__WORK_025_COORDINATE_ADAPTER__)},\n      {src:"js/work-025.js?v=20260724_shengjiaoxu_v1",key:"w025",ready:()=>Boolean(window.__WORK_025_STABLE_READY__&&window.__WORK_025_CROWDSOURCE_READY__)}\n    ]\n'''
    new = old[:-1] + ''',\n    "026":[\n      {src:"js/work-026-coordinate-adapter.js?v=20260724_magushan_v1",key:"w026c",ready:()=>Boolean(window.__WORK_026_COORDINATE_ADAPTER__)},\n      {src:"js/work-026.js?v=20260724_magushan_v1",key:"w026",ready:()=>Boolean(window.__WORK_026_STABLE_READY__&&window.__WORK_026_CROWDSOURCE_READY__)}\n    ]\n'''
    if old not in text:
        raise RuntimeError("damage_ai_reading.js中未找到025路由块")
    text = text.replace(old, new, 1)
    text = text.replace('"025":"集王羲之书三藏圣教序"};', '"025":"集王羲之书三藏圣教序","026":"麻姑山仙坛记"};', 1)
    text = text.replace('["007","010","011","013","014","015","016","017","018","020","022","023","024","025"]', '["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026"]')
    path.write_text(text, encoding="utf-8")

    path = ROOT / "js/detail_info_patch.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("if(window.__DETAIL_INFO_STABLE_ENTRY_V23__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;", "if(window.__DETAIL_INFO_STABLE_ENTRY_V24__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V24__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;", 1)
    text = re.sub(r'const dataUrl="data/beitie_header_info\.json\?v=[^"]+";', f'const dataUrl="data/beitie_header_info.json?v={VERSION}";', text, count=1)
    text = text.replace('const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序"};', 'const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序","026":"麻姑山仙坛记"};', 1)
    text = text.replace('["007","010","011","013","014","015","016","017","018","020","022","023","024","025"]', '["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026"]')
    text = re.sub(r'script\.src="js/damage_ai_reading\.js\?v=[^"]+";', f'script.src="js/damage_ai_reading.js?v={VERSION}";', text, count=1)
    path.write_text(text, encoding="utf-8")

    path = ROOT / "detail.html"
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'js/detail_info_patch\.js\?v=[^"<]+', f'js/detail_info_patch.js?v={VERSION}', text)
    text = re.sub(r'js/damage_ai_reading\.js\?v=[^"<]+', f'js/damage_ai_reading.js?v={VERSION}', text)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    page_path = ROOT / "data/page_images_index.json"
    page_data = json.loads(page_path.read_text(encoding="utf-8"))
    pages = page_data["works"][WORK_ID]["pages"]
    raw_data = json.loads((ROOT / "data/model_boxes/glyph_model_border_026_030.json").read_text(encoding="utf-8"))
    groups = normalize_rows(extract_records(raw_data), pages)
    if not groups:
        raise RuntimeError("汇总模型中未筛选到026坐标")

    write_coordinates(groups)
    update_page_index(groups)
    update_catalog()
    update_header()
    dump(ROOT / "data/work026_damage_cases.json", [])
    write_coordinate_adapter()
    write_work_script()
    patch_routes()

    full_text = (ROOT / "data/work026_full_text.txt").read_text(encoding="utf-8")
    model_sequence = "".join(row_char(row) for page in sorted(groups) for row in groups[page])
    normalized_text = normalize_text(full_text)
    normalized_model = normalize_text(model_sequence)
    ratio = SequenceMatcher(None, normalized_text, normalized_model, autojunk=False).ratio()
    pages_with = sorted(page for page, rows in groups.items() if rows)
    pages_without = [page for page in range(1, PAGE_COUNT + 1) if page not in set(pages_with)]
    report = {
        "work_id": WORK_ID,
        "title": TITLE,
        "digital_pages": PAGE_COUNT,
        "binding_openings": 30,
        "model_glyph_count": sum(len(rows) for rows in groups.values()),
        "base_text_comparable_characters": len(normalized_text),
        "model_sequence_characters": len(normalized_model),
        "sequence_similarity": round(ratio, 6),
        "coordinate_pages": pages_with,
        "coordinate_page_range": [min(pages_with), max(pages_with)] if pages_with else [],
        "pages_without_coordinates": pages_without,
        "original_image_only_pages": pages_without,
        "base_text_square_count": full_text.count("□"),
        "ascii_question_mark_count": full_text.count("?"),
        "chinese_question_mark_count": full_text.count("？"),
        "damage_case_count": 0,
        "candidate_character_count": 0,
        "remaining_unresolved_square_count": 0,
        "located_case_count": 0,
        "unlocated_cases": [],
        "column_four": {
            "uses_same_case_file_as_column_three": True,
            "case_file": "data/work026_damage_cases.json",
            "case_count": 0,
            "empty_state": "本篇暂无AI补字案例"
        },
        "runtime_coordinate_policy": "逐页读取data/glyph_boxes/iiif/026/page_NNNN.json，不在页面运行时扫描汇总坐标。"
    }
    dump(ROOT / "data/work026_coordinate_report.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
