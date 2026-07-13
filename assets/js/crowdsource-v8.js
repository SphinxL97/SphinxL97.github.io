/* 众智释读 v8 增强：手动位置核验、逐条完成限制、首个有字页与语义图标。
 * 仅作用于第四栏目，不修改碑帖原始图片、释文或坐标数据。
 */
(function(){
  "use strict";

  if(window.__CROWDSOURCE_V8_ENHANCEMENT__) return;
  window.__CROWDSOURCE_V8_ENHANCEMENT__=true;

  const params=new URLSearchParams(location.search);
  const rawId=String(params.get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  const effectiveId=rawId.includes("-")?rawId:parentId;
  const version="20260714_v8";
  const migrationKey=`crowdsource:v8:first-text-page:${effectiveId}`;

  const dataState={
    ready:false,
    pages:[],
    positionMap:new Map(),
    firstTextPageIndex:0,
    enhanceTimer:0,
    noticeTimer:0
  };

  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const clean=value=>String(value==null?"":value).trim();
  const number=value=>Number.isFinite(Number(value))?Number(value):NaN;

  function modelShardUrl(){
    const n=Number(parentId);
    const start=Math.floor((n-1)/5)*5+1;
    const end=Math.min(start+4,45);
    return `data/model_boxes/glyph_model_border_${String(start).padStart(3,"0")}_${String(end).padStart(3,"0")}.json?v=${version}`;
  }

  function pageIndexUrl(){
    return `data/page_images_index.json?v=${version}`;
  }

  function pageCanvasIndex(page,index){
    const value=Number(page&&((page.canvas_index??page.page)));
    return Number.isFinite(value)&&value>0?value:index+1;
  }

  function lineOf(row){
    const value=Number(row.auto_row);
    return Number.isFinite(value)?value+1:NaN;
  }

  function columnOf(row){
    const value=Number(row.auto_col);
    return Number.isFinite(value)?value+1:NaN;
  }

  async function loadReferenceData(){
    try{
      const [pageResponse,rowResponse]=await Promise.all([
        fetch(pageIndexUrl(),{cache:"no-store"}),
        fetch(modelShardUrl(),{cache:"no-store"})
      ]);
      if(!pageResponse.ok) throw new Error(`page index ${pageResponse.status}`);
      if(!rowResponse.ok) throw new Error(`model boxes ${rowResponse.status}`);

      const pageData=await pageResponse.json();
      const rows=await rowResponse.json();
      const work=(pageData.works||{})[effectiveId]||(pageData.works||{})[parentId]||{};
      dataState.pages=Array.isArray(work.pages)?work.pages:[];

      const grouped=new Map();
      (Array.isArray(rows)?rows:[]).forEach(row=>{
        const virtualId=String(row.virtual_id||"");
        const workId=String(row.work_id||"").padStart(3,"0");
        if(virtualId?virtualId!==effectiveId:workId!==parentId) return;
        const canvas=Number(row.canvas_index||row.page);
        if(!Number.isFinite(canvas)||canvas<=0) return;
        if(!grouped.has(canvas)) grouped.set(canvas,[]);
        grouped.get(canvas).push(row);
      });

      dataState.positionMap.clear();
      let first=-1;
      dataState.pages.forEach((page,index)=>{
        const canvas=pageCanvasIndex(page,index);
        const list=grouped.get(canvas)||[];
        if(first<0&&list.length) first=index;
        list.forEach(row=>{
          const line=lineOf(row),column=columnOf(row);
          if(!Number.isFinite(line)||!Number.isFinite(column)) return;
          const key=`${index+1}:${line}:${column}`;
          if(!dataState.positionMap.has(key)){
            dataState.positionMap.set(key,{
              page:index+1,
              line,
              column,
              text:String(row.char||row.text||"□").slice(0,1)||"□"
            });
          }
        });
      });
      dataState.firstTextPageIndex=first>=0?first:0;
      dataState.ready=true;
    }catch(error){
      console.error("[crowdsource-v8] reference data load failed",error);
      dataState.ready=false;
    }
  }

  function fieldControl(card,labelStart){
    const field=qsa(".crowd-field",card).find(node=>clean(qs("label",node)?.textContent).startsWith(labelStart));
    return field?qs("input,textarea,select",field):null;
  }

  function isManualCard(card){
    return clean(qs(".crowd-item-meta strong",card)?.textContent).includes("手动新增");
  }

  function ensurePositionFeedback(card){
    let feedback=qs(".crowd-position-feedback",card);
    if(!feedback){
      feedback=document.createElement("div");
      feedback.className="crowd-position-feedback";
      const grid=qs(".crowd-grid",card);
      if(grid) grid.insertAdjacentElement("afterend",feedback);
    }
    return feedback;
  }

  function dispatchInput(node){
    node.dispatchEvent(new Event("input",{bubbles:true}));
  }

  function syncManualPosition(card){
    if(!isManualCard(card)) return;
    const page=fieldControl(card,"页码");
    const line=fieldControl(card,"行号");
    const column=fieldControl(card,"列号");
    const current=fieldControl(card,"当前释文");
    if(!page||!line||!column||!current) return;

    current.readOnly=true;
    current.setAttribute("aria-readonly","true");
    current.placeholder="填写页码、行号和列号后自动带出";
    const feedback=ensurePositionFeedback(card);

    if(!dataState.ready){
      card.dataset.positionValid="false";
      feedback.className="crowd-position-feedback is-waiting";
      feedback.textContent="正在核对该位置对应的碑文……";
      return;
    }

    const p=number(page.value),r=number(line.value),c=number(column.value);
    const key=`${p}:${r}:${c}`;
    const match=Number.isFinite(p)&&Number.isFinite(r)&&Number.isFinite(c)?dataState.positionMap.get(key):null;

    if(match){
      if(current.value!==match.text){
        current.value=match.text;
        dispatchInput(current);
      }
      card.dataset.positionValid="true";
      feedback.className="crowd-position-feedback is-valid";
      feedback.textContent=`已核对：第${match.page}页第${match.line}行第${match.column}列，对应释文“${match.text}”。`;
    }else{
      if(current.value){
        current.value="";
        dispatchInput(current);
      }
      card.dataset.positionValid="false";
      feedback.className="crowd-position-feedback is-invalid";
      feedback.textContent=page.value&&line.value&&column.value
        ?"未找到与该页、行、列对应的碑文字，请检查位置后再继续。"
        :"请先填写页码、行号和列号，系统将自动核对并带出当前释文。";
    }
  }

  function bindManualCard(card){
    if(!isManualCard(card)||card.dataset.v8Bound==="true") return;
    card.dataset.v8Bound="true";
    ["页码","行号","列号"].forEach(label=>{
      const control=fieldControl(card,label);
      if(control) control.addEventListener("input",()=>{
        syncManualPosition(card);
        refreshAddState();
      });
    });
    syncManualPosition(card);
  }

  function cardComplete(card){
    const suggested=fieldControl(card,"建议修改为");
    const reason=fieldControl(card,"修改理由");
    if(!clean(suggested?.value)||!clean(reason?.value)) return false;
    if(!isManualCard(card)) return true;

    const page=fieldControl(card,"页码");
    const line=fieldControl(card,"行号");
    const column=fieldControl(card,"列号");
    const current=fieldControl(card,"当前释文");
    return card.dataset.positionValid==="true"&&
      clean(page?.value)&&clean(line?.value)&&clean(column?.value)&&clean(current?.value);
  }

  function incompleteCards(){
    return qsa(".crowd-item",qs('#places [data-panel="transcription"]')||document).filter(card=>!cardComplete(card));
  }

  function ensureNotice(){
    const listCard=qs("#places .crowd-list-card");
    if(!listCard) return null;
    let notice=qs(".crowd-list-notice",listCard);
    if(!notice){
      notice=document.createElement("div");
      notice.className="crowd-list-notice";
      const head=qs(".crowd-list-head",listCard);
      if(head) head.insertAdjacentElement("afterend",notice);
      else listCard.prepend(notice);
    }
    return notice;
  }

  function showNotice(message){
    const notice=ensureNotice();
    if(!notice) return;
    clearTimeout(dataState.noticeTimer);
    notice.textContent=message;
    notice.classList.add("show");
    dataState.noticeTimer=setTimeout(()=>notice.classList.remove("show"),4200);
  }

  function openFirstIncomplete(){
    const card=incompleteCards()[0];
    if(!card) return;
    const toggle=qs(".crowd-item-toggle",card);
    if(card.classList.contains("is-collapsed")&&toggle) toggle.click();
    setTimeout(()=>card.scrollIntoView({behavior:"smooth",block:"center"}),60);
  }

  function refreshAddState(){
    const blocked=incompleteCards().length>0;
    const button=qs("#places [data-add-manual]");
    if(button){
      button.classList.toggle("is-blocked",blocked);
      button.setAttribute("aria-disabled",String(blocked));
      button.title=blocked?"请先完成当前修改意见中的必填内容":"手动新增一条修改意见";
    }
  }

  function bindRequiredInputs(){
    qsa('#places [data-panel="transcription"] .crowd-item').forEach(card=>{
      bindManualCard(card);
      if(card.dataset.v8RequiredBound==="true") return;
      card.dataset.v8RequiredBound="true";
      [fieldControl(card,"建议修改为"),fieldControl(card,"修改理由")].forEach(control=>{
        if(control) control.addEventListener("input",refreshAddState);
      });
    });
    refreshAddState();
  }

  function guardCreatingNext(event){
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    const manualButton=target.closest("#places [data-add-manual]");
    const imageWrap=target.closest("#places .crowd-image-wrap");
    if(!manualButton&&!imageWrap) return;
    if(!incompleteCards().length) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showNotice("请先完成当前修改意见中的必填内容，再添加下一处修改。");
    openFirstIncomplete();
  }

  function makeSvgIcon(type){
    const ns="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(ns,"svg");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("aria-hidden","true");
    svg.setAttribute("focusable","false");
    const paths={
      transcription:["M4.5 19.5 8 18.7 18.2 8.5a2.1 2.1 0 0 0-3-3L5.1 15.7 4.5 19.5Z","M13.8 6.9l3.3 3.3","M4.5 19.5h5.2"],
      punctuation:["M8.2 7.2H5.5v4h3c0 2.7-1.1 4.5-3.1 5.8","M17.5 7.2h-2.7v4h3c0 2.7-1.1 4.5-3.1 5.8"],
      missingText:["M8.5 4.8H5v3.7","M15.5 4.8H19v3.7","M19 15.5v3.7h-3.5","M8.5 19.2H5v-3.7","M9 12h6"]
    };
    (paths[type]||paths.transcription).forEach(d=>{
      const path=document.createElementNS(ns,"path");
      path.setAttribute("d",d);
      svg.appendChild(path);
    });
    return svg;
  }

  function enhanceIcons(){
    qsa("#places .crowd-tab").forEach(tab=>{
      const type=tab.dataset.tab;
      const icon=qs(".crowd-tab-icon",tab);
      if(!icon||icon.dataset.v8Icon==="true") return;
      icon.replaceChildren(makeSvgIcon(type));
      icon.dataset.v8Icon="true";
    });
  }

  function setFirstTextPageOnce(){
    if(!dataState.ready||sessionStorage.getItem(migrationKey)) return;
    const select=qs("#places [data-page-select]");
    if(!select||!select.options.length) return;
    const index=Math.max(0,Math.min(select.options.length-1,dataState.firstTextPageIndex));
    select.value=String(index);
    select.dispatchEvent(new Event("change",{bubbles:true}));
    sessionStorage.setItem(migrationKey,"1");
  }

  function enhance(){
    enhanceIcons();
    bindRequiredInputs();
    setFirstTextPageOnce();
  }

  function scheduleEnhance(){
    clearTimeout(dataState.enhanceTimer);
    dataState.enhanceTimer=setTimeout(enhance,40);
  }

  async function init(){
    document.addEventListener("click",guardCreatingNext,true);
    await loadReferenceData();

    const wait=()=>{
      const section=qs('#places[data-crowdsource-ready="true"]');
      if(!section){setTimeout(wait,100);return;}
      const observer=new MutationObserver(scheduleEnhance);
      observer.observe(section,{childList:true,subtree:true});
      scheduleEnhance();
    };
    wait();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
