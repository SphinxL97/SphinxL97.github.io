/*
 * 栏目二、三内容路由。
 * 001 使用《道因法师碑》通用样板；002—004 直接加载各自专属模块。
 * 在专属模块加载完成前只显示当前碑帖的加载提示，绝不先渲染001内容。
 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ROUTER_V3__) return;
  window.__DAMAGE_AI_READING_ROUTER_V3__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const workTitles={
    "001":"道因法师碑",
    "002":"礼器碑并阴",
    "003":"龙藏寺碑",
    "004":"麓山寺碑并阴"
  };

  const routes={
    "001":[
      {src:"js/damage_ai_reading_core.js?v=20260717_router_v1",key:"damageAiCore",ready:()=>Boolean(window.__DAMAGE_AI_CORE_READY__)}
    ],
    "002":[
      {src:"js/work-002-liqi.js?v=20260717_router_v1",key:"work002Liqi",ready:()=>Boolean(window.__WORK_002_CONTENT_READY__)}
    ],
    "003":[
      {src:"js/work-003-longzangsi.js?v=20260717_router_v1",key:"work003Longzangsi",ready:()=>Boolean(window.__WORK_003_CONTENT_READY__)}
    ],
    "004":[
      {src:"js/work-004-coordinate-adapter.js?v=20260717_router_v1",key:"work004CoordinateAdapter",ready:()=>Boolean(window.__WORK_004_COORDINATE_ADAPTER__)},
      {src:"js/work-004-lushansi.js?v=20260717_router_v1",key:"work004Lushansi",ready:()=>Boolean(window.__WORK_004_CONTENT_READY__)},
      {src:"js/work-004-page97-case.js?v=20260717_router_v1",key:"work004Page97Case",ready:()=>Boolean(window.__WORK_004_PAGE97_CASE_PATCH__)}
    ]
  };

  function showCurrentWorkLoading(){
    if(parentId==="001") return;
    const title=workTitles[parentId]||"当前碑帖";
    const transcript=document.getElementById("calligraphy");
    const damage=document.getElementById("people");
    const secondLink=document.querySelector(".side a:nth-of-type(2)");
    const thirdLink=document.querySelector(".side a:nth-of-type(3)");

    if(secondLink) secondLink.textContent="二、碑文释文";
    if(thirdLink) thirdLink.textContent="三、碑文残损与AI释读";

    if(transcript){
      transcript.classList.add("full-transcript-section");
      transcript.innerHTML=`<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${title}》碑文释文……</div></div>`;
    }
    if(damage){
      damage.classList.add("damage-ai");
      damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${title}》释读案例……</div></div>`;
    }
  }

  function showLoadError(){
    const title=workTitles[parentId]||"当前碑帖";
    [document.getElementById("calligraphy"),document.getElementById("people")].forEach(section=>{
      const loading=section?.querySelector(".full-transcript-loading");
      if(loading) loading.textContent=`《${title}》专属内容加载失败，请刷新页面后重试。`;
    });
  }

  function loadScript(item){
    return new Promise(resolve=>{
      if(item.ready&&item.ready()){
        resolve(true);
        return;
      }

      const path=item.src.split("?")[0];
      const existing=Array.from(document.scripts).find(script=>{
        const src=script.getAttribute("src")||"";
        return src.split("?")[0].endsWith(path);
      });

      if(existing){
        let settled=false;
        const finish=value=>{if(settled)return;settled=true;resolve(value);};
        existing.addEventListener("load",()=>finish(true),{once:true});
        existing.addEventListener("error",()=>finish(false),{once:true});
        setTimeout(()=>finish(Boolean(item.ready?.())),1800);
        return;
      }

      const script=document.createElement("script");
      script.src=item.src;
      script.async=false;
      script.dataset[item.key]="true";
      script.addEventListener("load",()=>resolve(true),{once:true});
      script.addEventListener("error",()=>{
        console.error("[work-router] 碑帖专属模块加载失败：",item.src);
        resolve(false);
      },{once:true});
      document.head.appendChild(script);
    });
  }

  async function start(){
    showCurrentWorkLoading();
    const route=routes[parentId]||[];
    let success=true;
    for(const item of route){
      const loaded=await loadScript(item);
      success=success&&loaded;
    }

    await loadScript({
      src:"js/damage_case_standard_patch.js?v=20260717_router_v1",
      key:"damageCaseStandard",
      ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V1__)
    });

    if(!success) showLoadError();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
