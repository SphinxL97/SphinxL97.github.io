import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data/model_boxes/glyph_model_border_036_040.json"
OUT = ROOT / "data/_tmp_work036_coordinate_audit.json"

rows = json.loads(MODEL.read_text(encoding="utf-8"))
rows = [r for r in rows if str(r.get("work_id", "")).zfill(3) == "036"]
rows.sort(key=lambda r: (int(r.get("canvas_index", 0)), int(r.get("order_in_page", 0))))

pages = defaultdict(list)
for r in rows:
    pages[int(r.get("canvas_index", 0))].append(r)

all_boxes = []
global_order = 0
for page in sorted(pages):
    seq = "".join(str(r.get("char", "")) for r in pages[page])
    for i, r in enumerate(pages[page]):
        if str(r.get("char", "")) != "□":
            continue
        global_order += 1
        all_boxes.append({
            "global_box_order": global_order,
            "page": page,
            "page_box_order": sum(1 for x in pages[page][:i+1] if str(x.get("char", "")) == "□"),
            "glyph_id": r.get("glyph_id"),
            "bbox": {"x": r.get("x"), "y": r.get("y"), "w": r.get("w"), "h": r.get("h")},
            "canvas_width": r.get("canvas_width"),
            "canvas_height": r.get("canvas_height"),
            "before": seq[max(0, i-8):i],
            "after": seq[i+1:i+9],
            "page_sequence": seq,
        })

report = {
    "work_id": "036",
    "title": "瘗鹤铭",
    "model_glyph_count": len(rows),
    "model_page_count": len(pages),
    "pages_with_model": sorted(pages),
    "first_model_page": min(pages) if pages else None,
    "last_model_page": max(pages) if pages else None,
    "model_box_count": len(all_boxes),
    "page_summaries": [
        {
            "page": page,
            "glyph_count": len(pages[page]),
            "box_count": sum(1 for r in pages[page] if str(r.get("char", "")) == "□"),
            "sequence": "".join(str(r.get("char", "")) for r in pages[page]),
        }
        for page in sorted(pages)
    ],
    "boxes": all_boxes,
}
OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({k: report[k] for k in ["model_glyph_count", "model_page_count", "first_model_page", "last_model_page", "model_box_count"]}, ensure_ascii=False))
