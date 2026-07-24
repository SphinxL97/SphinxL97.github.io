from pathlib import Path
import json,re
from collections import defaultdict

R=Path("."); W="022"; T="王居士砖塔铭"; V="20260724_wangjushi_v1"; N=29
IR="assets/page_images/022_王居士砖塔铭/images"

def cn(n):
 d="零一二三四五六七八九"
 if n<10:return d[n]
 if n==10:return "十"
 if n<20:return "十"+d[n%10]
 return d[n//10]+"十"+(d[n%10] if n%10 else "")
def img(p): return f"{IR}/{p:04d}_{cn(p)}.jpg"

text=(R/"data/work022_full_text.txt").read_text("utf-8")
cases=json.loads((R/"data/work022_damage_cases.json").read_text("utf-8"))
assert text.count("□")==9 and len(cases)==9
assert sum(x["square_count"] for x in cases)==9
assert sum(x["candidate_count"] for x in cases)==9
assert all("□" not in x["corrected"] for x in cases)

src=R/"data/model_boxes/glyph_model_border_021_025.json"
rows=json.loads(src.read_text("utf-8"))
rows=[dict(x) for x in rows if str(x.get("work_id","")).startswith("022") or str(x.get("work_index",""))=="22"]
rows.sort(key=lambda x:(int(x.get("canvas_index") or x.get("page") or 0),int(x.get("order_in_page") or x.get("annotation_index") or 0)))
if not rows: raise SystemExit("no 022 model rows")

def num(x,*ks):
 for k in ks:
  if x.get(k) is not None:
   try:return float(x[k])
   except:pass
 b=x.get("bbox")
 if isinstance(b,list) and len(b)>=4:
  m={"x":0,"y":1,"w":2,"h":3}
  for k in ks:
   if k in m:
    try:return float(b[m[k]])
    except:pass
 return 0.0

norm=[]; by=defaultdict(list)
for j,x in enumerate(rows,1):
 p=int(x.get("canvas_index") or x.get("page") or 0)
 if not 1<=p<=N: continue
 o=int(x.get("order_in_page") or x.get("annotation_index") or j)
 ch=str(x.get("char") or x.get("text") or "")[:1]
 xx=num(x,"bbox_x","x","display_x","model_x"); yy=num(x,"bbox_y","y","display_y","model_y")
 ww=num(x,"bbox_w","w","display_w","model_w"); hh=num(x,"bbox_h","h","display_h","model_h")
 y=dict(x); y.update({
  "glyph_id":str(x.get("glyph_id") or f"022_王居士砖塔铭_p{p:04d}_c{o:03d}"),
  "char":ch,"text":ch,"work_id":"022","work_index":22,"work_title":T,
  "canvas_index":p,"canvas_label":str(x.get("canvas_label") or cn(p)),
  "order_in_page":o,"annotation_index":o,
  "canvas_width":int(float(x.get("canvas_width") or 0)),
  "canvas_height":int(float(x.get("canvas_height") or 0)),
  "local_image":img(p),"bbox_x":xx,"bbox_y":yy,"bbox_w":ww,"bbox_h":hh,
  "bbox":[xx,yy,ww,hh],"bbox_xywh":[xx,yy,ww,hh],
  "bbox_source":str(x.get("bbox_source") or x.get("source") or "model_border_refined")
 })
 norm.append(y);by[p].append(y)
norm.sort(key=lambda x:(x["canvas_index"],x["order_in_page"]))
out=R/"data/glyph_boxes/iiif/022";out.mkdir(parents=True,exist_ok=True)
for p in range(1,N+1):
 z=sorted(by.get(p,[]),key=lambda x:x["order_in_page"])
 (out/f"page_{p:04d}.json").write_text(json.dumps(z,ensure_ascii=False,indent=2)+"\n","utf-8")

tr=str.maketrans("靈製書塼磚銘啚圖豈煩覽墳勵覺顯慶將葉婦徳貞規終於扵亰苐収寳峯㽞刋㢤莭剋頋脩巋欽欎逺潁寛夲顦顇䖏曰",
                 "灵制书砖砖铭图图岂烦览坟励觉显庆将叶妇德贞规终于于京第收宝峰留刊哉节克顾修岿钦郁远颖宽本憔悴处日")
pun=re.compile(r"[\s，。；：？！、“”‘’（）()《》〈〉·—…\[\]〔〕]")
def nt(s): return pun.sub("",str(s)).translate(tr)
stream=[nt(x["char"])[:1] for x in norm]

def locate(orig,cand,start):
 s=nt(orig); q=s.index("□"); left,right=s[:q],s[q+1:]; c=nt(cand)[:1]; opts=[]
 for i in range(start,len(norm)):
  b=a=0;score=0.0
  for k in range(1,min(14,len(left),i)+1):
   if stream[i-k]==left[-k]:b+=1;score+=1.5/(1+(k-1)*.12)
  for k in range(min(14,len(right),len(norm)-i-1)):
   if stream[i+1+k]==right[k]:a+=1;score+=1.5/(1+k*.12)
  if norm[i]["char"]=="□":score+=4
  elif stream[i]==c:score+=2
  if b+a>=3:opts.append((score,b+a,i))
 if not opts:return None
 opts.sort(reverse=True);score,m,i=opts[0]; second=opts[1][0] if len(opts)>1 else 0
 poss=min(14,len(left))+min(14,len(right)); ratio=m/poss if poss else 0
 square=norm[i]["char"]=="□"
 if m<(3 if square else 5) or ratio<(.20 if square else .34):return None
 return i,ratio,score-second

prev=0; locs=[]; missing=[]
for c in cases:
 hit=locate(c["original"],c["candidate"],prev)
 c["locations"]=[]
 if hit:
  i,ratio,margin=hit;prev=i+1;x=norm[i];p=x["canvas_index"]
  L={"page":p,"glyph_id":x["glyph_id"],"canvas":{"w":x["canvas_width"],"h":x["canvas_height"]},
     "bbox":{"x":x["bbox_x"],"y":x["bbox_y"],"w":x["bbox_w"],"h":x["bbox_h"]},
     "image":img(p),"bbox_source":x["bbox_source"],"match_method":"context-sequence",
     "alignment_score":round(ratio,4),"uniqueness_margin":round(margin,4),
     "target_char_in_model":x["char"]}
  c["page"]=p;c["locations"]=[L];locs.append({"id":c["id"],**L})
 else:c["page"]="—";missing.append(c["id"])
(R/"data/work022_damage_cases.json").write_text(json.dumps(cases,ensure_ascii=False,indent=2)+"\n","utf-8")

pages=sorted(by); image_only=[p for p in range(1,N+1) if p not in pages]
report={"work_id":W,"title":T,"page_count":N,"status":"two-inscriptions-complete-candidates-v1",
 "source_files":[str(src).replace("\\","/")],"model_rows":len(norm),
 "model_square_count":sum(x["char"]=="□" for x in norm),"text_square_count":9,"covered_square_count":9,
 "candidate_count":9,"remaining_square_count":0,"case_count":9,
 "located_cases":9-len(missing),"unlocated_cases":missing,"coordinate_pages":pages,
 "image_only_pages":image_only,"coordinate_range":[min(pages),max(pages)] if pages else [],
 "classification_summary":{"documentary":[x["id"] for x in cases if x["mode"]=="documentary"],"mixed":[],
  "ai_provisional":[x["id"] for x in cases if x["mode"]=="ai_provisional"],"unresolved":[]},
 "case_locations":locs,
 "restoration_policy":"栏目二保留原始9个方框；栏目三与栏目四为每个方框提供候选字，恢复结果不保留方框。",
 "coordinate_policy":"只使用021—025汇总模型中的022真实记录；无法可靠定位时保留空locations，不以邻字或虚构bbox代替。"}
(R/"data/work022_coordinate_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")

P=R/"data/page_images_index.json";data=json.loads(P.read_text("utf-8"));w=data["works"]["022"]
w["title"]=T;w["cover"]=img(1)
for p in w["pages"]:
 n=int(p["page"]);z=sorted(by.get(n,[]),key=lambda x:x["order_in_page"])
 p.update({"image":img(n),"text_clean":"".join(x["char"] for x in z),"text_raw":"".join(x["char"] for x in z),
           "char_count":len(z),"has_char_boxes":bool(z)})
 if z:p["canvas_width"]=z[0]["canvas_width"];p["canvas_height"]=z[0]["canvas_height"]
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf-8")

P=R/"data/beitie_catalog.json";data=json.loads(P.read_text("utf-8"));r=next(x for x in data if str(x["id"]).zfill(3)=="022")
r.update({"title":T,"dynasty":"唐显庆三年（658）","year":"658","script":"楷书",
 "creator":"上官灵芝制文，敬客书","status":"完整样板",
 "subtitle":"两篇合装塔铭、逐页释文、残损释读与单字定位已接入。"})
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf-8")

P=R/"data/beitie_header_info.json";data=json.loads(P.read_text("utf-8"));h=data["022"];h["title"]=T;b=h["basic"]
b.update({"首题":"大唐王居士塼塔之銘","其他题名":"王居士砖塔铭；王孝宽铭；夫人程氏塔铭（合装）",
 "责任者":"上官灵芝制文，敬客书","书体":"楷书","刻立年代":"唐显庆三年（658）",
 "版本说明":"本册为明末清初拓本，与《程夫人塔铭》合装。栏目二分别展示《大唐王居士塼塔之铭》与《夫人程氏塔铭》两篇文字。",
 "镌刻特征":"《王居士塼塔之铭》记王孝宽家世、佛教信仰、卒年及显庆三年收骸建塔之事；册中另合装《夫人程氏塔铭》。"})
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n","utf-8")

base=(R/"js/work-020.js").read_text("utf-8")
js=base.replace("020","022").replace("化度寺邕禅师舍利塔铭",T).replace("HUADUSI","WANGJUSHI").replace("huadusi_v2","wangjushi_v1")
js=js.replace('const INTRO="本栏目对原释文中的残损位置逐例释读。能够可靠判断者给出候选字；只能确定部分位置时，其余方框继续保留；现有证据不足时显示“暂未恢复”，不为追求句意完整而强行补字。";',
'const INTRO="本栏目对两篇合装塔铭中的九处残损位置逐例释读。原始识别保留方框，文献对校或AI暂拟结果为每一处给出候选字；低置信度表示仍需人工复核。";')
js=js.replace('/^(碑额|碑阳|碑阴)　/.test(part)?`<h4 class="work022-part-title">${esc(part)}</h4>`',
'/^(（一）|（二）|碑额|碑阳|碑阴)/.test(part)?`<h4 class="work022-part-title">${esc(part)}</h4>`')
js=js.replace('style.textContent=".damage-heading-confidence',
'style.textContent=".work022-part-title{margin:22px 0 10px;color:#8b2e24;font-family:\"SimSun\",serif;font-size:21px}.damage-heading-confidence')
(R/"js/work-022.js").write_text(js,"utf-8")
a=(R/"js/work-020-coordinate-adapter.js").read_text("utf-8").replace("020","022").replace("化度寺邕禅师舍利塔铭",T).replace("HUADUSI","WANGJUSHI").replace("huadusi_v2","wangjushi_v1")
(R/"js/work-022-coordinate-adapter.js").write_text(a,"utf-8")

P=R/"js/damage_ai_reading.js";s=P.read_text("utf-8")
s=s.replace("018、020使用单一专属模块","018、020、022使用单一专属模块").replace("__DAMAGE_AI_READING_ROUTER_V59__","__DAMAGE_AI_READING_ROUTER_V60__")
old='''    "020":[
      {src:"js/work-020-coordinate-adapter.js?v=20260724_huadusi_v2",key:"w020c",ready:()=>Boolean(window.__WORK_020_COORDINATE_ADAPTER__)},
      {src:"js/work-020.js?v=20260724_huadusi_v2",key:"w020",ready:()=>Boolean(window.__WORK_020_STABLE_READY__)}
    ]'''
new=old+''',
    "022":[
      {src:"js/work-022-coordinate-adapter.js?v=20260724_wangjushi_v1",key:"w022c",ready:()=>Boolean(window.__WORK_022_COORDINATE_ADAPTER__)},
      {src:"js/work-022.js?v=20260724_wangjushi_v1",key:"w022",ready:()=>Boolean(window.__WORK_022_STABLE_READY__)}
    ]'''
if old not in s:raise SystemExit("route anchor missing")
s=s.replace(old,new,1).replace('"020":"化度寺邕禅师舍利塔铭"};','"020":"化度寺邕禅师舍利塔铭","022":"王居士砖塔铭"};')
s=s.replace('"007","010","011","013","014","015","016","017","018","020"','"007","010","011","013","014","015","016","017","018","020","022"')
s=s.replace('"003","004","005","006","007","010","011","013","014","015","016","017","018","020"','"003","004","005","006","007","010","011","013","014","015","016","017","018","020","022"')
P.write_text(s,"utf-8")

P=R/"js/detail_info_patch.js";s=P.read_text("utf-8")
s=s.replace("if(window.__DETAIL_INFO_STABLE_ENTRY_V13__)return;","if(window.__DETAIL_INFO_STABLE_ENTRY_V14__)return;")
s=s.replace("window.__DETAIL_INFO_STABLE_ENTRY_V13__=true;","window.__DETAIL_INFO_STABLE_ENTRY_V14__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V13__=true;")
s=s.replace("20260724_huadusi_v2",V).replace('["007","010","011","013","014","015","016","017","018","020"]','["007","010","011","013","014","015","016","017","018","020","022"]')
s=s.replace("window.__DAMAGE_AI_READING_ROUTER_V58__=true;","window.__DAMAGE_AI_READING_ROUTER_V58__=true;\n    window.__DAMAGE_AI_READING_ROUTER_V59__=true;")
P.write_text(s,"utf-8")

P=R/"detail.html";s=P.read_text("utf-8")
if "20260724_huadusi_v2" not in s:raise SystemExit("detail cache anchor missing")
P.write_text(s.replace("20260724_huadusi_v2",V),"utf-8")

assert '"022":[' in (R/"js/damage_ai_reading.js").read_text("utf-8")
print(json.dumps({"model_rows":len(norm),"model_squares":report["model_square_count"],"pages":pages,
 "image_only":image_only,"located":report["located_cases"],"missing":missing},ensure_ascii=False))
