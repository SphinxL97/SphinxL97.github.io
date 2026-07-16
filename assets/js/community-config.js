/* 公开校订意见配置。
 * mode="demo"：使用内置示例数据，投票只保存在当前浏览器。
 * mode="supabase"：读取 Supabase 中已审核意见，并启用所有访问者共享的实时投票。
 * supabaseKey 应填写 publishable key（或旧版 anon key）。
 * 绝对不要填写 secret key 或 service_role key。
 */
window.COMMUNITY_CONFIG=Object.freeze({
  mode:"supabase",
  supabaseUrl:"https://qzosftacfgoasjucsipt.supabase.co",
  supabaseKey:"sb_publishable_gOEOPaHSERWY4RrGlaFIZA_vqXj5sfB",
  pageSize:6,
  realtime:true
});

function currentParentWorkId(){
  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  return (rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
}

function appendModule(src,dataKey,onload){
  const selector=`script[data-${dataKey}]`;
  if(document.querySelector(selector)) return;
  const script=document.createElement("script");
  script.src=src;
  script.async=false;
  script.dataset[dataKey]="true";
  if(onload) script.addEventListener("load",onload,{once:true});
  script.addEventListener("error",()=>console.error("[work-module] 模块加载失败：",src));
  document.head.appendChild(script);
}

/* 仅在作品002详情页加载阅读顺序与字框修正，不影响其他碑帖或汇校配置。 */
(function loadLiqiReaderFix(){
  "use strict";
  if(currentParentWorkId()!=="002") return;
  appendModule("js/liqi-reader-fix.js?v=20260716_liqi_reader_v3","liqiReaderFix");
})();

/* 作品003：先加载栏目四坐标适配，再加载专属栏目二、三内容。 */
(function loadLongzangsiModules(){
  "use strict";
  if(currentParentWorkId()!=="003") return;
  appendModule("js/work-003-coordinate-adapter.js?v=20260716_longzangsi_v1","work003CoordinateAdapter");
  appendModule("js/work-003-longzangsi.js?v=20260716_longzangsi_v2","work003Longzangsi",()=>{
    if(Array.isArray(window.DAMAGE_AI_CASES)){
      window.DAMAGE_AI_CASES=window.DAMAGE_AI_CASES.map(item=>({...item,n:"残损碑文恢复"}));
      window.dispatchEvent(new CustomEvent("work-003-recovery-cases-ready"));
    }
  });
})();

/* 作品004：同一句中的全部缺字合并为一处，并补入第97页残字案例。 */
(function loadLushansiModules(){
  "use strict";
  if(currentParentWorkId()!=="004") return;
  appendModule("js/work-004-coordinate-adapter.js?v=20260716_lushansi_v1","work004CoordinateAdapter");
  appendModule("js/work-004-lushansi.js?v=20260716_lushansi_v2","work004Lushansi",()=>{
    appendModule("js/work-004-page97-case.js?v=20260717_page97_v1","work004Page97Case");
  });
})();

/* 作品001—004的第三栏目问题句，在第二栏目原文中加粗。 */
(function loadTranscriptProblemHighlight(){
  "use strict";
  const parentId=currentParentWorkId();
  if(!["001","002","003","004"].includes(parentId)) return;
  appendModule("js/transcript-problem-highlight.js?v=20260716_v4","transcriptProblemHighlight");
})();
