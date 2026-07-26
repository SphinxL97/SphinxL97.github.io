from pathlib import Path
from collections import defaultdict
import json
import re

ROOT = Path('.')
VERSION = '20260726_yiheming_036_v1'
WORK_ID = '036'
TITLE = '瘗鹤铭'
MODEL_PATH = ROOT / 'data/model_boxes/glyph_model_border_036_040.json'

FULL_TEXT = '''未遂□。山之下，仙家相此胎禽。浮□袁留，唯髣事髴，亦□□土惟寜。浚蕩洪流，前固重□塏，勢掩華亭，□集真侣□。

上皇嵗得扵華，午嵗化□。未□未遂□也，廼□□黄之幣，蔵乎山之下。仙家□石，事□銘不朽，詞□。相此胎禽，浮□袁留。唯髣髴，事亦□土惟寜。浚蕩洪流，前固重□塏，勢掩華亭，□集真侣。□□山徴君，丹楊外仙尉，□隂真□。'''

CASE_DEFS = [
    {
        'id':'01','title':'未遂吾','original':'未遂□','corrected':'未遂〔吾〕','slots':[1],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['通行录文保存“天其未遂吾翔寥廓耶”的结构。“未遂”之后需要第一人称“吾”作后续动作的主语；水前本模型中“未”“遂”之后紧接残损字框，位置与句法同时吻合。']
    },
    {
        'id':'02','title':'浮丘','original':'浮□袁留','corrected':'浮〔丘〕袁留','slots':[2],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['《瘗鹤铭》相关录文有“相此胎禽，浮丘……”之语。“浮丘”是道教仙人浮丘公之名，因此“浮”后方框补“丘”。方框外的“袁留”仍按用户底稿保留，不把OCR差异混入本例。']
    },
    {
        'id':'03','title':'事亦微厥土惟宁','original':'亦□□土惟寜','corrected':'亦〔微〕〔厥〕土惟寜','slots':[3,4],
        'mode':'mixed','category':'文献对校与AI判断','confidence':'中高',
        'analysis':['原石考释中相邻残片分别保存“事亦微”和“厥土惟宁”。第一方框紧接“亦”，补“微”；第二方框紧邻“土”，补“厥”。两处之间原可能另有残缺文字，但用户底稿没有对应方框，因此不额外插入。']
    },
    {
        'id':'04','title':'前固重扃','original':'前固重□塏','corrected':'前固重〔扃〕塏','slots':[5],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['历代考次本和通行录文均保存“后荡洪流，前固重扃”。“重扃”意为重重门户，方框位于“重”后，补“扃”最为稳定；后面的“塏”属于另一残片，保持底稿原样。']
    },
    {
        'id':'05','title':'爰集真侣瘗','original':'□集真侣□','corrected':'〔爰〕集真侣〔瘗〕','slots':[6,7],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['铭文结尾稳定作“爰集真侣，瘗尔……”。句首方框补承接词“爰”；“真侣”后的方框补表示埋葬的“瘗”，与篇名和葬鹤主题直接对应。没有方框承载的后续文字不加入。']
    },
    {
        'id':'06','title':'甲午岁化与未遂吾','original':'午嵗化□。未□未遂□也','corrected':'午嵗化〔扵〕。未〔其〕未遂〔吾〕也','slots':[8,9,10],
        'mode':'mixed','category':'文献对校与AI判断','confidence':'中',
        'analysis':['完整语序通常为“甲午岁化于朱方，天其未遂吾翔寥廓耶”。“化”后方框对应介词“于”，底稿已有异体“扵”，故补“扵”；第二框按“天其”结构补“其”；“未遂”后补“吾”。方框外的“未”“也”虽疑有OCR差异，但不作改写。']
    },
    {
        'id':'07','title':'乃裹以玄黄之币','original':'廼□□黄之幣','corrected':'廼〔裹〕〔以〕黄之幣','slots':[11,12],
        'mode':'mixed','category':'文献对校与AI判断','confidence':'中高',
        'analysis':['相关录文稳定作“乃裹以玄黄之币”。现有两个方框位于“廼”与“黄”之间，依次补“裹”“以”可恢复连续语法；通行文本中的“玄”没有第三个方框对应，不能擅自加入。']
    },
    {
        'id':'08','title':'立石篆铭词曰','original':'仙家□石，事□銘不朽，詞□','corrected':'仙家〔立〕石，事〔篆〕銘不朽，詞〔曰〕','slots':[13,14,15],
        'mode':'ai_provisional','category':'AI推断补字','confidence':'中',
        'analysis':['碑铭常见固定格式为“立石旌事，篆铭不朽，词曰”。按现有三个槽位，“石”前补“立”，“铭”前补“篆”，“词”后补“曰”。原文可能还缺“故”“旌”等字，但没有对应方框，因此只补现有槽位并标记为AI暂拟。']
    },
    {
        'id':'09','title':'水后本浮丘','original':'浮□袁留','corrected':'浮〔丘〕袁留','slots':[16],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['此处是附水后本中的同一语句。“相此胎禽，浮丘……”有直接录文对应，方框仍补“丘”；方框外文字保持用户底稿。']
    },
    {
        'id':'10','title':'厥土惟宁','original':'事亦□土惟寜','corrected':'事亦〔厥〕土惟寜','slots':[17],
        'mode':'ai_provisional','category':'AI推断补字','confidence':'低至中',
        'analysis':['原石相邻结构包括“事亦微……”与“厥土惟宁”。本底稿只在“土”前保留一个方框，从紧邻关系和固定短语看补“厥”可组成“厥土惟寜”。由于一个方框可能压缩了更大的缺损范围，本例列为AI暂拟。']
    },
    {
        'id':'11','title':'水后本前固重扃','original':'前固重□塏','corrected':'前固重〔扃〕塏','slots':[18],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['附水后本此处仍与“前固重扃”直接对应。方框位于“重”与“塏”之间，按原石考释补“扃”。']
    },
    {
        'id':'12','title':'水后本爰集真侣','original':'□集真侣','corrected':'〔爰〕集真侣','slots':[19],
        'mode':'documentary','category':'文献可确认','confidence':'高',
        'analysis':['原石和早期录文均保存“爰集真侣”。方框位于“集”前，补承接词“爰”，位置和语义明确。']
    },
    {
        'id':'13','title':'瘗尔与署名','original':'□□山徴君，丹楊外仙尉，□隂真□','corrected':'〔瘗〕〔爾〕山徴君，丹楊外仙尉，〔江〕隂真〔宰〕','slots':[20,21,22,23],
        'mode':'mixed','category':'文献对校与AI判断','confidence':'中高',
        'analysis':['“真侣”之后的两个方框与原石结尾“瘗尔”相接，因此分别补“瘗”“爾”，并非“山徴君”的称谓前缀。署名中的“丹阳外仙尉”“江阴真宰”有直接考释依据，“□隂真□”补为“江隂真宰”。“山徴君”前可能另有争议残字，但底稿没有额外方框，不再补入。']
    }
]


