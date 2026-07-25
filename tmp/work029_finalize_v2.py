from __future__ import annotations

import copy
import json
import re
from pathlib import Path

ROOT = Path('.')
VERSION = '20260725_xianyu029_v1'


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def save_json(path: str, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


full_text = (ROOT / 'data/work029_full_text.txt').read_text(encoding='utf-8')
cases = load_json('data/work029_damage_cases.json')
shard = load_json('data/model_boxes/glyph_model_border_026_030.json')
page_index = load_json('data/page_images_index.json')

assert full_text.count('□') == 20
assert len(cases) == 16
assert [c['id'] for c in cases] == [f'{i:03d}' for i in range(1, 17)]
assert sum(c['original'].count('□') for c in cases) == 16
assert all(c['original'].count('□') == 1 for c in cases)
assert all('□' not in c['corrected'] for c in cases)
assert sum(c['mode'] == 'documentary' for c in cases) == 2
assert sum(c['mode'] == 'ai_provisional' for c in cases) == 14

work_pages = page_index['works']['029']['pages']
image_by_page = {}
for fallback_page, page_record in enumerate(work_pages, 1):
    page_no = int(
        page_record.get('canvas_index')
        or page_record.get('page')
        or page_record.get('page_no')
        or page_record.get('page_index')
        or fallback_page
    )
    image_path = page_record.get('image') or page_record.get('local_image') or page_record.get('path')
    assert image_path, (page_no, page_record)
    image_by_page[page_no] = image_path
assert len(image_by_page) == 33

model = [copy.deepcopy(r) for r in shard if str(r.get('work_id', '')).zfill(3) == '029']
assert len(model) == 1769
pages: dict[int, list[dict]] = {}
for record in model:
    page = int(record['canvas_index'])
    x, y, w, h = map(float, (record['x'], record['y'], record['w'], record['h']))
    assert w > 0 and h > 0
    char = str(record.get('char') or record.get('text') or '')[:1]
    record.update({
        'work_id': '029',
        'canvas_index': page,
        'glyph_id': str(record.get('glyph_id') or f"029_{page}_{len(pages.get(page, [])) + 1}"),
        'char': char,
        'text': char,
        'order_in_page': int(record.get('order_in_page') or len(pages.get(page, [])) + 1),
        'bbox_x': x,
        'bbox_y': y,
        'bbox_w': w,
        'bbox_h': h,
        'bbox': [x, y, w, h],
    })
    pages.setdefault(page, []).append(record)
assert sorted(pages) == list(range(8, 32))

coord_root = ROOT / 'data/glyph_boxes/iiif/029'
coord_root.mkdir(parents=True, exist_ok=True)
for old in coord_root.glob('page_*.json'):
    old.unlink()
for page, rows in pages.items():
    rows.sort(key=lambda r: r['order_in_page'])
    save_json(f'data/glyph_boxes/iiif/029/page_{page:04d}.json', rows)


def locate(page: int, sequence: str, offset: int):
    rows = pages[page]
    chars = ''.join(str(r.get('char', ''))[:1] for r in rows)
    starts = [m.start() for m in re.finditer(re.escape(sequence), chars)]
    assert len(starts) == 1, (page, sequence, starts, chars)
    return rows[starts[0] + offset]


location_specs = {
    '001': (9, '鮮于君初自范陽□家於博', 7, ''),
    '003': (13, '願以埋銘為□予', 5, ''),
    '004': (14, '高□□始', 2, '“高”后有两个真实残损槽位，本案例定位至紧邻“始”的第二个槽位。'),
    '005': (15, '入償□謂之曰', 2, ''),
    '006': (16, '貧不能舉□者', 4, ''),
    '007': (17, '轉□許臺', 1, ''),
    '008': (18, '道理□刮去', 2, ''),
    '011': (22, '其能□□圍武昌', 3, '“圍”前有两个真实残损槽位，本案例定位至紧邻“圍”的第二个槽位。'),
    '012': (23, '又無戰多□以', 4, ''),
    '013': (24, '泣血迎□藳', 3, ''),
    '014': (25, '勇退□不盡施', 2, '用户底稿方框疑似错位；此处框选真实残损槽位，不使用后面的完整“不”字代替。'),
    '016': (27, '手□鯨', 1, ''),
}

for case in cases:
    case['current_context'] = case['corrected']
    case['box_count'] = 1
    case['candidate_count'] = 1
    case['retained_box_count'] = 0
    case['locations'] = []
    spec = location_specs.get(case['id'])
    if spec:
        page, sequence, offset, note = spec
        row = locate(page, sequence, offset)
        x, y, w, h = row['bbox']
        case['locations'] = [{
            'page': page,
            'glyph_id': row['glyph_id'],
            'char': row['char'],
            'bbox': {'x': x, 'y': y, 'w': w, 'h': h},
            'canvas': {'w': int(row['canvas_width']), 'h': int(row['canvas_height'])},
            'image': image_by_page[page],
            'verification': '当前页局部字符序列＋问题槽位＋前后锚点',
            'note': note,
        }]
assert sum(bool(c['locations']) for c in cases) == 12
save_json('data/work029_damage_cases.json', cases)

report = {
    'work_id': '029',
    'title': '鲜于光祖墓志',
    'source': 'data/model_boxes/glyph_model_border_026_030.json',
    'coordinate_policy': '仅使用仓库既有深度学习模型真实坐标；不生成、不估算bbox。',
    'image_total': 33,
    'coordinate_pages': list(range(8, 32)),
    'image_only_pages': list(range(1, 8)) + [32, 33],
    'coordinate_page_count': 24,
    'total_glyph_boxes': 1769,
    'raw_box_total': 20,
    'main_text_case_total': 16,
    'candidate_total': 16,
    'retained_box_in_column3': 0,
    'postscript_boxes_excluded_from_column3': 4,
    'located_case_count': 12,
    'unlocated_case_count': 4,
    'located_cases': [c['id'] for c in cases if c['locations']],
    'unlocated_cases': [c['id'] for c in cases if not c['locations']],
    'special_pages': {
        '8': '原志首题及责任题署，保留真实字框',
        '9-27': '周砥所撰主志文',
        '28-31': '盛彪合葬缘故后记；栏目二独立显示，不纳入栏目三、栏目四',
        '1-7,32-33': '题签、装帧、题跋或其他非正文页面；无可靠模型字框时只显示原图',
    },
    'cases': [{
        'id': c['id'],
        'page': c['page'],
        'candidate': c['candidate'],
        'located': bool(c['locations']),
        'glyph_id': c['locations'][0]['glyph_id'] if c['locations'] else None,
        'bbox': c['locations'][0]['bbox'] if c['locations'] else None,
        'verification': c['locations'][0]['verification'] if c['locations'] else '相邻残损槽位过多，无法唯一定位；不写入bbox',
    } for c in cases],
}
save_json('data/work029_coordinate_report.json', report)

catalog_path = ROOT / 'data/beitie_catalog.json'
catalog = load_json('data/beitie_catalog.json')
other_catalog = {x['id']: copy.deepcopy(x) for x in catalog if x['id'] != '029'}
catalog_029 = next(x for x in catalog if x['id'] == '029')
catalog_029.update({
    'title': '鲜于光祖墓志',
    'dynasty': '元至元二十四年（1287）前后书丹；大德二年（1298）合葬刻石',
    'script': '楷书（小楷）',
    'creator': '周砥撰文，赵孟頫书并篆盖，盛彪作合葬缘故后记',
    'status': '专属内容已接入',
    'subtitle': '33页图像、用户底稿释文、16例残损释读与真实模型字框已接入。',
    'year': '1287；1298',
    'canvas_count': 33,
    'has_volumes': False,
})
assert other_catalog == {x['id']: x for x in catalog if x['id'] != '029'}
save_json('data/beitie_catalog.json', catalog)

header = load_json('data/beitie_header_info.json')
other_header = {k: copy.deepcopy(v) for k, v in header.items() if k != '029'}
header['029'] = {
    'source_file': '鲜于光祖墓志.txt',
    'title': '鲜于光祖墓志',
    'basic': {
        '首题': '鮮于府君墓誌銘',
        '其他题名': '鮮于府君墓誌銘；赵孟頫书鲜于府君墓志',
        '责任者': '周砥撰；赵孟頫书并篆盖；盛彪作合葬缘故后记',
        '书体': '楷书（小楷）',
        '版本': '陆恭旧藏明拓本',
        '数量': '14开；碑文12开，其中序铭10开、合葬缘故2开；数字化图像33页',
        '尺寸': '册高31厘米、宽15.3厘米；帖芯约高25.3—25.4厘米、宽11.5厘米',
        '刻立年代': '主志文约于元至元二十四年（1287）前后书丹；元大德二年（1298）合葬刻石',
        '刻立地点': '钱塘县西次孤山之原（今杭州孤山一带参考区域，非精确墓址）',
        '馆藏': '上海图书馆',
        '馆藏号': '18A356',
        '来源': '《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年',
        '版本说明': '33页为数字化图像数，14开为装裱开数，两者不是同一计数口径。',
        '残损统计': '用户底稿共20个方框；主志文16处进入栏目三并全部给出候选字；合葬缘故后记4处原样保留。',
    },
}
assert other_header == {k: v for k, v in header.items() if k != '029'}
save_json('data/beitie_header_info.json', header)

details = load_json('data/beitie_details.json')
other_details = {k: copy.deepcopy(v) for k, v in details.items() if k != '029'}
details['029'] = {
    'id': '029',
    'title': '鲜于光祖墓志',
    'cover': 'assets/page_images/029_鲜于光祖墓志/images/0001_一.jpg',
    'summary': '《鲜于光祖墓志》为周砥撰、赵孟頫小楷书并篆盖的元代墓志拓本，末附盛彪所作合葬缘故后记。',
    'basic': {
        '时代': '元',
        '年代': '约1287年书丹；1298年合葬刻石',
        '书体': '楷书（小楷）',
        '责任者': '周砥撰文，赵孟頫书并篆盖，盛彪作后记',
        '版本': '陆恭旧藏明拓本',
        '馆藏': '上海图书馆',
        '馆藏号': '18A356',
    },
    'people': [
        {'name': '鲜于光祖', 'role': '志主', 'evidence': '主志文记其家世、生平、行谊与卒葬。'},
        {'name': '周砥', 'role': '撰文者', 'evidence': '责任题署记周砥撰。'},
        {'name': '赵孟頫', 'role': '书者并篆盖', 'evidence': '责任题署记赵孟頫书并篆盖。'},
        {'name': '盛彪', 'role': '合葬缘故后记作者', 'evidence': '册末合葬缘故由盛彪续记。'},
        {'name': '鲜于枢', 'role': '志主之子', 'evidence': '主志文及合葬缘故记其请铭、奉柩与合葬。'},
    ],
    'timeline': [
        {'time': '约1205年', 'event': '鲜于光祖约生于此年。'},
        {'time': '1281年', 'event': '鲜于光祖卒，享年七十七。'},
        {'time': '约1287年', 'event': '周砥撰志，赵孟頫书丹。'},
        {'time': '1298年', 'event': '鲜于枢奉父母合葬，盛彪作合葬缘故后记。'},
        {'time': '今藏', 'event': '陆恭旧藏明拓本现藏上海图书馆，馆藏号18A356。'},
    ],
    'full_text': full_text,
}
assert other_details == {k: v for k, v in details.items() if k != '029'}
save_json('data/beitie_details.json', details)

info = load_json('data/beitie_info_texts.json')
other_info = {k: copy.deepcopy(v) for k, v in info['items'].items() if k != '029'}
info['items']['029'] = {
    'id': '029',
    'source_file': '鲜于光祖墓志.txt',
    'source_key': '鲜于光祖墓志',
    'title': '鲜于光祖墓志',
    'summary': '《鲜于光祖墓志》已接入33页图像、用户底稿释文、16例残损释读与真实模型字框。',
    'basic': {
        '责任者': '周砥撰；赵孟頫书并篆盖；盛彪作合葬缘故后记',
        '书体': '楷书（小楷）',
        '版本': '陆恭旧藏明拓本',
        '数量': '14开；碑文12开，其中序铭10开、合葬缘故2开',
        '尺寸': '册高31厘米、宽15.3厘米；帖芯约高25.3—25.4厘米、宽11.5厘米',
        '年代': '约1287年书丹；1298年合葬刻石',
        '地点': '钱塘县西次孤山之原（今杭州孤山一带参考区域）',
        '馆藏': '上海图书馆',
        '来源': '《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年',
    },
    'intro_text': '鲜于光祖墓志\n首题：鮮于府君墓誌銘\n责任者：周砥撰；赵孟頫书并篆盖；盛彪作合葬缘故后记\n书体：楷书（小楷）\n版本：陆恭旧藏明拓本\n数量：14开；数字化图像33页\n馆藏：上海图书馆（18A356）',
    'history': '流传经历：\n此册为陆恭旧藏明拓本，册端题签及册后题跋属于版本流传材料。\n题记题跋：\n用户本次未提供题签与后人题跋释文，栏目二至四不自行补入。',
    'story': '《鲜于府君墓志铭》由周砥撰、赵孟頫书并篆盖。主志文约于至元二十四年（1287）前后书丹。鲜于光祖卒后，鲜于枢最终于元大德二年（1298）奉父母合葬于钱塘县西次孤山之原，盛彪续作合葬缘故后记。页面地点仅标示今杭州孤山一带的参考区域，不宣称为精确墓址。',
    'has_history': True,
    'has_story': True,
}
assert other_info == {k: v for k, v in info['items'].items() if k != '029'}
save_json('data/beitie_info_texts.json', info)

router_path = ROOT / 'js/damage_ai_reading.js'
router = router_path.read_text(encoding='utf-8')
if '"029":[' not in router:
    marker = '\n  };\n\n  const titles='
    assert marker in router
    entry = '''\n    "029":[
      {src:"js/work-029-coordinate-adapter.js?v=20260725_xianyu029_v1",key:"w029c",ready:()=>Boolean(window.__WORK_029_COORDINATE_ADAPTER__)},
      {src:"js/work-029.js?v=20260725_xianyu029_v1",key:"w029",ready:()=>Boolean(window.__WORK_029_STABLE_READY__&&window.__WORK_029_CROWDSOURCE_READY__)}
    ]'''
    router = router.replace(marker, ',' + entry + '\n  };\n\n  const titles=', 1)
router = router.replace('"028":"晋唐小楷九种"};', '"028":"晋唐小楷九种","029":"鲜于光祖墓志"};')
router = router.replace('"026","027","028"].includes(id)', '"026","027","028","029"].includes(id)')
router_path.write_text(router, encoding='utf-8')

patch_path = ROOT / 'js/detail_info_patch.js'
patch = patch_path.read_text(encoding='utf-8')
patch = patch.replace('"028":"晋唐小楷九种"};', '"028":"晋唐小楷九种","029":"鲜于光祖墓志"};')
if 'work029-no-location-map' not in patch:
    patch = patch.replace(
        'if(workId==="028")document.documentElement.classList.add("work028-no-location-map");',
        'if(workId==="028")document.documentElement.classList.add("work028-no-location-map");\n  if(workId==="029")document.documentElement.classList.add("work029-no-location-map");',
    )
patch = patch.replace('"026","027","028"].includes(workId)', '"026","027","028","029"].includes(workId)')
patch = patch.replace('20260725_jintang_nine_v2', VERSION)
patch_path.write_text(patch, encoding='utf-8')

detail_path = ROOT / 'detail.html'
detail = detail_path.read_text(encoding='utf-8')
detail = detail.replace('js/detail_info_patch.js?v=20260725_jintang_nine_v2', f'js/detail_info_patch.js?v={VERSION}')
detail = detail.replace('js/damage_ai_reading.js?v=20260725_jintang_nine_v2', f'js/damage_ai_reading.js?v={VERSION}')
detail_path.write_text(detail, encoding='utf-8')

assert '"029":[' in router_path.read_text(encoding='utf-8')
assert '"029":"鲜于光祖墓志"' in router_path.read_text(encoding='utf-8')
assert '"029":"鲜于光祖墓志"' in patch_path.read_text(encoding='utf-8')
assert VERSION in detail_path.read_text(encoding='utf-8')
print('work029 finalize v2 data build passed')
