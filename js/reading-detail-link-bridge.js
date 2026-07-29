(function(){
  "use strict";

  const root = document.getElementById("readingGroups");
  if(!root) return;

  function rewriteLinks(){
    root.querySelectorAll("a.reading-card").forEach(card=>{
      const id = String(card.querySelector(".card-id")?.textContent || "").trim().padStart(3,"0");
      if(!/^\d{3}$/.test(id)) return;
      card.href = `reading-detail.html?id=${encodeURIComponent(id)}`;
      const title = card.querySelector("h4")?.textContent?.trim() || "碑帖";
      card.title = `进入《${title}》碑帖赏读`;
    });
  }

  const observer = new MutationObserver(rewriteLinks);
  observer.observe(root,{childList:true,subtree:true});
  rewriteLinks();
})();
