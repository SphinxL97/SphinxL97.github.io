/* 005旧栏目二、三入口兼容层。
 * 旧路由命中本文件时，只加载新的单模块稳定版，不再扫描55页坐标或等待后台任务。
 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005")return;
  window.__WORK_005_ALL_DAMAGE_V2__=true;
  if(window.__WORK_005_YUGONGGONG_STABLE__)return;
  const path="js/work-005-yugonggong-stable.js";
  const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(path));
  if(existing)return;
  const script=document.createElement("script");
  script.src=`${path}?v=20260720_stable_v1`;
  script.async=false;
  document.head.appendChild(script);
})();