from pathlib import Path

path = Path('detail.html')
text = path.read_text(encoding='utf-8')

old_rect = 'function refinedModelRect(box){if(String(box.bbox_method||"")==="fallback_text_cell")return null;if(box.display_x!==undefined&&box.display_y!==undefined&&box.display_w!==undefined&&box.display_h!==undefined)return{x:+box.display_x,y:+box.display_y,w:+box.display_w,h:+box.display_h};if(box.model_x!==undefined&&box.model_y!==undefined&&box.model_w!==undefined&&box.model_h!==undefined)return{x:+box.model_x,y:+box.model_y,w:+box.model_w,h:+box.model_h};return null}'
new_rect = 'function refinedModelRect(box){if(box.border_x!==undefined&&box.border_y!==undefined&&box.border_w!==undefined&&box.border_h!==undefined)return{x:+box.border_x,y:+box.border_y,w:+box.border_w,h:+box.border_h};return null}'
old_source = 'source:mode==="model"?"model_aligned_display":String(box.source||"iiif")'
new_source = 'source:mode==="model"?"model_aligned_border_refined":String(box.source||"iiif")'
old_mode = 'activeMode=useIIIF?"iiif":perPageBoxes.length?"model_aligned_display":sources.includes("model_border_refined")?"model_border_refined":"model_unavailable"'
new_mode = 'activeMode=useIIIF?"iiif":perPageBoxes.length?"model_aligned_border_refined":sources.includes("model_border_refined")?"model_border_refined":"model_unavailable"'

for old, new, name in [
    (old_rect, new_rect, 'refinedModelRect'),
    (old_source, new_source, 'source label'),
    (old_mode, new_mode, 'active mode'),
]:
    if text.count(old) != 1:
        raise SystemExit(f'{name}: expected exactly one old form, got {text.count(old)}')
    if new in text:
        raise SystemExit(f'{name}: new form already present')
    text = text.replace(old, new, 1)

# Preserve the two already-correct interaction fixes.
required = [
    'e.stopPropagation();prevPage()',
    'e.stopPropagation();nextPage()',
    'history.scrollRestoration="manual"',
    'await loadPage(0);scheduleDetailScrollReset()',
    'box.border_x!==undefined',
    'model_aligned_border_refined',
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'missing required marker: {marker}')

path.write_text(text, encoding='utf-8')
print('detail.html restored to border-refined boxes')
