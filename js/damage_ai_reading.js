/* 栏目三入口：保留原有内容模块，并在其后加载统一分类与补字显示规范。 */
(function(){
  "use strict";
  if(window.__DAMAGE_AI_READING_ENTRY_V2__) return;
  window.__DAMAGE_AI_READING_ENTRY_V2__=true;

  const queue=[
    "js/damage_ai_reading_core.js?v=20260716_category_v1",
    "js/damage_case_standard_patch.js?v=20260716_category_v1"
  ];

  function load(index){
    if(index>=queue.length) return;
    const script=document.createElement("script");
    script.src=queue[index];
    script.async=false;
    script.addEventListener("load",()=>load(index+1),{once:true});
    script.addEventListener("error",()=>{
      console.error("[damage-ai] 栏目三脚本加载失败：",queue[index]);
      load(index+1);
    },{once:true});
    document.head.appendChild(script);
  }

  load(0);
})();
