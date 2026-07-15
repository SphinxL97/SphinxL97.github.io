/* 众智释读三个独立表单的接收地址。
 * 当前使用 Web3Forms，将三类意见发送到同一个接收邮箱，
 * 再通过邮件标题区分不同提交类型。
 * Access Key 是 Web3Forms 提供的前端公开表单标识，不是邮箱密码或授权码。
 */
const WEB3FORMS_ENDPOINT="https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY="4b0dcc79-378a-4994-80e5-f1ea7b6f82d3";
window.FORM_ENDPOINTS=Object.freeze({
  transcription:WEB3FORMS_ENDPOINT,
  punctuation:WEB3FORMS_ENDPOINT,
  missingText:WEB3FORMS_ENDPOINT
});

/*
 * Web3Forms 适配层：只处理发送到 api.web3forms.com/submit 的请求。
 * 现有众智释读模块仍可继续使用 FormData 和原有提交按钮；
 * 本适配层会在发送前转换为 Web3Forms 官方 AJAX JSON 格式。
 */
(function installWeb3FormsAdapter(){
  "use strict";
  if(window.__CROWDSOURCE_WEB3FORMS_ADAPTER__) return;
  window.__CROWDSOURCE_WEB3FORMS_ADAPTER__=true;

  const nativeFetch=window.fetch.bind(window);
  const subjectMap={
    transcription:"【众智释读·释文校订】",
    punctuation:"【众智释读·标点校订】",
    missingText:"【众智释读·缺字补录】"
  };

  function isWeb3FormsRequest(input){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    return /^https:\/\/api\.web3forms\.com\/submit(?:[?#].*)?$/i.test(url);
  }

  function formDataToObject(data){
    const result={};
    if(!(data instanceof FormData)) return result;
    for(const [key,value] of data.entries()){
      if(typeof value!=="string") continue;
      if(Object.prototype.hasOwnProperty.call(result,key)){
        result[key]=`${result[key]}、${value}`;
      }else{
        result[key]=value;
      }
    }
    return result;
  }

  window.fetch=async function(input,init){
    if(!isWeb3FormsRequest(input)) return nativeFetch(input,init);

    const options=init?{...init}:{};
    const originalBody=options.body;
    let payload={};

    if(originalBody instanceof FormData){
      payload=formDataToObject(originalBody);
    }else if(typeof originalBody==="string"){
      try{payload=JSON.parse(originalBody)||{};}catch(_){payload={message:originalBody};}
    }else if(originalBody&&typeof originalBody==="object"){
      payload={...originalBody};
    }

    const type=String(payload.submission_type||"");
    const workTitle=String(payload.work_title||"");
    const email=String(payload.email||"");

    delete payload._gotcha;
    delete payload._honey;
    delete payload._subject;
    delete payload._template;
    delete payload._replyto;

    payload.access_key=WEB3FORMS_ACCESS_KEY;
    payload.subject=`${subjectMap[type]||"【众智释读·意见提交】"}${workTitle}`;
    payload.from_name="碑帖智能读析平台";
    payload.botcheck="";
    if(email) payload.replyto=email;

    options.method="POST";
    options.headers={
      ...(options.headers||{}),
      "Content-Type":"application/json",
      "Accept":"application/json"
    };
    options.body=JSON.stringify(payload);

    const response=await nativeFetch(input,options);
    const result=await response.clone().json().catch(()=>({}));

    if(!response.ok||result.success!==true){
      const message=result.message||result.body?.message||`HTTP ${response.status}`;
      return new Response(JSON.stringify({success:false,message}),{
        status:response.ok?422:response.status,
        statusText:response.statusText||"Web3Forms error",
        headers:{"Content-Type":"application/json"}
      });
    }

    return response;
  };

  function normalizeWeb3FormsUi(root=document){
    root.querySelectorAll(".crowd-status").forEach(status=>{
      if(status.textContent.includes("Formspree")) status.textContent=status.textContent.replaceAll("Formspree","Web3Forms");
      if(status.textContent.includes("FormSubmit")) status.textContent=status.textContent.replaceAll("FormSubmit","Web3Forms");
    });
  }

  const startObserver=()=>{
    normalizeWeb3FormsUi();
    const section=document.getElementById("places")||document.body;
    const observer=new MutationObserver(()=>normalizeWeb3FormsUi(section));
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
    script.src="assets/js/crowdsource.js?v=20260714_web3forms_v11";
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

/* 公开校订意见区：独立加载，不修改现有表单、Web3Forms 或字框逻辑。 */
(function loadCommunitySuggestions(){
  "use strict";
  if(window.__CROWDSOURCE_COMMUNITY_LOADER__) return;
  window.__CROWDSOURCE_COMMUNITY_LOADER__=true;

  const addStyle=()=>{
    if(document.querySelector('link[data-crowdsource-community]')) return;
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="assets/css/crowdsource-community.css?v=20260715_v2";
    link.dataset.crowdsourceCommunity="true";
    document.head.appendChild(link);
  };
  const addScript=(src,key,onload)=>{
    if(document.querySelector(`script[data-${key}]`)){if(onload)onload();return;}
    const script=document.createElement("script");
    script.src=src;
    script.dataset[key]="true";
    if(onload)script.addEventListener("load",onload,{once:true});
    script.addEventListener("error",()=>console.error("[community] 模块加载失败：",src));
    document.body.appendChild(script);
  };
  const start=()=>{
    addStyle();
    addScript("assets/js/community-config.js?v=20260715_v2","communityConfig",()=>{
      addScript("assets/js/crowdsource-community.js?v=20260715_v2","communityModule");
    });
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();