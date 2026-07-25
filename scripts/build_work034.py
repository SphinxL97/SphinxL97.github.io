from __future__ import annotations
import json,re,unicodedata
from collections import defaultdict
from pathlib import Path

R=Path('.')
ID='034'; TITLE='章吉老墓志'; VER='20260726_zhangjilao_034_v1'
PUNCT=set('，。；：、？！“”‘’（）()《》〈〉【】[]—…·,.!?;:\n\r\t ')
PROBLEM={'□','■','?','？','�','○','〇'}
TRANS=str.maketrans({'為':'为','無':'无','後':'后','與':'与','於':'于','醫':'医','體':'体','傳':'传','國':'国','學':'学','書':'书','來':'来','寧':'宁','聖':'圣','丗':'世','髙':'高','徔':'从','㳺':'游','冐':'冒','觧':'解','輙':'辄','莭':'节','䝨':'贤','蔵':'藏','髮':'发','夀':'寿','尓':'尔','隂':'阴','濟':'济','針':'针','術':'术','縣':'县','軍':'军','權':'权','勸':'劝','農':'农','騎':'骑'})

def c(ch): return '□' if ch in PROBLEM else unicodedata.normalize('NFKC',ch).translate(TRANS)
def seq(text): return [c(x) for x in text if not x.isspace() and x not in PUNCT]
def wid(row):
    raw=str(row.get('work_id') or row.get('work') or row.get('id') or row.get('glyph_id') or '')
    m=re.match(r'(\d{3})',raw); return m.group(1) if m else ''
def box(row):
    b=row.get('bbox')
    if isinstance(b,list) and len(b)>=4: x,y,w,h=b[:4]
    elif isinstance(b,dict): x,y,w,h=b.get('x',0),b.get('y',0),b.get('w',0),b.get('h',0)
    else: x,y,w,h=row.get('x',row.get('bbox_x',0)),row.get('y',row.get('bbox_y',0)),row.get('w',row.get('bbox_w',0)),row.get('h',row.get('bbox_h',0))
    return {'x':int(float(x or 0)),'y':int(float(y or 0)),'w':int(float(w or 0)),'h':int(float(h or 0))}
def align(a,b):
    n,m=len(a),len(b); gap=-2
    s=[[0]*(m+1) for _ in range(n+1)]; back=[[0]*(m+1) for _ in range(n+1)]
    for i in range(1,n+1): s[i][0]=i*gap; back[i][0]=1
    for j in range(1,m+1): s[0][j]=j*gap; back[0][j]=2
    for i in range(1,n+1):
        for j in range(1,m+1):
            pair=(3 if b[j-1]=='□' else 1) if a[i-1]=='□' else (4 if a[i-1]==b[j-1] else -2)
            opts=(s[i-1][j-1]+pair,s[i-1][j]+gap,s[i][j-1]+gap); best=max(opts)
            s[i][j]=best; back[i][j]=opts.index(best)
    mp={}; i=n; j=m
    while i or j:
        d=back[i][j]
        if i and j and d==0: mp[i-1]=j-1; i-=1; j-=1
        elif i and (not j or d==1): i-=1
        else: j-=1
    return mp,s[n][m]
def ctx(a,b,i,j,r=8):
    exact=0; total=0
    for k in range(1,r+1):
        if i-k>=0 and j-k>=0: total+=1; exact+=a[i-k]==b[j-k]
        if i+k<len(a) and j+k<len(b): total+=1; exact+=a[i+k]==b[j+k]
    return exact,total

