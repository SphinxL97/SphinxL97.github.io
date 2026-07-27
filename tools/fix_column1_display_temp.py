from pathlib import Path

path = Path("detail.html")
text = path.read_text(encoding="utf-8")

old_rect = 'function refinedModelRect(box){if(box.border_x!==undefined&&box.border_y!==undefined&&box.border_w!==undefined&&box.border_h!==undefined)return{x:+box.border_x,y:+box.border_y,w:+box.border_w,h:+box.border_h};return null}'
new_rect = 'function refinedModelRect(box){if(String(box.bbox_method||"")==="fallback_text_cell")return null;if(box.display_x!==undefined&&box.display_y!==undefined&&box.display_w!==undefined&&box.display_h!==undefined)return{x:+box.display_x,y:+box.display_y,w:+box.display_w,h:+box.display_h};if(box.model_x!==undefined&&box.model_y!==undefined&&box.model_w!==undefined&&box.model_h!==undefined)return{x:+box.model_x,y:+box.model_y,w:+box.model_w,h:+box.model_h};return null}'

old_source = 'source:mode==="model"?"model_aligned_border_refined":String(box.source||"iiif")'
new_source = 'source:mode==="model"?"model_aligned_display":String(box.source||"iiif")'

old_mode = 'activeMode=useIIIF?"iiif":perPageBoxes.length?"model_aligned_border_refined":sources.includes("model_border_refined")?"model_border_refined":"model_unavailable"'
new_mode = 'activeMode=useIIIF?"iiif":perPageBoxes.length?"model_aligned_display":sources.includes("model_border_refined")?"model_border_refined":"model_unavailable"'

old_dbl = 'document.querySelector(".jump-prev").addEventListener("dblclick",prevPage);document.querySelector(".jump-next").addEventListener("dblclick",nextPage);readerCard.addEventListener("dblclick",e=>{if(e.target.closest(".image-wrap,.transcript-pane,button,select"))return;'
new_dbl = 'document.querySelector(".jump-prev").addEventListener("dblclick",e=>{e.stopPropagation();prevPage()});document.querySelector(".jump-next").addEventListener("dblclick",e=>{e.stopPropagation();nextPage()});readerCard.addEventListener("dblclick",e=>{if(e.target.closest(".image-wrap,.transcript-pane,.jump-prev,.jump-next,button,select"))return;'

old_start = '<script>\nconst modalMap='
new_start = '<script>\nif("scrollRestoration" in history)history.scrollRestoration="manual";function resetDetailScroll(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0}window.addEventListener("pageshow",resetDetailScroll);window.addEventListener("load",resetDetailScroll,{once:true});requestAnimationFrame(resetDetailScroll);setTimeout(resetDetailScroll,0);\nconst modalMap='

replacements = [
    (old_rect, new_rect, "refinedModelRect"),
    (old_source, new_source, "model source label"),
    (old_mode, new_mode, "active mode label"),
    (old_dbl, new_dbl, "double click handlers"),
    (old_start, new_start, "scroll reset bootstrap"),
]

for old, new, name in replacements:
    old_count = text.count(old)
    new_count = text.count(new)
    if old_count == 1 and new_count == 0:
        text = text.replace(old, new, 1)
    elif old_count == 0 and new_count == 1:
        print(f"{name}: already patched")
    else:
        raise SystemExit(f"{name}: invalid state old={old_count}, new={new_count}")

required = [
    'function refinedModelRect(box){if(String(box.bbox_method||"")==="fallback_text_cell")return null;',
    'box.display_x!==undefined',
    'source:mode==="model"?"model_aligned_display"',
    'activeMode=useIIIF?"iiif":perPageBoxes.length?"model_aligned_display"',
    'e.stopPropagation();prevPage()',
    'e.stopPropagation();nextPage()',
    'history.scrollRestoration="manual"',
    'window.addEventListener("pageshow",resetDetailScroll)',
]
for marker in required:
    if marker not in text:
        raise SystemExit(f"missing marker after patch: {marker}")

path.write_text(text, encoding="utf-8")
print("detail.html patched successfully")
