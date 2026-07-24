from pathlib import Path
import re

core_path = Path('js/detail_info_patch_core.js')
entry_path = Path('js/detail_info_patch.js')
html_path = Path('detail.html')

core = core_path.read_text(encoding='utf-8')
new_style = '''style.textContent=`
      .alias{display:none!important;}
      .work-hero{
        align-items:start!important;
        grid-template-columns:minmax(210px,250px) minmax(0,1fr)!important;
      }
      .work-hero .cover-panel{
        height:430px!important;
        max-height:430px!important;
        min-height:0!important;
        align-self:start!important;
      }
      .work-hero .cover-panel img{
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:center top!important;
      }
      .work-hero .info-panel{
        height:auto!important;
        min-height:0!important;
        align-self:start!important;
        display:block!important;
        padding:22px 26px!important;
      }
      .work-hero .info-panel h1{
        margin:0 0 12px!important;
        font-size:clamp(34px,3vw,46px)!important;
        line-height:1.08!important;
      }
      .work-hero .info-panel .meta-lines{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        column-gap:28px!important;
        row-gap:8px!important;
        align-content:start!important;
      }
      .work-hero .info-panel .meta-line{
        min-height:0!important;
        align-items:start!important;
        grid-template-columns:88px minmax(0,1fr)!important;
        line-height:1.55!important;
      }
      .work-hero .info-panel .meta-line b{
        line-height:1.55!important;
        white-space:nowrap;
      }
      .work-hero .info-panel .meta-line span{
        min-width:0;
        overflow-wrap:anywhere;
      }
      .work-hero .info-panel .meta-line.wide{
        grid-column:1/-1!important;
      }
      .work-hero .info-panel .meta-line.compact-note{
        font-size:14px!important;
        line-height:1.55!important;
      }
      .beitie-info-text{font-size:15px;line-height:1.95;color:#342820;}
      .beitie-info-text p{margin:0 0 8px!important;text-indent:0!important;}
      .beitie-info-text p:last-child{margin-bottom:0!important;}
      .beitie-info-text .beitie-info-label{
        font-size:19px!important;
        font-weight:900!important;
        color:#9f3025!important;
        margin:6px 0 4px!important;
        letter-spacing:.03em;
        line-height:1.55!important;
      }
      @media(max-width:1180px){
        .work-hero{grid-template-columns:1fr!important;}
        .work-hero .cover-panel{height:360px!important;max-height:360px!important;}
        .work-hero .info-panel .meta-lines{grid-template-columns:1fr!important;}
        .work-hero .info-panel .meta-line.wide{grid-column:1!important;}
      }
      @media(max-width:640px){
        .work-hero .cover-panel{height:300px!important;max-height:300px!important;}
        .work-hero .info-panel{padding:20px!important;}
        .work-hero .info-panel h1{font-size:32px!important;}
        .work-hero .info-panel .meta-line{grid-template-columns:80px minmax(0,1fr)!important;}
      }
    `;'''
core, count = re.subn(r'style\.textContent=`.*?\n    `;', new_style, core, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'core style replacement count={count}')
core_path.write_text(core, encoding='utf-8')

