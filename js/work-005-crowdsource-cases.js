/* 005《虞恭公温彦博碑》栏目四案例兼容层。
 * 仅把栏目三稳定版字段映射为全站 crowdsource-v9 使用的字段；
 * 不拦截请求、不监听DOM、不改动栏目二或栏目三内容。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_CROWDSOURCE_CASES__)return;
  window.__WORK_005_CROWDSOURCE_CASES__=true;

  function normalize(cases){
    if(!Array.isArray(cases))return cases;
    cases.forEach((item,index)=>{
      if(!item||typeof item!=="object")return;
      item.n=String(item.n||item.category||"");
      item.t=String(item.t||item.title||`缺字案例${index+1}`);
      item.o=String(item.o||item.original||"");
      item.c=String(item.c||item.corrected||"");
      item.page=item.page||item.canvas_index||item.locations?.[0]?.page||"—";
    });
    return cases;
  }

  let current=normalize(window.DAMAGE_AI_CASES);

  try{
    Object.defineProperty(window,"DAMAGE_AI_CASES",{
      configurable:true,
      enumerable:true,
      get(){return current;},
      set(value){
        current=normalize(value);
        window.dispatchEvent(new CustomEvent("work-005-crowdsource-cases-ready"));
      }
    });
    if(current)window.DAMAGE_AI_CASES=current;
  }catch(error){
    console.warn("[work-005-crowdsource-cases] 无法安装字段兼容器",error);
  }

  const adaptCurrent=()=>{
    if(!Array.isArray(window.DAMAGE_AI_CASES)||!window.DAMAGE_AI_CASES.length)return false;
    window.DAMAGE_AI_CASES=window.DAMAGE_AI_CASES;
    return true;
  };

  if(adaptCurrent())return;
  window.addEventListener("work-005-content-ready",adaptCurrent,{once:true});

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(adaptCurrent()||attempts>=40)clearInterval(timer);
  },125);
})();