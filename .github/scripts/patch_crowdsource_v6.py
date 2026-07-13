from pathlib import Path

js_path = Path('assets/js/crowdsource.js')
css_path = Path('assets/css/crowdsource.css')
detail_path = Path('detail.html')
config_path = Path('assets/js/form-config.js')

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
detail = detail_path.read_text(encoding='utf-8')
config = config_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)

js = replace_once(js,
    'const STORAGE_KEY=`crowdsource:${EFFECTIVE_ID}:v5`;',
    'const STORAGE_KEY=`crowdsource:${EFFECTIVE_ID}:v6`;',
    'storage version')

old_panel = '''          <h3 class="crowd-pane-title">1. 释文校订（针对单字）</h3>
          <p class="crowd-pane-lead">点击左侧碑帖图片中的任意字，该字将被加入修改列表，可多选并一次提交。</p>
          <div class="crowd-image-toolbar">
            <button class="crowd-icon-btn" data-page-prev type="button">上一页</button>
            <span class="crowd-page-summary" data-page-summary></span>
            <button class="crowd-icon-btn" data-page-next type="button">下一页</button>
          </div>'''
new_panel = '''          <p class="crowd-pane-lead">点击左侧碑帖图片中的任意字，该字将被加入修改列表，可多选并一次提交。</p>
          <div class="crowd-image-toolbar">
            <button class="crowd-icon-btn" data-page-prev type="button">上一页</button>
            <select class="crowd-page-select" data-page-select aria-label="选择碑帖页码"></select>
            <button class="crowd-icon-btn" data-page-next type="button">下一页</button>
          </div>'''
js = replace_once(js, old_panel, new_panel, 'panel heading and page control')

old_bind = '''    qs("[data-page-prev]",panel).addEventListener("click",()=>changePage(state.pageIndex-1));
    qs("[data-page-next]",panel).addEventListener("click",()=>changePage(state.pageIndex+1));'''
new_bind = '''    qs("[data-page-prev]",panel).addEventListener("click",()=>changePage(state.pageIndex-1));
    qs("[data-page-next]",panel).addEventListener("click",()=>changePage(state.pageIndex+1));
    qs("[data-page-select]",panel).addEventListener("change",event=>changePage(Number(event.target.value)));'''
js = replace_once(js, old_bind, new_bind, 'page select binding')

old_controls = '''  function renderPageControls(){
    if(state.pages.length) state.pageIndex=Math.max(0,Math.min(state.pages.length-1,state.pageIndex));
    renderCurrentImage();
  }'''
new_controls = '''  function renderPageControls(){
    const select=qs("[data-page-select]");
    if(state.pages.length) state.pageIndex=Math.max(0,Math.min(state.pages.length-1,state.pageIndex));
    if(select){
      select.replaceChildren();
      state.pages.forEach((page,index)=>{
        const option=document.createElement("option");
        option.value=String(index);
        option.textContent=`第 ${index+1} / ${state.pages.length} 页${page.label?`（${page.label}）`:""}`;
        select.appendChild(option);
      });
      select.value=String(state.pageIndex);
    }
    renderCurrentImage();
  }'''
js = replace_once(js, old_controls, new_controls, 'render page controls')

old_change = '''    state.pageIndex=Math.max(0,Math.min(state.pages.length-1,index));
    touch();
    renderCurrentImage();'''
new_change = '''    state.pageIndex=Math.max(0,Math.min(state.pages.length-1,index));
    const select=qs("[data-page-select]");
    if(select) select.value=String(state.pageIndex);
    touch();
    renderCurrentImage();'''
js = replace_once(js, old_change, new_change, 'change page select sync')

start = js.index('  function renderCurrentImage(){')
end = js.index('\n  function canvasSize(', start)
if start < 0 or end < 0:
    raise RuntimeError('renderCurrentImage block not found')
