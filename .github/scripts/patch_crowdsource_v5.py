from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
js_path = ROOT / "assets/js/crowdsource.js"
css_path = ROOT / "assets/css/crowdsource.css"
config_path = ROOT / "assets/js/form-config.js"
detail_path = ROOT / "detail.html"

js = js_path.read_text(encoding="utf-8")

# 使用新的会话版本，避免旧界面保存的数据影响新布局。
js = js.replace('const STORAGE_KEY=`crowdsource:${EFFECTIVE_ID}:v4`;', 'const STORAGE_KEY=`crowdsource:${EFFECTIVE_ID}:v5`;')

rail_functions = r'''  function crowdHintCopy(type){
    if(type==="punctuation"){
      return {
        title:"标点校订提示",
        lines:["新增一条或多条标点意见。","填写原文、当前标点和建议标点。","补充修改理由与参考依据。","填写邮箱并提交人工审核。"]
      };
    }
    if(type==="missingText"){
      return {
        title:"缺字补录提示",
        lines:["选择缺字意见类型。","填写对应位置及当前显示内容。","给出建议补录文字与判断理由。","填写邮箱并提交人工审核。"]
      };
    }
    return {
      title:"释文校订提示",
      lines:["点击拓片中的字：添加或取消校订字。","可以连续选择多个字并统一提交。","在修改列表中填写建议、理由和依据。","提交内容只进入人工审核，不会自动改文。"]
    };
  }

  function renderCrowdRailHint(type=state.active){
    const hint=qs("#crowdReaderHint");
    if(!hint) return;
    const copy=crowdHintCopy(type);
    hint.replaceChildren();
    const title=document.createElement("b");title.textContent=copy.title;hint.appendChild(title);
    copy.lines.forEach(line=>{const span=document.createElement("span");span.className="tip-line";span.textContent=line;hint.appendChild(span);});
  }

  function syncCrowdRailHintVisibility(){
    const section=qs("#places"),hint=qs("#crowdReaderHint");
    if(!section||!hint) return;
    const rect=section.getBoundingClientRect();
    const focus=Math.max(150,Math.min(window.innerHeight*0.48,460));
    const show=rect.top<=focus&&rect.bottom>=focus;
    hint.classList.toggle("show",show);
    if(show){
      const readerHint=qs("#readerHint");
      if(readerHint) readerHint.classList.remove("show");
    }
  }

  function installCrowdRailHint(){
    const rail=qs(".right-rail");
    if(!rail) return;
    let hint=qs("#crowdReaderHint");
    if(!hint){
      hint=document.createElement("div");
      hint.id="crowdReaderHint";
      hint.className="reader-hint crowd-reader-hint";
      rail.appendChild(hint);
    }
    renderCrowdRailHint(state.active);
    let ticking=false;
    const schedule=()=>{
      if(ticking) return;
      ticking=true;
      requestAnimationFrame(()=>{ticking=false;syncCrowdRailHintVisibility();});
    };
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    schedule();
  }

'''

