#!/usr/bin/env python3
"""Replace 011 row-offset guesses with context-aligned direct boxes or inferred damaged slots."""
from __future__ import annotations
import json, re
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parents[1]
CASES=ROOT/'data/work011_damage_cases.json'
REPORT=ROOT/'data/work011_coordinate_report.json'
PAGES=ROOT/'data/glyph_boxes/iiif/011'
VAR={
 '鋒':'锋','變':'变','輕':'轻','於':'于','題':'题','壘':'垒','軒':'轩','詔':'诏','為':'为','兩':'两','賜':'赐','絹':'绢','礱':'礲','砻':'礲','達':'达','飾':'饰','與':'与','鴻':'鸿','練':'练','萬':'万','氣':'气','隨':'随','國':'国','華':'华','實':'实','義':'义','將':'将','書':'书','遠':'远','來':'来','風':'风','後':'后','時':'时','見':'见','長':'长','東':'东','車':'车','勳':'勋','鐘':'钟','備':'备','騎':'骑','軍':'军','儀':'仪','處':'处','廣':'广','總':'总','轉':'转','彈':'弹','權':'权','貪':'贪','獄':'狱','條':'条','復':'复','舊':'旧','雖':'虽','預':'预','聲':'声','節':'节','觀':'观','榮':'荣','並':'并','臨':'临','晉':'晋','屬':'属','楊':'杨','贈':'赠','謚':'谥','喪':'丧','須':'须','溫':'温','潤':'润','龍':'龙','尋':'寻','踐':'践','識':'识','進':'进','賢':'贤','黃':'黄','諾':'诺','齊':'齐','寵':'宠','謀':'谋','鍾':'钟','墳':'坟','樹':'树','飛':'飞','隴':'陇','銘':'铭','積':'积','偉':'伟','寶':'宝','慚':'惭','雲':'云','輔':'辅','贊':'赞','筆':'笔','蘭':'兰','開':'开','務':'务','職':'职','聞':'闻','亂':'乱','階':'阶','災':'灾','難':'难','興':'兴','盡':'尽','鳳':'凤','圖':'图','鎖':'锁','喬':'乔','銀':'银','歐':'欧','陽':'阳','詢':'询','□':'□'}
IGN=re.compile(r"[\s\u3000，。；：、！？,.!?;:“”‘’'\"（）()《》〈〉【】〔〕［］—–…·]")
def canon(v:Any)->str:
 c=str(v or '')[:1]
 return '' if not c or IGN.fullmatch(c) else VAR.get(c,c)
def compact(v:Any)->list[str]: return [x for c in str(v or '') if (x:=canon(c))]
def score(pattern:list[str],sq:int,stream:list[dict],gap:int)->tuple[int,int,float]:
 left=[c for c in pattern[:sq] if c!='□'][-18:]; right=[c for c in pattern[sq+1:] if c!='□'][:18]
 pairs=[]
 pairs += [(stream[gap-i]['key'],e) for i,e in enumerate(reversed(left),1) if gap-i>=0]
 pairs += [(stream[gap+i]['key'],e) for i,e in enumerate(right) if gap+i<len(stream)]
 m=sum(a==b for a,b in pairs); n=len(pairs)
 return m,n,m/n if n else 0.0
def row_score(pattern:list[str],sq:int,stream:list[dict],pos:int)->tuple[int,int,float]:
 left=[c for c in pattern[:sq] if c!='□'][-18:]; right=[c for c in pattern[sq+1:] if c!='□'][:18]
 pairs=[]
 pairs += [(stream[pos-i]['key'],e) for i,e in enumerate(reversed(left),1) if pos-i>=0]
 pairs += [(stream[pos+i]['key'],e) for i,e in enumerate(right,1) if pos+i<len(stream)]
 m=sum(a==b for a,b in pairs); n=len(pairs)
 return m,n,m/n if n else 0.0
