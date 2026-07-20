/* 005《虞恭公温彦博碑》稳定版专属内容。
 * 与002—004采用相同结构：一个脚本直接渲染栏目二、三，栏目四复用全站共享模块。
 * 页面打开不扫描55页坐标；当前案例显示后，再异步查找该例的拓片位置。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_YUGONGGONG_STABLE__)return;
  window.__WORK_005_YUGONGGONG_STABLE__=true;

  const WORK_TITLE="虞恭公温彦博碑";
  const TEXT_URL="data/yugonggong_full_text.txt?v=20260720_stable_v1";
  const CASE_URL="data/yugonggong_all_damage_cases.json?v=20260720_stable_v1";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260720_stable_v1";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目按照碑文原始释文的先后顺序，展示全部保留下来的缺字段落。能够从《钦定全唐文》《唐文拾遗》等资料直接核对的，标为“文献对校”；资料未给出确定文字、但可以依据上下文提出候选的，标为“AI语境暂拟”；证据仍不足的，继续保留原缺字。";

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

  function reviseCases(rawCases){
    const cases=(Array.isArray(rawCases)?rawCases:[]).filter(item=>item.id!=="01").map(clone);
    const byId=id=>cases.find(item=>item.id===id);

    ["08","28","36"].forEach(id=>{const item=byId(id);if(item)item.category="残损碑文恢复";});

    const c28=byId("28");
    if(c28){
      c28.title="忠允宽裕至违规矩";
      c28.corrected="是以忠〔允〕寬裕，〔懷內恭之温温，虛列著之抑抑，謹度習儀，自叶巽貞之吉；盡忠補過，不忘前惕之勤。損兹驕盈，戒其徧辟，夙夜匪懈，以事一人。獻替之規，不忘于忠〕恕，損益之義，皆出〔于〕仁厚，違〔規〕矩，枉尋尺，光其家而弗為；";
      c28.source="《唐文拾遗》相关录文保存“是以忠允宽裕”至“违规矩，枉寻尺”的连续文字，因此不再用省略号代替中间内容。";
      c28.analysis=["原释文中的一个单框和三个连续方框，实际压缩了较长的品德叙述。","相关录文保存了“忠允宽裕”“不忘于忠恕”“皆出于仁厚”“违规矩，枉寻尺”等连续文字。","本例主要属于长段残损恢复，不归入形近字纠错。"];
      c28.usage="栏目二继续保留原始方框；栏目三展示文献保存的完整连续文字。";
    }

    const c29=byId("29");
    if(c29){
      c29.category="残损碑文恢复";
      c29.title="利□所同";
      c29.original="利□所同，必擇善以利物；";
      c29.corrected="利□所同，必擇善以利物；";
      c29.basis="参考录文与当前释文不一致";
      c29.mode="unresolved";
      c29.confidence="暂无法判断";
      c29.source="部分参考录文作“心之所同”，但当前拓片释文记录为“利□所同”。仅凭异本录文，不能把现有的“利”改成“心”，也不能据此确定方框内就是“之”。";
      c29.analysis=["当前原始释文只有一个缺字，形式为“利□所同”。","“心之所同”属于参考录文中的另一种文本形态，不能直接覆盖当前拓片转写。","在进一步核对原拓字形或更可靠旧拓前，本例保留原字“利”和原缺字“□”。"];
      c29.usage="栏目二和栏目三均保留“利□所同”；不提出“心”字校正。";
    }

    const c31=byId("31");
    if(c31){
      c31.category="形近字纠错";
      c31.title="“子心”校为“之心”并补“洽”";
      c31.corrected="行慈惠之心，〔洽〕扵猶子。";
      c31.source="《昭陵碑考》《唐文拾遗》相关录文作“行慈惠之心，洽于犹子”。";
      c31.analysis=["原识别“子心”中的“子”校为“之”，属于已有文字的纠正。","原句唯一的“□”补作“洽”。","因此页面只把〔洽〕标作新增字。"];
      c31.usage="“子→之”为原字纠正；〔洽〕是对原缺字的补录。";
    }

    const c36=byId("36");
    if(c36){
      c36.category="残损碑文恢复";
      c36.title="一水逝黄陂、光沈赵日";
      c36.usage="本例包含缺字恢复、语序复原和“曰→日”纠正，整体归为残损碑文恢复。";
    }

    const c37=byId("37");
    if(c37){
      c37.category="残损碑文恢复";
      c37.title="麟閣□形";
      c37.original="麟閣□形";
      c37.corrected="麟閣〔圖〕形";
      c37.basis="文献对校";
      c37.mode="documentary";
      c37.confidence="高";
      c37.source="相关辑录保存“麟阁图形”，且第34页现有逐字坐标保存“麟、阁、□、形”的连续位置。";
      c37.analysis=["“麟阁图形”指功臣画像绘于麒麟阁。","原释文中的唯一缺字位于“麟阁”与“形”之间，补作“图”后词义和句法完整。","本例只处理现存拓片中的“麟閣□形”，后续文献续录另列一例说明。"];
      c37.usage="栏目二继续保留“麟閣□形”；栏目三以〔图〕展示文献对校结果。";
      c37.highlight="麟閣□形";
      delete c37.locationNote;
    }

    const c38=byId("38");
    if(c38){
      c38.category="残损碑文恢复";
      c38.title="碑末续文与□天箕毕";
      c38.original="麟閣□形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，□天箕毕。懿范昭兹，德音洋溢。）。";
      c38.corrected="麟閣□形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，〔配〕天箕毕。懿范昭兹，德音洋溢。）。";
      c38.basis="文献续录＋AI语境暂拟";
      c38.mode="provisional";
      c38.confidence="低至中";
      c38.source="碑末后续文字依用户指定版本完整保留。“麟閣□形”中的缺字另见上一案例；“□天箕毕”仍未见可以完全确定原字的现存拓片字形。";
      c38.analysis=["本例展示栏目二中的完整碑末句。","“配天”是碑铭中常见表达，与“维地河山”形成天地对应，因此暂拟〔配〕。","后续续录没有现存网页字框，不能设置虚构红框。"];
      c38.usage="栏目二保留“麟閣□形”和“□天箕毕”两个缺字；前者在上一案例单独定位，后者仅展示AI候选〔配〕。";
      c38.locationNote="本例后半段属于文献续录，当前逐字坐标没有“□天箕毕”的拓片字形，因此不设置虚构红框；“麟閣□形”的真实红框请查看上一案例。";
      c38.highlight="维地河山，□天箕毕";
    }

    cases.forEach((item,index)=>{item.id=String(index+1).padStart(2,"0");});
    return cases;
  }

  function highlightTranscript(root,cases){
    const phrases=cases.map(item=>item.highlight||item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const text=paragraph.textContent||"",matches=[];
      phrases.forEach(phrase=>{let from=0;while(from<text.length){const index=text.indexOf(phrase,from);if(index<0)break;matches.push({index,end:index+phrase.length});from=index+phrase.length;}});
      if(!matches.length)return;
      matches.sort((a,b)=>a.index-b.index||b.end-a.end);
      const accepted=[];let cursor=-1;
      matches.forEach(match=>{if(match.index>=cursor){accepted.push(match);cursor=match.end;}});
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
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
      highlightTranscript(card,cases);
    }catch(error){console.warn("[work-005-stable] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  const normalizeMap={"僕":"仆","㒒":"仆","國":"国","職":"职","靈":"灵","傑":"杰","嶽":"岳","楨":"桢","逺":"远","遠":"远","緒":"绪","晉":"晋","陽":"阳","綴":"缀","廟":"庙","翹":"翘","紳":"绅","轍":"辙","榮":"荣","間":"间","優":"优","徳":"德","聖":"圣","賔":"宾","賓":"宾","辭":"辞","斂":"敛","鳳":"凤","鸞":"鸾","閣":"阁","毀":"毁","順":"顺","暢":"畅","禍":"祸","潰":"溃","華":"华","蕩":"荡","寵":"宠","勳":"勋","餌":"饵","飣":"饵","單":"单","於":"于","扵":"于","鳥":"鸟","烏":"乌","圖":"图","宻":"密","髙":"高","乗":"乘","莭":"节","眀":"明","㓛":"功","終":"终","逹":"达","徴":"征","屬":"属","獫":"猃","縱":"纵","萬":"万","編":"编","澤":"泽","稱":"称","鴻":"鸿","囬":"回","驥":"骥","馳":"驰","簡":"简","冊":"册","肅":"肃","絲":"丝","綸":"纶","欽":"钦","憲":"宪","厯":"历","寬":"宽","損":"损","義":"义","違":"违","闢":"辟","牆":"墙","約":"约","猶":"犹","兩":"两","豎":"竖","顔":"颜","唘":"启","護":"护","書":"书","儉":"俭","側":"侧","給":"给","園":"园","噐":"器","賻":"赙","贈":"赠","喪":"丧","湏":"须","並":"并"};
  const normChar=ch=>normalizeMap[ch]||ch;
  const cleanChars=value=>Array.from(String(value||"")).filter(ch=>!/[\s，。；：、？！“”‘’（）《》【】\-—……,.!?;:]/.test(ch)).map(normChar);
  const rectOf=box=>({x:Number(box.bbox_x??box.x??box.bbox?.[0]??0),y:Number(box.bbox_y??box.y??box.bbox?.[1]??0),w:Number(box.bbox_w??box.w??box.bbox?.[2]??0),h:Number(box.bbox_h??box.h??box.bbox?.[3]??0)});

  let pageListPromise=null;
  function getPageList(){
    if(!pageListPromise)pageListPromise=fetch(PAGE_INDEX_URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}).then(data=>Array.isArray(data?.works?.["005"]?.pages)?data.works["005"].pages:[]);
    return pageListPromise;
  }

  function patternsFor(original){
    const chars=cleanChars(original),patterns=[];
    for(let i=0;i<chars.length;){
      if(chars[i]!=="□"){i+=1;continue;}
      let end=i+1;while(end<chars.length&&chars[end]==="□")end+=1;
      [[7,7],[6,6],[5,5],[4,4],[3,3],[2,4],[4,2],[2,2],[1,4],[4,1],[1,1]].forEach(([l,r])=>{
        const pattern=[...chars.slice(Math.max(0,i-l),i),...Array(end-i).fill("."),...chars.slice(end,Math.min(chars.length,end+r))];
        if(pattern.filter(ch=>ch!==".").length)patterns.push(pattern);
      });
      i=end;
    }
    return patterns;
  }

  function matchPage(boxes,patterns){
    const chars=boxes.map(box=>normChar(box.char||box.text||""));
    for(const pattern of patterns){
      for(let start=0;start<=chars.length-pattern.length;start+=1){
        let ok=true;for(let i=0;i<pattern.length;i+=1){if(pattern[i]!=="."&&pattern[i]!==chars[start+i]){ok=false;break;}}
        if(!ok)continue;
        const selected=[];for(let i=0;i<pattern.length;i+=1)if(pattern[i]===".")selected.push(boxes[start+i]);
        if(selected.length)return selected;
      }
    }
    return null;
  }

  function makeLocation(page,boxes,selected){
    const rects=selected.map(rectOf).filter(r=>r.w>0&&r.h>0);if(!rects.length)return null;
    const first=boxes[0],canvas={w:Number(first.canvas_width||1466),h:Number(first.canvas_height||2228)};
    const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y)),maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h)),pad=14;
    const target={x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(canvas.w,maxX-minX+pad*2),h:Math.min(canvas.h,maxY-minY+pad*2)};
    const cropW=Math.min(canvas.w,Math.max(380,target.w*2.5)),cropH=Math.min(canvas.h,Math.max(620,target.h*3.2));
    const crop={x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH};
    return {page:Number(page.page||page.canvas_index||0),image:page.image,canvas,crop,target};
  }

  const locationCache=new Map();
  const locationJobs=new Map();
  async function locateCase(item){
    if(item.locationNote)return [];
    if(locationCache.has(item.id))return locationCache.get(item.id);
    if(locationJobs.has(item.id))return locationJobs.get(item.id);
    const job=(async()=>{
      const pages=await getPageList(),patterns=patternsFor(item.original);
      if(!patterns.length)return [];
      for(const page of pages){
        const pageNo=Number(page.page||page.canvas_index||0);if(!pageNo)continue;
        try{
          const response=await fetch(`data/glyph_boxes/iiif/005/page_${String(pageNo).padStart(4,"0")}.json?v=20260720_stable_v1`,{cache:"force-cache"});
          if(!response.ok)continue;
          const boxes=(await response.json()).slice().sort((a,b)=>Number(a.order_in_page||0)-Number(b.order_in_page||0));
          const selected=matchPage(boxes,patterns);if(!selected)continue;
          const loc=makeLocation(page,boxes,selected);if(loc){locationCache.set(item.id,[loc]);return [loc];}
        }catch(_){ }
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      locationCache.set(item.id,[]);return [];
    })().finally(()=>locationJobs.delete(item.id));
    locationJobs.set(item.id,job);return job;
  }

  function imageHtml(item){
    const locations=locationCache.get(item.id);
    if(item.locationNote)return `<div class="damage-location-missing"><p>${esc(item.locationNote)}</p></div>`;
    if(!locations)return '<div class="damage-location-missing damage-location-loading"><p>正在读取当前案例的拓片局部……</p></div>';
    if(!locations.length)return '<div class="damage-location-missing"><p>现有逐字坐标中暂未匹配到该句的缺字区域。系统不会用无关字形代替，请在栏目一按原句继续核对。</p></div>';
    return locations.map(loc=>`<div class="damage-viewport" data-image="${esc(loc.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${loc.crop.x} ${loc.crop.y} ${loc.crop.w} ${loc.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(loc.image)}" x="0" y="0" width="${loc.canvas.w}" height="${loc.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${loc.target.x}" y="${loc.target.y}" width="${loc.target.w}" height="${loc.target.h}"></rect></svg></div><p class="damage-caption">《${WORK_TITLE}》第${loc.page}页，对应问题字局部</p>`).join("");
  }

  function basisBlock(item){
    const badge=item.mode==="documentary"?"文献对校":item.mode==="provisional"?"未见直接定本 · AI语境暂拟":item.mode==="unresolved"?"暂未恢复":item.basis;
    return `<div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${esc(badge)}</span><p><strong>资料查证结果：</strong>${esc(item.source)}</p><p><strong>使用说明：</strong>${esc(item.usage)}</p></div></div>`;
  }
  const resultLabel=item=>item.mode==="documentary"?"文献对校结果":item.mode==="provisional"?"AI暂拟补全":item.mode==="unresolved"?"暂未恢复":"文献对校与AI暂拟";
  const confidenceLabel=value=>String(value||"").includes("判断")?String(value):`${value}置信度`;

  let cases=[],current=0,expanded=false,listScrollTop=0,renderToken=0;
  const tabs=()=>cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");
  function panel(item){
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(confidenceLabel(item.confidence))}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${markedHtml(item.corrected)}</div></div>${basisBlock(item)}<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;
    const token=++renderToken,item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");
    window.DAMAGE_AI_CASES=cases.map(value=>clone(value));
    section.className="content-card damage-ai";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div>`;
    const list=section.querySelector(".damage-list");
    if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current-=1;else if(action==="next"&&current<cases.length-1)current+=1;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelectorAll(".damage-viewport[data-image]").forEach(view=>view.addEventListener("dblclick",()=>{if(typeof window.openZoom==="function")window.openZoom(view.dataset.image);}));

    if(!item.locationNote&&!locationCache.has(item.id)){
      setTimeout(()=>locateCase(item).then(()=>{if(token===renderToken&&cases[current]===item)renderDamage();}).catch(error=>console.warn("[work-005-stable] locate",error)),150);
    }
  }

  function ensureStyle(){
    if(document.getElementById("work005-stable-style"))return;
    const style=document.createElement("style");style.id="work005-stable-style";
    style.textContent=`.damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-basis-card p{margin:8px 0;line-height:1.8}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}`;
    document.head.appendChild(style);
  }

  async function init(){
    ensureStyle();
    const damage=document.getElementById("people");
    if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》释读案例……</div></div>`;
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${CASE_URL} ${response.status}`);
      cases=reviseCases(await response.json());
      renderTranscript(cases);
      renderDamage();
      window.__WORK_005_CONTENT_READY__=true;
      window.dispatchEvent(new CustomEvent("work-005-content-ready"));
    }catch(error){
      console.error("[work-005-stable]",error);
      if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${WORK_TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();