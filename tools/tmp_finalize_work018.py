import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]

cases_path = root / "data/work018_damage_cases.json"
cases = json.loads(cases_path.read_text(encoding="utf-8"))
for case in cases:
    if case.get("id") == "08":
        note = "当前拓本坐标在第41页从“道”直接跳至“绅”，纪日及其前后整段没有模型字框，故不以附近完整字代替第一个问题字。"
        analysis = list(case.get("analysis") or [])
        if note not in analysis:
            analysis.append(note)
        case["analysis"] = analysis
        case["page"] = None
        case["locations"] = []
        case["coordinate_status"] = "source-segment-absent"
        case["coordinate_note"] = "本册当前坐标中该段整体缺失，暂未可靠定位。"
for case in cases:
    if "□" in str(case.get("corrected", "")):
        raise RuntimeError(f"case {case.get('id')} corrected text still contains square")
cases_path.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding="utf-8")

report_path = root / "data/work018_coordinate_report.json"
report = json.loads(report_path.read_text(encoding="utf-8"))
for key in list(report):
    if key.startswith("debug_"):
        report.pop(key, None)
report["status"] = "completed-with-one-unlocated-case"
report["source_files"] = ["data/model_boxes/glyph_model_border_016_020.json"]
report["located_cases"] = 7
report["unlocated_cases"] = [{
    "id": "08",
    "reason": "source-segment-absent-no-real-bbox",
    "note": "第41页模型字序由“道”直接跳至“绅”，纪日段整体没有可用字框。"
}]
report["case_count"] = 8
report["text_square_count"] = 18
report["covered_square_count"] = 18
report["candidate_count"] = 18
report["remaining_square_count"] = 0
report["coordinate_policy"] = "七例使用真实模型方框；案例08因原段整体缺失不伪造bbox。"
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

module_path = root / "js/work-018.js"
module = module_path.read_text(encoding="utf-8")
module = module.replace("__WORK_018_ZHANGMENGLONG__", "__WORK_018_SONGGAO__")
module = module.replace("work018-zhangmenglong-style", "work018-songgao-style")
module_path.write_text(module, encoding="utf-8")

detail_path = root / "js/detail_info_patch.js"
detail = detail_path.read_text(encoding="utf-8")
block_pattern = re.compile(
    r'  if\(window\.__DETAIL_INFO_STABLE_ENTRY_V11__\)return;\n'
    r'(?:  window\.__DETAIL_INFO_STABLE_ENTRY_V\d+__=true;\n)+'
    r'  document\.documentElement\.classList\.add\("detail-header-pending"\);'
)
clean_block = '''  if(window.__DETAIL_INFO_STABLE_ENTRY_V11__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V11__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V10__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V7__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V6__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V5__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V4__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V3__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V2__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V1__=true;
  document.documentElement.classList.add("detail-header-pending");'''
detail, count = block_pattern.subn(clean_block, detail, count=1)
if count != 1:
    raise RuntimeError("detail entry flag block not found")
detail_path.write_text(detail, encoding="utf-8")

print("work018 finalization complete")
