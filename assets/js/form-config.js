/* 众智释读三个独立表单的接收地址。
 * 当前使用 FormSubmit AJAX，将三类意见发送到同一个测试邮箱，
 * 再通过邮件标题区分不同提交类型。
 * 不要在本文件中填写邮箱密码、SMTP 密码或授权码。
 */
const FORM_SUBMIT_ENDPOINT="https://formsubmit.co/ajax/ceshiyouxiangSPX@163.com";
window.FORM_ENDPOINTS=Object.freeze({
  transcription:FORM_SUBMIT_ENDPOINT,
  punctuation:FORM_SUBMIT_ENDPOINT,
  missingText:FORM_SUBMIT_ENDPOINT
});

/*
 * FormSubmit 适配层：只处理发送到 formsubmit.co/ajax/ 的请求，
 * 不影响碑帖图片、坐标、释文和其他网络请求。
 */
(function installFormSubmitAdapter(){
  "use strict";
  if(window.__CROWDSOURCE_FORMSUBMIT_ADAPTER__) return;
  window.__CROWDSOURCE_FORMSUBMIT_ADAPTER__=true;

  const nativeFetch=window.fetch.bind(window);
  const subjectMap={
    transcription:"【众智释读·释文校订】",
    punctuation:"【众智释读·标点校订】",
    missingText:"【众智释读·缺字补录】"
  };

  function isFormSubmitRequest(input){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    return /^https:\/\/formsubmit\.co\/ajax\//i.test(url);
  }

  function showFormSubmitNotice(){
    let notice=document.getElementById("formSubmitActivationNotice");
    if(!notice){
      notice=document.createElement("div");
      notice.id="formSubmitActivationNotice";
      notice.setAttribute("role","status");
      Object.assign(notice.style,{
        position:"fixed",left:"50%",bottom:"28px",zIndex:"3200",
        transform:"translateX(-50%)",maxWidth:"min(720px,calc(100vw - 32px))",
        padding:"12px 18px",border:"1px solid #d9bd8d",borderRadius:"14px",
        background:"#fff8e8",color:"#654b36",fontSize:"14px",lineHeight:"1.7",
        boxShadow:"0 14px 38px rgba(52,35,20,.20)",textAlign:"center"
      });
      document.body.appendChild(notice);
    }
    notice.textContent="请求已发送。若这是该邮箱首次使用 FormSubmit，请前往 163 邮箱完成确认；确认后再提交一次测试内容。";
    notice.hidden=false;
    clearTimeout(notice._hideTimer);
    notice._hideTimer=setTimeout(()=>{notice.hidden=true;},9000);
  }

  window.fetch=async function(input,init){
    if(!isFormSubmitRequest(input)) return nativeFetch(input,init);

    const options=init?{...init}:{};
    const data=options.body;
    if(data instanceof FormData){
      const type=String(data.get("submission_type")||"");
      const workTitle=String(data.get("work_title")||"");
      const email=String(data.get("email")||"");
      data.set("_subject",`${subjectMap[type]||"【众智释读·意见提交】"}${workTitle}`);
      data.set("_template","table");
      data.set("_replyto",email);
      data.set("_honey","");
      data.delete("_gotcha");
    }

    options.headers={...(options.headers||{}),Accept:"application/json"};
    const response=await nativeFetch(input,options);
    const result=await response.clone().json().catch(()=>({}));

    if(!response.ok||result.success===false){
      const message=result.message||`HTTP ${response.status}`;
      return new Response(JSON.stringify({success:false,message}),{
        status:response.ok?422:response.status,
        statusText:response.statusText||"FormSubmit error",
        headers:{"Content-Type":"application/json"}
      });
    }

    setTimeout(showFormSubmitNotice,260);
    return response;
  };

  function normalizeFormSubmitUi(root=document){
    root.querySelectorAll('input[name="_gotcha"]').forEach(input=>{input.name="_honey";});
    root.querySelectorAll(".crowd-status").forEach(status=>{
      if(status.textContent.includes("Formspree")) status.textContent=status.textContent.replaceAll("Formspree","FormSubmit");
    });
  }

  const startObserver=()=>{
    normalizeFormSubmitUi();
    const section=document.getElementById("places")||document.body;
    const observer=new MutationObserver(()=>normalizeFormSubmitUi(section));
    observer.observe(section,{childList:true,subtree:true,characterData:true});
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",startObserver,{once:true});
  else startObserver();
})();

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
    script.src="assets/js/crowdsource.js?v=20260714_formsubmit_v10";
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