/* 第二栏目问题句加粗。
 * 仅在作品001—005已完成碑帖中启用，
 * 将第三栏目已经展示的问题句在第二栏目原文中加粗。
 * 不改变原文文字、标点、段落或其他栏目功能。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  const TARGETS={
    "001":[
      "循堂室而濡涕，对几?而流恸。",
      "逮乎初卝，方蒙落发。",
      "沦羲□□，□□□光。"
    ],
    "002":[
      "自天王以下，至于初学，莫不?思，叹卬师镜。",
      "君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁□。",
      "相史卞吕松□远百。"
    ],
    "003":[
      "释迦文非说□之□，须菩提岂证果之人？",
      "护戒比丘，翻同雹草；持律□□，忽等霜莲。",
      "路款晋而适秦，途通□而指卫。",
      "□□之落，矩步非遥；平原之楼，规行讵远。",
      "太师、上柱国、大威公之世子，使持节、左武卫将军、上开府仪同三司、恒州诸军事、恒州刺史、鄂国公、金城王孝?，世业重于金张，器识逾于许郭。",
      "领袖诸□，冠冕群俊。",
      "不求床坐，来会之众何忧；□然饮食，持钵之侣奚念。",
      "齐开府长、兼行参军、九门张公礼之□。"
    ],
    "004":[
      "大唐开元十八年，岁次庚□□月壬子□十一日壬戌建。",
      "赞曰：英英披雾，其□□烁；卓立㑺寸，标举明略。",
      "军刘制器，军参军尔朱浚，录事王敬□□，李博士张长卿，博士王元礼，□市令程□□□。",
      "赞曰：□□□□□礼乐，仕门贤才，君子同□□。",
      "参军□□□，曹□军功曹员外同正□功军，仓曹员外同正李曹参军□□□，军士曹参军□□亨，参军赵挹。",
      "有力豊碑，克□□祀□□。",
      "康椘元同正成麟，尉上柱国□怀靖，卢元尉员外同正，皇甫尉员外同正，刘思义，前主簿五思□。",
      "醴陵令李仁瓒，□张□道□，主簿张思已，李灵尉张光庭□尉。",
      "衡令刘威之，刘员外□□，刘之尉，员员外尉王光大，尉周待徵。",
      "湘乡令王武信，主簿□□□□□，尉□□□□。",
      "益阳令孟□，主簿张□□。",
      "赞曰：华宗旧德，利器良播；□□政震，雷和□。",
      "大夫□城宰张守日□，安主簿盛老□，邓洪敏□思□□，梁元□□，祝仁期□，张文远、石泰、张恽□，朱封禅□□□□，桓嗣宗、杨庭训、罗元□□，邓希、王晁□，王暠□西同□，庶苑道林，景德晚□。",
      "政□癸也，岁四月十□日□□□□□。",
      "梁国虞王□□阅□□。",
      "通义程暭，明迪稽山石彦和子，惠朝请大夫□城宰张守昚。"
    ],
    "005":[
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
    ]
  };

  const phrases=TARGETS[parentId];
  if(!phrases||window.__TRANSCRIPT_PROBLEM_HIGHLIGHT__)return;
  window.__TRANSCRIPT_PROBLEM_HIGHLIGHT__=true;

  function highlightParagraph(paragraph){
    if(!paragraph||paragraph.dataset.problemHighlightReady==="true")return;
    const text=paragraph.textContent||"";
    const matches=[];
    phrases.forEach(phrase=>{
      let start=0;
      while(start<text.length){
        const index=text.indexOf(phrase,start);
        if(index<0)break;
        matches.push({index,end:index+phrase.length});
        start=index+phrase.length;
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
    paragraph.replaceChildren(fragment);paragraph.dataset.problemHighlightReady="true";
  }

  function apply(){
    const body=document.querySelector("#calligraphy .full-transcript-body");
    if(!body)return false;
    body.querySelectorAll("p").forEach(highlightParagraph);
    return true;
  }
  function start(){
    apply();
    const section=document.getElementById("calligraphy")||document.body;
    const observer=new MutationObserver(()=>apply());
    observer.observe(section,{childList:true,subtree:true});
    window.addEventListener("work-005-transcript-ready",apply);
    setTimeout(()=>observer.disconnect(),10000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();