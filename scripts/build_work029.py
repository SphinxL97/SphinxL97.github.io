from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "029"
TITLE = "鲜于光祖墓志"
VERSION = "20260725_xianyu_v1"
RAW_PATH = ROOT / "data/work029_raw_text.txt"
TEXT_PATH = ROOT / "data/work029_full_text.txt"
CASE_PATH = ROOT / "data/work029_damage_cases.json"
REPORT_PATH = ROOT / "data/work029_coordinate_report.json"
MODEL_PATH = ROOT / "data/model_boxes/glyph_model_border_026_030.json"
PAGE_INDEX_PATH = ROOT / "data/page_images_index.json"
CATALOG_PATH = ROOT / "data/beitie_catalog.json"
HEADER_PATH = ROOT / "data/beitie_header_info.json"
ROUTER_PATH = ROOT / "js/damage_ai_reading.js"
ENTRY_PATH = ROOT / "js/detail_info_patch.js"
DETAIL_HTML = ROOT / "detail.html"

REFERENCE_URL = "https://wiki.zupulu.com/doc.php?action=view&docid=455"
META_URL = "https://www.chinakongzi.org/rmdq/chuanshi/201804/t20180403_175311.htm"
BOOK_URL = "https://www.sanmin.com.tw/product/index/005539498"

CANDIDATES = [
    ("鮮于君初自范陽□家於博。", "徙", "documentary", "文献对校", "高", "公开录文作“鲜于君初自范阳徙家于博”，可直接对应当前缺字位置。"),
    ("随□有司。", "送", "ai_provisional", "AI暂拟", "中", "按“捕得逃妇一人，随送有司”的动宾关系暂拟为“送”，未找到逐字对应的权威录文。"),
    ("願以埋銘為□。", "託", "ai_provisional", "AI暂拟", "中", "“愿以埋铭为托”在请人撰写墓志的语境中可通，现阶段仅作候选。"),
    ("令斷高□始。", "祖", "documentary", "文献对校", "高", "公开录文作“今断自君之高祖为始”，可直接对应当前缺字位置。"),
    ("□謂曰", "君", "ai_provisional", "AI暂拟", "中", "前文主语一直是鲜于君，补“君谓曰”能承接叙事，但缺少逐字录文。"),
    ("舉□者", "喪", "ai_provisional", "AI暂拟", "中", "“贫不能举丧者，往赗赙”符合墓志常见救济丧葬语境，暂拟“丧”。"),
    ("轉□許臺", "徙", "ai_provisional", "AI暂拟", "中", "“转徙许、台之间”在迁徙叙事中可通，暂拟“徙”。"),
    ("□刮險縱", "盡", "documentary", "文献对校", "高", "公开录文作“尽刮去险纵之习”，可直接对应当前缺字位置。"),
    ("視君為□之難", "", "unresolved", "暂无法判断", "低", "现有公开录文未覆盖此句，单凭“琉璃碎顽石”的上下文无法确定字形与本字。"),
    ("首辟□舉廣濟倉", "君", "ai_provisional", "AI暂拟", "中", "按“首辟君，举广济仓”理解，补“君”可形成受事对象，仍需原拓复核。"),
    ("□圍武昌", "", "unresolved", "暂无法判断", "低", "该字可能涉及军事实体或时间称谓，现有材料不足，保留方框。"),
    ("戰多□", "勳", "ai_provisional", "AI暂拟", "中", "“又无战多勋”与后文“不以簿书征输为封侯事”的自述相衔接，暂拟“勋”。"),
    ("迎□藳", "柩", "ai_provisional", "AI暂拟", "中", "丧葬语境中“迎柩，藁殡……”较为通顺，暂拟“柩”。"),
    ("□盡施於時", "不", "ai_provisional", "AI暂拟", "中", "“未衰勇退，不尽施于时”与后文“人鲜有知者”语义相承，暂拟“不”。"),
    ("吴□日阿堂", "", "unresolved", "暂无法判断", "低", "此处疑涉人名或族属称谓，方框外文字也可能有识读问题，不能仅据语境补字。"),
    ("寸折手□鯨", "搏", "ai_provisional", "AI暂拟", "低", "“手搏鲸”可构成勇烈意象，但整句识读仍不稳定，故仅列低置信度候选。"),
    ("□自太常公", "", "unresolved", "暂无法判断", "低", "此处位于盛彪所书合葬缘故开头，缺少完整对应录文，暂不补。"),
    ("奉之□汪於汴", "", "unresolved", "暂无法判断", "低", "句中除方框外仍存在疑难识读，无法可靠确定候选字。"),
    ("惟揚□土不可祔", "客", "ai_provisional", "AI暂拟", "中", "“维扬客土不可祔”符合说明异地不能合葬的语境，暂拟“客”。"),
    ("月如是，□王", "", "unresolved", "暂无法判断", "低", "册尾署记残损且方框后文字疑有误识，暂不补。"),
]

