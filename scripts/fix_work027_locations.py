#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
WORK_ID='027'
FOLDER='027_旧拓魏志五种'
IMAGE_ROOT=f'assets/page_images/{FOLDER}/images'


def dump(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def cn(n):
    d='零一二三四五六七八九'
    if n<10:return d[n]
    if n==10:return '十'
    if n<20:return '十'+d[n%10]
    if n<100:return d[n//10]+'十'+(d[n%10] if n%10 else '')
    return str(n)


def records(data):
    if isinstance(data,list):return data
    if isinstance(data,dict):
        for key in ('records','rows','items','data','glyphs'):
            if isinstance(data.get(key),list):return data[key]
        lists=[v for v in data.values() if isinstance(v,list)]
        if lists:return max(lists,key=len)
    raise RuntimeError('bad model shard')


def ch(row):return str(row.get('char') or row.get('text') or '')[:1]

cases=json.loads((ROOT/'data/work027_damage_cases.json').read_text(encoding='utf-8'))
report=json.loads((ROOT/'data/work027_coordinate_report.json').read_text(encoding='utf-8'))
rows=[r for r in records(json.loads((ROOT/'data/model_boxes/glyph_model_border_026_030.json').read_text(encoding='utf-8'))) if str(r.get('work_id') or '').zfill(3)==WORK_ID]
rows.sort(key=lambda r:(int(r.get('canvas_index') or 0),int(r.get('order_in_page') or 0)))
model_squares=[i for i,row in enumerate(rows) if ch(row)=='□']
expected=sum(int(case.get('square_count') or 0) for case in cases)
assert expected==len(model_squares)==report['base_text_square_count'],(expected,len(model_squares),report['base_text_square_count'])
ordinal=0
for case in cases:
    count=int(case.get('square_count') or 0)
    assert count>0
    row=rows[model_squares[ordinal]]
    page=int(row['canvas_index'])
    x=float(row.get('x') or row.get('bbox_x') or 0);y=float(row.get('y') or row.get('bbox_y') or 0)
    w=float(row.get('w') or row.get('bbox_w') or 0);h=float(row.get('h') or row.get('bbox_h') or 0)
    assert w>0 and h>0 and ch(row)=='□'
    location={
        'page':page,
        'glyph_id':str(row.get('glyph_id') or f'{FOLDER}_p{page:04d}_c{int(row.get("order_in_page") or 0):03d}'),
        'canvas':{'w':int(row.get('canvas_width') or 1474),'h':int(row.get('canvas_height') or 2226)},
        'bbox':{'x':x,'y':y,'w':w,'h':h},
        'image':f'{IMAGE_ROOT}/{page:04d}_{cn(page)}.jpg',
        'bbox_source':str(row.get('source') or 'model_border_refined'),
        'match_method':'exact-square-order-by-case-cumulative-count',
        'target_square_ordinal':ordinal+1,
    }
    case['locations']=[location]
    case['page']=page
    case['match_method']='exact-square-order-by-case-cumulative-count'
    ordinal+=count
assert ordinal==len(model_squares)
report['located_case_count']=len(cases)
report['mapping_method']='exact-square-order-by-case-cumulative-count'
report['case_first_square_locations_verified']=True
report['unlocated_case_count']=0
dump(ROOT/'data/work027_damage_cases.json',cases)
dump(ROOT/'data/work027_coordinate_report.json',report)
print(json.dumps({'cases':len(cases),'squares':expected,'located':report['located_case_count'],'first_page':cases[0]['page'],'last_page':cases[-1]['page']},ensure_ascii=False))
