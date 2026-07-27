(function(){
  "use strict";

  const VISIBLE_IDS = Object.freeze([
    "001","002","003","004","005","006","007","010","011","013",
    "014","015","016","017","018","020","022","023","024","025",
    "026","027","028","029","030","031","032","033","034","035",
    "036","043","044"
  ]);
  const visibleIdSet = new Set(VISIBLE_IDS);
  const IMAGE_BASE = "https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";

  const THEME_GROUPS = Object.freeze({
    "思想信仰":["佛教","道教","儒家","禅宗","华严宗","中岳信仰","许真君信仰","道教意趣","传法世系","译经","讲学","发愿文","茅山","仙坛"],
    "人物传记":["北朝人物","北魏家族","高道传记","高僧传记","禅师传记","官员纪事","官员生平","女性生平","宋代人物","元代人物","妇德","唐太宗"],
    "政治治理":["北魏政治","边疆治理","曹魏建国","禅让","德政颂扬","地方治理","廉政","唐代政治","政治制度"],
    "礼制祭祀":["祭祀","孔庙","孔庙祭祀","孔庙礼制","尊孔兴学","官场礼仪","皇家祈福","祥瑞","孝道","捐资题名"],
    "墓葬纪念":["墓碑","墓志","合葬","昭陵陪葬","功德颂扬","居士纪念","神道碑","葬鹤"],
    "寺观营建":["寺院","寺院沿革","寺院营建","舍利塔","塔铭","宫苑","井铭"],
    "书法文献":["北魏碑刻","汉代碑刻","隋代碑刻","法帖","集帖","集字书法","晋唐书法","唐代书法","宋代书法","赵孟頫书法","米芾书法","颜体楷书","摩崖书法","书法","书法鉴藏","书札","诗歌","诗文","小楷","行书","篆书","魏碑","奏铭","皇家序文","刻石"],
    "历史纪事":["历史纪事","神话历史"],
    "山川游历":["山川景观","山川游记","山林隐逸","山水游历"],
    "画像造像":["汉画像石","造像","题榜"]
  });

  const CATEGORY_CONFIG = Object.freeze([
    {key:"type",label:"碑帖类型",icon:"冊",values:["碑","刻石","墓志","塔铭","井铭","法帖","画像石题字"]},
    {key:"dynasty",label:"刻立朝代",icon:"代",values:["东汉","三国魏","南朝梁","北魏","东魏","隋","唐","南唐","北宋","元","东晋"]},
    {key:"script",label:"书体",icon:"書",values:["楷书","隶书","行书","篆书","小楷"]},
    {key:"author",label:"撰文者",icon:"撰",field:"authors",person:true},
    {key:"writer",label:"书写者",icon:"写",field:"writers",person:true},
    {key:"copy_era",label:"拓制时代",icon:"拓",values:["北宋","南宋","宋代","元明间","明初","明代","明末清初","清初","清代","旧拓待核"]},
    {key:"theme",label:"内容主题",icon:"文",values:Object.keys(THEME_GROUPS)}
  ]);

  const GROUP_DESCRIPTIONS = Object.freeze({
    "楷书":"法度严谨，结体端整，在不同历史阶段形成多样风貌。",
    "隶书":"横势开张，波磔分明，是观察汉代碑刻风格的重要入口。",
    "行书":"笔势连贯，欹正相生，兼具书写性与观赏性。",
    "篆书":"线条圆转古雅，结构整饬，保留早期文字造型特征。",
    "小楷":"体势精微，点画含蓄，适合近距离观察用笔与结体。",
    "思想信仰":"从碑文中的宗教、哲学与价值观念进入作品。",
    "人物传记":"从碑主、书家、撰者与相关人物的生平进入作品。",
    "政治治理":"观察碑文如何记录政治秩序、制度与地方治理。",
    "礼制祭祀":"从礼仪、祭祀、孔庙与社会规范理解碑刻。",
    "墓葬纪念":"关注墓志、神道碑、功德纪念与生命叙事。",
    "寺观营建":"从寺院、道观、塔铭和营建活动理解碑刻环境。",
    "书法文献":"聚焦书体、书家、法帖、诗文和书法传承。",
    "历史纪事":"通过碑刻记录的重大事件与时代记忆进入历史。",
    "山川游历":"从山川景观、游记和地理空间欣赏碑文。",
    "画像造像":"结合画像、造像与题榜理解图文关系。"
  });

  const FALLBACKS = Object.freeze({
    "006":{id:"006",title:"史晨后碑",cover:remotePath("assets/page_images/006_史晨后碑/images/0001_一.jpg"),dynasty:"东汉",script:"隶书",creator:"蔡邕书（传）",detail_url:"detail.html?id=006"},
    "007":{id:"007",title:"伊阙佛龛碑",cover:remotePath("assets/page_images/007_伊阙佛龛碑/images/0001_一.jpg"),dynasty:"唐",script:"楷书",creator:"岑文本撰文，褚遂良书",detail_url:"detail.html?id=007"},
    "030":{id:"030",title:"九成宫醴泉铭",cover:"assets/page_images/030_九成宫醴泉铭/images/0001_一.jpg",dynasty:"唐",script:"楷书",creator:"魏徵撰文，欧阳询书",detail_url:"detail.html?id=030"}
  });

  const state = {
    catalog:[],
    metadata:new Map(),
    activeCategory:"script",
    activeValue:"全部",
    query:""
  };

  const dom = {
    categoryStrip:document.getElementById("categoryStrip"),
    facetTitle:document.getElementById("facetTitle"),
    facetOptions:document.getElementById("facetOptions"),
    resultEyebrow:document.getElementById("resultEyebrow"),
    resultTitle:document.getElementById("resultTitle"),
    resultSummary:document.getElementById("resultSummary"),
    readingGroups:document.getElementById("readingGroups"),
    readingEmpty:document.getElementById("readingEmpty"),
    searchForm:document.getElementById("readingSearchForm"),
    searchInput:document.getElementById("readingSearch"),
    reset:document.getElementById("resetReading")
  };

  function remotePath(path){
    return IMAGE_BASE + String(path || "").replace(/^\.\//,"").replace(/^\/+/,"").split("/").map(encodeURIComponent).join("/");
  }

  function padId(value){return String(value || "").padStart(3,"0")}
  function asArray(value){return Array.isArray(value) ? value.filter(Boolean) : (value === undefined || value === null || value === "" ? [] : [value])}
  function escapeHtml(value=""){
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function normalizeText(value){
    return String(value || "").normalize("NFKC")
      .replace(/[誌志]/g,"志").replace(/[堅坚]/g,"坚").replace(/[陰隂]/g,"阴")
      .replace(/[禮礼]/g,"礼").replace(/[龕龛]/g,"龛")
      .replace(/[《》〈〉「」『』【】\[\]（）()\s·•,，。；;：:\-—_]/g,"").toLowerCase();
  }
  async function loadJSON(url){
    const response = await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }
  function currentConfig(){return CATEGORY_CONFIG.find(item=>item.key === state.activeCategory) || CATEGORY_CONFIG[2]}
  function metaFor(work){return state.metadata.get(padId(work.id)) || null}

  function themeGroupsFor(meta){
    const themes = new Set(asArray(meta?.themes));
    return Object.entries(THEME_GROUPS).filter(([,members])=>members.some(member=>themes.has(member))).map(([group])=>group);
  }

  function categoryValuesForMeta(meta,config){
    if(!meta) return [];
    if(config.key === "theme") return themeGroupsFor(meta);
    if(config.key === "author" || config.key === "writer"){
      if(meta.person_search_excluded) return [];
      return asArray(meta[config.field]);
    }
    const field = {type:"type",dynasty:"dynasty",script:"script",copy_era:"copy_era"}[config.key];
    return asArray(meta[field]);
  }

  function valueCounts(config,works){
    const counts = new Map();
    works.forEach(work=>categoryValuesForMeta(metaFor(work),config).forEach(value=>counts.set(value,(counts.get(value)||0)+1)));
    return counts;
  }

  function categoryValues(config,works=state.catalog){
    const counts = valueCounts(config,works);
    if(config.values) return config.values.filter(value=>counts.has(value));
    return Array.from(counts.keys()).sort((a,b)=>String(a).localeCompare(String(b),"zh-CN"));
  }

  function searchableText(work,meta){
    const parts = [work.id,work.title,work.creator,work.script,work.dynasty,work.shelf_mark,...asArray(work.tags)];
    if(meta){
      parts.push(meta.title,...asArray(meta.aliases),...asArray(meta.type),...asArray(meta.dynasty),meta.reign,meta.year,...asArray(meta.place),...asArray(meta.script),...asArray(meta.copy_era),...asArray(meta.version_type),...asArray(meta.themes),...themeGroupsFor(meta),...asArray(meta.keywords));
      if(!meta.person_search_excluded) parts.push(...asArray(meta.authors),...asArray(meta.writers));
    }
    return normalizeText(parts.join(" "));
  }

  function searchFilteredWorks(){
    const query = normalizeText(state.query);
    if(!query) return [...state.catalog];
    return state.catalog.filter(work=>searchableText(work,metaFor(work)).includes(query));
  }

  function worksForValue(works,config,value){
    if(value === "全部") return works;
    return works.filter(work=>categoryValuesForMeta(metaFor(work),config).includes(value));
  }

  function renderCategoryStrip(){
    dom.categoryStrip.innerHTML = CATEGORY_CONFIG.map(config=>`
      <button class="category-button${config.key===state.activeCategory?" active":""}" type="button" data-category="${config.key}">
        <span class="category-icon" aria-hidden="true">${config.icon}</span>
        <span>${config.label}</span>
      </button>`).join("");
    dom.categoryStrip.querySelectorAll("[data-category]").forEach(button=>button.addEventListener("click",()=>{
      state.activeCategory = button.dataset.category;
      state.activeValue = "全部";
      renderAll();
      window.scrollTo({top:document.querySelector(".reading-layout").offsetTop-150,behavior:"smooth"});
    }));
  }

  function renderFacets(){
    const config = currentConfig();
    const works = searchFilteredWorks();
    const counts = valueCounts(config,works);
    const values = categoryValues(config,works);
    dom.facetTitle.textContent = config.label;
    const options = ["全部",...values];
    dom.facetOptions.innerHTML = options.map(value=>{
      const count = value === "全部" ? works.length : (counts.get(value)||0);
      return `<button class="facet-option${value===state.activeValue?" active":""}" type="button" data-value="${escapeHtml(value)}"><span>${escapeHtml(value)}</span><span>${count}</span></button>`;
    }).join("");
    dom.facetOptions.querySelectorAll("[data-value]").forEach(button=>button.addEventListener("click",()=>{
      state.activeValue = button.dataset.value;
      renderFacets();
      renderGroups();
    }));
  }

  function cardHTML(work,config,value){
    const meta = metaFor(work);
    const id = padId(work.id);
    const cover = work.cover || "";
    const detail = work.detail_url && work.detail_url !== "#" ? work.detail_url : `detail.html?id=${id}`;
    const dynasty = asArray(meta?.dynasty)[0] || work.dynasty || "年代待核";
    const script = asArray(meta?.script)[0] || work.script || "书体待核";
    const label = value === "全部" ? config.label : value;
    return `<a class="reading-card" href="${escapeHtml(detail)}" title="进入《${escapeHtml(work.title)}》详情">
      <div class="reading-thumb">
        ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(work.title)}" loading="lazy" decoding="async">`:""}
        <span class="card-id">${id}</span>
      </div>
      <span class="card-hover-hint">当前聚焦：${escapeHtml(label)} · 点击进入赏读</span>
      <div class="reading-card-info">
        <h4>${escapeHtml(work.title || "题名待补")}</h4>
        <div class="card-meta"><span>${escapeHtml(dynasty)}</span><span class="dot">${escapeHtml(script)}</span></div>
      </div>
    </a>`;
  }

  function groupDescription(config,value){
    if(GROUP_DESCRIPTIONS[value]) return GROUP_DESCRIPTIONS[value];
    const templates = {
      type:`汇集“${value}”类碑帖，比较其形制、用途与文本特征。`,
      dynasty:`从${value}的时代背景观察碑刻内容与书风演变。`,
      author:`浏览由${value}撰写或署名撰文的碑帖。`,
      writer:`浏览由${value}书写、集书或传为其书的碑帖。`,
      copy_era:`比较${value}拓本的版本面貌与流传线索。`,
      theme:`围绕“${value}”理解碑文内容、人物与历史关系。`,
      script:`从${value}的用笔、结体与章法进入书法赏析。`
    };
    return templates[config.key] || "从当前分类进入碑帖赏读。";
  }

  function groupHTML(config,value,works,index){
    const cards = works.map(work=>cardHTML(work,config,value)).join("");
    return `<section class="reading-group" data-group-index="${index}">
      <header class="group-head">
        <div class="group-title"><span class="group-mark">${escapeHtml(config.icon)}</span><div><h3>${escapeHtml(value)}</h3><p>${escapeHtml(groupDescription(config,value))}</p></div></div>
        <span class="group-count">${works.length} 件碑帖</span>
      </header>
      <div class="rail-wrap">
        <button class="rail-arrow prev" type="button" aria-label="向左浏览" data-scroll="-1">‹</button>
        <div class="card-rail">${cards}</div>
        <button class="rail-arrow next" type="button" aria-label="向右浏览" data-scroll="1">›</button>
      </div>
    </section>`;
  }

  function renderGroups(){
    const config = currentConfig();
    const searched = searchFilteredWorks();
    const selected = worksForValue(searched,config,state.activeValue);
    const values = state.activeValue === "全部" ? categoryValues(config,searched) : [state.activeValue];
    const groups = values.map(value=>({value,works:worksForValue(searched,config,value)})).filter(group=>group.works.length);

    dom.resultEyebrow.textContent = `当前分类：${config.label}`;
    dom.resultTitle.textContent = state.activeValue === "全部" ? `按${config.label}赏读` : state.activeValue;
    const queryText = state.query ? `，关键词“${state.query}”` : "";
    dom.resultSummary.textContent = `共匹配 ${selected.length} 件碑帖${queryText}；封面尺寸与“碑帖总览”保持一致。`;
    dom.readingGroups.innerHTML = groups.map((group,index)=>groupHTML(config,group.value,group.works,index)).join("");
    dom.readingEmpty.hidden = groups.length > 0;

    dom.readingGroups.querySelectorAll(".reading-group").forEach(group=>{
      const rail = group.querySelector(".card-rail");
      group.querySelectorAll("[data-scroll]").forEach(button=>button.addEventListener("click",()=>{
        rail.scrollBy({left:Number(button.dataset.scroll)*Math.max(520,rail.clientWidth*.82),behavior:"smooth"});
      }));
    });
  }

  function renderAll(){renderCategoryStrip();renderFacets();renderGroups()}

  function mergeCatalog(catalogData){
    const map = new Map();
    asArray(catalogData).forEach(work=>{if(work?.id) map.set(padId(work.id),work)});
    Object.entries(FALLBACKS).forEach(([id,work])=>{if(!map.has(id)) map.set(id,work)});
    return VISIBLE_IDS.map(id=>map.get(id)).filter(Boolean).map(work=>{
      const id = padId(work.id);
      if(["006","007"].includes(id) && work.cover && !/^https?:/i.test(work.cover)) return {...work,cover:remotePath(work.cover)};
      return work;
    });
  }

  async function init(){
    try{
      const [catalogData,metadataData] = await Promise.all([
        loadJSON("data/beitie_catalog.json"),
        loadJSON("data/beitie_search_metadata.json")
      ]);
      state.catalog = mergeCatalog(catalogData).filter(work=>visibleIdSet.has(padId(work.id)));
      state.metadata = new Map(asArray(metadataData).filter(item=>visibleIdSet.has(padId(item.id))).map(item=>[padId(item.id),item]));
      renderAll();
    }catch(error){
      console.error("[reading] 数据读取失败",error);
      dom.resultSummary.textContent = "碑帖标签读取失败，请刷新页面后重试。";
      dom.readingGroups.innerHTML = "";
      dom.readingEmpty.hidden = false;
    }
  }

  dom.searchForm.addEventListener("submit",event=>{
    event.preventDefault();
    state.query = dom.searchInput.value.trim();
    state.activeValue = "全部";
    renderFacets();
    renderGroups();
  });
  dom.searchInput.addEventListener("input",()=>{
    if(!dom.searchInput.value.trim() && state.query){state.query="";state.activeValue="全部";renderFacets();renderGroups()}
  });
  dom.reset.addEventListener("click",()=>{
    state.query="";state.activeValue="全部";dom.searchInput.value="";renderFacets();renderGroups();
  });

  init();
})();
