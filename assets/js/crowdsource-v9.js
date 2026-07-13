/* 众智释读 v9：第三个模块仅对应栏目三中的“残损碑文恢复”案例。
 * 不修改右侧操作提示，也不改动碑帖、释文与坐标数据。
 */
(function(){
  "use strict";

  if(window.__CROWDSOURCE_MISSING_V9__) return;
  window.__CROWDSOURCE_MISSING_V9__=true;

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(rawId.includes("-")?rawId:rawId.padStart(3,"0"));
  const draftKey=`crowdsource:v9:missing-recovery:${workId}`;
  const indexKey=`crowdsource:v9:missing-recovery-index:${workId}`;

  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const clean=value=>String(value==null?"":value).trim();

  let currentIndex=Math.max(0,Number(sessionStorage.getItem(indexKey))||0);
  let scheduleTimer=0;
  let observer=null;

  function recoveryCases(){
    const all=Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES:[];
    return all.filter(item=>clean(item&&item.n)==="残损碑文恢复");
  }

  function loadDrafts(){
    try{
      const value=JSON.parse(sessionStorage.getItem(draftKey)||"{}");
      return value&&typeof value==="object"?value:{};
    }catch(_){
      return {};
    }
  }

  function saveDrafts(value){
    try{sessionStorage.setItem(draftKey,JSON.stringify(value));}catch(_){ }
  }

  function panel(){return qs('#places [data-panel="missingText"]');}

  function roleField(card,role,prefixes){
    let field=qs(`.crowd-field[data-v9-role="${role}"]`,card);
    if(field) return field;
    field=qsa(".crowd-field",card).find(node=>{
      const text=clean(qs("label",node)?.textContent);
      return prefixes.some(prefix=>text.startsWith(prefix));
    });
    if(field) field.dataset.v9Role=role;
    return field||null;
  }

  function control(field){return field?qs("input,textarea,select",field):null;}

  function setValue(node,value,eventType="input"){
    if(!node) return;
    const next=String(value==null?"":value);
    if(node.value===next) return;
    node.value=next;
    node.dispatchEvent(new Event(eventType,{bubbles:true}));
  }

  function setLabel(field,text,required){
    const label=field&&qs("label",field);
    if(!label) return;
    label.replaceChildren(document.createTextNode(text));
    if(required){
      const mark=document.createElement("span");
      mark.className="crowd-required";
      mark.textContent=" *";
      label.appendChild(mark);
    }
  }

  function ensureSelectOption(select,value,label){
    if(!select) return;
    if(!Array.from(select.options).some(option=>option.value===value)){
      const option=document.createElement("option");
      option.value=value;
      option.textContent=label;
      select.appendChild(option);
    }
  }

  function caseKey(item,index){return `${item.page||index+1}:${item.t||item.n||index+1}`;}

  function currentCard(){return qs('#places [data-panel="missingText"] .crowd-simple-card');}

  function cardParts(card){
    return {
      typeField:roleField(card,"type",["意见类型"]),
      positionField:roleField(card,"position",["对应位置或原句","对应案例位置"]),
      currentField:roleField(card,"current",["网站当前显示内容","原始残损文本"]),
      aiField:roleField(card,"ai",["网站当前 AI 补字内容","网站当前 AI 恢复内容"]),
      suggestedField:roleField(card,"suggested",["建议补录或修改内容","您认为正确或更合适的内容"]),
      reasonField:roleField(card,"reason",["判断理由"]),
      referenceField:roleField(card,"reference",["参考依据"])
    };
  }

  function saveCurrentDraft(){
    const cases=recoveryCases();
    const item=cases[currentIndex];
    const card=currentCard();
    if(!item||!card) return;
    const parts=cardParts(card);
    const selected=qs('input[name="missing-judgment"]:checked',card);
    const drafts=loadDrafts();
    drafts[caseKey(item,currentIndex)]={
      judgment:selected?selected.value:"",
      suggested:control(parts.suggestedField)?.value||"",
      reason:control(parts.reasonField)?.value||"",
      reference:control(parts.referenceField)?.value||""
    };
    saveDrafts(drafts);
  }

  function ensureOneCard(root){
    const cards=qsa(".crowd-simple-card",root);
    if(cards.length>1){
      const remove=qs(".crowd-simple-head .crowd-remove",cards[cards.length-1]);
      if(remove){remove.click();return false;}
    }
    if(cards.length===0){
      const add=qs('[data-add-simple="missingText"]',root);
      if(add){add.click();return false;}
    }
    return cards.length===1;
  }

  function ensureJudgment(card){
    let box=qs(".missing-judgment",card);
    if(box) return box;
    box=document.createElement("fieldset");
    box.className="missing-judgment";
    const legend=document.createElement("legend");
    legend.textContent="您对当前 AI 恢复内容的判断";
    const options=[
      ["agree","认同当前 AI 恢复内容"],
      ["disagree","不认同，需要提出修改"]
    ];
    const choices=document.createElement("div");
    choices.className="missing-judgment-options";
    options.forEach(([value,text])=>{
      const label=document.createElement("label");
      const radio=document.createElement("input");
      radio.type="radio";
      radio.name="missing-judgment";
      radio.value=value;
      const span=document.createElement("span");
      span.textContent=text;
      label.append(radio,span);
      choices.appendChild(label);
    });
    box.append(legend,choices);
    const suggested=roleField(card,"suggested",["建议补录或修改内容","您认为正确或更合适的内容"]);
    if(suggested) suggested.insertAdjacentElement("beforebegin",box);
    else card.appendChild(box);
    return box;
  }

  function updateJudgment(card,item,value,fromUser){
    const parts=cardParts(card);
    const type=control(parts.typeField);
    const suggested=control(parts.suggestedField);
    const reason=control(parts.reasonField);
    ensureSelectOption(type,"","请选择判断");
    ensureSelectOption(type,"认同当前AI补字","认同当前AI补字");
    ensureSelectOption(type,"对 AI 补字有异议","对 AI 补字有异议");

    if(value==="agree"){
      setValue(type,"认同当前AI补字","change");
      suggested.readOnly=true;
      suggested.placeholder="系统已带入当前 AI 恢复内容";
      setValue(suggested,item.c||"");
      reason.placeholder="请简要说明您认同该恢复结果的理由";
    }else if(value==="disagree"){
      setValue(type,"对 AI 补字有异议","change");
      suggested.readOnly=false;
      suggested.placeholder="请填写您认为正确或更合适的文字，可填写多字";
      if(fromUser) setValue(suggested,"");
      reason.placeholder="请结合字形、上下文或相关文献说明判断理由";
    }else{
      setValue(type,"","change");
      suggested.readOnly=true;
      suggested.placeholder="请先选择认同或不认同";
      setValue(suggested,"");
      reason.placeholder="选择判断后填写理由";
    }
  }

  function buildNavigator(root,total){
    const row=qs(".crowd-add-row",root);
    if(!row) return;
    row.replaceChildren();
    row.className="crowd-add-row missing-case-nav";

    const prev=document.createElement("button");
    prev.type="button";
    prev.className="crowd-btn";
    prev.textContent="上一处";
    prev.disabled=currentIndex<=0;
    prev.addEventListener("click",()=>changeCase(-1));

    const status=document.createElement("span");
    status.className="missing-case-status";
    status.textContent=`第 ${Math.min(currentIndex+1,total)} / ${total} 处`;

    const next=document.createElement("button");
    next.type="button";
    next.className="crowd-btn";
    next.textContent="下一处";
    next.disabled=currentIndex>=total-1;
    next.addEventListener("click",()=>changeCase(1));

    row.append(prev,status,next);
  }

  function bindDraftInputs(card){
    if(card.dataset.v9DraftBound==="true") return;
    card.dataset.v9DraftBound="true";
    card.addEventListener("input",event=>{
      if(event.target instanceof HTMLInputElement&&event.target.name==="missing-judgment") return;
      saveCurrentDraft();
    });
    card.addEventListener("change",event=>{
      const target=event.target;
      if(target instanceof HTMLInputElement&&target.name==="missing-judgment"){
        const item=recoveryCases()[currentIndex];
        if(item){updateJudgment(card,item,target.value,true);saveCurrentDraft();}
      }
    });
  }

  function renderCase(force){
    const root=panel();
    const cases=recoveryCases();
    if(!root||!cases.length) return;
    if(!ensureOneCard(root)){schedule();return;}

    currentIndex=Math.max(0,Math.min(cases.length-1,currentIndex));
    const item=cases[currentIndex];
    const card=currentCard();
    if(!card) return;
    const key=caseKey(item,currentIndex);

    if(!force&&card.dataset.v9CaseKey===key){
      buildNavigator(root,cases.length);
      return;
    }

    const parts=cardParts(card);
    const type=control(parts.typeField);
    const position=control(parts.positionField);
    const current=control(parts.currentField);
    const ai=control(parts.aiField);
    const suggested=control(parts.suggestedField);
    const reason=control(parts.reasonField);
    const reference=control(parts.referenceField);

    const title=qs(".crowd-simple-head strong",card);
    if(title) title.textContent=`AI 补字意见 · 第${currentIndex+1}处`;
    const remove=qs(".crowd-simple-head .crowd-remove",card);
    if(remove) remove.hidden=true;

    if(parts.typeField) parts.typeField.hidden=true;
    setLabel(parts.positionField,"对应案例位置",false);
    setLabel(parts.currentField,"原始残损文本",false);
    setLabel(parts.aiField,"网站当前 AI 恢复内容",false);
    setLabel(parts.suggestedField,"您认为正确或更合适的内容",true);
    setLabel(parts.reasonField,"判断理由",true);
    setLabel(parts.referenceField,"参考依据（可选）",false);

    [position,current,ai].forEach(node=>{
      if(!node) return;
      node.readOnly=true;
      node.setAttribute("aria-readonly","true");
    });

    setValue(position,`第${item.page||"—"}页｜${item.t||item.n||"残损碑文恢复"}`);
    setValue(current,item.o||"");
    setValue(ai,item.c||"");

    const judgment=ensureJudgment(card);
    const drafts=loadDrafts();
    const draft=drafts[key]||{judgment:"",suggested:"",reason:"",reference:""};
    qsa('input[name="missing-judgment"]',judgment).forEach(radio=>{radio.checked=radio.value===draft.judgment;});

    setValue(reason,draft.reason||"");
    setValue(reference,draft.reference||"");
    setValue(suggested,draft.suggested||"");
    updateJudgment(card,item,draft.judgment,false);
    if(draft.judgment==="disagree") setValue(suggested,draft.suggested||"");

    card.dataset.v9CaseKey=key;
    bindDraftInputs(card);
    buildNavigator(root,cases.length);
    sessionStorage.setItem(indexKey,String(currentIndex));
  }

  function changeCase(delta){
    const cases=recoveryCases();
    if(!cases.length) return;
    saveCurrentDraft();
    currentIndex=Math.max(0,Math.min(cases.length-1,currentIndex+delta));
    sessionStorage.setItem(indexKey,String(currentIndex));
    const card=currentCard();
    if(card) delete card.dataset.v9CaseKey;
    renderCase(true);
    qs('#places [data-panel="missingText"]')?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function schedule(){
    clearTimeout(scheduleTimer);
    scheduleTimer=setTimeout(()=>renderCase(false),60);
  }

  function start(){
    const wait=()=>{
      const section=qs('#places[data-crowdsource-ready="true"]');
      if(!section||!recoveryCases().length){setTimeout(wait,120);return;}
      if(observer) observer.disconnect();
      observer=new MutationObserver(schedule);
      observer.observe(section,{childList:true,subtree:true});
      schedule();
    };
    wait();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();