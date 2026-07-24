/* 碑帖详情页补丁
   1. 读取 data/beitie_info_texts.json 并覆盖作品简介、收藏历史、背景故事。
   2. 45件碑帖统一读取 data/model_boxes 中的 model_border_refined 字框。
*/
(function(){
  const MODEL_VERSION = "20260711_model_border_v3";
  const rawId = String(new URLSearchParams(location.search).get("id") || "001");
  const parentId = (rawId.includes("-") ? rawId.split("-")[0] : rawId).padStart(3,"0");

  let modelShardPromise = null;
  let originalLoadPageGlyphBoxes = null;
  let modelOverrideInstalled = false;

  function modelShardUrl(id){
    const n = Number(String(id).slice(0,3));
    if(!Number.isFinite(n) || n < 1 || n > 45) return "";
    const start = Math.floor((n - 1) / 5) * 5 + 1;
    const end = Math.min(start + 4, 45);
    const a = String(start).padStart(3,"0");
    const b = String(end).padStart(3,"0");
    return `data/model_boxes/glyph_model_border_${a}_${b}.json?v=${MODEL_VERSION}`;
  }

  async function loadModelShard(){
    if(modelShardPromise) return modelShardPromise;
    const url = modelShardUrl(parentId);
    if(!url) return [];
    modelShardPromise = fetch(url,{cache:"no-store"})
      .then(res=>{
        if(!res.ok) throw new Error(`${url} ${res.status}`);
        return res.json();
      })
      .then(data=>Array.isArray(data)?data:[])
      .catch(err=>{
        console.warn("[model-boxes] shard load failed",err);
        return [];
      });
    return modelShardPromise;
  }

  function normalizeModelRows(rows,pageObj){
    return rows.map((r,i)=>({
      ...r,
      glyph_id:r.glyph_id || `${parentId}_p${pageObj.canvas_index}_m${i+1}`,
      char:String(r.char || r.text || "").slice(0,1),
      text:String(r.char || r.text || "").slice(0,1),
      order_in_page:+(r.order_in_page || i+1),
      canvas_index:+pageObj.canvas_index,
      canvas_label:pageObj.canvas_label || pageObj.label || pageObj.canvas_index,
      local_image:pageObj.image,
      canvas_width:+(r.canvas_width || pageObj.canvas_width || 0),
      canvas_height:+(r.canvas_height || pageObj.canvas_height || 0),
      x:+r.x,
      y:+r.y,
      w:+r.w,
      h:+r.h,
      source:"model_border_refined"
    }));
  }


  function installModelBoxOverride(){
    if(modelOverrideInstalled) return;
    if(typeof loadPageGlyphBoxes !== "function"){
      setTimeout(installModelBoxOverride,50);
      return;
    }

    originalLoadPageGlyphBoxes = loadPageGlyphBoxes;
    loadPageGlyphBoxes = async function(id,pageObj){
      const shard = await loadModelShard();
      const pageNo = +(pageObj.canvas_index ?? pageObj.page ?? 0);
      const effectiveId = (typeof EFFECTIVE_WORK_ID !== "undefined" && EFFECTIVE_WORK_ID)
        ? String(EFFECTIVE_WORK_ID)
        : (rawId.includes("-") ? rawId : parentId);
      const rows = shard.filter(r=>{
        const recordWorkId = String(r.work_id || "").padStart(3,"0");
        const recordVirtualId = String(r.virtual_id || "");
        const idMatches = recordVirtualId ? recordVirtualId === effectiveId : recordWorkId === parentId;
        return idMatches && +r.canvas_index === pageNo;
      });
      if(rows.length) return normalizeModelRows(rows,pageObj);
      return originalLoadPageGlyphBoxes(id,pageObj);
    };
    modelOverrideInstalled = true;

    /* 首屏可能已开始读取旧字框；统一数据就绪后主动重绘当前页。 */
    loadModelShard().then(data=>{
      if(!data.length) return;
      setTimeout(()=>{
        try{
          if(typeof loadPage === "function" && typeof currentPageIndex !== "undefined"){
            loadPage(currentPageIndex);
          }
        }catch(err){
          console.warn("[model-boxes] rerender failed",err);
        }
      },0);
    });
  }

  installModelBoxOverride();

  const INFO_URL = "data/beitie_info_texts.json?v=20260629_info";
  let infoCache = null;

  function workId(){
    return parentId;
  }

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }

  function isInfoLabel(line){
    const s = String(line || "").trim();
    const normalized = s.replace(/\s+/g, "");
    return /^(流传经历|题记|题跋|递藏|版本流传|收藏经过|背景说明|相关故事|故事)[:：]$/.test(normalized);
  }

  function textToHtml(s){
    const lines = String(s || "")
      .replace(/\r\n/g,"\n").replace(/\r/g,"\n")
      .split("\n")
      .map(x=>x.trim())
      .filter(Boolean);
    if(!lines.length) return "";
    return '<div class="beitie-info-text">' + lines.map(x=>{
      const cls = isInfoLabel(x) ? ' class="beitie-info-label"' : '';
      return `<p${cls}>${esc(x)}</p>`;
    }).join("") + '</div>';
  }

  function setText(selector,text){
    const el=document.querySelector(selector);
    if(el && text) el.textContent=text;
  }

  function updateMetaLine(label,value){
    if(!value) return;
    document.querySelectorAll(".meta-line").forEach(line=>{
      const b=line.querySelector("b"),span=line.querySelector("span");
      if(b && span && b.textContent.trim().includes(label)){
        span.textContent=value;
      }
    });
  }

  function applyBasic(info){
    if(!info) return;
    if(info.title){
      document.title=info.title+" · 碑帖智能读析平台";
      setText(".info-panel h1",info.title);
      setText(".side .work-name",info.title);
      setText(".cover-label",info.title);
    }
    if(info.summary) setText(".alias",info.summary);
    const b=info.basic || {};
    updateMetaLine("责任者",b["责任者"]);
    updateMetaLine("书体",b["书体"]);
    updateMetaLine("版本",b["版本"]);
    updateMetaLine("数量",b["数量"]);
    updateMetaLine("尺寸",b["尺寸"]);
    updateMetaLine("年代",b["年代"]);
    updateMetaLine("地点",b["地点"]);
    updateMetaLine("馆藏",b["馆藏"]);
    updateMetaLine("来源",b["来源"]);
  }

  function setModal(kind,title,subtitle,bodyText){
    const btn=document.querySelector(`[data-modal="${kind}"]`);
    const modal=document.getElementById(`modal-${kind}`);
    if(!btn || !modal) return;

    if(!bodyText){
      btn.style.display="none";
      return;
    }

    btn.style.display="";
    const strong=btn.querySelector("strong");
    const desc=btn.querySelector("span:last-child");
    if(strong) strong.textContent=title;
    if(desc) desc.textContent=subtitle;

    const titleEl=modal.querySelector(".modal-title");
    const subEl=modal.querySelector(".modal-subtitle");
    const body=modal.querySelector(".modal-body");
    if(titleEl) titleEl.textContent=title;
    if(subEl) subEl.textContent=subtitle;
    if(body) body.innerHTML=textToHtml(bodyText);
  }

  function ensureStyle(){
    if(document.getElementById("beitie-info-style")) return;
    const style=document.createElement("style");
    style.id="beitie-info-style";
    style.textContent=`
      .alias{display:none!important;}
      .work-hero{
        height:430px!important;
        align-items:stretch!important;
        grid-template-columns:minmax(210px,250px) minmax(0,1fr)!important;
      }
      .work-hero .cover-panel{
        height:430px!important;
        max-height:430px!important;
        min-height:0!important;
        align-self:stretch!important;
      }
      .work-hero .cover-panel img{
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:center top!important;
      }
      .work-hero .info-panel{
        height:430px!important;
        max-height:430px!important;
        min-height:0!important;
        align-self:stretch!important;
        display:grid!important;
        grid-template-rows:auto minmax(0,1fr)!important;
        row-gap:10px!important;
        overflow-y:auto!important;
        scrollbar-width:thin;
        padding:22px 26px!important;
      }
      .work-hero .info-panel h1{
        margin:0 0 8px!important;
        font-size:clamp(34px,3vw,44px)!important;
        line-height:1.08!important;
      }
      .work-hero .info-panel .meta-lines{
        display:grid!important;
        height:100%!important;
        min-height:0!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        column-gap:30px!important;
        row-gap:5px!important;
        grid-auto-rows:max-content!important;
        align-content:space-between!important;
        overflow-y:auto!important;
        overscroll-behavior:contain;
        padding-right:4px;
      }
      .work-hero .info-panel .meta-line{
        min-height:max-content!important;
        align-items:start!important;
        grid-template-columns:88px minmax(0,1fr)!important;
        line-height:1.42!important;
      }
      .work-hero .info-panel .meta-line b{
        line-height:1.42!important;
        font-size:15px!important;
        white-space:nowrap;
      }
      .work-hero .info-panel .meta-line span{
        min-width:0;
        font-size:15px!important;
        line-height:1.42!important;
        overflow-wrap:anywhere;
      }
      .work-hero .info-panel .meta-line.wide{
        grid-column:1/-1!important;
      }
      .work-hero .info-panel .meta-line.compact-note{
        font-size:15px!important;
        line-height:1.42!important;
      }
      .work-hero .info-panel .meta-line.compact-note span{
        font-size:15px!important;
        line-height:1.42!important;
      }
      .work-hero .info-panel .meta-lines::-webkit-scrollbar{width:6px;}
      .work-hero .info-panel .meta-lines::-webkit-scrollbar-thumb{
        background:rgba(159,48,37,.22);
        border-radius:999px;
      }
      .work-hero .info-panel .meta-lines::-webkit-scrollbar-track{background:transparent;}
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
        .work-hero{height:auto!important;align-items:start!important;grid-template-columns:1fr!important;}
        .work-hero .cover-panel{height:360px!important;max-height:360px!important;align-self:start!important;}
        .work-hero .info-panel{height:auto!important;max-height:none!important;align-self:start!important;display:block!important;overflow:visible!important;}
        .work-hero .info-panel .meta-lines{height:auto!important;grid-template-columns:1fr!important;grid-auto-rows:max-content!important;align-content:start!important;overflow:visible!important;padding-right:0;}
        .work-hero .info-panel .meta-line.wide{grid-column:1!important;}
      }
      @media(max-width:640px){
        .work-hero .cover-panel{height:300px!important;max-height:300px!important;}
        .work-hero .info-panel{padding:20px!important;}
        .work-hero .info-panel h1{font-size:32px!important;}
        .work-hero .info-panel .meta-line{grid-template-columns:80px minmax(0,1fr)!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function updateSourceNote(){
    const sourceParagraph=document.querySelector("#sources p");
    if(!sourceParagraph) return;
    sourceParagraph.innerHTML="本作品的单字定位读取统一的深度学习模型最终边框坐标数据。";
  }

  function applyInfo(info){
    ensureStyle();
    applyBasic(info);
    updateSourceNote();
    setModal("history","收藏历史","流传经历与题记。",info.history || "");
    setModal("story","背景故事","作品背景、版本线索与重要考据点。",info.story || "");
  }

  async function loadAndApply(){
    try{
      if(!infoCache){
        const res=await fetch(INFO_URL,{cache:"no-store"});
        if(!res.ok) return;
        infoCache=await res.json();
      }
      const info=infoCache && infoCache.items && infoCache.items[workId()];
      if(!info){
        updateSourceNote();
        return;
      }
      applyInfo(info);

      /* detail.html 会异步写入旧模板，短时间内重复覆盖。 */
      let n=0;
      const timer=setInterval(()=>{
        applyInfo(info);
        n+=1;
        if(n>=12) clearInterval(timer);
      },350);
    }catch(e){
      console.warn("[beitie-info] failed",e);
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",loadAndApply);
  }else{
    loadAndApply();
  }
})();

/* 当前页信息栏：顶部固定显示页码与选中字信息，底部显示可手动横向滚动的本页连续释文。 */
(function(){
  let loadPageWrapped=false;
  let originalLoadPageForStatus=null;
  let refreshTimer=0;
  let readerInfoObserver=null;
  let observerPaused=false;

  function escapeText(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }

  function ensurePageStatusStyle(){
    if(document.getElementById("page-transcript-status-style")) return;
    const style=document.createElement("style");
    style.id="page-transcript-status-style";
    style.textContent=`
      .reader-status.page-selection-status{
        width:min(620px,100%);
        max-width:620px;
        min-height:52px;
        margin:0 auto 12px;
        padding:0;
        display:grid;
        grid-template-columns:42% 58%;
        align-items:stretch;
        overflow:hidden;
        border:1px solid #ead7b7;
        border-radius:999px;
        background:#fff8e8;
        color:#74685c;
        font-size:16px;
        line-height:1;
        text-align:center;
      }
      .page-status-page,
      .page-status-selected{
        min-width:0;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0 14px;
        white-space:nowrap;
        overflow:hidden;
      }
      .page-status-page{
        border-right:1px solid #d8bd86;
      }
      .page-status-selected{
        color:#5b3b24;
        text-overflow:ellipsis;
      }
      .page-status-selected strong{
        margin-right:.42em;
        color:#9f3025;
        font-family:"SimSun","Songti SC",serif;
        font-size:22px;
        line-height:1;
      }
      .reader-info.page-transcript-bottom{
        display:grid!important;
        grid-template-columns:112px minmax(0,1fr);
        align-items:stretch;
        width:calc(100% - 56px);
        max-width:1040px;
        min-height:54px;
        margin:12px auto 0;
        padding:0;
        overflow:hidden;
        border:1px solid #e6d2ab;
        border-radius:14px;
        background:#fff8e8;
        color:#5b3b24;
        line-height:1;
        text-align:center;
      }
      .page-transcript-bottom-label{
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0 14px;
        border-right:1px solid #d8bd86;
        color:#9f3025;
        font-family:"SimSun","Songti SC",serif;
        font-size:19px;
        font-weight:900;
        letter-spacing:.08em;
        white-space:nowrap;
      }
      .page-transcript-bottom-scroll{
        min-width:0;
        width:100%;
        overflow-x:auto;
        overflow-y:hidden;
        cursor:grab;
        scrollbar-width:thin;
        scrollbar-color:#d8bd86 transparent;
        overscroll-behavior-x:contain;
        touch-action:pan-x;
      }
      .page-transcript-bottom-scroll.dragging{
        cursor:grabbing;
        user-select:none;
      }
      .page-transcript-bottom-scroll::-webkit-scrollbar{height:5px;}
      .page-transcript-bottom-scroll::-webkit-scrollbar-track{background:transparent;}
      .page-transcript-bottom-scroll::-webkit-scrollbar-thumb{
        background:#d8bd86;
        border-radius:999px;
      }
      .page-transcript-bottom-inner{
        display:block;
        width:max-content;
        min-width:100%;
        padding:0 24px;
        white-space:nowrap;
        text-align:center;
        font-family:"SimSun","Songti SC",serif;
        font-size:19px;
        line-height:52px;
        color:#342820;
      }
      @media(max-width:760px){
        .reader-status.page-selection-status{
          width:100%;
          grid-template-columns:44% 56%;
          font-size:13px;
        }
        .page-status-page,.page-status-selected{padding:0 7px;}
        .page-status-selected strong{font-size:19px;}
        .reader-info.page-transcript-bottom{width:calc(100% - 16px);max-width:none;grid-template-columns:82px minmax(0,1fr);}
        .page-transcript-bottom-label{padding:0 8px;font-size:17px;}
        .page-transcript-bottom-inner{padding:0 14px;font-size:17px;}
      }
    `;
    document.head.appendChild(style);
  }

  function orderedGlyphs(){
    if(typeof currentGlyphs==="undefined" || !Array.isArray(currentGlyphs)) return [];
    return currentGlyphs
      .map((row,index)=>({row,index}))
      .sort((a,b)=>{
        const ao=Number(a.row && a.row.order_in_page);
        const bo=Number(b.row && b.row.order_in_page);
        const av=Number.isFinite(ao) && ao>0 ? ao : a.index+1;
        const bv=Number.isFinite(bo) && bo>0 ? bo : b.index+1;
        return av-bv || a.index-b.index;
      });
  }

  function getContinuousTranscript(){
    return orderedGlyphs()
      .map(item=>String((item.row && (item.row.char || item.row.text)) || "").slice(0,1))
      .filter(Boolean)
      .join("");
  }

  function getSelectedSummary(){
    if(typeof selectedGlyphId==="undefined" || selectedGlyphId==null){
      return {char:"",text:"点击单字查看定位"};
    }
    const items=orderedGlyphs();
    const hit=items.find(item=>String(item.row && item.row.glyph_id)===String(selectedGlyphId));
    if(!hit) return {char:"",text:"点击单字查看定位"};

    const row=hit.row || {};
    const ch=String(row.char || row.text || "").slice(0,1);
    const order=Number(row.order_in_page)>0 ? Number(row.order_in_page) : hit.index+1;
    const col=Number.isFinite(Number(row.auto_col)) ? Number(row.auto_col)+1 : "—";
    const line=Number.isFinite(Number(row.auto_row)) ? Number(row.auto_row)+1 : "—";
    return {char:ch,text:`第 ${order} 字；第 ${col} 列，第 ${line} 行`};
  }

  function bindManualScroll(scroller){
    if(!scroller || scroller.dataset.manualScrollBound==="1") return;
    scroller.dataset.manualScrollBound="1";

    scroller.addEventListener("wheel",event=>{
      if(scroller.scrollWidth<=scroller.clientWidth) return;
      const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if(!delta) return;
      event.preventDefault();
      scroller.scrollLeft+=delta;
    },{passive:false});

    let dragging=false;
    let startX=0;
    let startLeft=0;

    scroller.addEventListener("pointerdown",event=>{
      if(event.pointerType!=="mouse" || event.button!==0 || scroller.scrollWidth<=scroller.clientWidth) return;
      dragging=true;
      startX=event.clientX;
      startLeft=scroller.scrollLeft;
      scroller.classList.add("dragging");
      scroller.setPointerCapture(event.pointerId);
    });

    scroller.addEventListener("pointermove",event=>{
      if(!dragging) return;
      scroller.scrollLeft=startLeft-(event.clientX-startX);
    });

    function stopDrag(event){
      if(!dragging) return;
      dragging=false;
      scroller.classList.remove("dragging");
      try{scroller.releasePointerCapture(event.pointerId);}catch(_){ }
    }

    scroller.addEventListener("pointerup",stopDrag);
    scroller.addEventListener("pointercancel",stopDrag);
  }

  function renderPageStatus(){
    const status=document.getElementById("readerStatus");
    const info=document.getElementById("readerInfo");
    if(!status || !info || typeof pages==="undefined" || !Array.isArray(pages) || !pages.length) return;

    const pageNumber=(typeof currentPageIndex==="number" ? currentPageIndex : 0)+1;
    const totalPages=pages.length;
    const selected=getSelectedSummary();
    const transcript=getContinuousTranscript() || "本页暂无可显示释文";

    status.classList.remove("page-transcript-status");
    status.classList.add("page-selection-status");
    status.innerHTML=`
      <span class="page-status-page">当前第 ${pageNumber} 页，共 ${totalPages} 页</span>
      <span class="page-status-selected" title="${escapeText(selected.char ? selected.char+selected.text : selected.text)}">${selected.char ? `<strong>${escapeText(selected.char)}</strong>` : ""}<span>${escapeText(selected.text)}</span></span>
    `;

    observerPaused=true;
    if(readerInfoObserver) readerInfoObserver.disconnect();
    info.classList.add("page-transcript-bottom");
    info.innerHTML=`
      <span class="page-transcript-bottom-label">本页释文</span>
      <span class="page-transcript-bottom-scroll" title="可使用滚轮、鼠标拖动或触摸左右滑动查看完整本页释文" aria-label="本页连续释文，可横向滚动">
        <span class="page-transcript-bottom-inner">${escapeText(transcript)}</span>
      </span>
    `;
    const scroller=info.querySelector(".page-transcript-bottom-scroll");
    if(scroller){
      scroller.scrollLeft=0;
      bindManualScroll(scroller);
    }
    if(readerInfoObserver) readerInfoObserver.observe(info,{childList:true,subtree:true,characterData:true,attributes:true});
    observerPaused=false;
  }

  function scheduleStatusRefresh(delay=20){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>requestAnimationFrame(renderPageStatus),delay);
  }

  function installPageStatus(){
    ensurePageStatusStyle();
    const info=document.getElementById("readerInfo");
    if(info && !readerInfoObserver){
      readerInfoObserver=new MutationObserver(()=>{
        if(!observerPaused) scheduleStatusRefresh(0);
      });
      readerInfoObserver.observe(info,{childList:true,subtree:true,characterData:true,attributes:true});
    }

    if(!loadPageWrapped){
      if(typeof loadPage!=="function"){
        setTimeout(installPageStatus,50);
        return;
      }
      originalLoadPageForStatus=loadPage;
      loadPage=async function(...args){
        const result=await originalLoadPageForStatus.apply(this,args);
        scheduleStatusRefresh();
        return result;
      };
      loadPageWrapped=true;
    }

    document.addEventListener("click",()=>scheduleStatusRefresh(0));
    document.addEventListener("keydown",()=>scheduleStatusRefresh(0));
    [0,120,350,700].forEach(delay=>setTimeout(renderPageStatus,delay));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",installPageStatus);
  }else{
    installPageStatus();
  }
})();


/* 全部碑帖页面统一目录文字；仅改显示名称，不改链接与栏目内容。 */
(function(){
  const labels=[
    "一、碑帖浏览",
    "二、碑文释文",
    "三、残缺字迹展示",
    "四、众智释读",
    "五、书法艺术赏析"
  ];

  function applyReaderTocLabels(){
    document.querySelectorAll(".side a").forEach((link,index)=>{
      if(labels[index]) link.textContent=labels[index];
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",applyReaderTocLabels);
  }else{
    applyReaderTocLabels();
  }
})();


/* 全部碑帖页面统一栏目标题；仅改标题文字，不改栏目内容。 */
(function(){
  const headingMap={
    reader:"一、碑帖浏览",
    calligraphy:"二、碑文释文",
    people:"三、残缺字迹展示",
    places:"四、众智释读",
    sources:"五、书法艺术赏析"
  };

  function applySectionHeadings(){
    Object.entries(headingMap).forEach(([id,title])=>{
      const heading=document.querySelector(`#${id} > .section-title`);
      if(heading) heading.textContent=title;
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",applySectionHeadings);
  }else{
    applySectionHeadings();
  }
})();
