from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VERSION='20260725_xianyu_v2'


def read_json(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))


def write_json(path,data):
    (ROOT/path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def main():
    full=(ROOT/'data/work029_full_text.txt').read_text(encoding='utf-8').strip()
    cases=read_json('data/work029_damage_cases.json')
    report=read_json('data/work029_coordinate_report.json')

    locations=[item['locations'][0] for item in cases if item.get('locations')]
    pages=[int(loc['page']) for loc in locations]
    scores=[float(loc['score']) for loc in locations]
    if len(locations)!=20 or len(set(loc['glyph_id'] for loc in locations))!=20:
        raise RuntimeError('029案例坐标未全部唯一定位')
    if pages!=sorted(pages):
        raise RuntimeError(f'029案例页码未按底稿顺序递增：{pages}')
    if min(scores)<0.50:
        raise RuntimeError(f'029存在低于阈值的坐标：{min(scores)}')

    header=read_json('data/beitie_header_info.json')
    basic=header['029']['basic']
    old_place=basic.pop('原石地点',None)
    basic['刻立地点']='浙江钱塘县西次孤山之原（原葬地；原石久佚）'
    basic['残损统计']='用户确认底稿共标出20个残损方框，整理为20例：文献对校3例、AI暂拟11例、暂无法判断6例。'
    if old_place is None:
        raise RuntimeError('029原石地点字段不存在，无法确认只做定向替换')
    write_json('data/beitie_header_info.json',header)

    catalog=read_json('data/beitie_catalog.json')
    item=next(row for row in catalog if row.get('id')=='029')
    item['subtitle']='完整阅读底稿、第8—31页真实字框与20例残损释读已接入。'
    write_json('data/beitie_catalog.json',catalog)

    details=read_json('data/beitie_details.json')
    previous=details.get('029') or {}
    if previous.get('id')!='029':
        raise RuntimeError('029详情记录不存在')
    details['029']={
        'id':'029',
        'title':'鲜于光祖墓志',
        'cover':'assets/page_images/029_鲜于光祖墓志/images/0001_一.jpg',
        'summary':'《鲜于光祖墓志》由周砥撰文、赵孟頫小楷书并篆盖，盛彪另书合葬缘故。此册为陆恭旧藏明拓本，数字化图像共三十三页。',
        'basic':{
            '时代':'元',
            '年代':'约至元二十四年（1287）书丹；大德二年（1298）合葬',
            '书体':'楷书（小楷）',
            '责任者':'周砥撰；赵孟頫书并篆盖；盛彪书合葬缘故',
            '版本':'陆恭旧藏明拓本',
            '馆藏':'上海图书馆',
            '馆藏号':'18A356'
        },
        'people':[
            {'name':'鲜于光祖','role':'志主','evidence':'墓志正文记其字子初、家世、行事、仕履及卒葬。'},
            {'name':'周砥','role':'撰文者','evidence':'墓志题署“太中大夫常卿兼国子祭酒周砥撰”。'},
            {'name':'赵孟頫','role':'书者、篆盖者','evidence':'墓志题署“奉训兵部郎赵孟頫书并篆盖”。'},
            {'name':'盛彪','role':'合葬缘故书写者','evidence':'册后另有盛彪所书合葬缘故。'},
            {'name':'鲜于枢','role':'志主之子','evidence':'正文及合葬缘故记其请铭、迎柩与择地安葬。'}
        ],
        'timeline':[
            {'time':'1205年','event':'鲜于光祖出生。'},
            {'time':'1281年','event':'鲜于光祖卒于舟中，享年七十七。'},
            {'time':'约1287年','event':'周砥撰志，赵孟頫书并篆盖。'},
            {'time':'1298年','event':'鲜于枢择钱塘县西次孤山之原，与夫人李氏合葬；盛彪书合葬缘故。'},
            {'time':'明代','event':'此册拓本形成，后为陆恭旧藏。'},
            {'time':'今藏','event':'上海图书馆藏，馆藏号18A356。'}
        ],
        'full_text':full,
        'background':'鲜于光祖字子初，墓志重点叙述其任侠尚义、赈济乡里及不屈权贵等事。赵孟頫以小楷书序铭，并篆书碑盖；盛彪另书合葬缘故。原石葬于钱塘县西次孤山之原，后来不知所在。',
        'version':'【作品】鲜于府君墓志铭\n【时代】元\n【撰文】周砥\n【书丹及篆盖】赵孟頫\n【合葬缘故】盛彪书\n【书丹年代】约元至元二十四年（1287）\n【合葬年代】元大德二年（1298）\n【原葬地点】浙江钱塘县西次孤山之原，原石久佚\n【版本】陆恭旧藏明拓本\n【装帧】十四开，其中赵孟頫书序铭十开、盛彪书合葬缘故二开\n【尺寸】册高31厘米，宽15.3厘米；帖芯高25.3厘米，宽11.5厘米\n【馆藏】上海图书馆，馆藏号18A356\n【来源】《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，2012年。'
    }
    write_json('data/beitie_details.json',details)

    coord=ROOT/'js/work-029-coordinate-adapter.js'
    coord_text=coord.read_text(encoding='utf-8').replace('`028_${pageNo}_${index+1}`','`029_${pageNo}_${index+1}`').replace('20260725_xianyu_v1',VERSION)
    coord.write_text(coord_text,encoding='utf-8')

    work=ROOT/'js/work-029.js'
    work_text=work.read_text(encoding='utf-8').replace('20260725_xianyu_v1',VERSION)
    work_text=work_text.replace('本篇底稿共标出20个残损方框，按句子整理为20例。仅在公开录文或局部语境足以支持时提出候选字；证据不足者保留方框并标记为暂无法判断。栏目三与栏目四读取同一份案例数据。','本篇底稿共标出20个残损方框，按句子整理为20例：文献对校3例、AI暂拟11例、暂无法判断6例。证据不足者继续保留方框。栏目三与栏目四读取同一份案例数据。')
    work.write_text(work_text,encoding='utf-8')

    for path_name in ('js/damage_ai_reading.js','js/detail_info_patch.js','detail.html'):
        path=ROOT/path_name
        path.write_text(path.read_text(encoding='utf-8').replace('20260725_xianyu_v1',VERSION),encoding='utf-8')

    report.update({
        'cache_version':VERSION,
        'case_pages':pages,
        'page_sequence_monotonic':True,
        'minimum_location_score':round(min(scores),4),
        'maximum_location_score':round(max(scores),4),
        'mean_location_score':round(sum(scores)/len(scores),4),
        'unique_location_glyphs':len(set(loc['glyph_id'] for loc in locations)),
        'model_square_explanation':'模型分片中029共有231个方框字符；用户确认底稿只标出20处，因此栏目三仅处理这20处，不把其余模型方框自动扩展为案例。',
        'details_placeholder_removed':True,
        'validation_scope':'静态JSON、JavaScript语法、候选/未决数量、33个逐页坐标文件、20个唯一真实bbox和案例页码顺序。浏览器部署验收尚未进行。'
    })
    write_json('data/work029_coordinate_report.json',report)
    print(json.dumps({'pages':pages,'min_score':min(scores),'details_keys':list(details['029'])},ensure_ascii=False))

if __name__=='__main__':
    main()
