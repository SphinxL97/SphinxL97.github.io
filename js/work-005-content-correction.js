/* 作品005文案修正：栏目二只保留原缺字符号，不再使用“阙文”表述。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_CONTENT_CORRECTION_V1__)return;
  window.__WORK_005_CONTENT_CORRECTION_V1__=true;

  try{localStorage.removeItem("work005-yugonggong-case-locations-v1");}catch(_){}

  function correctCaseData(){
    if(!Array.isArray(window.DAMAGE_AI_CASES))return;
    window.DAMAGE_AI_CASES.forEach(item=>{
      if(typeof item.usageNote==="string")item.usageNote=item.usageNote.replace(/原缺字或阙文/g,"原缺字").replace(/或阙文/g,"");
    });
  }

  function replaceText(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const next=String(node.nodeValue||"").replace(/原缺字或阙文/g,"原缺字").replace(/缺字或阙文/g,"缺字");
      if(next!==node.nodeValue)node.nodeValue=next;
    });
  }

  function apply(){
    correctCaseData();
    const section=document.getElementById("people");
    if(section)replaceText(section);
  }

  const start=()=>{
    apply();
    const section=document.getElementById("people");
    if(section)new MutationObserver(apply).observe(section,{childList:true,subtree:true,characterData:true});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  window.addEventListener("work-005-content-ready",apply);
})();