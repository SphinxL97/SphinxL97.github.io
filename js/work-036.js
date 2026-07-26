/* 036《瘗鹤铭》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="036"||window.__WORK_036_YIHEMING__)return;
  window.__WORK_036_YIHEMING__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="瘗鹤铭";
  const VERSION="20260726_yiheming_036_v1";
  const TEXT_URL=`data/work036_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work036_damage_cases.json?v=${VERSION}`;
  const PAGE_INDEX_URL=`data/page_images_index.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理13组《瘗鹤铭》水前本与附水后本残文校读，覆盖用户底稿全部23个方框。能够由历代录文确认时采用文献对校；底稿存在错序、粘连或方框不足时，按审核稿给出混合判断或AI暂拟，并在“AI分析依据”中逐项说明。栏目二保留用户确认原文，栏目三只使用真实模型坐标。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,pageMap=new Map(),listScrollTop=0,basisObserver=null,basisCleanupScheduled=false;
  function isLegacyBasis(node){
    if(!(node instanceof Element))return false;
    if(node.matches(".damage-basis-block,.damage-basis-card,[data-damage-basis]"))return true;
    if(!node.classList.contains("damage-block"))return false;
    return String(node.querySelector(":scope > .damage-label")?.textContent||"").trim()===["恢","复","依","据"].join("");
  }
  function removeLegacyBasis(root=document){
    const targets=new Set();
    if(root instanceof Element&&isLegacyBasis(root))targets.add(root);
    root.querySelectorAll?.(".damage-basis-block,.damage-basis-card,[data-damage-basis]").forEach(node=>targets.add(node));
    root.querySelectorAll?.(".damage-block").forEach(node=>{if(isLegacyBasis(node))targets.add(node);});
    targets.forEach(node=>node.remove());
  }
  function observeLegacyBasis(root){
    if(!(root instanceof Element))return;
    if(basisObserver)basisObserver.disconnect();
    basisObserver=new MutationObserver(()=>{
      if(basisCleanupScheduled)return;
      basisCleanupScheduled=true;
      queueMicrotask(()=>{basisCleanupScheduled=false;removeLegacyBasis(root);});
    });
    basisObserver.observe(root,{childList:true,subtree:true});
  }

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    return {...row,id,original,corrected,category:String(row?.category||"残损碑文恢复"),n:"残损碑文恢复",t:String(row?.title||`第${id}处`),o:original,c:corrected,title:String(row?.title||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文恢复"}));
    window.dispatchEvent(new CustomEvent("work-036-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").replace(/^瘗鹤铭\s*\n+/,"").trim();
    return normalized.split(/\n\s*\n/).map(part=>part.trim()).filter(part=>part&&!/^（[一二三四五六七八九十]+）/.test(part)).map(part=>`<p>${esc(part)}</p>`).join("");
  }
  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"",ranges=[];
      patterns.forEach(pattern=>{let from=0;while(from<value.length){const at=value.indexOf(pattern,from);if(at<0)break;ranges.push({start:at,end:at+pattern.length});from=at+pattern.length;}});
      if(!ranges.length)return;ranges.sort((a,b)=>a.start-b.start||b.end-a.end);
      const accepted=[];let right=-1;ranges.forEach(range=>{if(range.start>=right){accepted.push(range);right=range.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(range=>{if(range.start>offset)fragment.appendChild(document.createTextNode(value.slice(offset,range.start)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(range.start,range.end);fragment.appendChild(strong);offset=range.end;});
      if(offset<value.length)fragment.appendChild(document.createTextNode(value.slice(offset)));paragraph.replaceChildren(fragment);
    });
  }
  function markedHTML(value){let html="",offset=0,match;const text=String(value||""),pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;offset=match.index+match[0].length;}return html+esc(text.slice(offset));}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-036] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(item){
    const page=Number(item.page||item.locations?.[0]?.page||0),meta=pageMap.get(page),image=meta?.image||"",loc=item.locations?.[0]||null;
    if(!image)return '<div class="damage-location-missing"><p>本例暂未获得可靠页码与真实字框，不显示推测性局部图。</p></div>';
    if(!loc?.bbox)return `<div class="work036-page-only"><img src="${esc(image)}" alt="第${page}页原拓"><p>第${page}页可核验，但本例尚无可靠的独立问题字框；不估算bbox。</p></div>`;
    const b=loc.bbox,cw=Number(loc.canvas_width||1524),ch=Number(loc.canvas_height||2250),left=b.x/cw*100,top=b.y/ch*100,width=b.w/cw*100,height=b.h/ch*100;
    return `<div class="work036-case-image"><div class="work036-image-stage"><img src="${esc(image)}" alt="第${page}页原拓"><span class="work036-real-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-hidden="true"></span></div><p class="damage-caption">《${TITLE}》第${page}页，对应问题字局部</p></div>`;
  }
  function analysisHTML(item){
    const rows=item.analysis.length?item.analysis:["本例为AI推断候选，需结合拓片字形继续复核。"];
    return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work036-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work036-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work036Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.action==="prev"&&current>0)current-=1;else if(button.dataset.action==="next"&&current<cases.length-1)current+=1;renderDamage();}));
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();removeLegacyBasis(section);observeLegacyBasis(section);
  }
  function ensureStyle(){
    if(document.getElementById("work036-yiheming-style"))return;const style=document.createElement("style");style.id="work036-yiheming-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work036-image-stage{position:relative;width:min(100%,560px);margin:auto}.work036-image-stage img,.work036-page-only img{width:100%;height:auto;display:block;border-radius:10px}.work036-real-box{position:absolute;border:3px solid #e23020;background:rgba(226,48,32,.12);box-shadow:0 0 0 2px rgba(255,255,255,.8)}.work036-case-image p,.work036-page-only p{margin:10px 0 0!important;text-indent:0!important;font-size:12px;color:#766657;text-align:center}.work036-page-only{padding:12px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:250px;padding:30px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a;text-align:center}.work036-analysis-list{margin:10px 0 0;padding-left:1.35em}.work036-analysis-list li{margin:.45em 0;line-height:1.8}.work036-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="江苏镇江焦山西麓摩崖石刻，以葬鹤为题，现存水前、水后不同拓本形态。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本构成"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("水前小扑小纸拓本并附水后本，数字图像78页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("作者争议"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("石刻署“华阳真逸撰、上皇山樵书”，具体作者与书者历来存在不同说法。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">原刻地点</div><div class="modal-desc">江苏镇江焦山西麓崖壁。</div><div class="modal-term">版本形态</div><div class="modal-desc">本册为明水前小扑小纸拓本，并附水后本；网站收录数字图像78页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>葬鹤与摩崖</h3><p>《瘗鹤铭》以仙鹤死后埋葬为主题，文字散布于焦山崖石，因坠江、出水和拓制时期不同，形成水前本与水后本等版本差异。</p><p>栏目二保留用户确认的两段残文和全部方框；栏目三按审核稿逐例给出候选，并明确区分文献可确认、混合判断和AI推断。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_036_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_036_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-036-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_036_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const [rows,index]=await Promise.all([fetchJSON(CASE_URL),fetchJSON(PAGE_INDEX_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("036案例数据为空");
      const pages=index?.works?.["036"]?.pages||[];pageMap=new Map(pages.map(page=>[Number(page.page),page]));publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_036_CONTENT_READY__=true;window.__WORK_036_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-036-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-036]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">036碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">036案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_036_CROWDSOURCE_READY__=true;window.__WORK_036_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