new_render = '''  function renderCurrentImage(){
    const stage=qs(".crowd-image-stage");
    if(!stage) return;
    if(stage._crowdResizeObserver){stage._crowdResizeObserver.disconnect();stage._crowdResizeObserver=null;}
    const page=state.pages[state.pageIndex];
    const prev=qs("[data-page-prev]"),next=qs("[data-page-next]"),select=qs("[data-page-select]");
    if(prev) prev.disabled=state.pageIndex<=0;
    if(next) next.disabled=!state.pages.length||state.pageIndex>=state.pages.length-1;
    if(select) select.value=String(state.pageIndex);
    stage.replaceChildren();
    if(!page||!page.image){
      const empty=document.createElement("div");empty.className="crowd-empty-image";empty.textContent="当前页暂无可显示图片。";stage.appendChild(empty);return;
    }
    const wrap=document.createElement("div");wrap.className="crowd-image-wrap";
    const img=document.createElement("img");img.className="crowd-image";img.alt=`${currentWorkTitle()} 第${state.pageIndex+1}页`;img.src=page.image;
    const layer=document.createElement("div");layer.className="crowd-box-layer";
    wrap.append(img,layer);stage.appendChild(wrap);
    let bounds=null;
    let clickTimer=null;
    const fit=()=>{
      if(!bounds) return;
      const glyphs=pageGlyphs();
      const size=canvasSize(glyphs,img);
      const stageStyle=getComputedStyle(stage);
      const padX=parseFloat(stageStyle.paddingLeft||0)+parseFloat(stageStyle.paddingRight||0);
      const padY=parseFloat(stageStyle.paddingTop||0)+parseFloat(stageStyle.paddingBottom||0);
      const availableW=Math.max(1,stage.clientWidth-padX);
      const availableH=Math.max(1,stage.clientHeight-padY);
      const scale=Math.min(availableW/bounds.w,availableH/bounds.h);
      const displayW=Math.max(1,bounds.w*scale),displayH=Math.max(1,bounds.h*scale);
      wrap.style.width=`${displayW}px`;
      wrap.style.height=`${displayH}px`;
      wrap.style.aspectRatio="auto";
      img.style.width=`${size.w*scale}px`;
      img.style.height=`${size.h*scale}px`;
      img.style.left=`${-bounds.x*scale}px`;
      img.style.top=`${-bounds.y*scale}px`;
      drawSelectedBoxes(layer,bounds);
    };
    const setup=()=>{
      bounds=pageTextBounds(pageGlyphs(),img);
      fit();
      if("ResizeObserver" in window){
        stage._crowdResizeObserver=new ResizeObserver(fit);
        stage._crowdResizeObserver.observe(stage);
      }
    };
    img.addEventListener("load",setup,{once:true});
    if(img.complete&&img.naturalWidth) setup();
    wrap.addEventListener("click",event=>{
      if(!bounds||event.detail>1) return;
      clearTimeout(clickTimer);
      const clientX=event.clientX,clientY=event.clientY;
      clickTimer=setTimeout(()=>handleImageClick({clientX,clientY},wrap,bounds),180);
    });
    wrap.addEventListener("dblclick",event=>{
      event.preventDefault();event.stopPropagation();clearTimeout(clickTimer);
      if(typeof window.openZoom==="function") window.openZoom(page.image);
      else window.open(page.image,"_blank","noopener");
    });
  }
'''
js = js[:start] + new_render + js[end:]

old_foot = '''    const foot=document.createElement("p");foot.className="crowd-submit-note";foot.textContent="说明：提交内容仅供校订研究与人工审核，不会直接改变网站现有释文。";card.appendChild(foot);
    return card;'''
new_foot = '''    return card;'''
js = replace_once(js, old_foot, new_foot, 'submit note removal')

css = css.replace('.crowd-workspace{display:grid;grid-template-columns:minmax(0,1.14fr) minmax(330px,.86fr);gap:16px;align-items:stretch}',
                  '.crowd-workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:stretch}')
