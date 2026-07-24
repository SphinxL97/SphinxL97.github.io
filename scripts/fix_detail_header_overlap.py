from pathlib import Path

core_path = Path('js/detail_info_patch_core.js')
entry_path = Path('js/detail_info_patch.js')
html_path = Path('detail.html')

core = core_path.read_text(encoding='utf-8')
replacements = [
    ('grid-template-rows:auto minmax(0,1fr)!important;\n        row-gap:12px!important;',
     'grid-template-rows:auto minmax(0,1fr)!important;\n        row-gap:10px!important;'),
    ('margin:0 0 12px!important;\n        font-size:clamp(34px,3vw,46px)!important;',
     'margin:0 0 8px!important;\n        font-size:clamp(34px,3vw,44px)!important;'),
    ('column-gap:28px!important;\n        row-gap:8px!important;\n        align-content:space-between!important;',
     'column-gap:30px!important;\n        row-gap:5px!important;\n        grid-auto-rows:max-content!important;\n        align-content:space-between!important;\n        overflow-y:auto!important;\n        overscroll-behavior:contain;\n        padding-right:4px;'),
    ('min-height:0!important;\n        align-items:center!important;\n        grid-template-columns:88px minmax(0,1fr)!important;\n        line-height:1.55!important;',
     'min-height:max-content!important;\n        align-items:start!important;\n        grid-template-columns:88px minmax(0,1fr)!important;\n        line-height:1.42!important;'),
    ('line-height:1.55!important;\n        white-space:nowrap;',
     'line-height:1.42!important;\n        font-size:15px!important;\n        white-space:nowrap;'),
    ('min-width:0;\n        overflow-wrap:anywhere;',
     'min-width:0;\n        line-height:1.42!important;\n        overflow-wrap:anywhere;'),
    ('font-size:14px!important;\n        line-height:1.55!important;',
     'font-size:13.5px!important;\n        line-height:1.4!important;'),
    ('height:auto!important;grid-template-columns:1fr!important;align-content:start!important;',
     'height:auto!important;grid-template-columns:1fr!important;grid-auto-rows:max-content!important;align-content:start!important;overflow:visible!important;padding-right:0;')
]
for old, new in replacements:
    if old not in core:
        raise SystemExit(f'core replacement not found: {old[:80]}')
    core = core.replace(old, new, 1)

scrollbar_anchor = '''      .work-hero .info-panel .meta-line.compact-note{
        font-size:13.5px!important;
        line-height:1.4!important;
      }
'''
scrollbar_rules = '''      .work-hero .info-panel .meta-line.compact-note{
        font-size:13.5px!important;
        line-height:1.4!important;
      }
      .work-hero .info-panel .meta-lines::-webkit-scrollbar{width:6px;}
      .work-hero .info-panel .meta-lines::-webkit-scrollbar-thumb{
        background:rgba(159,48,37,.22);
        border-radius:999px;
      }
      .work-hero .info-panel .meta-lines::-webkit-scrollbar-track{background:transparent;}
'''
if scrollbar_anchor not in core:
    raise SystemExit('scrollbar anchor not found')
core = core.replace(scrollbar_anchor, scrollbar_rules, 1)
core_path.write_text(core, encoding='utf-8')

entry = entry_path.read_text(encoding='utf-8')
old_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V16__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V16__=true;'''
new_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V17__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V17__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V16__=true;'''
if old_guard not in entry:
    raise SystemExit('entry guard not found')
entry = entry.replace(old_guard, new_guard, 1)
old_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_equal_height_header_v1";'
new_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_no_overlap_header_v1";'
if old_core not in entry:
    raise SystemExit('core cache url not found')
entry = entry.replace(old_core, new_core, 1)
entry_path.write_text(entry, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
old_script = 'js/detail_info_patch.js?v=20260724_equal_height_header_v1'
new_script = 'js/detail_info_patch.js?v=20260724_no_overlap_header_v1'
if old_script not in html:
    raise SystemExit('detail script cache url not found')
html = html.replace(old_script, new_script, 1)
html_path.write_text(html, encoding='utf-8')