PUNCT = re.compile(r"[\s，。；：、“”‘’！？、（）《》【】—…·,.!?;:'\"()<>\[\]{}]")
VARIANT = str.maketrans({"於":"于","國":"国","與":"与","為":"为","後":"后","門":"门","書":"书","誌":"志","鮮":"鲜","陽":"阳","趙":"赵","頫":"俯","並":"并","蓋":"盖","聞":"闻","風":"风","雖":"虽","義":"义","將":"将","該":"该","學":"学","舉":"举","縱":"纵","盡":"尽","轉":"转","遷":"迁","圍":"围","勳":"勋","喪":"丧","殯":"殡","塟":"葬","祔":"附","臺":"台","許":"许","樞":"枢","亰":"京","嵗":"岁","數":"数","復":"复","從":"从","長":"长","萬":"万","無":"无","見":"见","時":"时","來":"来","終":"终","實":"实","錄":"录","讀":"读","禮":"礼","業":"业","開":"开","縣":"县","處":"处","應":"应","餘":"余","謂":"谓","責":"责","貧":"贫","舊":"旧","遠":"远","隂":"阴","屬":"属","彊":"强","淂":"得","莭":"节","汙":"污","㝎":"定"})

def norm_char(ch):
    ch = unicodedata.normalize("NFKC", ch).translate(VARIANT)
    return "" if PUNCT.fullmatch(ch) else ch