css = css.replace('.crowd-pane{padding:16px;min-width:0}.crowd-pane-title{margin:0 0 8px;font-family:"SimSun","Songti SC",serif;font-size:21px;color:#33291f}.crowd-pane-lead{margin:0 0 12px;color:#695b4e;font-size:13px;line-height:1.75}',
                  '.crowd-pane{padding:16px;min-width:0;display:flex;flex-direction:column;height:100%}.crowd-pane-lead{margin:0 0 12px;color:#695b4e;font-size:13px;line-height:1.75}')
css = css.replace('.crowd-page-summary{display:flex;align-items:center;justify-content:center;min-height:39px;border:1px solid #e1d0b4;border-radius:999px;background:#fbf6ed;color:#725f4e;font-weight:900;font-size:13px;white-space:nowrap}',
                  '.crowd-page-select{width:100%;min-height:39px;border:1px solid #e1d0b4;border-radius:999px;background:#fbf6ed;color:#725f4e;font-weight:900;font-size:13px;text-align:center;text-align-last:center;padding:7px 34px 7px 16px;cursor:pointer;outline:none}.crowd-page-select:focus{border-color:#a85c4f;box-shadow:0 0 0 3px rgba(159,48,37,.08)}')
css = css.replace('.crowd-image-stage{position:relative;width:100%;min-height:420px;max-height:720px;overflow:auto;border:1px solid #eadfce;border-radius:13px;background:#f7f0e5;display:flex;align-items:flex-start;justify-content:center;padding:10px}',
                  '.crowd-image-stage{position:relative;width:100%;height:720px;overflow:hidden;border:1px solid #eadfce;border-radius:13px;background:#f7f0e5;display:flex;align-items:center;justify-content:center;padding:10px;flex:1;min-height:0}')
css = css.replace('.crowd-image-wrap{position:relative;width:100%;max-width:100%;overflow:hidden;border-radius:9px;background:#efe5d5;line-height:0;box-shadow:0 5px 18px rgba(52,35,20,.08)}',
                  '.crowd-image-wrap{position:relative;overflow:hidden;border-radius:9px;background:#efe5d5;line-height:0;box-shadow:0 5px 18px rgba(52,35,20,.08);cursor:crosshair}')
css = css.replace('.crowd-right{min-width:0}.crowd-list-card{padding:16px;height:100%;min-height:100%}',
                  '.crowd-right{min-width:0;height:100%}.crowd-list-card{padding:16px;height:100%;min-height:100%;display:flex;flex-direction:column}')
css = css.replace('.crowd-items{display:grid;gap:12px;max-height:650px;overflow-y:auto;padding-right:4px;',
                  '.crowd-items{display:grid;gap:12px;flex:1;min-height:0;max-height:none;overflow-y:auto;padding-right:4px;')
css = css.replace('.crowd-submit-note{margin:12px 0 0;padding-top:10px;border-top:1px solid #eadfce;color:#7b6b5d;font-size:12px;line-height:1.7}', '')
css = css.replace('.crowd-image-stage{min-height:300px;max-height:560px;padding:7px}', '.crowd-image-stage{height:560px;padding:7px}')

detail = detail.replace('20260713_fix5','20260713_fix6')
config = config.replace('20260713_fix5','20260713_fix6')

checks = {
    'heading removed': 'crowd-pane-title' not in js,
    'select added': 'data-page-select' in js,
    'double click zoom': 'dblclick' in js and 'openZoom' in js,
    'submit note removed': 'crowd-submit-note' not in js,
    'fit crop': 'availableH' in js and 'pageTextBounds' in js,
    'fix6 detail': '20260713_fix6' in detail,
    'fix6 config': '20260713_fix6' in config,
}
failed=[name for name,ok in checks.items() if not ok]
if failed:
    raise RuntimeError('validation failed: '+', '.join(failed))

js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
detail_path.write_text(detail,encoding='utf-8')
config_path.write_text(config,encoding='utf-8')
print('crowdsource v6 patch applied')
