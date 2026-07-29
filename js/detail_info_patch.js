/* 碑帖详情页统一入口：稳定加载当前碑帖信息卡，并保留既有详情功能。 */
(function(){
  "use strict";
  if(window.__DETAIL_INFO_STABLE_ENTRY_V45__)return;
  window.__DETAIL_INFO_STABLE_ENTRY_V45__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V44__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V43__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V42__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V41__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V40__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V39__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V38__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V37__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V36__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V35__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V34__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V33__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V32__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V31__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V30__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V29__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V28__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V27__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V26__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V25__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V24__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V23__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V22__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V21__=true;
  window.__DETAIL_INFO_STABLE_ENTRY_V20__=true;
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
  const coreUrl="js/detail_info_patch_core.js?v=20260727_column_one_policy_v5";
  const dataUrl="data/beitie_header_info.json?v=20260727_huangtingjian_031_v1";
  const work030DataUrl="data/work030_info.json?v=20260725_jiuchenggong_030_v1";
  const work032DataUrl="data/work032_info.json?v=20260725_xuzhenren_032_v1";
  const work033DataUrl="data/work033_info.json?v=20260725_zhengzuowei_033_v1";
  const recoveryVersion="20260729_fix006007_iiif_v1";
  const categoryUrl=`js/damage-category-standardizer.js?v=${recoveryVersion}`;
  const routerUrl=`js/damage_ai_reading.js?v=${recoveryVersion}`;
  const transcriptFormatUrl="js/transcript-format-normalizer.js?v=20260725_transcript_format_v2";
  const routedWorks=new Set(["001","002","003","004","005","006","007","010","011","013","014","015","016","017","018","020","022","023","024","025","026","027","028","029","030","031","032","033","034","035","036","043","044"]);

  function applyImmediateWorkMenu(){
    const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序","026":"麻姑山仙坛记","027":"旧拓魏志五种","028":"晋唐小楷九种","029":"鲜于光祖墓志","030":"九成宫醴泉铭","031":"黄庭堅青原山诗刻石","032":"许真人井铭","033":"争座位帖","034":"章吉老墓志","035":"武氏祠画像题字","036":"瘗鹤铭","043":"司马昞妻孟敬训墓志","044":"崔敬邕墓誌"};
    const name=names[workId];if(!name)return;
    const apply=()=>{
      const side=document.querySelector(".side");
      if(!side)return;
      const workName=side.querySelector(".work-name");
      const links=side.querySelectorAll("a");
      if(workName)workName.textContent=name;
      const labels=["一、碑帖浏览","二、碑文释文","三、碑文残损与AI释读","四、众智释读"];
      links.forEach((link,index)=>{if(labels[index])link.textContent=labels[index];});
      document.title=`${name} · 碑帖智能读析平台`;
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});
    else apply();
  }
  applyImmediateWorkMenu();
  if(workId==="027")document.documentElement.classList.add("work027-no-location-map");
  if(workId==="028")document.documentElement.classList.add("work028-no-location-map");
  if(workId==="029")document.documentElement.classList.add("work029-no-location-map");

  function appendScript(src,datasetKey,onDone){
    const path=src.split("?")[0];
    const existing=Array.from(document.scripts).find(node=>(node.getAttribute("src")||"").split("?")[0].endsWith(path));
    if(existing){
      if(typeof onDone==="function")setTimeout(onDone,0);
      return existing;
    }
    const script=document.createElement("script");
    script.src=src;
    script.async=false;
    if(datasetKey)script.dataset[datasetKey]="true";
    if(typeof onDone==="function")script.addEventListener("load",onDone,{once:true});
    script.addEventListener("error",()=>{
      console.error("[detail-patch] 专属脚本加载失败",src);
      if(typeof onDone==="function")onDone();
    },{once:true});
    document.head.appendChild(script);
    return script;
  }

  function loadTranscriptFormatter(){
    if(!["024","027","028","029"].includes(workId))return;
    appendScript(transcriptFormatUrl,"transcriptFormatNormalizer",null);
  }
  loadTranscriptFormatter();

  function disableStaleDamageScripts(){
    document.querySelectorAll("script[src*='js/damage_ai_reading.js'],script[src*='js/damage-category-standardizer.js']").forEach(script=>script.remove());
    [42,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70].forEach(version=>{window[`__DAMAGE_AI_READING_ROUTER_V${version}__`]=true;});
    window.__DAMAGE_CATEGORY_STANDARDIZER_V1__=true;
  }

  function loadWork024Directly(){
    if(window.__WORK_024_DIRECT_BOOTSTRAP__)return;
    window.__WORK_024_DIRECT_BOOTSTRAP__=true;
    disableStaleDamageScripts();
    const loadContent=()=>appendScript("js/work-024.js?v=20260724_work024_menu_v1","work024Direct",null);
    appendScript("js/work-024-coordinate-adapter.js?v=20260724_work024_menu_v1","work024CoordinateDirect",loadContent);
  }

  function forceDedicatedRouter(){
    if(!routedWorks.has(workId))return;
    if(workId==="024"){
      loadWork024Directly();
      return;
    }
    if(document.querySelector("script[data-dedicated-forced-router]"))return;
    disableStaleDamageScripts();
    const loadRouter=()=>{
      const script=document.createElement("script");
      script.src=routerUrl;
      script.async=false;
      script.dataset.dedicatedForcedRouter=workId;
      script.addEventListener("error",()=>console.error(`[detail-patch] ${workId}当前路由加载失败`,script.src),{once:true});
      document.head.appendChild(script);
    };
    appendScript(categoryUrl,"categoryRecovery",loadRouter);
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
    try{
      const url=workId==="030"?work030DataUrl:(workId==="032"?work032DataUrl:(workId==="033"?work033DataUrl:dataUrl));
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok)throw new Error(`${url} ${response.status}`);
      const data=await response.json();
      recordCache=["030","031","032","033"].includes(workId)?(data?.header||data?.[workId]||data):data?.[workId]||null;
      if(recordCache)render(recordCache);else throw new Error(`missing header ${workId}`);
    }catch(error){
      console.error("[header-card] 当前碑帖信息卡加载失败",error);
      document.documentElement.classList.remove("beitie-header-pending","detail-header-pending");
      window.dispatchEvent(new CustomEvent("beitie-header-ready",{detail:{workId,error:true}}));
    }
  }

  try{
    const request=new XMLHttpRequest();request.open("GET",coreUrl,false);request.send(null);
    if((request.status>=200&&request.status<300)||request.status===0)(0,eval)(`${request.responseText}\n//# sourceURL=${coreUrl}`);
    else throw new Error(`${coreUrl} ${request.status}`);
  }catch(error){console.warn("[detail-patch] 同步加载原补丁失败，改用脚本回退",error);const script=document.createElement("script");script.src=coreUrl;script.async=false;script.addEventListener("error",()=>console.error("[detail-patch] 原补丁加载失败",coreUrl),{once:true});document.head.appendChild(script);}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadHeader,{once:true});else loadHeader();
})();
