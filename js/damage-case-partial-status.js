/* 001—007 部分恢复状态补丁。
 * 当同一句既有已补候选又仍保留“□”时，统一显示“部分恢复 / 分项判断”，
 * 并把同一状态同步给栏目四使用的 DAMAGE_AI_CASES。
 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(!["001","002","003","004","005","006","007"].includes(workId)||window.__DAMAGE_CASE_PARTIAL_STATUS__)return;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;

  let applying=false;

  function updateCases(){
    if(applying||!Array.isArray(window.DAMAGE_AI_CASES))return false;
    let changed=false;
    applying=true;
    window.DAMAGE_AI_CASES.forEach(item=>{
      const corrected=String(item?.c??item?.corrected??"");
      const partial=corrected.includes("〔")&&corrected.includes("□");
      const unresolved=!corrected.includes("〔")&&corrected.includes("□");
      if(partial){
        if(item.mode!=="mixed"){item.mode="mixed";changed=true;}
        if(item.basis!=="部分恢复"){item.basis="部分恢复";changed=true;}
        if(item.confidence!=="分项判断"){item.confidence="分项判断";changed=true;}
      }else if(unresolved){
        if(item.mode!=="unresolved"){item.mode="unresolved";changed=true;}
        if(item.basis!=="暂未恢复"){item.basis="暂未恢复";changed=true;}
        if(item.confidence!=="暂无法判断"){item.confidence="暂无法判断";changed=true;}
      }
    });
    applying=false;
    return changed;
  }

  function patchVisiblePanel(){
    const root=document.querySelector("#people [data-integrity-v2-root]");
    if(!root)return;
    const corrected=root.querySelector(".damage-text.damage-new");
    if(!corrected)return;
    const text=corrected.textContent||"";
    const partial=Boolean(corrected.querySelector(".damage-added"))&&text.includes("□");
    const unresolved=!corrected.querySelector(".damage-added")&&text.includes("□");
    const blocks=Array.from(root.querySelectorAll(".damage-block"));
    const resultBlock=blocks.find(block=>block.querySelector(".damage-text.damage-new"));
    const resultLabel=resultBlock?.querySelector(":scope > .damage-label");
    const badge=root.querySelector(".damage-basis-badge");
    const confidence=root.querySelector(".damage-heading-confidence");

    if(partial){
      if(resultLabel&&resultLabel.textContent!=="部分恢复")resultLabel.textContent="部分恢复";
      if(badge&&badge.textContent!=="部分恢复")badge.textContent="部分恢复";
      if(confidence&&confidence.textContent!=="（分项判断）")confidence.textContent="（分项判断）";
    }else if(unresolved){
      if(resultLabel&&resultLabel.textContent!=="暂未恢复")resultLabel.textContent="暂未恢复";
      if(badge&&badge.textContent!=="暂未恢复")badge.textContent="暂未恢复";
      if(confidence&&confidence.textContent!=="（暂无法判断）")confidence.textContent="（暂无法判断）";
    }
  }

  function apply(){
    const changed=updateCases();
    patchVisiblePanel();
    if(changed){
      window.dispatchEvent(new CustomEvent("damage-case-partial-ready",{detail:{workId}}));
      window.dispatchEvent(new CustomEvent(`work-${workId}-cases-ready`,{detail:{partialStatus:true}}));
    }
  }

  window.addEventListener("damage-case-integrity-ready",()=>setTimeout(apply,0));
  ["work-001-content-ready","work-002-content-ready","work-003-content-ready","work-004-content-ready","work-005-content-ready","work-006-content-ready","work-006-cases-ready","work-007-content-ready","work-007-cases-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(apply,0)));

  const target=document.getElementById("people");
  if(target){
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;apply();});
    });
    observer.observe(target,{childList:true,subtree:true});
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    apply();
    if((Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)||tries>=60)clearInterval(timer);
  },100);
})();