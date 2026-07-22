/* 007《伊阙佛龛碑》栏目一按页坐标、真实分列与栏目三按需定位适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER_V8__)return;
  window.__WORK_007_COORDINATE_ADAPTER_V8__=true;
  window.__WORK_007_COORDINATE_ADAPTER__=true;

  const PAGE_COUNT=124;
  const CACHE_TAG="20260722_yique_columns_v8";
  const PAGE_BOX_ROOT="data/glyph_boxes/iiif/007";
  const RAW_BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const IMAGE_PREFIX="assets/page_images/007_伊阙佛龛碑/";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const pageFailures=new Set();
  const squareEntries=[];
  let nextScanPage=1;
  let scanQueue=Promise.resolve();
  let activeRows=[];
  let activePage=0;
  let transcriptObserver=null;
  let transcriptPatching=false;
  let transcriptPatchQueued=false;

  const KNOWN_CASE_LOCATIONS={
    "01":{
      page:13,
      glyph_id:"007_伊阙佛龛碑_p0013_c001",
      canvas:{w:2932,h:4434},
      bbox:{x:2230,y:964,w:325,h:402},
      match_method:"verified-page-0013",
      target_square_ordinal:1,
      target_kind:"restored",
      restored_text:"則"
    }
  };

  const variants={
    "扵":"於","於":"於","乗":"乘","乘":"乘","髙":"高","高":"高",
    "圡":"土","土":"土","邱":"丘","丘":"丘","无":"無","無":"無",
    "祕":"秘","秘":"秘","峯":"峰","峰":"峰","羣":"群","群":"群",
    "衆":"眾","眾":"眾","爲":"為","為":"為","裏":"裡","裡":"裡"
  };
  const ignored=/[\s\u3000，。；：、！？,.!?;:“”‘’'"（）()《》〈〉【】〔〕［］—–…·]/u;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function canonical(value){
    const ch=String(value||"").slice(0,1);
    if(!ch||ignored.test(ch))return "";
    return variants[ch]||ch;
  }

  function compact(value){
    return Array.from(String(value||"")).map(canonical).filter(Boolean);
  }

  function correctedTokens(value){
    const text=String(value||"");
    const tokens=[];
    let index=0;
    while(index<text.length){
      if(text[index]==="〔"){
        const end=text.indexOf("〕",index+1);
        const close=end<0?text.length:end;
        const restored=Array.from(text.slice(index+1,close)).map(canonical).filter(Boolean).join("");
        tokens.push({type:"restored",value:restored});
        index=end<0?text.length:end+1;
        continue;
      }
      const key=canonical(text[index]);
      index+=1;
      if(!key)continue;
      tokens.push({type:key==="□"?"square":"char",value:key});
    }
    return tokens;
  }

  function caseTarget(item){
    const originalPattern=compact(item?.original||item?.o||"");
    const corrected=correctedTokens(item?.corrected||item?.c||"");
    let tokenIndex=0;
    let squareOrdinal=0;
    let firstRecovered=null;

    for(const expected of originalPattern){
      if(expected==="□"){
        squareOrdinal+=1;
        const token=corrected[tokenIndex];
        if(token?.type==="restored"&&token.value&&!firstRecovered){
          firstRecovered={ordinal:squareOrdinal,restoredText:token.value};
        }
        if(token?.type==="restored"||token?.type==="square")tokenIndex+=1;
        continue;
      }
      while(tokenIndex<corrected.length){
        const token=corrected[tokenIndex];
        if(token.type==="char"&&token.value===expected){tokenIndex+=1;break;}
        if(token.type==="restored"||token.type==="square")break;
        tokenIndex+=1;
      }
    }
    return firstRecovered||{ordinal:1,restoredText:""};
  }

  function caseSquareDescriptor(items,index){
    const source=Array.isArray(items)?items:[];
    let start=0;
    for(let i=0;i<index;i+=1){
      start+=compact(source[i]?.original||source[i]?.o||"").filter(char=>char==="□").length;
    }
    const item=source[index]||{};
    const count=compact(item?.original||item?.o||"").filter(char=>char==="□").length;
    const target=caseTarget(item);
    target.ordinal=Math.max(1,Math.min(Math.max(1,count),target.ordinal));
    return {target,globalIndex:start+target.ordinal-1,squareCount:count};
  }

  function rect(row){
    return {
      x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),
      y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),
      w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),
      h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)
    };
  }

  function normalizeRow(row,page,index){
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    const pageNo=Number(row.canvas_index||row.page||page||0);
    if(!pageNo)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {
      ...row,
      work_id:"007",
      canvas_index:pageNo,
      glyph_id:String(row.glyph_id||`007_${pageNo}_${index+1}`),
      char:text,
      text,
      order_in_page:Number(row.order_in_page||row.annotation_index||index+1),
      bbox_x:box.x,
      bbox_y:box.y,
      bbox_w:box.w,
      bbox_h:box.h,
      bbox:[box.x,box.y,box.w,box.h]
    };
  }

  async function fetchJSONWithRetry(url,attempts=3){
    let lastError=null;
    for(let attempt=1;attempt<=attempts;attempt+=1){
      try{
        const response=await fetch(url,{cache:attempt===1?"force-cache":"reload"});
        if(response.status===404)return [];
        if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
        return await response.json();
      }catch(error){
        lastError=error;
        if(attempt<attempts)await sleep(350*attempt);
      }
    }
    throw lastError||new Error("坐标读取失败");
  }

  function pageBoxURL(page){
    return `${PAGE_BOX_ROOT}/page_${String(page).padStart(4,"0")}.json?v=${CACHE_TAG}`;
  }

  function loadPageRows(page){
    const pageNo=Number(page||0);
    if(!pageNo)return Promise.resolve([]);
    if(pagePromises.has(pageNo))return pagePromises.get(pageNo);

    const promise=fetchJSONWithRetry(pageBoxURL(pageNo),3)
      .then(rows=>{
        pageFailures.delete(pageNo);
        return (Array.isArray(rows)?rows:[])
          .map((row,index)=>normalizeRow(row,pageNo,index))
          .filter(Boolean)
          .sort((a,b)=>a.order_in_page-b.order_in_page);
      })
      .catch(error=>{
        pageFailures.add(pageNo);
        pagePromises.delete(pageNo);
        throw error;
      });
    pagePromises.set(pageNo,promise);
    return promise;
  }

  function median(values){
    const nums=values.filter(Number.isFinite).sort((a,b)=>a-b);
    if(!nums.length)return 0;
    const middle=Math.floor(nums.length/2);
    return nums.length%2?nums[middle]:(nums[middle-1]+nums[middle])/2;
  }

  function geometryColumns(rows){
    const items=(Array.isArray(rows)?rows:[]).map(row=>{
      const box=rect(row);
      return {row,box,cx:box.x+box.w/2,cy:box.y+box.h/2};
    }).filter(item=>item.box.w>0&&item.box.h>0);
    if(!items.length)return [];
    const medW=median(items.map(item=>item.box.w));
    const threshold=Math.max(80,Math.min(220,medW*.7));
    const columns=[];
    items.sort((a,b)=>b.cx-a.cx).forEach(item=>{
      let best=null,bestDistance=Infinity;
      columns.forEach(column=>{
        const distance=Math.abs(item.cx-column.cx);
        if(distance<bestDistance){best=column;bestDistance=distance;}
      });
      if(best&&bestDistance<=threshold){
        best.items.push(item);
        best.cx=best.items.reduce((sum,current)=>sum+current.cx,0)/best.items.length;
      }else{
        columns.push({cx:item.cx,items:[item]});
      }
    });
    columns.sort((a,b)=>b.cx-a.cx);
    columns.forEach((column,columnIndex)=>{
      column.items.sort((a,b)=>a.cy-b.cy);
      column.items.forEach((item,rowIndex)=>{
        item.row.auto_col=columnIndex;
        item.row.auto_row=rowIndex;
      });
    });
    return columns.map(column=>column.items.map(item=>item.row));
  }

  function patchTranscriptGrid(){
    transcriptPatchQueued=false;
    if(transcriptPatching||!activeRows.length)return;
    const grid=document.getElementById("transcriptGrid");
    if(!grid||!grid.querySelector(".reader-char"))return;
    const status=document.getElementById("readerStatus")?.textContent||"";
    if(activePage&&!status.includes(`第 ${activePage} 页`))return;
    const columns=geometryColumns(activeRows);
    if(!columns.length)return;
    const signature=`${activePage}|${columns.map(column=>column.map(row=>row.glyph_id).join(",")).join("|")}`;
    if(grid.dataset.work007ColumnSignature===signature)return;

    const existing=new Map();
    grid.querySelectorAll(".reader-char[data-glyph-id]").forEach(cell=>existing.set(cell.dataset.glyphId,cell));
    const sample=grid.querySelector(".reader-char[data-glyph-id]");
    const fontSize=sample?.style.fontSize||"";
    const maxRows=Math.max(...columns.map(column=>column.length),1);
    const fragment=document.createDocumentFragment();

    columns.forEach(column=>{
      const columnElement=document.createElement("div");
      columnElement.className="reader-col";
      columnElement.style.width=`${100/columns.length}%`;
      columnElement.style.gridTemplateRows=`repeat(${maxRows}, 1fr)`;
      for(let rowIndex=0;rowIndex<maxRows;rowIndex+=1){
        const row=column[rowIndex];
        let cell=row?existing.get(String(row.glyph_id)):null;
        if(!cell){
          cell=document.createElement("div");
          cell.className="reader-char";
          cell.style.pointerEvents="none";
        }
        if(fontSize)cell.style.fontSize=fontSize;
        columnElement.appendChild(cell);
      }
      fragment.appendChild(columnElement);
    });

    transcriptPatching=true;
    grid.replaceChildren(fragment);
    grid.dataset.work007ColumnSignature=signature;
    transcriptPatching=false;
  }

  function queueTranscriptPatch(){
    if(transcriptPatchQueued)return;
    transcriptPatchQueued=true;
    requestAnimationFrame(()=>requestAnimationFrame(patchTranscriptGrid));
  }

  function installTranscriptColumnPatch(){
    const grid=document.getElementById("transcriptGrid");
    if(!grid)return;
    transcriptObserver=new MutationObserver(()=>{
      if(!transcriptPatching)queueTranscriptPatch();
    });
    transcriptObserver.observe(grid,{childList:true,subtree:true});
    queueTranscriptPatch();
  }

  async function scanUntilSquare(index){
    const target=Math.max(0,Number(index||0));
    while(squareEntries.length<=target&&nextScanPage<=PAGE_COUNT){
      const page=nextScanPage;
      let rows=[];
      try{
        rows=await loadPageRows(page);
      }catch(error){
        console.warn("[work-007-coordinate-adapter] 扫描页坐标失败",page,error);
        await sleep(500);
        try{
          rows=await loadPageRows(page);
        }catch(secondError){
          console.warn("[work-007-coordinate-adapter] 保留失败页等待下次重试",page,secondError);
          throw secondError;
        }
      }
      rows.forEach(row=>{
        if(canonical(row.char||row.text||"")==="□")squareEntries.push({row,page,key:"□"});
      });
      nextScanPage+=1;
      if(nextScanPage%4===0)await sleep(0);
    }
    return squareEntries[target]||null;
  }

  function ensureSquareIndex(index){
    const task=()=>scanUntilSquare(index);
    scanQueue=scanQueue.then(task,task);
    return scanQueue;
  }

  function locationFromEntry(entry,target){
    if(!entry)return null;
    const row=entry.row;
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    return {
      page:Number(entry.page||row.canvas_index||0),
      glyph_id:String(row.glyph_id||""),
      canvas:{w:Number(row.canvas_width||2932),h:Number(row.canvas_height||4434)},
      bbox:{x:box.x,y:box.y,w:box.w,h:box.h},
      match_method:"page-square-order-demand",
      target_square_ordinal:target.ordinal,
      target_kind:target.restoredText?"restored":"first-missing",
      restored_text:target.restoredText||""
    };
  }

  async function locateCase(item,index,items){
    const currentLocations=Array.isArray(item?.locations)?item.locations:[];
    if(currentLocations.length)return item;
    const caseId=String(item?.id||index+1).padStart(2,"0");
    const known=KNOWN_CASE_LOCATIONS[caseId];
    if(known){
      const location=JSON.parse(JSON.stringify(known));
      const report={requestedCase:caseId,located:true,matchMethod:location.match_method,scannedThroughPage:nextScanPage-1,coordinateSquares:squareEntries.length,failedPages:Array.from(pageFailures).sort((a,b)=>a-b)};
      window.WORK_007_LOCATION_REPORT=report;
      window.dispatchEvent(new CustomEvent("work-007-location-audit",{detail:report}));
      return {...item,locations:[location],page:location.page};
    }

    const descriptor=caseSquareDescriptor(items,index);
    if(!descriptor.squareCount)return item;
    const entry=await ensureSquareIndex(descriptor.globalIndex);
    const location=locationFromEntry(entry,descriptor.target);
    const report={
      requestedCase:caseId,
      requestedSquareIndex:descriptor.globalIndex,
      located:Boolean(location),
      scannedThroughPage:nextScanPage-1,
      coordinateSquares:squareEntries.length,
      failedPages:Array.from(pageFailures).sort((a,b)=>a-b)
    };
    window.WORK_007_LOCATION_REPORT=report;
    window.dispatchEvent(new CustomEvent("work-007-location-audit",{detail:report}));
    if(!location)return item;
    return {...item,locations:[location],page:location.page};
  }

  async function locateCases(items){
    const source=Array.isArray(items)?items:[];
    const resolved=[];
    for(let index=0;index<source.length;index+=1)resolved.push(await locateCase(source[index],index,source));
    return resolved;
  }

  function remoteImage(value){
    const source=String(value||"").trim();
    if(!source||/^https?:\/\//i.test(source))return source;
    const relative=source.replace(/^\.\//,"").replace(/^\/+/,"");
    if(!relative.startsWith(IMAGE_PREFIX))return source;
    return RAW_BASE+relative.split("/").map(part=>encodeURIComponent(part)).join("/");
  }

  function installReaderImageStability(){
    const preconnect=document.createElement("link");
    preconnect.rel="preconnect";
    preconnect.href="https://raw.githubusercontent.com";
    preconnect.crossOrigin="anonymous";
    document.head.appendChild(preconnect);

    const retryState=new WeakMap();
    const bind=img=>{
      if(!img||img.dataset.work007RetryBound)return;
      img.dataset.work007RetryBound="true";
      img.addEventListener("load",()=>retryState.delete(img));
      img.addEventListener("error",()=>{
        const current=String(img.currentSrc||img.src||"");
        if(!/raw\.githubusercontent\.com/i.test(current))return;
        const base=current.replace(/([?&])_work007_retry=\d+/g,"$1").replace(/[?&]$/g,"");
        const state=retryState.get(img)||{base,count:0};
        if(state.base!==base){state.base=base;state.count=0;}
        if(state.count>=3)return;
        state.count+=1;
        retryState.set(img,state);
        setTimeout(()=>{
          const now=String(img.currentSrc||img.src||"");
          if(now.replace(/([?&])_work007_retry=\d+/g,"$1").replace(/[?&]$/g,"")!==base)return;
          img.src=base+(base.includes("?")?"&":"?")+`_work007_retry=${Date.now()}`;
        },500*state.count);
      });
    };

    const pageImage=document.getElementById("pageImage");
    const heroCover=document.getElementById("heroCover");
    bind(pageImage);
    bind(heroCover);

    let attempts=0;
    const stabilize=()=>{
      attempts+=1;
      try{
        if(typeof pages!=="undefined"&&Array.isArray(pages)&&pages.length){
          pages.forEach(page=>{
            if(page.image)page.image=remoteImage(page.image);
            (page.items||[]).forEach(item=>{if(item.local_image)item.local_image=remoteImage(item.local_image);});
          });
          if(heroCover&&pages[0]?.image&&!heroCover.src.includes("raw.githubusercontent.com"))heroCover.src=pages[0].image;
          if(pageImage&&(!pageImage.src||!pageImage.src.includes("raw.githubusercontent.com"))&&typeof loadPage==="function")loadPage(typeof currentPageIndex==="number"?currentPageIndex:0);
          return;
        }
      }catch(error){
        console.warn("[work-007-coordinate-adapter] 图片路径稳定处理",error);
      }
      if(attempts<300)setTimeout(stabilize,100);
    };
    stabilize();

    window.addEventListener("online",()=>{
      if(pageImage&&pageImage.naturalWidth===0&&typeof loadPage==="function")loadPage(typeof currentPageIndex==="number"?currentPageIndex:0);
    });
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="007")return original?original(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    try{
      const rows=(await loadPageRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
      if(rows.length){
        activeRows=rows;
        activePage=page;
        queueTranscriptPatch();
        return rows;
      }
    }catch(error){
      console.warn("[work-007-coordinate-adapter] 当前页坐标最终失败",page,error);
    }
    const fallback=original?await original(id,pageObj):[];
    activeRows=Array.isArray(fallback)?fallback:[];
    activePage=page;
    queueTranscriptPatch();
    return fallback;
  };

  window.WORK_007_COORDINATES={
    loadPageRows,
    locateCase,
    locateCases,
    caseTarget,
    geometryColumns,
    getReport:()=>window.WORK_007_LOCATION_REPORT||null
  };

  function install(){
    installReaderImageStability();
    installTranscriptColumnPatch();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
