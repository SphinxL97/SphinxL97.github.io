/* 全部碑帖栏目二、三路由：006、007均使用单一专属模块。 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ROUTER_V42__)return;
  window.__DAMAGE_AI_READING_ROUTER_V42__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const legacy={src:"js/damage-case-unbracketed-adapter.js?v=20260721_legacy_v1",key:"legacy",ready:()=>Boolean(window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__)};
  const integrity={src:"js/damage-case-integrity-v2.js?v=20260721_integrity_v2",key:"integrity",ready:()=>Boolean(window.__DAMAGE_CASE_INTEGRITY_V2__)};
  const partial={src:"js/damage-case-partial-status.js?v=20260721_partial_v1",key:"partial",ready:()=>Boolean(window.__DAMAGE_CASE_PARTIAL_STATUS__)};

  const routes={
    "001":[{src:"js/damage_ai_reading_core.js?v=20260717_stable_v1",key:"w001",ready:()=>Boolean(window.DAMAGE_AI_CASES?.length)},legacy,integrity,partial],
    "002":[{src:"js/work-002-liqi.js?v=20260721_liqi_analysis_v2",key:"w002",ready:()=>Boolean(window.__WORK_002_CONTENT_READY__)},legacy,integrity,partial],
    "003":[{src:"js/work-003-longzangsi.js?v=20260721_longzangsi_analysis_v3",key:"w003",ready:()=>Boolean(window.__WORK_003_CONTENT_READY__)}],
    "004":[{src:"js/work-004-coordinate-adapter.js?v=20260717_stable_v1",key:"w004c",ready:()=>Boolean(window.__WORK_004_COORDINATE_ADAPTER__)},{src:"js/work-004-lushansi.js?v=20260721_lushansi_analysis_v3",key:"w004",ready:()=>Boolean(window.__WORK_004_CONTENT_READY__)}],
    "005":[{src:"js/work-005-yugonggong-stable.js?v=20260721_yugonggong_analysis_v4",key:"w005",ready:()=>Boolean(window.__WORK_005_CONTENT_READY__)}],
    "006":[{src:"js/work-remote-image-adapter.js?v=20260722_remote_v2",key:"w006remote",ready:()=>Boolean(window.__WORK_REMOTE_IMAGE_ADAPTER__)},{src:"js/work-006-shichenhou.js?v=20260722_shichenhou_final_v3",key:"w006",ready:()=>Boolean(window.__WORK_006_STABLE_READY__)}],
    "007":[
      {src:"js/work-007-coordinate-adapter.js?v=20260722_yique_fix_v2",key:"w007c",ready:()=>Boolean(window.__WORK_007_COORDINATE_ADAPTER__)},
      {src:"js/work-007.js?v=20260722_yique_fix_v2",key:"w007",ready:()=>Boolean(window.__WORK_007_STABLE_READY__)}
    ]
  };

  const titles={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑"};

  function installMask(){
    if(id==="007"||document.getElementById("detail-route-pending-style"))return;
    const style=document.createElement("style");
    style.id="detail-route-pending-style";
    style.textContent=".damage-basis-block,.damage-basis-card,[data-damage-basis]{display:none!important}";
    document.head.appendChild(style);
  }

  function renderLoading(title){
    const second=document.querySelector(".side a:nth-of-type(2)"),third=document.querySelector(".side a:nth-of-type(3)");
    if(second)second.textContent="二、碑文释文";
    if(third)third.textContent="三、碑文残损与AI释读";
    const transcript=document.getElementById("calligraphy"),damage=document.getElementById("people");
    if(transcript){transcript.className="content-card full-transcript-section";transcript.innerHTML=`<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${title}》碑文释文……</div></div>`;}
    if(damage){damage.className="content-card damage-ai";damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${title}》释读案例……</div></div>`;}
  }

  function waitReady(test,limit=300){
    return new Promise(resolve=>{
      if(test?.()){resolve(true);return;}
      let tries=0;
      const timer=setInterval(()=>{
        tries+=1;
        if(test?.()){clearInterval(timer);resolve(true);}
        else if(tries>=limit){clearInterval(timer);resolve(false);}
      },50);
    });
  }

  function load(item){
    return new Promise(resolve=>{
      if(item.ready?.()){resolve(true);return;}
      const path=item.src.split("?")[0];
      const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(path));
      if(existing){waitReady(item.ready).then(resolve);return;}
      const script=document.createElement("script");
      script.src=item.src;
      script.async=false;
      script.dataset[item.key]="true";
      script.onload=()=>waitReady(item.ready).then(resolve);
      script.onerror=()=>{console.error("[work-router]",item.src);resolve(false);};
      document.head.appendChild(script);
    });
  }

  async function start(){
    installMask();
    const title=titles[id]||`碑帖${id}`;
    renderLoading(title);
    await load({src:"js/reader-box-alignment-patch.js?v=20260718_box_align_v1",key:"align",ready:()=>Boolean(window.__READER_BOX_ALIGNMENT_PATCH_V1__)});
    if(!["003","004","005","006","007"].includes(id)){
      await load({src:"js/damage_case_audit.js?v=20260717_stable_v1",key:"audit",ready:()=>Boolean(window.__DAMAGE_CASE_AUDIT_V2__)});
      await load({src:"js/damage_case_standard_patch.js?v=20260717_stable_v1",key:"standard",ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V4__)});
    }
    const route=routes[id]||[];
    let success=Boolean(route.length);
    for(const item of route)success=(await load(item))&&success;
    if(!success)[document.getElementById("calligraphy"),document.getElementById("people")].forEach(section=>{
      const node=section?.querySelector(".full-transcript-loading");
      if(node)node.textContent=`《${title}》专属内容加载失败，请刷新页面后重试。`;
    });
  }

  if(document.getElementById("calligraphy")&&document.getElementById("people"))start();
  else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
