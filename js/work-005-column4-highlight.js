/* 005《虞恭公温彦博碑》最终界面补丁：
 * 1. 强制将栏目二中的“麟閣□形”单独加粗；
 * 2. 明确接入与001—004相同的栏目四“众智释读”共享模块。
 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_COLUMN4_HIGHLIGHT_V1__)return;
  window.__WORK_005_COLUMN4_HIGHLIGHT_V1__=true;

  const PHRASE="麟閣□形";
  const CROWD_TITLE="四、众智释读";
  const CROWD_INTRO="本栏目用于收集读者对碑文释文、标点整理及缺字补录的校订意见。所有提交内容将由网站管理者人工审核，不会直接修改网页或自动公开。";
  const TAB_TEXTS=[
    "释文校订（针对单字）",
    "标点校订（针对句子）",
    "缺字补录与争议（针对补字/缺字）"
  ];

  function allTextNodes(root){
    const output=[];
    if(!root)return output;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue)return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest("strong.transcript-problem-sentence"))return NodeFilter.FILTER_REJECT;
      if(node.parentElement?.closest("script,style"))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    let node;while((node=walker.nextNode()))output.push(node);
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
      let combined="";const parts=[];
      nodes.forEach(node=>{const start=combined.length;combined+=node.nodeValue;parts.push({node,start,end:combined.length});});
      const index=combined.indexOf(PHRASE);if(index<0)continue;
      const endIndex=index+PHRASE.length;
      const startPart=parts.find(part=>index>=part.start&&index<part.end);
      const endPart=parts.find(part=>endIndex>part.start&&endIndex<=part.end);
      if(!startPart||!endPart)continue;
      try{
        const range=document.createRange();
        range.setStart(startPart.node,index-startPart.start);
        range.setEnd(endPart.node,endIndex-endPart.start);
        const strong=document.createElement("strong");strong.className="transcript-problem-sentence";
        strong.appendChild(range.extractContents());range.insertNode(strong);
        return true;
      }catch(error){console.warn("[work-005] 麟閣□形加粗失败",error);}
    }
    return false;
  }

  function ensureColumnFour(){
    const section=document.getElementById("places");
    if(!section)return false;
    section.classList.add("crowdsource-section");
    section.dataset.workId="005";
    section.setAttribute("aria-label","虞恭公温彦博碑众智释读");

    const fourthLink=document.querySelector(".side a:nth-of-type(4)");
    if(fourthLink)fourthLink.textContent=CROWD_TITLE;

    const title=section.querySelector(":scope > .section-title");
    if(title)title.textContent=CROWD_TITLE;
    const intro=section.querySelector(":scope > .crowd-intro");
    if(intro)intro.textContent=CROWD_INTRO;

    const tabs=Array.from(section.querySelectorAll(".crowd-tab"));
    if(tabs.length===3){
      tabs.forEach((button,index)=>{
        const label=button.querySelector("span:last-child");
        if(label)label.textContent=TAB_TEXTS[index];
        else button.textContent=TAB_TEXTS[index];
      });
      section.dataset.work005CrowdsourceStandard="true";
      return true;
    }
    return section.dataset.crowdsourceReady==="true";
  }

  function apply(){boldPhrase();ensureColumnFour();}

  function start(){
    apply();
    window.addEventListener("work-005-transcript-ready",boldPhrase);
    window.addEventListener("work-005-content-ready",apply);
    const target=document.querySelector(".maincol")||document.body;
    const observer=new MutationObserver(apply);
    observer.observe(target,{childList:true,subtree:true,characterData:true});
    setTimeout(()=>{apply();observer.disconnect();},15000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();