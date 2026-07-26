from pathlib import Path
import json

ROOT = Path('.')
VERSION = '20260726_cuijingyong_044_v1'
TITLE = '崔敬邕墓誌'

full_text = '''魏故持节、龙骧将军、督营州诸军事、营州刺史、征虏将军、太中大夫、临青男、崔公之墓志铭。

祖秀才，讳殊，字敬异。夫人从事中郎、赵国李烋女。父双护，中书侍郎、冠军将军、豫州刺史、安平敬侯。夫人中书、赵国李诜女。

君讳敬邕，博陵安平人也。夫其殖姓之始，盖炎帝之胤。其在隆周，远祖尚父，实作太师，秉旄鹰扬，克佐□殷。若乃远源之富，弈世之美，故以备之前册，不待详录。君即豫州刺史、安平敬侯之子。冑积仁之基，累荣构之峻。特禀清贞，少播令誉。然诺之信，著于童孺；瑶音玉震，闻于弱冠。年廿八而俊华茂实，以响流于京夏矣。被旨起家，召为司徒府主簿，纳赞槐衡，能和鼎味。俄而转尚书都官郎中。时高祖孝文皇帝将改制创物，大崇革正，复以君兼吏部郎。诠叙彝伦，九流斯顺。太和廿二年春，宣武皇帝副光崇正，妙简宫卫，复以君为东朝步兵。景明初，丁母忧还家，居丧致毁，几于灭性。服终，朝廷以君胆思凝果，善谋好成，临事发奇，前略无滞，征君拜为左中郎将、大都督中山王长史。出围伪义阳，城拔颽旋。君有协规之效，功绩隆盛，授龙骧将军、太府少卿、临青男。忠勤之称，实显于兹。永平初，圣主以辽海戎夷，宣化伫贤；肃慎契丹，必也绥接。于是除君持节、营州刺史，将军如故。君轩镳始迈，声猷以先，麾盖践壃，而温膏均被。于是殊俗知仁，荒嵎识泽。惠液达于逋遐，德润潭于边服。延昌四年，以君清政怀柔，宣风自远，征君为征虏将军、太中大夫。方授美任，而君婴疾连岁，遂以熙平二年十一月廿一日卒于位。缙绅痛惜，姻旧咸酸。依君绩行，蒙赠左将军、济州刺史，加谥曰贞。□也。孤息伯茂，衔哀在疚，摧号冈诉。泣庭训之崩沉，泪松杨之以树。洞抽绝其何言，刊遗德于泉路。其辞曰：

绵哉遐冑，帝炎之绪。爰历姬初，祖唯尚父。曰周曰汉，荣光继武。迈德传辉，儒贤代举。於穆睿考，诞质含灵。秉仁岳峻，动智渊明。育善以和，奖干以贞。响发邦丘，翼起槐庭。庆钟盛世，皇泽远融。入参彝叙，出佐边戎。谋成辕幕，绩著军功。伪城颷偃，蠢境怀风。王恩流赏，作捍东荒。惠沾海服，爱洽辽乡。天情方渥，简爵唯良。如何仓昊，国宝沦光。白杨晦以笼云，松区杳而烟邃。藐孤叫其崩惌，亲宾飒而垂泪。仰层穹而摧号，痛尊灵之长秘。志遗德兮何陈，篆幽石兮深□。呜呼哀哉！'''

if full_text.count('□') != 3 or '?' in full_text or '？' in full_text:
    raise SystemExit('full text placeholder check failed')

