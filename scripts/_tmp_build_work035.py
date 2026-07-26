#!/usr/bin/env python3
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
VERSION="20260726_wushici_035_v1"

# 1. 共享栏目二、三路由：在PR #86的V75基础上新增035，升级为V76。
path=ROOT/"js/damage_ai_reading.js"
s=path.read_text(encoding="utf-8")
s=s.replace("if(window.__DAMAGE_AI_READING_ROUTER_V75__)return;","if(window.__DAMAGE_AI_READING_ROUTER_V76__)return;",1)
s=s.replace("window.__DAMAGE_AI_READING_ROUTER_V75__=true;","window.__DAMAGE_AI_READING_ROUTER_V76__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V75__=true;",1)
anchor='    "034":[{src:"js/work-034-coordinate-adapter.js?v=20260726_zhangjilao_034_v1",key:"w034c",ready:()=>Boolean(window.__WORK_034_COORDINATE_ADAPTER__)},{src:"js/work-034.js?v=20260726_zhangjilao_034_v3",key:"w034",ready:()=>Boolean(window.__WORK_034_STABLE_READY__&&window.__WORK_034_CROWDSOURCE_READY__)}]'
route=anchor+',\n    "035":[{src:"js/work-035-coordinate-adapter.js?v='+VERSION+'",key:"w035c",ready:()=>Boolean(window.__WORK_035_COORDINATE_ADAPTER__)},{src:"js/work-035.js?v='+VERSION+'",key:"w035",ready:()=>Boolean(window.__WORK_035_STABLE_READY__&&window.__WORK_035_CROWDSOURCE_READY__)}]'
if anchor not in s: raise RuntimeError("035路由插入锚点不存在")
s=s.replace(anchor,route,1)
s=s.replace(',"034":"章吉老墓志"};',',"034":"章吉老墓志","035":"武氏祠画像题字"};',1)
s=s.replace('"033","034"].includes(id)','"033","034","035"].includes(id)',1)
path.write_text(s,encoding="utf-8")

# 2. 详情页统一入口：增加035，升级为V36。
path=ROOT/"js/detail_info_patch.js"
s=path.read_text(encoding="utf-8")
s=s.replace("if(window.__DETAIL_INFO_STABLE_ENTRY_V35__)return;","if(window.__DETAIL_INFO_STABLE_ENTRY_V36__)return;",1)
s=s.replace("window.__DETAIL_INFO_STABLE_ENTRY_V35__=true;","window.__DETAIL_INFO_STABLE_ENTRY_V36__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V35__=true;",1)
s=re.sub(r'const dataUrl="data/beitie_header_info\.json\?v=[^"]+";',f'const dataUrl="data/beitie_header_info.json?v={VERSION}";',s,count=1)
s=re.sub(r'const recoveryVersion="[^"]+";',f'const recoveryVersion="{VERSION}";',s,count=1)
s=s.replace('"032","033","034"]);','"032","033","034","035"]);',1)
s=s.replace(',"034":"章吉老墓志"};',',"034":"章吉老墓志","035":"武氏祠画像题字"};',1)
path.write_text(s,encoding="utf-8")

# 3. 顶层缓存查询串。
path=ROOT/"detail.html"
s=path.read_text(encoding="utf-8")
s=re.sub(r'js/detail_info_patch\.js\?v=[^"]+',f'js/detail_info_patch.js?v={VERSION}',s)
s=re.sub(r'js/damage_ai_reading\.js\?v=[^"]+',f'js/damage_ai_reading.js?v={VERSION}',s)
path.write_text(s,encoding="utf-8")

# 4. 035目录与顶部信息，只修改本作品。
path=ROOT/"data/beitie_catalog.json"
data=json.loads(path.read_text(encoding="utf-8"))
rows=data if isinstance(data,list) else data.get("works",data.get("items",[]))
for row in rows:
    if str(row.get("id")).zfill(3)=="035":
        row["status"]="专属内容已接入"
        row["subtitle"]="98页图像、用户确认底稿与29例完整校读已接入；当前未发现可用的035模型字框。"
        break
else: raise RuntimeError("目录中不存在035")
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

path=ROOT/"data/beitie_header_info.json"
data=json.loads(path.read_text(encoding="utf-8"))
basic=data["035"]["basic"]
basic["数量"]="分装二册37开；数字化图像98页"
basic["馆藏号"]="22BT011"
basic["版本说明"]="本册为嘉庆元年（1796）黄易监拓批校本，分装二册37开；网站98页为数字化图像数，二者不是同一计数口径。"
basic["残损统计"]="用户底稿共57个方框：55个纳入29组栏目三案例，2个清代题记另作校读说明；57个均给出候选。其中13例文献可确认、8例文献对校与整段复原、8例AI推断；当前29例均不生成推测性bbox。"
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

# 5. 数据一致性验证。
text=(ROOT/"data/work035_full_text.txt").read_text(encoding="utf-8")
cases=json.loads((ROOT/"data/work035_damage_cases.json").read_text(encoding="utf-8"))
workjs=(ROOT/"js/work-035.js").read_text(encoding="utf-8")
assert text.count("□")==57
assert len(cases)==29
assert sum(x["original"].count("□") for x in cases)==55
assert sum(len(re.findall(r"〔[^〕]*〕",x["corrected"])) for x in cases)==55
assert all("□" not in x["corrected"] for x in cases)
assert "恢复依据" not in workjs
assert "AI分析依据" in workjs
assert (ROOT/"js/damage_ai_reading.js").read_text(encoding="utf-8").count('"035":[')==1

# 6. 删除全部临时文件；最终PR中不保留构建脚本或工作流。
for rel in [
    "scripts/_tmp_build_work035.py",
    "scripts/_tmp035_payload_1.txt",
    ".github/workflows/_tmp_build_work035.yml"
]:
    p=ROOT/rel
    if p.exists(): p.unlink()

print(json.dumps({"text_boxes":57,"cases":29,"case_boxes":55,"qing_note_boxes":2,"located_cases":0},ensure_ascii=False))
