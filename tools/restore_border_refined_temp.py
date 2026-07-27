from pathlib import Path

# 1. Restore the exact border-refined coordinates used by the QA images.
detail_path = Path('detail.html')
text = detail_path.read_text(encoding='utf-8')

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

for marker in [
    'e.stopPropagation();prevPage()',
    'e.stopPropagation();nextPage()',
    'history.scrollRestoration="manual"',
    'await loadPage(0);scheduleDetailScrollReset()',
    'box.border_x!==undefined',
    'model_aligned_border_refined',
]:
    if marker not in text:
        raise SystemExit(f'missing required detail marker: {marker}')

detail_path.write_text(text, encoding='utf-8')

# 2. The late alignment patch previously reloaded IIIF for every work and overwrote
#    the model boxes after detail.html had rendered them. Restrict that legacy
#    correction to the two explicit IIIF parents only.
align_path = Path('js/reader-box-alignment-patch.js')
align = align_path.read_text(encoding='utf-8')
old_guard = '  const workId=(raw.includes("-")?raw:raw.padStart(3,"0"));\n  const imageWrap=document.getElementById("imageWrap");'
new_guard = '  const workId=(raw.includes("-")?raw:raw.padStart(3,"0"));\n  const parentId=workId.split("-")[0];\n  const useLegacyIIIF=new Set(["014","031"]).has(parentId);\n  window.__READER_BOX_ALIGNMENT_POLICY__={workId,parentId,mode:useLegacyIIIF?"iiif":"skip-model"};\n  if(!useLegacyIIIF)return;\n  const imageWrap=document.getElementById("imageWrap");'
if align.count(old_guard) != 1:
    raise SystemExit(f'alignment guard: expected one old form, got {align.count(old_guard)}')
if new_guard in align:
    raise SystemExit('alignment guard already patched')
align = align.replace(old_guard, new_guard, 1)
for marker in [
    'new Set(["014","031"]).has(parentId)',
    'mode:useLegacyIIIF?"iiif":"skip-model"',
    'if(!useLegacyIIIF)return;',
    'data/glyph_boxes/iiif/${folder}/page_',
]:
    if marker not in align:
        raise SystemExit(f'missing alignment marker: {marker}')
align_path.write_text(align, encoding='utf-8')

print('restored border-refined boxes and disabled late IIIF overwrite for model works')
