/* 007《伊阙佛龛碑》栏目二、三、四专属模块。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_YIQUE__)return;
  window.__WORK_007_YIQUE__=true;

  /* 当前作品直接提供标准数据，不再加载旧字段转换、案例修补或恢复依据模块。 */
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="伊阙佛龛碑";
  const TEXT_URL="data/work007_full_text.txt?v=20260722_yique_final_v1";
  const CASE_URL="data/work007_damage_cases.json?v=20260722_yique_final_v1";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260722_yique_fix_v2";
  const RAW_BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const IMAGE_PREFIX="assets/page_images/007_伊阙佛龛碑/";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字提出校读意见。AI分析重点说明候选字与佛教术语、后妃典故、地名官名、对偶结构及上下文的关系；没有对应方框的外部文字不写入恢复结果。";

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));

  function remoteImage(value){
    const source=String(value||"").trim();
    if(!source||/^https?:\/\//i.test(source))return source;
    const relative=source.replace(/^\.\//,"").replace(/^\/+/,"");
    if(!relative.startsWith(IMAGE_PREFIX))return source;
    return RAW_BASE+relative.split("/").map(part=>encodeURIComponent(part)).join("/");
  }

  function patchReaderImages(attempt=0){
    let ready=false;
    try{
      if(typeof pages!=="undefined"&&Array.isArray(pages)&&pages.length){
        pages.forEach(page=>{
          if(page.image)page.image=remoteImage(page.image);
          (page.items||[]).forEach(item=>{
            if(item.local_image)item.local_image=remoteImage(item.local_image);
          });
        });
        const cover=document.getElementById("heroCover");
        if(cover&&pages[0]?.image)cover.src=pages[0].image;
        if(typeof loadPage==="function"){
          const index=typeof currentPageIndex==="number"?currentPageIndex:0;
          loadPage(index);
        }
        ready=true;
      }
    }catch(error){
      console.warn("[work-007] reader image patch",error);
    }
    if(!ready&&attempt<60)setTimeout(()=>patchReaderImages(attempt+1),80);
  }

  function setMenuTitle(index,title){
    const link=document.querySelector(`.side a:nth-of-type(${index})`);
    if(link)link.textContent=title;
  }

  async function fetchText(url){
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error(`${url} ${response.status}`);
    return response.text();
  }

  async function fetchJSON(url){
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0");
    const category=String(row?.category||row?.n||"残损碑文恢复");
    const title=String(row?.title||row?.t||`第${id}处缺字`);
    const original=String(row?.original||row?.o||"");
    const corrected=String(row?.corrected||row?.c||original);
    const locations=Array.isArray(row?.locations)?row.locations:[];
    return {
      ...row,id,n:category,t:title,o:original,c:corrected,
      category,title,original,corrected,
      mode:String(row?.mode||"unresolved"),
      confidence:String(row?.confidence||"暂无法判断"),
      analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],
      locations,
      page:row?.page||locations[0]?.page||"—"
    };
  }

  function syncCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({
      ...clone(item),
      id:item.id,n:item.category,t:item.title,o:item.original,c:item.corrected,
      category:item.category,title:item.title,original:item.original,corrected:item.corrected,
      analysis:[...(item.analysis||[])],locations:clone(item.locations||[]),page:item.page||"—"
    }));
    window.dispatchEvent(new CustomEvent("work-007-cases-ready",{detail:{count:items.length}}));
  }

  function paragraphHTML(text){
    return String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/)
      .map(part=>part.trim()).filter(Boolean).map(part=>`<p>${esc(part)}</p>`).join("");
  }

  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const text=paragraph.textContent||"",matches=[];
      patterns.forEach(pattern=>{
        let from=0;
        while(from<text.length){
          const at=text.indexOf(pattern,from);
          if(at<0)break;
          matches.push({start:at,end:at+pattern.length});
          from=at+pattern.length;
        }
      });
      if(!matches.length)return;
      matches.sort((a,b)=>a.start-b.start||b.end-a.end);
      const accepted=[];let end=-1;
      matches.forEach(item=>{
        if(item.start>=end){accepted.push(item);end=item.end;}
      });
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(item=>{
        if(item.start>offset)fragment.appendChild(document.createTextNode(text.slice(offset,item.start)));
        const strong=document.createElement("strong");
        strong.className="transcript-problem-sentence";
        strong.textContent=text.slice(item.start,item.end);
        fragment.appendChild(strong);
        offset=item.end;
      });
      if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
      paragraph.replaceChildren(fragment);
    });
  }

  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");
    if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const text=await fetchText(TEXT_URL);
      card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;
      boldProblemSentences(card,items);
    }catch(error){
      console.error("[work-007] transcript",error);
      card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';
    }
  }

  let pageImages=new Map();
  async function loadPageImages(){
    try{
      const data=await fetchJSON(PAGE_INDEX_URL);
      const list=Array.isArray(data?.works?.["007"]?.pages)?data.works["007"].pages:[];
      pageImages=new Map(list.map(page=>[Number(page.page),remoteImage(page.image)]));
    }catch(error){
      console.warn("[work-007] page images",error);
      pageImages=new Map();
    }
  }

  function makeLocation(item){
    const source=Array.isArray(item.locations)?item.locations[0]:null;
    const bbox=source?.bbox;
    const page=Number(source?.page||item.page||0);
    if(!bbox||!page)return null;
    const canvas={
      w:Number(source?.canvas?.w||source?.canvas_width||2943),
      h:Number(source?.canvas?.h||source?.canvas_height||4429)
    };
    const target={
      x:Number(bbox.x??bbox[0]??0),
      y:Number(bbox.y??bbox[1]??0),
      w:Number(bbox.w??bbox[2]??0),
      h:Number(bbox.h??bbox[3]??0)
    };
    if(target.w<=0||target.h<=0)return null;
    const cropW=Math.min(canvas.w,Math.max(900,target.w+620));
    const cropH=Math.min(canvas.h,Math.max(1250,target.h+940));
    const crop={
      x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),
      y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),
      w:cropW,h:cropH
    };
    return {page,image:pageImages.get(page)||remoteImage(source.image||""),canvas,target,crop};
  }

  let locationState="loading";
  function imageHTML(item){
    const location=makeLocation(item);
    if(location&&location.image){
      return `<div class="damage-viewport" data-image="${esc(location.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${location.crop.x} ${location.crop.y} ${location.crop.w} ${location.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(location.image)}" x="0" y="0" width="${location.canvas.w}" height="${location.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${location.target.x}" y="${location.target.y}" width="${location.target.w}" height="${location.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${location.page}页，本句第一个问题字局部</p>`;
    }
    if(locationState==="loading"){
      return '<div class="damage-location-missing damage-location-loading"><p>正在读取现有逐字坐标，并定位本句第一个问题字……</p></div>';
    }
    return '<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用第二个问题字或无关字形代替。</p></div>';
  }

  function markedHTML(value){
    const text=String(value||"");let html="",offset=0,match;
    const pattern=/〔([^〕]*)〕/g;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(offset,match.index));
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      offset=match.index+match[0].length;
    }
    return html+esc(text.slice(offset));
  }

  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  const resultLabel=item=>item.mode==="documentary"?"文献对校结果":item.mode==="mixed"?"部分恢复":item.mode==="unresolved"?"暂未恢复":"AI暂拟补全";
  const confidenceLabel=value=>["分项判断","暂无法判断"].includes(String(value||""))?String(value):`${value}置信度`;

  let cases=[],current=0,expanded=false,listScrollTop=0;

  function caseTabs(){
    return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");
  }

  function damagePanel(item){
    const analysis=(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(confidenceLabel(item.confidence))}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");
    if(!section||!cases.length)return;
    const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");
    syncCases(cases);
    section.className="content-card damage-ai";
    section.dataset.work007Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${damagePanel(item)}</div>`;
    const list=section.querySelector(".damage-list");
    if(list){
      list.scrollTop=listScrollTop;
      list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});
      requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));
    }
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{
      current=Number(button.dataset.caseIndex)||0;
      expanded=false;
      renderDamage();
    }));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{
      const action=button.dataset.action;
      if(action==="prev"&&current>0)current-=1;
      else if(action==="next"&&current<cases.length-1)current+=1;
      else if(action==="expand")expanded=!expanded;
      renderDamage();
    }));
    section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",event=>{
      if(typeof window.openZoom==="function")window.openZoom(event.currentTarget.dataset.image);
    });
  }

  function ensureStyle(){
    if(document.getElementById("work007-yique-style"))return;
    const style=document.createElement("style");
    style.id="work007-yique-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-location-loading{display:flex;align-items:center;justify-content:center;min-height:210px}";
    document.head.appendChild(style);
  }

  async function locateCasePositions(){
    const locate=window.WORK_007_COORDINATES?.locateCases;
    if(typeof locate!=="function"){
      locationState="error";
      renderDamage();
      return;
    }
    try{
      const located=await locate(cases);
      cases=(Array.isArray(located)?located:cases).map(normalizeCase);
      locationState="ready";
      syncCases(cases);
      renderDamage();
      window.dispatchEvent(new CustomEvent("work-007-locations-ready",{
        detail:{located:cases.filter(item=>item.locations?.length).length,total:cases.length}
      }));
    }catch(error){
      console.error("[work-007] case locations",error);
      locationState="error";
      renderDamage();
    }
  }

  async function init(){
    ensureStyle();
    patchReaderImages();
    const damage=document.getElementById("people");
    if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);
      cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);
      await loadPageImages();
      syncCases(cases);
      await renderTranscript(cases);
      renderDamage();

      /* 核心内容显示成功后立即完成路由；坐标定位在后台继续，不再让栏目四超时覆盖栏目三。 */
      window.__WORK_007_CONTENT_READY__=true;
      window.__WORK_007_STABLE_READY__=true;
      window.dispatchEvent(new CustomEvent("work-007-content-ready",{detail:{count:cases.length}}));
      window.dispatchEvent(new CustomEvent("work-007-stable-ready",{detail:{cases:cases.length}}));
      void locateCasePositions();
    }catch(error){
      console.error("[work-007]",error);
      window.__WORK_007_CONTENT_READY__=true;
      window.__WORK_007_STABLE_READY__=true;
      if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
