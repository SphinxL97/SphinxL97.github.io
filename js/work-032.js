/* 032《许真人井铭》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="032"||window.__WORK_032_XUZHENREN__)return;
  window.__WORK_032_XUZHENREN__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="许真人井铭";
  const VERSION="20260725_xuzhenren_032_v1";
  const TEXT_URL=`data/work032_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work032_damage_cases.json?v=${VERSION}`;
  const PAGE_INDEX_URL=`data/page_images_index.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目依据用户确认底稿、整理录文与仓库既有IIIF字框，汇总14组校勘案例，覆盖39个残损槽位和9个OCR误识。14组均可定位真实字框；芝／芷、床／牀保留为版本异文，不制造唯一答案。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,expanded=false,pageMap=new Map(),listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),category=String(row?.category||row?.crowdsourceCategory||row?.n||"残损碑文修复");
    return {...row,id,original,corrected,category,n:"残损碑文恢复",t:String(row?.title||row?.t||`第${id}处`),o:original,c:corrected,title:String(row?.title||row?.t||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"高"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category}));
    window.dispatchEvent(new CustomEvent("work-032-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").replace(/^許眞人井銘\s*\n+/,"").trim();
    return normalized.split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>`<p>${esc(part).replace(/\n/g,"<br>")}</p>`).join("");
  }
  function boldProblemSentences(root,items){
    const patterns=items.flatMap(item=>Array.isArray(item.highlight_patterns)&&item.highlight_patterns.length?item.highlight_patterns:[]).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"",ranges=[];
      patterns.forEach(pattern=>{let from=0;while(from<value.length){const at=value.indexOf(pattern,from);if(at<0)break;ranges.push({start:at,end:at+pattern.length});from=at+pattern.length;}});
      if(!ranges.length)return;ranges.sort((a,b)=>a.start-b.start||b.end-a.end);
      const accepted=[];let right=-1;ranges.forEach(range=>{if(range.start>=right){accepted.push(range);right=range.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(range=>{if(range.start>offset)fragment.appendChild(document.createTextNode(value.slice(offset,range.start)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(range.start,range.end);fragment.appendChild(strong);offset=range.end;});
      if(offset<value.length)fragment.appendChild(document.createTextNode(value.slice(offset)));paragraph.replaceChildren(fragment);
    });
  }
  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-032] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function markedHTML(value){let html="",offset=0,match;const text=String(value||""),pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;offset=match.index+match[0].length;}return html+esc(text.slice(offset));}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(item){
    const byPage=new Map();
    (item.locations||[]).forEach(loc=>{const page=Number(loc.page||item.page||0);if(!page)return;if(!byPage.has(page))byPage.set(page,[]);byPage.get(page).push(loc);});
    if(!byPage.size)return '<div class="damage-location-missing"><p>当前案例没有可用真实字框，不显示推测性局部图。</p></div>';
    return `<div class="work032-location-grid">${Array.from(byPage.entries()).sort((a,b)=>a[0]-b[0]).map(([page,locations])=>{
      const meta=pageMap.get(page),image=meta?.image||"";if(!image)return "";
      const boxes=locations.filter(loc=>loc?.bbox).map(loc=>{const b=loc.bbox,cw=Number(loc.canvas_width||1464),ch=Number(loc.canvas_height||2234),left=b.x/cw*100,top=b.y/ch*100,width=b.w/cw*100,height=b.h/ch*100;return `<span class="work032-real-box" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" title="${esc(loc.glyph_id||"")}"></span>`;}).join("");
      return `<div class="work032-case-image"><div class="work032-image-stage"><img src="${esc(image)}" alt="第${page}页原拓">${boxes}</div><p>第${page}页 · ${locations.length}个真实IIIF字框</p></div>`;
    }).join("")}</div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current],analysis=(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    setMenuTitle(3,"三、碑文残损与AI释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work032Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（真实定位）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.action==="prev"&&current>0)current-=1;else if(button.dataset.action==="next"&&current<cases.length-1)current+=1;else if(button.dataset.action==="expand")expanded=!expanded;renderDamage();}));
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work032-xuzhenren-style"))return;const style=document.createElement("style");style.id="work032-xuzhenren-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work032-location-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-items:start}.work032-image-stage{position:relative;width:min(100%,430px);margin:auto}.work032-image-stage img{width:100%;height:auto;display:block;border-radius:10px}.work032-real-box{position:absolute;border:3px solid #e23020;background:rgba(226,48,32,.12);box-shadow:0 0 0 2px rgba(255,255,255,.8)}.work032-case-image p{margin:10px 0 0!important;text-indent:0!important;font-size:12px;color:#766657;text-align:center}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:250px;padding:30px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a;text-align:center}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="南唐徐鉉撰并篆书，原刻于江苏句容茅山玉晨观井栏；本项目采用上海图书馆藏北宋拓本。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本与流传"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("北宋拓本，装裱11开；网站数字化图像25页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("井铭内容"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("铭文追述许真人遗迹、丹井寒泉及后学仰慕之情。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">版本说明</div><div class="modal-desc">本项目采用上海图书馆藏北宋拓本，装裱11开；网站25页为数字化图像数，二者不是同一计数口径。</div><div class="modal-term">馆藏号</div><div class="modal-desc">18A351。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>铭文内容</h3><p>铭文从许真人遗迹写到丹井寒泉，再写来访者寻真、刊石与勉励后学。正文采用四言句式，末附道副孙文德、焚修道士成廷昭题名。</p><h3>校勘说明</h3><p>本项目将页面行款重新按正常阅读顺序整理，并把39个残损槽位与9个OCR误识归纳为14组案例；芝／芷、床／牀保留异文状态。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_032_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_032_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-032-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_032_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const [rows,index]=await Promise.all([fetchJSON(CASE_URL),fetchJSON(PAGE_INDEX_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("032案例数据为空");
      const pages=index?.works?.["032"]?.pages||[];pageMap=new Map(pages.map(page=>[Number(page.page),page]));publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_032_CONTENT_READY__=true;window.__WORK_032_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-032-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-032]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">032碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">032案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_032_CROWDSOURCE_READY__=true;window.__WORK_032_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
