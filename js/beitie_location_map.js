/* 碑帖详情页左侧“地点地图”模块。
 * 数据来自 data/beitie_locations.json。
 * 页面只展示地点性质、地点名称和坐标说明；经纬度与精度不作为文字字段显示。
 */
(function(){
  "use strict";

  if(window.__BEITIE_LOCATION_MAP_V1__) return;
  window.__BEITIE_LOCATION_MAP_V1__=true;

  const LOCATION_URL="data/beitie_locations.json?v=20260716_map_v1";
  const CATALOG_URL="data/beitie_catalog.json?v=20260716_map_v1";
  const LEAFLET_CSS="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");

  function esc(value){
    return String(value==null?"":value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  function normalizeTitle(value){
    return String(value||"")
      .replace(/[《》〈〉\s]/g,"")
      .replace(/·.*$/,"")
      .replace(/誌/g,"志")
      .replace(/堅/g,"坚")
      .replace(/顏/g,"颜")
      .replace(/黃/g,"黄")
      .replace(/禪/g,"禅")
      .replace(/邕禪/g,"邕禅")
      .trim();
  }

  function hasCoordinates(item){
    return Number.isFinite(Number(item?.latitude))&&Number.isFinite(Number(item?.longitude));
  }

  function suggestedZoom(item){
    const place=String(item?.placeName||"");
    if(/孔庙|隆兴寺|中岳庙|草堂寺|净居寺|武氏祠|碑林博物馆/.test(place)) return 14;
    if(/一带|区域|范围|墓区|遗址|景区|城区|旧县城/.test(place)) return 11;
    return 12;
  }

  function ensureStyle(){
    if(document.getElementById("beitie-location-map-style")) return;
    const style=document.createElement("style");
    style.id="beitie-location-map-style";
    style.textContent=`
      .left-rail{
        grid-column:1;
        grid-row:3;
        position:sticky;
        top:86px;
        align-self:start;
        display:flex;
        flex-direction:column;
        gap:16px;
        max-height:calc(100vh - 102px);
        overflow-y:auto;
        overflow-x:hidden;
        padding-right:2px;
        scrollbar-width:thin;
        scrollbar-color:#d8bd86 transparent;
      }
      .left-rail::-webkit-scrollbar{width:6px;}
      .left-rail::-webkit-scrollbar-thumb{background:#d8bd86;border-radius:999px;}
      .left-rail>.side{
        grid-column:auto!important;
        grid-row:auto!important;
        position:static!important;
        top:auto!important;
        width:100%;
        flex:0 0 auto;
      }
      .location-card{
        flex:0 0 auto;
        width:100%;
        overflow:hidden;
        background:rgba(255,253,248,.96);
        border:1px solid var(--line,#dfd1bd);
        border-radius:19px;
        box-shadow:0 10px 30px rgba(52,35,20,.07);
      }
      .location-card-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
        padding:15px 16px 12px;
      }
      .location-card-title{
        margin:0;
        font-size:18px;
        line-height:1.35;
        font-weight:900;
        color:#211b16;
      }
      .location-type{
        flex:0 0 auto;
        max-width:112px;
        padding:3px 8px;
        border-radius:999px;
        background:#9f3025;
        color:#fff;
        font-size:10.5px;
        line-height:1.45;
        text-align:center;
      }
      .location-map,
      .location-map-empty{
        width:calc(100% - 24px);
        height:158px;
        margin:0 12px;
        border:1px solid #dfc79b;
        border-radius:14px;
        overflow:hidden;
        background:
          radial-gradient(circle at 72% 34%,rgba(159,48,37,.12),transparent 23%),
          linear-gradient(135deg,#f4ead9,#fffaf0);
      }
      .location-map-empty{
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        text-align:center;
        color:#806f5f;
        font-size:13px;
        line-height:1.75;
      }
      .location-card-body{padding:13px 16px 16px;}
      .location-place{
        margin:0 0 8px;
        color:#342820;
        font-size:14px;
        line-height:1.65;
        font-weight:800;
      }
      .location-note{
        margin:0;
        color:#74685c;
        font-size:12.5px;
        line-height:1.72;
        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:4;
        overflow:hidden;
      }
      .location-detail-btn{
        width:100%;
        margin-top:11px;
        border:1px solid #d8bd86;
        border-radius:999px;
        background:#fff8e8;
        color:#6d3b24;
        padding:7px 10px;
        font:inherit;
        font-size:12.5px;
        font-weight:800;
        cursor:pointer;
      }
      .location-detail-btn:hover{
        color:#9f3025;
        background:#f5e8d2;
        border-color:rgba(159,48,37,.45);
      }
      .location-card-loading{
        padding:22px 16px;
        color:#806f5f;
        text-align:center;
        font-size:13px;
      }
      .location-modal-backdrop{
        position:fixed;
        inset:0;
        z-index:2300;
        display:none;
        align-items:center;
        justify-content:center;
        padding:28px 18px;
        background:rgba(24,18,14,.62);
        backdrop-filter:blur(5px);
      }
      .location-modal-backdrop.show{display:flex;}
      .location-modal{
        width:min(900px,94vw);
        max-height:88vh;
        overflow:hidden;
        display:grid;
        grid-template-rows:auto 1fr;
        border:1px solid rgba(226,205,168,.92);
        border-radius:24px;
        background:#fffaf1;
        box-shadow:0 28px 90px rgba(0,0,0,.36);
      }
      .location-modal-header{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        padding:18px 22px 14px;
        border-bottom:1px solid #ead9ba;
        background:#fff8ea;
      }
      .location-modal-header h2{
        margin:0;
        color:#9f3025;
        font-size:25px;
        line-height:1.4;
      }
      .location-modal-header p{
        margin:4px 0 0;
        color:#74685c;
        font-size:13px;
      }
      .location-modal-close{
        flex:0 0 auto;
        width:36px;
        height:36px;
        border:0;
        border-radius:999px;
        background:#2b2118;
        color:#fff;
        font-size:22px;
        cursor:pointer;
      }
      .location-modal-body{
        min-height:0;
        overflow:auto;
        padding:20px 22px 24px;
      }
      .location-modal-map,
      .location-modal-map-empty{
        width:100%;
        height:min(430px,50vh);
        min-height:300px;
        overflow:hidden;
        border:1px solid #d8bd86;
        border-radius:17px;
        background:#f4ead9;
      }
      .location-modal-map-empty{
        display:flex;
        align-items:center;
        justify-content:center;
        padding:30px;
        text-align:center;
        color:#806f5f;
        line-height:1.9;
      }
      .location-modal-meta{
        margin-top:17px;
        display:grid;
        grid-template-columns:92px 1fr;
        gap:9px 14px;
        color:#342820;
        font-size:14px;
        line-height:1.85;
      }
      .location-modal-term{
        color:#9f3025;
        font-weight:900;
      }
      .location-modal-note{
        margin:16px 0 0;
        padding-top:15px;
        border-top:1px solid #ead9c5;
        color:#5f5145;
        font-size:14px;
        line-height:1.95;
      }
      .location-marker{
        width:22px;
        height:22px;
        display:grid;
        place-items:center;
        border:3px solid rgba(255,255,255,.95);
        border-radius:50%;
        background:#9f3025;
        box-shadow:0 4px 13px rgba(76,34,26,.38);
      }
      .location-marker::after{
        content:"";
        width:5px;
        height:5px;
        border-radius:50%;
        background:#fff8e8;
      }
      .location-card .leaflet-control-attribution{
        font-size:8px!important;
        line-height:1.2!important;
      }
      @media(max-width:1180px){
        .left-rail{
          grid-column:1;
          grid-row:auto;
          position:relative;
          top:0;
          max-height:none;
          overflow:visible;
          padding-right:0;
        }
        .left-rail>.side{position:relative!important;top:0!important;}
        .location-map,.location-map-empty{height:230px;}
      }
      @media(max-width:640px){
        .location-modal-backdrop{padding:12px;}
        .location-modal-header{padding:15px 16px 12px;}
        .location-modal-header h2{font-size:21px;}
        .location-modal-body{padding:14px 14px 18px;}
        .location-modal-map,.location-modal-map-empty{height:42vh;min-height:250px;}
        .location-modal-meta{grid-template-columns:1fr;gap:3px;}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLeftRail(){
    const side=document.querySelector(".side");
    if(!side) return null;
    const existing=side.closest(".left-rail");
    if(existing) return existing;

    const rail=document.createElement("div");
    rail.className="left-rail";
    rail.setAttribute("aria-label","目录与地点信息");
    side.parentNode.insertBefore(rail,side);
    rail.appendChild(side);
    return rail;
  }

  function loadLeaflet(){
    if(window.L) return Promise.resolve(window.L);
    if(window.__BEITIE_LEAFLET_PROMISE__) return window.__BEITIE_LEAFLET_PROMISE__;

    window.__BEITIE_LEAFLET_PROMISE__=new Promise((resolve,reject)=>{
      if(!document.querySelector(`link[href="${LEAFLET_CSS}"]`)){
        const link=document.createElement("link");
        link.rel="stylesheet";
        link.href=LEAFLET_CSS;
        link.crossOrigin="";
        document.head.appendChild(link);
      }

      const existing=document.querySelector(`script[src="${LEAFLET_JS}"]`);
      if(existing){
        existing.addEventListener("load",()=>resolve(window.L),{once:true});
        existing.addEventListener("error",()=>reject(new Error("Leaflet 加载失败")),{once:true});
        return;
      }

      const script=document.createElement("script");
      script.src=LEAFLET_JS;
      script.crossOrigin="";
      script.addEventListener("load",()=>resolve(window.L),{once:true});
      script.addEventListener("error",()=>reject(new Error("Leaflet 加载失败")),{once:true});
      document.head.appendChild(script);
    });
    return window.__BEITIE_LEAFLET_PROMISE__;
  }

  function markerIcon(){
    return L.divIcon({
      className:"",
      html:'<span class="location-marker" aria-hidden="true"></span>',
      iconSize:[22,22],
      iconAnchor:[11,11]
    });
  }

  function buildLeafletMap(element,item,large=false){
    const lat=Number(item.latitude);
    const lng=Number(item.longitude);
    const map=L.map(element,{
      zoomControl:large,
      attributionControl:true,
      scrollWheelZoom:large,
      doubleClickZoom:true,
      dragging:true,
      boxZoom:false,
      keyboard:large
    }).setView([lat,lng],suggestedZoom(item)+(large?1:0));

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom:19,
      attribution:'&copy; OpenStreetMap'
    }).addTo(map);

    L.marker([lat,lng],{icon:markerIcon(),title:item.placeName||item.title||"地点"}).addTo(map);
    setTimeout(()=>map.invalidateSize(),80);
    return map;
  }

  function createModal(item,workTitle){
    const backdrop=document.createElement("div");
    backdrop.className="location-modal-backdrop";
    backdrop.setAttribute("role","dialog");
    backdrop.setAttribute("aria-modal","true");
    backdrop.setAttribute("aria-label",`${workTitle}地点信息`);
    backdrop.innerHTML=`
      <section class="location-modal">
        <header class="location-modal-header">
          <div>
            <h2>${esc(workTitle)} · 地点信息</h2>
            <p>${esc(item.locationType||"地点资料")}</p>
          </div>
          <button class="location-modal-close" type="button" aria-label="关闭">×</button>
        </header>
        <div class="location-modal-body">
          ${hasCoordinates(item)
            ? '<div class="location-modal-map" data-location-modal-map></div>'
            : `<div class="location-modal-map-empty">${esc(item.placeName||"该作品暂无统一地点坐标。")}</div>`}
          <div class="location-modal-meta">
            <div class="location-modal-term">地点性质</div>
            <div>${esc(item.locationType||"资料待补充")}</div>
            <div class="location-modal-term">地点位置</div>
            <div>${esc(item.placeName||"资料待补充")}</div>
          </div>
          <p class="location-modal-note">${esc(item.note||"地点说明待补充。")}</p>
        </div>
      </section>
    `;

    let modalMap=null;
    const close=()=>{
      backdrop.classList.remove("show");
      document.body.style.overflow="";
    };
    backdrop.querySelector(".location-modal-close").addEventListener("click",close);
    backdrop.addEventListener("click",event=>{if(event.target===backdrop) close();});
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&backdrop.classList.contains("show")) close();
    });

    document.body.appendChild(backdrop);

    return {
      open(){
        backdrop.classList.add("show");
        document.body.style.overflow="hidden";
        if(hasCoordinates(item)&&!modalMap){
          loadLeaflet()
            .then(()=>{modalMap=buildLeafletMap(backdrop.querySelector("[data-location-modal-map]"),item,true);})
            .catch(()=>{backdrop.querySelector("[data-location-modal-map]").outerHTML='<div class="location-modal-map-empty">地图暂时无法加载，地点文字说明仍可正常查看。</div>';});
        }else if(modalMap){
          setTimeout(()=>modalMap.invalidateSize(),80);
        }
      }
    };
  }

  function renderMissing(card,title){
    card.innerHTML=`
      <div class="location-card-head">
        <h2 class="location-card-title">地点地图</h2>
        <span class="location-type">资料待补</span>
      </div>
      <div class="location-map-empty">《${esc(title)}》的地点资料尚未录入，后续补充后将在此显示。</div>
      <div class="location-card-body">
        <p class="location-place">地点资料待补充</p>
        <p class="location-note">当前页面暂不显示推测坐标，避免将未经核实的位置作为确定地点对外展示。</p>
      </div>
    `;
  }

  function renderLocation(card,item,workTitle){
    const modal=createModal(item,workTitle);
    card.innerHTML=`
      <div class="location-card-head">
        <h2 class="location-card-title">地点地图</h2>
        <span class="location-type">${esc(item.locationType||"地点资料")}</span>
      </div>
      ${hasCoordinates(item)
        ? '<div class="location-map" data-location-small-map aria-label="地点地图"></div>'
        : `<div class="location-map-empty">${esc(item.placeName||"该作品暂无统一地点坐标。")}</div>`}
      <div class="location-card-body">
        <p class="location-place">${esc(item.placeName||"地点资料待补充")}</p>
        <p class="location-note">${esc(item.note||"地点说明待补充。")}</p>
        <button class="location-detail-btn" type="button">查看地点说明</button>
      </div>
    `;
    card.querySelector(".location-detail-btn").addEventListener("click",()=>modal.open());

    if(hasCoordinates(item)){
      loadLeaflet()
        .then(()=>buildLeafletMap(card.querySelector("[data-location-small-map]"),item,false))
        .catch(()=>{
          const mapEl=card.querySelector("[data-location-small-map]");
          if(mapEl) mapEl.outerHTML='<div class="location-map-empty">地图暂时无法加载，地点文字说明仍可正常查看。</div>';
        });
    }
  }

  async function init(){
    if(!document.querySelector(".detail-grid")||!document.querySelector(".side")) return;
    ensureStyle();
    const rail=ensureLeftRail();
    if(!rail) return;

    let card=rail.querySelector(".location-card");
    if(!card){
      card=document.createElement("section");
      card.className="location-card";
      card.setAttribute("aria-label","碑帖地点地图");
      card.innerHTML='<div class="location-card-loading">正在读取地点资料……</div>';
      rail.appendChild(card);
    }

    try{
      const [locationResponse,catalogResponse]=await Promise.all([
        fetch(LOCATION_URL,{cache:"no-store"}),
        fetch(CATALOG_URL,{cache:"no-store"})
      ]);
      if(!locationResponse.ok) throw new Error(`${LOCATION_URL} ${locationResponse.status}`);
      const locationData=await locationResponse.json();
      const catalog=catalogResponse.ok?await catalogResponse.json():[];

      const catalogItem=(Array.isArray(catalog)?catalog:[]).find(item=>String(item.id||"").padStart(3,"0")===parentId);
      const fallbackTitle=document.querySelector(".info-panel h1")?.textContent||"碑帖详情";
      const workTitle=String(catalogItem?.title||fallbackTitle).split(" · ")[0].trim();

      const items=Array.isArray(locationData?.items)?locationData.items:[];
      const index=new Map(items.map(item=>[normalizeTitle(item.title),item]));
      const locationItem=index.get(normalizeTitle(workTitle));

      if(!locationItem){
        renderMissing(card,workTitle);
        return;
      }
      renderLocation(card,locationItem,workTitle);
    }catch(error){
      console.warn("[beitie-location-map] load failed",error);
      renderMissing(card,document.querySelector(".info-panel h1")?.textContent||"当前碑帖");
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }
})();
