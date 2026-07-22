/* 007《伊阙佛龛碑》栏目一真实逐字坐标与栏目三页内定位适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER__)return;

  const PAGE_COUNT=124;
  const PAGE_BOX_ROOT="data/glyph_boxes/iiif/007";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  let groupedPromise=null;

  const variants={
    "扵":"於","於":"於","乗":"乘","乘":"乘","髙":"高","高":"高",
    "圡":"土","土":"土","邱":"丘","丘":"丘","无":"無","無":"無",
    "祕":"秘","秘":"秘","峯":"峰","峰":"峰","羣":"群","群":"群",
    "衆":"眾","眾":"眾","爲":"為","為":"為","裏":"裡","裡":"裡"
  };
  const ignored=/[\s\u3000，。；：、！？,.!?;:“”‘’'"（）()《》〈〉【】〔〕［］—–…·]/u;

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
    return `${PAGE_BOX_ROOT}/page_${String(page).padStart(4,"0")}.json?v=20260722_yique_page_local_v4`;
  }

  function loadPageRows(page){
    const pageNo=Number(page||0);
    if(!pageNo)return Promise.resolve([]);
    if(!pagePromises.has(pageNo)){
      pagePromises.set(pageNo,fetch(pageBoxURL(pageNo),{cache:"force-cache"})
        .then(response=>{
          if(response.status===404)return [];
          if(!response.ok)throw new Error(`伊阙佛龛碑第${pageNo}页坐标 ${response.status}`);
          return response.json();
        })
        .then(rows=>(Array.isArray(rows)?rows:[])
          .map((row,index)=>normalizeRow(row,pageNo,index))
          .filter(Boolean)
          .sort((a,b)=>a.order_in_page-b.order_in_page))
        .catch(error=>{
          console.warn("[work-007-coordinate-adapter] page",pageNo,error);
          return [];
        }));
    }
    return pagePromises.get(pageNo);
  }

  async function loadGroupedRows(){
    if(!groupedPromise){
      groupedPromise=(async()=>{
        const groups=new Map();
        const concurrency=12;
        for(let start=1;start<=PAGE_COUNT;start+=concurrency){
          const pageNumbers=Array.from(
            {length:Math.min(concurrency,PAGE_COUNT-start+1)},
            (_,offset)=>start+offset
          );
          const lists=await Promise.all(pageNumbers.map(loadPageRows));
          lists.forEach((rows,index)=>{
            if(rows.length)groups.set(pageNumbers[index],rows);
          });
        }
        return groups;
      })();
    }
    return groupedPromise;
  }

  function buildStream(groups){
    const stream=[];
    Array.from(groups.keys()).sort((a,b)=>a-b).forEach(page=>{
      (groups.get(page)||[]).forEach(row=>{
        const key=canonical(row.char||row.text||"");
        if(key)stream.push({key,row,page});
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

  function pageLocalCandidate(pattern,targetIndex,restoredText,groups){
    const context=contextOffsets(pattern,targetIndex);
    const restoredKey=canonical(restoredText);
    const ranked=[];

    groups.forEach((rows,page)=>{
      const keys=rows.map(row=>canonical(row.char||row.text||""));
      rows.forEach((row,index)=>{
        let compared=0;
        let matched=0;
        for(const item of context){
          const candidateIndex=index+item.offset;
          if(candidateIndex<0||candidateIndex>=keys.length)continue;
          compared+=1;
          if(keys[candidateIndex]===item.key)matched+=1;
        }
        if(compared<4)return;

        const targetKey=keys[index];
        const targetAgreement=targetKey==="□"||Boolean(restoredKey&&targetKey===restoredKey);
        const ratio=matched/compared;
        const score=matched*10+ratio+(targetAgreement?2:0);

        if(matched>=4&&ratio>=.75){
          ranked.push({page,index,row,matched,compared,ratio,targetAgreement,score});
        }
      });
    });

    ranked.sort((a,b)=>
      b.score-a.score||
      b.matched-a.matched||
      b.ratio-a.ratio||
      b.compared-a.compared
    );

    const best=ranked[0];
    const second=ranked[1];
    if(!best)return null;

    const requiredMatches=Math.min(8,Math.max(4,Math.ceil(best.compared*.72)));
    if(best.matched<requiredMatches||best.ratio<.78)return null;

    if(second){
      const sameStrength=
        best.matched===second.matched&&
        Math.abs(best.ratio-second.ratio)<.06&&
        best.targetAgreement===second.targetAgreement;
      if(sameStrength)return null;
    }

    return {key:canonical(best.row.char||best.row.text||""),row:best.row,page:best.page};
  }

  function exactCandidates(pattern,targetIndex,stream){
    const hits=[];
    for(let start=0;start+pattern.length<=stream.length;start+=1){
      const target=stream[start+targetIndex];
      if(!target)continue;
      let ok=true;
      for(let index=0;index<pattern.length;index+=1){
        const expected=pattern[index];
        if(expected==="□")continue;
        if(stream[start+index]?.key!==expected){
          ok=false;
          break;
        }
      }
      if(ok)hits.push(start+targetIndex);
    }
    return hits;
  }

  function fuzzyCandidate(pattern,targetIndex,stream){
    const relative=contextOffsets(pattern,targetIndex);
    if(relative.length<4)return -1;

    const ranked=[];
    for(let index=0;index<stream.length;index+=1){
      let compared=0;
      let matched=0;
      for(const item of relative){
        const candidate=stream[index+item.offset];
        if(!candidate)continue;
        compared+=1;
        if(candidate.key===item.key)matched+=1;
      }
      if(compared<Math.min(6,relative.length))continue;
      ranked.push({index,matched,compared,ratio:matched/compared});
    }

    ranked.sort((a,b)=>b.matched-a.matched||b.ratio-a.ratio||b.compared-a.compared);
    const best=ranked[0];
    const second=ranked[1];
    if(!best)return -1;
    const minimum=relative.length<=7?relative.length:Math.max(7,Math.ceil(best.compared*.82));
    if(best.matched<minimum||best.ratio<.82)return -1;
    if(second&&best.matched===second.matched&&Math.abs(best.ratio-second.ratio)<.08)return -1;
    return best.index;
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
    const squareEntries=stream.filter(entry=>entry.key==="□");
    const source=Array.isArray(items)?items:[];
    let globalSquareOrdinal=0;
    let located=0;
    let pageLocalLocated=0;

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
      let entry=null;
      let method="";

      /* 方案A：优先复用栏目一同源的逐页坐标，在单页字序内匹配目标缺字。 */
      entry=pageLocalCandidate(pattern,targetIndex,target.restoredText,groups);
      if(entry){
        method="page-local-context";
        pageLocalLocated+=1;
      }

      /* 页内上下文无法唯一确定时，才退回全文连续字序匹配。 */
      if(!entry){
        const exact=exactCandidates(pattern,targetIndex,stream);
        if(exact.length===1){
          entry=stream[exact[0]];
          method="context-exact";
        }else{
          const fuzzyIndex=fuzzyCandidate(pattern,targetIndex,stream);
          if(fuzzyIndex>=0){
            entry=stream[fuzzyIndex];
            method="context-fuzzy";
          }
        }
      }

      /* 最后只在方框总数与正文缺字数一致时使用方框顺序兜底。 */
      if(!entry&&[67,69].includes(squareEntries.length)){
        entry=squareEntries[caseStartOrdinal+target.ordinal-1]||null;
        if(entry)method="square-order";
      }

      const location=locationFromEntry(entry,method,target);
      if(!location)return item;
      located+=1;
      return {...item,locations:[location],page:location.page};
    });

    console.info(
      `[work-007-coordinate-adapter] 已定位 ${located}/${source.length} 例；`+
      `其中页内定位 ${pageLocalLocated} 例；逐页坐标 ${stream.length} 字框，方框 ${squareEntries.length} 个。`
    );
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

  window.WORK_007_COORDINATES={loadPageRows,loadGroupedRows,locateCases,caseTarget};
  window.__WORK_007_COORDINATE_ADAPTER__=true;
})();