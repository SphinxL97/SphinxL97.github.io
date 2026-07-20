/* 005《虞恭公温彦博碑》完整栏目二、三（复核修正版）。
 * 删除无法确认的首行；按原释文顺序展示全部其余缺字段落。
 * 修正案例分类、跨页坐标匹配及碑末续文展示。
 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_ALL_DAMAGE_V2__)return;
  window.__WORK_005_ALL_DAMAGE_V2__=true;

  const TITLE="虞恭公温彦博碑";
  const TEXT_URL="data/yugonggong_full_text.txt?v=20260720_review_v2";
  const CASE_URL="data/yugonggong_all_damage_cases.json?v=20260720_review_v2";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260720_review_v2";
  const CACHE_KEY="work005-all-gap-locations-review-v2";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目按照碑文原始释文的先后顺序，完整展示保留下来的全部缺字段落。能够从《钦定全唐文》《唐文拾遗》等资料直接核对的，标为“文献对校”；资料未给出确定文字、但可以依据上下文提出候选的，标为“AI语境暂拟”；证据仍不足的，继续保留原缺字。";

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const stripPunctuation=value=>Array.from(String(value||"")).filter(ch=>!/[\s，。；：、？！“”‘’（）《》【】\-—……,.!?;:]/.test(ch));
  const normalizeChar=value=>{
    const map={"僕":"仆","㒒":"仆","國":"国","職":"职","靈":"灵","傑":"杰","嶽":"岳","楨":"桢","逺":"远","遠":"远","緒":"绪","晉":"晋","陽":"阳","綴":"缀","廟":"庙","翹":"翘","紳":"绅","轍":"辙","榮":"荣","間":"间","優":"优","巖":"岩","歭":"峙","徳":"德","聖":"圣","賔":"宾","賓":"宾","辭":"辞","斂":"敛","鳳":"凤","鸞":"鸾","閣":"阁","瓌":"瑰","毀":"毁","順":"顺","暢":"畅","禍":"祸","潰":"溃","華":"华","蕩":"荡","寵":"宠","勳":"勋","餌":"饵","飣":"饵","單":"单","於":"于","扵":"于","鳥":"鸟","騰":"腾","實":"实","溫":"温","漢":"汉","慴":"慑","圖":"图","纔":"才","摶":"搏","宻":"密","髙":"高","乗":"乘","莭":"节","眀":"明","㓛":"功","終":"终","逹":"达","徴":"征","屬":"属","獫":"猃","縱":"纵","萬":"万","編":"编","澤":"泽","稱":"称","鴻":"鸿","囬":"回","驥":"骥","馳":"驰","祿":"禄","嵗":"岁","簡":"简","冊":"册","肅":"肃","絲":"丝","綸":"纶","鎬":"镐","亰":"京","贊":"赞","欽":"钦","憲":"宪","厯":"历","寬":"宽","損":"损","義":"义","違":"违","抂":"枉","闢":"辟","牆":"墙","約":"约","猶":"犹","棟":"栋","幹":"干","兩":"两","豎":"竖","顔":"颜","唘":"启","護":"护","書":"书","儉":"俭","側":"侧","給":"给","園":"园","噐":"器","賻":"赙","贈":"赠","喪":"丧","湏":"须","並":"并","當":"当","賢":"贤","輔":"辅","雲":"云","縭":"摛","銘":"铭","藹":"蔼","顯":"显","慶":"庆","飛":"飞","圍":"咏","竒":"奇","龍":"龙","貽":"贻","則":"则","跡":"迹","聲":"声","謨":"谟","㝎":"定","騖":"骛","矯":"矫","趙":"赵","稅":"税","駕":"驾","體":"体","畢":"毕","範":"范"};
    const ch=String(value||"");
    return map[ch]||ch;
  };
  const normalizeSequence=value=>stripPunctuation(value).map(normalizeChar);

  function markedHtml(value){
    const text=String(value||"");let html="",cursor=0,match;const pattern=/〔([^〕]*)〕/g;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(cursor,match.index));
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      cursor=match.index+match[0].length;
    }
    html+=esc(text.slice(cursor));
    return html;
  }

  function reviseCases(rawCases){
    const cases=(Array.isArray(rawCases)?rawCases:[])
      .filter(item=>item.id!=="01"&&item.id!=="37")
      .map(item=>JSON.parse(JSON.stringify(item)));

    const byOldId=id=>cases.find(item=>item.id===id);

    ["08","28","36"].forEach(id=>{const item=byOldId(id);if(item)item.category="残损碑文恢复";});

    const c28=byOldId("28");
    if(c28){
      c28.title="忠允宽裕至违规矩";
      c28.corrected="是以忠〔允〕寬裕，〔懷內恭之温温，虛列著之抑抑，謹度習儀，自叶巽貞之吉；盡忠補過，不忘前惕之勤。損兹驕盈，戒其徧辟，夙夜匪懈，以事一人。獻替之規，不忘于忠〕恕，損益之義，皆出〔于〕仁厚，違〔規〕矩，枉尋尺，光其家而弗為；";
      c28.source="《唐文拾遗》相关录文完整保存“是以忠允宽裕”至“违规矩，枉寻尺”的连续文字，因此不再用省略号代替中间内容。";
      c28.analysis=[
        "原释文中的一个单框和三个连续方框，实际压缩了较长的品德叙述。",
        "《唐文拾遗》保存了“忠允宽裕”“不忘于忠恕”“皆出于仁厚”“违规矩，枉寻尺”等连续文字。",
        "本例主要属于长段残损恢复，不再归入形近字纠错。"
      ];
      c28.usage="栏目二继续保留原始方框；栏目三展示文献保存的完整连续文字，不再出现省略号。";
    }

    const c29=byOldId("29");
    if(c29){
      c29.category="形近字纠错";
      c29.title="“利”校为“心”并补“之”";
      c29.corrected="心〔之〕所同，必擇善以利物；";
      c29.source="《昭陵碑考》《唐文拾遗》相关录文均作“心之所同，必择善以利物”。";
      c29.analysis=[
        "原识别中的“利”应校为“心”，这是已有文字的形近误识，不是新增一个字。",
        "原句唯一的“□”补作“之”，所以校勘结果中只把“之”标为新增。",
        "“心之所同”与下句“意之所异”形成严格对举。"
      ];
      c29.usage="“利→心”为原字纠正；〔之〕才是对唯一缺字的补录。";
    }

    const c31=byOldId("31");
    if(c31){
      c31.category="形近字纠错";
      c31.title="“子心”校为“之心”并补“洽”";
      c31.corrected="行慈惠之心，〔洽〕扵猶子。";
      c31.source="《昭陵碑考》《唐文拾遗》相关录文作“行慈惠之心，洽于犹子”。";
      c31.analysis=[
        "原识别“子心”中的“子”应校为“之”，属于形近误识。",
        "原句唯一的“□”补作“洽”。",
        "因此页面只把〔洽〕标作新增字，不再把“之”误显示成第二个补字。"
      ];
      c31.usage="“子→之”为原字纠正；〔洽〕是对原缺字的补录。";
    }

    const c36=byOldId("36");
    if(c36){
      c36.title="一水逝黄陂、光沈赵日";
      c36.usage="本例包含缺字恢复、语序复原和“曰→日”纠正，整体归为残损碑文恢复。";
    }

    const c38=byOldId("38");
    if(c38){
      c38.category="残损碑文恢复";
      c38.title="碑末续文与“配天箕毕”";
      c38.original="麟阁图形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，□天箕毕。懿范昭兹，德音洋溢。）";
      c38.corrected="麟阁图形，乌（台腾实。悲缠奄息，伤怀尹姞。永叨恩隆，垂裕韐韠。维地河山，〔配〕天箕毕。懿范昭兹，德音洋溢。）";
      c38.source="《唐文拾遗》保存“麟阁图形，乌台腾实”及后续铭辞；“□天箕毕”中的缺字仍未见可以完全确定的早期拓本字形。";
      c38.analysis=[
        "栏目二已经按指定版本补入“麟阁图形，乌（台腾实”及其后续全文。",
        "“配天”是碑铭中常见的褒颂表达，与“维地河山”形成天地对应。",
        "〔配〕仍属于AI语境候选，不能当作现存拓片已经辨认出的原字。"
      ];
      c38.usage="本段属于文献续录；现有第34页逐字坐标止于“鸟”字，后续“□天箕毕”没有对应的现存拓片字框。";
      c38.locationNote="本段后续文字来自文献续录。当前网站第34页逐字坐标止于“鸟”字，未保存“□天箕毕”的拓片字形，因此本案例不设置虚构红框。";
    }

    cases.forEach((item,index)=>{item.id=String(index+1).padStart(2,"0");});
    return cases;
  }

  function paragraphHtml(text){
    return String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  }

  function buildGapPatterns(original){
    const chars=normalizeSequence(original),patterns=[];
    for(let i=0;i<chars.length;){
      if(chars[i]!=="□"){i++;continue;}
      let end=i+1;while(end<chars.length&&chars[end]==="□")end++;
      const candidates=[[7,7],[6,6],[5,5],[4,4],[3,3],[2,4],[4,2],[2,2],[1,4],[4,1],[1,1]]
        .map(([l,r])=>[...chars.slice(Math.max(0,i-l),i),...Array(end-i).fill("."),...chars.slice(end,Math.min(chars.length,end+r))].join(""))
        .filter((value,index,array)=>value.replace(/\./g,"").length>=1&&array.indexOf(value)===index)
        .sort((a,b)=>b.replace(/\./g,"").length-a.replace(/\./g,"").length);
      patterns.push({patterns:candidates,gapLength:end-i});
      i=end;
    }
    return patterns;
  }

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}

  function highlightAll(root,cases){
    const phrases=cases.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      if(paragraph.dataset.work005ReviewHighlight==="true")return;
      const text=paragraph.textContent||"",matches=[];
      phrases.forEach(phrase=>{
        let from=0;
        while(from<text.length){
          const index=text.indexOf(phrase,from);if(index<0)break;
          matches.push({index,end:index+phrase.length});from=index+phrase.length;
        }
      });
      if(!matches.length)return;
      matches.sort((a,b)=>a.index-b.index||b.end-a.end);
      const accepted=[];let cursor=-1;
      matches.forEach(match=>{if(match.index>=cursor){accepted.push(match);cursor=match.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(match=>{
        if(match.index>offset)fragment.appendChild(document.createTextNode(text.slice(offset,match.index)));
        const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=text.slice(match.index,match.end);fragment.appendChild(strong);offset=match.end;
      });
      if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
      paragraph.replaceChildren(fragment);paragraph.dataset.work005ReviewHighlight="true";
    });
  }

  async function renderTranscript(cases){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
    const card=section.querySelector(".full-transcript-card");
    card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
    highlightAll(card,cases);window.dispatchEvent(new CustomEvent("work-005-transcript-ready"));
  }

  const rectOf=box=>({x:Number(box.bbox_x??box.x??box.bbox?.[0]??0),y:Number(box.bbox_y??box.y??box.bbox?.[1]??0),w:Number(box.bbox_w??box.w??box.bbox?.[2]??0),h:Number(box.bbox_h??box.h??box.bbox?.[3]??0)});

  async function loadPages(){
    const indexResponse=await fetch(PAGE_INDEX_URL,{cache:"force-cache"});if(!indexResponse.ok)throw new Error(`${PAGE_INDEX_URL} ${indexResponse.status}`);
    const data=await indexResponse.json(),pageMeta=Array.isArray(data?.works?.["005"]?.pages)?data.works["005"].pages:[],output=[],queue=[...pageMeta];
    await Promise.all(Array.from({length:8},async()=>{
      while(queue.length){
        const page=queue.shift(),pageNo=Number(page.page||page.canvas_index||0);if(!pageNo)continue;
        try{
          const response=await fetch(`data/glyph_boxes/iiif/005/page_${String(pageNo).padStart(4,"0")}.json?v=20260720_review_v2`,{cache:"force-cache"});
          if(!response.ok)continue;
          const boxes=(await response.json()).slice().sort((a,b)=>Number(a.order_in_page||0)-Number(b.order_in_page||0));if(!boxes.length)continue;
          const first=boxes[0];
          output.push({page:pageNo,image:page.image,boxes,chars:boxes.map(box=>normalizeChar(box.char||box.text||"")),canvas:{w:Number(first.canvas_width||1466),h:Number(first.canvas_height||2228)}});
        }catch(_){}
      }
    }));
    return output.sort((a,b)=>a.page-b.page);
  }

  function buildStream(pages){
    const stream=[];
    pages.forEach(page=>page.boxes.forEach((box,index)=>stream.push({char:page.chars[index],box,page})));
    return stream;
  }

  function matchPattern(stream,pattern,fromIndex){
    const starts=[Math.max(0,fromIndex-12),0];
    for(const begin of starts){
      for(let start=begin;start<=stream.length-pattern.length;start++){
        let ok=true;
        for(let i=0;i<pattern.length;i++){
          const expected=pattern[i];
          if(expected!=="."&&expected!==stream[start+i].char){ok=false;break;}
        }
        if(!ok)continue;
        const selected=[];
        for(let i=0;i<pattern.length;i++)if(pattern[i]===".")selected.push(stream[start+i]);
        if(selected.length)return {selected,start,end:start+pattern.length};
      }
    }
    return null;
  }

  function geometry(page,selectedBoxes){
    const rects=selectedBoxes.map(rectOf).filter(r=>[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.w>0&&r.h>0);if(!rects.length)return null;
    const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y)),maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h)),pad=14;
    const target={x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(page.canvas.w,maxX-minX+pad*2),h:Math.min(page.canvas.h,maxY-minY+pad*2)};
    const cropW=Math.min(page.canvas.w,Math.max(380,target.w*2.5)),cropH=Math.min(page.canvas.h,Math.max(620,target.h*3.2));
    return {target,crop:{x:Math.max(0,Math.min(page.canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(page.canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH}};
  }

  function locationsFromMatch(match){
    const grouped=new Map();
    match.selected.forEach(entry=>{
      const key=entry.page.page;
      if(!grouped.has(key))grouped.set(key,{page:entry.page,boxes:[]});
      grouped.get(key).boxes.push(entry.box);
    });
    const locations=[];
    grouped.forEach(group=>{
      const geo=geometry(group.page,group.boxes);if(!geo)return;
      locations.push({page:group.page.page,image:group.page.image,canvas:group.page.canvas,crop:geo.crop,target:geo.target});
    });
    return locations;
  }

  const locationKey=loc=>`${loc.page}:${Math.round(loc.target.x)}:${Math.round(loc.target.y)}:${Math.round(loc.target.w)}:${Math.round(loc.target.h)}`;

  async function resolveLocations(cases){
    try{
      const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
      if(Array.isArray(cached)&&cached.length===cases.length){cases.forEach((item,index)=>item.locations=Array.isArray(cached[index])?cached[index]:[]);return;}
    }catch(_){}
    const pages=await loadPages(),stream=buildStream(pages);let cursor=0;
    cases.forEach(item=>{
      if(item.locationNote){item.locations=[];return;}
      const resolved=[];
      buildGapPatterns(item.original).forEach(group=>{
        let found=null;
        for(const pattern of group.patterns){found=matchPattern(stream,pattern,cursor);if(found)break;}
        if(!found)return;
        locationsFromMatch(found).forEach(loc=>{if(!resolved.some(existing=>locationKey(existing)===locationKey(loc)))resolved.push(loc);});
        cursor=Math.max(cursor,found.end);
      });
      item.locations=resolved;
    });
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(cases.map(item=>item.locations||[])));}catch(_){}
  }

  function imageGallery(item){
    const locations=Array.isArray(item.locations)?item.locations:[];
    if(!locations.length){
      const message=item.locationNote||"现有逐字坐标中暂未匹配到该句的缺字区域。系统不会用无关字形代替，请在栏目一按原句继续核对。";
      return `<div class="damage-location-missing"><p>${esc(message)}</p></div>`;
    }
    return `<div class="damage-location-gallery">${locations.map((loc,index)=>`<figure class="damage-location-item"><div class="damage-viewport" data-image="${esc(loc.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${loc.crop.x} ${loc.crop.y} ${loc.crop.w} ${loc.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}第${index+1}处缺字"><image href="${esc(loc.image)}" x="0" y="0" width="${loc.canvas.w}" height="${loc.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${loc.target.x}" y="${loc.target.y}" width="${loc.target.w}" height="${loc.target.h}"></rect></svg></div><figcaption>第${loc.page}页 · 本案例第${index+1}处定位</figcaption></figure>`).join("")}</div>`;
  }

  function basisBlock(item){
    const badge=item.mode==="documentary"?"文献对校":item.mode==="provisional"?"未见直接定本 · AI语境暂拟":item.mode==="unresolved"?"暂未恢复":item.basis;
    return `<div class="damage-block damage-basis-block"><span class="damage-label">恢复依据</span><div class="damage-basis-card"><span class="damage-basis-badge">${esc(badge)}</span><p><strong>资料查证结果：</strong>${esc(item.source)}</p><p><strong>使用说明：</strong>${esc(item.usage)}</p></div></div>`;
  }

  function resultLabel(item){if(item.mode==="documentary")return"文献对校结果";if(item.mode==="provisional")return"AI暂拟补全";if(item.mode==="unresolved")return"暂未恢复";return"文献对校与AI暂拟";}
  function confidenceLabel(value){const text=String(value||"");return text.includes("判断")?text:`${text}置信度`;}

  let cases=[],current=0,expanded=true,listScrollTop=0;
  const tabs=()=>cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");

  function panel(item){
    const gapCount=(item.original.match(/□+/g)||[]).length;
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(confidenceLabel(item.confidence))}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageGallery(item)}<p class="damage-caption">本案例包含${gapCount}组连续缺字；已显示${item.locations?.length||0}处现有坐标。</p></section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${markedHtml(item.corrected)}</div></div>${basisBlock(item)}<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${item.analysis.map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function rememberScroll(section){const list=section?.querySelector(".damage-list");if(list)listScrollTop=list.scrollTop;}

  function renderDamage(){
    const section=document.getElementById("people");if(!section)return;
    setMenuTitle(3,"三、碑文残损与AI释读");
    window.DAMAGE_AI_CASES=cases.map(item=>({...item,locations:(item.locations||[]).map(loc=>({...loc}))}));
    section.className="content-card damage-ai";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(cases[current])}</div>`;
    const list=section.querySelector(".damage-list");
    if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>section.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{rememberScroll(section);current=Number(button.dataset.caseIndex)||0;expanded=true;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{rememberScroll(section);const action=button.dataset.action;if(action==="prev"&&current>0)current--;else if(action==="next"&&current<cases.length-1)current++;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelectorAll(".damage-viewport[data-image]").forEach(view=>view.addEventListener("dblclick",()=>{if(typeof window.openZoom==="function")window.openZoom(view.dataset.image);}));
  }

  function ensureStyle(){
    if(document.getElementById("work005-review-style"))return;
    const style=document.createElement("style");style.id="work005-review-style";
    style.textContent=`.damage-location-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%}.damage-location-item{margin:0;min-width:0}.damage-location-item figcaption{margin-top:7px;text-align:center;color:#766858;font-size:13px}.damage-location-item .damage-viewport{min-height:260px}.damage-basis-card{margin-top:10px;padding:18px 20px;border:1px solid #dec99b;border-radius:16px;background:#fff9e9}.damage-basis-badge{display:inline-flex;padding:7px 14px;border-radius:999px;background:#95824a;color:#fff;font-weight:700;margin-bottom:10px}.damage-basis-card p{margin:8px 0;line-height:1.8}.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}@media(max-width:900px){.damage-location-gallery{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  async function init(){
    ensureStyle();
    const section=document.getElementById("people");
    if(section)section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》全部缺字案例并匹配现有字框……</div></div>`;
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${CASE_URL} ${response.status}`);
      cases=reviseCases(await response.json());
      await Promise.all([renderTranscript(cases),resolveLocations(cases)]);
      renderDamage();
      window.__WORK_005_CONTENT_READY__=true;
      window.dispatchEvent(new CustomEvent("work-005-content-ready"));
    }catch(error){
      console.error("[work-005-review]",error);
      if(section)section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${TITLE}》全部缺字案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();