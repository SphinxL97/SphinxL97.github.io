/* 作品004《麓山寺碑并阴》栏目二、三专属内容。
 * 只在原释文明确标出的“□”或残字位置提出候选；
 * AI分析只解释为什么判断为当前候选字，不使用共享操作模板。
 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(id!=="004"||window.__WORK_004_LUSHANSI_CONTENT__)return;
  window.__WORK_004_LUSHANSI_CONTENT__=true;

  /* 004完全使用自己的案例、图片和分析，阻止旧共享脚本二次覆盖。 */
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="麓山寺碑并阴";
  const TEXT_URL="data/lushansi_full_text.txt?v=20260716_lushansi_v2";
  const CASE_URL="data/lushansi_damage_cases.json?v=20260721_lushansi_analysis_v3";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字或残字提出校读意见。AI分析重点说明为什么判断为当前候选字，包括纪年结构、固定词语、官职题名、人名格式、上下句对偶及拓片残存字形等依据。";

  const OVERRIDES={
    "01":{
      nav:"残损碑文恢复",t:"残损碑文恢复——“岁次庚□□月壬子□”",
      c:"大唐开元十八年，岁次庚〔午正〕月壬子〔朔〕十一日壬戌建。",
      confidence:"高",
      e:[
        "“庚□□月”中的两个缺字分别处在干支和月份位置；补作“午正”后形成“岁次庚午、正月”的完整纪年结构。",
        "“壬子□十一日”中的单字位于日干支之后，补“朔”可组成碑刻纪日常见的“壬子朔”。",
        "若初一为壬子，顺推十日后十一日正为壬戌，与句末现存“十一日壬戌”能够相互验证。",
        "因此三处候选为“午、正、朔”，核心依据是干支、月份和朔日三层纪日关系彼此吻合。"
      ]
    },
    "02":{
      nav:"残损碑文恢复",t:"残损碑文恢复——“其□□烁”",
      c:"赞曰：英英披雾，其〔华灼〕烁；卓立㑺寸，标举明略。",
      confidence:"低至中",
      e:[
        "第二个缺字紧接“烁”，补“灼”后组成“灼烁”，是表示光彩鲜明的常见连用。",
        "第一个缺字补“华”后形成“其华灼烁”，其中“华”指光华，能够作为“灼烁”的主语。",
        "“英英披雾”与“其华灼烁”都描写才华显露、光彩焕发，前后意象相互照应。",
        "因此两字暂拟为“华灼”；语义和词语结构较顺，但拓片残损较重，仍保留低至中置信度。"
      ]
    },
    "03":{
      nav:"AI暂拟",t:"AI暂拟补释——“王敬□□、□市令程□□□”",
      c:"军刘制器，军参军尔朱浚，录事王敬〔之道〕，李博士张长卿，博士王元礼，〔监〕市令程〔元道〕□。",
      confidence:"低",
      e:[
        "“录事王敬□□”位于官员题名中，“王”为姓，“敬”后两格应继续构成人名；“之道”仅从三字名字的结构上可以成立。",
        "“□市令”前只缺一字，补“监”后形成“监市令”这一官职式结构，与本句连续列举官员的语境相符。",
        "“程□□□”位于姓氏“程”之后；“元道”可构成两字名字，但原处共有三个缺字，因此最后一格继续保留“□”，不强行补足。",
        "本例中“监”的官职结构依据相对较强，“之道、元道”主要来自姓名格式，故整体仅作低置信度候选。"
      ]
    },
    "04":{
      nav:"AI暂拟",t:"AI暂拟补释——“□□□□□礼乐，君子同□□”",
      c:"赞曰：〔文武兼资崇〕礼乐，仕门贤才，君子同〔归道〕。",
      confidence:"低",
      e:[
        "第一组五个缺字位于“礼乐”之前；“文武兼资”概括才德，“崇”可直接支配“礼乐”，合为“文武兼资崇礼乐”。",
        "第二组两个缺字位于“君子同□□”，补“归道”后成为“君子同归道”，语义为君子共同归向正道。",
        "补后全句依次称颂文武才具、礼乐修养、仕门贤才和君子归道，符合赞辞连续褒扬的语气。",
        "两组候选主要依靠赞辞语义和句法补全，缺少清晰字形支持，因此只作低置信度暂拟。"
      ]
    },
    "05":{
      nav:"AI暂拟",t:"AI暂拟补释——官员题名残损",
      c:"参军〔张元礼〕，曹〔参〕军功曹员外同正〔录〕功军，仓曹员外同正李曹参军〔王士亨〕，军士曹参军〔李元〕亨，参军赵挹。",
      confidence:"低",
      e:[
        "“参军□□□”在官职之后连续缺三字，位置应为姓名；“张元礼”符合姓氏加两字名的长度。",
        "“曹□军”中间只缺一字，补“参”后可组成“曹参军”；“同正□功军”中的“录”则是依据官职语汇作的弱候选。",
        "“李曹参军□□□”后缺三字，暂拟“王士亨”；“军士曹参军□□亨”已有末字“亨”，补“李元”后可组成三字姓名“李元亨”。",
        "这些位置均属于官员题名，姓名可替代方案很多；候选主要满足官职后接姓名及缺字数量，不能视为确定人名。"
      ]
    },
    "06":{
      nav:"残损碑文恢复",t:"残损碑文恢复——“克□□祀□□”",
      c:"有力豊碑，克〔昌百〕祀〔无疆〕。",
      confidence:"中",
      e:[
        "第一组两个缺字位于“克□□祀”，“昌百”补入后形成“克昌百祀”，意为使百世祭祀昌盛。",
        "第二组两个缺字位于句末，补“无疆”后形成碑铭祝颂中常见的“无疆”，表示绵延无尽。",
        "“克昌百祀”与“无疆”共同构成对碑祀长久、功德不绝的祝愿，符合赞铭结尾语气。",
        "两组各补两字，数量与原有“□□”完全对应，因此暂拟为“昌百、无疆”。"
      ]
    },
    "07":{
      nav:"AI暂拟",t:"AI暂拟补释——“□怀靖、五思□”",
      c:"康椘元同正成麟，尉上柱国〔王〕怀靖，卢元尉员外同正，皇甫尉员外同正，刘思义，前主簿五思〔文〕。",
      confidence:"低",
      e:[
        "“上柱国□怀靖”中的缺字位于两字名“怀靖”之前，语法位置应为姓氏；“王怀靖”在姓名结构上可以成立。",
        "“五思□”中的缺字位于姓名末尾，补“文”后形成“思文”这一常见名字组合。",
        "整句连续列举官员和姓名，两个缺字都应属于人名而非官职用字。",
        "由于现有拓片不能清楚辨出姓氏和末字笔画，“王、文”只根据姓名位置和音节结构暂拟。"
      ]
    },
    "08":{
      nav:"AI暂拟",t:"AI暂拟补释——醴陵官员题名",
      c:"醴陵令李仁瓒，〔丞〕张〔玄〕道〔正〕，主簿张思已，李灵尉张光庭〔县〕尉。",
      confidence:"低",
      e:[
        "“醴陵令李仁瓒”之后的一字缺位处于下一名属官之前，补“丞”可形成县令之后列县丞的官员次序。",
        "“张□道”中间缺一字，补“玄”后形成三字姓名“张玄道”；其后的“正”仅按附衔或题名残字暂拟。",
        "“张光庭□尉”在姓名之后、‘尉’之前缺一字，补“县”可组成官名“县尉”，说明张光庭的职任。",
        "三个候选分别来自县级官员排列、姓名结构和“县尉”官名，但原句语序仍有疑点，所以整体置信度低。"
      ]
    },
    "09":{
      nav:"AI暂拟",t:"AI暂拟补释——“刘员外□□”",
      c:"衡令刘威之，刘员外〔同正〕，刘之尉，员员外尉王光大，尉周待徵。",
      confidence:"中",
      e:[
        "缺损位于“刘员外□□”，连续缺两字；同一题名段中多次出现“员外同正”这一固定附衔。",
        "补“同正”后成为“刘员外同正”，与邻近的“员外同正”官衔写法完全一致。",
        "候选字数正好对应两个“□”，且不需要改动前后现存文字。",
        "因此本处判断为“同正”，主要依据是同碑内部反复出现的官衔格式。"
      ]
    },
    "10":{
      nav:"AI暂拟",t:"AI暂拟补释——湘乡官员题名",
      c:"湘乡令王武信，主簿〔张承庆员外〕，尉〔李元礼正〕。",
      confidence:"低",
      e:[
        "“主簿”之后的缺损应包含主簿姓名或附衔；“张承庆”符合三字姓名结构，“员外”用于解释其后可能存在的附衔。",
        "“尉”之后的缺损同样应为县尉姓名或附衔；“李元礼”符合姓名格式，末字“正”可能与同段常见的“同正”有关。",
        "两组候选都遵循“官名＋姓名／附衔”的题名排列方式，并按原缺字位置依次填入。",
        "现有上下文不能确认具体姓名，尤其“员外、正”的归属仍有疑问，因此只作低置信度试拟。"
      ]
    },
    "11":{
      nav:"AI暂拟",t:"AI暂拟补释——“益阳令孟□、主簿张□□□”",
      c:"益阳令孟〔昭〕，主簿张〔元礼〕。",
      confidence:"低",
      e:[
        "“益阳令孟□”中缺字位于姓氏“孟”之后，补“昭”可组成两字姓名“孟昭”。",
        "“主簿张□□□”位于官名之后，缺损应为姓名；“张元礼”符合姓氏加两字名的常见结构。",
        "两处候选都使题名恢复为“官职＋姓名”的平行格式。",
        "姓名无法仅凭句法唯一确定；若第二处实际缺字多于“元礼”两字，剩余位置应继续保留，不据此强补。"
      ]
    },
    "12":{
      nav:"AI暂拟",t:"AI暂拟补释——“□□政震，雷和□”",
      c:"赞曰：华宗旧德，利器良播；〔仁风〕政震，雷和〔雨〕。有典有则，惟始惟终。",
      confidence:"中",
      e:[
        "“□□政震”前缺两字，补“仁风”后形成“仁风政震”，以仁德之风形容政教传播，符合赞颂德政的语境。",
        "“雷和□”末缺一字，补“雨”后与“雷”构成自然气象意象，也可比喻政令威严与恩泽调和。",
        "前句“华宗旧德、利器良播”与后句“有典有则”都在称美德政，补入“仁风、雨”后主题连续。",
        "两字和一字分别对应原来的两组缺损，候选主要依据德政语汇和上下文意象。"
      ]
    },
    "13":{
      nav:"AI暂拟",t:"AI暂拟补释——大段题名残损",
      c:"大夫〔武〕城宰张守日〔新〕，安主簿盛老〔成〕，邓洪敏〔王〕思〔玄德〕，梁元〔礼之〕，祝仁期〔之〕，张文远、石泰、张恽〔之〕，朱封禅〔员外同正〕，桓嗣宗、杨庭训、罗元〔礼之〕，邓希、王晁〔之〕，王暠〔任〕西同〔正〕，庶苑道林，景德晚〔成〕。",
      confidence:"低",
      e:[
        "“□城宰”与本碑后文再次出现的同一结构相互参照，补“武”后成为地名加官职“武城宰”，这是本例相对较有结构依据的一处。",
        "“朱封禅□□□□”连续缺四字，而同段多次使用“员外同正”附衔，因此暂拟为“员外同正”。",
        "其余缺损多位于姓氏之后或姓名中间，分别用“新、成、王、玄德、礼之、之、任、正”等补成可读姓名或附衔。",
        "除“武城宰”和“员外同正”有同碑内部参照外，其余人名用字缺少唯一证据，全部仅作为低置信度讨论候选。"
      ]
    },
    "14":{
      nav:"AI暂拟",t:"AI暂拟补释——纪日题记",
      c:"政〔在〕癸也，岁四月十〔五〕日〔甲子朔日建〕。",
      confidence:"低至中",
      e:[
        "“四月十□日”中的单字应构成具体日期，补“五”后成为“四月十五日”，句法完整。",
        "句末连续五个缺字位于日期之后，暂拟“甲子朔日建”，尝试恢复干支、朔日和建刻题记的格式。",
        "“政□癸也”中补“在”仅使语句能够连读，但这一小句的原义仍不清楚。",
        "本例只有“五”具有较直接的日期结构依据，其余候选主要来自纪日题记格式，因此整体置信度低至中。"
      ]
    },
    "15":{
      nav:"AI暂拟",t:"AI暂拟补释——“梁国虞王□□阅□□”",
      c:"梁国虞王〔亲临〕阅〔碑文〕。",
      confidence:"低",
      e:[
        "“梁国虞王”是句中主体，后面的两个缺字应连接动作“阅”；补“亲临”后形成主体亲自到场阅看的语义。",
        "“阅”后连续缺两字，需要一个宾语；补“碑文”后成为“阅碑文”，与石刻题记场景相符。",
        "两组各补两字，形成“人物＋动作修饰＋阅＋对象”的完整句法。",
        "“亲临、碑文”主要是句法和场景推测，拓片未能提供清晰字形，因此只作低置信度候选。"
      ]
    },
    "16":{
      nav:"AI暂拟",t:"AI暂拟补释——“□城宰张守昚”",
      c:"通义程暭，明迪稽山石彦和子，惠朝请大夫〔武〕城宰张守昚。",
      confidence:"中",
      e:[
        "缺字位于“□城宰”，从结构看应与“城”共同构成地名，“宰”表示该地县令。",
        "本碑第13处同样出现“大夫□城宰”，两处文字能够相互参照。",
        "补“武”后成为“武城宰”，即武城县令，官职结构完整。",
        "因此本处候选为“武”，主要依据是同碑重复结构和“地名＋宰”的官名格式。"
      ]
    }
  };

  const RADICAL="";
  const PAGE97={
    i:"08",n:"残损碑文恢复",nav:"残字推测",s:"“蔚”字推测",t:"残损碑文恢复——“蔚众木”",
    o:`赞曰：名家意，君子心；${RADICAL}众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。`,
    c:"赞曰：名家意，君子心；〔蔚〕众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。",
    r:"赞曰：名家意，君子心；蔚众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。",
    image:"assets/page_images/004_麓山寺碑并阴/images/0097_九十七.jpg",page:97,canvas:{w:1482,h:2212},targets:[{x:1109,y:1706,w:186,h:224}],
    e:[
      `拓片只剩可显示为“${RADICAL}”的残存部件，说明OCR并非完全空白，而是未能恢复完整字形。`,
      "该字位于“□众木，繁林”中，后文连续描写树木繁茂，缺字应当能够修饰“众木”。",
      "“蔚”有草木茂盛、繁密之义，补作“蔚众木，繁林”后，两部分共同表现林木蓊郁。",
      "现存笔画不足以单独确认全字，因此“蔚”主要依据残部位置和草木语境暂拟，置信度为中。"
    ],confidence:"中",groupCount:1,boxCount:1
  };

  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const setTitle=(n,t)=>{const a=document.querySelector(`.side a:nth-of-type(${n})`);if(a)a.textContent=t;};
  const paras=t=>String(t||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  const chars=v=>Array.from(String(v||""));
  const boxGroups=text=>{const out=[];let m;const re=/□+/g;while((m=re.exec(String(text||""))))out.push({start:m.index,end:m.index+m[0].length,count:m[0].length});return out;};
  const bracketGroups=text=>{const out=[];let m;const re=/〔([^〕]*)〕/g;while((m=re.exec(String(text||""))))out.push(chars(m[1]));return out;};

  function markedHtml(value){
    const text=String(value||"");let html="",cursor=0,match;const re=/〔([^〕]*)〕/g;
    while((match=re.exec(text))){html+=esc(text.slice(cursor,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;cursor=match.index+match[0].length;}
    return html+esc(text.slice(cursor));
  }

  function restrictToOriginal(item){
    const original=String(item.o||item.original||"");
    if(!original.includes("□"))return item;
    const groups=boxGroups(original),candidates=bracketGroups(item.c||item.corrected||"");
    let marked="",plain="",cursor=0;
    groups.forEach((group,index)=>{
      marked+=original.slice(cursor,group.start);plain+=original.slice(cursor,group.start);
      const candidate=(candidates[index]||[]).slice(0,group.count);
      if(candidate.length){marked+=`〔${candidate.join("")}〕`;plain+=candidate.join("");}
      if(candidate.length<group.count){const rest="□".repeat(group.count-candidate.length);marked+=rest;plain+=rest;}
      cursor=group.end;
    });
    marked+=original.slice(cursor);plain+=original.slice(cursor);
    item.c=marked;item.corrected=marked;item.r=plain;item.restored=plain;
    return item;
  }

  function firstTarget(item){
    const source=item.targets?.[0]||item.target;if(!source)return null;
    const target={x:Number(source.x||0),y:Number(source.y||0),w:Number(source.w||0),h:Number(source.h||0)};
    const firstCount=boxGroups(item.o||"")[0]?.count||1;
    if(firstCount>1){
      if(target.h>=target.w)target.h=target.h/firstCount;
      else{const part=target.w/firstCount;target.x=target.x+target.w-part;target.w=part;}
    }
    return target;
  }

  function crop(item,target){
    if(!target)return{x:0,y:0,w:item.canvas?.w||1,h:item.canvas?.h||1};
    const px=190,py=330,x=Math.max(0,target.x-px),y=Math.max(0,target.y-py);
    return{x,y,w:Math.min(item.canvas.w-x,Math.max(460,target.w+px*2)),h:Math.min(item.canvas.h-y,Math.max(900,target.h+py*2))};
  }

  let CASES=[],current=0,expanded=false,listScrollTop=0,rendering=false;

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");if(!section)return;
    setTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(String(response.status));
      card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paras(await response.text())}</div>`;
    }catch(error){console.warn("[work-004] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  const tabs=()=>CASES.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button"><b>${item.i}</b><span class="name">${esc(item.nav||item.n)}</span></button>`).join("");

  function imageHtml(item){
    const target=firstTarget(item),area=crop(item,target);
    if(!target)return'<div class="damage-location-missing"><p>当前案例尚未保存可靠的拓片坐标。</p></div>';
    return `<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${area.x} ${area.y} ${area.w} ${area.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${target.x}" y="${target.y}" width="${target.w}" height="${target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${item.page}页，本句第一个问题字局部</p>`;
  }

  function panel(item){
    const evidence=(item.e||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)} <span class="damage-heading-confidence">（${esc(item.confidence)}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${item.confidence==="暂无法判断"?"暂未恢复":"AI暂拟补全"}</span><div class="damage-text damage-new">${markedHtml(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||!CASES.length)return;
    rendering=true;setTitle(3,"三、碑文残损与AI释读");section.className="content-card damage-ai";section.dataset.work004Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(CASES[current])}</div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current--;else if(action==="next"&&current<CASES.length-1)current++;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
    rendering=false;
  }

  function prepare(rows){
    const prepared=(Array.isArray(rows)?rows:[]).map(item=>{
      const override=OVERRIDES[item.i]||{};
      const merged={...clone(item),...clone(override)};
      merged.original=merged.o;merged.corrected=merged.c;merged.analysis=[...(merged.e||[])];
      return restrictToOriginal(merged);
    });
    const insertAt=prepared.findIndex(item=>Number(item.page)>97);
    prepared.splice(insertAt<0?prepared.length:insertAt,0,clone(PAGE97));
    return prepared.map((item,index)=>{item.i=String(index+1).padStart(2,"0");item.id=item.i;item.original=item.o;item.corrected=item.c;item.analysis=[...(item.e||[])];return item;});
  }

  async function init(){
    renderTranscript();
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(String(response.status));
      CASES=prepare(await response.json());
      window.DAMAGE_AI_CASES=CASES.map(clone);
      renderDamage();
      window.__WORK_004_CONTENT_READY__=true;
      window.dispatchEvent(new CustomEvent("work-004-content-ready"));
      window.dispatchEvent(new CustomEvent("work-004-cases-ready",{detail:{count:CASES.length}}));

      const section=document.getElementById("people");
      if(section){
        const observer=new MutationObserver(()=>{
          if(rendering)return;
          const generic=section.textContent?.includes("当前原释文包含")||section.textContent?.includes("其他录文仅作为判断缺字候选");
          if(section.dataset.work004Dedicated!=="true"||generic)renderDamage();
        });
        observer.observe(section,{childList:true,subtree:true});
        setTimeout(()=>observer.disconnect(),15000);
      }
    }catch(error){console.error("[work-004] cases",error);}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();