def dump(path, obj, *, indent=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=indent, separators=None if indent else (',', ':')), encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'{label}: target not found: {old[:80]}')
    return text.replace(old, new, 1)


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

# 1. Filter and validate all real model rows.
all_rows = load_json(MODEL_PATH)
rows = [r for r in all_rows if str(r.get('work_id')) == WORK_ID]
rows.sort(key=lambda r: (int(r.get('canvas_index') or 0), int(r.get('order_in_page') or 0)))
if not rows:
    raise RuntimeError('No 036 model rows found')
box_rows = [r for r in rows if str(r.get('char') or '') == '□']
slot_count = FULL_TEXT.count('□')
if slot_count != 23:
    raise RuntimeError(f'Unexpected transcript slot count: {slot_count}')
if len(box_rows) != slot_count:
    raise RuntimeError(f'Model □ count {len(box_rows)} does not equal transcript slot count {slot_count}')

# 2. Create per-page real coordinate JSON files.
by_page = defaultdict(list)
for row in rows:
    by_page[int(row['canvas_index'])].append(row)
coord_root = ROOT / 'data/glyph_boxes/iiif/036'
coord_root.mkdir(parents=True, exist_ok=True)
for old in coord_root.glob('page_*.json'):
    old.unlink()
for page, page_rows in sorted(by_page.items()):
    page_rows.sort(key=lambda r: int(r.get('order_in_page') or 0))
    dump(coord_root / f'page_{page:04d}.json', page_rows)

