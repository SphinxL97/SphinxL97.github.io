/* 007《伊阙佛龛碑》栏目一真实逐字坐标与栏目三全案例定位适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER__)return;

  const PAGE_COUNT=124;
  const PAGE_BOX_ROOT="data/glyph_boxes/iiif/007";
  const CACHE_TAG="20260722_yique_all_cases_v5";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const failedPages=new Set();
  let groupedPromise=null;

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
        if(token.type==="char"&&token.value===expected){
          tokenIndex+=1;
          break;
        }
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

  function normalizeRow(row,page,index){
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {
      ...row,
      work_id:"007",
      canvas_index:Number(row.canvas_index||row.page||page),
      glyph_id:String(row.glyph_id||`007_${page}_${index+1}`),
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

  function pageBoxURL(page){
    return `${PAGE_BOX_ROOT}/page_${String(page).padStart(4,"0")}.json?v=${CACHE_TAG}`;
  }

  async function fetchPageRows(pageNo,attempt=0){
    try{
      const response=await fetch(pageBoxURL(pageNo),{cache:attempt?"reload":"force-cache"});
      if(response.status===404)return {rows:[],missing:true};
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      const rows=(Array.isArray(data)?data:[])
        .map((row,index)=>normalizeRow(row,pageNo,index))
        .filter(Boolean)
        .sort((a,b)=>a.order_in_page-b.order_in_page);
      return {rows,missing:false};
    }catch(error){
      if(attempt<2){
        await sleep(180*(attempt+1));
        return fetchPageRows(pageNo,attempt+1);
      }
      throw error;
    }
  }

  function loadPageRows(page,{force=false}={}){
    const pageNo=Number(page||0);
    if(!pageNo)return Promise.resolve([]);
    if(force){
      pagePromises.delete(pageNo);
      failedPages.delete(pageNo);
    }
    if(!pagePromises.has(pageNo)){
      pagePromises.set(pageNo,fetchPageRows(pageNo)
        .then(result=>{
          failedPages.delete(pageNo);
          return result.rows;
        })
        .catch(error=>{
          failedPages.add(pageNo);
          console.warn("[work-007-coordinate-adapter] page",pageNo,error);
          return [];
        }));
    }
    return pagePromises.get(pageNo);
  }

  async function loadAllPages({retryFailures=true}={}){
    const groups=new Map();
    const concurrency=6;
    for(let start=1;start<=PAGE_COUNT;start+=concurrency){
      const pageNumbers=Array.from(
        {length:Math.min(concurrency,PAGE_COUNT-start+1)},
        (_,offset)=>start+offset
      );
      const lists=await Promise.all(pageNumbers.map(page=>loadPageRows(page)));
      lists.forEach((rows,index)=>{
        if(rows.length)groups.set(pageNumbers[index],rows);
      });
    }

    if(retryFailures&&failedPages.size){
      const retryPages=Array.from(failedPages).sort((a,b)=>a-b);
      for(let start=0;start<retryPages.length;start+=concurrency){
        const pageNumbers=retryPages.slice(start,start+concurrency);
        const lists=await Promise.all(pageNumbers.map(page=>loadPageRows(page,{force:true})));
        lists.forEach((rows,index)=>{
          if(rows.length)groups.set(pageNumbers[index],rows);
        });
      }
    }
    return groups;
  }

  function loadGroupedRows(){
    if(!groupedPromise)groupedPromise=loadAllPages({retryFailures:true});
    return groupedPromise;
  }

  function buildStream(groups){
    const stream=[];
    Array.from(groups.keys()).sort((a,b)=>a-b).forEach(page=>{
      (groups.get(page)||[]).forEach(row=>{
        const key=canonical(row.char||row.text||"");
        if(key)stream.push({key,row,page,index:stream.length});
      });
    });
    return stream;
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

  function evaluateCandidate(keys,index,context,restoredKey){
    let compared=0;
    let matched=0;
    for(const item of context){
      const candidateIndex=index+item.offset;
      if(candidateIndex<0||candidateIndex>=keys.length)continue;
      compared+=1;
      if(keys[candidateIndex]===item.key)matched+=1;
    }
    const targetKey=keys[index]||"";
    const targetAgreement=targetKey==="□"||Boolean(restoredKey&&targetKey===restoredKey);
    const ratio=compared?matched/compared:0;
    const score=matched*100+ratio*10+compared+(targetAgreement?25:0);
    return {matched,compared,ratio,targetAgreement,score};
  }

  function selectUnique(ranked,{minimumCompared=4,minimumRatio=.76,minimumMatched=4}={}){
    ranked.sort((a,b)=>
      b.score-a.score||
      b.matched-a.matched||
      b.ratio-a.ratio||
      b.compared-a.compared
    );
    const best=ranked[0];
    const second=ranked[1];
    if(!best)return null;
    if(best.compared<minimumCompared||best.matched<minimumMatched||best.ratio<minimumRatio)return null;
    if(second){
      const closeScore=best.score-second.score<18;
      const sameEvidence=best.matched===second.matched&&Math.abs(best.ratio-second.ratio)<.05;
      if(closeScore&&sameEvidence&&best.targetAgreement===second.targetAgreement)return null;
    }
    return best;
  }

  function pageLocalCandidate(pattern,targetIndex,restoredText,groups){
    const context=contextOffsets(pattern,targetIndex,22);
    const restoredKey=canonical(restoredText);
    const ranked=[];

    groups.forEach((rows,page)=>{
      const keys=rows.map(row=>canonical(row.char||row.text||""));
      rows.forEach((row,index)=>{
        const evidence=evaluateCandidate(keys,index,context,restoredKey);
        if(evidence.compared<4)return;
        ranked.push({page,index,row,...evidence});
      });
    });

    const best=selectUnique(ranked,{minimumCompared:4,minimumRatio:.76,minimumMatched:4});
    return best?{key:canonical(best.row.char||best.row.text||""),row:best.row,page:best.page,index:-1}:null;
  }

  function orderedStreamCandidate(pattern,targetIndex,restoredText,stream,cursor){
    const context=contextOffsets(pattern,targetIndex,24);
    const restoredKey=canonical(restoredText);
    const keys=stream.map(entry=>entry.key);
    const ranked=[];
    const start=Math.max(0,Number(cursor||0)-8);

    for(let index=start;index<stream.length;index+=1){
      const evidence=evaluateCandidate(keys,index,context,restoredKey);
      if(evidence.compared<5)continue;
      ranked.push({index,entry:stream[index],...evidence});
    }

    const best=selectUnique(ranked,{minimumCompared:5,minimumRatio:.74,minimumMatched:5});
    return best?{...best.entry,index:best.index}:null;
  }

  function squareOrderEntry(squareEntries,ordinal){
    const entry=squareEntries[ordinal]||null;
    if(!entry)return null;
    return {...entry,index:entry.index};
  }

  function locationFromEntry(entry,method,target){
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
      restored_text:target.restoredText||""
    };
  }

  async function locateCases(items){
    const groups=await loadGroupedRows();
    const stream=buildStream(groups);
    const glyphIndex=new Map(stream.map((entry,index)=>[String(entry.row.glyph_id||""),index]));
    const squareEntries=stream.filter(entry=>entry.key==="□");
    const source=Array.isArray(items)?items:[];
    let globalSquareOrdinal=0;
    let cursor=0;
    let pageLocalLocated=0;
    let orderedLocated=0;
    let squareLocated=0;
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
      let entry=pageLocalCandidate(pattern,targetIndex,target.restoredText,groups);
      let method="";

      if(entry){
        method="page-local-context";
        entry.index=glyphIndex.get(String(entry.row.glyph_id||""))??-1;
        pageLocalLocated+=1;
      }

      if(!entry){
        entry=orderedStreamCandidate(pattern,targetIndex,target.restoredText,stream,cursor);
        if(entry){
          method="ordered-context";
          orderedLocated+=1;
        }
      }

      if(!entry&&[67,69].includes(squareEntries.length)){
        entry=squareOrderEntry(squareEntries,caseStartOrdinal+target.ordinal-1);
        if(entry){
          method="square-order";
          squareLocated+=1;
        }
      }

      const location=locationFromEntry(entry,method,target);
      if(!location){
        unresolved.push(String(item?.id||item?.n||"?"));
        return item;
      }

      if(Number(entry.index)>=0)cursor=Math.max(cursor,Number(entry.index)+1);
      return {...item,locations:[location],page:location.page};
    });

    const report={
      total:source.length,
      located:source.length-unresolved.length,
      pageLocalLocated,
      orderedLocated,
      squareLocated,
      unresolved,
      failedPages:Array.from(failedPages).sort((a,b)=>a-b),
      loadedPages:Array.from(groups.keys()).sort((a,b)=>a-b)
    };
    window.WORK_007_LOCATION_REPORT=report;
    window.dispatchEvent(new CustomEvent("work-007-location-audit",{detail:report}));
    console.info("[work-007-coordinate-adapter]",report);
    return resolved;
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="007")return original?original(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(await loadPageRows(page)).map(row=>({
      ...row,
      local_image:pageObj?.image||row.local_image||""
    }));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };

  window.WORK_007_COORDINATES={
    loadPageRows,
    loadGroupedRows,
    locateCases,
    caseTarget,
    getReport:()=>window.WORK_007_LOCATION_REPORT||null
  };
  window.__WORK_007_COORDINATE_ADAPTER__=true;
})();
