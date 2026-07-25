/* 024、027、028、029 栏目二统一格式：保留残损方框，含方框整句加粗。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const supported=new Set(["024","027","028","029"]);
  if(!supported.has(workId)||window.__TRANSCRIPT_FORMAT_NORMALIZER_V1__)return;
  window.__TRANSCRIPT_FORMAT_NORMALIZER_V1__=true;

  const STANDARD_NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const CLOSERS=new Set(["”","’","」","』","》","】","）",")","〕"]);
  const ENDINGS=new Set(["。","！","？","!","?","；",";"]);
  let observer=null;
  let timer=0;
  let applying=false;

  function restoreBoxes(text){
    return String(text||"").replace(/〔[^〕]*〕/g,"□");
  }

  function sentenceSegments(text){
    const value=String(text||"");
    const segments=[];
    let buffer="";
    for(let i=0;i<value.length;i+=1){
      buffer+=value[i];
      if(!ENDINGS.has(value[i]))continue;
      while(i+1<value.length&&CLOSERS.has(value[i+1])){
        i+=1;
        buffer+=value[i];
      }
      segments.push(buffer);
      buffer="";
    }
    if(buffer)segments.push(buffer);
    return segments;
  }

  function rebuildSentenceMarks(node,{restore=false}={}){
    let text=node.textContent||"";
    if(restore)text=restoreBoxes(text);
    const fragment=document.createDocumentFragment();
    sentenceSegments(text).forEach(segment=>{
      if(segment.includes("□")){
        const strong=document.createElement("strong");
        strong.className="transcript-problem-sentence";
        strong.textContent=segment;
        fragment.appendChild(strong);
      }else{
        fragment.appendChild(document.createTextNode(segment));
      }
    });
    node.replaceChildren(fragment);
  }

  function normalize024(body){
    body.querySelectorAll("h4.work024-part-title").forEach(heading=>{
      const paragraph=document.createElement("p");
      paragraph.textContent=heading.textContent||"";
      heading.replaceWith(paragraph);
    });
  }

  function normalize029(body){
    body.querySelectorAll(".work029-original-title").forEach(title=>{
      const compact=(title.textContent||"").replace(/\s+/g,"");
      if(compact==="鮮于府君墓誌銘。"||compact==="鲜于府君墓志铭。")title.remove();
    });
  }

  function ensureStyle(){
    if(document.getElementById("transcript-format-normalizer-style"))return;
    const style=document.createElement("style");
    style.id="transcript-format-normalizer-style";
    style.textContent="#calligraphy .full-transcript-body strong.transcript-problem-sentence{font-family:inherit;font-size:inherit;line-height:inherit;color:inherit;font-weight:800;background:none;text-decoration:none}#calligraphy .full-transcript-body p{color:inherit}";
    document.head.appendChild(style);
  }

  function connect(){
    const section=document.getElementById("calligraphy");
    if(!section)return;
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>{
      if(applying)return;
      clearTimeout(timer);
      timer=setTimeout(apply,40);
    });
    observer.observe(section,{childList:true,subtree:true});
  }

  function apply(){
    const section=document.getElementById("calligraphy");
    const body=section?.querySelector(".full-transcript-body");
    if(!section||!body)return;
    applying=true;
    if(observer)observer.disconnect();
    ensureStyle();

    if(workId==="024")normalize024(body);
    if(workId==="029")normalize029(body);
    if(workId==="027"||workId==="028"){
      const note=section.querySelector(".full-transcript-note");
      if(note)note.textContent=STANDARD_NOTE;
    }

    const restore=workId==="027"||workId==="028";
    body.querySelectorAll("p").forEach(paragraph=>rebuildSentenceMarks(paragraph,{restore}));
    body.querySelectorAll("h4").forEach(heading=>{
      if(restore&&/〔[^〕]*〕/.test(heading.textContent||""))rebuildSentenceMarks(heading,{restore:true});
    });
    body.dataset.transcriptFormatNormalized="20260725_v1";
    applying=false;
    connect();
  }

  function start(){
    connect();
    apply();
    setTimeout(apply,120);
    setTimeout(apply,700);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
