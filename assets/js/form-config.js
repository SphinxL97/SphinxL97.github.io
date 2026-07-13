/* 众智释读三个独立表单的 Formspree 地址。
 * 后续仅需把空字符串替换为对应的 Formspree endpoint。
 * 不要在本文件中填写邮箱密码、SMTP 密码或授权码。
 */
window.FORM_ENDPOINTS=Object.freeze({
  transcription:"",
  punctuation:"",
  missingText:""
});

/*
 * 兜底加载：若浏览器或 GitHub Pages 缓存导致主模块没有执行，
 * 自动使用新的版本参数重新加载一次。只负责加载，不修改碑帖数据。
 */
(function(){
  "use strict";
  let retryStarted=false;

  function moduleReady(){
    return Boolean(document.querySelector("#places .crowd-shell"));
  }

  function retryLoad(){
    if(moduleReady()||retryStarted) return;
    retryStarted=true;
    const script=document.createElement("script");
    script.src="assets/js/crowdsource.js?v=20260713_fix2";
    script.dataset.crowdsourceRetry="true";
    script.addEventListener("load",()=>{
      setTimeout(()=>{
        if(!moduleReady()){
          console.error("[crowdsource] 模块文件已加载，但第四栏目尚未完成初始化。");
        }
      },100);
    });
    script.addEventListener("error",()=>{
      console.error("[crowdsource] 众智释读模块加载失败：",script.src);
    });
    document.body.appendChild(script);
  }

  function scheduleRetry(){
    setTimeout(retryLoad,250);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",scheduleRetry,{once:true});
  }else{
    scheduleRetry();
  }
  window.addEventListener("load",scheduleRetry,{once:true});
})();