# 3. Save the exact user-confirmed transcript.
(ROOT / 'data/work036_full_text.txt').write_text(FULL_TEXT + '\n', encoding='utf-8')

# 4. Bind the 23 transcript slots to the 23 real model □ rows in reading order.
slot_map = {index + 1: row for index, row in enumerate(box_rows)}
cases = []
for spec in CASE_DEFS:
    locations = []
    for slot in spec['slots']:
        row = slot_map[slot]
        locations.append({
            'slot': slot,
            'page': int(row['canvas_index']),
            'glyph_id': str(row['glyph_id']),
            'char': '□',
            'bbox': {'x': int(row['x']), 'y': int(row['y']), 'w': int(row['w']), 'h': int(row['h'])},
            'canvas_width': int(row['canvas_width']),
            'canvas_height': int(row['canvas_height']),
            'order_in_page': int(row.get('order_in_page') or 0),
            'source': str(row.get('source') or 'model_border_refined'),
            'match_method': 'approved-slot-order-exact-count',
            'match_confidence': 'high' if spec['confidence'] == '高' else 'reviewed'
        })
    case = dict(spec)
    case['n'] = '残损碑文恢复'
    case['t'] = spec['title']
    case['o'] = spec['original']
    case['c'] = spec['corrected']
    case['page'] = locations[0]['page']
    case['locations'] = locations
    cases.append(case)
if sum(len(c['slots']) for c in cases) != 23:
    raise RuntimeError('Case slot coverage is not 23')
dump(ROOT / 'data/work036_damage_cases.json', cases)

# 5. Coordinate report.
report = {
    'work_id': WORK_ID,
    'title': TITLE,
    'model_file': str(MODEL_PATH).replace('\\', '/'),
    'model_rows': len(rows),
    'pages_with_model_rows': len(by_page),
    'page_range_with_model_rows': [min(by_page), max(by_page)],
    'model_box_rows': len(box_rows),
    'transcript_box_slots': slot_count,
    'case_count': len(cases),
    'bound_case_count': sum(1 for c in cases if c['locations']),
    'unbound_case_count': sum(1 for c in cases if not c['locations']),
    'binding_rule': '审核稿确认后，先自动断言036模型中的□字框总数与两段用户底稿的23个方框完全相等，再按两者阅读顺序一一绑定；数量不相等时构建直接失败。',
    'visible_caption_rule': '《瘗鹤铭》第X页，对应问题字局部；页面不显示glyph_id，也不提供内部编号悬停提示。',
    'pages': [{'page': p, 'row_count': len(by_page[p]), 'box_count': sum(1 for r in by_page[p] if r.get('char') == '□')} for p in sorted(by_page)],
    'case_locations': [{'id': c['id'], 'title': c['title'], 'slots': c['slots'], 'page': c['page'], 'glyph_ids': [loc['glyph_id'] for loc in c['locations']]} for c in cases]
}
dump(ROOT / 'data/work036_coordinate_report.json', report, indent=2)

# 6. Fill page text and char-box availability for all 78 pages.
index_path = ROOT / 'data/page_images_index.json'
page_index = load_json(index_path)
work = page_index['works'][WORK_ID]
if len(work.get('pages', [])) != 78:
    raise RuntimeError(f'Expected 78 pages, got {len(work.get("pages", []))}')
for page_obj in work['pages']:
    page_no = int(page_obj['page'])
    page_rows = sorted(by_page.get(page_no, []), key=lambda r: int(r.get('order_in_page') or 0))
    chars = [str(r.get('char') or '') for r in page_rows]
    page_obj['text_clean'] = ''.join(chars)
    page_obj['text_raw'] = '\n'.join(chars)
    page_obj['char_count'] = len(chars)
    page_obj['has_char_boxes'] = bool(page_rows)
dump(index_path, page_index, indent=2)

