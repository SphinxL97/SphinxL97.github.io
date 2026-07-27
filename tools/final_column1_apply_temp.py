from pathlib import Path

path = Path('detail.html')
text = path.read_text(encoding='utf-8')

replacements = [
    ('function iiifPageBoxPath(', 'function columnOneIIIFPageBoxPath('),
    ('function modelPageBoxPaths(', 'function columnOneModelPageBoxPaths('),
    ('function normalizeGlyphBoxRecord(', 'function normalizeColumnOnePolicyBox('),
    ('async function loadPageGlyphBoxes(', 'async function loadColumnOnePolicyBoxes('),
    ('[iiifPageBoxPath(', '[columnOneIIIFPageBoxPath('),
    (':modelPageBoxPaths(', ':columnOneModelPageBoxPaths('),
    ('normalizeGlyphBoxRecord(', 'normalizeColumnOnePolicyBox('),
    ('await loadPageGlyphBoxes(', 'await loadColumnOnePolicyBoxes('),
]
for old, new in replacements:
    text = text.replace(old, new)

if 'loader:"columnOnePolicy"' not in text:
    anchor = 'sources,firstRect:firstRect?'
    if anchor not in text:
        raise SystemExit('coordinate diagnostic anchor missing')
    text = text.replace(anchor, 'sources,loader:"columnOnePolicy",firstRect:firstRect?', 1)

required = [
    'function columnOneIIIFPageBoxPath(',
    'function columnOneModelPageBoxPaths(',
    'function normalizeColumnOnePolicyBox(',
    'async function loadColumnOnePolicyBoxes(',
    'normalizeColumnOnePolicyBox(box,pageObj,i,data.length,mode)',
    'await loadColumnOnePolicyBoxes(EFFECTIVE_WORK_ID,p,coordinateMode)',
    'loader:"columnOnePolicy"',
]
for item in required:
    if item not in text:
        raise SystemExit(f'missing required marker: {item}')

for forbidden in [
    'function iiifPageBoxPath(',
    'function modelPageBoxPaths(',
    'normalizeGlyphBoxRecord(',
    'async function loadPageGlyphBoxes(',
    'await loadPageGlyphBoxes(',
]:
    if forbidden in text:
        raise SystemExit(f'old shared function name remains: {forbidden}')

path.write_text(text, encoding='utf-8')
