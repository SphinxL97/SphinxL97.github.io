from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TEXT=ROOT/'data/work028_full_text.txt'
CASES=ROOT/'data/work028_damage_cases.json'
REPORT=ROOT/'data/work028_coordinate_report.json'
AUDIT=ROOT/'data/work028_case_audit.txt'
VERSION_OLD='20260725_jintang_nine_v1'
VERSION_NEW='20260725_jintang_nine_v2'
VERSION_FILES=[ROOT/'js/work-028.js',ROOT/'js/work-028-coordinate-adapter.js',ROOT/'js/damage_ai_reading.js',ROOT/'js/detail_info_patch.js',ROOT/'detail.html']

NPM_HUANG='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/28094?dep=P&mode=full'
NPM_YUEYI='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21574?dep=P&mode=full'
NPM_CAOE='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21576?dep=P&mode=full'
NPM_DONGFANG='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21577?dep=P&mode=full'
NPM_LUOSHEN='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21578?dep=P&mode=full'
NPM_POXIE='https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/21579?dep=P&mode=full'
WIKI_LANTING='https://zh.wikisource.org/wiki/蘭亭集序'
WIKI_AICE='https://zh.wikisource.org/wiki/唐太宗文皇帝哀冊文'

# id: (按原方框次序的候选字符串列表, 补后显示句, 模式, 依据说明, 参考网址)
# 候选可为多字，表示一个残位在传世录文中对应一段脱文；每个原方框仍只对应一个〔〕。
FIXES={
 '010':(['玉','樹','令','可','壯'],'養子〔玉〕〔樹〕〔令〕〔可〕〔壯〕。','documentary','故宫录文作“養子玉樹令可壯”，底稿“養行”中的“行”按同册异本校为“子”。',NPM_HUANG),
 '031':(['為','氣','三'],'肺之〔為〕〔氣〕〔三〕焦起。','ai_provisional','传世《黄庭经》此处句式为“肺之為氣三焦起”；底稿在方框前另存一“為”，疑为重识，故候选虽有录文支持，仍按版面语境暂拟。',NPM_HUANG),
 '033':(['落'],'下于嚨喉何落〔落〕。','documentary','故宫录文作“下于嚨喉何落落”，底稿“龍侯”属于形近误识。',NPM_HUANG),
 '036':(['敻'],'右軍摛華，〔敻〕絕今古。','ai_provisional','相关题跋有“夐绝千古”与“敻绝今古”两种著录；本册现存“敻”前另有一残位，按句法拟作“敻”，但不伪称唯一答案。',''),
 '037':(['若'],'遺蹤展翫，〔若〕龍蟠鳳翥。','ai_provisional','传世题跋常作“遗踪展玩，龙蟠凤翥”；本册在“龙”前多一残位，依比况句式暂拟“若”。',''),
 '038':(['足','以','冠'],'藏諸巾襲，〔足〕〔以〕〔冠〕耀書府。','ai_provisional','相关题跋作“藏诸巾袭，冠耀书府”；本册三处连续残位据语法补作“足以冠”，属于语境扩补。',''),
 '039':(['其','旨','趣'],'或者〔其〕〔旨〕〔趣〕未盡乎。','ai_provisional','通行《乐毅论》作“或者其未尽乎”；本册连续三处残位多于通行本，依据“乐氏之趣”上下文拟为“其旨趣”。',NPM_YUEYI),
 '045':(['武之事矣。樂生方恢'],'則幾扵湯〔武之事矣。樂生方恢〕大綱。','documentary','通行录文在“汤”后有“武之事矣，乐生方恢大纲”，本册一个长残位覆盖该段。',NPM_YUEYI),
 '046':(['信。以待其弊。使即墨莒人。顧'],'牧民眀〔信。以待其弊。使即墨莒人。顧〕仇其上。','documentary','通行录文为“牧民明信，以待其弊，使即墨莒人顾仇其上”，本册残位覆盖中间长段。',NPM_YUEYI),
 '047':(['戈'],'願釋干〔戈〕。','documentary','固定词为“干戈”。',NPM_YUEYI),
 '048':(['仁得仁。即墨大夫之義也。任窮則從'],'然則求〔仁得仁。即墨大夫之義也。任窮則從〕。','documentary','通行录文在“求”后保存“仁得仁……任穷则从”，本册一个长残位覆盖该段。',NPM_YUEYI),
 '049':(['周'],'微子適〔周〕。','documentary','典故为“微子适周”。',NPM_YUEYI),
 '050':(['祖'],'其先與周同〔祖〕。','documentary','曹娥碑传世录文作“其先与周同祖”。',NPM_CAOE),
 '059':(['乍','乍','浮'],'〔乍〕沉〔乍〕〔浮〕。','documentary','传世录文作“乍沉乍浮”，与上下水势描写相合。',NPM_CAOE),
 '060':(['共'],'千夫〔共〕聲。','documentary','传世录文作“千夫共声”。',NPM_CAOE),
 '078':(['明節'],'〔明節〕不可以乆安也。','documentary','《东方朔画赞》通行文作“明节不可以久安也”，一个残位覆盖两字。',NPM_DONGFANG),
 '082':(['矯矯'],'〔矯矯〕先生。','documentary','赞辞起句为“矫矫先生”。',NPM_DONGFANG),
 '099':(['寫','賦'],'子敬好〔寫〕洛神〔賦〕，人間合有數本，奉此其一焉。','documentary','柳公权题记通行录文作“子敬好写洛神赋，人间合有数本，奉此其一焉”。',NPM_LUOSHEN),
 '100':(['吳郡','虞','并'],'太子中書舍人〔吳郡〕〔虞〕世南撰〔并〕書。','documentary','题署通行录文为“太子中书舍人吴郡虞世南撰并书”。',NPM_POXIE),
 '101':(['邃'],'至理凝〔邃〕。','documentary','《破邪论序》通行文作“至理凝邃”。',NPM_POXIE),
 '104':(['窺','其','窅'],'〔窺〕〔其〕〔窅〕冥者乎。','documentary','通行文为“安可凭诸天纵，窥其窅冥者乎”。底稿“寘”按文义校为“冥”。',NPM_POXIE),
 '108':(['爰','迺'],'〔爰〕祖〔迺〕伯。','documentary','故宫录文作“爰祖迺伯”。',NPM_POXIE),
 '112':(['留','翕'],'〔留〕連清〔翕〕。','documentary','故宫录文此处保存“留连清翕”的字序；“翕”为生僻用字，仍以〔〕标示。',NPM_POXIE),
 '113':(['迺用'],'比地方春〔迺用〕顯仁之量。','documentary','通行录文在“方春”后为“迺用显仁之量”，一个残位对应两字。',NPM_POXIE),
 '116':(['至'],'〔至〕人之羽儀者矣。','documentary','固定搭配为“至人之羽仪”。',NPM_POXIE),
 '125':(['於山'],'披薜荔〔於山〕阿。','documentary','通行录文作“披薜荔于山阿”，一个残位覆盖“于山”。',NPM_POXIE),
 '127':(['壑'],'長松巨〔壑〕。','documentary','传世录文作“长松巨壑”；底稿“臣”按形近字校为“巨”。',NPM_POXIE),
 '134':(['冰'],'瓦解〔冰〕銷。','documentary','通行文作“瓦解冰销”，底稿“凡解□锁”为连续形近误识。',NPM_POXIE),
 '145':(['有崇'],'此地〔有崇〕山峻嶺，茂林脩竹，又有清流激湍，映帶左右。','documentary','《兰亭集序》通行文作“此地有崇山峻岭……映带左右”，一个残位覆盖“有崇”。',WIKI_LANTING),
 '153':(['也'],'後之視今，亦由今之視昔〔也〕。','ai_provisional','通行本在“视昔”后直接句断，本册却保留一处残位；依判断句语气暂拟“也”。',WIKI_LANTING),
 '180':(['醬漿'],'上合三焦道飲〔醬漿〕。','documentary','故宫《黄庭经》录文作“上合三焦道饮浆”，同册另一通本作“饮酱浆”；一个残位按同册异文补两字。',NPM_HUANG),
 '188':(['吉'],'昇元三年十月〔吉〕日重題。','ai_provisional','故宫著录仅作“十月日”，具体日序缺失；依题识常用“吉日”暂拟，不视为定论。',NPM_HUANG),
 '189':(['校'],'殿副使，知崇英院事兼文房官撿〔校〕工部尚書臣王庚。','documentary','官衔固定写法为“检校工部尚书”。',NPM_HUANG),
 '190':(['歲次己酉五月甲辰朔'],'維貞觀廿三年〔歲次己酉五月甲辰朔〕廿六日己巳，太宗皇帝崩于翠微宫之含風殿。','documentary','《唐太宗文皇帝哀册文》开篇作“维贞观廿三年岁次己酉五月甲辰朔廿六日己巳……含风殿”，一个长残位覆盖纪年。',WIKI_AICE),
 '192':(['軫'],'溘化同〔軫〕，綿區縞素。','documentary','通行录文作“溘化同轸，绵区缟素”；底稿“化同□绵，区缟素”存在断句错位。',WIKI_AICE),
 '193':(['彼'],'廹宗祧之是寄，傷〔彼〕往駕之無慿。','ai_provisional','通行本多作“迫宗祧之是寄，伤往驾之无凭”，本册在“伤”后确有残位，依指代关系暂拟“彼”。',WIKI_AICE),
 '194':(['宇','其','曰'],'爰詔司存，傳芳瓊〔宇〕。〔其〕詞〔曰〕：三微。','documentary','通行录文为“爰诏司存，传芳琼宇。其词曰：三微”。',WIKI_AICE),
 '197':(['懷'],'夙表餘雄，先〔懷〕反正。','documentary','通行录文作“夙表余雄，先怀反正”；底稿“及正”按传本校为“反正”。',WIKI_AICE),
 '201':(['修','睿'],'〔修〕風順軌，凝圖奉〔睿〕。','documentary','通行录文作“修风顺轨，凝图奉睿”；底稿“疑啚”按传本校为“凝图”。',WIKI_AICE),
 '205':(['質','鳥'],'東旌若木，西旆條支；龍鄉委〔質〕，〔鳥〕服來儀。','documentary','哀册录文作“东旌若木，西旆条支；龙乡委质，鸟服来仪”。',WIKI_AICE),
 '209':(['荑','凝','於'],'松〔荑〕望幸，瑶華方薦；仙丹斂術，星飛告變；〔凝〕濔氣〔於〕升年，掩璿暉扵離殿。','documentary','刻帖录文作“松荑望幸……凝濔气于升年”，三处候选与残位顺序对应。',WIKI_AICE),
 '211':(['脩'],'商管初飛，秋絃罷〔脩〕。','documentary','本册刻帖异文作“秋弦罢脩”，并非通行本“钧天罢舞”，应尊重本册字序。',WIKI_AICE),
 '213':(['凝','溯'],'情其知失〔凝〕清秋扵廣路，〔溯〕悲風扵長經。','documentary','刻帖录文保留“凝清秋于广路，溯悲风于长经”的句式；底稿逗号位置错置。',WIKI_AICE),
 '214':(['笳','之','周','甫'],'迤動邊〔笳〕〔之〕蕭瑟。嗚呼哀㦲！〔周〕營〔甫〕竁，漢泉闈。','documentary','刻帖录文作“迤动边笳之萧瑟……周营甫竁，汉泉闱”，四处残位按次序补入。',WIKI_AICE),
 '215':(['搖','落','喬'],'榖林〔搖〕〔落〕，〔喬〕嚴變裏；平原凄号，白日逺。','documentary','刻帖录文保存“谷林摇落，乔严变里”的字序；本句断句据文意重排。',WIKI_AICE),
 '216':(['玄'],'崤陵〔玄〕壤，隅山窮路。','documentary','刻帖录文作“崤陵玄壤”。',WIKI_AICE),
 '217':(['輕','池','委'],'虚衛飜英，〔輕〕〔池〕〔委〕素；羲庭易晚，松隂難曙。','documentary','刻帖录文保存“轻池委素”的连续字序。',WIKI_AICE),
 '218':(['悲','靈','沍'],'萬方〔悲〕而兩泣，三〔靈〕慘而雲〔沍〕。','documentary','刻帖录文作“万方悲而两泣，三灵惨而云沍”。',WIKI_AICE),
 '222':(['右','于'],'裕扵唐堯。嗚呼哀㦲！〔右〕〔于〕瓌。','ai_provisional','相关著录在哀册正文后见“于瓌。右文皇哀册”字样，只能确认“于瓌”；本册在“瓌”前有两处残位，第一字暂拟“右”，故整例标为AI暂拟。',WIKI_AICE),
 '223':(['在','諸','名','士'],'〔在〕唐賢〔諸〕〔名〕世〔士〕書中為秀頴。','documentary','褚遂良题跋通行著录作“在唐贤诸名世士书中为秀颖”。',''),
 '224':(['頴','羲','字','有','隸'],'〔頴〕。淂〔羲〕之法最多者，真〔字〕〔有〕〔隸〕法，自一成家。','documentary','题跋通行著录作“秀颖。得羲之法最多者，真字有隶法，自成一家”。',''),
 '225':(['蓋'],'此書〔蓋〕其晚年筆。','documentary','题跋通行著录作“此书盖其晚年笔”。',''),
 '226':(['月','初','友','仁'],'绍興丙辰十二〔月〕〔初〕五日，臣〔友〕〔仁〕審定。','documentary','题跋通行著录作“绍兴丙辰十二月初五日，臣友仁审定”。',''),
}


