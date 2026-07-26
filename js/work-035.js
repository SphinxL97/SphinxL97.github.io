/* 035《武氏祠画像题字》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="035"||window.__WORK_035_WUSHICI__)return;
  window.__WORK_035_WUSHICI__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="武氏祠画像题字";
  const VERSION="20260726_wushici_035_v4";
  const TEXT_URL=`data/work035_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work035_damage_cases.json?v=${VERSION}`;
  const PAGE_INDEX_URL=`data/page_images_index.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理29组汉代画像题字与石阙铭校读，覆盖55个原始方框。公开资料能够对应时优先采用文献录文；资料不足或底稿发生大段错位时，仍给出完整AI推断候选，并在“AI分析依据”中逐项说明。候选字不反写栏目二原始底稿，字框只使用真实模型坐标。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,pageMap=new Map(),listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    return {...row,id,original,corrected,category:String(row?.category||"残损碑文恢复"),n:"残损碑文恢复",t:String(row?.title||`第${id}处`),o:original,c:corrected,title:String(row?.title||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文恢复"}));
    window.dispatchEvent(new CustomEvent("work-035-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").replace(/^武氏祠画像题字\s*\n+/,"").trim();
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
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-035] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(item){
    const page=Number(item.page||item.locations?.[0]?.page||0),meta=pageMap.get(page),image=meta?.image||"",loc=item.locations?.[0]||null;
    if(!image)return '<div class="damage-location-missing"><p>本例暂未获得可靠页码与真实字框，不显示推测性局部图。</p></div>';
    if(!loc?.bbox)return `<div class="work035-page-only"><img src="${esc(image)}" alt="第${page}页原拓"><p>第${page}页可核验，但本例尚无可靠的独立问题字框；不估算bbox。</p></div>`;
    const b=loc.bbox,cw=Number(loc.canvas_width||1524),ch=Number(loc.canvas_height||2250),left=b.x/cw*100,top=b.y/ch*100,width=b.w/cw*100,height=b.h/ch*100;
    return `<div class="work035-case-image"><div class="work035-image-stage"><img src="${esc(image)}" alt="第${page}页原拓"><span class="work035-real-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-hidden="true"></span></div><p class="damage-caption">《${TITLE}》第${page}页，对应问题字局部</p></div>`;
  }
  function analysisHTML(item){
    const rows=item.analysis.length?item.analysis:["本例为AI推断候选，需结合拓片字形继续复核。"];
    return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work035-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work035-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work035Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.action==="prev"&&current>0)current-=1;else if(button.dataset.action==="next"&&current<cases.length-1)current+=1;renderDamage();}));
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work035-wushici-style"))return;const style=document.createElement("style");style.id="work035-wushici-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work035-image-stage{position:relative;width:min(100%,560px);margin:auto}.work035-image-stage img,.work035-page-only img{width:100%;height:auto;display:block;border-radius:10px}.work035-real-box{position:absolute;border:3px solid #e23020;background:rgba(226,48,32,.12);box-shadow:0 0 0 2px rgba(255,255,255,.8)}.work035-case-image p,.work035-page-only p{margin:10px 0 0!important;text-indent:0!important;font-size:12px;color:#766657;text-align:center}.work035-page-only{padding:12px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:250px;padding:30px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a;text-align:center}.work035-analysis-list{margin:10px 0 0;padding-left:1.35em}.work035-analysis-list li{margin:.45em 0;line-height:1.8}.work035-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="东汉武氏祠画像石刻中的人物榜题、祥瑞题字、车骑官属题名与建和元年武氏石阙铭汇编。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("作品构成"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("画像榜题、祥瑞题字、车骑题名、清代题记及石阙铭，数字图像98页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("武氏祠画像"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("内容包括帝王、孝行、列女、刺客、祥瑞及车骑出行等多个图像单元。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">作品性质</div><div class="modal-desc">本册并非一篇连续碑文，而是武氏祠多组画像榜题、祥瑞题字、车骑题名、石阙铭和清代题记的汇编。</div><div class="modal-term">馆藏与图像</div><div class="modal-desc">上海图书馆藏拓本，网站收录数字化图像98页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>石刻中的图像叙事</h3><p>武氏祠画像以榜题标识人物与故事，将帝王谱系、孝行、列女、刺客、祥瑞和车骑出行组织在不同石面之上。</p><p>栏目二保留用户确认底稿中的原始方框；栏目三把文献对校和AI推断分别标明，并逐例说明判断过程。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_035_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_035_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-035-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_035_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const [rows,index]=await Promise.all([fetchJSON(CASE_URL),fetchJSON(PAGE_INDEX_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("035案例数据为空");
      const pages=index?.works?.["035"]?.pages||[];pageMap=new Map(pages.map(page=>[Number(page.page),page]));publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_035_CONTENT_READY__=true;window.__WORK_035_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-035-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-035]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">035碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">035案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_035_CROWDSOURCE_READY__=true;window.__WORK_035_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
