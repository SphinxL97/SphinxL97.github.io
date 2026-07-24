/* 碑帖详情页统一入口：稳定加载当前碑帖信息卡，并保留既有详情功能。 */
(function(){
  "use strict";
  if(window.__DETAIL_INFO_STABLE_ENTRY_V19__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V19__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V18__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V17__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V16__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V15__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V14__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V13__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V12__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V11__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V10__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V7__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V6__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V5__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V4__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V3__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V2__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V1__=true;
  document.documentElement.classList.add("detail-header-pending");

  if(!window.__DETAIL_REPEAT_INTERVAL_GUARD__){
    window.__DETAIL_REPEAT_INTERVAL_GUARD__=true;
    const nativeSetInterval=window.setInterval.bind(window);
    window.setInterval=function(callback,delay,...args){
      if(Number(delay)===350&&/applyInfo/.test(String(callback)))return 0;
      return nativeSetInterval(callback,delay,...args);
    };
  }

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  const coreUrl="js/detail_info_patch_core.js?v=20260724_uniform_font_header_v1";
  const dataUrl="data/beitie_header_info.json?v=20260724_guifeng_v2";

  function forceDedicatedRouter(){
    if(!["007","010","011","013","014","015","016","017","018","020","022","023"].includes(workId)||document.querySelector("script[data-dedicated-forced-router]"))return;
    document.querySelectorAll("script[src*='js/damage_ai_reading.js']").forEach(script=>script.remove());
    window.__DAMAGE_AI_READING_ROUTER_V42__=true;
    window.__DAMAGE_AI_READING_ROUTER_V47__=true;
    window.__DAMAGE_AI_READING_ROUTER_V48__=true;
    window.__DAMAGE_AI_READING_ROUTER_V49__=true;
    window.__DAMAGE_AI_READING_ROUTER_V50__=true;
    window.__DAMAGE_AI_READING_ROUTER_V51__=true;
    window.__DAMAGE_AI_READING_ROUTER_V52__=true;
    window.__DAMAGE_AI_READING_ROUTER_V53__=true;
    window.__DAMAGE_AI_READING_ROUTER_V54__=true;
    window.__DAMAGE_AI_READING_ROUTER_V55__=true;
    window.__DAMAGE_AI_READING_ROUTER_V56__=true;
    window.__DAMAGE_AI_READING_ROUTER_V57__=true;
    window.__DAMAGE_AI_READING_ROUTER_V58__=true;
    window.__DAMAGE_AI_READING_ROUTER_V59__=true;
    window.__DAMAGE_AI_READING_ROUTER_V60__=true;
    const script=document.createElement("script");
    script.src="js/damage_ai_reading.js?v=20260724_guifeng_v2";
    script.async=false;
    script.dataset.dedicatedForcedRouter=workId;
    script.addEventListener("error",()=>console.error(`[detail-patch] ${workId}当前路由加载失败`,script.src),{once:true});
    document.head.appendChild(script);
  }
  forceDedicatedRouter();

  function clean(value){return String(value==null?"":value).trim();}
  function first(...values){for(const value of values){const text=clean(value);if(text)return text;}return "";}
  function buildRows(record,title){
    const b=record?.basic||{},rows=[];
    const push=(label,value,{wide=false,compact=false}={})=>{const text=clean(value);if(text)rows.push({label,value:text,wide,compact});};
    const firstTitle=first(b["首题"]);if(firstTitle&&firstTitle!==title)push("首题",firstTitle,{wide:true});
    push("其他题名",b["其他题名"],{wide:true});
    push("额题",b["额题"]);
    push("责任者",b["责任者"]);push("书体",b["书体"]);
    push("版本",b["版本"]);push("影印版本",b["影印版本"]);
    push("数量",b["数量"]);push("铭文行款",b["铭文行款"]);
    push("尺寸",b["尺寸"]);push("年代",first(b["刻立年代"],b["年代"],b["时代"]));
    push("刻立地点",first(b["刻立地点"],b["地点"]));push("出土地点",b["出土地点"]);
    push("馆藏",b["馆藏"]);
    push("版本说明",b["版本说明"],{wide:true,compact:true});
    push("镌刻特征",b["镌刻特征"],{wide:true,compact:true});
    push("来源",b["来源"],{wide:true,compact:true});
    return rows;
  }
  function rowSignature(rows){return rows.map(item=>`${item.label}\u0001${item.value}\u0001${item.wide?1:0}\u0001${item.compact?1:0}`).join("\u0002");}
  function currentSignature(box){return Array.from(box.querySelectorAll(":scope > .meta-line")).map(line=>`${clean(line.querySelector("b")?.textContent)}\u0001${clean(line.querySelector("span")?.textContent)}\u0001${line.classList.contains("wide")?1:0}\u0001${line.classList.contains("compact-note")?1:0}`).join("\u0002");}

  let observer=null,rendering=false,pending=false,recordCache=null;
  function render(record){
    const box=document.querySelector(".info-panel .meta-lines");if(!box||!record)return;
    const title=clean(record.title||record.basic?.首题||document.querySelector(".info-panel h1")?.textContent||"碑帖详情");
    const rows=buildRows(record,title),signature=rowSignature(rows);
    rendering=true;if(observer)observer.disconnect();
    document.title=`${title} · 碑帖智能读析平台`;
    const titleNodes=[document.querySelector(".info-panel h1"),document.querySelector(".side .work-name"),document.querySelector(".cover-label")];titleNodes.forEach(node=>{if(node&&clean(node.textContent)!==title)node.textContent=title;});
    if(currentSignature(box)!==signature){const fragment=document.createDocumentFragment();rows.forEach(item=>{const line=document.createElement("div");line.className="meta-line";if(item.wide)line.classList.add("wide");if(item.compact)line.classList.add("compact-note");const term=document.createElement("b");term.textContent=item.label;const value=document.createElement("span");value.textContent=item.value;line.append(term,value);fragment.appendChild(line);});box.replaceChildren(fragment);}
    box.dataset.completeHeaderWork=workId;box.dataset.headerSignature=signature;rendering=false;observe();
    document.documentElement.classList.remove("beitie-header-pending","detail-header-pending");window.dispatchEvent(new CustomEvent("beitie-header-ready",{detail:{workId,title}}));
  }
  function observe(){
    const panel=document.querySelector(".work-hero");if(!panel||!recordCache)return;if(observer)observer.disconnect();observer=new MutationObserver(()=>{if(rendering||pending)return;pending=true;queueMicrotask(()=>{pending=false;render(recordCache);});});observer.observe(panel,{childList:true,subtree:true,characterData:true});
  }
  async function loadHeader(){
    document.documentElement.classList.add("beitie-header-pending");
    try{const response=await fetch(dataUrl,{cache:"no-store"});if(!response.ok)throw new Error(`${dataUrl} ${response.status}`);const data=await response.json();recordCache=data?.[workId]||null;if(recordCache)render(recordCache);else throw new Error(`missing header ${workId}`);}catch(error){console.error("[header-card] 当前碑帖信息卡加载失败",error);document.documentElement.classList.remove("beitie-header-pending","detail-header-pending");window.dispatchEvent(new CustomEvent("beitie-header-ready",{detail:{workId,error:true}}));}
  }

  try{
    const request=new XMLHttpRequest();request.open("GET",coreUrl,false);request.send(null);
    if((request.status>=200&&request.status<300)||request.status===0)(0,eval)(`${request.responseText}\n//# sourceURL=${coreUrl}`);
    else throw new Error(`${coreUrl} ${request.status}`);
  }catch(error){console.warn("[detail-patch] 同步加载原补丁失败，改用脚本回退",error);const script=document.createElement("script");script.src=coreUrl;script.async=false;script.addEventListener("error",()=>console.error("[detail-patch] 原补丁加载失败",coreUrl),{once:true});document.head.appendChild(script);}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadHeader,{once:true});else loadHeader();
})();
