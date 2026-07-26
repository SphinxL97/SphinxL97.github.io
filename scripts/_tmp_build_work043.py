from pathlib import Path
import json

ROOT = Path('.')
VERSION = '20260726_mengjingxun_043_v1'
TITLE = '司马昞妻孟敬训墓志'

full_text = '''魏代扬州长史、南梁郡太守、宜阳子司马景和妻墓志铭。

夫人姓孟，字敬训，清河人也。盖中散大夫之幼女，陈郡府君之季妹。夫人资含章之淑气，廪怀睿之奇风。芬芳特出，英华秀生。婉问河洲，鼓钟千里。年十有七而作嫔于司马氏。自笄发从人，捡无违度。四德孔修，妇宜纯备。奉舅姑以恭孝兴名，接娣姒以谦慈作称。恒宽心静质，举成物轨；谨言慎行，动为人范。斯所谓三宗厉矩，九族承规者矣。又夫人性寡妒□，多于容纳。敦桃夭之宜上，笃小星之逯下。故能庆显螽斯，五男三女。出入闺闱，讽诵崇礼。义方之诲既形，幽闲之教亦著。然尽力事上，夫人之勤；夫妇有别，夫人之识；舍恶从善，夫人之志；内宗加密，夫人之恤；姻于外亲，夫人之仁。夫人有五器，而加之以躬捡节用。岂悟天道无知，与善徒言。享年不永，凶图横集。春秋卌有二，以延昌二年夏六月甲申朔廿日癸卯，遘疾奄忽，薨于寿春。呜呼哀哉！粤三年正月庚戌朔十二日辛酉归葬于乡坟，河内温县温城之西。寔以营原兴垄，竁野成丘，故式述清高，而为颂云：

穆穆夫人，乘和诞生。兰藂蕙糅，玉润金声。令问在室，徽音事庭。方孚洪烈，范古流名。如何不淑，早世伹倾。思闻后叶，刊石题诚。
'''
(ROOT / 'data/work043_full_text.txt').write_text(full_text, encoding='utf-8')