js, count = re.subn(
    r'  function guideHtml\(\)\{.*?\n  \}\n\n(?=  function staticLayout\(\)\{)',
    rail_functions,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "guideHtml block not found"

# 切换标签时同步右侧提示内容。
js = js.replace('    qsa(".crowd-panel",qs("#places")).forEach(panel=>{panel.hidden=panel.dataset.panel!==name;});\n    touch(name);',
                '    qsa(".crowd-panel",qs("#places")).forEach(panel=>{panel.hidden=panel.dataset.panel!==name;});\n    renderCrowdRailHint(name);\n    touch(name);')

transcription_panel = r'''  function renderTranscriptionPanel(){
    const panel=qs('[data-panel="transcription"]');
    if(!panel) return;
    panel.innerHTML=`
      <div class="crowd-workspace">
        <section class="crowd-pane">
          <h3 class="crowd-pane-title">1. 释文校订（针对单字）</h3>
          <p class="crowd-pane-lead">点击左侧碑帖图片中的任意字，该字将被加入修改列表，可多选并一次提交。</p>
          <div class="crowd-image-toolbar">
            <button class="crowd-icon-btn" data-page-prev type="button">上一页</button>
            <span class="crowd-page-summary" data-page-summary></span>
            <button class="crowd-icon-btn" data-page-next type="button">下一页</button>
          </div>
          <div class="crowd-image-stage"><div class="crowd-empty-image">正在读取碑帖图片与单字坐标……</div></div>
          <p class="crowd-hint">ⓘ 提示：点击碑帖图片中的字即可选择，已选字会显示红框。</p>
        </section>
        <aside class="crowd-right">
          <div class="crowd-list-card">
            <div class="crowd-list-head">
              <div class="crowd-list-heading"><h3 class="crowd-list-title">已选字修改列表</h3><span>可同时提交多条</span></div>
              <button class="crowd-clear" data-clear-transcription type="button">清空全部</button>
            </div>
            <div class="crowd-items" data-transcription-items></div>
            <div class="crowd-manual"><button class="crowd-btn" data-add-manual type="button">＋ 手动新增一条修改意见</button></div>
          </div>
        </aside>
      </div>
      <div data-submit-slot="transcription"></div>`;
    qs('[data-submit-slot="transcription"]',panel).appendChild(buildSubmitCard("transcription","提交释文校订"));
    bindTranscriptionControls(panel);
    renderPageControls();
    renderTranscriptionItems();
  }

'''
js, count = re.subn(
    r'  function renderTranscriptionPanel\(\)\{.*?\n  \}\n\n(?=  function bindTranscriptionControls\(panel\)\{)',
    transcription_panel,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "renderTranscriptionPanel block not found"

bind_controls = r'''  function bindTranscriptionControls(panel){
    qs("[data-page-prev]",panel).addEventListener("click",()=>changePage(state.pageIndex-1));
    qs("[data-page-next]",panel).addEventListener("click",()=>changePage(state.pageIndex+1));
    qs("[data-clear-transcription]",panel).addEventListener("click",()=>{
      state.selected.clear();state.lastKey="";touch("transcription");renderTranscriptionItems();renderCurrentImage();
    });
    qs("[data-add-manual]",panel).addEventListener("click",()=>{
      const item={key:uid(),manual:true,pageNo:"",line:"",column:"",text:"",suggested:"",candidates:[],reason:"",reference:""};
      state.selected.set(item.key,item);state.lastKey=item.key;touch("transcription");renderTranscriptionItems();
    });
  }

'''
js, count = re.subn(
    r'  function bindTranscriptionControls\(panel\)\{.*?\n  \}\n\n(?=  function renderPageControls\(\)\{)',
    bind_controls,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "bindTranscriptionControls block not found"

page_controls = r'''  function renderPageControls(){
    if(state.pages.length) state.pageIndex=Math.max(0,Math.min(state.pages.length-1,state.pageIndex));
    renderCurrentImage();
  }

  function changePage(index){
    if(!state.pages.length) return;
    state.pageIndex=Math.max(0,Math.min(state.pages.length-1,index));
    touch();
    renderCurrentImage();
  }

'''
js, count = re.subn(
    r'  function renderPageControls\(\)\{.*?\n  \}\n\n  function changePage\(index\)\{.*?\n  \}\n\n(?=  function currentPageSelected\(\)\{)',
    page_controls,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "page controls block not found"

image_functions = r'''  function renderCurrentImage(){
    const stage=qs(".crowd-image-stage");
    if(!stage) return;
    const page=state.pages[state.pageIndex];
    const prev=qs("[data-page-prev]"),next=qs("[data-page-next]"),summary=qs("[data-page-summary]");
    if(prev) prev.disabled=state.pageIndex<=0;
    if(next) next.disabled=!state.pages.length||state.pageIndex>=state.pages.length-1;
    if(summary) summary.textContent=state.pages.length?`第 ${state.pageIndex+1} / ${state.pages.length} 页`:"暂无页码";
    updateCurrentSummary();
    stage.replaceChildren();
    if(!page||!page.image){
      const empty=document.createElement("div");empty.className="crowd-empty-image";empty.textContent="当前页暂无可显示图片。";stage.appendChild(empty);return;
    }
    const wrap=document.createElement("div");wrap.className="crowd-image-wrap";
    const img=document.createElement("img");img.className="crowd-image";img.alt=`${currentWorkTitle()} 第${state.pageIndex+1}页`;img.src=page.image;
    const layer=document.createElement("div");layer.className="crowd-box-layer";
    wrap.append(img,layer);stage.appendChild(wrap);
    let bounds=null;
    const setup=()=>{
      const glyphs=pageGlyphs();
      bounds=pageTextBounds(glyphs,img);
      const size=canvasSize(glyphs,img);
      wrap.style.aspectRatio=`${bounds.w} / ${bounds.h}`;
      img.style.width=`${size.w/bounds.w*100}%`;
      img.style.left=`${-bounds.x/bounds.w*100}%`;
      img.style.top=`${-bounds.y/bounds.h*100}%`;
      drawSelectedBoxes(layer,bounds);
    };
    img.addEventListener("load",setup,{once:true});
    if(img.complete&&img.naturalWidth) setup();
    wrap.addEventListener("click",event=>{if(bounds)handleImageClick(event,wrap,bounds);});
  }

  function canvasSize(glyphs,img){
    const first=glyphs.find(glyph=>glyph.canvas_width>0&&glyph.canvas_height>0)||{};
    return {w:first.canvas_width||img.naturalWidth||1,h:first.canvas_height||img.naturalHeight||1};
  }

  function pageTextBounds(glyphs,img){
    const size=canvasSize(glyphs,img);
    const valid=glyphs.filter(glyph=>glyph.w>0&&glyph.h>0);
    if(!valid.length) return {x:0,y:0,w:size.w,h:size.h};
    const minX=Math.min(...valid.map(glyph=>glyph.x));
    const minY=Math.min(...valid.map(glyph=>glyph.y));
    const maxX=Math.max(...valid.map(glyph=>glyph.x+glyph.w));
    const maxY=Math.max(...valid.map(glyph=>glyph.y+glyph.h));
    const avgW=valid.reduce((sum,glyph)=>sum+glyph.w,0)/valid.length;
    const avgH=valid.reduce((sum,glyph)=>sum+glyph.h,0)/valid.length;
    const padX=Math.max(size.w*.012,avgW*.7);
    const padY=Math.max(size.h*.012,avgH*.7);
    const x=Math.max(0,minX-padX),y=Math.max(0,minY-padY);
    const right=Math.min(size.w,maxX+padX),bottom=Math.min(size.h,maxY+padY);
    return {x,y,w:Math.max(1,right-x),h:Math.max(1,bottom-y)};
  }

  function drawSelectedBoxes(layer,bounds){
    layer.replaceChildren();
    currentPageSelected().forEach(item=>{
      const box=document.createElement("span");box.className="crowd-glyph-box";
      box.style.left=`${(item.x-bounds.x)/bounds.w*100}%`;box.style.top=`${(item.y-bounds.y)/bounds.h*100}%`;
      box.style.width=`${item.w/bounds.w*100}%`;box.style.height=`${item.h/bounds.h*100}%`;
      layer.appendChild(box);
    });
  }

  function handleImageClick(event,wrap,bounds){
    const glyphs=pageGlyphs();
    if(!glyphs.length) return;
    const rect=wrap.getBoundingClientRect();
    const x=bounds.x+(event.clientX-rect.left)/rect.width*bounds.w;
    const y=bounds.y+(event.clientY-rect.top)/rect.height*bounds.h;
    const hits=glyphs.filter(glyph=>x>=glyph.x&&x<=glyph.x+glyph.w&&y>=glyph.y&&y<=glyph.y+glyph.h).sort((a,b)=>a.w*a.h-b.w*b.h);
    if(hits.length) toggleGlyph(hits[0]);
  }

'''
js, count = re.subn(
    r'  function renderCurrentImage\(\)\{.*?\n  \}\n\n  function canvasSize\(glyphs,img\)\{.*?\n  \}\n\n  function drawSelectedBoxes\(layer,img\)\{.*?\n  \}\n\n  function handleImageClick\(event,img\)\{.*?\n  \}\n\n(?=  function toggleGlyph\(row\)\{)',
    image_functions,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "image interaction block not found"

# 移除“其他候选字”输入框，保留核心建议、理由与依据。
js = js.replace('    card.appendChild(buildCandidateField(item));\n', '')
js, count = re.subn(
    r'  function buildCandidateField\(item\)\{.*?\n  \}\n\n(?=  function renderSimplePanel\(type\)\{)',
    '',
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "buildCandidateField block not found"
js = js.replace('`候选字：${item.candidates.length?item.candidates.join("、"):"无"}`,', '')

simple_panel = r'''  function renderSimplePanel(type){
    const panel=qs(`[data-panel="${type}"]`);
    if(!panel) return;
    const punctuation=type==="punctuation";
    panel.innerHTML=`
      <div class="crowd-simple-list" data-simple-list="${type}"></div>
      <div class="crowd-add-row"><button class="crowd-btn" data-add-simple="${type}" type="button">＋ ${punctuation?"新增一条标点意见":"新增一条缺字意见"}</button></div>
      <div data-submit-slot="${type}"></div>`;
    qs(`[data-submit-slot="${type}"]`,panel).appendChild(buildSubmitCard(type,punctuation?"提交标点校订":"提交缺字补录意见"));
    qs(`[data-add-simple="${type}"]`,panel).addEventListener("click",()=>{
      (punctuation?state.punctuation:state.missingText).push(punctuation?blankPunctuation():blankMissing());touch(type);renderSimpleItems(type);
    });
    renderSimpleItems(type);
  }

'''
js, count = re.subn(
    r'  function renderSimplePanel\(type\)\{.*?\n  \}\n\n(?=  function renderSimpleItems\(type\)\{)',
    simple_panel,
    js,
    count=1,
    flags=re.S,
)
assert count == 1, "renderSimplePanel block not found"

# 初始化右侧提示。
js = js.replace('    if(!staticLayout()) return;\n    renderTranscriptionPanel();',
                '    if(!staticLayout()) return;\n    installCrowdRailHint();\n    renderTranscriptionPanel();')

# 关键断言，防止误改其他功能。
assert 'data-page-select' not in js
assert 'crowd-location-item' not in js
assert 'buildCandidateField' not in js
assert '${guideHtml()}' not in js
assert 'installCrowdRailHint();' in js
assert 'pageTextBounds' in js
js_path.write_text(js, encoding="utf-8")

css = r'''#places.crowdsource-section{padding:24px 26px 28px;overflow:visible}
#places.crowdsource-section>.section-title{margin-bottom:4px}
.crowd-intro{margin:0 0 18px;color:#6b5a4a;font-size:15px;line-height:1.8;text-indent:2em}
.crowd-shell{border:1px solid #e4d4bc;border-radius:18px;background:#fffdf8;box-shadow:0 9px 26px rgba(52,35,20,.055);overflow:hidden}
.crowd-tabs{display:flex;overflow-x:auto;border-bottom:1px solid #dfcfb7;background:#faf5eb;scrollbar-width:thin}
.crowd-tab{flex:1 0 240px;min-height:54px;border:0;border-right:1px solid #e2d6c4;background:transparent;color:#4c4035;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;white-space:nowrap}
.crowd-tab:last-child{border-right:0}.crowd-tab:hover{background:#f4eadb;color:#8e3024}.crowd-tab.active{background:linear-gradient(135deg,#943b2e,#7d2e24);color:#fff}
.crowd-panel{padding:18px}.crowd-panel[hidden]{display:none!important}
.crowd-workspace{display:grid;grid-template-columns:minmax(0,1.14fr) minmax(330px,.86fr);gap:16px;align-items:stretch}
.crowd-pane,.crowd-list-card,.crowd-submit-card,.crowd-simple-card{border:1px solid #e4d5bf;border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(52,35,20,.04)}
.crowd-pane{padding:16px;min-width:0}.crowd-pane-title{margin:0 0 8px;font-family:"SimSun","Songti SC",serif;font-size:21px;color:#33291f}.crowd-pane-lead{margin:0 0 12px;color:#695b4e;font-size:13px;line-height:1.75}
.crowd-image-toolbar{display:grid;grid-template-columns:auto minmax(108px,1fr) auto;align-items:center;gap:10px;margin-bottom:12px}
.crowd-page-summary{display:flex;align-items:center;justify-content:center;min-height:39px;border:1px solid #e1d0b4;border-radius:999px;background:#fbf6ed;color:#725f4e;font-weight:900;font-size:13px;white-space:nowrap}
.crowd-btn,.crowd-icon-btn{border:1px solid #d9c5a2;background:#fffaf0;color:#63452f;border-radius:10px;padding:8px 13px;font-weight:800;cursor:pointer}.crowd-btn:hover,.crowd-icon-btn:hover{background:#f3e5cf;color:#8f3025}.crowd-btn:disabled,.crowd-icon-btn:disabled{opacity:.42;cursor:not-allowed}
.crowd-image-stage{position:relative;width:100%;min-height:420px;max-height:720px;overflow:auto;border:1px solid #eadfce;border-radius:13px;background:#f7f0e5;display:flex;align-items:flex-start;justify-content:center;padding:10px}
.crowd-image-wrap{position:relative;width:100%;max-width:100%;overflow:hidden;border-radius:9px;background:#efe5d5;line-height:0;box-shadow:0 5px 18px rgba(52,35,20,.08)}
.crowd-image{position:absolute;display:block;height:auto;max-width:none;user-select:none;cursor:crosshair}.crowd-box-layer{position:absolute;inset:0;pointer-events:none}.crowd-glyph-box{position:absolute;border:2px solid #d73525;background:rgba(215,53,37,.10);box-shadow:0 0 0 2px rgba(255,255,255,.20);pointer-events:none}.crowd-empty-image{padding:60px 24px;color:#78695b;text-align:center;line-height:1.8}.crowd-hint{margin:11px 0 0;color:#9a3b2e;font-size:13px}
.crowd-right{min-width:0}.crowd-list-card{padding:16px;height:100%;min-height:100%}.crowd-list-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:13px;padding-bottom:11px;border-bottom:1px solid #eee2d0}.crowd-list-heading{min-width:0}.crowd-list-title{margin:0;font-family:"SimSun","Songti SC",serif;font-size:20px;line-height:1.25;color:#33291f;white-space:nowrap}.crowd-list-heading span{display:block;margin-top:3px;color:#8a7866;font-size:12px}.crowd-clear{flex:0 0 auto;border:1px solid #dbcab0;background:#fffaf1;color:#7b5c44;border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}.crowd-clear:hover{color:#9a3025;border-color:#b98678;background:#fff4e4}
.crowd-items{display:grid;gap:12px;max-height:650px;overflow-y:auto;padding-right:4px;scrollbar-width:thin;scrollbar-color:#b19a73 #f3ede2}.crowd-empty-list{border:1px dashed #dbcdb8;border-radius:12px;padding:28px 16px;text-align:center;color:#887765;background:#fcf8f1}.crowd-item{border:1px solid #e3d5c1;border-radius:13px;background:#fffdf9;padding:13px}.crowd-item-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.crowd-item-index{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:#8f3b2f;color:#fff;font-size:12px;font-weight:900;flex:0 0 auto}.crowd-item-meta{flex:1;color:#5f5144;font-size:13px;line-height:1.6}.crowd-item-meta strong{color:#3f3329}.crowd-remove{border:0;background:transparent;color:#8e6d59;font-size:20px;cursor:pointer;line-height:1;padding:2px}.crowd-remove:hover{color:#a53125}
.crowd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.crowd-field{display:grid;gap:5px;margin-bottom:10px}.crowd-field:last-child{margin-bottom:0}.crowd-field label{font-size:13px;color:#5b4d40;font-weight:800}.crowd-required{color:#a73326}.crowd-input,.crowd-textarea,.crowd-select{width:100%;border:1px solid #dccdb8;border-radius:9px;background:#fff;color:#392f27;padding:9px 10px;font:inherit;line-height:1.55;outline:none}.crowd-input:focus,.crowd-textarea:focus,.crowd-select:focus{border-color:#a85c4f;box-shadow:0 0 0 3px rgba(159,48,37,.09)}.crowd-textarea{min-height:82px;resize:vertical}
.crowd-manual{margin-top:12px;text-align:center}.crowd-manual .crowd-btn{background:#fffaf0}.crowd-submit-card{margin-top:16px;padding:16px}.crowd-submit-title{margin:0 0 12px;font-family:"SimSun","Songti SC",serif;font-size:20px}.crowd-contact-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.crowd-checks{display:grid;gap:8px;margin:12px 0}.crowd-check{display:flex;align-items:flex-start;gap:8px;color:#5a4b3f;font-size:13px;line-height:1.6}.crowd-check input{margin-top:4px}.crowd-submit-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.9fr);align-items:center;gap:12px}.crowd-submit{border:0;border-radius:10px;background:linear-gradient(135deg,#963b2f,#7f2d24);color:#fff;padding:11px 18px;font-size:15px;font-weight:900;cursor:pointer}.crowd-submit:disabled{opacity:.42;cursor:not-allowed}.crowd-status{min-height:24px;font-size:13px;color:#6c5849}.crowd-status.success{color:#48723e}.crowd-status.error{color:#a1281e}.crowd-submit-note{margin:12px 0 0;padding-top:10px;border-top:1px solid #eadfce;color:#7b6b5d;font-size:12px;line-height:1.7}
.crowd-simple-list{display:grid;gap:12px}.crowd-simple-card{padding:14px}.crowd-simple-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.crowd-simple-head strong{font-size:16px}.crowd-add-row{text-align:center;margin-top:12px}.crowd-honeypot{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important}
.crowd-reader-hint{margin-top:0}.crowd-reader-hint .tip-line{position:relative;padding:4px 0 4px 14px}.crowd-reader-hint .tip-line:before{content:"";position:absolute;left:1px;top:13px;width:5px;height:5px;border-radius:50%;background:#b08a4a}.crowd-reader-hint b{font-family:"SimSun","Songti SC",serif;font-size:17px}
.crowd-dialog{position:fixed;inset:0;z-index:2600;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(28,21,16,.52);backdrop-filter:blur(3px)}.crowd-dialog.show{display:flex}.crowd-dialog-card{width:min(620px,94vw);max-height:82vh;overflow:auto;border:1px solid #e1ceb0;border-radius:18px;background:#fffaf1;padding:22px;box-shadow:0 28px 80px rgba(0,0,0,.28)}.crowd-dialog-card h3{margin:0 0 10px;color:#8e3025}.crowd-dialog-card pre{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #eadfce;border-radius:10px;padding:12px;font-size:12px;line-height:1.6}.crowd-dialog-actions{text-align:right;margin-top:12px}
@media(max-width:980px){.crowd-workspace{grid-template-columns:1fr}.crowd-items{max-height:none}.crowd-contact-grid{grid-template-columns:1fr 1fr}.crowd-contact-grid .crowd-field:last-child{grid-column:1/-1}}
@media(max-width:680px){#places.crowdsource-section{padding:18px 14px 20px}.crowd-panel{padding:12px}.crowd-tab{flex-basis:220px}.crowd-grid,.crowd-contact-grid,.crowd-submit-row{grid-template-columns:1fr}.crowd-contact-grid .crowd-field:last-child{grid-column:auto}.crowd-image-stage{min-height:300px;max-height:560px;padding:7px}.crowd-image-toolbar{grid-template-columns:auto 1fr auto}.crowd-list-head{align-items:flex-start}.crowd-list-title{font-size:18px}.crowd-submit{width:100%}.crowd-pane,.crowd-list-card,.crowd-submit-card,.crowd-simple-card{border-radius:13px}}
'''
css_path.write_text(css, encoding="utf-8")

config = config_path.read_text(encoding="utf-8").replace("20260713_fix4", "20260713_fix5")
config_path.write_text(config, encoding="utf-8")

detail = detail_path.read_text(encoding="utf-8").replace("20260713_fix4", "20260713_fix5")
detail_path.write_text(detail, encoding="utf-8")

print("crowdsource v5 patch complete")
