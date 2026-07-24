from pathlib import Path

core_path = Path('js/detail_info_patch_core.js')
entry_path = Path('js/detail_info_patch.js')
html_path = Path('detail.html')

core = core_path.read_text(encoding='utf-8')
replacements = [
    (
        '''      .work-hero{\n        align-items:start!important;\n        grid-template-columns:minmax(210px,250px) minmax(0,1fr)!important;\n      }''',
        '''      .work-hero{\n        height:430px!important;\n        align-items:stretch!important;\n        grid-template-columns:minmax(210px,250px) minmax(0,1fr)!important;\n      }'''
    ),
    (
        '''      .work-hero .cover-panel{\n        height:430px!important;\n        max-height:430px!important;\n        min-height:0!important;\n        align-self:start!important;\n      }''',
        '''      .work-hero .cover-panel{\n        height:430px!important;\n        max-height:430px!important;\n        min-height:0!important;\n        align-self:stretch!important;\n      }'''
    ),
    (
        '''      .work-hero .info-panel{\n        height:auto!important;\n        min-height:0!important;\n        align-self:start!important;\n        display:block!important;\n        padding:22px 26px!important;\n      }''',
        '''      .work-hero .info-panel{\n        height:430px!important;\n        max-height:430px!important;\n        min-height:0!important;\n        align-self:stretch!important;\n        display:grid!important;\n        grid-template-rows:auto minmax(0,1fr)!important;\n        row-gap:12px!important;\n        overflow-y:auto!important;\n        scrollbar-width:thin;\n        padding:22px 26px!important;\n      }'''
    ),
    (
        '''      .work-hero .info-panel .meta-lines{\n        display:grid!important;\n        grid-template-columns:repeat(2,minmax(0,1fr))!important;\n        column-gap:28px!important;\n        row-gap:8px!important;\n        align-content:start!important;\n      }''',
        '''      .work-hero .info-panel .meta-lines{\n        display:grid!important;\n        height:100%!important;\n        min-height:0!important;\n        grid-template-columns:repeat(2,minmax(0,1fr))!important;\n        column-gap:28px!important;\n        row-gap:8px!important;\n        align-content:space-between!important;\n      }'''
    ),
    (
        '''      .work-hero .info-panel .meta-line{\n        min-height:0!important;\n        align-items:start!important;\n        grid-template-columns:88px minmax(0,1fr)!important;\n        line-height:1.55!important;\n      }''',
        '''      .work-hero .info-panel .meta-line{\n        min-height:0!important;\n        align-items:center!important;\n        grid-template-columns:88px minmax(0,1fr)!important;\n        line-height:1.55!important;\n      }'''
    ),
    (
        '''      @media(max-width:1180px){\n        .work-hero{grid-template-columns:1fr!important;}\n        .work-hero .cover-panel{height:360px!important;max-height:360px!important;}\n        .work-hero .info-panel .meta-lines{grid-template-columns:1fr!important;}\n        .work-hero .info-panel .meta-line.wide{grid-column:1!important;}\n      }''',
        '''      @media(max-width:1180px){\n        .work-hero{height:auto!important;align-items:start!important;grid-template-columns:1fr!important;}\n        .work-hero .cover-panel{height:360px!important;max-height:360px!important;align-self:start!important;}\n        .work-hero .info-panel{height:auto!important;max-height:none!important;align-self:start!important;display:block!important;overflow:visible!important;}\n        .work-hero .info-panel .meta-lines{height:auto!important;grid-template-columns:1fr!important;align-content:start!important;}\n        .work-hero .info-panel .meta-line.wide{grid-column:1!important;}\n      }'''
    )
]

for old, new in replacements:
    if old not in core:
        raise SystemExit(f'expected CSS block not found:\n{old}')
    core = core.replace(old, new, 1)
core_path.write_text(core, encoding='utf-8')

entry = entry_path.read_text(encoding='utf-8')
old_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V15__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V15__=true;'''
new_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V16__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V16__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V15__=true;'''
if old_guard not in entry:
    raise SystemExit('V15 guard not found')
entry = entry.replace(old_guard, new_guard, 1)
old_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_compact_header_v1";'
new_core = 'const coreUrl="js/detail_info_patch_core.js?v=20260724_equal_height_header_v1";'
if old_core not in entry:
    raise SystemExit('old core cache key not found')
entry = entry.replace(old_core, new_core, 1)
entry_path.write_text(entry, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
old_script = 'js/detail_info_patch.js?v=20260724_compact_header_v1'
new_script = 'js/detail_info_patch.js?v=20260724_equal_height_header_v1'
if old_script not in html:
    raise SystemExit('old detail cache key not found')
html = html.replace(old_script, new_script, 1)
html_path.write_text(html, encoding='utf-8')