def med(vals:list[float])->float:
 a=sorted(float(v) for v in vals if float(v)>0); n=len(a)
 return 0 if not n else a[n//2] if n%2 else (a[n//2-1]+a[n//2])/2
def gap_location(stream:list[dict],gap:int)->tuple[dict|None,dict]:
 if gap<=0 or gap>=len(stream): return None,{'reason':'range'}
 l=stream[gap-1]['row']; r=stream[gap]['row']; page=int(l['canvas_index'])
 if page!=int(r['canvas_index']): return None,{'reason':'page'}
 if l.get('auto_col') is not None and r.get('auto_col') is not None and l.get('auto_col')!=r.get('auto_col'): return None,{'reason':'column'}
 same=[x['row'] for x in stream if int(x['row']['canvas_index'])==page and (l.get('auto_col') is None or x['row'].get('auto_col')==l.get('auto_col'))]
 w=med([x['w'] for x in same]) or med([l['w'],r['w']]); h=med([x['h'] for x in same]) or med([l['h'],r['h']])
 lcy=float(l['y'])+float(l['h'])/2; rcy=float(r['y'])+float(r['h'])/2
 cx=((float(l['x'])+float(l['w'])/2)+(float(r['x'])+float(r['w'])/2))/2; cy=(lcy+rcy)/2
 bbox={'x':round(cx-w/2,2),'y':round(cy-h/2,2),'w':round(w,2),'h':round(h,2)}
 geo={'left_char':l.get('char',''),'right_char':r.get('char',''),'left_glyph_id':l.get('glyph_id',''),'right_glyph_id':r.get('glyph_id',''),'center_distance':round(abs(rcy-lcy),2),'median_height':round(h,2)}
 loc={'page':page,'glyph_id':f"011_gap_{l.get('glyph_id','')}_{r.get('glyph_id','')}",'canvas':{'w':int(l.get('canvas_width') or 1205),'h':int(l.get('canvas_height') or 1931)},'bbox':bbox,'match_method':'offline-context-gap-inference','bbox_source':'adjacent-real-glyph-geometry','left_glyph_id':l.get('glyph_id',''),'right_glyph_id':r.get('glyph_id','')}
 return loc,geo

def main():
 rows=[]
 for page in range(1,55):
  path=PAGES/f'page_{page:04d}.json'
  if path.exists(): rows.extend(json.loads(path.read_text(encoding='utf-8')))
 rows.sort(key=lambda x:(int(x.get('canvas_index',0)),int(x.get('order_in_page',0))))
 stream=[{'row':r,'key':canon(r.get('char'))} for r in rows if canon(r.get('char'))]
 squares=[i for i,x in enumerate(stream) if x['key']=='□']
 cases=json.loads(CASES.read_text(encoding='utf-8')); audit=[]; previous=1
 for case in cases:
  pattern=compact(case.get('original') or case.get('o')); sq=pattern.index('□'); cand=[]
  for pos in squares:
   if pos<previous: continue
   m,n,q=row_score(pattern,sq,stream,pos); cand.append({'kind':'row','anchor':pos,'matched':m,'compared':n,'ratio':q,'direct':True})
  for gap in range(max(1,previous),len(stream)):
   l=stream[gap-1]['row']; r=stream[gap]['row']
   if int(l['canvas_index'])!=int(r['canvas_index']): continue
   if l.get('auto_col') is not None and r.get('auto_col') is not None and l.get('auto_col')!=r.get('auto_col'): continue
   m,n,q=score(pattern,sq,stream,gap)
   if m>=6 and q>=.55: cand.append({'kind':'gap','anchor':gap,'matched':m,'compared':n,'ratio':q,'direct':False})
  cand.sort(key=lambda x:(x['matched'],x['ratio'],x['direct'],-x['anchor']),reverse=True); best=cand[0] if cand else None; runner=cand[1] if len(cand)>1 else None
  ok=bool(best and best['matched']>=6 and best['ratio']>=.55 and not(runner and best['matched']==runner['matched'] and abs(best['ratio']-runner['ratio'])<.02))
  item={'id':case['id'],'located':ok,'candidate_count':len(cand),'top_candidates':[]}
  for c in cand[:5]:
   a=c['anchor']
   if c['kind']=='gap':
    l=stream[a-1]['row']; r=stream[a]['row']; summary={'page':int(l['canvas_index']),'between':[l.get('char',''),r.get('char','')],'between_orders':[int(l['order_in_page']),int(r['order_in_page'])]}
   else:
    r=stream[a]['row']; summary={'page':int(r['canvas_index']),'char':r.get('char',''),'order_in_page':int(r['order_in_page'])}
   summary.update({'kind':c['kind'],'matched':c['matched'],'compared':c['compared'],'ratio':round(c['ratio'],4)}); item['top_candidates'].append(summary)
  if ok:
   if best['kind']=='gap': loc,geo=gap_location(stream,best['anchor']); previous=best['anchor']
   else:
    r=stream[best['anchor']]['row']; loc={'page':int(r['canvas_index']),'glyph_id':r.get('glyph_id',''),'canvas':{'w':int(r.get('canvas_width') or 1205),'h':int(r.get('canvas_height') or 1931)},'bbox':{'x':float(r['x']),'y':float(r['y']),'w':float(r['w']),'h':float(r['h'])},'match_method':'offline-context-direct-square','bbox_source':'real-detected-glyph-box'}; geo={'char':r.get('char',''),'order_in_page':int(r['order_in_page'])}; previous=best['anchor']+1
   if loc:
    restored=(re.search(r'〔([^〕]*)〕',case.get('corrected','')) or [None,''])[1]; loc.update({'target_square_ordinal':1,'target_kind':'restored','restored_text':restored}); case['locations']=[loc]; case['page']=loc['page']; item.update({'page':loc['page'],'glyph_id':loc['glyph_id'],'match_method':loc['match_method'],'geometry':geo})
   else: item['located']=False
  audit.append(item)
 CASES.write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
 report=json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
 report.update({'cases':len(cases),'located_cases':sum(x['located'] for x in audit),'unmapped_case_ids':[x['id'] for x in audit if not x['located']],'location_order_monotonic':all(int(cases[i]['page'])<=int(cases[i+1]['page']) for i in range(len(cases)-1) if cases[i].get('locations') and cases[i+1].get('locations')),'case_audit':audit})
 REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in report.items() if k!='case_audit'},ensure_ascii=False,indent=2))
 if report['located_cases']!=len(cases): raise SystemExit('仍有案例未定位')
if __name__=='__main__': main()
