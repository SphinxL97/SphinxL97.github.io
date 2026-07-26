#!/usr/bin/env python3
import json, re, unicodedata
from pathlib import Path
from difflib import SequenceMatcher

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'data/model_boxes/glyph_model_border_031_035.json'
CASES=ROOT/'data/work035_damage_cases.json'
OUT=ROOT/'work035-audit-output.json'

DROP=re.compile(r'[\s，。；：、！？“”‘’（）()《》〈〉·—…,.!?;:\-]')
EQUIV=str.maketrans({
    '㕥':'以','眀':'明','曺':'曹','冝':'宜','黄':'黃','髙':'高','徧':'遍','刾':'刺','淂':'得',
    '来':'來','并':'並','児':'兒','姉':'姊','玟':'文','椘':'楚','随':'隨','榖':'穀','罸':'罰',
    '荘':'莊','菅':'管','䖏':'處','虗':'虛','囙':'因','孰':'熟','祇':'祗','㠯':'以','扵':'於'
})

def norm(s):
    s=unicodedata.normalize('NFKC',str(s)).translate(EQUIV)
    return DROP.sub('',s)

def contiguous(left,right,actual_left,actual_right):
    l=0
    for a,b in zip(reversed(left),reversed(actual_left)):
        if a!=b: break
        l+=1
    r=0
    for a,b in zip(right,actual_right):
        if a!=b: break
        r+=1
    return l,r

def similarity(a,b):
    if not a and not b:return 0.0
    return SequenceMatcher(None,a,b).ratio()

rows=json.loads(MODEL.read_text(encoding='utf-8'))
rows=[r for r in rows if str(r.get('work_id','')).zfill(3)=='035']
rows.sort(key=lambda r:(int(r.get('canvas_index',0)),int(r.get('order_in_page',0))))
cases=json.loads(CASES.read_text(encoding='utf-8'))
chars=[norm(r.get('char',''))[:1] or '?' for r in rows]
markers=[i for i,r in enumerate(rows) if str(r.get('char',''))=='□']
results=[]
for case in cases:
    original=str(case.get('original',''))
    before,sep,after=original.partition('□')
    left=norm(before)[-10:]
    right=norm(after)[:10]
    ranked=[]
    for idx in markers:
        al=''.join(chars[max(0,idx-10):idx])
        ar=''.join(chars[idx+1:idx+11])
        lc,rc=contiguous(left,right,al,ar)
        ls=similarity(left[-8:],al[-8:])
        rs=similarity(right[:8],ar[:8])
        # immediate matching characters dominate; fuzzy context resolves OCR differences.
        score=lc*5+rc*5+ls*3+rs*3
        ranked.append({
            'score':round(score,4),'left_contiguous':lc,'right_contiguous':rc,
            'left_similarity':round(ls,4),'right_similarity':round(rs,4),
            'row_index':idx,'page':int(rows[idx].get('canvas_index',0)),
            'glyph_id':rows[idx].get('glyph_id'),'order_in_page':int(rows[idx].get('order_in_page',0)),
            'context':''.join(chars[max(0,idx-12):idx])+'□'+''.join(chars[idx+1:idx+13]),
            'row':rows[idx]
        })
    ranked.sort(key=lambda x:(-x['score'],-(x['left_contiguous']+x['right_contiguous']),x['page'],x['order_in_page']))
    results.append({
        'id':case.get('id'),'title':case.get('title'),'original':original,
        'left':left,'right':right,'top':ranked[:5]
    })
pages=sorted({int(r.get('canvas_index',0)) for r in rows})
summary={
    'row_count':len(rows),'pages':pages,'page_count':len(pages),'marker_count':len(markers),
    'page_counts':{str(p):sum(1 for r in rows if int(r.get('canvas_index',0))==p) for p in pages},
    'marker_pages':{str(p):sum(1 for r in rows if int(r.get('canvas_index',0))==p and r.get('char')=='□') for p in pages},
    'results':results,'rows':rows
}
OUT.write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:summary[k] for k in ['row_count','pages','page_count','marker_count','page_counts','marker_pages']},ensure_ascii=False,indent=2))
for item in results:
    print('\nCASE',item['id'],item['title'],item['original'])
    for cand in item['top'][:3]:
        print(' ',cand['score'],'p',cand['page'],cand['glyph_id'],cand['context'],'L/R',cand['left_contiguous'],cand['right_contiguous'])
