/* 栏目三统一显示层：固定类别、补字高亮、案例标题、置信度与恢复依据。 */
(function(){
  "use strict";
  if(window.__DAMAGE_CASE_STANDARD_PATCH_V4__) return;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const CATEGORIES=Object.freeze(["古字识别","形近字纠错","残损碑文恢复"]);
  window.DAMAGE_CASE_CATEGORIES=CATEGORIES;
  const esc=value=>String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clean=value=>String(value==null?"":value).trim();
  const stripMarks=value=>String(value==null?"":value).replace(/〔([^〕]*)〕/g,"$1");
  const stripPrefix=value=>clean(value).replace(/^AI\s*推测为\s*[:：]\s*/i,"").replace(/^暂不恢复\s*[:：]\s*/,"");

  function categoryOf(value){
    const text=clean(value);
    if(CATEGORIES.includes(text)) return text;
    if(/古字|生僻字|异体字/.test(text)) return "古字识别";
    if(/形近|纠错|误识|误读|校正/.test(text)) return "形近字纠错";
    return "残损碑文恢复";
  }

  function marked(value){
    const text=String(value==null?"":value);
    let html="",cursor=0;
    const segments=[];
    const pattern=/〔([^〕]*)〕/g;
    let match;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(cursor,match.index));
      segments.push(match[1]);
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      cursor=match.index+match[0].length;
    }
    html+=esc(text.slice(cursor));
    return {html,plain:text,segments,base:stripMarks(text)};
  }

  function lcsMarked(originalValue,correctedValue){
    const original=Array.from(stripMarks(originalValue));
    const correctedText=stripPrefix(correctedValue);
    if(/〔[^〕]*〕/.test(correctedText)) return marked(correctedText);
    if(correctedText===String(originalValue==null?"":originalValue)) return marked(correctedText);
    const corrected=Array.from(correctedText),n=original.length,m=corrected.length;
    const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
    const equal=(a,b)=>a===b&&!/[□?]/.test(a);
    for(let i=n-1;i>=0;i--){for(let j=m-1;j>=0;j--){dp[i][j]=equal(original[i],corrected[j])?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);}}
    const matched=new Set();let i=0,j=0;
    while(i<n&&j<m){if(equal(original[i],corrected[j])&&dp[i][j]===1+dp[i+1][j+1]){matched.add(j);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
    let html="",plain="";const segments=[];
    for(let k=0;k<m;){if(matched.has(k)){html+=esc(corrected[k]);plain+=corrected[k];k++;continue;}let end=k+1;while(end<m&&!matched.has(end))end++;const added=corrected.slice(k,end).join("");segments.push(added);html+=`<span class="damage-added">〔${esc(added)}〕</span>`;plain+=`〔${added}〕`;k=end;}
    return {html,plain,segments,base:correctedText};
  }

  function contextHtml(value,formatted){
    const text=String(value==null?"":value);
    if(/〔[^〕]*〕/.test(text)) return marked(text).html;
    if(!formatted||!formatted.segments.length) return esc(text);
    if(formatted.base&&text.includes(formatted.base)){const index=text.indexOf(formatted.base);return esc(text.slice(0,index))+formatted.html+esc(text.slice(index+formatted.base.length));}
    return esc(text);
  }

  function activeRecord(active){
    const index=Number(active?.dataset.caseIndex);
    return Array.isArray(window.DAMAGE_AI_CASES)&&Number.isInteger(index)?window.DAMAGE_AI_CASES[index]||null:null;
  }

  function normalizeConfidence(value){
    const text=clean(value).replace(/^建议置信度\s*[:：]\s*/,"").replace(/[（）()]/g,"").replace(/置信度$/,"");
    if(!text)return "";
    if(/暂无法判断|无法判断|待考/.test(text))return "暂无法判断";
    return `${text}置信度`;
  }

  function subjectOf(record,formatted,caseNo){
    const raw=clean(record?.s||record?.t||"").replace(/^(古字识别|形近字纠错|残损碑文恢复|整句残损恢复|整句缺字待考|AI暂拟补释|缺字推测)[—－:：\s]*/,"");
    if(raw&&!/^第?0*\d+处/.test(raw))return raw;
    const changed=(formatted?.segments||[]).map(x=>clean(x)).filter(Boolean).slice(0,4).join("、");
    return changed?`“${changed}”`:`第${String(caseNo||"1").replace(/^0+/,"")||"1"}处`;
  }

  function setResultLabel(section,record){
    const corrected=section.querySelector(".damage-flow .damage-text.damage-new");
    const label=corrected?.closest(".damage-block")?.querySelector(".damage-label");
    if(!label)return;
    const text=record?.basisMode==="documentary"?"文献对校结果":record?.basisMode==="ai_provisional"?"AI暂拟补全":"修正结果（AI识别）";
    if(label.textContent!==text)label.textContent=text;
  }

  function ensureBasis(section,record){
    const flow=section.querySelector(".damage-flow");if(!flow)return;
    let block=flow.querySelector(".damage-basis-block");
    if(!block){block=document.createElement("div");block.className="damage-block damage-basis-block";const evidence=flow.querySelector(".damage-evidence-block");if(evidence)flow.insertBefore(block,evidence);else flow.appendChild(block);}
    const type=clean(record?.recoveryBasisType||"证据状态");
    const source=clean(record?.sourceFinding||record?.recoveryBasis||"本例尚未完成独立证据审核。");
    const proposal=clean(record?.aiProposal||record?.c||"");
    const usage=clean(record?.usageNote||"");
    const mode=record?.basisMode||"unknown";
    const signature=[mode,type,source,proposal,usage].join("\u0001");if(block.dataset.signature===signature)return;block.dataset.signature=signature;
    let body=`<p><strong>资料查证结果：</strong>${esc(source)}</p>`;
    if(mode==="ai_provisional"){
      body+=`<p><strong>AI暂拟补全：</strong>${esc(proposal)}</p>`;
      body+=`<p><strong>使用提示：</strong>${esc(usage||"本候选仅供辅助讨论，栏目二继续保留原缺字。")}</p>`;
    }else if(mode==="documentary"){
      body+=`<p><strong>校勘说明：</strong>${esc(usage||"本例依据可核验资料校勘。")}</p>`;
    }
    block.innerHTML=`<span class="damage-label">恢复依据</span><div class="damage-basis"><span class="damage-basis-type">${esc(type)}</span>${body}</div>`;
  }

  function updateEvidence(section,record){
    const list=section.querySelector(".damage-evidence ol");
    if(list&&Array.isArray(record?.e)){const html=record.e.map(item=>`<li>${esc(item)}</li>`).join("");if(list.innerHTML!==html)list.innerHTML=html;}
    Array.from(section.querySelectorAll(".damage-evidence p")).forEach(p=>{if(clean(p.textContent).includes("置信度")&&record?.confidence)p.innerHTML=`<strong>建议置信度：</strong>${esc(record.confidence)}`;});
  }

  function ensureStyle(){
    if(document.getElementById("damage-case-standard-style"))return;
    const style=document.createElement("style");style.id="damage-case-standard-style";style.textContent=`
      .damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{display:inline;margin:0 .05em;padding:0 .12em;border-radius:4px;border-bottom:2px solid #a53529;background:#f8e1cf;color:#9f3025!important;font-weight:900!important;white-space:nowrap}.damage-restored .damage-added{background:#fff0df}.damage-heading{display:flex;align-items:baseline;flex-wrap:wrap;gap:.45em;min-width:0}.damage-heading-title{font-weight:900;color:#3a3028}.damage-heading-confidence{color:#5f5041;font-size:.82em;font-weight:800;white-space:nowrap}.damage-basis{margin-top:8px;padding:12px 14px;border:1px solid #dfc79b;border-radius:12px;background:#fff8e8;color:#51443a;line-height:1.8}.damage-basis p{margin:8px 0 0}.damage-basis strong{color:#5a4638}.damage-basis-type{display:inline-block;padding:2px 9px;border-radius:999px;background:#8d7747;color:#fff;font-size:12px;font-weight:800}`;document.head.appendChild(style);
  }

  let applying=false,scheduled=false,observer=null;
  function normalize(){
    if(applying)return;const section=document.getElementById("people");if(!section||!section.classList.contains("damage-ai"))return;applying=true;
    try{
      const tabs=Array.from(section.querySelectorAll(".damage-tab"));const active=section.querySelector(".damage-tab.active")||tabs[0];const record=activeRecord(active);if(!active||!record)return;
      tabs.forEach((tab,index)=>{const name=tab.querySelector(".name");const item=Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES[index]:null;if(name&&item){const category=categoryOf(item.n);if(name.textContent!==category)name.textContent=category;}});
      const original=section.querySelector(".damage-flow .damage-text:not(.damage-new)");const corrected=section.querySelector(".damage-flow .damage-text.damage-new");const restored=section.querySelector(".damage-flow .damage-restored");let formatted=null;
      if(original&&corrected){const originalText=String(record.o??original.textContent??"");const correctedText=String(record.c??corrected.textContent??"");if(original.textContent!==originalText)original.textContent=originalText;formatted=lcsMarked(originalText,correctedText);if(corrected.innerHTML!==formatted.html)corrected.innerHTML=formatted.html;corrected.setAttribute("aria-label",formatted.plain);if(restored){const restoredText=String(record.r??restored.textContent??"");const html=contextHtml(restoredText,formatted);if(restored.innerHTML!==html)restored.innerHTML=html;}}
      const category=categoryOf(record.n);const caseNo=clean(active.querySelector("b")?.textContent||record.i||"");const heading=section.querySelector(".damage-heading");if(heading){const confidence=normalizeConfidence(record.confidence);const subject=subjectOf(record,formatted,caseNo);const html=`<span class="damage-heading-title">${esc(category)}——${esc(subject)}</span>${confidence?`<span class="damage-heading-confidence">（${esc(confidence)}）</span>`:""}`;if(heading.innerHTML!==html)heading.innerHTML=html;}
      setResultLabel(section,record);updateEvidence(section,record);ensureBasis(section,record);
    }finally{applying=false;}
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;normalize();});}
  function start(){ensureStyle();const section=document.getElementById("people");if(!section){setTimeout(start,50);return;}if(observer)observer.disconnect();observer=new MutationObserver(schedule);observer.observe(section,{childList:true,subtree:true,characterData:true});window.addEventListener("damage-case-audit-ready",schedule);schedule();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
