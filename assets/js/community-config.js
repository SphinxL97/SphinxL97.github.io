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

/* 仅在作品002详情页加载阅读顺序与字框修正，不影响其他碑帖或汇校配置。 */
(function loadLiqiReaderFix(){
  "use strict";
  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="002"||document.querySelector('script[data-liqi-reader-fix]')) return;
  const script=document.createElement("script");
  script.src="js/liqi-reader-fix.js?v=20260716_liqi_reader_v3";
  script.dataset.liqiReaderFix="true";
  script.addEventListener("error",()=>console.error("[liqi-reader-fix] 修正模块加载失败：",script.src));
  document.head.appendChild(script);
})();

/* 作品001、002的第三栏目问题句，在第二栏目原文中加粗。 */
(function loadTranscriptProblemHighlight(){
  "use strict";
  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(!["001","002"].includes(parentId)||document.querySelector('script[data-transcript-problem-highlight]')) return;
  const script=document.createElement("script");
  script.src="js/transcript-problem-highlight.js?v=20260716_v1";
  script.dataset.transcriptProblemHighlight="true";
  script.addEventListener("error",()=>console.error("[transcript-highlight] 问题句加粗模块加载失败：",script.src));
  document.head.appendChild(script);
})();
