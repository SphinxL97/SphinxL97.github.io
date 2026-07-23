/* 018《中岳嵩高灵庙碑并额》栏目二、三、四专属模块。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="018"||window.__WORK_018_SONGGAO__)return;
  window.__WORK_018_SONGGAO__=true;

  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="中岳嵩高灵庙碑并额";
  const VERSION="20260724_songgao_v1";
  const TEXT_URL=`data/work018_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work018_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目为原释文中的每一个问题字提供候选结果。文献能够确认者标为文献对校；缺乏直接录文者，则结合北魏道教语汇、山岳祭祀、礼制术语和铭辞结构给出AI推测，并以置信度区分可靠程度。恢复结果与恢复后的上下文不再保留“□”。";
  const IMAGE_ROOT="assets/page_images/018_中岳嵩高灵庙碑并额/images";

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function chineseNumber(n){
    const digits=["零","一","二","三","四","五","六","七","八","九"];
    if(n<10)return digits[n];
    if(n===10)return "十";
    if(n<20)return `十${digits[n%10]}`;
    if(n<100)return `${digits[Math.floor(n/10)]}十${n%10?digits[n%10]:""}`;
    return String(n);
  }

  function directImage(page){
    const n=Number(page||0);
    if(!n)return "";
    return `${IMAGE_ROOT}/${String(n).padStart(4,"0")}_${chineseNumber(n)}.jpg`;
  }

  async function fetchText(url){
    let lastError=null;
    for(let attempt=1;attempt<=3;attempt+=1){
      try{
        const response=await fetch(url,{cache:attempt===1?"no-store":"reload"});
        if(!response.ok)throw new Error(`${url} ${response.status}`);
        return await response.text();
      }catch(error){
        lastError=error;
        if(attempt<3)await sleep(300*attempt);
      }
    }
    throw lastError;
  }

  async function fetchJSON(url){
    let lastError=null;
    for(let attempt=1;attempt<=3;attempt+=1){
      try{
        const response=await fetch(url,{cache:attempt===1?"no-store":"reload"});
        if(!response.ok)throw new Error(`${url} ${response.status}`);
        return await response.json();
      }catch(error){
        lastError=error;
        if(attempt<3)await sleep(300*attempt);
      }
    }
    throw lastError;
  }

  function setMenuTitle(index,title){
    const link=document.querySelector(`.side a:nth-of-type(${index})`);
    if(link)link.textContent=title;
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
      locations,page:row?.page||locations[0]?.page||"—"
    };
  }

  function syncCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({
      ...clone(item),
      id:item.id,n:item.category,t:item.title,o:item.original,c:item.corrected,
      category:item.category,title:item.title,original:item.original,corrected:item.corrected,
      analysis:[...(item.analysis||[])],locations:clone(item.locations||[]),page:item.page||"—"
    }));
    window.dispatchEvent(new CustomEvent("work-018-cases-ready",{detail:{count:items.length}}));
  }

  function paragraphHTML(text){
    return String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/)
      .map(part=>part.trim()).filter(Boolean).map(part=>/^(碑额|碑阳|碑阴)　/.test(part)?`<h4 class="work018-part-title">${esc(part)}</h4>`:`<p>${esc(part)}</p>`).join("");
  }

  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"";
      const found=[];
      patterns.forEach(pattern=>{
        const at=value.indexOf(pattern);
        if(at>=0)found.push({start:at,end:at+pattern.length});
      });
      if(!found.length)return;
      found.sort((a,b)=>a.start-b.start||b.end-a.end);
      const fragment=document.createDocumentFragment();
      let offset=0;
      found.forEach(item=>{
        if(item.start<offset)return;
        if(item.start>offset)fragment.appendChild(document.createTextNode(value.slice(offset,item.start)));
        const strong=document.createElement("strong");
        strong.className="transcript-problem-sentence";
        strong.textContent=value.slice(item.start,item.end);
        fragment.appendChild(strong);
        offset=item.end;
      });
      if(offset<value.length)fragment.appendChild(document.createTextNode(value.slice(offset)));
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
      console.error("[work-018] transcript",error);
      card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';
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
      x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),
      w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)
    };
    if(target.w<=0||target.h<=0)return null;
    const cropW=Math.min(canvas.w,Math.max(900,target.w+620));
    const cropH=Math.min(canvas.h,Math.max(1250,target.h+940));
    const crop={
      x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),
      y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),
      w:cropW,h:cropH
    };
    return {page,image:String(source?.image||directImage(page)),canvas,target,crop};
  }

  function imageHTML(item){
    const location=makeLocation(item);
    if(location&&location.image){
      return `<div class="damage-viewport" data-image="${esc(location.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${location.crop.x} ${location.crop.y} ${location.crop.w} ${location.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(location.image)}" x="0" y="0" width="${location.canvas.w}" height="${location.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${location.target.x}" y="${location.target.y}" width="${location.target.w}" height="${location.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${location.page}页，本句第一个问题字局部</p>`;
    }
    return '<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用第二个问题字或相邻无关字形代替。</p></div>';
  }

  function markedHTML(value){
    const text=String(value||"");
    let html="",offset=0,match;
    const pattern=/〔([^〕]*)〕/g;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(offset,match.index));
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      offset=match.index+match[0].length;
    }
    return html+esc(text.slice(offset));
  }

  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  const resultLabel=item=>item.mode==="documentary"?"文献对校结果":item.mode==="mixed"?"文献与AI综合补全":"AI推测补全";
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
    section.dataset.work018Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${damagePanel(item)}</div>`;

    const list=section.querySelector(".damage-list");
    if(list){
      list.scrollTop=listScrollTop;
      list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});
      requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));
    }

    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{
      current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();
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
    if(document.getElementById("work018-songgao-style"))return;
    const style=document.createElement("style");
    style.id="work018-songgao-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}";
    document.head.appendChild(style);
  }

  async function init(){
    ensureStyle();
    const damage=document.getElementById("people");
    if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);
      cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);
      syncCases(cases);
      await renderTranscript(cases);
      renderDamage();
      window.__WORK_018_CONTENT_READY__=true;
      window.__WORK_018_STABLE_READY__=true;
      window.dispatchEvent(new CustomEvent("work-018-content-ready",{detail:{count:cases.length}}));
      window.dispatchEvent(new CustomEvent("work-018-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){
      console.error("[work-018]",error);
      window.__WORK_018_CONTENT_READY__=true;
      window.__WORK_018_STABLE_READY__=true;
      if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
