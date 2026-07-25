/* 029《鲜于光祖墓志》栏目二、三加载修复：独立读取、备用源与精确错误提示。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="029"||window.__WORK_029_LOADING_HOTFIX_V2__)return;
  window.__WORK_029_LOADING_HOTFIX_V2__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;
  document.documentElement.classList.add("work029-no-location-map");

  const TITLE="鲜于光祖墓志";
  const VERSION="20260725_xianyu029_loading_fix_v2";
  const TEXT_PATH="data/work029_full_text.txt";
  const CASE_PATH="data/work029_damage_cases.json";
  const IMAGE_ROOT="assets/page_images/029_鲜于光祖墓志/images";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。正文以用户提供底稿为唯一依据，保留原字、异体字和全部20个残损方框；栏目三的补字不会反写入本栏。";
  const INTRO="栏目三整理周砥所撰主志文中的16处残损。每处均给出一个候选字：2例为文献对校，14例为AI暂拟；恢复结果与当前上下文不保留方框。盛彪合葬缘故后记中的4个方框作为独立后记原样保留，不纳入本栏案例。";
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const digits=["零","一","二","三","四","五","六","七","八","九"];
  const diagnostics={};
  let cases=[],current=0,expanded=false;

  function cn(n){if(n<10)return digits[n];if(n===10)return"十";if(n<20)return`十${digits[n%10]}`;if(n<100)return`${digits[Math.floor(n/10)]}十${n%10?digits[n%10]:""}`;return String(n);}
  function directImage(page){const n=Number(page||0);return n?`${IMAGE_ROOT}/${String(n).padStart(4,"0")}_${cn(n)}.jpg`:"";}
  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  function removeLocationMap(){Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,.card-title,.map-title")).filter(node=>(node.textContent||"").trim()==="地点地图").forEach(node=>{const card=node.closest("aside,section,.location-card,.map-card,.place-card,.detail-map-card")||node.parentElement;if(card&&!card.classList.contains("side")&&card.id!=="places")card.remove();});}

  function resourceCandidates(path){
    const local=new URL(`${path}?v=${VERSION}`,document.baseURI).href;
    const root=new URL(`/${path}?v=${VERSION}`,location.origin).href;
    const cdn=`https://cdn.jsdelivr.net/gh/SphinxL97/SphinxL97.github.io@main/${path}?v=${VERSION}`;
    const rawGithub=`https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/main/${path}?v=${VERSION}`;
    return [...new Set([local,root,cdn,rawGithub])];
  }
  async function fetchResource(path,type){
    const attempts=[];
    for(const url of resourceCandidates(path)){
      try{
        const response=await fetch(url,{cache:"no-store",mode:"cors",credentials:"omit"});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const text=await response.text();
        if(!text.trim())throw new Error("返回内容为空");
        diagnostics[path]={url,status:response.status};
        if(type==="json")return JSON.parse(text);
        return text;
      }catch(error){
        attempts.push(`${url} → ${error?.message||error}`);
        console.warn("[work-029-loading] 资源读取失败，继续尝试备用源",url,error);
      }
    }
    diagnostics[path]={error:attempts};
    throw new Error(`${path} 全部读取源失败；${attempts.join("；")}`);
  }

  function markCases(text){
    let parts=[{text:String(text||""),mark:false}];
    cases.forEach(item=>{
      const needle=item.original;if(!needle)return;
      const next=[];
      parts.forEach(part=>{
        if(part.mark||!part.text.includes(needle)){next.push(part);return;}
        let rest=part.text,index;
        while((index=rest.indexOf(needle))>=0){if(index)next.push({text:rest.slice(0,index),mark:false});next.push({text:needle,mark:true});rest=rest.slice(index+needle.length);}
        if(rest)next.push({text:rest,mark:false});
      });
      parts=next;
    });
    return parts.map(part=>part.mark?`<strong class="work029-case-text">${esc(part.text)}</strong>`:esc(part.text)).join("");
  }
  function paragraphHTML(text){
    return String(text||"").replaceAll("\r\n","\n").replaceAll("\r","\n").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map((part,index)=>{
      const postscript=part.startsWith("□自太常公既志鮮于府君");
      const heading=postscript?'<h4 class="work029-part-title">附：合葬缘故（盛彪后记）</h4>':"";
      if(index===0){const lines=part.split("\n").filter(Boolean);return `${lines[0]?`<h4 class="work029-original-title">${markCases(lines[0])}</h4>`:""}${lines.slice(1).map(line=>`<p class="work029-byline">${markCases(line)}</p>`).join("")}`;}
      return `${heading}<p>${markCases(part)}</p>`;
    }).join("");
  }
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(3,"0"),title=String(row?.title||row?.t||`第${id}处残损`),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),locations=Array.isArray(row?.locations)?row.locations:[];
    return {...row,id,title,original,corrected,category:String(row?.category||"AI暂拟"),n:"残损碑文恢复",t:title,o:original,c:corrected,confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:row?.page||locations[0]?.page||"—"};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category}));
    window.dispatchEvent(new CustomEvent("work-029-cases-ready",{detail:{count:items.length}}));
  }
  function renderTranscript(text){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div></div>`;
  }
  function makeLocation(item){
    const source=item.locations?.[0],bbox=source?.bbox,page=Number(source?.page||item.page||0);if(!bbox||!page)return null;
    const canvas={w:Number(source.canvas?.w||1444),h:Number(source.canvas?.h||2214)};
    const target={x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)};if(target.w<=0||target.h<=0)return null;
    const cropW=Math.min(canvas.w,Math.max(760,target.w+560)),cropH=Math.min(canvas.h,Math.max(1080,target.h+820));
    return{page,image:String(source.image||directImage(page)),canvas,target,crop:{x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH},note:String(source.note||"")};
  }
  function imageHTML(item){
    const l=makeLocation(item);
    if(!l?.image)return'<div class="damage-location-missing"><p>现有真实模型坐标中暂未能把用户底稿的单个方框唯一对应到某一残损槽位。系统不会使用相邻无关字代替，也不会生成虚假红框。</p></div>';
    const note=l.note?`<p class="damage-coordinate-note">${esc(l.note)}</p>`:"";
    return`<div class="damage-viewport" data-image="${esc(l.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${l.crop.x} ${l.crop.y} ${l.crop.w} ${l.crop.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(l.image)}" x="0" y="0" width="${l.canvas.w}" height="${l.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${l.target.x}" y="${l.target.y}" width="${l.target.w}" height="${l.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${l.page}页，本句第一个问题槽位局部</p>${note}`;
  }
  function syncList(section){const list=section?.querySelector(".damage-list"),active=list?.querySelector(".damage-tab.active");if(!list||!active)return;const align=()=>{if(!list.isConnected||!active.isConnected)return;const lr=list.getBoundingClientRect(),ar=active.getBoundingClientRect(),delta=(ar.top+ar.height/2)-(lr.top+lr.height/2),max=Math.max(0,list.scrollHeight-list.clientHeight);list.scrollTop=Math.max(0,Math.min(max,list.scrollTop+delta));};requestAnimationFrame(()=>requestAnimationFrame(align));setTimeout(align,80);setTimeout(align,220);}
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;
    const item=cases[current];publishCases(cases);setMenuTitle(3,"三、碑文残损与AI释读");
    const tabs=cases.map((e,i)=>`<button class="damage-tab${i===current?" active":""}" data-case-index="${i}" type="button"><b>${esc(e.id)}</b><span class="name">${esc(e.category)}</span></button>`).join("");
    const analysis=item.analysis.map(line=>`<li>${esc(line)}</li>`).join("");
    section.className="content-card damage-ai";section.dataset.work029Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}”</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（用户底稿）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${esc(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${esc(item.current_context||item.corrected)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>参考依据：</strong>${esc(item.reference||"用户提供释文与原拓图像")}</p><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;
    syncList(section);
    section.querySelectorAll("[data-case-index]").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.action==="prev"&&current>0)current--;if(b.dataset.action==="next"&&current<cases.length-1)current++;if(b.dataset.action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",e=>{if(typeof window.openZoom==="function")window.openZoom(e.currentTarget.dataset.image);});
  }
  function ensureStyle(){
    if(document.getElementById("work029-xianyu-style"))return;
    const s=document.createElement("style");s.id="work029-xianyu-style";
    s.textContent=".work029-part-title{margin:30px 0 12px;padding-top:20px;border-top:1px solid #dfd1bd;color:#8b2e24;font-family:'SimSun',serif;font-size:22px}.work029-original-title{text-align:center;margin:4px 0 10px;color:#2b2118;font-family:'SimSun',serif;font-size:25px}.work029-byline{text-align:center!important;text-indent:0!important;color:#66584b}.work029-case-text{font-weight:800;background:linear-gradient(transparent 72%,rgba(159,48,37,.16) 72%)}.damage-text.damage-new{color:#9f3025}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-coordinate-note{margin:8px 0 0;color:#8b5d36;font-size:13px;line-height:1.6}.work029-load-error{padding:18px;border:1px solid #df9189;background:#fff0ed;color:#8e1f15;border-radius:12px;line-height:1.7;word-break:break-word}.work029-load-error button{margin-top:12px;border:1px solid #9f3025;background:#9f3025;color:#fff;border-radius:999px;padding:7px 16px;cursor:pointer}.work029-no-location-map .location-card,.work029-no-location-map .map-card,.work029-no-location-map #locationCard,.work029-no-location-map #locationMapCard,.work029-no-location-map .detail-map-card{display:none!important}";
    document.head.appendChild(s);
  }
  function renderLoadError(sectionId,title,error){
    const section=document.getElementById(sectionId);if(!section)return;
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">${title}</h2><div class="work029-load-error"><strong>本栏目读取失败。</strong><br>${esc(error?.message||error||"未知错误")}<br><button type="button" data-work029-retry>重新读取</button></div>`;
    section.querySelector("[data-work029-retry]")?.addEventListener("click",()=>location.reload());
  }
  function ensureCrowdsource(){
    const finish=()=>{window.__WORK_029_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-029-crowdsource-ready",{detail:{count:cases.length}}));};
    const css="assets/css/crowdsource-v9.css";
    if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>(l.getAttribute("href")||"").split("?")[0].endsWith(css))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${css}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){finish();return;}
    const path="assets/js/crowdsource-v9.js";
    if(!Array.from(document.scripts).some(s=>(s.getAttribute("src")||"").split("?")[0].endsWith(path))){const s=document.createElement("script");s.src=`${path}?v=${VERSION}`;s.async=false;s.addEventListener("load",finish,{once:true});s.addEventListener("error",finish,{once:true});document.head.appendChild(s);}else finish();
  }
  async function loadTranscript(){
    try{
      const text=await fetchResource(TEXT_PATH,"text");
      if(text.length<100)throw new Error(`释文长度异常：${text.length}`);
      renderTranscript(text);return true;
    }catch(error){console.error("[work-029] 栏目二读取失败",error);renderLoadError("calligraphy","二、碑文释文",error);return false;}
  }
  async function loadCases(){
    try{
      const rows=await fetchResource(CASE_PATH,"json");
      cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);
      if(cases.length!==16)throw new Error(`案例数量异常：${cases.length}，应为16`);
      if(cases.some(item=>item.corrected.includes("□")))throw new Error("栏目三恢复结果仍含方框");
      publishCases(cases);renderDamage();return true;
    }catch(error){console.error("[work-029] 栏目三读取失败",error);renderLoadError("people","三、碑文残损与AI释读",error);return false;}
  }
  async function init(){
    ensureStyle();removeLocationMap();setTimeout(removeLocationMap,120);setTimeout(removeLocationMap,700);
    const [transcriptReady,casesReady]=await Promise.all([loadTranscript(),loadCases()]);
    ensureCrowdsource();
    window.__WORK_029_CONTENT_READY__=transcriptReady||casesReady;
    window.__WORK_029_STABLE_READY__=true;
    window.__WORK_029_LOADING_DIAGNOSTICS__={version:VERSION,transcriptReady,casesReady,resources:diagnostics};
    window.dispatchEvent(new CustomEvent("work-029-stable-ready",{detail:{cases:cases.length,transcriptReady,casesReady}}));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
