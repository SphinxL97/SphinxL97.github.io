/* 031-02《黄庭堅青原山诗刻石(第一辑)册二》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  if(raw!=="031-02"||window.__WORK_031_02_HUANGTINGJIAN__)return;
  window.__WORK_031_02_HUANGTINGJIAN__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="黄庭堅青原山诗刻石(第一辑)册二";
  const VERSION="20260727_huangtingjian_031_02_v1";
  const TEXT_URL=`data/work031_02_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work031_02_damage_cases.json?v=${VERSION}`;
  const PAGE_ROOT="assets/page_images/031_黄庭堅青原山诗刻石/images/02_黄庭堅青原山诗刻石(第一辑)册二";
  const PAGE_COUNT=60;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理《黄庭堅青原山诗刻石(第一辑)册二》8组残损文字校读。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    const locations=Array.isArray(row?.locations)?row.locations:[];
    return {...row,id,original,corrected,category:String(row?.category||row?.n||"残损碑文恢复"),n:"残损碑文恢复",t:String(row?.title||row?.t||`第${id}处`),o:original,c:corrected,title:String(row?.title||row?.t||`第${id}处`),mode:String(row?.mode||"unresolved"),confidence:String(row?.confidence||"暂无法判断"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:Number(row?.page||locations[0]?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文恢复"}));
    window.dispatchEvent(new CustomEvent("work-031-02-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").trim();
    return normalized.split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>`<p>${esc(part)}</p>`).join("");
  }
  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"",matches=[];
      patterns.forEach(pattern=>{let from=0;while(from<value.length){const at=value.indexOf(pattern,from);if(at<0)break;matches.push({start:at,end:at+pattern.length});from=at+pattern.length;}});
      if(!matches.length)return;
      matches.sort((a,b)=>a.start-b.start||b.end-a.end);
      const accepted=[];let right=-1;
      matches.forEach(item=>{if(item.start>=right){accepted.push(item);right=item.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(item=>{if(item.start>offset)fragment.appendChild(document.createTextNode(value.slice(offset,item.start)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(item.start,item.end);fragment.appendChild(strong);offset=item.end;});
      if(offset<value.length)fragment.appendChild(document.createTextNode(value.slice(offset)));
      paragraph.replaceChildren(fragment);
    });
  }
  function markedHTML(value){let html="",offset=0,match;const text=String(value||""),pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;offset=match.index+match[0].length;}return html+esc(text.slice(offset));}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  function cnPageLabel(n){const d=["","一","二","三","四","五","六","七","八","九"];if(n<=10)return n===10?"十":d[n];if(n<20)return"十"+d[n%10];if(n<100)return d[Math.floor(n/10)]+"十"+(n%10?d[n%10]:"");return String(n);}
  function pageImage(page){const p=Number(page||0);if(p<1||p>PAGE_COUNT)return"";return `${PAGE_ROOT}/${String(p).padStart(4,"0")}_${cnPageLabel(p)}.jpg`;}
  function makeLocation(item){
    const source=Array.isArray(item?.locations)?item.locations[0]:null,b=source?.bbox,page=Number(source?.page||item?.page||0);
    if(!source||!b||!page)return null;
    const canvas={w:Number(source?.canvas?.w||source?.canvas_width||0),h:Number(source?.canvas?.h||source?.canvas_height||0)};
    const target={x:Number(b.x??b[0]??0),y:Number(b.y??b[1]??0),w:Number(b.w??b[2]??0),h:Number(b.h??b[3]??0)};
    if(canvas.w<=0||canvas.h<=0||target.w<=0||target.h<=0)return null;
    const cropW=Math.min(canvas.w,Math.max(900,target.w+620)),cropH=Math.min(canvas.h,Math.max(1250,target.h+940));
    const crop={x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH};
    return {page,image:String(source.image||"")||pageImage(page),canvas,target,crop};
  }
  function locationHTML(item){
    const loc=makeLocation(item);
    if(!loc||!loc.image)return '<div class="damage-location-missing work031-location-missing"><p>暂未可靠定位</p></div>';
    return `<div class="damage-viewport" data-image="${esc(loc.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${loc.crop.x} ${loc.crop.y} ${loc.crop.w} ${loc.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(loc.image)}" x="0" y="0" width="${loc.canvas.w}" height="${loc.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${loc.target.x}" y="${loc.target.y}" width="${loc.target.w}" height="${loc.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${loc.page}页，本句第一个问题字局部</p>`;
  }
  function resultLabel(item){if(item.mode==="documentary")return"文献对校结果";if(item.mode==="mixed")return"部分恢复";if(item.mode==="ai_provisional")return"AI暂拟补全";return"暂未恢复";}
  function confidenceLabel(value){return["分项判断","暂无法判断"].includes(String(value||""))?String(value):`${value}置信度`;}
  function analysisHTML(item){const rows=item.analysis.length?item.analysis:["现有材料不足以形成具体候选。"];return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work031-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work031-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;}

  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-031-02] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");setMenuTitle(4,"四、众智释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work031Dedicated=raw;
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(confidenceLabel(item.confidence))}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    section.querySelector('[data-action="prev"]')?.addEventListener("click",()=>{if(current>0){current-=1;renderDamage();}});
    section.querySelector('[data-action="next"]')?.addEventListener("click",()=>{if(current<cases.length-1){current+=1;renderDamage();}});
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work-031-02-style"))return;const style=document.createElement("style");style.id="work-031-02-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work031-location-missing{min-height:430px;margin:0 16px 16px}.work031-analysis-list{margin:10px 0 0;padding-left:1.35em}.work031-analysis-list li{margin:.45em 0;line-height:1.8}.work031-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_031_02_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_031_02_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-031-02-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_031_02_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(cases.length!==8)throw new Error("031-02案例数据数量异常");
      publishCases(cases);await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_031_02_CONTENT_READY__=true;window.__WORK_031_02_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-031-02-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-031-02]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_031_02_CROWDSOURCE_READY__=true;window.__WORK_031_02_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
