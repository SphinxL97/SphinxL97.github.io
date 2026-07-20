/* 全部碑帖栏目二、三路由：先锁定当前碑帖，再加载审核后的专属内容。 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ROUTER_V14__)return;
  window.__DAMAGE_AI_READING_ROUTER_V14__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");

  /*
   * 005性能优化：
   * - 栏目三原来会在页面刚打开时立即请求55页逐字坐标；
   * - 栏目四会同时请求001—005整合坐标分片。
   * 两套大数据解析并发执行会阻塞首屏。现在只有滚动到相应栏目附近时才真正发起请求。
   */
  function install005LazyCoordinateGate(){
    if(parentId!=="005"||window.__WORK_005_LAZY_COORDINATE_GATE__)return;
    window.__WORK_005_LAZY_COORDINATE_GATE__=true;

    const nativeFetch=window.fetch.bind(window);
    const requestUrl=input=>typeof input==="string"?input:String(input?.url||"");
    const peopleRequest=url=>/data\/glyph_boxes\/iiif\/005\/page_\d+\.json(?:[?#]|$)/i.test(url);
    const placesRequest=url=>/data\/model_boxes\/glyph_model_border_001_005\.json(?:[?#]|$)/i.test(url);

    function waitUntilNear(sectionId,anchorName){
      return new Promise(resolve=>{
        let done=false,observer=null;
        const finish=()=>{
          if(done)return;
          done=true;
          observer?.disconnect();
          window.removeEventListener("scroll",check);
          window.removeEventListener("resize",check);
          window.removeEventListener("hashchange",checkHash);
          document.removeEventListener("click",checkClick,true);
          resolve();
        };
        const check=()=>{
          const section=document.getElementById(sectionId);
          if(!section)return;
          const rect=section.getBoundingClientRect();
          const margin=Math.max(500,window.innerHeight*.65);
          if(rect.top<=window.innerHeight+margin&&rect.bottom>=-margin)finish();
        };
        const checkHash=()=>{if(location.hash===`#${anchorName}`||location.hash===`#${sectionId}`)finish();};
        const checkClick=event=>{
          const link=event.target instanceof Element?event.target.closest(`a[href="#${anchorName}"],a[href="#${sectionId}"]`):null;
          if(link)finish();
        };

        checkHash();
        if(done)return;
        check();
        if(done)return;

        const section=document.getElementById(sectionId);
        if(section&&"IntersectionObserver" in window){
          observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))finish();},{rootMargin:"700px 0px"});
          observer.observe(section);
        }
        window.addEventListener("scroll",check,{passive:true});
        window.addEventListener("resize",check,{passive:true});
        window.addEventListener("hashchange",checkHash);
        document.addEventListener("click",checkClick,true);
      });
    }

    const peopleReady=waitUntilNear("people","people");
    const placesReady=waitUntilNear("places","places");

    window.fetch=async function(input,init){
      const url=requestUrl(input);
      if(peopleRequest(url))await peopleReady;
      else if(placesRequest(url))await placesReady;
      return nativeFetch(input,init);
    };
  }

  install005LazyCoordinateGate();

  const routes={
    "001":[{src:"js/damage_ai_reading_core.js?v=20260717_stable_v1",key:"damageAiCore",ready:()=>Boolean(window.DAMAGE_AI_CASES?.length)}],
    "002":[{src:"js/work-002-liqi.js?v=20260717_stable_v1",key:"work002Liqi",marker:"data-work-002-liqi",ready:()=>Boolean(window.__WORK_002_CONTENT_READY__)}],
    "003":[{src:"js/work-003-longzangsi.js?v=20260717_stable_v1",key:"work003Longzangsi",ready:()=>Boolean(window.__WORK_003_CONTENT_READY__)}],
    "004":[
      {src:"js/work-004-coordinate-adapter.js?v=20260717_stable_v1",key:"work004CoordinateAdapter",ready:()=>Boolean(window.__WORK_004_COORDINATE_ADAPTER__)},
      {src:"js/work-004-lushansi.js?v=20260717_stable_v1",key:"work004Lushansi",ready:()=>Boolean(window.__WORK_004_CONTENT_READY__)},
      {src:"js/work-004-page97-case.js?v=20260717_stable_v1",key:"work004Page97Case",ready:()=>Boolean(window.__WORK_004_PAGE97_CASE_PATCH__)}
    ],
    "005":[
      {src:"js/work-005-case-data-patch-v3.js?v=20260720_review_v3",key:"work005CaseDataPatchV3",ready:()=>Boolean(window.__WORK_005_CASE_DATA_PATCH_V3__)},
      {src:"js/work-005-yugonggong-all-v2.js?v=20260720_review_v4",key:"work005AllDamageReview",ready:()=>Boolean(window.__WORK_005_CONTENT_READY__)},
      {src:"js/work-005-column4-highlight.js?v=20260720_final_v1",key:"work005Column4Highlight",ready:()=>Boolean(window.__WORK_005_COLUMN4_HIGHLIGHT_V1__)}
    ]
  };
  const fallbackTitles={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑"};

  function headerReadyForCurrentWork(){return document.querySelector(".info-panel .meta-lines")?.dataset.completeHeaderWork===parentId;}

  function installPendingMask(){
    if(!document.getElementById("detail-route-pending-style")){
      const style=document.createElement("style");style.id="detail-route-pending-style";
      style.textContent=`html.detail-content-pending #calligraphy,html.detail-content-pending #people,html.detail-header-pending .work-hero{visibility:hidden!important}`;
      document.head.appendChild(style);
    }
    document.documentElement.classList.add("detail-content-pending","detail-header-pending");
    const releaseHeader=()=>{const correct=headerReadyForCurrentWork();if(correct)document.documentElement.classList.remove("detail-header-pending");return Boolean(correct);};
    window.addEventListener("beitie-header-ready",()=>{if(headerReadyForCurrentWork())document.documentElement.classList.remove("detail-header-pending");},{once:true});
    const headerTarget=document.querySelector(".work-hero")||document.documentElement;
    const headerObserver=new MutationObserver(()=>{if(releaseHeader())headerObserver.disconnect();});
    headerObserver.observe(headerTarget,{childList:true,subtree:true,characterData:true,attributes:true});
    releaseHeader();
    setTimeout(()=>{headerObserver.disconnect();document.documentElement.classList.remove("detail-header-pending");},1800);
  }

  async function fetchTitle(){
    const dom=String(document.querySelector(".info-panel h1")?.textContent||document.querySelector(".side .work-name")?.textContent||"").trim();
    if(dom&&dom!=="碑帖详情")return dom;
    if(fallbackTitles[parentId])return fallbackTitles[parentId];
    try{const response=await fetch("data/beitie_header_info.json?v=20260717_stable_titles_v1",{cache:"no-store"});if(response.ok){const data=await response.json();const title=String(data?.[parentId]?.title||data?.[parentId]?.basic?.首题||"").trim();if(title)return title;}}catch(_){}
    try{const response=await fetch("data/beitie_catalog.json?v=20260717_stable_titles_v1",{cache:"no-store"});if(response.ok){const data=await response.json();const item=(Array.isArray(data)?data:[]).find(row=>String(row.id||"").padStart(3,"0")===parentId);const title=String(item?.title||"").trim();if(title)return title;}}catch(_){}
    return `碑帖${parentId}`;
  }

  function renderLoading(title){
    const transcript=document.getElementById("calligraphy"),damage=document.getElementById("people");
    const second=document.querySelector(".side a:nth-of-type(2)"),third=document.querySelector(".side a:nth-of-type(3)");
    if(second)second.textContent="二、碑文释文";if(third)third.textContent="三、碑文残损与AI释读";
    if(transcript){transcript.className="content-card full-transcript-section";transcript.innerHTML=`<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${title}》碑文释文……</div></div>`;}
    if(damage){damage.className="content-card damage-ai";damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${title}》释读案例……</div></div>`;}
  }
  function renderPending(title){const a=document.getElementById("calligraphy")?.querySelector(".full-transcript-loading"),b=document.getElementById("people")?.querySelector(".full-transcript-loading");if(a)a.textContent=`《${title}》碑文释文尚未整理发布。`;if(b)b.textContent=`《${title}》释读案例尚未整理发布。`;}
  function renderError(title){[document.getElementById("calligraphy"),document.getElementById("people")].forEach(section=>{const loading=section?.querySelector(".full-transcript-loading");if(loading)loading.textContent=`《${title}》专属内容加载失败，请刷新页面后重试。`;});}

  function loadScript(item){
    return new Promise(resolve=>{
      if(item.ready?.()){resolve(true);return;}
      const path=item.src.split("?")[0];
      const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(path));
      if(existing){let settled=false;const finish=value=>{if(settled)return;settled=true;resolve(value);};existing.addEventListener("load",()=>finish(true),{once:true});existing.addEventListener("error",()=>finish(false),{once:true});setTimeout(()=>finish(Boolean(item.ready?.())),2200);return;}
      const script=document.createElement("script");script.src=item.src;script.async=false;script.dataset[item.key]="true";if(item.marker)script.setAttribute(item.marker,"true");script.addEventListener("load",()=>resolve(true),{once:true});script.addEventListener("error",()=>{console.error("[work-router] 模块加载失败：",item.src);resolve(false);},{once:true});document.head.appendChild(script);
    });
  }

  async function start(){
    installPendingMask();
    const title=await fetchTitle();renderLoading(title);document.documentElement.classList.remove("detail-content-pending");
    await loadScript({src:"js/reader-box-alignment-patch.js?v=20260718_box_align_v1",key:"readerBoxAlignment",ready:()=>Boolean(window.__READER_BOX_ALIGNMENT_PATCH_V1__)});
    if(parentId!=="005"){
      await loadScript({src:"js/damage_case_audit.js?v=20260717_stable_v1",key:"damageCaseAudit",ready:()=>Boolean(window.__DAMAGE_CASE_AUDIT_V2__)});
      await loadScript({src:"js/damage_case_standard_patch.js?v=20260717_stable_v1",key:"damageCaseStandard",ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V4__)});
    }
    const route=routes[parentId]||[];
    if(!route.length){renderPending(title);return;}
    let success=true;for(const item of route)success=(await loadScript(item))&&success;if(!success)renderError(title);
  }

  if(document.getElementById("calligraphy")&&document.getElementById("people"))start();
  else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();