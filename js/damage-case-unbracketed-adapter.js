/* 001—007 旧案例候选格式适配。
 * 对“AI推测为：原句补字结果”等未使用〔〕的旧数据，
 * 只提取原释文“□”左右锚点之间的候选字，并重建为原句底稿。
 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(!["001","002","003","004","005","006","007"].includes(workId)||window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__)return;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;

  const ignored=/[\s，。；：、？！“”‘’（）《》【】〈〉,.!?;:—－…〔〕]/;
  const clean=value=>Array.from(String(value||"")).filter(ch=>!ignored.test(ch)).join("");
  const takeChars=(value,count)=>Array.from(String(value||"")).slice(0,count).join("");

  function groups(text){
    const result=[];let match;const re=/□+/g;
    while((match=re.exec(text)))result.push({start:match.index,end:match.index+match[0].length,count:match[0].length});
    return result;
  }

  function findCandidate(corrected,leftSource,rightSource,count,from){
    const correctedClean=clean(corrected);
    const leftClean=clean(leftSource),rightClean=clean(rightSource);
    for(let leftLength=Math.min(10,leftClean.length);leftLength>=2;leftLength--){
      const left=leftClean.slice(-leftLength);
      let leftAt=correctedClean.indexOf(left,Math.max(0,from-leftLength));
      while(leftAt>=0){
        const candidateStart=leftAt+left.length;
        for(let rightLength=Math.min(10,rightClean.length);rightLength>=2;rightLength--){
          const right=rightClean.slice(0,rightLength);
          const rightAt=correctedClean.indexOf(right,candidateStart);
          if(rightAt<0)continue;
          const between=correctedClean.slice(candidateStart,rightAt);
          if(Array.from(between).length>=1&&Array.from(between).length<=Math.max(8,count+4)){
            return {text:takeChars(between,count),next:rightAt};
          }
        }
        leftAt=correctedClean.indexOf(left,leftAt+1);
      }
    }
    return null;
  }

  function adaptItem(item){
    const original=String(item?.o??item?.original??"");
    const corrected=String(item?.c??item?.corrected??"");
    if(!original.includes("□")||!corrected||corrected.includes("〔"))return false;

    const gs=groups(original),candidates=[];
    let searchFrom=0;
    gs.forEach(group=>{
      const left=original.slice(0,group.start);
      const right=original.slice(group.end);
      const found=findCandidate(corrected,left,right,group.count,searchFrom);
      candidates.push(found?.text||"");
      if(found)searchFrom=found.next;
    });
    if(!candidates.some(Boolean))return false;

    let rebuilt="",cursor=0;
    gs.forEach((group,index)=>{
      rebuilt+=original.slice(cursor,group.start);
      const candidate=candidates[index];
      if(candidate){
        rebuilt+=`〔${candidate}〕`;
        const candidateCount=Array.from(candidate).length;
        if(candidateCount<group.count)rebuilt+="□".repeat(group.count-candidateCount);
      }else rebuilt+="□".repeat(group.count);
      cursor=group.end;
    });
    rebuilt+=original.slice(cursor);
    item.c=rebuilt;
    item.corrected=rebuilt;
    return true;
  }

  function adapt(){
    const cases=window.DAMAGE_AI_CASES;
    if(!Array.isArray(cases)||!cases.length)return false;
    cases.forEach(adaptItem);
    window.dispatchEvent(new CustomEvent("damage-case-unbracketed-ready",{detail:{workId}}));
    return true;
  }

  if(adapt())return;
  ["work-001-content-ready","work-002-content-ready","work-003-content-ready","work-004-content-ready","work-005-content-ready","work-006-content-ready","work-007-content-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(adapt,0),{once:true}));
  let tries=0;
  const timer=setInterval(()=>{tries+=1;if(adapt()||tries>=50)clearInterval(timer);},100);
})();