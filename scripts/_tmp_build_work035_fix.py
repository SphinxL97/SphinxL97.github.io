#!/usr/bin/env python3
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION_OLD='20260726_wushici_035_v1'
VERSION_NEW='20260726_wushici_035_v2'
MODEL=ROOT/'data/model_boxes/glyph_model_border_031_035.json'
CASES_PATH=ROOT/'data/work035_damage_cases.json'
REPORT_PATH=ROOT/'data/work035_coordinate_report.json'
OUT_DIR=ROOT/'data/glyph_boxes/iiif/035'

# Every target is a genuine model row whose char is □. Six contextual mappings are
# explicitly separated because the user's transcript compresses or joins labels.
MAPPING={
 '01':('035_武氏祠画像题字_p0010_c002','direct'),
 '02':('035_武氏祠画像题字_p0011_c008','direct'),
 '03':('035_武氏祠画像题字_p0012_c011','contextual'),
 '04':('035_武氏祠画像题字_p0013_c027','direct'),
 '05':('035_武氏祠画像题字_p0014_c009','direct'),
 '06':('035_武氏祠画像题字_p0015_c011','direct'),
 '07':('035_武氏祠画像题字_p0016_c024','direct'),
 '08':('035_武氏祠画像题字_p0018_c007','contextual'),
 '09':('035_武氏祠画像题字_p0019_c027','contextual'),
 '10':('035_武氏祠画像题字_p0020_c015','direct'),
 '11':('035_武氏祠画像题字_p0022_c007','direct'),
 '12':('035_武氏祠画像题字_p0023_c002','direct'),
 '13':('035_武氏祠画像题字_p0023_c027','contextual'),
 '14':('035_武氏祠画像题字_p0030_c019','contextual'),
 '15':('035_武氏祠画像题字_p0032_c010','direct'),
 '16':('035_武氏祠画像题字_p0035_c023','contextual'),
 '17':('035_武氏祠画像题字_p0037_c026','direct'),
 '18':('035_武氏祠画像题字_p0039_c001','direct'),
 '19':('035_武氏祠画像题字_p0054_c002','direct'),
 '20':('035_武氏祠画像题字_p0058_c006','direct'),
 '21':('035_武氏祠画像题字_p0063_c008','direct'),
 '22':('035_武氏祠画像题字_p0064_c010','direct'),
 '23':('035_武氏祠画像题字_p0072_c002','direct'),
 '24':('035_武氏祠画像题字_p0073_c004','direct'),
 '25':('035_武氏祠画像题字_p0074_c002','direct'),
 '26':('035_武氏祠画像题字_p0075_c004','direct'),
 '27':('035_武氏祠画像题字_p0078_c005','direct'),
 '28':('035_武氏祠画像题字_p0081_c002','direct'),
 '29':('035_武氏祠画像题字_p0083_c002','direct'),
}

rows=json.loads(MODEL.read_text(encoding='utf-8'))
rows=[r for r in rows if str(r.get('work_id','')).zfill(3)=='035']
rows.sort(key=lambda r:(int(r.get('canvas_index',0)),int(r.get('order_in_page',0))))
assert len(rows)==1423, f'unexpected 035 row count: {len(rows)}'
by_id={str(r.get('glyph_id')):r for r in rows}
assert set(MAPPING)=={f'{i:02d}' for i in range(1,30)}

# Generate page-scoped files from the existing genuine model rows.
OUT_DIR.mkdir(parents=True,exist_ok=True)
for old in OUT_DIR.glob('page_*.json'):
    old.unlink()
pages={}
for row in rows:
    p=int(row['canvas_index'])
    pages.setdefault(p,[]).append(row)
