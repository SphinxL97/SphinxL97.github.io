#!/usr/bin/env python3
"""Finalize five 011 lacunae with explicit adjacent anchors in the confirmed transcript."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CASES=ROOT/'data/work011_damage_cases.json'; REPORT=ROOT/'data/work011_coordinate_report.json'; PAGES=ROOT/'data/glyph_boxes/iiif/011'
ANCHORS={'01':('锋','犀'),'02':('轻','于'),'03':('建','玉'),'04':('公','轩'),'05':('磨','救')}
VAR={'鋒':'锋','變':'变','輕':'轻','於':'于','題':'题','壘':'垒','軒':'轩','礱':'礲','砻':'礲','達':'达','飾':'饰','與':'与','鴻':'鸿','練':'练','萬':'万','氣':'气','隨':'随','國':'国','華':'华','實':'实','義':'义','將':'将','書':'书','遠':'远','來':'来','風':'风','後':'后','時':'时','見':'见','長':'长','東':'东','車':'车','勳':'勋','鐘':'钟','備':'备','騎':'骑','軍':'军','儀':'仪','處':'处','廣':'广','總':'总','轉':'转','彈':'弹','權':'权','貪':'贪','獄':'狱','條':'条','復':'复','舊':'旧','雖':'虽','預':'预','聲':'声','節':'节','觀':'观','榮':'荣','並':'并','臨':'临','晉':'晋','屬':'属','楊':'杨','贈':'赠','謚':'谥','喪':'丧','須':'须','溫':'温','潤':'润','龍':'龙','尋':'寻','踐':'践','識':'识','進':'进','賢':'贤','黃':'黄','諾':'诺','齊':'齐','寵':'宠','謀':'谋','鍾':'钟','墳':'坟','樹':'树','飛':'飞','隴':'陇','銘':'铭','積':'积','偉':'伟','寶':'宝','慚':'惭','雲':'云','輔':'辅','贊':'赞','筆':'笔','蘭':'兰','開':'开','務':'务','職':'职','聞':'闻','亂':'乱','階':'阶','災':'灾','難':'难','興':'兴','盡':'尽','鳳':'凤','圖':'图','鎖':'锁','喬':'乔','銀':'银','歐':'欧','陽':'阳','詢':'询','□':'□'}
def key(v):
 c=str(v or '')[:1]; return VAR.get(c,c)
def med(values):
 a=sorted(float(v) for v in values if float(v)>0); n=len(a); return 0 if not n else a[n//2] if n%2 else (a[n//2-1]+a[n//2])/2
def real_location(row,method,source):
 return {'page':int(row['canvas_index']),'glyph_id':str(row.get('glyph_id') or ''),'canvas':{'w':int(row.get('canvas_width') or 1205),'h':int(row.get('canvas_height') or 1931)},'bbox':{'x':float(row['x']),'y':float(row['y']),'w':float(row['w']),'h':float(row['h'])},'match_method':method,'bbox_source':source}
def same_column_gap(stream,i):
 l=stream[i]['row']; r=stream[i+1]['row']; page=int(l['canvas_index'])
 same=[x['row'] for x in stream if int(x['row']['canvas_index'])==page and (l.get('auto_col') is None or x['row'].get('auto_col')==l.get('auto_col'))]
 w=med([x['w'] for x in same]) or med([l['w'],r['w']]); h=med([x['h'] for x in same]) or med([l['h'],r['h']])
 lcy=float(l['y'])+float(l['h'])/2; rcy=float(r['y'])+float(r['h'])/2; cx=((float(l['x'])+float(l['w'])/2)+(float(r['x'])+float(r['w'])/2))/2; cy=(lcy+rcy)/2
 return {'page':page,'glyph_id':f"011_gap_{l.get('glyph_id','')}_{r.get('glyph_id','')}",'canvas':{'w':int(l.get('canvas_width') or 1205),'h':int(l.get('canvas_height') or 1931)},'bbox':{'x':round(cx-w/2,2),'y':round(cy-h/2,2),'w':round(w,2),'h':round(h,2)},'match_method':'offline-anchor-gap-inference','bbox_source':'adjacent-real-glyph-geometry','left_glyph_id':l.get('glyph_id',''),'right_glyph_id':r.get('glyph_id','')}
def main():
 rows=[]
 for page in range(1,55):
  p=PAGES/f'page_{page:04d}.json'
  if p.exists(): rows.extend(json.loads(p.read_text(encoding='utf-8')))
 rows.sort(key=lambda r:(int(r.get('canvas_index',0)),int(r.get('order_in_page',0))))
 stream=[{'row':r,'key':key(r.get('char'))} for r in rows if key(r.get('char'))]
 cases=json.loads(CASES.read_text(encoding='utf-8')); previous=-1; audit=[]
 for case in cases:
  cid=str(case['id']).zfill(2); left,right=ANCHORS[cid]; candidates=[]
  for i in range(previous+1,len(stream)-1):
   if stream[i]['key']!=left: continue
   if stream[i+1]['key']=='□' and i+2<len(stream) and stream[i+2]['key']==right: candidates.append(('direct',i+1,i))
   elif stream[i+1]['key']==right: candidates.append(('gap',i,i))
  item={'id':cid,'anchors':[left,right],'candidate_count':len(candidates),'located':len(candidates)==1}
  if len(candidates)==1:
   kind,target,anchor=candidates[0]; l=stream[anchor]['row']; r=stream[target+1]['row'] if kind=='direct' else stream[anchor+1]['row']
   if kind=='direct': loc=real_location(stream[target]['row'],'offline-anchor-direct-square','real-detected-glyph-box'); previous=target
   elif int(l['canvas_index'])==int(r['canvas_index']) and (l.get('auto_col') is None or r.get('auto_col') is None or l.get('auto_col')==r.get('auto_col')): loc=same_column_gap(stream,anchor); previous=anchor
   else:
    loc=real_location(r,'offline-anchor-boundary-slot','reading-boundary-real-slot'); loc['glyph_id']=f"011_boundary_{l.get('glyph_id','')}_{r.get('glyph_id','')}"; loc['left_glyph_id']=l.get('glyph_id',''); loc['right_glyph_id']=r.get('glyph_id',''); previous=anchor
   restored=(re.search(r'〔([^〕]*)〕',case.get('corrected','')) or [None,''])[1]; loc.update({'target_square_ordinal':1,'target_kind':'restored','restored_text':restored}); case['locations']=[loc]; case['page']=loc['page']; item.update({'page':loc['page'],'match_method':loc['match_method'],'bbox_source':loc['bbox_source'],'left':{'page':int(l['canvas_index']),'order':int(l['order_in_page']),'char':l.get('char','')},'right':{'page':int(r['canvas_index']),'order':int(r['order_in_page']),'char':r.get('char','')}})
  else:
   item['matches']=[{'kind':k,'page':int(stream[a]['row']['canvas_index']),'order':int(stream[a]['row']['order_in_page'])} for k,t,a in candidates]
  audit.append(item)
 CASES.write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
 report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}; report.update({'cases':len(cases),'located_cases':sum(x['located'] for x in audit),'unmapped_case_ids':[x['id'] for x in audit if not x['located']],'location_order_monotonic':all(int(cases[i]['page'])<=int(cases[i+1]['page']) for i in range(len(cases)-1)),'case_audit':audit}); REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps({k:v for k,v in report.items() if k!='case_audit'},ensure_ascii=False,indent=2))
 if report['located_cases']!=5: raise SystemExit('显式锚点仍未全部唯一定位')
if __name__=='__main__': main()
