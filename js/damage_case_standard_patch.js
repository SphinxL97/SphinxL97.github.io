/*
 * 栏目三统一规范：
 * 1. 案例类别固定为“古字识别 / 形近字纠错 / 残损碑文恢复”；
 * 2. AI补入或改正的文字统一使用〔〕并高亮；
 * 3. 适用于现有及后续沿用 damage-* 结构的碑帖栏目三。
 */
(function(){
  "use strict";
  if(window.__DAMAGE_CASE_STANDARD_PATCH_V1__) return;
  window.__DAMAGE_CASE_STANDARD_PATCH_V1__=true;

  const CATEGORIES=Object.freeze(["古字识别","形近字纠错","残损碑文恢复"]);
  window.DAMAGE_CASE_CATEGORIES=CATEGORIES;

  const esc=value=>String(value==null?"":value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

  const clean=value=>String(value==null?"":value).trim();
  const stripGuessPrefix=value=>clean(value).replace(/^AI\s*推测为\s*[:：]\s*/i,"");
  const stripMarks=value=>String(value==null?"":value).replace(/〔([^〕]*)〕/g,"$1");

  function categoryOf(value){
    const text=clean(value);
    if(CATEGORIES.includes(text)) return text;
    if(/古字|生僻字|古文字|异体字/.test(text)) return "古字识别";
    if(/形近|纠错|误识|误读|校正/.test(text)) return "形近字纠错";
    return "残损碑文恢复";
  }

  function titleDetail(value,fallback){
    const text=clean(value);
    const separator=text.match(/——|—{2,}|--/);
    if(separator){
      const index=text.indexOf(separator[0]);
      const detail=clean(text.slice(index+separator[0].length));
      if(detail) return detail;
    }
    const reduced=clean(text.replace(/^(古字识别|形近字纠错|残损碑文恢复|历史人物识别|缺字推测|AI暂拟补释|整句残损恢复|整句缺字待考|整句补释|AI暂拟|缺字待考)[：:\s-]*/,""));
    return reduced||fallback||"案例";
  }

  function markedTextHtml(value){
    const text=String(value==null?"":value);
    let html="";
    let cursor=0;
    const segments=[];
    const pattern=/〔([^〕]*)〕/g;
    let match;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(cursor,match.index));
      const added=match[1];
      segments.push(added);
      html+=`<span class="damage-added">〔${esc(added)}〕</span>`;
      cursor=match.index+match[0].length;
    }
    html+=esc(text.slice(cursor));
    return {html,plain:text,segments,base:stripMarks(text)};
  }

  function lcsMarkedHtml(originalValue,correctedValue){
    const original=Array.from(stripMarks(originalValue));
    const correctedText=stripGuessPrefix(correctedValue);
    if(/〔[^〕]*〕/.test(correctedText)) return markedTextHtml(correctedText);

    const corrected=Array.from(correctedText);
    const n=original.length;
    const m=corrected.length;
    const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
    const equal=(a,b)=>a===b&&!/[□?]/.test(a);

    for(let i=n-1;i>=0;i-=1){
      for(let j=m-1;j>=0;j-=1){
        dp[i][j]=equal(original[i],corrected[j])
          ? 1+dp[i+1][j+1]
          : Math.max(dp[i+1][j],dp[i][j+1]);
      }
    }

    const matched=new Set();
    let i=0,j=0;
    while(i<n&&j<m){
      if(equal(original[i],corrected[j])&&dp[i][j]===1+dp[i+1][j+1]){
        matched.add(j);
        i+=1;
        j+=1;
      }else if(dp[i+1][j]>=dp[i][j+1]){
        i+=1;
      }else{
        j+=1;
      }
    }

    let html="";
    let plain="";
    const segments=[];
    for(let index=0;index<m;){
      if(matched.has(index)){
        html+=esc(corrected[index]);
        plain+=corrected[index];
        index+=1;
        continue;
      }
      let end=index+1;
      while(end<m&&!matched.has(end)) end+=1;
      const added=corrected.slice(index,end).join("");
      segments.push(added);
      html+=`<span class="damage-added">〔${esc(added)}〕</span>`;
      plain+=`〔${added}〕`;
      index=end;
    }

    return {html,plain,segments,base:correctedText};
  }

  function markSegmentsInContext(contextValue,formatted){
    const context=String(contextValue==null?"":contextValue);
    if(/〔[^〕]*〕/.test(context)) return markedTextHtml(context).html;

    const correctedBase=formatted.base;
    if(correctedBase&&context.includes(correctedBase)){
      const index=context.indexOf(correctedBase);
      return esc(context.slice(0,index))+formatted.html+esc(context.slice(index+correctedBase.length));
    }

    let html="";
    let cursor=0;
    formatted.segments.forEach(segment=>{
      if(!segment) return;
      const index=context.indexOf(segment,cursor);
      if(index<0) return;
      html+=esc(context.slice(cursor,index));
      html+=`<span class="damage-added">〔${esc(segment)}〕</span>`;
      cursor=index+segment.length;
    });
    html+=esc(context.slice(cursor));
    return html;
  }

  function ensureStyle(){
    if(document.getElementById("damage-case-standard-style")) return;
    const style=document.createElement("style");
    style.id="damage-case-standard-style";
    style.textContent=`
      .damage-text.damage-new{color:#2e251e!important;font-weight:400!important;}
      .damage-added{
        display:inline;
        margin:0 .05em;
        padding:0 .12em;
        border-radius:4px;
        border-bottom:2px solid #a53529;
        background:#f8e1cf;
        color:#9f3025!important;
        font-weight:900!important;
        white-space:nowrap;
      }
      .damage-restored .damage-added{background:#fff0df;}
    `;
    document.head.appendChild(style);
  }

  let applying=false;
  let scheduled=false;
  let observer=null;

  function normalizeSection(){
    if(applying) return;
    const section=document.getElementById("people");
    if(!section||!section.classList.contains("damage-ai")) return;
    applying=true;

    try{
      const tabs=Array.from(section.querySelectorAll(".damage-tab"));
      tabs.forEach(tab=>{
        const name=tab.querySelector(".name");
        if(!name) return;
        if(!name.dataset.originalCaseLabel) name.dataset.originalCaseLabel=clean(name.textContent);
        const category=categoryOf(name.dataset.originalCaseLabel);
        name.dataset.standardCategory=category;
        if(name.textContent!==category) name.textContent=category;
      });

      const active=section.querySelector(".damage-tab.active")||tabs[0];
      const activeName=active?.querySelector(".name");
      const activeCategory=categoryOf(activeName?.dataset.originalCaseLabel||activeName?.textContent);
      const caseNo=clean(active?.querySelector("b")?.textContent);
      const heading=section.querySelector(".damage-heading");
      if(heading){
        if(!heading.dataset.originalCaseHeading) heading.dataset.originalCaseHeading=clean(heading.textContent);
        const detail=titleDetail(heading.dataset.originalCaseHeading,caseNo?`案例 ${caseNo}`:"案例");
        const standardized=`${activeCategory}——${detail}`;
        if(heading.textContent!==standardized) heading.textContent=standardized;
      }

      const original=section.querySelector(".damage-flow .damage-text:not(.damage-new)");
      const corrected=section.querySelector(".damage-flow .damage-text.damage-new");
      const restored=section.querySelector(".damage-flow .damage-restored");
      if(original&&corrected){
        if(!original.dataset.standardRawText) original.dataset.standardRawText=clean(original.textContent);
        if(!corrected.dataset.standardRawText) corrected.dataset.standardRawText=clean(corrected.textContent);
        const formatted=lcsMarkedHtml(original.dataset.standardRawText,corrected.dataset.standardRawText);
        if(corrected.innerHTML!==formatted.html) corrected.innerHTML=formatted.html;
        corrected.setAttribute("aria-label",formatted.plain);

        if(restored){
          if(!restored.dataset.standardRawText) restored.dataset.standardRawText=clean(restored.textContent);
          const restoredHtml=markSegmentsInContext(restored.dataset.standardRawText,formatted);
          if(restored.innerHTML!==restoredHtml) restored.innerHTML=restoredHtml;
        }
      }
    }finally{
      applying=false;
    }
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      normalizeSection();
    });
  }

  function start(){
    ensureStyle();
    const section=document.getElementById("people");
    if(!section){
      setTimeout(start,80);
      return;
    }
    if(observer) observer.disconnect();
    observer=new MutationObserver(schedule);
    observer.observe(section,{childList:true,subtree:true,characterData:true});
    schedule();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
