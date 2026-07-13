(function(){
  "use strict";

  if(window.__CROWDSOURCE_WORKBENCH_V4__) return;
  window.__CROWDSOURCE_WORKBENCH_V4__=true;

  const TITLE="四、众智释读";
  const INTRO="本栏目用于收集读者对碑文释文、标点整理及缺字补录的校订意见。所有提交内容将由网站管理者人工审核，不会直接修改网页或自动公开。";
  const RAW_ID=String(new URLSearchParams(location.search).get("id")||"001");
  const PARENT_ID=(RAW_ID.includes("-")?RAW_ID.split("-")[0]:RAW_ID).padStart(3,"0");
  const EFFECTIVE_ID=RAW_ID.includes("-")?RAW_ID:PARENT_ID;
  const MODEL_VERSION="20260711_model_border_v3";
  const STORAGE_KEY=`crowdsource:${EFFECTIVE_ID}:v6`;

  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const uid=()=>`c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const val=value=>String(value==null?"":value);
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const clean=value=>val(value).trim();

  function blankContact(){return {email:"",name:"",note:"",agreeReview:false,agreeEmail:false,gotcha:""};}
  function blankPunctuation(){return {id:uid(),source:"",current:"",suggested:"",reason:"",reference:""};}
  function blankMissing(){return {id:uid(),type:"原碑缺字补录",position:"",current:"",ai:"",suggested:"",reason:"",reference:""};}

  const state={
    active:"transcription",
    pages:[],
    glyphsByPage:new Map(),
    pageIndex:0,
    selected:new Map(),
    lastKey:"",
    punctuation:[blankPunctuation()],
    missingText:[blankMissing()],
    submitting:{transcription:false,punctuation:false,missingText:false},
    contacts:{transcription:blankContact(),punctuation:blankContact(),missingText:blankContact()}
  };

  function safeContact(value){
    const base=blankContact();
    if(!value||typeof value!=="object") return base;
    return {
      email:val(value.email).slice(0,160),
      name:val(value.name).slice(0,80),
      note:val(value.note).slice(0,300),
      agreeReview:Boolean(value.agreeReview),
      agreeEmail:Boolean(value.agreeEmail),
      gotcha:""
    };
  }

  function restoreState(){
    try{
      const raw=sessionStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const saved=JSON.parse(raw);
      if(["transcription","punctuation","missingText"].includes(saved.active)) state.active=saved.active;
      if(Number.isInteger(saved.pageIndex)&&saved.pageIndex>=0) state.pageIndex=saved.pageIndex;
      if(Array.isArray(saved.selected)){
        saved.selected.forEach(item=>{
          if(!item||typeof item!=="object") return;
          const key=clean(item.key)||uid();
          state.selected.set(key,{...item,key,candidates:Array.isArray(item.candidates)?item.candidates.map(val).slice(0,20):[]});
        });
      }
      state.lastKey=clean(saved.lastKey);
      if(Array.isArray(saved.punctuation)&&saved.punctuation.length) state.punctuation=saved.punctuation.map(item=>({...blankPunctuation(),...item,id:clean(item.id)||uid()}));
      if(Array.isArray(saved.missingText)&&saved.missingText.length) state.missingText=saved.missingText.map(item=>({...blankMissing(),...item,id:clean(item.id)||uid()}));
      if(saved.contacts&&typeof saved.contacts==="object"){
        state.contacts.transcription=safeContact(saved.contacts.transcription);
        state.contacts.punctuation=safeContact(saved.contacts.punctuation);
        state.contacts.missingText=safeContact(saved.contacts.missingText);
      }
    }catch(error){
      console.warn("[crowdsource] session restore failed",error);
    }
  }

  function persistState(){
    try{
      const contacts={};
      Object.keys(state.contacts).forEach(type=>{contacts[type]={...state.contacts[type],gotcha:""};});
      sessionStorage.setItem(STORAGE_KEY,JSON.stringify({
        active:state.active,
        pageIndex:state.pageIndex,
        selected:Array.from(state.selected.values()),
        lastKey:state.lastKey,
        punctuation:state.punctuation,
        missingText:state.missingText,
        contacts
      }));
    }catch(error){
      console.warn("[crowdsource] session save failed",error);
    }
  }

  function touch(type){
    persistState();
    if(type) updateSubmitState(type);
  }

  function modelShardUrl(){
    const n=Number(PARENT_ID);
    const start=Math.floor((n-1)/5)*5+1;
    const end=Math.min(start+4,45);
    return `data/model_boxes/glyph_model_border_${String(start).padStart(3,"0")}_${String(end).padStart(3,"0")}.json?v=${MODEL_VERSION}`;
  }

  async function waitForReaderPages(){
    for(let i=0;i<80;i+=1){
      try{
        if(typeof pages!=="undefined"&&Array.isArray(pages)&&pages.length){
          return pages.map((page,index)=>({...page,__display:index+1}));
        }
      }catch(_){ }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    try{
      const response=await fetch("data/page_images_index.json",{cache:"no-store"});
      if(!response.ok) throw new Error(String(response.status));
      const data=await response.json();
      const work=(data.works||{})[EFFECTIVE_ID]||(data.works||{})[PARENT_ID];
      return Array.isArray(work&&work.pages)?work.pages.map((page,index)=>({...page,__display:index+1})):[];
    }catch(error){
      console.warn("[crowdsource] page index load failed",error);
      return [];
    }
  }

  async function loadCoordinateData(){
    try{
      const response=await fetch(modelShardUrl(),{cache:"no-store"});
      if(!response.ok) throw new Error(String(response.status));
      const rows=await response.json();
      const filtered=(Array.isArray(rows)?rows:[]).filter(row=>{
        const virtualId=val(row.virtual_id);
        const workId=val(row.work_id).padStart(3,"0");
        return virtualId?virtualId===EFFECTIVE_ID:workId===PARENT_ID;
      });
      const groups=new Map();
      filtered.forEach((row,index)=>{
        const pageNo=num(row.canvas_index||row.page);
        if(!groups.has(pageNo)) groups.set(pageNo,[]);
        groups.get(pageNo).push({
          ...row,
          glyph_id:val(row.glyph_id)||`${EFFECTIVE_ID}_${pageNo}_${index+1}`,
          text:val(row.char||row.text).slice(0,1),
          x:num(row.x),y:num(row.y),w:num(row.w),h:num(row.h),
          canvas_width:num(row.canvas_width),canvas_height:num(row.canvas_height),
          order_in_page:num(row.order_in_page)||index+1
        });
      });
      groups.forEach(list=>list.sort((a,b)=>a.order_in_page-b.order_in_page));
      state.glyphsByPage=groups;
    }catch(error){
      console.warn("[crowdsource] coordinate load failed",error);
      state.glyphsByPage=new Map();
    }
  }

  function pageCanvasIndex(page,index){return num(page.canvas_index||page.page)||index+1;}
  function pageGlyphs(index=state.pageIndex){
    const page=state.pages[index]||{};
    return state.glyphsByPage.get(pageCanvasIndex(page,index))||[];
  }
  function lineOf(row){return Number.isFinite(Number(row.auto_row))?Number(row.auto_row)+1:"—";}
  function columnOf(row){return Number.isFinite(Number(row.auto_col))?Number(row.auto_col)+1:"—";}
  function glyphKey(row,pageIndex){return val(row.glyph_id)||`${EFFECTIVE_ID}_${pageIndex}_${row.order_in_page}`;}
  function currentWorkTitle(){return clean(qs(".side .work-name")?.textContent)||clean(qs(".info-panel h1")?.textContent)||`碑帖${PARENT_ID}`;}

  function crowdHintCopy(type){
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

  function staticLayout(){
    const section=document.getElementById("places");
    if(!section) return null;
    section.classList.add("crowdsource-section");
    section.dataset.crowdsourceReady="true";
    section.innerHTML=`
      <h2 class="section-title">${TITLE}</h2>
      <p class="crowd-intro">${INTRO}</p>
      <div class="crowd-shell">
        <div class="crowd-tabs" role="tablist" aria-label="众智释读类型">
          <button class="crowd-tab" data-tab="transcription" type="button">✎ 释文校订（针对单字）</button>
          <button class="crowd-tab" data-tab="punctuation" type="button">✎ 标点校订（针对句子）</button>
          <button class="crowd-tab" data-tab="missingText" type="button">▣ 缺字补录与争议（针对补字/缺字）</button>
        </div>
        <section class="crowd-panel" data-panel="transcription"></section>
        <section class="crowd-panel" data-panel="punctuation" hidden></section>
        <section class="crowd-panel" data-panel="missingText" hidden></section>
      </div>
      <div class="crowd-dialog" role="dialog" aria-modal="true" aria-label="模拟提交内容">
        <div class="crowd-dialog-card"><h3></h3><pre></pre><div class="crowd-dialog-actions"><button class="crowd-btn" data-close-dialog type="button">关闭</button></div></div>
      </div>`;
    const fourthLink=document.querySelector(".side a:nth-of-type(4)");
    if(fourthLink) fourthLink.textContent=TITLE;
    qsa(".crowd-tab",section).forEach(button=>button.addEventListener("click",()=>switchTab(button.dataset.tab)));
    qs("[data-close-dialog]",section).addEventListener("click",()=>qs(".crowd-dialog",section).classList.remove("show"));
    qs(".crowd-dialog",section).addEventListener("click",event=>{if(event.target===event.currentTarget)event.currentTarget.classList.remove("show");});
    return section;
  }

  function switchTab(name){
    if(!["transcription","punctuation","missingText"].includes(name)) name="transcription";
    state.active=name;
    qsa(".crowd-tab",qs("#places")).forEach(button=>{
      const active=button.dataset.tab===name;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
    });
    qsa(".crowd-panel",qs("#places")).forEach(panel=>{panel.hidden=panel.dataset.panel!==name;});
    renderCrowdRailHint(name);
    touch(name);
  }

  function renderTranscriptionPanel(){
    const panel=qs('[data-panel="transcription"]');
    if(!panel) return;
    panel.innerHTML=`
      <div class="crowd-workspace">
        <section class="crowd-pane">
          <p class="crowd-pane-lead">点击左侧碑帖图片中的任意字，该字将被加入修改列表，可多选并一次提交。</p>
          <div class="crowd-image-toolbar">
            <button class="crowd-icon-btn" data-page-prev type="button">上一页</button>
            <select class="crowd-page-select" data-page-select aria-label="选择碑帖页码"></select>
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

  function bindTranscriptionControls(panel){
    qs("[data-page-prev]",panel).addEventListener("click",()=>changePage(state.pageIndex-1));
    qs("[data-page-next]",panel).addEventListener("click",()=>changePage(state.pageIndex+1));
    qs("[data-page-select]",panel).addEventListener("change",event=>changePage(Number(event.target.value)));
    qs("[data-clear-transcription]",panel).addEventListener("click",()=>{
      state.selected.clear();state.lastKey="";touch("transcription");renderTranscriptionItems();renderCurrentImage();
    });
    qs("[data-add-manual]",panel).addEventListener("click",()=>{
      const item={key:uid(),manual:true,pageNo:"",line:"",column:"",text:"",suggested:"",candidates:[],reason:"",reference:""};
      state.selected.set(item.key,item);state.lastKey=item.key;touch("transcription");renderTranscriptionItems();
    });
  }

  function renderPageControls(){
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
  }

  function changePage(index){
    if(!state.pages.length) return;
    state.pageIndex=Math.max(0,Math.min(state.pages.length-1,index));
    const select=qs("[data-page-select]");
    if(select) select.value=String(state.pageIndex);
    touch();
    renderCurrentImage();
  }

  function currentPageSelected(){
    return Array.from(state.selected.values()).filter(item=>!item.manual&&item.pageIndex===state.pageIndex);
  }

  function renderCurrentImage(){
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

  function toggleGlyph(row){
    const key=glyphKey(row,state.pageIndex);
    if(state.selected.has(key)){
      state.selected.delete(key);
      if(state.lastKey===key) state.lastKey="";
    }else{
      const item={
        key,manual:false,pageIndex:state.pageIndex,pageNo:state.pageIndex+1,
        canvasIndex:pageCanvasIndex(state.pages[state.pageIndex]||{},state.pageIndex),
        line:lineOf(row),column:columnOf(row),text:row.text||"",suggested:"",candidates:[],reason:"",reference:"",
        x:row.x,y:row.y,w:row.w,h:row.h,glyphId:row.glyph_id,order:row.order_in_page
      };
      state.selected.set(key,item);state.lastKey=key;
    }
    touch("transcription");
    renderTranscriptionItems();renderCurrentImage();
  }

  function updateCurrentSummary(){
    let item=state.lastKey?state.selected.get(state.lastKey):null;
    if(item&&item.manual) item=null;
    if(!item) item=currentPageSelected().at(-1)||null;
    const position=qs("[data-current-position]"),text=qs("[data-current-text]");
    if(position) position.textContent=item?`第${item.pageNo}页 第${item.line}行 第${item.column}列`:"尚未选择";
    if(text) text.textContent=item?item.text||"□":"—";
  }

  function field(labelText,control,required=false){
    const wrap=document.createElement("div");wrap.className="crowd-field";
    const label=document.createElement("label");label.textContent=labelText;
    if(required){const star=document.createElement("span");star.className="crowd-required";star.textContent=" *";label.appendChild(star);}
    wrap.append(label,control);return wrap;
  }
  function input(type="text",max=200){const node=document.createElement("input");node.className="crowd-input";node.type=type;node.maxLength=max;return node;}
  function textarea(max=1000){const node=document.createElement("textarea");node.className="crowd-textarea";node.maxLength=max;return node;}

  function renderTranscriptionItems(){
    const root=qs("[data-transcription-items]");
    if(!root) return;
    root.replaceChildren();
    const items=Array.from(state.selected.values());
    if(!items.length){
      const empty=document.createElement("div");empty.className="crowd-empty-list";empty.textContent="尚未选择修改字。请点击左侧拓片中的字，或手动新增一条意见。";root.appendChild(empty);updateSubmitState("transcription");return;
    }
    items.forEach((item,index)=>root.appendChild(buildTranscriptionCard(item,index)));
    updateCurrentSummary();updateSubmitState("transcription");
  }

  function buildTranscriptionCard(item,index){
    const card=document.createElement("article");card.className="crowd-item";
    const head=document.createElement("div");head.className="crowd-item-head";
    const badge=document.createElement("span");badge.className="crowd-item-index";badge.textContent=String(index+1);
    const meta=document.createElement("div");meta.className="crowd-item-meta";
    const remove=document.createElement("button");remove.className="crowd-remove";remove.type="button";remove.title="删除当前意见";remove.textContent="⌫";
    remove.addEventListener("click",()=>{state.selected.delete(item.key);if(state.lastKey===item.key)state.lastKey="";touch("transcription");renderTranscriptionItems();renderCurrentImage();});
    head.append(badge,meta,remove);card.appendChild(head);

    if(item.manual){
      meta.textContent="手动新增的位置与释文";
      const grid=document.createElement("div");grid.className="crowd-grid";
      const page=input("number",5);page.min="1";page.value=item.pageNo;page.addEventListener("input",()=>{item.pageNo=page.value;touch("transcription");});
      const line=input("number",5);line.min="1";line.value=item.line;line.addEventListener("input",()=>{item.line=line.value;touch("transcription");});
      const column=input("number",5);column.min="1";column.value=item.column;column.addEventListener("input",()=>{item.column=column.value;touch("transcription");});
      const current=input("text",30);current.value=item.text;current.addEventListener("input",()=>{item.text=current.value;touch("transcription");});
      grid.append(field("页码",page,true),field("行号",line,true),field("列号",column,true),field("当前释文",current,true));card.appendChild(grid);
    }else{
      const strong=document.createElement("strong");strong.textContent=`位置：第${item.pageNo}页 第${item.line}行 第${item.column}列`;
      const current=document.createElement("div");current.textContent=`当前释文：${item.text||"□"}`;meta.append(strong,current);
    }

    const suggested=input("text",80);suggested.value=item.suggested;suggested.placeholder="可输入一个字或连续多个字";suggested.addEventListener("input",()=>{item.suggested=suggested.value;touch("transcription");});
    card.appendChild(field("建议修改为",suggested,true));
    const reason=textarea(800);reason.value=item.reason;reason.placeholder="请说明字形、上下文或其他判断理由";reason.addEventListener("input",()=>{item.reason=reason.value;touch("transcription");});
    card.appendChild(field("修改理由",reason,true));
    const reference=textarea(500);reference.value=item.reference;reference.placeholder="拓本、论文、字形、上下文或其他依据";reference.addEventListener("input",()=>{item.reference=reference.value;touch();});
    card.appendChild(field("参考依据（可选）",reference));
    return card;
  }

  function renderSimplePanel(type){
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

  function renderSimpleItems(type){
    const root=qs(`[data-simple-list="${type}"]`);
    if(!root) return;
    root.replaceChildren();
    const list=type==="punctuation"?state.punctuation:state.missingText;
    list.forEach((item,index)=>root.appendChild(type==="punctuation"?buildPunctuationCard(item,index):buildMissingCard(item,index)));
    updateSubmitState(type);
  }

  function simpleHeader(title,onRemove){
    const head=document.createElement("div");head.className="crowd-simple-head";
    const strong=document.createElement("strong");strong.textContent=title;
    const remove=document.createElement("button");remove.className="crowd-remove";remove.type="button";remove.textContent="⌫";remove.title="删除当前意见";remove.addEventListener("click",onRemove);
    head.append(strong,remove);return head;
  }

  function bindValue(node,item,key,type,moduleType){
    node.value=item[key];
    node.addEventListener(type||"input",()=>{item[key]=node.value;touch(moduleType);});
    return node;
  }

  function buildPunctuationCard(item,index){
    const card=document.createElement("article");card.className="crowd-simple-card";
    card.appendChild(simpleHeader(`标点意见 ${index+1}`,()=>{state.punctuation.splice(index,1);if(!state.punctuation.length)state.punctuation.push(blankPunctuation());touch("punctuation");renderSimpleItems("punctuation");}));
    card.append(field("对应原文或句子",bindValue(textarea(800),item,"source","input","punctuation"),true));
    card.append(field("网站当前标点版本",bindValue(textarea(800),item,"current","input","punctuation"),true));
    card.append(field("建议标点版本",bindValue(textarea(800),item,"suggested","input","punctuation"),true));
    card.append(field("修改理由",bindValue(textarea(1000),item,"reason","input","punctuation"),true));
    card.append(field("参考依据（可选）",bindValue(textarea(600),item,"reference","input","punctuation")));
    return card;
  }

  function buildMissingCard(item,index){
    const card=document.createElement("article");card.className="crowd-simple-card";
    card.appendChild(simpleHeader(`缺字意见 ${index+1}`,()=>{state.missingText.splice(index,1);if(!state.missingText.length)state.missingText.push(blankMissing());touch("missingText");renderSimpleItems("missingText");}));
    const select=document.createElement("select");select.className="crowd-select";
    ["原碑缺字补录","对 AI 补字有异议","疑字辨识","连续缺文补录","其他"].forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;select.appendChild(option);});
    bindValue(select,item,"type","change","missingText");card.append(field("意见类型",select,true));
    card.append(field("对应位置或原句",bindValue(textarea(700),item,"position","input","missingText"),true));
    card.append(field("网站当前显示内容",bindValue(textarea(700),item,"current","input","missingText"),true));
    card.append(field("网站当前 AI 补字内容（可留空）",bindValue(textarea(500),item,"ai","input","missingText")));
    card.append(field("建议补录或修改内容",bindValue(textarea(700),item,"suggested","input","missingText"),true));
    card.append(field("判断理由",bindValue(textarea(1000),item,"reason","input","missingText"),true));
    card.append(field("参考依据（可选）",bindValue(textarea(600),item,"reference","input","missingText")));
    return card;
  }

  function buildSubmitCard(type,buttonText){
    const card=document.createElement("section");card.className="crowd-submit-card";card.dataset.submitCard=type;
    const title=document.createElement("h3");title.className="crowd-submit-title";title.textContent="提交信息";card.appendChild(title);
    const grid=document.createElement("div");grid.className="crowd-contact-grid";
    const contact=state.contacts[type];
    const email=input("email",160);email.name="email";email.placeholder="请输入您的邮箱";email.value=contact.email;email.addEventListener("input",()=>{contact.email=email.value;touch(type);});
    const name=input("text",80);name.placeholder="请输入姓名或昵称";name.value=contact.name;name.addEventListener("input",()=>{contact.name=name.value;touch();});
    const note=input("text",300);note.placeholder="如有其他说明，可在此填写";note.value=contact.note;note.addEventListener("input",()=>{contact.note=note.value;touch();});
    grid.append(field("联系邮箱",email,true),field("姓名或昵称（可选）",name),field("补充说明（可选）",note));card.appendChild(grid);
    const hp=input("text",120);hp.name="_gotcha";hp.tabIndex=-1;hp.autocomplete="off";hp.addEventListener("input",()=>{contact.gotcha=hp.value;updateSubmitState(type);});
    const hpWrap=document.createElement("div");hpWrap.className="crowd-honeypot";hpWrap.appendChild(hp);card.appendChild(hpWrap);
    const checks=document.createElement("div");checks.className="crowd-checks";
    checks.append(
      makeCheck("我已阅读说明，并理解提交内容将由管理员人工审核。",contact.agreeReview,value=>{contact.agreeReview=value;touch(type);}),
      makeCheck("我同意网站仅将所填邮箱用于本次意见的联系与核实。",contact.agreeEmail,value=>{contact.agreeEmail=value;touch(type);})
    );
    card.appendChild(checks);
    const row=document.createElement("div");row.className="crowd-submit-row";
    const status=document.createElement("div");status.className="crowd-status";status.dataset.status=type;
    const submit=document.createElement("button");submit.className="crowd-submit";submit.type="button";submit.dataset.submit=type;submit.textContent=buttonText;submit.disabled=true;submit.addEventListener("click",()=>submitForm(type));
    row.append(status,submit);card.appendChild(row);
    return card;
  }

  function makeCheck(text,checked,onChange){
    const label=document.createElement("label");label.className="crowd-check";
    const box=document.createElement("input");box.type="checkbox";box.checked=Boolean(checked);box.addEventListener("change",()=>onChange(box.checked));
    const span=document.createElement("span");span.textContent=text;label.append(box,span);return label;
  }

  function transcriptionValid(){
    const items=Array.from(state.selected.values());
    return items.length>0&&items.every(item=>clean(item.suggested)&&clean(item.reason)&&clean(item.text)&&clean(item.pageNo)&&clean(item.line)&&clean(item.column));
  }
  function punctuationValid(){return state.punctuation.length>0&&state.punctuation.every(item=>clean(item.source)&&clean(item.current)&&clean(item.suggested)&&clean(item.reason));}
  function missingValid(){return state.missingText.length>0&&state.missingText.every(item=>clean(item.type)&&clean(item.position)&&clean(item.current)&&clean(item.suggested)&&clean(item.reason));}
  function emailValid(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email));}
  function moduleValid(type){return type==="transcription"?transcriptionValid():type==="punctuation"?punctuationValid():missingValid();}

  function updateSubmitState(type){
    const button=qs(`[data-submit="${type}"]`);
    if(!button) return;
    const contact=state.contacts[type];
    button.disabled=Boolean(state.submitting[type])||!moduleValid(type)||!emailValid(contact.email)||!contact.agreeReview||!contact.agreeEmail||Boolean(clean(contact.gotcha));
  }

  function humanText(type){
    const title=currentWorkTitle(),contact=state.contacts[type];
    const lines=[`碑帖名称：${title}`,`作品编号：${EFFECTIVE_ID}`,`提交类型：${type==="transcription"?"释文校订":type==="punctuation"?"标点校订":"缺字补录与争议"}`,`提交邮箱：${clean(contact.email)}`,`姓名或昵称：${clean(contact.name)||"未填写"}`,`补充说明：${clean(contact.note)||"无"}`,""];
    if(type==="transcription"){
      Array.from(state.selected.values()).forEach((item,index)=>lines.push(`修改项${index+1}`,`页码：第${item.pageNo}页`,`位置：第${item.line}行第${item.column}列`,`当前释文：${item.text}`,`建议修改：${item.suggested}`,`修改理由：${item.reason}`,`参考依据：${clean(item.reference)||"无"}`,""));
    }else if(type==="punctuation"){
      state.punctuation.forEach((item,index)=>lines.push(`标点意见${index+1}`,`对应原文：${item.source}`,`网站当前标点：${item.current}`,`建议标点：${item.suggested}`,`修改理由：${item.reason}`,`参考依据：${clean(item.reference)||"无"}`,""));
    }else{
      state.missingText.forEach((item,index)=>lines.push(`缺字意见${index+1}`,`意见类型：${item.type}`,`对应位置或原句：${item.position}`,`网站当前显示：${item.current}`,`网站当前AI补字：${clean(item.ai)||"无"}`,`建议补录或修改：${item.suggested}`,`判断理由：${item.reason}`,`参考依据：${clean(item.reference)||"无"}`,""));
    }
    return lines.join("\n");
  }

  function jsonPayload(type){
    const items=type==="transcription"?Array.from(state.selected.values()):type==="punctuation"?state.punctuation:state.missingText;
    return {work:{id:EFFECTIVE_ID,parentId:PARENT_ID,title:currentWorkTitle(),url:location.href},type,contact:{...state.contacts[type],gotcha:undefined},items,submittedAt:new Date().toISOString()};
  }

  async function submitForm(type){
    const button=qs(`[data-submit="${type}"]`),status=qs(`[data-status="${type}"]`),contact=state.contacts[type];
    if(!button||button.disabled) return;
    if(clean(contact.gotcha)){status.textContent="提交被阻止。";status.className="crowd-status error";return;}
    state.submitting[type]=true;updateSubmitState(type);status.textContent="正在提交，请稍候……";status.className="crowd-status";
    const message=humanText(type),payload=jsonPayload(type),endpoint=(window.FORM_ENDPOINTS||{})[type]||"";
    try{
      if(!clean(endpoint)){
        console.group(`[众智释读模拟提交] ${type}`);console.log(message);console.log(payload);console.groupEnd();
        showDialog("模拟提交成功",message);status.textContent="当前为模拟提交模式，内容未发送，已在弹窗和控制台中显示。";status.className="crowd-status success";
      }else{
        const data=new FormData();
        data.append("email",clean(contact.email));data.append("name",clean(contact.name));data.append("notes",clean(contact.note));
        data.append("submission_type",type);data.append("work_title",currentWorkTitle());data.append("work_id",EFFECTIVE_ID);
        data.append("message",message);data.append("payload_json",JSON.stringify(payload));data.append("_gotcha","");
        const response=await fetch(endpoint,{method:"POST",body:data,headers:{Accept:"application/json"}});
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        status.textContent="提交成功，感谢您的校订意见。";status.className="crowd-status success";resetModule(type);
      }
    }catch(error){
      console.error("[crowdsource] submit failed",error);status.textContent="提交失败，请稍后重试或检查 Formspree 地址。";status.className="crowd-status error";
    }finally{
      state.submitting[type]=false;updateSubmitState(type);
    }
  }

  function showDialog(title,text){
    const dialog=qs(".crowd-dialog");
    if(!dialog) return;
    qs("h3",dialog).textContent=title;qs("pre",dialog).textContent=text;dialog.classList.add("show");
  }

  function resetModule(type){
    state.contacts[type]=blankContact();
    if(type==="transcription"){
      state.selected.clear();state.lastKey="";
      renderTranscriptionPanel();renderPageControls();
    }
    if(type==="punctuation"){
      state.punctuation=[blankPunctuation()];renderSimplePanel(type);
    }
    if(type==="missingText"){
      state.missingText=[blankMissing()];renderSimplePanel(type);
    }
    persistState();switchTab(type);
  }

  async function init(){
    restoreState();
    if(!staticLayout()) return;
    installCrowdRailHint();
    renderTranscriptionPanel();renderSimplePanel("punctuation");renderSimplePanel("missingText");
    switchTab(state.active);
    const [pageList]=await Promise.all([waitForReaderPages(),loadCoordinateData()]);
    state.pages=pageList;
    try{if(typeof currentPageIndex==="number"&&!sessionStorage.getItem(STORAGE_KEY))state.pageIndex=Math.max(0,Math.min(pageList.length-1,currentPageIndex));}catch(_){ }
    renderPageControls();persistState();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();