/* 全部碑帖栏目二、三路由：006、007、010、011、013、014-01、014-02、015、016、017、018、020使用单一专属模块。 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ROUTER_V59__)return;
  window.__DAMAGE_AI_READING_ROUTER_V59__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const routeId=raw.includes("-")?raw:id;
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
      {src:"js/work-007-coordinate-adapter.js?v=20260722_yique_columns_v8",key:"w007c",ready:()=>Boolean(window.__WORK_007_COORDINATE_ADAPTER_V8__)},
      {src:"js/work-007.js?v=20260722_yique_columns_v8",key:"w007",ready:()=>Boolean(window.__WORK_007_STABLE_READY__)}
    ],
    "010":[
      {src:"js/work-010-coordinate-adapter.js?v=20260722_zhaoqingxian_v1",key:"w010c",ready:()=>Boolean(window.__WORK_010_COORDINATE_ADAPTER__)},
      {src:"js/work-010.js?v=20260722_zhaoqingxian_v1",key:"w010",ready:()=>Boolean(window.__WORK_010_STABLE_READY__)}
    ],
    "011":[
      {src:"js/work-011-coordinate-adapter.js?v=20260723_huangfudan_v1",key:"w011c",ready:()=>Boolean(window.__WORK_011_COORDINATE_ADAPTER__)},
      {src:"js/work-011.js?v=20260723_huangfudan_v1",key:"w011",ready:()=>Boolean(window.__WORK_011_STABLE_READY__)}
    ],
    "013":[
      {src:"js/work-013-coordinate-adapter.js?v=20260723_lujun_v1",key:"w013c",ready:()=>Boolean(window.__WORK_013_COORDINATE_ADAPTER__)},
      {src:"js/work-013.js?v=20260723_lujun_v1",key:"w013",ready:()=>Boolean(window.__WORK_013_STABLE_READY__)}
    ],
    "014-01":[
      {src:"js/work-014-coordinate-adapter.js?v=20260723_lihanjing_014_01_v2",key:"w01401c",ready:()=>Boolean(window.__WORK_014_01_COORDINATE_ADAPTER__)},
      {src:"js/work-014.js?v=20260723_lihanjing_014_01_v3",key:"w01401",ready:()=>Boolean(window.__WORK_014_01_STABLE_READY__)}
    ],
    "014-02":[
      {src:"js/work-014-02-coordinate-adapter.js?v=20260723_lihanjing_014_02_v1",key:"w01402c",ready:()=>Boolean(window.__WORK_014_02_COORDINATE_ADAPTER__)},
      {src:"js/work-014-02.js?v=20260723_lihanjing_014_02_v2",key:"w01402",ready:()=>Boolean(window.__WORK_014_02_STABLE_READY__)}
    ],
    "015":[
      {src:"js/work-015-coordinate-adapter.js?v=20260723_shichenqian_v1",key:"w015c",ready:()=>Boolean(window.__WORK_015_COORDINATE_ADAPTER__)},
      {src:"js/work-015.js?v=20260723_shichenqian_v1",key:"w015",ready:()=>Boolean(window.__WORK_015_STABLE_READY__)}
    ],
    "016":[
      {src:"js/work-016-coordinate-adapter.js?v=20260723_zunhao_shanrang_v1",key:"w016c",ready:()=>Boolean(window.__WORK_016_COORDINATE_ADAPTER__)},
      {src:"js/work-016.js?v=20260723_zunhao_shanrang_v1",key:"w016",ready:()=>Boolean(window.__WORK_016_STABLE_READY__)}
    ],
    "017":[
      {src:"js/work-017-coordinate-adapter.js?v=20260723_zhangmenglong_v1",key:"w017c",ready:()=>Boolean(window.__WORK_017_COORDINATE_ADAPTER__)},
      {src:"js/work-017.js?v=20260723_zhangmenglong_v2",key:"w017",ready:()=>Boolean(window.__WORK_017_STABLE_READY__)}
    ],
    "018":[
      {src:"js/work-018-coordinate-adapter.js?v=20260724_songgao_v1",key:"w018c",ready:()=>Boolean(window.__WORK_018_COORDINATE_ADAPTER__)},
      {src:"js/work-018.js?v=20260724_songgao_v1",key:"w018",ready:()=>Boolean(window.__WORK_018_STABLE_READY__)}
    ],
    "020":[
      {src:"js/work-020-coordinate-adapter.js?v=20260724_huadusi_v2",key:"w020c",ready:()=>Boolean(window.__WORK_020_COORDINATE_ADAPTER__)},
      {src:"js/work-020.js?v=20260724_huadusi_v2",key:"w020",ready:()=>Boolean(window.__WORK_020_STABLE_READY__)}
    ]
  };

  const titles={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑","010":"赵清献公碑","011":"皇甫诞碑","013":"鲁峻碑","014-01":"颜真卿李玄靖碑册一","014-02":"颜真卿李玄靖碑册二","015":"史晨前碑","016":"上尊号碑受禅表合册","017":"张猛龙碑并阴","018":"中岳嵩高灵庙碑并额","020":"化度寺邕禅师舍利塔铭"};

  function installMask(){
    if(["007","010","011","013","014","015","016","017","018","020"].includes(id)||document.getElementById("detail-route-pending-style"))return;
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
    if(raw==="014"){location.replace("detail.html?id=014-01");return;}
    const title=titles[routeId]||titles[id]||`碑帖${id}`;
    renderLoading(title);
    await load({src:"js/reader-box-alignment-patch.js?v=20260718_box_align_v1",key:"align",ready:()=>Boolean(window.__READER_BOX_ALIGNMENT_PATCH_V1__)});
    if(!["003","004","005","006","007","010","011","013","014","015","016","017","018","020"].includes(id)){
      await load({src:"js/damage_case_audit.js?v=20260717_stable_v1",key:"audit",ready:()=>Boolean(window.__DAMAGE_CASE_AUDIT_V2__)});
      await load({src:"js/damage_case_standard_patch.js?v=20260717_stable_v1",key:"standard",ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V4__)});
    }
    const route=routes[routeId]||routes[id]||[];
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
