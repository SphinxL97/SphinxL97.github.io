/* 027《旧拓魏志五种》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="027"||window.__WORK_027_WEI_FIVE__)return;
  window.__WORK_027_WEI_FIVE__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;
  document.documentElement.classList.add("work027-no-location-map");

  const TITLE="旧拓魏志五种";
  const VERSION="20260724_wei_five_v2";
  const TEXT_URL=`data/work027_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work027_damage_cases.json?v=${VERSION}`;
  const IMAGE_ROOT="assets/page_images/027_旧拓魏志五种/images";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。底稿中的缺字和疑难字仍按原状保留。";
  const INTRO="本册为五种魏代墓志合册。栏目三逐一检查底稿中的全部方框；现阶段证据不足的位置继续保留方框，不依据墓志套语强行补字。栏目三与栏目四读取同一份案例数据。";
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const digits=["零","一","二","三","四","五","六","七","八","九"];
  function cn(n){if(n<10)return digits[n];if(n===10)return"十";if(n<20)return`十${digits[n%10]}`;if(n<100)return`${digits[Math.floor(n/10)]}十${n%10?digits[n%10]:""}`;return String(n);}
  function directImage(page){const n=Number(page||0);return n?`${IMAGE_ROOT}/${String(n).padStart(4,"0")}_${cn(n)}.jpg`:"";}
  async function fetchText(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(`${url} ${r.status}`);return r.text();}
  async function fetchJSON(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(`${url} ${r.status}`);return r.json();}
  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  function removeLocationMap(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,.card-title,.map-title"));
    headings.filter(node=>(node.textContent||"").trim()==="地点地图").forEach(node=>{
      const card=node.closest("aside,section,.location-card,.map-card,.place-card,.detail-map-card")||node.parentElement;
      if(card&&!card.classList.contains("side")&&card.id!=="places")card.remove();
    });
  }
  function paragraphHTML(text){
    const parts=String(text||"").replaceAll("\r\n","\n").replaceAll("\r","\n").split("\n\n").map(p=>p.trim()).filter(Boolean);
    const titles=["魏故懷令李君墓誌銘。","魏故咸陽太守劉府君墓誌銘。","滄州刾□王僧墓誌銘。","魏故使持節侍中驃騎大将軍太保太尉公録尚書事","魏故勃海太守王府君墓誌銘。"];
    return parts.map(part=>{
      if(part.startsWith("魏渤海太守王偃墓，葬臨齊城東六里。"))return `<h4 class="work027-part-title">王偃墓志清光绪元年出土后跋</h4><p>${esc(part)}</p>`;
      const title=titles.find(value=>part.startsWith(value));
      if(!title)return `<p>${esc(part)}</p>`;
      if(title.endsWith("事")){
        const cut=part.indexOf("墓誌銘。")+4;
        const fullTitle=part.slice(0,cut),body=part.slice(cut);
        return `<h4 class="work027-part-title">${esc(fullTitle)}</h4>${body?`<p>${esc(body)}</p>`:""}`;
      }
      const body=part.slice(title.length);
      return `<h4 class="work027-part-title">${esc(title)}</h4>${body?`<p>${esc(body)}</p>`:""}`;
    }).join("");
  }
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),title=String(row?.title||row?.t||`第${id}处残损`),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),locations=Array.isArray(row?.locations)?row.locations:[];
    return {...row,id,title,original,corrected,category:String(row?.category||"暂未恢复"),n:"残损碑文恢复",t:title,o:original,c:corrected,confidence:String(row?.confidence||"暂无法判断"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:row?.page||locations[0]?.page||"—"};
  }
  function publishCases(items){window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category}));window.dispatchEvent(new CustomEvent("work-027-cases-ready",{detail:{count:items.length}}));}
  function boldProblems(root,items){
    const patterns=items.flatMap(item=>item.highlight_patterns?.length?item.highlight_patterns:[item.original]).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(p=>{const value=p.textContent||"";const ranges=[];patterns.forEach(pattern=>{const at=value.indexOf(pattern);if(at>=0)ranges.push({start:at,end:at+pattern.length});});if(!ranges.length)return;ranges.sort((a,b)=>a.start-b.start||b.end-a.end);const f=document.createDocumentFragment();let offset=0;ranges.forEach(r=>{if(r.start<offset)return;if(r.start>offset)f.appendChild(document.createTextNode(value.slice(offset,r.start)));const s=document.createElement("strong");s.className="transcript-problem-sentence";s.textContent=value.slice(r.start,r.end);f.appendChild(s);offset=r.end;});if(offset<value.length)f.appendChild(document.createTextNode(value.slice(offset)));p.replaceChildren(f);});
  }
  function renderTranscript(text,items){const section=document.getElementById("calligraphy");if(!section)return;setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div></div>`;boldProblems(section,items);}
  function makeLocation(item){const source=item.locations?.[0],bbox=source?.bbox,page=Number(source?.page||item.page||0);if(!bbox||!page)return null;const canvas={w:Number(source.canvas?.w||1474),h:Number(source.canvas?.h||2226)},target={x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)};if(target.w<=0||target.h<=0)return null;const cropW=Math.min(canvas.w,Math.max(900,target.w+620)),cropH=Math.min(canvas.h,Math.max(1250,target.h+940));return{page,image:String(source.image||directImage(page)),canvas,target,crop:{x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH}};}
  function imageHTML(item){const l=makeLocation(item);if(!l?.image)return'<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字，系统不会使用相邻完整字代替。</p></div>';return`<div class="damage-viewport" data-image="${esc(l.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${l.crop.x} ${l.crop.y} ${l.crop.w} ${l.crop.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(l.image)}" x="0" y="0" width="${l.canvas.w}" height="${l.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${l.target.x}" y="${l.target.y}" width="${l.target.w}" height="${l.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${l.page}页，本句第一个问题字局部</p>`;}
  let cases=[],current=0,expanded=false;
  function renderDamage(){const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];publishCases(cases);setMenuTitle(3,"三、碑文残损与AI释读");const tabs=cases.map((e,i)=>`<button class="damage-tab${i===current?" active":""}" data-case-index="${i}" type="button"><b>${esc(e.id)}</b><span class="name">${esc(e.category)}</span></button>`).join(""),analysis=item.analysis.map(line=>`<li>${esc(line)}</li>`).join("");section.className="content-card damage-ai";section.dataset.work027Dedicated="true";section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}”</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">暂未恢复</span><div class="damage-text damage-new">${esc(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${esc(item.corrected)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;section.querySelectorAll("[data-case-index]").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.caseIndex)||0;expanded=false;renderDamage();}));section.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.action==="prev"&&current>0)current--;if(b.dataset.action==="next"&&current<cases.length-1)current++;if(b.dataset.action==="expand")expanded=!expanded;renderDamage();}));section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",e=>{if(typeof window.openZoom==="function")window.openZoom(e.currentTarget.dataset.image);});}
  function ensureStyle(){if(document.getElementById("work027-wei-five-style"))return;const s=document.createElement("style");s.id="work027-wei-five-style";s.textContent=".work027-part-title{margin:26px 0 12px;color:#8b2e24;font-family:'SimSun',serif;font-size:22px}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.work027-no-location-map .location-card,.work027-no-location-map .map-card,.work027-no-location-map #locationCard,.work027-no-location-map #locationMapCard,.work027-no-location-map .detail-map-card{display:none!important}";document.head.appendChild(s);}
  function ensureCrowdsource(){const css="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>(l.getAttribute("href")||"").split("?")[0].endsWith(css))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${css}?v=${VERSION}`;document.head.appendChild(link);}if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_027_CROWDSOURCE_READY__=true;return;}const path="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(s=>(s.getAttribute("src")||"").split("?")[0].endsWith(path))){const s=document.createElement("script");s.src=`${path}?v=${VERSION}`;s.async=false;s.addEventListener("load",()=>{window.__WORK_027_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-027-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(s);}else window.__WORK_027_CROWDSOURCE_READY__=true;}
  async function init(){ensureStyle();removeLocationMap();setTimeout(removeLocationMap,120);setTimeout(removeLocationMap,700);try{const [text,rows]=await Promise.all([fetchText(TEXT_URL),fetchJSON(CASE_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("027案例数据为空");publishCases(cases);renderTranscript(text,cases);renderDamage();ensureCrowdsource();window.__WORK_027_CONTENT_READY__=true;window.__WORK_027_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-027-stable-ready",{detail:{cases:cases.length}}));}catch(error){console.error("[work-027]",error);const a=document.getElementById("calligraphy"),b=document.getElementById("people");if(a)a.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">027碑文数据读取失败，请刷新页面后重试。</div>';if(b)b.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">027专属内容读取失败，请刷新页面后重试。</div>';}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
