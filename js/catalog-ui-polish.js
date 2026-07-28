(function(){
  "use strict";

  if(window.__BEITIE_CATALOG_UI_POLISH__) return;
  window.__BEITIE_CATALOG_UI_POLISH__ = true;

  const root = document.documentElement;
  const initializedRails = new WeakSet();
  const hoverLocks = new WeakMap();

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

  function railCards(rail){
    return Array.from(rail.children).filter(item=>item.classList?.contains("reading-card"));
  }

  function firstFullyVisibleCard(rail,margin=10){
    const railRect = rail.getBoundingClientRect();
    return railCards(rail).find(item=>{
      const rect = item.getBoundingClientRect();
      return rect.left >= railRect.left + margin - 1 && rect.right <= railRect.right - margin + 1;
    }) || null;
  }

  function canHoverScroll(rail){
    return performance.now() >= (hoverLocks.get(rail) || 0);
  }

  function smoothScrollTo(rail,target){
    const max = Math.max(0,rail.scrollWidth-rail.clientWidth);
    const clamped = Math.max(0,Math.min(max,target));
    if(Math.abs(clamped-rail.scrollLeft) <= 1) return false;
    hoverLocks.set(rail,performance.now()+480);
    rail.scrollTo({left:clamped,behavior:"smooth"});
    return true;
  }

  function scrollToPreviousCard(rail,card){
    if(rail.scrollLeft <= 1) return false;
    const cards = railCards(rail);
    const index = cards.indexOf(card);
    if(index <= 0) return smoothScrollTo(rail,0);

    const railRect = rail.getBoundingClientRect();
    const previousRect = cards[index-1].getBoundingClientRect();
    const target = rail.scrollLeft + previousRect.left - railRect.left - 10;
    return smoothScrollTo(rail,target);
  }

  function revealCard(rail,card){
    if(!canHoverScroll(rail)) return;

    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const margin = 10;
    let target = rail.scrollLeft;

    if(cardRect.left < railRect.left + margin){
      target -= railRect.left + margin - cardRect.left;
      smoothScrollTo(rail,target);
      return;
    }

    if(cardRect.right > railRect.right - margin){
      target += cardRect.right - (railRect.right - margin);
      smoothScrollTo(rail,target);
      return;
    }

    if(rail.scrollLeft > 1 && cardRect.left <= railRect.left + 38){
      const firstFull = firstFullyVisibleCard(rail,margin);
      if(card === firstFull) scrollToPreviousCard(rail,card);
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

    const previousArrow = rail.closest(".rail-wrap")?.querySelector(".rail-arrow.prev");
    if(previousArrow){
      previousArrow.addEventListener("mouseenter",()=>{
        if(!canHoverScroll(rail) || rail.scrollLeft <= 1) return;
        const firstFull = firstFullyVisibleCard(rail,10);
        if(firstFull) scrollToPreviousCard(rail,firstFull);
        else smoothScrollTo(rail,Math.max(0,rail.scrollLeft-Math.max(260,rail.clientWidth*.25)));
      });
    }
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
