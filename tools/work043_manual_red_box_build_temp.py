from pathlib import Path
import json
import re

OLD = '20260726_mengjingxun_043_v2_page_crowdsource'
NEW = '20260726_mengjingxun_043_v3_manual_red_box'

location = {
    'page': 9,
    'bbox': {'x': 385, 'y': 870, 'w': 120, 'h': 120},
    'canvas_width': 1177,
    'canvas_height': 1800,
    'source': 'manual_visual_verified',
    'target': '𡜱',
    'note': '逐页人工核验：第9页左起第一列第四字。该框不是模型自动bbox。'
}

case_path = Path('data/work043_damage_cases.json')
cases = json.loads(case_path.read_text(encoding='utf-8'))
if len(cases) != 1:
    raise SystemExit(f'expected one 043 case, got {len(cases)}')
case = cases[0]
case['page'] = 9
case['locations'] = [location]
case_path.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report_path = Path('data/work043_coordinate_report.json')
report = json.loads(report_path.read_text(encoding='utf-8'))
report['version'] = NEW
report['model_box_rows'] = 0
report['manual_verified_box_rows'] = 1
report['located_case_count'] = 1
report['unlocated_case_count'] = 0
report['unlocated_case_ids'] = []
report['coordinate_policy'] = '案例01已在数字化第9页完成人工视觉定位，并以人工校准红框显示“𡜱”字；该框不是模型自动bbox，不用于冒充模型坐标。'
report['manual_box'] = location
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

work_path = Path('js/work-043.js')
text = work_path.read_text(encoding='utf-8').replace(OLD, NEW)
text = text.replace(
    '仓库当前仍无043真实模型字框，因此显示第9页原图与页码，但不制造推测性红框。',
    '仓库当前仍无043模型自动字框；本例已根据第9页原图完成人工视觉定位，以红框标示“𡜱”字，并明确区分人工校准框与模型bbox。'
)

replacement = r'''  function locationHTML(item){
    const page=Number(item?.page||0);
    if(!page)return '<div class="damage-location-missing work043-location-missing"><p>本例暂未获得可靠页码与真实字框，不显示推测性局部图。</p></div>';
    const labels=["","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十"];
    const image=`assets/page_images/043_司马昞妻孟敬训墓志/images/${String(page).padStart(4,"0")}_${labels[page]||page}.jpg`;
    const loc=Array.isArray(item?.locations)?item.locations[0]:null;
    const b=loc?.bbox;
    if(!b)return `<div class="work043-page-only"><div class="work043-image-stage"><img src="${esc(image)}" alt="《${TITLE}》第${page}页原拓"></div><p class="damage-caption">《${TITLE}》第${page}页；尚无可显示的字框。</p></div>`;
    const cw=Number(loc.canvas_width||1177),ch=Number(loc.canvas_height||1800);
    const left=Number(b.x||0)/cw*100,top=Number(b.y||0)/ch*100,width=Number(b.w||0)/cw*100,height=Number(b.h||0)/ch*100;
    return `<div class="work043-page-only"><div class="work043-image-stage"><img src="${esc(image)}" alt="《${TITLE}》第${page}页原拓"><span class="work043-manual-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" role="img" aria-label="人工核验红框：𡜱字位置" title="人工核验：𡜱"></span></div><p class="damage-caption">《${TITLE}》第${page}页，红框标示“𡜱”字。该框经逐页人工核验校准，不是模型自动bbox。</p></div>`;
  }
  function analysisHTML'''
pattern = r'  function locationHTML\(item\)\{.*?\n  \}\n  function analysisHTML'
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit('failed to replace work043 location renderer')

css = '.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-image-card{overflow:hidden!important}.work043-location-missing{min-height:430px;margin:0 16px 16px}.work043-page-only{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;margin:0 14px 14px;padding:12px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0}.work043-image-stage{position:relative;flex:1 1 auto;min-height:0;height:100%;width:auto;max-width:100%;aspect-ratio:1177/1800;margin:auto}.work043-image-stage img{display:block;width:100%;height:100%;object-fit:fill;border-radius:10px}.work043-manual-box{position:absolute;box-sizing:border-box;border:4px solid #e22f20;background:rgba(226,47,32,.12);box-shadow:0 0 0 2px rgba(255,255,255,.88),0 2px 8px rgba(120,20,10,.35);border-radius:3px;pointer-events:none;z-index:2}.work043-page-only p{flex:0 0 auto;margin:6px 0 0!important;padding:0 4px!important;text-indent:0!important;font-size:12px;line-height:1.5!important;color:#766657;text-align:center}.work043-analysis-list{margin:10px 0 0;padding-left:1.35em}.work043-analysis-list li{margin:.45em 0;line-height:1.8}.work043-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}'
text, css_count = re.subn(r'style\.textContent="[^"]*";', 'style.textContent="' + css + '";', text, count=1)
if css_count != 1:
    raise SystemExit('failed to replace work043 css')
work_path.write_text(text, encoding='utf-8')

router_path = Path('js/damage_ai_reading.js')
router = router_path.read_text(encoding='utf-8').replace(OLD, NEW)
old_guard = '  if(window.__DAMAGE_AI_READING_ROUTER_V82__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V82__=true;'
new_guard = '  if(window.__DAMAGE_AI_READING_ROUTER_V83__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V83__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V82__=true;'
if old_guard not in router:
    raise SystemExit('router V82 guard not found')
router_path.write_text(router.replace(old_guard, new_guard), encoding='utf-8')

detail_patch_path = Path('js/detail_info_patch.js')
detail_patch = detail_patch_path.read_text(encoding='utf-8').replace(OLD, NEW)
old_entry = '  if(window.__DETAIL_INFO_STABLE_ENTRY_V42__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V42__=true;'
new_entry = '  if(window.__DETAIL_INFO_STABLE_ENTRY_V43__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V43__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V42__=true;'
if old_entry not in detail_patch:
    raise SystemExit('detail V42 guard not found')
detail_patch_path.write_text(detail_patch.replace(old_entry, new_entry), encoding='utf-8')

detail_html_path = Path('detail.html')
detail_html = detail_html_path.read_text(encoding='utf-8')
if OLD not in detail_html:
    raise SystemExit('detail cache version not found')
detail_html_path.write_text(detail_html.replace(OLD, NEW), encoding='utf-8')

fixed_case = json.loads(case_path.read_text(encoding='utf-8'))[0]
assert fixed_case['page'] == 9
assert len(fixed_case['locations']) == 1
assert fixed_case['locations'][0]['bbox'] == {'x': 385, 'y': 870, 'w': 120, 'h': 120}
assert fixed_case['locations'][0]['source'] == 'manual_visual_verified'
fixed_work = work_path.read_text(encoding='utf-8')
assert 'work043-manual-box' in fixed_work
assert '红框标示“𡜱”字' in fixed_work
assert '恢复依据' not in fixed_work
for path in [router_path, detail_patch_path, detail_html_path]:
    assert OLD not in path.read_text(encoding='utf-8')
