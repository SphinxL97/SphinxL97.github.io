import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/beitie_details.json').read_text(encoding='utf-8'))
record=data.get('029')
out={'exists':record is not None,'keys':list(record.keys()) if isinstance(record,dict) else [],'record':record}
(root/'data/work029_details_existing.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'exists':out['exists'],'keys':out['keys']},ensure_ascii=False))