for p,items in sorted(pages.items()):
    items.sort(key=lambda r:int(r.get('order_in_page',0)))
    (OUT_DIR/f'page_{p:04d}.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

cases=json.loads(CASES_PATH.read_text(encoding='utf-8'))
assert len(cases)==29
locations=[]
for case in cases:
    cid=str(case.get('id')).zfill(2)
    glyph_id,kind=MAPPING[cid]
    row=by_id.get(glyph_id)
    assert row is not None, f'missing model row {glyph_id}'
    assert row.get('char')=='□', f'target is not model marker: {glyph_id}={row.get("char")}'
    box={'x':int(row['x']),'y':int(row['y']),'w':int(row['w']),'h':int(row['h'])}
    loc={
      'page':int(row['canvas_index']),'glyph_id':glyph_id,'char':'□','bbox':box,
      'canvas_width':int(row['canvas_width']),'canvas_height':int(row['canvas_height']),
      'order_in_page':int(row['order_in_page']),'source':str(row.get('source') or 'model_border_refined'),
      'match_method':'direct-context-first-marker' if kind=='direct' else 'contextual-segment-first-marker',
      'match_confidence':'high' if kind=='direct' else 'contextual'
    }
    case['page']=loc['page']
    case['locations']=[loc]
    locations.append({'case_id':cid,'title':case.get('title'),'kind':kind,**loc})
CASES_PATH.write_text(json.dumps(cases,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

marker_count=sum(r.get('char')=='□' for r in rows)
direct=sum(v[1]=='direct' for v in MAPPING.values())
contextual=sum(v[1]=='contextual' for v in MAPPING.values())
report={
 'work_id':'035','title':'武氏祠画像题字','digital_pages':98,'binding_leaves':37,
 'model_source_files':['data/model_boxes/glyph_model_border_031_035.json'],
 'model_rows':len(rows),'coordinate_pages':sorted(pages),'coordinate_page_count':len(pages),
 'model_marker_count':marker_count,'transcript_placeholders':57,'case_placeholders':55,
 'qing_note_placeholders':2,'case_count':29,'candidate_slots':57,
 'located_cases':29,'unlocated_cases':0,'direct_context_cases':direct,
 'contextual_segment_cases':contextual,'case_locations':locations,
 'qing_note_candidates':[
   {'order':27,'original':'嘉祥□宅山','corrected':'嘉祥〔武〕宅山'},
   {'order':45,'original':'錢唐黄小□','corrected':'錢唐黄小〔松〕'}
 ],
 'audit_note':'035真实坐标来自仓库既有汇总模型文件。29例均绑定到相应图像段落中的第一个真实模型□字框；23例前后文直接对应，6例因底稿压缩整段文字或粘连多个榜题，采用该段落中的第一个真实□字框并标记为contextual。',
 'rules':['只使用work_id为035的既有模型字框','目标行的char必须为□','每例只绑定第一个问题槽位','不生成或估算bbox','不使用相邻完整字框冒充问题字'],
 'version':VERSION_NEW
}
REPORT_PATH.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')

# Column 2: source headings have already been removed; make rendering robust against stale heading lines.
text_path=ROOT/'data/work035_full_text.txt'
text=text_path.read_text(encoding='utf-8')
assert not re.search(r'^（[一二三四五六七八九十]+）',text,re.M), 'numbered transcript heading remains'

work=ROOT/'js/work-035.js'
s=work.read_text(encoding='utf-8').replace(VERSION_OLD,VERSION_NEW)
old='return normalized.split(/\\n\\s*\\n/).map(part=>part.trim()).filter(Boolean).map(part=>/^（[一二三四五六七八九十]+）/.test(part)?`<h4 class="work035-transcript-subtitle">${esc(part)}</h4>`:`<p>${esc(part)}</p>`).join("");'
new='return normalized.split(/\\n\\s*\\n/).map(part=>part.trim()).filter(part=>part&&!/^（[一二三四五六七八九十]+）/.test(part)).map(part=>`<p>${esc(part)}</p>`).join("");'
assert old in s, 'paragraph renderer pattern not found'
s=s.replace(old,new)
s=re.sub(r'\.work035-transcript-subtitle\{[^}]*\}','',s)
work.write_text(s,encoding='utf-8')

adapter=ROOT/'js/work-035-coordinate-adapter.js'
s=adapter.read_text(encoding='utf-8').replace(VERSION_OLD,VERSION_NEW)
adapter.write_text(s,encoding='utf-8')

router=ROOT/'js/damage_ai_reading.js'
s=router.read_text(encoding='utf-8')
old='if(window.__DAMAGE_AI_READING_ROUTER_V76__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V76__=true;'
new='if(window.__DAMAGE_AI_READING_ROUTER_V77__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V77__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V76__=true;'
assert old in s
s=s.replace(old,new,1).replace(VERSION_OLD,VERSION_NEW)
router.write_text(s,encoding='utf-8')

detail_patch=ROOT/'js/detail_info_patch.js'
s=detail_patch.read_text(encoding='utf-8')
old='if(window.__DETAIL_INFO_STABLE_ENTRY_V36__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V36__=true;'
new='if(window.__DETAIL_INFO_STABLE_ENTRY_V37__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V37__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V36__=true;'
assert old in s
s=s.replace(old,new,1).replace(VERSION_OLD,VERSION_NEW)
detail_patch.write_text(s,encoding='utf-8')

html=ROOT/'detail.html'
s=html.read_text(encoding='utf-8').replace(VERSION_OLD,VERSION_NEW)
html.write_text(s,encoding='utf-8')

catalog=ROOT/'data/beitie_catalog.json'
s=catalog.read_text(encoding='utf-8')
s=s.replace('98页图像、用户确认底稿与29例完整校读已接入；当前未发现可用的035模型字框。','98页图像、用户确认底稿、29例校读与1423个真实模型字框已接入。')
catalog.write_text(s,encoding='utf-8')

header=ROOT/'data/beitie_header_info.json'
s=header.read_text(encoding='utf-8')
s=s.replace('当前29例均不生成推测性bbox。','29例均绑定相应图像段落中的第一个真实模型□字框；23例上下文直接对应，6例为整段压缩或榜题粘连后的上下文定位。')
header.write_text(s,encoding='utf-8')

# Validation.
assert len(list(OUT_DIR.glob('page_*.json')))==61
assert marker_count==302
assert all(c.get('page') and c.get('locations') and c['locations'][0].get('bbox') for c in cases)
assert all(c['locations'][0]['glyph_id'] in by_id for c in cases)
print(json.dumps({'model_rows':len(rows),'pages':len(pages),'markers':marker_count,'located_cases':len(locations),'direct':direct,'contextual':contextual},ensure_ascii=False))
