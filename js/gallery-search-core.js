(function(){
  "use strict";

  let metadataMap = new Map();
  let currentQuery = "";
  let currentSort = "default";
  const expandedRows = new Set();
  const activeFilters = {
    type:"全部",
    dynasty:"全部",
    script:"全部",
    author:"全部",
    writer:"全部",
    copy_era:"全部",
    theme:"全部"
  };

  const THEME_GROUPS = {
    "思想信仰":[
      "佛教","道教","儒家","禅宗","华严宗","中岳信仰","许真君信仰",
      "道教意趣","传法世系","译经","讲学","发愿文","茅山","仙坛"
    ],
    "人物传记":[
      "北朝人物","北魏家族","高道传记","高僧传记","禅师传记","官员纪事",
      "官员生平","女性生平","宋代人物","元代人物","妇德","唐太宗"
    ],
    "政治治理":[
      "北魏政治","边疆治理","曹魏建国","禅让","德政颂扬","地方治理",
      "廉政","唐代政治","政治制度"
    ],
    "礼制祭祀":[
      "祭祀","孔庙","孔庙祭祀","孔庙礼制","尊孔兴学","官场礼仪",
      "皇家祈福","祥瑞","孝道","捐资题名"
    ],
    "墓葬纪念":[
      "墓碑","墓志","合葬","昭陵陪葬","功德颂扬","居士纪念",
      "神道碑","葬鹤"
    ],
    "寺观营建":[
      "寺院","寺院沿革","寺院营建","舍利塔","塔铭","宫苑","井铭"
    ],
    "书法文献":[
      "北魏碑刻","汉代碑刻","隋代碑刻","法帖","集帖","集字书法",
      "晋唐书法","唐代书法","宋代书法","赵孟頫书法","米芾书法",
      "颜体楷书","摩崖书法","书法","书法鉴藏","书札","诗歌","诗文",
      "小楷","行书","篆书","魏碑","奏铭","皇家序文","刻石"
    ],
    "历史纪事":[
      "历史纪事","神话历史"
    ],
    "山川游历":[
      "山川景观","山川游记","山林隐逸","山水游历"
    ],
    "画像造像":[
      "汉画像石","造像","题榜"
    ]
  };

  const FILTER_CONFIG = [
    {key:"type",label:"碑帖类型",values:["碑","刻石","墓志","塔铭","井铭","法帖","画像石题字"]},
    {key:"dynasty",label:"刻立朝代",values:["东汉","三国魏","南朝梁","北魏","东魏","隋","唐","南唐","北宋","元","东晋"]},
    {key:"script",label:"书体",values:["楷书","隶书","行书","篆书","小楷"]},
    {key:"author",label:"撰文者",field:"authors",person:true,collapsible:true},
    {key:"writer",label:"书写者",field:"writers",person:true,collapsible:true},
    {key:"copy_era",label:"拓制时代",values:["北宋","南宋","宋代","元明间","明初","明代","明末清初","清初","清代","旧拓待核"]},
    {key:"theme",label:"内容主题",values:Object.keys(THEME_GROUPS)}
  ];

  function asArray(value){
    if(Array.isArray(value)) return value.filter(Boolean);
    if(value === undefined || value === null || value === "") return [];
    return [value];
  }

  function normalizeText(value){
    return String(value || "")
      .normalize("NFKC")
      .replace(/[誌志]/g,"志")
      .replace(/[堅坚]/g,"坚")
      .replace(/[陰隂]/g,"阴")
      .replace(/[禮礼]/g,"礼")
      .replace(/[龕龛]/g,"龛")
      .replace(/[《》〈〉「」『』【】\[\]（）()\s·•,，。；;：:\-—_]/g,"")
      .toLowerCase();
  }

  function metaFor(item){
    return metadataMap.get(padId(item.id)) || null;
  }

  function themeGroupsFor(meta){
    if(!meta) return [];
    const details = new Set(asArray(meta.themes));
    return Object.entries(THEME_GROUPS)
      .filter(([,members])=>members.some(member=>details.has(member)))
      .map(([group])=>group);
  }

  function dynamicValues(config){
    const values = [];
    metadataMap.forEach(meta=>{
      if(config.person && meta.person_search_excluded) return;
      asArray(meta[config.field]).forEach(value=>{
        if(value && !values.includes(value)) values.push(value);
      });
    });
    return values.sort((a,b)=>String(a).localeCompare(String(b),"zh-CN"));
  }

  function valuesFor(config){
    return config.values || dynamicValues(config);
  }

  function renderFilters(){
    const host = document.getElementById("filterRows");
    if(!host) return;

    host.innerHTML = FILTER_CONFIG.map(config=>{
      const values = valuesFor(config);
      const expanded = expandedRows.has(config.key);
      const chips = ["全部",...values].map((value,index)=>{
        const optional = config.collapsible && index > 10 ? " optional" : "";
        const active = activeFilters[config.key] === value ? " active" : "";
        return `<button class="chip${optional}${active}" type="button" data-filter-key="${config.key}" data-filter-value="${value}">${value}</button>`;
      }).join("");
      const more = config.collapsible && values.length > 10
        ? `<button class="chip more-toggle" type="button" data-more-row="${config.key}" aria-expanded="${expanded}">${expanded ? "收起" : "更多"}</button>`
        : "";
      return `<div class="filter-row${expanded ? "" : " is-collapsed"}" data-filter-row="${config.key}">
        <b>${config.label}</b><div class="chip-list">${chips}${more}</div>
      </div>`;
    }).join("");

    host.querySelectorAll("[data-filter-key]").forEach(button=>{
      button.addEventListener("click",()=>{
        activeFilters[button.dataset.filterKey] = button.dataset.filterValue;
        renderFilters();
        render();
      });
    });

    host.querySelectorAll("[data-more-row]").forEach(button=>{
      button.addEventListener("click",()=>{
        const key = button.dataset.moreRow;
        if(expandedRows.has(key)) expandedRows.delete(key);
        else expandedRows.add(key);
        renderFilters();
      });
    });
  }

  function searchableText(item,meta){
    const parts = [item.id,item.title,item.shelf_mark,...asArray(item.tags)];
    if(meta){
      parts.push(
        meta.title,
        ...asArray(meta.aliases),
        ...asArray(meta.type),
        ...asArray(meta.dynasty),
        meta.reign,
        meta.year,
        ...asArray(meta.place),
        ...asArray(meta.script),
        ...asArray(meta.copy_era),
        ...asArray(meta.version_type),
        ...asArray(meta.themes),
        ...themeGroupsFor(meta),
        ...asArray(meta.keywords)
      );
      if(!meta.person_search_excluded){
        parts.push(...asArray(meta.authors),...asArray(meta.writers));
      }
    }else{
      parts.push(item.creator,item.script,item.dynasty,item.year);
    }
    return normalizeText(parts.join(" "));
  }

  function matchesFilter(meta,key,value){
    if(value === "全部") return true;
    if(!meta) return false;
    if((key === "author" || key === "writer") && meta.person_search_excluded) return false;
    if(key === "theme") return themeGroupsFor(meta).includes(value);

    const field = {
      type:"type",
      dynasty:"dynasty",
      script:"script",
      author:"authors",
      writer:"writers",
      copy_era:"copy_era"
    }[key];

    return asArray(meta[field]).includes(value);
  }

  function sortedItems(items){
    const result = [...items];
    if(currentSort === "year-asc" || currentSort === "year-desc"){
      result.sort((a,b)=>{
        const ma = metaFor(a);
        const mb = metaFor(b);
        const ya = parseInt(String(ma && ma.year || "").match(/\d{3,4}/)?.[0] || "999999",10);
        const yb = parseInt(String(mb && mb.year || "").match(/\d{3,4}/)?.[0] || "999999",10);
        return currentSort === "year-asc" ? ya-yb : yb-ya;
      });
    }
    return result;
  }

  render = function(q){
    if(typeof q === "string") currentQuery = q.trim();
    const query = normalizeText(currentQuery);

    const filtered = catalog.filter(item=>{
      const meta = metaFor(item);
      if(query && !searchableText(item,meta).includes(query)) return false;
      return Object.entries(activeFilters).every(([key,value])=>matchesFilter(meta,key,value));
    });

    const sorted = sortedItems(filtered);
    const grid = document.getElementById("galleryGrid");
    if(grid){
      grid.innerHTML = sorted.length
        ? sorted.map(cardHTML).join("")
        : `<div class="empty-results">没有找到符合条件的碑帖，请清除部分筛选条件后重试。</div>`;
    }

    const count = document.getElementById("countText");
    if(count) count.textContent = sorted.length;
  };

  function clearAll(){
    Object.keys(activeFilters).forEach(key=>activeFilters[key] = "全部");
    currentQuery = "";
    currentSort = "default";
    expandedRows.clear();

    const input = document.getElementById("gallerySearch");
    if(input) input.value = "";

    document.querySelectorAll("[data-sort-value]").forEach(button=>{
      button.classList.toggle("active",button.dataset.sortValue === "default");
    });

    renderFilters();
    render();
  }

  function bindControls(){
    const input = document.getElementById("gallerySearch");
    const searchButton = document.getElementById("gallerySearchButton");
    const clearButton = document.getElementById("clearFilters");
    const applySearch = ()=>{
      currentQuery = input ? input.value.trim() : "";
      render();
    };

    if(searchButton) searchButton.addEventListener("click",applySearch);
    if(clearButton) clearButton.addEventListener("click",clearAll);
    if(input) input.addEventListener("keydown",event=>{
      if(event.key === "Enter") applySearch();
    });

    document.querySelectorAll("[data-sort-value]").forEach(button=>{
      button.addEventListener("click",()=>{
        currentSort = button.dataset.sortValue;
        document.querySelectorAll("[data-sort-value]").forEach(other=>{
          other.classList.toggle("active",other === button);
        });
        render();
      });
    });
  }

  function init(){
    bindControls();
    loadJSON("data/beitie_search_metadata.json").then(data=>{
      metadataMap = new Map((Array.isArray(data) ? data : []).map(item=>[padId(item.id),item]));
      renderFilters();
      render();
    }).catch(err=>{
      const note = document.querySelector(".filter-note");
      if(note) note.textContent = "高级检索元数据读取失败，当前仍可使用题名搜索：" + err.message;
      renderFilters();
      render();
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();