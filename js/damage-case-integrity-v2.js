/* 001—007 残损案例统一规则（稳定版）。
 * 只在原释文“□”处补入候选；不改写原句其他文字和标点。
 * 每个案例的拓片区只显示第一个可定位的问题字。
 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const allowed=["001","002","003","004","005","006","007"];
  if(!allowed.includes(workId)||window.__DAMAGE_CASE_INTEGRITY_V2__)return;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;

  const TITLES={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑"};
  const MODELS={
    "005":"data/model_boxes/glyph_model_border_001_005.json?v=20260721_integrity_v2",
    "006":"data/model_boxes/glyph_model_border_006_010.json?v=20260721_integrity_v2",
    "007":"data/model_boxes/glyph_model_border_006_010.json?v=20260721_integrity_v2"
  };
  const PAGE_INDEX="data/page_images_index.json?v=20260721_integrity_v2";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字或疑难字提出校读意见。外部录文仅用于判断问题位置的候选文字，不用于增补原释文未标缺的位置，也不改写原句已有文字和标点。";
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const punctuation=/[\s，。；：、？！“”‘’（）《》【】〈〉,.!?;:—－…]/;
  const stripPunctuation=v=>Array.from(String(v||"")).filter(ch=>!punctuation.test(ch)&&ch!=="〔"&&ch!=="〕").join("");
  const stripCandidate=v=>stripPunctuation(v).replace(/□/g,"");

  function groups(text){
    const output=[];let match;const re=/□+/g;
    while((match=re.exec(text)))output.push({start:match.index,end:match.index+match[0].length,count:match[0].length});
    return output;
  }

  function brackets(text){
    const output=[];let match;const re=/〔([^〕]*)〕/g;
    while((match=re.exec(text)))output.push({start:match.index,end:match.index+match[0].length,text:stripCandidate(match[1]),used:false});
    return output;
  }

  function suffixScore(a,b){
    a=stripPunctuation(a);b=stripPunctuation(b);let n=0;
    while(n<a.length&&n<b.length&&a[a.length-1-n]===b[b.length-1-n])n++;
    return n;
  }
  function prefixScore(a,b){
    a=stripPunctuation(a);b=stripPunctuation(b);let n=0;
    while(n<a.length&&n<b.length&&a[n]===b[n])n++;
    return n;
  }
  function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}

  function exactCandidates(original,corrected){
    const gs=groups(original);if(!gs.length)return null;
    let cursor=0,pattern="^";
    gs.forEach(g=>{pattern+=escapeRegExp(original.slice(cursor,g.start))+"([\\s\\S]+?)";cursor=g.end;});
    pattern+=escapeRegExp(original.slice(cursor))+"$";
    try{
      const match=String(corrected||"").replace(/[〔〕]/g,"").match(new RegExp(pattern));
      if(!match)return null;
      return gs.map((g,i)=>stripCandidate(match[i+1]).slice(0,g.count));
    }catch(_){return null;}
  }

  function contextualCandidates(original,corrected){
    const gs=groups(original),bs=brackets(corrected),result=[];
    gs.forEach(g=>{
      const left=original.slice(Math.max(0,g.start-20),g.start);
      const right=original.slice(g.end,Math.min(original.length,g.end+20));
      let best=null,bestScore=-1;
      bs.forEach(b=>{
        if(b.used||!b.text)return;
        const l=suffixScore(left,corrected.slice(0,b.start));
        const r=prefixScore(right,corrected.slice(b.end));
        const score=l*2+r*2-Math.abs(b.text.length-g.count)*0.1;
        if(score>bestScore){bestScore=score;best={b,l,r};}
      });
      if(best&&(best.l>=2||best.r>=2||best.l+best.r>=3)){
        best.b.used=true;
        result.push(best.b.text.slice(0,g.count));
      }else result.push("");
    });
    return result;
  }

  function restrict(original,corrected){
    const gs=groups(original);if(!gs.length)return {marked:String(corrected||original),plain:String(corrected||original),resolved:0};
    let cs=exactCandidates(original,corrected);
    if(!cs)cs=contextualCandidates(original,String(corrected||""));
    let marked="",plain="",cursor=0,resolved=0;
    gs.forEach((g,i)=>{
      const candidate=cs[i]||"";
      marked+=original.slice(cursor,g.start);plain+=original.slice(cursor,g.start);
      if(candidate){
        marked+=`〔${candidate}〕`;plain+=candidate;resolved+=candidate.length;
        if(candidate.length<g.count){const rest="□".repeat(g.count-candidate.length);marked+=rest;plain+=rest;}
      }else{const rest="□".repeat(g.count);marked+=rest;plain+=rest;}
      cursor=g.end;
    });
    marked+=original.slice(cursor);plain+=original.slice(cursor);
    return {marked,plain,resolved};
  }

  function snippet(original){
    const at=original.indexOf("□");if(at<0)return original.slice(0,28);
    let start=Math.max(0,at-12),end=Math.min(original.length,at+14);
    for(let i=at-1;i>=Math.max(0,at-28);i--){if(/[。；！？\n]/.test(original[i])){start=i+1;break;}}
    for(let i=at;i<Math.min(original.length,at+32);i++){if(/[。；！？\n]/.test(original[i])){end=i+1;break;}}
    return original.slice(start,end).trim();
  }

  function normalize(item,index){
    const original=String(item.o??item.original??"");
    const category=String(item.n??item.category??"");
    const oldTitle=String(item.t??item.title??item.s??"");
    const residual=/残损|缺字|补释/.test(category+oldTitle)||original.includes("□");
    if(residual&&!original.includes("□")&&!original.includes("?"))return null;

    const out=clone(item),id=String(index+1).padStart(2,"0");
    out.id=id;out.i=id;out.n=category||"残损碑文恢复";out.category=out.n;
    out.o=original;out.original=original;

    if(original.includes("□")){
      const fixed=restrict(original,String(item.c??item.corrected??original));
      const gs=groups(original),groupCount=gs.length,boxCount=gs.reduce((n,g)=>n+g.count,0);
      const title=snippet(original);
      out.c=fixed.marked;out.corrected=fixed.marked;out.r=fixed.plain;out.restored=fixed.plain;
      out.t=`残损碑文恢复——“${title}”`;out.title=title;out.s=title;
      out.groupCount=groupCount;out.boxCount=boxCount;
      out.e=[
        `当前原释文包含${groupCount}组缺字，共${boxCount}个“□”。`,
        "本例只在原释文“□”对应的位置补入候选，原句已有文字和标点保持不变。",
        "其他录文仅作为判断缺字候选的参考，不采用原释文未标缺位置的增字、改字或改写。",
        fixed.resolved?"候选文字仍需结合当前拓片字形和更早拓本继续核验。":"现有资料不足以可靠确定该缺字，因此继续保留原“□”。"
      ];
      out.analysis=[...out.e];
      out.usage="栏目二保留原始“□”；栏目三和栏目四只展示与该“□”位置对应的候选文字。";
      if(!fixed.resolved){out.mode="unresolved";out.basis="暂未恢复";out.confidence="暂无法判断";}
    }else{
      out.c=String(item.c??item.corrected??original);out.corrected=out.c;
      out.r=String(item.r??item.restored??out.c);out.restored=out.r;
      out.t=oldTitle||out.n;
      out.title=String(item.title??item.s??oldTitle??out.n);
      out.e=Array.isArray(item.e)?[...item.e]:(Array.isArray(item.analysis)?[...item.analysis]:[]);
      out.analysis=[...out.e];
    }
    out.page=item.page??item.canvas_index??item.locations?.[0]?.page??"—";
    return out;
  }

  function normalizeAll(rows){
    const output=[];
    (Array.isArray(rows)?rows:[]).forEach(item=>{const value=normalize(item,output.length);if(value)output.push(value);});
    output.forEach((item,i)=>{item.id=String(i+1).padStart(2,"0");item.i=item.id;});
    return output;
  }

  const map={"扵":"于","於":"于","乗":"乘","髙":"高","寳":"宝","眀":"明","緫":"总","揔":"总","禮":"礼","靈":"灵","體":"体","變":"变","廣":"广","貴":"贵","備":"备","聖":"圣","發":"发","雲":"云","盡":"尽","稱":"称","論":"论","從":"从","閣":"阁","闕":"阙","隷":"隶","冊":"册","諸":"诸","後":"后"};
  const norm=ch=>map[ch]||ch;
  const anchor=v=>Array.from(String(v||"")).filter(ch=>!punctuation.test(ch)&&ch!=="□").map(norm);
  const match=(seq,start,a)=>{if(start<0||start+a.length>seq.length)return false;for(let i=0;i<a.length;i++)if(seq[start+i].ch!==a[i])return false;return true;};

  let modelPromise=null;
  function model(){
    const url=MODELS[workId];if(!url)return Promise.resolve({seq:[],images:new Map()});
    if(!modelPromise)modelPromise=Promise.all([
      fetch(url,{cache:"force-cache"}).then(r=>r.ok?r.json():[]),
      fetch(PAGE_INDEX,{cache:"force-cache"}).then(r=>r.ok?r.json():{})
    ]).then(([rows,index])=>{
      const seq=(Array.isArray(rows)?rows:[])
        .filter(r=>String(r.work_id||"").padStart(3,"0")===workId)
        .sort((a,b)=>Number(a.canvas_index||a.page||0)-Number(b.canvas_index||b.page||0)||Number(a.order_in_page||0)-Number(b.order_in_page||0))
        .map(row=>({ch:norm(String(row.char||row.text||"").slice(0,1)),row}))
        .filter(x=>x.ch&&!punctuation.test(x.ch));
      const pages=Array.isArray(index?.works?.[workId]?.pages)?index.works[workId].pages:[];
      return {seq,images:new Map(pages.map(p=>[Number(p.page),p.image]))};
    }).catch(error=>{console.warn("[integrity-v2] model",error);return {seq:[],images:new Map()};});
    return modelPromise;
  }

  async function locate(item){
    if(item._visual!==undefined)return item._visual;
    if(item.locations?.[0]){item._visual=item.locations[0];return item._visual;}
    const direct=item.target||item.targets?.[0];
    if(item.image&&item.canvas&&direct){item._visual={page:Number(item.page||0),image:item.image,canvas:item.canvas,target:direct};return item._visual;}
    if(!String(item.o||"").includes("□")||!MODELS[workId]){item._visual=null;return null;}

    const data=await model();if(!data.seq.length){item._visual=null;return null;}
    const text=String(item.o),at=text.indexOf("□"),leftAll=anchor(text.slice(0,at)),rightAll=anchor(text.slice(at+1));
    const preferred=Number(item.page)||0;let row=null;
    for(let l=Math.min(8,leftAll.length);l>=2&&!row;l--){
      const left=leftAll.slice(-l);
      for(let r=Math.min(8,rightAll.length);r>=2&&!row;r--){
        const right=rightAll.slice(0,r);
        for(let i=0;i<=data.seq.length-left.length&&!row;i++){
          if(!match(data.seq,i,left))continue;
          const start=i+left.length;
          for(let gap=1;gap<=8;gap++){
            if(!match(data.seq,start+gap,right))continue;
            const candidate=data.seq[start];if(!candidate)continue;
            const page=Number(candidate.row.canvas_index||candidate.row.page||0);
            if(preferred&&page!==preferred)continue;
            row=candidate.row;break;
          }
        }
      }
    }
    if(!row&&preferred){const found=data.seq.find(x=>Number(x.row.canvas_index||x.row.page||0)===preferred&&x.ch==="□");if(found)row=found.row;}
    if(!row){item._visual=null;return null;}

    const target={x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)};
    if(!(target.w>0&&target.h>0)){item._visual=null;return null;}
    const page=Number(row.canvas_index||row.page||0);item.page=page;
    item._visual={page,image:data.images.get(page)||row.local_image||"",canvas:{w:Number(row.canvas_width||2943),h:Number(row.canvas_height||4429)},target};
    return item._visual;
  }

  function crop(v){
    const xPad=Math.max(180,v.target.w*1.2),yPad=Math.max(300,v.target.h*2.4);
    const w=Math.min(v.canvas.w,Math.max(520,v.target.w+xPad*2)),h=Math.min(v.canvas.h,Math.max(850,v.target.h+yPad*2));
    return {x:Math.max(0,Math.min(v.canvas.w-w,v.target.x+v.target.w/2-w/2)),y:Math.max(0,Math.min(v.canvas.h-h,v.target.y+v.target.h/2-h/2)),w,h};
  }
  function marked(v){
    const text=String(v||"");let html="",cursor=0,match;const re=/〔([^〕]*)〕/g;
    while((match=re.exec(text))){html+=esc(text.slice(cursor,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;cursor=match.index+match[0].length;}
    return html+esc(text.slice(cursor));
  }
  function label(item){
    if(String(item.c||"").includes("□"))return "暂未恢复";
    if(item.mode==="provisional"||item.basis==="AI语境暂拟"||/低/.test(String(item.confidence||"")))return "AI暂拟补全";
    return String(item.o||"").includes("□")?"文献对校结果":"校读结果";
  }

  let cases=[],current=0,expanded=false,scrollTop=0,signature="",token=0,syncing=false;
  const getSection=()=>document.getElementById("people");
  function visual(item){
    const v=item._visual;
    if(v===undefined)return '<div class="damage-location-missing damage-location-loading"><p>正在定位本句第一个问题字的拓片位置……</p></div>';
    if(!v||!v.image)return '<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用无关字形或虚构红框代替。</p></div>';
    const c=crop(v),t=v.target;
    return `<div class="damage-viewport" data-image="${esc(v.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${c.x} ${c.y} ${c.w} ${c.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(v.image)}" x="0" y="0" width="${v.canvas.w}" height="${v.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"></rect></svg></div><p class="damage-caption">《${esc(TITLES[workId])}》第${v.page||item.page||"—"}页，本句第一个问题字局部</p>`;
  }
  function tabs(){return cases.map((item,i)=>`<button class="damage-tab${i===current?" active":""}" data-integrity-index="${i}" type="button"><b>${item.id}</b><span class="name">${esc(item.n)}</span></button>`).join("");}
  function panel(item){
    const evidence=(item.analysis||item.e||[]).map(x=>`<li>${esc(x)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.t)} <span class="damage-heading-confidence">（${esc(item.confidence||"")}）</span></div><div class="damage-pager"><button data-integrity-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-integrity-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${visual(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${label(item)}</span><div class="damage-text damage-new">${marked(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${esc(item.basis||label(item))}</span><p><strong>资料使用原则：</strong>外部录文仅用于判断原释文“□”位置的候选文字，不增补原句未标缺的位置。</p><p><strong>使用说明：</strong>${esc(item.usage||"原句已有文字和标点保持不变。")}</p></div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol></div><button class="damage-expand" data-integrity-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }
  function render(){
    const section=getSection();if(!section||!cases.length)return;
    const item=cases[current],renderId=++token;
    section.className="content-card damage-ai";
    section.innerHTML=`<div data-integrity-v2-root><h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div></div>`;
    const list=section.querySelector(".damage-list");
    if(list){list.scrollTop=scrollTop;list.addEventListener("scroll",()=>{scrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-integrity-index]").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.integrityIndex)||0;expanded=false;render();}));
    section.querySelectorAll("[data-integrity-action]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.integrityAction;if(a==="prev"&&current>0)current--;else if(a==="next"&&current<cases.length-1)current++;else if(a==="expand")expanded=!expanded;render();}));
    section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",e=>{if(typeof window.openZoom==="function")window.openZoom(e.currentTarget.dataset.image);});
    if(item._visual===undefined)setTimeout(()=>locate(item).then(()=>{if(renderId===token&&cases[current]===item)render();}),20);
  }
  function sync(){
    if(syncing)return false;
    const source=window.DAMAGE_AI_CASES;if(!Array.isArray(source)||!source.length)return false;
    const next=normalizeAll(source);
    const nextSignature=JSON.stringify(next.map(x=>[x.id,x.o,x.c,x.page,x.locations?.[0]?.page]));
    if(nextSignature===signature&&getSection()?.querySelector("[data-integrity-v2-root]"))return true;
    syncing=true;signature=nextSignature;cases=next;if(current>=cases.length)current=Math.max(0,cases.length-1);
    window.DAMAGE_AI_CASES=cases.map(clone);syncing=false;render();
    window.dispatchEvent(new CustomEvent("damage-case-integrity-ready",{detail:{workId,count:cases.length}}));
    window.dispatchEvent(new CustomEvent(`work-${workId}-cases-ready`,{detail:{count:cases.length}}));
    return true;
  }

  const style=document.createElement("style");
  style.textContent=".damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}";
  document.head.appendChild(style);

  ["work-001-content-ready","work-002-content-ready","work-003-content-ready","work-004-content-ready","work-005-content-ready","work-006-content-ready","work-006-cases-ready","work-007-content-ready","work-007-cases-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(sync,0)));
  const section=getSection();
  if(section)new MutationObserver(()=>{if(!section.querySelector("[data-integrity-v2-root]"))setTimeout(sync,0);}).observe(section,{childList:true,subtree:false});
  let attempts=0;const timer=setInterval(()=>{attempts++;if(sync()||attempts>=80)clearInterval(timer);},100);
})();