def chinese_number(n):
    digits="零一二三四五六七八九"
    if n<10:return digits[n]
    if n==10:return"十"
    if n<20:return"十"+digits[n%10]
    if n<100:return digits[n//10]+"十"+(digits[n%10] if n%10 else "")
    return str(n)

def split_cases(raw):
    parts=[p.strip() for p in re.split(r"(?<=[。！？；])",raw) if p.strip()]
    square_parts=[p for p in parts if "□" in p]
    if len(square_parts)!=len(CANDIDATES):raise RuntimeError(f"方框句数量异常：{len(square_parts)}")
    rows=[]
    for index,(part,rule) in enumerate(zip(square_parts,CANDIDATES),1):
        needle,candidate,mode,category,confidence,reason=rule
        if needle not in part:raise RuntimeError(f"第{index}例未匹配规则：{needle}")
        corrected=part.replace("□",f"〔{candidate}〕",1) if candidate else part
        reference=f"鲜于氏资料页所录《鲜于光祖墓志》相关句段：{REFERENCE_URL}" if mode=="documentary" else "用户确认底稿；墓志叙事语境与句法关系"
        rows.append({"id":str(index).zfill(3),"title":part[:34]+("……" if len(part)>34 else ""),"original":part,"candidate":candidate,"candidate_count":1 if candidate else 0,"corrected":corrected,"current_context":corrected.replace("〔","").replace("〕",""),"category":category,"mode":mode,"confidence":confidence,"square_count":1,"remaining_square_count":0 if candidate else 1,"analysis":[f"本例原句为“{part}”。"+(f"候选字为“{candidate}”，补后为“{corrected}”。" if candidate else "现阶段不强行补字，继续保留方框。"),reason,"候选字与坐标必须分别核验：文字判断来自录文或语境，bbox只在局部前后文与模型方框共同吻合时写入。"],"reference":reference,"locations":[]})
    return rows

def local_score(raw_seq,raw_pos,model_seq,model_pos,radius=14):
    b=SequenceMatcher(None,raw_seq[max(0,raw_pos-radius):raw_pos],model_seq[max(0,model_pos-radius):model_pos],autojunk=False).ratio()
    a=SequenceMatcher(None,raw_seq[raw_pos+1:raw_pos+1+radius],model_seq[model_pos+1:model_pos+1+radius],autojunk=False).ratio()
    return(b+a)/2

def map_case_locations(raw,cases,model_rows):
    raw_seq_chars=[];raw_square_positions=[]
    for ch in raw:
        n=norm_char(ch)
        if not n:continue
        if n=="□":raw_square_positions.append(len(raw_seq_chars))
        raw_seq_chars.append(n)
    raw_seq="".join(raw_seq_chars)
    rows=sorted(model_rows,key=lambda r:(int(r.get("canvas_index",0)),int(r.get("order_in_page",0))))
    model_seq="".join(norm_char(str(r.get("char",""))[:1]) or " " for r in rows)
    model_square_indices=[i for i,r in enumerate(rows) if str(r.get("char",""))[:1]=="□"]
    used=set();scores=[]
    for case,raw_pos in zip(cases,raw_square_positions):
        ranked=sorted(((local_score(raw_seq,raw_pos,model_seq,mi),mi) for mi in model_square_indices if mi not in used),reverse=True)
        if not ranked:scores.append(None);continue
        score,mi=ranked[0]
        if score<0.50:
            case["analysis"].append(f"坐标核验：最高局部前后文相似度仅{score:.3f}，未达到0.50，故不写入bbox。")
            scores.append(score);continue
        row=rows[mi];used.add(mi);page=int(row["canvas_index"])
        bbox={"x":int(row.get("x",0)),"y":int(row.get("y",0)),"w":int(row.get("w",0)),"h":int(row.get("h",0))}
        case["locations"]=[{"page":page,"glyph_id":row.get("glyph_id"),"bbox":bbox,"canvas":{"w":int(row.get("canvas_width",0)),"h":int(row.get("canvas_height",0))},"image":f"assets/page_images/029_鲜于光祖墓志/images/{page:04d}_{chinese_number(page)}.jpg","match":"local-context-verified-model-square","score":round(score,4)}]
        case["page"]=page;case["analysis"].append(f"坐标核验：第{page}页真实模型方框，局部前后文相似度{score:.3f}。");scores.append(score)
    return{"raw_sequence_length":len(raw_seq),"model_sequence_length":len(model_seq),"model_square_count":len(model_square_indices),"located_count":sum(bool(c["locations"]) for c in cases),"unlocated_count":sum(not c["locations"] for c in cases),"scores":scores}

def write_page_files(model_rows,digital_pages):
    groups=defaultdict(list)
    for row in model_rows:groups[int(row.get("canvas_index",0))].append(row)
    out_dir=ROOT/"data/glyph_boxes/iiif/029";out_dir.mkdir(parents=True,exist_ok=True)
    for page in range(1,digital_pages+1):
        rows=sorted(groups.get(page,[]),key=lambda r:int(r.get("order_in_page",0)))
        (out_dir/f"page_{page:04d}.json").write_text(json.dumps(rows,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    pages=sorted(page for page,rows in groups.items() if rows)
    return pages,sum(len(v) for v in groups.values())

def adapt_scripts():
    source=(ROOT/"js/work-028.js").read_text(encoding="utf-8")
    replacements=[("028《晋唐小楷九种》","029《鲜于光祖墓志》"),('if(workId!=="028"||window.__WORK_028_JINTANG_NINE__)return;','if(workId!=="029"||window.__WORK_029_XIANYU__)return;'),('window.__WORK_028_JINTANG_NINE__=true;','window.__WORK_029_XIANYU__=true;'),('document.documentElement.classList.add("work028-no-location-map");',''),('const TITLE="晋唐小楷九种";','const TITLE="鲜于光祖墓志";'),('const VERSION="20260725_jintang_nine_v2";',f'const VERSION="{VERSION}";'),("work028_full_text","work029_full_text"),("work028_damage_cases","work029_damage_cases"),("assets/page_images/028_晋唐小楷九种/images","assets/page_images/029_鲜于光祖墓志/images"),('const NOTE="本节页面展示释文为由AI整理阅读版。原释文中的残损方框均已给出候选字，候选字以〔〕标示；段落划分、标点和补字由AI辅助校对，仅供阅读参考。";','const NOTE="本节页面展示用户确认的阅读底稿。段落和标点由AI辅助整理；原底稿中的残损方框继续保留，候选字仅在栏目三中提出，不直接写入栏目二正文。";'),('const INTRO="本册合收九种晋唐小楷书迹。栏目三对底稿中的全部347个方框逐一给出候选字，并说明文献对校、语境判断与置信度；原始OCR栏保留方框，补字结果和当前上下文不再保留方框。栏目三与栏目四读取同一份226例案例数据。";','const INTRO="本篇底稿共标出20个残损方框，按句子整理为20例。仅在公开录文或局部语境足以支持时提出候选字；证据不足者保留方框并标记为暂无法判断。栏目三与栏目四读取同一份案例数据。";'),("work028-part-title","work029-part-title"),("work-028-cases-ready","work-029-cases-ready"),("work028Dedicated","work029Dedicated"),("work028-jintang-nine-style","work029-xianyu-style"),(".work028-part-title",".work029-part-title"),("window.__WORK_028_CROWDSOURCE_READY__","window.__WORK_029_CROWDSOURCE_READY__"),("work-028-crowdsource-ready","work-029-crowdsource-ready"),("removeLocationMap();setTimeout(removeLocationMap,120);setTimeout(removeLocationMap,700);",""),('if(!cases.length)throw new Error("028案例数据为空");','if(!cases.length)throw new Error("029案例数据为空");'),('window.__WORK_028_CONTENT_READY__=true;window.__WORK_028_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-028-stable-ready"','window.__WORK_029_CONTENT_READY__=true;window.__WORK_029_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-029-stable-ready"'),('console.error("[work-028]"','console.error("[work-029]"'),("028碑文数据读取失败","029碑文数据读取失败"),("028专属内容读取失败","029专属内容读取失败"),('.work028-no-location-map .location-card,.work028-no-location-map .map-card,.work028-no-location-map #locationCard,.work028-no-location-map #locationMapCard,.work028-no-location-map .detail-map-card{display:none!important}','')]
    for old,new in replacements:source=source.replace(old,new)
    (ROOT/"js/work-029.js").write_text(source,encoding="utf-8")
    coord=(ROOT/"js/work-028-coordinate-adapter.js").read_text(encoding="utf-8")
    coord=coord.replace("028《晋唐小楷九种》","029《鲜于光祖墓志》").replace('"028"','"029"').replace("WORK_028","WORK_029").replace("work-028","work-029").replace("jintang_nine_v2","xianyu_v1").replace("/028","/029")
    (ROOT/"js/work-029-coordinate-adapter.js").write_text(coord,encoding="utf-8")

def update_shared(model_rows):
    catalog=json.loads(CATALOG_PATH.read_text(encoding="utf-8"));item=next(x for x in catalog if x.get("id")=="029")
    item.update({"title":"鲜于光祖墓志","dynasty":"元至元二十四年前后（约1287）","script":"楷书（小楷）","creator":"周砥撰，赵孟頫书并篆盖，盛彪书合葬缘故","status":"待验收样板","subtitle":"完整阅读底稿、33页逐页真实坐标与20例残损释读已接入。","year":"约1287"})
    CATALOG_PATH.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    header=json.loads(HEADER_PATH.read_text(encoding="utf-8"));header["029"]={"source_file":"鲜于光祖墓志.txt","title":"鲜于光祖墓志","basic":{"首题":"鲜于府君墓志铭","其他题名":"鲜于府君墓志铭；赵孟頫书鲜于府君墓志铭","责任者":"周砥撰；赵孟頫书并篆盖；盛彪书合葬缘故","书体":"楷书（小楷）","版本":"陆恭旧藏明拓本","数量":"14开；碑文12开；数字化图像33页","尺寸":"册高31厘米，宽15.3厘米；帖芯高25.3厘米，宽11.5厘米","年代":"墓志书丹约元至元二十四年（1287）；合葬于元大德二年（1298）","原石地点":"浙江钱塘西次孤山之原，原石久佚","馆藏":"上海图书馆","来源":"《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年","版本说明":"此册为陆恭旧藏明拓本，赵孟頫书序铭十开，盛彪书合葬缘故二开。墓石原在浙江钱塘西次孤山之原，后不知所在。","镌刻特征":"每半开五行，每行十六七字不一。赵孟頫以小楷书写，是其现存较早的有年代线索碑刻之一。","残损统计":"用户确认底稿共标出20个残损方框，按句子整理为20例；有依据者提出候选，证据不足者保留方框。"}}
    HEADER_PATH.write_text(json.dumps(header,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    index=json.loads(PAGE_INDEX_PATH.read_text(encoding="utf-8"));groups=defaultdict(list)
    for row in model_rows:groups[int(row.get("canvas_index",0))].append(row)
    for page in index["works"]["029"]["pages"]:
        rows=sorted(groups.get(int(page["page"]),[]),key=lambda r:int(r.get("order_in_page",0)));chars=[str(r.get("char",""))[:1] for r in rows]
        page.update({"text_clean":"".join(chars),"text_raw":"\n".join(chars),"char_count":len(chars),"has_char_boxes":bool(rows)})
    PAGE_INDEX_PATH.write_text(json.dumps(index,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    router=ROUTER_PATH.read_text(encoding="utf-8").replace("__DAMAGE_AI_READING_ROUTER_V66__","__DAMAGE_AI_READING_ROUTER_V67__",1)
    route_block='''    "028":[
      {src:"js/work-028-coordinate-adapter.js?v=20260725_jintang_nine_v2",key:"w028c",ready:()=>Boolean(window.__WORK_028_COORDINATE_ADAPTER__)},
      {src:"js/work-028.js?v=20260725_jintang_nine_v2",key:"w028",ready:()=>Boolean(window.__WORK_028_STABLE_READY__&&window.__WORK_028_CROWDSOURCE_READY__)}
    ]'''
    new_block=route_block+''',
    "029":[
      {src:"js/work-029-coordinate-adapter.js?v=20260725_xianyu_v1",key:"w029c",ready:()=>Boolean(window.__WORK_029_COORDINATE_ADAPTER__)},
      {src:"js/work-029.js?v=20260725_xianyu_v1",key:"w029",ready:()=>Boolean(window.__WORK_029_STABLE_READY__&&window.__WORK_029_CROWDSOURCE_READY__)}
    ]'''
    if '"029":[' not in router:router=router.replace(route_block,new_block)
    router=router.replace('"028":"晋唐小楷九种"}','"028":"晋唐小楷九种","029":"鲜于光祖墓志"').replace('"027","028"].includes(id)','"027","028","029"].includes(id)')
    ROUTER_PATH.write_text(router,encoding="utf-8")
    entry=ENTRY_PATH.read_text(encoding="utf-8").replace("__DETAIL_INFO_STABLE_ENTRY_V25__","__DETAIL_INFO_STABLE_ENTRY_V26__",1).replace("20260725_jintang_nine_v2",VERSION).replace('"028":"晋唐小楷九种"}','"028":"晋唐小楷九种","029":"鲜于光祖墓志"').replace('"026","027","028"].includes(workId)','"026","027","028","029"].includes(workId)')
    ENTRY_PATH.write_text(entry,encoding="utf-8")
    DETAIL_HTML.write_text(DETAIL_HTML.read_text(encoding="utf-8").replace("20260725_jintang_nine_v2",VERSION),encoding="utf-8")

def main():
    raw=RAW_PATH.read_text(encoding="utf-8").strip()+"\n"
    if raw.count("□")!=20:raise RuntimeError(f"原底稿方框数应为20，实际{raw.count('□')}")
    cases=split_cases(raw);model_all=json.loads(MODEL_PATH.read_text(encoding="utf-8"));model_rows=[r for r in model_all if str(r.get("work_id"))==WORK_ID]
    if not model_rows:raise RuntimeError("汇总模型文件中未找到029")
    pages,model_count=write_page_files(model_rows,33);mapping=map_case_locations(raw,cases,model_rows)
    TEXT_PATH.write_text(raw,encoding="utf-8");CASE_PATH.write_text(json.dumps(cases,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    report={"work_id":WORK_ID,"title":TITLE,"digital_pages":33,"model_rows":model_count,"pages_with_coordinates":pages,"coordinate_range":[min(pages),max(pages)] if pages else [],"pages_without_coordinates":[p for p in range(1,34) if p not in pages],"base_text_square_count":raw.count("□"),"model_square_count":mapping["model_square_count"],"case_count":len(cases),"candidate_count":sum(c["candidate_count"] for c in cases),"remaining_square_count":sum(c["remaining_square_count"] for c in cases),"documentary_case_count":sum(c["mode"]=="documentary" for c in cases),"ai_provisional_case_count":sum(c["mode"]=="ai_provisional" for c in cases),"unresolved_case_count":sum(c["mode"]=="unresolved" for c in cases),"located_case_count":mapping["located_count"],"unlocated_case_count":mapping["unlocated_count"],"mapping_method":"local-before-after-context-to-real-model-square; no nth-square forced binding","raw_sequence_length":mapping["raw_sequence_length"],"model_sequence_length":mapping["model_sequence_length"],"column_four":{"uses_same_cases_as_column_three":True,"case_count":len(cases)},"cache_version":VERSION,"main_base_sha_at_start":"1e713e59e9429a7cffa3e626d88647cdc5042cff","reference_sources":[{"title":"鲜于氏资料页所录《鲜于光祖墓志》片段","url":REFERENCE_URL},{"title":"中国孔子网赵孟頫碑刻传承研究","url":META_URL},{"title":"《鲜于光祖墓志》图录著录","url":BOOK_URL}],"text_policy":"栏目二保存用户确认底稿，20个方框原样保留；候选字只进入栏目三/四案例JSON。","coordinate_policy":"只有局部前后文相似度达到0.50且目标模型字符本身为方框时写入bbox；未通过者不定位。"}
    REPORT_PATH.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8");adapt_scripts();update_shared(model_rows)
    assert raw.count("□")==20 and len(cases)==20 and sum(c["square_count"] for c in cases)==20 and sum(c["candidate_count"]+c["remaining_square_count"] for c in cases)==20 and all(c["analysis"] for c in cases)
    print(json.dumps({"pages":33,"model_rows":model_count,"model_squares":mapping["model_square_count"],"cases":len(cases),"candidates":sum(c["candidate_count"] for c in cases),"unresolved":sum(c["remaining_square_count"] for c in cases),"located":mapping["located_count"],"unlocated":mapping["unlocated_count"]},ensure_ascii=False))

if __name__=="__main__":main()
