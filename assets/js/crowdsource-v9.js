/* 众智释读缺字案例切换修正。
 * 第三个模块对应栏目三中的“残损碑文恢复”案例。
 * 修正内容：
 * 1. 不填写任何意见也可以自由浏览上一处、下一处；
 * 2. 导航按钮只创建一次，不再被 MutationObserver 每隔几十毫秒反复销毁重建；
 * 3. 程序切换案例时不再触发多余 input/change 事件；
 * 4. 切换时保存已填写草稿，但不进行必填校验；
 * 5. 取消每次切换后的平滑滚动，避免明显卡顿。
 */
(function(){
  "use strict";

  if(window.__CROWDSOURCE_MISSING_V10__) return;
  window.__CROWDSOURCE_MISSING_V10__=true;

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(rawId.includes("-")?rawId:rawId.padStart(3,"0"));
  const draftKey=`crowdsource:v10:missing-recovery:${workId}`;
  const legacyDraftKey=`crowdsource:v9:missing-recovery:${workId}`;
  const indexKey=`crowdsource:v10:missing-recovery-index:${workId}`;
  const legacyIndexKey=`crowdsource:v9:missing-recovery-index:${workId}`;

  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const clean=value=>String(value==null?"":value).trim();

  const storedIndex=sessionStorage.getItem(indexKey)??sessionStorage.getItem(legacyIndexKey);
  let currentIndex=Math.max(0,Number(storedIndex)||0);
  let scheduleTimer=0;
  let observer=null;
  let rendering=false;
  let navigationBusy=false;

  function recoveryCases(){
    const all=Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES:[];
    return all.filter(item=>clean(item&&item.n)==="残损碑文恢复");
  }

  function loadDrafts(){
    try{
      const raw=sessionStorage.getItem(draftKey)??sessionStorage.getItem(legacyDraftKey)??"{}";
      const value=JSON.parse(raw);
      return value&&typeof value==="object"?value:{};
    }catch(_){
      return {};
    }
  }

  function saveDrafts(value){
    try{sessionStorage.setItem(draftKey,JSON.stringify(value));}catch(_){ }
  }

  function panel(){return qs('#places [data-panel="missingText"]');}
  function currentCard(){return qs('#places [data-panel="missingText"] .crowd-simple-card');}

  function roleField(card,role,prefixes){
    let field=qs(`.crowd-field[data-v10-role="${role}"]`,card);
    if(field) return field;
    field=qsa(".crowd-field",card).find(node=>{
      const text=clean(qs("label",node)?.textContent);
      return prefixes.some(prefix=>text.startsWith(prefix));
    });
    if(field) field.dataset.v10Role=role;
    return field||null;
  }

  function control(field){return field?qs("input,textarea,select",field):null;}

  /* 程序填值时不主动派发 input/change，避免基础模块和观察器反复重绘。 */
  function setValue(node,value){
    if(!node) return;
    const next=String(value==null?"":value);
    if(node.value!==next) node.value=next;
  }

  function setLabel(field,text,required){
    const label=field&&qs("label",field);
    if(!label) return;
    const signature=`${text}|${required?1:0}`;
    if(label.dataset.v10Label===signature) return;
    label.replaceChildren(document.createTextNode(text));
    if(required){
      const mark=document.createElement("span");
      mark.className="crowd-required";
      mark.textContent=" *";
      label.appendChild(mark);
    }
    label.dataset.v10Label=signature;
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

  /* 只保存草稿，不检查必填项，因此空白状态也可切换案例。 */
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
    const choices=document.createElement("div");
    choices.className="missing-judgment-options";
    [["agree","认同当前 AI 恢复内容"],["disagree","不认同，需要提出修改"]].forEach(([value,text])=>{
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
      setValue(type,"认同当前AI补字");
      if(suggested){
        suggested.readOnly=true;
        suggested.placeholder="系统已带入当前 AI 恢复内容";
        setValue(suggested,item.c||"");
      }
      if(reason) reason.placeholder="请简要说明您认同该恢复结果的理由";
    }else if(value==="disagree"){
      setValue(type,"对 AI 补字有异议");
      if(suggested){
        suggested.readOnly=false;
        suggested.placeholder="请填写您认为正确或更合适的文字，可填写多字";
        if(fromUser) setValue(suggested,"");
      }
      if(reason) reason.placeholder="请结合字形、上下文或相关文献说明判断理由";
    }else{
      setValue(type,"");
      if(suggested){
        suggested.readOnly=true;
        suggested.placeholder="可直接浏览其他案例；提交意见前再选择判断";
        setValue(suggested,"");
      }
      if(reason) reason.placeholder="可暂不填写，切换案例不会触发校验";
    }
  }

  function createNavigator(root){
    const row=qs(".crowd-add-row",root);
    if(!row) return null;
    if(row.dataset.v10Navigator==="true") return row;

    row.replaceChildren();
    row.className="crowd-add-row missing-case-nav";
    row.dataset.v10Navigator="true";

    const prev=document.createElement("button");
    prev.type="button";
    prev.className="crowd-btn";
    prev.dataset.missingPrev="true";
    prev.textContent="上一处";
    prev.addEventListener("click",event=>changeCase(-1,event));

    const status=document.createElement("span");
    status.className="missing-case-status";
    status.dataset.missingStatus="true";

    const next=document.createElement("button");
    next.type="button";
    next.className="crowd-btn";
    next.dataset.missingNext="true";
    next.textContent="下一处";
    next.addEventListener("click",event=>changeCase(1,event));

    row.append(prev,status,next);
    return row;
  }

  /* 只更新按钮状态，不再 replaceChildren，避免按钮不断被销毁。 */
  function updateNavigator(root,total){
    const row=createNavigator(root);
    if(!row) return;
    const prev=qs("[data-missing-prev]",row);
    const next=qs("[data-missing-next]",row);
    const status=qs("[data-missing-status]",row);
    if(prev) prev.disabled=currentIndex<=0;
    if(next) next.disabled=currentIndex>=total-1;
    if(status) status.textContent=`第 ${Math.min(currentIndex+1,total)} / ${total} 处`;
  }

  function bindDraftInputs(card){
    if(card.dataset.v10DraftBound==="true") return;
    card.dataset.v10DraftBound="true";
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
    if(rendering) return;
    const root=panel();
    const cases=recoveryCases();
    if(!root||!cases.length) return;
    if(!ensureOneCard(root)){schedule();return;}

    rendering=true;
    try{
      currentIndex=Math.max(0,Math.min(cases.length-1,currentIndex));
      const item=cases[currentIndex];
      const card=currentCard();
      if(!card) return;
      const key=caseKey(item,currentIndex);

      if(!force&&card.dataset.v10CaseKey===key){
        updateNavigator(root,cases.length);
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
      const titleText=`AI 补字意见 · 第${currentIndex+1}处`;
      if(title&&title.textContent!==titleText) title.textContent=titleText;
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

      card.dataset.v10CaseKey=key;
      bindDraftInputs(card);
      updateNavigator(root,cases.length);
      sessionStorage.setItem(indexKey,String(currentIndex));
    }finally{
      rendering=false;
      navigationBusy=false;
    }
  }

  function changeCase(delta,event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    if(navigationBusy) return;
    const cases=recoveryCases();
    if(!cases.length) return;

    const nextIndex=Math.max(0,Math.min(cases.length-1,currentIndex+delta));
    if(nextIndex===currentIndex) return;

    navigationBusy=true;
    saveCurrentDraft();
    currentIndex=nextIndex;
    sessionStorage.setItem(indexKey,String(currentIndex));
    const card=currentCard();
    if(card) delete card.dataset.v10CaseKey;
    renderCase(true);
  }

  function schedule(){
    clearTimeout(scheduleTimer);
    scheduleTimer=setTimeout(()=>renderCase(false),80);
  }

  function start(){
    const wait=()=>{
      const section=qs('#places[data-crowdsource-ready="true"]');
      if(!section||!recoveryCases().length){setTimeout(wait,120);return;}
      if(observer) observer.disconnect();
      observer=new MutationObserver(mutations=>{
        const meaningful=mutations.some(mutation=>{
          const target=mutation.target instanceof Element?mutation.target:mutation.target.parentElement;
          return !target?.closest(".missing-case-nav");
        });
        if(meaningful) schedule();
      });
      observer.observe(section,{childList:true,subtree:true});
      renderCase(true);
    };
    wait();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
