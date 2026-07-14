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
  let selectedToggleTimer=0;

  function moduleReady(){
    return Boolean(window.__CROWDSOURCE_WORKBENCH_V4__&&document.querySelector('#places[data-crowdsource-ready="true"]'));
  }

  function retryLoad(){
    if(moduleReady()||retryStarted) return;
    retryStarted=true;
    const script=document.createElement("script");
    script.src="assets/js/crowdsource.js?v=20260713_fix7";
    script.dataset.crowdsourceRetry="true";
    script.addEventListener("load",()=>{
      setTimeout(()=>{
        if(!moduleReady()) console.error("[crowdsource] 模块文件已加载，但第四栏目尚未完成初始化。");
      },120);
    });
    script.addEventListener("error",()=>console.error("[crowdsource] 众智释读模块加载失败：",script.src));
    document.body.appendChild(script);
  }

  /*
   * 已选字再次点击取消：
   * v8 会阻止在未完成当前意见时继续选择新字，但再次点击已有红框属于“取消”，
   * 不应被当作新增操作。这里在 v8 之前识别红框，并调用对应卡片的删除按钮。
   */
  function selectedBoxHit(event,imageWrap){
    const boxes=Array.from(imageWrap.querySelectorAll(".crowd-glyph-box"));
    const hits=boxes.map((box,index)=>{
      const rect=box.getBoundingClientRect();
      const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
      return inside?{index,area:Math.max(1,rect.width*rect.height)}:null;
    }).filter(Boolean).sort((a,b)=>a.area-b.area);
    return hits[0]||null;
  }

  function cardPageNumber(card){
    const text=card.querySelector(".crowd-item-meta strong")?.textContent||"";
    const match=text.match(/第\s*(\d+)\s*页/);
    return match?Number(match[1]):NaN;
  }

  function removeSelectedByBoxIndex(boxIndex){
    const select=document.querySelector('#places [data-page-select]');
    const pageNo=select?Number(select.value)+1:NaN;
    if(!Number.isFinite(pageNo)) return false;

    const cards=Array.from(document.querySelectorAll('#places [data-panel="transcription"] .crowd-item')).filter(card=>{
      const title=card.querySelector(".crowd-item-meta strong")?.textContent||"";
      return !title.includes("手动新增")&&cardPageNumber(card)===pageNo;
    });
    const card=cards[boxIndex];
    const remove=card?.querySelector(".crowd-remove");
    if(!remove) return false;
    remove.click();
    return true;
  }

  function installSelectedGlyphToggle(){
    document.addEventListener("click",event=>{
      const target=event.target instanceof Element?event.target:null;
      const imageWrap=target?.closest("#places .crowd-image-wrap");
      if(!imageWrap||event.detail>1) return;
      const hit=selectedBoxHit(event,imageWrap);
      if(!hit) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clearTimeout(selectedToggleTimer);
      selectedToggleTimer=setTimeout(()=>removeSelectedByBoxIndex(hit.index),180);
    },true);

    document.addEventListener("dblclick",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest("#places .crowd-image-wrap")){
        clearTimeout(selectedToggleTimer);
        selectedToggleTimer=0;
      }
    },true);
  }

  function loadV8Enhancement(){
    if(!document.querySelector('link[data-crowdsource-v8]')){
      const link=document.createElement("link");
      link.rel="stylesheet";
      link.href="assets/css/crowdsource-v8.css?v=20260714_v8";
      link.dataset.crowdsourceV8="true";
      document.head.appendChild(link);
    }
    if(!document.querySelector('script[data-crowdsource-v8]')){
      const script=document.createElement("script");
      script.src="assets/js/crowdsource-v8.js?v=20260714_v8_toggle1";
      script.dataset.crowdsourceV8="true";
      script.addEventListener("error",()=>console.error("[crowdsource-v8] 增强模块加载失败：",script.src));
      document.body.appendChild(script);
    }
  }

  function loadV9Enhancement(){
    if(!document.querySelector('link[data-crowdsource-v9]')){
      const link=document.createElement("link");
      link.rel="stylesheet";
      link.href="assets/css/crowdsource-v9.css?v=20260714_v9";
      link.dataset.crowdsourceV9="true";
      document.head.appendChild(link);
    }
    if(!document.querySelector('script[data-crowdsource-v9]')){
      const script=document.createElement("script");
      script.src="assets/js/crowdsource-v9.js?v=20260714_v9";
      script.dataset.crowdsourceV9="true";
      script.addEventListener("error",()=>console.error("[crowdsource-v9] 缺字恢复意见模块加载失败：",script.src));
      document.body.appendChild(script);
    }
  }

  function scheduleRetry(){setTimeout(retryLoad,300);}
  function scheduleEnhancement(){setTimeout(loadV8Enhancement,380);setTimeout(loadV9Enhancement,480);}

  installSelectedGlyphToggle();

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",scheduleRetry,{once:true});
    document.addEventListener("DOMContentLoaded",scheduleEnhancement,{once:true});
  }else{
    scheduleRetry();
    scheduleEnhancement();
  }
  window.addEventListener("load",scheduleRetry,{once:true});
  window.addEventListener("load",scheduleEnhancement,{once:true});
})();