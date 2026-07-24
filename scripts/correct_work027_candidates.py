from __future__ import annotations

import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TEXT=ROOT/'data/work027_full_text.txt'
CASES=ROOT/'data/work027_damage_cases.json'
REPORT=ROOT/'data/work027_coordinate_report.json'
FILES=[ROOT/'js/work-027.js',ROOT/'js/damage_ai_reading.js',ROOT/'js/detail_info_patch.js',ROOT/'detail.html']
OLD='20260724_wei_five_v4'
NEW='20260724_wei_five_v5'

# 按用户底稿中的原句定位。值为按方框先后顺序给出的候选字。
CORRECTIONS={
    '泱泱顯□□□，西垂代襲。':'族斂蔓',
    '棲真宅正，□縄履程。':'寢',
    '餝轅□帶。':'褫',
    '士女承□□；頓方馳盡，圡悲愁。':'休轡',
    '端恭妄□，家俗虚膺。':'砥',
    '義成王南計□安。':'萇',
    '□□□基，雲景神䌽重暎。':'遠祖肇',
    '巍□□□□□□墓□。':'巍然玄宅永固門',
    '魏□二字、海□二字、君墓銘五字完整':'故郡',
    '□□□亦可騐物之顯晦有定時也。':'庶幾此',
}
PROVISIONAL={
    '□□□基，雲景神䌽重暎。',
    '巍□□□□□□墓□。',
    '魏□二字、海□二字、君墓銘五字完整',
    '□□□亦可騐物之顯晦有定時也。',
}
SOURCES={
    '泱泱顯□□□，西垂代襲。':'《全後魏文》卷五十七与《碑版文廣例》所录“泱泱顯族，斂蔓西垂”',
    '棲真宅正，□縄履程。':'《全後魏文》卷五十七所录“棲真宅正，寢繩履程”',
    '餝轅□帶。':'《全後魏文》卷五十七所录“飾轅褫帶”',
    '士女承□□；頓方馳盡，圡悲愁。':'《全後魏文》卷五十七所录“士女承休，轡頓方馳”',
    '端恭妄□，家俗虚膺。':'《全後魏文》卷五十七所录“端恭妄砥”',
    '義成王南計□安。':'刘玉墓志公开录文所见地名“萇安”',
    '□□□基，雲景神䌽重暎。':'公开录文“肇基雲景”及本句三个连续残位的句法推定',
    '巍□□□□□□墓□。':'墓志结尾“玄宅”“永固墓门”常用语及现存字序推定',
    '魏□二字、海□二字、君墓銘五字完整':'后跋所考篆额“魏故勃海郡王君墓銘”及分组语境推定',
    '□□□亦可騐物之顯晦有定時也。':'清代金石后跋常用语“庶幾……亦可驗”及本句语法推定',
}
URLS={
    '泱泱顯□□□，西垂代襲。':'https://ctext.org/wiki.pl?chapter=270820&if=gb',
    '棲真宅正，□縄履程。':'https://ctext.org/wiki.pl?chapter=270820&if=gb',
    '餝轅□帶。':'https://ctext.org/wiki.pl?chapter=270820&if=gb',
    '士女承□□；頓方馳盡，圡悲愁。':'https://ctext.org/wiki.pl?chapter=270820&if=gb',
    '端恭妄□，家俗虚膺。':'https://ctext.org/wiki.pl?chapter=270820&if=gb',
    '義成王南計□安。':'https://www.sohu.com/a/279761580_738227',
    '□□□基，雲景神䌽重暎。':'https://www.sohu.com/a/279761580_738227',
    '巍□□□□□□墓□。':'https://digitalarchive.npm.gov.tw/Collection/Detail/33665?dep=P',
    '魏□二字、海□二字、君墓銘五字完整':'https://ctext.org/wiki.pl?chapter=206401&if=gb',
    '□□□亦可騐物之顯晦有定時也。':'https://ctext.org/wiki.pl?chapter=206401&if=gb',
}

