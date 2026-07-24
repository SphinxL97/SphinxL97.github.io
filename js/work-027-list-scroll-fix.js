/* 027《旧拓魏志五种》栏目三左侧案例列表滚动定位补丁。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="027"||window.__WORK_027_LIST_SCROLL_FIX_V2__)return;
  window.__WORK_027_LIST_SCROLL_FIX_V2__=true;

  let scheduled=false;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function alignCurrentCase(){
    scheduled=false;
    const section=document.querySelector("#people[data-work027-dedicated='true'],#people.damage-ai");
    const list=section?.querySelector(".damage-list");
    const active=list?.querySelector(".damage-tab.active");
    if(!list||!active||list.clientHeight<=0)return;

    const listRect=list.getBoundingClientRect();
    const activeRect=active.getBoundingClientRect();
    const activeCenter=activeRect.top+activeRect.height/2;
    const listCenter=listRect.top+listRect.height/2;
    const delta=activeCenter-listCenter;
    const max=Math.max(0,list.scrollHeight-list.clientHeight);
    list.scrollTop=clamp(list.scrollTop+delta,0,max);
  }

  function scheduleAlign(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      requestAnimationFrame(alignCurrentCase);
    });
    setTimeout(alignCurrentCase,80);
    setTimeout(alignCurrentCase,220);
  }

  document.addEventListener("click",event=>{
    const target=event.target.closest("#people .damage-tab,#people [data-action='prev'],#people [data-action='next'],#people [data-action='expand']");
    if(!target)return;
    scheduleAlign();
  });

  function observeSection(){
    const section=document.getElementById("people");
    if(!section)return false;
    const observer=new MutationObserver(()=>scheduleAlign());
    observer.observe(section,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    scheduleAlign();
    return true;
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{
      if(!observeSection()){
        const bodyObserver=new MutationObserver(()=>{if(observeSection())bodyObserver.disconnect();});
        bodyObserver.observe(document.body,{childList:true,subtree:true});
      }
    },{once:true});
  }else if(!observeSection()){
    const bodyObserver=new MutationObserver(()=>{if(observeSection())bodyObserver.disconnect();});
    bodyObserver.observe(document.body,{childList:true,subtree:true});
  }

  window.addEventListener("work-027-stable-ready",scheduleAlign);
  window.addEventListener("work-027-cases-ready",scheduleAlign);
})();