entry = entry_path.read_text(encoding='utf-8')
old_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V14__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V14__=true;'''
new_guard = '''if(window.__DETAIL_INFO_STABLE_ENTRY_V15__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V15__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V14__=true;'''
if old_guard not in entry:
    raise SystemExit('entry guard not found')
entry = entry.replace(old_guard, new_guard, 1)
entry = entry.replace(
    'const coreUrl="js/detail_info_patch_core.js?v=20260717_stable_header_v1";',
    'const coreUrl="js/detail_info_patch_core.js?v=20260724_compact_header_v1";',
    1
)

old_build = '''  function buildRows(record,title){
    const b=record?.basic||{},rows=[];const push=(label,value,wide=false)=>{const text=clean(value);if(text)rows.push({label,value:text,wide});};
    const firstTitle=first(b["首题"]);if(firstTitle&&firstTitle!==title)push("首题",firstTitle,firstTitle.length>24);
    push("其他题名",b["其他题名"],true);push("额题",b["额题"]);push("责任者",b["责任者"]);push("书体",b["书体"]);push("版本",b["版本"]);push("影印版本",b["影印版本"]);push("版本说明",b["版本说明"],true);push("数量",b["数量"]);push("尺寸",b["尺寸"],true);push("年代",first(b["刻立年代"],b["年代"],b["时代"]));push("刻立地点",first(b["刻立地点"],b["地点"]));push("出土地点",b["出土地点"]);push("馆藏",b["馆藏"]);push("镌刻特征",b["镌刻特征"],true);push("铭文行款",b["铭文行款"],true);push("来源",b["来源"],true);return rows;
  }'''
new_build = '''  function buildRows(record,title){
    const b=record?.basic||{},rows=[];
    const push=(label,value,{wide=false,compact=false}={})=>{const text=clean(value);if(text)rows.push({label,value:text,wide,compact});};
    const firstTitle=first(b["首题"]);if(firstTitle&&firstTitle!==title)push("首题",firstTitle,{wide:true});
    push("其他题名",b["其他题名"],{wide:true});
    push("额题",b["额题"]);
    push("责任者",b["责任者"]);push("书体",b["书体"]);
    push("版本",b["版本"]);push("影印版本",b["影印版本"]);
    push("数量",b["数量"]);push("铭文行款",b["铭文行款"]);
    push("尺寸",b["尺寸"]);push("年代",first(b["刻立年代"],b["年代"],b["时代"]));
    push("刻立地点",first(b["刻立地点"],b["地点"]));push("出土地点",b["出土地点"]);
    push("馆藏",b["馆藏"]);
    push("版本说明",b["版本说明"],{wide:true,compact:true});
    push("镌刻特征",b["镌刻特征"],{wide:true,compact:true});
    push("来源",b["来源"],{wide:true,compact:true});
    return rows;
  }'''
if old_build not in entry:
    raise SystemExit('buildRows block not found')
entry = entry.replace(old_build, new_build, 1)

old_signatures = '''  function rowSignature(rows){return rows.map(item=>`${item.label}\\u0001${item.value}\\u0001${item.wide?1:0}`).join("\\u0002");}
  function currentSignature(box){return Array.from(box.querySelectorAll(":scope > .meta-line")).map(line=>`${clean(line.querySelector("b")?.textContent)}\\u0001${clean(line.querySelector("span")?.textContent)}\\u0001${line.classList.contains("wide")?1:0}`).join("\\u0002");}'''
new_signatures = '''  function rowSignature(rows){return rows.map(item=>`${item.label}\\u0001${item.value}\\u0001${item.wide?1:0}\\u0001${item.compact?1:0}`).join("\\u0002");}
  function currentSignature(box){return Array.from(box.querySelectorAll(":scope > .meta-line")).map(line=>`${clean(line.querySelector("b")?.textContent)}\\u0001${clean(line.querySelector("span")?.textContent)}\\u0001${line.classList.contains("wide")?1:0}\\u0001${line.classList.contains("compact-note")?1:0}`).join("\\u0002");}'''
if old_signatures not in entry:
    raise SystemExit('signature block not found')
entry = entry.replace(old_signatures, new_signatures, 1)

old_render = '''    if(currentSignature(box)!==signature){const fragment=document.createDocumentFragment();rows.forEach(item=>{const line=document.createElement("div");line.className="meta-line";if(item.wide||item.value.length>38)line.classList.add("wide");const term=document.createElement("b");term.textContent=item.label;const value=document.createElement("span");value.textContent=item.value;line.append(term,value);fragment.appendChild(line);});box.replaceChildren(fragment);}'''
new_render = '''    if(currentSignature(box)!==signature){const fragment=document.createDocumentFragment();rows.forEach(item=>{const line=document.createElement("div");line.className="meta-line";if(item.wide)line.classList.add("wide");if(item.compact)line.classList.add("compact-note");const term=document.createElement("b");term.textContent=item.label;const value=document.createElement("span");value.textContent=item.value;line.append(term,value);fragment.appendChild(line);});box.replaceChildren(fragment);}'''
if old_render not in entry:
    raise SystemExit('render block not found')
entry = entry.replace(old_render, new_render, 1)
entry_path.write_text(entry, encoding='utf-8')

html = html_path.read_text(encoding='utf-8')
old_script = 'js/detail_info_patch.js?v=20260724_wangjushi_v1'
new_script = 'js/detail_info_patch.js?v=20260724_compact_header_v1'
if old_script not in html:
    raise SystemExit('detail script query not found')
html = html.replace(old_script, new_script, 1)
html_path.write_text(html, encoding='utf-8')
