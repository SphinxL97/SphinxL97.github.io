import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
rows = []
page_text = {}
page_data = {}
for page in range(1, 56):
    path = root / f"data/glyph_boxes/iiif/018/page_{page:04d}.json"
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    data = sorted(data, key=lambda row: int(row.get("order_in_page") or row.get("annotation_index") or 0))
    page_data[page] = data
    page_text[str(page)] = "".join(str(row.get("char") or row.get("text") or "")[:1] for row in data)
    rows.extend(data)
rows.sort(key=lambda row: (int(row.get("canvas_index") or row.get("page") or 0), int(row.get("order_in_page") or row.get("annotation_index") or 0)))
chars = [str(row.get("char") or row.get("text") or "")[:1] for row in rows]
contexts = []
for index, row in enumerate(rows):
    if chars[index] != "□":
        continue
    page = int(row.get("canvas_index") or row.get("page") or 0)
    if page < 35:
        continue
    contexts.append({
        "page": page,
        "glyph_id": row.get("glyph_id"),
        "order": row.get("order_in_page"),
        "context": "".join(chars[max(0, index-10):min(len(chars), index+11)]),
        "bbox": row.get("bbox"),
    })
compact_rows = {}
for page in (40, 41, 42):
    compact_rows[str(page)] = [
        {
            "char": str(row.get("char") or row.get("text") or "")[:1],
            "glyph_id": row.get("glyph_id"),
            "order": row.get("order_in_page"),
            "bbox": row.get("bbox"),
        }
        for row in page_data.get(page, [])
    ]
report_path = root / "data/work018_coordinate_report.json"
report = json.loads(report_path.read_text(encoding="utf-8"))
report["debug_page_text_35_45"] = {str(page): page_text[str(page)] for page in range(35, 46)}
report["debug_square_contexts_35_plus"] = contexts
report["debug_compact_rows_40_42"] = compact_rows
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