def bracket_count(value:str)->int:
    return value.count('〔')


def main()->None:
    text=TEXT.read_text(encoding='utf-8')
    rows=json.loads(CASES.read_text(encoding='utf-8'))
    by_id={str(row['id']).zfill(3):row for row in rows}
    missing=sorted(set(FIXES)-set(by_id))
    if missing: raise RuntimeError(f'找不到案例：{missing}')

    for case_id,(slots,corrected,mode,reason,url) in FIXES.items():
        row=by_id[case_id]
        old=str(row['corrected'])
        expected=int(row['square_count'])
        if len(slots)!=expected:
            raise RuntimeError(f'{case_id} 候选槽数{len(slots)} != 方框数{expected}')
        if bracket_count(corrected)!=expected:
            raise RuntimeError(f'{case_id} 补后句括号数{bracket_count(corrected)} != 方框数{expected}')
        if old not in text:
            raise RuntimeError(f'{case_id} 全文找不到旧补后句：{old}')
        text=text.replace(old,corrected,1)
        category='文献对校' if mode=='documentary' else 'AI暂拟'
        confidence='较高' if mode=='documentary' else '中'
        candidate='｜'.join(slots)
        row.update({
            'candidate':candidate,
            'candidate_count':expected,
            'corrected':corrected,
            'c':corrected,
            'current_context':corrected.replace('〔','').replace('〕',''),
            'mode':mode,
            'category':category,
            'confidence':confidence,
            'remaining_square_count':0,
            'reference':f'{reason}{"："+url if url else ""}',
            'analysis':[
                f'本例原句含{expected}个残损方框，按方框先后次序拟补为“{candidate}”；补后文句为“{corrected.replace("〔","").replace("〕","")}”。',
                reason,
                f'候选字与第{row.get("page","—")}页真实残损方框按阅读顺序对应。网站在原始OCR栏保留□，在补字结果中以〔〕标示候选；本例判定为“{category}”，置信度为“{confidence}”。'
            ]
        })

    if '□' in text: raise RuntimeError('完整释文仍含方框')
    for row in rows:
        if '□' in str(row.get('corrected','')) or '□' in str(row.get('current_context','')):
            raise RuntimeError(f"案例{row['id']}仍含方框")
        if int(row.get('candidate_count',0))!=int(row.get('square_count',0)):
            raise RuntimeError(f"案例{row['id']}候选计数错误")
        if not row.get('locations') or not row['locations'][0].get('bbox'):
            raise RuntimeError(f"案例{row['id']}缺少真实坐标")
        if len(row.get('analysis',[]))<3:
            raise RuntimeError(f"案例{row['id']}缺少分析")

    TEXT.write_text(text,encoding='utf-8')
    CASES.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    report=json.loads(REPORT.read_text(encoding='utf-8'))
    report.update({
        'documentary_case_count':sum(row.get('mode')=='documentary' for row in rows),
        'ai_provisional_case_count':sum(row.get('mode')=='ai_provisional' for row in rows),
        'unresolved_case_count':0,
        'candidate_count':sum(int(row['candidate_count']) for row in rows),
        'remaining_square_count':0,
        'cache_version':VERSION_NEW,
        'manual_reviewed_case_count':len(FIXES),
        'manual_review_policy':'逐例检查原句、候选和补后句；对自动对齐中的重复字、长段脱文和题跋错位进行人工校正，证据不足者明确标为AI暂拟。',
    })
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    for path in VERSION_FILES:
        value=path.read_text(encoding='utf-8').replace(VERSION_OLD,VERSION_NEW)
        path.write_text(value,encoding='utf-8')

    lines=[]
    for row in rows:
        lines.append(f"{row['id']}\t{row.get('section','')}\t{row.get('category','')}\t原：{row.get('original','')}\t候：{row.get('candidate','')}\t补：{row.get('corrected','')}")
    AUDIT.write_text('\n'.join(lines)+'\n',encoding='utf-8')

    assert report['candidate_count']==report['base_text_square_count']==347
    assert len(rows)==report['case_count']==226
    assert report['documentary_case_count']+report['ai_provisional_case_count']==226
    print(json.dumps({'reviewed':len(FIXES),'documentary':report['documentary_case_count'],'ai_provisional':report['ai_provisional_case_count'],'candidates':report['candidate_count']},ensure_ascii=False))

if __name__=='__main__':
    main()