cases = [
    {
        'id': '01',
        'n': '残损碑文恢复',
        't': '克佐□殷',
        'o': '其在隆周，远祖尚父，实作太师，秉旄鹰扬，克佐□殷。',
        'c': '其在隆周，远祖尚父，实作太师，秉旄鹰扬，克佐〔揃〕殷。',
        'page': 11,
        'category': '残损碑文恢复',
        'title': '克佐□殷',
        'original': '其在隆周，远祖尚父，实作太师，秉旄鹰扬，克佐□殷。',
        'corrected': '其在隆周，远祖尚父，实作太师，秉旄鹰扬，克佐〔揃〕殷。',
        'mode': 'documentary',
        'confidence': '高',
        'analysis': [
            '多种《崔敬邕墓志》录文在同一位置作“克佐揃殷”，与原拓中从“手”从“前”的字形相合。',
            '“揃”有剪除、攻灭之义，承接太公辅周克殷的典故，语义完整。',
            '一个候选字正好对应一个缺字槽位，因此校读为“揃”。'
        ],
        'slots': [{'slot': 1, 'source': '□', 'candidate': '揃', 'status': 'restored'}],
        'locations': [{
            'page': 11,
            'glyph_id': '044_崔敬邕墓誌_p0011_c028',
            'bbox': {'x': 733, 'y': 1119, 'w': 161, 'h': 143},
            'crop': {'x': 413, 'y': 699, 'w': 801, 'h': 983},
            'canvas_width': 1459,
            'canvas_height': 2221,
            'source': 'model_border_refined',
            'target': '揃'
        }]
    },
    {
        'id': '02',
        'n': '残损碑文恢复',
        't': '加谥曰贞。□也',
        'o': '依君绩行，蒙赠左将军、济州刺史，加谥曰贞。□也。',
        'c': '依君绩行，蒙赠左将军、济州刺史，加谥曰贞。〔礼〕也。',
        'page': 24,
        'category': '残损碑文恢复',
        'title': '加谥曰贞。□也',
        'original': '依君绩行，蒙赠左将军、济州刺史，加谥曰贞。□也。',
        'corrected': '依君绩行，蒙赠左将军、济州刺史，加谥曰贞。〔礼〕也。',
        'mode': 'documentary',
        'confidence': '高',
        'analysis': [
            '同一位置的通行录文作“加谥曰贞，礼也”，原拓字形亦可辨为“礼”。',
            '“礼也”用于说明追赠加谥合乎礼制，是墓志中常见的判断句式。',
            '一个候选字正好对应一个缺字槽位，因此校读为“礼”。'
        ],
        'slots': [{'slot': 1, 'source': '□', 'candidate': '礼', 'status': 'restored'}],
        'locations': [{
            'page': 24,
            'glyph_id': '044_崔敬邕墓誌_p0024_c024',
            'bbox': {'x': 277, 'y': 1628, 'w': 148, 'h': 180},
            'crop': {'x': 0, 'y': 1208, 'w': 745, 'h': 1013},
            'canvas_width': 1459,
            'canvas_height': 2221,
            'source': 'model_border_refined',
            'target': '礼'
        }]
    },
    {
        'id': '03',
        'n': '残损碑文恢复',
        't': '篆幽石兮深□',
        'o': '志遗德兮何陈，篆幽石兮深□。',
        'c': '志遗德兮何陈，篆幽石兮深〔隧〕。',
        'page': 31,
        'category': '残损碑文恢复',
        'title': '篆幽石兮深□',
        'original': '志遗德兮何陈，篆幽石兮深□。',
        'corrected': '志遗德兮何陈，篆幽石兮深〔隧〕。',
        'mode': 'documentary',
        'confidence': '高',
        'analysis': [
            '同一位置的通行录文作“篆幽石兮深隧”，原拓字形与“隧”相合。',
            '“深隧”指幽深墓道，与前句“幽石”共同构成墓葬语境。',
            '一个候选字正好对应一个缺字槽位，因此校读为“隧”。'
        ],
        'slots': [{'slot': 1, 'source': '□', 'candidate': '隧', 'status': 'restored'}],
        'locations': [{
            'page': 31,
            'glyph_id': '044_崔敬邕墓誌_p0031_c019',
            'bbox': {'x': 836, 'y': 982, 'w': 194, 'h': 141},
            'crop': {'x': 516, 'y': 562, 'w': 834, 'h': 981},
            'canvas_width': 1459,
            'canvas_height': 2221,
            'source': 'model_border_refined',
            'target': '隧'
        }]
    }
]

if sum(len(c['slots']) for c in cases) != 3:
    raise SystemExit('case slot check failed')

report = {
    'work_id': '044',
    'title': TITLE,
    'version': VERSION,
    'image_page_count': 52,
    'image_root': 'assets/page_images/044_崔敬邕墓誌/images/',
    'model_source': 'data/model_boxes/glyph_model_border_041_045.json',
    'model_box_rows': 734,
    'model_page_range': [8, 31],
    'page_box_files_created': 24,
    'case_count': 3,
    'located_case_count': 3,
    'unlocated_case_count': 0,
    'confirmed_case_pages': {'01': 11, '02': 24, '03': 31},
    'coordinate_policy': '栏目一第8—31页接入仓库既有模型字框；栏目三三例使用同一批真实字框定位。',
    'special_pages': '第1—7页及第32—52页为封面、题签、题跋、装帧或版本说明等页面，只保留原图；第8—31页为墓志正文拓片页。'
}

