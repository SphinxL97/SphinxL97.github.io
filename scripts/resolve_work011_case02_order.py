#!/usr/bin/env python3
"""Resolve case 02 by the confirmed text order: it must precede case 03 on page 19."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CASES=ROOT/'data/work011_damage_cases.json'; REPORT=ROOT/'data/work011_coordinate_report.json'; PAGES=ROOT/'data/glyph_boxes/iiif/011'
VAR={'輕':'轻','於':'于','壘':'垒','軒':'轩','鋒':'锋','礱':'礲'}
def key(v):
 c=str(v or '')[:1]; return VAR.get(c,c)
def med(values):
 a=sorted(float(v) for v in values if float(v)>0); n=len(a); return 0 if not n else a[n//2] if n%2 else (a[n//2-1]+a[n//2])/2
def main():
 rows=[]
 for page in range(1,55):
  p=PAGES/f'page_{page:04d}.json'
  if p.exists(): rows.extend(json.loads(p.read_text(encoding='utf-8')))
 rows.sort(key=lambda r:(int(r.get('canvas_index',0)),int(r.get('order_in_page',0))))
 stream=[r for r in rows if key(r.get('char'))]
 case3_anchor=next((i for i in range(len(stream)-1) if key(stream[i].get('char'))=='建' and key(stream[i+1].get('char'))=='玉'),None)
 if case3_anchor is None: raise SystemExit('未找到案例03的建—玉锚点')
 candidates=[i for i in range(case3_anchor) if key(stream[i].get('char'))=='轻' and key(stream[i+1].get('char'))=='于']
 if len(candidates)!=1: raise SystemExit(f'案例02在案例03之前的候选不是唯一值: {candidates}')
 i=candidates[0]; left,right=stream[i],stream[i+1]
 if int(left['canvas_index'])!=int(right['canvas_index']): raise SystemExit('案例02锚点跨页，需人工复核')
 page=int(left['canvas_index']); same=[r for r in stream if int(r['canvas_index'])==page and (left.get('auto_col') is None or r.get('auto_col')==left.get('auto_col'))]
 w=med([r['w'] for r in same]) or med([left['w'],right['w']]); h=med([r['h'] for r in same]) or med([left['h'],right['h']])
 lcy=float(left['y'])+float(left['h'])/2; rcy=float(right['y'])+float(right['h'])/2
 cx=((float(left['x'])+float(left['w'])/2)+(float(right['x'])+float(right['w'])/2))/2; cy=(lcy+rcy)/2
 location={'page':page,'glyph_id':f"011_gap_{left.get('glyph_id','')}_{right.get('glyph_id','')}",'canvas':{'w':int(left.get('canvas_width') or 1205),'h':int(left.get('canvas_height') or 1931)},'bbox':{'x':round(cx-w/2,2),'y':round(cy-h/2,2),'w':round(w,2),'h':round(h,2)},'match_method':'offline-anchor-order-gap-inference','bbox_source':'adjacent-real-glyph-geometry','left_glyph_id':left.get('glyph_id',''),'right_glyph_id':right.get('glyph_id',''),'target_square_ordinal':1,'target_kind':'restored','restored_text':'訬'}
 cases=json.loads(CASES.read_text(encoding='utf-8')); case=next(c for c in cases if str(c.get('id')).zfill(2)=='02'); case['locations']=[location]; case['page']=page; CASES.write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
 report=json.loads(REPORT.read_text(encoding='utf-8')); audit=report.get('case_audit',[]); entry=next(x for x in audit if str(x.get('id')).zfill(2)=='02'); entry.clear(); entry.update({'id':'02','anchors':['轻','于'],'candidate_count_before_order_filter':2,'located':True,'page':page,'match_method':location['match_method'],'bbox_source':location['bbox_source'],'order_constraint':'案例02须位于案例03“建—玉”锚点之前','left':{'page':page,'order':int(left['order_in_page']),'char':left.get('char','')},'right':{'page':page,'order':int(right['order_in_page']),'char':right.get('char','')}})
 report['located_cases']=sum(bool(x.get('located')) for x in audit); report['unmapped_case_ids']=[str(x.get('id')) for x in audit if not x.get('located')]; report['location_order_monotonic']=all(int(cases[i]['page'])<=int(cases[i+1]['page']) for i in range(len(cases)-1)); REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps({k:v for k,v in report.items() if k!='case_audit'},ensure_ascii=False,indent=2))
 if report['located_cases']!=5 or report['unmapped_case_ids']: raise SystemExit('011仍未达到5/5定位')
if __name__=='__main__': main()
