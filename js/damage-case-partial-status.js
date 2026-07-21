/* 001—007 栏目三状态与展示清理。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(!["001","002","003","004","005","006","007"].includes(workId)||window.__DAMAGE_CASE_PARTIAL_STATUS__)return;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;

  const fixes=[
    {
      key:"循堂室而濡涕，对几□而流恸。",
      corrected:"循堂室而濡涕，对几〔𢂀〕而流恸。",
      restored:"循堂室而濡涕，对几𢂀而流恸。",
      label:"古字识别结果",
      analysis:[
        "拓片中的这一位置并非完全空缺，仍可看到结构较复杂的字形；常规OCR未能识别，主要与该字属于Unicode扩展B区、字形生僻有关。",
        "该字可释为“𢂀”，读作fú。字书解释为束发所用的网套或包束头发之物，属于巾部生僻字。",
        "本句前文写弟子在法师去世后进入堂室而落泪；“几”指室内几案，“𢂀”可理解为法师生前使用或遗留的器物。弟子面对这些旧物而流恸，语意连贯。",
        "相关录文保存“对几𢂀而流恸”的写法，与拓片残存字形及上下文能够相互印证，因此本处恢复为“𢂀”，不再显示未知字符。"
      ]
    },
    {
      key:"沦羲□□，□□□光。",
      corrected:"沦羲〔晦曜〕，〔慧日无〕光。",
      restored:"沦羲晦曜，慧日无光。",
      label:"AI暂拟补全",
      analysis:[
        "原释文前一组有2个“□”，后一组有3个“□”；“晦曜”和“慧日无”在字数上分别与两组缺字相合，没有增加原释文未标缺的位置。",
        "“羲”可关联羲和、日光；“晦曜”表示光辉昏暗。“慧日”是佛教文献中常见的智慧光明意象，“慧日无光”可表达高僧圆寂后佛门失去光明。",
        "前后两句围绕日光、明暗构成对应关系，并处在悼念道因法师圆寂的铭文语境中，因此暂拟为“沦羲晦曜，慧日无光”。",
        "该处拓片残损较重，此恢复主要依据缺字数量、对偶结构和上下文意象提出，仍需更早拓本或权威录文继续核验。"
      ]
    }
  ];

  let applying=false;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

  function patchData(){
    if(workId!=="001"||!Array.isArray(window.DAMAGE_AI_CASES))return false;
    let changed=false;
    fixes.forEach(fix=>{
      const item=window.DAMAGE_AI_CASES.find(row=>String(row?.o??row?.original??"").includes(fix.key));
      if(!item)return;
      [["c",fix.corrected],["corrected",fix.corrected],["r",fix.restored],["restored",fix.restored]].forEach(([key,value])=>{if(item[key]!==value){item[key]=value;changed=true;}});
      if(!same(item.e,fix.analysis)){item.e=[...fix.analysis];changed=true;}
      if(!same(item.analysis,fix.analysis)){item.analysis=[...fix.analysis];changed=true;}
    });
    return changed;
  }

  function updateCases(){
    if(applying||!Array.isArray(window.DAMAGE_AI_CASES))return false;
    let changed=patchData();
    applying=true;
    window.DAMAGE_AI_CASES.forEach(item=>{
      const text=String(item?.c??item?.corrected??"");
      const partial=text.includes("〔")&&text.includes("□");
      const unresolved=!text.includes("〔")&&text.includes("□");
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

  function removeBasis(){
    document.querySelectorAll("#people .damage-basis-block").forEach(node=>node.remove());
  }

  function patchStatus(root){
    const result=root?.querySelector(".damage-text.damage-new");
    if(!result)return;
    const text=result.textContent||"";
    const added=Boolean(result.querySelector(".damage-added"));
    const label=result.closest(".damage-block")?.querySelector(":scope > .damage-label");
    const confidence=root.querySelector(".damage-heading-confidence");
    if(added&&text.includes("□")){
      if(label)label.textContent="部分恢复";
      if(confidence)confidence.textContent="（分项判断）";
    }else if(!added&&text.includes("□")){
      if(label)label.textContent="暂未恢复";
      if(confidence)confidence.textContent="（暂无法判断）";
    }
  }

  function patchFirstPanel(root){
    if(workId!=="001"||!root)return;
    const original=String(Array.from(root.querySelectorAll(".damage-text")).find(node=>!node.classList.contains("damage-new"))?.textContent||"");
    const fix=fixes.find(item=>original.includes(item.key));
    if(!fix||root.dataset.firstWorkPatch===fix.key)return;
    const result=root.querySelector(".damage-text.damage-new");
    const restored=root.querySelector(".damage-restored");
    const label=result?.closest(".damage-block")?.querySelector(":scope > .damage-label");
    const evidence=root.querySelector(".damage-evidence ol");
    if(result){
      result.innerHTML=fix.corrected.split(/(〔[^〕]+〕)/g).filter(Boolean).map(part=>part.startsWith("〔")?`<span class="damage-added">${part}</span>`:part).join("");
    }
    if(restored)restored.textContent=fix.restored;
    if(label)label.textContent=fix.label;
    if(evidence)evidence.innerHTML=fix.analysis.map(line=>`<li>${line}</li>`).join("");
    root.dataset.firstWorkPatch=fix.key;
  }

  function apply(){
    const changed=updateCases();
    removeBasis();
    const root=document.querySelector("#people [data-integrity-v2-root]");
    patchStatus(root);
    patchFirstPanel(root);
    if(changed)window.dispatchEvent(new CustomEvent("damage-case-partial-ready",{detail:{workId}}));
  }

  const style=document.createElement("style");
  style.id="damage-remove-recovery-basis";
  style.textContent="#people .damage-basis-block{display:none!important}";
  document.head.appendChild(style);

  window.addEventListener("damage-case-integrity-ready",()=>setTimeout(apply,0));
  ["work-001-content-ready","work-002-content-ready","work-003-content-ready","work-004-content-ready","work-005-content-ready","work-006-content-ready","work-006-cases-ready","work-007-content-ready","work-007-cases-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(apply,0)));

  const target=document.getElementById("people");
  if(target){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;apply();});
    }).observe(target,{childList:true,subtree:true});
  }

  let tries=0;
  const timer=setInterval(()=>{tries+=1;apply();if((Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)||tries>=60)clearInterval(timer);},100);
})();