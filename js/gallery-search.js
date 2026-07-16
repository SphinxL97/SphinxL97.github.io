/*
 * 碑帖总览显示与性能补丁：
 * 1. 只保留当前已整理地点资料的33件目录记录；明确隐藏012、019两个重复版本。
 * 2. 搜索、组合筛选和排序只在这33件作品中进行。
 * 3. 去掉额外地点JSON请求，先完成目录筛选再加载高级检索。
 * 4. 封面使用视口懒加载和异步解码，减少首屏图片请求与渲染压力。
 */
(function(){
  "use strict";

  const VISIBLE_IDS=Object.freeze([
    "001","002","003","004","005","006","007","010","011","013",
    "014","015","016","017","018","020","022","023","024","025",
    "026","027","028","029","030","031","032","033","034","035",
    "036","043","044"
  ]);
  const visibleIdSet=new Set(VISIBLE_IDS);
  window.GALLERY_VISIBLE_IDS=VISIBLE_IDS;

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

  /* 高级检索元数据允许使用浏览器缓存，并同步排除不显示的作品。 */
  if(typeof loadJSON==="function"){
    loadJSON=async function(url){
      const response=await fetch(url,{cache:"default"});
      if(!response.ok) throw new Error(url+" "+response.status);
      const data=await response.json();
      if(String(url).includes("beitie_search_metadata")&&Array.isArray(data)){
        return data.filter(item=>visibleIdSet.has(padId(item?.id)));
      }
      return data;
    };
  }

  let imageObserver=null;

  function revealImage(img){
    const source=img.dataset.src;
    if(!source) return;
    img.src=source;
    img.removeAttribute("data-src");
    imageObserver?.unobserve(img);
  }

  function observeCovers(root=document){
    const images=Array.from(root.querySelectorAll(".beitie-card img[data-src]"));
    if(!images.length) return;

    if(!("IntersectionObserver" in window)){
      images.forEach(revealImage);
      return;
    }

    if(!imageObserver){
      imageObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting) revealImage(entry.target);
        });
      },{rootMargin:"600px 0px",threshold:0.01});
    }

    images.forEach((img,index)=>{
      img.decoding="async";
      img.loading="lazy";
      img.fetchPriority=index<8?"auto":"low";
      imageObserver.observe(img);
    });
  }

  /* 复用原卡片内容，只把封面请求推迟到卡片接近视口时。 */
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
    const gridObserver=new MutationObserver(()=>observeCovers(grid));
    gridObserver.observe(grid,{childList:true,subtree:true});
  }

  function waitForCatalog(){
    return new Promise((resolve,reject)=>{
      let tries=0;
      const timer=setInterval(()=>{
        tries+=1;
        if(typeof catalog!=="undefined"&&Array.isArray(catalog)&&catalog.length){
          clearInterval(timer);
          resolve();
          return;
        }
        if(tries>=240){
          clearInterval(timer);
          reject(new Error("碑帖目录读取超时"));
        }
      },25);
    });
  }

  function loadSearchModule(){
    if(document.querySelector('script[data-gallery-search-core]')) return;
    const script=document.createElement("script");
    script.src="js/gallery-search-core.js?v=20260717_gallery33_speed_v2";
    script.async=false;
    script.dataset.gallerySearchCore="true";
    script.addEventListener("error",()=>console.error("[gallery] 检索脚本加载失败：",script.src),{once:true});
    document.head.appendChild(script);
  }

  async function initializeGallery(){
    try{
      await waitForCatalog();

      catalog=catalog.filter(item=>visibleIdSet.has(padId(item?.id)));
      if(typeof render==="function") render();
      observeCovers(document);

      document.dispatchEvent(new CustomEvent("beitie:gallery-catalog-filtered",{
        detail:{count:catalog.length}
      }));

      if(catalog.length!==33){
        console.warn(`[gallery] 筛选后得到 ${catalog.length} 件，预期为33件。`);
      }
    }catch(error){
      console.error("[gallery] 目录筛选失败",error);
      catalog=[];
      const currentGrid=document.getElementById("galleryGrid");
      if(currentGrid){
        currentGrid.innerHTML='<div class="empty-results">碑帖目录暂时无法读取，请刷新页面后重试。</div>';
      }
      const count=document.getElementById("countText");
      if(count) count.textContent="0";
    }finally{
      document.documentElement.classList.remove("gallery-catalog-pending");

      /* 让首屏先完成绘制，再初始化高级搜索与组合筛选。 */
      if("requestIdleCallback" in window){
        requestIdleCallback(loadSearchModule,{timeout:350});
      }else{
        setTimeout(loadSearchModule,0);
      }
    }
  }

  initializeGallery();
})();
