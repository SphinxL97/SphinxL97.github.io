/* 第二栏目问题句加粗。
 * 仅在作品001《道因法师碑》和作品002《礼器碑并阴》中启用，
 * 将第三栏目已经展示的问题句在第二栏目原文中加粗。
 * 不改变原文文字、标点、段落或其他栏目功能。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  const TARGETS={
    "001":[
      "循堂室而濡涕，对几?而流恸。",
      "逮乎初卝，方蒙落发。",
      "沦羲□□，□□□光。"
    ],
    "002":[
      "自天王以下，至于初学，莫不?思，叹卬师镜。",
      "君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁□。",
      "相史卞吕松□远百。"
    ]
  };

  const phrases=TARGETS[parentId];
  if(!phrases||window.__TRANSCRIPT_PROBLEM_HIGHLIGHT__) return;
  window.__TRANSCRIPT_PROBLEM_HIGHLIGHT__=true;

  function highlightParagraph(paragraph){
    if(!paragraph||paragraph.dataset.problemHighlightReady==="true") return;
    const text=paragraph.textContent||"";
    const matches=[];

    phrases.forEach(phrase=>{
      let start=0;
      while(start<text.length){
        const index=text.indexOf(phrase,start);
        if(index<0) break;
        matches.push({index,end:index+phrase.length,phrase});
        start=index+phrase.length;
      }
    });

    if(!matches.length) return;
    matches.sort((a,b)=>a.index-b.index||b.end-a.end);

    const accepted=[];
    let cursor=-1;
    matches.forEach(match=>{
      if(match.index>=cursor){
        accepted.push(match);
        cursor=match.end;
      }
    });

    const fragment=document.createDocumentFragment();
    let offset=0;
    accepted.forEach(match=>{
      if(match.index>offset) fragment.appendChild(document.createTextNode(text.slice(offset,match.index)));
      const strong=document.createElement("strong");
      strong.className="transcript-problem-sentence";
      strong.textContent=text.slice(match.index,match.end);
      fragment.appendChild(strong);
      offset=match.end;
    });
    if(offset<text.length) fragment.appendChild(document.createTextNode(text.slice(offset)));

    paragraph.replaceChildren(fragment);
    paragraph.dataset.problemHighlightReady="true";
  }

  function apply(){
    const body=document.querySelector("#calligraphy .full-transcript-body");
    if(!body) return false;
    body.querySelectorAll("p").forEach(highlightParagraph);
    return true;
  }

  function start(){
    apply();
    const section=document.getElementById("calligraphy")||document.body;
    const observer=new MutationObserver(()=>apply());
    observer.observe(section,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),8000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
