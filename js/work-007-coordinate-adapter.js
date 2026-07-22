/* 007《伊阙佛龛碑》栏目一按页坐标与栏目三全案例稳定定位适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER__)return;

  const CACHE_TAG="20260722_yique_static_order_v6";
  const MODEL_URL=`data/model_boxes/glyph_model_border_006_010.json?v=${CACHE_TAG}`;
  const PAGE_BOX_ROOT="data/glyph_boxes/iiif/007";
  const RAW_BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const IMAGE_PREFIX="assets/page_images/007_伊阙佛龛碑/";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  let modelPromise=null;

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

  function nthSquareIndex(pattern,ordinal){
    let seen=0;
    for(let index=0;index<pattern.length;index+=1){
      if(pattern[index]!=="□")continue;
      seen+=1;
      if(seen===ordinal)return index;
    }
    return pattern.indexOf("□");
  }

  function rect(row){
    return {
      x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),
      y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),
      w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),
      h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)
    };
  }

  function rowWorkId(row){
    const source=String(row?.work_id||row?.work||"");
    const match=source.match(/^(\d{3})/);
    if(match)return match[1];
    if(Number(row?.work_index)===7)return "007";
    return "";
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
      .then(rows=>(Array.isArray(rows)?rows:[])
        .map((row,index)=>normalizeRow(row,pageNo,index))
        .filter(Boolean)
        .sort((a,b)=>a.order_in_page-b.order_in_page))
      .catch(error=>{
        console.warn("[work-007-coordinate-adapter] 当前页坐标读取失败",pageNo,error);
        pagePromises.delete(pageNo);
        return [];
      });
    pagePromises.set(pageNo,promise);
    return promise;
  }

  function loadModelRows(){
    if(!modelPromise){
      modelPromise=fetchJSONWithRetry(MODEL_URL,3)
        .then(rows=>(Array.isArray(rows)?rows:[])
          .filter(row=>rowWorkId(row)==="007")
          .map((row,index)=>normalizeRow(row,Number(row.canvas_index||row.page||0),index))
          .filter(Boolean)
          .sort((a,b)=>a.canvas_index-b.canvas_index||a.order_in_page-b.order_in_page))
        .catch(error=>{
          console.error("[work-007-coordinate-adapter] 汇总坐标读取失败",error);
          modelPromise=null;
          return [];
        });
    }
    return modelPromise;
  }

  function buildStream(rows){
    return rows.map(row=>({key:canonical(row.char||row.text||""),row,page:Number(row.canvas_index||0)}))
      .filter(entry=>entry.key&&entry.page);
  }

  function contextOffsets(pattern,targetIndex,radius=18){
    const offsets=[];
    const from=Math.max(0,targetIndex-radius);
    const to=Math.min(pattern.length-1,targetIndex+radius);
    for(let index=from;index<=to;index+=1){
      if(index===targetIndex||pattern[index]==="□")continue;
      offsets.push({offset:index-targetIndex,key:pattern[index]});
    }
    return offsets;
  }

  function contextScore(pattern,targetIndex,stream,streamIndex){
    const offsets=contextOffsets(pattern,targetIndex);
    let compared=0,matched=0;
    for(const item of offsets){
      const candidate=stream[streamIndex+item.offset];
      if(!candidate)continue;
      compared+=1;
      if(candidate.key===item.key)matched+=1;
    }
    return {compared,matched,ratio:compared?matched/compared:0};
  }

  function orderedContextCandidate(pattern,targetIndex,restoredText,stream,cursor){
    const restoredKey=canonical(restoredText);
    const ranked=[];
    for(let index=Math.max(0,cursor);index<stream.length;index+=1){
      const score=contextScore(pattern,targetIndex,stream,index);
      if(score.compared<4||score.matched<4||score.ratio<.72)continue;
      const targetKey=stream[index].key;
      const targetAgreement=targetKey==="□"||Boolean(restoredKey&&targetKey===restoredKey);
      ranked.push({index,...score,targetAgreement,total:score.matched*10+score.ratio+(targetAgreement?2:0)});
    }
    ranked.sort((a,b)=>b.total-a.total||a.index-b.index);
    const best=ranked[0],second=ranked[1];
    if(!best)return null;
    if(second&&best.matched===second.matched&&Math.abs(best.ratio-second.ratio)<.05&&best.targetAgreement===second.targetAgreement)return null;
    return {...stream[best.index],index:best.index};
  }

  function locationFromEntry(entry,method,target,score){
    if(!entry)return null;
    const row=entry.row;
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    return {
      page:Number(entry.page||row.canvas_index||0),
      glyph_id:String(row.glyph_id||""),
      canvas:{w:Number(row.canvas_width||2932),h:Number(row.canvas_height||4434)},
      bbox:{x:box.x,y:box.y,w:box.w,h:box.h},
      match_method:method,
      target_square_ordinal:target.ordinal,
      target_kind:target.restoredText?"restored":"first-missing",
      restored_text:target.restoredText||"",
      context_score:score||null
    };
  }

  async function locateCases(items){
    const rows=await loadModelRows();
    const stream=buildStream(rows);
    const squareEntries=stream.filter(entry=>entry.key==="□");
    const source=Array.isArray(items)?items:[];
    const requiredSquares=source.reduce((sum,item)=>sum+compact(item?.original||item?.o||"").filter(char=>char==="□").length,0);
    const squareOrderComplete=squareEntries.length===requiredSquares||squareEntries.length===requiredSquares+2;
    let globalSquareOrdinal=0;
    let cursor=0;
    let squareOrderLocated=0;
    let contextLocated=0;
    const unresolved=[];

    const resolved=source.map(item=>{
      const currentLocations=Array.isArray(item?.locations)?item.locations:[];
      const pattern=compact(item?.original||item?.o||"");
      const squareCount=pattern.filter(char=>char==="□").length;
      const caseStartOrdinal=globalSquareOrdinal;
      globalSquareOrdinal+=squareCount;
      if(currentLocations.length||!squareCount)return item;

      const target=caseTarget(item);
      target.ordinal=Math.max(1,Math.min(squareCount,target.ordinal));
      const targetIndex=nthSquareIndex(pattern,target.ordinal);
      let entry=null,method="",score=null;

      /* 案例列表与碑文方框顺序同源；总数完整时直接按累计序号确定真实字框。 */
      if(squareOrderComplete){
        entry=squareEntries[caseStartOrdinal+target.ordinal-1]||null;
        if(entry){
          method="square-order-primary";
          squareOrderLocated+=1;
          const streamIndex=stream.indexOf(entry);
          score=contextScore(pattern,targetIndex,stream,streamIndex);
          cursor=Math.max(cursor,streamIndex+1);
        }
      }

      /* 若汇总文件中的方框数不完整，再依碑文先后顺序做上下文定位。 */
      if(!entry){
        entry=orderedContextCandidate(pattern,targetIndex,target.restoredText,stream,cursor);
        if(entry){
          method="ordered-context";
          contextLocated+=1;
          score=contextScore(pattern,targetIndex,stream,entry.index);
          cursor=Math.max(cursor,entry.index+1);
        }
      }

      const location=locationFromEntry(entry,method,target,score);
      if(!location){
        unresolved.push(String(item?.id||"?"));
        return item;
      }
      return {...item,locations:[location],page:location.page};
    });

    const report={
      total:source.length,
      located:source.length-unresolved.length,
      unresolved,
      coordinateRows:stream.length,
      coordinateSquares:squareEntries.length,
      requiredSquares,
      squareOrderComplete,
      squareOrderLocated,
      contextLocated
    };
    window.WORK_007_LOCATION_REPORT=report;
    window.dispatchEvent(new CustomEvent("work-007-location-audit",{detail:report}));
    console.info("[work-007-coordinate-adapter]",report);
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
        },400*state.count);
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
          if(pageImage&&(!pageImage.src||!pageImage.src.includes("raw.githubusercontent.com"))&&typeof loadPage==="function"){
            loadPage(typeof currentPageIndex==="number"?currentPageIndex:0);
          }
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
    const rows=(await loadPageRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };

  window.WORK_007_COORDINATES={
    loadPageRows,
    loadModelRows,
    locateCases,
    caseTarget,
    getReport:()=>window.WORK_007_LOCATION_REPORT||null
  };
  window.__WORK_007_COORDINATE_ADAPTER__=true;

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installReaderImageStability,{once:true});
  else installReaderImageStability();
})();