work_js = r'''/* 044《崔敬邕墓誌》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="044"||window.__WORK_044_CUIJINGYONG__)return;
  window.__WORK_044_CUIJINGYONG__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="崔敬邕墓誌";
  const VERSION="20260726_cuijingyong_044_v1";
  const TEXT_URL=`data/work044_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work044_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理《崔敬邕墓誌》三处缺字校读。三处均已对应至原拓页码与问题字位置。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    return {...row,id,original,corrected,category:String(row?.category||"残损碑文恢复"),n:"残损碑文恢复",t:String(row?.title||`第${id}处`),o:original,c:corrected,title:String(row?.title||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文恢复"}));
    window.dispatchEvent(new CustomEvent("work-044-cases-ready",{detail:{count:items.length}}));
  }
  function paragraphHTML(text){
    const normalized=String(text||"").replace(/\r\n?/g,"\n").trim();
    return normalized.split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>`<p>${esc(part)}</p>`).join("");
  }
  function boldProblemSentences(root,items){
    const patterns=items.map(item=>item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const value=paragraph.textContent||"";let best=null;
      patterns.some(pattern=>{const at=value.indexOf(pattern);if(at>=0){best={start:at,end:at+pattern.length};return true;}return false;});
      if(!best)return;
      const fragment=document.createDocumentFragment();
      if(best.start)fragment.appendChild(document.createTextNode(value.slice(0,best.start)));
      const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=value.slice(best.start,best.end);fragment.appendChild(strong);
      if(best.end<value.length)fragment.appendChild(document.createTextNode(value.slice(best.end)));
      paragraph.replaceChildren(fragment);
    });
  }
  function markedHTML(value){let html="",offset=0,match;const text=String(value||""),pattern=/〔([^〕]*)〕/g;while((match=pattern.exec(text))){html+=esc(text.slice(offset,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;offset=match.index+match[0].length;}return html+esc(text.slice(offset));}
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");
  function cnPageLabel(n){const d=["","一","二","三","四","五","六","七","八","九"];if(n<=10)return n===10?"十":d[n];if(n<20)return"十"+d[n%10];if(n<100)return d[Math.floor(n/10)]+"十"+(n%10?d[n%10]:"");return String(n);}

  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-044] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(item){
    const page=Number(item?.page||0);
    const loc=Array.isArray(item?.locations)?item.locations[0]:null;
    const b=loc?.bbox,crop=loc?.crop;
    if(!page||!b||!crop)return '<div class="damage-location-missing work044-location-missing"><p>本例暂未获得可靠页码与字框。</p></div>';
    const image=`assets/page_images/044_崔敬邕墓誌/images/${String(page).padStart(4,"0")}_${cnPageLabel(page)}.jpg`;
    const cw=Number(loc.canvas_width||1459),ch=Number(loc.canvas_height||2221);
    return `<div class="damage-viewport" data-image="${esc(image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(image)}" x="0" y="0" width="${cw}" height="${ch}" preserveAspectRatio="none"></image><rect class="damage-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${page}页，对应问题字局部</p>`;
  }
  function analysisHTML(item){
    const rows=item.analysis.length?item.analysis:["现有材料不足以形成具体候选。"]; 
    return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work044-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work044-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");setMenuTitle(4,"四、众智释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work044Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    section.querySelector('[data-action="prev"]')?.addEventListener("click",()=>{if(current>0){current-=1;renderDamage();}});
    section.querySelector('[data-action="next"]')?.addEventListener("click",()=>{if(current<cases.length-1){current+=1;renderDamage();}});
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work044-cuijingyong-style"))return;const style=document.createElement("style");style.id="work044-cuijingyong-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work044-location-missing{min-height:430px;margin:0 16px 16px}.work044-analysis-list{margin:10px 0 0;padding-left:1.35em}.work044-analysis-list li{margin:.45em 0;line-height:1.8}.work044-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="北魏熙平二年墓志，记述崔敬邕的世系、仕宦、营州政绩与身后追赠。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本信息"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("端方旧藏浓淡墨拓拼合本，数字图像52页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("人物生平"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("崔敬邕历任司徒府主簿、营州刺史等职。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">版本</div><div class="modal-desc">端方旧藏浓淡墨拓拼合初拓本。</div><div class="modal-term">装潢</div><div class="modal-desc">裱本二十三开，网站收录数字图像五十二页。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>崔敬邕其人</h3><p>崔敬邕出自博陵安平崔氏，北魏时历任司徒府主簿、尚书都官郎中、营州刺史等职。墓志重点记述其参与义阳战事、治理营州及怀柔边族的经历。</p><p>他卒于熙平二年，身后追赠左将军、济州刺史，谥号为“贞”。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_044_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_044_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-044-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_044_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(cases.length!==3)throw new Error("044案例数据数量异常");
      publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_044_CONTENT_READY__=true;window.__WORK_044_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-044-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-044]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">044碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">044案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_044_CROWDSOURCE_READY__=true;window.__WORK_044_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
'''

