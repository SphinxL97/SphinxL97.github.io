/*
 * 碑帖总览显示范围：
 * 只保留 data/beitie_locations.json 中已整理地点资料的作品。
 * 同题不同版本会分别保留；无单一坐标但已有地点说明的合册也会保留。
 */
(function(){
  "use strict";

  document.querySelector(".filter-note")?.remove();

  const pendingStyle=document.createElement("style");
  pendingStyle.id="gallery-location-filter-pending-style";
  pendingStyle.textContent=`
    html.gallery-location-filter-pending #galleryGrid{visibility:hidden;}
    html.gallery-location-filter-pending #countText{visibility:hidden;}
  `;
  document.head.appendChild(pendingStyle);
  document.documentElement.classList.add("gallery-location-filter-pending");

  function normalizeTitle(value){
    return String(value||"")
      .normalize("NFKC")
      .replace(/[《》〈〉\s]/g,"")
      .replace(/·.*$/,"")
      .replace(/誌/g,"志")
      .replace(/堅/g,"坚")
      .replace(/顏/g,"颜")
      .replace(/黃/g,"黄")
      .replace(/禪/g,"禅")
      .trim();
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
        if(tries>=160){
          clearInterval(timer);
          reject(new Error("碑帖目录读取超时"));
        }
      },25);
    });
  }

  async function restrictGallery(){
    try{
      const [locationResponse]=await Promise.all([
        fetch("data/beitie_locations.json?v=20260717_gallery_location_v1",{cache:"no-store"}),
        waitForCatalog()
      ]);
      if(!locationResponse.ok) throw new Error(`地点资料读取失败：${locationResponse.status}`);

      const locationData=await locationResponse.json();
      const locationItems=Array.isArray(locationData?.items)?locationData.items:[];
      const allowedTitles=new Set(
        locationItems.map(item=>normalizeTitle(item?.title)).filter(Boolean)
      );

      catalog=catalog.filter(item=>allowedTitles.has(normalizeTitle(item?.title)));

      if(typeof render==="function") render();
      document.dispatchEvent(new CustomEvent("beitie:gallery-catalog-filtered",{
        detail:{count:catalog.length}
      }));

      if(catalog.length!==35){
        console.warn(`[gallery] 按地点资料筛选后得到 ${catalog.length} 件，预期为 35 件。`);
      }
    }catch(error){
      console.error("[gallery] 地点资料筛选失败",error);
      catalog=[];
      const grid=document.getElementById("galleryGrid");
      if(grid){
        grid.innerHTML='<div class="empty-results">碑帖地点资料暂时无法读取，请刷新页面后重试。</div>';
      }
      const count=document.getElementById("countText");
      if(count) count.textContent="0";
    }finally{
      document.documentElement.classList.remove("gallery-location-filter-pending");
    }
  }

  const script=document.createElement("script");
  script.src="js/gallery-search-core.js?v=20260717_location_only_v1";
  script.async=false;
  script.addEventListener("error",()=>console.error("[gallery] 检索脚本加载失败：",script.src),{once:true});
  document.head.appendChild(script);

  restrictGallery();
})();
