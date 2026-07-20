/* 001—007 栏目三释文完整性与首处字形展示。
 * 规则：
 * 1. 残损案例以原释文为唯一底稿，只替换原句中的“□”；
 * 2. 外部录文中的增字、改字和标点不得覆盖原释文已有内容；
 * 3. 原句没有“□”却新增文字的“残损恢复”案例不展示；
 * 4. 一句话有多处问题时，拓片区只展示第一个可可靠定位的问题位置。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(!["001","002","003","004","005","006","007"].includes(workId)||window.__DAMAGE_CASE_INTEGRITY_RENDERER__)return;
  window.__DAMAGE_CASE_INTEGRITY_RENDERER__=true;

  const WORK_TITLES={"001":"道因法师碑","002":"礼器碑并阴","003":"龙藏寺碑","004":"麓山寺碑并阴","005":"虞恭公温彦博碑","006":"史晨后碑","007":"伊阙佛龛碑"};
  const MODEL_URLS={
    "005":"data/model_boxes/glyph_model_border_001_005.json?v=20260721_integrity_v1",
    "006":"data/model_boxes/glyph_model_border_006_010.json?v=20260721_integrity_v1",
    "007":"data/model_boxes/glyph_model_border_006_010.json?v=20260721_integrity_v1"
  };
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260721_integrity_v1";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字或疑难字提出校读意见。外部录文仅用于判断问题位置的候选文字，不用于增补原释文未标缺的位置，也不改写原句已有文字和标点。";

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const cleanCandidate=value=>Array.from(String(value||"").replace(/[〔〕\s，。；：、？！“”‘’（）《》【】〈〉,.!?;:—－…]/g,"")).join("");
  const stripMarks=value=>String(value||"").replace(/[〔〕]/g,"");

  function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}

  function boxGroups(original){
    const groups=[];const re=/□+/g;let match;
    while((match=re.exec(original)))groups.push({start:match.index,end:match.index+match[0].length,count:match[0].length});
    return groups;
  }

  function bracketGroups(corrected){
    const groups=[];const re=/〔([^〕]*)〕/g;let match;
    while((match=re.exec(corrected)))groups.push({start:match.index,end:match.index+match[0].length,text:cleanCandidate(match[1]),used:false});
    return groups;
  }

  function cleanContext(value){return Array.from(String(value||"").replace(/[〔〕□\s，。；：、？！“”‘’（）《》【】〈〉,.!?;:—－…]/g,"")).join("");}
  function suffixScore(a,b){a=cleanContext(a);b=cleanContext(b);let n=0;while(n<a.length&&n<b.length&&a[a.length-1-n]===b[b.length-1-n])n++;return n;}
  function prefixScore(a,b){a=cleanContext(a);b=cleanContext(b);let n=0;while(n<a.length&&n<b.length&&a[n]===b[n])n++;return n;}

  function candidatesByExactTemplate(original,corrected){
    const groups=boxGroups(original);if(!groups.length)return null;
    let cursor=0,pattern="^",groupIndex=0;
    for(const group of groups){
      pattern+=escapeRegExp(original.slice(cursor,group.start));
      pattern+="([\\s\\S]+?)";
      cursor=group.end;groupIndex++;
    }
    pattern+=escapeRegExp(original.slice(cursor))+"$";
    try{
      const match=stripMarks(corrected).match(new RegExp(pattern));
      if(!match)return null;
      return groups.map((group,index)=>cleanCandidate(match[index+1]).slice(0,group.count));
    }catch(_){return null;}
  }

  function candidatesByBracketContext(original,corrected){
    const groups=boxGroups(original),brackets=bracketGroups(corrected),result=[];
    for(const group of groups){
      const left=original.slice(Math.max(0,group.start-18),group.start);
      const right=original.slice(group.end,Math.min(original.length,group.end+18));
      let best=null,bestScore=-1;
      for(const bracket of brackets){
        if(bracket.used||!bracket.text)continue;
        const prefix=corrected.slice(0,bracket.start);
        const suffix=corrected.slice(bracket.end);
        const leftMatch=suffixScore(left,prefix),rightMatch=prefixScore(right,suffix);
        const score=leftMatch*2+rightMatch*2-Math.abs(bracket.text.length-group.count)*0.15;
        if(score>bestScore){bestScore=score;best={bracket,leftMatch,rightMatch};}
      }
      if(best&&(best.leftMatch>=2||best.rightMatch>=2||best.leftMatch+best.rightMatch>=3)){
        best.bracket.used=true;
        result.push(best.bracket.text.slice(0,group.count));
      }else result.push("");
    }
    return result;
  }

  function restrictCorrection(original,rawCorrected){
    const groups=boxGroups(original);
    if(!groups.length)return {marked:String(rawCorrected||original),plain:String(rawCorrected||original),resolved:0,total:0,changed:false};

    let candidates=candidatesByExactTemplate(original,String(rawCorrected||""));
    if(!candidates)candidates=candidatesByBracketContext(original,String(rawCorrected||""));

    let marked="",plain="",cursor=0,resolved=0;
    groups.forEach((group,index)=>{
      const fixed=candidates[index]||"";
      marked+=original.slice(cursor,group.start);
      plain+=original.slice(cursor,group.start);
      if(fixed){
        marked+=`〔${fixed}〕`;
        plain+=fixed;
        resolved+=fixed.length;
        if(fixed.length<group.count){
          const remainder="□".repeat(group.count-fixed.length);
          marked+=remainder;plain+=remainder;
        }
      }else{
        const boxes="□".repeat(group.count);marked+=boxes;plain+=boxes;
      }
      cursor=group.end;
    });
    marked+=original.slice(cursor);plain+=original.slice(cursor);
    return {marked,plain,resolved,total:groups.reduce((sum,g)=>sum+g.count,0),changed:marked!==String(rawCorrected||"")};
  }

  function problemSnippet(original){
    const index=original.indexOf("□");
    if(index<0)return original.slice(0,26);
    const punct=/[。；！？\n]/;
    let start=Math.max(0,index-12),end=Math.min(original.length,index+13);
    for(let i=index-1;i>=Math.max(0,index-26);i--){if(punct.test(original[i])){start=i+1;break;}}
    for(let i=index;i<Math.min(original.length,index+30);i++){if(punct.test(original[i])){end=i+1;break;}}
    return original.slice(start,end).trim();
  }

  function normalizeCase(item,index){
    const original=String(item.o??item.original??"");
    const category=String(item.n??item.category??"");
    const oldTitle=String(item.t??item.title??item.s??"");
    const residual=/残损|缺字|补释/.test(category+oldTitle)||original.includes("□");

    /* 原句无缺字符号，却以“残损恢复”名义凭空补字的案例不再展示。 */
    if(residual&&!original.includes("□")&&!original.includes("?"))return null;

    const normalized={...clone(item)};
    normalized.id=String(index+1).padStart(2,"0");
    normalized.i=normalized.id;
    normalized.n=category||"残损碑文恢复";
    normalized.category=normalized.n;
    normalized.o=original;
    normalized.original=original;

    if(original.includes("□")){
      const correction=restrictCorrection(original,String(item.c??item.corrected??original));
      normalized.c=correction.marked;
      normalized.corrected=correction.marked;
      normalized.r=correction.plain;
      normalized.restored=correction.plain;
      const snippet=problemSnippet(original);
      normalized.t=`残损碑文恢复——“${snippet}”`;
      normalized.title=snippet;
      normalized.s=snippet;
      const groupCount=boxGroups(original).length;
      const boxCount=boxGroups(original).reduce((sum,g)=>sum+g.count,0);
      normalized.groupCount=groupCount;
      normalized.boxCount=boxCount;
      normalized.e=[
        `当前原释文包含${groupCount}组缺字，共${boxCount}个“□”。`,
        "本例只在原释文“□”对应的位置补入候选，原句已有文字和标点保持不变。",
        "其他录文仅作为判断缺字候选的参考，不采用原释文未标缺位置的增字、改字或改写。",
        correction.resolved?"已补文字仍需结合当前拓片字形和更早拓本继续核验。":"现有资料不足以可靠确定该缺字，因此继续保留原“□”。"
      ];
      normalized.analysis=[...normalized.e];
      normalized.usage="栏目二保留原始“□”；栏目三和栏目四只展示与该“□”位置对应的候选文字。";
      if(!correction.resolved){
        normalized.mode="unresolved";
        normalized.basis="暂未恢复";
        normalized.confidence="暂无法判断";
      }
    }else{
      normalized.c=String(item.c??item.corrected??original);
      normalized.corrected=normalized.c;
      normalized.r=String(item.r??item.restored??normalized.c);
      normalized.restored=normalized.r;
      normalized.t=oldTitle||normalized.n;
      normalized.title=String(item.title??item.s??oldTitle||normalized.n);
      normalized.e=Array.isArray(item.e)?[...item.e]:Array.isArray(item.analysis)?[...item.analysis]:[];
      normalized.analysis=[...normalized.e];
    }

    normalized.page=item.page??item.canvas_index??item.locations?.[0]?.page??"—";
    return normalized;
  }

  function normalizeCases(rows){
    const output=[];
    (Array.isArray(rows)?rows:[]).forEach(item=>{
      const normalized=normalizeCase(item,output.length);
      if(normalized)output.push(normalized);
    });
    output.forEach((item,index)=>{item.id=String(index+1).padStart(2,"0");item.i=item.id;});
    return output;
  }

  const charMap={"扵":"于","於":"于","乗":"乘","髙":"高","寳":"宝","眀":"明","圡":"土","緫":"总","總":"总","禮":"礼","靈":"灵","體":"体","變":"变","廣":"广","貴":"贵","備":"备","聖":"圣","發":"发","雲":"云","盡":"尽","稱":"称","論":"论","窮":"穷","從":"从","託":"托","識":"识","邊":"边","暉":"晖","價":"价","跡":"迹","猶":"犹","龍":"龙","宮":"宫","證":"证","滅":"灭","開":"开","緒":"绪","塗":"涂","離":"离","現":"现","顯":"显","權":"权","號":"号","絶":"绝","遺":"遗","應":"应","為":"为","縁":"缘","啓":"启","積":"积","蕩":"荡","樹":"树","載":"载","飾":"饰","繩":"绳","義":"义","後":"后","軒":"轩","壃":"疆","賛":"赞","陰":"阴","輪":"轮","謀":"谋","闥":"闼","繫":"系","儉":"俭","閫":"阃","繪":"绘","璫":"珰","増":"增","萬":"万","藉":"籍","藝":"艺","靜":"静","詩":"诗","書":"书","緯":"纬","逺":"远","陽":"阳","區":"区","達":"达","勝":"胜","將":"将","軍":"军","讀":"读","揔":"总","衞":"卫","驅":"驱","馭":"驭","纒":"缠","匳":"奁","閟":"秘","莭":"节","舉":"举","撫":"抚","厯":"历","選":"选","國":"国","闕":"阙","營":"营","㝎":"定","蓋":"盖","摽":"标","崈":"崇","龜":"龟","貝":"贝","騁":"骋","竒":"奇","龕":"龛","舊":"旧","巖":"岩","紺":"绀","髮":"发","揚":"扬","鑒":"鉴","畱":"留","鏤":"镂","踰":"逾","麗":"丽","漢":"汉","樂":"乐","響":"响","奪":"夺","籟":"籁","覩":"睹","難":"难","聞":"闻","與":"与","純":"纯","簡":"简","旣":"既","逥":"回","魯":"鲁","頌":"颂","詠":"咏","徧":"遍","灑":"洒","陳":"陈","讃":"赞","無":"无","刧":"劫","湏":"须","鐵":"铁","圍":"围","廼":"乃","昬":"昏","蹔":"暂","鏡":"镜","竸":"竞","縣":"县","闢":"辟","紐":"纽","淨":"净","嶺":"岭","寧":"宁","樓":"楼","臨":"临","圎":"圆","隷":"隶","類":"类","冊":"册","諸":"诸","歐":"欧","謂":"谓","請":"请","異":"异","亂":"乱","繼":"继","親":"亲","淂":"得"};
  const normChar=ch=>charMap[ch]||ch;
  const isIgnored=ch=>/[\s，。；：、？！“”‘’（）《》【】〔〕〈〉,.!?;:—－…]/.test(ch);

  let modelPromise=null;
  function loadModel(){
    const url=MODEL_URLS[workId];
    if(!url)return Promise.resolve({sequence:[],pageImages:new Map()});
    if(!modelPromise)modelPromise=Promise.all([
      fetch(url,{cache:"force-cache"}).then(r=>r.ok?r.json():[]),
      fetch(PAGE_INDEX_URL,{cache:"force-cache"}).then(r=>r.ok?r.json():{})
    ]).then(([rows,pages])=>{
      const sequence=(Array.isArray(rows)?rows:[])
        .filter(row=>String(row.work_id||"").padStart(3,"0")===workId)
        .sort((a,b)=>Number(a.canvas_index||a.page||0)-Number(b.canvas_index||b.page||0)||Number(a.order_in_page||0)-Number(b.order_in_page||0))
        .map(row=>({ch:normChar(String(row.char||row.text||"").slice(0,1)),row}))
        .filter(item=>item.ch&&!isIgnored(item.ch));
      const pageList=Array.isArray(pages?.works?.[workId]?.pages)?pages.works[workId].pages:[];
      return {sequence,pageImages:new Map(pageList.map(page=>[Number(page.page),page.image]))};
    }).catch(error=>{console.warn("[damage-integrity] model",error);return {sequence:[],pageImages:new Map()};});
    return modelPromise;
  }

  function anchorChars(value){return Array.from(String(value||"")).filter(ch=>!isIgnored(ch)&&ch!=="□").map(normChar);}
  function matchAt(sequence,start,anchor){if(start<0||start+anchor.length>sequence.length)return false;for(let i=0;i<anchor.length;i++)if(sequence[start+i].ch!==anchor[i])return false;return true;}

  async function locateFirstProblem(item){
    if(item._integrityVisual!==undefined)return item._integrityVisual;
    const existing=item.locations?.[0];
    if(existing){item._integrityVisual=existing;return existing;}
    const directTarget=item.target||item.targets?.[0];
    if(item.image&&directTarget&&item.canvas){
      item._integrityVisual={page:Number(item.page||0),image:item.image,canvas:item.canvas,target:directTarget};
      return item._integrityVisual;
    }
    if(!String(item.o||"").includes("□")||!MODEL_URLS[workId]){item._integrityVisual=null;return null;}

    const {sequence,pageImages}=await loadModel();
    if(!sequence.length){item._integrityVisual=null;return null;}
    const original=String(item.o),boxIndex=original.indexOf("□");
    const leftFull=anchorChars(original.slice(0,boxIndex));
    const rightFull=anchorChars(original.slice(boxIndex+1));
    const preferredPage=Number(item.page)||0;
    let found=null;

    for(let leftLen=Math.min(8,leftFull.length);leftLen>=2&&!found;leftLen--){
      const left=leftFull.slice(-leftLen);
      for(let rightLen=Math.min(8,rightFull.length);rightLen>=2&&!found;rightLen--){
        const right=rightFull.slice(0,rightLen);
        for(let i=0;i<=sequence.length-left.length;i++){
          if(!matchAt(sequence,i,left))continue;
          const leftEnd=i+left.length;
          for(let gap=1;gap<=8;gap++){
            const rightStart=leftEnd+gap;
            if(!matchAt(sequence,rightStart,right))continue;
            const candidate=sequence[leftEnd];
            if(!candidate)continue;
            const page=Number(candidate.row.canvas_index||candidate.row.page||0);
            if(preferredPage&&page!==preferredPage)continue;
            found=candidate.row;break;
          }
          if(found)break;
        }
      }
    }

    if(!found&&preferredPage){
      const pageRows=sequence.filter(item=>Number(item.row.canvas_index||item.row.page||0)===preferredPage);
      const square=pageRows.find(item=>item.ch==="□");
      if(square)found=square.row;
    }
    if(!found){item._integrityVisual=null;return null;}

    const target={
      x:Number(found.x??found.bbox_x??found.bbox?.[0]??0),
      y:Number(found.y??found.bbox_y??found.bbox?.[1]??0),
      w:Number(found.w??found.bbox_w??found.bbox?.[2]??0),
      h:Number(found.h??found.bbox_h??found.bbox?.[3]??0)
    };
    if(!(target.w>0&&target.h>0)){item._integrityVisual=null;return null;}
    const page=Number(found.canvas_index||found.page||0);
    item.page=page;
    item._integrityVisual={
      page,
      image:pageImages.get(page)||found.local_image||"",
      canvas:{w:Number(found.canvas_width||2943),h:Number(found.canvas_height||4429)},
      target
    };
    return item._integrityVisual;
  }

  function cropForVisual(visual){
    const {canvas,target}=visual;
    const padX=Math.max(180,target.w*1.2),padY=Math.max(300,target.h*2.4);
    const width=Math.min(canvas.w,Math.max(520,target.w+padX*2));
    const height=Math.min(canvas.h,Math.max(850,target.h+padY*2));
    const x=Math.max(0,Math.min(canvas.w-width,target.x+target.w/2-width/2));
    const y=Math.max(0,Math.min(canvas.h-height,target.y+target.h/2-height/2));
    return {x,y,w:width,h:height};
  }

  function markedHtml(value){
    let html="",cursor=0,match;const re=/〔([^〕]*)〕/g,text=String(value||"");
    while((match=re.exec(text))){html+=esc(text.slice(cursor,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;cursor=match.index+match[0].length;}
    return html+esc(text.slice(cursor));
  }

  function resultLabel(item){
    if(String(item.c||"").includes("□"))return "暂未恢复";
    if(item.mode==="provisional"||item.basis==="AI语境暂拟"||/低/.test(String(item.confidence||"")))return "AI暂拟补全";
    if(!String(item.o||"").includes("□"))return "校读结果";
    return "文献对校结果";
  }

  let cases=[],current=0,expanded=false,listScrollTop=0,renderToken=0,signature="",syncing=false;
  const section=()=>document.getElementById("people");

  function visualHtml(item){
    const visual=item._integrityVisual;
    if(visual===undefined)return '<div class="damage-location-missing damage-location-loading"><p>正在定位本句第一个问题字的拓片位置……</p></div>';
    if(!visual||!visual.image)return '<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用无关字形或虚构红框代替。</p></div>';
    const crop=cropForVisual(visual),target=visual.target;
    return `<div class="damage-viewport" data-image="${esc(visual.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(visual.image)}" x="0" y="0" width="${visual.canvas.w}" height="${visual.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${target.x}" y="${target.y}" width="${target.w}" height="${target.h}"></rect></svg></div><p class="damage-caption">《${esc(WORK_TITLES[workId])}》第${visual.page||item.page||"—"}页，本句第一个问题字局部</p>`;
  }

  function tabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-integrity-index="${index}" type="button"><b>${item.id}</b><span class="name">${esc(item.n)}</span></button>`).join("");}

  function panel(item){
    const evidence=(item.analysis||item.e||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.t)} <span class="damage-heading-confidence">（${esc(item.confidence||"")}）</span></div><div class="damage-pager"><button data-integrity-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-integrity-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${visualHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${esc(item.basis||resultLabel(item))}</span><p><strong>资料使用原则：</strong>外部录文仅用于判断原释文“□”位置的候选文字，不增补原句未标缺的位置。</p><p><strong>使用说明：</strong>${esc(item.usage||"原句已有文字和标点保持不变。")}</p></div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol></div><button class="damage-expand" data-integrity-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function render(){
    const root=section();if(!root||!cases.length)return;
    const token=++renderToken,item=cases[current];
    root.className="content-card damage-ai";
    root.innerHTML=`<div data-damage-integrity-root="true"><h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div></div>`;
    const list=root.querySelector(".damage-list");
    if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    root.querySelectorAll("[data-integrity-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.integrityIndex)||0;expanded=false;render();}));
    root.querySelectorAll("[data-integrity-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.integrityAction;if(action==="prev"&&current>0)current--;else if(action==="next"&&current<cases.length-1)current++;else if(action==="expand")expanded=!expanded;render();}));
    root.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",event=>{if(typeof window.openZoom==="function")window.openZoom(event.currentTarget.dataset.image);});
    if(item._integrityVisual===undefined)setTimeout(()=>locateFirstProblem(item).then(()=>{if(token===renderToken&&cases[current]===item)render();}),20);
  }

  function sync(){
    if(syncing)return false;
    const rows=window.DAMAGE_AI_CASES;if(!Array.isArray(rows)||!rows.length)return false;
    const next=normalizeCases(rows);
    const nextSignature=JSON.stringify(next.map(item=>[item.id,item.o,item.c,item.page,item.locations?.[0]?.page]));
    if(nextSignature===signature&&section()?.querySelector("[data-damage-integrity-root]"))return true;
    syncing=true;
    signature=nextSignature;
    cases=next;
    if(current>=cases.length)current=Math.max(0,cases.length-1);
    window.DAMAGE_AI_CASES=cases.map(clone);
    syncing=false;
    render();
    window.dispatchEvent(new CustomEvent("damage-case-integrity-ready",{detail:{workId,count:cases.length}}));
    window.dispatchEvent(new CustomEvent(`work-${workId}-cases-ready`,{detail:{count:cases.length}}));
    return true;
  }

  const style=document.createElement("style");
  style.textContent=".damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}";
  document.head.appendChild(style);

  ["work-001-content-ready","work-002-content-ready","work-003-content-ready","work-004-content-ready","work-005-content-ready","work-006-content-ready","work-006-cases-ready","work-007-content-ready","work-007-cases-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(sync,0)));

  const target=section();
  if(target){
    const observer=new MutationObserver(()=>{
      if(target.querySelector("[data-damage-integrity-root]"))return;
      setTimeout(sync,0);
    });
    observer.observe(target,{childList:true,subtree:false});
  }

  let attempts=0;
  const timer=setInterval(()=>{attempts++;if(sync()||attempts>=80)clearInterval(timer);},100);
})();