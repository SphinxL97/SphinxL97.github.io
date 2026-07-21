/* 全部碑帖栏目二、三路由：专属碑帖不再经过共享分析模板。 */
(function(){
"use strict";
if(window.__DAMAGE_AI_READING_ROUTER_V34__)return;
window.__DAMAGE_AI_READING_ROUTER_V34__=true;
const raw=String(new URLSearchParams(location.search).get("id")||"001"),id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
const legacy={src:"js/damage-case-unbracketed-adapter.js?v=20260721_legacy_v1",key:"legacy",ready:()=>Boolean(window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__)};
const integrity={src:"js/damage-case-integrity-v2.js?v=20260721_integrity_v2",key:"integrity",ready:()=>Boolean(window.__DAMAGE_CASE_INTEGRITY_V2__)};
const partial={src:"js/damage-case-partial-status.js?v=20260721_partial_v1",key:"partial",ready:()=>Boolean(window.__DAMAGE_CASE_PARTIAL_STATUS__)};
const crowdCases={src:"assets/js/crowdsource-v9.js?v=20260721_dedicated_v2",key:"crowdCases",ready:()=>Boolean(window.__CROWDSOURCE_MISSING_V10__)};
const unlockCrowd={src:"js/work-dedicated-crowdsource-unlock.js?v=20260721_dedicated_v2",key:"unlockCrowd",ready:()=>Boolean(window.__WORK_DEDICATED_CROWDSOURCE_UNLOCK__)};
const routes={
"001":[{src:"js/damage_ai_reading_core.js?v=20260717_stable_v1",key:"core",ready:()=>Boolean(window.DAMAGE_AI_CASES?.length)},legacy,integrity,partial],
"002":[{src:"js/work-002-liqi.js?v=20260721_liqi_analysis_v2",key:"w002",ready:()=>Boolean(window.__WORK_002_CONTENT_READY__)},legacy,integrity,partial],
"003":[{src:"js/work-003-longzangsi.js?v=20260721_longzangsi_analysis_v3",key:"w003",ready:()=>Boolean(window.__WORK_003_CONTENT_READY__)}],
"004":[{src:"js/work-004-coordinate-adapter.js?v=20260717_stable_v1",key:"w004c",ready:()=>Boolean(window.__WORK_004_COORDINATE_ADAPTER__)},{src:"js/work-004-lushansi.js?v=20260721_lushansi_analysis_v3",key:"w004",ready:()=>Boolean(window.__WORK_004_CONTENT_READY__)}],
"005":[{src:"js/work-005-yugonggong-stable.js?v=20260721_yugonggong_analysis_v4",key:"w005",ready:()=>Boolean(window.__WORK_005_CONTENT_READY__)},crowdCases],
"006":[
 {src:"js/work-006-coordinate-adapter.js?v=20260720_work006_v1",key:"w006c",ready:()=>Boolean(window.__WORK_006_COORDINATE_ADAPTER__)},
 {src:"js/work-006-punctuation-sync.js?v=20260720_work006_punctuation_v1",key:"w006p",ready:()=>Boolean(window.__WORK_006_PUNCTUATION_SYNC__)},
 {src:"js/work-006-dedicated-config.js?v=20260721_shichenhou_analysis_v3",key:"w006cfg",ready:()=>Boolean(window.__WORK_006_DEDICATED_CONFIG__)},
 {src:"js/work-dedicated-renderer.js?v=20260721_dedicated_v1",key:"dedicated006",ready:()=>Boolean(window.__WORK_006_CONTENT_READY__)},
 unlockCrowd,crowdCases
],
"007":[
 {src:"js/work-007-coordinate-adapter.js?v=20260720_work007_v2",key:"w007c",ready:()=>Boolean(window.__WORK_007_COORDINATE_ADAPTER__)},
 {src:"js/work-007-dedicated-config.js?v=20260721_yique_analysis_v4",key:"w007cfg",ready:()=>Boolean(window.__WORK_007_DEDICATED_CONFIG__)},
 {src:"js/work-dedicated-renderer.js?v=20260721_dedicated_v1",key:"dedicated007",ready:()=>Boolean(window.__WORK_007_CONTENT_READY__)},
 unlockCrowd,crowdCases
]};
const titles={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑"};
function mask(){
 if(!document.getElementById("detail-route-pending-style")){const s=document.createElement("style");s.id="detail-route-pending-style";s.textContent="html.detail-content-pending #calligraphy,html.detail-content-pending #people,html.detail-header-pending .work-hero{visibility:hidden!important}.damage-basis-block,.damage-basis-card,[data-damage-basis]{display:none!important}";document.head.appendChild(s);}
 document.documentElement.classList.add("detail-content-pending","detail-header-pending");
 const release=()=>{if(document.querySelector(".info-panel .meta-lines")?.dataset.completeHeaderWork===id){document.documentElement.classList.remove("detail-header-pending");return true;}return false;};
 const target=document.querySelector(".work-hero")||document.documentElement,observer=new MutationObserver(()=>{if(release())observer.disconnect();});observer.observe(target,{childList:true,subtree:true,characterData:true,attributes:true});release();setTimeout(()=>{observer.disconnect();document.documentElement.classList.remove("detail-header-pending");},1000);
}
function loading(title){
 const a=document.querySelector(".side a:nth-of-type(2)"),b=document.querySelector(".side a:nth-of-type(3)");if(a)a.textContent="二、碑文释文";if(b)b.textContent="三、碑文残损与AI释读";
 const t=document.getElementById("calligraphy"),p=document.getElementById("people");
 if(t){t.className="content-card full-transcript-section";t.innerHTML=`<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${title}》碑文释文……</div></div>`;}
 if(p){p.className="content-card damage-ai";p.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${title}》释读案例……</div></div>`;}
}
function load(x){return new Promise(resolve=>{if(x.ready?.()){resolve(true);return;}const path=x.src.split("?")[0],old=Array.from(document.scripts).find(s=>(s.getAttribute("src")||"").split("?")[0].endsWith(path));if(old){let done=false,finish=v=>{if(done)return;done=true;resolve(v);};old.addEventListener("load",()=>finish(true),{once:true});old.addEventListener("error",()=>finish(false),{once:true});setTimeout(()=>finish(Boolean(x.ready?.())),2200);return;}const s=document.createElement("script");s.src=x.src;s.async=false;s.dataset[x.key]="true";s.onload=()=>resolve(true);s.onerror=()=>{console.error("[work-router]",x.src);resolve(false);};document.head.appendChild(s);});}
async function start(){
 mask();const title=titles[id]||`碑帖${id}`;loading(title);document.documentElement.classList.remove("detail-content-pending");
 await load({src:"js/reader-box-alignment-patch.js?v=20260718_box_align_v1",key:"align",ready:()=>Boolean(window.__READER_BOX_ALIGNMENT_PATCH_V1__)});
 if(!["003","004","005","006","007"].includes(id)){await load({src:"js/damage_case_audit.js?v=20260717_stable_v1",key:"audit",ready:()=>Boolean(window.__DAMAGE_CASE_AUDIT_V2__)});await load({src:"js/damage_case_standard_patch.js?v=20260717_stable_v1",key:"standard",ready:()=>Boolean(window.__DAMAGE_CASE_STANDARD_PATCH_V4__)});}
 const list=routes[id]||[];if(!list.length)return;let ok=true;for(const x of list)ok=(await load(x))&&ok;
 if(!ok)[document.getElementById("calligraphy"),document.getElementById("people")].forEach(s=>{const e=s?.querySelector(".full-transcript-loading");if(e)e.textContent=`《${title}》专属内容加载失败，请刷新页面后重试。`;});
}
if(document.getElementById("calligraphy")&&document.getElementById("people"))start();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();