cases = [{
  'id': '01',
  'n': '残损碑文修复',
  't': '夫人性寡妒□，多于容纳',
  'o': '又夫人性寡妒□，多于容纳。',
  'c': '又夫人性寡妒〔𡜱〕，多于容纳。',
  'page': None,
  'category': '残损碑文修复',
  'title': '夫人性寡妒□，多于容纳',
  'original': '又夫人性寡妒□，多于容纳。',
  'corrected': '又夫人性寡妒〔𡜱〕，多于容纳。',
  'mode': 'documentary',
  'confidence': '高',
  'analysis': [
    '同一位置的墓志录文保存“妒”后另有一个非常用字，说明这里不是句末标点，而是一个独立缺字槽位。',
    '该字可释作从“女”从“忌”的𡜱，字义与“忌”相通，属于嫉妒、忌恨语义。',
    '“寡妒𡜱”与下文“多于容纳”构成反义对举：少有嫉妒之心，多能宽容接纳，符合墓志赞美女德的语境。',
    '一个候选字正好对应底稿中的一个缺字槽位，因此校读为“𡜱”。'
  ],
  'slots': [{'slot': 1, 'source': '□', 'candidate': '𡜱', 'status': 'restored'}],
  'locations': []
}]
(ROOT / 'data/work043_damage_cases.json').write_text(json.dumps(cases, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report = {
  'work_id': '043',
  'title': TITLE,
  'version': VERSION,
  'image_page_count': 20,
  'image_root': 'assets/page_images/043_司马昞妻孟敬训墓志/images/',
  'model_source': 'data/model_boxes/glyph_model_border_041_045.json',
  'model_box_rows': 0,
  'transcript_box_slots': 1,
  'case_count': 1,
  'located_case_count': 0,
  'unlocated_case_count': 1,
  'unlocated_case_ids': ['01'],
  'coordinate_policy': '仓库当前没有043真实模型坐标，不生成bbox，不用相邻字替代问题字。栏目三明确显示暂未可靠定位。',
  'page_files_created': 0,
  'special_pages': '20页均保留原图；因缺少逐字坐标和页级释文，本版不对题签、题跋及装帧页制作字框。'
}
(ROOT / 'data/work043_coordinate_report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

work_js = r'''/* 043《司马昞妻孟敬训墓志》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="043"||window.__WORK_043_MENGJINGXUN__)return;
  window.__WORK_043_MENGJINGXUN__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="司马昞妻孟敬训墓志";
  const VERSION="20260726_mengjingxun_043_v1";
  const TEXT_URL=`data/work043_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work043_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目整理《司马昞妻孟敬训墓志》唯一一处缺字校读。候选字由同位置录文、字形构成和上下文对举共同支持；仓库当前没有043真实模型坐标，因此图片区明确标示暂未可靠定位，不显示推测性红框。";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  let cases=[],current=0,listScrollTop=0;

  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original);
    return {...row,id,original,corrected,category:String(row?.category||"残损碑文修复"),n:"残损碑文修复",t:String(row?.title||`第${id}处`),o:original,c:corrected,title:String(row?.title||`第${id}处`),mode:String(row?.mode||"documentary"),confidence:String(row?.confidence||"中"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations:Array.isArray(row?.locations)?row.locations:[],page:Number(row?.page||0)||null};
  }
  function publishCases(items){
    window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文修复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:"残损碑文修复"}));
    window.dispatchEvent(new CustomEvent("work-043-cases-ready",{detail:{count:items.length}}));
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

  async function renderTranscript(items){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取《${TITLE}》碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{const text=await fetchText(TEXT_URL);card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div>`;boldProblemSentences(card,items);}catch(error){console.error("[work-043] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }
  function caseTabs(){return cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");}
  function locationHTML(){return '<div class="damage-location-missing work043-location-missing"><p>本例暂未获得可靠页码与真实字框，不显示推测性局部图。</p></div>';}
  function analysisHTML(item){
    const rows=item.analysis.length?item.analysis:["现有材料不足以形成具体候选。"];
    return `<div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><ol class="work043-analysis-list">${rows.map(row=>`<li>${esc(row)}</li>`).join("")}</ol><div class="work043-confidence">建议置信度：<strong>${esc(item.confidence)}</strong></div></div>`;
  }
  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");publishCases(cases);section.className="content-card damage-ai";section.dataset.work043Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" disabled>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" disabled>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${locationHTML()}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">校读后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div>${analysisHTML(item)}</div></section></div></div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;renderDamage();}));
    if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();
  }
  function ensureStyle(){
    if(document.getElementById("work043-mengjingxun-style"))return;const style=document.createElement("style");style.id="work043-mengjingxun-style";
    style.textContent=".damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.work043-location-missing{min-height:430px;margin:0 16px 16px}.work043-analysis-list{margin:10px 0 0;padding-left:1.35em}.work043-analysis-list li{margin:.45em 0;line-height:1.8}.work043-confidence{margin-top:12px;padding-top:10px;border-top:1px dashed #ddcfb4;color:#675b4e}";
    document.head.appendChild(style);
  }
  function applySupplementalInfo(){
    const alias=document.querySelector(".info-panel .alias");if(alias)alias.textContent="北魏延昌年间墓志，记述孟敬训的家世、妇德、子女及归葬情况。";
    const triggers=document.querySelectorAll(".info-trigger");
    if(triggers[0]){triggers[0].querySelector("strong")?.replaceChildren(document.createTextNode("版本信息"));triggers[0].querySelector("span:last-child")?.replaceChildren(document.createTextNode("乾隆初拓本，册页装六开半，数字图像20页。"));}
    if(triggers[1]){triggers[1].querySelector("strong")?.replaceChildren(document.createTextNode("人物关系"));triggers[1].querySelector("span:last-child")?.replaceChildren(document.createTextNode("墓主孟敬训为司马景和之妻，清河孟氏。"));}
    const history=document.querySelector("#modal-history .modal-body");if(history)history.innerHTML='<div class="modal-two-col"><div class="modal-term">版本</div><div class="modal-desc">乾隆初拓本，沈景熊旧藏、王昶跋本。</div><div class="modal-term">图像</div><div class="modal-desc">网站收录数字图像20页；当前尚未接入可靠逐字坐标。</div></div>';
    const story=document.querySelector("#modal-story .modal-body");if(story)story.innerHTML='<h3>孟敬训与司马景和</h3><p>墓志记述孟敬训出自清河孟氏，十七岁嫁入司马氏，生五男三女，并以恭孝、谦慈、谨言慎行等品德受到称颂。</p><p>她卒于北魏延昌二年，延昌三年归葬河内温县温城之西。</p>';
  }
  function ensureCrowdsource(){
    const stylePath="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);}
    if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_043_CROWDSOURCE_READY__=true;return;}
    const scriptPath="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath))){const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",()=>{window.__WORK_043_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-043-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(script);}else window.__WORK_043_CROWDSOURCE_READY__=true;
  }
  async function init(){
    ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;
    try{
      const rows=await fetchJSON(CASE_URL);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("043案例数据为空");
      publishCases(cases);if(Array.isArray(window.DAMAGE_AI_CASES)&&window.DAMAGE_AI_CASES.length)cases=window.DAMAGE_AI_CASES;
      await renderTranscript(cases);renderDamage();ensureCrowdsource();window.__WORK_043_CONTENT_READY__=true;window.__WORK_043_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-043-stable-ready",{detail:{cases:cases.length}}));
    }catch(error){console.error("[work-043]",error);const transcript=document.getElementById("calligraphy");if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">043碑文数据读取失败，请刷新页面后重试。</div>';if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">043案例数据读取失败，请刷新页面后重试。</div>';window.__WORK_043_CROWDSOURCE_READY__=true;window.__WORK_043_STABLE_READY__=true;}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
'''
(ROOT / 'js/work-043.js').write_text(work_js, encoding='utf-8')

catalog_path = ROOT / 'data/beitie_catalog.json'
catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
entry = next(item for item in catalog if str(item.get('id')) == '043')
entry.update({
  'title': TITLE,
  'dynasty': '北魏延昌三年正月十二日归葬（514）',
  'script': '楷书',
  'creator': '撰书者不详',
  'status': '专属内容已完成',
  'subtitle': '20页图像已接入；释文、1例残损校读与众智释读已完成，逐字坐标暂缺。',
  'year': '514',
  'canvas_count': 20
})
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

header_path = ROOT / 'data/beitie_header_info.json'
headers = json.loads(header_path.read_text(encoding='utf-8'))
h = headers['043']
h['title'] = TITLE
h['source_file'] = '司马昞妻孟敬训墓志.txt'
b = h.setdefault('basic', {})
b.update({
  '首题': TITLE,
  '其他题名': '司马景和妻孟氏墓志铭；孟敬训墓志',
  '责任者': '撰书者不详',
  '书体': '楷书',
  '版本': '乾隆初拓本，沈景熊旧藏、王昶跋本',
  '数量': '册页装六开半；数字化图像20页',
  '尺寸': '册高23.5厘米，宽18厘米；碑文五开，帖芯高17厘米，宽14.6厘米',
  '年代': '北魏延昌三年正月十二日（514）归葬',
  '出土地点': '清乾隆年间河南孟县葛村出土，具体年份不同资料记载有异',
  '馆藏': '上海图书馆',
  '馆藏号': '善2741',
  '来源': '《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第二辑，上海图书馆，上海古籍出版社，2012年'
})
header_path.write_text(json.dumps(headers, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

router_path = ROOT / 'js/damage_ai_reading.js'
router = router_path.read_text(encoding='utf-8')
router = router.replace('if(window.__DAMAGE_AI_READING_ROUTER_V80__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V80__=true;', 'if(window.__DAMAGE_AI_READING_ROUTER_V81__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V81__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V80__=true;', 1)
old_route = '    "036":[{src:"js/work-036-coordinate-adapter.js?v=20260726_yiheming_036_v2_caption",key:"w036c",ready:()=>Boolean(window.__WORK_036_COORDINATE_ADAPTER__)},{src:"js/work-036.js?v=20260726_yiheming_036_v2_caption",key:"w036",ready:()=>Boolean(window.__WORK_036_STABLE_READY__&&window.__WORK_036_CROWDSOURCE_READY__)}]\n'
new_route = old_route.rstrip('\n') + ',\n    "043":[{src:"js/work-043.js?v=' + VERSION + '",key:"w043",ready:()=>Boolean(window.__WORK_043_STABLE_READY__&&window.__WORK_043_CROWDSOURCE_READY__)}]\n'
if old_route not in router: raise RuntimeError('036 route anchor missing')
router = router.replace(old_route, new_route, 1)
router = router.replace('"036":"瘗鹤铭"};', '"036":"瘗鹤铭","043":"司马昞妻孟敬训墓志"};', 1)
router = router.replace('"034","035","036"].includes(id)', '"034","035","036","043"].includes(id)', 1)
router_path.write_text(router, encoding='utf-8')

info_path = ROOT / 'js/detail_info_patch.js'
info = info_path.read_text(encoding='utf-8')
info = info.replace('if(window.__DETAIL_INFO_STABLE_ENTRY_V40__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V40__=true;', 'if(window.__DETAIL_INFO_STABLE_ENTRY_V41__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V41__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V40__=true;', 1)
info = info.replace('data/beitie_header_info.json?v=20260726_yiheming_036_v1', 'data/beitie_header_info.json?v=' + VERSION, 1)
info = info.replace('const recoveryVersion="20260726_yiheming_036_v1";', 'const recoveryVersion="' + VERSION + '";', 1)
info = info.replace('"034","035","036"]);', '"034","035","036","043"]);', 1)
info = info.replace('"036":"瘗鹤铭"};', '"036":"瘗鹤铭","043":"司马昞妻孟敬训墓志"};', 1)
info_path.write_text(info, encoding='utf-8')

detail_path = ROOT / 'detail.html'
detail = detail_path.read_text(encoding='utf-8')
detail = detail.replace('js/detail_info_patch.js?v=20260726_yiheming_036_v2_caption', 'js/detail_info_patch.js?v=' + VERSION, 1)
detail = detail.replace('js/damage_ai_reading.js?v=20260726_yiheming_036_v2_caption', 'js/damage_ai_reading.js?v=' + VERSION, 1)
detail_path.write_text(detail, encoding='utf-8')

print({'version': VERSION, 'text_boxes': full_text.count('□'), 'cases': len(cases), 'locations': len(cases[0]['locations'])})
