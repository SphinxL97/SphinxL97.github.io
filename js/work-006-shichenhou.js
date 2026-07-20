/* 006《史晨后碑》稳定版专属内容。
 * 与前五件采用相同结构：栏目一使用既有逐字坐标；本脚本直接渲染栏目二、三；
 * 栏目四通过标准字段 n/t/o/c/page 复用全站“众智释读”模块。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="006"||window.__WORK_006_SHICHENHOU__)return;
  window.__WORK_006_SHICHENHOU__=true;

  const WORK_TITLE="史晨后碑";
  const TEXT_URL="data/shichenhou_full_text.txt?v=20260720_work006_v1";
  const CASE_URL="data/shichenhou_damage_cases.json?v=20260720_work006_v1";
  const MODEL_URL="data/model_boxes/glyph_model_border_006_010.json?v=20260720_work006_v1";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260720_work006_v1";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目按照碑文原始释文的先后顺序，完整展示所有含“□”的句段。能够从国立故宫博物院《漢史晨後碑》释文、《史晨碑》等资料直接核对的，标为“文献对校”；证据不足的仍保留原缺字。";

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const setMenuTitle=(index,title)=>{const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link&&link.textContent!==title)link.textContent=title;};
  const paragraphHtml=text=>String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");

  function markedHtml(value){
    const text=String(value||"");let html="",cursor=0,match;
    const pattern=/〔([^〕]*)〕/g;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(cursor,match.index));
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      cursor=match.index+match[0].length;
    }
    return html+esc(text.slice(cursor));
  }

  function highlightTranscript(root,cases){
    const phrases=cases.map(item=>item.o||item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const text=paragraph.textContent||"",matches=[];
      phrases.forEach(phrase=>{
        let from=0;
        while(from<text.length){
          const index=text.indexOf(phrase,from);
          if(index<0)break;
          matches.push({index,end:index+phrase.length});
          from=index+phrase.length;
        }
      });
      if(!matches.length)return;
      matches.sort((a,b)=>a.index-b.index||b.end-a.end);
      const accepted=[];let cursor=-1;
      matches.forEach(match=>{if(match.index>=cursor){accepted.push(match);cursor=match.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(match=>{
        if(match.index>offset)fragment.appendChild(document.createTextNode(text.slice(offset,match.index)));
        const strong=document.createElement("strong");
        strong.className="transcript-problem-sentence";
        strong.textContent=text.slice(match.index,match.end);
        fragment.appendChild(strong);
        offset=match.end;
      });
      if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
      paragraph.replaceChildren(fragment);
    });
  }

  async function renderTranscript(cases){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
      highlightTranscript(card,cases);
    }catch(error){
      console.error("[work-006] transcript",error);
      card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';
    }
  }

  const punctuation=/[\s，。；：、？！“”‘’（）《》【】〔〕\-—……,.!?;:]/;
  const normMap={"搨":"拓","禮":"礼","廟":"庙","後":"后","諱":"讳","從":"从","騎":"骑","寧":"宁","閣":"阁","觀":"观","肅":"肃","靈":"灵","獻":"献","薦":"荐","欽":"钦","饗":"飨","會":"会","脩":"修","廱":"雍","製":"制","書":"书","參":"参","驗":"验","餘":"余","賦":"赋","賜":"赐","銘":"铭","並":"并","漢":"汉","歷":"历","萬":"万","長":"长","廬":"庐","謙":"谦","讓":"让","暢":"畅","曺":"曹","戶":"户","榮":"荣","陽":"阳","讚":"赞","綱":"纲","處":"处","褒":"褒","國":"国","縣":"县","員":"员","觀":"观","學":"学","執":"执","諸":"诸","諧":"谐","蕩":"荡","壽":"寿","樂":"乐","終":"终","與":"与","極":"极","劉":"刘","補":"补","廧":"墙","壞":"坏","決":"决","塗":"涂","溝":"沟","斂":"敛","擾":"扰","濡":"濡","麥":"麦","給":"给","錢":"钱","瀆":"渎","顏":"颜","遼":"辽","遠":"远","買":"买","願":"愿","勑":"敕","飭":"饬","馬":"马","種":"种","開":"开","臺":"台","貞":"贞","楊":"杨","東":"东","嶽":"岳","謁":"谒","題":"题","內":"内","歐":"欧","兗":"兖","倉":"仓","軍":"军"};
  const normChar=ch=>normMap[ch]||ch;
  function cleanSequence(value,withRefs){
    const out=[];
    (withRefs||Array.from(String(value||""))).forEach(item=>{
      const ch=typeof item==="string"?item:String(item.char||item.text||"").slice(0,1);
      if(!ch||punctuation.test(ch))return;
      out.push(typeof item==="string"?normChar(ch):{ch:normChar(ch),row:item});
    });
    return out;
  }
  const rectOf=row=>({x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)});

  function matchPattern(sequence,pattern,startAt){
    const total=sequence.length-pattern.length;
    const ranges=startAt>0?[[startAt,total],[0,Math.min(startAt-1,total)]]:[[0,total]];
    for(const [from,to] of ranges){
      for(let start=from;start<=to;start+=1){
        let ok=true;
        for(let i=0;i<pattern.length;i+=1){
          if(pattern[i]!=="□"&&pattern[i]!==sequence[start+i].ch){ok=false;break;}
        }
        if(ok)return start;
      }
    }
    return -1;
  }

  function makeLocations(rows,pageImages){
    const byPage=new Map();
    rows.forEach(row=>{
      const page=Number(row.canvas_index||row.page||0);if(!page)return;
      if(!byPage.has(page))byPage.set(page,[]);
      byPage.get(page).push(row);
    });
    return Array.from(byPage.entries()).map(([page,items])=>{
      const rects=items.map(rectOf).filter(r=>r.w>0&&r.h>0);
      if(!rects.length)return null;
      const first=items[0],canvas={w:Number(first.canvas_width||2943),h:Number(first.canvas_height||4429)};
      const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y)),maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h)),pad=18;
      const target={x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(canvas.w,maxX-minX+pad*2),h:Math.min(canvas.h,maxY-minY+pad*2)};
      const cropW=Math.min(canvas.w,Math.max(650,target.w*2.8)),cropH=Math.min(canvas.h,Math.max(1000,target.h*3.4));
      const crop={x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH};
      return {page,image:pageImages.get(page)||items[0].local_image||"",canvas,crop,target};
    }).filter(Boolean);
  }

  async function resolveLocations(cases){
    try{
      const [modelResponse,pageResponse]=await Promise.all([
        fetch(MODEL_URL,{cache:"force-cache"}),
        fetch(PAGE_INDEX_URL,{cache:"force-cache"})
      ]);
      if(!modelResponse.ok)throw new Error(`model ${modelResponse.status}`);
      const rows=(await modelResponse.json()).filter(row=>String(row.work_id||"").padStart(3,"0")==="006").sort((a,b)=>Number(a.canvas_index||0)-Number(b.canvas_index||0)||Number(a.order_in_page||0)-Number(b.order_in_page||0));
      const pageData=pageResponse.ok?await pageResponse.json():{};
      const pages=Array.isArray(pageData?.works?.["006"]?.pages)?pageData.works["006"].pages:[];
      const pageImages=new Map(pages.map(page=>[Number(page.page),page.image]));
      const sequence=cleanSequence("",rows);
      let cursor=0;
      cases.forEach(item=>{
        const pattern=cleanSequence(item.o||item.original);
        const start=matchPattern(sequence,pattern,cursor);
        if(start<0){item.locations=[];return;}
        const selected=[];
        pattern.forEach((ch,index)=>{if(ch==="□")selected.push(sequence[start+index].row);});
        item.locations=makeLocations(selected,pageImages);
        if(item.locations.length)item.page=item.locations[0].page;
        cursor=start+pattern.length;
      });
    }catch(error){
      console.warn("[work-006] coordinate match",error);
      cases.forEach(item=>{item.locations=item.locations||[];});
    }
  }

  function imageHtml(item){
    const locations=Array.isArray(item.locations)?item.locations:null;
    if(!locations)return '<div class="damage-location-missing damage-location-loading"><p>正在匹配当前案例的拓片局部……</p></div>';
    if(!locations.length)return '<div class="damage-location-missing"><p>现有逐字坐标中暂未匹配到该句的缺字区域。系统不会用无关字形代替，请在栏目一按原句继续核对。</p></div>';
    return `<div class="damage-location-gallery">${locations.map((loc,index)=>`<figure class="damage-location-item"><div class="damage-viewport" data-image="${esc(loc.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${loc.crop.x} ${loc.crop.y} ${loc.crop.w} ${loc.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.t)}第${index+1}处缺字"><image href="${esc(loc.image)}" x="0" y="0" width="${loc.canvas.w}" height="${loc.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${loc.target.x}" y="${loc.target.y}" width="${loc.target.w}" height="${loc.target.h}"></rect></svg></div><figcaption>第${loc.page}页 · 本案例第${index+1}组缺字</figcaption></figure>`).join("")}</div>`;
  }

  function basisBlock(item){
    const badge=item.mode==="documentary"?"文献对校":item.mode==="provisional"?"未见直接定本 · AI语境暂拟":item.mode==="unresolved"?"暂未恢复":item.basis;
    return `<div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${esc(badge)}</span><p><strong>资料查证结果：</strong>${esc(item.source)}</p><p><strong>使用说明：</strong>${esc(item.usage)}</p></div></div>`;
  }
  const resultLabel=item=>item.mode==="documentary"?"文献对校结果":item.mode==="provisional"?"AI暂拟补全":item.mode==="unresolved"?"暂未恢复":"文献对校与AI暂拟";

  let cases=[],current=0,expanded=false,listScrollTop=0;
  const tabs=()=>cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.n)}</span></button>`).join("");
  function panel(item){
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.n)}——“${esc(item.t)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${markedHtml(item.c)}</div></div>${basisBlock(item)}<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;
    const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");
    section.className="content-card damage-ai";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div>`;
    const list=section.querySelector(".damage-list");
    if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{
      const action=button.dataset.action;
      if(action==="prev"&&current>0)current-=1;
      else if(action==="next"&&current<cases.length-1)current+=1;
      else if(action==="expand")expanded=!expanded;
      renderDamage();
    }));
    section.querySelectorAll(".damage-viewport[data-image]").forEach(view=>view.addEventListener("dblclick",()=>{if(typeof window.openZoom==="function")window.openZoom(view.dataset.image);}));
  }

  function ensureStyle(){
    if(document.getElementById("work006-style"))return;
    const style=document.createElement("style");style.id="work006-style";
    style.textContent=`.damage-location-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%}.damage-location-item{margin:0;min-width:0}.damage-location-item figcaption{margin-top:7px;text-align:center;color:#766858;font-size:13px}.damage-location-item .damage-viewport{min-height:260px}.damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-basis-card p{margin:8px 0;line-height:1.8}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}@media(max-width:900px){.damage-location-gallery{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  async function init(){
    ensureStyle();
    const damage=document.getElementById("people");
    if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》释读案例……</div></div>`;
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${CASE_URL} ${response.status}`);
      cases=await response.json();
      renderTranscript(cases);
      renderDamage();
      window.__WORK_006_CONTENT_READY__=true;
      window.dispatchEvent(new CustomEvent("work-006-content-ready"));
      await resolveLocations(cases);
      window.DAMAGE_AI_CASES=cases.map(clone);
      renderDamage();
      window.dispatchEvent(new CustomEvent("work-006-cases-ready"));
    }catch(error){
      console.error("[work-006]",error);
      window.__WORK_006_CONTENT_READY__=true;
      if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${WORK_TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();