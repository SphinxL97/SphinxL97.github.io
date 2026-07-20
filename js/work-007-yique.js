/* 007《伊阙佛龛碑》稳定版专属内容。
 * 栏目一使用007逐字坐标适配；本脚本渲染栏目二、三；
 * 栏目四通过标准字段 n/t/o/c/page 复用全站“众智释读”模块。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="007"||window.__WORK_007_YIQUE__)return;
  window.__WORK_007_YIQUE__=true;

  const WORK_TITLE="伊阙佛龛碑";
  const TEXT_URL="data/yique_full_text.txt?v=20260720_work007_v2";
  const CASE_URL="data/yique_damage_cases.json?v=20260720_work007_v2";
  const MODEL_URL="data/model_boxes/glyph_model_border_006_010.json?v=20260720_work007_v2";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260720_work007_v2";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目按照原始释文顺序，完整展示含“□”的碑文及题跋句段。能够从《伊阙佛龛碑》旧拓录文、《金石萃编》等资料直接核对的，标为“文献对校”；碑末重度残泐、异文未定的，标为“AI语境暂拟”。";

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
    const phrases=cases.map(item=>item.o).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const text=paragraph.textContent||"",matches=[];
      phrases.forEach(phrase=>{let from=0;while(from<text.length){const index=text.indexOf(phrase,from);if(index<0)break;matches.push({index,end:index+phrase.length});from=index+phrase.length;}});
      if(!matches.length)return;
      matches.sort((a,b)=>a.index-b.index||b.end-a.end);
      const accepted=[];let end=-1;
      matches.forEach(match=>{if(match.index>=end){accepted.push(match);end=match.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(match=>{if(match.index>offset)fragment.appendChild(document.createTextNode(text.slice(offset,match.index)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=text.slice(match.index,match.end);fragment.appendChild(strong);offset=match.end;});
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
      console.error("[work-007] transcript",error);
      card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';
    }
  }

  const punctuation=/[\s，。；：、？！“”‘’（）《》【】〔〕\-—……,.!?;:]/;
  const normal={"扵":"于","於":"于","乗":"乘","髙":"高","寳":"宝","眀":"明","圡":"土","緫":"总","總":"总","禪":"禅","覺":"觉","諦":"谛","禮":"礼","靈":"灵","體":"体","變":"变","廣":"广","貴":"贵","備":"备","聖":"圣","發":"发","雲":"云","盡":"尽","業":"业","稱":"称","論":"论","窮":"穷","從":"从","託":"托","軸":"轴","識":"识","邊":"边","暉":"晖","價":"价","跡":"迹","猶":"犹","龍":"龙","宮":"宫","證":"证","滅":"灭","開":"开","緒":"绪","塗":"涂","離":"离","現":"现","顯":"显","權":"权","號":"号","絶":"绝","遺":"遗","應":"应","為":"为","縁":"缘","啓":"启","積":"积","蕩":"荡","樹":"树","練":"炼","斷":"断","載":"载","飾":"饰","繩":"绳","饒":"饶","義":"义","後":"后","軒":"轩","壃":"疆","賛":"赞","陰":"阴","輪":"轮","謀":"谋","闥":"闼","繫":"系","儉":"俭","閫":"阃","繪":"绘","絶":"绝","璫":"珰","増":"增","萬":"万","藉":"籍","藝":"艺","靜":"静","詩":"诗","書":"书","緯":"纬","逺":"远","陽":"阳","車":"车","區":"区","達":"达","輕":"轻","勝":"胜","媯":"妫","將":"将","軍":"军","揮":"挥","讀":"读","揔":"总","衞":"卫","驅":"驱","馭":"驭","纒":"缠","匳":"奁","閟":"秘","莭":"节","舉":"举","撫":"抚","厯":"历","選":"选","國":"国","闕":"阙","營":"营","㝎":"定","蓋":"盖","摽":"标","崈":"崇","龜":"龟","貝":"贝","騁":"骋","竒":"奇","䟽":"疏","龕":"龛","舊":"旧","巖":"岩","紺":"绀","髮":"发","揚":"扬","鑒":"鉴","畱":"留","鏤":"镂","踰":"逾","麗":"丽","漢":"汉","闍":"阇","樂":"乐","響":"响","奪":"夺","籟":"籁","覩":"睹","難":"难","聞":"闻","與":"与","純":"纯","簡":"简","旣":"既","輪":"轮","逥":"回","魯":"鲁","頌":"颂","詠":"咏","徧":"遍","灑":"洒","陳":"陈","讃":"赞","無":"无","刧":"劫","湏":"须","弥":"弥","鐵":"铁","圍":"围","廼":"乃","昬":"昏","蹔":"暂","鏡":"镜","竸":"竞","縣":"县","闢":"辟","紐":"纽","淨":"净","嶺":"岭","聖":"圣","寧":"宁","樓":"楼","臨":"临","圎":"圆","隷":"隶","類":"类","冊":"册","諸":"诸","歐":"欧","謂":"谓","請":"请","異":"异","亂":"乱","繼":"继","親":"亲","淂":"得"};
  const normChar=ch=>normal[ch]||ch;
  function cleanSequence(value,refs){
    const out=[];
    (refs||Array.from(String(value||""))).forEach(item=>{const ch=typeof item==="string"?item:String(item.char||item.text||"").slice(0,1);if(!ch||punctuation.test(ch))return;out.push(typeof item==="string"?normChar(ch):{ch:normChar(ch),row:item});});
    return out;
  }
  const rectOf=row=>({x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)});

  function matchPattern(sequence,pattern,startAt){
    const total=sequence.length-pattern.length;if(total<0)return -1;
    const ranges=startAt>0?[[startAt,total],[0,Math.min(startAt-1,total)]]:[[0,total]];
    for(const [from,to] of ranges){for(let start=from;start<=to;start+=1){let ok=true;for(let i=0;i<pattern.length;i+=1){if(pattern[i]!=="□"&&pattern[i]!==sequence[start+i].ch){ok=false;break;}}if(ok)return start;}}
    return -1;
  }

  function makeLocations(rows,pageImages){
    const byPage=new Map();rows.forEach(row=>{const page=Number(row.canvas_index||row.page||0);if(!page)return;if(!byPage.has(page))byPage.set(page,[]);byPage.get(page).push(row);});
    return Array.from(byPage.entries()).map(([page,items])=>{const rects=items.map(rectOf).filter(r=>r.w>0&&r.h>0);if(!rects.length)return null;const first=items[0],canvas={w:Number(first.canvas_width||2943),h:Number(first.canvas_height||4429)};const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y)),maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h)),pad=18;const target={x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(canvas.w,maxX-minX+pad*2),h:Math.min(canvas.h,maxY-minY+pad*2)};const cropW=Math.min(canvas.w,Math.max(650,target.w*2.8)),cropH=Math.min(canvas.h,Math.max(1000,target.h*3.4));const crop={x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH};return {page,image:pageImages.get(page)||items[0].local_image||"",canvas,crop,target};}).filter(Boolean);
  }

  async function resolveLocations(cases){
    try{
      const [modelResponse,pageResponse]=await Promise.all([fetch(MODEL_URL,{cache:"force-cache"}),fetch(PAGE_INDEX_URL,{cache:"force-cache"})]);
      if(!modelResponse.ok)throw new Error(`model ${modelResponse.status}`);
      const rows=(await modelResponse.json()).filter(row=>String(row.work_id||"").padStart(3,"0")==="007").sort((a,b)=>Number(a.canvas_index||0)-Number(b.canvas_index||0)||Number(a.order_in_page||0)-Number(b.order_in_page||0));
      const pageData=pageResponse.ok?await pageResponse.json():{};
      const pages=Array.isArray(pageData?.works?.["007"]?.pages)?pageData.works["007"].pages:[];
      const pageImages=new Map(pages.map(page=>[Number(page.page),page.image]));
      const sequence=cleanSequence("",rows);let cursor=0;
      cases.forEach(item=>{const pattern=cleanSequence(item.o),start=matchPattern(sequence,pattern,cursor);if(start<0){item.locations=[];return;}const selected=[];pattern.forEach((ch,index)=>{if(ch==="□")selected.push(sequence[start+index].row);});item.locations=makeLocations(selected,pageImages);if(item.locations.length)item.page=item.locations[0].page;cursor=start+pattern.length;});
    }catch(error){console.warn("[work-007] coordinate match",error);cases.forEach(item=>{item.locations=item.locations||[];});}
  }

  function imageHtml(item){
    const locations=Array.isArray(item.locations)?item.locations:null;
    if(!locations)return '<div class="damage-location-missing damage-location-loading"><p>正在匹配当前案例的拓片局部……</p></div>';
    if(!locations.length)return '<div class="damage-location-missing"><p>现有逐字坐标中暂未匹配到该句的缺字区域。系统不会用无关字形代替，请在栏目一按原句继续核对。</p></div>';
    return `<div class="damage-location-gallery">${locations.map((loc,index)=>`<figure class="damage-location-item"><div class="damage-viewport" data-image="${esc(loc.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${loc.crop.x} ${loc.crop.y} ${loc.crop.w} ${loc.crop.h}" preserveAspectRatio="xMidYMid meet" role="img"><image href="${esc(loc.image)}" x="0" y="0" width="${loc.canvas.w}" height="${loc.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${loc.target.x}" y="${loc.target.y}" width="${loc.target.w}" height="${loc.target.h}"></rect></svg></div><figcaption>第${loc.page}页 · 本案例第${index+1}组缺字</figcaption></figure>`).join("")}</div>`;
  }

  function basisBlock(item){
    const badge=item.mode==="provisional"?"未见完全定本 · AI语境暂拟":"文献对校";
    return `<div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${badge}</span><p><strong>资料查证结果：</strong>${esc(item.source)}</p><p><strong>使用说明：</strong>${esc(item.usage)}</p></div></div>`;
  }
  const resultLabel=item=>item.mode==="provisional"?"AI暂拟补全":"文献对校结果";

  let cases=[],current=0,expanded=false,listScrollTop=0;
  const tabs=()=>cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button"><b>${item.id}</b><span class="name">${esc(item.n)}</span></button>`).join("");
  function panel(item){
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.n)}——“${esc(item.t)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${markedHtml(item.c)}</div></div>${basisBlock(item)}<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${item.analysis.map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;
    const item=cases[current];setMenuTitle(3,"三、碑文残损与AI释读");section.className="content-card damage-ai";section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current-=1;else if(action==="next"&&current<cases.length-1)current+=1;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelectorAll(".damage-viewport[data-image]").forEach(view=>view.addEventListener("dblclick",()=>{if(typeof window.openZoom==="function")window.openZoom(view.dataset.image);}));
  }

  function ensureStyle(){
    if(document.getElementById("work007-style"))return;
    const style=document.createElement("style");style.id="work007-style";style.textContent=`.damage-location-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%}.damage-location-item{margin:0;min-width:0}.damage-location-item figcaption{margin-top:7px;text-align:center;color:#766858;font-size:13px}.damage-location-item .damage-viewport{min-height:260px}.damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-basis-card p{margin:8px 0;line-height:1.8}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}@media(max-width:900px){.damage-location-gallery{grid-template-columns:1fr}}`;document.head.appendChild(style);
  }

  function enrichCases(rows){
    return (Array.isArray(rows)?rows:[]).map((item,index)=>{
      const mode=item.m==="p"?"provisional":"documentary",post=item.m==="b";
      const plain=String(item.c||"").replace(/[〔〕，。；：？！、“”《》\s]/g,"");
      const title=plain.slice(0,14)||`残损句段${index+1}`;
      const source=mode==="provisional"?"碑末颂文残泐严重，不同拓本和整理本存在异文；本项依据较完整旧拓本的通行释文提出候选，仍需结合原拓复核。":post?"清人相关跋文录文保存“以楷兼隶，绝不类《文皇哀册》《圣教序》”及“文德在天，将无恫耶”等语。":"《伊阙佛龛碑》通行释文、《金石萃编》相关录文及较完整旧拓本释文保存了相应语句。";
      const count=String(item.o||"").split("□").length-1;
      const analysis=mode==="provisional"?[`原句包含${count}处缺字，且位于碑末重度残泐区域。`,`现存整理本可提供句式和部分文字，但个别字仍有异文，不能视为完全定本。`,`栏目二继续保留原始方框；栏目三和栏目四把候选字置于〔〕中。`]:post?[`原句包含${count}处缺字，属于后人题跋而非唐代碑文正文。`,`相关跋文录本保存了完整语句，可用于对校缺字和标点。`,`栏目二将题跋与碑文正文分段展示。`]:[`原句包含${count}处缺字，并伴有若干OCR误识或漏字。`,`对照通行录文后，可恢复缺字并校正受残损影响的上下文。`,`栏目二保留原始方框；栏目三和栏目四以〔〕标示补入文字。`];
      const usage=mode==="provisional"?"作为碑末颂文的暂拟恢复展示；读者可在栏目四提出不同释读。":post?"按题跋文献对校展示，不与唐代碑文正文混为一段。":"作为文献对校结果展示；若原拓字形与通行录文不一致，应以原拓和更早拓本为准。";
      return {...item,id:String(index+1).padStart(2,"0"),n:"残损碑文恢复",t:title,page:"—",category:"残损碑文恢复",title,original:item.o,corrected:item.c,basis:mode==="provisional"?"AI语境暂拟":"文献对校",mode,confidence:mode==="provisional"?"低至中":post?"中至高":"高",source,analysis,usage};
    });
  }

  async function init(){
    ensureStyle();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》释读案例……</div></div>`;
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${CASE_URL} ${response.status}`);
      cases=enrichCases(await response.json());window.DAMAGE_AI_CASES=cases.map(clone);renderTranscript(cases);renderDamage();window.__WORK_007_CONTENT_READY__=true;window.dispatchEvent(new CustomEvent("work-007-content-ready"));
      await resolveLocations(cases);window.DAMAGE_AI_CASES=cases.map(clone);renderDamage();window.dispatchEvent(new CustomEvent("work-007-cases-ready"));
    }catch(error){console.error("[work-007]",error);window.__WORK_007_CONTENT_READY__=true;if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${WORK_TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();