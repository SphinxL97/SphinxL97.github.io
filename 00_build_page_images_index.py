# -*- coding: utf-8 -*-
"""重新生成 data/page_images_index.json。
运行位置：网站根目录。
作用：扫描 assets/page_images 下所有碑帖页图，并尽量从 data/glyph_records_model_aligned_border_refined.json / glyph_records_iiif.json 中合并逐字释文。
"""
from pathlib import Path
import json,re
from collections import defaultdict
ROOT=Path(__file__).resolve().parent
DATA=ROOT/'data'
IMG_EXTS={'.jpg','.jpeg','.png','.webp','.gif'}

def load_json(p,default):
    try:return json.loads(p.read_text(encoding='utf-8'))
    except:return default

def wid3(s='',idx=None):
    m=re.match(r'^(\d{3})',str(s or ''))
    if m:return m.group(1)
    return str(idx).zfill(3) if idx else ''

def clean_title(name):return re.sub(r'^\d{3}[_\-\s]*','',name).strip() or name

def page_no(p,fb):
    m=re.match(r'^(\d+)',p.stem);return int(m.group(1)) if m else fb

def label_of(p):
    if '_' in p.stem:return p.stem.split('_',1)[1]
    if '-' in p.stem:return p.stem.split('-',1)[1]
    return str(page_no(p,0))

root=None
for cand in [ROOT/'assets'/'page_images',ROOT/'page_images']:
    if cand.exists(): root=cand;break
if not root:
    raise SystemExit('没有找到 assets/page_images 或 page_images')

# chars from glyphs
chars=defaultdict(list)
for fname in ['glyph_records_model_aligned_border_refined.json','glyph_records_model_aligned.json','glyph_records_iiif.json']:
    arr=load_json(DATA/fname,[])
    if arr:
        for g in arr:
            wid=wid3(g.get('work_id'),g.get('work_index'))
            page=int(g.get('canvas_index') or 0)
            if wid and page: chars[(wid,page)].append(g)
        break
for k in list(chars.keys()):
    chars[k].sort(key=lambda g:int(g.get('order_in_page') or g.get('annotation_index') or 0))

works={}
for folder in sorted(root.iterdir(),key=lambda x:x.name):
    if not folder.is_dir():continue
    m=re.match(r'^(\d{3})',folder.name)
    if not m:continue
    wid=m.group(1); title=clean_title(folder.name)
    imgdir=folder/'images'
    if not imgdir.exists(): imgdir=folder
    imgs=[p for p in imgdir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
    imgs.sort(key=lambda p:(page_no(p,999999),p.name))
    if not imgs:continue
    cover=next((p for p in imgs if p.stem.startswith('0001')),imgs[0])
    pages=[]
    for i,p in enumerate(imgs,1):
        pn=page_no(p,i); label=label_of(p)
        gs=chars.get((wid,pn),[]); text=''.join(str(g.get('char') or '') for g in gs)
        pages.append({'page':pn,'label':label,'image':p.relative_to(ROOT).as_posix(),'text_clean':text,'text_raw':'\n'.join(list(text)),'char_count':len(text),'has_char_boxes':bool(gs),'canvas_width':gs[0].get('canvas_width') if gs else None,'canvas_height':gs[0].get('canvas_height') if gs else None})
    works[wid]={'id':wid,'title':title,'cover':cover.relative_to(ROOT).as_posix(),'pages':pages}
(DATA/'page_images_index.json').write_text(json.dumps({'works':works},ensure_ascii=False,indent=2),encoding='utf-8')
print('已生成 data/page_images_index.json，works=',len(works),'pages=',sum(len(w['pages']) for w in works.values()))
