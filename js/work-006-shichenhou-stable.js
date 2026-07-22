/* 006《史晨后碑》稳定专属入口：统一启动远程图片、栏目二、栏目三与栏目四。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(id!=="006"||window.__WORK_006_STABLE_BOOTSTRAP__)return;
  window.__WORK_006_STABLE_BOOTSTRAP__=true;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function loadScript(src,ready){
    return new Promise((resolve,reject)=>{
      if(ready?.()){resolve(true);return;}
      const path=src.split("?")[0];
      let script=Array.from(document.scripts).find(node=>(node.getAttribute("src")||"").split("?")[0].endsWith(path));
      if(script){
        let tries=0;
        const timer=setInterval(()=>{
          tries+=1;
          if(ready?.()){clearInterval(timer);resolve(true);}
          else if(tries>=160){clearInterval(timer);reject(new Error(`等待模块超时：${path}`));}
        },50);
        return;
      }
      script=document.createElement("script");
      script.src=src;
      script.async=false;
      script.onload=()=>resolve(true);
      script.onerror=()=>reject(new Error(`模块加载失败：${src}`));
      document.head.appendChild(script);
    });
  }

  async function waitReady(test,label,limit=240){
    for(let i=0;i<limit;i+=1){
      if(test())return true;
      await sleep(50);
    }
    throw new Error(`${label}初始化超时`);
  }

  function showError(error){
    console.error("[work-006-stable]",error);
    const node=document.querySelector("#people .full-transcript-loading")||document.getElementById("people");
    if(node)node.textContent="《史晨后碑》专属内容加载失败，请刷新页面后重试。";
  }

  async function start(){
    try{
      await loadScript("js/work-remote-image-adapter.js?v=20260722_remote_v2",()=>Boolean(window.__WORK_REMOTE_IMAGE_ADAPTER__));
      await loadScript("js/work-006-dedicated-config.js?v=20260722_shichenhou_v5",()=>Boolean(window.__WORK_006_DEDICATED_CONFIG__));
      await loadScript("js/work-dedicated-renderer.js?v=20260722_dedicated_v3",()=>Boolean(window.__WORK_006_CONTENT_READY__));
      await waitReady(()=>Boolean(window.__WORK_006_CONTENT_READY__),"史晨后碑栏目二、三");

      /* 专属渲染器为了阻止旧补丁会暂时锁住栏目四增强器，此处在案例数据就绪后再释放。 */
      window.__CROWDSOURCE_MISSING_V10__=false;
      await loadScript("assets/js/crowdsource-v9.js?v=20260722_shichenhou_v5",()=>Boolean(window.__CROWDSOURCE_MISSING_V10__));
      await waitReady(()=>Boolean(window.__CROWDSOURCE_MISSING_V10__),"史晨后碑栏目四");

      window.__WORK_006_STABLE_READY__=true;
      window.dispatchEvent(new CustomEvent("work-006-stable-ready",{detail:{cases:Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES.length:0}}));
    }catch(error){showError(error);}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();