# 7. Update catalog metadata only for 036.
catalog_path = ROOT / 'data/beitie_catalog.json'
catalog = load_json(catalog_path)
entry = next((x for x in catalog if str(x.get('id')).zfill(3) == WORK_ID), None)
if not entry:
    raise RuntimeError('036 catalog entry missing')
entry.update({
    'title': TITLE,
    'dynasty': '南朝梁（传为天监十三年，514）',
    'script': '正书',
    'creator': '华阳真逸撰、上皇山樵书（石刻署名；归属有争议）',
    'status': '专属内容已接入',
    'subtitle': f'78页图像、用户确认底稿、13例残损释读与{len(rows)}个真实模型字框已接入。',
    'year': '514',
    'canvas_count': 78
})
dump(catalog_path, catalog, indent=2)

# 8. Update header metadata only for 036.
header_path = ROOT / 'data/beitie_header_info.json'
header = load_json(header_path)
basic = header.setdefault(WORK_ID, {'source_file':'瘗鹤铭.txt','title':TITLE,'basic':{}}).setdefault('basic', {})
basic.clear()
basic.update({
    '首题': TITLE,
    '责任者': '华阳真逸撰，上皇山樵书（石刻署名；具体作者、书者存争议）',
    '书体': '正书',
    '版本': '明水前小扑小纸拓本，附水后本',
    '数量': '13开；数字化图像78页',
    '尺寸': '册高34厘米，宽18.2厘米。碑文10开，帖芯高27.4厘米，宽15.2厘米。',
    '刻立年代': '南朝梁（传为天监十三年，514）',
    '刻立地点': '江苏镇江焦山西麓崖壁',
    '馆藏': '上海图书馆',
    '馆藏号': '19A353',
    '来源': '《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第一辑，上海图书馆，上海古籍出版社，2006年',
    '版本说明': '本册为明水前小扑小纸拓本并附水后本，装裱13开；网站78页为数字化图像数，二者不是同一计数口径。',
    '残损统计': f'用户底稿共23个方框，整理13组栏目三案例，23个均给出候选；13例均绑定真实模型□字框。模型共{len(rows)}个字框，分布于{len(by_page)}页。'
})
header[WORK_ID]['source_file'] = '瘗鹤铭.txt'
header[WORK_ID]['title'] = TITLE
dump(header_path, header, indent=2)

# 9. Build 036 scripts from the proven 035 implementation.
work035 = (ROOT / 'js/work-035.js').read_text(encoding='utf-8')
work036 = work035.replace('035', '036').replace('work035', 'work036').replace('WUSHICI', 'YIHEMING').replace('wushici', 'yiheming').replace('武氏祠画像题字', TITLE)
work036 = re.sub(r'20260726_[A-Za-z0-9_]+_036_v4', VERSION, work036)
work036 = re.sub(r'const INTRO="[^"]*";', 'const INTRO="本栏目整理13组《瘗鹤铭》水前本与附水后本残文校读，覆盖用户底稿全部23个方框。能够由历代录文确认时采用文献对校；底稿存在错序、粘连或方框不足时，按审核稿给出混合判断或AI暂拟，并在“AI分析依据”中逐项说明。栏目二保留用户确认原文，栏目三只使用真实模型坐标。";', work036, count=1)
replacement_info = '''function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="江苏镇江焦山西麓摩崖石刻，以葬鹤为题，现存水前、水后不同拓本形态。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本构成"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("水前小扑小纸拓本并附水后本，数字图像78页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("作者争议"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("石刻署“华阳真逸撰、上皇山樵书”，具体作者与书者历来存在不同说法。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">原刻地点</div><div class="modal-desc">江苏镇江焦山西麓崖壁。</div><div class="modal-term">版本形态</div><div class="modal-desc">本册为明水前小扑小纸拓本，并附水后本；网站收录数字图像78页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>葬鹤与摩崖</h3><p>《瘗鹤铭》以仙鹤死后埋葬为主题，文字散布于焦山崖石，因坠江、出水和拓制时期不同，形成水前本与水后本等版本差异。</p><p>栏目二保留用户确认的两段残文和全部方框；栏目三按审核稿逐例给出候选，并明确区分文献可确认、混合判断和AI推断。</p>';
  }'''
