from pathlib import Path

path = Path("detail.html")
text = path.read_text(encoding="utf-8")

replacements = {
    'js/damage_ai_reading.js?v=20260712': 'js/damage_ai_reading.js?v=20260714_v9',
    'assets/js/form-config.js?v=20260713_fix7': 'assets/js/form-config.js?v=20260714_v9',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"missing expected reference: {old}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
