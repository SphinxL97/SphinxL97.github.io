import json
from pathlib import Path

ROOT=Path('.')
REPORT=ROOT/'data/work034_coordinate_report.json'
CASES=ROOT/'data/work034_damage_cases.json'
HEADER=ROOT/'data/beitie_header_info.json'
JS=ROOT/'js/work-034.js'

report=json.loads(REPORT.read_text(encoding='utf-8'))
cases=json.loads(CASES.read_text(encoding='utf-8'))
header=json.loads(HEADER.read_text(encoding='utf-8'))

# 034模型中有132个方框标记，远多于底稿的24处问题字。
# 因此方框字符本身不能作为充分依据；至少需要3个邻近上下文字匹配。
rejected_orders=set()
for item in report['placeholder_mapping']:
    if int(item.get('context_exact') or 0) < 3:
        item['accepted']=False
        item['method']='low-context-rejected'
        rejected_orders.add(int(item['order']))

first_orders=[1,2,4,6,8,10,11,13,15,16,17,18,20,22]
assert len(cases)==len(first_orders)==14
for case,order in zip(cases,first_orders):
    if order in rejected_orders:
        case['page']=None
        case['locations']=[]
        case['analysis']=[line for line in case.get('analysis',[]) if not str(line).startswith('栏目三定位采用第')]
        if not any('不生成推测性bbox' in str(line) for line in case['analysis']):
            case['analysis'].append('该位置虽在模型序列中对齐到方框，但邻近上下文匹配不足；为避免错位，不生成推测性bbox。')

located=sum(bool(case.get('locations')) for case in cases)
assert located==12,located
report['located_cases']=located
report['unlocated_cases']=len(cases)-located
report['location_acceptance_rule']='模型方框数量为132，只有邻近上下文至少匹配3字的位置才绑定到栏目三；低于阈值的定位撤回。'
CASES.write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')

basic=header['034']['basic']
basic['残损统计']='用户底稿共24个方框，整理14组栏目三案例；暂拟15个候选字，保留9个未决方框；12组已通过上下文阈值绑定真实模型字框，2组不生成推测性bbox。'
HEADER.write_text(json.dumps(header,ensure_ascii=False,indent=2),encoding='utf-8')

js=JS.read_text(encoding='utf-8')
js=js.replace('第${page}页可核验，但模型未检测到缺失“之”字的独立字框；本例不估算bbox。','第${page}页可核验，但本例未获得可用的独立问题字框；不估算bbox。')
JS.write_text(js,encoding='utf-8')

print(json.dumps({'rejected_orders':sorted(rejected_orders),'located_cases':located,'unlocated_cases':14-located},ensure_ascii=False))