def main():
    text=(R/'data/work034_full_text.txt').read_text(encoding='utf-8')
    cases=json.loads((R/'data/work034_damage_cases.json').read_text(encoding='utf-8'))
    assert text.count('□')==24 and len(cases)==14
    orders=[x for case in cases for x in case.get('placeholder_orders',[])]
    assert orders==list(range(1,25)),orders

    model=json.loads((R/'data/model_boxes/glyph_model_border_031_035.json').read_text(encoding='utf-8'))
    rows=[dict(x) for x in model if wid(x)==ID]
    rows.sort(key=lambda x:(int(x.get('canvas_index') or x.get('page') or 0),int(x.get('order_in_page') or x.get('annotation_index') or 0)))
    if not rows: raise RuntimeError('汇总坐标中没有034')
    groups=defaultdict(list)
    for k,row in enumerate(rows,1):
        page=int(row.get('canvas_index') or row.get('page') or 0); order=int(row.get('order_in_page') or row.get('annotation_index') or k)
        row.update(work_id=ID,canvas_index=page,order_in_page=order,char=str(row.get('char') or row.get('text') or '')[:1])
        row.setdefault('glyph_id',f'{ID}_{TITLE}_p{page:04d}_c{order:03d}'); row.setdefault('source','model_border_refined'); row.update(box(row)); groups[page].append(row)
    out=R/f'data/glyph_boxes/iiif/{ID}'; out.mkdir(parents=True,exist_ok=True)
    for old in out.glob('page_*.json'): old.unlink()
    for page,items in sorted(groups.items()):
        items.sort(key=lambda x:x['order_in_page']); (out/f'page_{page:04d}.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

    a=seq(text); b=[c(str(x.get('char') or '')) for x in rows]; mp,score=align(a,b)
    pidx=[i for i,x in enumerate(a) if x=='□']; pmap={}; audit=[]; last=-1
    for order,ti in enumerate(pidx,1):
        mj=mp.get(ti); ok=False; exact=total=0; method='unaligned'
        if mj is not None and mj>last:
            exact,total=ctx(a,b,ti,mj); ok=(b[mj]=='□' or exact>=3); method='sequence-marker' if b[mj]=='□' else ('sequence-context' if ok else 'low-context')
        if ok: pmap[order]=rows[mj]; last=mj
        audit.append({'order':order,'model_index':mj,'accepted':ok,'context_exact':exact,'context_total':total,'method':method,'glyph_id':rows[mj].get('glyph_id') if mj is not None else None,'page':rows[mj].get('canvas_index') if mj is not None else None,'model_char':rows[mj].get('char') if mj is not None else None})
    markers=[x for x in rows if c(str(x.get('char') or ''))=='□']
    if len(markers)==24:
        for order,row in enumerate(markers,1):
            if order not in pmap:
                pmap[order]=row; audit[order-1].update(accepted=True,method='marker-order-fallback',glyph_id=row.get('glyph_id'),page=row.get('canvas_index'),model_char=row.get('char'))

    for case in cases:
        first=case['placeholder_orders'][0]; row=pmap.get(first)
        if row:
            case['page']=int(row['canvas_index']); case['locations']=[{'page':int(row['canvas_index']),'glyph_id':str(row.get('glyph_id') or ''),'char':str(row.get('char') or ''),'bbox':box(row),'canvas_width':int(row.get('canvas_width') or 0),'canvas_height':int(row.get('canvas_height') or 0),'source':str(row.get('source') or 'model_border_refined')}]
            case['analysis'].append(f'栏目三定位采用第{case["page"]}页真实模型字框 {row.get("glyph_id")}；不使用相邻完整字代替。')
        else:
            case['page']=None; case['locations']=[]; case['analysis'].append('当前汇总坐标未能在可靠上下文中确定本例第一个问题字位置，因此不生成推测性bbox。')
        case.pop('placeholder_orders',None)
    (R/'data/work034_damage_cases.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')

    indexp=R/'data/page_images_index.json'; index=json.loads(indexp.read_text(encoding='utf-8'))
    for page in index['works'][ID]['pages']:
        items=sorted(groups.get(int(page['page']),[]),key=lambda x:x['order_in_page']); chars=[str(x.get('char') or '') for x in items]
        page.update(text_clean=''.join(chars),text_raw='\n'.join(chars),char_count=len(chars),has_char_boxes=bool(items))
    indexp.write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')

    catp=R/'data/beitie_catalog.json'; cat=json.loads(catp.read_text(encoding='utf-8'))
    for item in cat:
        if str(item.get('id'))==ID:
            item['status']='专属内容已接入'; item['subtitle']=f'31页图像、用户确认底稿、14例残损释读与{len(rows)}个真实模型字框已接入。'
    catp.write_text(json.dumps(cat,ensure_ascii=False,indent=2),encoding='utf-8')

    hp=R/'data/beitie_header_info.json'; h=json.loads(hp.read_text(encoding='utf-8')); basic=h[ID]['basic']; located=sum(bool(x['locations']) for x in cases)
    basic.update({'数量':'13开；数字化图像31页','馆藏号':'55B2188','版本说明':'本册为明初拓本，装裱13开，其中碑文12开；网站31页为数字化图像数，二者不是同一计数口径。','残损统计':f'用户底稿共24个方框，整理14组栏目三案例；暂拟15个候选字，保留9个未决方框；{located}组已绑定真实模型字框。'})
    hp.write_text(json.dumps(h,ensure_ascii=False,indent=2),encoding='utf-8')

    report={'work_id':ID,'title':TITLE,'digital_pages':31,'binding_leaves':13,'inscription_leaves':12,'model_rows':len(rows),'coordinate_pages':sorted(groups),'coordinate_page_count':len(groups),'model_marker_count':len(markers),'transcript_placeholders':24,'case_count':14,'candidate_count':15,'unresolved_placeholders':9,'located_cases':located,'unlocated_cases':14-located,'alignment_score':score,'placeholder_mapping':audit,'rules':['只使用汇总文件中work_id=034的既有模型记录','每例只绑定第一个问题字','上下文不足时不生成bbox','不使用相邻完整字框冒充残损槽位']}
    (R/'data/work034_coordinate_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')

    js=(R/'js/work-033.js').read_text(encoding='utf-8').replace('033《争座位帖》','034《章吉老墓志》').replace('争座位帖','章吉老墓志').replace('033','034').replace('ZHENGZUOWEI','ZHANGJILAO').replace('zhengzuowei','zhangjilao')
    js=re.sub(r'const VERSION="[^"]+";',f'const VERSION="{VER}";',js,count=1)
    js=re.sub(r'const INTRO=".*?";',f'const INTRO="本栏目依据用户确认底稿、公开资料旁证与仓库既有模型字框，整理14组残损释读，覆盖24个原始方框。暂拟15个候选字，继续保留9个未决方框；每例只显示第一个问题字的真实定位，无法可靠匹配时不估算bbox。";',js,count=1)
    supp='''  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="北宋医者章迪字吉老的墓志，周绅撰文，米芾行书，陈敦复篆盖，崇宁四年（1105）刻立。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本与流传"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("上海图书馆藏明初拓本，装裱13开，数字图像31页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("医者章迪"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("墓志记述章迪行医、拒受厚报、救助贫友及辨盗救兄等事迹。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">版本说明</div><div class="modal-desc">本项目采用上海图书馆藏明初拓本，装裱13开，其中碑文12开；网站31页为数字化图像数。</div><div class="modal-term">馆藏号</div><div class="modal-desc">55B2188。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>医者与乡里</h3><p>章迪字吉老，迁居无为，精于医术。墓志着重叙写其不受田宅厚报、长期救助贫困友人，以及寻获真盗、使兄长免于死刑等事。</p><p>本页面栏目二严格保留用户底稿中的方框和疑似OCR文字；栏目三候选字不反写原始释文。</p>';
  }
  function ensureCrowdsource'''
    js=re.sub(r'  function applySupplementalInfo\(\)\{.*?\n  \}\n  function ensureCrowdsource',supp,js,flags=re.S)
    (R/'js/work-034.js').write_text(js,encoding='utf-8')
    ad=(R/'js/work-033-coordinate-adapter.js').read_text(encoding='utf-8').replace('033《争座位帖》','034《章吉老墓志》').replace('033','034').replace('zhengzuowei','zhangjilao')
    ad=re.sub(r'const CACHE_TAG="[^"]+";',f'const CACHE_TAG="{VER}";',ad,count=1); (R/'js/work-034-coordinate-adapter.js').write_text(ad,encoding='utf-8')

    rp=R/'js/damage_ai_reading.js'; router=rp.read_text(encoding='utf-8')
    if '__DAMAGE_AI_READING_ROUTER_V73__' not in router:
        router=router.replace('if(window.__DAMAGE_AI_READING_ROUTER_V72__)return;','if(window.__DAMAGE_AI_READING_ROUTER_V73__)return;').replace('window.__DAMAGE_AI_READING_ROUTER_V72__=true;','window.__DAMAGE_AI_READING_ROUTER_V73__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V72__=true;',1)
    if '"034":[' not in router:
        m=re.search(r'(    "033":\[\{src:.*?\}\])\n  \};',router)
        if not m: raise RuntimeError('找不到033路由末尾')
        route=f'    "034":[{{src:"js/work-034-coordinate-adapter.js?v={VER}",key:"w034c",ready:()=>Boolean(window.__WORK_034_COORDINATE_ADAPTER__)}},{{src:"js/work-034.js?v={VER}",key:"w034",ready:()=>Boolean(window.__WORK_034_STABLE_READY__&&window.__WORK_034_CROWDSOURCE_READY__)}}]'
        router=router[:m.end(1)]+',\n'+route+router[m.end(1):]
    if '"034":"章吉老墓志"' not in router: router=router.replace('"033":"争座位帖"','"033":"争座位帖","034":"章吉老墓志"')
    router=router.replace('"032","033"].includes(id)','"032","033","034"].includes(id)'); rp.write_text(router,encoding='utf-8')

    dp=R/'js/detail_info_patch.js'; detail=dp.read_text(encoding='utf-8')
    if '__DETAIL_INFO_STABLE_ENTRY_V33__' not in detail:
        detail=detail.replace('if(window.__DETAIL_INFO_STABLE_ENTRY_V32__)return;','if(window.__DETAIL_INFO_STABLE_ENTRY_V33__)return;').replace('window.__DETAIL_INFO_STABLE_ENTRY_V32__=true;','window.__DETAIL_INFO_STABLE_ENTRY_V33__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V32__=true;',1)
    detail=re.sub(r'const dataUrl="data/beitie_header_info.json\?v=[^"]+";',f'const dataUrl="data/beitie_header_info.json?v={VER}";',detail,count=1)
    detail=re.sub(r'const recoveryVersion="[^"]+";',f'const recoveryVersion="{VER}_route";',detail,count=1)
    detail=detail.replace('"032","033"]);','"032","033","034"]);')
    if '"034":"章吉老墓志"' not in detail: detail=detail.replace('"033":"争座位帖"','"033":"争座位帖","034":"章吉老墓志"')
    dp.write_text(detail,encoding='utf-8')

    p=R/'detail.html'; html=p.read_text(encoding='utf-8'); html=re.sub(r'js/detail_info_patch\.js\?v=[^"\']+',f'js/detail_info_patch.js?v={VER}',html); html=re.sub(r'js/damage_ai_reading\.js\?v=[^"\']+',f'js/damage_ai_reading.js?v={VER}',html); p.write_text(html,encoding='utf-8')
    dedicated=(R/'js/work-034.js').read_text(encoding='utf-8')
    for word in ['恢复依据','资料查证结果','资料使用原则','使用说明']:
        assert word not in dedicated,word
    print(json.dumps({'model_rows':len(rows),'coordinate_pages':len(groups),'located_cases':located,'marker_rows':len(markers)},ensure_ascii=False))
if __name__=='__main__': main()
