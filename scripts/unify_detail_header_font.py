from pathlib import Path

core_path = Path('js/detail_info_patch_core.js')
entry_path = Path('js/detail_info_patch.js')
html_path = Path('detail.html')

core = core_path.read_text(encoding='utf-8')

old_span = '''      .work-hero .info-panel .meta-line span{
        min-width:0;
        line-height:1.42!important;
        overflow-wrap:anywhere;
      }'''
new_span = '''      .work-hero .info-panel .meta-line span{
        min-width:0;
        font-size:15px!important;
        line-height:1.42!important;
        overflow-wrap:anywhere;
      }'''
if old_span not in core:
    raise SystemExit('meta-line span block not found')
core = core.replace(old_span, new_span, 1)

old_compact = '''      .work-hero .info-panel .meta-line.compact-note{
        font-size:13.5px!important;
        line-height:1.4!important;
      }'''
new_compact = '''      .work-hero .info-panel .meta-line.compact-note{
        font-size:15px!important;
        line-height:1.42!important;
      }
      .work-hero .info-panel .meta-line.compact-note span{
        font-size:15px!important;
        line-height:1.42!important;
      }'''
if old_compact not in core:
    raise SystemExit('compact-note block not found')
core = core.replace(old_compact, new_compact, 1)
core_path.write_text(core, encoding='utf-8')

entry = entry_path.read_text(encoding='utf-8')
old_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V17__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V17__=true;'''
new_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V18__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V18__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V17__=true;'''
if old_guard not in entry:
    raise SystemExit('entry guard not found')
entry = entry.replace(old_guard, new_guard, 1)
old_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_no_overlap_header_v1";'
new_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_uniform_font_header_v1";'
if old_core not in entry:
    raise SystemExit('core cache url not found')
entry = entry.replace(old_core, new_core, 1)
entry_path.write_text(entry, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
old_script = 'js/detail_info_patch.js?v=20260724_no_overlap_header_v1'
new_script = 'js/detail_info_patch.js?v=20260724_uniform_font_header_v1'
if old_script not in html:
    raise SystemExit('detail script cache url not found')
html = html.replace(old_script, new_script, 1)
html_path.write_text(html, encoding='utf-8')
