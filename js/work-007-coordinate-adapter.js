/* 007《伊阙佛龛碑》栏目一真实逐字坐标与栏目三案例定位适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER__)return;

  const MODEL_URL="data/model_boxes/glyph_model_border_006_010.json?v=20260722_yique_fix_v3";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
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

  function targetSquareOrdinal(item){
    const originalPattern=compact(item?.original||item?.o||"");
    const corrected=correctedTokens(item?.corrected||item?.c||"");
    let tokenIndex=0;
    let squareOrdinal=0;
    let firstRecovered=0;

    for(const expected of originalPattern){
      if(expected==="□"){
        squareOrdinal+=1;
        const token=corrected[tokenIndex];
        if(token?.type==="restored"&&token.value&&!firstRecovered)firstRecovered=squareOrdinal;
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

    return firstRecovered||1;
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

  function loadGroupedRows(){
    if(!groupedPromise){
      groupedPromise=fetch(MODEL_URL,{cache:"force-cache"})
        .then(response=>{
          if(!response.ok)throw new Error(`伊阙佛龛碑坐标 ${response.status}`);
          return response.json();
        })
        .then(rows=>{
          const groups=new Map();
          (Array.isArray(rows)?rows:[])
            .filter(row=>String(row.work_id||"").padStart(3,"0")==="007")
            .forEach((row,index)=>{
              const page=Number(row.canvas_index||row.page||0);
              if(!page)return;
              const box=rect(row);
              if(box.w<=0||box.h<=0)return;
              if(!groups.has(page))groups.set(page,[]);
              const text=String(row.char||row.text||"").slice(0,1);
              groups.get(page).push({
                ...row,
                work_id:"007",
                canvas_index:page,
                glyph_id:String(row.glyph_id||`007_${page}_${index+1}`),
                char:text,
                text,
                order_in_page:Number(row.order_in_page||index+1),
                bbox_x:box.x,
                bbox_y:box.y,
                bbox_w:box.w,
                bbox_h:box.h,
                bbox:[box.x,box.y,box.w,box.h]
              });
            });
          groups.forEach(list=>list.sort((a,b)=>a.order_in_page-b.order_in_page));
          return groups;
        })
        .catch(error=>{
          console.error("[work-007-coordinate-adapter]",error);
          return new Map();
        });
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

  function exactCandidates(pattern,targetSquare,stream){
    const hits=[];
    for(let start=0;start+pattern.length<=stream.length;start+=1){
      const target=stream[start+targetSquare];
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
      if(ok)hits.push(start+targetSquare);
    }
    return hits;
  }

  function fuzzyCandidate(pattern,targetSquare,stream){
    const relative=[];
    const from=Math.max(0,targetSquare-18);
    const to=Math.min(pattern.length-1,targetSquare+18);
    for(let index=from;index<=to;index+=1){
      if(index===targetSquare||pattern[index]==="□")continue;
      relative.push({offset:index-targetSquare,key:pattern[index]});
    }
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

  function locationFromEntry(entry,method,ordinal,item){
    if(!entry)return null;
    const row=entry.row;
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    const restored=correctedTokens(item?.corrected||item?.c||"")
      .filter(token=>token.type==="restored"&&token.value)
      .map(token=>token.value)[0]||"";
    return {
      page:Number(entry.page||row.canvas_index||0),
      glyph_id:String(row.glyph_id||""),
      canvas:{w:Number(row.canvas_width||2943),h:Number(row.canvas_height||4429)},
      bbox:{x:box.x,y:box.y,w:box.w,h:box.h},
      match_method:method,
      target_square_ordinal:ordinal,
      target_kind:restored?"restored":"first-missing",
      restored_text:restored
    };
  }

  async function locateCases(items){
    const groups=await loadGroupedRows();
    const stream=buildStream(groups);
    const squareEntries=stream.filter(entry=>entry.key==="□");
    const source=Array.isArray(items)?items:[];
    let globalSquareOrdinal=0;
    let located=0;

    const resolved=source.map(item=>{
      const currentLocations=Array.isArray(item?.locations)?item.locations:[];
      const pattern=compact(item?.original||item?.o||"");
      const squareCount=pattern.filter(char=>char==="□").length;
      const caseStartOrdinal=globalSquareOrdinal;
      globalSquareOrdinal+=squareCount;
      if(currentLocations.length||!squareCount)return item;

      const localOrdinal=Math.max(1,Math.min(squareCount,targetSquareOrdinal(item)));
      const targetSquare=nthSquareIndex(pattern,localOrdinal);
      let targetIndex=-1;
      let method="";

      const exact=exactCandidates(pattern,targetSquare,stream);
      if(exact.length===1){
        targetIndex=exact[0];
        method="context-exact";
      }else{
        targetIndex=fuzzyCandidate(pattern,targetSquare,stream);
        if(targetIndex>=0)method="context-fuzzy";
      }

      if(targetIndex<0&&[67,69].includes(squareEntries.length)){
        const ordinalEntry=squareEntries[caseStartOrdinal+localOrdinal-1];
        if(ordinalEntry){
          targetIndex=stream.indexOf(ordinalEntry);
          method="square-order";
        }
      }

      const location=locationFromEntry(stream[targetIndex],method,localOrdinal,item);
      if(!location)return item;
      located+=1;
      return {...item,locations:[location],page:location.page};
    });

    console.info(`[work-007-coordinate-adapter] 已定位 ${located}/${source.length} 例；坐标字框 ${stream.length} 个，方框标记 ${squareEntries.length} 个。`);
    return resolved;
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").split("-")[0].padStart(3,"0");
    if(normalized!=="007")return original?original(id,pageObj):[];
    const groups=await loadGroupedRows();
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(groups.get(page)||[]).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };

  window.WORK_007_COORDINATES={loadGroupedRows,locateCases,targetSquareOrdinal};
  window.__WORK_007_COORDINATE_ADAPTER__=true;
})();
