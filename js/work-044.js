/* 044《崔敬邕墓誌》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="044"||window.__WORK_044_CUIJINGYONG__)return;
  window.__WORK_044_CUIJINGYONG__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="崔敬邕墓誌";
  const VERSION="20260726_cuijingyong_044_v1";
  const TEXT_URL=`data/work044_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work044_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理《崔敬邕墓誌》三处缺字校读。三处均已对应至原拓页码与问题字位置。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    return {...row,id,original,corrected,category:String(row?.category||"残损碑文恢复"),n:"残损碑文恢复",t:String(row?.title||`第${id}处`),o:original,c:corrected,title:String(row?.title||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文恢复"}));
    window.dispatchEvent(new CustomEvent("work-044-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").trim();
    return normalized.split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>`<p>${esc(part)}</p>`).join("");
  }
  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"";let best=null;
      patterns.some(pattern=>{const at=value.indexOf(pattern);if(at>=0){best={start:at,end:at+pattern.length};return true;}return false;});
      if(!best)return;
      const fragment=document.createDocumentFragment();
      if(best.start)fragment.appendChild(document.createTextNode(value.slice(0,best.start)));
      const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(best.start,best.end);fragment.appendChild(strong);
      if(best.end<value.length)fragment.appendChild(document.createTextNode(value.slice(best.end)));
      paragraph.replaceChildren(fragment);
    });
  }
  function markedHTML(value){let html="",offset=0,match;const text=String(value||""),pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;offset=match.index+match[0].length;}return html+esc(text.slice(offset));}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  function cnPageLabel(n){const d=["","一","二","三","四","五","六","七","八","九"];if(n<=10)return n===10?"十":d[n];if(n<20)return"十"+d[n%10];if(n<100)return d[Math.floor(n/10)]+"十"+(n%10?d[n%10]:"");return String(n);}

  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-044] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(item){
    const page=Number(item?.page||0);
    const loc=Array.isArray(item?.locations)?item.locations[0]:null;
    const b=loc?.bbox,crop=loc?.crop;
    if(!page||!b||!crop)return '<div class="damage-location-missing work044-location-missing"><p>本例暂未获得可靠页码与字框。</p></div>';
    const image=`assets/page_images/044_崔敬邕墓誌/images/${String(page).padStart(4,"0")}_${cnPageLabel(page)}.jpg`;
    const cw=Number(loc.canvas_width||1459),ch=Number(loc.canvas_height||2221);
    return `<div class="damage-viewport" data-image="${esc(image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(image)}" x="0" y="0" width="${cw}" height="${ch}" preserveAspectRatio="none"></image><rect class="damage-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${page}页，对应问题字局部</p>`;
  }
  function analysisHTML(item){
    const rows=item.analysis.length?item.analysis:["现有材料不足以形成具体候选。"]; 
    return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work044-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work044-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");setMenuTitle(4,"四、众智释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work044Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    section.querySelector('[data-action="prev"]')?.addEventListener("click",()=>{if(current>0){current-=1;renderDamage();}});
    section.querySelector('[data-action="next"]')?.addEventListener("click",()=>{if(current<cases.length-1){current+=1;renderDamage();}});
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work044-cuijingyong-style"))return;const style=document.createElement("style");style.id="work044-cuijingyong-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work044-location-missing{min-height:430px;margin:0 16px 16px}.work044-analysis-list{margin:10px 0 0;padding-left:1.35em}.work044-analysis-list li{margin:.45em 0;line-height:1.8}.work044-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="北魏熙平二年墓志，记述崔敬邕的世系、仕宦、营州政绩与身后追赠。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本信息"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("端方旧藏浓淡墨拓拼合本，数字图像52页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("人物生平"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("崔敬邕历任司徒府主簿、营州刺史等职。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">版本</div><div class="modal-desc">端方旧藏浓淡墨拓拼合初拓本。</div><div class="modal-term">装潢</div><div class="modal-desc">裱本二十三开，网站收录数字图像五十二页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>崔敬邕其人</h3><p>崔敬邕出自博陵安平崔氏，北魏时历任司徒府主簿、尚书都官郎中、营州刺史等职。墓志重点记述其参与义阳战事、治理营州及怀柔边族的经历。</p><p>他卒于熙平二年，身后追赠左将军、济州刺史，谥号为“贞”。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_044_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_044_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-044-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_044_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(cases.length!==3)throw new Error("044案例数据数量异常");
      publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_044_CONTENT_READY__=true;window.__WORK_044_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-044-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-044]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">044碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">044案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_044_CROWDSOURCE_READY__=true;window.__WORK_044_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
