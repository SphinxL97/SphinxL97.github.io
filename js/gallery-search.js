/* 碑帖总览：只显示已建立高级检索元数据的33件作品；006、007封面使用image-assets分支。 */
(function(){
  "use strict";

  const previousFetch=window.fetch.bind(window);
  function asArray(value){
    if(Array.isArray(value))return value.filter(Boolean);
    if(value===undefined||value===null||value==="")return [];
    return [value];
  }
  function normalizeWriterName(value){
    const original=String(value||"").trim();
    const compact=original.normalize("NFKC").replace(/\s+/g,"")
      .replaceAll("臨","临").replaceAll("傳","传")
      .replaceAll("懷","怀").replaceAll("書","书");
    if(compact==="褚遂良(临/传)")return "";
    if(compact==="怀仁集王羲之书")return "王羲之";
    return original;
  }
  function normalizeWriters(value){
    return [...new Set(asArray(value).map(normalizeWriterName).filter(Boolean))];
  }
  function requestUrl(input){
    if(typeof input==="string")return input;
    return input&&typeof input.url==="string"?input.url:"";
  }
  function metadataRequest(input){
    return requestUrl(input).split(/[?#]/,1)[0].endsWith("data/beitie_search_metadata.json");
  }
  function jsonResponse(source,data){
    const headers=new Headers(source.headers);
    headers.set("content-type","application/json; charset=utf-8");
    return new Response(JSON.stringify(data),{status:source.status,statusText:source.statusText,headers});
  }
  window.fetch=async function(input,init){
    const response=await previousFetch(input,init);
    if(!response.ok||!metadataRequest(input))return response;
    try{
      const data=await response.clone().json();
      const normalized=Array.isArray(data)
        ? data.map(item=>({...item,writers:normalizeWriters(item&&item.writers)}))
        : data;
      return jsonResponse(response,normalized);
    }catch(error){
      console.error("[gallery] 书写者名称规范化失败",error);
      return response;
    }
  };

  document.querySelectorAll('a[href="people.html"]').forEach(link=>{
    link.href="reading.html";
    link.textContent="碑帖赏读";
  });

  const VISIBLE_IDS=Object.freeze([
    "001","002","003","004","005","006","007","010","011","013",
    "014","015","016","017","018","020","022","023","024","025",
    "026","027","028","029","030","031","032","033","034","035",
    "036","043","044"
  ]);
  const visibleIdSet=new Set(VISIBLE_IDS);
  window.GALLERY_VISIBLE_IDS=VISIBLE_IDS;

  const IMAGE_BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const remotePath=path=>IMAGE_BASE+String(path||"").replace(/^\.\//,"").replace(/^\/+/ ,"").split("/").map(encodeURIComponent).join("/");
  const missingEntries=[
    {
      id:"006",title:"史晨后碑",
      cover:remotePath("assets/page_images/006_史晨后碑/images/0001_一.jpg"),
      dynasty:"汉建宁二年（169）",script:"隶书",
      creator:"汉代碑刻；蔡邕书（传）",shelf_mark:"22BT012",active:true,
      detail_url:"detail.html?id=006",status:"封面入口",
      subtitle:"图像、逐页释文、残损释读与众智校订已接入。",year:"169",
      brief_source:"《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第六辑",
      viewer_url:"http://iiif.library.sh.cn/api/viewer/22BT012",
      manifest_url:"https://iiif.library.sh.cn/p/3/26aeaedb-6c05-11ee-939e-9cb6d0bbaaae",
      canvas_count:54,has_volumes:false
    },
    {
      id:"007",title:"伊阙佛龛碑",
      cover:remotePath("assets/page_images/007_伊阙佛龛碑/images/0001_一.jpg"),
      dynasty:"唐贞观十五年（641）",script:"楷书",
      creator:"岑文本撰文，褚遂良书",shelf_mark:"22BT006",active:true,
      detail_url:"detail.html?id=007",status:"封面入口",
      subtitle:"图像、逐页释文、残损释读与众智校订已接入。",year:"641",
      brief_source:"《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第七辑",
      viewer_url:"http://iiif.library.sh.cn/api/viewer/22BT006",
      manifest_url:"https://iiif.library.sh.cn/p/3/26aeaed6-6c05-11ee-bab6-9cb6d0bbaaae",
      canvas_count:124,has_volumes:false
    },
    {
      id:"030",title:"九成宫醴泉铭",
      cover:"assets/page_images/030_九成宫醴泉铭/images/0001_一.jpg",
      dynasty:"唐贞观六年（632）",script:"楷书",
      creator:"魏徵撰文，欧阳询书",active:true,
      detail_url:"detail.html?id=030",status:"专属内容已接入",
      subtitle:"52页图像、完整释文、8例AI释读与众智校订已接入。",year:"632",
      brief_source:"上海图书馆馆藏碑帖数字图像",
      canvas_count:52,has_volumes:false
    }
  ];

  function useRemoteCover(item){
    if(!item||typeof item!=="object")return item;
    const id=String(item.id||"").padStart(3,"0");
    if(!["006","007"].includes(id))return item;
    const fallback=id==="006"?"assets/page_images/006_史晨后碑/images/0001_一.jpg":"assets/page_images/007_伊阙佛龛碑/images/0001_一.jpg";
    const current=String(item.cover||fallback);
    const cover=current.startsWith(IMAGE_BASE)?current:(/^https?:\/\//i.test(current)?current:remotePath(current));
    return {...item,cover};
  }

  document.querySelector(".filter-note")?.remove();

  const style=document.createElement("style");
  style.id="gallery-performance-style";
  style.textContent=`
    html.gallery-catalog-pending #galleryGrid,
    html.gallery-catalog-pending #countText{visibility:hidden;}
    .beitie-card{content-visibility:auto;contain-intrinsic-size:430px;}
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add("gallery-catalog-pending");

  let imageObserver=null;
  function revealImage(img){
    const source=img.dataset.src;
    if(!source)return;
    img.src=source;
    img.removeAttribute("data-src");
    imageObserver?.unobserve(img);
  }
  function observeCovers(root=document){
    const images=Array.from(root.querySelectorAll(".beitie-card img[data-src]"));
    if(!images.length)return;
    if(!("IntersectionObserver" in window)){images.forEach(revealImage);return;}
    if(!imageObserver){
      imageObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting)revealImage(entry.target);
      }),{rootMargin:"600px 0px",threshold:0.01});
    }
    images.forEach((img,index)=>{
      img.decoding="async";img.loading="lazy";img.fetchPriority=index<8?"auto":"low";
      imageObserver.observe(img);
    });
  }

  if(typeof cardHTML==="function"){
    const originalCardHTML=cardHTML;
    cardHTML=function(item){
      return originalCardHTML(item)
        .replace('<img src="','<img data-src="')
        .replace(' loading="lazy">',' loading="lazy" decoding="async">');
    };
  }

  const grid=document.getElementById("galleryGrid");
  if(grid){
    const observer=new MutationObserver(()=>observeCovers(grid));
    observer.observe(grid,{childList:true,subtree:true});
  }

  function waitForCatalog(){
    return new Promise((resolve,reject)=>{
      let tries=0;
      const timer=setInterval(()=>{
        tries+=1;
        if(typeof catalog!=="undefined"&&Array.isArray(catalog)&&catalog.length){clearInterval(timer);resolve();return;}
        if(tries>=240){clearInterval(timer);reject(new Error("碑帖目录读取超时"));}
      },25);
    });
  }

  function restoreVisibleCatalog(){
    const map=new Map(catalog.map(item=>[String(item?.id||"").padStart(3,"0"),item]));
    missingEntries.forEach(item=>{if(!map.has(item.id))map.set(item.id,item);});
    catalog=VISIBLE_IDS.map(id=>map.get(id)).filter(Boolean).map(useRemoteCover);
  }

  function loadSearchModule(){
    if(document.querySelector('script[data-gallery-search-core]'))return;
    const script=document.createElement("script");
    script.src="js/gallery-search-core.js?v=20260727_writer_normalize_v1";
    script.async=false;script.dataset.gallerySearchCore="true";
    script.addEventListener("error",()=>console.error("[gallery] 检索脚本加载失败：",script.src),{once:true});
    document.head.appendChild(script);
  }

  async function initializeGallery(){
    try{
      await waitForCatalog();
      restoreVisibleCatalog();
      if(typeof render==="function")render();
      observeCovers(document);
      document.dispatchEvent(new CustomEvent("beitie:gallery-catalog-filtered",{detail:{count:catalog.length}}));
      if(catalog.length!==33)console.warn(`[gallery] 当前目录为 ${catalog.length} 件，预期33件。`);
    }catch(error){
      console.error("[gallery] 33件目录初始化失败",error);
      const currentGrid=document.getElementById("galleryGrid");
      if(currentGrid)currentGrid.innerHTML='<div class="empty-results">碑帖目录暂时无法读取，请刷新页面后重试。</div>';
      const count=document.getElementById("countText");if(count)count.textContent="0";
    }finally{
      document.documentElement.classList.remove("gallery-catalog-pending");
      if("requestIdleCallback" in window)requestIdleCallback(loadSearchModule,{timeout:350});
      else setTimeout(loadSearchModule,0);
    }
  }

  initializeGallery();
})();