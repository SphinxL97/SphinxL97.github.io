/* 作品005《虞恭公温彦博碑》专属内容。
 * 只覆盖栏目二、栏目三；顶部信息卡保持现状，不新增“其他题名”和“刻立地点”。
 * 栏目三直接复用现有55页逐字坐标，自动定位问题字并生成局部红框。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_YUGONGGONG_CONTENT__)return;
  window.__WORK_005_YUGONGGONG_CONTENT__=true;

  const WORK_TITLE="虞恭公温彦博碑";
  const TEXT_URL="data/yugonggong_full_text.txt?v=20260717_yugonggong_v1";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260717_yugonggong_v1";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目结合当前拓片、逐字坐标、《全唐文》及相关金石著录，区分文献对校结果与AI语境暂拟。文献未能定字之处仍保留为开放候选，供后续校核。";
  const LOCATION_CACHE_KEY="work005-yugonggong-case-locations-v1";

  const documentary=(item,source)=>({
    ...item,basisMode:"documentary",recoveryBasisType:item.recoveryBasisType||"文献对校",
    sourceFinding:source,usageNote:"本例依据可核验录文或人物资料校勘，不属于仅凭上下文生成的AI补字。"
  });
  const provisional=(item,source)=>({
    ...item,basisMode:"ai_provisional",recoveryBasisType:item.recoveryBasisType||"未见直接定本 · AI语境暂拟",
    sourceFinding:source,aiProposal:item.c,
    usageNote:"〔〕内文字仅为AI辅助候选，不代表已经从原拓辨认出原字；栏目二继续保留原缺字或阙文。"
  });

  const CASES=[
    documentary({
      i:"01",n:"形近字纠错",s:"“右仆射、上柱国”",t:"形近字纠错——“右仆射、上柱国”",
      o:"唐故特进尚书右㒒射上柱□虞恭公温公碑。",
      c:"唐故特进尚书右〔仆〕射上柱〔国〕虞恭公温公碑。",
      r:"唐故特进尚书右〔仆〕射上柱〔国〕虞恭公温公碑。",
      locate:[{p:"右仆射上柱.虞恭公温公碑",targets:[1]}],
      e:["“右仆射”为隋唐尚书省官名。","“㒒”是OCR对“仆／僕”的形近误识。","“上柱国”为完整勋官名称。","题名与多来源录文一致。"],confidence:"高"
    },"《全唐文》《昭陵碑考》及相关馆藏说明均以“尚书右仆射、上柱国”著录温彦博官衔。"),

    documentary({
      i:"02",n:"残损碑文恢复",s:"“六卿扬其职”",t:"残损碑文恢复——“六卿扬其职”",
      o:"有周诞命，六卿扬其□□。",
      c:"有周诞命，六卿扬其〔职〕。",
      r:"昔者帝妫升历，九官奋其庸；有周诞命，六卿扬其〔职〕。",
      locate:[{p:"六卿扬其.."}],
      e:["“六卿”指周代六官。","“扬其职”与前句“九官奋其庸”形成对偶。","《全唐文》对应录文直接保存“六卿扬其职”。"],confidence:"高"
    },"《全唐文》对应录文明确作“有周诞命，六卿扬其职”。"),

    documentary({
      i:"03",n:"残损碑文恢复",s:"“人杰、嵩岳镇地、国桢”",t:"残损碑文恢复——“人杰、嵩岳镇地、国桢”",
      o:"若夫昴宿丽天，感其灵者人□；嵩□镇□，降其神者□桢。",
      c:"若夫昴宿丽天，感其灵者人〔杰〕；嵩〔岳〕镇〔地〕，降其神者〔国〕桢。",
      r:"若夫昴宿丽天，感其灵者人〔杰〕；嵩〔岳〕镇〔地〕，降其神者〔国〕桢。",
      locate:[{p:"感其灵者人.嵩.镇.降其神者.桢"}],
      e:["“人杰”与“国桢”均为人物赞语。","“丽天”与“镇地”形成天地对举。","文字、句法和文献录文相互印证。"],confidence:"高"
    },"《全唐文》及《昭陵碑考》相应录文均作“感其灵者人杰；嵩岳镇地，降其神者国桢”。"),

    documentary({
      i:"04",n:"残损碑文恢复",s:"“太原祁人、讳大临”",t:"残损碑文恢复——“太原祁人、讳大临”",
      o:"临系姬文之远胄，洙唐□之遥源。",
      c:"公太原〔祁〕人，讳〔大临〕，系姬文之远胄，派唐〔叔〕之遥源。",
      r:"公太原〔祁〕人，讳〔大临〕，系姬文之远胄，派唐〔叔〕之遥源。",
      locate:[{p:".系姬文之远胄.唐.之遥源"}],
      e:["温彦博为太原祁人。","温彦博名大临、字彦博。","“唐叔”指唐叔虞，与温氏谱系叙述相合。","当前拓本残损较多，仍保留图像供复核。"],confidence:"中高"
    },"人物传记与金石录文均可确认温彦博为太原祁人，名大临，字彦博；相应谱系文字作“派唐叔之遥源”。"),

    documentary({
      i:"05",n:"形近字纠错",s:"“开其绪、著姓晋阳”",t:"形近字纠错——“开其绪、著姓晋阳”",
      o:"食邑河内，世功□其绪；著袒裕。",
      c:"食邑河内，世功〔开〕其绪；著姓晋阳。祖裕，魏太中大夫。",
      r:"食邑河内，世功〔开〕其绪；著姓晋阳。祖裕，魏太中大夫。",
      locate:[{p:"食邑河内世功.其绪著.裕"}],
      e:["通行录文保存“世功开其绪，著姓晋阳”。","“著袒裕”是跨行串读，应拆为“著姓晋阳”与后文“祖裕”。","本例属于OCR串行与形近误识纠正。"],confidence:"高"
    },"《全唐文》与《昭陵碑考》相应文字保存“世功开其绪”“著姓晋阳”。"),

    documentary({
      i:"06",n:"残损碑文恢复",s:"“表缀、翘首、结辙”",t:"残损碑文恢复——“表缀、翘首、结辙”",
      o:"言为准的，行成□缀，廊庙翘□，搢绅结□。",
      c:"言为准的，行成〔表〕缀，廊庙翘〔首〕，搢绅结〔辙〕。",
      r:"祖裕，魏太中大夫，言为准的，行成〔表〕缀，廊庙翘〔首〕，搢绅结〔辙〕。",
      locate:[{p:"言为准的行成.缀廊庙翘.搢绅结."}],
      e:["三处缺字均见于通行录文。","“准的—表缀”“翘首—结辙”构成连续赞语。","补字后句法完整。"],confidence:"高"
    },"《全唐文》相应录文明确保存“行成表缀，廊庙翘首，搢绅结辙”。"),

    documentary({
      i:"07",n:"形近字纠错",s:"“哀荣无间、不亦优乎”",t:"形近字纠错——“哀荣无间、不亦优乎”",
      o:"颍川陈君，哀荣无闻于异代，能兼□者，不亦□？",
      c:"颍川陈君，哀荣无〔间〕于异代，能兼〔之〕者，不亦〔优〕乎？",
      r:"颍川陈君，哀荣无〔间〕于异代，能兼〔之〕者，不亦〔优〕乎？",
      locate:[{p:"颍川陈君哀荣无.于异代能兼.者不亦."}],
      e:["“无闻”与句意不合，录文作“无间”。","“能兼之者，不亦优乎”句法完整。","三处均有直接录文依据。"],confidence:"高"
    },"《全唐文》录作“哀荣无间于异代，能兼之者，不亦优乎”。"),

    documentary({
      i:"08",n:"残损碑文恢复",s:"“洪河东注、华岳西峙”",t:"残损碑文恢复——“洪河东注、华岳西峙”",
      o:"江巖巗焉，犹华岳之西歭。",
      c:"〔洋洋焉若洪河之东注，岩岩焉〕犹华岳之西〔峙〕。",
      r:"洋洋焉若洪河之东注，岩岩焉犹华岳之西〔峙〕。",
      locate:[{p:"江岩岩焉犹华岳之西.",targets:[0,1,2,3]}],
      e:["“洋洋—岩岩”分别形容水势和山势。","“洪河东注—华岳西峙”结构严格对应。","原识别由缺行、粘连和形近误识共同造成。"],confidence:"高"
    },"《全唐文》《昭陵碑考》均保存“洋洋焉若洪河之东注，岩岩焉犹华岳之西峙”。"),

    provisional({
      i:"09",n:"残损碑文恢复",s:"“重”字AI暂拟",t:"残损碑文恢复——“列圣之所重也”",
      o:"若乃三德六行，列圣之所□也。",
      c:"若乃三德六行，列圣之所〔重〕也。",
      r:"若乃三德六行，列圣之所〔重〕也。",
      locate:[{p:"列圣之所.也"}],
      e:["“三德六行”为儒家德行规范。","“列圣之所重也”语义和语法均成立。","部分现代整理本补作“重”，但较保守录文仍留缺。","“尚”等近义候选尚不能排除。"],confidence:"低至中"
    },"《全唐文》和较保守的金石录文在此处仍保留一字之缺；部分现代整理本补作“重”，尚未形成可直接定字的早期录文证据。"),

    documentary({
      i:"10",n:"形近字纠错",s:"“宾王、正辞、敛笏、玉振”",t:"形近字纠错——“宾王、正辞、敛笏、玉振”",
      o:"由宾□而佩印；太子洗马李纲，直道正□……□笏凤池……韶音玉□。",
      c:"由宾〔王〕而佩印；太子洗马李纲，直道正〔辞〕……〔敛〕笏凤池……韶音玉〔振〕。",
      r:"由宾〔王〕而佩印。太子洗马李纲，直道正〔辞〕，羽仪海内，并下堂见礼。乃授通事舍人，〔敛〕笏凤池，垂绅鸾阁；瑰姿月举，韶音玉〔振〕。",
      locate:[{p:"由宾.而佩印"},{p:"直道正."},{p:".笏凤池"},{p:"韶音玉."}],
      e:["“宾王”指辅佐王室。","“直道正辞”为人物品评。","“敛笏凤池，垂绅鸾阁”形成对偶。","“瑰姿月举，韶音玉振”形成对偶。"],confidence:"高"
    },"上述词语均可在《全唐文》相应上下文中直接找到；局部图像优先定位“宾王”一处，其余字仍可在全文浏览中逐字核对。"),

    documentary({
      i:"11",n:"残损碑文恢复",s:"“孺慕、哀毁”",t:"残损碑文恢复——“孺慕、哀毁”",
      o:"大业之始，以亲丧去官，□慕之感，□毁之极。",
      c:"大业之始，以亲丧去官，〔孺〕慕之感，〔哀〕毁之极。",
      r:"大业之始，以亲丧去官，〔孺〕慕之感，〔哀〕毁之极。",
      locate:[{p:".慕之感.毁之极"}],
      e:["“孺慕”表示如幼儿思慕父母。","“哀毁”表示居丧悲痛以致损伤身体。","与“以亲丧去官”直接衔接。"],confidence:"高"
    },"《全唐文》相应录文作“孺慕之感，哀毁之极”。"),

    documentary({
      i:"12",n:"残损碑文恢复",s:"“逆顺、祸福”",t:"残损碑文恢复——“逆顺、祸福”",
      o:"诏公衔命蕃境，申明臣节，陈之以□。",
      c:"诏公衔命蕃境，申明臣节，陈之以〔逆顺〕，〔畅之以祸福〕。",
      r:"诏公衔命蕃境，申明臣节，陈之以〔逆顺〕，〔畅之以祸福〕。",
      locate:[{p:"申明臣节陈之以."}],
      e:["“逆顺”说明叛逆与归顺的利害。","“祸福”与“逆顺”共同构成使者游说内容。","原释文漏掉了后半句。"],confidence:"高"
    },"《全唐文》保存“陈之以逆顺，畅之以祸福”。"),

    documentary({
      i:"13",n:"残损碑文恢复",s:"“天地横溃、华戎版荡”",t:"残损碑文恢复——“天地横溃、华戎版荡”",
      o:"属天地横□□之鼎……光□属于□庸。",
      c:"属天地横〔溃〕，〔华戎版荡〕……光〔宠〕属于〔勋〕庸。",
      r:"属天地横〔溃〕，〔华戎版荡〕。艾绶银章，弓旌先于髦俊；建社班瑞，光〔宠〕属于〔勋〕庸。",
      locate:[{p:"天地横..之鼎"},{p:"光.属于.庸"}],
      e:["“横溃—版荡”描述隋末天下崩乱。","“光宠—勋庸”说明封爵赏赐归于有功者。","原“之鼎”属于跨行粘连。"],confidence:"高"
    },"《全唐文》相应录文保存“属天地横溃，华戎版荡”与“光宠属于勋庸”。"),

    provisional({
      i:"14",n:"古字识别",s:"“跎”字AI暂拟",t:"古字识别——“蹉跎于吴阪”",
      o:"岂蹉□于吴阪。",
      c:"岂蹉〔跎〕于吴阪。",
      r:"岂蹉〔跎〕于吴阪；清越振响，终特达于章台。",
      locate:[{p:"岂蹉.于吴阪"}],
      e:["“蹉跎”是固定词组，表示困顿失意或迟滞不进。","“吴阪”与骏马受困的比喻语境相关。","数字录文在此显示私用区或特殊编码字。","最终仍须以拓片字形判断是“跎”还是其异体。"],confidence:"中"
    },"《全唐文》数字文本在“蹉”后显示为特殊编码字符，《昭陵碑考》也未稳定转写为现代通行字；目前以固定词组提出“跎”作为候选。"),

    documentary({
      i:"15",n:"形近字纠错",s:"“五饵之术、必系单于”",t:"形近字纠错——“五饵之术、必系单于”",
      o:"十万之师，方绝大汉；五飣之术，必系单□。",
      c:"十万之师，方绝大汉；五〔饵〕之术，必系单〔于〕。",
      r:"十万之师，方绝大汉；五〔饵〕之术，必系单〔于〕。",
      locate:[{p:"五饵之术必系单.",targets:[1]}],
      e:["“五饵”是汉代对匈奴政策的典故。","“飣”是OCR形近误识。","“单于”为匈奴首领称号。","典故与边疆军政语境一致。"],confidence:"高"
    },"《全唐文》相应录文作“五饵之术，必系单于”。"),

    provisional({
      i:"16",n:"残损碑文恢复",s:"“鸟□腾实”异文待考",t:"残损碑文恢复——“鸟□腾实”异文待考",
      o:"麟阁□形鸟。",
      c:"麟阁〔图〕形，鸟□腾实。",
      r:"麟阁〔图〕形，鸟□腾实。",
      locate:[{p:"麟阁.形鸟"},{p:"麟阁图形鸟.腾实"}],
      e:["“麟阁图形”指功臣画像列于麒麟阁，可由多来源确认。","后半句存在“乌台腾实”“鸟英腾实”等异文。","《全唐文》保守录文仍保留一字之缺。","当前不选择某一异文覆盖拓本。"],confidence:"暂无法判断"
    },"“麟阁图形”可由多来源确认；后半句在“乌台腾实”“鸟英腾实”等读法之间存在分歧，尚不能直接确定缺字。")
  ];

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const paragraphHtml=text=>String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  const setMenuTitle=(index,title)=>{const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;};

  const charMap={
    "僕":"仆","㒒":"仆","國":"国","職":"职","靈":"灵","傑":"杰","嶽":"岳","岳":"岳","楨":"桢",
    "遠":"远","逺":"远","緒":"绪","晉":"晋","陽":"阳","綴":"缀","廟":"庙","紳":"绅","轍":"辙",
    "榮":"荣","間":"间","優":"优","巖":"岩","歭":"峙","賔":"宾","賓":"宾","辭":"辞","斂":"敛",
    "鳳":"凤","鸞":"鸾","瓌":"瑰","毀":"毁","順":"顺","暢":"畅","禍":"祸","潰":"溃","華":"华",
    "蕩":"荡","寵":"宠","勳":"勋","飣":"饵","餌":"饵","單":"单","於":"于","閣":"阁","圖":"图",
    "鳥":"鸟","騰":"腾","實":"实","溫":"温","漢":"汉","慴":"慑","隴":"陇"
  };
  const normalizeChar=value=>charMap[String(value||"")]||String(value||"");
  const patternChars=value=>Array.from(String(value||"")).filter(ch=>!/[\s，。；：、？！“”‘’（）《》【】\-—]/.test(ch)).map(ch=>ch==="."?".":normalizeChar(ch));
  const glyphRect=g=>({x:Number(g.bbox_x??g.x??0),y:Number(g.bbox_y??g.y??0),w:Number(g.bbox_w??g.w??0),h:Number(g.bbox_h??g.h??0)});

  function findPattern(page,loc){
    const pattern=patternChars(loc.p);
    const chars=page.boxes.map(box=>normalizeChar(box.char||box.text||""));
    for(let start=0;start<=chars.length-pattern.length;start++){
      let ok=true;
      for(let i=0;i<pattern.length;i++){if(pattern[i]!=="."&&pattern[i]!==chars[start+i]){ok=false;break;}}
      if(!ok)continue;
      const offsets=new Set(pattern.map((ch,index)=>ch==="."?index:null).filter(index=>index!==null));
      (loc.targets||[]).forEach(index=>offsets.add(index));
      const selected=Array.from(offsets).map(index=>page.boxes[start+index]).filter(Boolean);
      if(!selected.length)selected.push(...page.boxes.slice(start,start+pattern.length));
      return selected;
    }
    return null;
  }

  function geometry(page,selected){
    const rects=selected.map(glyphRect).filter(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.w>0&&r.h>0);
    if(!rects.length)return null;
    const minX=Math.min(...rects.map(r=>r.x)),minY=Math.min(...rects.map(r=>r.y));
    const maxX=Math.max(...rects.map(r=>r.x+r.w)),maxY=Math.max(...rects.map(r=>r.y+r.h));
    const pad=12;
    const target={x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(page.canvas.w,maxX-minX+pad*2),h:Math.min(page.canvas.h,maxY-minY+pad*2)};
    const cropW=Math.min(page.canvas.w,Math.max(360,target.w*2.2));
    const cropH=Math.min(page.canvas.h,Math.max(820,target.h*2.7));
    const crop={x:Math.max(0,Math.min(page.canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(page.canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH};
    return {target,crop};
  }

  async function mapLimit(values,limit,worker){
    const result=new Array(values.length);let cursor=0;
    async function run(){while(cursor<values.length){const index=cursor++;result[index]=await worker(values[index],index);}}
    await Promise.all(Array.from({length:Math.min(limit,values.length)},run));
    return result;
  }

  async function loadPages(){
    const response=await fetch(PAGE_INDEX_URL,{cache:"force-cache"});
    if(!response.ok)throw new Error(`${PAGE_INDEX_URL} ${response.status}`);
    const data=await response.json();
    const pages=Array.isArray(data?.works?.["005"]?.pages)?data.works["005"].pages:[];
    const loaded=await mapLimit(pages,8,async(page,index)=>{
      const pageNo=Number(page.page||page.canvas_index||index+1);
      const url=`data/glyph_boxes/iiif/005/page_${String(pageNo).padStart(4,"0")}.json?v=20260717_yugonggong_v1`;
      try{
        const r=await fetch(url,{cache:"force-cache"});
        if(!r.ok)return null;
        const boxes=(await r.json()).slice().sort((a,b)=>Number(a.order_in_page||0)-Number(b.order_in_page||0));
        const first=boxes[0]||{};
        return {page:pageNo,image:page.image,boxes,canvas:{w:Number(first.canvas_width||1466),h:Number(first.canvas_height||2228)}};
      }catch(_){return null;}
    });
    return loaded.filter(Boolean);
  }

  function cachedLocations(){
    try{const value=JSON.parse(localStorage.getItem(LOCATION_CACHE_KEY)||"null");return Array.isArray(value)&&value.length===CASES.length?value:null;}catch(_){return null;}
  }
  function applyLocations(locations){locations.forEach((location,index)=>{if(location)Object.assign(CASES[index],location);});}
  async function resolveLocations(){
    const cache=cachedLocations();
    if(cache){applyLocations(cache);return;}
    const pages=await loadPages();
    const locations=CASES.map(item=>{
      for(const loc of item.locate||[]){
        for(const page of pages){
          const selected=findPattern(page,loc);if(!selected)continue;
          const geo=geometry(page,selected);if(!geo)continue;
          return {page:page.page,image:page.image,canvas:page.canvas,crop:geo.crop,target:geo.target};
        }
      }
      return null;
    });
    applyLocations(locations);
    try{localStorage.setItem(LOCATION_CACHE_KEY,JSON.stringify(locations));}catch(_){}
    const unresolved=locations.map((item,index)=>item?null:CASES[index].i).filter(Boolean);
    if(unresolved.length)console.warn("[work-005] 未自动定位的案例：",unresolved.join("、"));
  }

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.classList.add("full-transcript-section");
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card" aria-live="polite"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
      window.dispatchEvent(new CustomEvent("work-005-transcript-ready"));
    }catch(error){console.warn("[work-005] transcript load failed",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  let current=0,expanded=false,listScrollTop=0;
  const caseTabs=()=>CASES.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${item.i}</b><span class="name">${esc(item.n)}</span></button>`).join("");
  function exactImage(item){
    if(!item.image||!item.canvas||!item.crop||!item.target)return '<div class="damage-viewport damage-location-missing"><p>现有坐标中暂未自动匹配到这一处，请在全文浏览中继续核对。</p></div>';
    return `<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${item.crop.x} ${item.crop.y} ${item.crop.w} ${item.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.t)}对应拓片局部"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${item.target.x}" y="${item.target.y}" width="${item.target.w}" height="${item.target.h}"></rect></svg></div>`;
  }
  function casePanel(item){
    const pageText=item.page?`第${item.page}页，对应问题字局部`:"坐标待进一步核对";
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)}</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${exactImage(item)}<p class="damage-caption">《${WORK_TITLE}》${pageText}</p></section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">修正结果（AI识别）</span><div class="damage-text damage-new">${esc(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${item.e.map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }
  function rememberListScroll(section){const list=section?.querySelector(".damage-list");if(list)listScrollTop=list.scrollTop;}
  function restoreListScroll(section){
    const list=section.querySelector(".damage-list");if(!list)return;list.scrollTop=listScrollTop;
    list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});
    requestAnimationFrame(()=>{const active=list.querySelector(".damage-tab.active");if(!active)return;const top=active.offsetTop,bottom=top+active.offsetHeight,viewTop=list.scrollTop,viewBottom=viewTop+list.clientHeight;if(top<viewTop)list.scrollTop=top;else if(bottom>viewBottom)list.scrollTop=bottom-list.clientHeight;listScrollTop=list.scrollTop;});
  }
  function bind(section){
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{rememberListScroll(section);current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{rememberListScroll(section);const action=button.dataset.action;if(action==="prev"&&current>0)current--;if(action==="next"&&current<CASES.length-1)current++;if(action==="expand")expanded=!expanded;else expanded=false;renderDamage();}));
    const viewport=section.querySelector(".damage-viewport[data-image]");if(viewport)viewport.addEventListener("dblclick",()=>{const src=viewport.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section)return;
    setMenuTitle(3,"三、碑文残损与AI释读");
    window.DAMAGE_AI_CASES=CASES.map(item=>({...item,canvas:item.canvas?{...item.canvas}:null,crop:item.crop?{...item.crop}:null,target:item.target?{...item.target}:null,e:[...item.e]}));
    section.classList.add("damage-ai");section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${casePanel(CASES[current])}</div>`;
    bind(section);restoreListScroll(section);window.dispatchEvent(new CustomEvent("damage-case-audit-ready"));
  }

  async function init(){
    renderTranscript();
    const section=document.getElementById("people");if(section)section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》释读案例并匹配现有字框……</div></div>`;
    try{await resolveLocations();}catch(error){console.warn("[work-005] case location failed",error);}
    renderDamage();window.__WORK_005_CONTENT_READY__=true;window.dispatchEvent(new CustomEvent("work-005-content-ready"));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();