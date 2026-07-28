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
      .card-rail{
        scroll-snap-type:none !important;
      }
      .card-rail .reading-card{
        scroll-snap-align:none !important;
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

  function railGap(rail){
    const style = getComputedStyle(rail);
    const value = Number.parseFloat(style.columnGap || style.gap || "0");
    return Number.isFinite(value) ? value : 0;
  }

  function balancedLayout(rail){
    const cards = railCards(rail);
    const cardWidth = cards[0]?.getBoundingClientRect().width || 230;
    const gap = railGap(rail);
    const railWidth = rail.clientWidth;
    const minimumPeek = Math.max(30,Math.min(42,cardWidth*.18));
    let fullCount = Math.floor((railWidth - 2*minimumPeek - gap)/(cardWidth + gap));
    fullCount = Math.max(1,Math.min(cards.length,fullCount));
    let peek = (railWidth - fullCount*cardWidth - (fullCount+1)*gap)/2;
    while(fullCount>1 && peek<minimumPeek){
      fullCount -= 1;
      peek = (railWidth - fullCount*cardWidth - (fullCount+1)*gap)/2;
    }
    return {cards,cardWidth,gap,fullCount,peek:Math.max(0,peek)};
  }

  function cardContentLeft(rail,card){
    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return rail.scrollLeft + cardRect.left - railRect.left;
  }

  function firstFullyVisibleIndex(rail){
    const cards = railCards(rail);
    const railRect = rail.getBoundingClientRect();
    const index = cards.findIndex(card=>{
      const rect = card.getBoundingClientRect();
      return rect.left >= railRect.left-1 && rect.right <= railRect.right+1;
    });
    if(index>=0) return index;
    return cards.findIndex(card=>card.getBoundingClientRect().right>railRect.left+1);
  }

  function canHoverScroll(rail){
    return performance.now() >= (hoverLocks.get(rail) || 0);
  }

  function smoothScrollTo(rail,target){
    const max = Math.max(0,rail.scrollWidth-rail.clientWidth);
    const clamped = Math.max(0,Math.min(max,target));
    if(Math.abs(clamped-rail.scrollLeft) <= 1) return false;
    hoverLocks.set(rail,performance.now()+520);
    rail.scrollTo({left:clamped,behavior:"smooth"});
    return true;
  }

  function snapToFirstFull(rail,index){
    const layout = balancedLayout(rail);
    if(!layout.cards.length) return false;
    const lastPossible = Math.max(0,layout.cards.length-layout.fullCount);
    const firstFullIndex = Math.max(0,Math.min(lastPossible,index));
    const card = layout.cards[firstFullIndex];
    const inset = firstFullIndex>0 ? layout.peek+layout.gap : 0;
    const target = cardContentLeft(rail,card)-inset;
    return smoothScrollTo(rail,target);
  }

  function revealCard(rail,card){
    if(!canHoverScroll(rail)) return;
    const layout = balancedLayout(rail);
    const index = layout.cards.indexOf(card);
    if(index<0) return;

    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const clippedLeft = cardRect.left < railRect.left+2;
    const clippedRight = cardRect.right > railRect.right-2;

    if(clippedLeft){
      snapToFirstFull(rail,index);
      return;
    }

    if(clippedRight){
      snapToFirstFull(rail,index-layout.fullCount+1);
      return;
    }

    const firstFullIndex = firstFullyVisibleIndex(rail);
    if(rail.scrollLeft>1 && index===firstFullIndex){
      snapToFirstFull(rail,index-1);
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
        if(!canHoverScroll(rail) || rail.scrollLeft<=1) return;
        const firstFullIndex = firstFullyVisibleIndex(rail);
        snapToFirstFull(rail,Math.max(0,firstFullIndex-1));
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
