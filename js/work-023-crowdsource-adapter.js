/* 023《圭峰定慧禅师碑》栏目四案例同步适配器。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="023"||window.__WORK_023_CROWDSOURCE_ADAPTER__)return;

  const CACHE_TAG="20260724_guifeng_crowd_v1";
  const STYLE_PATH="assets/css/crowdsource-v9.css";
  const SCRIPT_PATH="assets/js/crowdsource-v9.js";
  let starting=false;

  function normalizeCases(){
    const source=Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES:[];
    if(!source.length)return false;
    window.DAMAGE_AI_CASES=source.map((item,index)=>({
      ...item,
      crowdsourceCategory:String(item?.category||item?.n||"残损碑文恢复"),
      n:"残损碑文恢复",
      t:String(item?.title||item?.t||`第${index+1}处残损`),
      o:String(item?.original||item?.o||""),
      c:String(item?.corrected||item?.c||item?.original||item?.o||""),
      page:item?.page||item?.locations?.[0]?.page||"—"
    }));
    window.dispatchEvent(new CustomEvent("work-023-crowdsource-cases-ready",{detail:{count:window.DAMAGE_AI_CASES.length}}));
    return true;
  }

  function ensureStyle(){
    const existing=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(STYLE_PATH));
    if(existing)return;
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href=`${STYLE_PATH}?v=${CACHE_TAG}`;
    link.dataset.work023CrowdsourceStyle="true";
    document.head.appendChild(link);
  }

  function waitForFlag(limit=160){
    return new Promise(resolve=>{
      if(window.__CROWDSOURCE_MISSING_V10__){resolve(true);return;}
      let tries=0;
      const timer=setInterval(()=>{
        tries+=1;
        if(window.__CROWDSOURCE_MISSING_V10__){clearInterval(timer);resolve(true);}
        else if(tries>=limit){clearInterval(timer);resolve(false);}
      },50);
    });
  }

  async function ensureScript(){
    if(window.__CROWDSOURCE_MISSING_V10__)return true;
    const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(SCRIPT_PATH));
    if(existing)return waitForFlag();
    const script=document.createElement("script");
    script.src=`${SCRIPT_PATH}?v=${CACHE_TAG}`;
    script.async=false;
    script.dataset.work023CrowdsourceAdapter="true";
    const loaded=new Promise(resolve=>{
      script.addEventListener("load",()=>resolve(true),{once:true});
      script.addEventListener("error",()=>resolve(false),{once:true});
    });
    document.head.appendChild(script);
    if(!(await loaded))return false;
    return waitForFlag();
  }

  async function start(){
    if(starting||window.__WORK_023_CROWDSOURCE_ADAPTER__)return;
    starting=true;
    try{
      for(let i=0;i<160&&!normalizeCases();i+=1)await new Promise(resolve=>setTimeout(resolve,50));
      if(!normalizeCases())throw new Error("023栏目四未取得案例数据");
      ensureStyle();
      if(!(await ensureScript()))throw new Error("栏目四案例切换脚本加载失败");
      window.__WORK_023_CROWDSOURCE_ADAPTER__=true;
      window.dispatchEvent(new CustomEvent("work-023-crowdsource-adapter-ready",{detail:{count:window.DAMAGE_AI_CASES.length}}));
    }catch(error){
      console.error("[work-023-crowdsource-adapter]",error);
    }finally{
      starting=false;
    }
  }

  window.addEventListener("work-023-cases-ready",()=>{
    normalizeCases();
    if(!window.__WORK_023_CROWDSOURCE_ADAPTER__)start();
  });

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