def fill(original:str,cands:str)->str:
    it=iter(cands)
    result=[]
    for ch in original:
        result.append(f'〔{next(it)}〕' if ch=='□' else ch)
    try:
        next(it)
        raise RuntimeError('候选字过多')
    except StopIteration:
        pass
    return ''.join(result)

def context(value:str)->str:
    return value.replace('〔','').replace('〕','')

def replace_case_in_text(text:str,old_corrected:str,new_corrected:str)->str:
    if old_corrected not in text:
        raise RuntimeError(f'全文找不到旧句：{old_corrected}')
    return text.replace(old_corrected,new_corrected,1)

def main():
    text=TEXT.read_text(encoding='utf-8')
    rows=json.loads(CASES.read_text(encoding='utf-8'))
    corrected_count=0
    provisional_count=0
    for row in rows:
        original=str(row.get('original',''))
        matched=next((key for key in CORRECTIONS if key in original),None)
        if not matched:
            continue
        cands=CORRECTIONS[matched]
        if original.count('□')!=len(cands):
            raise RuntimeError(f'{matched} 方框数与候选数不一致')
        old=str(row['corrected'])
        new=fill(original,cands)
        text=replace_case_in_text(text,old,new)
        mode='ai_provisional' if matched in PROVISIONAL else 'documentary'
        category='AI暂拟' if mode=='ai_provisional' else '文献对校'
        confidence='中' if mode=='ai_provisional' else '较高'
        row.update({
            'candidate':cands,
            'corrected':new,
            'c':new,
            'current_context':context(new),
            'mode':mode,
            'category':category,
            'confidence':confidence,
            'remaining_square_count':0,
            'reference':f"{SOURCES[matched]}：{URLS[matched]}",
            'analysis':[
                f"本例原句含{len(cands)}个残损方框，依次拟补为“{cands}”。补入后当前上下文为“{context(new)}”。",
                (f"{SOURCES[matched]}。候选字与第{row.get('page','—')}页方框的先后顺序逐一对应。"),
                ('该结果属于语境推定：现有公开录文未完整保存本句全部残位，网站仍以〔〕标出候选字，供后续结合原拓和其他著录复核。' if mode=='ai_provisional' else '该结果有对应录文支持；网站仍以〔〕标出补入文字，不把整理结果冒充原石现存字迹。')
            ]
        })
        corrected_count+=1
        provisional_count+=mode=='ai_provisional'

    # 所有案例都必须有具体候选、具体分析和零残留方框。
    if len(rows)!=100: raise RuntimeError('案例数不是100')
    if sum(int(r.get('candidate_count',0)) for r in rows)!=161: raise RuntimeError('候选字总数不是161')
    if any('□' in str(r.get('corrected','')) for r in rows): raise RuntimeError('补字结果仍含方框')
    if any('□' in str(r.get('current_context','')) for r in rows): raise RuntimeError('当前上下文仍含方框')
    if any(len(r.get('analysis',[]))<3 for r in rows): raise RuntimeError('存在无完整分析的案例')
    if '□' in text: raise RuntimeError('栏目二全文仍含方框')

    TEXT.write_text(text,encoding='utf-8')
    CASES.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report=json.loads(REPORT.read_text(encoding='utf-8'))
    report.update({
        'candidate_count':161,
        'remaining_square_count':0,
        'documentary_case_count':sum(r['mode']=='documentary' for r in rows),
        'ai_provisional_case_count':sum(r['mode']=='ai_provisional' for r in rows),
        'unresolved_case_count':0,
        'cache_version':NEW,
        'manual_candidate_corrections':corrected_count,
        'candidate_review_policy':'逐例对照公开录文；录文不能覆盖全部残位时仍给出AI候选，但明确标为AI暂拟。',
    })
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    for path in FILES:
        value=path.read_text(encoding='utf-8').replace(OLD,NEW)
        if path.name=='work-027.js':
            value=value.replace('滄州刾□王僧墓誌銘。','滄州刾〔史〕王僧墓誌銘。')
        path.write_text(value,encoding='utf-8')
    print({'corrected_cases':corrected_count,'provisional_cases':provisional_count,'cache':NEW})

if __name__=='__main__':
    main()
