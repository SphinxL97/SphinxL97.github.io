(function(){
  "use strict";

  if(window.__BEITIE_CATALOG_UI_POLISH__) return;
  window.__BEITIE_CATALOG_UI_POLISH__ = true;

  const root = document.documentElement;
  const initializedRails = new WeakSet();

  function addStyle(){
    if(document.getElementById("catalog-ui-polish-style")) return;
    const style = document.createElement("style");
    style.id = "catalog-ui-polish-style";
    style.textContent = `
      html.catalog-ui-pending #galleryGrid,
      html.catalog-ui-pending #readingGroups,
      html.catalog-ui-pending #categoryStrip{
        visibility:hidden !important;
      }
      #galleryGrid .card-info,
      .reading-card .reading-card-info{
        text-align:center;
      }
      #galleryGrid .card-info h3,
      .reading-card .reading-card-info h4{
        width:100%;
        text-align:center;
      }
      #galleryGrid .meta.card-attribution,
      .reading-card .card-meta.card-attribution{
        width:100%;
        justify-content:center;
        text-align:center;
      }
      #galleryGrid .card-attribution .writer-relation,
      .reading-card .card-attribution .writer-relation{
        text-align:center;
      }
    `;
    document.head.appendChild(style);
  }

  function reorderCategoryStrip(){
    const strip = document.getElementById("categoryStrip");
    if(!strip) return false;
    const scriptButton = strip.querySelector('[data-category="script"]');
    const typeButton = strip.querySelector('[data-category="type"]');
    if(!scriptButton || !typeButton) return false;
    if(strip.firstElementChild !== scriptButton) strip.insertBefore(scriptButton,typeButton);
    return true;
  }

  function revealCard(rail,card){
    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const margin = 10;
    let target = rail.scrollLeft;

    if(cardRect.left < railRect.left + margin){
      target -= railRect.left + margin - cardRect.left;
    }else if(cardRect.right > railRect.right - margin){
      target += cardRect.right - (railRect.right - margin);
    }

    const max = Math.max(0,rail.scrollWidth-rail.clientWidth);
    target = Math.max(0,Math.min(max,target));
    if(Math.abs(target-rail.scrollLeft)>1){
      rail.scrollTo({left:target,behavior:"smooth"});
    }
  }

  function initializeRail(rail){
    if(initializedRails.has(rail)) return;
    initializedRails.add(rail);
    rail.scrollLeft = 0;

    rail.addEventListener("mouseover",event=>{
      const card = event.target.closest(".reading-card");
      if(!card || !rail.contains(card)) return;
      if(event.relatedTarget && card.contains(event.relatedTarget)) return;
      revealCard(rail,card);
    });
  }

  function initializeRails(){
    document.querySelectorAll(".card-rail").forEach(initializeRail);
  }

  function cardsReady(hostSelector,cardSelector){
    const host = document.querySelector(hostSelector);
    if(!host) return true;
    const cards = Array.from(host.querySelectorAll(cardSelector));
    if(!cards.length) return false;
    return cards.every(card=>card.querySelector(".card-attribution"));
  }

  function revealWhenReady(){
    const galleryReady = cardsReady("#galleryGrid",".beitie-card");
    const readingHost = document.getElementById("readingGroups");
    const readingReady = !readingHost || (cardsReady("#readingGroups",".reading-card") && reorderCategoryStrip());
    if(galleryReady && readingReady){
      root.classList.remove("catalog-ui-pending");
      return true;
    }
    return false;
  }

  function refresh(){
    reorderCategoryStrip();
    initializeRails();
    revealWhenReady();
  }

  function init(){
    addStyle();
    refresh();
    const targets = [
      document.getElementById("galleryGrid"),
      document.getElementById("readingGroups"),
      document.getElementById("categoryStrip")
    ].filter(Boolean);
    targets.forEach(target=>new MutationObserver(refresh).observe(target,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["class","data-compact-catalog-meta"]
    }));
    window.addEventListener("load",refresh,{once:true});
    setTimeout(()=>root.classList.remove("catalog-ui-pending"),5000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
