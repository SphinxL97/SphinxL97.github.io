/* 删除碑帖总览中的旧筛选说明，并原样加载既有检索功能。 */
(function(){
  "use strict";
  document.querySelector(".filter-note")?.remove();

  const script=document.createElement("script");
  script.src="js/gallery-search-core.js?v=20260716_note_removed_v1";
  script.async=false;
  script.addEventListener("error",()=>console.error("[gallery] 检索脚本加载失败：",script.src),{once:true});
  document.head.appendChild(script);
})();