work036, count = re.subn(r'function applySupplementalInfo\(\)\{.*?\n  \}', replacement_info, work036, count=1, flags=re.S)
if count != 1:
    raise RuntimeError('Could not replace supplemental info function')
(ROOT / 'js/work-036.js').write_text(work036, encoding='utf-8')

coord035 = (ROOT / 'js/work-035-coordinate-adapter.js').read_text(encoding='utf-8')
coord036 = coord035.replace('035', '036').replace('work-035', 'work-036').replace('WORK_035', 'WORK_036').replace('武氏祠画像题字', TITLE)
coord036 = re.sub(r'20260726_[A-Za-z0-9_]+_036_v4', VERSION, coord036)
(ROOT / 'js/work-036-coordinate-adapter.js').write_text(coord036, encoding='utf-8')

# 10. Register 036 in the shared router.
router_path = ROOT / 'js/damage_ai_reading.js'
router = router_path.read_text(encoding='utf-8')
router = replace_once(router, 'if(window.__DAMAGE_AI_READING_ROUTER_V79__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V79__=true;', 'if(window.__DAMAGE_AI_READING_ROUTER_V80__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V80__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V79__=true;', 'router guard')
route035 = '    "035":[{src:"js/work-035-coordinate-adapter.js?v=20260726_wushici_035_v4",key:"w035c",ready:()=>Boolean(window.__WORK_035_COORDINATE_ADAPTER__)},{src:"js/work-035.js?v=20260726_wushici_035_v4",key:"w035",ready:()=>Boolean(window.__WORK_035_STABLE_READY__&&window.__WORK_035_CROWDSOURCE_READY__)}]'
route036 = '    "036":[{src:"js/work-036-coordinate-adapter.js?v='+VERSION+'",key:"w036c",ready:()=>Boolean(window.__WORK_036_COORDINATE_ADAPTER__)},{src:"js/work-036.js?v='+VERSION+'",key:"w036",ready:()=>Boolean(window.__WORK_036_STABLE_READY__&&window.__WORK_036_CROWDSOURCE_READY__)}]'
router = replace_once(router, route035, route035 + ',\n' + route036, '036 route')
router = replace_once(router, '"035":"武氏祠画像题字"};', '"035":"武氏祠画像题字","036":"瘗鹤铭"};', 'router title')
router = replace_once(router, '"033","034","035"].includes(id)', '"033","034","035","036"].includes(id)', 'router mask')
router_path.write_text(router, encoding='utf-8')

# 11. Register 036 in the detail entry and bump cache tags.
detail_patch_path = ROOT / 'js/detail_info_patch.js'
detail_patch = detail_patch_path.read_text(encoding='utf-8')
detail_patch = replace_once(detail_patch, 'if(window.__DETAIL_INFO_STABLE_ENTRY_V39__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V39__=true;', 'if(window.__DETAIL_INFO_STABLE_ENTRY_V40__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V40__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V39__=true;', 'detail guard')
detail_patch = detail_patch.replace('20260726_wushici_035_v4', VERSION)
detail_patch = replace_once(detail_patch, '"033","034","035"]);', '"033","034","035","036"]);', 'routed works')
detail_patch = replace_once(detail_patch, '"034":"章吉老墓志","035":"武氏祠画像题字"};', '"034":"章吉老墓志","035":"武氏祠画像题字","036":"瘗鹤铭"};', 'detail names')
detail_patch_path.write_text(detail_patch, encoding='utf-8')

# 12. Bust the two shared entry script caches in detail.html.
detail_html_path = ROOT / 'detail.html'
detail_html = detail_html_path.read_text(encoding='utf-8').replace('20260726_wushici_035_v4', VERSION)
detail_html_path.write_text(detail_html, encoding='utf-8')

print(json.dumps({
    'model_rows': len(rows),
    'pages_with_rows': len(by_page),
    'model_boxes': len(box_rows),
    'cases': len(cases),
    'first_box': box_rows[0]['glyph_id'],
    'last_box': box_rows[-1]['glyph_id']
}, ensure_ascii=False, indent=2))