# Write dedicated data and module.
Path('data/work044_full_text.txt').write_text(full_text + '\n', encoding='utf-8')
Path('data/work044_damage_cases.json').write_text(json.dumps(cases, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
Path('data/work044_coordinate_report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
Path('js/work-044.js').write_text(work_js, encoding='utf-8')

# Generate per-page real model boxes for column one.
model_path = Path('data/model_boxes/glyph_model_border_041_045.json')
model_rows = json.loads(model_path.read_text(encoding='utf-8'))
work_rows = [r for r in model_rows if str(r.get('work_id', '')).zfill(3) == '044']
if len(work_rows) != 734:
    raise SystemExit(f'expected 734 model rows for 044, got {len(work_rows)}')
by_page = {}
for row in work_rows:
    page = int(row['canvas_index'])
    by_page.setdefault(page, []).append(row)
if sorted(by_page) != list(range(8, 32)):
    raise SystemExit(f'unexpected 044 model page range: {sorted(by_page)}')
box_root = Path('data/glyph_boxes/iiif/044')
box_root.mkdir(parents=True, exist_ok=True)
for page, rows in sorted(by_page.items()):
    rows.sort(key=lambda r: int(r.get('order_in_page', 0)))
    (box_root / f'page_{page:04d}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Update page index so the reader exposes the real boxes and text grid.
page_index_path = Path('data/page_images_index.json')
page_index = json.loads(page_index_path.read_text(encoding='utf-8'))
work = page_index['works']['044']
if len(work['pages']) != 52:
    raise SystemExit('044 page count mismatch')
for page_obj in work['pages']:
    page = int(page_obj['page'])
    rows = by_page.get(page, [])
    if rows:
        text = ''.join(str(r.get('char', '')) for r in rows)
        page_obj['text_clean'] = text
        page_obj['text_raw'] = text
        page_obj['char_count'] = len(rows)
        page_obj['has_char_boxes'] = True
    else:
        page_obj['text_clean'] = ''
        page_obj['text_raw'] = ''
        page_obj['char_count'] = 0
        page_obj['has_char_boxes'] = False
page_index_path.write_text(json.dumps(page_index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Correct catalog metadata.
catalog_path = Path('data/beitie_catalog.json')
catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
record = next(item for item in catalog if str(item.get('id')).zfill(3) == '044')
record.update({
    'title': TITLE,
    'dynasty': '北魏熙平二年十一月（517）',
    'script': '楷书',
    'creator': '撰书者不详',
    'status': '专属内容已完成',
    'subtitle': '52页图像已接入；释文、3例残损校读、逐字坐标与众智释读已完成。',
    'year': '517',
    'canvas_count': 52,
    'has_volumes': False
})
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Correct header metadata while retaining the reliable version history.
header_path = Path('data/beitie_header_info.json')
header = json.loads(header_path.read_text(encoding='utf-8'))
header['044'] = {
    'source_file': '崔敬邕墓誌.txt',
    'title': TITLE,
    'basic': {
        '首题': TITLE,
        '其他题名': '魏故持节、龙骧将军、督营州诸军事、营州刺史、征虏将军、太中大夫、临青男、崔公之墓志铭',
        '责任者': '撰书者不详',
        '书体': '楷书（正书）',
        '版本': '端方旧藏浓淡墨拓拼合初拓本',
        '版本说明': '前半本为江标旧藏淡墨拓，残本存八开；后半本为陈奕禧旧藏浓墨拓，现存四开。光绪三十四年（1908），两半本经端方合装。',
        '数量': '裱本23开；数字化图像52页',
        '尺寸': '册高29.5厘米，宽14.3厘米；碑文十二开，帖芯高17.6厘米，宽9厘米',
        '年代': '北魏熙平二年十一月（517）',
        '刻立年代': '北魏熙平二年十一月（517）',
        '地点': '河北安平（清康熙十八年出土）',
        '出土地点': '清康熙十八年（1679）河北安平出土',
        '馆藏': '上海图书馆',
        '馆藏号': '19A358',
        '来源': '《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第一辑，上海图书馆，上海古籍出版社，2006年',
        '装潢说明': '此册与《常醜奴墓誌》合装一红木书匣，木匣面板有端方题刻：“魏崔敬邕、隋常醜奴两志，光绪壬寅合装。”',
        '铭文行款': '原石二十五行，行二十九字'
    }
}
header_path.write_text(json.dumps(header, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Update shared router. Also point 043 to its current clean SVG version so the removed old caption cannot return.
router_path = Path('js/damage_ai_reading.js')
router = router_path.read_text(encoding='utf-8')
router = router.replace(
    'if(window.__DAMAGE_AI_READING_ROUTER_V83__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V83__=true;',
    'if(window.__DAMAGE_AI_READING_ROUTER_V84__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V84__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V83__=true;'
)
router = router.replace(
    '"043":[{src:"js/work-043.js?v=20260726_mengjingxun_043_v3_manual_red_box",key:"w043",ready:()=>Boolean(window.__WORK_043_STABLE_READY__&&window.__WORK_043_CROWDSOURCE_READY__)}]',
    '"043":[{src:"js/work-043.js?v=20260726_mengjingxun_043_v4_svg_crop",key:"w043",ready:()=>Boolean(window.__WORK_043_STABLE_READY__&&window.__WORK_043_CROWDSOURCE_READY__)}],\n    "044":[{src:"js/work-044.js?v=20260726_cuijingyong_044_v1",key:"w044",ready:()=>Boolean(window.__WORK_044_STABLE_READY__&&window.__WORK_044_CROWDSOURCE_READY__)}]'
)
router = router.replace('"036","043"].includes(id)', '"036","043","044"].includes(id)')
router = router.replace('"030","033","043"].includes(id)', '"030","033","043","044"].includes(id)')
if 'js/work-044.js?v=20260726_cuijingyong_044_v1' not in router:
    raise SystemExit('044 router insertion failed')
router_path.write_text(router, encoding='utf-8')

# Update stable detail entry and shared cache version.
detail_patch_path = Path('js/detail_info_patch.js')
detail_patch = detail_patch_path.read_text(encoding='utf-8')
detail_patch = detail_patch.replace(
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V43__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V43__=true;',
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V44__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V44__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V43__=true;'
)
detail_patch = detail_patch.replace('20260726_mengjingxun_043_v3_manual_red_box', VERSION)
detail_patch = detail_patch.replace('"036","043"]', '"036","043","044"]')
detail_patch = detail_patch.replace('"043":"司马昞妻孟敬训墓志"', '"043":"司马昞妻孟敬训墓志","044":"崔敬邕墓誌"')
if '"044"' not in detail_patch or VERSION not in detail_patch:
    raise SystemExit('detail patch update failed')
detail_patch_path.write_text(detail_patch, encoding='utf-8')

# Force browsers to fetch the new shared entry/router.
detail_html_path = Path('detail.html')
detail_html = detail_html_path.read_text(encoding='utf-8').replace('20260726_mengjingxun_043_v3_manual_red_box', VERSION)
if f'js/detail_info_patch.js?v={VERSION}' not in detail_html or f'js/damage_ai_reading.js?v={VERSION}' not in detail_html:
    raise SystemExit('detail html cache update failed')
detail_html_path.write_text(detail_html, encoding='utf-8')

# Final structural checks.
assert '恢复依据' not in work_js
assert '该框经逐页人工核验校准' not in work_js
assert '不是模型自动' not in work_js
assert work_js.count('damage-caption') >= 1
assert len(json.loads(Path('data/work044_damage_cases.json').read_text(encoding='utf-8'))) == 3
assert sum(1 for p in box_root.glob('page_*.json')) == 24
assert sum(1 for p in work['pages'] if p['has_char_boxes']) == 24

# Remove temporary audit/finalization files before the final commit.
for path in [
    Path('.github/workflows/work044_audit.yml'),
    Path('.github/workflows/work044_finalize.yml'),
    Path('tools/work044_finalize_temp.py'),
    Path('_tmp_work044_audit_trigger.txt'),
]:
    if path.exists():
        path.unlink()
