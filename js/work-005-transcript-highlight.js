/* 005《虞恭公温彦博碑》原释文问题句加粗。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_TRANSCRIPT_HIGHLIGHT_V1__)return;
  window.__WORK_005_TRANSCRIPT_HIGHLIGHT_V1__=true;

  const phrases=[
    "唐故特進尚書右㒒射上柱□虞恭公温公碑。",
    "昔者帝媯升厯，九官奮其庸；有周誕命，六卿揚其□□，釣棇也。",
    "若夫昴宿麗天，感其靈者人□；嵩□鎮□，降其神者□楨。",
    "臨系姬文之逺胄，洙唐□之遥源。",
    "食邑河内，世功□其緒；著袒裕，魏太中大夫。",
    "言為准的，行成□綴，廊廟翹□，搢紳結□。",
    "穎川陳君，哀榮無聞扵異代，能兼□者，不亦□？",
    "江巖巗焉，猶華岳之西歭。",
    "若乃三徳六行，列聖之所□也。",
    "是以平津筮仕，由賔□而佩印，文終創業，階□牢籠多士。",
    "大業之始，以親喪去官，□慕之感，□毀之極。",
    "詔公銜命蕃境，申眀臣莭，陳之以□。",
    "属天地横□□之鼎，艾綬銀章，弓旌先扵髦俊，建社班瑞，光□屬扵□庸。",
    "豈蹉□扵吴阪；清越振響，终特逹□□□。",
    "十萬之師，方絶大漢，五飣之術，必繫單□。",
    "稅駕天府，夷體泉室；麟閣□形鳥。"
  ];

  function highlight(paragraph){
    if(!paragraph||paragraph.dataset.work005Highlight==="true")return;
    const text=paragraph.textContent||"";
    const matches=[];
    phrases.forEach(phrase=>{
      let from=0;
      while(from<text.length){
        const index=text.indexOf(phrase,from);if(index<0)break;
        matches.push({index,end:index+phrase.length});from=index+phrase.length;
      }
    });
    if(!matches.length)return;
    matches.sort((a,b)=>a.index-b.index||b.end-a.end);
    const accepted=[];let end=-1;
    matches.forEach(item=>{if(item.index>=end){accepted.push(item);end=item.end;}});
    const fragment=document.createDocumentFragment();let offset=0;
    accepted.forEach(item=>{
      if(item.index>offset)fragment.appendChild(document.createTextNode(text.slice(offset,item.index)));
      const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=text.slice(item.index,item.end);fragment.appendChild(strong);offset=item.end;
    });
    if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
    paragraph.replaceChildren(fragment);paragraph.dataset.work005Highlight="true";
  }

  function apply(){document.querySelectorAll("#calligraphy .full-transcript-body p").forEach(highlight);}
  const start=()=>{
    apply();
    const section=document.getElementById("calligraphy");
    if(section)new MutationObserver(apply).observe(section,{childList:true,subtree:true});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.addEventListener("work-005-transcript-ready",apply);
})();