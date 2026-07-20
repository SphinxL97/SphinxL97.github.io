/* 全部碑帖栏目二、三路由：先锁定当前碑帖，再加载对应专属内容。 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ROUTER_V25__)return;
  window.__DAMAGE_AI_READING_ROUTER_V25__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const integrity={src:"js/damage-case-integrity-renderer.js?v=20260721_integrity_v1",key:"damageCaseIntegrity",ready:()=>Boolean(window.__DAMAGE_CASE_INTEGRITY_RENDERER__)};

  const routes={
    "001":[
      {src:"js/damage_ai_reading_core.js?v=20260717_stable_v1",key:"damageAiCore",ready:()=>Boolean(window.DAMAGE_AI_CASES?.length)},
      integrity
    ],
    "002":[
      {src:"js/work-002-liqi.js?v=20260717_stable_v1",key:"work002Liqi",marker:"data-work-002-liqi",ready:()=>Boolean(window.__WORK_002_CONTENT_READY__)},
      integrity
    ],
    "003":[
      {src:"js/work-003-longzangsi.js?v=20260717_stable_v1",key:"work003Longzangsi",ready:()=>Boolean(window.__WORK_003_CONTENT_READY__)},
      integrity
    ],
    "004":[
      {src:"js/work-004-coordinate-adapter.js?v=20260717_stable_v1",key:"work004CoordinateAdapter",ready:()=>Boolean(window.__WORK_004_COORDINATE_ADAPTER__)},
      {src:"js/work-004-lushansi.js?v=20260717_stable_v1",key:"work004Lushansi",ready:()=>Boolean(window.__WORK_004_CONTENT_READY__)},
      {src:"js/work-004-page97-case.js?v=20260717_stable_v1",key:"work004Page97Case",ready:()=>Boolean(window.__WORK_004_PAGE97_CASE_PATCH__)},
      integrity
    ],
    "005":[
      {src:"js/work-005-yugonggong-stable.js?v=20260720_stable_v2",key:"work005YugonggongStable",ready:()=>Boolean(window.__WORK_005_CONTENT_READY__)},
      integrity,
      {src:"js/work-005-crowdsource-cases.js?v=20260720_crowd_v2",key:"work005CrowdsourceCases",ready:()=>Boolean(window.__WORK_005_CROWDSOURCE_CASES__)}
    ],
    "006":[
      {src:"js/work-006-coordinate-adapter.js?v=20260720_work006_v1",key:"work006CoordinateAdapter",ready:()=>Boolean(window.__WORK_006_COORDINATE_ADAPTER__)},
      {src:"js/work-006-punctuation-sync.js?v=20260720_work006_punctuation_v1",key:"work006PunctuationSync",ready:()=>Boolean(window.__WORK_006_PUNCTUATION_SYNC__)},
      {src:"js/work-006-shichenhou.js?v=20260720_work006_v2",key:"work006Shichenhou",ready:()=>Boolean(window.__WORK_006_CONTENT_READY__)},
      integrity,
      {src:"assets/js/crowdsource-v9.js?v=20260721_integrity_v1",key:"work006CrowdsourceCases",ready:()=>Boolean(window.__CROWDSOURCE_MISSING_V10__)}
    ],
    "007":[
      {src:"js/work-007-coordinate-adapter.js?v=20260720_work007_v2",key:"work007CoordinateAdapter",ready:()=>Boolean(window.__WORK_007_COORDINATE_ADAPTER__)},
      {src:"js/work-007-yique.js?v=20260720_work007_v2",key:"work007Yique",ready:()=>Boolean(window.__WORK_007_CONTENT_READY__)},
      integrity,
      {src:"assets/js/crowdsource-v9.js?v=20260721_integrity_v1",key:"work007CrowdsourceCases",ready:()=>Boolean(window.__CROWDSOURCE_MISSING_V10__)}
    ]
  };
  const fallbackTitles={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑"};

  function headerReadyForCurrentWork(){
    return document.querySelector(".info-panel .meta-lines")?.dataset.completeHeaderWork===parentId;
  }

  function installPendingMask(){
    if(!document.getElementById("detail-route-pending-style")){
      const style=document.createElement("style");
      style.id="detail-route-pending-style";
      style.textContent=`html.detail-content-pending #calligraphy,html.detail-content-pending #people,html.detail-header-pending .work-hero{visibility:hidden!important}`;
      document.head.appendChild(style);
    }
    document.documentElement.classList.add("detail-content-pending","detail-header-pending");
    const releaseHeader=()=>{
      const correct=headerReadyForCurrentWork();
      if(correct)document.documentElement.classList.remove("detail-header-pending");
      return Boolean(correct);
    };
    window.addEventListener("beitie-header-ready",()=>{
      if(headerReadyForCurrentWork())document.documentElement.classList.remove("detail-header-pending");
    },{once:true});
    const headerTarget=document.querySelector(".work-hero")||document.documentElement;
    const headerObserver=new MutationObserver(()=>{if(releaseHeader())headerObserver.disconnect();});
    headerObserver.observe(headerTarget,{childList:true,subtree:true,characterData:true,attributes:true});
    releaseHeader();
    setTimeout(()=>{
      headerObserver.disconnect();
      document.documentElement.classList.remove("detail-header-pending");
    },1000);
  }

  async function fetchTitle(){
    const dom=String(document.querySelector(".info-panel h1")?.textContent||document.querySelector(".side .work-name")?.textContent||"").trim();
    if(dom&&dom!=="碑帖详情")return dom;
    if(fallbackTitles[parentId])return fallbackTitles[parentId];
    try{
      const response=await fetch("data/beitie_header_info.json?v=20260717_stable_titles_v1",{cache:"no-store"});
      if(response.ok){
        const data=await response.json();
        const title=String(data?.[parentId]?.title||data?.[parentId]?.basic?.首题||"").trim();
        if(title)return title;
      }
    }catch(_){}
    try{
      const response=await fetch("data/beitie_catalog.json?v=20260717_stable_titles_v1",{cache:"no-store"});
      if(response.ok){
        const data=await response.json();
        const item=(Array.isArray(data)?data:[]).find(row=>String(row.id||"").padStart(3,"0")===parentId);
        const title=String(item?.title||"").trim();
        if(title)return title;
      }
    }catch(_){}
    return `碑帖${parentId}`;
  }

  function renderLoading(title){
    const transcript=document.getElementById("calligraphy"),damage=document.getElementById("people");
    const second=document.querySelector(".side a:nth-of-type(2)"),third=document.querySelector(".side a:nth-of-type(3)");
    if(second)second.textContent="二、碑文释文";
    if(third)third.textContent="三、碑文残损与AI释读";
    if(transcript){
      transcript.className="content-card full-transcript-section";
      transcript.innerHTML=`<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${title}》碑文释文……</div></div>`;
    }
    if(damage){
      damage.className="content-card damage-ai";
      damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${title}》释读案例……</div></div>`;
    }
  }

  function renderPending(title){
    const a=document.getElementById("calligraphy")?.querySelector(".full-transcript-loading");
    const b=document.getElementById("people")?.querySelector(".full-transcript-loading");
    if(a)a.textContent=`《${title}》碑文释文尚未整理发布。`;
    if(b)b.textContent=`《${title}》释读案例尚未整理发布。`;
  }

  function renderError(title){
    [document.getElementById("calligraphy"),document.getElementById("people")].forEach(section=>{
      const loading=section?.querySelector(".full-transcript-loading");
      if(loading)loading.textContent=`《${title}》专属内容加载失败，请刷新页面后重试。`;
    });
  }

  function loadScript(item){
    return new Promise(resolve=>{
      if(item.ready?.()){resolve(true);return;}
      const path=item.src.split("?")[0];
      const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(path));
      if(existing){
        let settled=false;
        const finish=value=>{if(settled)return;settled=true;resolve(value);};
        existing.addEventListener("load",()=>finish(true),{once:true});
        existing.addEventListener("error",()=>finish(false),{once:true});
        setTimeout(()=>finish(Boolean(item.ready?.())),2200);
        return;
      }
      const script=document.createElement("script");
      script.src=item.src;
      script.async=false;
      script.dataset[item.key]="true";
      if(item.marker)script.setAttribute(item.marker,"true");
      script.addEventListener("load",()=>resolve(true),{once:true});
      script.addEventListener("error",()=>{console.error("[work-router] 模块加载失败：",item.src);resolve(false);},{once:true});
      document.head.appendChild(script);
    });
  }

  async function start(){
    installPendingMask();
    const title=await fetchTitle();
    renderLoading(title);
    document.documentElement.classList.remove("detail-content-pending");
    await loadScript({src:"js/reader-box-alignment-patch.js?v=20260718_box_align_v1",key:"readerBoxAlignment",ready:()=>Boolean(window.__READER_BOX_ALIGNMENT_PATCH_V1__)});
    if(!["005","006","007"].includes(parentId)){
      await loadScript({src:"js/damage_case_audit.js?v=20260717_stable_v1",key:"damageCaseAudit",ready:()=>Boolean(window.__DAMAGE_CASE_AUDIT_V2__)});
      await loadScript({src:"js/damage_case_standard_patch.js?v=20260717_stable_v1",key:"damageCaseStandard",ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V4__)});
    }
    const route=routes[parentId]||[];
    if(!route.length){renderPending(title);return;}
    let success=true;
    for(const item of route)success=(await loadScript(item))&&success;
    if(!success)renderError(title);
  }

  if(document.getElementById("calligraphy")&&document.getElementById("people"))start();
  else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();