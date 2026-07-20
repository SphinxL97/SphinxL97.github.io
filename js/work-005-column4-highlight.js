/* 005《虞恭公温彦博碑》界面补丁（防循环修正版）：
 * 1. 强制将栏目二中的“麟閣□形”单独加粗；
 * 2. 接入与001—004相同的栏目四“众智释读”；
 * 3. 所有DOM写入均先比较旧值，避免MutationObserver自触发死循环。
 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_COLUMN4_HIGHLIGHT_V2__)return;
  window.__WORK_005_COLUMN4_HIGHLIGHT_V2__=true;
  window.__WORK_005_COLUMN4_HIGHLIGHT_V1__=true;

  const PHRASE="麟閣□形";
  const CROWD_TITLE="四、众智释读";
  const CROWD_INTRO="本栏目用于收集读者对碑文释文、标点整理及缺字补录的校订意见。所有提交内容将由网站管理者人工审核，不会直接修改网页或自动公开。";
  const TAB_TEXTS=[
    "释文校订（针对单字）",
    "标点校订（针对句子）",
    "缺字补录与争议（针对补字/缺字）"
  ];

  function setTextIfNeeded(node,value){
    if(!node)return false;
    if((node.textContent||"")===value)return false;
    node.textContent=value;
    return true;
  }

  function allTextNodes(root){
    const output=[];
    if(!root)return output;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue)return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest("strong.transcript-problem-sentence"))return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest("script,style"))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    let node;
    while((node=walker.nextNode()))output.push(node);
    return output;
  }

  function boldPhrase(){
    const body=document.querySelector("#calligraphy .full-transcript-body");
    if(!body)return false;
    if(Array.from(body.querySelectorAll("strong.transcript-problem-sentence")).some(node=>(node.textContent||"").includes(PHRASE)))return true;

    const paragraphs=Array.from(body.querySelectorAll("p"));
    for(const paragraph of paragraphs){
      const nodes=allTextNodes(paragraph);
      if(!nodes.length)continue;
      let combined="";
      const parts=[];
      nodes.forEach(node=>{
        const start=combined.length;
        combined+=node.nodeValue;
        parts.push({node,start,end:combined.length});
      });
      const index=combined.indexOf(PHRASE);
      if(index<0)continue;
      const endIndex=index+PHRASE.length;
      const startPart=parts.find(part=>index>=part.start&&index<part.end);
      const endPart=parts.find(part=>endIndex>part.start&&endIndex<=part.end);
      if(!startPart||!endPart)continue;
      try{
        const range=document.createRange();
        range.setStart(startPart.node,index-startPart.start);
        range.setEnd(endPart.node,endIndex-endPart.start);
        const strong=document.createElement("strong");
        strong.className="transcript-problem-sentence";
        strong.appendChild(range.extractContents());
        range.insertNode(strong);
        return true;
      }catch(error){
        console.warn("[work-005] 麟閣□形加粗失败",error);
      }
    }
    return false;
  }

  function ensureColumnFour(){
    const section=document.getElementById("places");
    if(!section)return false;

    if(!section.classList.contains("crowdsource-section"))section.classList.add("crowdsource-section");
    if(section.dataset.workId!=="005")section.dataset.workId="005";
    if(section.getAttribute("aria-label")!=="虞恭公温彦博碑众智释读")section.setAttribute("aria-label","虞恭公温彦博碑众智释读");

    setTextIfNeeded(document.querySelector(".side a:nth-of-type(4)"),CROWD_TITLE);
    setTextIfNeeded(section.querySelector(":scope > .section-title"),CROWD_TITLE);
    setTextIfNeeded(section.querySelector(":scope > .crowd-intro"),CROWD_INTRO);

    const tabs=Array.from(section.querySelectorAll(".crowd-tab"));
    if(tabs.length!==3)return section.dataset.crowdsourceReady==="true";

    tabs.forEach((button,index)=>{
      const label=button.querySelector("span:last-child");
      setTextIfNeeded(label||button,TAB_TEXTS[index]);
    });
    if(section.dataset.work005CrowdsourceStandard!=="true")section.dataset.work005CrowdsourceStandard="true";
    return true;
  }

  let observer=null;
  let scheduled=false;

  function stopWhenReady(){
    const transcriptReady=boldPhrase();
    const crowdReady=ensureColumnFour();
    if(transcriptReady&&crowdReady&&observer){
      observer.disconnect();
      observer=null;
    }
    return transcriptReady&&crowdReady;
  }

  function scheduleApply(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      stopWhenReady();
    });
  }

  function start(){
    if(stopWhenReady())return;
    window.addEventListener("work-005-transcript-ready",scheduleApply,{once:true});
    window.addEventListener("work-005-content-ready",scheduleApply,{once:true});
    const target=document.querySelector(".maincol")||document.body;
    observer=new MutationObserver(scheduleApply);
    observer.observe(target,{childList:true,subtree:true});
    setTimeout(()=>{
      scheduleApply();
      setTimeout(()=>{
        observer?.disconnect();
        observer=null;
      },100);
    },12000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();