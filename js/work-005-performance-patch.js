/* 005《虞恭公温彦博碑》性能修复。
 * 1. 只节流栏目三自身带 review_v2 参数的逐页坐标请求，不拦截栏目一。
 * 2. 栏目二和栏目三文字先完成显示，不再等待55页红框全部匹配。
 * 3. 红框匹配在后台结束后，自动刷新当前案例的局部拓片。
 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_PERFORMANCE_PATCH_V1__)return;
  window.__WORK_005_PERFORMANCE_PATCH_V1__=true;

  /* 仅匹配栏目三脚本自己的请求参数，栏目一读取同一路径时不会进入此队列。 */
  const nativeFetch=window.fetch.bind(window);
  const queue=[];
  let running=0;
  const MAX_CONCURRENT=2;
  const urlOf=input=>typeof input==="string"?input:String(input?.url||"");
  const isDamageCoordinate=url=>/data\/glyph_boxes\/iiif\/005\/page_\d+\.json\?[^#]*\bv=20260720_review_v2\b/i.test(url);

  function pump(){
    while(running<MAX_CONCURRENT&&queue.length){
      const job=queue.shift();
      running+=1;
      nativeFetch(job.input,job.init)
        .then(job.resolve,job.reject)
        .finally(()=>{running-=1;pump();});
    }
  }

  window.fetch=function(input,init){
    const url=urlOf(input);
    if(!isDamageCoordinate(url))return nativeFetch(input,init);
    return new Promise((resolve,reject)=>{
      queue.push({input,init,resolve,reject});
      pump();
    });
  };

  /*
   * work-005-yugonggong-all-v2.js 的初始化末尾使用：
   * Promise.all([renderTranscript(cases), resolveLocations(cases)])。
   * 内层坐标工作池是8个 Promise，因此这里只接管长度恰为2的外层等待一次。
   */
  const nativeAll=Promise.all.bind(Promise);
  let outerReleased=false;
  Promise.all=function(iterable){
    const values=Array.from(iterable||[]);
    if(!outerReleased&&values.length===2&&values.every(value=>value&&typeof value.then==="function")){
      outerReleased=true;
      Promise.all=nativeAll;
      const transcriptPromise=values[0];
      const locationPromise=values[1];

      locationPromise.then(()=>{
        window.dispatchEvent(new CustomEvent("work-005-locations-ready"));
        setTimeout(()=>{
          const active=document.querySelector("#people .damage-tab.active");
          if(active instanceof HTMLElement)active.click();
        },0);
      }).catch(error=>console.error("[work-005-performance] 红框后台匹配失败",error));

      return nativeAll([transcriptPromise]);
    }
    return nativeAll(values);
  };

  /* 防止异常情况下影响页面内后续 Promise.all。 */
  setTimeout(()=>{
    if(Promise.all!==nativeAll)Promise.all=nativeAll;
  },5000);
})();